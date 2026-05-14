"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonName, getAvatarUrl, calculateStreak } from '@/lib/utils';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function PointsEngine() {
  const { executionLogs, persons, settings } = useStore();
  const kids = persons.filter(p => p.role === 'child');
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-amber-50 pb-4 border-b border-amber-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-amber-600">
          <Star className="w-6 h-6 fill-amber-400 stroke-none" />
          Today's Stars
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {kids.map(kid => {
          const todayLogs = executionLogs.filter(l => l.childId === kid.id && l.date === today && l.completed);
          const streak = calculateStreak(kid.id, executionLogs);

          // 10 pts per completed task + 2 pts per streak day bonus
          const taskPoints = todayLogs.length * 10;
          const streakBonus = streak > 1 ? (streak - 1) * 2 : 0;
          const total = taskPoints + streakBonus;

          const starCount = Math.min(5, Math.floor(total / 10));

          return (
            <div
              key={kid.id}
              className="rounded-3xl p-5 flex items-center gap-5"
              style={{ backgroundColor: `${kid.color}08`, border: `2px solid ${kid.color}20` }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm shrink-0" style={{ borderColor: kid.color }}>
                <Image
                  src={getAvatarUrl(kid.id, kid.avatarUrl)}
                  alt={kid.name}
                  width={64}
                  height={64}
                  className={cn(
                    'object-cover w-full h-full',
                    kid.id === 'person1' && 'scale-110 translate-y-2',
                    kid.id === 'person2' && 'scale-150 translate-y-2'
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-lg font-black" style={{ color: kid.color }}>
                  {getPersonName(kid, settings.language)}
                </div>

                {/* Star rating */}
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn('w-5 h-5 transition-all', i < starCount ? 'fill-amber-400 stroke-none scale-110' : 'fill-muted stroke-none opacity-30')}
                    />
                  ))}
                </div>

                {streak > 1 && (
                  <div className="text-xs font-bold text-amber-600/70 mt-1">
                    +{streakBonus} streak bonus 🔥
                  </div>
                )}
              </div>

              <div className="shrink-0 text-center">
                <div className="text-4xl font-black" style={{ color: kid.color }}>{total}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">pts</div>
              </div>
            </div>
          );
        })}

        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest text-center">
          10 pts per task · 2 pts per streak day
        </p>
      </CardContent>
    </Card>
  );
}
