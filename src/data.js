// Imports and parses the immutable CSV source data from project-assets/.
// We never edit those files; we only read and derive data from them.
import recipesRaw from '../project-assets/recipes.csv?raw'
import recipeIngredientsRaw from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsRaw from '../project-assets/recipe_steps.csv?raw'
import cuisinesRaw from '../project-assets/cuisines.csv?raw'
import dietaryTagsRaw from '../project-assets/dietary_tags.csv?raw'
import ingredientsRaw from '../project-assets/ingredients.csv?raw'
import mealTypesRaw from '../project-assets/meal_types.csv?raw'
import recipeCategoriesRaw from '../project-assets/recipe_categories.csv?raw'
import unitsRaw from '../project-assets/units.csv?raw'
import { APPROVED_IMAGES } from './approved-images.js'

/** Minimal RFC-4180-style CSV parser that handles quoted fields, commas and newlines. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function parseRecords(raw) {
  const parsed = parseCsv(raw)
  if (parsed.length === 0) return []
  const header = parsed[0].map((h) => h.trim())
  return parsed.slice(1).map((r) => {
    const obj = {}
    header.forEach((h, i) => {
      obj[h] = (r[i] ?? '').trim()
    })
    return obj
  })
}

const bool = (v) => String(v).trim().toLowerCase() === 'true'
const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

// --- Lookup tables ---------------------------------------------------------
export const CUISINES = parseRecords(cuisinesRaw).map((r) => ({
  id: r.cuisine_id,
  name: r.cuisine_name,
}))
export const DIETARY_TAGS = parseRecords(dietaryTagsRaw).map((r) => ({
  id: r.dietary_tag_id,
  name: r.dietary_tag_name,
}))
export const INGREDIENTS = parseRecords(ingredientsRaw).map((r) => ({
  id: r.ingredient_id,
  name: r.ingredient_name,
  category: r.shopping_category,
}))
export const MEAL_TYPES = parseRecords(mealTypesRaw).map((r) => ({
  id: r.meal_type_id,
  name: r.meal_type_name,
}))
export const RECIPE_CATEGORIES = parseRecords(recipeCategoriesRaw).map((r) => ({
  id: r.category_id,
  name: r.category_name,
}))
export const UNITS = parseRecords(unitsRaw).map((r) => r.unit_name)

const byId = (list) => Object.fromEntries(list.map((i) => [i.id, i]))
export const CUISINES_BY_ID = byId(CUISINES)
export const DIETARY_TAGS_BY_ID = byId(DIETARY_TAGS)
export const INGREDIENTS_BY_ID = byId(INGREDIENTS)
export const MEAL_TYPES_BY_ID = byId(MEAL_TYPES)
export const RECIPE_CATEGORIES_BY_ID = byId(RECIPE_CATEGORIES)

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

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export const ACCENT_PALETTE = [
  '#D97757',
  '#8A9A5B',
  '#B5495B',
  '#5B8DB8',
  '#C2882B',
  '#7E6BB0',
  '#4E9C87',
  '#B87AA0',
  '#8C7B68',
  '#5E7A8C',
]

export const SPICE_LABELS = ['Mild', 'Gentle', 'Medium', 'Spicy', 'Hot', 'Very spicy']
export const DIFFICULTY_LABELS = { 1: 'Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Expert' }

export const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
]

export const spiceLabel = (level) => SPICE_LABELS[Math.max(0, Math.min(5, Number(level) || 0))]
export const difficultyLabel = (level) => DIFFICULTY_LABELS[Math.max(1, Math.min(5, Number(level) || 2))]

// Rough per-serving nutrition estimates (clearly labelled as estimates in the UI).
const MEAL_NUTRITION = {
  Breakfast: { calories: 320, protein: 15, carbs: 42, fat: 12 },
  Lunch: { calories: 430, protein: 24, carbs: 48, fat: 16 },
  Dinner: { calories: 520, protein: 30, carbs: 50, fat: 22 },
  Snack: { calories: 210, protein: 6, carbs: 28, fat: 9 },
  Dessert: { calories: 380, protein: 5, carbs: 52, fat: 16 },
  'Side dish': { calories: 180, protein: 5, carbs: 24, fat: 7 },
}

export function estimateNutrition(recipe) {
  const base = MEAL_NUTRITION[MEAL_TYPES_BY_ID[recipe.mealTypeId]?.name] || {
    calories: 350,
    protein: 20,
    carbs: 40,
    fat: 15,
  }
  return base
}

// --- Seed recipes ----------------------------------------------------------
const recipeRows = parseRecords(recipesRaw)
const recipeIngredientRows = parseRecords(recipeIngredientsRaw)
const recipeStepRows = parseRecords(recipeStepsRaw)

function defaultOptions() {
  return {
    includeInShoppingList: true,
    showNutrition: false,
    allowSubstitutions: false,
    measurementSystem: 'us',
  }
}

export const SEED_RECIPES = recipeRows.map((r) => {
  const ingredients = recipeIngredientRows
    .filter((i) => i.recipe_id === r.recipe_id)
    .sort((a, b) => (num(a.display_order) || 0) - (num(b.display_order) || 0))
    .map((i) => ({
      displayOrder: num(i.display_order) || 0,
      sectionName: i.section_name || 'Main',
      ingredientId: i.ingredient_id,
      ingredientName: i.ingredient_name,
      category: INGREDIENTS_BY_ID[i.ingredient_id]?.category || 'Other',
      quantity: i.quantity || '',
      unit: i.unit || '',
      notes: i.notes || '',
      optional: bool(i.optional),
    }))

  const steps = recipeStepRows
    .filter((s) => s.recipe_id === r.recipe_id)
    .sort((a, b) => (num(a.step_number) || 0) - (num(b.step_number) || 0))
    .map((s) => ({
      stepNumber: num(s.step_number) || 1,
      instruction: s.instruction || '',
      timerMinutes: num(s.timer_minutes) || 0,
    }))

  return {
    id: r.recipe_id,
    isUserCreated: false,
    title: r.title || '',
    shortDescription: r.short_description || '',
    sourceName: r.source_name || '',
    sourceUrl: r.source_url || '',
    servings: num(r.servings) || 1,
    prepTimeMinutes: num(r.prep_time_minutes) || 0,
    cookTimeMinutes: num(r.cook_time_minutes) || 0,
    totalTimeMinutes: num(r.total_time_minutes) || 0,
    cuisineId: r.cuisine_id || '',
    mealTypeId: r.meal_type_id || '',
    dietaryTagIds: r.dietary_tag_ids ? r.dietary_tag_ids.split(',').map((s) => s.trim()).filter(Boolean) : [],
    categoryIds: r.category_ids ? r.category_ids.split(',').map((s) => s.trim()).filter(Boolean) : [],
    difficulty: num(r.difficulty_1_to_5) || 2,
    spiceLevel: Math.max(0, Math.min(5, num(r.spice_level_0_to_5) || 0)),
    accentColor: r.accent_color || '#8A9A5B',
    coverImageUrl: r.cover_image_url || '',
    includeInMealSuggestions: bool(r.include_in_meal_suggestions ?? 'true'),
    options: defaultOptions(),
    ingredients,
    steps,
  }
})