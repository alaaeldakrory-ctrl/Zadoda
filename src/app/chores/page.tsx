
"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Chore, Person, ChoreOverride } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Shuffle, 
  ClipboardList, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle,
  ChevronLeft,
  ChevronRight,
  Library,
  UserPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addDays, parseISO } from 'date-fns';
import Image from 'next/image';

export default function ChoresPage() {
  const { 
    settings, 
    persons, 
    chores, 
    choreOverrides, 
    addChore, 
    updateChore, 
    deleteChore, 
    updateChoreOverride 
  } = useStore();
  const t = getTranslation(settings.language);

  const [activeTab, setActiveTab] = useState<'schedule' | 'library'>('schedule');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Library Management States
  const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Partial<Chore> | null>(null);

  // Pick from Library State
  const [isPickDialogOpen, setIsPickDialogOpen] = useState(false);

  // Date Navigation
  const navigateDay = (amount: number) => {
    const current = parseISO(selectedDate);
    const next = addDays(current, amount);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  // --- Library Logic ---
  const handleCreateChore = () => {
    setEditingChore({ title: '', description: '', defaultAssignedTo: 'random', isActive: true });
    setIsLibraryDialogOpen(true);
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore({ ...chore });
    setIsLibraryDialogOpen(true);
  };

  const handleSaveChore = () => {
    if (!editingChore || !editingChore.title?.trim()) return;
    if (editingChore.id) {
      updateChore(editingChore.id, editingChore);
    } else {
      addChore({
        id: crypto.randomUUID(),
        title: editingChore.title,
        description: editingChore.description || '',
        defaultAssignedTo: editingChore.defaultAssignedTo || 'random',
        isActive: true,
      });
    }
    setIsLibraryDialogOpen(false);
    setEditingChore(null);
  };

  // --- Schedule Logic ---
  // A chore is "on the schedule" for a date if an override exists for it on that date
  const scheduledChores = chores.filter(chore => 
    choreOverrides.some(o => o.choreId === chore.id && o.date === selectedDate)
  ).map(chore => {
    const override = choreOverrides.find(o => o.choreId === chore.id && o.date === selectedDate);
    return { ...chore, override };
  });

  const handleAddToSchedule = (choreId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;
    // Initialize override for this date
    updateChoreOverride(choreId, selectedDate, { 
      assignedTo: chore.defaultAssignedTo === 'random' ? undefined : chore.defaultAssignedTo,
      completed: false 
    });
    setIsPickDialogOpen(false);
  };

  const removeFromSchedule = (choreId: string) => {
    // In a real app we might want a deleteOverride in the store, 
    // but for now we can just assume the store might handle it or we set it to 'deleted'
    // Since our store doesn't have a deleteOverride, we'll just ignore for this MVP 
    // or implement a toggle logic.
  };

  const handleShuffle = () => {
    if (scheduledChores.length === 0) return;
    
    // Create a pool of persons to assign
    const pool = [...persons];
    scheduledChores.forEach((sc, idx) => {
      if (!sc.override?.completed) {
        const randomPerson = pool[Math.floor(Math.random() * pool.length)];
        updateChoreOverride(sc.id, selectedDate, { assignedTo: randomPerson.id });
      }
    });
  };

  const toggleCompletion = (choreId: string) => {
    const sc = scheduledChores.find(s => s.id === choreId);
    if (!sc) return;
    updateChoreOverride(choreId, selectedDate, { completed: !sc.override?.completed });
  };

  const handleManualAssign = (choreId: string, personId: string) => {
    updateChoreOverride(choreId, selectedDate, { assignedTo: personId });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">{t.dailyChores}</h1>
            <p className="text-muted-foreground font-bold">Plan and assign tasks for the family.</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full sm:w-auto">
            <TabsList className="rounded-full p-1 h-14 bg-white border-2 shadow-sm">
              <TabsTrigger 
                value="schedule" 
                className="rounded-full px-8 font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.schedule}
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="rounded-full px-8 font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.fixedEvents}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === 'schedule' ? (
          <div className="space-y-8">
            {/* Date Navigation & Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border-2 shadow-sm w-full md:w-auto">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted" onClick={() => navigateDay(-1)}>
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted" onClick={() => navigateDay(1)}>
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 px-2 border-l border-r border-dashed">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span className="text-xl font-black uppercase tracking-tighter">
                    {format(parseISO(selectedDate), 'EEEE d MMMM')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => setIsPickDialogOpen(true)} 
                  className="flex-1 md:flex-none rounded-full px-6 h-12 font-black shadow-lg shadow-primary/10 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                  {t.addChore}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleShuffle} 
                  className="flex-1 md:flex-none rounded-full px-6 h-12 font-black border-2 hover:bg-primary/5"
                >
                  <Shuffle className="w-5 h-5 mr-2 text-primary" />
                  {t.random}
                </Button>
              </div>
            </div>

            {/* Chores Grid */}
            {scheduledChores.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center">
                  <ClipboardList className="w-16 h-16 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground font-black text-xl">No chores planned for today.</p>
                  <p className="text-muted-foreground/60 font-bold max-w-xs mx-auto text-sm">Pick a task from the library to get started.</p>
                </div>
                <Button onClick={() => setIsPickDialogOpen(true)} variant="link" className="font-black uppercase tracking-widest text-primary">
                  {t.addChore}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledChores.map(sc => {
                  const assignedPerson = persons.find(p => p.id === sc.override?.assignedTo);
                  const isCompleted = !!sc.override?.completed;

                  return (
                    <div key={sc.id} className={cn(
                      "group p-6 bg-white rounded-[2.5rem] border-2 transition-all relative overflow-hidden",
                      isCompleted ? "border-green-500/20 bg-green-50/10 grayscale-[0.3]" : "hover:shadow-2xl hover:-translate-y-1 border-muted"
                    )}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1 min-w-0">
                          <h3 className={cn("text-xl font-black leading-tight truncate", isCompleted && "line-through opacity-50")}>
                            {sc.title}
                          </h3>
                          {sc.description && (
                            <p className="text-sm text-muted-foreground font-medium line-clamp-1">{sc.description}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => toggleCompletion(sc.id)} 
                          className="shrink-0 transition-transform active:scale-90"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-10 h-10 text-green-500 animate-pop" />
                          ) : (
                            <Circle className="w-10 h-10 text-muted-foreground/10 hover:text-primary/30" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-dashed">
                        <div className="flex items-center gap-3 bg-muted/30 py-2 px-4 rounded-full min-w-0 flex-1 mr-4">
                          <div 
                            className="w-8 h-8 rounded-full overflow-hidden border-2 shadow-sm shrink-0 flex items-center justify-center bg-white" 
                            style={{ borderColor: assignedPerson?.color || '#eee' }}
                          >
                            {assignedPerson ? (
                              <Image 
                                src={getAvatarUrl(assignedPerson.id)} 
                                alt="assigned" 
                                width={32} 
                                height={32}
                                className="object-cover"
                              />
                            ) : (
                              <UserPlus className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest truncate" style={{ color: assignedPerson?.color }}>
                            {assignedPerson ? getPersonName(assignedPerson, settings.language) : 'UNASSIGNED'}
                          </span>
                        </div>

                        <Select onValueChange={(v) => handleManualAssign(sc.id, v)} value={assignedPerson?.id}>
                          <SelectTrigger className="w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center p-0 hover:bg-muted transition-colors">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-2 shadow-2xl">
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
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-widest text-muted-foreground/40">Task Definitions</h2>
              <Button 
                onClick={handleCreateChore} 
                className="rounded-full px-8 h-12 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                Create New
              </Button>
            </div>

            {chores.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center space-y-6">
                <Library className="w-24 h-24 text-muted-foreground/20" />
                <p className="text-muted-foreground font-black text-xl">Your library is empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chores.map(chore => (
                  <div key={chore.id} className="p-6 bg-white rounded-[2.5rem] border-2 border-muted hover:border-primary/20 transition-all hover:shadow-xl relative group">
                    <div className="space-y-2 mb-8">
                      <h3 className="text-xl font-black truncate">{chore.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">{chore.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-4 py-1.5 rounded-full">
                        {chore.defaultAssignedTo === 'random' ? t.random : getPersonName(persons.find(p => p.id === chore.defaultAssignedTo)!, settings.language)}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted" onClick={() => handleEditChore(chore)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-destructive/10 text-destructive" onClick={() => deleteChore(chore.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog: Pick from Library */}
      <Dialog open={isPickDialogOpen} onOpenChange={setIsPickDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-[500px] border-2 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-3xl font-black tracking-tight">Pick from Library</DialogTitle>
          </DialogHeader>
          <div className="px-8 pb-8 space-y-3 max-h-[60vh] overflow-y-auto">
            {chores.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground font-bold">No chores in library yet.</p>
            ) : (
              chores.filter(c => !scheduledChores.some(sc => sc.id === c.id)).map(chore => (
                <button
                  key={chore.id}
                  onClick={() => handleAddToSchedule(chore.id)}
                  className="w-full text-left p-5 rounded-3xl bg-muted/40 hover:bg-primary/10 transition-all group flex items-center justify-between"
                >
                  <div className="min-w-0 pr-4">
                    <h4 className="font-black text-lg group-hover:text-primary transition-colors">{chore.title}</h4>
                    {chore.description && <p className="text-xs text-muted-foreground truncate">{chore.description}</p>}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-all border">
                    <Plus className="w-5 h-5 text-primary stroke-[3px]" />
                  </div>
                </button>
              ))
            )}
            {chores.filter(c => !scheduledChores.some(sc => sc.id === c.id)).length === 0 && chores.length > 0 && (
              <p className="text-center py-10 text-muted-foreground font-bold">All library chores are already on today's schedule.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create/Edit Library Chore */}
      <Dialog open={isLibraryDialogOpen} onOpenChange={setIsLibraryDialogOpen}>
        <DialogContent className="rounded-[2.5rem] sm:max-w-[450px] border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingChore?.id ? t.edit : t.addChore}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.title}</Label>
              <Input 
                value={editingChore?.title || ''} 
                onChange={e => setEditingChore(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                className="rounded-xl border-2 font-black h-12 text-lg px-5"
                placeholder="e.g., Clean Kitchen"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.notes}</Label>
              <Textarea 
                value={editingChore?.description || ''} 
                onChange={e => setEditingChore(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                className="rounded-xl border-2 font-medium min-h-[100px] p-5"
                placeholder="Details..."
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Default Assignee</Label>
              <Select 
                value={editingChore?.defaultAssignedTo || 'random'} 
                onValueChange={v => setEditingChore(prev => prev ? ({ ...prev, defaultAssignedTo: v }) : null)}
              >
                <SelectTrigger className="rounded-xl border-2 h-12 font-black px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 shadow-2xl">
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
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-full font-bold h-12 px-6" onClick={() => setIsLibraryDialogOpen(false)}>{t.cancel}</Button>
            <Button className="rounded-full font-black px-10 h-12 shadow-lg shadow-primary/20" onClick={handleSaveChore}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
