
"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Memo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, StickyNote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function MemosPage() {
  const { settings, persons, memos, addMemo, updateMemo, deleteMemo } = useStore();
  const t = getTranslation(settings.language);

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
    setEditingMemo(memo);
    setIsDialogOpen(true);
  };

  const handleSaveMemo = () => {
    if (!editingMemo?.title || !editingMemo?.content) return;

    if (editingMemo.id) {
      updateMemo(editingMemo.id, editingMemo);
    } else {
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        personId: editingMemo.personId!,
        title: editingMemo.title,
        content: editingMemo.content,
        createdAt: Date.now(),
      };
      addMemo(newMemo);
    }
    setIsDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tight">{t.memos}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[60vh]">
          {persons.map(person => {
            const personMemos = memos
              .filter(m => m.personId === person.id)
              .sort((a, b) => b.createdAt - a.createdAt);

            return (
              <div key={person.id} className="flex flex-col space-y-4">
                <div 
                  className="p-4 rounded-2xl flex items-center justify-between shadow-sm border-2"
                  style={{ backgroundColor: `${person.color}10`, borderColor: `${person.color}30` }}
                >
                  <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: person.color }}>
                    {person.name}
                  </h2>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="rounded-full hover:bg-white/50"
                    onClick={() => handleCreateMemo(person.id)}
                  >
                    <Plus className="w-5 h-5" style={{ color: person.color }} />
                  </Button>
                </div>

                <div className="flex-1 space-y-4">
                  {personMemos.length === 0 ? (
                    <div className="h-32 rounded-3xl border-2 border-dashed flex items-center justify-center text-muted-foreground font-bold opacity-30 italic">
                      {t.none}
                    </div>
                  ) : (
                    personMemos.map(memo => (
                      <Card key={memo.id} className="rounded-3xl border-2 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <CardHeader className="pb-2 bg-muted/5">
                          <CardTitle className="text-lg font-black truncate">{memo.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 text-sm font-medium text-muted-foreground whitespace-pre-wrap line-clamp-6">
                          {memo.content}
                        </CardContent>
                        <CardFooter className="justify-end gap-2 pt-2 border-t bg-muted/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-destructive" onClick={() => deleteMemo(memo.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => handleEditMemo(memo)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                onChange={e => setEditingMemo(prev => ({ ...prev, title: e.target.value }))}
                className="rounded-xl border-2 font-bold h-12"
                placeholder={t.memoTitle}
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.notes}</Label>
              <Textarea 
                value={editingMemo?.content || ''} 
                onChange={e => setEditingMemo(prev => ({ ...prev, content: e.target.value }))}
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
