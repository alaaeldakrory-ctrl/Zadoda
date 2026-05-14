"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonName, getAvatarUrl } from '@/lib/utils';
import { getTranslation } from '@/lib/i18n';
import { LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

function paceLabel(ratio: number): string {
  if (ratio < 1.0) return 'Ahead of schedule ✓';
  if (ratio <= 1.05) return 'On track ✓';
  if (ratio <= 1.5) return 'Slightly behind';
  return 'Needs attention';
}

function paceColor(ratio: number): string {
  if (ratio <= 1.05) return '#10B981';
  if (ratio <= 1.5) return '#F59E0B';
  return '#EF4444';
}

export function DailySummaryCard({ selectedDate }: { selectedDate: Date }) {
  const { executionLogs, persons, settings } = useStore();
  const t = getTranslation(settings.language);
  const pt = t.parentsPlanningFull;
  const kids = persons.filter(p => p.role === 'child');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  return (
    <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-primary">
          <LayoutDashboard className="w-6 h-6" />
          {pt.dailySummary}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {kids.map(kid => {
            const logs = executionLogs.filter(l => l.childId === kid.id && l.date === dateStr);
            const completed = logs.filter(l => l.completed).length;

            const completionRate = logs.length > 0 ? completed / logs.length : 0;

            let totalExpected = 0;
            let totalActual = 0;
            logs.filter(l => l.completed).forEach(l => {
              totalExpected += l.expectedTimeSeconds || 60;
              totalActual += l.completionTimeSeconds || 60;
            });
            const avgDelayRatio = totalExpected > 0 ? totalActual / totalExpected : 1;

            return (
              <div key={kid.id} className="border-2 rounded-3xl p-6 relative overflow-hidden bg-muted/5 flex flex-col gap-6" style={{ borderColor: `${kid.color}50` }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow-sm" style={{ borderColor: kid.color }}>
                    <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black" style={{ color: kid.color }}>{getPersonName(kid, settings.language)}</h3>
                    {logs.length === 0 && <p className="text-xs font-bold text-muted-foreground opacity-50 mt-1">No activity logged</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-2xl p-4 border col-span-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">{pt.completion}</p>
                    <p className="text-3xl font-black">{(completionRate * 100).toFixed(0)}%</p>
                  </div>
                  <div className="col-span-2 bg-muted/30 rounded-2xl p-4 border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Pace</p>
                      <p className="text-xl font-black" style={{ color: paceColor(avgDelayRatio) }}>{paceLabel(avgDelayRatio)}</p>
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
