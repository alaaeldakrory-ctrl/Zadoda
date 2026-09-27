'use client';

import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export interface AskAIOptions {
  model?: 'gemini-2.5-flash-lite' | 'gemini-2.5-flash';
  temperature?: number;
  maxOutputTokens?: number;
}

/** POSTs to one of our /api routes as the signed-in user. */
export async function authedPost(path: string, body: unknown): Promise<Response> {
  const user = getAuth(getApp()).currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

/** Sends a prompt to Gemini through our server (which holds the API key) and returns the reply text. */
export async function askAI(prompt: string, options: AskAIOptions = {}): Promise<string> {
  const res = await authedPost('/api/ai/generate', { prompt, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `AI request failed (${res.status})`);
  return data.text ?? '';
}
