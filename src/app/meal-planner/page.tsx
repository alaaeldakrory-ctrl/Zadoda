"use client"

import React, { useState } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, ChefHat } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { MealSlot, MealType, MealDish, Recipe } from '@/lib/types';
import { CuratedRecipe } from '@/components/meal-planner/curatedRecipes';
import { WeeklyGrid } from '@/components/meal-planner/WeeklyGrid';
import { MealSlotModal } from '@/components/meal-planner/MealSlotModal';
import { RecipeLibrary } from '@/components/meal-planner/RecipeLibrary';
import { ShoppingListView } from '@/components/meal-planner/ShoppingListView';
import { AIMealCoach } from '@/components/meal-planner/AIMealCoach';
import { cn } from '@/lib/utils';

type Tab = 'weekly' | 'recipes' | 'shopping';

export default function MealPlannerPage() {
  const {
    settings,
    mealSlots,
    recipes,
    shoppingItems,
    setMealSlot,
    deleteMealSlot,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    clearCheckedShoppingItems,
  } = useStore();

  const t = getTranslation(settings.language);
  const mp = t.mealPlannerFull;
  const lang = settings.language;
  const isRtl = lang === 'ar';

  const [tab, setTab] = useState<Tab>('weekly');
  const [weekOffset, setWeekOffset] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState(0);
  const [modalMealType, setModalMealType] = useState<MealType>('lunch');

  const weekStart = startOfWeek(
    addWeeks(new Date(), weekOffset),
    { weekStartsOn: 0 }
  );
  const weekStartDate = format(weekStart, 'yyyy-MM-dd');

  const weekSlots = mealSlots.filter(s => s.weekStartDate === weekStartDate);
  const weekShoppingItems = shoppingItems.filter(
    i => !i.weekStartDate || i.weekStartDate === weekStartDate
  );

  const openModal = (day: number, mealType: MealType) => {
    setModalDay(day);
    setModalMealType(mealType);
    setModalOpen(true);
  };

  const getExistingSlot = (day: number, mealType: MealType): MealSlot | undefined =>
    weekSlots.find(s => s.dayIndex === day && s.mealType === mealType);

  const handleModalSave = (dishes: MealDish[]) => {
    if (dishes.length === 0) {
      const existing = getExistingSlot(modalDay, modalMealType);
      if (existing) deleteMealSlot(existing.id);
    } else {
      setMealSlot(weekStartDate, modalDay, modalMealType, dishes);
    }
    setModalOpen(false);
  };

  const handleDeleteDish = (slotId: string, dishIndex: number) => {
    const slot = mealSlots.find(s => s.id === slotId);
    if (!slot) return;
    const newDishes = slot.dishes.filter((_, i) => i !== dishIndex);
    if (newDishes.length === 0) {
      deleteMealSlot(slotId);
    } else {
      setMealSlot(weekStartDate, slot.dayIndex, slot.mealType, newDishes);
    }
  };

  const handleAIApply = (suggestions: { day: number; mealType: MealType; dishName: string }[]) => {
    suggestions.forEach(({ day, mealType, dishName }) => {
      const existing = getExistingSlot(day, mealType);
      const newDish: MealDish = { freeText: dishName };
      const updatedDishes = existing ? [...existing.dishes, newDish] : [newDish];
      setMealSlot(weekStartDate, day, mealType, updatedDishes);
    });
  };

  const handleAddToMealPlan = (recipe: Recipe | CuratedRecipe) => {
    setTab('weekly');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'weekly', label: mp.weeklyPlan },
    { key: 'recipes', label: mp.recipes },
    { key: 'shopping', label: mp.shoppingList },
  ];

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = isCurrentWeek
    ? (lang === 'ar' ? 'هذا الأسبوع' : 'This Week')
    : format(weekStart, 'MMM d') + ' – ' + format(addWeeks(weekStart, 1), 'MMM d');

  return (
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 py-4 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{t.mealPlanner}</h1>
            <p className="text-sm text-muted-foreground font-medium">{weekLabel}</p>
          </div>
        </div>

        {tab === 'weekly' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-9 h-9 rounded-2xl border bg-card hover:bg-muted flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 h-9 rounded-2xl border bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all"
              >
                {lang === 'ar' ? 'اليوم' : 'Today'}
              </button>
            )}
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="w-9 h-9 rounded-2xl border bg-card hover:bg-muted flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold transition-all',
              tab === key
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'weekly' && (
        <div className="space-y-4">
          <WeeklyGrid
            weekStartDate={weekStartDate}
            mealSlots={weekSlots}
            recipes={recipes}
            onAddMeal={openModal}
            onEditMeal={slot => openModal(slot.dayIndex, slot.mealType)}
            onDeleteDish={handleDeleteDish}
            lang={lang}
          />
          <AIMealCoach
            weekStartDate={weekStartDate}
            onApplySuggestions={handleAIApply}
            lang={lang}
          />
        </div>
      )}

      {tab === 'recipes' && (
        <RecipeLibrary
          recipes={recipes}
          onAddRecipe={r => addRecipe(r)}
          onUpdateRecipe={updateRecipe}
          onDeleteRecipe={deleteRecipe}
          onAddToMealPlan={handleAddToMealPlan}
          lang={lang}
        />
      )}

      {tab === 'shopping' && (
        <ShoppingListView
          shoppingItems={weekShoppingItems}
          mealSlots={weekSlots}
          recipes={recipes}
          weekStartDate={weekStartDate}
          onAddItem={addShoppingItem}
          onUpdateItem={updateShoppingItem}
          onDeleteItem={deleteShoppingItem}
          onClearChecked={clearCheckedShoppingItems}
          lang={lang}
        />
      )}

      {modalOpen && (
        <MealSlotModal
          open={modalOpen}
          day={modalDay}
          mealType={modalMealType}
          weekStartDate={weekStartDate}
          existingSlot={getExistingSlot(modalDay, modalMealType)}
          recipes={recipes}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
