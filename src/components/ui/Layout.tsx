
"use client"

import React, { Suspense } from 'react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, getAvatarUrl, getPersonName } from '@/lib/utils';
import { Calendar, Layers, Settings, Globe, StickyNote, Plus, Users, ClipboardList, CheckSquare, Lock, Unlock, Tv2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';
import { PinDialog } from '@/components/ui/PinDialog';

const SidebarNav = () => {
  const { settings, persons, isParentUnlocked, lockParent } = useStore();
  const t = getTranslation(settings.language);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPersonId = searchParams.get('personId');
  const [pinDialogOpen, setPinDialogOpen] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const navItems = [
    { label: t.calendar, icon: Calendar, href: '/' },
    { label: t.dailyChores, icon: ClipboardList, href: '/chores' },
    { label: t.checkLists, icon: CheckSquare, href: '/checklists' },
    { label: t.memos, icon: StickyNote, href: '/memos' },
    { label: t.parentsPlanning || 'Parents Planning', icon: Layers, href: '/parents-planning', protected: true },
    { label: t.settings, icon: Settings, href: '/settings', protected: true },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    if (item.protected && !isParentUnlocked) {
      e.preventDefault();
      setPendingHref(item.href);
      setPinDialogOpen(true);
    }
  };

  return (
    <>
      <div className="px-4 mb-4 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Menu</p>
        {isParentUnlocked && (
          <button 
            onClick={() => lockParent()} 
            className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"
          >
            <Lock className="w-3 h-3" /> {t.lock || 'Lock App'}
          </button>
        )}
      </div>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          onClick={(e) => handleNavClick(e, item)}
          className={cn(
            "flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-lg group",
            pathname === item.href 
              ? "bg-primary/10 text-foreground" 
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <item.icon className={cn("w-6 h-6", pathname === item.href ? "text-primary" : "group-hover:text-primary")} />
            {item.protected && !isParentUnlocked && (
              <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-muted-foreground bg-background rounded-full" />
            )}
            {item.protected && isParentUnlocked && (
              <Unlock className="w-3 h-3 absolute -bottom-1 -right-1 text-primary bg-background rounded-full" />
            )}
          </div>
          {item.label}
        </Link>
      ))}
      <PinDialog 
        open={pinDialogOpen} 
        onOpenChange={setPinDialogOpen} 
        onSuccess={() => {
          if (pendingHref) {
            router.push(pendingHref);
          }
        }} 
      />

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
                  src={getAvatarUrl(person.id, person.avatarUrl)}
                  alt={person.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
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

const MobileBottomNav = () => {
  const { settings, isParentUnlocked, lockParent } = useStore();
  const t = getTranslation(settings.language);
  const pathname = usePathname();
  const router = useRouter();
  const [pinDialogOpen, setPinDialogOpen] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const navItems = [
    { label: 'Calendar', icon: Calendar, href: '/' },
    { label: 'Chores', icon: ClipboardList, href: '/chores' },
    { label: 'Checklists', icon: CheckSquare, href: '/checklists' },
    { label: 'Parents', icon: Layers, href: '/parents-planning', protected: true },
    { label: 'Settings', icon: Settings, href: '/settings', protected: true },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    if (item.protected && !isParentUnlocked) {
      e.preventDefault();
      setPendingHref(item.href);
      setPinDialogOpen(true);
    }
  };

  return (
    <nav className="border-t flex lg:hidden bg-card/95 backdrop-blur-xl sticky bottom-0 z-30 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.08)]">
      <div className="flex w-full justify-around items-center">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 touch-manipulation relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20 stroke-[2.5px]")} />
                {item.protected && !isParentUnlocked && (
                  <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-muted-foreground bg-background rounded-full" />
                )}
                {item.protected && isParentUnlocked && (
                  <Unlock className="w-3 h-3 absolute -bottom-1 -right-1 text-primary bg-background rounded-full" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <PinDialog 
        open={pinDialogOpen} 
        onOpenChange={setPinDialogOpen} 
        onSuccess={() => {
          if (pendingHref) router.push(pendingHref);
        }} 
      />
    </nav>
  );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, setLanguage, currentUser, isAuthLoading, signOut } = useStore();
  const router = useRouter();

  // Redirect to login when not authenticated
  React.useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.isAnonymous)) {
      router.replace('/');
    }
  }, [isAuthLoading, currentUser, router]);
  const t = getTranslation(settings.language);

  const logoImage = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <aside className="w-80 border-r flex flex-col hidden lg:flex bg-card relative z-20">
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

        <div className="p-6 border-t bg-muted/5 flex flex-col gap-1">
          <Link
            href="/tv"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-muted-foreground hover:bg-card hover:text-foreground transition-all group"
          >
            <Tv2 className="w-5 h-5 group-hover:text-primary transition-colors" />
            <span className="text-sm">Wall / TV Mode</span>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 rounded-2xl font-bold hover:bg-card text-sm px-4"
            onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
          >
            <Globe className="w-5 h-5 text-primary" />
            {settings.language === 'en' ? 'العربية' : 'English'}
          </Button>
          {currentUser && !currentUser.isAnonymous && (
            <>
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold text-muted-foreground/50 truncate">{currentUser.email || currentUser.displayName}</p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11 rounded-2xl font-bold hover:bg-destructive/10 hover:text-destructive text-muted-foreground text-sm px-4 transition-all"
                onClick={signOut}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
        <div className="flex-1 p-2 lg:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] lg:pt-4 overflow-y-auto relative h-full">
          {children}
        </div>

        <Suspense fallback={<div className="h-16 flex lg:hidden bg-white border-t sticky bottom-0 z-30"><Skeleton className="w-full h-full" /></div>}>
          <MobileBottomNav />
        </Suspense>
      </main>
    </div>
  );
};
