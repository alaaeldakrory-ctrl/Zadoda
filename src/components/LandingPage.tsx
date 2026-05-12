"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Calendar, CheckCircle2, Heart, ArrowRight, Shield,
  Globe, Clock, Sparkles, Zap, Smile
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithGoogle } from '@/firebase/non-blocking-login';
import { Loader2 } from 'lucide-react';

// ── Mini app preview ──────────────────────────────────────────────────────────
const PREVIEW_EVENTS = [
  { time: '8:00', title: 'School Drop-off', color: '#00B894', done: true },
  { time: '10:00', title: 'Soccer Practice', color: '#E17055', done: true },
  { time: '12:30', title: 'Lunch & Reading', color: '#FDCB6E', done: false, active: true },
  { time: '3:00', title: 'Homework Time', color: '#0984E3', done: false },
  { time: '6:30', title: 'Family Dinner', color: '#6C5CE7', done: false },
];

function AppPreview() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[#6C5CE7]/20 blur-3xl rounded-full scale-75 translate-y-8 pointer-events-none" />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl shadow-[#6C5CE7]/15 p-7 w-full max-w-[340px] mx-auto border border-white/80">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Today</p>
            <p className="text-2xl font-black text-gray-800 leading-none mt-0.5">Wednesday</p>
            <p className="text-sm font-bold text-gray-400">May 14</p>
          </div>
          <div className="flex -space-x-2">
            {['#E17055', '#0984E3', '#00B894'].map((c, i) => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-base shadow-sm" style={{ backgroundColor: c }}>
                {['🧒', '👧', '👨'][i]}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Progress</span>
            <span className="text-xs font-black text-[#6C5CE7]">2 / 5 done</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#6C5CE7] rounded-full" style={{ width: '40%' }} />
          </div>
        </div>
        <div className="space-y-2">
          {PREVIEW_EVENTS.map((ev, i) => (
            <div key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${ev.done ? 'opacity-40' : ''} ${ev.active ? 'shadow-md scale-[1.02]' : ''} ${!ev.done && !ev.active ? 'bg-gray-50' : ''}`}
              style={ev.active ? { backgroundColor: `${ev.color}15`, border: `1.5px solid ${ev.color}40` } : {}}>
              <span className="text-[11px] font-black text-gray-400 w-9 shrink-0">{ev.time}</span>
              <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
              <span className={`flex-1 text-sm font-bold truncate ${ev.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{ev.title}</span>
              {ev.done && <span className="text-green-500 text-sm shrink-0">✓</span>}
              {ev.active && <span className="text-sm shrink-0 animate-pulse" style={{ color: ev.color }}>▶</span>}
            </div>
          ))}
        </div>
      </div>
      {/* Floating checklist badge */}
      <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 w-44 border hidden lg:block">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Morning Routine</p>
        {['Wake up', 'Brush teeth', 'Pack bag'].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 text-[9px] ${i < 2 ? 'bg-[#00B894] border-[#00B894] text-white' : 'border-gray-300'}`}>
              {i < 2 && '✓'}
            </div>
            <span className={`text-xs font-bold ${i < 2 ? 'line-through text-gray-400' : ''}`}>{item}</span>
          </div>
        ))}
      </div>
      {/* Floating streak */}
      <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[#FDCB6E] to-[#E17055] text-white rounded-2xl shadow-lg px-3 py-2 hidden lg:flex items-center gap-1.5">
        <span className="text-lg">🔥</span>
        <div>
          <p className="text-[10px] font-black uppercase leading-none">Streak</p>
          <p className="text-lg font-black leading-none">7 days</p>
        </div>
      </div>
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '10K+', label: 'Families Organized', color: '#6C5CE7', bg: '#6C5CE7' },
  { value: '250K+', label: 'Tasks Completed', color: '#00B894', bg: '#00B894' },
  { value: '4.9★', label: 'Average Rating', color: '#FDCB6E', bg: '#E17055' },
  { value: '99.9%', label: 'Uptime', color: '#0984E3', bg: '#0984E3' },
];

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { emoji: '📅', title: 'Shared Calendar', desc: 'One view for the whole family. See who\'s where, when — from soccer practice to doctor visits.', color: '#6C5CE7', bg: '#EDE9FD' },
  { emoji: '✅', title: 'Daily Checklists', desc: 'Morning routines, homework, bedtime — visual task lists that build confident, independent kids.', color: '#00B894', bg: '#E0F9F2' },
  { emoji: '🧹', title: 'Chore Tracking', desc: 'Assign, rotate, and track chores. Teach responsibility with accountability kids can actually see.', color: '#E17055', bg: '#FEF0EC' },
  { emoji: '📓', title: 'Parent Journal', desc: 'Log observations, track mood, and reflect on your parenting journey in a private, loving space.', color: '#FD79A8', bg: '#FEF0F5' },
  { emoji: '🔥', title: 'Streaks & Goals', desc: 'Celebrate consistency. Kids earn streaks for completing routines — motivation that actually works.', color: '#FDCB6E', bg: '#FEF9EC' },
  { emoji: '📺', title: 'Wall Display Mode', desc: 'Mount a tablet on your wall as a family dashboard. Everyone sees today\'s plan at a glance.', color: '#0984E3', bg: '#E8F2FD' },
];

// ── Day in the life ───────────────────────────────────────────────────────────
const DAY_SCENES = [
  {
    time: 'Morning',
    emoji: '🌅',
    color: '#FDCB6E',
    bg: 'from-[#FFF9E6] to-[#FEF3C7]',
    accent: '#E17055',
    title: 'Start every day with a plan',
    desc: 'Kids wake up and check their morning checklist on the family tablet. No more "what do I do next?" — just confident, independent mornings.',
    items: ['Wake up & make bed ✓', 'Brush teeth ✓', 'Get dressed', 'Eat breakfast', 'Pack school bag'],
  },
  {
    time: 'Afternoon',
    emoji: '⚽',
    color: '#00B894',
    bg: 'from-[#E6FBF5] to-[#D1FAE5]',
    accent: '#00B894',
    title: 'Never miss a pickup again',
    desc: 'The shared calendar shows everyone\'s activities. Parents get a clear view of who needs to be where — no more double-bookings or forgotten practices.',
    items: ['3:00 · Soccer Practice', '4:30 · Piano Lesson', '5:30 · Homework Time', '6:30 · Family Dinner'],
  },
  {
    time: 'Evening',
    emoji: '🌙',
    color: '#6C5CE7',
    bg: 'from-[#F0EDFE] to-[#EDE9FD]',
    accent: '#6C5CE7',
    title: 'Wind down together',
    desc: 'Parents review the day, log a quick note in the parent journal, and set up tomorrow\'s schedule — all in one place, in just a few minutes.',
    items: ['Bedtime routine checklist', 'Parent daily reflection', 'Tomorrow\'s schedule ready', '🔥 7-day streak earned!'],
  },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Zadoda completely transformed our mornings. The kids actually wake up excited to check off their routines. I never thought a scheduling app could do that.",
    name: "Sarah M.",
    role: "Mom of 3 · Toronto",
    avatar: '👩',
    color: '#6C5CE7',
    stars: 5,
  },
  {
    quote: "We've tried every family app out there. Zadoda is the first one where my husband and I are actually both using it consistently — the design just makes sense.",
    name: "Ahmed & Nour K.",
    role: "Parents of 2 · Dubai",
    avatar: '👨‍👩',
    color: '#00B894',
    stars: 5,
  },
  {
    quote: "The parent journal is something I didn't know I needed. Having a private space to reflect on our parenting is genuinely valuable. Highly recommend.",
    name: "Jennifer P.",
    role: "Mom of 4 · London",
    avatar: '👩‍🦰',
    color: '#E17055',
    stars: 5,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export const LandingPage = () => {
  const { setLanguage, settings } = useStore();
  const auth = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(auth);
      router.push('/');
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#2D3436] overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6C5CE7] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30">
              <Calendar className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter">zadoda</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold text-sm hidden sm:flex" onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}>
              <Globe className="w-4 h-4 mr-2" />{settings.language === 'en' ? 'العربية' : 'English'}
            </Button>
            <Link href="/login"><Button variant="ghost" className="font-bold">Sign In</Button></Link>
            <Link href="/signup">
              <Button className="bg-[#6C5CE7] hover:bg-[#5849C4] text-white font-bold rounded-full px-6 shadow-lg shadow-[#6C5CE7]/25 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded-full text-sm font-black uppercase tracking-widest border border-[#6C5CE7]/20">
              <Heart className="w-4 h-4" /> For Every Family
            </div>
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-[#2D3436]">
              Harmony<br />at <span className="text-[#6C5CE7]">Home</span>.
            </h1>
            <p className="text-xl text-gray-500 max-w-lg leading-relaxed font-medium">
              The premium family scheduler that brings peace to your daily routine. Shared calendars, chore tracking, and parenting tools — beautifully designed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleGoogle} disabled={googleLoading}
                className="flex items-center justify-center gap-3 h-14 px-7 rounded-2xl border-2 border-gray-200 bg-white font-bold text-base hover:border-[#6C5CE7]/40 hover:bg-[#6C5CE7]/5 transition-all shadow-sm disabled:opacity-50">
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>
              <Link href="/signup">
                <Button className="w-full h-14 px-8 bg-[#6C5CE7] hover:bg-[#5849C4] text-white text-base font-black rounded-2xl shadow-xl shadow-[#6C5CE7]/30 transition-all hover:scale-105 active:scale-95">
                  Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['#E17055','#0984E3','#00B894','#FDCB6E','#6C5CE7'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white text-sm flex items-center justify-center" style={{ backgroundColor: c }}>
                    {['👧','🧒','👩','👨','👶'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-[#FDCB6E] text-sm">★★★★★</div>
                <p className="text-xs font-bold text-gray-400">Loved by 10,000+ families</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <p className="text-4xl lg:text-5xl font-black" style={{ color: s.bg }}>{s.value}</p>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00B894]/10 text-[#00B894] rounded-full text-xs font-black uppercase tracking-widest border border-[#00B894]/20">
              <Sparkles className="w-3.5 h-3.5" /> Everything you need
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">Built for real family life</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">Not another productivity tool. A warm, thoughtful space designed around how families actually work.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-[2.5rem] border-2 border-transparent p-8 space-y-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default" style={{ backgroundColor: f.bg }}>
                <div className="text-5xl">{f.emoji}</div>
                <div>
                  <h3 className="text-xl font-black text-[#2D3436] mb-2">{f.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-gray-500">{f.desc}</p>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ backgroundColor: `${f.color}20`, color: f.color }}>
                    Included free
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A day with Zadoda ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E17055]/10 text-[#E17055] rounded-full text-xs font-black uppercase tracking-widest border border-[#E17055]/20">
              <Clock className="w-3.5 h-3.5" /> A Day with Zadoda
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">From sunrise to bedtime</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">See how Zadoda fits seamlessly into every part of your family's day.</p>
          </div>
          <div className="space-y-10">
            {DAY_SCENES.map((scene, i) => (
              <div key={scene.time} className={`rounded-[3rem] bg-gradient-to-br ${scene.bg} p-10 lg:p-14 grid lg:grid-cols-2 gap-10 items-center`}>
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">{scene.emoji}</span>
                    <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: scene.accent }}>{scene.time}</span>
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-[#2D3436] mb-4">{scene.title}</h3>
                  <p className="text-base font-medium text-gray-500 leading-relaxed max-w-md">{scene.desc}</p>
                </div>
                <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-[2rem] p-6 space-y-3 shadow-xl shadow-black/5 border border-white">
                    {scene.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-white/80">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${scene.accent}20` }}>
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: scene.accent }} />
                        </div>
                        <span className="text-sm font-bold text-[#2D3436]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded-full text-xs font-black uppercase tracking-widest border border-[#6C5CE7]/20">
              <Zap className="w-3.5 h-3.5" /> Simple Setup
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">Up and running in 3 minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-[#6C5CE7] via-[#00B894] to-[#E17055] opacity-30" />
            {[
              { num: '01', color: '#6C5CE7', bg: '#EDE9FD', title: 'Create your family', desc: 'Sign up in seconds. Add your family members — parents and kids — with custom colors and avatars.', emoji: '👨‍👩‍👧‍👦' },
              { num: '02', color: '#00B894', bg: '#E0F9F2', title: 'Build your schedule', desc: 'Add events, checklists, and recurring routines. Set them to repeat daily, weekly, or however you need.', emoji: '📅' },
              { num: '03', color: '#E17055', bg: '#FEF0EC', title: 'Stay in sync', desc: 'Everyone sees the same plan. Mark tasks done, earn streaks, and finally feel like a team.', emoji: '🎉' },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center space-y-5">
                <div className="w-24 h-24 rounded-full flex items-center justify-center relative z-10 shadow-xl text-4xl" style={{ backgroundColor: step.bg, border: `3px solid ${step.color}30` }}>
                  {step.emoji}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: step.color }}>{step.num}</p>
                  <h3 className="text-xl font-black text-[#2D3436] mb-2">{step.title}</h3>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6 bg-[#FDFCF9]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FD79A8]/10 text-[#FD79A8] rounded-full text-xs font-black uppercase tracking-widest border border-[#FD79A8]/20">
              <Smile className="w-3.5 h-3.5" /> Family Love
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">What families are saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex text-[#FDCB6E] text-lg">{'★'.repeat(t.stars)}</div>
                <p className="text-base font-medium text-gray-600 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-inner" style={{ backgroundColor: `${t.color}15` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-black text-sm text-[#2D3436]">{t.name}</p>
                    <p className="text-xs font-bold text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-[#6C5CE7] rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl shadow-[#6C5CE7]/30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -translate-x-1/3 translate-y-1/3" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">Your family's privacy is our priority</h2>
              <p className="text-white/75 text-base font-medium leading-relaxed">Industry-standard encryption and Firebase security keep your data private. Only your family has access to your workspace.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
              <ul className="space-y-3">
                {['End-to-end data isolation', 'Parental PIN protection', 'No ad tracking', 'Secure cloud backups', 'Your data, your family only'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-[#55EFC4] shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-7xl">🏡</p>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-[#2D3436] leading-tight">
            Ready to bring harmony to your family?
          </h2>
          <p className="text-xl font-medium text-gray-400 max-w-xl mx-auto">
            Join thousands of families who've traded morning chaos for calm, connected days — starting today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button onClick={handleGoogle} disabled={googleLoading}
              className="flex items-center justify-center gap-3 h-16 px-10 rounded-3xl border-2 border-gray-200 bg-white font-bold text-lg hover:border-[#6C5CE7]/40 hover:bg-[#6C5CE7]/5 transition-all shadow-sm disabled:opacity-50">
              {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Start with Google
            </button>
            <Link href="/signup">
              <Button className="h-16 px-10 rounded-3xl bg-[#6C5CE7] hover:bg-[#5849C4] text-white text-lg font-black shadow-2xl shadow-[#6C5CE7]/30 transition-all hover:scale-105 active:scale-95">
                Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Free forever · No credit card · Your data stays yours</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-14 border-t border-gray-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6C5CE7] rounded-lg flex items-center justify-center">
              <Calendar className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-black tracking-tighter">zadoda</span>
          </div>
          <p className="text-gray-400 font-medium text-sm">© 2026 Zadoda Family Scheduler. Made with ❤️ for families everywhere.</p>
          <div className="flex gap-8">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <Link key={l} href="#" className="text-gray-400 hover:text-[#6C5CE7] font-black uppercase text-xs tracking-widest transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
