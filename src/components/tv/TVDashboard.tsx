'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { format } from 'date-fns';
import {
  getOccurrencesForDate,
  formatTime,
  getEmojiForEvent,
  getPersonName,
  getAvatarUrl,
  calculateStreak,
  timeToMinutes,
  cn,
} from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Home, ChefHat } from 'lucide-react';
import { CURATED_RECIPES } from '@/components/meal-planner/curatedRecipes';
import { MealType } from '@/lib/types';

export const TVDashboard: React.FC = () => {
  const { persons, series, overrides, settings, executionLogs, isLoading, mealSlots, recipes } = useStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const kids = persons.filter(p => p.role === 'child');

  const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'lyla-breakfast', 'malika-breakfast', 'lyla-lunchbox', 'malika-lunchbox'];
  const MEAL_META: Record<MealType, { en: string; ar: string; emoji: string; color: string }> = {
    breakfast:          { en: 'Breakfast',      ar: 'الفطور',      emoji: '☀️', color: 'text-emerald-700' },
    lunch:              { en: 'Lunch',          ar: 'الغداء',      emoji: '🌤️', color: 'text-amber-700'  },
    dinner:             { en: 'Dinner',         ar: 'العشاء',      emoji: '🌙', color: 'text-blue-700'   },
    'lyla-breakfast':   { en: 'Lyla Brkfst',   ar: 'إفطار ليلى', emoji: '🌸', color: 'text-rose-700'   },
    'malika-breakfast': { en: 'Malika Brkfst',  ar: 'إفطار مالكة', emoji: '🌟', color: 'text-violet-700' },
    'lyla-lunchbox':    { en: 'Lyla Lunch',    ar: 'لنش ليلى',   emoji: '🌸', color: 'text-pink-700'   },
    'malika-lunchbox':  { en: 'Malika Lunch',  ar: 'لنش مالكة',  emoji: '🌟', color: 'text-purple-700' },
  };

  const resolveDishName = (dish: { recipeId?: string; freeText?: string }): string => {
    if (dish.recipeId?.startsWith('curated_')) {
      const c = CURATED_RECIPES.find(r => r.id === dish.recipeId);
      if (c) return `${c.emoji} ${c.name}`;
    }
    if (dish.recipeId) {
      const r = recipes.find(r => r.id === dish.recipeId);
      if (r) return r.name;
    }
    return dish.freeText || '';
  };

  const todaySlots = mealSlots.filter(s => s.date === todayStr);
  const isArabic = settings.language === 'ar';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
        <div className="text-7xl animate-pulse">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] p-6 flex flex-col gap-6 select-none">

      {/* ── Header: clock + date ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-3 leading-none">
            <span className="text-8xl font-black tabular-nums tracking-tight">
              {format(now, 'h:mm')}
            </span>
            <span className="text-4xl font-bold text-muted-foreground/60">
              {format(now, 'a')}
            </span>
          </div>
          <p className="text-2xl font-bold text-muted-foreground/50 mt-2">
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-muted/20 shadow-sm text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to App
        </Link>
      </div>

      {/* ── Today's Meals ── */}
      {todaySlots.length > 0 && (
        <div className="bg-white rounded-[2rem] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-black text-lg">
              {isArabic ? 'وجبات اليوم' : "Today's Meals"}
            </span>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
            {MEAL_TYPES.map(mealType => {
              const slot = todaySlots.find(s => s.mealType === mealType);
              const meta = MEAL_META[mealType];
              const dishes = slot?.dishes ?? [];
              return (
                <div key={mealType} className="rounded-2xl border bg-muted/10 p-3">
                  <div className={cn('flex items-center gap-1.5 mb-2', meta.color)}>
                    <span>{meta.emoji}</span>
                    <span className="text-xs font-black uppercase tracking-wide">
                      {isArabic ? meta.ar : meta.en}
                    </span>
                  </div>
                  {dishes.length > 0 ? (
                    <div className="space-y-1">
                      {dishes.map((dish, i) => (
                        <p key={i} className="text-sm font-bold leading-tight truncate">
                          {resolveDishName(dish)}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 font-medium">
                      {isArabic ? 'غير مخطط' : 'Not planned'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Kid columns ── */}
      <div className="flex-1 grid grid-cols-2 gap-6">
        {kids.map(person => {
          const allOccs = getOccurrencesForDate(series, today, overrides);
          const occurrences = allOccs
            .filter(occ =>
              occ.personId === person.id ||
              occ.personId === 'all' ||
              occ.personId === 'kids'
            )
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

          const streak = calculateStreak(person.id, executionLogs);
          const completedCount = occurrences.filter(o => o.completed).length;

          return (
            <div
              key={person.id}
              className="bg-white rounded-[2rem] flex flex-col overflow-hidden shadow-sm"
              style={{ borderTop: `6px solid ${person.color}` }}
            >
              {/* Person header */}
              <div className="flex items-center gap-4 p-6 pb-4">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-4 shadow-md"
                  style={{ borderColor: person.color }}
                >
                  <Image
                    src={getAvatarUrl(person.id, person.avatarUrl)}
                    alt={person.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-3xl font-black leading-tight" style={{ color: person.color }}>
                    {getPersonName(person, settings.language)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-sm font-bold text-muted-foreground/60">
                      {completedCount}/{occurrences.length} done
                    </span>
                    {streak > 0 && (
                      <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-0.5 text-sm font-black text-amber-600">
                        🔥 {streak} day{streak !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-muted/15 mx-6" />

              {/* Event list */}
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {occurrences.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-3">🏖️</div>
                    <p className="text-muted-foreground font-bold">Free day!</p>
                  </div>
                )}

                {occurrences.map(occ => {
                  const isPast = timeToMinutes(occ.endTime) <= nowMinutes;
                  const isNow =
                    timeToMinutes(occ.startTime) <= nowMinutes &&
                    timeToMinutes(occ.endTime) > nowMinutes;
                  const emoji = getEmojiForEvent(occ.title);

                  return (
                    <div
                      key={occ.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-2xl transition-all duration-300',
                        occ.completed && 'opacity-40 bg-green-50',
                        isNow && !occ.completed && 'scale-[1.02] shadow-md',
                        isPast && !occ.completed && 'opacity-25',
                        !isNow && !isPast && !occ.completed && 'bg-muted/5'
                      )}
                      style={
                        isNow && !occ.completed
                          ? { backgroundColor: `${person.color}10`, border: `2px solid ${person.color}40` }
                          : {}
                      }
                    >
                      <span className="text-2xl shrink-0">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'font-bold text-base leading-tight truncate',
                            occ.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          )}
                        >
                          {occ.title}
                        </div>
                        <div className="text-xs text-muted-foreground/50 font-medium mt-0.5">
                          {formatTime(occ.startTime)} – {formatTime(occ.endTime)}
                        </div>
                      </div>
                      {occ.completed && <span className="text-green-500 text-xl shrink-0">✅</span>}
                      {isNow && !occ.completed && (
                        <span
                          className="text-lg shrink-0 animate-pulse"
                          style={{ color: person.color }}
                        >
                          ▶
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
