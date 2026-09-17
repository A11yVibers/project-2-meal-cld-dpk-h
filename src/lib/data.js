// Loads and normalizes the immutable project-assets CSV files into lookups
// and seed recipes. The original CSV files are never modified.

import { parseTable } from './csv.js'

import recipesRaw from '../../project-assets/recipes.csv?raw'
import recipeIngredientsRaw from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsRaw from '../../project-assets/recipe_steps.csv?raw'
import ingredientsRaw from '../../project-assets/ingredients.csv?raw'
import unitsRaw from '../../project-assets/units.csv?raw'
import cuisinesRaw from '../../project-assets/cuisines.csv?raw'
import dietaryTagsRaw from '../../project-assets/dietary_tags.csv?raw'
import mealTypesRaw from '../../project-assets/meal_types.csv?raw'
import categoriesRaw from '../../project-assets/recipe_categories.csv?raw'

import { APPROVED_IMAGES } from '../approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

function toIdList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function toBool(value) {
  if (value === true) return true
  return String(value).toLowerCase() === 'true'
}

function num(value) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

// ---- Lookup tables ---------------------------------------------------------

export const CUISINES = parseTable(cuisinesRaw).map((r) => ({
  id: r.cuisine_id,
  name: r.cuisine_name,
}))

export const DIETARY_TAGS = parseTable(dietaryTagsRaw).map((r) => ({
  id: r.dietary_tag_id,
  name: r.dietary_tag_name,
}))

export const MEAL_TYPES = parseTable(mealTypesRaw).map((r) => ({
  id: r.meal_type_id,
  name: r.meal_type_name,
}))

export const RECIPE_CATEGORIES = parseTable(categoriesRaw).map((r) => ({
  id: r.category_id,
  name: r.category_name,
}))

export const INGREDIENTS = parseTable(ingredientsRaw).map((r) => ({
  id: r.ingredient_id,
  name: r.ingredient_name,
  category: r.shopping_category,
}))

export const UNITS = parseTable(unitsRaw).map((r) => ({
  id: r.unit_id,
  name: r.unit_name,
}))

export const UNIT_NAMES = UNITS.map((u) => u.name)
export const INGREDIENT_NAMES = INGREDIENTS.map((i) => i.name)
export const CUISINE_NAMES = CUISINES.map((c) => c.name)
export const DIETARY_TAG_NAMES = DIETARY_TAGS.map((d) => d.name)
export const MEAL_TYPE_NAMES = MEAL_TYPES.map((m) => m.name)
export const CATEGORY_NAMES = RECIPE_CATEGORIES.map((c) => c.name)

// Map a (lower-cased) ingredient name to its shopping category.
export const INGREDIENT_CATEGORY_MAP = INGREDIENTS.reduce((acc, ing) => {
  acc[ing.name.toLowerCase()] = ing.category
  return acc
}, {})

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

// The four planner slots (a stable subset of MEAL_TYPES).
export const PLANNER_SLOTS = [
  { key: 'breakfast', name: 'Breakfast' },
  { key: 'lunch', name: 'Lunch' },
  { key: 'dinner', name: 'Dinner' },
  { key: 'snack', name: 'Snack' },
]

// Default per-recipe options used for seed recipes and new recipes.
export const DEFAULT_RECIPE_OPTIONS = {
  includeInShoppingList: true,
  showNutrition: false,
  allowSubstitutions: false,
  measurementSystem: 'us', // 'us' | 'metric'
}

// ---- Seed recipes ----------------------------------------------------------

function buildSeedRecipes() {
  const recipeRows = parseTable(recipesRaw)
  const ingredientRows = parseTable(recipeIngredientsRaw)
  const stepRows = parseTable(recipeStepsRaw)

  const ingredientsByRecipe = {}
  ingredientRows.forEach((r) => {
    ;(ingredientsByRecipe[r.recipe_id] ||= []).push({
      sectionName: r.section_name,
      ingredientId: r.ingredient_id,
      ingredientName: r.ingredient_name,
      quantity: r.quantity,
      unit: r.unit,
      notes: r.notes,
      optional: toBool(r.optional),
      displayOrder: num(r.display_order),
    })
  })

  const stepsByRecipe = {}
  stepRows.forEach((r) => {
    ;(stepsByRecipe[r.recipe_id] ||= []).push({
      stepNumber: num(r.step_number),
      instruction: r.instruction,
      timerMinutes: num(r.timer_minutes),
    })
  })

  return recipeRows.map((r) => ({
    id: r.recipe_id,
    isSeed: true,
    title: r.title,
    shortDescription: r.short_description,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    servings: num(r.servings),
    prepTimeMinutes: num(r.prep_time_minutes),
    cookTimeMinutes: num(r.cook_time_minutes),
    totalTimeMinutes: num(r.total_time_minutes),
    cuisineId: r.cuisine_id,
    mealTypeId: r.meal_type_id,
    dietaryTagIds: toIdList(r.dietary_tag_ids),
    categoryIds: toIdList(r.category_ids),
    difficulty: num(r.difficulty_1_to_5),
    spiceLevel: num(r.spice_level_0_to_5),
    accentColor: r.accent_color || '',
    coverImageUrl: r.cover_image_url || '',
    includeInMealSuggestions: toBool(r.include_in_meal_suggestions),
    ingredients: (ingredientsByRecipe[r.recipe_id] || [])
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(({ displayOrder, ...ing }) => ing),
    steps: (stepsByRecipe[r.recipe_id] || [])
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map(({ stepNumber, ...step }) => step),
    options: { ...DEFAULT_RECIPE_OPTIONS },
  }))
}

export const SEED_RECIPES = buildSeedRecipes()

// ---- Shared lookup helpers -------------------------------------------------

export function cuisineName(id) {
  return CUISINES.find((c) => c.id === id)?.name || 'Other'
}

export function mealTypeName(id) {
  return MEAL_TYPES.find((m) => m.id === id)?.name || ''
}

export function dietaryTagNames(ids) {
  return ids.map((id) => DIETARY_TAGS.find((d) => d.id === id)?.name).filter(Boolean)
}

export function categoryNames(ids) {
  return ids.map((id) => RECIPE_CATEGORIES.find((c) => c.id === id)?.name).filter(Boolean)
}

export function categoryForIngredient(name) {
  return INGREDIENT_CATEGORY_MAP[(name || '').trim().toLowerCase()] || 'Other'
}

export function ingredientIdForName(name) {
  const found = INGREDIENTS.find((i) => i.name.toLowerCase() === (name || '').trim().toLowerCase())
  return found ? found.id : ''
}
