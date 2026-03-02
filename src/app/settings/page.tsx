
"use client"

import React from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Calendar, Users, Clock, Palette } from 'lucide-react';
import Image from 'next/image';
import { getAvatarUrl, cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, updateSettings, persons, updatePerson } = useStore();
  const t = getTranslation(settings.language);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        <h1 className="text-5xl font-black tracking-tight">{t.settings}</h1>

        <div className="grid gap-10">
          <Card className="rounded-[3rem] border-2 shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/20 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">{t.language}</CardTitle>
                  <CardDescription className="font-bold text-muted-foreground">Choose your preferred interface language.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <Select value={settings.language} onValueChange={(v: any) => updateSettings({ language: v })}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black text-lg px-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-2 shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/20 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">{t.calendar}</CardTitle>
                  <CardDescription className="font-bold text-muted-foreground">Configure day boundaries.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-8 p-8">
              <div className="space-y-3">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.dayStart}
                </Label>
                <Input 
                  type="time" 
                  step="1800" 
                  value={settings.dayStartTime}
                  className="h-14 rounded-2xl border-2 font-black text-lg px-6"
                  onChange={(e) => updateSettings({ dayStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.dayEnd}
                </Label>
                <Input 
                  type="time" 
                  step="1800"
                  value={settings.dayEndTime}
                  className="h-14 rounded-2xl border-2 font-black text-lg px-6"
                  onChange={(e) => updateSettings({ dayEndTime: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-2 shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/20 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">{t.allPeople}</CardTitle>
                  <CardDescription className="font-bold text-muted-foreground">Customize names and colors for each family member.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-12 p-8">
              {persons.map(p => (
                <div key={p.id} className="grid gap-8 border-b border-dashed pb-12 last:border-0 last:pb-0">
                  <div className="flex items-center gap-10">
                    <div className="relative">
                      <div className="w-40 h-40 rounded-[3rem] overflow-hidden border-8 shadow-2xl" style={{ borderColor: p.color }}>
                        <Image 
                          src={getAvatarUrl(p.name)} 
                          alt={p.name} 
                          width={160} 
                          height={160} 
                          className={cn(
                            "object-cover", 
                            p.name === 'Mohamed' && "scale-110 -translate-y-4",
                            p.name === 'Wesam' && "scale-110 translate-y-2",
                            p.name === 'Malika' && "scale-110 -translate-y-2",
                            p.name === 'Lyla' && "scale-110 -translate-y-2"
                          )}
                          data-ai-hint="person headshot"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-5xl font-black" style={{ color: p.color }}>{p.name}</h3>
                      <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em]">{p.id}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t.personName}</Label>
                      <Input 
                        value={p.name}
                        className="h-14 rounded-2xl border-2 font-black text-lg px-6"
                        onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        {t.personColor}
                      </Label>
                      <div className="flex gap-4 items-center">
                        <Input 
                          type="color" 
                          value={p.color}
                          className="w-20 h-14 p-1.5 rounded-2xl border-2 cursor-pointer bg-white shadow-sm"
                          onChange={(e) => updatePerson(p.id, { color: e.target.value })}
                        />
                        <span className="text-sm font-mono font-black opacity-60 uppercase bg-muted px-4 py-2 rounded-xl border-2">
                          {p.color}
                        </span>
                      </div>
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
