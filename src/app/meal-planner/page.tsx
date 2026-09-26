"use client"

import React, { useState } from 'react';
import { format, startOfWeek, addWeeks, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, ChefHat, X } from 'lucide-react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { MealSlot, MealType, MealDish, Recipe, PlanMealType } from '@/lib/types';
import { CuratedRecipe } from '@/components/meal-planner/curatedRecipes';
import { WeeklyGrid } from '@/components/meal-planner/WeeklyGrid';
import { MealSlotModal } from '@/components/meal-planner/MealSlotModal';
import { RecipeLibrary } from '@/components/meal-planner/RecipeLibrary';
import { ShoppingListView } from '@/components/meal-planner/ShoppingListView';
import { AIMealCoach } from '@/components/meal-planner/AIMealCoach';
import { dishFromRecipe } from '@/components/meal-planner/dishes';
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
  } = useStore();

  const t = getTranslation(settings.language);
  const mp = t.mealPlannerFull;
  const lang = settings.language;
  const isRtl = lang === 'ar';

  const [tab, setTab] = useState<Tab>('weekly');
  const [weekOffset, setWeekOffset] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState(0);
  const [modalMealType, setModalMealType] = useState<MealType>('dinner');

  // Set by "Add to Plan" in the recipe library; the next slot tapped receives it.
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | CuratedRecipe | null>(null);

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
    if (pendingRecipe) {
      const existing = getExistingSlot(day, mealType);
      setMealSlot(weekStartDate, day, mealType, [...(existing?.dishes ?? []), dishFromRecipe(pendingRecipe)]);
      setPendingRecipe(null);
      return;
    }
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

  // The coach suggests generic breakfast/lunch/dinner; place them in the shared meals.
  const AI_ROW: Partial<Record<MealType, PlanMealType>> = {
    breakfast: 'kids-breakfast',
    lunch: 'home-lunch',
    dinner: 'dinner',
  };

  const handleAIApply = (suggestions: { day: number; mealType: MealType; dishName: string }[]) => {
    suggestions.forEach(({ day, mealType, dishName }) => {
      const row = AI_ROW[mealType];
      if (!row) return;
      const existing = getExistingSlot(day, row);
      const newDish: MealDish = { freeText: dishName };
      const updatedDishes = existing ? [...existing.dishes, newDish] : [newDish];
      setMealSlot(weekStartDate, day, row, updatedDishes);
    });
  };

  const handleAddToMealPlan = (recipe: Recipe | CuratedRecipe) => {
    setPendingRecipe(recipe);
    setTab('weekly');
  };

  const handleClearChecked = () => {
    weekShoppingItems.filter(i => i.checked).forEach(i => deleteShoppingItem(i.id));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'weekly', label: mp.weeklyPlan },
    { key: 'recipes', label: mp.recipes },
    { key: 'shopping', label: mp.shoppingList },
  ];

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = isCurrentWeek
    ? (lang === 'ar' ? 'هذا الأسبوع' : 'This Week')
    : format(weekStart, 'MMM d') + ' – ' + format(addDays(weekStart, 6), 'MMM d');

  return (
    <AppLayout>
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
              onClick={() => { setTab(key); if (key !== 'weekly') setPendingRecipe(null); }}
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
            {pendingRecipe && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/30 text-sm">
                <span className="text-xl">{pendingRecipe.emoji ?? '🍽️'}</span>
                <p className="flex-1 font-bold">
                  {isRtl
                    ? `اختر خانة لإضافة "${pendingRecipe.name}"`
                    : `Tap a slot to add "${pendingRecipe.name}"`}
                </p>
                <button
                  onClick={() => setPendingRecipe(null)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border bg-card font-bold text-xs hover:bg-muted transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            )}
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
            onClearChecked={handleClearChecked}
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
    </AppLayout>
  );
}
