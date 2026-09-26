import { useMemo, useState } from 'react'
import { PLACEHOLDER_IMAGE, lookups } from '../data/loadData.js'

export default function RecipePickerModal({ recipes, title, onPick, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = recipes.filter((r) => !q || r.title.toLowerCase().includes(q))
    return items.sort((a, b) => {
      const aScore = a.includeInMealSuggestions === false ? 1 : 0
      const bScore = b.includeInMealSuggestions === false ? 1 : 0
      return aScore - bScore || a.title.localeCompare(b.title)
    })
  }, [recipes, query])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title || 'Choose a recipe'}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <input
          className="modal-search"
          type="text"
          value={query}
          autoFocus
          placeholder="Search recipes…"
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="picker-list">
          {filtered.length === 0 && <p className="empty-hint">No recipes match your search.</p>}
          {filtered.map((r) => (
            <button
              type="button"
              key={r.id}
              className="picker-item"
              onClick={() => onPick(r.id)}
            >
              <img
                className="picker-thumb"
                src={r.coverImageUrl || PLACEHOLDER_IMAGE}
                alt=""
                onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER_IMAGE) e.currentTarget.src = PLACEHOLDER_IMAGE }}
              />
              <span className="picker-info">
                <span className="picker-title">{r.title}</span>
                <span className="picker-sub">
                  {lookups.mealTypeName(r.mealTypeId) || 'Meal'}
                  {lookups.cuisineName(r.cuisineId) ? ` · ${lookups.cuisineName(r.cuisineId)}` : ''}
                </span>
              </span>
              {r.includeInMealSuggestions === false && <span className="picker-suggestion-off">Not suggested</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}