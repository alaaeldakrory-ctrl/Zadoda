"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonName, getAvatarUrl } from '@/lib/utils';
import { Trophy, Star, Award } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

export function PointsEngine() {
  const { executionLogs, persons, settings } = useStore();
  const kids = persons.filter(p => p.id === 'person1' || p.id === 'person2');

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-primary">
          <Trophy className="w-6 h-6" />
          Rewards & Points
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 gap-6">
          {kids.map(kid => {
            const todayLogs = executionLogs.filter(l => l.childId === kid.id && l.date === today);
            
            let points = 0;
            todayLogs.forEach(l => {
              if (l.completed) {
                points += 10;
                if (l.completedIndependently) {
                  points += 5;
                }
              }
            });

            return (
              <div key={kid.id} className="flex items-center justify-between border-b last:border-0 pb-6 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: kid.color }}>
                    <Image src={getAvatarUrl(kid.id)} alt={kid.name} width={56} height={56} className="object-cover w-full h-full" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black" style={{ color: kid.color }}>{getPersonName(kid, settings.language)}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Points Today</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-2xl">
                  <Star className="w-6 h-6 fill-primary stroke-none" />
                  <span className="text-3xl font-black">{points}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
