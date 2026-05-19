"use client"

import React from 'react';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MealSlot, MealType, Recipe } from '@/lib/types';
import { CURATED_RECIPES } from './curatedRecipes';

interface WeeklyGridProps {
  weekStartDate: string;
  mealSlots: MealSlot[];
  recipes: Recipe[];
  onAddMeal: (day: number, mealType: MealType) => void;
  onEditMeal: (slot: MealSlot) => void;
  onDeleteDish: (slotId: string, dishIndex: number) => void;
  lang: 'en' | 'ar';
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const EN_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AR_DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const MEAL_LABELS: Record<MealType, { en: string; ar: string }> = {
  breakfast: { en: 'Breakfast', ar: 'إفطار' },
  lunch:     { en: 'Lunch',     ar: 'غداء'   },
  dinner:    { en: 'Dinner',    ar: 'عشاء'   },
  snack:     { en: 'Snack',     ar: 'وجبة خفيفة' },
};

const MEAL_COLORS: Record<MealType, { row: string; chip: string; btn: string }> = {
  breakfast: {
    row:  'text-emerald-700',
    chip: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    btn:  'hover:bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  lunch: {
    row:  'text-amber-700',
    chip: 'bg-amber-100 text-amber-800 border border-amber-200',
    btn:  'hover:bg-amber-50 text-amber-600 border border-amber-200',
  },
  dinner: {
    row:  'text-green-800',
    chip: 'bg-green-100 text-green-900 border border-green-200',
    btn:  'hover:bg-green-50 text-green-800 border border-green-200',
  },
  snack: {
    row:  'text-yellow-700',
    chip: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    btn:  'hover:bg-yellow-50 text-yellow-600 border border-yellow-200',
  },
};

function resolveDishName(dish: { recipeId?: string; freeText?: string }, recipes: Recipe[]): string {
  if (dish.recipeId) {
    if (dish.recipeId.startsWith('curated_')) {
      const curated = CURATED_RECIPES.find(r => r.id === dish.recipeId);
      if (curated) return curated.name;
    }
    const r = recipes.find(r => r.id === dish.recipeId);
    if (r) return r.name;
  }
  return dish.freeText || '—';
}

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

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSlot = (dayIndex: number, mealType: MealType): MealSlot | undefined =>
    mealSlots.find(
      s => s.weekStartDate === weekStartDate && s.dayIndex === dayIndex && s.mealType === mealType
    );

  return (
    <div className="w-full overflow-x-auto rounded-[2rem] border bg-card shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="min-w-[820px]">
        <div className="grid grid-cols-[120px_repeat(7,minmax(110px,1fr))]">
          <div className="border-b border-r bg-muted/30 p-3" />
          {days.map((day, i) => {
            const today = isToday(day);
            return (
              <div
                key={i}
                className={cn(
                  'border-b border-r last:border-r-0 p-3 text-center',
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

          {MEAL_TYPES.map(mealType => {
            const colors = MEAL_COLORS[mealType];
            return (
              <React.Fragment key={mealType}>
                <div className={cn(
                  'border-b border-r bg-muted/20 p-3 flex items-center',
                  'sticky left-0 z-10'
                )}>
                  <span className={cn('text-[11px] font-black uppercase tracking-wider', colors.row)}>
                    {MEAL_LABELS[mealType][lang]}
                  </span>
                </div>
                {days.map((day, dayIndex) => {
                  const today = isToday(day);
                  const slot = getSlot(dayIndex, mealType);
                  const hasDishes = slot && slot.dishes && slot.dishes.length > 0;

                  return (
                    <div
                      key={`${mealType}-${dayIndex}`}
                      className={cn(
                        'border-b border-r last:border-r-0 p-2 min-h-[72px] flex flex-col gap-1',
                        today ? 'bg-primary/5' : 'bg-background'
                      )}
                    >
                      {hasDishes ? (
                        <>
                          {slot!.dishes.map((dish, dishIndex) => {
                            const name = resolveDishName(dish, recipes);
                            return (
                              <div
                                key={dishIndex}
                                className={cn(
                                  'flex items-center gap-1 rounded-full px-2 py-0.5 cursor-pointer text-[11px] font-bold transition-all',
                                  colors.chip
                                )}
                                onClick={() => onEditMeal(slot!)}
                              >
                                <span className="truncate flex-1 leading-tight">{name}</span>
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
                            );
                          })}
                          <button
                            onClick={() => onAddMeal(dayIndex, mealType)}
                            className={cn(
                              'mt-auto self-start rounded-full p-0.5 transition-all',
                              colors.btn
                            )}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onAddMeal(dayIndex, mealType)}
                          className={cn(
                            'w-full h-full min-h-[56px] flex items-center justify-center rounded-xl border-2 border-dashed transition-all group',
                            colors.btn
                          )}
                        >
                          <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
