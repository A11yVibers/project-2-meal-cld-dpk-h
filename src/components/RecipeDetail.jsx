import React, { useState } from 'react'
import { Modal } from './ui.jsx'
import { RecipeImage } from './RecipeCard.jsx'
import {
  CUISINES_BY_ID,
  MEAL_TYPES_BY_ID,
  DIETARY_TAGS_BY_ID,
  RECIPE_CATEGORIES_BY_ID,
  MEAL_SLOTS,
  difficultyLabel,
  spiceLabel,
  estimateNutrition,
} from '../data.js'
import { toISODate, startOfWeek, addDays } from '../store.js'

function formatTime(min) {
  const total = Number(min) || 0
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const sectionOrder = (sectionsArr) => {
  const seen = []
  for (const s of sectionsArr) {
    if (!seen.includes(s)) seen.push(s)
  }
  return seen
}

const MEAL_TYPE_TO_SLOT = { MT01: 'breakfast', MT02: 'lunch', MT03: 'dinner', MT04: 'snack' }

export default function RecipeDetail({ recipe, onClose, onAssign }) {
  const [planPickerOpen, setPlanPickerOpen] = useState(false)
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [slot, setSlot] = useState(() => MEAL_TYPE_TO_SLOT[recipe.mealTypeId] || 'dinner')

  const nutrition = estimateNutrition(recipe)
  const grouped = {}
  for (const ing of recipe.ingredients || []) {
    const sec = ing.sectionName || 'Ingredients'
    ;(grouped[sec] = grouped[sec] || []).push(ing)
  }
  const sectionNames = sectionOrder((recipe.ingredients || []).map((i) => i.sectionName || 'Ingredients'))

  const handleAssign = () => {
    onAssign(date, slot)
    setPlanPickerOpen(false)
  }

  return (
    <Modal title="" wide onClose={onClose}>
      <div className="recipe-detail">
        <div className="detail-hero">
          <div className="detail-hero-img">
            <RecipeImage src={recipe.coverImageUrl} alt={recipe.title} />
          </div>
          <div className="detail-hero-info">
            {recipe.isUserCreated && <span className="my-recipe-badge">My recipe</span>}
            <h2>{recipe.title}</h2>
            {recipe.shortDescription && <p className="detail-desc">{recipe.shortDescription}</p>}
            {recipe.sourceName && (
              <p className="detail-source">
                Source:{' '}
                {recipe.sourceUrl ? (
                  <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                    {recipe.sourceName}
                  </a>
                ) : (
                  recipe.sourceName
                )}
              </p>
            )}
            <div className="chip-row">
              {recipe.cuisineId && <span className="chip">{CUISINES_BY_ID[recipe.cuisineId]?.name}</span>}
              {recipe.mealTypeId && (
                <span className="chip chip-solid">{MEAL_TYPES_BY_ID[recipe.mealTypeId]?.name}</span>
              )}
              {recipe.dietaryTagIds.map((id) => (
                <span key={id} className="chip chip-diet">
                  {DIETARY_TAGS_BY_ID[id]?.name}
                </span>
              ))}
              {recipe.categoryIds.map((id) => (
                <span key={id} className="chip chip-cat">
                  {RECIPE_CATEGORIES_BY_ID[id]?.name}
                </span>
              ))}
            </div>
            <div className="detail-stats">
              <div className="stat">
                <strong>{recipe.servings}</strong>
                <span>servings</span>
              </div>
              <div className="stat">
                <strong>{formatTime(recipe.prepTimeMinutes)}</strong>
                <span>prep</span>
              </div>
              <div className="stat">
                <strong>{formatTime(recipe.cookTimeMinutes)}</strong>
                <span>cook</span>
              </div>
              <div className="stat">
                <strong>{formatTime(recipe.totalTimeMinutes)}</strong>
                <span>total</span>
              </div>
              <div className="stat">
                <strong>{'🌶'.repeat(Math.min(5, recipe.spiceLevel) || 0) || '–'}</strong>
                <span>{spiceLabel(recipe.spiceLevel)}</span>
              </div>
              <div className="stat">
                <strong>{difficultyLabel(recipe.difficulty)}</strong>
                <span>difficulty</span>
              </div>
            </div>
            <div className="detail-actions">
              <button type="button" className="btn primary" onClick={() => setPlanPickerOpen(true)}>
                + Add to meal plan
              </button>
            </div>
          </div>
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <section className="detail-section">
            <h3>Ingredients</h3>
            {recipe.options && recipe.options.allowSubstitutions && (
              <p className="detail-note">🔁 Substitutions are allowed for this recipe.</p>
            )}
            {sectionNames.map((sec) => (
              <div key={sec} className="ingredient-group">
                <h4>{sec}</h4>
                <ul className="ingredient-list">
                  {grouped[sec].map((ing, i) => (
                    <li key={i} className={ing.optional ? 'optional' : ''}>
                      <span className="ing-qty">
                        {ing.quantity && ing.quantity !== '' ? ing.quantity : ''}{' '}
                        {ing.unit}
                      </span>
                      <span className="ing-name">
                        {ing.ingredientName}
                        {ing.notes ? <em> · {ing.notes}</em> : null}
                      </span>
                      {ing.optional && <span className="tag-optional">optional</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {recipe.steps && recipe.steps.length > 0 && (
          <section className="detail-section">
            <h3>Method</h3>
            <ol className="step-list">
              {recipe.steps.map((s) => (
                <li key={s.stepNumber}>
                  <span className="step-num">{s.stepNumber}</span>
                  <span className="step-text">{s.instruction}</span>
                  {s.timerMinutes > 0 && <span className="step-timer">⏱ {s.timerMinutes} min</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {recipe.options && recipe.options.showNutrition && (
          <section className="detail-section">
            <h3>Nutrition</h3>
            <p className="detail-note">Estimated values per serving (for illustration only).</p>
            <div className="nutrition-grid">
              <div className="nutrition-cell">
                <strong>{nutrition.calories}</strong>
                <span>kcal</span>
              </div>
              <div className="nutrition-cell">
                <strong>{nutrition.protein}g</strong>
                <span>protein</span>
              </div>
              <div className="nutrition-cell">
                <strong>{nutrition.carbs}g</strong>
                <span>carbs</span>
              </div>
              <div className="nutrition-cell">
                <strong>{nutrition.fat}g</strong>
                <span>fat</span>
              </div>
            </div>
          </section>
        )}

        {planPickerOpen && (
          <div className="plan-picker">
            <h3>Add to meal plan</h3>
            <div className="form-grid two">
              <label className="field">
                <span className="field-label">Cooking date</span>
                <input
                  type="date"
                  value={date}
                  min={toISODate(addDays(startOfWeek(new Date()), 0))}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Serving time</span>
                <select value={slot} onChange={(e) => setSlot(e.target.value)}>
                  {MEAL_SLOTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="btn-row">
              <button type="button" className="btn primary" onClick={handleAssign}>
                Add to {slot}
              </button>
              <button type="button" className="btn ghost" onClick={() => setPlanPickerOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}