"use client"

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPersonName, getAvatarUrl, cn } from '@/lib/utils';
import {
  MessageSquare, Plus, X, Check,
  Loader2, Trash2, BookOpen, CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ParentLog, Person } from '@/lib/types';

// ── Mood config ─────────────────────────────────────────────────────────────────

const MOODS = {
  good: { emoji: '😊', label: 'Good Day', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  neutral: { emoji: '😐', label: 'Okay Day', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  bad: { emoji: '😔', label: 'Tough Day', bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
} as const;

// ── Saved log card — always expanded, large readable text ───────────────────────

function LogCard({ log, onDelete }: { log: ParentLog; onDelete: () => void }) {
  const mood = MOODS[log.overallMood];

  return (
    <div className={cn('rounded-3xl border-2 p-5 space-y-4', mood.bg, mood.border)}>
      {/* Mood badge + delete */}
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex items-center gap-2 text-base font-black px-4 py-1.5 rounded-full', mood.badge)}>
          <span className="text-xl">{mood.emoji}</span>
          {mood.label}
        </span>
        <button
          onClick={onDelete}
          className="p-2 rounded-xl hover:bg-white/70 transition-all text-rose-400 hover:text-rose-600"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Note — big and easy to read */}
      {log.note && (
        <p className="text-base font-semibold leading-relaxed text-gray-800 bg-white/70 rounded-2xl p-4 border border-white/80">
          {log.note}
        </p>
      )}

      {/* Good things */}
      {(log.goodItems?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700 opacity-80">✅ Good Things</p>
          <div className="flex flex-wrap gap-2">
            {log.goodItems!.map((item, i) => (
              <span key={i} className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-2xl text-sm font-bold border border-emerald-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Needs work */}
      {(log.badItems?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-rose-700 opacity-80">⚠️ Needs Work</p>
          <div className="flex flex-wrap gap-2">
            {log.badItems!.map((item, i) => (
              <span key={i} className="bg-rose-100 text-rose-800 px-4 py-1.5 rounded-2xl text-sm font-bold border border-rose-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Per-kid draft state ─────────────────────────────────────────────────────────

interface Draft {
  mood: 'good' | 'neutral' | 'bad';
  moodSet: boolean;
  goodItems: string[];
  badItems: string[];
  note: string;
  newGood: string;
  newBad: string;
}

const emptyDraft = (): Draft => ({
  mood: 'neutral', moodSet: false,
  goodItems: [], badItems: [],
  note: '', newGood: '', newBad: '',
});

// ── Per-kid section ─────────────────────────────────────────────────────────────

function KidSection({
  kid, logs, dateStr, lang,
  addParentLog, deleteParentLog,
}: {
  kid: Person;
  logs: ParentLog[];
  dateStr: string;
  lang: string;
  addParentLog: (log: Omit<ParentLog, 'id'>) => void;
  deleteParentLog: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const update = (changes: Partial<Draft>) =>
    setDraft(prev => prev ? { ...prev, ...changes } : prev);

  const addItem = (type: 'good' | 'bad') => {
    if (!draft) return;
    const val = type === 'good' ? draft.newGood.trim() : draft.newBad.trim();
    if (!val) return;
    if (type === 'good') update({ goodItems: [...draft.goodItems, val], newGood: '' });
    else update({ badItems: [...draft.badItems, val], newBad: '' });
  };

  const removeItem = (type: 'good' | 'bad', i: number) => {
    if (!draft) return;
    if (type === 'good') update({ goodItems: draft.goodItems.filter((_, j) => j !== i) });
    else update({ badItems: draft.badItems.filter((_, j) => j !== i) });
  };

  const hasContent = !!(
    draft?.note.trim() ||
    (draft?.goodItems.length ?? 0) > 0 ||
    (draft?.badItems.length ?? 0) > 0 ||
    draft?.newGood.trim() ||
    draft?.newBad.trim() ||
    draft?.moodSet
  );

  const handleSave = () => {
    if (!draft || saving || !hasContent) return;
    setSaving(true);

    const goodItems = draft.newGood.trim()
      ? [...draft.goodItems, draft.newGood.trim()]
      : draft.goodItems;
    const badItems = draft.newBad.trim()
      ? [...draft.badItems, draft.newBad.trim()]
      : draft.badItems;

    addParentLog({
      childId: kid.id,
      date: dateStr,
      overallMood: draft.mood,
      goodItems,
      badItems,
      note: draft.note.trim() || undefined,
    });

    setTimeout(() => {
      setSaving(false);
      setDraft(null);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3500);
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this log entry?')) deleteParentLog(id);
  };

  return (
    <div
      className="rounded-[2rem] border-2 p-6 space-y-5"
      style={{ borderColor: `${kid.color}50`, background: `${kid.color}08` }}
    >
      {/* Kid header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden border-3 shrink-0 shadow-sm" style={{ borderColor: kid.color, borderWidth: 3 }}>
          <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={48} height={48} className="object-cover w-full h-full" />
        </div>
        <span className="font-black text-2xl" style={{ color: kid.color }}>
          {getPersonName(kid, lang as any)}
        </span>

        {savedBanner && (
          <span className="ml-auto flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-black px-4 py-2 rounded-full shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            Saved!
          </span>
        )}
      </div>

      {/* Existing logs — always fully visible */}
      {logs.length > 0 && (
        <div className="space-y-4">
          {logs.map(log => (
            <LogCard key={log.id} log={log} onDelete={() => handleDelete(log.id)} />
          ))}
        </div>
      )}

      {/* Compose form */}
      {draft !== null ? (
        <div className="space-y-5 pt-1">
          {/* Note textarea — large and comfortable */}
          <textarea
            value={draft.note}
            onChange={e => update({ note: e.target.value })}
            autoFocus
            className="w-full h-28 rounded-2xl border-2 p-4 text-base font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white/80"
            placeholder={`What happened today with ${getPersonName(kid, lang as any)}?`}
          />

          {/* Good / Needs Work chips */}
          {(['good', 'bad'] as const).map(type => {
            const items = type === 'good' ? draft.goodItems : draft.badItems;
            const newVal = type === 'good' ? draft.newGood : draft.newBad;
            const color = type === 'good' ? 'emerald' : 'rose';
            const label = type === 'good' ? '✅ Good Things' : '⚠️ Needs Work';
            return (
              <div key={type} className="space-y-2">
                <p className={`text-xs font-black uppercase tracking-widest text-${color}-700`}>{label}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {items.map((item, i) => (
                    <span
                      key={i}
                      className={`bg-${color}-100 text-${color}-800 px-4 py-1.5 rounded-2xl text-sm font-bold border border-${color}-200 flex items-center gap-1.5`}
                    >
                      {item}
                      <button onClick={() => removeItem(type, i)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {items.length < 5 && (
                    <input
                      value={newVal}
                      onChange={e => update(type === 'good' ? { newGood: e.target.value } : { newBad: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(type); } }}
                      onBlur={() => addItem(type)}
                      placeholder="Type & press Enter…"
                      className={`rounded-xl border-2 border-${color}-200 px-3 py-1.5 text-sm font-medium w-44 focus:outline-none focus:ring-1 focus:ring-${color}-400 bg-white/80`}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Mood picker */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Overall Mood</p>
            <div className="flex gap-3">
              {(['good', 'neutral', 'bad'] as const).map(m => {
                const cfg = MOODS[m];
                return (
                  <button
                    key={m}
                    onClick={() => update({ mood: m, moodSet: true })}
                    className={cn(
                      'flex-1 rounded-2xl py-3 border-2 flex flex-col items-center gap-1.5 transition-all font-black text-sm',
                      draft.mood === m && draft.moodSet
                        ? `${cfg.border} ${cfg.bg} ring-2 ring-offset-1`
                        : 'border-muted bg-white/40 hover:border-muted-foreground/30'
                    )}
                  >
                    <span className="text-2xl">{cfg.emoji}</span>
                    <span className={cn('text-xs', draft.mood === m && draft.moodSet ? cfg.text : 'text-muted-foreground')}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasContent || saving}
              className="flex-1 h-12 rounded-2xl font-black gap-2 text-white text-base"
              style={{ background: hasContent ? kid.color : undefined }}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Check className="w-4 h-4" /> Save for {getPersonName(kid, lang as any)}</>}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(null)}
              disabled={saving}
              className="rounded-2xl px-6 font-black"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setDraft(emptyDraft())}
          className="w-full h-12 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-base font-black transition-all hover:opacity-70 active:scale-[0.98]"
          style={{ borderColor: `${kid.color}60`, color: kid.color }}
        >
          <Plus className="w-5 h-5" />
          Add log for {getPersonName(kid, lang as any)}
        </button>
      )}
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────────

export function ParentLogsV2({ selectedDate }: { selectedDate: Date }) {
  const { persons, settings, parentLogs, addParentLog, deleteParentLog } = useStore();
  const t = getTranslation(settings.language);
  const pt = t.parentsPlanningFull;
  const kids = persons.filter(p => p.role === 'child');
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayLogs = parentLogs.filter(l => l.date === dateStr && kids.some(k => k.id === l.childId));

  return (
    <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
          <MessageSquare className="w-6 h-6" />
          {pt.parentLogs}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {kids.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-black text-sm">No children added yet</p>
          </div>
        ) : (
          kids.map(kid => (
            <KidSection
              key={kid.id}
              kid={kid}
              logs={todayLogs.filter(l => l.childId === kid.id)}
              dateStr={dateStr}
              lang={settings.language}
              addParentLog={addParentLog}
              deleteParentLog={deleteParentLog}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
