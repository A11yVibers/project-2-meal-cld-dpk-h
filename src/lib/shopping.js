// Derives a combined shopping list from the recipes currently placed in the
// weekly meal plan.

import { categoryForIngredient, SHOPPING_CATEGORIES } from './data.js'
import { PLANNER_SLOTS } from './data.js'

function parseQty(q) {
  const s = String(q).trim()
  if (!s) return null
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function formatQty(n) {
  return Number(n.toFixed(2)).toString()
}

function normalizeUnit(u) {
  const s = (u || '').trim().toLowerCase()
  if (!s) return '—'
  return s
}

export function ingredientItemKey(name, unit) {
  return `${(name || '').trim().toLowerCase()}::${normalizeUnit(unit)}`
}

// Build the aggregated list. `recipesById` maps id -> recipe; `mealPlan` is the
// date-keyed slot map. Returns an array of grouped items.
export function buildShoppingList(recipesById, mealPlan) {
  const groups = new Map()

  for (const dateKey of Object.keys(mealPlan || {})) {
    const day = mealPlan[dateKey] || {}
    for (const slot of PLANNER_SLOTS) {
      const entry = day[slot.key]
      if (!entry || !entry.recipeId) continue
      const recipe = recipesById[entry.recipeId]
      if (!recipe) continue
      if (recipe.options && recipe.options.includeInShoppingList === false) continue

      for (const ing of recipe.ingredients || []) {
        const name = (ing.ingredientName || '').trim()
        if (!name) continue
        const unit = normalizeUnit(ing.unit)
        const key = ingredientItemKey(name, unit)
        const category = categoryForIngredient(name)

        if (!groups.has(key)) {
          groups.set(key, {
            key,
            name,
            unit: ing.unit || '',
            category,
            quantities: [],
            optional: ing.optional === true,
            recipes: [],
          })
        }
        const g = groups.get(key)
        if (ing.optional === true) g.optional = true
        if (ing.quantity != null && ing.quantity !== '') g.quantities.push(String(ing.quantity))
        if (!g.recipes.includes(recipe.title)) g.recipes.push(recipe.title)
      }
    }
  }

  const items = Array.from(groups.values()).map((g) => {
    const parsed = g.quantities.map(parseQty)
    let quantity
    if (parsed.length === 0) {
      quantity = ''
    } else if (parsed.every((n) => n != null)) {
      const total = parsed.reduce((a, b) => a + b, 0)
      quantity = formatQty(total)
    } else {
      // Mixed/unknown quantities: list them.
      quantity = g.quantities.join(' + ')
    }
    return {
      key: g.key,
      name: g.name,
      category: g.category,
      quantity,
      unit: g.unit,
      optional: g.optional,
      recipes: g.recipes,
    }
  })

  // Sort by category order, then name.
  const catOrder = Object.fromEntries(SHOPPING_CATEGORIES.map((c, i) => [c, i]))
  items.sort((a, b) => {
    const ca = catOrder[a.category] ?? 999
    const cb = catOrder[b.category] ?? 999
    if (ca !== cb) return ca - cb
    return a.name.localeCompare(b.name)
  })

  return items
}
