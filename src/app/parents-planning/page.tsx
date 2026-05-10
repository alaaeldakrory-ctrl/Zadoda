"use client"

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { Layers, Target, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { WeeklyDashboard } from '@/components/parents-planning/WeeklyDashboard';
import { ProblemDetector } from '@/components/parents-planning/ProblemDetector';
import { ParentLogsV2 } from '@/components/parents-planning/ParentLogsV2';
import { DailySummaryCard } from '@/components/parents-planning/DailySummaryCard';
import { ParentSelfJournal } from '@/components/parents-planning/ParentSelfJournal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ParentsPlanningPage() {
  const { settings, isParentUnlocked } = useStore();
  const t = getTranslation(settings.language);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!isParentUnlocked) router.push('/');
  }, [isParentUnlocked, router]);

  if (!isParentUnlocked) return null;

  const isToday = isSameDay(selectedDate, new Date());
  const isFuture = selectedDate > new Date();

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-32">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t.parentsPlanningFull.parentsPlanning}</h1>
        </div>

        {/* ── Global Date Navigator ── */}
        <div className="flex items-center justify-between bg-white border-2 rounded-[2rem] px-6 py-4 shadow-sm">
          <button
            onClick={() => setSelectedDate(d => addDays(d, -1))}
            className="p-2 hover:bg-muted/30 rounded-xl transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
          </button>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-primary">
              <CalendarDays className="w-5 h-5" />
              <span className="text-xl font-black">
                {isToday ? '📅 Today' : format(selectedDate, 'EEE, MMM d')}
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground opacity-60">
              {format(selectedDate, 'EEEE, MMMM d yyyy')}
            </span>
          </div>

          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            disabled={isToday}
            className="p-2 hover:bg-muted/30 rounded-xl transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Jump to today if on a past day */}
        {!isToday && (
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 px-2"
          >
            ↩ Back to Today
          </button>
        )}

        {/* Daily stats */}
        <DailySummaryCard selectedDate={selectedDate} />

        {/* Problem zones */}
        <ProblemDetector />

        {/* Weekly overview */}
        <WeeklyDashboard selectedDate={selectedDate} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden h-full">
              <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
                <CardTitle className="text-2xl font-black flex items-center gap-2 text-blue-600">
                  <Target className="w-6 h-6" />
                  {t.parentsPlanningFull.activeGoals}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center py-8 opacity-50">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-black text-lg">{t.parentsPlanningFull.noGoals}</h3>
                  <p className="text-sm font-medium">{t.parentsPlanningFull.createGoal}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <ParentLogsV2 selectedDate={selectedDate} />
          </div>
        </div>

        {/* ── Parent Self-Reflection Journal ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 opacity-70 px-3">My Parenting Journal</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
          </div>
          <ParentSelfJournal selectedDate={selectedDate} />
        </div>

      </div>
    </AppLayout>
  );
}
