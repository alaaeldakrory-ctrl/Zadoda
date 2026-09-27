"use client"

import React, { useEffect, useState } from 'react';
import { Heart, Plus, Pencil, Trash2, Clock, ChefHat, X, Download, Loader2, Link as LinkIcon, PlayCircle, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURATED_RECIPES, CuratedRecipe } from './curatedRecipes';
import { RecipeDetail } from './RecipeDetail';
import { Recipe, MealType, MealCategory, ShoppingItem } from '@/lib/types';
import { getYouTubeId, normalizeUrl, parseIngredientList, ImportedRecipe } from '@/lib/recipeImport';

interface RecipeLibraryProps {
  recipes: Recipe[];
  /** Returns the new recipe's id. */
  onAddRecipe: (r: Omit<Recipe, 'id'>) => string | undefined;
  onUpdateRecipe: (id: string, updates: Partial<Recipe>) => void;
  onDeleteRecipe: (id: string) => void;
  onAddToMealPlan: (recipe: Recipe | CuratedRecipe) => void;
  /** The planner's selected week, whose shopping list ingredients are added to. */
  weekStartDate: string;
  shoppingItems: ShoppingItem[];
  onAddShoppingItem: (item: Omit<ShoppingItem, 'id'>) => void;
  lang: 'en' | 'ar';
}

type Tab = 'explore' | 'mine';
type MealFilter = 'all' | MealCategory;

const MEAL_TYPES: MealCategory[] = ['breakfast', 'lunch', 'dinner'];

const MEAL_FILTER_LABEL: Record<MealFilter, { en: string; ar: string }> = {
  all:       { en: 'All',       ar: 'الكل'  },
  breakfast: { en: 'Breakfast', ar: 'إفطار' },
  lunch:     { en: 'Lunch',     ar: 'غداء'  },
  dinner:    { en: 'Dinner',    ar: 'عشاء'  },
};

const MEAL_BADGE: Partial<Record<MealType, string>> = {
  breakfast: 'bg-emerald-100 text-emerald-700',
  lunch:     'bg-amber-100 text-amber-700',
  dinner:    'bg-green-100 text-green-800',
};

interface RecipeFormState {
  name: string;
  mealType: MealType;
  prepTime: number;
  emoji: string;
  sourceUrl: string;
  ingredients: { name: string; quantity: string; unit: string }[];
  steps: string[];
}

const DEFAULT_FORM: RecipeFormState = {
  name: '',
  mealType: 'dinner',
  prepTime: 30,
  emoji: '🍽️',
  sourceUrl: '',
  ingredients: [{ name: '', quantity: '', unit: '' }],
  steps: [''],
};

type ImportStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; message: string; warn?: boolean }
  | { kind: 'error'; message: string };

function formFromRecipe(r: Recipe | CuratedRecipe): Partial<RecipeFormState> {
  return {
    name: r.name,
    mealType: r.mealType === 'snack' ? 'lunch' : (r.mealType ?? 'dinner'),
    prepTime: r.prepTime ?? 30,
    emoji: r.emoji ?? '🍽️',
    sourceUrl: ('sourceUrl' in r && r.sourceUrl) || '',
    ...(r.ingredients?.length
      ? { ingredients: r.ingredients.map(ing => ({ name: ing.name, quantity: ing.quantity ?? '', unit: ing.unit ?? '' })) }
      : {}),
    ...(r.steps?.length ? { steps: r.steps } : {}),
  };
}

/** What the edit window is doing: a new recipe, editing one of ours, or copying a built-in one. */
type EditorState =
  | { kind: 'new' }
  | { kind: 'edit'; id: string; importUrl?: string }
  | { kind: 'customize'; curatedId: string; importUrl?: string };

