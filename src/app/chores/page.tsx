
"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Chore } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, User, Shuffle, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import Image from 'next/image';

export default function ChoresPage() {
  const { settings, persons, chores, addChore, updateChore, deleteChore } = useStore();
  const t = getTranslation(settings.language);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Partial<Chore> | null>(null);

  const handleCreate = () => {
    setEditingChore({
      title: '',
      description: '',
      assignedTo: 'random',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (chore: Chore) => {
    setEditingChore({ ...chore });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingChore || !editingChore.title?.trim()) return;

    if (editingChore.id) {
      const { id, ...updates } = editingChore;
      updateChore(id!, updates);
    } else {
      const newChore: Chore = {
        id: crypto.randomUUID(),
        title: editingChore.title,
        description: editingChore.description || '',
        assignedTo: editingChore.assignedTo || 'random',
        isActive: true,
      };
      addChore(newChore);
    }
    setIsDialogOpen(false);
    setEditingChore(null);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">{t.dailyChores}</h1>
            <p className="text-muted-foreground font-bold">Manage the family's daily tasks.</p>
          </div>
          <Button onClick={handleCreate} className="rounded-full px-8 h-12 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 stroke-[3px]" />
            {t.addChore}
          </Button>
        </div>

        {chores.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center space-y-6">
            <div className="w-48 h-48 rounded-full bg-muted/30 flex items-center justify-center">
              <ClipboardList className="w-24 h-24 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-black text-xl">No chores created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chores.map(chore => {
              const assignedPerson = persons.find(p => p.id === chore.assignedTo);
              return (
                <div key={chore.id} className="group p-6 bg-white rounded-[2.5rem] border-2 border-muted hover:border-primary/20 transition-all hover:shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">{chore.title}</h3>
                      {chore.description && <p className="text-sm text-muted-foreground font-medium line-clamp-2">{chore.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-3 bg-muted/50 py-2 px-4 rounded-full">
                      {chore.assignedTo === 'random' ? (
                        <>
                          <div className="p-1 bg-white rounded-full shadow-sm">
                            <Shuffle className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.random}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: assignedPerson?.color }}>
                            <Image 
                              src={getAvatarUrl(chore.assignedTo)} 
                              alt="assigned" 
                              width={24} 
                              height={24}
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: assignedPerson?.color }}>
                            {getPersonName(assignedPerson!, settings.language)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted" onClick={() => handleEdit(chore)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-destructive hover:bg-destructive/10" onClick={() => deleteChore(chore.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-[450px] border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingChore?.id ? t.edit : t.addChore}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label className="font-bold">{t.title}</Label>
              <Input 
                value={editingChore?.title || ''} 
                onChange={e => setEditingChore(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                className="rounded-xl border-2 font-bold h-12"
                placeholder="e.g., Take out trash, Wash dishes"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.notes}</Label>
              <Textarea 
                value={editingChore?.description || ''} 
                onChange={e => setEditingChore(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                className="rounded-xl border-2 font-medium min-h-[100px]"
                placeholder="What needs to be done?"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.assignTo}</Label>
              <Select 
                value={editingChore?.assignedTo || 'random'} 
                onValueChange={v => setEditingChore(prev => prev ? ({ ...prev, assignedTo: v }) : null)}
              >
                <SelectTrigger className="rounded-xl border-2 h-12 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="random">
                    <div className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-primary" />
                      {t.random}
                    </div>
                  </SelectItem>
                  {persons.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        {getPersonName(p, settings.language)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
            <Button className="rounded-full font-black px-10 h-12 shadow-lg shadow-primary/20" onClick={handleSave}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
