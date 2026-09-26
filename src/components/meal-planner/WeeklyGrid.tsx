"use client"

import React from 'react';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MealSlot, MealType, Recipe } from '@/lib/types';
import { dishName } from './dishes';
import { MEAL_GROUPS, PLAN_ROWS, isRowActive } from './mealRows';

interface WeeklyGridProps {
  weekStartDate: string;
  mealSlots: MealSlot[];
  recipes: Recipe[];
  onAddMeal: (day: number, mealType: MealType) => void;
  onEditMeal: (slot: MealSlot) => void;
  onDeleteDish: (slotId: string, dishIndex: number) => void;
  lang: 'en' | 'ar';
}

const EN_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AR_DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function WeeklyGrid({
  weekStartDate,
  mealSlots,
  recipes,
  onAddMeal,
  onEditMeal,
  onDeleteDish,
  lang,
}: WeeklyGridProps) {
  const isRtl = lang === 'ar';
  const dayLabels = isRtl ? AR_DAY_LABELS : EN_DAY_LABELS;
  const weekStart = parseISO(weekStartDate);
  const stickySide = isRtl ? 'right-0' : 'left-0';

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSlot = (dayIndex: number, mealType: MealType): MealSlot | undefined =>
    mealSlots.find(
      s => s.weekStartDate === weekStartDate && s.dayIndex === dayIndex && s.mealType === mealType
    );

  return (
    <div className="w-full overflow-x-auto rounded-[2rem] border bg-card shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[150px_repeat(7,minmax(110px,1fr))]">
          <div className={cn('border-b border-e bg-card p-3 sticky z-10', stickySide)} />
          {days.map((day, i) => {
            const today = isToday(day);
            return (
              <div
                key={i}
                className={cn(
                  'border-b border-e last:border-e-0 p-3 text-center',
                  today ? 'bg-primary/8 ring-2 ring-inset ring-primary/30' : 'bg-muted/10'
                )}
              >
                <p className={cn('text-[11px] font-black uppercase tracking-widest', today ? 'text-primary' : 'text-muted-foreground')}>
                  {dayLabels[i]}
                </p>
                <p className={cn('text-xl font-black mt-0.5', today ? 'text-primary' : 'text-foreground')}>
                  {format(day, 'd')}
                </p>
                {today && (
                  <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            );
          })}

          {MEAL_GROUPS.map(group => (
            <React.Fragment key={group.key}>
              {/* Group heading spans the whole row; the label itself stays in view while scrolling */}
              <div className="col-span-8 border-b bg-muted/40 px-3 py-1.5">
                <span className={cn('sticky inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground', isRtl ? 'right-3' : 'left-3')}>
                  <span>{group.emoji}</span>
                  {group[lang]}
                </span>
              </div>

              {PLAN_ROWS.filter(row => row.group === group.key).map(row => (
                <React.Fragment key={row.type}>
                  <div className={cn('border-b border-e bg-card p-3 flex items-center gap-2 sticky z-10', stickySide)}>
                    {/* Tint on top of an opaque background so dishes don't show through while scrolling */}
                    <div className="absolute inset-0 bg-muted/20 pointer-events-none" />
                    <span className="relative text-base leading-none">{row.emoji}</span>
                    <span className={cn('relative text-xs font-black leading-tight', row.text)}>
                      {row[lang]}
                    </span>
                  </div>

                  {days.map((day, dayIndex) => {
                    const today = isToday(day);
                    const slot = getSlot(dayIndex, row.type);
                    const hasDishes = !!slot?.dishes?.length;
                    const active = isRowActive(row, dayIndex);

                    return (
                      <div
                        key={`${row.type}-${dayIndex}`}
                        className={cn(
                          'border-b border-e last:border-e-0 p-2 min-h-[72px] flex flex-col gap-1',
                          today ? 'bg-primary/5' : active ? 'bg-background' : 'bg-muted/30'
                        )}
                      >
                        {hasDishes ? (
                          <>
                            {slot!.dishes.map((dish, dishIndex) => (
                              <div
                                key={dishIndex}
                                className={cn(
                                  'flex items-center gap-1 rounded-full px-2 py-0.5 cursor-pointer text-[11px] font-bold transition-all',
                                  row.chip
                                )}
                                onClick={() => onEditMeal(slot!)}
                              >
                                <span className="truncate flex-1 leading-tight">{dishName(dish, recipes)}</span>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    onDeleteDish(slot!.id, dishIndex);
                                  }}
                                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => onAddMeal(dayIndex, row.type)}
                              className={cn('mt-auto self-start rounded-full p-0.5 transition-all', row.btn)}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </>
                        ) : active ? (
                          <button
                            onClick={() => onAddMeal(dayIndex, row.type)}
                            className={cn(
                              'w-full h-full min-h-[56px] flex items-center justify-center rounded-xl border-2 border-dashed transition-all group',
                              row.btn
                            )}
                          >
                            <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          // Not needed today (e.g. no school), but still tappable for the odd exception
                          <button
                            onClick={() => onAddMeal(dayIndex, row.type)}
                            className="w-full h-full min-h-[56px] flex items-center justify-center rounded-xl text-[11px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          >
                            {isRtl ? 'لا مدرسة' : 'No school'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
