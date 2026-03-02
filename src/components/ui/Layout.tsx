
"use client"

import React, { Suspense } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import { Calendar, Layers, Settings, Globe, StickyNote, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';

const SidebarNav = () => {
  const { settings, persons } = useStore();
  const t = getTranslation(settings.language);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPersonId = searchParams.get('personId');

  const navItems = [
    { label: t.calendar, icon: Calendar, href: '/' },
    { label: t.fixedEvents, icon: Layers, href: '/templates' },
    { label: t.memos, icon: StickyNote, href: '/memos' },
    { label: t.settings, icon: Settings, href: '/settings' },
  ];

  return (
    <>
      <div className="px-4 mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Menu</p>
      </div>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-lg group",
            pathname === item.href 
              ? "bg-primary/10 text-foreground" 
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className={cn("w-6 h-6", pathname === item.href ? "text-primary" : "group-hover:text-primary")} />
          {item.label}
        </Link>
      ))}

      <div className="px-4 mt-10 mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2">
          <Users className="w-3 h-3" />
          Family
        </p>
      </div>
      <div className="px-4 space-y-6">
        {persons.map(person => (
          <Link 
            key={person.id} 
            href={`/?personId=${person.id}`}
            className={cn(
              "flex items-center gap-4 group cursor-pointer transition-all p-2 rounded-3xl",
              currentPersonId === person.id ? "bg-muted/50" : "hover:bg-muted/30"
            )}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 transition-transform group-hover:scale-110 shadow-sm" style={{ borderColor: person.color }}>
                <Image 
                  src={getAvatarUrl(person.id)} 
                  alt={person.name} 
                  width={80} 
                  height={80} 
                  className={cn(
                    "object-cover", 
                    person.id === 'person3' && "scale-110 -translate-y-4",
                    person.id === 'person4' && "scale-105 translate-y-[-2px]",
                    person.id === 'person2' && "scale-150 translate-y-3",
                    person.id === 'person1' && "scale-110 translate-y-4"
                  )}
                  data-ai-hint="person headshot"
                  priority
                />
              </div>
            </div>
            <span className={cn(
              "font-black text-base transition-colors",
              currentPersonId === person.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {getPersonName(person, settings.language)}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, setLanguage } = useStore();
  const t = getTranslation(settings.language);

  const logoImage = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <aside className="w-80 border-r flex flex-col hidden lg:flex bg-white relative z-20">
        <div className="pt-4 pb-8 flex flex-col items-center text-center">
          <Link href="/" className="flex flex-col items-center gap-6 group">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl shadow-primary/30 border-4 border-primary/20 flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/40 group-hover:border-primary/40">
              {logoImage ? (
                <Image 
                  src={logoImage} 
                  alt="Zadoda Logo" 
                  width={128} 
                  height={128} 
                  className="object-cover scale-95 -translate-y-5"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <Plus className="w-12 h-12 text-primary-foreground stroke-[3px]" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter text-foreground lowercase leading-none">zadoda</span>
              <span className="text-sm font-bold tracking-[0.2em] text-primary uppercase mt-1">scheduler</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-6 space-y-1.5 mt-4 overflow-y-auto">
          <Suspense fallback={<div className="p-4 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>}>
            <SidebarNav />
          </Suspense>
        </nav>

        <div className="p-8 border-t bg-muted/5">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 h-14 rounded-2xl font-bold hover:bg-white hover:shadow-sm transition-all"
            onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
          >
            <Globe className="w-6 h-6 text-primary" />
            <span className="text-lg">{settings.language === 'en' ? 'العربية' : 'English'}</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9] relative overflow-hidden">
        <div className="flex-1 p-2 lg:p-4 overflow-y-auto relative h-full">
          {children}
        </div>

        <nav className="h-20 border-t flex lg:hidden bg-white/95 backdrop-blur-xl sticky bottom-0 z-30 px-4 gap-2">
           <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>}>
             <div className="flex w-full gap-2 items-center justify-around">
               <Link href="/" className="flex flex-col items-center"><Calendar className="w-5 h-5"/><span className="text-[10px] font-black uppercase">Calendar</span></Link>
               <Link href="/templates" className="flex flex-col items-center"><Layers className="w-5 h-5"/><span className="text-[10px] font-black uppercase">Templates</span></Link>
               <Link href="/memos" className="flex flex-col items-center"><StickyNote className="w-5 h-5"/><span className="text-[10px] font-black uppercase">Memos</span></Link>
               <Link href="/settings" className="flex flex-col items-center"><Settings className="w-5 h-5"/><span className="text-[10px] font-black uppercase">Settings</span></Link>
             </div>
           </Suspense>
        </nav>
      </main>
    </div>
  );
};
