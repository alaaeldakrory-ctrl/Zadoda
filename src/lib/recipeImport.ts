// Turns a recipe web page or YouTube video into recipe fields.
// Pure parsing only — fetching happens in the /api/recipe-import route.

export interface ImportedIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface ImportedRecipe {
  name: string;
  prepTime?: number;
  ingredients: ImportedIngredient[];
  steps: string[];
  /** Set when the link is a YouTube video. */
  youtubeId?: string;
  /** Photo of the dish from the source page, if it has one. */
  imageUrl?: string;
}

/** Tidies a typed or pasted link ("www.site.com/x" → "https://www.site.com/x"); null if it isn't a web link. */
export function normalizeUrl(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// ── YouTube ──────────────────────────────────────────────────────────────────

export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m|music)\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch { /* not a URL */ }
  return null;
}

const INGREDIENT_HEADING = /^\W*ingredients?\b/i;
// ── Recipe websites (schema.org JSON-LD) ─────────────────────────────────────

/** Most recipe sites embed a schema.org Recipe in JSON-LD; returns null when there isn't one. */
export function parseRecipePage(html: string): ImportedRecipe | null {
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, body] of blocks) {
    let data: unknown;
    try { data = JSON.parse(body.trim()); } catch { continue; }
    const recipe = findRecipeNode(data);
    if (recipe) return fromSchemaRecipe(recipe);
  }
  return null;
}

type Json = Record<string, unknown>;

function findRecipeNode(node: unknown): Json | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== 'object') return null;
  const obj = node as Json;
  const type = obj['@type'];
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return obj;
  if (obj['@graph']) return findRecipeNode(obj['@graph']);
  return null;
}

function fromSchemaRecipe(r: Json): ImportedRecipe {
  const ingredients = asArray(r.recipeIngredient ?? r.ingredients)
    .filter((s): s is string => typeof s === 'string')
    .map(s => parseIngredientLine(cleanText(s)))
    .filter(i => i.name);

  const minutes = parseDuration(r.totalTime) ?? sumDefined(parseDuration(r.prepTime), parseDuration(r.cookTime));

  return {
    name: cleanText(String(r.name ?? '')),
    prepTime: minutes,
    ingredients,
    steps: flattenInstructions(r.recipeInstructions),
    imageUrl: firstImageUrl(r.image),
  };
}

// schema.org "image" can be a URL, an ImageObject, or a list of either (usually largest last or first).
function firstImageUrl(node: unknown): string | undefined {
  for (const item of asArray(node)) {
    if (typeof item === 'string' && /^https?:\/\//.test(item)) return item;
    if (item && typeof item === 'object') {
      const url = (item as Json).url ?? (item as Json).contentUrl;
      if (typeof url === 'string' && /^https?:\/\//.test(url)) return url;
    }
  }
  return undefined;
}

/** The page's share image (og:image / twitter:image), usually a photo of the dish on recipe pages. */
export function findPageImage(html: string, pageUrl: string): string | undefined {
  const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i);
  const content = m?.[0].match(/content=["']([^"']+)["']/i)?.[1];
  if (!content) return undefined;
  try {
    return new URL(decodeEntities(content), pageUrl).toString();
  } catch {
    return undefined;
  }
}

/** Readable text of a page for the AI: scripts, styles and markup removed, capped in length. */
export function htmlToText(html: string, maxChars = 40_000): string {
  const body = html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h\d|tr|br)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(body)
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, maxChars);
}

function flattenInstructions(node: unknown): string[] {
  if (!node) return [];
  if (typeof node === 'string') {
    // Some sites put every step in one string, separated by newlines or <li>/<p> tags.
    return node.split(/\n+|<\/(?:li|p)>/i).map(cleanText).filter(Boolean);
  }
  if (Array.isArray(node)) return node.flatMap(flattenInstructions);
  if (typeof node === 'object') {
    const obj = node as Json;
    if (obj.itemListElement) return flattenInstructions(obj.itemListElement); // HowToSection
    const text = obj.text ?? obj.name;
    return typeof text === 'string' ? [cleanText(text)].filter(Boolean) : [];
  }
  return [];
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function sumDefined(a?: number, b?: number): number | undefined {
  return a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0);
}

/** ISO 8601 duration ("PT1H15M") to minutes. */
export function parseDuration(v: unknown): number | undefined {
  if (typeof v !== 'string') return undefined;
  const m = v.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return undefined;
  const total = (+(m[1] ?? 0)) * 1440 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
  return total > 0 ? total : undefined;
}

