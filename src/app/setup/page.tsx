"use client"

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Loader2, Users, ArrowRight, KeyRound, Home } from 'lucide-react';

export default function SetupPage() {
  const { currentUser, isAuthLoading, persons, isLoading, isMembershipLoading, joinFamily } = useStore();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  // Redirect unauthenticated users to landing
  useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.isAnonymous)) {
      router.replace('/');
    }
  }, [isAuthLoading, currentUser, router]);

  // Once data loads: if user already has family data, skip setup and go home
  useEffect(() => {
    if (isLoading || isMembershipLoading) return;
    if (persons.length > 0) {
      router.replace('/home');
    }
  }, [isLoading, isMembershipLoading, persons, router]);

  const handleJoin = async () => {
    if (!code.trim() || joining) return;
    setError('');
    setJoining(true);
    const result = await joinFamily(code);
    setJoining(false);
    if (result.success) {
      setJoined(true);
      // Small delay so the user sees the success state, then reload to pick up new familyId
      setTimeout(() => { window.location.href = '/home'; }, 1200);
    } else {
      setError(result.error || 'Something went wrong.');
    }
  };

  const handleStartFresh = () => {
    router.push('/home');
  };

  if (isAuthLoading || isLoading || isMembershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="text-5xl">🎉</div>
          <p className="text-xl font-black text-primary">You're in!</p>
          <p className="text-sm font-medium text-muted-foreground">Joining your family…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Welcome to Zadoda</h1>
          <p className="text-muted-foreground font-medium text-sm">
            Are you joining an existing family or starting your own?
          </p>
        </div>

        {/* Option 1: Join with code */}
        <div className="rounded-[1.75rem] border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-black text-base">Join an existing family</p>
              <p className="text-xs font-medium text-muted-foreground">Enter the invite code your partner shared</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Enter 6-character code (e.g. MWF4K2)"
              maxLength={6}
              className="w-full h-12 px-4 rounded-xl border-2 bg-white font-black text-lg tracking-[0.3em] text-center uppercase focus:outline-none focus:border-primary transition-colors"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            {error && (
              <p className="text-xs font-bold text-destructive text-center">{error}</p>
            )}
            <button
              onClick={handleJoin}
              disabled={code.length < 6 || joining}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
            >
              {joining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Join Family <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Option 2: Start fresh */}
        <button
          onClick={handleStartFresh}
          className="w-full h-14 rounded-xl border-2 border-border bg-card font-black flex items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
        >
          <Home className="w-5 h-5" />
          Start a new family
        </button>

        <p className="text-center text-[10px] font-medium text-muted-foreground opacity-40">
          Signed in as {currentUser?.email}
        </p>
      </div>
    </div>
  );
}
