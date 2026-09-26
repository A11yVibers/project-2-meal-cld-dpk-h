import { useState } from 'react'
import { PLACEHOLDER_IMAGE, lookups } from '../data/loadData.js'
import { DIFFICULTY_LABELS, SLOTS, SLOT_LABELS } from '../lib/constants.js'
import { toISODate } from '../lib/dates.js'
import { formatMinutes } from '../lib/utils.js'
import { SpiceMeter } from './RecipeCard.jsx'

export default function RecipeDetail({ recipe, onBack, onAddToPlan }) {
  const [date, setDate] = useState(toISODate(new Date()))
  const [slot, setSlot] = useState('dinner')
  const [time, setTime] = useState('')
  const [error, setError] = useState('')

  const total = recipe.totalTimeMinutes || recipe.prepTimeMinutes + recipe.cookTimeMinutes
  const dietary = lookups.dietaryNames(recipe.dietaryTagIds)
  const categories = lookups.categoryNames(recipe.categoryIds)

  function handleAdd(e) {
    e.preventDefault()
    if (!date) {
      setError('Choose a date.')
      return
    }
    setError('')
    onAddToPlan(recipe.id, date, slot, time)
  }

  return (
    <div className="detail">
      <button type="button" className="back-link" onClick={onBack}>‹ Back to recipes</button>

      <header className="detail-header" style={{ '--accent': recipe.accentColor || '#D97757' }}>
        <div className="detail-image">
          <img
            src={recipe.coverImageUrl || PLACEHOLDER_IMAGE}
            alt={recipe.title}
            onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER_IMAGE) e.currentTarget.src = PLACEHOLDER_IMAGE }}
          />
        </div>
        <div className="detail-heading">
          <h1>{recipe.title}</h1>
          {recipe.shortDescription && <p className="detail-desc">{recipe.shortDescription}</p>}
          <div className="detail-meta">
            <span className="meta-item"><strong>{lookups.mealTypeName(recipe.mealTypeId) || 'Meal'}</strong></span>
            {lookups.cuisineName(recipe.cuisineId) ? <span className="meta-item">{lookups.cuisineName(recipe.cuisineId)}</span> : null}
            <span className="meta-item">{recipe.servings} servings</span>
            {recipe.prepTimeMinutes ? <span className="meta-item">Prep {formatMinutes(recipe.prepTimeMinutes)}</span> : null}
            {recipe.cookTimeMinutes ? <span className="meta-item">Cook {formatMinutes(recipe.cookTimeMinutes)}</span> : null}
            {total ? <span className="meta-item">Total {formatMinutes(total)}</span> : null}
          </div>
          <div className="detail-submeta">
            <span className="spice-wrap">
              Spice <SpiceMeter level={recipe.spiceLevel} />
            </span>
            {DIFFICULTY_LABELS[recipe.difficulty] ? (
              <span className="meta-item">Difficulty: {DIFFICULTY_LABELS[recipe.difficulty]}</span>
            ) : null}
            <span className="meta-item">Measurements: {recipe.measurementSystem === 'metric' ? 'Metric' : 'US customary'}</span>
          </div>

          {dietary.length > 0 && (
            <div className="tag-list">
              {dietary.map((d) => <span key={d} className="tag tag-dietary">{d}</span>)}
            </div>
          )}
          {categories.length > 0 && (
            <div className="tag-list">
              {categories.map((c) => <span key={c} className="tag tag-category">{c}</span>)}
            </div>
          )}

          {(recipe.showNutrition || recipe.allowSubstitutions || recipe.includeInShoppingList === false) && (
            <div className="detail-flags">
              {recipe.includeInShoppingList === false && <span className="flag">Excluded from shopping lists</span>}
              {recipe.showNutrition && <span className="flag">Nutrition shown</span>}
              {recipe.allowSubstitutions && <span className="flag">Substitutions allowed</span>}
            </div>
          )}

          {recipe.sourceUrl ? (
            <p className="detail-source">
              Source: <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{recipe.sourceUrl}</a>
            </p>
          ) : null}
        </div>
      </header>

      <section className="detail-plan">
        <h2>Add to meal plan</h2>
        <form className="detail-plan-form" onSubmit={handleAdd}>
          <label className="field">
            <span className="field-label">Cooking date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Meal slot</span>
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SLOTS.map((s) => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Serving time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <button type="submit" className="button button-primary">Plan this recipe</button>
        </form>
        {error && <div className="form-error">{error}</div>}
      </section>

      <section className="detail-section">
        <h2>Ingredients</h2>
        {recipe.ingredientSections.map((section, i) => (
          <div className="ingredient-group" key={i}>
            <h3>{section.name}</h3>
            <ul className="ingredient-list">
              {section.items.map((it, j) => (
                <li key={j}>
                  <span className="ingredient-amount">
                    {it.quantity}{it.unit ? ' ' + it.unit : ''}
                  </span>
                  <span className="ingredient-name">
                    {it.ingredientName}
                    {it.optional ? <em className="optional-note"> (optional)</em> : null}
                    {it.notes ? <em className="notes-note"> — {it.notes}</em> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="detail-section">
        <h2>Method</h2>
        <ol className="step-list">
          {recipe.steps.map((step, i) => (
            <li key={i}>
              <div className="step-text">
                <span className="step-index">{i + 1}</span>
                <span>{step.instruction}</span>
              </div>
              {step.timerMinutes > 0 && <span className="step-timer">Timer: {formatMinutes(step.timerMinutes)}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}