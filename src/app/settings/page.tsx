
"use client"

import React from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { settings, updateSettings, persons, updatePerson } = useStore();
  const t = getTranslation(settings.language);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <h1 className="text-3xl font-black">{t.settings}</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.language}</CardTitle>
              <CardDescription>Choose your preferred interface language.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={settings.language} onValueChange={(v: any) => updateSettings({ language: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.calendar}</CardTitle>
              <CardDescription>Configure day boundaries.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.dayStart}</Label>
                <Input 
                  type="time" 
                  step="1800" 
                  value={settings.dayStartTime}
                  onChange={(e) => updateSettings({ dayStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.dayEnd}</Label>
                <Input 
                  type="time" 
                  step="1800"
                  value={settings.dayEndTime}
                  onChange={(e) => updateSettings({ dayEndTime: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.allPeople}</CardTitle>
              <CardDescription>Customize names and themes for each person.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {persons.map(p => (
                <div key={p.id} className="grid sm:grid-cols-2 gap-4 items-end border-b pb-6 last:border-0 last:pb-0">
                  <div className="space-y-2">
                    <Label>{t.personName} ({p.id})</Label>
                    <Input 
                      value={p.name}
                      onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.personColor}</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        value={p.color}
                        className="w-12 p-1"
                        onChange={(e) => updatePerson(p.id, { color: e.target.value })}
                      />
                      <span className="text-sm font-mono opacity-60 uppercase">{p.color}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
