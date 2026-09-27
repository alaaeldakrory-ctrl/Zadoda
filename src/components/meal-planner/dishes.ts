import type { MealDish, Recipe, RecipeIngredient } from '@/lib/types';
import { CURATED_RECIPES, CuratedRecipe } from './curatedRecipes';

type AnyRecipe = Recipe | CuratedRecipe;

/** The family's own version of a built-in recipe (made by editing or ♥), if there is one. */
export function familyVersionOf(curatedId: string, recipes: Recipe[]): Recipe | undefined {
  return recipes.find(r => r.source === 'curated' && r.sourceId === curatedId);
}

/** A built-in recipe as this family sees it: their edited version replaces the original everywhere. */
export function effectiveCurated(curated: CuratedRecipe, recipes: Recipe[]): AnyRecipe {
  return familyVersionOf(curated.id, recipes) ?? curated;
}

function findRecipe(dish: MealDish, recipes: Recipe[]): AnyRecipe | undefined {
  if (dish.recipeId) {
    if (dish.recipeId.startsWith('curated_')) {
      const curated = CURATED_RECIPES.find(r => r.id === dish.recipeId);
      if (curated) return effectiveCurated(curated, recipes);
    } else {
      const own = recipes.find(r => r.id === dish.recipeId);
      if (own) return own;
    }
  }
  // Free-text dishes (and dishes whose recipe was deleted) still pick up a
  // recipe when the name matches one exactly.
  const name = dish.freeText?.trim().toLowerCase();
  if (!name) return undefined;
  const own = recipes.find(r => r.name.trim().toLowerCase() === name);
  if (own) return own;
  const curated = CURATED_RECIPES.find(r => r.name.toLowerCase() === name);
  return curated && effectiveCurated(curated, recipes);
}

export function dishName(dish: MealDish, recipes: Recipe[]): string {
  return findRecipe(dish, recipes)?.name ?? dish.freeText ?? '—';
}

export function dishEmoji(dish: MealDish, recipes: Recipe[]): string | undefined {
  return findRecipe(dish, recipes)?.emoji;
}

export function dishImage(dish: MealDish, recipes: Recipe[]): string | undefined {
  const recipe = findRecipe(dish, recipes);
  return recipe && 'imageUrl' in recipe ? recipe.imageUrl || undefined : undefined;
}

/** Ingredients for a dish, or null when it has no known recipe. */
export function dishIngredients(dish: MealDish, recipes: Recipe[]): RecipeIngredient[] | null {
  return findRecipe(dish, recipes)?.ingredients ?? null;
}

/** A dish pointing at a recipe, keeping its name so it still displays if the recipe is deleted. */
export function dishFromRecipe(recipe: AnyRecipe): MealDish {
  return { recipeId: recipe.id, freeText: recipe.name };
}
