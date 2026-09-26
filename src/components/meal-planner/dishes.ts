import type { MealDish, Recipe, RecipeIngredient } from '@/lib/types';
import { CURATED_RECIPES, CuratedRecipe } from './curatedRecipes';

type AnyRecipe = Recipe | CuratedRecipe;

function findRecipe(dish: MealDish, recipes: Recipe[]): AnyRecipe | undefined {
  if (dish.recipeId) {
    const byId = dish.recipeId.startsWith('curated_')
      ? CURATED_RECIPES.find(r => r.id === dish.recipeId)
      : recipes.find(r => r.id === dish.recipeId);
    if (byId) return byId;
  }
  // Free-text dishes (and dishes whose recipe was deleted) still pick up a
  // recipe when the name matches one exactly.
  const name = dish.freeText?.trim().toLowerCase();
  if (!name) return undefined;
  return recipes.find(r => r.name.trim().toLowerCase() === name)
    ?? CURATED_RECIPES.find(r => r.name.toLowerCase() === name);
}

export function dishName(dish: MealDish, recipes: Recipe[]): string {
  return findRecipe(dish, recipes)?.name ?? dish.freeText ?? '—';
}

export function dishEmoji(dish: MealDish, recipes: Recipe[]): string | undefined {
  return findRecipe(dish, recipes)?.emoji;
}

/** Ingredients for a dish, or null when it has no known recipe. */
export function dishIngredients(dish: MealDish, recipes: Recipe[]): RecipeIngredient[] | null {
  return findRecipe(dish, recipes)?.ingredients ?? null;
}

/** A dish pointing at a recipe, keeping its name so it still displays if the recipe is deleted. */
export function dishFromRecipe(recipe: AnyRecipe): MealDish {
  return { recipeId: recipe.id, freeText: recipe.name };
}
