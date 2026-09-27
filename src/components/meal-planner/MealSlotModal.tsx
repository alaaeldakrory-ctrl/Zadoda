"use client"

import React, { useState, useEffect } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { X, Plus, Search, Clock, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MealSlot, MealType, MealDish, Recipe } from '@/lib/types';
import { CURATED_RECIPES } from './curatedRecipes';
import { dishEmoji, dishFromRecipe, dishImage, dishName, effectiveCurated } from './dishes';
import { MEAL_GROUPS, PLAN_ROWS, getPlanRow } from './mealRows';

interface MealSlotModalProps {
  open: boolean;
  day: number;
  mealType: MealType;
  weekStartDate: string;
  existingSlot?: MealSlot;
  recipes: Recipe[];
  /** One meal per block: [dish] to set it, [] to clear it. */
  onSave: (dishes: MealDish[]) => void;
  onClose: () => void;
  lang: 'en' | 'ar';
}

interface Choice {
  id: string;
  name: string;
  emoji?: string;
  prepTime?: number;
  imageUrl?: string;
  dish: MealDish;
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
  const [query, setQuery] = useState('');
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
      setFreeText('');
    }
  }, [open]);

  if (!open) return null;

  const displayDate = format(addDays(parseISO(weekStartDate), day), 'EEE, MMM d');
  // Slots always use plan rows; fall back to dinner rather than crash on unexpected data.
  const row = getPlanRow(mealType) ?? PLAN_ROWS[PLAN_ROWS.length - 1];
  const group = MEAL_GROUPS.find(g => g.key === row.group)!;
  const current = existingSlot?.dishes?.[0];

  const lowerQuery = query.trim().toLowerCase();
  // Lunchboxes also suit snack recipes.
  const curatedTypes: string[] = row.type === 'malika-lunchbox' ? ['lunch', 'snack'] : [row.group];

  // Built-in recipes appear as the family's edited version when they have one.
  const curatedChoices: Choice[] = CURATED_RECIPES
    .filter(r => lowerQuery ? true : curatedTypes.includes(r.mealType))
    .map(r => {
      const shown = effectiveCurated(r, recipes);
      return {
        id: r.id,
        name: shown.name,
        emoji: shown.emoji,
        prepTime: shown.prepTime,
        imageUrl: 'imageUrl' in shown ? shown.imageUrl : undefined,
        dish: dishFromRecipe(r),
      };
    })
    .filter(c => !lowerQuery || c.name.toLowerCase().includes(lowerQuery));

  // The family's own recipes; edited built-ins are already listed above.
  const ownRecipes = recipes.filter(r => r.source !== 'curated');
  const familyChoices: Choice[] = (lowerQuery
    ? ownRecipes.filter(r => r.name.toLowerCase().includes(lowerQuery))
    : [...ownRecipes].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0)).slice(0, 8)
  ).map(r => ({ id: r.id, name: r.name, emoji: r.emoji, prepTime: r.prepTime, imageUrl: r.imageUrl, dish: dishFromRecipe(r) }));

  const isCurrent = (c: Choice) =>
    !!current && (current.recipeId === c.dish.recipeId);

  const pick = (dish: MealDish) => onSave([dish]);

  const pickFreeText = () => {
    const t = freeText.trim();
    if (t) pick({ freeText: t });
  };

  const renderChoice = (c: Choice) => (
    <button
      key={c.id}
      onClick={() => pick(c.dish)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-start group',
        isCurrent(c) ? 'bg-primary/10' : 'hover:bg-muted/60'
      )}
    >
      {c.imageUrl
        ? <img src={c.imageUrl} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        : <span className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0">{c.emoji ?? '🍽️'}</span>}
      <span className="flex-1 text-sm font-bold">{c.name}</span>
      {c.prepTime ? (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {c.prepTime}m
        </span>
      ) : null}
      {isCurrent(c)
        ? <Check className="w-4 h-4 text-primary" />
        : <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );

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
          {current && (
            <div className={cn('flex items-center gap-3 rounded-2xl p-2 pe-3', row.chip)}>
              {dishImage(current, recipes)
                ? <img src={dishImage(current, recipes)} alt="" className="w-12 h-12 rounded-xl object-cover" />
                : <span className="w-12 h-12 flex items-center justify-center text-2xl">{dishEmoji(current, recipes) ?? '🍽️'}</span>}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  {isRtl ? 'الوجبة الحالية' : 'Current meal'}
                </p>
                <p className="text-sm font-black truncate">{dishName(current, recipes)}</p>
              </div>
              <button
                onClick={() => onSave([])}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/70 font-bold text-xs hover:bg-white transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isRtl ? 'إزالة' : 'Remove'}
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {current
              ? (isRtl ? 'اختر وجبة أخرى لاستبدالها.' : 'Pick another meal to replace it.')
              : (isRtl ? 'اختر وجبة لهذه الخانة.' : 'Pick a meal for this slot.')}
          </p>

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

          {familyChoices.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {isRtl ? 'وصفات العائلة' : 'Your Recipes'}
              </p>
              <div className="space-y-1">{familyChoices.map(renderChoice)}</div>
            </div>
          )}

          {curatedChoices.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {isRtl ? 'أفكار للوجبات' : lowerQuery ? 'Matching Meals' : 'Meal Ideas'}
              </p>
              <div className="space-y-1">{curatedChoices.map(renderChoice)}</div>
            </div>
          )}

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              {isRtl ? 'أو اكتب اسم وجبة' : 'or type any dish'}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') pickFreeText(); }}
              placeholder={isRtl ? 'أي وجبة...' : 'Any dish name...'}
              className={cn(
                'flex-1 border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40',
                isRtl ? 'text-right' : ''
              )}
            />
            <button
              onClick={pickFreeText}
              disabled={!freeText.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 border-t">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl border font-bold text-sm hover:bg-muted/50 transition-all"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
