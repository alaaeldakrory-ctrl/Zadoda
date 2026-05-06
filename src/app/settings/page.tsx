"use client"

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe, Calendar, Users, Clock, Palette, Download, Plus, Pencil, Trash2, Library, Layers, Settings as SettingsIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getAvatarUrl, cn, getPersonName } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FixedEventTemplate } from '@/lib/types';
import { TemplateDialog } from '@/components/templates/TemplateDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SettingsPage() {
  const { settings, updateSettings, persons, updatePerson, templates, deleteTemplate, isParentUnlocked } = useStore();
  const t = getTranslation(settings.language);
  const router = useRouter();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (!isParentUnlocked) {
      router.push('/');
    }
  }, [isParentUnlocked, router]);
  
  // State for templates
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FixedEventTemplate | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (tpl: FixedEventTemplate) => {
    setEditingTemplate(tpl);
    setIsDialogOpen(true);
  };

  if (!isParentUnlocked) return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <SettingsIcon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t.settings}</h1>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start h-14 p-1 bg-muted/50 rounded-2xl overflow-x-auto flex-nowrap">
            <TabsTrigger value="general" className="h-full px-8 rounded-xl font-bold text-base whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-sm">
              General
            </TabsTrigger>
            <TabsTrigger value="fixed-events" className="h-full px-8 rounded-xl font-bold text-base whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t.fixedEvents}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-8 focus-visible:outline-none focus-visible:ring-0">
            <div className="grid gap-10 max-w-4xl">
              {deferredPrompt && (
                <Card className="rounded-[3rem] border-2 border-primary/20 shadow-xl overflow-hidden bg-primary/5 animate-pop">
                  <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-primary rounded-3xl shadow-lg shadow-primary/20">
                        <Download className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">Install Zadoda</h2>
                        <p className="font-bold text-muted-foreground">Add to your home screen for the best experience.</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleInstallApp}
                      className="rounded-full h-14 px-10 font-black text-lg shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
                    >
                      Install Now
                    </Button>
                  </CardContent>
                </Card>
              )}

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
                      step="900" 
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
                      step="900"
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
                              src={getAvatarUrl(p.id)} 
                              alt={p.name} 
                              width={160} 
                              height={160} 
                              className={cn(
                                "object-cover", 
                                p.id === 'person3' && "scale-110 -translate-y-4",
                                p.id === 'person4' && "scale-105 translate-y-[-2px]",
                                p.id === 'person2' && "scale-150 translate-y-3",
                                p.id === 'person1' && "scale-110 translate-y-4"
                              )}
                              data-ai-hint="person headshot"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-5xl font-black" style={{ color: p.color }}>{getPersonName(p, settings.language)}</h3>
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
          </TabsContent>

          <TabsContent value="fixed-events" className="mt-8 focus-visible:outline-none focus-visible:ring-0">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">{t.fixedEvents}</h2>
                  <p className="text-muted-foreground font-medium mt-1">Manage reusable templates for common events.</p>
                </div>
                <Button onClick={handleCreateTemplate} className="rounded-full px-8 h-12 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 stroke-[3px]" />
                  {t.createTemplate}
                </Button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center space-y-6">
                  <div className="w-64 h-64 rounded-full overflow-hidden opacity-40 grayscale shadow-2xl">
                    <Image 
                      src={PlaceHolderImages.find(img => img.id === 'empty-templates')?.imageUrl || 'https://picsum.photos/seed/library/600/600'} 
                      alt="No templates" 
                      width={300} 
                      height={300}
                      className="object-cover"
                      data-ai-hint="library shelf"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground font-black text-xl">{t.searchTemplates}</p>
                    <p className="text-muted-foreground/60 font-bold max-w-sm mx-auto">Create reusable templates for things you do often, like sports, groceries, or study time.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {templates.map(tpl => {
                    return (
                      <Card key={tpl.id} className="group overflow-hidden border-2 rounded-[2.5rem] transition-all hover:shadow-2xl hover:-translate-y-1 bg-white">
                        <CardHeader className="bg-muted/10 pb-4 border-b">
                          <CardTitle className="flex justify-between items-start gap-2">
                            <span className="truncate text-xl font-black">{tpl.name}</span>
                            <Library className="w-5 h-5 text-primary opacity-40" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-8 pb-4">
                          <div className="flex items-center gap-3 text-base font-black text-muted-foreground">
                            <div className="p-2 rounded-xl bg-primary/10">
                              <Clock className="w-5 h-5 text-primary" />
                            </div>
                            {tpl.defaultDurationMinutes} {t.mins}
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 justify-end border-t pt-4 bg-muted/5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:text-destructive transition-colors rounded-full h-10 w-10"
                            onClick={() => deleteTemplate(tpl.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="rounded-full h-10 w-10"
                            onClick={() => handleEditTemplate(tpl)}
                          >
                            <Pencil className="w-5 h-5" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <TemplateDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          templateToEdit={editingTemplate}
        />
      </div>
    </AppLayout>
  );
}
