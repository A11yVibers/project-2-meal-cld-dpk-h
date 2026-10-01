import React, { useMemo, useState } from 'react'
import { Modal, EmptyState } from './ui.jsx'
import { RecipeImage } from './RecipeCard.jsx'
import { MEAL_SLOTS, MEAL_TYPES_BY_ID, CUISINES_BY_ID } from '../data.js'
import { startOfWeek, addDays, toISODate, weekKey } from '../store.js'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function RecipePicker({ recipes, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const [suggestionsOnly, setSuggestionsOnly] = useState(true)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      if (suggestionsOnly && r.includeInMealSuggestions === false) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        (r.shortDescription || '').toLowerCase().includes(q) ||
        (CUISINES_BY_ID[r.cuisineId]?.name || '').toLowerCase().includes(q)
      )
    })
  }, [recipes, query, suggestionsOnly])

  return (
    <Modal title="Choose a recipe" onClose={onClose}>
      <div className="picker-tools">
        <input
          type="search"
          className="picker-search"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="picker-opt">
          <input
            type="checkbox"
            checked={suggestionsOnly}
            onChange={(e) => setSuggestionsOnly(e.target.checked)}
          />
          Only meal-plan suggestions
        </label>
      </div>
      <div className="picker-list">
        {filtered.length === 0 && (
          <p className="picker-empty">No recipes match{suggestionsOnly ? ' (try unchecking suggestions-only)' : ''}.</p>
        )}
        {filtered.map((r) => (
          <button type="button" className="picker-item" key={r.id} onClick={() => onPick(r.id)}>
            <RecipeImage src={r.coverImageUrl} alt={r.title} />
            <span className="picker-item-info">
              <strong>{r.title}</strong>
              <span className="picker-item-meta">
                {r.mealTypeId && MEAL_TYPES_BY_ID[r.mealTypeId]?.name}
                {r.cuisineId ? ` · ${CUISINES_BY_ID[r.cuisineId]?.name}` : ''} · {r.totalTimeMinutes} min
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default function Planner({ recipes, schedule, onAssign, onRemove, onOpenRecipe, onOpenCatalog }) {
  const [week, setWeek] = useState(() => startOfWeek(new Date()))
  const [picker, setPicker] = useState(null) // { dayIndex, slotKey }
  const [activeSlot, setActiveSlot] = useState(null) // { dayIndex, slotKey, recipeId } for filled slot menu

  const wk = weekKey(week)
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week])

  const todayKey = toISODate(new Date())

  const hasAnyPlan = useMemo(() => Object.keys(schedule).some((w) => Object.keys(schedule[w] || {}).length > 0), [schedule])

  const slotFor = (dayIndex, slotKey) => schedule[wk]?.[dayIndex]?.[slotKey] || null

  const assignInPicker = (recipeId) => {
    onAssign(wk, picker.dayIndex, picker.slotKey, recipeId)
    setPicker(null)
  }

  return (
    <div className="planner">
      <div className="planner-head">
        <h2>Weekly meal planner</h2>
        <div className="week-nav">
          <button type="button" className="btn ghost small" onClick={() => setWeek(addDays(week, -7))}>
            ‹ Previous week
          </button>
          <span className="week-label">
            {week.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
            {addDays(week, 6).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button type="button" className="btn ghost small" onClick={() => setWeek(addDays(week, 7))}>
            Next week ›
          </button>
          <button type="button" className="btn ghost small" onClick={() => setWeek(startOfWeek(new Date()))}>
            Today
          </button>
        </div>
      </div>

      {!hasAnyPlan && (
        <EmptyState
          icon="📅"
          title="Nothing planned yet"
          hint="Click an empty meal slot to assign a recipe, or plan from a recipe's detail page."
          action={
            <button type="button" className="btn primary" onClick={onOpenCatalog}>
              Browse recipes
            </button>
          }
        />
      )}

      <div className="planner-scroll">
      <div className="planner-grid" role="grid">
        <div className="planner-corner" />
        {days.map((d, i) => (
          <div
            key={i}
            className={'planner-day-head' + (toISODate(d) === todayKey ? ' today' : '')}
          >
            <span className="day-name">{DAY_NAMES[i]}</span>
            <span className="day-date">{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        ))}

        {MEAL_SLOTS.map((slot) => (
          <React.Fragment key={slot.key}>
            <div className="planner-slot-label">{slot.label}</div>
            {Array.from({ length: 7 }, (_, di) => {
              const recipeId = slotFor(di, slot.key)
              const recipe = recipeId ? recipes.find((r) => r.id === recipeId) : null
              return (
                <div key={di} className="planner-cell">
                  {recipe ? (
                    <button
                      type="button"
                      className="slot-card"
                      style={{ '--accent': recipe.accentColor || '#8A9A5B' }}
                      onClick={() => setActiveSlot({ dayIndex: di, slotKey: slot.key, recipeId })}
                    >
                      <RecipeImage src={recipe.coverImageUrl} alt={recipe.title} />
                      <span className="slot-card-title">{recipe.title}</span>
                    </button>
                  ) : (
                    <button type="button" className="slot-add" onClick={() => setPicker({ dayIndex: di, slotKey: slot.key })}>
                      + Add recipe
                    </button>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      </div>

      {picker && <RecipePicker recipes={recipes} onPick={assignInPicker} onClose={() => setPicker(null)} />}

      {activeSlot && (() => {
        const recipe = recipes.find((r) => r.id === activeSlot.recipeId)
        const slotLabel = MEAL_SLOTS.find((s) => s.key === activeSlot.slotKey)?.label
        const dateLabel = addDays(week, activeSlot.dayIndex).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
        return (
          <Modal title={`${slotLabel} · ${dateLabel}`} onClose={() => setActiveSlot(null)}>
            {recipe ? (
              <div className="slot-menu">
                <RecipeImage src={recipe.coverImageUrl} alt={recipe.title} />
                <p className="slot-menu-title">{recipe.title}</p>
                <div className="btn-col">
                  <button type="button" className="btn primary" onClick={() => { const id = recipe.id; setActiveSlot(null); onOpenRecipe(id) }}>
                    Open recipe
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      const { dayIndex, slotKey } = activeSlot
                      setActiveSlot(null)
                      setPicker({ dayIndex, slotKey })
                    }}
                  >
                    Replace recipe
                  </button>
                  <button
                    type="button"
                    className="btn ghost danger-text"
                    onClick={() => {
                      onRemove(wk, activeSlot.dayIndex, activeSlot.slotKey)
                      setActiveSlot(null)
                    }}
                  >
                    Remove from plan
                  </button>
                </div>
              </div>
            ) : (
              <p>This recipe is no longer available.</p>
            )}
          </Modal>
        )
      })()}
    </div>
  )
}