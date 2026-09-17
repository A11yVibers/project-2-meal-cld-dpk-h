import { useState } from 'react'
import { useApp } from '../store.jsx'
import {
  cuisineName,
  mealTypeName,
  dietaryTagNames,
  categoryNames,
} from '../lib/data.js'
import { formatIngredientAmount } from '../lib/units.js'
import { CoverImage, SpiceMeter, SpiceLabel, formatMinutes, Chip } from './shared.jsx'
import { todayKey, addDays, toDateKey, parseDateKey, mondayOf } from '../lib/date.js'
import { PLANNER_SLOTS } from '../lib/data.js'

export default function RecipeDetail({ recipe }) {
  const { setView, startEditRecipe, deleteRecipe, assignToSlot } = useApp()
  const [planOpen, setPlanOpen] = useState(false)

  if (!recipe) {
    return (
      <div className="empty-state">
        <p>Recipe not found.</p>
        <button className="btn btn-primary" onClick={() => setView('recipes')}>Back to catalog</button>
      </div>
    )
  }

  const isUserRecipe = !recipe.isSeed
  const system = recipe.options?.measurementSystem || 'us'
  const sections = groupIngredients(recipe.ingredients || [])

  return (
    <div className="recipe-detail">
      <div className="detail-topbar">
        <button className="btn btn-ghost" onClick={() => setView('recipes')}>← Back to catalog</button>
        <div className="detail-actions">
          {isUserRecipe && (
            <>
              <button className="btn btn-secondary" onClick={() => startEditRecipe(recipe.id)}>Edit</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`Delete "${recipe.title}"?`)) deleteRecipe(recipe.id)
                }}
              >
                Delete
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setPlanOpen(true)}>+ Add to meal plan</button>
        </div>
      </div>

      <div className="detail-hero" style={{ '--accent': recipe.accentColor || '#D97757' }}>
        <div className="detail-hero-img">
          <CoverImage url={recipe.coverImageUrl} title={recipe.title} />
        </div>
        <div className="detail-hero-info">
          <h1>{recipe.title}</h1>
          {recipe.shortDescription && <p className="detail-desc">{recipe.shortDescription}</p>}

          <div className="detail-tags">
            <Chip tone="accent">{mealTypeName(recipe.mealTypeId) || 'Recipe'}</Chip>
            <Chip>{cuisineName(recipe.cuisineId)}</Chip>
            {dietaryTagNames(recipe.dietaryTagIds || []).map((d) => (
              <Chip key={d} tone="green">{d}</Chip>
            ))}
            {categoryNames(recipe.categoryIds || []).map((c) => (
              <Chip key={c} tone="muted">{c}</Chip>
            ))}
          </div>

          {recipe.sourceUrl && (
            <p className="detail-source">
              Source:{' '}
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                {recipe.sourceName || recipe.sourceUrl}
              </a>
            </p>
          )}

          <div className="detail-stats">
            <Stat label="Servings" value={recipe.servings} />
            <Stat label="Prep" value={formatMinutes(recipe.prepTimeMinutes) || '—'} />
            <Stat label="Cook" value={formatMinutes(recipe.cookTimeMinutes) || '—'} />
            <Stat label="Total" value={formatMinutes(recipe.totalTimeMinutes) || '—'} />
            <div className="stat">
              <span className="stat-label">Spice</span>
              <span className="stat-value spice-value">
                <SpiceMeter level={recipe.spiceLevel} /> {SpiceLabel({ level: recipe.spiceLevel })}
              </span>
            </div>
          </div>

          {(recipe.options?.allowSubstitutions) && (
            <p className="option-note">🔁 Ingredient substitutions allowed for this recipe.</p>
          )}
        </div>
      </div>

      {recipe.options?.showNutrition && (
        <section className="detail-section nutrition-card">
          <h2>Nutrition</h2>
          <div className="nutrition-grid">
            <NutritionStat label="Calories" />
            <NutritionStat label="Protein" />
            <NutritionStat label="Carbs" />
            <NutritionStat label="Fat" />
          </div>
          <p className="subtle">Detailed nutrition information has not been configured for this recipe.</p>
        </section>
      )}

      <section className="detail-section">
        <h2>Ingredients</h2>
        {sections.map((section) => (
          <div key={section.name} className="ingredient-section">
            <h3 className="ingredient-section-title">{section.name}</h3>
            <ul className="ingredient-list">
              {section.items.map((ing, i) => (
                <li key={i} className="ingredient-row">
                  <span className="ingredient-amount">
                    {formatIngredientAmount(ing.quantity, ing.unit, system)}
                  </span>
                  <span className="ingredient-name">
                    {ing.ingredientName}
                    {ing.optional && <em className="optional-mark"> (optional)</em>}
                  </span>
                  {ing.notes && <span className="ingredient-notes">{ing.notes}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {sections.length === 0 && <p className="subtle">No ingredients recorded.</p>}
      </section>

      <section className="detail-section">
        <h2>Method</h2>
        <ol className="step-list">
          {(recipe.steps || []).map((step, i) => (
            <li key={i} className="step-row">
              <span className="step-number">{i + 1}</span>
              <span className="step-text">{step.instruction}</span>
              {step.timerMinutes > 0 && (
                <span className="step-timer" title="Suggested timer">⏱ {formatMinutes(step.timerMinutes)}</span>
              )}
            </li>
          ))}
        </ol>
        {(!recipe.steps || recipe.steps.length === 0) && <p className="subtle">No steps recorded.</p>}
      </section>

      {planOpen && (
        <PlanRecipeDialog
          recipe={recipe}
          onClose={() => setPlanOpen(false)}
          onSave={(dateKey, slot, time) => {
            assignToSlot(dateKey, slot, recipe.id, time)
            setPlanOpen(false)
          }}
        />
      )}
    </div>
  )
}

function groupIngredients(ingredients) {
  const order = []
  const map = new Map()
  for (const ing of ingredients) {
    const name = ing.sectionName?.trim() || 'Main'
    if (!map.has(name)) {
      map.set(name, [])
      order.push(name)
    }
    map.get(name).push(ing)
  }
  return order.map((name) => ({ name, items: map.get(name) }))
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

function NutritionStat({ label }) {
  return (
    <div className="nutrition-stat">
      <span className="nutrition-value">—</span>
      <span className="nutrition-label">{label}</span>
    </div>
  )
}

function PlanRecipeDialog({ recipe, onClose, onSave }) {
  const monday = mondayOf(new Date())
  const weekOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = addDays(monday, i * 7)
    return { key: toDateKey(d), label: `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` }
  })

  const [weekKey, setWeekKey] = useState(weekOptions[0].key)
  const [dateKey, setDateKey] = useState(weekOptions[0].key)
  const [slot, setSlot] = useState('dinner')
  const [time, setTime] = useState('')

  const selectedMonday = parseDateKey(weekKey)
  const dayKeys = Array.from({ length: 7 }).map((_, i) => toDateKey(addDays(selectedMonday, i)))

  function onWeekChange(key) {
    setWeekKey(key)
    setDateKey(key)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to meal plan</h2>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <p className="subtle">Plan “{recipe.title}”</p>

        <div className="form-row">
          <label className="field">
            <span>Meal-planning week</span>
            <select value={weekKey} onChange={(e) => onWeekChange(e.target.value)}>
              {weekOptions.map((w) => (
                <option key={w.key} value={w.key}>{w.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Planned date</span>
            <select value={dateKey} onChange={(e) => setDateKey(e.target.value)}>
              {dayKeys.map((k) => {
                const d = parseDateKey(k)
                return (
                  <option key={k} value={k}>
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    {k === todayKey() ? ' (today)' : ''}
                  </option>
                )
              })}
            </select>
          </label>
          <label className="field">
            <span>Meal / serving time</span>
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {PLANNER_SLOTS.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Time (optional)</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!dateKey}
            onClick={() => onSave(dateKey, slot, time || null)}
          >
            Add to plan
          </button>
        </div>
      </div>
    </div>
  )
}
