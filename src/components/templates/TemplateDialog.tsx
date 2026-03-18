"use client"

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { FixedEventTemplate } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateToEdit?: FixedEventTemplate | null;
}

export const TemplateDialog: React.FC<TemplateDialogProps> = ({ open, onOpenChange, templateToEdit }) => {
  const { settings, addTemplate, updateTemplate } = useStore();
  const t = getTranslation(settings.language);

  const [formData, setFormData] = useState<Partial<FixedEventTemplate>>({
    name: '',
    defaultDurationMinutes: 30,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (templateToEdit) {
        setFormData({ 
          name: templateToEdit.name,
          defaultDurationMinutes: templateToEdit.defaultDurationMinutes 
        });
      } else {
        setFormData({
          name: '',
          defaultDurationMinutes: 30,
        });
      }
    }
  }, [open, templateToEdit]);

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
        defaultDurationMinutes: formData.defaultDurationMinutes || 30,
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
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className={error ? "text-destructive font-bold" : "font-bold"}>{t.title}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (e.target.value) setError(null);
              }}
              placeholder="e.g., Gym, Grocery Shopping"
              className={error ? "border-destructive border-2 rounded-xl h-12 font-bold" : "border-2 rounded-xl h-12 font-bold"}
            />
            {error && <p className="text-[10px] text-destructive font-bold uppercase">{error}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="font-bold">{t.duration}</Label>
            <Select
              value={String(formData.defaultDurationMinutes)}
              onValueChange={v => setFormData(prev => ({ ...prev, defaultDurationMinutes: Number(v) }))}
            >
              <SelectTrigger className="border-2 rounded-xl h-12 font-bold">
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
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full font-bold h-12">{t.cancel}</Button>
          <Button onClick={handleSave} className="rounded-full font-black px-8 h-12">{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
