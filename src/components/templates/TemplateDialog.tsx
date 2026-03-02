"use client"

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { FixedEventTemplate } from '@/lib/types';
import { generateTimeSlots, formatTime } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateToEdit?: FixedEventTemplate | null;
}

export const TemplateDialog: React.FC<TemplateDialogProps> = ({ open, onOpenChange, templateToEdit }) => {
  const { settings, persons, addTemplate, updateTemplate } = useStore();
  const t = getTranslation(settings.language);
  const timeSlots = generateTimeSlots(settings.dayStartTime, settings.dayEndTime);

  const [formData, setFormData] = useState<Partial<FixedEventTemplate>>({
    name: '',
    defaultDurationMinutes: 60,
    defaultTime: '09:00',
    defaultAssigneePersonId: persons[0]?.id || '1',
    notes: '',
    color: '#3b82f6',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (templateToEdit) {
        setFormData({ ...templateToEdit });
      } else {
        setFormData({
          name: '',
          defaultDurationMinutes: 60,
          defaultTime: '09:00',
          defaultAssigneePersonId: persons[0]?.id || '1',
          notes: '',
          color: persons[0]?.color || '#3b82f6',
        });
      }
    }
  }, [open, templateToEdit, persons]);

  const handleSave = () => {
    if (!formData.name?.trim()) {
      setError(t.title + " is required");
      return;
    }

    if (templateToEdit) {
      updateTemplate(templateToEdit.id, formData);
    } else {
      const newTemplate: FixedEventTemplate = {
        id: crypto.randomUUID(),
        name: formData.name || '',
        defaultDurationMinutes: formData.defaultDurationMinutes || 60,
        defaultTime: formData.defaultTime,
        defaultAssigneePersonId: formData.defaultAssigneePersonId,
        notes: formData.notes,
        color: formData.color,
      };
      addTemplate(newTemplate);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{templateToEdit ? t.edit : t.createTemplate}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className={error ? "text-destructive font-bold" : "font-bold"}>{t.title}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (e.target.value) setError(null);
              }}
              placeholder={t.title}
              className={error ? "border-destructive border-2 rounded-xl" : "border-2 rounded-xl"}
            />
            {error && <p className="text-[10px] text-destructive font-bold uppercase">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="font-bold">{t.duration}</Label>
              <Select
                value={String(formData.defaultDurationMinutes)}
                onValueChange={v => setFormData(prev => ({ ...prev, defaultDurationMinutes: Number(v) }))}
              >
                <SelectTrigger className="border-2 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="30">30 {t.mins}</SelectItem>
                  <SelectItem value="60">60 {t.mins}</SelectItem>
                  <SelectItem value="90">90 {t.mins}</SelectItem>
                  <SelectItem value="120">120 {t.mins}</SelectItem>
                  <SelectItem value="180">180 {t.mins}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">{t.startTime} ({t.none})</Label>
              <Select
                value={formData.defaultTime || "none"}
                onValueChange={v => setFormData(prev => ({ ...prev, defaultTime: v === "none" ? undefined : v }))}
              >
                <SelectTrigger className="border-2 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">{t.none}</SelectItem>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>{formatTime(slot)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="font-bold">{t.assignee}</Label>
              <Select
                value={formData.defaultAssigneePersonId}
                onValueChange={v => {
                  const person = persons.find(p => p.id === v);
                  setFormData(prev => ({ ...prev, defaultAssigneePersonId: v, color: person?.color || prev.color }));
                }}
              >
                <SelectTrigger className="border-2 rounded-xl">
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
              <Label className="font-bold">{t.personColor}</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  type="color" 
                  value={formData.color}
                  className="w-12 h-10 p-1 border-2 rounded-xl"
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="font-bold">{t.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="border-2 rounded-xl min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full font-bold">{t.cancel}</Button>
          <Button onClick={handleSave} className="rounded-full font-black px-8">{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
