"use client"

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { format, addDays } from 'date-fns';
import { CheckSquare, Plus, Trash2, ChevronLeft, ChevronRight, Check, X, Pencil, ListPlus } from 'lucide-react';
import { getAvatarUrl, getPersonName, cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { Checklist } from '@/lib/types';
import confetti from 'canvas-confetti';

// ── Audio helpers ─────────────────────────────────────────────────────────────

const playDing = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

const playTada = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const note = (freq: number, t: number, dur: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, t + dur);
      o.start(t); o.stop(t + dur);
    };
    const n = ctx.currentTime;
    note(440, n, 0.15); note(554, n + 0.15, 0.15); note(659, n + 0.3, 0.4);
  } catch {}
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CheckListsPage() {
  const {
    persons, settings,
    checklists, checklistCompletions,
    addChecklist, updateChecklist, deleteChecklist, setChecklistItemDone,
    isParentUnlocked,
  } = useStore();

  const allPersons = persons;
  const defaultPerson = persons.find(p => p.role === 'child') || persons[0];

  const [selectedPersonId, setSelectedPersonId] = useState(defaultPerson?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateKey = format(currentDate, 'yyyy-MM-dd');

  const selectedPerson = persons.find(p => p.id === selectedPersonId);

  // Sync default when persons load
  useEffect(() => {
    if (!selectedPersonId && persons.length > 0) {
      const first = persons.find(p => p.role === 'child') || persons[0];
      setSelectedPersonId(first.id);
    }
  }, [persons, selectedPersonId]);

  // New checklist form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('all');

  // Inline item addition
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const newItemRef = useRef<HTMLInputElement>(null);

  // Inline title editing
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  useEffect(() => {
    if (addingItemTo && newItemRef.current) newItemRef.current.focus();
  }, [addingItemTo]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const isItemDone = (checklistId: string, itemIndex: number): boolean => {
    const key = `${dateKey}_${selectedPersonId}_${checklistId}_${itemIndex}`;
    return checklistCompletions.find(c => c.id === key)?.completed ?? false;
  };

  const getProgress = (cl: Checklist) => {
    const done = cl.items.filter((_, i) => isItemDone(cl.id, i)).length;
    return { done, total: cl.items.length };
  };

  const visibleChecklists = checklists
    .filter(cl => {
      if (cl.assignedTo === 'all') return true;
      if (cl.assignedTo === 'kids' && selectedPerson?.role === 'child') return true;
      return cl.assignedTo === selectedPersonId;
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleToggle = (cl: Checklist, itemIndex: number) => {
    const wasDone = isItemDone(cl.id, itemIndex);
    setChecklistItemDone(cl.id, selectedPersonId, dateKey, itemIndex, !wasDone);
    if (!wasDone) {
      playDing();
      const willBeAllDone = cl.items.every((_, i) =>
        i === itemIndex ? true : isItemDone(cl.id, i)
      );
      if (willBeAllDone) {
        playTada();
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#2D6A4F', '#F87171', '#60A5FA', '#FBBF24'] });
      }
    }
  };

  const handleCreateChecklist = () => {
    if (!newTitle.trim()) return;
    addChecklist({ title: newTitle.trim(), items: [], assignedTo: newAssignedTo });
    setNewTitle('');
    setNewAssignedTo('all');
    setShowNewForm(false);
  };

  const handleAddItem = (cl: Checklist) => {
    if (!newItemText.trim()) return;
    updateChecklist(cl.id, { items: [...cl.items, newItemText.trim()] });
    setNewItemText('');
    // keep focus for rapid entry
    setTimeout(() => newItemRef.current?.focus(), 50);
  };

  const handleDeleteItem = (cl: Checklist, idx: number) => {
    updateChecklist(cl.id, { items: cl.items.filter((_, i) => i !== idx) });
  };

  const handleSaveTitle = (cl: Checklist) => {
    if (editingTitleText.trim()) updateChecklist(cl.id, { title: editingTitleText.trim() });
    setEditingTitleId(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 pb-28 lg:pb-8">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Checklists</h1>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Person pill tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {allPersons.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonId(p.id)}
                className={cn(
                  'flex items-center gap-2 h-11 px-4 rounded-2xl font-bold text-sm transition-all border',
                  selectedPersonId === p.id
                    ? 'text-white border-transparent shadow-md'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                )}
                style={selectedPersonId === p.id ? { backgroundColor: p.color, borderColor: p.color } : {}}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                  <Image src={getAvatarUrl(p.id, p.avatarUrl)} alt={p.name} width={24} height={24} className="object-cover w-full h-full" />
                </div>
                {getPersonName(p, settings.language)}
              </button>
            ))}
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-1 bg-card border rounded-2xl p-1 shrink-0">
            <button onClick={() => setCurrentDate(d => addDays(d, -1))} className="p-2 rounded-xl hover:bg-muted/50 transition-all">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="px-3 font-black text-sm min-w-[110px] text-center">
              {format(currentDate, 'EEE, MMM d')}
            </span>
            <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="p-2 rounded-xl hover:bg-muted/50 transition-all">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* New checklist form (parents only) */}
        {isParentUnlocked && showNewForm && (
          <div className="bg-card border-2 border-primary/20 rounded-[2rem] p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-lg text-primary">New Checklist</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Checklist title…"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateChecklist()}
                className="flex-1 h-11 px-4 rounded-xl border bg-background font-bold focus:outline-none focus:border-primary transition-colors"
              />
              <select
                value={newAssignedTo}
                onChange={e => setNewAssignedTo(e.target.value)}
                className="h-11 px-4 rounded-xl border bg-background font-bold focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">Everyone</option>
                <option value="kids">All Kids</option>
                {allPersons.map(p => (
                  <option key={p.id} value={p.id}>{getPersonName(p, settings.language)}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewForm(false)} className="flex-1 h-11 rounded-xl border font-bold text-muted-foreground hover:bg-muted/50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleCreateChecklist}
                disabled={!newTitle.trim()}
                className="flex-[2] h-11 rounded-xl bg-primary text-primary-foreground font-black hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
              >
                Create Checklist
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {visibleChecklists.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">📋</div>
            <p className="text-xl font-black text-muted-foreground/50">No checklists yet</p>
            {isParentUnlocked ? (
              <button
                onClick={() => setShowNewForm(true)}
                className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <Plus className="w-5 h-5" /> Create your first checklist
              </button>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">Ask a parent to add checklists.</p>
            )}
          </div>
        )}

        {/* Checklist grid */}
        {visibleChecklists.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {visibleChecklists.map(cl => {
              const { done, total } = getProgress(cl);
              const allDone = total > 0 && done === total;
              const pct = total === 0 ? 0 : (done / total) * 100;
              const isEditingTitle = editingTitleId === cl.id;
              const isAddingItem = addingItemTo === cl.id;

              return (
                <div
                  key={cl.id}
                  className={cn(
                    'rounded-[2.5rem] border overflow-hidden transition-all duration-300',
                    allDone ? 'bg-primary/8 border-primary/30' : 'bg-card border-border'
                  )}
                >
                  {/* Card header */}
                  <div className={cn('px-7 pt-7 pb-5 border-b', allDone ? 'border-primary/20' : 'border-border')}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Title */}
                      {isEditingTitle ? (
                        <input
                          autoFocus
                          value={editingTitleText}
                          onChange={e => setEditingTitleText(e.target.value)}
                          onBlur={() => handleSaveTitle(cl)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(cl); if (e.key === 'Escape') setEditingTitleId(null); }}
                          className="flex-1 text-xl font-black bg-transparent border-b-2 border-primary focus:outline-none pb-1"
                        />
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn('p-2 rounded-xl shrink-0', allDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                            <CheckSquare className="w-5 h-5" />
                          </div>
                          <h3 className={cn('text-xl font-black truncate', allDone ? 'text-primary' : 'text-foreground')}>
                            {cl.title}
                          </h3>
                        </div>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {total > 0 && (
                          <span className={cn(
                            'text-sm font-black px-3 py-1 rounded-xl border',
                            allDone ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'
                          )}>
                            {done}/{total}
                          </span>
                        )}
                        {isParentUnlocked && (
                          <>
                            <button onClick={() => { setEditingTitleId(cl.id); setEditingTitleText(cl.title); }}
                              className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteChecklist(cl.id)}
                              className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {total > 0 && (
                      <Progress value={pct} className="h-2 rounded-full" />
                    )}
                  </div>

                  {/* Items */}
                  <div className="px-5 py-4 space-y-2">
                    {cl.items.length === 0 && !isAddingItem && (
                      <p className="text-center text-sm font-bold text-muted-foreground/40 py-6">
                        No items yet{isParentUnlocked ? ' — add some below' : ''}
                      </p>
                    )}

                    {cl.items.map((item, idx) => {
                      const done = isItemDone(cl.id, idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggle(cl, idx)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all duration-200 group',
                            done
                              ? 'bg-primary/8 border-primary/20 opacity-60'
                              : 'bg-background border-border hover:border-primary/30 hover:shadow-sm'
                          )}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            'w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all',
                            done ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
                          )}>
                            {done && <Check className="w-4 h-4 text-primary-foreground stroke-[3px]" />}
                          </div>

                          {/* Text */}
                          <span className={cn('flex-1 font-bold text-base', done && 'line-through text-muted-foreground')} dir="auto">
                            {item}
                          </span>

                          {/* Delete item (parents only) */}
                          {isParentUnlocked && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteItem(cl, idx); }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Add item input */}
                    {isParentUnlocked && isAddingItem && (
                      <div className="flex items-center gap-2 p-2">
                        <input
                          ref={newItemRef}
                          value={newItemText}
                          onChange={e => setNewItemText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddItem(cl);
                            if (e.key === 'Escape') { setAddingItemTo(null); setNewItemText(''); }
                          }}
                          placeholder="New item…"
                          dir="auto"
                          className="flex-1 h-10 px-3 rounded-xl border bg-background font-bold text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                        <button onClick={() => handleAddItem(cl)}
                          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shrink-0">
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </button>
                        <button onClick={() => { setAddingItemTo(null); setNewItemText(''); }}
                          className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-muted/50 transition-all shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  {isParentUnlocked && (
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => { setAddingItemTo(isAddingItem ? null : cl.id); setNewItemText(''); }}
                        className={cn(
                          'w-full h-10 rounded-2xl border-2 border-dashed text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
                          isAddingItem
                            ? 'border-primary/40 text-primary bg-primary/5'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                        )}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add item
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* "New checklist" card (parents only) */}
            {isParentUnlocked && (
              <button
                onClick={() => setShowNewForm(true)}
                className="rounded-[2.5rem] border-2 border-dashed border-border hover:border-primary/40 bg-transparent hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 p-12 text-muted-foreground hover:text-primary min-h-[180px]"
              >
                <ListPlus className="w-10 h-10" />
                <span className="font-black text-sm uppercase tracking-widest">New Checklist</span>
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
