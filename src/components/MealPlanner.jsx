import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import {
  weekDayKeys,
  addDays,
  parseDateKey,
  formatDayLabel,
  isToday,
  mondayOf,
} from '../lib/date.js'
import { PLANNER_SLOTS, mealTypeName } from '../lib/data.js'
import { CoverImage, SpiceMeter, formatMinutes } from './shared.jsx'

export default function MealPlanner() {
  const { recipesById, mealPlan, assignToSlot, removeFromSlot, openRecipe } = useApp()
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [picker, setPicker] = useState(null) // { dateKey, slot }

  const dayKeys = useMemo(() => weekDayKeys(weekStart), [weekStart])

  const weekLabel = useMemo(() => {
    const start = parseDateKey(dayKeys[0])
    const end = parseDateKey(dayKeys[6])
    const opts = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`
  }, [dayKeys])

  function shiftWeek(dir) {
    setWeekStart((d) => addDays(d, dir * 7))
  }

  return (
    <div className="planner">
      <div className="planner-header">
        <h1>Weekly Meal Planner</h1>
        <div className="week-nav">
          <button className="btn btn-ghost" onClick={() => shiftWeek(-1)}>←</button>
          <button className="btn btn-ghost" onClick={() => setWeekStart(mondayOf(new Date()))}>This week</button>
          <button className="btn btn-ghost" onClick={() => shiftWeek(1)}>→</button>
        </div>
        <span className="week-label">{weekLabel}</span>
      </div>

      <div className="planner-grid">
        <div className="planner-corner">Meal</div>
        {dayKeys.map((k) => {
          const { weekday, monthDay } = formatDayLabel(k)
          return (
            <div key={k} className={`planner-day-head ${isToday(k) ? 'today' : ''}`}>
              <span className="day-weekday">{weekday}</span>
              <span className="day-monthday">{monthDay}</span>
            </div>
          )
        })}

        {PLANNER_SLOTS.map((slot) => (
          <SlotRow
            key={slot.key}
            slot={slot}
            dayKeys={dayKeys}
            mealPlan={mealPlan}
            recipesById={recipesById}
            onPick={(dateKey) => setPicker({ dateKey, slot: slot.key })}
            onRemove={removeFromSlot}
            onOpen={openRecipe}
          />
        ))}
      </div>

      <p className="subtle planner-hint">
        Select an empty slot to assign a recipe, or select a filled slot to replace it. Changes are saved automatically.
      </p>

      {picker && (
        <RecipePicker
          slot={picker.slot}
          dateKey={picker.dateKey}
          onClose={() => setPicker(null)}
          onSelect={(recipeId) => {
            assignToSlot(picker.dateKey, picker.slot, recipeId, null)
            setPicker(null)
          }}
        />
      )}
    </div>
  )
}

function SlotRow({ slot, dayKeys, mealPlan, recipesById, onPick, onRemove, onOpen }) {
  return (
    <>
      <div className="planner-slot-label">{slot.name}</div>
      {dayKeys.map((dateKey) => {
        const entry = mealPlan[dateKey]?.[slot.key]
        const recipe = entry?.recipeId ? recipesById[entry.recipeId] : null
        return (
          <div key={dateKey} className={`planner-cell ${recipe ? 'filled' : 'empty'}`}>
            {recipe ? (
              <div className="planned-recipe" style={{ '--accent': recipe.accentColor || '#D97757' }}>
                <button className="planned-main" onClick={() => onPick(dateKey)} title="Replace recipe">
                  <CoverImage url={recipe.coverImageUrl} title={recipe.title} />
                  <span className="planned-title">{recipe.title}</span>
                  {entry.time && <span className="planned-time">🕐 {entry.time}</span>}
                </button>
                <div className="planned-actions">
                  <button className="mini-btn" onClick={() => onOpen(recipe.id)} title="View recipe">View</button>
                  <button className="mini-btn danger" onClick={() => onRemove(dateKey, slot.key)} title="Remove">✕</button>
                </div>
              </div>
            ) : (
              <button className="empty-slot" onClick={() => onPick(dateKey)} aria-label={`Add ${slot.name}`}>
                + Add
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}

function RecipePicker({ slot, dateKey, onClose, onSelect }) {
  const { recipes } = useApp()
  const [query, setQuery] = useState('')
  const [suggestionsOnly, setSuggestionsOnly] = useState(true)

  const slotName = PLANNER_SLOTS.find((s) => s.key === slot)?.name || slot
  const dateLabel = parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      if (suggestionsOnly && r.includeInMealSuggestions === false) return false
      if (q && !`${r.title} ${r.shortDescription || ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [recipes, query, suggestionsOnly])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Choose a recipe</h2>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <p className="subtle">
          {slotName} · {dateLabel}
        </p>

        <div className="picker-toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search recipes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <label className="check-row inline">
            <input
              type="checkbox"
              checked={suggestionsOnly}
              onChange={(e) => setSuggestionsOnly(e.target.checked)}
            />
            <span>Only meal-plan suggestions</span>
          </label>
        </div>

        <div className="picker-list">
          {filtered.length === 0 && <p className="subtle">No recipes found.</p>}
          {filtered.map((r) => (
            <button key={r.id} className="picker-row" onClick={() => onSelect(r.id)}>
              <CoverImage url={r.coverImageUrl} title={r.title} />
              <div className="picker-row-info">
                <span className="picker-title">{r.title}</span>
                <span className="picker-meta">
                  {mealTypeName(r.mealTypeId) || 'Recipe'} · {formatMinutes(r.totalTimeMinutes) || '—'} ·{' '}
                  <SpiceMeter level={r.spiceLevel} />
                </span>
              </div>
              <span className="picker-add">+</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
