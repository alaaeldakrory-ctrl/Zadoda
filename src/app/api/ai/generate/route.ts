import { NextResponse } from 'next/server';
import { allowRequest, getRequestUid } from '@/lib/server/auth';

export const runtime = 'nodejs';

// The Gemini key stays on the server: the browser calls this route, never Google directly.
const ALLOWED_MODELS = new Set(['gemini-2.5-flash-lite', 'gemini-2.5-flash']);
const MAX_PROMPT_CHARS = 20_000;
const MAX_OUTPUT_TOKENS = 4096;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured' }, { status: 503 });

  const uid = await getRequestUid(req);
  if (!uid) return NextResponse.json({ error: 'Sign in to use AI features' }, { status: 401 });
  if (!allowRequest(uid, 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many AI requests, try again in a few minutes' }, { status: 429 });
  }

  let body: { model?: string; prompt?: string; temperature?: number; maxOutputTokens?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const model = body.model ?? 'gemini-2.5-flash-lite';
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!ALLOWED_MODELS.has(model) || !prompt.trim() || prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: Math.min(Math.max(body.temperature ?? 0.7, 0), 1),
          maxOutputTokens: Math.min(body.maxOutputTokens ?? 2048, MAX_OUTPUT_TOKENS),
        },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  ).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  return NextResponse.json({ text });
}
