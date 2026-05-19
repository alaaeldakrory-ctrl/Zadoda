"use client"

import React, { useState } from 'react';
import { Heart, Plus, Pencil, Trash2, Clock, ChefHat, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURATED_RECIPES, CuratedRecipe } from './curatedRecipes';
import { Recipe, MealType } from '@/lib/types';

interface RecipeLibraryProps {
  recipes: Recipe[];
  onAddRecipe: (r: Omit<Recipe, 'id'>) => void;
  onUpdateRecipe: (id: string, updates: Partial<Recipe>) => void;
  onDeleteRecipe: (id: string) => void;
  onAddToMealPlan: (recipe: Recipe | CuratedRecipe) => void;
  lang: 'en' | 'ar';
}

type Tab = 'explore' | 'mine';
type MealFilter = 'all' | MealType;

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_FILTER_LABEL: Record<MealFilter, { en: string; ar: string }> = {
  all:       { en: 'All',       ar: 'الكل'   },
  breakfast: { en: 'Breakfast', ar: 'إفطار'  },
  lunch:     { en: 'Lunch',     ar: 'غداء'   },
  dinner:    { en: 'Dinner',    ar: 'عشاء'   },
  snack:     { en: 'Snack',     ar: 'خفيفة'  },
};

const MEAL_BADGE: Record<MealType, string> = {
  breakfast: 'bg-emerald-100 text-emerald-700',
  lunch:     'bg-amber-100 text-amber-700',
  dinner:    'bg-green-100 text-green-800',
  snack:     'bg-yellow-100 text-yellow-700',
};

interface RecipeFormState {
  name: string;
  mealType: MealType;
  prepTime: number;
  emoji: string;
  ingredients: { name: string; quantity: string; unit: string }[];
  steps: string[];
}

const DEFAULT_FORM: RecipeFormState = {
  name: '',
  mealType: 'dinner',
  prepTime: 30,
  emoji: '🍽️',
  ingredients: [{ name: '', quantity: '', unit: '' }],
  steps: [''],
};

