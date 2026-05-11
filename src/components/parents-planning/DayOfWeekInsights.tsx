"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonName, getAvatarUrl } from '@/lib/utils';
import { BarChart2 } from 'lucide-react';
import Image from 'next/image';
import { format, subDays, getDay } from 'date-fns';
import { cn } from '@/lib/utils';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DayOfWeekInsights() {
  const { executionLogs, persons, settings } = useStore();
  const kids = persons.filter(p => p.id === 'person1' || p.id === 'person2');

  // Last 28 days
  const past28 = Array.from({ length: 28 }, (_, i) => subDays(new Date(), i + 1));

  const getKidDayStats = (kidId: string) => {
    return DAY_LABELS.map((label, dayIdx) => {
      const daysOfWeekday = past28.filter(d => getDay(d) === dayIdx);
      const rates = daysOfWeekday
        .map(d => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayLogs = executionLogs.filter(l => l.childId === kidId && l.date === dateStr);
          if (dayLogs.length === 0) return null;
          return dayLogs.filter(l => l.completed).length / dayLogs.length;
        })
        .filter((r): r is number => r !== null);

      const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
      return { label, dayIdx, avg, sampleCount: rates.length };
    });
  };

  const noData = executionLogs.length === 0;

  return (
    <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-indigo-600">
          <BarChart2 className="w-6 h-6" />
          Day-of-Week Patterns
          <span className="text-xs font-bold text-muted-foreground/50 ml-2 normal-case tracking-normal">last 4 weeks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {noData && (
          <p className="text-center text-muted-foreground font-bold py-8 opacity-50">
            Not enough data yet — keep logging for a few days!
          </p>
        )}

        {!noData && kids.map(kid => {
          const stats = getKidDayStats(kid.id);
          const withData = stats.filter(s => s.avg !== null);
          if (withData.length === 0) return null;

          const maxAvg = Math.max(...withData.map(s => s.avg!));
          const minAvg = Math.min(...withData.map(s => s.avg!));
          const bestDay = stats.find(s => s.avg === maxAvg);
          const worstDay = stats.find(s => s.avg === minAvg && s !== bestDay);

          return (
            <div key={kid.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: kid.color }}>
                  <Image src={getAvatarUrl(kid.id)} alt={kid.name} width={40} height={40} className="object-cover w-full h-full" />
                </div>
                <span className="font-black text-lg" style={{ color: kid.color }}>
                  {getPersonName(kid, settings.language)}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {stats.map(s => {
                  const pct = s.avg !== null ? Math.round(s.avg * 100) : null;
                  const isBest = s === bestDay;
                  const isWorst = s === worstDay;

                  return (
                    <div key={s.dayIdx} className="flex flex-col items-center gap-1.5">
                      <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">
                        {s.label}
                      </div>
                      <div className="w-full h-20 rounded-xl flex flex-col items-center justify-end overflow-hidden bg-muted/10 relative">
                        {pct !== null && (
                          <div
                            className="w-full rounded-xl transition-all duration-500"
                            style={{
                              height: `${Math.max(8, pct)}%`,
                              backgroundColor: isBest
                                ? '#34D399'
                                : isWorst
                                ? '#F87171'
                                : kid.color + '80',
                            }}
                          />
                        )}
                        {pct === null && (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 text-lg">–</div>
                        )}
                      </div>
                      <div className={cn(
                        "text-[10px] font-black",
                        isBest ? "text-emerald-600" : isWorst ? "text-rose-500" : "text-muted-foreground/60"
                      )}>
                        {pct !== null ? `${pct}%` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs font-bold">
                {bestDay?.avg !== null && (
                  <span className="text-emerald-600">✅ Best: {bestDay?.label} ({Math.round(bestDay!.avg! * 100)}%)</span>
                )}
                {worstDay?.avg !== null && worstDay?.avg !== maxAvg && (
                  <span className="text-rose-500">⚠️ Toughest: {worstDay?.label} ({Math.round(worstDay!.avg! * 100)}%)</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
