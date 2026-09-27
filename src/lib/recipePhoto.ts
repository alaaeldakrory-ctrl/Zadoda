'use client';

import { getApp } from 'firebase/app';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const BUCKET = 'gs://studio-3744208193-a3aca.firebasestorage.app';
const MAX_SIDE = 1200;

function storage() {
  // The bucket is passed explicitly because the local-development Firebase config doesn't include it.
  return getStorage(getApp(), BUCKET);
}

/** Shrinks any image (data: URL or file) to at most 1200px and re-encodes it as JPEG. */
export async function toJpeg(source: string | Blob): Promise<Blob> {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that image'));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not process that image'))), 'image/jpeg', 0.85)
    );
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

/** Uploads a recipe photo to the family's folder and returns its download URL. */
export async function uploadRecipePhoto(familyId: string, source: string | Blob): Promise<string> {
  const jpeg = await toJpeg(source);
  const path = `families/${familyId}/recipes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const fileRef = ref(storage(), path);
  await uploadBytes(fileRef, jpeg, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
  return getDownloadURL(fileRef);
}

/** Deletes a photo we uploaded; ignores anything that isn't in our bucket (or is already gone). */
export async function deleteRecipePhoto(url: string | undefined): Promise<void> {
  if (!url || !url.includes('studio-3744208193-a3aca.firebasestorage.app') || !url.includes('families%2F')) return;
  try {
    await deleteObject(ref(storage(), url));
  } catch {
    /* already deleted or not ours: nothing to do */
  }
}