function RecipeForm({
  initial,
  autoImport,
  onSave,
  onCancel,
  lang,
}: {
  initial?: Partial<RecipeFormState>;
  /** Start importing from initial.sourceUrl as soon as the form opens. */
  autoImport?: boolean;
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

  const [importStatus, setImportStatus] = useState<ImportStatus>({ kind: 'idle' });

  // Fills the form from a recipe website or YouTube video; only overwrites what the link provides.
  const handleImport = async () => {
    const url = form.sourceUrl.trim();
    if (!url) return;
    setImportStatus({ kind: 'loading' });
    try {
      const res = await fetch('/api/recipe-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data: ImportedRecipe & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error);

      setForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        prepTime: data.prepTime ?? prev.prepTime,
        ingredients: data.ingredients.length ? data.ingredients : prev.ingredients,
        steps: data.steps.length ? data.steps : prev.steps,
      }));

      const nIng = data.ingredients.length;
      const nSteps = data.steps.length;
      if (data.youtubeId && nIng === 0) {
        setImportStatus({
          kind: 'done', warn: true,
          message: isRtl
            ? 'تمت إضافة اسم الفيديو. لم نتمكن من قراءة المكونات من يوتيوب؛ انسخها من وصف الفيديو واستخدم "لصق قائمة" بالأسفل.'
            : 'Added the video\'s title. YouTube didn\'t share the ingredients, so copy them from the video description and use "Paste a list" below.',
        });
      } else {
        setImportStatus({
          kind: 'done',
          message: isRtl
            ? `تم استيراد ${nIng} من المكونات${nSteps ? ` و${nSteps} من الخطوات` : ''}. راجعها قبل الحفظ.`
            : `Imported ${nIng} ingredient${nIng === 1 ? '' : 's'}${nSteps ? ` and ${nSteps} step${nSteps === 1 ? '' : 's'}` : ''}. Check them before saving.`,
        });
      }
    } catch {
      setImportStatus({
        kind: 'error',
        message: isRtl
          ? 'بعض المواقع تمنع الاستيراد التلقائي. سيبقى الرابط محفوظاً، ويمكنك نسخ المكونات من الصفحة واستخدام "لصق قائمة" بالأسفل.'
          : 'Some sites block importing. The link will still be saved; copy the ingredients from the page and use "Paste a list" below.',
      });
    }
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

  useEffect(() => {
    if (autoImport && form.sourceUrl.trim()) handleImport();
    // Only on open: later imports are started with the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Adds a copied ingredient list (one per line), for sites that block importing.
  const addPasted = () => {
    const parsed = parseIngredientList(pasteText);
    if (parsed.length === 0) return;
    setForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients.filter(i => i.name.trim()), ...parsed],
    }));
    setPasteText('');
    setPasteOpen(false);
  };

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
            {isRtl ? 'رابط الوصفة (موقع أو يوتيوب)' : 'Recipe link (website or YouTube)'}
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              dir="ltr"
              value={form.sourceUrl}
              onChange={e => { setField('sourceUrl', e.target.value); setImportStatus({ kind: 'idle' }); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleImport(); } }}
              placeholder="https://…"
              className={cn(inputCls, 'flex-1 text-left')}
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!form.sourceUrl.trim() || importStatus.kind === 'loading'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90 whitespace-nowrap"
            >
              {importStatus.kind === 'loading'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              {isRtl ? 'استيراد' : 'Import'}
            </button>
          </div>
          {importStatus.kind === 'idle' && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {isRtl
                ? 'الصق رابطاً واضغط استيراد لملء الاسم والمكونات والخطوات تلقائياً.'
                : 'Paste a link and tap Import to fill in the name, ingredients and steps.'}
            </p>
          )}
          {(importStatus.kind === 'done' || importStatus.kind === 'error') && (
            <p className={cn(
              'text-xs font-medium mt-1.5',
              importStatus.kind === 'error' || importStatus.warn ? 'text-amber-700' : 'text-emerald-700'
            )}>
              {importStatus.message}
            </p>
          )}
        </div>

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
          <div className="flex items-center gap-3">
            <button onClick={() => setPasteOpen(o => !o)} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              <ClipboardPaste className="w-3 h-3" />
              {isRtl ? 'لصق قائمة' : 'Paste a list'}
            </button>
            <button onClick={addIngredient} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" />
              {isRtl ? 'أضف' : 'Add'}
            </button>
          </div>
        </div>
        {pasteOpen && (
          <div className="mb-3 space-y-2 rounded-xl border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">
              {isRtl
                ? 'انسخ المكونات من صفحة الوصفة أو وصف الفيديو والصقها هنا، مكون في كل سطر.'
                : 'Copy the ingredients from the recipe page or video description and paste them here, one per line.'}
            </p>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={5}
              dir="auto"
              placeholder={'2 cups rice\n1 lb chicken thighs\n3 cloves garlic'}
              className={cn(inputCls, 'resize-y')}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setPasteOpen(false); setPasteText(''); }}
                className="px-3 py-1.5 rounded-xl border font-bold text-xs hover:bg-muted/50 transition-all"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={addPasted}
                disabled={!pasteText.trim()}
                className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-40 hover:bg-primary/90 transition-all"
              >
                {isRtl ? 'أضف المكونات' : 'Add ingredients'}
              </button>
            </div>
          </div>
        )}
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
  sourceUrl,
  onOpen,
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
  sourceUrl?: string;
  onOpen: () => void;
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
      <button
        onClick={onOpen}
        className="flex flex-col items-center pt-5 pb-3 px-4 hover:bg-muted/30 transition-colors"
        title={isRtl ? 'عرض الوصفة' : 'View recipe'}
      >
        <span style={{ fontSize: '3rem', lineHeight: 1 }}>{emoji ?? '🍽️'}</span>
        <h3 className="text-base font-black text-center mt-2 leading-tight">{name}</h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          {mealType && (
            <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5 capitalize', badge)}>
              {MEAL_FILTER_LABEL[mealType as MealFilter]?.[lang] ?? mealType}
            </span>
          )}
          {prepTime ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              <Clock className="w-3 h-3" />
              {prepTime}m
            </span>
          ) : null}
          {sourceUrl && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              {getYouTubeId(sourceUrl)
                ? <PlayCircle className="w-3 h-3 text-red-500" />
                : <LinkIcon className="w-3 h-3" />}
            </span>
          )}
        </div>
      </button>
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
  weekStartDate,
  shoppingItems,
  onAddShoppingItem,
  lang,
}: RecipeLibraryProps) {
  const isRtl = lang === 'ar';
  const [tab, setTab] = useState<Tab>('explore');
  // Looked up by id each render so the detail view reflects edits straight away.
  const [openId, setOpenId] = useState<string | null>(null);
  const openRecipe: Recipe | CuratedRecipe | undefined = openId
    ? recipes.find(r => r.id === openId) ?? CURATED_RECIPES.find(r => r.id === openId)
    : undefined;
  const openIsFamily = !!openRecipe && !openRecipe.id.startsWith('curated_');
  const [filter, setFilter] = useState<MealFilter>('all');
  const [search, setSearch] = useState('');
  // Shown instead of the detail view while open; closing it returns to whatever was open before.
  const [editor, setEditor] = useState<EditorState | null>(null);

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
    const baseMealType: MealType = curated.mealType === 'snack' ? 'lunch' : curated.mealType;
    onAddRecipe({
      name: curated.name,
      mealType: baseMealType,
      prepTime: curated.prepTime,
      emoji: curated.emoji,
      ingredients: curated.ingredients,
      steps: curated.steps,
      source: 'curated',
      sourceId: curated.id,
      addedAt: Date.now(),
    });
  };

  // Drops the empty rows the form starts with.
  const cleanForm = (data: RecipeFormState) => ({
    name: data.name.trim(),
    mealType: data.mealType,
    prepTime: data.prepTime,
    emoji: data.emoji,
    ingredients: data.ingredients
      .filter(i => i.name.trim())
      .map(i => ({ name: i.name.trim(), quantity: i.quantity.trim(), unit: i.unit.trim() })),
    steps: data.steps.map(s => s.trim()).filter(Boolean),
  });

  const handleSave = (data: RecipeFormState) => {
    if (!editor) return;
    // Only real web links are kept, so the recipe view never links to anything else.
    const url = normalizeUrl(data.sourceUrl) ?? '';
    if (editor.kind === 'edit') {
      onUpdateRecipe(editor.id, { ...cleanForm(data), sourceUrl: url });
    } else {
      const newId = onAddRecipe({
        ...cleanForm(data),
        // Firestore rejects undefined fields, so only include the link when there is one.
        ...(url ? { sourceUrl: url } : {}),
        ...(editor.kind === 'customize'
          ? { source: 'curated' as const, sourceId: editor.curatedId }
          : { source: 'custom' as const }),
        addedAt: Date.now(),
      });
      // Show the saved recipe where it now lives.
      setTab('mine');
      if (newId && openId) setOpenId(newId);
    }
    setEditor(null);
  };

  // Built-in recipes are edited as a family copy; reuse the copy if there already is one.
  const handleCustomize = (curated: CuratedRecipe) => {
    const copy = recipes.find(r => r.source === 'curated' && r.sourceId === curated.id);
    if (copy) {
      setOpenId(copy.id);
      setEditor({ kind: 'edit', id: copy.id });
    } else {
      setEditor({ kind: 'customize', curatedId: curated.id });
    }
  };

  const editorInitial: Partial<RecipeFormState> | undefined = (() => {
    if (!editor || editor.kind === 'new') return undefined;
    const source = editor.kind === 'edit'
      ? recipes.find(r => r.id === editor.id)
      : CURATED_RECIPES.find(r => r.id === editor.curatedId);
    if (!source) return undefined;
    const values = formFromRecipe(source);
    return editor.importUrl ? { ...values, sourceUrl: editor.importUrl } : values;
  })();

  // "Save" on a link: store it and nothing else. Built-in recipes get a family copy holding the link.
  const handleSaveLink = (recipe: Recipe | CuratedRecipe, url: string) => {
    if (!recipe.id.startsWith('curated_')) {
      onUpdateRecipe(recipe.id, { sourceUrl: url });
      return;
    }
    const copy = recipes.find(r => r.source === 'curated' && r.sourceId === recipe.id);
    if (copy) {
      onUpdateRecipe(copy.id, { sourceUrl: url });
      setOpenId(copy.id);
      return;
    }
    const curated = recipe as CuratedRecipe;
    const newId = onAddRecipe({
      name: curated.name,
      mealType: curated.mealType === 'snack' ? 'lunch' : curated.mealType,
      prepTime: curated.prepTime,
      emoji: curated.emoji,
      ingredients: curated.ingredients,
      steps: curated.steps,
      sourceUrl: url,
      source: 'curated',
      sourceId: curated.id,
      addedAt: Date.now(),
    });
    if (newId) setOpenId(newId);
  };

  // "Import" on a link: open the edit form with the link in place and pull the recipe from it.
  const handleImportLink = (recipe: Recipe | CuratedRecipe, url: string) => {
    if (!recipe.id.startsWith('curated_')) {
      setEditor({ kind: 'edit', id: recipe.id, importUrl: url });
      return;
    }
    const copy = recipes.find(r => r.source === 'curated' && r.sourceId === recipe.id);
    if (copy) {
      setOpenId(copy.id);
      setEditor({ kind: 'edit', id: copy.id, importUrl: url });
    } else {
      setEditor({ kind: 'customize', curatedId: recipe.id, importUrl: url });
    }
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

      {tab === 'explore' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredCurated.map(r => (
            <RecipeCard
              key={r.id}
              name={r.name}
              emoji={r.emoji}
              prepTime={r.prepTime}
              mealType={r.mealType === 'snack' ? 'lunch' : r.mealType}
              onOpen={() => setOpenId(r.id)}
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
          <button
            onClick={() => setEditor({ kind: 'new' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isRtl ? 'إنشاء وصفة' : 'Create Recipe'}
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredFamily.map(r => {
              return (
                <RecipeCard
                  key={r.id}
                  name={r.name}
                  emoji={r.emoji}
                  prepTime={r.prepTime}
                  mealType={r.mealType}
                  sourceUrl={r.sourceUrl}
                  onOpen={() => setOpenId(r.id)}
                  onAddToMealPlan={() => onAddToMealPlan(r)}
                  onEdit={() => setEditor({ kind: 'edit', id: r.id })}
                  onDelete={() => {
                    const msg = isRtl ? `حذف "${r.name}"؟` : `Delete "${r.name}"?`;
                    if (window.confirm(msg)) onDeleteRecipe(r.id);
                  }}
                  isCustom
                  lang={lang}
                />
              );
            })}
          </div>

          {filteredFamily.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">{isRtl ? 'لا توجد وصفات بعد' : 'No recipes yet'}</p>
              <p className="text-sm mt-1">{isRtl ? 'أضف وصفاتك المفضلة أو أنشئ جديدة' : 'Add favourites from Explore or create your own'}</p>
            </div>
          )}
        </div>
      )}

      {editor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          dir={isRtl ? 'rtl' : 'ltr'}
          onClick={e => { if (e.target === e.currentTarget) setEditor(null); }}
        >
          <div className="w-full max-w-2xl bg-card rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">
                  {editor.kind === 'new'
                    ? (isRtl ? 'وصفة جديدة' : 'New recipe')
                    : (isRtl ? 'تعديل الوصفة' : 'Edit recipe')}
                </h2>
                {editor.kind === 'customize' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl
                      ? 'سيتم حفظ نسختك في «وصفاتي»، وتبقى الوصفة الأصلية كما هي.'
                      : 'Your version is saved to My Recipes; the original stays as it is.'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditor(null)}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-muted transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <RecipeForm
                key={JSON.stringify(editor)}
                initial={editorInitial}
                autoImport={editor.kind !== 'new' && !!editor.importUrl}
                onSave={handleSave}
                onCancel={() => setEditor(null)}
                lang={lang}
              />
            </div>
          </div>
        </div>
      )}

      {openRecipe && !editor && (
        <RecipeDetail
          recipe={openRecipe}
          shoppingItems={shoppingItems}
          weekStartDate={weekStartDate}
          onAddShoppingItem={onAddShoppingItem}
          onAddToMealPlan={() => { setOpenId(null); onAddToMealPlan(openRecipe); }}
          onEdit={openIsFamily ? () => setEditor({ kind: 'edit', id: openRecipe.id }) : undefined}
          onCustomize={!openIsFamily ? () => handleCustomize(openRecipe as CuratedRecipe) : undefined}
          onSaveLink={url => handleSaveLink(openRecipe, url)}
          onImportLink={url => handleImportLink(openRecipe, url)}
          onClose={() => setOpenId(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
