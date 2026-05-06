"use client"

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { generateTimeSlots, getOccurrencesForDate, formatTime, cn, getAvatarUrl, getPersonName, timeToMinutes } from '@/lib/utils';
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
import confetti from 'canvas-confetti';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
      className={`h-24 border-b border-muted/30 transition-colors relative ${
        isOver ? 'bg-primary/5' : 'hover:bg-primary/5'
      }`}
      onClick={onSlotClick}
    >
      {children}
    </div>
  );
};

const playDing = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const getEmojiForEvent = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('swim') || t.includes('سباحة')) return '🏊‍♀️';
  if (t.includes('sleep') || t.includes('bed') || t.includes('نوم')) return '🛏️';
  if (t.includes('school') || t.includes('مدرسة')) return '🏫';
  if (t.includes('eat') || t.includes('food') || t.includes('lunch') || t.includes('dinner') || t.includes('غداء') || t.includes('عشاء') || t.includes('إفطار')) return '🍽️';
  if (t.includes('play') || t.includes('لعب')) return '🧸';
  if (t.includes('read') || t.includes('book') || t.includes('قرائة')) return '📚';
  if (t.includes('homework') || t.includes('study') || t.includes('مذاكرة') || t.includes('واجب')) return '✏️';
  if (t.includes('tv') || t.includes('watch') || t.includes('تلفزيون')) return '📺';
  if (t.includes('bath') || t.includes('shower') || t.includes('استحمام') || t.includes('حمام')) return '🛁';
  if (t.includes('quran') || t.includes('pray') || t.includes('صلاة') || t.includes('قرآن')) return '🕌';
  if (t.includes('gym') || t.includes('sport') || t.includes('تمرين') || t.includes('رياضة') || t.includes('karate') || t.includes('كاراتيه')) return '🥋';
  return '✨';
};

