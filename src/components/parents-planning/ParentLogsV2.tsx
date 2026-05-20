"use client"

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPersonName, getAvatarUrl, cn } from '@/lib/utils';
import {
  MessageSquare, Plus, X, Check, Smile, Meh, Frown,
  Loader2, Trash2, BookOpen, ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ParentLog, Person } from '@/lib/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const MoodIcon = ({ mood }: { mood: 'good' | 'neutral' | 'bad' }) => {
  if (mood === 'good') return <Smile className="w-5 h-5 text-emerald-500" />;
  if (mood === 'bad') return <Frown className="w-5 h-5 text-rose-500" />;
  return <Meh className="w-5 h-5 text-amber-500" />;
};

const moodColors = {
  good: 'border-emerald-200 bg-emerald-50',
  neutral: 'border-amber-200 bg-amber-50',
  bad: 'border-rose-200 bg-rose-50',
};

// ── Saved log card ─────────────────────────────────────────────────────────────

function LogCard({ log, onDelete }: { log: ParentLog; onDelete: () => void }) {
  const hasContent = !!(log.note || (log.goodItems?.length ?? 0) > 0 || (log.badItems?.length ?? 0) > 0);
  const [expanded, setExpanded] = useState(true);
  return (
    <div className={cn('rounded-3xl border-2 p-4 flex flex-col gap-3', moodColors[log.overallMood])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MoodIcon mood={log.overallMood} />
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70">
            {log.overallMood === 'good' ? '😊 Good day' : log.overallMood === 'bad' ? '😔 Tough day' : '😐 Neutral'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasContent && (
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-xl hover:bg-white/60 transition-all">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 rounded-xl hover:bg-white/60 transition-all text-rose-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && hasContent && (
        <>
          {(log.goodItems?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-70">✅ Good</p>
              <div className="flex flex-wrap gap-1.5">
                {log.goodItems!.map((item, i) => (
                  <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-2xl text-xs font-bold border border-emerald-200">{item}</span>
                ))}
              </div>
            </div>
          )}
          {(log.badItems?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 opacity-70">⚠️ Needs Work</p>
              <div className="flex flex-wrap gap-1.5">
                {log.badItems!.map((item, i) => (
                  <span key={i} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-2xl text-xs font-bold border border-rose-200">{item}</span>
                ))}
              </div>
            </div>
          )}
          {log.note && (
            <p className="text-sm font-medium text-muted-foreground bg-white/60 rounded-2xl p-3 border">
              💬 {log.note}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Per-kid section (fully independent) ───────────────────────────────────────

interface Draft {
  mood: 'good' | 'neutral' | 'bad';
  moodSet: boolean;   // true once user explicitly taps a mood
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

    // Flush any pending inline inputs
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

    // Close form and show confirmation after a short delay
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
      className="rounded-[2rem] border-2 p-5 space-y-4"
      style={{ borderColor: `${kid.color}40`, background: `${kid.color}06` }}
    >
      {/* Kid header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: kid.color }}>
          <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={44} height={44} className="object-cover w-full h-full" />
        </div>
        <span className="font-black text-xl" style={{ color: kid.color }}>
          {getPersonName(kid, lang as any)}
        </span>

        {/* "Saved!" banner — appears right next to the name */}
        {savedBanner && (
          <span className="ml-auto flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved!
          </span>
        )}
      </div>

      {/* Existing logs for this kid */}
      {logs.length > 0 && (
        <div className="space-y-3">
          {logs.map(log => (
            <LogCard key={log.id} log={log} onDelete={() => handleDelete(log.id)} />
          ))}
        </div>
      )}

      {/* Compose form (open for this kid) */}
      {draft !== null ? (
        <div className="space-y-4 pt-1">
          {/* Note */}
          <textarea
            value={draft.note}
            onChange={e => update({ note: e.target.value })}
            autoFocus
            className="w-full h-24 rounded-2xl border-2 p-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white/70"
            placeholder={`What happened today with ${getPersonName(kid, lang as any)}?`}
          />

          {/* Good / Needs Work items */}
          {(['good', 'bad'] as const).map(type => {
            const items = type === 'good' ? draft.goodItems : draft.badItems;
            const newVal = type === 'good' ? draft.newGood : draft.newBad;
            const color = type === 'good' ? 'emerald' : 'rose';
            const label = type === 'good' ? '✅ Good Things' : '⚠️ Needs Work';
            return (
              <div key={type} className="space-y-2">
                <p className={`text-[10px] font-black uppercase tracking-widest text-${color}-600 opacity-70`}>{label}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {items.map((item, i) => (
                    <span
                      key={i}
                      className={`bg-${color}-100 text-${color}-700 px-3 py-1.5 rounded-2xl text-xs font-bold border border-${color}-200 flex items-center gap-1.5`}
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
                      placeholder="Type & press Enter..."
                      className={`rounded-xl border-2 border-${color}-200 px-3 py-1.5 text-xs font-medium w-40 focus:outline-none focus:ring-1 focus:ring-${color}-400 bg-white/70`}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Mood picker */}
          <div className="flex gap-2">
            {(['good', 'neutral', 'bad'] as const).map(m => (
              <button
                key={m}
                onClick={() => update({ mood: m, moodSet: true })}
                className={cn(
                  'flex-1 rounded-2xl py-2.5 border-2 flex flex-col items-center gap-1 transition-all font-black text-[10px] uppercase',
                  draft.mood === m && draft.moodSet
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-muted bg-white/40 hover:border-muted-foreground/30'
                )}
              >
                <MoodIcon mood={m} />
                {m}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasContent || saving}
              className="flex-1 h-12 rounded-2xl font-black gap-2 text-white"
              style={{ background: hasContent ? kid.color : undefined }}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Check className="w-4 h-4" /> Save for {getPersonName(kid, lang as any)}</>}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(null)}
              disabled={saving}
              className="rounded-2xl px-5 font-black"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* "Add log" trigger button */
        <button
          onClick={() => setDraft(emptyDraft())}
          className="w-full h-11 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-black transition-all hover:opacity-70 active:scale-[0.98]"
          style={{ borderColor: `${kid.color}50`, color: kid.color }}
        >
          <Plus className="w-4 h-4" />
          Add log for {getPersonName(kid, lang as any)}
        </button>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

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

      <CardContent className="p-6 space-y-4">
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
