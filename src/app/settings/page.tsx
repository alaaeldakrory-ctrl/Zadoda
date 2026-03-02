
"use client"

import React from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { settings, updateSettings, persons, updatePerson } = useStore();
  const t = getTranslation(settings.language);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <h1 className="text-4xl font-black tracking-tight">{t.settings}</h1>

        <div className="grid gap-8">
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-2xl font-black">{t.language}</CardTitle>
              <CardDescription>Choose your preferred interface language.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Select value={settings.language} onValueChange={(v: any) => updateSettings({ language: v })}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-2xl font-black">{t.calendar}</CardTitle>
              <CardDescription>Configure day boundaries.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6 p-6">
              <div className="space-y-3">
                <Label className="text-base font-bold">{t.dayStart}</Label>
                <Input 
                  type="time" 
                  step="1800" 
                  value={settings.dayStartTime}
                  className="h-12 rounded-xl border-2 font-bold"
                  onChange={(e) => updateSettings({ dayStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-base font-bold">{t.dayEnd}</Label>
                <Input 
                  type="time" 
                  step="1800"
                  value={settings.dayEndTime}
                  className="h-12 rounded-xl border-2 font-bold"
                  onChange={(e) => updateSettings({ dayEndTime: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-2xl font-black">{t.allPeople}</CardTitle>
              <CardDescription>Customize names, photos, and themes for each family member.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-10 p-6">
              {persons.map(p => (
                <div key={p.id} className="grid gap-6 border-b pb-10 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-4 shadow-md" style={{ borderColor: p.color }}>
                      <AvatarImage src={p.avatarUrl} alt={p.name} className="object-cover" />
                      <AvatarFallback style={{ backgroundColor: p.color, color: 'white' }} className="text-xl font-black">
                        {p.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black">{p.name}</h3>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{p.id}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">{t.personName}</Label>
                      <Input 
                        value={p.name}
                        className="h-12 rounded-xl border-2 font-bold"
                        onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">{t.personColor}</Label>
                      <div className="flex gap-3 items-center">
                        <Input 
                          type="color" 
                          value={p.color}
                          className="w-20 h-12 p-1 rounded-xl border-2 cursor-pointer"
                          onChange={(e) => updatePerson(p.id, { color: e.target.value })}
                        />
                        <span className="text-sm font-mono font-black opacity-60 uppercase bg-muted px-3 py-1.5 rounded-lg">{p.color}</span>
                      </div>
                    </div>
                    <div className="col-span-full space-y-3">
                      <Label className="text-sm font-bold">Profile Photo URL</Label>
                      <Input 
                        value={p.avatarUrl || ''}
                        placeholder="Paste an image URL here..."
                        className="h-12 rounded-xl border-2 font-medium"
                        onChange={(e) => updatePerson(p.id, { avatarUrl: e.target.value })}
                      />
                      <p className="text-[11px] text-muted-foreground font-medium italic">
                        Tip: You can use an Unsplash or Google Photos link here.
                      </p>
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
