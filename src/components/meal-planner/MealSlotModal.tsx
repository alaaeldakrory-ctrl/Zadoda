"use client"

import React, { useState, useEffect } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { X, Plus, Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MealSlot, MealType, MealDish, Recipe } from '@/lib/types';
import { CURATED_RECIPES, CuratedRecipe } from './curatedRecipes';
import { dishEmoji, dishFromRecipe, dishName } from './dishes';
import { MEAL_GROUPS, PLAN_ROWS, getPlanRow } from './mealRows';

interface MealSlotModalProps {
  open: boolean;
  day: number;
  mealType: MealType;
  weekStartDate: string;
  existingSlot?: MealSlot;
  recipes: Recipe[];
  onSave: (dishes: MealDish[]) => void;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export function MealSlotModal({
  open,
  day,
  mealType,
  weekStartDate,
  existingSlot,
  recipes,
  onSave,
  onClose,
  lang,
}: MealSlotModalProps) {
  const isRtl = lang === 'ar';
  const [dishes, setDishes] = useState<MealDish[]>([]);
  const [query, setQuery] = useState('');
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    if (open) {
      setDishes(existingSlot?.dishes ? [...existingSlot.dishes] : []);
      setQuery('');
      setFreeText('');
    }
  }, [open, existingSlot]);

  if (!open) return null;

  const displayDate = format(addDays(parseISO(weekStartDate), day), 'EEE, MMM d');
  // Slots always use plan rows; fall back to dinner rather than crash on unexpected data.
  const row = getPlanRow(mealType) ?? PLAN_ROWS[PLAN_ROWS.length - 1];
  const group = MEAL_GROUPS.find(g => g.key === row.group)!;

  const lowerQuery = query.toLowerCase();
  // Lunchboxes also suit snack recipes.
  const curatedTypes: string[] = row.type === 'malika-lunchbox' ? ['lunch', 'snack'] : [row.group];

  // When searching: match across all curated types. When browsing: show all for base type.
  const matchedCurated = query.trim()
    ? CURATED_RECIPES.filter(r => r.name.toLowerCase().includes(lowerQuery))
    : CURATED_RECIPES.filter(r => curatedTypes.includes(r.mealType));

  // Always show family recipes — filtered when searching, most-recent when browsing.
  const matchedFamily = query.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(lowerQuery))
    : recipes.slice(0, 5);

  const addRecipe = (r: CuratedRecipe | Recipe) => {
    setDishes(prev => [...prev, dishFromRecipe(r)]);
  };

  const addFreeText = () => {
    const t = freeText.trim();
    if (!t) return;
    setDishes(prev => [...prev, { freeText: t }]);
    setFreeText('');
  };

  const removeDish = (index: number) => {
    setDishes(prev => prev.filter((_, i) => i !== index));
  };

  const getDishDisplayName = (dish: MealDish): string => {
    const emoji = dishEmoji(dish, recipes);
    const name = dishName(dish, recipes);
    return emoji ? `${emoji} ${name}` : name;
  };

  // An empty list is only saveable when it clears a slot that had dishes.
  const canSave = dishes.length > 0 || !!existingSlot?.dishes?.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className={cn('px-6 pt-6 pb-4 rounded-t-[2rem]', row.accent)}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{row.emoji}</span>
                <h2 className="text-xl font-black">
                  {group[lang]} · {row[lang]}
                </h2>
              </div>
              <p className="text-sm font-medium opacity-70 mt-0.5">{displayDate}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {dishes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dishes.map((dish, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold',
                    row.chip
                  )}
                >
                  <span>{getDishDisplayName(dish)}</span>
                  <button
                    onClick={() => removeDish(i)}
                    className="hover:opacity-60 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className={cn('absolute top-3 w-4 h-4 text-muted-foreground', isRtl ? 'right-3' : 'left-3')} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث عن وصفة...' : 'Search recipes...'}
              className={cn(
                'w-full border rounded-xl py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40',
                isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'
              )}
            />
          </div>

          {matchedCurated.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {isRtl ? 'قائمة الوجبات' : query.trim() ? 'Matching Meals' : 'Meal Ideas'}
              </p>
              <div className="space-y-1">
                {matchedCurated.map(r => (
                  <button
                    key={r.id}
                    onClick={() => addRecipe(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all text-left group"
                  >
                    <span className="text-xl">{r.emoji}</span>
                    <span className="flex-1 text-sm font-bold">{r.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {r.prepTime}m
                    </span>
                    <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedFamily.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {isRtl
                  ? 'وصفات العائلة'
                  : query.trim() ? 'Family Recipes' : 'Your Recipes'}
              </p>
              <div className="space-y-1">
                {matchedFamily.map(r => (
                  <button
                    key={r.id}
                    onClick={() => addRecipe(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all text-left group"
                  >
                    <span className="text-xl">🍽️</span>
                    <span className="flex-1 text-sm font-bold">{r.name}</span>
                    {r.prepTime && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {r.prepTime}m
                      </span>
                    )}
                    <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              {isRtl ? 'أو أضف نصاً حراً' : 'or add free text'}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addFreeText(); }}
              placeholder={isRtl ? 'أي وجبة...' : 'Any dish name...'}
              className={cn(
                'flex-1 border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40',
                isRtl ? 'text-right' : ''
              )}
            />
            <button
              onClick={addFreeText}
              disabled={!freeText.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-3 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border font-bold text-sm hover:bg-muted/50 transition-all"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => onSave(dishes)}
            disabled={!canSave}
            className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90"
          >
            {dishes.length === 0
              ? (isRtl ? 'مسح الوجبة' : 'Clear meal')
              : (isRtl ? 'حفظ' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
