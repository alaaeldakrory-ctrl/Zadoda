"use client"

import { useStore } from '@/lib/store';
import { AppLayout } from '@/components/ui/Layout';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LandingPage } from '@/components/LandingPage';

export default function Home() {
  const { currentUser, isAuthLoading } = useStore();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-6xl animate-pulse">🌿</div>
      </div>
    );
  }

  if (!currentUser || currentUser.isAnonymous) {
    return <LandingPage />;
  }

  return (
    <AppLayout>
      <CalendarView />
    </AppLayout>
  );
}
