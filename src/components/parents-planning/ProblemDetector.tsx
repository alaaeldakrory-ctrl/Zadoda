"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonName, getAvatarUrl } from '@/lib/utils';
import { getTranslation } from '@/lib/i18n';
import { AlertTriangle, Info, Clock, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { addDays } from 'date-fns';

interface Problem {
  id: string;
  type: 'low_completion' | 'low_independence' | 'high_delay';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  childId: string;
  actions: { label: string, onClick: () => void }[];
}

export function ProblemDetector() {
  const { executionLogs, persons, settings } = useStore();
  const t = getTranslation(settings.language);
  const pt = t.parentsPlanningFull;
  
  const kids = persons.filter(p => p.id === 'person1' || p.id === 'person2');

  const now = new Date();
  const last3Days = addDays(now, -3);

  const generateProblems = (): Problem[] => {
    const problems: Problem[] = [];

    kids.forEach(kid => {
      const recentLogs = executionLogs.filter(l => 
        l.childId === kid.id && 
        new Date(l.date) >= last3Days
      );

      if (recentLogs.length === 0) return;

      const completed = recentLogs.filter(l => l.completed).length;
      const independent = recentLogs.filter(l => l.completed && l.completionType === 'independent').length;
      
      const completionRate = completed / recentLogs.length;
      const independenceRate = completed > 0 ? independent / completed : 0;

      let totalExpected = 0;
      let totalActual = 0;
      recentLogs.filter(l => l.completed).forEach(l => {
        totalExpected += l.expectedTimeSeconds || 60;
        totalActual += l.completionTimeSeconds || 60;
      });
      const avgDelayRatio = totalExpected > 0 ? totalActual / totalExpected : 1;

      // Only trigger if there is enough data
      if (recentLogs.length >= 3) {
        if (completionRate < 0.6) {
          problems.push({
            id: `${kid.id}-completion`,
            childId: kid.id,
            type: 'low_completion',
            title: 'Routine Failing',
            message: 'Overall routines are failing frequently.',
            severity: 'high',
            actions: [
              { label: 'Simplify Routine', onClick: () => alert('Opening Routine Editor... (Suggested: remove tasks)') }
            ]
          });
        }

        if (independenceRate < 0.5 && completed > 0) {
          problems.push({
            id: `${kid.id}-independence`,
            childId: kid.id,
            type: 'low_independence',
            title: 'High Dependency',
            message: 'Needs help on most tasks.',
            severity: 'medium',
            actions: [
              { label: 'Simplify Routine', onClick: () => alert('Opening Routine Editor...') },
              { label: 'Reduce Steps', onClick: () => alert('Auto-suggesting removal of lowest priority tasks...') },
              { label: 'Reward Independence', onClick: () => alert('Opening Reward Settings to add independence bonus...') }
            ]
          });
        }

        if (avgDelayRatio > 1.5 && completed > 0) {
          problems.push({
            id: `${kid.id}-delay`,
            childId: kid.id,
            type: 'high_delay',
            title: 'Too Slow',
            message: 'Tasks are taking much longer than expected.',
            severity: 'low',
            actions: [
              { label: 'Adjust Expected Time', onClick: () => alert('Opening Time Adjuster...') },
              { label: 'Add Time Limit Bonus', onClick: () => alert('Opening Reward Settings...') }
            ]
          });
        }
      }
    });

    return problems;
  };

  const problems = generateProblems();

  return (
    <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-amber-50/50 pb-4 border-b border-amber-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-6 h-6" />
          {pt.problemZones}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {problems.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
            <h3 className="text-xl font-black text-emerald-600">{pt.everythingGreat}</h3>
            <p className="text-muted-foreground font-medium mt-1">{pt.noIssues}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {problems.map(p => {
              const kid = persons.find(person => person.id === p.childId);
              if (!kid) return null;

              return (
                <div key={p.id} className="border-l-4 rounded-r-2xl p-4 bg-muted/5 flex items-start gap-4" style={{ borderLeftColor: p.severity === 'high' ? '#EF4444' : p.severity === 'medium' ? '#F59E0B' : '#3B82F6' }}>
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1">
                    <Image src={getAvatarUrl(kid.id)} alt={kid.name} width={40} height={40} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black" style={{ color: kid.color }}>{getPersonName(kid, settings.language)}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${p.severity === 'high' ? 'bg-red-100 text-red-600' : p.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {p.severity}
                      </span>
                      <span className="font-black text-lg ml-2">{p.title}</span>
                    </div>
                    <p className="font-bold text-lg leading-tight mb-4 text-muted-foreground">{p.message}</p>
                    <div className="flex flex-wrap items-start gap-3">
                      {p.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={action.onClick}
                          className="bg-white hover:bg-primary/5 text-primary text-sm font-black py-2 px-4 rounded-xl border-2 border-primary/20 shadow-sm transition-all min-h-[44px] min-w-[44px] active:scale-95 touch-manipulation flex items-center justify-center"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
