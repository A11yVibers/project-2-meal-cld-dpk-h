import { SHOPPING_CATEGORY_ORDER, quantityText } from '../lib/shopping.js'

export default function ShoppingList({
  grouped,
  checked,
  pantry,
  excludePantry,
  totalPlanned,
  onToggleChecked,
  onTogglePantry,
  onToggleExcludePantry,
}) {
  const categories = [...SHOPPING_CATEGORY_ORDER, 'Other'].filter((c) => (grouped[c] || []).length > 0)

  let visibleCount = 0
  let hiddenCount = 0
  Object.keys(grouped).forEach((cat) => {
    grouped[cat].forEach((item) => {
      const inPantry = pantry.has(item.ingredientKey)
      if (excludePantry && inPantry) hiddenCount += 1
      else visibleCount += 1
    })
  })

  const hasAnything = categories.length > 0

  return (
    <div className="shopping">
      <div className="page-head">
        <h1>Shopping list</h1>
        <p>
          Built from {totalPlanned} planned meal{totalPlanned === 1 ? '' : 's'} across all weeks.
          Repeated ingredients are combined automatically.
        </p>
      </div>

      <div className="shopping-toolbar">
        <div className="shopping-stats">
          <span className="stat-number">{visibleCount}</span> item{visibleCount === 1 ? '' : 's'} to buy
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={excludePantry} onChange={(e) => onToggleExcludePantry(e.target.checked)} />
          Hide items already in my pantry
          {hiddenCount > 0 ? <span className="hidden-note">({hiddenCount} hidden)</span> : null}
        </label>
      </div>

      {!hasAnything && (
        <div className="empty-state">
          <h3>Nothing to shop for yet</h3>
          <p>Add recipes to the weekly meal planner and your shopping list will appear here.</p>
        </div>
      )}

      {categories.map((cat) => {
        const items = grouped[cat].filter((item) => !(excludePantry && pantry.has(item.ingredientKey)))
        if (items.length === 0) return null
        return (
          <section className="shopping-category" key={cat}>
            <h2>{cat}</h2>
            <ul className="shopping-items">
              {items.map((item) => {
                const isChecked = checked.has(item.key)
                const inPantry = pantry.has(item.ingredientKey)
                return (
                  <li key={item.key} className={'shopping-item' + (isChecked ? ' checked' : '')}>
                    <label className="shopping-check">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleChecked(item.key)}
                      />
                      <span className="shopping-name">{item.name}</span>
                      <span className="shopping-qty">{quantityText(item)}</span>
                      {item.optionalAll ? <span className="optional-note">optional</span> : null}
                    </label>
                    <button
                      type="button"
                      className={'pantry-toggle' + (inPantry ? ' in-pantry' : '')}
                      onClick={() => onTogglePantry(item.ingredientKey)}
                      title={inPantry ? 'Remove from pantry' : 'Mark as already in pantry'}
                    >
                      {inPantry ? 'In pantry' : 'Have it'}
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