const KidsCalendarView: React.FC<{ day: Date, personId: string, series: any[], overrides: any[], toggleCompletion: any }> = ({ day, personId, series, overrides, toggleCompletion }) => {
  const { persons, settings } = useStore();
  const person = persons.find(p => p.id === personId);
  const dayOccurrences = getOccurrencesForDate(series, day, overrides);
  // Filter for the selected person, kids, or everyone
  let displayedOccurrences = dayOccurrences;
  if (personId !== 'all') {
    const isKid = personId === 'person1' || personId === 'person2';
    displayedOccurrences = dayOccurrences.filter(occ => 
      occ.personId === personId || 
      occ.personId === 'all' || 
      (isKid && occ.personId === 'kids')
    );
  }

  // Sort by start time
  displayedOccurrences.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Categorize
  const past = displayedOccurrences.filter(occ => isToday && timeToMinutes(occ.endTime) <= nowMinutes);
  const now = displayedOccurrences.filter(occ => isToday && timeToMinutes(occ.startTime) <= nowMinutes && timeToMinutes(occ.endTime) > nowMinutes);
  const future = displayedOccurrences.filter(occ => !isToday || timeToMinutes(occ.startTime) > nowMinutes);

  const handleToggle = (seriesId: string, date: string, type?: 'independent' | 'with_help') => {
    playDing();
    toggleCompletion(seriesId, date, type);
    
    const overrideId = `${seriesId}_${date}`;
    const existing = overrides.find(o => o.id === overrideId);
    if (!existing?.completed) {
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#FBBF24', '#F87171', '#34D399', '#60A5FA']
      });
    }
  };

  const renderEventList = (title: string, events: any[], colorClass: string, bgClass: string, isNow: boolean = false) => {
    if (events.length === 0) return null;
    return (
      <div className="space-y-4 mb-8">
        <h3 className={cn("text-2xl font-black uppercase tracking-widest", colorClass)}>{title}</h3>
        <div className="space-y-4">
          {events.map(occ => {
            const isCompleted = occ.completed;
            const emoji = getEmojiForEvent(occ.title);
            return (
              <Card 
                key={occ.id} 
                className={cn(
                  "border-4 rounded-[2rem] overflow-hidden transition-all duration-300",
                  isCompleted ? "bg-muted/30 border-muted/50 scale-[0.98] opacity-70" : bgClass,
                  isNow && !isCompleted ? "border-primary shadow-xl scale-[1.02]" : ""
                )}
              >
                <div className="flex items-center p-6 gap-6">
                  <div className="text-6xl">{emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">
                      {formatTime(occ.startTime)} - {formatTime(occ.endTime)}
                    </div>
                    <div className={cn(
                      "text-3xl font-black transition-all",
                      isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {occ.title}
                    </div>
                  </div>
                  <div className="flex items-center justify-center p-4">
                    {isCompleted ? (
                      <button 
                        onClick={() => handleToggle(occ.seriesId, occ.date)}
                        className="bg-primary/20 text-primary font-black py-3 px-6 rounded-2xl flex items-center gap-2 shadow-inner border-2 border-primary/30"
                      >
                        ✅ Done
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleToggle(occ.seriesId, occ.date, 'independent')}
                          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-black py-2.5 px-4 rounded-2xl flex items-center gap-2 transition-colors border-2 border-emerald-200 shadow-sm whitespace-nowrap text-sm"
                        >
                          🖐️ Done Alone
                        </button>
                        <button 
                          onClick={() => handleToggle(occ.seriesId, occ.date, 'with_help')}
                          className="bg-amber-100 text-amber-700 hover:bg-amber-200 font-black py-2.5 px-4 rounded-2xl flex items-center gap-2 transition-colors border-2 border-amber-200 shadow-sm whitespace-nowrap text-sm"
                        >
                          🤝 With Help
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-12 bg-white scroll-smooth min-h-full">
      <div className="max-w-3xl mx-auto">
        {person && (
          <div className="flex items-center gap-6 mb-10 bg-muted/5 p-6 rounded-[3rem] border-4 shadow-sm" style={{ borderColor: `${person.color}30` }}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl shrink-0 bg-white" style={{ borderColor: person.color }}>
              <Image 
                src={getAvatarUrl(person.id)} 
                alt={person.name} 
                width={96} 
                height={96} 
                className={cn(
                  "object-cover w-full h-full", 
                  person.id === 'person3' && "scale-110 -translate-y-2",
                  person.id === 'person4' && "scale-105 translate-y-[-1px]",
                  person.id === 'person2' && "scale-150 translate-y-2",
                  person.id === 'person1' && "scale-110 translate-y-2"
                )}
                data-ai-hint="person headshot"
              />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-black" style={{ color: person.color }}>{getPersonName(person, settings.language)}</h2>
              <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm mt-1 opacity-50">My Calendar</p>
            </div>
          </div>
        )}

        {displayedOccurrences.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <div className="text-8xl mb-6">🏝️</div>
            <h2 className="text-3xl font-black text-muted-foreground">No events today!</h2>
          </div>
        )}
        
        {renderEventList("Happening Now", now, "text-primary", "bg-primary/5 border-primary/30", true)}
        {renderEventList("Up Next", future, "text-foreground", "bg-white border-muted/30")}
        {renderEventList("All Done", past, "text-muted-foreground", "bg-muted/10 border-muted/20")}
      </div>
    </div>
  );
};

const CalendarContent: React.FC = () => {
  const { settings, persons, series, overrides, templates, moveEvent, isLoading, toggleCompletion } = useStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'kids'>('day');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ seriesId?: string; date: string; personId?: string; startTime?: string; templateId?: string } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (mounted && scrollContainerRef.current && !isLoading) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const startMins = timeToMinutes(settings.dayStartTime);
      
      // Calculate scroll position (96px per 30 mins)
      if (currentMins > startMins) {
        // Offset by ~60 mins to show a bit of the previous hour
        const scrollMins = currentMins - startMins - 60;
        const scrollTop = (Math.max(0, scrollMins) / 30) * 96;
        scrollContainerRef.current.scrollTop = scrollTop;
      }
    }
  }, [mounted, isLoading, settings.dayStartTime]);

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

  const DAY_HEADER_HEIGHT = 40;
  const PERSON_HEADER_HEIGHT = selectedPersonId === 'all' ? 80 : 0;
  const TOTAL_HEADER_HEIGHT = DAY_HEADER_HEIGHT + PERSON_HEADER_HEIGHT;
  const SLOT_HEIGHT_30MIN = 96; // Matching GridSlot's h-24
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
        <div className="p-1 border-b flex flex-wrap items-center justify-between gap-1 shrink-0">
          <div className="flex items-center gap-1">
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
                <Button variant="ghost" className="text-base font-black rounded-xl flex gap-1 px-2 h-9 hover:bg-primary/10 transition-all">
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

          <div className="flex items-center gap-1">
            <div className="flex bg-muted p-1 rounded-full">
              <button 
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black transition-all",
                  viewMode === 'day' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                )}
              >
                {t.day}
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black transition-all",
                  viewMode === 'week' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                )}
              >
                {t.week}
              </button>
              <button 
                onClick={() => setViewMode('kids')}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black transition-all",
                  viewMode === 'kids' ? 'bg-primary shadow-sm text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                KIDS
              </button>
            </div>

            <Select value={selectedPersonId} onValueChange={handlePersonChange}>
              <SelectTrigger className="w-32 rounded-full font-black border-none bg-muted h-8 px-3 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">{t.allPeople}</SelectItem>
                {persons.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-5 h-5 rounded-full overflow-hidden border shadow-sm" style={{ borderColor: p.color }}>
                        <Image 
                          src={getAvatarUrl(p.id)} 
                          alt={p.name} 
                          width={20} 
                          height={20} 
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
                      <span className="text-[10px]">{getPersonName(p, settings.language)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="rounded-full font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 h-8 px-4 text-[10px]" onClick={handleAddEvent}>
              <Plus className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0 stroke-[3px]" />
              {t.addEvent}
            </Button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative bg-white scroll-smooth"
        >
          {viewMode === 'kids' ? (
             <KidsCalendarView 
               day={currentDate} 
               personId={selectedPersonId} 
               series={series} 
               overrides={overrides} 
               toggleCompletion={toggleCompletion} 
             />
          ) : (
          <div className="flex min-w-[800px] min-h-full">
            {/* Time Labels Column */}
            <div className="w-16 sticky left-0 z-50 bg-white/80 backdrop-blur-md border-r shrink-0">
              <div style={{ height: `${TOTAL_HEADER_HEIGHT}px` }} className="border-b border-muted/30" />
              <div className="relative">
                {timeSlots.map(slot => (
                  <div key={slot} className="h-24 relative border-b border-muted/30">
                    <div className="absolute top-0 left-0 w-full flex items-center justify-center -translate-y-1/2">
                      <span className="bg-white/90 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        {formatTime(slot)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                      className="flex items-center justify-center text-[10px] font-black sticky top-0 z-40 bg-white/80 backdrop-blur-sm uppercase tracking-[0.2em] text-muted-foreground shrink-0 border-b border-muted/30"
                      style={{ height: `${DAY_HEADER_HEIGHT}px` }}
                    >
                      {format(day, 'EEEE d')}
                    </div>

                    <div className="flex-1 flex relative min-h-full">
                      {filteredPersons.map(p => {
                        const personOccurrences = individualOccurrences.filter(occ => occ.personId === p.id);
                        const isKid = p.id === 'person1' || p.id === 'person2';
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
                                className="flex items-center justify-center text-sm font-black border-b border-muted/30 sticky z-30 transition-colors uppercase tracking-widest shrink-0" 
                                style={{ 
                                  height: `${PERSON_HEADER_HEIGHT}px`,
                                  top: `${DAY_HEADER_HEIGHT}px`,
                                  backgroundColor: `white`, 
                                  color: p.color, 
                                }}
                              >
                                <div className="flex flex-col items-center gap-0.5 p-1">
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
                                  <span className="text-[7px] font-black">{getPersonName(p, settings.language)}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="relative flex-1">
                              {/* Background Grid Lines (matching labels) */}
                              <div className="absolute inset-0 pointer-events-none">
                                {timeSlots.map(slot => (
                                  <div key={slot} className="h-24 border-b border-muted/30" />
                                ))}
                              </div>

                              {/* Interactive Slots */}
                              <div className="relative z-10">
                                {timeSlots.map(slot => (
                                  <GridSlot 
                                    key={slot}
                                    id={`${dayStr}|${p.id}|${slot}`}
                                    onSlotClick={() => handleGridClick(day, p.id, slot)}
                                  />
                                ))}
                              </div>

                              <div className="absolute inset-0 pointer-events-none z-20">
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
                        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ top: `${PERSON_HEADER_HEIGHT + DAY_HEADER_HEIGHT}px` }}>
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
          )}
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
