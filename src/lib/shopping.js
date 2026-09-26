import { formatNumber } from './utils.js'

export const SHOPPING_CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

export function normalizeCategory(category) {
  if (SHOPPING_CATEGORY_ORDER.includes(category)) return category
  return 'Other'
}

export function quantityText(item) {
  const q = formatNumber(item.quantity)
  const unit = item.unit || ''
  if (unit === 'to taste' || unit === 'pinch') return unit
  if (!q || q === '0') return unit
  return unit ? `${q} ${unit}` : q
}

// Derive a grouped shopping list from every recipe that is currently placed
// in the weekly meal plan. Repeated ingredients are combined when the same
// ingredient uses the same unit.
export function buildShoppingList(recipes, mealPlan) {
  const recipeById = new Map(recipes.map((r) => [r.id, r]))
  const agg = new Map()

  Object.keys(mealPlan || {}).forEach((weekKey) => {
    const week = mealPlan[weekKey] || {}
    Object.keys(week).forEach((dayKey) => {
      const day = week[dayKey] || {}
      Object.keys(day).forEach((slot) => {
        const assignment = day[slot]
        if (!assignment || !assignment.recipeId) return
        const recipe = recipeById.get(assignment.recipeId)
        if (!recipe) return
        if (recipe.includeInShoppingList === false) return

        const sections = recipe.ingredientSections || []
        sections.forEach((section) => {
          ;(section.items || []).forEach((item) => {
            const name = (item.ingredientName || '').trim()
            if (!name) return
            const unit = (item.unit || '').trim().toLowerCase()
            const ingredientKey = item.ingredientId
              ? `id:${item.ingredientId}`
              : `custom:${name.toLowerCase()}`
            const itemKey = `${ingredientKey}|${unit}`
            const qty = Number(item.quantity)
            const numericQty = Number.isFinite(qty) ? qty : 0

            const existing = agg.get(itemKey)
            if (existing) {
              existing.quantity += numericQty
              existing.optionalAll = existing.optionalAll && !!item.optional
              existing.count += 1
            } else {
              agg.set(itemKey, {
                key: itemKey,
                ingredientKey,
                name,
                category: normalizeCategory(item.shoppingCategory),
                ingredientId: item.ingredientId || null,
                unit: (item.unit || '').trim(),
                quantity: numericQty,
                optionalAll: !!item.optional,
                count: 1,
              })
            }
          })
        })
      })
    })
  })

  const grouped = {}
  const orderedCategories = [...SHOPPING_CATEGORY_ORDER, 'Other']
  orderedCategories.forEach((cat) => {
    grouped[cat] = []
  })

  Array.from(agg.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((it) => grouped[it.category].push(it))

  return grouped
}

export function countShoppingItems(grouped, pantry, excludePantry) {
  let total = 0
  Object.keys(grouped).forEach((cat) => {
    grouped[cat].forEach((item) => {
      if (excludePantry && pantry && pantry.has(item.ingredientKey)) return
      total += 1
    })
  })
  return total
}