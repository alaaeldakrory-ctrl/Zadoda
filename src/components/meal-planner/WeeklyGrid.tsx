"use client"

import React from 'react';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MealSlot, MealType, Recipe } from '@/lib/types';
import { dishEmoji, dishImage, dishName } from './dishes';
import { MEAL_GROUPS, PLAN_ROWS, PlanRow, isRowActive } from './mealRows';

interface WeeklyGridProps {
  weekStartDate: string;
  mealSlots: MealSlot[];
  recipes: Recipe[];
  onAddMeal: (day: number, mealType: MealType) => void;
  onEditMeal: (slot: MealSlot) => void;
  onClearMeal: (slotId: string) => void;
  lang: 'en' | 'ar';
}

const EN_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AR_DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

/** A planned block: one meal filling the whole cell, with its photo when the recipe has one. */
function FilledCell({
  slot,
  row,
  recipes,
  isRtl,
  onEdit,
  onClear,
}: {
  slot: MealSlot;
  row: PlanRow;
  recipes: Recipe[];
  isRtl: boolean;
  onEdit: () => void;
  onClear: () => void;
}) {
  // One meal per block. Older slots may hold several dishes: show the first and a count.
  const dish = slot.dishes[0];
  const extra = slot.dishes.length - 1;
  const photo = dishImage(dish, recipes);
  const name = dishName(dish, recipes);

  return (
    <div className="relative group h-full min-h-[88px]">
      <button
        onClick={onEdit}
        title={isRtl ? 'تغيير الوجبة' : 'Change meal'}
        className={cn(
          'w-full h-full min-h-[88px] rounded-xl overflow-hidden flex flex-col text-start transition-all hover:brightness-95',
          photo ? 'bg-muted' : row.chip
        )}
      >
        {photo ? (
          <>
            <img src={photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
            <span className="relative mt-auto w-full rounded-b-xl bg-gradient-to-t from-black/75 to-transparent px-2 pt-5 pb-1.5 text-[11px] font-bold leading-tight text-white line-clamp-2">
              {name}
            </span>
          </>
        ) : (
          <span className="flex-1 flex flex-col items-center justify-center gap-1 px-1.5 py-2 text-center">
            <span className="text-2xl leading-none">{dishEmoji(dish, recipes) ?? '🍽️'}</span>
            <span className="text-[11px] font-bold leading-tight line-clamp-3">{name}</span>
          </span>
        )}
      </button>
      {extra > 0 && (
        <span className="absolute top-1 start-1 rounded-full bg-black/60 text-white text-[10px] font-bold px-1.5 pointer-events-none">
          +{extra}
        </span>
      )}
      <button
        onClick={onClear}
        title={isRtl ? 'إزالة' : 'Remove'}
        className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function WeeklyGrid({
  weekStartDate,
  mealSlots,
  recipes,
  onAddMeal,
  onEditMeal,
  onClearMeal,
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
                          'border-b border-e last:border-e-0 p-1.5 min-h-[100px] flex flex-col',
                          today ? 'bg-primary/5' : active ? 'bg-background' : 'bg-muted/30'
                        )}
                      >
                        {hasDishes ? (
                          <FilledCell
                            slot={slot!}
                            row={row}
                            recipes={recipes}
                            isRtl={isRtl}
                            onEdit={() => onEditMeal(slot!)}
                            onClear={() => onClearMeal(slot!.id)}
                          />
                        ) : active ? (
                          <button
                            onClick={() => onAddMeal(dayIndex, row.type)}
                            className={cn(
                              'w-full h-full min-h-[88px] flex items-center justify-center rounded-xl border-2 border-dashed transition-all group',
                              row.btn
                            )}
                          >
                            <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          // Not needed today (e.g. no school), but still tappable for the odd exception
                          <button
                            onClick={() => onAddMeal(dayIndex, row.type)}
                            className="w-full h-full min-h-[88px] flex items-center justify-center rounded-xl text-[11px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
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
