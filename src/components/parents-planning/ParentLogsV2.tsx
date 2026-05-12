"use client"

import React, { useState, useRef, useEffect } from 'react';
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

// ── Mood helpers ──────────────────────────────────────────────────────────────
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

// ── Existing log card ─────────────────────────────────────────────────────────
function ExistingLogCard({
  log,
  onEdit,
  onDelete,
}: {
  log: ParentLog;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
          <button onClick={onEdit} className="p-1.5 rounded-xl hover:bg-white/60 transition-all text-blue-500">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-xl hover:bg-white/60 transition-all text-rose-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {(log.goodItems?.length || 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-70">✅ Good</p>
              <div className="flex flex-wrap gap-1.5">
                {log.goodItems!.map((item, i) => (
                  <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-2xl text-xs font-bold border border-emerald-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(log.badItems?.length || 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 opacity-70">⚠️ Needs Work</p>
              <div className="flex flex-wrap gap-1.5">
                {log.badItems!.map((item, i) => (
                  <span key={i} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-2xl text-xs font-bold border border-rose-200">
                    {item}
                  </span>
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

// ── Log form (add / edit) ─────────────────────────────────────────────────────
function LogForm({
  selectedDate,
  kidId,
  initial,
  onSave,
  onCancel,
}: {
  selectedDate: Date;
  kidId: string;
  initial?: ParentLog;
  onSave: (data: Omit<ParentLog, 'id'>) => void;
  onCancel: () => void;
}) {
  const { settings } = useStore();
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const [overallMood, setOverallMood] = useState<'good' | 'neutral' | 'bad'>(initial?.overallMood ?? 'neutral');
  const [goodItems, setGoodItems] = useState<string[]>(initial?.goodItems ?? []);
  const [badItems, setBadItems] = useState<string[]>(initial?.badItems ?? []);
  const [note, setNote] = useState(initial?.note ?? '');
  const [newGoodItem, setNewGoodItem] = useState('');
  const [newBadItem, setNewBadItem] = useState('');
  const [showGoodInput, setShowGoodInput] = useState(false);
  const [showBadInput, setShowBadInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const goodInputRef = useRef<HTMLInputElement>(null);
  const badInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (showGoodInput) goodInputRef.current?.focus(); }, [showGoodInput]);
  useEffect(() => { if (showBadInput) badInputRef.current?.focus(); }, [showBadInput]);

  const addItem = (type: 'good' | 'bad') => {
    const value = type === 'good' ? newGoodItem : newBadItem;
    const list = type === 'good' ? goodItems : badItems;
    const setList = type === 'good' ? setGoodItems : setBadItems;
    const setShow = type === 'good' ? setShowGoodInput : setShowBadInput;
    const setNew = type === 'good' ? setNewGoodItem : setNewBadItem;
    if (value.trim() && list.length < 5) { setList([...list, value.trim()]); setNew(''); setShow(false); }
    else if (!value.trim()) setShow(false);
  };

  const removeItem = (type: 'good' | 'bad', i: number) => {
    if (type === 'good') setGoodItems(g => g.filter((_, idx) => idx !== i));
    else setBadItems(b => b.filter((_, idx) => idx !== i));
  };

  const handleAIAnalyze = async () => {
    if (!note.trim() || isAnalyzing || !apiKey) return;
    setIsAnalyzing(true);
    try {
      const prompt = `You are a professional behavioral assistant for parents. 
      Analyze the following summary of a child's day and extract up to 5 "Good" items (positive behaviors/achievements) and up to 5 "Needs Improvement" items (struggles/behavioral issues). 
      
      Summary: "${note}"

      IMPORTANT: 
      - Always return the items in Arabic, regardless of the language of the summary.
      - Return ONLY a valid JSON object.
      - Format: {"good": ["item1", "item2"], "bad": ["item1"]}
      - Do not include any markdown formatting like \`\`\`json.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 }
          })
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API request failed');
      }
      const result = await response.json();
      const raw = result.candidates[0].content.parts[0].text;
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const data = JSON.parse(text);
      if (data.good) setGoodItems(data.good.slice(0, 5));
      if (data.bad) setBadItems(data.bad.slice(0, 5));
      if ((data.good?.length || 0) > (data.bad?.length || 0) + 1) setOverallMood('good');
      else if ((data.bad?.length || 0) > (data.good?.length || 0)) setOverallMood('bad');
      else setOverallMood('neutral');
    } catch (e: any) {
      alert(`AI Analysis failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave({
      childId: kidId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      overallMood,
      goodItems,
      badItems,
      note: note.trim() || undefined,
    });
  };

  const ItemList = ({ type }: { type: 'good' | 'bad' }) => {
    const items = type === 'good' ? goodItems : badItems;
    const showInput = type === 'good' ? showGoodInput : showBadInput;
    const setShow = type === 'good' ? setShowGoodInput : setShowBadInput;
    const newVal = type === 'good' ? newGoodItem : newBadItem;
    const setNew = type === 'good' ? setNewGoodItem : setNewBadItem;
    const ref = type === 'good' ? goodInputRef : badInputRef;
    const color = type === 'good' ? 'emerald' : 'rose';
    const label = type === 'good' ? '✅ Good Things' : '⚠️ Needs Work';

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{label}</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className={`bg-${color}-100 text-${color}-700 px-3 py-1.5 rounded-2xl text-xs font-bold border border-${color}-200 flex items-center gap-1.5`}
            >
              {item}
              <button onClick={() => removeItem(type, i)} className="hover:opacity-70 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {items.length < 5 && !showInput && (
            <button
              type="button"
              onClick={() => setShow(true)}
              className="px-3 py-1.5 rounded-2xl text-xs font-black border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          )}

          {showInput && (
            <div className="flex items-center gap-2 w-full">
              <input
                ref={ref}
                value={newVal}
                onChange={e => setNew(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addItem(type); if (e.key === 'Escape') setShow(false); }}
                placeholder="Type and press Enter..."
                className="flex-1 rounded-2xl border-2 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" onClick={() => addItem(type)} className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90">
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Note + Smart Fill */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Notes</p>
          {note.length > 10 && (
            <Button type="button" variant="ghost" size="sm" onClick={handleAIAnalyze} disabled={isAnalyzing}
              className="h-8 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 font-black text-[10px] uppercase tracking-wider gap-2 px-3 border border-purple-200">
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Smart Fill
            </Button>
          )}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Tell me about the day... e.g. 'Did great with homework, but bedtime was a struggle.'"
          className="w-full h-28 rounded-[1.5rem] border-2 p-4 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-muted/5"
        />
      </div>

      {/* Mood */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Overall Mood</p>
        <div className="flex gap-3">
          {(['good', 'neutral', 'bad'] as const).map(m => (
            <button key={m} type="button" onClick={() => setOverallMood(m)}
              className={cn('flex-1 rounded-2xl py-3 border-2 flex flex-col items-center gap-1 transition-all font-black text-xs uppercase tracking-wider',
                overallMood === m ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted bg-muted/10 hover:border-muted-foreground/30')}>
              <MoodIcon mood={m} />
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <ItemList type="good" />
      <ItemList type="bad" />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={handleSave} className="flex-1 rounded-2xl font-black">
          <Check className="w-4 h-4 mr-2" />
          {initial ? 'Save Changes' : 'Save Log'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-2xl px-6 font-black">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main ParentLogsV2 ─────────────────────────────────────────────────────────
export function ParentLogsV2({ selectedDate }: { selectedDate: Date }) {
  const { persons, settings, parentLogs, addParentLog, updateParentLog, deleteParentLog } = useStore();
  const t = getTranslation(settings.language);
  const pt = t.parentsPlanningFull;
  const kids = persons.filter(p => p.role === 'child');

  const [selectedKid, setSelectedKid] = useState(kids[0]?.id || '');
  // editing: undefined = view mode, 'new' = new log, logId = editing that log
  const [editing, setEditing] = useState<string | 'new' | undefined>(undefined);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayLogs = parentLogs.filter(l => l.childId === selectedKid && l.date === dateStr);

  const handleSave = (data: Omit<ParentLog, 'id'>) => {
    if (editing === 'new') {
      addParentLog(data);
    } else if (editing) {
      updateParentLog(editing, data);
    }
    setEditing(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this log entry?')) deleteParentLog(id);
  };

  const editingLog = editing && editing !== 'new'
    ? parentLogs.find(l => l.id === editing)
    : undefined;

  return (
    <Card className="rounded-[2.5rem] border shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
          <MessageSquare className="w-6 h-6" />
          {pt.parentLogs}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Kid selector */}
        <div className="flex gap-3">
          {kids.map(kid => (
            <button
              key={kid.id}
              type="button"
              onClick={() => { setSelectedKid(kid.id); setEditing(undefined); }}
              className={cn(
                'flex-1 rounded-2xl p-3 border-2 transition-all flex items-center gap-3',
                selectedKid === kid.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                  : 'border-transparent bg-muted/20 hover:bg-muted/40'
              )}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm shrink-0" style={{ borderColor: kid.color }}>
                <Image src={getAvatarUrl(kid.id)} alt={kid.name} width={40} height={40} className="object-cover w-full h-full" />
              </div>
              <span className="font-black text-sm">{getPersonName(kid, settings.language)}</span>
            </button>
          ))}
        </div>

        {/* Form or existing logs */}
        {editing ? (
          <LogForm
            selectedDate={selectedDate}
            kidId={selectedKid}
            initial={editingLog}
            onSave={handleSave}
            onCancel={() => setEditing(undefined)}
          />
        ) : (
          <div className="space-y-4">
            {todayLogs.length === 0 ? (
              <div className="text-center py-8 opacity-40">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-black text-sm">No log for {format(selectedDate, 'MMM d')}</p>
                <p className="text-xs font-medium mt-1">Add one below</p>
              </div>
            ) : (
              todayLogs.map(log => (
                <ExistingLogCard
                  key={log.id}
                  log={log}
                  onEdit={() => setEditing(log.id)}
                  onDelete={() => handleDelete(log.id)}
                />
              ))
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing('new')}
              className="w-full rounded-2xl border-dashed font-black text-sm gap-2 h-12 hover:border-primary/40 hover:text-primary hover:bg-primary/5"
            >
              <Plus className="w-4 h-4" />
              Add Log for {format(selectedDate, 'MMM d')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
