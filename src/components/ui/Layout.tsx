"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, getAvatarUrl } from '@/lib/utils';
import { Calendar, Layers, Settings, Globe, StickyNote, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, setLanguage, persons } = useStore();
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
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col hidden lg:flex bg-white relative z-20">
        <div className="p-10">
          <Link href="/" className="text-4xl font-black text-foreground flex items-center gap-3">
            <span className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
              <Plus className="w-6 h-6 text-primary-foreground stroke-[3px]" />
            </span>
            <span className="tracking-tight lowercase">zadoda</span>
          </Link>
        </div>

        <nav className="flex-1 px-6 space-y-1.5 mt-4 overflow-y-auto">
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
          <div className="px-4 space-y-3">
            {persons.map(person => (
              <div key={person.id} className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 transition-transform group-hover:scale-110 shadow-sm" style={{ borderColor: person.color }}>
                    <Image 
                      src={getAvatarUrl(person.name)} 
                      alt={person.name} 
                      width={40} 
                      height={40} 
                      className="object-cover"
                      data-ai-hint="person headshot"
                      priority
                    />
                  </div>
                </div>
                <span className="font-bold text-sm text-muted-foreground group-hover:text-foreground transition-colors">{person.name}</span>
              </div>
            ))}
          </div>
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
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto relative h-full">
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
