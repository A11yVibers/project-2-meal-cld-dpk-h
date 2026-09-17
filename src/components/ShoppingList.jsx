import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import { SHOPPING_CATEGORIES, INGREDIENT_NAMES } from '../lib/data.js'

export default function ShoppingList() {
  const {
    shopping,
    shoppingList,
    checked,
    toggleChecked,
    clearChecked,
    pantrySet,
    addPantryItem,
    removePantryItem,
  } = useApp()
  const [excludePantry, setExcludePantry] = useState(false)
  const [pantryInput, setPantryInput] = useState('')

  const visible = useMemo(
    () =>
      shoppingList.filter(
        (item) => !excludePantry || !pantrySet.has(item.name.toLowerCase())
      ),
    [shoppingList, excludePantry, pantrySet]
  )

  const grouped = useMemo(() => {
    const groups = new Map()
    for (const item of visible) {
      if (!groups.has(item.category)) groups.set(item.category, [])
      groups.get(item.category).push(item)
    }
    return SHOPPING_CATEGORIES.filter((c) => groups.has(c)).map((c) => ({
      category: c,
      items: groups.get(c),
    }))
  }, [visible])

  const total = visible.length
  const done = visible.filter((i) => checked[i.key]).length

  function submitPantry(e) {
    e.preventDefault()
    addPantryItem(pantryInput)
    setPantryInput('')
  }

  return (
    <div className="shopping">
      <div className="shopping-header">
        <div>
          <h1>Shopping List</h1>
          <p className="subtle">
            Auto-generated from the recipes in your weekly meal plan.
          </p>
        </div>
        <div className="shopping-actions">
          <button className="btn btn-ghost" onClick={clearChecked} disabled={done === 0}>
            Clear checked
          </button>
        </div>
      </div>

      <div className="shopping-controls">
        <label className="check-row inline">
          <input
            type="checkbox"
            checked={excludePantry}
            onChange={(e) => setExcludePantry(e.target.checked)}
          />
          <span>Exclude ingredients I already have (pantry)</span>
        </label>
        <div className="progress">
          <div className="progress-bar" style={{ width: total ? `${(done / total) * 100}%` : '0%' }} />
        </div>
        <span className="progress-label">{done}/{total} items</span>
      </div>

      {shoppingList.length === 0 ? (
        <div className="empty-state">
          <p>Your shopping list is empty.</p>
          <p className="subtle">Add recipes to the weekly meal plan to generate your list.</p>
        </div>
      ) : (
        <div className="shopping-groups">
          {grouped.map(({ category, items }) => (
            <div key={category} className="shopping-group">
              <h2 className="shopping-category">{category}</h2>
              <ul className="shopping-items">
                {items.map((item) => {
                  const isChecked = !!checked[item.key]
                  const amount =
                    [item.quantity, item.unit].filter(Boolean).join(' ') || ''
                  return (
                    <li key={item.key} className={`shopping-item ${isChecked ? 'checked' : ''}`}>
                      <label className="shopping-item-main">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecked(item.key)}
                        />
                        <span className="shopping-name">
                          {item.name}
                          {item.optional && <em className="optional-mark"> (optional)</em>}
                        </span>
                        {amount && <span className="shopping-amount">{amount}</span>}
                      </label>
                      <span className="shopping-item-side">
                        <span className="shopping-recipes" title={item.recipes.join('\n')}>
                          {item.recipes.length} {item.recipes.length === 1 ? 'recipe' : 'recipes'}
                        </span>
                        {!pantrySet.has(item.name.toLowerCase()) && (
                          <button
                            className="mini-btn"
                            title="Mark as already in my pantry"
                            onClick={() => addPantryItem(item.name)}
                          >
                            Have it
                          </button>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {visible.length === 0 && <p className="subtle">All items are in your pantry. 🎉</p>}
        </div>
      )}

      <section className="pantry-section">
        <h2>My pantry</h2>
        <p className="subtle">Ingredients you already have at home can be excluded from the list above.</p>
        <form className="pantry-add" onSubmit={submitPantry}>
          <input
            type="text"
            list="ingredient-list"
            value={pantryInput}
            onChange={(e) => setPantryInput(e.target.value)}
            placeholder="Add an ingredient you already have…"
          />
          <datalist id="ingredient-list">
            {INGREDIENT_NAMES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <button type="submit" className="btn btn-secondary">Add</button>
        </form>
        {(shopping.pantry || []).length > 0 && (
          <div className="pantry-tags">
            {(shopping.pantry || []).map((name) => (
              <span key={name} className="pantry-tag">
                {name}
                <button type="button" onClick={() => removePantryItem(name)} title="Remove">✕</button>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
