'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-6xl">🌿</p>
        <h1 className="text-3xl font-black tracking-tighter text-[#2D3436]">Something went wrong</h1>
        <p className="text-gray-500 font-medium">An unexpected error occurred. Your data is safe.</p>
        <div className="flex gap-4 justify-center pt-2">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#6C5CE7] text-white font-bold rounded-2xl hover:bg-[#5849C4] transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="px-6 py-3 border-2 border-gray-200 font-bold rounded-2xl hover:border-[#6C5CE7]/40 transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
