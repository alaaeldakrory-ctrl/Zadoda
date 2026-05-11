import { Suspense } from 'react';
import { TVDashboard } from '@/components/tv/TVDashboard';

export default function TVPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
          <div className="text-7xl animate-pulse">⏳</div>
        </div>
      }
    >
      <TVDashboard />
    </Suspense>
  );
}
