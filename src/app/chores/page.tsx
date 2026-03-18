
"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Chore, Person } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, Shuffle, ClipboardList, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addDays } from 'date-fns';
import Image from 'next/image';

export default function ChoresPage() {
  const { settings, persons, chores, choreOverrides, addChore, updateChore, deleteChore, updateChoreOverride } = useStore();
  const t = getTranslation(settings.language);

  const [activeTab, setActiveTab] = useState<'schedule' | 'library'>('schedule');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Partial<Chore> | null>(null);

  const handleCreate = () => {
    setEditingChore({
      title: '',
      description: '',
      defaultAssignedTo: 'random',
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
      updateChore(editingChore.id, editingChore);
    } else {
      const newChore: Chore = {
        id: crypto.randomUUID(),
        title: editingChore.title,
        description: editingChore.description || '',
        defaultAssignedTo: editingChore.defaultAssignedTo || 'random',
        isActive: true,
      };
      addChore(newChore);
    }
    setIsDialogOpen(false);
    setEditingChore(null);
  };

  const getAssignedPerson = (chore: Chore, dateStr: string): Person | null => {
    const override = choreOverrides.find(o => o.choreId === chore.id && o.date === dateStr);
    if (override?.assignedTo) {
      return persons.find(p => p.id === override.assignedTo) || null;
    }
    if (chore.defaultAssignedTo === 'random') {
      // Deterministic shuffle based on chore index and date
      const choreIndex = chores.findIndex(c => c.id === chore.id);
      const dateVal = new Date(dateStr).getTime() / (1000 * 60 * 60 * 24);
      const personIndex = Math.abs(Math.floor(choreIndex + dateVal)) % persons.length;
      return persons[personIndex];
    }
    return persons.find(p => p.id === chore.defaultAssignedTo) || null;
  };

  const isCompleted = (choreId: string, dateStr: string) => {
    const override = choreOverrides.find(o => o.choreId === choreId && o.date === dateStr);
    return !!override?.completed;
  };

  const toggleChoreCompletion = (choreId: string, dateStr: string) => {
    const current = isCompleted(choreId, dateStr);
    updateChoreOverride(choreId, dateStr, { completed: !current });
  };

  const handleManualAssign = (choreId: string, dateStr: string, personId: string) => {
    updateChoreOverride(choreId, dateStr, { assignedTo: personId });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">{t.dailyChores}</h1>
            <p className="text-muted-foreground font-bold">Manage and view the family's daily tasks.</p>
          </div>
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full sm:w-auto">
            <TabsList className="rounded-full p-1 h-12 bg-white border-2 shadow-sm">
              <TabsTrigger value="schedule" className="rounded-full px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t.schedule}
              </TabsTrigger>
              <TabsTrigger value="library" className="rounded-full px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Library
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === 'schedule' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border-2 shadow-sm">
              <CalendarIcon className="w-6 h-6 text-primary" />
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)}
                className="border-none font-black text-xl p-0 focus-visible:ring-0 shadow-none bg-transparent"
              />
              <div className="flex gap-2 rtl:mr-auto ltr:ml-auto">
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), -1), 'yyyy-MM-dd'))}>
                  <Shuffle className="w-4 h-4 rotate-180" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}>
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chores.filter(c => c.isActive).map(chore => {
                const assignedPerson = getAssignedPerson(chore, selectedDate);
                const completed = isCompleted(chore.id, selectedDate);
                
                return (
                  <div key={chore.id} className={cn(
                    "p-6 bg-white rounded-[2.5rem] border-2 transition-all shadow-sm relative overflow-hidden group",
                    completed ? "opacity-60 border-green-500/20" : "hover:shadow-xl border-muted"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h3 className={cn("text-xl font-black leading-tight", completed && "line-through")}>{chore.title}</h3>
                        {chore.description && <p className="text-sm text-muted-foreground font-medium line-clamp-1">{chore.description}</p>}
                      </div>
                      <button onClick={() => toggleChoreCompletion(chore.id, selectedDate)} className="shrink-0 transition-transform active:scale-90">
                        {completed ? (
                          <CheckCircle2 className="w-10 h-10 text-green-500 animate-pop" />
                        ) : (
                          <Circle className="w-10 h-10 text-muted-foreground/20 hover:text-primary/40" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-3 bg-muted/50 py-2 px-4 rounded-full min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 shadow-sm shrink-0" style={{ borderColor: assignedPerson?.color || '#eee' }}>
                          <Image 
                            src={getAvatarUrl(assignedPerson?.id || 'unknown')} 
                            alt="assigned" 
                            width={32} 
                            height={32}
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest truncate" style={{ color: assignedPerson?.color }}>
                          {assignedPerson ? getPersonName(assignedPerson, settings.language) : '???'}
                        </span>
                      </div>

                      <Select onValueChange={(v) => handleManualAssign(chore.id, selectedDate, v)}>
                        <SelectTrigger className="w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center p-0">
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {persons.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {getPersonName(p, settings.language)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-end">
              <Button onClick={handleCreate} className="rounded-full px-8 h-12 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 stroke-[3px]" />
                {t.addChore}
              </Button>
            </div>

            {chores.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center space-y-6">
                <ClipboardList className="w-24 h-24 text-muted-foreground/30" />
                <p className="text-muted-foreground font-black text-xl">No chores in library.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chores.map(chore => {
                  const person = persons.find(p => p.id === chore.defaultAssignedTo);
                  return (
                    <div key={chore.id} className="p-6 bg-white rounded-[2.5rem] border-2 border-muted hover:border-primary/20 transition-all hover:shadow-xl">
                      <div className="space-y-1 mb-4">
                        <h3 className="text-xl font-black">{chore.title}</h3>
                        <p className="text-sm text-muted-foreground">{chore.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {chore.defaultAssignedTo === 'random' ? t.random : getPersonName(person!, settings.language)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleEdit(chore)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => deleteChore(chore.id)}>
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
                placeholder="e.g., Vacuum Living Room"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.notes}</Label>
              <Textarea 
                value={editingChore?.description || ''} 
                onChange={e => setEditingChore(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                className="rounded-xl border-2 font-medium min-h-[100px]"
                placeholder="Description..."
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Default Assignment</Label>
              <Select 
                value={editingChore?.defaultAssignedTo || 'random'} 
                onValueChange={v => setEditingChore(prev => prev ? ({ ...prev, defaultAssignedTo: v }) : null)}
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
