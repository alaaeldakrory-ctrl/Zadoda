
"use client"

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { CalendarEventSeries, RecurrenceFrequency } from '@/lib/types';
import { generateTimeSlots } from '@/lib/utils';
import { format, addMinutes, parse, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2 } from 'lucide-react';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date;
  eventToEdit?: { seriesId: string; date: string } | null;
}

export const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, initialDate, eventToEdit }) => {
  const { settings, persons, series, addSeries, updateSeries, deleteSeries, updateOccurrence } = useStore();
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

  useEffect(() => {
    if (eventToEdit) {
      const existing = series.find(s => s.id === eventToEdit.seriesId);
      if (existing) {
        setFormData({ ...existing });
      }
    } else {
      setFormData({
        title: '',
        personId: persons[0]?.id || '1',
        startTime: '09:00',
        endTime: '10:00',
        startDate: format(initialDate, 'yyyy-MM-dd'),
        notes: '',
        recurrence: { frequency: 'NONE', interval: 1 },
        exceptions: [],
      });
    }
  }, [eventToEdit, initialDate, series, persons]);

  const handleSave = () => {
    if (!formData.title) return;

    if (eventToEdit) {
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
        recurrence: formData.recurrence || { frequency: 'NONE', interval: 1 },
        exceptions: [],
      };
      addSeries(newSeries);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (eventToEdit) {
      deleteSeries(eventToEdit.seriesId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? t.edit : t.addEvent}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">{t.title}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t.title}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t.person}</Label>
              <Select
                value={formData.personId}
                onValueChange={v => setFormData(prev => ({ ...prev, personId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Label>{t.date}</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t.startTime}</Label>
              <Select
                value={formData.startTime}
                onValueChange={v => setFormData(prev => ({ ...prev, startTime: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t.endTime}</Label>
              <Select
                value={formData.endTime}
                onValueChange={v => setFormData(prev => ({ ...prev, endTime: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t.repeats}</Label>
            <Select
              value={formData.recurrence?.frequency}
              onValueChange={(v: RecurrenceFrequency) => 
                setFormData(prev => ({ 
                  ...prev, 
                  recurrence: { ...(prev.recurrence || { interval: 1 }), frequency: v } 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">{t.repeatNone}</SelectItem>
                <SelectItem value="DAILY">{t.repeatDaily}</SelectItem>
                <SelectItem value="WEEKLY">{t.repeatWeekly}</SelectItem>
                <SelectItem value="MONTHLY">{t.repeatMonthly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">{t.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {eventToEdit ? (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t.delete}
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
            <Button onClick={handleSave}>{t.save}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
