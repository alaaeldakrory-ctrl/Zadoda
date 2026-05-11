
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
  UserPlus,
  MinusCircle
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
    updateChoreOverride,
    deleteChoreOverride
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
  const scheduledChores = chores.filter(chore => 
    choreOverrides.some(o => o.choreId === chore.id && o.date === selectedDate)
  ).map(chore => {
    const override = choreOverrides.find(o => o.choreId === chore.id && o.date === selectedDate);
    return { ...chore, override };
  });

  const handleAddToSchedule = (choreId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;
    
    updateChoreOverride(choreId, selectedDate, { 
      assignedTo: chore.defaultAssignedTo === 'random' ? undefined : chore.defaultAssignedTo,
      completed: false 
    });
    setIsPickDialogOpen(false);
  };

  const handleRemoveFromSchedule = (choreId: string) => {
    deleteChoreOverride(choreId, selectedDate);
  };

  const handleShuffle = () => {
    if (scheduledChores.length === 0) return;
    
    const pool = [...persons];
    scheduledChores.forEach((sc) => {
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
      <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">{t.dailyChores}</h1>
            <p className="text-lg text-muted-foreground font-bold opacity-70">Plan and assign tasks for the family.</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full sm:w-auto">
            <TabsList className="rounded-full p-1.5 h-14 lg:h-16 bg-white border-2 shadow-sm">
              <TabsTrigger 
                value="schedule" 
                className="rounded-full px-8 lg:px-10 font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.schedule}
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="rounded-full px-8 lg:px-10 font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.fixedEvents}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === 'schedule' ? (
          <div className="space-y-10">
            {/* Date Navigation & Actions */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 bg-white p-3 lg:p-4 rounded-[2.5rem] border-2 shadow-sm w-full lg:w-auto">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-muted" onClick={() => navigateDay(-1)}>
                    <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-muted" onClick={() => navigateDay(1)}>
                    <ChevronRight className="w-6 h-6 rtl:rotate-180" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 px-6 border-l-2 border-r-2 border-dashed border-muted">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  <span className="text-xl lg:text-2xl font-black uppercase tracking-tighter whitespace-nowrap">
                    {format(parseISO(selectedDate), 'EEEE d MMMM')}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 w-full lg:w-auto">
                <Button 
                  onClick={() => setIsPickDialogOpen(true)} 
                  className="flex-1 lg:flex-none rounded-full px-10 h-14 font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all text-xs uppercase tracking-widest"
                >
                  <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                  {t.addChore}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleShuffle} 
                  className="flex-1 lg:flex-none rounded-full px-10 h-14 font-black border-2 hover:bg-primary/5 text-xs uppercase tracking-widest"
                >
                  <Shuffle className="w-5 h-5 mr-2 text-primary" />
                  {t.random}
                </Button>
              </div>
            </div>

            {/* Chores Grid */}
            {scheduledChores.length === 0 ? (
              <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center opacity-40">
                  <ClipboardList className="w-16 h-16 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <p className="text-muted-foreground font-black text-2xl">No chores planned for today.</p>
                  <p className="text-muted-foreground/60 font-bold max-w-sm mx-auto text-base">Pick a task from the library to get started.</p>
                </div>
                <Button onClick={() => setIsPickDialogOpen(true)} variant="link" className="font-black uppercase tracking-[0.2em] text-primary text-sm">
                  {t.addChore}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {scheduledChores.map(sc => {
                  const assignedPerson = persons.find(p => p.id === sc.override?.assignedTo);
                  const isCompleted = !!sc.override?.completed;

                  return (
                    <div key={sc.id} className={cn(
                      "group p-10 min-h-[240px] bg-white rounded-[3.5rem] border-2 transition-all relative overflow-hidden flex flex-col justify-between",
                      isCompleted ? "border-green-500/20 bg-green-50/10 grayscale-[0.3]" : "hover:shadow-2xl hover:-translate-y-1 border-muted shadow-sm"
                    )}>
                      <div className="flex justify-between items-start mb-8 gap-6">
                        <div className="space-y-2 flex-1">
                          <h3 className={cn("text-2xl font-black leading-tight", isCompleted && "line-through opacity-50")}>
                            {sc.title}
                          </h3>
                          {sc.description && (
                            <p className="text-sm text-muted-foreground font-medium line-clamp-2 opacity-70 leading-relaxed">{sc.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full text-destructive hover:bg-destructive/10" 
                            onClick={() => handleRemoveFromSchedule(sc.id)}
                            title="Remove"
                          >
                            <MinusCircle className="w-6 h-6" />
                          </Button>
                          <div className="shrink-0 flex items-center">
                            {isCompleted ? (
                              <button 
                                onClick={() => toggleCompletion(sc.id)}
                                className="bg-primary/20 text-primary font-black py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-inner border-2 border-primary/30 text-sm whitespace-nowrap"
                              >
                                ✅ Done
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleCompletion(sc.id)}
                                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-black py-2 px-3 rounded-2xl flex items-center gap-2 transition-colors border-2 border-emerald-200 shadow-sm whitespace-nowrap text-xs"
                              >
                                ☑️ Mark Done
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t-2 border-dashed border-muted">
                        <div className="flex items-center gap-4 bg-muted/40 py-3 px-6 rounded-full min-w-0 flex-1 mr-6">
                          <div 
                            className="w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm shrink-0 flex items-center justify-center bg-white" 
                            style={{ borderColor: assignedPerson?.color || '#eee' }}
                          >
                            {assignedPerson ? (
                              <Image 
                                src={getAvatarUrl(assignedPerson.id)} 
                                alt="assigned" 
                                width={40} 
                                height={40}
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
                          <SelectTrigger className="w-12 h-12 rounded-full border-2 bg-white flex items-center justify-center p-0 hover:bg-muted transition-colors shrink-0 shadow-sm">
                            <Pencil className="w-5 h-5 text-muted-foreground" />
                          </SelectTrigger>
                          <SelectContent className="rounded-[2rem] border-2 shadow-2xl p-2">
                            {persons.map(p => (
                              <SelectItem key={p.id} value={p.id} className="rounded-xl h-12">
                                <div className="flex items-center gap-3 font-bold">
                                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
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
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-[0.3em] text-muted-foreground/40">Task Definitions</h2>
              <Button 
                onClick={handleCreateChore} 
                className="rounded-full px-10 h-14 font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all text-xs uppercase tracking-widest"
              >
                <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                Create New
              </Button>
            </div>

            {chores.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center space-y-8">
                <Library className="w-24 h-24 text-muted-foreground/20" />
                <p className="text-muted-foreground font-black text-2xl">Your library is empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {chores.map(chore => (
                  <div key={chore.id} className="p-8 bg-white rounded-[3.5rem] border-2 border-muted hover:border-primary/30 transition-all hover:shadow-2xl relative group">
                    <div className="space-y-3 mb-10">
                      <h3 className="text-2xl font-black">{chore.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-3 opacity-70 leading-relaxed">{chore.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t-2 border-dashed border-muted/50">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-5 py-2 rounded-full border shadow-sm">
                        {chore.defaultAssignedTo === 'random' ? t.random : getPersonName(persons.find(p => p.id === chore.defaultAssignedTo)!, settings.language)}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 hover:bg-muted" onClick={() => handleEditChore(chore)}>
                          <Pencil className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 hover:bg-destructive/10 text-destructive" onClick={() => deleteChore(chore.id)}>
                          <Trash2 className="w-5 h-5" />
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
        <DialogContent className="rounded-[3rem] sm:max-w-[550px] border-2 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-10 pb-4">
            <DialogTitle className="text-3xl font-black tracking-tight">Pick from Library</DialogTitle>
          </DialogHeader>
          <div className="px-10 pb-10 space-y-4 max-h-[60vh] overflow-y-auto">
            {chores.length === 0 ? (
              <p className="text-center py-16 text-muted-foreground font-bold text-lg">No chores in library yet.</p>
            ) : (
              chores.filter(c => !scheduledChores.some(sc => sc.id === c.id)).map(chore => (
                <button
                  key={chore.id}
                  onClick={() => handleAddToSchedule(chore.id)}
                  className="w-full text-left p-6 rounded-[2rem] bg-muted/40 hover:bg-primary/10 transition-all group flex items-center justify-between border-2 border-transparent hover:border-primary/20 shadow-sm"
                >
                  <div className="min-w-0 pr-6 flex-1">
                    <h4 className="font-black text-xl group-hover:text-primary transition-colors">{chore.title}</h4>
                    {chore.description && <p className="text-xs text-muted-foreground mt-1 truncate opacity-70 font-medium">{chore.description}</p>}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-all border shrink-0">
                    <Plus className="w-6 h-6 text-primary stroke-[3px]" />
                  </div>
                </button>
              ))
            )}
            {chores.filter(c => !scheduledChores.some(sc => sc.id === c.id)).length === 0 && chores.length > 0 && (
              <p className="text-center py-16 text-muted-foreground font-bold text-lg">All library chores are already scheduled.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create/Edit Library Chore */}
      <Dialog open={isLibraryDialogOpen} onOpenChange={setIsLibraryDialogOpen}>
        <DialogContent className="rounded-[3rem] sm:max-w-[500px] border-2 shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight">{editingChore?.id ? t.edit : t.addChore}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-8 py-8">
            <div className="grid gap-3">
              <Label className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">{t.title}</Label>
              <Input 
                value={editingChore?.title || ''} 
                onChange={e => setEditingChore(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                className="rounded-2xl border-2 font-black h-14 text-xl px-6 focus:border-primary"
                placeholder="e.g., Clean Kitchen"
              />
            </div>
            <div className="grid gap-3">
              <Label className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">{t.notes}</Label>
              <Textarea 
                value={editingChore?.description || ''} 
                onChange={e => setEditingChore(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                className="rounded-2xl border-2 font-medium min-h-[120px] p-6 text-base leading-relaxed focus:border-primary"
                placeholder="Any special details..."
              />
            </div>
            <div className="grid gap-3">
              <Label className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Default Assignee</Label>
              <Select 
                value={editingChore?.defaultAssignedTo || 'random'} 
                onValueChange={v => setEditingChore(prev => prev ? ({ ...prev, defaultAssignedTo: v }) : null)}
              >
                <SelectTrigger className="rounded-2xl border-2 h-14 font-black px-6 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[2rem] border-2 shadow-2xl p-2">
                  <SelectItem value="random" className="rounded-xl h-12">
                    <div className="flex items-center gap-3 font-bold">
                      <Shuffle className="w-5 h-5 text-primary" />
                      {t.random}
                    </div>
                  </SelectItem>
                  {persons.map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl h-12">
                      <div className="flex items-center gap-3 font-bold">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                        {getPersonName(p, settings.language)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-4">
            <Button variant="ghost" className="rounded-full font-bold h-14 px-8 text-base" onClick={() => setIsLibraryDialogOpen(false)}>{t.cancel}</Button>
            <Button className="rounded-full font-black px-12 h-14 text-base shadow-xl shadow-primary/20" onClick={handleSaveChore}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
