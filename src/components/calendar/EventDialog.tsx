"use client"

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { CalendarEventSeries, RecurrenceFrequency } from '@/lib/types';
import { cn, generateTimeSlots, formatTime, minutesToTime, timeToMinutes, getPersonName } from '@/lib/utils';
import { format, addMinutes, parse } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Sparkles, AlertCircle, Users } from 'lucide-react';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date;
  eventToEdit?: { seriesId?: string; date: string; personId?: string; startTime?: string; templateId?: string } | null;
}

export const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, initialDate, eventToEdit }) => {
  const { settings, persons, series, templates, addSeries, updateSeries, deleteSeries } = useStore();
  const t = getTranslation(settings.language);
  const timeSlots = generateTimeSlots(settings.dayStartTime, settings.dayEndTime, 15);

  const [formData, setFormData] = useState<Partial<CalendarEventSeries>>({
    title: '',
    personId: persons[0]?.id || 'person1',
    startTime: '09:00',
    endTime: '09:30',
    startDate: format(initialDate, 'yyyy-MM-dd'),
    notes: '',
    recurrence: { frequency: 'NONE', interval: 1 },
    exceptions: [],
    isImportant: false,
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
        applyTemplate(eventToEdit.templateId);
      } else {
        const startTime = eventToEdit?.startTime || '09:00';
        const start = parse(startTime, 'HH:mm', new Date());
        const end = addMinutes(start, 30);
        
        setFormData({
          title: '',
          personId: eventToEdit?.personId || persons[0]?.id || 'person1',
          startTime: startTime,
          endTime: format(end, 'HH:mm'),
          startDate: eventToEdit?.date || format(initialDate, 'yyyy-MM-dd'),
          notes: '',
          recurrence: { frequency: 'NONE', interval: 1 },
          exceptions: [],
          isImportant: false,
        });
      }
    }
  }, [open, eventToEdit, initialDate, series, persons, templates]);

  const applyTemplate = (templateId: string) => {
    const tpl = templates.find(t => t.id === templateId);
    if (tpl) {
      const startTime = formData.startTime || '09:00';
      const startMins = timeToMinutes(startTime);
      const endMins = startMins + tpl.defaultDurationMinutes;
      
      setFormData(prev => ({
        ...prev,
        title: tpl.name,
        personId: prev.personId || persons[0]?.id || 'person1',
        startDate: prev.startDate || format(initialDate, 'yyyy-MM-dd'),
        startTime: startTime,
        endTime: minutesToTime(endMins),
        templateId: tpl.id,
      }));
    }
  };

  const handleSave = () => {
    if (!formData.title?.trim()) {
      setError(t.title + " is required");
      return;
    }

    const dataToSave: any = {
      title: formData.title || '',
      personId: formData.personId || 'person1',
      startTime: formData.startTime || '09:00',
      endTime: formData.endTime || '09:30',
      startDate: formData.startDate || format(initialDate, 'yyyy-MM-dd'),
      recurrence: formData.recurrence || { frequency: 'NONE', interval: 1 },
      exceptions: formData.exceptions || [],
      isImportant: !!formData.isImportant,
    };

    if (formData.notes !== undefined) dataToSave.notes = formData.notes;
    if (formData.templateId) dataToSave.templateId = formData.templateId;

    if (eventToEdit?.seriesId) {
      updateSeries(eventToEdit.seriesId, dataToSave);
    } else {
      dataToSave.id = crypto.randomUUID();
      addSeries(dataToSave as CalendarEventSeries);
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
      <DialogContent className="sm:max-w-[425px] rounded-3xl overflow-hidden border-2">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-black">{eventToEdit?.seriesId ? t.edit : t.addEvent}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-6">
          {!eventToEdit?.seriesId && templates.length > 0 && (
            <div className="grid gap-2 p-3 bg-primary/5 rounded-2xl border-2 border-primary/10">
              <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                {t.fromTemplate}
              </Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="h-10 rounded-xl border-2 bg-white font-bold text-sm">
                  <SelectValue placeholder={t.searchTemplates} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {templates.map(tpl => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.defaultDurationMinutes}m)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title" className={cn("font-bold text-sm", error ? "text-destructive" : "")}>{t.title}</Label>
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

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-2 bg-accent/5 p-2 rounded-xl border-2 border-dashed">
              <Checkbox 
                id="important" 
                checked={formData.isImportant} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isImportant: !!checked }))}
                className="rounded-md border-2"
              />
              <Label htmlFor="important" className="font-black text-[8px] cursor-pointer uppercase tracking-tighter flex items-center gap-1 text-center">
                <AlertCircle className="w-3 h-3 text-destructive" />
                {t.important}
              </Label>
            </div>
            <div className="flex flex-col items-center gap-2 bg-primary/5 p-2 rounded-xl border-2 border-dashed">
              <Checkbox 
                id="everyone" 
                checked={formData.personId === 'all'} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, personId: checked ? 'all' : persons[0]?.id }))}
                className="rounded-md border-2"
              />
              <Label htmlFor="everyone" className="font-black text-[8px] cursor-pointer uppercase tracking-tighter flex items-center gap-1 text-center">
                <Users className="w-3 h-3 text-primary" />
                {t.allPeople}
              </Label>
            </div>
            <div className="flex flex-col items-center gap-2 bg-yellow-500/5 p-2 rounded-xl border-2 border-dashed">
              <Checkbox 
                id="kids" 
                checked={formData.personId === 'kids'} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, personId: checked ? 'kids' : persons[0]?.id }))}
                className="rounded-md border-2"
              />
              <Label htmlFor="kids" className="font-black text-[8px] cursor-pointer uppercase tracking-tighter flex items-center gap-1 text-center">
                <Users className="w-3 h-3 text-yellow-600" />
                {t.allKids}
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="font-bold text-sm">{t.person}</Label>
              <Select
                value={formData.personId}
                onValueChange={v => setFormData(prev => ({ ...prev, personId: v }))}
              >
                <SelectTrigger className="rounded-xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-primary" />
                      {t.allPeople}
                    </div>
                  </SelectItem>
                  <SelectItem value="kids">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-yellow-600" />
                      {t.allKids}
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
            <div className="grid gap-2">
              <Label className="font-bold text-sm">{t.date}</Label>
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
              <Label className="font-bold text-sm">{t.startTime}</Label>
              <Select
                value={formData.startTime}
                onValueChange={v => {
                  const oldStartMins = timeToMinutes(formData.startTime || '09:00');
                  const oldEndMins = timeToMinutes(formData.endTime || '09:30');
                  const duration = oldEndMins - oldStartMins;
                  const newStartMins = timeToMinutes(v);
                  setFormData(prev => ({ 
                    ...prev, 
                    startTime: v,
                    endTime: minutesToTime(newStartMins + duration)
                  }));
                }}
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
              <Label className="font-bold text-sm">{t.endTime}</Label>
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
            <Label className="font-bold text-sm">{t.repeats}</Label>
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
            <Label htmlFor="notes" className="font-bold text-sm">{t.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="rounded-xl border-2 min-h-[80px] font-medium"
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t pt-4">
          {eventToEdit?.seriesId ? (
            <Button variant="destructive" onClick={handleDelete} className="rounded-full font-bold">
              <Trash2 className="w-4 h-4 mr-2" />
              {t.delete}
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full font-bold">{t.cancel}</Button>
            <Button onClick={handleSave} className="rounded-full font-black px-8 shadow-lg shadow-primary/20">{t.save}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
