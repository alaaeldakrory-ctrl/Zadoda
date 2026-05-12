"use client"

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPersonName, calculateStreak } from '@/lib/utils';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, getDay } from 'date-fns';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Suggestion {
  title: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-rose-50 border-rose-200 text-rose-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-rose-100 text-rose-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-emerald-100 text-emerald-600',
};

export function RoutineCoach() {
  const { executionLogs, persons, settings } = useStore();
  const kids = persons.filter(p => p.role === 'child');
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const buildPrompt = () => {
    const past14 = Array.from({ length: 14 }, (_, i) => subDays(new Date(), i + 1));

    const kidSummaries = kids.map(kid => {
      const logs14 = executionLogs.filter(l =>
        l.childId === kid.id &&
        new Date(l.date) >= subDays(new Date(), 14)
      );
      const streak = calculateStreak(kid.id, executionLogs);
      const completed = logs14.filter(l => l.completed).length;
      const completionPct = logs14.length > 0 ? Math.round((completed / logs14.length) * 100) : 0;

      // Day-of-week breakdown
      const dayBreakdown = DAY_LABELS.map((day, idx) => {
        const daysOfWeekday = past14.filter(d => getDay(d) === idx);
        const rates = daysOfWeekday.map(d => {
          const ds = format(d, 'yyyy-MM-dd');
          const dl = logs14.filter(l => l.date === ds);
          if (!dl.length) return null;
          return dl.filter(l => l.completed).length / dl.length;
        }).filter((r): r is number => r !== null);
        const avg = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length * 100) : null;
        return avg !== null ? `${day}: ${avg}%` : null;
      }).filter(Boolean).join(', ');

      return `${getPersonName(kid, settings.language)}: ${completionPct}% completion over 14 days, current streak ${streak} day(s). Day breakdown — ${dayBreakdown || 'no data yet'}.`;
    }).join('\n');

    return `You are a warm, encouraging family routine coach. Based on the following data about our kids' daily routine completion over the past 2 weeks, give 4 specific and actionable suggestions to help improve things. Be practical and kind — not clinical.

${kidSummaries}

Respond ONLY with a valid JSON array (no markdown fences) in this exact shape:
[{"title":"short title","suggestion":"1-2 sentence advice","priority":"high"|"medium"|"low"}]`;
  };

  const getCoaching = async () => {
    if (!apiKey) { setError('Gemini API key not configured.'); return; }
    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt() }] }],
            generationConfig: { temperature: 0.7 },
          }),
        }
      );

      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed: Suggestion[] = JSON.parse(cleaned);
      setSuggestions(parsed);
    } catch {
      setError('Could not get suggestions right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-violet-50/50 pb-4 border-b border-violet-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-violet-600">
          <Sparkles className="w-6 h-6" />
          AI Routine Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {suggestions.length === 0 && !loading && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-muted-foreground font-bold mb-6 max-w-sm mx-auto">
              Tap below and I'll analyse the last 2 weeks of your family's routine and suggest improvements.
            </p>
            <button
              onClick={getCoaching}
              className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-black py-3 px-8 rounded-2xl transition-all shadow-lg shadow-violet-200"
            >
              Get Suggestions
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 py-8 text-violet-600">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-bold text-muted-foreground">Analysing your family's patterns…</p>
          </div>
        )}

        {error && (
          <p className="text-center text-rose-500 font-bold py-4">{error}</p>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${PRIORITY_STYLE[s.priority]}`}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_BADGE[s.priority]}`}>
                      {s.priority}
                    </span>
                    <span className="font-black text-base leading-tight truncate">{s.title}</span>
                  </div>
                  {expanded === i ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </div>
                {expanded === i && (
                  <p className="mt-3 font-medium text-sm leading-relaxed opacity-90">{s.suggestion}</p>
                )}
              </div>
            ))}

            <button
              onClick={getCoaching}
              className="w-full mt-2 text-xs font-black uppercase tracking-wider text-violet-500 hover:text-violet-700 transition-colors py-2"
            >
              Refresh suggestions ↺
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
