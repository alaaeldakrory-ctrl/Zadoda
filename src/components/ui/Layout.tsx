
"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Calendar, Layers, Settings, Globe } from 'lucide-react';
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
    { label: t.settings, icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col hidden lg:flex bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <span className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">F</span>
            {t.appTitle}
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3"
            onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
          >
            <Globe className="w-5 h-5" />
            {settings.language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50">
        <header className="h-16 border-b flex items-center justify-between px-6 lg:hidden bg-card">
           <h1 className="text-xl font-black text-primary">{t.appTitle}</h1>
           <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
          >
            {settings.language === 'en' ? 'العربية' : 'English'}
          </Button>
        </header>

        <div className="flex-1 p-4 lg:p-8 overflow-hidden">
          {children}
        </div>

        {/* Mobile Nav */}
        <nav className="h-16 border-t flex lg:hidden bg-card sticky bottom-0">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};
