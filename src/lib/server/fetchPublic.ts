import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// Fetching user-supplied URLs from the server: only allow public http(s) hosts,
// so a link can't point the server at localhost or the cloud metadata service.

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 15_000;

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

export class FetchError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

/** Fetches a public URL (following checked redirects) and returns its body, up to maxBytes. */
export async function fetchPublic(raw: string, accept: string, maxBytes: number): Promise<{ bytes: Buffer; contentType: string }> {
  let url = await assertPublicUrl(raw);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Many recipe sites turn away requests without a browser-like agent.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': accept,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!res.ok) throw new FetchError(`The site returned an error (${res.status})`, res.status);
    return { bytes: await readLimited(res, maxBytes), contentType: res.headers.get('content-type') ?? '' };
  }
  throw new FetchError('Too many redirects');
}

async function readLimited(res: Response, maxBytes: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); break; }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function fetchPageHtml(url: string): Promise<string> {
  const { bytes } = await fetchPublic(url, 'text/html,application/xhtml+xml', 3 * 1024 * 1024);
  return new TextDecoder().decode(bytes);
}

/** Downloads an image and returns it as a data: URL, or null if it isn't a usable image. */
export async function fetchImageDataUrl(url: string): Promise<string | null> {
  const MAX = 8 * 1024 * 1024;
  try {
    const { bytes, contentType } = await fetchPublic(url, 'image/*', MAX);
    const type = contentType.split(';')[0].trim();
    if (!type.startsWith('image/') || bytes.length >= MAX) return null; // not an image, or cut off
    if (bytes.length < 2_000) return null; // tracking pixels / placeholders
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}
