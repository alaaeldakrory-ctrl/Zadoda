// Reads a recipe (and a photo of the dish) from a link or pasted text.
// Used by /api/ai/recipe; kept separate so it can be tested without a signed-in request.

import { FetchError, fetchImageDataUrl, fetchPageHtml } from '@/lib/server/fetchPublic';
import {
  AIRecipe, recipeFromPageText, recipeFromText, recipeFromUrlContext, recipeFromYouTube,
} from '@/lib/server/gemini';
import { findPageImage, getYouTubeId, htmlToText, parseRecipePage } from '@/lib/recipeImport';

export interface RecipeImportResponse {
  recipe: AIRecipe;
  /** data: URL of the dish photo, when the source has one. */
  photo?: string;
  /** How the recipe was read, for the message shown to the user. */
  method: 'page-data' | 'ai-page' | 'ai-video' | 'ai-url' | 'ai-text';
}

async function youtubeThumbnail(id: string): Promise<string | undefined> {
  // maxres isn't generated for every video; hq always is.
  return (await fetchImageDataUrl(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`))
    ?? (await fetchImageDataUrl(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`))
    ?? undefined;
}

export async function importFromUrl(url: string): Promise<RecipeImportResponse | null> {
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    const [recipe, photo] = await Promise.all([
      recipeFromYouTube(`https://www.youtube.com/watch?v=${youtubeId}`),
      youtubeThumbnail(youtubeId),
    ]);
    return recipe ? { recipe: { ...recipe, youtubeId }, photo, method: 'ai-video' } : null;
  }

  let html: string | null = null;
  try {
    html = await fetchPageHtml(url);
  } catch (err) {
    // Blocked by the site (403 etc.): let Gemini read it from Google's side instead.
    if (!(err instanceof FetchError)) throw err;
  }

  if (!html) {
    const recipe = await recipeFromUrlContext(url);
    if (!recipe) return null;
    // The photo address comes from Gemini's reading of the page; the image host may still refuse us.
    const photo = recipe.imageUrl ? await fetchImageDataUrl(recipe.imageUrl) : null;
    return { recipe, photo: photo ?? undefined, method: 'ai-url' };
  }

  const structured = parseRecipePage(html);
  const photoUrl = structured?.imageUrl ?? findPageImage(html, url);
  const photoPromise = photoUrl ? fetchImageDataUrl(photoUrl) : Promise.resolve(null);

  // Most recipe sites publish the recipe as structured data: exact, instant, no AI needed.
  if (structured && structured.ingredients.length > 0) {
    return { recipe: structured, photo: (await photoPromise) ?? undefined, method: 'page-data' };
  }

  const [recipe, photo] = await Promise.all([recipeFromPageText(htmlToText(html), url), photoPromise]);
  return recipe ? { recipe, photo: photo ?? undefined, method: 'ai-page' } : null;
}

export async function importFromText(text: string): Promise<RecipeImportResponse | null> {
  const recipe = await recipeFromText(text);
  return recipe ? { recipe, method: 'ai-text' } : null;
}
