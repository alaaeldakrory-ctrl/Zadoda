"use client"

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { CalendarEventSeries, RecurrenceFrequency } from '@/lib/types';
import { cn, generateTimeSlots, formatTime } from '@/lib/utils';
import { format, addMinutes, parse } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date;
  eventToEdit?: { seriesId?: string; date: string; personId?: string; startTime?: string; templateId?: string } | null;
}

export const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, initialDate, eventToEdit }) => {
  const { settings, persons, series, templates, addSeries, updateSeries, deleteSeries } = useStore();
  const t = getTranslation(settings.language);
  const timeSlots = generateTimeSlots(settings.dayStartTime, settings.dayEndTime);

  const [formData, setFormData] = useState<Partial<CalendarEventSeries>>({
    title: '',
    personId: persons[0]?.id || '1',
    startTime: '09:00',
    endTime: '10:00',
    startDate: format(initialDate, 'yyyy-MM-dd'),
    notes: '',
    recurrence: { frequency: 'NONE', interval: 1 },
    exceptions: [],
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (eventToEdit?.seriesId) {
        const existing = series.find(s => s.id === eventToEdit.seriesId);
        if (existing) {
          setFormData({ ...existing });
        }
      } else if (eventToEdit?.templateId) {
        const tpl = templates.find(t => t.id === eventToEdit.templateId);
        if (tpl) {
          const startTime = tpl.defaultTime || '09:00';
          const start = parse(startTime, 'HH:mm', new Date());
          const end = addMinutes(start, tpl.defaultDurationMinutes || 60);
          
          setFormData({
            title: tpl.name,
            personId: tpl.defaultAssigneePersonId || persons[0]?.id || '1',
            startTime: startTime,
            endTime: format(end, 'HH:mm'),
            startDate: eventToEdit?.date || format(initialDate, 'yyyy-MM-dd'),
            notes: tpl.notes || '',
            templateId: tpl.id,
            recurrence: { frequency: 'NONE', interval: 1 },
            exceptions: [],
          });
        }
      } else {
        const startTime = eventToEdit?.startTime || '09:00';
        const start = parse(startTime, 'HH:mm', new Date());
        const end = addMinutes(start, 60);
        
        setFormData({
          title: '',
          personId: eventToEdit?.personId || persons[0]?.id || '1',
          startTime: startTime,
          endTime: format(end, 'HH:mm'),
          startDate: eventToEdit?.date || format(initialDate, 'yyyy-MM-dd'),
          notes: '',
          recurrence: { frequency: 'NONE', interval: 1 },
          exceptions: [],
        });
      }
    }
  }, [open, eventToEdit, initialDate, series, persons, templates]);

  const handleSave = () => {
    if (!formData.title?.trim()) {
      setError(t.title + " is required");
      return;
    }

    if (eventToEdit?.seriesId) {
      updateSeries(eventToEdit.seriesId, formData);
    } else {
      const newSeries: CalendarEventSeries = {
        id: crypto.randomUUID(),
        title: formData.title || '',
        personId: formData.personId || '1',
        startTime: formData.startTime || '09:00',
        endTime: formData.endTime || '10:00',
        startDate: formData.startDate || format(initialDate, 'yyyy-MM-dd'),
        notes: formData.notes,
        templateId: formData.templateId,
        recurrence: formData.recurrence || { frequency: 'NONE', interval: 1 },
        exceptions: [],
      };
      addSeries(newSeries);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (eventToEdit?.seriesId) {
      deleteSeries(eventToEdit.seriesId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{eventToEdit?.seriesId ? t.edit : t.addEvent}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className={cn("font-bold text-base", error ? "text-destructive" : "")}>{t.title}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                if (e.target.value) setError(null);
              }}
              placeholder={t.title}
              className={cn("rounded-xl border-2 font-bold text-lg h-12", error ? "border-destructive" : "focus:border-primary")}
            />
            {error && <p className="text-[10px] text-destructive font-black uppercase tracking-wide">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="font-bold">{t.person}</Label>
              <Select
                value={formData.personId}
                onValueChange={v => setFormData(prev => ({ ...prev, personId: v }))}
              >
                <SelectTrigger className="rounded-xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {persons.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.date}</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="rounded-xl border-2 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="font-bold">{t.startTime}</Label>
              <Select
                value={formData.startTime}
                onValueChange={v => setFormData(prev => ({ ...prev, startTime: v }))}
              >
                <SelectTrigger className="rounded-xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>{formatTime(slot)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.endTime}</Label>
              <Select
                value={formData.endTime}
                onValueChange={v => setFormData(prev => ({ ...prev, endTime: v }))}
              >
                <SelectTrigger className="rounded-xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>{formatTime(slot)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="font-bold">{t.repeats}</Label>
            <Select
              value={formData.recurrence?.frequency}
              onValueChange={(v: RecurrenceFrequency) => 
                setFormData(prev => ({ 
                  ...prev, 
                  recurrence: { ...(prev.recurrence || { interval: 1 }), frequency: v } 
                }))
              }
            >
              <SelectTrigger className="rounded-xl border-2 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="NONE">{t.repeatNone}</SelectItem>
                <SelectItem value="DAILY">{t.repeatDaily}</SelectItem>
                <SelectItem value="WEEKLY">{t.repeatWeekly}</SelectItem>
                <SelectItem value="MONTHLY">{t.repeatMonthly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="font-bold">{t.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="rounded-xl border-2 min-h-[80px] font-medium"
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {eventToEdit?.seriesId ? (
            <Button variant="destructive" onClick={handleDelete} className="rounded-full font-bold">
              <Trash2 className="w-4 h-4 mr-2" />
              {t.delete}
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full font-bold">{t.cancel}</Button>
            <Button onClick={handleSave} className="rounded-full font-black px-8">{t.save}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
