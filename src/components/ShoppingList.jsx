import React, { useMemo, useState } from 'react'
import { Switch, EmptyState } from './ui.jsx'
import { SHOPPING_CATEGORIES } from '../data.js'

function fmtNumber(n) {
  if (!Number.isFinite(n)) return ''
  const rounded = Math.round(n * 100) / 100
  return String(rounded)
}

function buildItems(schedule, recipes) {
  const map = new Map()
  for (const days of Object.values(schedule)) {
    for (const slots of Object.values(days)) {
      for (const recipeId of Object.values(slots)) {
        const recipe = recipes.find((r) => r.id === recipeId)
        if (!recipe) continue
        if (recipe.options && recipe.options.includeInShoppingList === false) continue
        for (const ing of recipe.ingredients || []) {
          const name = (ing.ingredientName || '').trim()
          if (!name) continue
          const key = name.toLowerCase() + '|' + (ing.unit || '').trim().toLowerCase()
          const n = parseFloat(ing.quantity)
          const numeric = Number.isFinite(n)
          const existing = map.get(key)
          if (existing) {
            if (numeric) existing.numericTotal += n
            else if (ing.quantity) existing.nonNumeric.push(String(ing.quantity).trim())
            existing.optional = existing.optional || !!ing.optional
            existing.count += 1
          } else {
            map.set(key, {
              key,
              name,
              unit: ing.unit || '',
              category: ing.category || 'Other',
              numeric,
              numericTotal: numeric ? n : 0,
              nonNumeric: numeric || !ing.quantity ? [] : [String(ing.quantity).trim()],
              optional: !!ing.optional,
              count: 1,
            })
          }
        }
      }
    }
  }
  return [...map.values()]
}

export default function ShoppingList({
  schedule,
  recipes,
  pantry,
  onTogglePantry,
  checked,
  onToggleChecked,
  onClearChecked,
  onOpenPlanner,
}) {
  const [hidePantry, setHidePantry] = useState(false)

  const items = useMemo(() => buildItems(schedule, recipes), [schedule, recipes])

  const grouped = useMemo(() => {
    const out = {}
    for (const item of items) {
      const cat = SHOPPING_CATEGORIES.includes(item.category) ? item.category : 'Other'
      ;(out[cat] = out[cat] || []).push(item)
    }
    for (const cat of Object.keys(out)) {
      out[cat].sort((a, b) => a.name.localeCompare(b.name))
    }
    return out
  }, [items])

  const inPantry = (name) => pantry.includes(name.trim().toLowerCase())

  const visibleCategories = SHOPPING_CATEGORIES.filter((cat) => grouped[cat] && grouped[cat].length > 0)

  const totalToBuy = items.filter((i) => !checked[i.key] && !inPantry(i.name)).length

  return (
    <div className="shopping-list">
      <div className="shopping-head">
        <h2>Shopping list</h2>
        <p className="shopping-sub">
          {items.length === 0
            ? 'Generated automatically from the recipes in your meal plan.'
            : `${totalToBuy} item${totalToBuy === 1 ? '' : 's'} left to buy · ${items.length} planned`}
        </p>
        <div className="shopping-controls">
          <Switch checked={hidePantry} onChange={setHidePantry} label="Hide pantry items" />
          {items.length > 0 && (
            <button type="button" className="btn ghost small" onClick={onClearChecked}>
              Clear checked
            </button>
          )}
        </div>
      </div>

      {items.length === 0 && (
        <EmptyState
          icon="🛒"
          title="No ingredients to shop for"
          hint="Add recipes to your weekly meal plan and your shopping list will appear here."
          action={
            <button type="button" className="btn primary" onClick={onOpenPlanner}>
              Open planner
            </button>
          }
        />
      )}

      {items.length > 0 && visibleCategories.length === 0 && (
        <p className="picker-empty">Everything here is in your pantry — uncheck “Hide pantry items” to see it.</p>
      )}

      {visibleCategories.map((cat) => {
        const catItems = grouped[cat].filter((i) => !(hidePantry && inPantry(i.name)))
        if (catItems.length === 0) return null
        return (
          <section className="shop-category" key={cat}>
            <h3>{cat}</h3>
            <ul className="shop-items">
              {catItems.map((item) => {
                const isChecked = !!checked[item.key]
                const pantry = inPantry(item.name)
                const qtyBits = []
                if (item.numeric && item.numericTotal > 0) qtyBits.push(fmtNumber(item.numericTotal))
                for (const q of item.nonNumeric) if (q) qtyBits.push(q)
                return (
                  <li key={item.key} className={'shop-item' + (isChecked ? ' checked' : '') + (pantry ? ' pantry' : '')}>
                    <label className="shop-check">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleChecked(item.key)}
                        aria-label={`Mark ${item.name} as purchased`}
                      />
                      <span className="shop-checkbox" aria-hidden="true" />
                      <span className="shop-name">
                        {item.name}
                        {item.optional && <em className="shop-optional"> · optional</em>}
                        {item.count > 1 && <span className="shop-count" title="Used in multiple recipes"> ×{item.count}</span>}
                      </span>
                    </label>
                    <span className="shop-qty">
                      {qtyBits.length > 0 && <span className="shop-qty-num">{qtyBits.join(' + ')}</span>}
                      <span className="shop-unit">{item.unit}</span>
                    </span>
                    <button
                      type="button"
                      className={'pantry-btn' + (pantry ? ' active' : '')}
                      onClick={() => onTogglePantry(item.name)}
                      title={pantry ? 'You already have this — click to remove from pantry' : 'Mark as already in your pantry'}
                      aria-pressed={pantry}
                    >
                      {pantry ? 'In pantry' : 'I have this'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}