'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Sign in with Google (popup). Returns promise for error handling. */
export async function signInWithGoogle(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(authInstance, provider);
}

/** Sign up with email + password, optionally set a display name. Returns promise. */
export async function signUpWithEmail(
  authInstance: Auth,
  email: string,
  password: string,
  displayName?: string
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(authInstance, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
}

/** Sign in with email + password. Returns promise for error handling. */
export async function signInWithEmail(
  authInstance: Auth,
  email: string,
  password: string
): Promise<void> {
  await signInWithEmailAndPassword(authInstance, email, password);
}

/** Sign out the current user. */
export async function signOutUser(authInstance: Auth): Promise<void> {
  await firebaseSignOut(authInstance);
}

/** Non-blocking email sign-up (legacy – kept for compatibility). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Non-blocking email sign-in (legacy – kept for compatibility). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}
