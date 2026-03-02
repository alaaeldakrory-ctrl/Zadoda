
"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Calendar, Layers, Settings, Globe, Sparkles, StickyNote } from 'lucide-react';
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
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary selection:text-white">
      {/* Sidebar */}
      <aside className="w-72 border-r-2 flex flex-col hidden lg:flex bg-card/80 backdrop-blur-xl relative">
        <div className="p-8">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <span className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Sparkles className="w-7 h-7" />
            </span>
            <div className="flex flex-col">
              <span className="leading-none">{t.appTitle}</span>
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-1">Family Connect</span>
            </div>
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-lg group",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground hover:translate-x-1"
              )}
            >
              <item.icon className={cn("w-6 h-6", pathname === item.href ? "animate-pop" : "group-hover:text-primary")} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t-2 bg-muted/10">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 h-12 rounded-xl font-bold hover:bg-white hover:shadow-md transition-all"
            onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
          >
            <Globe className="w-6 h-6 text-primary" />
            {settings.language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>
        
        <div className="absolute bottom-20 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 relative overflow-hidden">
        <header className="h-20 border-b-2 flex items-center justify-between px-8 lg:hidden bg-card/80 backdrop-blur-md sticky top-0 z-30">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-lg">F</div>
             <h1 className="text-2xl font-black text-primary tracking-tight">{t.appTitle}</h1>
           </div>
           <Button 
            variant="outline" 
            size="sm"
            className="rounded-full font-bold border-2"
            onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
          >
            {settings.language === 'en' ? 'العربية' : 'English'}
          </Button>
        </header>

        <div className="flex-1 p-4 lg:p-10 overflow-y-auto relative h-full">
          {children}
        </div>

        {/* Mobile Nav */}
        <nav className="h-20 border-t-2 flex lg:hidden bg-card/90 backdrop-blur-xl sticky bottom-0 z-30 px-4 gap-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all",
                pathname === item.href ? "text-primary scale-110" : "text-muted-foreground"
              )}
            >
              <div className={cn("p-2 rounded-xl transition-colors", pathname === item.href ? "bg-primary/10" : "")}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};
