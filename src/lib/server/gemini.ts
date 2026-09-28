// Server-side Gemini calls. The API key is read from the server environment and never sent to the browser.

import type { ImportedRecipe } from '@/lib/recipeImport';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
// Newest first. When a model is overloaded or retired for this key, the next one is tried.
const TEXT_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.7-flash'];
const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image'];
// Google Search grounding is free on the 2.5 models; the 3.x ones need billing for it.
const SEARCH_MODELS = ['gemini-2.5-flash-lite'];

type Part =
  | { text: string }
  | { fileData: { fileUri: string; mimeType?: string } };

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('AI is not configured');
  return key;
}

// Busy (429/500/503), not available to this key (404) or a setting that model doesn't support (400):
// worth trying the next model.
const RETRYABLE = new Set([400, 404, 429, 500, 503]);

/**
 * Hedged request: asks the first model, and if it hasn't answered after hedgeMs (or fails),
 * also asks the next one. The first good answer wins and the others are cancelled.
 * Model speed varies a lot hour to hour (one can hang while another answers in seconds),
 * so this keeps imports quick without paying for parallel calls when things are healthy.
 */
async function generate(models: string[], body: object, hedgeMs = 15_000, budgetMs = 100_000): Promise<any> {
  const deadline = Date.now() + budgetMs;
  try {
    return await generateOnce(models, body, hedgeMs, budgetMs);
  } catch (err) {
    // Every model busy at once usually clears after a short pause; retry if there's time left.
    const remaining = deadline - Date.now();
    if (remaining < 20_000) throw err;
    await new Promise(r => setTimeout(r, 3_000));
    return generateOnce(models, body, hedgeMs, remaining - 3_000);
  }
}

