"use client"

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPersonName, getAvatarUrl, cn } from '@/lib/utils';
import {
  MessageSquare, Plus, X, Check, Smile, Meh, Frown,
  Wand2, Loader2, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ParentLog, Person } from '@/lib/types';

const MoodIcon = ({ mood }: { mood: 'good' | 'neutral' | 'bad' }) => {
  if (mood === 'good') return <Smile className="w-5 h-5 text-emerald-500" />;
  if (mood === 'bad') return <Frown className="w-5 h-5 text-rose-500" />;
  return <Meh className="w-5 h-5 text-amber-500" />;
};

const moodColors = { good: 'border-emerald-200 bg-emerald-50', neutral: 'border-amber-200 bg-amber-50', bad: 'border-rose-200 bg-rose-50' };

// ── Existing log card ─────────────────────────────────────────────────────────
function ExistingLogCard({ log, onEdit, onDelete }: { log: ParentLog; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn('rounded-3xl border-2 p-5 flex flex-col gap-3', moodColors[log.overallMood])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MoodIcon mood={log.overallMood} />
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground opacity-60">
            {log.overallMood === 'good' ? '😊 Good day' : log.overallMood === 'bad' ? '😔 Tough day' : '😐 Neutral'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-xl hover:bg-white/60 transition-all">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-xl hover:bg-white/60 transition-all text-blue-500"><Pencil className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-xl hover:bg-white/60 transition-all text-rose-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {expanded && (
        <>
          {(log.goodItems?.length || 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-70">✅ Good</p>
              <div className="flex flex-wrap gap-1.5">
                {log.goodItems!.map((item, i) => (
                  <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-2xl text-xs font-bold border border-emerald-200">{item}</span>
                ))}
              </div>
            </div>
          )}
          {(log.badItems?.length || 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 opacity-70">⚠️ Needs Work</p>
              <div className="flex flex-wrap gap-1.5">
                {log.badItems!.map((item, i) => (
                  <span key={i} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-2xl text-xs font-bold border border-rose-200">{item}</span>
                ))}
              </div>
            </div>
          )}
          {log.note && <p className="text-sm font-medium text-muted-foreground bg-white/60 rounded-2xl p-3 border">💬 {log.note}</p>}
        </>
      )}
    </div>
  );
}

// ── Per-kid draft card (inline editing) ───────────────────────────────────────
interface KidDraft {
  kidId: string;
  mood: 'good' | 'neutral' | 'bad';
  goodItems: string[];
  badItems: string[];
  note: string;
  newGood: string;
  newBad: string;
}

function KidDraftCard({ kid, draft, onChange, lang }: {
  kid: Person; draft: KidDraft;
  onChange: (d: Partial<KidDraft>) => void;
  lang: string;
}) {
  const addItem = (type: 'good' | 'bad') => {
    const val = type === 'good' ? draft.newGood : draft.newBad;
    if (!val.trim()) return;
    if (type === 'good') onChange({ goodItems: [...draft.goodItems, val.trim()], newGood: '' });
    else onChange({ badItems: [...draft.badItems, val.trim()], newBad: '' });
  };

  return (
    <div className="rounded-3xl border-2 p-5 space-y-4" style={{ borderColor: `${kid.color}40`, background: `${kid.color}04` }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: kid.color }}>
          <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={40} height={40} className="object-cover w-full h-full" />
        </div>
        <span className="font-black text-lg" style={{ color: kid.color }}>{getPersonName(kid, lang as any)}</span>
      </div>

      <textarea
        value={draft.note}
        onChange={e => onChange({ note: e.target.value })}
        className="w-full h-20 rounded-2xl border-2 p-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white/60"
        placeholder="Notes about this child today..."
      />

      {(['good', 'bad'] as const).map(type => {
        const items = type === 'good' ? draft.goodItems : draft.badItems;
        const newVal = type === 'good' ? draft.newGood : draft.newBad;
        const label = type === 'good' ? '✅ Good Things' : '⚠️ Needs Work';
        const color = type === 'good' ? 'emerald' : 'rose';
        return (
          <div key={type} className="space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-widest text-${color}-600 opacity-70`}>{label}</p>
            <div className="flex flex-wrap gap-2 items-center">
              {items.map((item, i) => (
                <span key={i} className={`bg-${color}-100 text-${color}-700 px-3 py-1.5 rounded-2xl text-xs font-bold border border-${color}-200 flex items-center gap-1.5`}>
                  {item}
                  <button onClick={() => {
                    const next = items.filter((_, j) => j !== i);
                    onChange(type === 'good' ? { goodItems: next } : { badItems: next });
                  }}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {items.length < 5 && (
                <div className="flex items-center gap-1">
                  <input
                    value={newVal}
                    onChange={e => onChange(type === 'good' ? { newGood: e.target.value } : { newBad: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(type); } }}
                    onBlur={() => addItem(type)}
                    placeholder="Add, press Enter..."
                    className={`rounded-xl border-2 border-${color}-200 px-3 py-1.5 text-xs font-medium w-36 focus:outline-none focus:ring-1 focus:ring-${color}-400`}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex gap-2">
        {(['good', 'neutral', 'bad'] as const).map(m => (
          <button key={m} onClick={() => onChange({ mood: m })}
            className={cn('flex-1 rounded-2xl py-2 border-2 flex flex-col items-center gap-0.5 transition-all font-black text-[10px] uppercase',
              draft.mood === m ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted bg-muted/10 hover:border-muted-foreground/30')}>
            <MoodIcon mood={m} />
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ParentLogsV2({ selectedDate }: { selectedDate: Date }) {
  const { persons, settings, parentLogs, addParentLog, updateParentLog, deleteParentLog } = useStore();
  const t = getTranslation(settings.language);
  const pt = t.parentsPlanningFull;
  const kids = persons.filter(p => p.role === 'child');
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayLogs = parentLogs.filter(l => kids.some(k => k.id === l.childId) && l.date === dateStr);

  const initDrafts = (): KidDraft[] => kids.map(k => ({
    kidId: k.id, mood: 'neutral', goodItems: [], badItems: [], note: '', newGood: '', newBad: '',
  }));

  const [mode, setMode] = useState<'view' | 'compose'>('view');
  const [universalNote, setUniversalNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drafts, setDrafts] = useState<KidDraft[]>([]);

  const updateDraft = (kidId: string, updates: Partial<KidDraft>) => {
    setDrafts(prev => prev.map(d => d.kidId === kidId ? { ...d, ...updates } : d));
  };

  const handleSmartFill = async () => {
    if (!universalNote.trim() || isAnalyzing || !apiKey) return;
    setIsAnalyzing(true);
    try {
      const kidNames = kids.map(k => `${getPersonName(k, settings.language)} (id: ${k.id})`).join(', ');
      const prompt = `You are a behavioral assistant helping parents log their children's day.
The family has these children: ${kidNames}.

The parent wrote:
"${universalNote}"

For each child, extract:
- goodItems: up to 5 short Arabic phrases for positive behaviors
- badItems: up to 5 short Arabic phrases for concerns
- overallMood: "good" | "neutral" | "bad"
- note: 1-2 sentence Arabic summary (empty string if not mentioned)

Return ONLY valid JSON, no markdown:
{"children": [{"id": "childId", "goodItems": [], "badItems": [], "overallMood": "neutral", "note": ""}]}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 2048 } }) }
      );
      if (!response.ok) throw new Error('API request failed');
      const result = await response.json();
      const raw = result.candidates[0].content.parts[0].text;
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const data = JSON.parse(text);
      setDrafts(prev => prev.map(draft => {
        const parsed = data.children?.find((c: any) => c.id === draft.kidId);
        if (!parsed) return draft;
        return { ...draft, goodItems: (parsed.goodItems || []).slice(0, 5), badItems: (parsed.badItems || []).slice(0, 5), mood: parsed.overallMood || 'neutral', note: parsed.note || '' };
      }));
    } catch (e: any) {
      alert(`Smart Fill failed: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    // flush any pending inline inputs before saving
    const toSave = drafts.map(d => ({
      ...d,
      goodItems: d.newGood.trim() ? [...d.goodItems, d.newGood.trim()] : d.goodItems,
      badItems: d.newBad.trim() ? [...d.badItems, d.newBad.trim()] : d.badItems,
    }));
    toSave.forEach(d => {
      addParentLog({
        childId: d.kidId,
        date: dateStr,
        overallMood: d.mood,
        goodItems: d.goodItems,
        badItems: d.badItems,
        note: d.note.trim() || undefined,
      });
    });
    setMode('view');
    setUniversalNote('');
    setDrafts([]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this log entry?')) deleteParentLog(id);
  };

  const canSave = drafts.some(d =>
    d.note.trim() || d.goodItems.length > 0 || d.badItems.length > 0 || d.newGood.trim() || d.newBad.trim()
  );

  return (
    <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
          <MessageSquare className="w-6 h-6" />
          {pt.parentLogs}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">

        {/* VIEW MODE */}
        {mode === 'view' && (
          <>
            {todayLogs.length === 0 ? (
              <div className="text-center py-8 opacity-40">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-black text-sm">No log for {format(selectedDate, 'MMM d')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {kids.map(kid => {
                  const kidLogs = todayLogs.filter(l => l.childId === kid.id);
                  if (kidLogs.length === 0) return null;
                  return (
                    <div key={kid.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden border" style={{ borderColor: kid.color }}>
                          <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={24} height={24} className="object-cover w-full h-full" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: kid.color }}>
                          {getPersonName(kid, settings.language)}
                        </span>
                      </div>
                      {kidLogs.map(log => (
                        <ExistingLogCard key={log.id} log={log}
                          onEdit={() => { /* edit flow can be added later */ }}
                          onDelete={() => handleDelete(log.id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            <Button
              type="button"
              onClick={() => { setDrafts(initDrafts()); setMode('compose'); }}
              className="w-full rounded-2xl font-black text-sm gap-2 h-12 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Log Today for All Kids
            </Button>
          </>
        )}

        {/* COMPOSE MODE — single screen: universal note + kid cards + save */}
        {mode === 'compose' && (
          <div className="space-y-6">

            {/* Universal note with optional Smart Fill */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  What happened today? (optional — AI will fill the cards below)
                </p>
                {apiKey && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleSmartFill}
                    disabled={universalNote.length < 10 || isAnalyzing}
                    className="h-8 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 font-black text-[10px] uppercase tracking-wider gap-1.5 px-3 border border-purple-200">
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    Smart Fill
                  </Button>
                )}
              </div>
              <textarea
                value={universalNote}
                onChange={e => setUniversalNote(e.target.value)}
                placeholder={`Write about all kids — e.g. "Lyla crushed homework, Malika had a rough bedtime again..."\n\nThen click Smart Fill to auto-fill the cards below, or fill them in yourself.`}
                className="w-full h-28 rounded-[1.5rem] border-2 p-4 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-muted/5 text-sm"
              />
            </div>

            {/* Per-kid cards */}
            {kids.map(kid => {
              const draft = drafts.find(d => d.kidId === kid.id);
              if (!draft) return null;
              return (
                <KidDraftCard
                  key={kid.id}
                  kid={kid}
                  draft={draft}
                  onChange={updates => updateDraft(kid.id, updates)}
                  lang={settings.language}
                />
              );
            })}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-2xl font-black gap-2 h-12"
              >
                <Check className="w-4 h-4" />
                Save Log
              </Button>
              <Button type="button" variant="outline" onClick={() => { setMode('view'); setDrafts([]); setUniversalNote(''); }}
                className="rounded-2xl px-6 font-black">
                Cancel
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
