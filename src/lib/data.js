import { csvToObjects } from './csv.js';

// The CSVs under project-assets/ are the single source of truth for lookup
// data and seed recipes. They are imported as raw text and parsed at runtime
// so nothing is duplicated in application code.
import recipesCsv from '../../project-assets/recipes.csv?raw';
import ingredientsCsv from '../../project-assets/ingredients.csv?raw';
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw';
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw';
import cuisinesCsv from '../../project-assets/cuisines.csv?raw';
import dietaryTagsCsv from '../../project-assets/dietary_tags.csv?raw';
import mealTypesCsv from '../../project-assets/meal_types.csv?raw';
import categoriesCsv from '../../project-assets/recipe_categories.csv?raw';
import unitsCsv from '../../project-assets/units.csv?raw';

const recipeRows = csvToObjects(recipesCsv);
const ingredientRows = csvToObjects(ingredientsCsv);
const recipeIngredientRows = csvToObjects(recipeIngredientsCsv);
const recipeStepRows = csvToObjects(recipeStepsCsv);

// Lookup tables -----------------------------------------------------------

export const CUISINES = csvToObjects(cuisinesCsv).map((r) => ({ id: r.cuisine_id, name: r.cuisine_name }));
export const DIETARY_TAGS = csvToObjects(dietaryTagsCsv).map((r) => ({ id: r.dietary_tag_id, name: r.dietary_tag_name }));
export const MEAL_TYPES = csvToObjects(mealTypesCsv).map((r) => ({ id: r.meal_type_id, name: r.meal_type_name }));
export const CATEGORIES = csvToObjects(categoriesCsv).map((r) => ({ id: r.category_id, name: r.category_name }));
export const UNITS = csvToObjects(unitsCsv).map((r) => ({ id: r.unit_id, name: r.unit_name }));
export const INGREDIENTS = ingredientRows.map((r) => ({
  id: r.ingredient_id,
  name: r.ingredient_name,
  category: r.shopping_category,
}));

const mapById = (list) => Object.fromEntries(list.map((x) => [x.id, x.name]));

export const CUISINE_BY_ID = mapById(CUISINES);
export const DIETARY_BY_ID = mapById(DIETARY_TAGS);
export const MEAL_TYPE_BY_ID = mapById(MEAL_TYPES);
export const CATEGORY_BY_ID = mapById(CATEGORIES);

export const UNIT_NAMES = UNITS.map((u) => u.name);
export const INGREDIENT_NAMES = INGREDIENTS.map((i) => i.name);

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
export const INGREDIENT_BY_NAME = Object.fromEntries(
  INGREDIENTS.map((i) => [i.name.trim().toLowerCase(), i])
);

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
];

// Resolve a free-text ingredient name (or id) against the lookup table.
export function resolveIngredient(name, ingredientId) {
  if (ingredientId && INGREDIENT_BY_ID[ingredientId]) return INGREDIENT_BY_ID[ingredientId];
  const n = (name || '').trim().toLowerCase();
  return INGREDIENT_BY_NAME[n] || null;
}

// Seed recipes ------------------------------------------------------------

function splitIds(value) {
  return (value || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function toBool(value) {
  return value === 'True' || value === 'true' || value === 'TRUE' || value === '1';
}

export const SEED_RECIPES = recipeRows.map((r) => {
  const ingredients = recipeIngredientRows
    .filter((ri) => ri.recipe_id === r.recipe_id)
    .sort((a, b) => Number(a.display_order) - Number(b.display_order))
    .map((ri) => ({
      id: `${r.recipe_id}-ing-${ri.display_order}`,
      section: ri.section_name || 'Ingredients',
      ingredientId: ri.ingredient_id || null,
      name: ri.ingredient_name || '',
      quantity: ri.quantity || '',
      unit: ri.unit || '',
      notes: ri.notes || '',
      optional: toBool(ri.optional),
    }));

  const steps = recipeStepRows
    .filter((rs) => rs.recipe_id === r.recipe_id)
    .sort((a, b) => Number(a.step_number) - Number(b.step_number))
    .map((rs) => ({
      id: `${r.recipe_id}-step-${rs.step_number}`,
      instruction: rs.instruction || '',
      timerMinutes: Number(rs.timer_minutes) || 0,
    }));

  return {
    id: r.recipe_id,
    title: r.title || 'Untitled recipe',
    shortDescription: r.short_description || '',
    sourceName: r.source_name || '',
    sourceUrl: r.source_url || '',
    servings: Number(r.servings) || 4,
    prepTime: Number(r.prep_time_minutes) || 0,
    cookTime: Number(r.cook_time_minutes) || 0,
    totalTime: Number(r.total_time_minutes) || 0,
    cuisineId: r.cuisine_id || '',
    mealTypeId: r.meal_type_id || '',
    dietaryTagIds: splitIds(r.dietary_tag_ids),
    categoryIds: splitIds(r.category_ids),
    difficulty: Number(r.difficulty_1_to_5) || 0,
    spiceLevel: Number(r.spice_level_0_to_5) || 0,
    accentColor: r.accent_color || '#D97757',
    coverImageUrl: r.cover_image_url || '',
    includeInMealSuggestions: r.include_in_meal_suggestions !== 'false',
    ingredients,
    steps,
    // Defaults for recipe-option settings that seed recipes do not carry.
    includeInShoppingList: true,
    showNutrition: false,
    allowSubstitutions: false,
    measurementSystem: 'us',
    isSeed: true,
  };
});
