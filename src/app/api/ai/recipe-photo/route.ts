import { NextResponse } from 'next/server';
import { allowRequest, getRequestUid } from '@/lib/server/auth';
import { generateDishPhoto } from '@/lib/server/gemini';

export const runtime = 'nodejs';
export const maxDuration = 90;

/** Creates a realistic photo of a dish from its name and ingredients. */
export async function POST(req: Request) {
  const uid = await getRequestUid(req);
  if (!uid) return NextResponse.json({ error: 'Sign in to create photos' }, { status: 401 });
  // Image generation is the costly call, so it gets a tighter limit.
  if (!allowRequest(`${uid}:photo`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many photos, try again in a few minutes' }, { status: 429 });
  }

  let name = '';
  let ingredients: string[] = [];
  try {
    const body = await req.json();
    name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.filter((i: unknown): i is string => typeof i === 'string').map((i: string) => i.slice(0, 80)).slice(0, 12)
      : [];
  } catch { /* handled below */ }
  if (!name) return NextResponse.json({ error: 'Give the recipe a name first' }, { status: 400 });

  try {
    const photo = await generateDishPhoto(name, ingredients);
    if (!photo) return NextResponse.json({ error: 'No photo came back, try again' }, { status: 502 });
    return NextResponse.json({ photo });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    // Free-tier Gemini keys have no image quota; say so plainly instead of a generic failure.
    if (message.includes(' 429 ') && /quota|billing/i.test(message)) {
      return NextResponse.json({ error: 'billing', message: 'AI photos need billing turned on for the Gemini API key' }, { status: 402 });
    }
    console.error('photo generation failed', err);
    return NextResponse.json({ error: 'Could not create a photo right now, try again' }, { status: 502 });
  }
}