function RecipeForm({
  initial,
  onSave,
  onCancel,
  lang,
}: {
  initial?: Partial<RecipeFormState>;
  onSave: (data: RecipeFormState) => void;
  onCancel: () => void;
  lang: 'en' | 'ar';
}) {
  const isRtl = lang === 'ar';
  const [form, setForm] = useState<RecipeFormState>({
    ...DEFAULT_FORM,
    ...initial,
    ingredients: initial?.ingredients ?? DEFAULT_FORM.ingredients,
    steps: initial?.steps ?? DEFAULT_FORM.steps,
  });

  const setField = <K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateIngredient = (i: number, field: 'name' | 'quantity' | 'unit', val: string) => {
    setForm(prev => {
      const ing = [...prev.ingredients];
      ing[i] = { ...ing[i], [field]: val };
      return { ...prev, ingredients: ing };
    });
  };

  const addIngredient = () =>
    setForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }] }));

  const removeIngredient = (i: number) =>
    setForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, idx) => idx !== i) }));

  const updateStep = (i: number, val: string) =>
    setForm(prev => {
      const steps = [...prev.steps];
      steps[i] = val;
      return { ...prev, steps };
    });

  const addStep = () =>
    setForm(prev => ({ ...prev, steps: [...prev.steps, ''] }));

  const removeStep = (i: number) =>
    setForm(prev => ({ ...prev, steps: prev.steps.filter((_, idx) => idx !== i) }));

  const inputCls = cn(
    'w-full border rounded-xl px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40',
    isRtl ? 'text-right' : ''
  );

  return (
    <div className="space-y-5 p-5 bg-muted/20 rounded-[1.5rem] border">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
            {isRtl ? 'اسم الوصفة *' : 'Recipe Name *'}
          </label>
          <input
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            placeholder={isRtl ? 'مثل: دجاج مشوي' : 'e.g. Grilled Chicken'}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
            {isRtl ? 'نوع الوجبة' : 'Meal Type'}
          </label>
          <select
            value={form.mealType}
            onChange={e => setField('mealType', e.target.value as MealType)}
            className={inputCls}
          >
            {MEAL_TYPES.map(mt => (
              <option key={mt} value={mt}>
                {MEAL_FILTER_LABEL[mt][lang]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
            {isRtl ? 'وقت التحضير (دقيقة)' : 'Prep Time (min)'}
          </label>
          <input
            type="number"
            min={1}
            value={form.prepTime}
            onChange={e => setField('prepTime', Number(e.target.value))}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
            {isRtl ? 'رمز تعبيري' : 'Emoji'}
          </label>
          <input
            value={form.emoji}
            onChange={e => setField('emoji', e.target.value)}
            maxLength={4}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {isRtl ? 'المكونات' : 'Ingredients'}
          </label>
          <button onClick={addIngredient} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
            <Plus className="w-3 h-3" />
            {isRtl ? 'أضف' : 'Add'}
          </button>
        </div>
        <div className="space-y-2">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={ing.name}
                onChange={e => updateIngredient(i, 'name', e.target.value)}
                placeholder={isRtl ? 'مكون' : 'Ingredient'}
                className={cn(inputCls, 'flex-[2]')}
              />
              <input
                value={ing.quantity}
                onChange={e => updateIngredient(i, 'quantity', e.target.value)}
                placeholder={isRtl ? 'كمية' : 'Qty'}
                className={cn(inputCls, 'flex-1')}
              />
              <input
                value={ing.unit}
                onChange={e => updateIngredient(i, 'unit', e.target.value)}
                placeholder={isRtl ? 'وحدة' : 'Unit'}
                className={cn(inputCls, 'flex-1')}
              />
              {form.ingredients.length > 1 && (
                <button onClick={() => removeIngredient(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {isRtl ? 'الخطوات' : 'Steps'}
          </label>
          <button onClick={addStep} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
            <Plus className="w-3 h-3" />
            {isRtl ? 'أضف' : 'Add'}
          </button>
        </div>
        <div className="space-y-2">
          {form.steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 text-xs font-black text-muted-foreground w-5 text-center flex-shrink-0">{i + 1}</span>
              <input
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                placeholder={isRtl ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                className={cn(inputCls, 'flex-1')}
              />
              {form.steps.length > 1 && (
                <button onClick={() => removeStep(i)} className="mt-2 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-2xl border font-bold text-sm hover:bg-muted/50 transition-all"
        >
          {isRtl ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          onClick={() => { if (!form.name.trim()) return; onSave(form); }}
          disabled={!form.name.trim()}
          className="flex-1 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90"
        >
          {isRtl ? 'حفظ' : 'Save Recipe'}
        </button>
      </div>
    </div>
  );
}

function RecipeCard({
  name,
  emoji,
  prepTime,
  mealType,
  onAddToMealPlan,
  onFavourite,
  onEdit,
  onDelete,
  isFavourited,
  isCustom,
  lang,
}: {
  name: string;
  emoji?: string;
  prepTime?: number;
  mealType?: MealType;
  onAddToMealPlan: () => void;
  onFavourite?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isFavourited?: boolean;
  isCustom?: boolean;
  lang: 'en' | 'ar';
}) {
  const isRtl = lang === 'ar';
  const badge = mealType ? MEAL_BADGE[mealType] : 'bg-gray-100 text-gray-700';

  return (
    <div className="rounded-[2rem] border bg-card hover:shadow-md transition-all flex flex-col overflow-hidden">
      <div className="flex flex-col items-center pt-5 pb-3 px-4">
        <span style={{ fontSize: '3rem', lineHeight: 1 }}>{emoji ?? '🍽️'}</span>
        <h3 className="text-base font-black text-center mt-2 leading-tight">{name}</h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          {mealType && (
            <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5 capitalize', badge)}>
              {MEAL_FILTER_LABEL[mealType]?.[lang] ?? mealType}
            </span>
          )}
          {prepTime ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              <Clock className="w-3 h-3" />
              {prepTime}m
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex gap-1.5 px-3 pb-4 mt-auto">
        {onFavourite && (
          <button
            onClick={onFavourite}
            className={cn(
              'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all',
              isFavourited ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-muted-foreground hover:text-rose-500 hover:border-rose-200'
            )}
          >
            <Heart className={cn('w-4 h-4', isFavourited && 'fill-current')} />
          </button>
        )}
        {isCustom && onEdit && (
          <button
            onClick={onEdit}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {isCustom && onDelete && (
          <button
            onClick={onDelete}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onAddToMealPlan}
          className="flex-1 py-1.5 rounded-2xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all"
        >
          {isRtl ? '+ أضف للخطة' : '+ Add to Plan'}
        </button>
      </div>
    </div>
  );
}

export function RecipeLibrary({
  recipes,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onAddToMealPlan,
  lang,
}: RecipeLibraryProps) {
  const isRtl = lang === 'ar';
  const [tab, setTab] = useState<Tab>('explore');
  const [filter, setFilter] = useState<MealFilter>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const favouritedSourceIds = new Set(
    recipes.filter(r => r.source === 'curated').map(r => r.sourceId ?? '')
  );

  const filteredCurated = CURATED_RECIPES.filter(r => {
    if (filter !== 'all' && r.mealType !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredFamily = recipes.filter(r => {
    if (filter !== 'all' && r.mealType !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFavourite = (curated: CuratedRecipe) => {
    if (favouritedSourceIds.has(curated.id)) return;
    onAddRecipe({
      name: curated.name,
      mealType: curated.mealType,
      prepTime: curated.prepTime,
      emoji: curated.emoji,
      ingredients: curated.ingredients,
      steps: curated.steps,
      source: 'curated',
      sourceId: curated.id,
      addedAt: Date.now(),
    });
  };

  const handleSaveNew = (data: RecipeFormState) => {
    onAddRecipe({
      name: data.name,
      mealType: data.mealType,
      prepTime: data.prepTime,
      emoji: data.emoji,
      ingredients: data.ingredients,
      steps: data.steps,
      source: 'custom',
      addedAt: Date.now(),
    });
    setShowForm(false);
  };

  const handleSaveEdit = (id: string, data: RecipeFormState) => {
    onUpdateRecipe(id, {
      name: data.name,
      mealType: data.mealType,
      prepTime: data.prepTime,
      emoji: data.emoji,
      ingredients: data.ingredients,
      steps: data.steps,
    });
    setEditingId(null);
  };

  const filterPills: MealFilter[] = ['all', ...MEAL_TYPES];

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex gap-2 p-1 bg-muted/40 rounded-2xl">
        {(['explore', 'mine'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === t ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'explore'
              ? (isRtl ? '🌍 استكشف' : '🌍 Explore')
              : (isRtl ? '❤️ وصفاتي' : '❤️ My Recipes')}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={isRtl ? 'ابحث...' : 'Search...'}
        className={cn(
          'w-full border rounded-xl px-4 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40',
          isRtl ? 'text-right' : ''
        )}
      />

      {tab === 'explore' && (
        <div className="flex gap-2 flex-wrap">
          {filterPills.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border transition-all',
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
              )}
            >
              {MEAL_FILTER_LABEL[f][lang]}
            </button>
          ))}
        </div>
      )}

      {tab === 'explore' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredCurated.map(r => (
            <RecipeCard
              key={r.id}
              name={r.name}
              emoji={r.emoji}
              prepTime={r.prepTime}
              mealType={r.mealType}
              onAddToMealPlan={() => onAddToMealPlan(r)}
              onFavourite={() => handleFavourite(r)}
              isFavourited={favouritedSourceIds.has(r.id)}
              lang={lang}
            />
          ))}
          {filteredCurated.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">{isRtl ? 'لا توجد نتائج' : 'No results found'}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-4">
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              {isRtl ? 'إنشاء وصفة' : 'Create Recipe'}
            </button>
          )}

          {showForm && (
            <RecipeForm
              onSave={handleSaveNew}
              onCancel={() => setShowForm(false)}
              lang={lang}
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredFamily.map(r => {
              if (editingId === r.id) {
                return (
                  <div key={r.id} className="col-span-2 sm:col-span-3">
                    <RecipeForm
                      initial={{
                        name: r.name,
                        mealType: r.mealType ?? 'dinner',
                        prepTime: r.prepTime ?? 30,
                        emoji: r.emoji ?? '🍽️',
                        ingredients: (r.ingredients ?? []).map(ing => ({ name: ing.name, quantity: ing.quantity, unit: ing.unit })),
                        steps: r.steps ?? [''],
                      }}
                      onSave={data => handleSaveEdit(r.id, data)}
                      onCancel={() => setEditingId(null)}
                      lang={lang}
                    />
                  </div>
                );
              }
              return (
                <RecipeCard
                  key={r.id}
                  name={r.name}
                  emoji={r.emoji}
                  prepTime={r.prepTime}
                  mealType={r.mealType}
                  onAddToMealPlan={() => onAddToMealPlan(r)}
                  onEdit={() => { setEditingId(r.id); setShowForm(false); }}
                  onDelete={() => onDeleteRecipe(r.id)}
                  isCustom
                  lang={lang}
                />
              );
            })}
          </div>

          {filteredFamily.length === 0 && !showForm && (
            <div className="text-center py-12 text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">{isRtl ? 'لا توجد وصفات بعد' : 'No recipes yet'}</p>
              <p className="text-sm mt-1">{isRtl ? 'أضف وصفاتك المفضلة أو أنشئ جديدة' : 'Add favourites from Explore or create your own'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
