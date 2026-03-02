
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { generateTimeSlots, getOccurrencesForDate, formatTime, cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import { format, startOfWeek, addDays } from 'date-fns';
import { EventBlock } from './EventBlock';
import { EventDialog } from './EventDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { TemplateDialog } from '@/components/templates/TemplateDialog';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useSearchParams, useRouter } from 'next/navigation';

interface GridSlotProps {
  id: string;
  onSlotClick: () => void;
  children?: React.ReactNode;
}

const GridSlot: React.FC<GridSlotProps> = ({ id, onSlotClick, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`h-20 border-b border-muted transition-colors relative ${
        isOver ? 'bg-primary/10 ring-2 ring-primary ring-inset z-20' : 'hover:bg-primary/5'
      }`}
      onClick={onSlotClick}
    >
      {children}
    </div>
  );
};

const CalendarContent: React.FC = () => {
  const { settings, persons, series, overrides, templates, moveEvent, isLoading } = useStore();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ seriesId?: string; date: string; personId?: string; startTime?: string; templateId?: string } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const personParam = searchParams.get('personId');

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    if (personParam && persons.some(p => p.id === personParam)) {
      setSelectedPersonId(personParam);
    } else {
      setSelectedPersonId('all');
    }
  }, [personParam, persons]);

  const t = getTranslation(settings.language);
  const timeSlots = generateTimeSlots(settings.dayStartTime, settings.dayEndTime);
  const weekStart = startOfWeek(currentDate);
  const days = viewMode === 'day' ? [currentDate] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredPersons = selectedPersonId === 'all' 
    ? persons 
    : persons.filter(p => p.id === selectedPersonId);

  const handlePersonChange = (personId: string) => {
    setSelectedPersonId(personId);
    if (personId === 'all') {
      router.push('/');
    } else {
      router.push(`/?personId=${personId}`);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (seriesId: string, date: string) => {
    setEditingEvent({ seriesId, date });
    setIsEventDialogOpen(true);
  };

  const handleGridClick = (day: Date, personId: string, time: string) => {
    setEditingEvent({ 
      date: format(day, 'yyyy-MM-dd'), 
      personId, 
      startTime: time 
    });
    setIsEventDialogOpen(true);
  };

  const handlePickTemplate = (templateId: string) => {
    setEditingEvent({
      date: format(currentDate, 'yyyy-MM-dd'),
      templateId
    });
    setIsTemplatePickerOpen(false);
    setIsEventDialogOpen(true);
  };

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    
    if (over) {
      const [date, personId, time] = String(over.id).split('|');
      const seriesIdDate = String(active.id);
      const seriesId = seriesIdDate.split('_')[0];
      
      if (date && personId && time && seriesId) {
        moveEvent(seriesId, date, time, personId);
      }
    }
  };

  const activeDragOccurrence = activeDragId ? 
    days.flatMap(day => filteredPersons.flatMap(p => getOccurrencesForDate(series, day, overrides).filter(occ => occ.id === activeDragId && occ.personId === p.id)))[0]
    : null;

  // Optimized heights to dedicate more space to the calendar
  const DAY_HEADER_HEIGHT = 40;
  const PERSON_HEADER_HEIGHT = selectedPersonId === 'all' ? 140 : 0;
  const TOTAL_HEADER_HEIGHT = DAY_HEADER_HEIGHT + PERSON_HEADER_HEIGHT;

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-white rounded-[2rem] shadow-2xl animate-pulse">
        <div className="p-4 border-b flex justify-between gap-4 shrink-0">
          <div className="w-48 h-10 bg-muted rounded-2xl" />
          <div className="w-32 h-10 bg-muted rounded-full" />
        </div>
        <div className="flex-1 bg-muted/20" />
      </div>
    );
  }

  return (
    <DndContext 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden bg-white rounded-[2rem] shadow-2xl shadow-black/5 ring-1 ring-black/5">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-full">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-white shadow-sm transition-all" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-white shadow-sm transition-all" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="text-xl font-black rounded-2xl flex gap-2 px-3 hover:bg-primary/10 transition-all">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {format(currentDate, viewMode === 'day' ? 'MMMM d' : 'MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-[2rem] overflow-hidden shadow-2xl border-none" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-muted p-1 rounded-full">
              <button 
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-5 py-1.5 rounded-full text-xs font-black transition-all",
                  viewMode === 'day' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                )}
              >
                {t.day}
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-5 py-1.5 rounded-full text-xs font-black transition-all",
                  viewMode === 'week' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                )}
              >
                {t.week}
              </button>
            </div>

            <Select value={selectedPersonId} onValueChange={handlePersonChange}>
              <SelectTrigger className="w-48 rounded-full font-black border-none bg-muted h-10 px-6 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-none shadow-2xl">
                <SelectItem value="all">{t.allPeople}</SelectItem>
                {persons.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: p.color }}>
                        <Image 
                          src={getAvatarUrl(p.id)} 
                          alt={p.name} 
                          width={32} 
                          height={32} 
                          className={cn(
                            "object-cover", 
                            p.id === 'person3' && "scale-110 -translate-y-4",
                            p.id === 'person4' && "scale-105 translate-y-[-2px]",
                            p.id === 'person2' && "scale-150 translate-y-3",
                            p.id === 'person1' && "scale-110 translate-y-4"
                          )}
                          data-ai-hint="person headshot"
                        />
                      </div>
                      <span className="text-sm">{getPersonName(p, settings.language)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="rounded-full font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 h-10 px-6 text-sm" onClick={handleAddEvent}>
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 stroke-[3px]" />
              {t.addEvent}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative bg-white">
          <div className="flex min-w-[800px] min-h-full">
            <div className="w-20 sticky left-0 z-50 bg-white/80 backdrop-blur-md border-r shrink-0">
              <div style={{ height: `${TOTAL_HEADER_HEIGHT}px` }} />
              {timeSlots.map(slot => (
                <div key={slot} className="h-20 text-[10px] font-black text-muted-foreground flex items-center justify-center px-2 text-center uppercase tracking-widest">
                  {formatTime(slot)}
                </div>
              ))}
            </div>

            <div className="flex-1 flex min-h-full">
              {days.map(day => (
                <div key={day.toISOString()} className="flex-1 border-r last:border-r-0 min-w-0 flex flex-col min-h-full">
                  <div 
                    className="flex items-center justify-center text-[10px] font-black sticky top-0 z-40 bg-white/50 backdrop-blur-sm uppercase tracking-[0.2em] text-muted-foreground shrink-0 border-b"
                    style={{ height: `${DAY_HEADER_HEIGHT}px` }}
                  >
                    {format(day, 'EEEE d')}
                  </div>

                  <div className="flex-1 flex relative min-h-full">
                    {filteredPersons.map(p => {
                      const occurrences = getOccurrencesForDate(series, day, overrides).filter(occ => occ.personId === p.id);
                      const dayStr = format(day, 'yyyy-MM-dd');
                      return (
                        <div key={p.id} className="flex-1 border-r last:border-r-0 relative group min-h-full flex flex-col">
                          {selectedPersonId === 'all' && (
                            <div 
                              className="flex items-center justify-center text-sm font-black border-b sticky z-30 transition-colors uppercase tracking-widest shrink-0" 
                              style={{ 
                                height: `${PERSON_HEADER_HEIGHT}px`,
                                top: `${DAY_HEADER_HEIGHT}px`,
                                backgroundColor: `white`, 
                                color: p.color, 
                              }}
                            >
                              <div className="flex flex-col items-center gap-2 p-2">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 shadow-md transition-transform group-hover:scale-110" style={{ borderColor: p.color }}>
                                  <Image 
                                    src={getAvatarUrl(p.id)} 
                                    alt={p.name} 
                                    width={80} 
                                    height={80} 
                                    className={cn(
                                      "object-cover", 
                                      p.id === 'person3' && "scale-110 -translate-y-4",
                                      p.id === 'person4' && "scale-105 translate-y-[-2px]",
                                      p.id === 'person2' && "scale-150 translate-y-3",
                                      p.id === 'person1' && "scale-110 translate-y-4"
                                    )}
                                    data-ai-hint="person headshot"
                                  />
                                </div>
                                <span className="text-[10px] font-black">{getPersonName(p, settings.language)}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="relative flex-1">
                            {timeSlots.map(slot => (
                              <GridSlot 
                                key={slot}
                                id={`${dayStr}|${p.id}|${slot}`}
                                onSlotClick={() => handleGridClick(day, p.id, slot)}
                              />
                            ))}

                            <div className="absolute inset-0 pointer-events-none">
                              {occurrences.map((occ) => (
                                <div key={occ.id} className="pointer-events-auto">
                                  <EventBlock
                                    occurrence={occ}
                                    dayStart={settings.dayStartTime}
                                    color={p.color}
                                    onClick={() => handleEditEvent(occ.seriesId, occ.date)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragOccurrence ? (
            <div className="w-[200px] cursor-grabbing">
              <EventBlock
                occurrence={activeDragOccurrence}
                dayStart={settings.dayStartTime}
                color={persons.find(p => p.id === activeDragOccurrence.personId)?.color || '#000'}
                onClick={() => {}}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>

        <Dialog open={isTemplatePickerOpen} onOpenChange={setIsTemplatePickerOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-3xl font-black">Templates</DialogTitle>
                <Button size="icon" variant="ghost" onClick={() => setIsCreateTemplateOpen(true)} className="rounded-full bg-muted">
                  <Plus className="w-5 h-5 text-primary" />
                </Button>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 p-8 pt-0 max-h-[60vh] overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-48 h-48 mx-auto rounded-3xl overflow-hidden opacity-50 grayscale shadow-lg">
                    <Image 
                      src={PlaceHolderImages.find(img => img.id === 'empty-templates')?.imageUrl || 'https://picsum.photos/seed/empty/400/400'} 
                      alt="No templates" 
                      width={200} 
                      height={200}
                      className="object-cover"
                      data-ai-hint="organized library"
                    />
                  </div>
                  <p className="text-muted-foreground font-bold">{t.searchTemplates}</p>
                </div>
              ) : (
                templates.map(tpl => (
                  <button 
                    key={tpl.id} 
                    className="flex items-center justify-between p-6 rounded-3xl bg-muted/40 hover:bg-primary/10 transition-all text-left group"
                    onClick={() => handlePickTemplate(tpl.id)}
                  >
                    <div>
                      <div className="font-black text-xl group-hover:text-primary transition-colors">{tpl.name}</div>
                      <div className="text-sm font-bold text-muted-foreground mt-1">
                        {tpl.defaultDurationMinutes} {t.mins}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                      <Plus className="w-5 h-5 text-primary stroke-[3px]" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <TemplateDialog 
          open={isCreateTemplateOpen}
          onOpenChange={setIsCreateTemplateOpen}
        />

        <EventDialog
          open={isEventDialogOpen}
          onOpenChange={setIsEventDialogOpen}
          initialDate={currentDate}
          eventToEdit={editingEvent}
        />
      </div>
    </DndContext>
  );
};

export const CalendarView: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex-1 bg-white/50 animate-pulse rounded-[2rem]" />}>
      <CalendarContent />
    </Suspense>
  );
};
