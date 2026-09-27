"use client"

import React, { useState } from 'react';
import { X, Clock, ExternalLink, ShoppingCart, CalendarPlus, Pencil, Check, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Recipe, ShoppingItem } from '@/lib/types';
import { getYouTubeId } from '@/lib/recipeImport';
import { CuratedRecipe } from './curatedRecipes';
import { inferCategory, shoppingKey } from './shoppingList';

interface RecipeDetailProps {
  recipe: Recipe | CuratedRecipe;
  /** This week's shopping list, to show what's already on it. */
  shoppingItems: ShoppingItem[];
  weekStartDate: string;
  onAddShoppingItem: (item: Omit<ShoppingItem, 'id'>) => void;
  onAddToMealPlan: () => void;
  /** Only for the family's own recipes. */
  onEdit?: () => void;
  /** Only for built-in recipes: edit a family copy. */
  onCustomize?: () => void;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export function RecipeDetail({
  recipe,
  shoppingItems,
  weekStartDate,
  onAddShoppingItem,
  onAddToMealPlan,
  onEdit,
  onCustomize,
  onClose,
  lang,
}: RecipeDetailProps) {
  const isRtl = lang === 'ar';
  const editAction = onEdit ?? onCustomize;
  const ingredients = (recipe.ingredients ?? []).filter(i => i.name?.trim());
  const steps = (recipe.steps ?? []).filter(s => s.trim());
  const sourceUrl = 'sourceUrl' in recipe ? recipe.sourceUrl : undefined;
  const youtubeId = sourceUrl ? getYouTubeId(sourceUrl) : null;

  const onList = new Set(
    shoppingItems.filter(i => !i.checked).map(i => shoppingKey(i.name, i.unit))
  );
  const isOnList = (i: { name: string; unit: string }) => onList.has(shoppingKey(i.name, i.unit));

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const selectable = ingredients.map((ing, i) => i).filter(i => !isOnList(ingredients[i]));
  const allSelected = selectable.length > 0 && selectable.every(i => selected.has(i));

  const toggle = (i: number) => {
    setAddedCount(null);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setAddedCount(null);
    setSelected(allSelected ? new Set() : new Set(selectable));
  };

  const addSelected = () => {
    const picked = ingredients.filter((_, i) => selected.has(i));
    picked.forEach(ing => onAddShoppingItem({
      name: ing.name.trim(),
      quantity: ing.quantity ?? '',
      unit: ing.unit ?? '',
      category: inferCategory(ing.name),
      checked: false,
      weekStartDate,
      source: 'manual',
      addedAt: Date.now(),
    }));
    setAddedCount(picked.length);
    setSelected(new Set());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-card rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b flex items-start gap-4">
          <span className="text-5xl leading-none">{recipe.emoji ?? '🍽️'}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black leading-tight">{recipe.name}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium flex-wrap">
              {recipe.prepTime ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {recipe.prepTime} {isRtl ? 'دقيقة' : 'min'}
                </span>
              ) : null}
              {sourceUrl && !youtubeId && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isRtl ? 'فتح الوصفة الأصلية' : 'Open original recipe'}
                </a>
              )}
              {!sourceUrl && editAction && (
                <button onClick={editAction} className="flex items-center gap-1 text-primary font-bold hover:underline">
                  <LinkIcon className="w-3.5 h-3.5" />
                  {isRtl ? 'أضف رابطاً' : 'Add a link'}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-muted transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {youtubeId && (
            <div className="space-y-2">
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                  title={recipe.name}
                  className="w-full h-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {isRtl ? 'فتح في يوتيوب' : 'Open on YouTube'}
              </a>
            </div>
          )}

          {/* Ingredients */}
          <section>
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {isRtl ? 'المكونات' : 'Ingredients'}
                {ingredients.length > 0 && <span className="opacity-60"> ({ingredients.length})</span>}
              </h3>
              {selectable.length > 0 && (
                <button onClick={toggleAll} className="text-xs font-bold text-primary hover:underline">
                  {allSelected
                    ? (isRtl ? 'إلغاء التحديد' : 'Select none')
                    : (isRtl ? 'تحديد الكل' : 'Select all')}
                </button>
              )}
            </div>

            {ingredients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {isRtl ? 'لا توجد مكونات بعد.' : 'No ingredients yet.'}
                {editAction && (isRtl ? ' أضفها بالتعديل.' : ' Add them with Edit.')}
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  {isRtl ? 'اختر ما تحتاج شراءه:' : 'Tick what you need to buy:'}
                </p>
                <ul className="space-y-1">
                  {ingredients.map((ing, i) => {
                    const already = isOnList(ing);
                    const checked = selected.has(i);
                    return (
                      <li key={i}>
                        <button
                          onClick={() => !already && toggle(i)}
                          disabled={already}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-start transition-all',
                            already ? 'opacity-60 cursor-default' : 'hover:bg-muted/60',
                            checked && 'bg-primary/10'
                          )}
                        >
                          <span className={cn(
                            'flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                            already ? 'border-emerald-500 bg-emerald-500' :
                            checked ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                          )}>
                            {(checked || already) && <Check className="w-3.5 h-3.5 text-white" />}
                          </span>
                          <span className="flex-1 text-sm font-medium">{ing.name}</span>
                          {(ing.quantity || ing.unit) && (
                            <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">
                              {ing.quantity} {ing.unit}
                            </span>
                          )}
                          {already && (
                            <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                              {isRtl ? 'في القائمة' : 'On list'}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={addSelected}
                    disabled={selected.size === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {isRtl
                      ? `أضف ${selected.size || ''} إلى قائمة التسوق`
                      : `Add ${selected.size || ''} to shopping list`}
                  </button>
                  {addedCount !== null && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {isRtl ? `تمت إضافة ${addedCount}` : `Added ${addedCount}`}
                    </span>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Steps */}
          {steps.length > 0 && (
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                {isRtl ? 'طريقة التحضير' : 'Steps'}
              </h3>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 border-t">
          {editAction && (
            <button
              onClick={editAction}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border font-bold text-sm hover:bg-muted/50 transition-all"
            >
              <Pencil className="w-4 h-4" />
              {onEdit ? (isRtl ? 'تعديل' : 'Edit') : (isRtl ? 'تخصيص' : 'Customize')}
            </button>
          )}
          <button
            onClick={onAddToMealPlan}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            {isRtl ? 'أضف للخطة' : 'Add to Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
