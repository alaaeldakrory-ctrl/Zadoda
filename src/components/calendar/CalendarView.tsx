
"use client"

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { generateTimeSlots, getOccurrencesForDate } from '@/lib/utils';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { EventBlock } from './EventBlock';
import { EventDialog } from './EventDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export const CalendarView: React.FC = () => {
  const { settings, persons, series, overrides } = useStore();
  const t = getTranslation(settings.language);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedPersonId, setSelectedPersonId] = useState<string | 'all'>('all');
  
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ seriesId?: string; date: string; personId?: string; startTime?: string } | null>(null);

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card rounded-xl border shadow-sm">
      {/* Header Controls */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 bg-background">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-40 font-bold flex gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {format(currentDate, viewMode === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t.day}</SelectItem>
              <SelectItem value="week">{t.week}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allPeople}</SelectItem>
              {persons.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleAddEvent}>
            <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t.addEvent}
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="flex min-w-[800px] h-full">
          {/* Time Axis */}
          <div className="w-16 sticky left-0 z-20 bg-background border-r">
            <div className="h-10 border-b" /> {/* Corner spacer */}
            {timeSlots.map(slot => (
              <div key={slot} className="h-10 text-[10px] text-muted-foreground flex items-center justify-center border-b">
                {slot}
              </div>
            ))}
          </div>

          {/* Days Columns */}
          <div className="flex-1 flex">
            {days.map(day => (
              <div key={day.toISOString()} className="flex-1 border-r last:border-0 min-w-0 flex flex-col">
                {/* Day Header */}
                <div className="h-10 border-b bg-muted/30 flex items-center justify-center text-sm font-medium sticky top-0 z-10 backdrop-blur">
                  {format(day, 'EEE d')}
                </div>

                {/* Person Sub-columns */}
                <div className="flex-1 flex relative">
                   {filteredPersons.map(p => {
                    const occurrences = getOccurrencesForDate(series, day, overrides).filter(occ => occ.personId === p.id);
                    return (
                      <div key={p.id} className="flex-1 border-r last:border-0 relative bg-background/50">
                        {selectedPersonId === 'all' && (
                          <div className="h-6 flex items-center justify-center text-[10px] font-bold border-b sticky top-10 z-10 bg-background" style={{ color: p.color }}>
                            {p.name}
                          </div>
                        )}
                        {/* Grid Lines and Clickable Areas */}
                        <div className="absolute inset-0">
                          {timeSlots.map(slot => (
                            <div 
                              key={slot} 
                              className="h-10 border-b last:border-0 cursor-crosshair hover:bg-muted/20 transition-colors" 
                              onClick={() => handleGridClick(day, p.id, slot)}
                            />
                          ))}
                        </div>
                        {/* Events */}
                        <div className="absolute inset-0 pointer-events-none">
                          {occurrences.map((occ, idx) => (
                            <div key={occ.id + idx} className="pointer-events-auto">
                              <EventBlock
                                occurrence={occ}
                                dayStart={settings.dayStartTime}
                                color={p.color}
                                onClick={() => handleEditEvent(occ.id, occ.date)}
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

      <EventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        initialDate={currentDate}
        eventToEdit={editingEvent}
      />
    </div>
  );
};
