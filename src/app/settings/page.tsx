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
import { Globe, Calendar, Users, Clock, Palette, Download, Plus, Pencil, Trash2, Library, Layers, Settings as SettingsIcon, UserPlus, Baby, Crown, Camera, KeyRound, Copy, Check, Loader2, LogOut } from 'lucide-react';
import Image from 'next/image';
import { getAvatarUrl, cn, getPersonName } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FixedEventTemplate, Person } from '@/lib/types';
import { TemplateDialog } from '@/components/templates/TemplateDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AvatarCropDialog } from '@/components/ui/AvatarCropDialog';

const PRESET_COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#FB923C', '#2DD4BF'];

export default function SettingsPage() {
  const { settings, updateSettings, persons, updatePerson, addPerson, deletePerson, templates, deleteTemplate, generateInviteCode, isFamilyOwner, currentUser, signOut } = useStore();
  const t = getTranslation(settings.language);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FixedEventTemplate | null>(null);

  // Partner access state
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleGenerateCode = async () => {
    setInviteLoading(true);
    try {
      const code = await generateInviteCode();
      setInviteCode(code);
    } catch {}
    setInviteLoading(false);
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // New person form state
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#60A5FA');
  const [newRole, setNewRole] = useState<'parent' | 'child'>('child');

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleAddPerson = () => {
    if (!newName.trim()) return;
    addPerson({ name: newName.trim(), color: newColor, role: newRole });
    setNewName('');
    setNewColor('#60A5FA');
    setNewRole('child');
    setShowAddPerson(false);
  };


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
          <TabsList className="w-full justify-start h-12 sm:h-14 p-1 bg-muted/50 rounded-2xl overflow-x-auto flex-nowrap scrollbar-none">
            <TabsTrigger value="general" className="h-full px-4 sm:px-8 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap data-[state=active]:bg-card data-[state=active]:shadow-sm">
              General
            </TabsTrigger>
            <TabsTrigger value="people" className="h-full px-4 sm:px-8 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Family
            </TabsTrigger>
            <TabsTrigger value="fixed-events" className="h-full px-4 sm:px-8 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap data-[state=active]:bg-card data-[state=active]:shadow-sm">
              {t.fixedEvents}
            </TabsTrigger>
          </TabsList>

          {/* ── General ── */}
          <TabsContent value="general" className="mt-8 focus-visible:outline-none focus-visible:ring-0">
            <div className="grid gap-8 max-w-2xl">
              {deferredPrompt && (
                <Card className="rounded-[2.5rem] border border-primary/20 bg-primary/5 animate-pop overflow-hidden">
                  <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-primary rounded-2xl">
                        <Download className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black">Install Zadoda</h2>
                        <p className="font-medium text-muted-foreground text-sm">Add to your home screen for the best experience.</p>
                      </div>
                    </div>
                    <Button onClick={handleInstallApp} className="rounded-full h-12 px-8 font-black shadow-lg shadow-primary/30">
                      Install Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-[2.5rem] border bg-card overflow-hidden">
                <CardHeader className="bg-muted/20 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">{t.language}</CardTitle>
                      <CardDescription className="font-medium">Choose your preferred interface language.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Select value={settings.language} onValueChange={(v: any) => updateSettings({ language: v })}>
                    <SelectTrigger className="h-12 rounded-2xl border font-bold text-base px-5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border bg-card overflow-hidden">
                <CardHeader className="bg-muted/20 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">{t.calendar}</CardTitle>
                      <CardDescription className="font-medium">Configure day boundaries.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6 p-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {t.dayStart}
                    </Label>
                    <Input type="time" step="900" value={settings.dayStartTime} className="h-12 rounded-2xl border font-bold text-base px-5"
                      onChange={e => updateSettings({ dayStartTime: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {t.dayEnd}
                    </Label>
                    <Input type="time" step="900" value={settings.dayEndTime} className="h-12 rounded-2xl border font-bold text-base px-5"
                      onChange={e => updateSettings({ dayEndTime: e.target.value })} />
                  </div>
                </CardContent>
              </Card>

              {/* Family name */}
              <Card className="rounded-[2.5rem] border bg-card overflow-hidden">
                <CardHeader className="bg-muted/20 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">Family Name</CardTitle>
                      <CardDescription className="font-medium">How this family appears in the app.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Input
                    value={settings.familyName || ''}
                    placeholder="e.g. The Smiths"
                    className="h-12 rounded-2xl border font-bold text-base px-5"
                    onChange={e => updateSettings({ familyName: e.target.value })}
                  />
                </CardContent>
              </Card>

              {/* Partner Access */}
              <Card className="rounded-[2.5rem] border bg-card overflow-hidden">
                <CardHeader className="bg-muted/20 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl">
                      <KeyRound className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">Partner Access</CardTitle>
                      <CardDescription className="font-medium">
                        {isFamilyOwner
                          ? 'Invite your partner to see the same family data on their device.'
                          : 'You joined this family with an invite code.'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {isFamilyOwner ? (
                    <>
                      <p className="text-sm font-medium text-muted-foreground">
                        Generate a 6-character code and share it with your partner. It's valid for 48 hours and can only be used once.
                      </p>
                      {!inviteCode ? (
                        <Button
                          onClick={handleGenerateCode}
                          disabled={inviteLoading}
                          className="rounded-full h-12 px-8 font-black shadow-md shadow-primary/20 w-full sm:w-auto"
                        >
                          {inviteLoading
                            ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            : <KeyRound className="w-4 h-4 mr-2" />}
                          Generate Invite Code
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20">
                            <span className="flex-1 text-3xl font-black tracking-[0.35em] text-primary text-center">
                              {inviteCode}
                            </span>
                            <button
                              onClick={handleCopyCode}
                              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shrink-0"
                              title="Copy code"
                            >
                              {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground opacity-60 text-center">
                            Valid for 48 hours · Single use · Tell your partner to open Zadoda and enter this code
                          </p>
                          <button
                            onClick={handleGenerateCode}
                            disabled={inviteLoading}
                            className="text-xs font-bold text-primary hover:underline w-full text-center"
                          >
                            Generate a new code
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-emerald-800">Joined via invite</p>
                        <p className="text-xs font-medium text-emerald-600 mt-0.5">
                          You're sharing data with this family. Signed in as {currentUser?.email}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Account / Sign Out */}
              {currentUser && !currentUser.isAnonymous && (
                <Card className="rounded-[2.5rem] border bg-card overflow-hidden">
                  <CardHeader className="bg-muted/20 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-destructive/10 rounded-xl">
                        <LogOut className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black">Account</CardTitle>
                        <CardDescription className="font-medium truncate">{currentUser.email || currentUser.displayName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="w-full h-12 rounded-2xl font-black border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Family Members ── */}
          <TabsContent value="people" className="mt-8 focus-visible:outline-none focus-visible:ring-0">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Family Members</h2>
                  <p className="text-muted-foreground font-medium text-sm mt-1">Manage names, colors, and roles.</p>
                </div>
                <Button
                  onClick={() => setShowAddPerson(v => !v)}
                  className="rounded-full px-6 h-11 font-black shadow-md shadow-primary/20"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Add Person
                </Button>
              </div>

              {/* Add person form */}
              {showAddPerson && (
                <Card className="rounded-[2rem] border-2 border-primary/20 bg-primary/5 overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-black text-base">New Family Member</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Name</Label>
                        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="First name"
                          className="h-11 rounded-xl border font-bold" onKeyDown={e => e.key === 'Enter' && handleAddPerson()} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</Label>
                        <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                          <SelectTrigger className="h-11 rounded-xl border font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="parent">
                              <span className="flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" /> Parent</span>
                            </SelectItem>
                            <SelectItem value="child">
                              <span className="flex items-center gap-2"><Baby className="w-4 h-4 text-blue-400" /> Child</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Color</Label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {PRESET_COLORS.map(c => (
                          <button key={c} onClick={() => setNewColor(c)}
                            className={cn('w-8 h-8 rounded-full border-4 transition-transform hover:scale-110', newColor === c ? 'border-foreground' : 'border-transparent')}
                            style={{ backgroundColor: c }} />
                        ))}
                        <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                          className="w-8 h-8 rounded-full cursor-pointer border-2 border-border p-0.5 bg-transparent" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setShowAddPerson(false)} className="rounded-full flex-1 h-11">Cancel</Button>
                      <Button onClick={handleAddPerson} disabled={!newName.trim()} className="rounded-full flex-[2] h-11 font-black shadow-md shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> Add {newRole === 'parent' ? 'Parent' : 'Child'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing persons */}
              {persons.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground font-bold opacity-50">
                  No family members yet — add the first one above!
                </div>
              ) : (
                <div className="space-y-4">
                  {persons.map(p => (
                    <PersonCard key={p.id} person={p} onUpdate={updates => updatePerson(p.id, updates)} onDelete={() => deletePerson(p.id)} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Fixed Events / Templates ── */}
          <TabsContent value="fixed-events" className="mt-8 focus-visible:outline-none focus-visible:ring-0">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">{t.fixedEvents}</h2>
                  <p className="text-muted-foreground font-medium mt-1 text-sm">Manage reusable templates for common events.</p>
                </div>
                <Button onClick={() => { setEditingTemplate(null); setIsDialogOpen(true); }} className="rounded-full px-6 h-11 font-black shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" /> {t.createTemplate}
                </Button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-24 bg-card rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center space-y-6">
                  <div className="w-48 h-48 rounded-full overflow-hidden opacity-40 grayscale">
                    <Image src={PlaceHolderImages.find(img => img.id === 'empty-templates')?.imageUrl || 'https://picsum.photos/seed/library/600/600'}
                      alt="No templates" width={200} height={200} className="object-cover" data-ai-hint="library shelf" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-black text-lg">{t.searchTemplates}</p>
                    <p className="text-muted-foreground/60 font-medium max-w-xs mx-auto text-sm">Create reusable templates for things you do often.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(tpl => (
                    <Card key={tpl.id} className="group overflow-hidden border rounded-[2rem] transition-all hover:shadow-lg bg-card">
                      <CardHeader className="bg-muted/10 pb-4 border-b">
                        <CardTitle className="flex justify-between items-start gap-2">
                          <span className="truncate text-lg font-black">{tpl.name}</span>
                          <Library className="w-4 h-4 text-primary opacity-40" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-6 pb-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          {tpl.defaultDurationMinutes} {t.mins}
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2 justify-end border-t pt-3 bg-muted/5">
                        <Button variant="ghost" size="icon" className="hover:text-destructive rounded-full h-9 w-9" onClick={() => deleteTemplate(tpl.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => { setEditingTemplate(tpl); setIsDialogOpen(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <TemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} templateToEdit={editingTemplate} />
      </div>
    </AppLayout>
  );
}

function PersonCard({ person, onUpdate, onDelete }: { person: Person; onUpdate: (u: Partial<Person>) => void; onDelete: () => void }) {
  const [name, setName] = useState(person.name);
  const [cropOpen, setCropOpen] = useState(false);

  return (
    <>
      <AvatarCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        personName={person.name}
        personColor={person.color}
        onSave={(dataUrl) => { onUpdate({ avatarUrl: dataUrl }); setCropOpen(false); }}
      />
    <div className="bg-card border rounded-[2rem] p-5 flex items-center gap-4">
      {/* Avatar — click to open crop dialog */}
      <button
        onClick={() => setCropOpen(true)}
        className="relative w-14 h-14 rounded-full overflow-hidden border-4 shrink-0 group focus:outline-none"
        style={{ borderColor: person.color }}
        title="Change photo"
      >
        <Image
          src={getAvatarUrl(person.id, person.avatarUrl)}
          alt={person.name}
          width={56} height={56}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </button>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => name.trim() && onUpdate({ name: name.trim() })}
          className="h-10 rounded-xl border font-bold px-3 text-base"
        />
        <div className="flex items-center gap-2 mt-1.5">
          {person.role === 'parent'
            ? <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1"><Crown className="w-3 h-3" /> Parent</span>
            : <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1"><Baby className="w-3 h-3" /> Child</span>
          }
        </div>
      </div>

      {/* Color */}
      <label className="cursor-pointer shrink-0">
        <div className="w-9 h-9 rounded-full border-4 border-white shadow-sm" style={{ backgroundColor: person.color }} />
        <input type="color" value={person.color} onChange={e => onUpdate({ color: e.target.value })} className="sr-only" />
      </label>

      {/* Role toggle */}
      <button
        onClick={() => onUpdate({ role: person.role === 'parent' ? 'child' : 'parent' })}
        className="p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground"
        title="Toggle role"
      >
        {person.role === 'parent' ? <Baby className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
      </button>

      {/* Delete */}
      <button onClick={onDelete} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    </>
  );
}
