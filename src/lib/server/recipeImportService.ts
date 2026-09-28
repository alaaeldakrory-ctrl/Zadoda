// Reads a recipe (and a photo of the dish) from a link, pasted text or a web search.
// Used by /api/ai/recipe; kept separate so it can be tested without a signed-in request.

import { FetchError, fetchImageDataUrl, fetchPageHtml } from '@/lib/server/fetchPublic';
import {
  AIRecipe, findRecipePages, recipeFromPageText, recipeFromText, recipeFromUrlContext, recipeFromYouTube,
} from '@/lib/server/gemini';
import { findPageImage, getYouTubeId, htmlToText, parseRecipePage } from '@/lib/recipeImport';

export interface RecipeImportResponse {
  recipe: AIRecipe;
  /** data: URL of the dish photo, when the source has one. */
  photo?: string;
  /** The page the recipe came from (after redirects), for the recipe's link. */
  sourceUrl?: string;
  /** How the recipe was read, for the message shown to the user. */
  method: 'page-data' | 'ai-page' | 'ai-video' | 'ai-url' | 'ai-text';
}

async function youtubeThumbnail(id: string): Promise<string | undefined> {
  // maxres isn't generated for every video; hq always is.
  return (await fetchImageDataUrl(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`))
    ?? (await fetchImageDataUrl(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`))
    ?? undefined;
}

interface UrlOptions {
  /** Let Gemini read pages that block our server. Slow (15–60 s), so searches only use it as a last resort. */
  readBlockedPages?: boolean;
}

export async function importFromUrl(url: string, { readBlockedPages = true }: UrlOptions = {}): Promise<RecipeImportResponse | null> {
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    const [recipe, photo] = await Promise.all([
      recipeFromYouTube(`https://www.youtube.com/watch?v=${youtubeId}`),
      youtubeThumbnail(youtubeId),
    ]);
    return recipe ? { recipe: { ...recipe, youtubeId }, photo, sourceUrl: url, method: 'ai-video' } : null;
  }

  let page: { html: string; url: string } | null = null;
  try {
    page = await fetchPageHtml(url);
  } catch (err) {
    // Blocked by the site (403 etc.): let Gemini read it from Google's side instead.
    if (!(err instanceof FetchError)) throw err;
  }

  if (!page) {
    if (!readBlockedPages) return null;
    const recipe = await recipeFromUrlContext(url);
    if (!recipe) return null;
    // The photo address comes from Gemini's reading of the page; the image host may still refuse us.
    const photo = recipe.imageUrl ? await fetchImageDataUrl(recipe.imageUrl) : null;
    return { recipe, photo: photo ?? undefined, sourceUrl: url, method: 'ai-url' };
  }

  const structured = parseRecipePage(page.html);
  const photoUrl = structured?.imageUrl ?? findPageImage(page.html, page.url);
  const photoPromise = photoUrl ? fetchImageDataUrl(photoUrl) : Promise.resolve(null);

  // Most recipe sites publish the recipe as structured data: exact, instant, no AI needed.
  if (structured && structured.ingredients.length > 0) {
    return { recipe: structured, photo: (await photoPromise) ?? undefined, sourceUrl: page.url, method: 'page-data' };
  }

  const [recipe, photo] = await Promise.all([recipeFromPageText(htmlToText(page.html), page.url), photoPromise]);
  return recipe ? { recipe, photo: photo ?? undefined, sourceUrl: page.url, method: 'ai-page' } : null;
}

export async function importFromText(text: string): Promise<RecipeImportResponse | null> {
  const recipe = await recipeFromText(text);
  return recipe ? { recipe, method: 'ai-text' } : null;
}

// Pork and alcohol. Turkey/beef bacon and alcohol-free extracts are fine.
const NOT_HALAL = /\b(pork|ham|prosciutto|pancetta|chorizo|salami|pepperoni|lard|gelatin|wine|beer|ale|rum|brandy|cognac|bourbon|whiske?y|vodka|gin|tequila|sherry|sake|mirin|liqueur|kahlua|marsala)\b|(?<!(turkey|beef|chicken) )\bbacon\b/i;

export function nonHalalIngredient(recipe: AIRecipe): string | undefined {
  return recipe.ingredients.find(i => NOT_HALAL.test(i.name) && !/non-?alcoholic|alcohol-free|halal/i.test(i.name))?.name;
}

const isGood = (r: AIRecipe | null | undefined): r is AIRecipe =>
  !!r && r.ingredients.length >= 3 && !nonHalalIngredient(r);

/**
 * Searches the web for the dish and imports the best good, halal recipe page.
 * All result pages are opened at once; the highest-ranked one with recipe data wins.
 */
export async function importFromSearch(dish: string): Promise<RecipeImportResponse | null> {
  const results = await findRecipePages(dish);
  const pages = await Promise.all(results.map(async url => {
    try {
      return { ok: true as const, ...(await fetchPageHtml(url)) };
    } catch (err) {
      return { ok: false as const, url: (err instanceof FetchError && err.url) || url };
    }
  }));

  // 1. Pages with published recipe data: exact and instant.
  for (const page of pages) {
    if (!page.ok) continue;
    const recipe = parseRecipePage(page.html);
    if (!isGood(recipe)) continue;
    const photoUrl = recipe.imageUrl ?? findPageImage(page.html, page.url);
    const photo = photoUrl ? await fetchImageDataUrl(photoUrl) : null;
    return { recipe, photo: photo ?? undefined, sourceUrl: page.url, method: 'page-data' };
  }

  // 2. Readable pages without recipe data: Gemini reads the best two.
  for (const page of pages.filter(p => p.ok).slice(0, 2)) {
    if (!page.ok) continue;
    const recipe = await recipeFromPageText(htmlToText(page.html), page.url).catch(() => null);
    if (!isGood(recipe)) continue;
    const photoUrl = findPageImage(page.html, page.url);
    const photo = photoUrl ? await fetchImageDataUrl(photoUrl) : null;
    return { recipe, photo: photo ?? undefined, sourceUrl: page.url, method: 'ai-page' };
  }

  // 3. Every page blocked our server: have Gemini read the top result from Google's side.
  const blocked = pages.find(p => !p.ok);
  if (blocked) {
    const result = await importFromUrl(blocked.url).catch(() => null);
    if (result && isGood(result.recipe)) return result;
  }
  return null;
}
