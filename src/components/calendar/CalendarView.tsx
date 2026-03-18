"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { generateTimeSlots, getOccurrencesForDate, formatTime, cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import { format, startOfWeek, addDays } from 'date-fns';
import { EventBlock } from './EventBlock';
import { EventDialog } from './EventDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users } from 'lucide-react';
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
      className={`h-24 border-b border-muted transition-colors relative ${
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
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ seriesId?: string; date: string; personId?: string; startTime?: string; templateId?: string } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const personParam = searchParams.get('personId');

  useEffect(() => {
    if (personParam && (personParam === 'all' || persons.some(p => p.id === personParam))) {
      setSelectedPersonId(personParam);
    } else {
      setSelectedPersonId('all');
    }
  }, [personParam, persons]);

  const t = getTranslation(settings.language);
  const timeSlots = generateTimeSlots(settings.dayStartTime, settings.dayEndTime, 30);
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
    days.flatMap(day => getOccurrencesForDate(series, day, overrides).filter(occ => occ.id === activeDragId))[0]
    : null;

  const DAY_HEADER_HEIGHT = 32;
  const PERSON_HEADER_HEIGHT = selectedPersonId === 'all' ? 100 : 0;
  const TOTAL_HEADER_HEIGHT = DAY_HEADER_HEIGHT + PERSON_HEADER_HEIGHT;
  const SLOT_HEIGHT_30MIN = 96; // Matching h-24
  const SLOT_HEIGHT_15MIN = SLOT_HEIGHT_30MIN / 2; // 48px

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-white rounded-[2rem] shadow-2xl animate-pulse">
        <div className="p-2 border-b flex justify-between gap-4 shrink-0">
          <div className="w-48 h-8 bg-muted rounded-xl" />
          <div className="w-32 h-8 bg-muted rounded-full" />
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
        <div className="p-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-full">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-white shadow-sm transition-all" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-white shadow-sm transition-all" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="text-lg font-black rounded-xl flex gap-2 px-3 h-10 hover:bg-primary/10 transition-all">
                  <CalendarIcon className="w-4 h-4 text-primary" />
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

          <div className="flex items-center gap-2">
            <div className="flex bg-muted p-1 rounded-full">
              <button 
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black transition-all",
                  viewMode === 'day' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                )}
              >
                {t.day}
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black transition-all",
                  viewMode === 'week' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                )}
              >
                {t.week}
              </button>
            </div>

            <Select value={selectedPersonId} onValueChange={handlePersonChange}>
              <SelectTrigger className="w-40 rounded-full font-black border-none bg-muted h-9 px-4 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">{t.allPeople}</SelectItem>
                {persons.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-6 h-6 rounded-full overflow-hidden border shadow-sm" style={{ borderColor: p.color }}>
                        <Image 
                          src={getAvatarUrl(p.id)} 
                          alt={p.name} 
                          width={24} 
                          height={24} 
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
                      <span className="text-xs">{getPersonName(p, settings.language)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="rounded-full font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 h-9 px-5 text-xs" onClick={handleAddEvent}>
              <Plus className="w-3 h-3 mr-1.5 rtl:ml-1.5 rtl:mr-0 stroke-[3px]" />
              {t.addEvent}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative bg-white">
          <div className="flex min-w-[800px] min-h-full">
            <div className="w-16 sticky left-0 z-50 bg-white/80 backdrop-blur-md border-r shrink-0">
              <div style={{ height: `${TOTAL_HEADER_HEIGHT}px` }} />
              {timeSlots.map(slot => (
                <div key={slot} className="h-24 text-[9px] font-black text-muted-foreground flex items-center justify-center px-1 text-center uppercase tracking-widest">
                  {formatTime(slot)}
                </div>
              ))}
            </div>

            <div className="flex-1 flex min-h-full">
              {days.map(day => {
                const dayOccurrences = getOccurrencesForDate(series, day, overrides);
                const allPersonOccurrences = dayOccurrences.filter(occ => occ.personId === 'all');
                const kidsPersonOccurrences = dayOccurrences.filter(occ => occ.personId === 'kids');
                const individualOccurrences = dayOccurrences.filter(occ => occ.personId !== 'all' && occ.personId !== 'kids');

                return (
                  <div key={day.toISOString()} className="flex-1 border-r last:border-r-0 min-w-0 flex flex-col min-h-full">
                    <div 
                      className="flex items-center justify-center text-[9px] font-black sticky top-0 z-40 bg-white/50 backdrop-blur-sm uppercase tracking-[0.2em] text-muted-foreground shrink-0 border-b"
                      style={{ height: `${DAY_HEADER_HEIGHT}px` }}
                    >
                      {format(day, 'EEEE d')}
                    </div>

                    <div className="flex-1 flex relative min-h-full">
                      {filteredPersons.map(p => {
                        const personOccurrences = individualOccurrences.filter(occ => occ.personId === p.id);
                        const isKid = p.id === 'person1' || p.id === 'person4';
                        const displayedOccurrences = selectedPersonId === 'all' 
                          ? personOccurrences 
                          : [
                              ...personOccurrences, 
                              ...allPersonOccurrences,
                              ...(isKid ? kidsPersonOccurrences : [])
                            ];
                        
                        const dayStr = format(day, 'yyyy-MM-dd');
                        return (
                          <div key={p.id} className="flex-1 border-r last:border-r-0 relative group min-h-full flex flex-col">
                            {selectedPersonId === 'all' && (
                              <div 
                                className="flex items-center justify-center text-sm font-black border-b sticky z-30 transition-colors uppercase tracking-widest shrink-0" 
                                style={{ 
                                  height: `${PERSON_HEADER_HEIGHT}px`,
                                  top: `0px`,
                                  backgroundColor: `white`, 
                                  color: p.color, 
                                }}
                              >
                                <div className="flex flex-col items-center gap-1 p-1">
                                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-sm transition-transform group-hover:scale-105" style={{ borderColor: p.color }}>
                                    <Image 
                                      src={getAvatarUrl(p.id)} 
                                      alt={p.name} 
                                      width={48} 
                                      height={48} 
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
                                  <span className="text-[8px] font-black">{getPersonName(p, settings.language)}</span>
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
                                {displayedOccurrences.map((occ) => (
                                  <div key={occ.id} className="pointer-events-auto">
                                    <EventBlock
                                      occurrence={occ}
                                      dayStart={settings.dayStartTime}
                                      color={occ.personId === 'all' ? '#454545' : (occ.personId === 'kids' ? '#FBBF24' : p.color)}
                                      slotHeight15Min={SLOT_HEIGHT_15MIN}
                                      onClick={() => handleEditEvent(occ.seriesId, occ.date)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {selectedPersonId === 'all' && (
                        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ top: `${PERSON_HEADER_HEIGHT}px` }}>
                          <div className="relative h-full w-full">
                            <div className="absolute inset-0 z-40">
                              {allPersonOccurrences.map((occ) => (
                                <div key={occ.id} className="pointer-events-auto absolute left-1 right-1">
                                  <EventBlock
                                    occurrence={occ}
                                    dayStart={settings.dayStartTime}
                                    color="#454545" 
                                    slotHeight15Min={SLOT_HEIGHT_15MIN}
                                    onClick={() => handleEditEvent(occ.seriesId, occ.date)}
                                    isFullWidth
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="absolute inset-y-0 left-0 w-1/2 z-40">
                              {kidsPersonOccurrences.map((occ) => (
                                <div key={occ.id} className="pointer-events-auto absolute left-1 right-1">
                                  <EventBlock
                                    occurrence={occ}
                                    dayStart={settings.dayStartTime}
                                    color="#FBBF24" 
                                    slotHeight15Min={SLOT_HEIGHT_15MIN}
                                    onClick={() => handleEditEvent(occ.seriesId, occ.date)}
                                    isFullWidth
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragOccurrence ? (
            <div className="w-[180px] cursor-grabbing">
              <EventBlock
                occurrence={activeDragOccurrence}
                dayStart={settings.dayStartTime}
                color={activeDragOccurrence.personId === 'all' ? '#454545' : persons.find(p => p.id === activeDragOccurrence.personId)?.color || '#000'}
                slotHeight15Min={SLOT_HEIGHT_15MIN}
                onClick={() => {}}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>

        <Dialog open={isTemplatePickerOpen} onOpenChange={setIsTemplatePickerOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-black">Templates</DialogTitle>
                <Button size="icon" variant="ghost" onClick={() => setIsCreateTemplateOpen(true)} className="rounded-full bg-muted h-8 w-8">
                  <Plus className="w-4 h-4 text-primary" />
                </Button>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 p-6 pt-0 max-h-[50vh] overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden opacity-50 grayscale shadow-lg">
                    <Image 
                      src={PlaceHolderImages.find(img => img.id === 'empty-templates')?.imageUrl || 'https://picsum.photos/seed/empty/400/400'} 
                      alt="No templates" 
                      width={160} 
                      height={160}
                      className="object-cover"
                      data-ai-hint="organized library"
                    />
                  </div>
                  <p className="text-muted-foreground font-bold text-sm">{t.searchTemplates}</p>
                </div>
              ) : (
                templates.map(tpl => (
                  <button 
                    key={tpl.id} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 hover:bg-primary/10 transition-all text-left group"
                    onClick={() => handlePickTemplate(tpl.id)}
                  >
                    <div>
                      <div className="font-black text-lg group-hover:text-primary transition-colors">{tpl.name}</div>
                      <div className="text-[10px] font-bold text-muted-foreground mt-1">
                        {tpl.defaultDurationMinutes} {t.mins}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                      <Plus className="w-4 h-4 text-primary stroke-[3px]" />
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
