import { NextResponse } from 'next/server';
import { allowRequest, getRequestUid } from '@/lib/server/auth';
import { normalizeUrl } from '@/lib/recipeImport';
import { importFromText, importFromUrl, RecipeImportResponse } from '@/lib/server/recipeImportService';

export const runtime = 'nodejs';
// YouTube videos and blocked sites can take Gemini a little while.
export const maxDuration = 120;

const MAX_TEXT = 30_000;

export async function POST(req: Request) {
  const uid = await getRequestUid(req);
  if (!uid) return NextResponse.json({ error: 'Sign in to import recipes' }, { status: 401 });
  if (!allowRequest(`${uid}:recipe`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many imports, try again in a few minutes' }, { status: 429 });
  }

  let body: { url?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    let result: RecipeImportResponse | null = null;
    if (typeof body.text === 'string' && body.text.trim()) {
      if (body.text.length > MAX_TEXT) return NextResponse.json({ error: 'That text is too long' }, { status: 400 });
      result = await importFromText(body.text);
    } else if (typeof body.url === 'string') {
      const url = normalizeUrl(body.url);
      if (!url) return NextResponse.json({ error: "That doesn't look like a web link" }, { status: 400 });
      result = await importFromUrl(url);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!result) return NextResponse.json({ error: 'No recipe found there' }, { status: 422 });
    return NextResponse.json<RecipeImportResponse>(result);
  } catch (err) {
    console.error('recipe import failed', err);
    return NextResponse.json({ error: 'Could not read that recipe right now, try again' }, { status: 502 });
  }
}
