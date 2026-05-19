"use client"

import React, { useState, useEffect } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { X, Plus, Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MealSlot, MealType, MealDish, Recipe } from '@/lib/types';
import { CURATED_RECIPES, CuratedRecipe } from './curatedRecipes';

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

const MEAL_LABELS: Record<MealType, { en: string; ar: string; emoji: string }> = {
  breakfast: { en: 'Breakfast', ar: 'إفطار', emoji: '☀️' },
  lunch:     { en: 'Lunch',     ar: 'غداء',   emoji: '🌤️' },
  dinner:    { en: 'Dinner',    ar: 'عشاء',   emoji: '🌙' },
  snack:     { en: 'Snack',     ar: 'وجبة خفيفة', emoji: '🍎' },
};

const MEAL_ACCENT: Record<MealType, string> = {
  breakfast: 'text-emerald-700 bg-emerald-50',
  lunch:     'text-amber-700 bg-amber-50',
  dinner:    'text-green-800 bg-green-50',
  snack:     'text-yellow-700 bg-yellow-50',
};

const CHIP_COLORS: Record<MealType, string> = {
  breakfast: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  lunch:     'bg-amber-100 text-amber-800 border border-amber-200',
  dinner:    'bg-green-100 text-green-900 border border-green-200',
  snack:     'bg-yellow-100 text-yellow-800 border border-yellow-200',
};

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
  const meta = MEAL_LABELS[mealType];
  const accent = MEAL_ACCENT[mealType];
  const chipColor = CHIP_COLORS[mealType];

  const lowerQuery = query.toLowerCase();

  const matchedCurated = query.trim()
    ? CURATED_RECIPES.filter(
        r => r.mealType === mealType && r.name.toLowerCase().includes(lowerQuery)
      ).slice(0, 6)
    : CURATED_RECIPES.filter(r => r.mealType === mealType).slice(0, 6);

  const matchedFamily = query.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(lowerQuery))
    : [];

  const addCurated = (r: CuratedRecipe) => {
    setDishes(prev => [...prev, { recipeId: r.id }]);
  };

  const addFamilyRecipe = (r: Recipe) => {
    setDishes(prev => [...prev, { recipeId: r.id }]);
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
    if (dish.recipeId?.startsWith('curated_')) {
      const curated = CURATED_RECIPES.find(r => r.id === dish.recipeId);
      if (curated) return `${curated.emoji} ${curated.name}`;
    }
    if (dish.recipeId) {
      const family = recipes.find(r => r.id === dish.recipeId);
      if (family) return family.name;
    }
    return dish.freeText || '—';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className={cn('px-6 pt-6 pb-4 rounded-t-[2rem]', accent)}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{meta.emoji}</span>
                <h2 className="text-xl font-black">
                  {isRtl ? meta.ar : meta.en}
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
                    chipColor
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
                {isRtl ? 'وصفات مقترحة' : 'Curated Recipes'}
              </p>
              <div className="space-y-1">
                {matchedCurated.map(r => (
                  <button
                    key={r.id}
                    onClick={() => addCurated(r)}
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
                {isRtl ? 'وصفات العائلة' : 'Family Recipes'}
              </p>
              <div className="space-y-1">
                {matchedFamily.map(r => (
                  <button
                    key={r.id}
                    onClick={() => addFamilyRecipe(r)}
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
            onClick={() => { onSave(dishes); onClose(); }}
            disabled={dishes.length === 0}
            className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90"
          >
            {isRtl ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