// ── Ingredient lines ─────────────────────────────────────────────────────────

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅕': 0.2, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

const UNITS: Record<string, string> = {
  cup: 'cup', cups: 'cups', c: 'cup',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbs: 'tbsp', tbl: 'tbsp', T: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', t: 'tsp',
  gram: 'g', grams: 'g', g: 'g', gr: 'g', kilogram: 'kg', kilograms: 'kg', kg: 'kg',
  ounce: 'oz', ounces: 'oz', oz: 'oz', pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml', ml: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l', l: 'l',
  clove: 'clove', cloves: 'cloves', slice: 'slice', slices: 'slices', piece: 'piece', pieces: 'pieces',
  can: 'can', cans: 'cans', package: 'package', packages: 'packages', pinch: 'pinch', bunch: 'bunch',
  stalk: 'stalk', stalks: 'stalks', sprig: 'sprig', sprigs: 'sprigs', handful: 'handful',
};

/** "1 ½ cups plain flour, sifted" → { quantity: "1.5", unit: "cups", name: "plain flour, sifted" } */
export function parseIngredientLine(line: string): ImportedIngredient {
  let rest = line.trim();
  for (const [ch, val] of Object.entries(UNICODE_FRACTIONS)) {
    rest = rest.replace(new RegExp(`(\\d)?\\s*${ch}`), (_, whole) => ` ${(whole ? +whole : 0) + val} `).trim();
  }

  let quantity = '';
  const qty = rest.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)(?:\s*(?:-|to|–)\s*(\d+(?:[.,]\d+)?))?/);
  if (qty) {
    // For ranges like "2-3", buy the larger amount.
    quantity = formatQty(toNumber(qty[2] ?? qty[1]));
    // Drop separators some lists put after the amount: "1 - cup rice", "2 x eggs".
    rest = rest.slice(qty[0].length).trim().replace(/^(?:[-–:]|x\s)\s*/i, '');
  }

  // "1 (14 oz) can chickpeas": move the size note to the end so the unit can be read.
  let note = '';
  const paren = rest.match(/^\(([^)]*)\)\s*/);
  if (quantity && paren) {
    note = ` (${paren[1]})`;
    rest = rest.slice(paren[0].length);
  }

  let unit = '';
  const unitMatch = rest.match(/^([A-Za-z]+)\.?(?=\s|$)/);
  if (quantity && unitMatch) {
    const word = unitMatch[1];
    const mapped = UNITS[word] ?? UNITS[word.toLowerCase()];
    // Single letters are only units in their exact case (T vs t), so check before lowercasing.
    if (mapped && (word.length > 1 || UNITS[word])) {
      unit = mapped;
      rest = rest.slice(unitMatch[0].length).trim();
    }
  }

  // "1 kg / 2 lb chicken": drop the alternative measurement.
  rest = rest.replace(/^\/\s*[\d.,/½¼¾⅓⅔\s-]+\s*[A-Za-z]+\.?\s+/, '');

  rest = (rest.replace(/^of\s+/i, '').trim() + note)
    // Sites often leave "(, skinless)" or "()" behind when they strip links from notes.
    .replace(/\(\s*,\s*/g, '(')
    .replace(/\s*,\s*\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { name: rest || line.trim(), quantity, unit };
}

/** Parses a pasted ingredient list, one per line, skipping blanks, bullets and sub-headings. */
export function parseIngredientList(text: string): ImportedIngredient[] {
  return text
    .split('\n')
    // Bullets and list numbering ("1) ", "2. "); a space after the dot means it isn't a decimal.
    .map(l => l.trim().replace(/^[-•*▪◦·–]\s*/, '').replace(/^\d+[.)]\s+/, ''))
    .filter(l => l && !/:$/.test(l) && !INGREDIENT_HEADING.test(l))
    .map(parseIngredientLine)
    .filter(i => i.name);
}

function toNumber(s: string): number {
  const t = s.replace(',', '.').trim();
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return +mixed[1] + +mixed[2] / +mixed[3];
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return +frac[1] / +frac[2];
  return parseFloat(t);
}

function formatQty(n: number): string {
  return isFinite(n) ? String(Math.round(n * 100) / 100) : '';
}

// ── Text cleanup ─────────────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', frac12: '½', frac14: '¼', frac34: '¾', deg: '°', ndash: '–', mdash: '—',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return isNaN(n) ? m : String.fromCodePoint(n);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? m;
  });
}

function cleanText(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}