async function generateOnce(models: string[], body: object, hedgeMs: number, budgetMs: number): Promise<any> {
  const controllers: AbortController[] = [];
  const deadline = setTimeout(() => controllers.forEach(c => c.abort()), budgetMs);
  let lastError = 'AI unavailable';

  try {
    return await new Promise<any>((resolve, reject) => {
      let next = 0;
      let running = 0;
      let done = false;
      let hedgeTimer: ReturnType<typeof setTimeout> | undefined;

      const finish = (fn: () => void) => {
        if (done) return;
        done = true;
        clearTimeout(hedgeTimer);
        controllers.forEach(c => c.abort());
        fn();
      };

      const launch = () => {
        if (done || next >= models.length) return;
        const model = models[next++];
        const controller = new AbortController();
        controllers.push(controller);
        running++;
        clearTimeout(hedgeTimer);
        hedgeTimer = setTimeout(launch, hedgeMs);

        fetch(`${API}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey() },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
          .then(async res => {
            if (res.ok) {
              const data = await res.json();
              finish(() => resolve(data));
              return;
            }
            const detail = await res.text().catch(() => '');
            lastError = `Gemini error ${res.status} (${model}): ${detail.slice(0, 200)}`;
            if (!RETRYABLE.has(res.status)) finish(() => reject(new Error(lastError)));
          })
          .catch(err => {
            lastError = `Gemini ${model} did not answer: ${err instanceof Error ? err.name : err}`;
          })
          .finally(() => {
            running--;
            if (done) return;
            if (next < models.length) launch(); // this one failed: bring in the next straight away
            else if (running === 0) finish(() => reject(new Error(lastError)));
          });
      };

      launch();
    });
  } finally {
    clearTimeout(deadline);
  }
}

function responseText(data: any): string {
  return (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
}

// ── Recipe extraction ────────────────────────────────────────────────────────

export interface AIRecipe extends ImportedRecipe {
  emoji?: string;
}

const RECIPE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isRecipe: { type: 'BOOLEAN' },
    name: { type: 'STRING' },
    emoji: { type: 'STRING' },
    prepTimeMinutes: { type: 'INTEGER' },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'STRING' },
          unit: { type: 'STRING' },
        },
        required: ['name', 'quantity', 'unit'],
      },
    },
    steps: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['isRecipe', 'name', 'emoji', 'ingredients', 'steps'],
};

const RULES = `Return the recipe as JSON:
- isRecipe: false if there is no recipe here (then leave the other fields empty).
- name: the dish name, short.
- emoji: one food emoji that fits the dish.
- prepTimeMinutes: total time in minutes if stated or clearly shown, otherwise 0.
- ingredients: every ingredient with its amount exactly as given. quantity is a plain decimal number as text
  ("0.5", not "1/2"; "" if no amount). unit is short (cup, tbsp, tsp, g, kg, ml, l, oz, lb, clove, can, piece, pinch)
  or "" if none. name is the ingredient with any preparation note, e.g. "onion, finely chopped".
- steps: the method as short, clear steps in order.
Only use what the source says or shows. Do not invent ingredients, amounts or steps; leave amounts empty rather than guess.
Keep the source's language.`;

function toRecipe(json: any): AIRecipe | null {
  if (!json || json.isRecipe === false || !json.name) return null;
  return {
    name: String(json.name).trim(),
    emoji: typeof json.emoji === 'string' ? json.emoji.trim().slice(0, 4) : undefined,
    prepTime: json.prepTimeMinutes > 0 ? Math.round(json.prepTimeMinutes) : undefined,
    ingredients: (json.ingredients ?? [])
      .filter((i: any) => i?.name?.trim())
      .map((i: any) => ({ name: String(i.name).trim(), quantity: String(i.quantity ?? '').trim(), unit: String(i.unit ?? '').trim() })),
    steps: (json.steps ?? []).map((s: unknown) => String(s).trim()).filter(Boolean),
    imageUrl: typeof json.imageUrl === 'string' && /^https?:\/\//.test(json.imageUrl) ? json.imageUrl : undefined,
  };
}

async function extract(parts: Part[], extra: object = {}, hedgeMs?: number): Promise<AIRecipe | null> {
  const data = await generate(TEXT_MODELS, {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 16384,
      // Extraction needs little reasoning; low thinking is several times faster.
      thinkingConfig: { thinkingLevel: 'low' },
      responseMimeType: 'application/json',
      responseSchema: RECIPE_SCHEMA,
      ...extra,
    },
  }, hedgeMs);
  try {
    return toRecipe(JSON.parse(responseText(data)));
  } catch {
    return null;
  }
}

/** Pasted text (a message, a note, a copied page) → recipe. */
export function recipeFromText(text: string): Promise<AIRecipe | null> {
  return extract([{ text: `Extract the recipe from this text.\n${RULES}\n\nTEXT:\n${text}` }]);
}

/** Readable text of a web page → recipe. */
export function recipeFromPageText(pageText: string, url: string): Promise<AIRecipe | null> {
  return extract([{ text: `Extract the main recipe from this web page (${url}). Ignore comments, ads and other recipes.\n${RULES}\n\nPAGE:\n${pageText}` }]);
}

/** YouTube video → recipe. Gemini watches the video itself, so this works even when YouTube blocks our server. */
export function recipeFromYouTube(videoUrl: string): Promise<AIRecipe | null> {
  return extract(
    [
      { fileData: { fileUri: videoUrl } },
      { text: `Watch this cooking video and extract the recipe from what is said, shown on screen and written in the description.\n${RULES}` },
    ],
    // Low video resolution is plenty for reading a recipe and costs far less.
    { mediaResolution: 'MEDIA_RESOLUTION_LOW' },
    // Watching a video takes a bit longer than reading text before it's worth asking another model.
    20_000
  );
}

/** For pages our server can't fetch (bot protection): Gemini reads the URL from Google's side. */
export async function recipeFromUrlContext(url: string): Promise<AIRecipe | null> {
  // Structured output can't be combined with tools, so ask for JSON in plain text.
  const data = await generate(TEXT_MODELS, {
    contents: [{ parts: [{ text: `Read the recipe at ${url} and extract it.\n${RULES}\nAlso give imageUrl: the full URL of the page's main photo of the finished dish, or \"\" if none.
Reply with only the JSON object, fields: isRecipe, name, emoji, prepTimeMinutes, ingredients [{name, quantity, unit}], steps, imageUrl.` }] }],
    tools: [{ url_context: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 16384, thinkingConfig: { thinkingLevel: 'low' } },
  });
  const text = responseText(data);
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try {
    return toRecipe(JSON.parse(json));
  } catch {
    return null;
  }
}

// ── Finding recipes online ───────────────────────────────────────────────────

// Not recipe pages. (Google's grounding redirect links live on a google.com subdomain, so only
// the search site itself is skipped.)
const SKIP_SITES = /(^|\.)(youtube\.com|youtu\.be|pinterest\.[a-z.]+|instagram\.com|tiktok\.com|facebook\.com|reddit\.com)$|^(www\.)?google\.[a-z.]+$/i;

const URL_IN_TEXT = /https?:\/\/[^\s)"'\]]+/g;

/**
 * Web pages likely to hold a good recipe for the dish, best first (Gemini with Google Search).
 * Google's own search results (grounding sources) are used first: they are real pages, reached
 * through a redirect link. Addresses Gemini writes out itself are often slightly wrong, so they
 * are only a fallback.
 */
export async function findRecipePages(dish: string): Promise<string[]> {
  const prompt =
    `Search Google for a "${dish}" recipe and list the recipe pages you found. ` +
    'Prefer well-known recipe websites with ingredient amounts and step-by-step instructions, ' +
    'and halal recipes (no pork, no alcohol). Skip YouTube, Pinterest, Instagram, TikTok, Facebook and Reddit.';
  const data = await generate(SEARCH_MODELS, {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 1500 },
  });

  const urls: string[] = [];
  for (const chunk of data?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []) {
    const uri = chunk?.web?.uri;
    const site = String(chunk?.web?.title ?? '');
    // The redirect link hides the site, but the chunk title names it.
    if (typeof uri === 'string' && !SKIP_SITES.test(site)) urls.push(uri);
  }
  if (urls.length === 0) urls.push(...(responseText(data).match(URL_IN_TEXT) ?? []));

  const seen = new Set<string>();
  return urls.filter(u => {
    try {
      const url = new URL(u);
      if (!/^https?:$/.test(url.protocol) || SKIP_SITES.test(url.hostname) || seen.has(url.href)) return false;
      seen.add(url.href);
      return true;
    } catch {
      return false;
    }
  }).slice(0, 8);
}

// ── Dish photos ──────────────────────────────────────────────────────────────

/** Creates a realistic photo of the dish; returns a data: URL, or null if no image came back. */
export async function generateDishPhoto(name: string, ingredientNames: string[]): Promise<string | null> {
  const main = ingredientNames.slice(0, 8).join(', ');
  const prompt =
    `A realistic, appetizing food photograph of "${name}"${main ? `, made with ${main}` : ''}. ` +
    'Home-cooked and freshly served on a plate or bowl on a kitchen table, natural daylight, ' +
    'slightly overhead angle, shallow depth of field. No text, no labels, no people or hands.';
  const data = await generate(IMAGE_MODELS, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '4:3' } },
  });
  for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) return `data:${inline.mimeType ?? inline.mime_type ?? 'image/png'};base64,${inline.data}`;
  }
  return null;
}
