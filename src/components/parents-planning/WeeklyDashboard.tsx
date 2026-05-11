"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonName, getAvatarUrl, cn } from '@/lib/utils';
import { getTranslation } from '@/lib/i18n';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus, Sparkles, AlertCircle } from 'lucide-react';
import { addDays } from 'date-fns';

export function WeeklyDashboard({ selectedDate }: { selectedDate: Date }) {
  const { executionLogs, parentLogs, persons, settings } = useStore();
  const t = getTranslation(settings.language);
  const pt = t.parentsPlanningFull;
  const kids = persons.filter(p => p.id === 'person1' || p.id === 'person2');

  const last7DaysStart = addDays(selectedDate, -7);
  const previous7DaysStart = addDays(selectedDate, -14);

  const calculateStats = (childId: string, startDate: Date, endDate: Date) => {
    const logs = executionLogs.filter(l => 
      l.childId === childId && 
      new Date(l.date) >= startDate && 
      new Date(l.date) <= endDate
    );

    if (logs.length === 0) return { completionRate: 0, avgDelayRatio: 1, totalTasks: 0 };

    const completed = logs.filter(l => l.completed).length;

    let totalExpected = 0;
    let totalActual = 0;
    logs.filter(l => l.completed).forEach(l => {
      totalExpected += l.expectedTimeSeconds || 60;
      totalActual += l.completionTimeSeconds || 60;
    });

    return {
      completionRate: logs.length > 0 ? completed / logs.length : 0,
      avgDelayRatio: totalExpected > 0 ? totalActual / totalExpected : 1,
      totalTasks: logs.length
    };
  };

  const aggregateParentItems = (childId: string) => {
    const last7DaysLogs = parentLogs.filter(l => 
      l.childId === childId && 
      new Date(l.date) >= last7DaysStart &&
      new Date(l.date) <= selectedDate
    );

    const goodCounts: Record<string, number> = {};
    const badCounts: Record<string, number> = {};

    last7DaysLogs.forEach(log => {
      (log.goodItems || []).forEach(item => {
        goodCounts[item] = (goodCounts[item] || 0) + 1;
      });
      (log.badItems || []).forEach(item => {
        badCounts[item] = (badCounts[item] || 0) + 1;
      });
    });

    const topGood = Object.entries(goodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    const topBad = Object.entries(badCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    return { topGood, topBad };
  };

  return (
    <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-muted/10 pb-4 border-b">
        <CardTitle className="text-2xl font-black flex items-center gap-2">
          {pt.weeklyDashboard}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {kids.map(kid => {
            const currentStats = calculateStats(kid.id, last7DaysStart, selectedDate);
            const prevStats = calculateStats(kid.id, previous7DaysStart, last7DaysStart);
            const insights = aggregateParentItems(kid.id);

            const trend = currentStats.completionRate > prevStats.completionRate 
              ? 'up' : currentStats.completionRate < prevStats.completionRate 
              ? 'down' : 'stable';

            return (
              <div key={kid.id} className="border-2 rounded-[3rem] p-8 relative overflow-hidden bg-muted/5 flex flex-col gap-8 transition-all hover:border-primary/30" style={{ borderColor: `${kid.color}30` }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow-md shrink-0" style={{ borderColor: kid.color }}>
                    <Image 
                      src={getAvatarUrl(kid.id)} 
                      alt={kid.name} 
                      width={64} 
                      height={64} 
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black" style={{ color: kid.color }}>{getPersonName(kid, settings.language)}</h3>
                    <div className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
                      {pt.trend}: 
                      {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                      {trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
                      {trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-50">{pt.completion}</p>
                    <p className="text-4xl font-black">{(currentStats.completionRate * 100).toFixed(0)}%</p>
                  </div>
                  <div className="col-span-2 bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-50">{pt.delayRatio}</p>
                      <p className="text-2xl font-black">{currentStats.avgDelayRatio.toFixed(1)}x <span className="text-xs font-bold text-muted-foreground ml-2 opacity-60">({pt.ideal})</span></p>
                    </div>
                  </div>
                </div>

                {/* Insights from Parent Logs */}
                <div className="space-y-6 pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 px-2">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">{pt.topGood}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insights.topGood.length > 0 ? insights.topGood.map(item => (
                        <span key={item} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-black border border-emerald-200">{item}</span>
                      )) : <span className="text-xs font-bold text-muted-foreground/40 px-2 italic">No data yet</span>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 px-2">
                      <AlertCircle className="w-4 h-4" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">{pt.topBad}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insights.topBad.length > 0 ? insights.topBad.map(item => (
                        <span key={item} className="bg-rose-100 text-rose-700 px-4 py-2 rounded-2xl text-xs font-black border border-rose-200">{item}</span>
                      )) : <span className="text-xs font-bold text-muted-foreground/40 px-2 italic">No data yet</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
