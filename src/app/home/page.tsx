"use client"

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getOccurrencesForDate, formatTime, getPersonName, timeToMinutes } from '@/lib/utils';
import { format } from 'date-fns';
import { Sun, CloudRain, Cloud, Plus, CheckCircle2, Flame, CalendarDays, Users, StickyNote } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Weather ───────────────────────────────────────────────────────────────────

interface WeatherInfo { label: string; icon: 'sun' | 'rain' | 'cloud'; }

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
          label = wm >= 61 ? `Raining · ${temp}°C` : `Rain in ~${nextRainHour - currentHour}h`;
          icon = 'rain';
        } else if (wm >= 2) {
          label = `Cloudy · ${temp}°C`;
          icon = 'cloud';
        } else {
          label = `Sunny · ${temp}°C`;
          icon = 'sun';
        }
        setWeather({ label, icon });
      } catch {}
    }, () => {});
  }, []);
  return weather;
}

// ── Hex → rgba helper ─────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Section 1: Greeting Bar ───────────────────────────────────────────────────

function GreetingBar() {
  const { settings, currentUser, persons, series, overrides } = useStore();
  const weather = useWeather();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.displayName?.split(' ')[0] || 'there';
  const today = new Date();
  const eventCount = getOccurrencesForDate(series, today, overrides).length;

  // Parents first, then children
  const sortedPersons = [...persons].sort((a, b) =>
    a.role === b.role ? 0 : a.role === 'parent' ? -1 : 1
  );

  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-5"
      style={{ backgroundColor: '#2D6A4F', borderRadius: 14 }}
    >
      {/* Left: greeting */}
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <Sun style={{ width: 18, height: 18, color: 'white', flexShrink: 0 }} />
          <span style={{ fontSize: 19, color: 'white', fontWeight: 500 }}>
            {greeting}, {firstName}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 400 }}>
          {format(today, 'EEEE, MMMM d')} · {settings.familyName || 'Your'} Family · {eventCount} event{eventCount !== 1 ? 's' : ''} today
        </p>
      </div>

      {/* Right: overlapping avatar bubbles + weather pill */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center">
          {sortedPersons.map((person, i) => (
            <div
              key={person.id}
              style={{
                width: 36, height: 36,
                borderRadius: '50%',
                backgroundColor: person.color,
                border: '2.5px solid #2D6A4F',
                marginLeft: i === 0 ? 0 : -8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                zIndex: sortedPersons.length - i,
                flexShrink: 0,
              }}
            >
              <span style={{ color: 'white', fontSize: 12, fontWeight: 500, lineHeight: 1 }}>
                {person.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {weather && (
          <div
            className="flex items-center gap-1.5 text-white"
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 12px' }}
          >
            <WeatherIcon type={weather.icon} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{weather.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 2: Today's Schedule ───────────────────────────────────────────────

function TodaySchedule() {
  const { series, overrides, persons, settings } = useStore();
  const router = useRouter();
  const today = new Date();
  const nowMins = today.getHours() * 60 + today.getMinutes();

  const occurrences = getOccurrencesForDate(series, today, overrides)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const visible = occurrences.slice(0, 6);
  const extra = occurrences.length - 6;

  const getColor = (personId: string) => {
    if (personId === 'all' || personId === 'kids') return '#9B59B6';
    return persons.find(p => p.id === personId)?.color || '#2D6A4F';
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ borderRadius: 14, border: '0.5px solid var(--border)', overflow: 'hidden' }}
    >
      {/* Colored header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ backgroundColor: '#2D6A4F', padding: '11px 14px' }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays style={{ width: 16, height: 16, color: 'white' }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Today's schedule</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
          {format(today, 'EEE, MMM d')}
        </span>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto bg-white" style={{ padding: '10px 14px 4px' }}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ opacity: 0.35 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>No events today</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>A free day!</p>
          </div>
        ) : (
          visible.map((occ, idx) => {
            const startMins = timeToMinutes(occ.startTime);
            const endMins = timeToMinutes(occ.endTime);
            const isNow = nowMins >= startMins && nowMins <= endMins;
            const isPast = !isNow && (nowMins > endMins || occ.completed);
            const color = getColor(occ.personId);
            const person = occ.personId !== 'all' && occ.personId !== 'kids'
              ? persons.find(p => p.id === occ.personId)
              : null;

            if (isNow) {
              return (
                <div
                  key={occ.id}
                  className="flex items-center gap-3 my-1"
                  style={{
                    backgroundColor: '#F0FAF4',
                    border: '1px solid #A8D5B5',
                    borderRadius: 8,
                    padding: '8px 10px',
                    marginLeft: -4,
                    marginRight: -4,
                  }}
                >
                  <div style={{ minWidth: 44, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 500 }}>
                      {formatTime(occ.startTime)}
                    </span>
                  </div>
                  <div style={{ width: 3, borderRadius: 2, alignSelf: 'stretch', minHeight: 28, backgroundColor: color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1A4731' }} className="truncate">
                      {occ.title}
                    </p>
                    {person && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#6B7280' }} className="truncate">
                          {getPersonName(person, settings.language)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      backgroundColor: '#2D6A4F', color: 'white',
                      fontSize: 10, fontWeight: 500,
                      borderRadius: 4, padding: '2px 7px', flexShrink: 0,
                    }}
                  >
                    NOW
                  </span>
                </div>
              );
            }

            return (
              <div
                key={occ.id}
                className="flex items-center gap-3"
                style={{
                  padding: '8px 0',
                  borderBottom: idx < visible.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                <div style={{ minWidth: 44, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {formatTime(occ.startTime)}
                  </span>
                </div>
                <div style={{ width: 3, borderRadius: 2, alignSelf: 'stretch', minHeight: 28, backgroundColor: color, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 700 }} className="truncate">
                    {occ.title}
                  </p>
                  {person && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#9CA3AF' }} className="truncate">
                        {getPersonName(person, settings.language)}
                      </span>
                    </div>
                  )}
                </div>
                {isPast && (
                  <CheckCircle2 style={{ width: 15, height: 15, color: '#10B981', flexShrink: 0 }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="bg-white flex items-center justify-between shrink-0"
        style={{ borderTop: '0.5px solid var(--border)', padding: '10px 14px' }}
      >
        {extra > 0 ? (
          <button
            onClick={() => router.push('/')}
            style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 700 }}
            className="hover:underline"
          >
            + {extra} more
          </button>
        ) : <span />}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
          style={{ fontSize: 12, color: '#6B7280', fontWeight: 700 }}
        >
          <Plus style={{ width: 12, height: 12 }} /> Add event
        </button>
      </div>
    </div>
  );
}

// ── Section 3: Kids on Track ───────────────────────────────────────────────────

function KidsOnTrack() {
  const { persons, chores, choreOverrides, checklists, checklistCompletions, settings } = useStore();
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const kids = persons.filter(p => p.role === 'child');

  const CIRCUMFERENCE = 188.5; // 2 * π * 30

  return (
    <div style={{ borderRadius: 14, border: '0.5px solid var(--border)', overflow: 'hidden' }}>
      {/* Colored header */}
      <div
        className="flex items-center justify-between"
        style={{ backgroundColor: '#E8713A', padding: '11px 14px' }}
      >
        <div className="flex items-center gap-2">
          <Users style={{ width: 16, height: 16, color: 'white' }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Kids on track</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Today</span>
      </div>

      {/* Card body */}
      <div className="bg-white" style={{ padding: '20px 14px 16px' }}>
        {kids.length === 0 ? (
          <p className="text-center py-4" style={{ fontSize: 13, color: '#9CA3AF' }}>No children added yet</p>
        ) : (
          <div className="flex gap-3 justify-around flex-wrap">
            {kids.map(kid => {
              // Chores
              const kidChoreOverrides = choreOverrides.filter(o => o.date === today);
              const kidChores = kidChoreOverrides.filter(o => {
                const chore = chores.find(c => c.id === o.choreId);
                return chore && (o.assignedTo === kid.id || chore.defaultAssignedTo === kid.id);
              });
              const doneChores = kidChores.filter(o => o.completed).length;
              const totalChores = kidChores.length;

              // Routine (scored checklists only)
              const kidChecklists = checklists.filter(cl =>
                cl.countForScoring !== false &&
                (cl.assignedTo === kid.id || cl.assignedTo === 'all' || cl.assignedTo === 'kids')
              );
              const allItems = kidChecklists.flatMap(cl =>
                cl.items.map((_, idx) => ({ checklistId: cl.id, itemIndex: idx }))
              );
              const doneItems = allItems.filter(({ checklistId, itemIndex }) => {
                const key = `${today}_${kid.id}_${checklistId}_${itemIndex}`;
                return checklistCompletions.find(c => c.id === key)?.completed;
              }).length;
              const totalItems = allItems.length;

              // Overall %
              const total = totalChores + totalItems;
              const done = doneChores + doneItems;
              const pct = total === 0 ? 0 : (done / total) * 100;
              const dashArray = `${(pct * CIRCUMFERENCE) / 100} ${CIRCUMFERENCE}`;

              const trackColor = hexToRgba(kid.color, 0.15);
              const innerBg = hexToRgba(kid.color, 0.11);
              const initials = kid.name.slice(0, 2).toUpperCase();

              // Pill styles
              const choresDone = totalChores > 0 && doneChores === totalChores;
              const routineDone = totalItems > 0 && doneItems === totalItems;

              return (
                <button
                  key={kid.id}
                  onClick={() => router.push(`/checklists?personId=${kid.id}`)}
                  className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                  style={{ minWidth: 80 }}
                >
                  {/* SVG ring */}
                  <svg width={80} height={80} viewBox="0 0 80 80">
                    {/* Track ring */}
                    <circle cx={40} cy={40} r={30} fill="none" stroke={trackColor} strokeWidth={7} />
                    {/* Progress arc */}
                    <circle
                      cx={40} cy={40} r={30}
                      fill="none"
                      stroke={kid.color}
                      strokeWidth={7}
                      strokeLinecap="round"
                      strokeDasharray={dashArray}
                      transform="rotate(-90 40 40)"
                    />
                    {/* Inner tinted circle */}
                    <circle cx={40} cy={40} r={22} fill={innerBg} />
                    {/* Initials */}
                    <text
                      x={40} y={44}
                      textAnchor="middle"
                      fontSize={13}
                      fill={kid.color}
                      fontWeight={500}
                    >
                      {initials}
                    </text>
                  </svg>

                  {/* Name */}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {getPersonName(kid, settings.language)}
                  </span>

                  {/* Status pills */}
                  <div className="flex flex-col items-center gap-1">
                    {totalChores > 0 && (
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 500,
                        backgroundColor: choresDone ? '#DCFCE7' : doneChores > 0 ? '#FEF3C7' : '#F3F4F6',
                        color: choresDone ? '#166534' : doneChores > 0 ? '#92400E' : '#6B7280',
                      }}>
                        {choresDone ? 'All done!' : `${doneChores}/${totalChores} chores`}
                      </span>
                    )}
                    {totalItems > 0 && (
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 500,
                        backgroundColor: routineDone ? '#DCFCE7' : '#FEF3C7',
                        color: routineDone ? '#166534' : '#92400E',
                      }}>
                        {routineDone ? 'Routine done' : 'Routine pending'}
                      </span>
                    )}
                    {totalChores === 0 && totalItems === 0 && (
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>No tasks</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 4: My To-Dos ──────────────────────────────────────────────────────

function MyTodos() {
  const { memos, persons, toggleMemoCompletion } = useStore();
  const router = useRouter();
  const parents = persons.filter(p => p.role === 'parent');
  const parentIds = new Set(parents.map(p => p.id));

  const allUncompleted = memos.filter(m => !m.completed && parentIds.has(m.personId));
  const visible = allUncompleted.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const pendingCount = allUncompleted.length;

  return (
    <div style={{ borderRadius: 14, border: '0.5px solid var(--border)', overflow: 'hidden' }}>
      {/* Colored header */}
      <div
        className="flex items-center justify-between"
        style={{ backgroundColor: '#6C5CE7', padding: '11px 14px' }}
      >
        <div className="flex items-center gap-2">
          <StickyNote style={{ width: 16, height: 16, color: 'white' }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>My to-dos</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
          {pendingCount} pending
        </span>
      </div>

      {/* Card body */}
      <div className="bg-white" style={{ padding: '8px 14px 12px' }}>
        {visible.length === 0 ? (
          <p className="text-center py-5" style={{ fontSize: 13, color: '#9CA3AF' }}>
            Nothing here yet — all clear!
          </p>
        ) : (
          visible.map((memo, idx) => {
            const person = persons.find(p => p.id === memo.personId);
            return (
              <div
                key={memo.id}
                className="flex items-center gap-3"
                style={{
                  padding: '10px 0',
                  borderBottom: idx < visible.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                {/* Numbered circle */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: '#EDE7F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 10, color: '#5E35B1', fontWeight: 600 }}>{idx + 1}</span>
                </div>

                {/* To-do text — clicking checks it off */}
                <button
                  onClick={() => toggleMemoCompletion(memo.id)}
                  className="flex-1 text-left hover:opacity-60 transition-opacity min-w-0"
                >
                  <span className="block truncate" style={{ fontSize: 13 }}>{memo.title}</span>
                </button>

                {/* Assignee name */}
                {person && (
                  <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>
                    {person.name.split(' ')[0]}
                  </span>
                )}
              </div>
            );
          })
        )}

        <button
          onClick={() => router.push('/todos')}
          className="w-full flex items-center justify-center gap-1 hover:opacity-70 transition-opacity"
          style={{ paddingTop: 10, fontSize: 12, color: '#6C5CE7', fontWeight: 700 }}
        >
          <Plus style={{ width: 12, height: 12 }} /> Add to-do
        </button>
      </div>
    </div>
  );
}

// ── Section 5: Streak Alert (two-tone banner) ─────────────────────────────────

function StreakAlert() {
  const { goals, persons, checklists, checklistCompletions, settings } = useStore();
  const router = useRouter();
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  if (now.getHours() < 12) return null;

  const atRisk: { kid: typeof persons[0]; goal: typeof goals[0] }[] = [];

  goals.filter(g => g.status === 'active').forEach(goal => {
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
    ? `${names}'s streak is at risk today`
    : `${names} both have streaks at risk today`;

  const firstKidChecklists = checklists.filter(cl =>
    cl.countForScoring !== false &&
    (cl.assignedTo === atRisk[0].kid.id || cl.assignedTo === 'all' || cl.assignedTo === 'kids')
  );
  const routineName = firstKidChecklists[0]?.title || 'their routine';
  const description = `They haven't completed ${routineName} yet — ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left to keep the streak alive.`;

  return (
    <div style={{ borderRadius: 14, border: '0.5px solid #FFCC02', overflow: 'hidden' }}>
      {/* Top strip — deep orange */}
      <div
        className="flex items-center gap-3"
        style={{ backgroundColor: '#FF8C00', padding: '10px 14px' }}
      >
        <Flame style={{ width: 20, height: 20, color: 'white', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'white', fontWeight: 500, flex: 1 }}>{title}</span>
        <span style={{
          background: 'rgba(255,255,255,0.25)', color: 'white',
          fontSize: 11, fontWeight: 500, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
        }}>
          {atRisk[0].goal.successCriteria.targetDays}d streak
        </span>
      </div>

      {/* Bottom body — warm amber */}
      <div
        className="flex items-center justify-between gap-4"
        style={{ backgroundColor: '#FFF8E1', padding: '10px 14px' }}
      >
        <p style={{ fontSize: 12, color: '#7B4F00', flex: 1 }}>{description}</p>
        <button
          onClick={() => router.push('/checklists')}
          style={{
            border: '1.5px solid #2D6A4F', color: '#2D6A4F',
            background: 'none', borderRadius: 8,
            padding: '5px 13px', fontSize: 12, fontWeight: 600,
            flexShrink: 0, cursor: 'pointer',
          }}
        >
          View routine
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto space-y-5 pb-16">
        <GreetingBar />

        <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-5 items-start">
          {/* Left — Today's Schedule (tall) */}
          <div style={{ minHeight: 480 }} className="flex flex-col">
            <TodaySchedule />
          </div>

          {/* Right — Kids on Track + My To-Dos stacked */}
          <div className="space-y-5">
            <KidsOnTrack />
            <MyTodos />
          </div>
        </div>

        <StreakAlert />
      </div>
    </AppLayout>
  );
}
