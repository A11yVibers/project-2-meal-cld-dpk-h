import recipesRaw from '../../project-assets/recipes.csv?raw'
import ingredientsRaw from '../../project-assets/ingredients.csv?raw'
import unitsRaw from '../../project-assets/units.csv?raw'
import cuisinesRaw from '../../project-assets/cuisines.csv?raw'
import dietaryTagsRaw from '../../project-assets/dietary_tags.csv?raw'
import mealTypesRaw from '../../project-assets/meal_types.csv?raw'
import recipeCategoriesRaw from '../../project-assets/recipe_categories.csv?raw'
import recipeIngredientsRaw from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsRaw from '../../project-assets/recipe_steps.csv?raw'
import { APPROVED_IMAGES } from '../approved-images.js'

// Minimal RFC-4180 style parser that handles quoted fields and escaped quotes.
function parseCsv(text) {
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
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function csvToObjects(text) {
  const rows = parseCsv(text)
  if (rows.length === 0) return []
  const header = rows[0].map((h) => h.trim())
  return rows
    .slice(1)
    .filter((r) => r.length === header.length && r.some((c) => c.trim() !== ''))
    .map((r) => {
      const obj = {}
      header.forEach((h, i) => {
        obj[h] = r[i]
      })
      return obj
    })
}

function toInt(v, fallback = 0) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

function toBool(v) {
  if (v === undefined || v === null) return false
  const s = String(v).trim().toLowerCase()
  return s === 'true' || s === '1'
}

// ----- Lookup tables -------------------------------------------------------
const ingredients = csvToObjects(ingredientsRaw).map((r) => ({
  id: r.ingredient_id,
  name: r.ingredient_name,
  category: r.shopping_category,
}))

const ingredientById = new Map(ingredients.map((i) => [i.id, i]))

const units = csvToObjects(unitsRaw).map((r) => r.unit_name)
const cuisines = csvToObjects(cuisinesRaw).map((r) => ({ id: r.cuisine_id, name: r.cuisine_name }))
const dietaryTags = csvToObjects(dietaryTagsRaw).map((r) => ({ id: r.dietary_tag_id, name: r.dietary_tag_name }))
const mealTypes = csvToObjects(mealTypesRaw).map((r) => ({ id: r.meal_type_id, name: r.meal_type_name }))
const recipeCategories = csvToObjects(recipeCategoriesRaw).map((r) => ({ id: r.category_id, name: r.category_name }))
const recipeIngredients = csvToObjects(recipeIngredientsRaw)
const recipeSteps = csvToObjects(recipeStepsRaw)

// ----- Seed recipes --------------------------------------------------------
function buildIngredientSections(recipeId) {
  const rows = recipeIngredients
    .filter((r) => r.recipe_id === recipeId)
    .sort((a, b) => toInt(a.display_order) - toInt(b.display_order))

  const sections = []
  rows.forEach((r) => {
    let section = sections.find((s) => s.name === r.section_name)
    if (!section) {
      section = { name: r.section_name, items: [] }
      sections.push(section)
    }
    const ing = ingredientById.get(r.ingredient_id)
    section.items.push({
      ingredientId: r.ingredient_id || '',
      ingredientName: r.ingredient_name || '',
      quantity: r.quantity || '',
      unit: r.unit || '',
      notes: r.notes || '',
      optional: toBool(r.optional),
      shoppingCategory: ing ? ing.category : 'Other',
    })
  })
  return sections.map((s, i) => ({ name: s.name || `Section ${i + 1}`, items: s.items }))
}

function buildSteps(recipeId) {
  return recipeSteps
    .filter((r) => r.recipe_id === recipeId)
    .sort((a, b) => toInt(a.step_number) - toInt(b.step_number))
    .map((r) => ({
      instruction: r.instruction || '',
      timerMinutes: toInt(r.timer_minutes),
    }))
}

const seedRecipes = csvToObjects(recipesRaw).map((row) => {
  const prep = toInt(row.prep_time_minutes)
  const cook = toInt(row.cook_time_minutes)
  const listedTotal = toInt(row.total_time_minutes)

  return {
    id: row.recipe_id,
    title: row.title || '',
    shortDescription: row.short_description || '',
    sourceName: row.source_name || '',
    sourceUrl: row.source_url || '',
    servings: toInt(row.servings, 4),
    prepTimeMinutes: prep,
    cookTimeMinutes: cook,
    totalTimeMinutes: listedTotal || prep + cook,
    cuisineId: row.cuisine_id || '',
    mealTypeId: row.meal_type_id || '',
    dietaryTagIds: (row.dietary_tag_ids || '').split(',').map((s) => s.trim()).filter(Boolean),
    categoryIds: (row.category_ids || '').split(',').map((s) => s.trim()).filter(Boolean),
    difficulty: toInt(row.difficulty_1_to_5, 1),
    spiceLevel: toInt(row.spice_level_0_to_5, 0),
    accentColor: row.accent_color || '#D97757',
    coverImageUrl: row.cover_image_url || '',
    includeInMealSuggestions: toBool(row.include_in_meal_suggestions),
    // Recipe-options defaults for seed recipes.
    includeInShoppingList: true,
    showNutrition: false,
    allowSubstitutions: false,
    measurementSystem: 'us',
    ingredientSections: buildIngredientSections(row.recipe_id),
    steps: buildSteps(row.recipe_id),
    isUserCreated: false,
    createdAt: 0,
  }
})

// ----- Shared helpers ------------------------------------------------------
export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export const APPROVED_IMAGE_URLS = Array.from(
  new Set([APPROVED_IMAGES.placeholder, ...seedRecipes.map((r) => r.coverImageUrl).filter(Boolean)])
)

export const lookups = {
  mealTypeName: (id) => (mealTypes.find((m) => m.id === id) || {}).name || '',
  cuisineName: (id) => (cuisines.find((c) => c.id === id) || {}).name || '',
  dietaryNames: (ids) =>
    (ids || []).map((id) => (dietaryTags.find((d) => d.id === id) || {}).name).filter(Boolean),
  categoryNames: (ids) =>
    (ids || []).map((id) => (recipeCategories.find((c) => c.id === id) || {}).name).filter(Boolean),
  ingredientName: (id) => (ingredientById.get(id) || {}).name || '',
}

export const DATA = {
  ingredients,
  ingredientById,
  units,
  cuisines,
  dietaryTags,
  mealTypes,
  recipeCategories,
  seedRecipes,
}