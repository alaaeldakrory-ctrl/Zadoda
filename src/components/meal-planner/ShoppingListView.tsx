"use client"

import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShoppingItem, ShoppingCategory, MealSlot, Recipe } from '@/lib/types';
import { CURATED_RECIPES } from './curatedRecipes';

interface ShoppingListViewProps {
  shoppingItems: ShoppingItem[];
  mealSlots: MealSlot[];
  recipes: Recipe[];
  weekStartDate: string;
  onAddItem: (item: Omit<ShoppingItem, 'id'>) => void;
  onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  lang: 'en' | 'ar';
}

const CATEGORIES: ShoppingCategory[] = ['produce', 'protein', 'dairy', 'pantry', 'other'];

const CATEGORY_META: Record<ShoppingCategory, { en: string; ar: string; emoji: string; color: string }> = {
  produce: { en: 'Produce',  ar: 'خضار وفواكه', emoji: '🥦', color: 'text-green-700 bg-green-50 border-green-200' },
  protein: { en: 'Protein',  ar: 'بروتين',       emoji: '🥩', color: 'text-red-700 bg-red-50 border-red-200' },
  dairy:   { en: 'Dairy',    ar: 'ألبان',         emoji: '🧀', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  pantry:  { en: 'Pantry',   ar: 'مؤونة',         emoji: '🏪', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  other:   { en: 'Other',    ar: 'أخرى',          emoji: '📦', color: 'text-gray-700 bg-gray-50 border-gray-200' },
};

function inferCategory(name: string): ShoppingCategory {
  const n = name.toLowerCase();
  if (/chicken|beef|fish|salmon|tuna|shrimp|egg|meat|turkey|pork|lamb/.test(n)) return 'protein';
  if (/milk|cheese|butter|yogurt|cream|dairy/.test(n)) return 'dairy';
  if (/flour|rice|pasta|bread|oats|sugar|oil|sauce|paste|vinegar|spice|salt|pepper|soy|honey|cracker|cereal|noodle|baking|vanilla/.test(n)) return 'pantry';
  if (/tomato|onion|garlic|carrot|lettuce|spinach|broccoli|celery|cucumber|pepper|zucchini|potato|apple|banana|lemon|lime|avocado|orange|berry|mango|grape/.test(n)) return 'produce';
  return 'other';
}

function aggregateIngredients(
  slots: MealSlot[],
  weekStartDate: string,
  recipes: Recipe[]
): Omit<ShoppingItem, 'id'>[] {
  const weekSlots = slots.filter(s => {
    if (!s.weekStartDate) return true;
    return s.weekStartDate === weekStartDate;
  });

  const map = new Map<string, Omit<ShoppingItem, 'id'>>();

  const addToMap = (name: string, quantity: string, unit: string) => {
    const key = `${name.toLowerCase()}__${unit.toLowerCase()}`;
    if (map.has(key)) {
      const existing = map.get(key)!;
      const existingQty = parseFloat(existing.quantity || '0') || 0;
      const newQty = parseFloat(quantity || '0') || 0;
      if (existingQty > 0 && newQty > 0) {
        map.set(key, { ...existing, quantity: String(existingQty + newQty) });
      }
    } else {
      const category = inferCategory(name);
      map.set(key, {
        name,
        quantity,
        unit,
        category,
        checked: false,
        weekStartDate,
        source: 'auto' as const,
        addedAt: Date.now(),
      });
    }
  };

  for (const slot of weekSlots) {
    for (const dish of slot.dishes ?? []) {
      if (dish.recipeId) {
        if (dish.recipeId.startsWith('curated_')) {
          const curated = CURATED_RECIPES.find(r => r.id === dish.recipeId);
          if (curated) {
            curated.ingredients.forEach(ing => addToMap(ing.name, ing.quantity, ing.unit));
          }
        } else {
          const family = recipes.find(r => r.id === dish.recipeId);
          if (family && family.ingredients) {
            family.ingredients.forEach(ing => addToMap(ing.name, ing.quantity, ing.unit));
          }
        }
      } else if (dish.freeText) {
        addToMap(dish.freeText, '1', 'item');
      }
    }
  }

  return Array.from(map.values());
}

export function ShoppingListView({
  shoppingItems,
  mealSlots,
  recipes,
  weekStartDate,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onClearChecked,
  lang,
}: ShoppingListViewProps) {
  const isRtl = lang === 'ar';
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newCategory, setNewCategory] = useState<ShoppingCategory>('other');

  const weekItems = shoppingItems.filter(item =>
    !item.weekStartDate || item.weekStartDate === weekStartDate
  );

  const checkedCount = weekItems.filter(i => i.checked).length;
  const totalCount = weekItems.length;

  const handleAutoGenerate = () => {
    const suggestions = aggregateIngredients(mealSlots, weekStartDate, recipes);
    suggestions.forEach(item => {
      const alreadyExists = weekItems.some(
        existing => existing.name.toLowerCase() === item.name.toLowerCase()
      );
      if (!alreadyExists) {
        onAddItem(item);
      }
    });
  };

  const handleAddManual = () => {
    if (!newName.trim()) return;
    onAddItem({
      name: newName.trim(),
      quantity: newQty.trim(),
      unit: newUnit.trim(),
      category: newCategory,
      checked: false,
      weekStartDate,
      source: 'manual',
      addedAt: Date.now(),
    });
    setNewName('');
    setNewQty('');
    setNewUnit('');
    setNewCategory('other');
  };

  const groupedItems: Record<ShoppingCategory, ShoppingItem[]> = {
    produce: [],
    protein: [],
    dairy: [],
    pantry: [],
    other: [],
  };

  weekItems.forEach(item => {
    const cat = item.category ?? 'other';
    if (groupedItems[cat]) {
      groupedItems[cat].push(item);
    } else {
      groupedItems.other.push(item);
    }
  });

  const inputCls = cn(
    'border rounded-xl px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40',
    isRtl ? 'text-right' : ''
  );

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black">{isRtl ? 'قائمة التسوق' : 'Shopping List'}</h2>
          {totalCount > 0 && (
            <span className="text-xs font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">
              {checkedCount}/{totalCount}
            </span>
          )}
        </div>
        {checkedCount > 0 && (
          <button
            onClick={onClearChecked}
            className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isRtl ? 'حذف المكتملة' : 'Clear completed'}
          </button>
        )}
      </div>

      <button
        onClick={handleAutoGenerate}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
      >
        <Zap className="w-4 h-4" />
        {isRtl ? 'توليد تلقائي من خطة الأسبوع' : 'Auto-generate from this week\'s plan'}
      </button>

      {CATEGORIES.map(category => {
        const items = groupedItems[category];
        if (items.length === 0) return null;
        const meta = CATEGORY_META[category];
        return (
          <div key={category}>
            <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-2 w-fit', meta.color)}>
              <span>{meta.emoji}</span>
              <span className="text-xs font-black uppercase tracking-wider">
                {meta[lang]}
              </span>
              <span className="text-xs font-bold opacity-60">({items.length})</span>
            </div>
            <div className="space-y-1.5 ps-1">
              {items.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all group',
                    item.checked ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card border-border hover:border-primary/20'
                  )}
                >
                  <button
                    onClick={() => onUpdateItem(item.id, { checked: !item.checked })}
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      item.checked ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/40 hover:border-primary'
                    )}
                  >
                    {item.checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <span className={cn(
                    'flex-1 text-sm font-medium',
                    item.checked && 'line-through text-muted-foreground'
                  )}>
                    {item.name}
                  </span>
                  {(item.quantity || item.unit) && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.quantity} {item.unit}
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {totalCount === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-bold">{isRtl ? 'القائمة فارغة' : 'List is empty'}</p>
          <p className="text-sm mt-1">
            {isRtl
              ? 'استخدم الزر أعلاه لتوليد القائمة تلقائياً أو أضف عناصر يدوياً'
              : 'Auto-generate from your meal plan or add items manually below'}
          </p>
        </div>
      )}

      <div className="rounded-[1.5rem] border bg-card p-4 space-y-3">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          {isRtl ? 'إضافة عنصر يدوياً' : 'Add item manually'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddManual(); }}
            placeholder={isRtl ? 'اسم العنصر...' : 'Item name...'}
            className={cn(inputCls, 'flex-[3]')}
          />
          <input
            type="text"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            placeholder={isRtl ? 'كمية' : 'Qty'}
            className={cn(inputCls, 'flex-1')}
          />
          <input
            type="text"
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
            placeholder={isRtl ? 'وحدة' : 'Unit'}
            className={cn(inputCls, 'flex-1')}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value as ShoppingCategory)}
            className={cn(inputCls, 'flex-1')}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {CATEGORY_META[c].emoji} {CATEGORY_META[c][lang]}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddManual}
            disabled={!newName.trim()}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/90 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {isRtl ? 'أضف' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
