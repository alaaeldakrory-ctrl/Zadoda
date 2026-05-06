"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPersonName, getAvatarUrl, cn } from '@/lib/utils';
import { MessageSquare, Plus, X, Check, AlertCircle, Smile, Meh, Frown, Sparkles, Loader2, Wand2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isSameDay } from 'date-fns';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParentLog, Person, AppSettings } from '@/lib/types';

const SUGGESTIONS = {
  good: [
    "Independent dressing",
    "Cleaning toys",
    "Brushed teeth without reminder",
    "Focused on homework",
    "Kind to sister",
    "Shared nicely",
    "Quick transition",
    "Listening first time"
  ],
  bad: [
    "Needed reminders",
    "Took too long",
    "Refusal to start",
    "Distracted by screen",
    "Argumentative",
    "Slow dressing",
    "Messy workspace",
    "Bedtime struggle"
  ]
};

// ── LogHistory sub-component ────────────────────────────────────────────────
type Period = 'day' | 'week' | 'month';

function LogHistory({ parentLogs, persons, settings, pt }: {
  parentLogs: ParentLog[];
  persons: Person[];
  settings: AppSettings;
  pt: any;
}) {
  const [period, setPeriod] = useState<Period>('day');
  const [anchor, setAnchor] = useState(new Date()); // the reference date/week/month

  const rangeLabel = () => {
    if (period === 'day') return format(anchor, 'EEE, MMM d yyyy');
    if (period === 'week') {
      const s = startOfWeek(anchor, { weekStartsOn: 0 });
      const e = endOfWeek(anchor, { weekStartsOn: 0 });
      return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
    }
    return format(anchor, 'MMMM yyyy');
  };

  const navigate = (dir: -1 | 1) => {
    if (period === 'day') setAnchor(d => addDays(d, dir));
    if (period === 'week') setAnchor(d => addWeeks(d, dir));
    if (period === 'month') setAnchor(d => addMonths(d, dir));
  };

  const filteredLogs = parentLogs.filter(log => {
    const d = new Date(log.date);
    if (period === 'day') return isSameDay(d, anchor);
    if (period === 'week') {
      const s = startOfWeek(anchor, { weekStartsOn: 0 });
      const e = endOfWeek(anchor, { weekStartsOn: 0 });
      return d >= s && d <= e;
    }
    const s = startOfMonth(anchor);
    const e = endOfMonth(anchor);
    return d >= s && d <= e;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Totals
  const totalGood = filteredLogs.reduce((s, l) => s + (l.goodItems?.length || 0), 0);
  const totalBad  = filteredLogs.reduce((s, l) => s + (l.badItems?.length || 0), 0);
  const moodCounts = { good: 0, neutral: 0, bad: 0 };
  filteredLogs.forEach(l => { moodCounts[l.overallMood]++; });

  const kids = persons.filter(p => p.id === 'person1' || p.id === 'person2');
  const kidStats = kids.map(kid => {
    const logs = filteredLogs.filter(l => l.childId === kid.id);
    const g = logs.reduce((s, l) => s + (l.goodItems?.length || 0), 0);
    const b = logs.reduce((s, l) => s + (l.badItems?.length || 0), 0);
    const moods = { good: 0, neutral: 0, bad: 0 };
    logs.forEach(l => { moods[l.overallMood]++; });
    return { kid, logs, g, b, moods };
  });

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'day',   label: 'Day' },
    { key: 'week',  label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  return (
    <div className="mt-12 pt-12 border-t-2 border-dashed space-y-8">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h4 className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[10px] px-2 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Log History
        </h4>

        {/* Period tabs */}
        <div className="flex items-center gap-1 bg-muted/20 rounded-2xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => { setPeriod(p.key); setAnchor(new Date()); }}
              className={cn(
                'px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                period === p.key
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-muted-foreground hover:bg-muted/40'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigator */}
      <div className="flex items-center justify-between bg-muted/10 rounded-3xl px-6 py-4 border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted/30 rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="font-black text-sm tracking-wide">{rangeLabel()}</span>
        <button
          onClick={() => navigate(1)}
          disabled={period === 'day' ? isSameDay(anchor, new Date()) : false}
          className="p-2 hover:bg-muted/30 rounded-xl transition-all disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Period summary totals */}
      {filteredLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex flex-col items-center">
            <Sparkles className="w-5 h-5 text-emerald-500 mb-1" />
            <p className="text-3xl font-black text-emerald-700">{totalGood}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Good Items</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex flex-col items-center">
            <AlertCircle className="w-5 h-5 text-rose-500 mb-1" />
            <p className="text-3xl font-black text-rose-700">{totalBad}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-1">Needs Work</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5 flex flex-col items-center">
            <div className="flex gap-0.5 mb-1">
              <Smile className={cn('w-4 h-4', moodCounts.good > 0 ? 'text-emerald-500' : 'text-muted-foreground/30')} />
              <Meh   className={cn('w-4 h-4', moodCounts.neutral > 0 ? 'text-purple-500' : 'text-muted-foreground/30')} />
              <Frown className={cn('w-4 h-4', moodCounts.bad > 0 ? 'text-rose-500' : 'text-muted-foreground/30')} />
            </div>
            <p className="text-3xl font-black text-purple-700">{filteredLogs.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mt-1">Log Entries</p>
          </div>
        </div>
      )}

      {/* Per-kid breakdown (week/month only) */}
      {filteredLogs.length > 0 && period !== 'day' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kidStats.map(({ kid, logs, g, b, moods }) => (
            <div key={kid.id} className="rounded-3xl border-2 p-5 space-y-3" style={{ borderColor: `${kid.color}40` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: kid.color }}>
                  <Image src={getAvatarUrl(kid.id)} alt={kid.name} width={36} height={36} className="object-cover w-full h-full" />
                </div>
                <span className="font-black text-base" style={{ color: kid.color }}>{getPersonName(kid, settings.language)}</span>
                <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{logs.length} logs</span>
              </div>
              <div className="flex gap-3">
                <span className="flex-1 text-center bg-emerald-50 text-emerald-700 rounded-2xl py-2 text-sm font-black">
                  <span className="text-xl">{g}</span><br /><span className="text-[9px] uppercase tracking-wider opacity-70">Good</span>
                </span>
                <span className="flex-1 text-center bg-rose-50 text-rose-700 rounded-2xl py-2 text-sm font-black">
                  <span className="text-xl">{b}</span><br /><span className="text-[9px] uppercase tracking-wider opacity-70">Bad</span>
                </span>
                <span className="flex-1 text-center bg-muted/20 text-muted-foreground rounded-2xl py-2 text-sm font-black">
                  <span className="text-xl flex justify-center gap-0.5 pt-0.5">
                    {moods.good > 0 && <span className="text-xs text-emerald-500">{moods.good}😊</span>}
                    {moods.neutral > 0 && <span className="text-xs text-purple-500">{moods.neutral}😐</span>}
                    {moods.bad > 0 && <span className="text-xs text-rose-500">{moods.bad}😟</span>}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider opacity-70">Mood</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log cards */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-10 opacity-40">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-black text-sm">No logs for this {period}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map(log => {
            const kid = persons.find(p => p.id === log.childId);
            const MoodIcon = log.overallMood === 'good' ? Smile : log.overallMood === 'neutral' ? Meh : Frown;
            const moodColor = log.overallMood === 'good' ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : log.overallMood === 'neutral' ? 'text-purple-500 bg-purple-50 border-purple-100' : 'text-rose-500 bg-rose-50 border-rose-100';
            return (
              <div key={log.id} className="bg-white p-6 rounded-[2rem] border-2 hover:shadow-lg transition-all space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: kid?.color }}>
                      <Image src={getAvatarUrl(log.childId)} alt="kid" width={36} height={36} className="object-cover w-full h-full" />
                    </div>
                    <div>
                      <span className="font-black text-sm" style={{ color: kid?.color }}>{kid?.name}</span>
                      <p className="text-[10px] text-muted-foreground font-medium">{format(new Date(log.date), 'EEE, MMM d')}</p>
                    </div>
                  </div>
                  <div className={cn('p-2 rounded-xl border flex items-center gap-1.5 text-xs font-black', moodColor)}>
                    <MoodIcon className="w-4 h-4" />
                    {log.overallMood}
                  </div>
                </div>

                {(log.goodItems?.length > 0 || log.badItems?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {(log.goodItems || []).map((it, i) => (
                      <span key={i} className="text-[10px] font-bold bg-emerald-100/60 text-emerald-700 px-2.5 py-1 rounded-full">✓ {it}</span>
                    ))}
                    {(log.badItems || []).map((it, i) => (
                      <span key={i} className="text-[10px] font-bold bg-rose-100/60 text-rose-700 px-2.5 py-1 rounded-full">⚠ {it}</span>
                    ))}
                  </div>
                )}

                {log.note && (
                  <p className="text-sm font-medium text-muted-foreground bg-muted/10 rounded-2xl px-4 py-3 border">
                    💬 {log.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ParentLogsV2 ────────────────────────────────────────────────────────
export function ParentLogsV2() {
  const { persons, settings, parentLogs, addParentLog } = useStore();
  const t = getTranslation(settings.language);
  const pt = t.parentsPlanningFull;
  
  const isRTL = settings.language === 'ar';
  const kids = persons.filter(p => p.id === 'person1' || p.id === 'person2');

  const [selectedKid, setSelectedKid] = useState(kids[0]?.id || '');
  const [overallMood, setOverallMood] = useState<'good' | 'neutral' | 'bad'>('neutral');
  const [goodItems, setGoodItems] = useState<string[]>([]);
  const [badItems, setBadItems] = useState<string[]>([]);
  const [note, setNote] = useState('');
  
  const [newGoodItem, setNewGoodItem] = useState('');
  const [newBadItem, setNewBadItem] = useState('');
  const [showGoodInput, setShowGoodInput] = useState(false);
  const [showBadInput, setShowBadInput] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const goodInputRef = useRef<HTMLInputElement>(null);
  const badInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showGoodInput) goodInputRef.current?.focus();
  }, [showGoodInput]);

  useEffect(() => {
    if (showBadInput) badInputRef.current?.focus();
  }, [showBadInput]);

  const handleAddItem = (type: 'good' | 'bad') => {
    const value = type === 'good' ? newGoodItem : newBadItem;
    const list = type === 'good' ? goodItems : badItems;
    const setList = type === 'good' ? setGoodItems : setBadItems;
    const setShow = type === 'good' ? setShowGoodInput : setShowBadInput;
    const setNewValue = type === 'good' ? setNewGoodItem : setNewBadItem;

    if (value.trim() && list.length < 5) {
      setList([...list, value.trim()]);
      setNewValue('');
      setShow(false);
    } else if (!value.trim()) {
      setShow(false);
    }
  };

  const removeItem = (type: 'good' | 'bad', index: number) => {
    const list = type === 'good' ? goodItems : badItems;
    const setList = type === 'good' ? setGoodItems : setBadItems;
    setList(list.filter((_, i) => i !== index));
  };

  const handleAIAnalyze = async () => {
    if (!note.trim() || isAnalyzing) return;
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key is missing!");
      alert("API Key missing. Please check your configuration.");
      return;
    }

    setIsAnalyzing(true);
    console.log("Starting AI analysis with Gemini 1.5 Flash (v1 API)...");

    try {
      const prompt = `You are a professional behavioral assistant for parents. 
      Analyze the following summary of a child's day and extract up to 5 "Good" items (positive behaviors/achievements) and up to 5 "Needs Improvement" items (struggles/behavioral issues). 
      
      Summary: "${note}"

      IMPORTANT: 
      - If the summary is in Arabic, please return the items in Arabic.
      - Return ONLY a valid JSON object.
      - Format: {"good": ["item1", "item2"], "bad": ["item1"]}
      - Do not include any markdown formatting like \`\`\`json.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API request failed");
      }

      const result = await response.json();
      const raw = result.candidates[0].content.parts[0].text;
      console.log("AI Response received:", raw);

      // Strip markdown code fences if present
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const data = JSON.parse(text);
      console.log("Parsed data:", data);
      
      if (data.good) setGoodItems(data.good.slice(0, 5));
      if (data.bad) setBadItems(data.bad.slice(0, 5));
      
      if ((data.good?.length || 0) > (data.bad?.length || 0) + 1) setOverallMood('good');
      else if ((data.bad?.length || 0) > (data.good?.length || 0)) setOverallMood('bad');
      else setOverallMood('neutral');
      
    } catch (error: any) {
      console.error("AI Analysis failed:", error);
      alert(`AI Analysis failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKid) return;

    addParentLog({
      childId: selectedKid,
      date: format(new Date(), 'yyyy-MM-dd'),
      overallMood,
      goodItems,
      badItems,
      note: note.trim() || undefined
    });

    // Reset
    setGoodItems([]);
    setBadItems([]);
    setNote('');
    setOverallMood('neutral');
  };

  return (
    <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
          <MessageSquare className="w-6 h-6" />
          {pt.parentLogs}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Child Selection */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 px-2">{pt.childSelection}</p>
            <div className="flex gap-4">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => setSelectedKid(kid.id)}
                  className={cn(
                    "flex-1 rounded-3xl p-4 border-2 transition-all flex items-center gap-4 group",
                    selectedKid === kid.id 
                      ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                      : "border-transparent bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: kid.color }}>
                    <Image src={getAvatarUrl(kid.id)} alt={kid.name} width={48} height={48} className="object-cover w-full h-full" />
                  </div>
                  <span className="font-black text-base">{getPersonName(kid, settings.language)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{pt.optionalNote}</p>
              {note.length > 10 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing}
                  className="h-8 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 font-black text-[10px] uppercase tracking-wider gap-2 px-3 border border-purple-200"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Smart Fill
                </Button>
              )}
            </div>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell me about the day... e.g., 'Lyla was great today, she finished her chores early but struggled with bedtime.'"
              className="w-full h-32 rounded-[2rem] border-2 p-6 font-medium resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 bg-muted/5 transition-all"
            />
          </div>

          {/* Mood Selection */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 px-2">{pt.overallDay}</p>
            <div className="grid grid-cols-3 gap-4">
              {(['good', 'neutral', 'bad'] as const).map(m => {
                const Icon = m === 'good' ? Smile : m === 'neutral' ? Meh : Frown;
                const activeColors = {
                  good: "border-emerald-500 bg-emerald-50 text-emerald-700",
                  neutral: "border-purple-500 bg-purple-50 text-purple-700",
                  bad: "border-rose-500 bg-rose-50 text-rose-700"
                };
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setOverallMood(m)}
                    className={cn(
                      "py-4 rounded-3xl border-2 font-black uppercase tracking-widest text-[10px] transition-all flex flex-col items-center gap-2",
                      overallMood === m ? activeColors[m] : "border-muted/30 text-muted-foreground hover:bg-muted/10"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    {pt[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Good Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Sparkles className="w-4 h-4" />
                  <p className="text-xs font-black uppercase tracking-widest">{pt.whatWentWell}</p>
                </div>
                <span className="text-[10px] font-black opacity-40">{goodItems.length}/5</span>
              </div>
              
              <div className="space-y-2">
                {goodItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl group animate-in fade-in slide-in-from-bottom-1">
                    <span className="font-bold text-sm text-emerald-900">{item}</span>
                    <button type="button" onClick={() => removeItem('good', i)} className="p-1 hover:bg-emerald-100 rounded-full text-emerald-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {showGoodInput ? (
                  <div className="relative">
                    <input
                      ref={goodInputRef}
                      type="text"
                      value={newGoodItem}
                      onChange={(e) => setNewGoodItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('good'))}
                      onBlur={() => handleAddItem('good')}
                      className="w-full bg-white border-2 border-emerald-500 p-3 rounded-2xl font-bold text-sm focus:outline-none"
                      placeholder="Type item..."
                    />
                    {newGoodItem.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-2xl shadow-xl z-10 max-h-40 overflow-y-auto p-2 space-y-1">
                        {SUGGESTIONS.good.filter(s => s.toLowerCase().includes(newGoodItem.toLowerCase())).map(s => (
                          <button 
                            key={s} 
                            type="button" 
                            onMouseDown={() => { setNewGoodItem(s); setTimeout(() => handleAddItem('good'), 50); }}
                            className="w-full text-left p-2 hover:bg-muted rounded-xl text-xs font-bold"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  goodItems.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setShowGoodInput(true)}
                      className="w-full border-2 border-dashed border-muted p-3 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/10 transition-all font-bold text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {pt.addItem}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Bad Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs font-black uppercase tracking-widest">{pt.needsImprovement}</p>
                </div>
                <span className="text-[10px] font-black opacity-40">{badItems.length}/5</span>
              </div>
              
              <div className="space-y-2">
                {badItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-rose-50/50 border border-rose-100 p-3 rounded-2xl group animate-in fade-in slide-in-from-bottom-1">
                    <span className="font-bold text-sm text-rose-900">{item}</span>
                    <button type="button" onClick={() => removeItem('bad', i)} className="p-1 hover:bg-rose-100 rounded-full text-rose-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {showBadInput ? (
                  <div className="relative">
                    <input
                      ref={badInputRef}
                      type="text"
                      value={newBadItem}
                      onChange={(e) => setNewBadItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('bad'))}
                      onBlur={() => handleAddItem('bad')}
                      className="w-full bg-white border-2 border-rose-500 p-3 rounded-2xl font-bold text-sm focus:outline-none"
                      placeholder="Type item..."
                    />
                    {newBadItem.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-2xl shadow-xl z-10 max-h-40 overflow-y-auto p-2 space-y-1">
                        {SUGGESTIONS.bad.filter(s => s.toLowerCase().includes(newBadItem.toLowerCase())).map(s => (
                          <button 
                            key={s} 
                            type="button" 
                            onMouseDown={() => { setNewBadItem(s); setTimeout(() => handleAddItem('bad'), 50); }}
                            className="w-full text-left p-2 hover:bg-muted rounded-xl text-xs font-bold"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  badItems.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setShowBadInput(true)}
                      className="w-full border-2 border-dashed border-muted p-3 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/10 transition-all font-bold text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {pt.addItem}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-3xl h-16 font-black text-xl bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-200">
            <Check className="w-6 h-6 mr-3 stroke-[3px]" />
            {pt.saveLog}
          </Button>
        </form>

        <LogHistory parentLogs={parentLogs} persons={persons} settings={settings} pt={pt} />
      </CardContent>
    </Card>
  );
}
