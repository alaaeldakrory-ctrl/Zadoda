"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Layers, Target, ChevronLeft, ChevronRight, CalendarDays, BookOpen, Brain, Flame, CheckCircle2, PauseCircle, Trash2 } from 'lucide-react';
import { WeeklyDashboard } from '@/components/parents-planning/WeeklyDashboard';
import { ProblemDetector } from '@/components/parents-planning/ProblemDetector';
import { ParentLogsV2 } from '@/components/parents-planning/ParentLogsV2';
import { DailySummaryCard } from '@/components/parents-planning/DailySummaryCard';
import { ParentSelfJournal } from '@/components/parents-planning/ParentSelfJournal';
import { PointsEngine } from '@/components/parents-planning/PointsEngine';
import { DayOfWeekInsights } from '@/components/parents-planning/DayOfWeekInsights';
import { RoutineCoach } from '@/components/parents-planning/RoutineCoach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GoalCreateModal } from '@/components/parents-planning/GoalCreateModal';
import { cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import { format, addDays, isSameDay } from 'date-fns';
import Image from 'next/image';

type Tab = 'overview' | 'goals' | 'logs' | 'insights';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
  { id: 'logs', label: 'Logs & Journal', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'insights', label: 'AI Insights', icon: <Brain className="w-4 h-4" /> },
];

export default function ParentsPlanningPage() {
  const { settings, goals, persons, deleteGoal, updateGoal } = useStore();
  const t = getTranslation(settings.language);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-32">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t.parentsPlanning}</h1>
        </div>

        {/* Global Date Navigator */}
        <div className="flex items-center justify-between bg-card border rounded-[2rem] px-6 py-4 shadow-sm">
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

        {!isToday && (
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 px-2"
          >
            ↩ Back to Today
          </button>
        )}

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl w-full overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-all flex-1 justify-center",
                activeTab === tab.id
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <ErrorBoundary label="Daily Summary">
              <DailySummaryCard selectedDate={selectedDate} />
            </ErrorBoundary>
            <ErrorBoundary label="Points Engine">
              <PointsEngine />
            </ErrorBoundary>
            <ErrorBoundary label="Problem Detector">
              <ProblemDetector />
            </ErrorBoundary>
          </div>
        )}

        {/* Tab: Goals */}
        {activeTab === 'goals' && (
          <div className="space-y-8">
            <GoalCreateModal open={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
            <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
              <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black flex items-center gap-2 text-blue-600">
                  <Target className="w-6 h-6" />
                  {t.parentsPlanningFull.activeGoals}
                </CardTitle>
                <button
                  onClick={() => setGoalModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white font-black text-sm px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors"
                >
                  + Create Goal
                </button>
              </CardHeader>
              <CardContent className="p-8">
                {goals.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-black text-lg">{t.parentsPlanningFull.noGoals}</h3>
                    <p className="text-sm font-medium">{t.parentsPlanningFull.createGoal}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map(goal => {
                      const kid = persons.find(p => p.id === goal.childId);
                      return (
                        <div key={goal.id} className="flex items-center gap-4 p-4 rounded-2xl border-2 bg-muted/5"
                          style={{ borderColor: kid ? `${kid.color}40` : undefined }}>
                          {kid && (
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: kid.color }}>
                              <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={48} height={48} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-base truncate">{goal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <span className="text-xs font-bold text-muted-foreground">
                                {goal.successCriteria.targetDays}-day streak · {kid ? getPersonName(kid, settings.language) : ''}
                              </span>
                              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider',
                                goal.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                goal.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                              )}>
                                {goal.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {goal.status === 'active' && (
                              <button onClick={() => updateGoal(goal.id, { status: 'completed' })}
                                className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-all" title="Mark complete">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {goal.status === 'active' && (
                              <button onClick={() => updateGoal(goal.id, { status: 'paused' })}
                                className="p-2 rounded-xl hover:bg-amber-50 text-amber-600 transition-all" title="Pause">
                                <PauseCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => { if (confirm('Delete this goal?')) deleteGoal(goal.id); }}
                              className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition-all" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Logs & Journal */}
        {activeTab === 'logs' && (
          <div className="space-y-8">
            <ErrorBoundary label="Parent Logs">
              <ParentLogsV2 key={format(selectedDate, 'yyyy-MM-dd')} selectedDate={selectedDate} />
            </ErrorBoundary>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 opacity-70 px-3">My Parenting Journal</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
              </div>
              <ErrorBoundary label="Parent Journal">
                <ParentSelfJournal key={format(selectedDate, 'yyyy-MM-dd')} selectedDate={selectedDate} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Tab: AI Insights */}
        {activeTab === 'insights' && (
          <div className="space-y-8">
            <ErrorBoundary label="Weekly Dashboard">
              <WeeklyDashboard selectedDate={selectedDate} />
            </ErrorBoundary>
            <ErrorBoundary label="Day of Week Insights">
              <DayOfWeekInsights />
            </ErrorBoundary>
            <ErrorBoundary label="Routine Coach">
              <RoutineCoach />
            </ErrorBoundary>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
