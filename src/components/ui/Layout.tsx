"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Calendar, Layers, Settings, Globe, Sparkles, StickyNote, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, setLanguage } = useStore();
  const t = getTranslation(settings.language);
  const pathname = usePathname();

  const navItems = [
    { label: t.calendar, icon: Calendar, href: '/' },
    { label: t.fixedEvents, icon: Layers, href: '/templates' },
    { label: t.memos, icon: StickyNote, href: '/memos' },
    { label: t.settings, icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar - Matching Taskly Left Rail */}
      <aside className="w-80 border-r flex flex-col hidden lg:flex bg-white relative z-20">
        <div className="p-10">
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            <span className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
              <Plus className="w-6 h-6 text-primary-foreground stroke-[3px]" />
            </span>
            <span className="tracking-tight lowercase">taskly</span>
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-1.5 mt-4">
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9] relative overflow-hidden">
        {/* Header - Matching Taskly Right Info */}
        <header className="h-24 flex items-center justify-between px-10 bg-white/50 backdrop-blur-md sticky top-0 z-30 lg:border-b">
           <div className="flex flex-col">
             <h2 className="text-3xl font-black text-foreground tracking-tight">Today's schedule</h2>
             <p className="text-primary font-bold text-lg mt-0.5">Thursday 11</p>
           </div>
           
           <div className="flex items-center gap-4">
             <Button 
                variant="outline" 
                className="rounded-full font-bold border-2 h-12 px-6 hidden sm:flex"
                onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
              >
                {settings.language === 'en' ? 'العربية' : 'English'}
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-black leading-none">Family Account</p>
                  <p className="text-[10px] font-bold text-primary uppercase mt-1">Active</p>
                </div>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-black text-primary">FC</div>
              </div>
           </div>
        </header>

        <div className="flex-1 p-6 lg:p-12 overflow-y-auto relative h-full">
          {children}
        </div>

        {/* Mobile Nav */}
        <nav className="h-20 border-t flex lg:hidden bg-white/95 backdrop-blur-xl sticky bottom-0 z-30 px-4 gap-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn("p-2 rounded-2xl transition-colors", pathname === item.href ? "bg-primary/10" : "")}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};