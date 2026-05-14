"use client"

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import {
  getOccurrencesForDate, formatTime, getPersonName, getAvatarUrl, cn, timeToMinutes
} from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';
import {
  Sun, CloudRain, Cloud, Star, AlertTriangle,
  Plus, CheckCircle2, Circle, Flame, ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Weather ───────────────────────────────────────────────────────────────────

interface WeatherInfo {
  label: string;
  icon: 'sun' | 'rain' | 'cloud';
  temp?: number;
}

function WeatherIcon({ type }: { type: WeatherInfo['icon'] }) {
  if (type === 'rain') return <CloudRain className="w-4 h-4" />;
  if (type === 'cloud') return <Cloud className="w-4 h-4" />;
  return <Sun className="w-4 h-4" />;
}

function useWeather(): WeatherInfo | null {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const wm = data.current_weather?.weathercode ?? 0;
        const temp = Math.round(data.current_weather?.temperature ?? 0);
        const hourlyPrecip = data.hourly?.precipitation_probability ?? [];
        const currentHour = new Date().getHours();
        const nextRainHour = hourlyPrecip.findIndex((p: number, i: number) => i > currentHour && p >= 50);

        let label: string;
        let icon: WeatherInfo['icon'];
        if (wm >= 61 || (nextRainHour !== -1 && nextRainHour - currentHour <= 3)) {
          const hoursUntil = nextRainHour - currentHour;
          label = wm >= 61 ? `Raining · ${temp}°C` : `Rain in ~${hoursUntil}h`;
          icon = 'rain';
        } else if (wm >= 2) {
          label = `Cloudy · ${temp}°C`;
          icon = 'cloud';
        } else {
          label = `Sunny · ${temp}°C`;
          icon = 'sun';
        }
        setWeather({ label, icon, temp });
      } catch {}
    }, () => {});
  }, []);
  return weather;
}

// ── Greeting Bar ─────────────────────────────────────────────────────────────

function GreetingBar() {
  const { settings, currentUser, persons } = useStore();
  const weather = useWeather();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.displayName?.split(' ')[0] || 'there';
  const today = new Date();
  const parents = persons.filter(p => p.role === 'parent');

  return (
    <div className="rounded-[2rem] px-8 py-6 flex items-center justify-between gap-6" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}>
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-white">{greeting}, {firstName} 👋</h1>
        <p className="text-white/70 font-bold text-sm">
          {format(today, 'EEEE, MMMM d')} · {settings.familyName || 'Your'} Family
        </p>
      </div>
      {weather && (
        <div className="flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-2xl text-sm font-bold shrink-0">
          <WeatherIcon type={weather.icon} />
          {weather.label}
        </div>
      )}
    </div>
  );
}

// ── Today's Schedule ─────────────────────────────────────────────────────────

