"use client"

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { generateTimeSlots, getOccurrencesForDate, formatTime } from '@/lib/utils';
import { format, startOfWeek, addDays } from 'date-fns';
import { EventBlock } from './EventBlock';
import { EventDialog } from './EventDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Layers, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, useDroppable } from '@dnd-kit/core';

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
      className={`h-16 border-b border-dashed last:border-0 cursor-crosshair transition-colors relative ${
        isOver ? 'bg-primary/20 ring-2 ring-primary ring-inset z-20' : 'hover:bg-primary/5'
      }`}
      onClick={onSlotClick}
    >
      {children}
    </div>
  );
};

export const CalendarView: React.FC = () => {
  const { settings, persons, series, overrides, templates, moveEvent } = useStore();
  const t = getTranslation(settings.language);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedPersonId, setSelectedPersonId] = useState<string | 'all'>('all');
  
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ seriesId?: string; date: string; personId?: string; startTime?: string; templateId?: string } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const timeSlots = generateTimeSlots(settings.dayStartTime, settings.dayEndTime);
  const weekStart = startOfWeek(currentDate);
  const days = viewMode === 'day' ? [currentDate] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredPersons = selectedPersonId === 'all' 
    ? persons 
    : persons.filter(p => p.id === selectedPersonId);

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
      // Over ID is formatted as "date|personId|time"
      const [date, personId, time] = String(over.id).split('|');
      // Active ID is formatted as "seriesId_date"
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

  return (
    <DndContext 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden bg-card rounded-3xl border-2 shadow-xl ring-1 ring-black/5">
        {/* Header Controls */}
        <div className="p-4 border-b-2 flex flex-wrap items-center justify-between gap-4 bg-muted/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full hover:bg-primary hover:text-white" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-48 font-black text-lg rounded-full flex gap-2 border-2 hover:border-primary transition-all">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {format(currentDate, viewMode === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" className="rounded-full hover:bg-primary hover:text-white" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-muted p-1 rounded-full border shadow-inner">
              <button 
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
              >
                {t.day}
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
              >
                {t.week}
              </button>
            </div>

            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger className="w-44 rounded-full font-bold border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{t.allPeople}</SelectItem>
                {persons.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="secondary" className="rounded-full font-bold shadow-sm hover:shadow-md transition-all" onClick={() => setIsTemplatePickerOpen(true)}>
                <Layers className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
                {t.fromTemplate}
              </Button>
              <Button className="rounded-full font-black shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95" onClick={handleAddEvent}>
                <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                {t.addEvent}
              </Button>
            </div>
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-auto relative bg-slate-50/50">
          <div className="flex min-w-[800px] h-full">
            {/* Time Axis */}
            <div className="w-24 sticky left-0 z-20 bg-background/80 backdrop-blur-md border-r-2 shadow-sm">
              <div className="h-14 border-b-2" />
              {timeSlots.map(slot => (
                <div key={slot} className="h-16 text-sm font-black text-muted-foreground flex items-center justify-center border-b border-dashed last:border-0 px-2 text-center uppercase">
                  {formatTime(slot)}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex-1 flex">
              {days.map(day => (
                <div key={day.toISOString()} className="flex-1 border-r last:border-0 min-w-0 flex flex-col">
                  {/* Day Header */}
                  <div className="h-14 border-b-2 bg-muted/40 flex items-center justify-center text-sm font-black sticky top-0 z-10 backdrop-blur-md uppercase tracking-wider text-muted-foreground">
                    {format(day, 'EEE d')}
                  </div>

                  {/* Person Sub-columns */}
                  <div className="flex-1 flex relative">
                     {filteredPersons.map(p => {
                      const occurrences = getOccurrencesForDate(series, day, overrides).filter(occ => occ.personId === p.id);
                      const dayStr = format(day, 'yyyy-MM-dd');
                      
                      return (
                        <div key={p.id} className="flex-1 border-r last:border-0 relative bg-white/30 group">
                          {selectedPersonId === 'all' && (
                            <div 
                              className="h-8 flex items-center justify-center text-[10px] font-black border-b-2 sticky top-14 z-10 shadow-sm transition-colors" 
                              style={{ backgroundColor: `${p.color}15`, color: p.color, borderColor: `${p.color}30` }}
                            >
                              {p.name}
                            </div>
                          )}
                          {/* Grid Lines and Droppable Areas */}
                          <div className="absolute inset-0">
                            {timeSlots.map(slot => (
                              <GridSlot 
                                key={slot}
                                id={`${dayStr}|${p.id}|${slot}`}
                                onSlotClick={() => handleGridClick(day, p.id, slot)}
                              />
                            ))}
                          </div>
                          {/* Events */}
                          <div className="absolute inset-0 pointer-events-none">
                            {occurrences.map((occ, idx) => (
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
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeDragOccurrence ? (
            <div className="w-[180px] cursor-grabbing">
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

        {/* Template Picker Dialog */}
        <Dialog open={isTemplatePickerOpen} onOpenChange={setIsTemplatePickerOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col rounded-3xl border-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                {t.fromTemplate}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="col-span-full text-center py-16 text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  {t.searchTemplates}
                </div>
              ) : (
                templates.map(tpl => (
                  <Card 
                    key={tpl.id} 
                    className="cursor-pointer hover:border-primary hover:shadow-lg transition-all border-l-8 border-2 group"
                    style={{ borderLeftColor: tpl.color || '#ddd' }}
                    onClick={() => handlePickTemplate(tpl.id)}
                  >
                    <CardContent className="p-4">
                      <div className="font-black text-xl group-hover:text-primary transition-colors truncate">{tpl.name}</div>
                      <div className="text-xs font-bold text-muted-foreground flex gap-2 mt-2 bg-muted/50 w-fit px-2 py-1 rounded-md">
                        <span>{tpl.defaultDurationMinutes} {t.mins}</span>
                        {tpl.defaultTime && <span className="opacity-50">•</span>}
                        {tpl.defaultTime && <span>{formatTime(tpl.defaultTime)}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

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
