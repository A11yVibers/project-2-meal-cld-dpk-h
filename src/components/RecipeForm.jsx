import { useEffect, useMemo, useState } from 'react'
import { DATA, PLACEHOLDER_IMAGE, APPROVED_IMAGE_URLS } from '../data/loadData.js'
import { ACCENT_COLORS, MEAL_TYPE_TO_SLOT, SLOTS, SLOT_LABELS } from '../lib/constants.js'
import { addDays, formatWeekLabel, parseISODate, startOfWeek, toISODate } from '../lib/dates.js'
import { uid } from '../lib/utils.js'
import Combobox from './Combobox.jsx'

const SPICE_LABELS = ['Mild', 'Gentle', 'Medium', 'Spicy', 'Hot', 'Very spicy']

const emptyItem = () => ({
  uid: uid(),
  ingredientId: '',
  ingredientName: '',
  quantity: '',
  unit: '',
  optional: false,
})

const emptySection = (name = '') => ({ uid: uid(), name, items: [emptyItem()] })
const emptyStep = () => ({ uid: uid(), instruction: '', timerMinutes: '' })

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="toggle-row">
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        {hint ? <span className="toggle-hint">{hint}</span> : null}
      </span>
      <button
        type="button"
        className={'toggle' + (checked ? ' on' : '')}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="toggle-knob" />
      </button>
    </label>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={'segment' + (value === o.value ? ' active' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function RecipeForm({ onSave, onCancel }) {
  // Recipe details
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [cuisineId, setCuisineId] = useState('')
  const [mealTypeId, setMealTypeId] = useState('')
  const [dietaryIds, setDietaryIds] = useState([])
  const [categoryIds, setCategoryIds] = useState([])

  // Timing and yield
  const [servings, setServings] = useState(4)
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [spiceLevel, setSpiceLevel] = useState(0)

  // Image and appearance
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0])

  // Ingredients
  const [sections, setSections] = useState([emptySection('Main')])
  const [steps, setSteps] = useState([emptyStep()])

  // Recipe options menu
  const [includeInShoppingList, setIncludeInShoppingList] = useState(true)
  const [showNutrition, setShowNutrition] = useState(false)
  const [allowSubstitutions, setAllowSubstitutions] = useState(false)
  const [measurementSystem, setMeasurementSystem] = useState('us')

  // Meal-planning options
  const [includeInMealSuggestions, setIncludeInMealSuggestions] = useState(true)
  const [addToMealPlanNow, setAddToMealPlanNow] = useState(false)
  const [planDate, setPlanDate] = useState(toISODate(new Date()))
  const [planSlot, setPlanSlot] = useState('dinner')
  const [planTime, setPlanTime] = useState('')

  const [error, setError] = useState('')

  const ingredientOptions = useMemo(
    () => DATA.ingredients.map((i) => ({ id: i.id, name: i.name, category: i.category })),
    []
  )

  const totalTime = (Number(prepTime) || 0) + (Number(cookTime) || 0)

  useEffect(() => {
    setPlanSlot(MEAL_TYPE_TO_SLOT[mealTypeId] || 'dinner')
  }, [mealTypeId])

  // ----- ingredient section helpers -----
  function updateSection(secUid, patch) {
    setSections((prev) => prev.map((s) => (s.uid === secUid ? { ...s, ...patch } : s)))
  }
  function updateItem(secUid, itemUid, patch) {
    setSections((prev) =>
      prev.map((s) =>
        s.uid === secUid
          ? { ...s, items: s.items.map((it) => (it.uid === itemUid ? { ...it, ...patch } : it)) }
          : s
      )
    )
  }
  function addItem(secUid) {
    setSections((prev) => prev.map((s) => (s.uid === secUid ? { ...s, items: [...s.items, emptyItem()] } : s)))
  }
  function removeItem(secUid, itemUid) {
    setSections((prev) =>
      prev.map((s) => (s.uid === secUid ? { ...s, items: s.items.filter((it) => it.uid !== itemUid) } : s))
    )
  }
  function moveItem(secUid, index, dir) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.uid !== secUid) return s
        const items = [...s.items]
        const j = index + dir
        if (j < 0 || j >= items.length) return s
        ;[items[index], items[j]] = [items[j], items[index]]
        return { ...s, items }
      })
    )
  }
  function setItemName(secUid, itemUid, name) {
    updateItem(secUid, itemUid, { ingredientName: name, ingredientId: '' })
  }
  function pickIngredient(secUid, itemUid, option) {
    updateItem(secUid, itemUid, { ingredientName: option.name, ingredientId: option.id })
  }
  function addSection() {
    setSections((prev) => [...prev, emptySection('')])
  }
  function removeSection(secUid) {
    setSections((prev) => prev.filter((s) => s.uid !== secUid))
  }

  // ----- step helpers -----
  function updateStep(stepUid, patch) {
    setSteps((prev) => prev.map((st) => (st.uid === stepUid ? { ...st, ...patch } : st)))
  }
  function addStep() {
    setSteps((prev) => [...prev, emptyStep()])
  }
  function removeStep(stepUid) {
    setSteps((prev) => prev.filter((st) => st.uid !== stepUid))
  }
  function moveStep(index, dir) {
    setSteps((prev) => {
      const arr = [...prev]
      const j = index + dir
      if (j < 0 || j >= arr.length) return prev
      ;[arr[index], arr[j]] = [arr[j], arr[index]]
      return arr
    })
  }

  function planDateShift(days) {
    setPlanDate(toISODate(addDays(parseISODate(planDate), days)))
  }

  function validate() {
    if (!title.trim()) return 'Give your recipe a title.'
    const anyIngredient = sections.some((s) => s.items.some((it) => it.ingredientName.trim()))
    if (!anyIngredient) return 'Add at least one ingredient.'
    if (addToMealPlanNow && !planDate) return 'Choose a planned cooking date.'
    return ''
  }

  function buildRecipe() {
    const total = (Number(prepTime) || 0) + (Number(cookTime) || 0)
    return {
      id: 'U' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      sourceName: '',
      sourceUrl: sourceUrl.trim(),
      servings: Number(servings) || 1,
      prepTimeMinutes: Number(prepTime) || 0,
      cookTimeMinutes: Number(cookTime) || 0,
      totalTimeMinutes: total,
      cuisineId,
      mealTypeId,
      dietaryTagIds: dietaryIds,
      categoryIds,
      difficulty: 1,
      spiceLevel,
      accentColor,
      coverImageUrl: coverImageUrl.trim(),
      includeInMealSuggestions,
      includeInShoppingList,
      showNutrition,
      allowSubstitutions,
      measurementSystem,
      ingredientSections: sections
        .map((s) => ({
          name: s.name.trim() || 'Ingredients',
          items: s.items
            .filter((it) => it.ingredientName.trim())
            .map((it) => {
              const cat = it.ingredientId
                ? (DATA.ingredientById.get(it.ingredientId) || {}).category || 'Other'
                : 'Other'
              return {
                ingredientId: it.ingredientId,
                ingredientName: it.ingredientName.trim(),
                quantity: it.quantity,
                unit: it.unit,
                notes: '',
                optional: !!it.optional,
                shoppingCategory: cat,
              }
            }),
        }))
        .filter((s) => s.items.length > 0),
      steps: steps
        .filter((st) => st.instruction.trim())
        .map((st) => ({ instruction: st.instruction.trim(), timerMinutes: Number(st.timerMinutes) || 0 })),
      isUserCreated: true,
      createdAt: Date.now(),
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError('')
    const recipe = buildRecipe()
    const planConfig = addToMealPlanNow
      ? { date: planDate, slot: planSlot, time: planTime }
      : null
    onSave(recipe, planConfig)
  }

  function toggleMulti(list, setList, id) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <div className="page-head">
        <h1>Add a recipe</h1>
        <p>Fill in the details below. Use the lookup data from the supplied CSV files where applicable.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Recipe details */}
      <section className="form-section">
        <h2>Recipe details</h2>
        <div className="form-grid two">
          <label className="field">
            <span className="field-label">Recipe title *</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Honey Garlic Salmon Bowls" />
          </label>
          <label className="field">
            <span className="field-label">Source link</span>
            <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
          </label>
          <label className="field">
            <span className="field-label">Short description</span>
            <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="A one-line summary shown in the catalog" />
          </label>
          <label className="field">
            <span className="field-label">Cuisine</span>
            <select value={cuisineId} onChange={(e) => setCuisineId(e.target.value)}>
              <option value="">Select a cuisine…</option>
              {DATA.cuisines.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Primary meal type</span>
            <select value={mealTypeId} onChange={(e) => setMealTypeId(e.target.value)}>
              <option value="">Select a meal type…</option>
              {DATA.mealTypes.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <span className="field-label">Dietary suitability</span>
          <div className="chip-select">
            {DATA.dietaryTags.map((d) => (
              <button
                type="button"
                key={d.id}
                className={'chip' + (dietaryIds.includes(d.id) ? ' active' : '')}
                onClick={() => toggleMulti(dietaryIds, setDietaryIds, d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Recipe categories</span>
          <div className="chip-select">
            {DATA.recipeCategories.map((c) => (
              <button
                type="button"
                key={c.id}
                className={'chip' + (categoryIds.includes(c.id) ? ' active' : '')}
                onClick={() => toggleMulti(categoryIds, setCategoryIds, c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timing and yield */}
      <section className="form-section">
        <h2>Timing and yield</h2>
        <div className="form-grid four">
          <div className="field">
            <span className="field-label">Servings</span>
            <div className="stepper">
              <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))}>−</button>
              <input type="number" min="1" value={servings} onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))} />
              <button type="button" onClick={() => setServings((s) => s + 1)}>+</button>
            </div>
          </div>
          <label className="field">
            <span className="field-label">Prep time (min)</span>
            <input type="number" min="0" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="15" />
          </label>
          <label className="field">
            <span className="field-label">Cook time (min)</span>
            <input type="number" min="0" value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="25" />
          </label>
          <div className="field">
            <span className="field-label">Total time</span>
            <div className="total-time">{totalTime > 0 ? `${totalTime} min` : '—'}</div>
          </div>
        </div>
        <div className="field">
          <span className="field-label">Spice level: <strong>{SPICE_LABELS[spiceLevel]}</strong></span>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={spiceLevel}
            onChange={(e) => setSpiceLevel(Number(e.target.value))}
            className="spice-range"
          />
          <div className="spice-scale">
            <span>Mild</span>
            <span>Medium</span>
            <span>Very spicy</span>
          </div>
        </div>
      </section>

      {/* Image and appearance */}
      <section className="form-section">
        <h2>Image and appearance</h2>
        <div className="form-grid image-appearance">
          <div className="field">
            <span className="field-label">Cover image (URL)</span>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="Paste an image URL — the placeholder is used if blank"
            />
            <div className="field-note">Image files are not stored in the app; supply a remote image URL.</div>
            <div className="sample-images">
              {APPROVED_IMAGE_URLS.map((url) => (
                <button
                  type="button"
                  key={url}
                  className={'sample-image' + (coverImageUrl === url ? ' active' : '')}
                  onClick={() => setCoverImageUrl(url)}
                  title="Use this image"
                >
                  <img src={url} alt="" />
                </button>
              ))}
              <button type="button" className="link-button" onClick={() => setCoverImageUrl('')}>Use placeholder</button>
            </div>
          </div>
          <div className="field">
            <span className="field-label">Preview</span>
            <div className="cover-preview">
              <img
                src={coverImageUrl || PLACEHOLDER_IMAGE}
                alt="Cover preview"
                onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER_IMAGE) e.currentTarget.src = PLACEHOLDER_IMAGE }}
              />
            </div>
          </div>
        </div>
        <div className="field">
          <span className="field-label">Card accent color</span>
          <div className="color-swatches">
            {ACCENT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={'swatch' + (accentColor === c ? ' active' : '')}
                style={{ backgroundColor: c }}
                onClick={() => setAccentColor(c)}
                aria-label={`Accent colour ${c}`}
              />
            ))}
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="color-input" aria-label="Custom accent colour" />
          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="form-section">
        <h2>Ingredients</h2>
        {sections.map((section, si) => (
          <div className="ingredient-section" key={section.uid}>
            <div className="ingredient-section-head">
              <input
                type="text"
                className="section-name"
                value={section.name}
                onChange={(e) => updateSection(section.uid, { name: e.target.value })}
                placeholder={`Section ${si + 1} name (e.g. Sauce)`}
              />
              {sections.length > 1 && (
                <button type="button" className="link-button danger" onClick={() => removeSection(section.uid)}>Remove section</button>
              )}
            </div>
            {section.items.map((item, ii) => (
              <div className="ingredient-row" key={item.uid}>
                <div className="ingredient-reorder">
                  <button type="button" disabled={ii === 0} onClick={() => moveItem(section.uid, ii, -1)} aria-label="Move up">▲</button>
                  <button type="button" disabled={ii === section.items.length - 1} onClick={() => moveItem(section.uid, ii, 1)} aria-label="Move down">▼</button>
                </div>
                <Combobox
                  value={item.ingredientName}
                  options={ingredientOptions}
                  placeholder="Search ingredient…"
                  onChangeText={(name) => setItemName(section.uid, item.uid, name)}
                  onSelect={(option) => pickIngredient(section.uid, item.uid, option)}
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="qty-input"
                  value={item.quantity}
                  onChange={(e) => updateItem(section.uid, item.uid, { quantity: e.target.value })}
                  placeholder="Qty"
                  aria-label="Quantity"
                />
                <select
                  className="unit-select"
                  value={item.unit}
                  onChange={(e) => updateItem(section.uid, item.uid, { unit: e.target.value })}
                  aria-label="Unit"
                >
                  <option value="">unit</option>
                  {DATA.units.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <label className="optional-check">
                  <input
                    type="checkbox"
                    checked={item.optional}
                    onChange={(e) => updateItem(section.uid, item.uid, { optional: e.target.checked })}
                  />
                  Optional
                </label>
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => removeItem(section.uid, item.uid)}
                  disabled={section.items.length === 1}
                  aria-label="Remove ingredient"
                >×</button>
              </div>
            ))}
            <button type="button" className="add-row-button" onClick={() => addItem(section.uid)}>+ Add another ingredient</button>
          </div>
        ))}
        <button type="button" className="add-section-button" onClick={addSection}>+ Add another ingredient section</button>
      </section>

      {/* Method */}
      <section className="form-section">
        <h2>Method</h2>
        {steps.map((step, si) => (
          <div className="step-row" key={step.uid}>
            <div className="step-number">{si + 1}</div>
            <div className="step-reorder">
              <button type="button" disabled={si === 0} onClick={() => moveStep(si, -1)} aria-label="Move step up">▲</button>
              <button type="button" disabled={si === steps.length - 1} onClick={() => moveStep(si, 1)} aria-label="Move step down">▼</button>
            </div>
            <textarea
              rows={2}
              value={step.instruction}
              onChange={(e) => updateStep(step.uid, { instruction: e.target.value })}
              placeholder="Describe this cooking step…"
            />
            <label className="timer-input">
              <span>Timer</span>
              <input
                type="number"
                min="0"
                value={step.timerMinutes}
                onChange={(e) => updateStep(step.uid, { timerMinutes: e.target.value })}
                placeholder="min"
              />
            </label>
            <button
              type="button"
              className="icon-button danger"
              onClick={() => removeStep(step.uid)}
              disabled={steps.length === 1}
              aria-label="Remove step"
            >×</button>
          </div>
        ))}
        <button type="button" className="add-row-button" onClick={addStep}>+ Add a step</button>
      </section>

      {/* Meal-planning options */}
      <section className="form-section">
        <h2>Meal-planning options</h2>
        <Toggle
          label="Available in meal-plan suggestions"
          hint="Suggested recipes appear first when filling planner slots."
          checked={includeInMealSuggestions}
          onChange={setIncludeInMealSuggestions}
        />
        <Toggle
          label="Add to the meal plan now"
          hint="Schedule this recipe onto the weekly planner as soon as it is saved."
          checked={addToMealPlanNow}
          onChange={setAddToMealPlanNow}
        />

        {addToMealPlanNow && (
          <div className="plan-schedule">
            <div className="field">
              <span className="field-label">Meal-planning week</span>
              <div className="week-picker">
                <button type="button" onClick={() => planDateShift(-7)}>‹</button>
                <span className="week-picker-label">{formatWeekLabel(startOfWeek(parseISODate(planDate)))}</span>
                <button type="button" onClick={() => planDateShift(7)}>›</button>
              </div>
            </div>
            <label className="field">
              <span className="field-label">Planned cooking date</span>
              <input type="date" value={planDate} onChange={(e) => e.target.value && setPlanDate(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Meal slot</span>
              <select value={planSlot} onChange={(e) => setPlanSlot(e.target.value)}>
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{SLOT_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Planned serving time</span>
              <input type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} />
            </label>
            <p className="plan-summary">
              Planned for <strong>{parseISODate(planDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
              {planTime ? ` at ${planTime}` : ''} · {SLOT_LABELS[planSlot]}.
            </p>
          </div>
        )}
      </section>

      {/* Recipe options menu */}
      <section className="form-section">
        <h2>Recipe options</h2>
        <div className="options-menu">
          <Toggle
            label="Include ingredients in shopping lists"
            checked={includeInShoppingList}
            onChange={setIncludeInShoppingList}
          />
          <Toggle
            label="Show nutrition information"
            checked={showNutrition}
            onChange={setShowNutrition}
          />
          <Toggle
            label="Allow ingredient substitutions"
            checked={allowSubstitutions}
            onChange={setAllowSubstitutions}
          />
          <div className="option-row">
            <span className="toggle-text">
              <span className="toggle-label">Measurements</span>
              <span className="toggle-hint">Choose which unit system to prefer for this recipe.</span>
            </span>
            <Segmented
              options={[
                { value: 'us', label: 'US customary' },
                { value: 'metric', label: 'Metric' },
              ]}
              value={measurementSystem}
              onChange={setMeasurementSystem}
            />
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary">Save recipe</button>
      </div>
    </form>
  )
}