function TodaySchedule() {
  const { series, overrides, persons, settings, toggleCompletion } = useStore();
  const router = useRouter();
  const today = new Date();
  const nowMins = today.getHours() * 60 + today.getMinutes();

  const occurrences = getOccurrencesForDate(series, today, overrides)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const visible = occurrences.slice(0, 7);
  const extra = occurrences.length - 7;

  const getPerson = (personId: string) => persons.find(p => p.id === personId);

  return (
    <div className="rounded-[2rem] border bg-card shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b bg-muted/10">
        <h2 className="text-xl font-black">Today's Schedule</h2>
        <p className="text-xs font-bold text-muted-foreground opacity-60 mt-0.5">{format(today, 'EEEE, MMMM d')}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-30">
            <p className="font-black text-lg">No events today</p>
            <p className="text-sm font-medium mt-1">A free day!</p>
          </div>
        ) : (
          <div className="divide-y">
            {visible.map(occ => {
              const startMins = timeToMinutes(occ.startTime);
              const endMins = timeToMinutes(occ.endTime);
              const isNow = nowMins >= startMins && nowMins <= endMins;
              const isPast = nowMins > endMins || occ.completed;
              const person = occ.personId !== 'all' && occ.personId !== 'kids' ? getPerson(occ.personId) : null;
              const color = person?.color || '#2D6A4F';

              return (
                <div key={occ.id}
                  className={cn('flex items-center gap-4 px-6 py-4 transition-all',
                    isNow ? 'bg-emerald-50' : isPast ? 'opacity-50' : 'hover:bg-muted/20'
                  )}>
                  <div className="w-14 text-right shrink-0">
                    <span className="text-xs font-black text-muted-foreground">{formatTime(occ.startTime)}</span>
                  </div>
                  <div className="w-1 rounded-full self-stretch min-h-8 shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-black text-sm truncate', isNow && 'text-emerald-800')}>{occ.title}</p>
                    {person && (
                      <p className="text-xs font-bold text-muted-foreground opacity-60 truncate">
                        {getPersonName(person, settings.language)}
                      </p>
                    )}
                  </div>
                  {isNow && (
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">NOW</span>
                  )}
                  {isPast && !isNow && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t flex items-center justify-between">
        {extra > 0 && (
          <button onClick={() => router.push('/')} className="text-xs font-black text-primary hover:underline">
            + {extra} more events
          </button>
        )}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-xs font-black text-muted-foreground hover:text-primary transition-colors ml-auto"
        >
          <Plus className="w-3 h-3" /> Add event
        </button>
      </div>
    </div>
  );
}

// ── Kids on Track ─────────────────────────────────────────────────────────────

function KidsOnTrack() {
  const { persons, chores, choreOverrides, checklists, checklistCompletions, settings } = useStore();
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const kids = persons.filter(p => p.role === 'child');

  return (
    <div className="rounded-[2rem] border bg-card shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b bg-muted/10">
        <h2 className="text-xl font-black">Kids on Track</h2>
        <p className="text-xs font-bold text-muted-foreground opacity-60 mt-0.5">Today's progress</p>
      </div>
      <div className="p-4 space-y-3">
        {kids.map(kid => {
          const todayChores = choreOverrides.filter(o => o.date === today);
          const kidChores = todayChores.filter(o => {
            const chore = chores.find(c => c.id === o.choreId);
            return chore && (o.assignedTo === kid.id || chore.defaultAssignedTo === kid.id);
          });
          const doneChores = kidChores.filter(o => o.completed).length;
          const totalChores = kidChores.length;

          const kidChecklists = checklists.filter(cl =>
            cl.countForScoring !== false &&
            (cl.assignedTo === kid.id || cl.assignedTo === 'all' || cl.assignedTo === 'kids')
          );
          const allItems = kidChecklists.flatMap((cl) =>
            cl.items.map((_, idx) => ({ checklistId: cl.id, itemIndex: idx }))
          );
          const doneItems = allItems.filter(({ checklistId, itemIndex }) => {
            const key = `${today}_${kid.id}_${checklistId}_${itemIndex}`;
            return checklistCompletions.find(c => c.id === key)?.completed;
          }).length;
          const totalItems = allItems.length;

          const pct = (totalChores + totalItems) === 0 ? 0
            : Math.round(((doneChores + doneItems) / (totalChores + totalItems)) * 100);

          const pillColor = pct === 100 ? 'bg-emerald-100 text-emerald-700'
            : pct > 0 ? 'bg-amber-100 text-amber-700'
            : 'bg-muted text-muted-foreground';

          return (
            <button key={kid.id}
              onClick={() => router.push(`/checklists?personId=${kid.id}`)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border hover:bg-muted/20 transition-all text-left">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: kid.color }}>
                <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">{getPersonName(kid, settings.language)}</span>
                  {pct === 100 ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" /> :
                   pct > 0 ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : null}
                </div>
                <div className="flex gap-2">
                  {totalChores > 0 && (
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', pillColor)}>
                      {doneChores}/{totalChores} chores
                    </span>
                  )}
                  {totalItems > 0 && (
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', pillColor)}>
                      {doneItems}/{totalItems} routine
                    </span>
                  )}
                  {totalChores === 0 && totalItems === 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground opacity-50">No tasks today</span>
                  )}
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <div className={cn('h-1.5 rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-amber-400')}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── My To-Dos ─────────────────────────────────────────────────────────────────

function MyTodos() {
  const { memos, persons, toggleMemoCompletion } = useStore();
  const router = useRouter();
  const parents = persons.filter(p => p.role === 'parent');
  const parentIds = new Set(parents.map(p => p.id));

  const uncompleted = memos
    .filter(m => !m.completed && parentIds.has(m.personId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <div className="rounded-[2rem] border bg-card shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b bg-muted/10">
        <h2 className="text-xl font-black">My To-Dos</h2>
        <p className="text-xs font-bold text-muted-foreground opacity-60 mt-0.5">Personal reminders</p>
      </div>
      <div className="p-4 space-y-2">
        {uncompleted.length === 0 ? (
          <p className="text-xs font-bold text-muted-foreground opacity-50 py-4 text-center">
            Nothing here yet — add something to remember.
          </p>
        ) : (
          uncompleted.map(memo => {
            const person = persons.find(p => p.id === memo.personId);
            return (
              <div key={memo.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/20 transition-all">
                <button onClick={() => toggleMemoCompletion(memo.id)}
                  className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors">
                  <Circle className="w-5 h-5" />
                </button>
                <span className="flex-1 text-sm font-bold truncate">{memo.title}</span>
                {person && (
                  <span className="text-[10px] font-bold text-muted-foreground/50 shrink-0">
                    {person.name.split(' ')[0]}
                  </span>
                )}
              </div>
            );
          })
        )}
        <button onClick={() => router.push('/todos')}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs font-black text-primary hover:underline mt-1">
          <Plus className="w-3 h-3" /> Add to-do
        </button>
      </div>
    </div>
  );
}

// ── Streak Alert ──────────────────────────────────────────────────────────────

function StreakAlert() {
  const { goals, persons, checklists, checklistCompletions, settings } = useStore();
  const router = useRouter();
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  if (now.getHours() < 12) return null;

  const activeGoals = goals.filter(g => g.status === 'active');
  const atRisk: { kid: typeof persons[0]; goal: typeof goals[0] }[] = [];

  activeGoals.forEach(goal => {
    const kid = persons.find(p => p.id === goal.childId);
    if (!kid) return;

    const kidChecklists = checklists.filter(cl =>
      cl.countForScoring !== false &&
      (cl.assignedTo === kid.id || cl.assignedTo === 'all' || cl.assignedTo === 'kids')
    );
    if (kidChecklists.length === 0) return;

    const allItems = kidChecklists.flatMap(cl =>
      cl.items.map((_, idx) => ({ checklistId: cl.id, itemIndex: idx }))
    );
    const doneItems = allItems.filter(({ checklistId, itemIndex }) => {
      const key = `${today}_${kid.id}_${checklistId}_${itemIndex}`;
      return checklistCompletions.find(c => c.id === key)?.completed;
    }).length;

    if (doneItems === 0) atRisk.push({ kid, goal });
  });

  if (atRisk.length === 0) return null;

  const hoursLeft = 23 - now.getHours();
  const names = atRisk.map(r => getPersonName(r.kid, settings.language)).join(' and ');
  const title = atRisk.length === 1
    ? `${names}'s ${atRisk[0].goal.successCriteria.targetDays}-day streak is at risk`
    : `${names} both have streaks at risk today`;
  const subtitle = atRisk.length === 1
    ? `They haven't completed their routine yet — ${hoursLeft} hours left today.`
    : `They haven't completed their routines yet — ${hoursLeft} hours left today.`;

  return (
    <div className="rounded-[2rem] border-2 border-amber-200 bg-amber-50 px-6 py-5 flex items-center gap-5">
      <div className="bg-orange-500 rounded-2xl p-3 shrink-0">
        <Flame className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-black text-amber-900">{title}</p>
        <p className="text-sm font-bold text-amber-700 opacity-80 mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={() => router.push('/checklists')}
        className="shrink-0 flex items-center gap-1 border-2 border-emerald-600 text-emerald-700 font-black text-xs px-4 py-2 rounded-2xl hover:bg-emerald-50 transition-all"
      >
        View routine <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const today = new Date();
  const { series: s, overrides } = useStore();
  const eventCount = getOccurrencesForDate(s, today, overrides).length;

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-16">

        <GreetingBar />

        <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6">
          {/* Left — Today's Schedule */}
          <div className="min-h-[500px] flex flex-col">
            <TodaySchedule />
          </div>

          {/* Right — Kids + Todos stacked */}
          <div className="space-y-6">
            <KidsOnTrack />
            <MyTodos />
          </div>
        </div>

        <StreakAlert />

      </div>
    </AppLayout>
  );
}
