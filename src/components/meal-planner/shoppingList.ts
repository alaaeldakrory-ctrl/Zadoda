import type { MealSlot, RecipeIngredient, ShoppingCategory, ShoppingItem } from '@/lib/types';

// Rules are checked in order, so specific phrases come before the generic words
// they contain (e.g. "bell pepper" before "pepper", "peanut butter" before "butter").
const CATEGORY_RULES: [RegExp, ShoppingCategory][] = [
  [/bell pepper|green beans?|eggplant|sweet potato|cauliflower rice/, 'produce'],
  [/peanut butter|almond butter|coconut milk|black pepper|pepper seasoning|tomato (sauce|paste)|powder|pesto/, 'pantry'],
  [/chicken|beef|steak|sirloin|fish|salmon|tuna|cod\b|tilapia|shrimp|egg|meat|turkey|lamb|tofu|sausage/, 'protein'],
  [/milk|cheese|mozzarella|butter|yogurt|cream|dairy|labneh|tzatziki/, 'dairy'],
  [/flour|rice|pasta|bread|oats|sugar|oil|sauce|paste|vinegar|spice|seasoning|salt|pepper|soy|honey|cracker|cereal|noodle|baking|vanilla|cinnamon|cumin|oregano|paprika|turmeric|curry|mustard|tahini|flax|nori|broth|salsa|olives|artichoke|lentil|beans?\b|chickpea|quinoa|hummus|tortilla|pita|granola|nuts?\b|almonds|walnuts|seeds/, 'pantry'],
  [/tomato|onion|garlic|ginger|carrot|lettuce|greens|spinach|broccoli|celery|cucumber|zucchini|potato|mushroom|kale|cabbage|cauliflower|asparagus|brussels|peas\b|jalape|parsley|cilantro|coriander|mint|basil|dill|herbs|apple|banana|lemon|lime|avocado|orange|berry|berries|grapefruit|mango|grape|pear|peach|melon/, 'produce'],
];

// Things every kitchen has on tap, so they never belong on the list.
const NEVER_BUY = new Set(['water']);

export function inferCategory(name: string): ShoppingCategory {
  const n = name.toLowerCase();
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(n)) return category;
  }
  return 'other';
}

const UNIT_PLURALS: Record<string, string> = {
  cup: 'cups', piece: 'pieces', slice: 'slices', clove: 'cloves',
  leaf: 'leaves', link: 'links', stalk: 'stalks', strip: 'strips',
};
const UNIT_SINGULARS = Object.fromEntries(Object.entries(UNIT_PLURALS).map(([s, p]) => [p, s]));

function singularUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  return UNIT_SINGULARS[u] ?? u;
}

function displayUnit(unit: string, quantity: number): string {
  return quantity > 1 ? (UNIT_PLURALS[unit] ?? unit) : unit;
}

/** Identifies "the same thing to buy" so cups/cup or different casing don't create duplicates. */
export function shoppingKey(name: string, unit?: string): string {
  return `${name.trim().toLowerCase()}__${singularUnit(unit ?? '')}`;
}

function roundQty(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface AggregateResult {
  items: Omit<ShoppingItem, 'id'>[];
  /** Free-text dishes with no matching recipe, so their ingredients are unknown. */
  unknownDishes: string[];
}

export function aggregateIngredients(
  slots: MealSlot[],
  weekStartDate: string,
  getIngredients: (dish: { recipeId?: string; freeText?: string }) => RecipeIngredient[] | null
): AggregateResult {
  const weekSlots = slots.filter(s => !s.weekStartDate || s.weekStartDate === weekStartDate);

  const totals = new Map<string, { name: string; unit: string; qty: number; hasQty: boolean }>();
  const unknown = new Set<string>();

  for (const slot of weekSlots) {
    for (const dish of slot.dishes ?? []) {
      const ingredients = getIngredients(dish);
      if (!ingredients) {
        if (dish.freeText) unknown.add(dish.freeText.trim());
        continue;
      }
      for (const ing of ingredients) {
        if (!ing.name?.trim() || NEVER_BUY.has(ing.name.trim().toLowerCase())) continue;
        const key = shoppingKey(ing.name, ing.unit);
        const qty = parseFloat(ing.quantity);
        const entry = totals.get(key) ?? { name: ing.name.trim(), unit: singularUnit(ing.unit ?? ''), qty: 0, hasQty: false };
        if (!isNaN(qty) && qty > 0) {
          entry.qty += qty;
          entry.hasQty = true;
        }
        totals.set(key, entry);
      }
    }
  }

  const items = Array.from(totals.values()).map(({ name, unit, qty, hasQty }) => {
    const rounded = roundQty(qty);
    return {
      name,
      quantity: hasQty ? String(rounded) : '',
      unit: displayUnit(unit, rounded),
      category: inferCategory(name),
      checked: false,
      weekStartDate,
      source: 'auto' as const,
      addedAt: Date.now(),
    };
  });

  return { items, unknownDishes: Array.from(unknown) };
}

export interface ShoppingSyncPlan {
  toAdd: Omit<ShoppingItem, 'id'>[];
  toUpdate: { id: string; updates: Partial<ShoppingItem> }[];
  toDelete: string[];
}

/**
 * Works out how to bring this week's list in line with the plan:
 * new ingredients are added, auto-generated quantities are refreshed, and
 * unchecked auto items whose meals were removed are dropped. Manually added
 * items and anything already checked off are never touched.
 */
export function planShoppingSync(
  existing: ShoppingItem[],
  generated: Omit<ShoppingItem, 'id'>[]
): ShoppingSyncPlan {
  const existingByKey = new Map(existing.map(i => [shoppingKey(i.name, i.unit), i]));
  const generatedKeys = new Set<string>();
  const plan: ShoppingSyncPlan = { toAdd: [], toUpdate: [], toDelete: [] };

  for (const item of generated) {
    const key = shoppingKey(item.name, item.unit);
    generatedKeys.add(key);
    const match = existingByKey.get(key);
    if (!match) {
      plan.toAdd.push(item);
      continue;
    }
    const editable = match.source === 'auto' && !match.checked;
    const changed = (match.quantity ?? '') !== item.quantity || (match.unit ?? '') !== item.unit;
    if (editable && changed) {
      plan.toUpdate.push({ id: match.id, updates: { quantity: item.quantity, unit: item.unit } });
    }
  }

  for (const item of existing) {
    if (item.source === 'auto' && !item.checked && !generatedKeys.has(shoppingKey(item.name, item.unit))) {
      plan.toDelete.push(item.id);
    }
  }

  return plan;
}
