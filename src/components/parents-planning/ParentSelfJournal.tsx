"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPersonName, getAvatarUrl, cn } from '@/lib/utils';
import {
  BookHeart, Plus, X, Check,
  Wand2, Loader2, Pencil, Trash2, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ParentSelfLog } from '@/lib/types';

// ── Feeling config ─────────────────────────────────────────────────────────────

const FEELINGS = {
  good: { emoji: '😊', label: 'Felt Great', bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800' },
  neutral: { emoji: '😐', label: 'It was Okay', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  needs_work: { emoji: '😔', label: 'Needs Work', bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
} as const;

// ── Existing entry card — always expanded, big readable text ───────────────────

function ExistingEntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: ParentSelfLog;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const feeling = FEELINGS[entry.overallFeeling];

  return (
    <div className={cn('rounded-3xl border-2 p-6 space-y-5', feeling.bg, feeling.border)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex items-center gap-2 text-base font-black px-4 py-1.5 rounded-full', feeling.badge)}>
          <span className="text-xl">{feeling.emoji}</span>
          {feeling.label}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-2 rounded-xl hover:bg-white/70 transition-all text-indigo-500 hover:text-indigo-700" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl hover:bg-white/70 transition-all text-rose-400 hover:text-rose-600" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reflection — big, prominent, always visible */}
      {entry.reflection && (
        <p className="text-lg font-semibold leading-relaxed text-gray-800 bg-white/70 rounded-2xl p-5 border border-white/80 whitespace-pre-wrap">
          {entry.reflection}
        </p>
      )}

      {/* Good things */}
      {(entry.goodThings?.length || 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-700 opacity-80">✨ Good Things I Did</p>
          <div className="flex flex-wrap gap-2">
            {entry.goodThings.map((item, i) => (
              <span key={i} className="bg-violet-100 text-violet-800 px-4 py-1.5 rounded-2xl text-sm font-bold border border-violet-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Things to improve */}
      {(entry.improveThings?.length || 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-rose-700 opacity-80">🔧 Things to Improve</p>
          <div className="flex flex-wrap gap-2">
            {entry.improveThings.map((item, i) => (
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

// ── Journal entry form ─────────────────────────────────────────────────────────

function JournalForm({
  selectedDate,
  parentId,
  initial,
  onSave,
  onCancel,
}: {
  selectedDate: Date;
  parentId: string;
  initial?: ParentSelfLog;
  onSave: (data: Omit<ParentSelfLog, 'id'>) => void;
  onCancel: () => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const [overallFeeling, setOverallFeeling] = useState<'good' | 'neutral' | 'needs_work'>(initial?.overallFeeling ?? 'neutral');
  const [goodThings, setGoodThings] = useState<string[]>(initial?.goodThings ?? []);
  const [improveThings, setImproveThings] = useState<string[]>(initial?.improveThings ?? []);
  const [reflection, setReflection] = useState(initial?.reflection ?? '');
  const [newGoodItem, setNewGoodItem] = useState('');
  const [newImproveItem, setNewImproveItem] = useState('');
  const [showGoodInput, setShowGoodInput] = useState(false);
  const [showImproveInput, setShowImproveInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const goodInputRef = useRef<HTMLInputElement>(null);
  const improveInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (showGoodInput) goodInputRef.current?.focus(); }, [showGoodInput]);
  useEffect(() => { if (showImproveInput) improveInputRef.current?.focus(); }, [showImproveInput]);

  const addItem = (type: 'good' | 'improve') => {
    const value = type === 'good' ? newGoodItem : newImproveItem;
    const list = type === 'good' ? goodThings : improveThings;
    const setList = type === 'good' ? setGoodThings : setImproveThings;
    const setShow = type === 'good' ? setShowGoodInput : setShowImproveInput;
    const setNew = type === 'good' ? setNewGoodItem : setNewImproveItem;
    if (value.trim() && list.length < 5) { setList([...list, value.trim()]); setNew(''); setShow(false); }
    else if (!value.trim()) setShow(false);
  };

  const removeItem = (type: 'good' | 'improve', i: number) => {
    if (type === 'good') setGoodThings(g => g.filter((_, idx) => idx !== i));
    else setImproveThings(b => b.filter((_, idx) => idx !== i));
  };

  const handleAIAnalyze = async () => {
    if (!reflection.trim() || isAnalyzing || !apiKey) return;
    setIsAnalyzing(true);
    try {
      const prompt = `You are a supportive parenting coach. 
      A parent is reflecting on their day with their children. 
      Analyze the following reflection and extract up to 5 "Good Things" (positive parenting actions they took) and up to 5 "Things to Improve" (areas they can grow in). 
      
      Reflection: "${reflection}"

      IMPORTANT: 
      - Always return items in Arabic, regardless of the language of the reflection.
      - Items should be short, specific, and actionable (e.g., "صبرت أثناء وقت النوم" or "تحدثت بهدوء عند الإحباط").
      - Return ONLY a valid JSON object with no markdown.
      - Format: {"good": ["item1", "item2"], "improve": ["item1"]}`;

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
      if (data.good) setGoodThings(data.good.slice(0, 5));
      if (data.improve) setImproveThings(data.improve.slice(0, 5));
      const goodCount = data.good?.length || 0;
      const improveCount = data.improve?.length || 0;
      if (goodCount > improveCount + 1) setOverallFeeling('good');
      else if (improveCount > goodCount) setOverallFeeling('needs_work');
      else setOverallFeeling('neutral');
    } catch (e: any) {
      alert(`AI Analysis failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave({
      parentId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      overallFeeling,
      goodThings,
      improveThings,
      reflection: reflection.trim() || undefined,
    });
  };

  const ItemChips = ({ type }: { type: 'good' | 'improve' }) => {
    const items = type === 'good' ? goodThings : improveThings;
    const showInput = type === 'good' ? showGoodInput : showImproveInput;
    const setShow = type === 'good' ? setShowGoodInput : setShowImproveInput;
    const newVal = type === 'good' ? newGoodItem : newImproveItem;
    const setNew = type === 'good' ? setNewGoodItem : setNewImproveItem;
    const ref = type === 'good' ? goodInputRef : improveInputRef;
    const color = type === 'good' ? 'violet' : 'rose';
    const label = type === 'good' ? '✨ Good Things I Did' : '🔧 Things to Improve';
    const hint = type === 'good' ? 'What you did well as a parent today' : 'What you want to work on';

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-xs font-medium text-muted-foreground opacity-60 mt-0.5">{hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className={`bg-${color}-100 text-${color}-800 px-4 py-1.5 rounded-2xl text-sm font-bold border border-${color}-200 flex items-center gap-1.5`}
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
              className="px-4 py-1.5 rounded-2xl text-sm font-black border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:border-indigo-400/40 hover:text-indigo-600 transition-all flex items-center gap-1"
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
                placeholder="Type and press Enter…"
                className="flex-1 rounded-2xl border-2 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button type="button" onClick={() => addItem(type)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
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
      {/* Reflection textarea — large and inviting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">My Reflection</p>
          {reflection.length > 10 && (
            <Button type="button" variant="ghost" size="sm" onClick={handleAIAnalyze} disabled={isAnalyzing}
              className="h-8 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black text-xs uppercase tracking-wider gap-2 px-3 border border-indigo-200">
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Smart Fill
            </Button>
          )}
        </div>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="How did parenting feel today? How did things go with the kids?"
          className="w-full h-32 rounded-[1.5rem] border-2 p-5 text-base font-medium resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/70 leading-relaxed"
        />
      </div>

      {/* Overall Feeling */}
      <div className="space-y-3">
        <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">Overall Feeling</p>
        <div className="flex gap-3">
          {(['good', 'neutral', 'needs_work'] as const).map(f => {
            const cfg = FEELINGS[f];
            return (
              <button key={f} type="button" onClick={() => setOverallFeeling(f)}
                className={cn('flex-1 rounded-2xl py-4 border-2 flex flex-col items-center gap-2 transition-all font-black',
                  overallFeeling === f
                    ? `${cfg.border} ${cfg.bg} ring-2 ring-offset-1`
                    : 'border-muted bg-muted/10 hover:border-muted-foreground/30')}>
                <span className="text-2xl">{cfg.emoji}</span>
                <span className={cn('text-xs font-bold', overallFeeling === f ? cfg.text : 'text-muted-foreground')}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item chips */}
      <ItemChips type="good" />
      <ItemChips type="improve" />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={handleSave}
          className="flex-1 h-12 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white text-base">
          <Check className="w-4 h-4 mr-2" />
          {initial ? 'Save Changes' : 'Save Reflection'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-2xl px-6 font-black">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main ParentSelfJournal ─────────────────────────────────────────────────────

export function ParentSelfJournal({ selectedDate }: { selectedDate: Date }) {
  const { persons, settings, parentSelfLogs, addParentSelfLog, updateParentSelfLog, deleteParentSelfLog } = useStore();
  const t = getTranslation(settings.language);
  const jt = t.parentSelfJournal;

  const parents = persons.filter(p => p.role === 'parent');
  const [selectedParent, setSelectedParent] = useState('');
  const [editing, setEditing] = useState<string | 'new' | undefined>(undefined);

  useEffect(() => {
    if (!selectedParent && parents.length > 0) setSelectedParent(parents[0].id);
  }, [parents, selectedParent]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayEntries = parentSelfLogs.filter(l => l.parentId === selectedParent && l.date === dateStr);

  const handleSave = (data: Omit<ParentSelfLog, 'id'>) => {
    if (editing === 'new') {
      addParentSelfLog(data);
    } else if (editing) {
      updateParentSelfLog(editing, data);
    }
    setEditing(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm(jt.deleteConfirm)) deleteParentSelfLog(id);
  };

  const editingEntry = editing && editing !== 'new'
    ? parentSelfLogs.find(l => l.id === editing)
    : undefined;

  return (
    <Card className="rounded-[2.5rem] border-2 shadow-xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #eef2ff 100%)' }}>

      {/* Header */}
      <CardHeader className="pb-5 border-b border-indigo-100"
        style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)' }}>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-2xl">
            <BookHeart className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-700 flex items-center gap-2">
              {jt.title}
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-sm font-bold text-indigo-400 mt-0.5">{jt.subtitle}</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">

        {/* Parent selector */}
        {parents.length > 1 && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-3">{jt.selectParent}</p>
            <div className="flex gap-3">
              {parents.map(parent => (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => { setSelectedParent(parent.id); setEditing(undefined); }}
                  className={cn(
                    'flex-1 rounded-2xl p-3 border-2 transition-all flex items-center gap-3',
                    selectedParent === parent.id
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200/50 shadow-sm'
                      : 'border-transparent bg-white/60 hover:bg-white/90 hover:border-indigo-200'
                  )}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm shrink-0"
                    style={{ borderColor: parent.color }}>
                    <Image src={getAvatarUrl(parent.id, parent.avatarUrl)} alt={parent.name} width={40} height={40} className="object-cover w-full h-full" />
                  </div>
                  <span className="font-black text-sm text-indigo-900">{getPersonName(parent, settings.language)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form or entries */}
        {editing ? (
          <JournalForm
            selectedDate={selectedDate}
            parentId={selectedParent}
            initial={editingEntry}
            onSave={handleSave}
            onCancel={() => setEditing(undefined)}
          />
        ) : (
          <div className="space-y-5">
            {todayEntries.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <BookHeart className="w-14 h-14 mx-auto mb-3 text-indigo-400" />
                <p className="font-black text-base text-indigo-700">{jt.noEntry}</p>
                <p className="text-sm font-medium mt-1 text-indigo-400">{jt.noEntryHint}</p>
              </div>
            ) : (
              todayEntries.map(entry => (
                <ExistingEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => setEditing(entry.id)}
                  onDelete={() => handleDelete(entry.id)}
                />
              ))
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing('new')}
              className="w-full rounded-2xl border-dashed border-indigo-300 font-black text-base gap-2 h-14 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 text-indigo-500 bg-white/60 transition-all"
            >
              <Plus className="w-5 h-5" />
              {jt.addEntry} for {format(selectedDate, 'MMM d')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
