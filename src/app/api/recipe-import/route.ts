import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getYouTubeId, parseRecipePage, parseYouTubePage, ImportedRecipe } from '@/lib/recipeImport';

export const runtime = 'nodejs';

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

// Fetching user-supplied URLs from the server: only allow public http(s) hosts,
// so the route can't be pointed at localhost or the cloud metadata service.
function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
    return v === '::' || v === '::1' || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only web links are supported');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map(a => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) throw new Error('That address is not allowed');
  return url;
}

async function fetchPage(raw: string): Promise<string> {
  let url = await assertPublicUrl(raw);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Many recipe sites turn away requests without a browser-like agent.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!res.ok) throw new Error(`The site returned an error (${res.status})`);
    return readLimited(res);
  }
  throw new Error('Too many redirects');
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); break; }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function POST(req: Request) {
  let url: string;
  try {
    ({ url } = await req.json());
    if (typeof url !== 'string' || !url.trim()) throw new Error();
  } catch {
    return NextResponse.json({ error: 'Missing link' }, { status: 400 });
  }

  try {
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
      // oEmbed is YouTube's official endpoint for titles; the watch page (for the description)
      // is best-effort, since YouTube may answer cloud servers with a bot check instead.
      const [oembed, html] = await Promise.all([
        fetchPage(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`)
          .then(text => JSON.parse(text) as { title?: string })
          .catch(() => null),
        fetchPage(watchUrl).catch(() => ''),
      ]);
      const recipe = parseYouTubePage(html, youtubeId, oembed?.title ?? '');
      if (!recipe.name && recipe.ingredients.length === 0) throw new Error('Could not read that video');
      return NextResponse.json<ImportedRecipe>(recipe);
    }

    const recipe = parseRecipePage(await fetchPage(url));
    if (!recipe) {
      return NextResponse.json({ error: 'No recipe found on that page' }, { status: 422 });
    }
    return NextResponse.json<ImportedRecipe>(recipe);
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : 'Could not read that link';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
