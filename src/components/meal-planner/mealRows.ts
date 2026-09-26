import type { LegacyMealType, MealCategory, MealDish, MealSlot, MealType, PlanMealType } from '@/lib/types';

export interface MealGroup {
  key: MealCategory;
  en: string;
  ar: string;
  emoji: string;
}

export const MEAL_GROUPS: MealGroup[] = [
  { key: 'breakfast', en: 'Breakfast', ar: 'الإفطار', emoji: '☀️' },
  { key: 'lunch',     en: 'Lunch',     ar: 'الغداء',  emoji: '🌤️' },
  { key: 'dinner',    en: 'Dinner',    ar: 'العشاء',  emoji: '🌙' },
];

export interface PlanRow {
  type: PlanMealType;
  group: MealCategory;
  /** Who eats this meal. */
  en: string;
  ar: string;
  emoji: string;
  /** Only needed on school days (Malika's lunchbox). */
  schoolDaysOnly?: boolean;
  /** Tailwind classes: label text, dish chip, add button, modal header. */
  text: string;
  chip: string;
  btn: string;
  accent: string;
}

export const PLAN_ROWS: PlanRow[] = [
  {
    type: 'kids-breakfast', group: 'breakfast',
    en: 'Lyla & Malika', ar: 'ليلى ومليكة', emoji: '👧👧',
    text: 'text-rose-700', chip: 'bg-rose-100 text-rose-800 border border-rose-200',
    btn: 'hover:bg-rose-50 text-rose-600 border border-rose-200', accent: 'text-rose-700 bg-rose-50',
  },
  {
    type: 'mohamed-breakfast', group: 'breakfast',
    en: 'Mohamed', ar: 'محمد', emoji: '👨',
    text: 'text-sky-700', chip: 'bg-sky-100 text-sky-800 border border-sky-200',
    btn: 'hover:bg-sky-50 text-sky-600 border border-sky-200', accent: 'text-sky-700 bg-sky-50',
  },
  {
    type: 'malika-lunchbox', group: 'lunch',
    en: "Malika's lunchbox", ar: 'لنش مليكة', emoji: '🎒', schoolDaysOnly: true,
    text: 'text-violet-700', chip: 'bg-violet-100 text-violet-800 border border-violet-200',
    btn: 'hover:bg-violet-50 text-violet-600 border border-violet-200', accent: 'text-violet-700 bg-violet-50',
  },
  {
    type: 'home-lunch', group: 'lunch',
    en: 'Wesam & Lyla', ar: 'وسام وليلى', emoji: '🏠',
    text: 'text-amber-700', chip: 'bg-amber-100 text-amber-800 border border-amber-200',
    btn: 'hover:bg-amber-50 text-amber-600 border border-amber-200', accent: 'text-amber-700 bg-amber-50',
  },
  {
    type: 'mohamed-lunch', group: 'lunch',
    en: 'Mohamed', ar: 'محمد', emoji: '👨',
    text: 'text-sky-700', chip: 'bg-sky-100 text-sky-800 border border-sky-200',
    btn: 'hover:bg-sky-50 text-sky-600 border border-sky-200', accent: 'text-sky-700 bg-sky-50',
  },
  {
    type: 'dinner', group: 'dinner',
    en: 'Family', ar: 'العائلة', emoji: '👨‍👩‍👧‍👧',
    text: 'text-green-800', chip: 'bg-green-100 text-green-900 border border-green-200',
    btn: 'hover:bg-green-50 text-green-800 border border-green-200', accent: 'text-green-800 bg-green-50',
  },
];

/** Days Malika has school, as dayIndex (0 = Sunday … 6 = Saturday). */
export const SCHOOL_DAYS = new Set([1, 2, 3, 4, 5]);

export function getPlanRow(type: MealType): PlanRow | undefined {
  return PLAN_ROWS.find(r => r.type === type);
}

export function isRowActive(row: PlanRow, dayIndex: number): boolean {
  return !row.schoolDaysOnly || SCHOOL_DAYS.has(dayIndex);
}

// ── Migration from the earlier layout ────────────────────────────────────────

export const LEGACY_TO_PLAN: Record<LegacyMealType, PlanMealType> = {
  'lyla-breakfast':   'kids-breakfast',
  'malika-breakfast': 'kids-breakfast',
  breakfast:          'mohamed-breakfast',
  'lyla-lunchbox':    'home-lunch',
  lunch:              'mohamed-lunch',
};

function isLegacy(type: MealType): type is LegacyMealType {
  return type in LEGACY_TO_PLAN;
}

function sameDish(a: MealDish, b: MealDish): boolean {
  return a.recipeId ? a.recipeId === b.recipeId : !b.recipeId && a.freeText === b.freeText;
}

export interface SlotMigration {
  /** Slot to write, with legacy dishes merged into whatever the new row already had. */
  target: { weekStartDate: string; dayIndex: number; mealType: PlanMealType; dishes: MealDish[] };
  /** Legacy slot ids to delete once the target is written. */
  deleteIds: string[];
}

/** Groups legacy slots by the new row they belong in, merging dishes without duplicates. */
export function planSlotMigration(slots: MealSlot[]): SlotMigration[] {
  const byTarget = new Map<string, SlotMigration>();

  for (const slot of slots) {
    if (!isLegacy(slot.mealType)) continue;
    const mealType = LEGACY_TO_PLAN[slot.mealType];
    const targetId = `${slot.weekStartDate}_${slot.dayIndex}_${mealType}`;

    let migration = byTarget.get(targetId);
    if (!migration) {
      const existing = slots.find(s => s.id === targetId);
      migration = {
        target: { weekStartDate: slot.weekStartDate, dayIndex: slot.dayIndex, mealType, dishes: [...(existing?.dishes ?? [])] },
        deleteIds: [],
      };
      byTarget.set(targetId, migration);
    }
    for (const dish of slot.dishes ?? []) {
      if (!migration.target.dishes.some(d => sameDish(d, dish))) migration.target.dishes.push(dish);
    }
    migration.deleteIds.push(slot.id);
  }

  return Array.from(byTarget.values());
}
