
"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Memo, CalendarEventSeries } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, Calendar, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function MemosPage() {
  const { settings, persons, memos, addMemo, updateMemo, deleteMemo, toggleMemoCompletion, addSeries } = useStore();
  const t = getTranslation(settings.language);
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Partial<Memo> | null>(null);

  const handleCreateMemo = (personId: string) => {
    setEditingMemo({
      personId,
      title: '',
      content: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo({ ...memo });
    setIsDialogOpen(true);
  };

  const handleSaveMemo = () => {
    if (!editingMemo || !editingMemo.personId || !editingMemo.title?.trim()) {
      return;
    }

    if (editingMemo.id) {
      const { id, ...updates } = editingMemo;
      updateMemo(id!, updates);
    } else {
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        personId: editingMemo.personId,
        title: editingMemo.title,
        content: editingMemo.content || '',
        createdAt: Date.now(),
        completed: false,
      };
      addMemo(newMemo);
    }
    setIsDialogOpen(false);
    setEditingMemo(null);
  };

  const handleScheduleToCalendar = (memo: Memo) => {
    const newSeries: CalendarEventSeries = {
      id: crypto.randomUUID(),
      personId: memo.personId,
      title: memo.title,
      notes: memo.content,
      startTime: '09:00',
      endTime: '10:00',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      recurrence: { frequency: 'NONE', interval: 1 },
      exceptions: [],
    };
    addSeries(newSeries);
    router.push('/');
  };

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tight">{t.memos}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[60vh]">
          {persons.map(person => {
            const personMemos = memos
              .filter(m => m.personId === person.id)
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return b.createdAt - a.createdAt;
              });

            return (
              <div key={person.id} className="flex flex-col space-y-3">
                <div 
                  className="p-3 rounded-2xl flex items-center justify-between shadow-sm border-2"
                  style={{ backgroundColor: `${person.color}10`, borderColor: `${person.color}30` }}
                >
                  <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: person.color }}>
                    {person.name}
                  </h2>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full hover:bg-white/50"
                    onClick={() => handleCreateMemo(person.id)}
                  >
                    <Plus className="w-5 h-5" style={{ color: person.color }} />
                  </Button>
                </div>

                <div className="flex-1 space-y-2">
                  {personMemos.length === 0 ? (
                    <div className="h-24 rounded-2xl border-2 border-dashed flex items-center justify-center text-muted-foreground font-bold opacity-30 italic text-sm">
                      {t.none}
                    </div>
                  ) : (
                    personMemos.map(memo => (
                      <div 
                        key={memo.id} 
                        className={cn(
                          "p-3 rounded-2xl border-2 transition-all group relative overflow-hidden bg-card",
                          memo.completed ? "opacity-60 grayscale-[0.5]" : "shadow-sm hover:shadow-md"
                        )}
                        style={{ borderColor: memo.completed ? 'transparent' : `${person.color}20` }}
                      >
                        <div className="flex gap-2">
                          <button 
                            onClick={() => toggleMemoCompletion(memo.id)}
                            className="shrink-0 mt-0.5"
                            style={{ color: person.color }}
                          >
                            {memo.completed ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0" onClick={() => handleEditMemo(memo)}>
                            <h3 className={cn(
                              "font-black leading-tight text-base truncate",
                              memo.completed && "line-through text-muted-foreground"
                            )}>
                              {memo.title}
                            </h3>
                            {memo.content && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                                {memo.content}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {!memo.completed && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full h-7 w-7 text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleToCalendar(memo);
                              }}
                              title={t.addEvent}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full h-7 w-7 text-destructive hover:bg-destructive/10" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMemo(memo.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full h-7 w-7 hover:bg-muted" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMemo(memo);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingMemo(null);
      }}>
        <DialogContent className="rounded-3xl sm:max-w-[500px] border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingMemo?.id ? t.edit : t.addMemo}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label className="font-bold">{t.title}</Label>
              <Input 
                value={editingMemo?.title || ''} 
                onChange={e => setEditingMemo(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                className="rounded-xl border-2 font-bold h-12"
                placeholder={t.memoTitle}
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.notes}</Label>
              <Textarea 
                value={editingMemo?.content || ''} 
                onChange={e => setEditingMemo(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                className="rounded-xl border-2 font-medium min-h-[200px]"
                placeholder={t.writeMemo}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
            <Button className="rounded-full font-black px-8" onClick={handleSaveMemo}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
