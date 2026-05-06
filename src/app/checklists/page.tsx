"use client"

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, Calendar as CalendarIcon, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { getAvatarUrl, getPersonName, cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const playDing = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const playTada = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playNote(440, now, 0.15);     
    playNote(554.37, now + 0.15, 0.15); 
    playNote(659.25, now + 0.3, 0.4);  
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function CheckListsPage() {
  const { persons, settings, addTaskExecutionLog } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const checklistPersons = persons.filter(p => p.id === 'person1' || p.id === 'person2');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('person1');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('checklistState');
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse checklist state', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('checklistState', JSON.stringify(checkedItems));
  }, [checkedItems]);

  const checklists = [
    { 
      id: 'school', 
      title: 'Going to School Routine',
      items: [
        '🛏️ ترتيب السرير',
        '🧴 مزيل عرق + بانتي',
        '🛁 حمام + وش + أسنان',
        '👕 لبس + شراب',
        '🥞 إفطار',
        '⌚ ساعة',
        '💇‍♀️ تسريح',
        '🍱 لانش بوكس + ماء',
        '🧥 جاكيت + Hat + جوانتي + شمسية',
        '🎒 جزمة + شنطة + دعاء'
      ]
    },
    { 
      id: 'back-home', 
      title: 'Back Home Routine',
      items: [
        '🎒 الشنطة مكانها',
        '👟 الجزمة مكانها',
        '🧥 جاكيت / Hat / جوانتي',
        '🧼 غسيل يد و وجه',
        '👕 تغيير هدوم',
        '🧺 الهدوم في الغسيل',
        '🍱 لانش بوكس',
        '🕌 صلاة'
      ]
    },
    { 
      id: 'sleep', 
      title: 'Sleep Routine',
      items: []
    },
    { 
      id: 'leaving-home', 
      title: 'Leaving Home Routine',
      items: []
    },
  ];

  const dateKey = format(currentDate, 'yyyy-MM-dd');

  const toggleItem = (list: any, itemIndex: number, completionType: 'independent' | 'with_help' = 'independent') => {
    const key = `${dateKey}-${selectedPersonId}-${list.id}-${itemIndex}`;
    const willBeChecked = !checkedItems[key];
    
    setCheckedItems(prev => {
      const newState = { ...prev, [key]: willBeChecked };
      
      if (willBeChecked) {
        playDing();
        addTaskExecutionLog({
          childId: selectedPersonId,
          taskId: `${list.id}-${itemIndex}`,
          routineId: list.id,
          type: 'checklist',
          date: dateKey,
          completed: true,
          completionType: completionType,
          completionTimeSeconds: 30,
          expectedTimeSeconds: 60
        });
        
        // Check if this was the last item to be checked off in the list
        const listCompletedCount = list.items.filter((_: any, idx: number) => 
          idx === itemIndex ? true : newState[`${dateKey}-${selectedPersonId}-${list.id}-${idx}`]
        ).length;
        
        if (listCompletedCount === list.items.length) {
          playTada();
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FBBF24', '#F87171', '#34D399', '#60A5FA']
          });
        }
      }
      return newState;
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full space-y-8 lg:p-4 pb-24">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 lg:px-0 mt-6 lg:mt-0">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-3xl text-primary shadow-sm">
              <CheckSquare className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-foreground">Check Lists</h1>
              <p className="text-muted-foreground font-bold text-lg">Daily routine checklists</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger className="w-auto h-14 rounded-3xl font-black border-2 bg-white shadow-sm px-6 text-lg hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-none shadow-2xl p-2">
                {checklistPersons.map(p => (
                  <SelectItem key={p.id} value={p.id} className="rounded-2xl cursor-pointer">
                    <div className="flex items-center gap-4 py-2 pr-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-4 shadow-sm" style={{ borderColor: p.color }}>
                        <Image 
                          src={getAvatarUrl(p.id)} 
                          alt={p.name} 
                          width={40} 
                          height={40} 
                          className={cn(
                            "object-cover", 
                            p.id === 'person3' && "scale-110 -translate-y-4",
                            p.id === 'person4' && "scale-105 translate-y-[-2px]",
                            p.id === 'person2' && "scale-150 translate-y-3",
                            p.id === 'person1' && "scale-110 translate-y-4"
                          )}
                        />
                      </div>
                      <span className="text-xl font-black">{getPersonName(p, settings.language)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 bg-white p-1.5 rounded-3xl shadow-sm border-2">
              <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 hover:bg-muted shadow-sm transition-all" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
                <ChevronLeft className="w-6 h-6 rtl:rotate-180 text-primary" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-lg font-black rounded-2xl flex gap-2 px-6 h-11 hover:bg-primary/10 transition-all text-foreground">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {format(currentDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[2.5rem] overflow-hidden shadow-2xl border-none" align="end">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 hover:bg-muted shadow-sm transition-all" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
                <ChevronRight className="w-6 h-6 rtl:rotate-180 text-primary" />
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 px-4 lg:px-0">
          {checklists.map((list) => {
            const listCompletedCount = list.items.filter((_, idx) => checkedItems[`${dateKey}-${selectedPersonId}-${list.id}-${idx}`]).length;
            const totalItems = list.items.length;
            const isAllCompleted = totalItems > 0 && listCompletedCount === totalItems;
            const progressPercentage = totalItems === 0 ? 0 : (listCompletedCount / totalItems) * 100;

            return (
              <Card 
                key={list.id} 
                className={cn(
                  "border-[3px] shadow-lg rounded-[3rem] overflow-hidden hover:shadow-xl transition-all duration-300",
                  isAllCompleted ? 'bg-primary/10 border-primary/40 scale-[1.01]' : 'bg-white border-muted/50'
                )}
              >
                <CardHeader className="bg-muted/10 pb-6 border-b px-8 pt-8">
                  <CardTitle className="text-3xl font-black flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl shadow-inner",
                          isAllCompleted ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground"
                        )}>
                          <CheckSquare className="w-8 h-8" />
                        </div>
                        <span className={isAllCompleted ? 'text-primary' : 'text-foreground'}>{list.title}</span>
                      </div>
                      {totalItems > 0 && (
                        <div className={cn(
                          "text-xl font-black px-5 py-2 rounded-2xl border-2 shadow-sm",
                          isAllCompleted ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-muted"
                        )}>
                          {listCompletedCount} / {totalItems}
                        </div>
                      )}
                    </div>
                    {totalItems > 0 && (
                      <Progress value={progressPercentage} className="h-4 rounded-full bg-muted shadow-inner border" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 px-8 pb-8">
                  {totalItems > 0 ? (
                    <div className="space-y-4">
                      {list.items.map((item, index) => {
                        const isChecked = !!checkedItems[`${dateKey}-${selectedPersonId}-${list.id}-${index}`];
                        return (
                          <div 
                            key={index}
                            className={cn(
                              "flex items-center gap-6 p-5 rounded-3xl transition-all duration-300 cursor-pointer border-[3px]",
                              isChecked 
                                ? 'bg-primary/10 border-primary/30 opacity-70 scale-[0.98]' 
                                : 'bg-white border-muted/20 hover:border-primary/40 hover:shadow-md'
                            )}
                            onClick={() => toggleItem(list, index)}
                          >
                            <div className="shrink-0 flex items-center">
                              {isChecked ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleItem(list, index); }}
                                  className="bg-primary/20 text-primary font-black py-2 px-4 rounded-xl flex items-center gap-2 shadow-inner border-2 border-primary/30 text-sm whitespace-nowrap"
                                >
                                  ✅ Done
                                </button>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleItem(list, index, 'independent'); }}
                                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-black py-2 px-3 rounded-xl flex items-center gap-2 transition-colors border-2 border-emerald-200 shadow-sm whitespace-nowrap text-xs"
                                  >
                                    🖐️ Alone
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleItem(list, index, 'with_help'); }}
                                    className="bg-amber-100 text-amber-700 hover:bg-amber-200 font-black py-2 px-3 rounded-xl flex items-center gap-2 transition-colors border-2 border-amber-200 shadow-sm whitespace-nowrap text-xs"
                                  >
                                    🤝 Help
                                  </button>
                                </div>
                              )}
                            </div>
                            <span 
                              className={cn(
                                "text-2xl font-bold transition-all duration-300", 
                                isChecked ? 'text-muted-foreground line-through decoration-primary decoration-4' : 'text-foreground'
                              )} 
                              dir="auto"
                            >
                              {item}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-[2rem] border-4 border-dashed border-muted/30 bg-muted/5">
                      <div className="w-24 h-24 mb-4 opacity-20">
                        <CheckSquare className="w-full h-full" />
                      </div>
                      <p className="text-2xl text-muted-foreground font-black">
                        No items yet for {format(currentDate, 'MMM d')}.
                      </p>
                      <p className="text-lg text-muted-foreground/60 font-bold mt-2">
                        You can add checklist items here later.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  );
}
