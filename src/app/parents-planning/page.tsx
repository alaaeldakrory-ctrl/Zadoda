"use client"

import React, { useEffect } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { Layers, Settings as SettingsIcon, Target } from 'lucide-react';
import { WeeklyDashboard } from '@/components/parents-planning/WeeklyDashboard';
import { ProblemDetector } from '@/components/parents-planning/ProblemDetector';
import { PointsEngine } from '@/components/parents-planning/PointsEngine';
import { ParentLogsV2 } from '@/components/parents-planning/ParentLogsV2';
import { DailySummaryCard } from '@/components/parents-planning/DailySummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParentsPlanningPage() {
  const { settings, isParentUnlocked } = useStore();
  const t = getTranslation(settings.language);
  const router = useRouter();

  // Redirect if accessed directly without unlock
  useEffect(() => {
    if (!isParentUnlocked) {
      router.push('/');
    }
  }, [isParentUnlocked, router]);

  if (!isParentUnlocked) return null;

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-32">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Layers className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">{t.parentsPlanningFull.parentsPlanning}</h1>
          </div>
        </div>
        
        <DailySummaryCard />
        
        <ProblemDetector />

        <WeeklyDashboard />

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
            <ParentLogsV2 />
            
            <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                <CardTitle className="text-2xl font-black flex items-center gap-2 text-slate-600">
                  <SettingsIcon className="w-6 h-6" />
                  {t.parentsPlanningFull.systemAdjustments}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">{t.parentsPlanningFull.suggestions}</p>
                  <div className="bg-muted/10 p-4 rounded-2xl border">
                    <p className="font-bold text-sm">💡 Suggestion: Shorten Morning Routine</p>
                    <p className="text-xs text-muted-foreground mt-1">Average completion time is exceeding expectations by 1.2x. Consider breaking it into smaller tasks.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
