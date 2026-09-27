import 'server-only';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// Verifying ID tokens only needs the project id (Google's public signing keys are fetched
// automatically), so this works both on App Hosting and in local development.
function adminApp() {
  return getApps()[0] ?? initializeApp({ projectId: firebaseConfig.projectId });
}

/** Returns the signed-in user's uid from an "Authorization: Bearer <Firebase ID token>" header, or null. */
export async function getRequestUid(req: Request): Promise<string | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = await getAuth(adminApp()).verifyIdToken(token);
    // Anonymous sessions can't use paid features.
    return decoded.firebase?.sign_in_provider === 'anonymous' ? null : decoded.uid;
  } catch {
    return null;
  }
}

// Simple per-user limit. The backend runs a single instance (apphosting.yaml maxInstances: 1),
// so an in-memory window is enough to stop one account from running up the AI bill.
const hits = new Map<string, number[]>();

export function allowRequest(uid: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(uid) ?? []).filter(t => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(uid, recent);
    return false;
  }
  recent.push(now);
  hits.set(uid, recent);
  return true;
}
