import React, { useMemo, useRef, useState } from 'react'
import { Switch } from './ui.jsx'
import { RecipeImage } from './RecipeCard.jsx'
import {
  CUISINES,
  DIETARY_TAGS,
  INGREDIENTS,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  UNITS,
  ACCENT_PALETTE,
  SPICE_LABELS,
  MEAL_SLOTS,
} from '../data.js'
import { makeId, startOfWeek, toISODate, deriveSlotFromHour, parseISODate } from '../store.js'

function FieldSection({ title, hint, children }) {
  return (
    <section className="form-section">
      <h2 className="form-section-title">{title}</h2>
      {hint && <p className="form-section-hint">{hint}</p>}
      {children}
    </section>
  )
}

const blankIngredient = (sectionName = 'Main') => ({
  id: makeId(),
  ingredientId: '',
  ingredientName: '',
  category: 'Other',
  quantity: '1',
  unit: '',
  notes: '',
  optional: false,
})

const blankSection = (name = 'Main') => ({
  id: makeId(),
  name,
  rows: [blankIngredient(name)],
})

const blankStep = () => ({ id: makeId(), instruction: '', timerMinutes: '' })

const clampInt = (v, min, max) => {
  const n = parseInt(v, 10)
  if (Number.isNaN(n)) return min
  if (max !== undefined) return Math.max(min, Math.min(max, n))
  return Math.max(min, n)
}

function numOrEmpty(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function IngredientSelect({ value, onChange }) {
  // Native datalist gives free-text typing plus supplied lookup suggestions.
  return (
    <span className="ingredient-select">
      <input
        list="ingredients-list"
        value={value.ingredientName}
        onChange={(e) => {
          const name = e.target.value
          const match = INGREDIENTS.find(
            (i) => i.name.toLowerCase() === name.trim().toLowerCase()
          )
          onChange({
            ingredientId: match ? match.id : '',
            ingredientName: name,
            category: match ? match.category : 'Other',
          })
        }}
        placeholder="Search ingredient…"
        aria-label="Ingredient"
      />
      <datalist id="ingredients-list">
        {INGREDIENTS.map((i) => (
          <option key={i.id} value={i.name} />
        ))}
      </datalist>
      <span className="ingredient-category" title="Shopping category">
        {value.category || 'Other'}
      </span>
    </span>
  )
}

function IngredientsEditor({ sections, onChange }) {
  const move = (arr, from, dir) => {
    const to = from + dir
    if (to < 0 || to >= arr.length) return arr
    const copy = [...arr]
    ;[copy[from], copy[to]] = [copy[to], copy[from]]
    return copy
  }

  const updateSection = (id, patch) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const updateRows = (sectionId, rows) =>
    onChange(sections.map((s) => (s.id === sectionId ? { ...s, rows } : s)))

  const updateRow = (sectionId, rowId, patch) =>
    updateRows(
      sectionId,
      sections.find((s) => s.id === sectionId).rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    )

  return (
    <div className="ingredients-editor">
      {sections.map((section, si) => (
        <div className="ingredient-section" key={section.id}>
          <div className="ingredient-section-head">
            <input
              className="section-name-input"
              value={section.name}
              onChange={(e) => updateSection(section.id, { name: e.target.value })}
              placeholder="Section name (e.g. Main, Sauce, Garnish)"
              aria-label="Ingredient section name"
            />
            <div className="row-controls">
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChange(move(sections, si, -1))}
                disabled={si === 0}
                title="Move section up"
                aria-label="Move section up"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChange(move(sections, si, 1))}
                disabled={si === sections.length - 1}
                title="Move section down"
                aria-label="Move section down"
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => onChange(sections.filter((s) => s.id !== section.id))}
                disabled={sections.length === 1}
                title="Remove section"
                aria-label="Remove section"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="ingredient-row ingredient-row-head">
            <span>Ingredient</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Notes</span>
            <span className="opt-head">Optional</span>
            <span />
          </div>

          {section.rows.map((row, ri) => (
            <div className="ingredient-row" key={row.id}>
              <IngredientSelect
                value={row}
                onChange={(patch) => updateRow(section.id, row.id, patch)}
              />
              <input
                className="qty-input"
                type="text"
                inputMode="decimal"
                value={row.quantity}
                onChange={(e) => updateRow(section.id, row.id, { quantity: e.target.value })}
                placeholder="0"
                aria-label="Quantity"
              />
              <select
                className="unit-input"
                value={row.unit}
                onChange={(e) => updateRow(section.id, row.id, { unit: e.target.value })}
                aria-label="Unit"
              >
                <option value="">—</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                className="notes-input"
                type="text"
                value={row.notes}
                onChange={(e) => updateRow(section.id, row.id, { notes: e.target.value })}
                placeholder="e.g. diced"
                aria-label="Notes"
              />
              <label className="opt-toggle" title="Optional ingredient">
                <input
                  type="checkbox"
                  checked={!!row.optional}
                  onChange={(e) => updateRow(section.id, row.id, { optional: e.target.checked })}
                  aria-label="Optional ingredient"
                />
              </label>
              <div className="row-controls">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => updateRows(section.id, move(section.rows, ri, -1))}
                  disabled={ri === 0}
                  title="Move ingredient up"
                  aria-label="Move ingredient up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => updateRows(section.id, move(section.rows, ri, 1))}
                  disabled={ri === section.rows.length - 1}
                  title="Move ingredient down"
                  aria-label="Move ingredient down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() =>
                    updateRows(
                      section.id,
                      section.rows.filter((r) => r.id !== row.id)
                    )
                  }
                  disabled={section.rows.length === 1}
                  title="Remove ingredient"
                  aria-label="Remove ingredient"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn ghost small"
            onClick={() => updateRows(section.id, [...section.rows, blankIngredient(section.name)])}
          >
            + Add ingredient
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn ghost"
        onClick={() => onChange([...sections, blankSection('')])}
      >
        + Add ingredient section
      </button>
    </div>
  )
}

function StepsEditor({ steps, onChange }) {
  const move = (arr, from, dir) => {
    const to = from + dir
    if (to < 0 || to >= arr.length) return arr
    const copy = [...arr]
    ;[copy[from], copy[to]] = [copy[to], copy[from]]
    return copy
  }
  const updateStep = (id, patch) =>
    onChange(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  return (
    <div className="steps-editor">
      {steps.map((step, i) => (
        <div className="step-row" key={step.id}>
          <span className="step-num">{i + 1}</span>
          <textarea
            rows={2}
            value={step.instruction}
            onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
            placeholder="Describe this cooking step…"
            aria-label={`Step ${i + 1} instruction`}
          />
          <label className="step-timer-field">
            <span>⏱ min</span>
            <input
              type="number"
              min="0"
              value={step.timerMinutes}
              onChange={(e) => updateStep(step.id, { timerMinutes: e.target.value })}
              placeholder="0"
              aria-label={`Step ${i + 1} timer in minutes`}
            />
          </label>
          <div className="row-controls">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onChange(move(steps, i, -1))}
              disabled={i === 0}
              title="Move step up"
              aria-label="Move step up"
            >
              ↑
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => onChange(move(steps, i, 1))}
              disabled={i === steps.length - 1}
              title="Move step down"
              aria-label="Move step down"
            >
              ↓
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => onChange(steps.filter((s) => s.id !== step.id))}
              disabled={steps.length === 1}
              title="Remove step"
              aria-label="Remove step"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={() => onChange([...steps, blankStep()])}>
        + Add step
      </button>
    </div>
  )
}

function resizeImageFile(file, cb) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const max = 800
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      cb(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => cb('')
    img.src = reader.result
  }
  reader.readAsDataURL(file)
}

export default function RecipeForm({ onSave, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    cuisineId: '',
    mealTypeId: '',
    dietaryTagIds: [],
    categoryIds: [],
    servings: 4,
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    spiceLevel: 0,
    accentColor: ACCENT_PALETTE[0],
    coverImageUpload: '',
    coverImageUrl: '',
    sections: [blankSection('Main')],
    steps: [blankStep()],
    includeInMealSuggestions: true,
    options: {
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurementSystem: 'us',
    },
    plan: {
      add: false,
      week: toISODate(startOfWeek(new Date())),
      date: toISODate(new Date()),
      slot: 'dinner',
      dateTime: '',
    },
  }))
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const setOptions = (patch) => setDraft((d) => ({ ...d, options: { ...d.options, ...patch } }))
  const setPlan = (patch) => setDraft((d) => ({ ...d, plan: { ...d.plan, ...patch } }))

  const totalTimeMinutes = useMemo(
    () => Math.max(0, numOrEmpty(draft.prepTimeMinutes)) + Math.max(0, numOrEmpty(draft.cookTimeMinutes)),
    [draft.prepTimeMinutes, draft.cookTimeMinutes]
  )

  const toggleArray = (arr, val) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]

  const handlePlanWeekChange = (week) => {
    const monday = startOfWeek(parseISODate(week))
    const newDay = (!draft.plan.date || parseISODate(draft.plan.date) < monday || parseISODate(draft.plan.date) > addDaysSafe(monday, 6))
      ? toISODate(monday)
      : draft.plan.date
    setPlan({ week, date: newDay })
  }

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) resizeImageFile(file, (dataUrl) => setDraft((d) => ({ ...d, coverImageUpload: dataUrl })))
    e.target.value = ''
  }

  const submit = () => {
    if (!draft.title.trim()) {
      setError('Please give your recipe a title.')
      return
    }
    setError('')

    const ingredients = []
    for (const section of draft.sections) {
      for (const row of section.rows) {
        if (!row.ingredientName.trim()) continue
        ingredients.push({
          sectionName: section.name.trim() || 'Main',
          ingredientId: row.ingredientId,
          ingredientName: row.ingredientName.trim(),
          category: row.category || 'Other',
          quantity: row.quantity,
          unit: row.unit,
          notes: row.notes.trim(),
          optional: !!row.optional,
        })
      }
    }

    const steps = draft.steps
      .filter((s) => s.instruction.trim())
      .map((s, i) => ({
        stepNumber: i + 1,
        instruction: s.instruction.trim(),
        timerMinutes: numOrEmpty(s.timerMinutes),
      }))

    const prep = Math.max(0, numOrEmpty(draft.prepTimeMinutes))
    const cook = Math.max(0, numOrEmpty(draft.cookTimeMinutes))

    const recipe = {
      id: 'U' + Date.now().toString(36) + makeId(),
      isUserCreated: true,
      title: draft.title.trim(),
      shortDescription: draft.shortDescription.trim(),
      sourceName: draft.sourceName.trim(),
      sourceUrl: draft.sourceUrl.trim(),
      servings: clampInt(draft.servings, 1),
      prepTimeMinutes: prep,
      cookTimeMinutes: cook,
      totalTimeMinutes: prep + cook,
      cuisineId: draft.cuisineId,
      mealTypeId: draft.mealTypeId,
      dietaryTagIds: draft.dietaryTagIds,
      categoryIds: draft.categoryIds,
      difficulty: 2,
      spiceLevel: clampInt(draft.spiceLevel, 0, 5),
      accentColor: draft.accentColor,
      coverImageUrl: draft.coverImageUrl.trim() || draft.coverImageUpload || '',
      includeInMealSuggestions: !!draft.includeInMealSuggestions,
      options: { ...draft.options },
      ingredients,
      steps,
    }

    let planInfo = null
    if (draft.plan.add) {
      if (draft.plan.dateTime) {
        const dt = parseISODate(draft.plan.dateTime.slice(0, 10))
        const hour = Number(draft.plan.dateTime.slice(11, 13)) || 12
        planInfo = { date: toISODate(dt), slot: deriveSlotFromHour(hour) }
      } else if (draft.plan.date) {
        planInfo = { date: draft.plan.date, slot: draft.plan.slot }
      }
    }

    onSave(recipe, planInfo)
  }

  return (
    <div className="recipe-form-wrap">
      <div className="recipe-form-header">
        <div>
          <h1>New recipe</h1>
          <p>Fill in the details below, then save to add it to your catalog.</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={submit}>
            Save recipe
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {/* 1. Recipe details */}
      <FieldSection title="Recipe details">
        <div className="form-grid">
          <label className="field span-2">
            <span className="field-label">
              Recipe title <span className="req">*</span>
            </span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Honey Garlic Salmon Bowls"
            />
          </label>
          <label className="field span-2">
            <span className="field-label">Short description (optional)</span>
            <input
              type="text"
              value={draft.shortDescription}
              onChange={(e) => set({ shortDescription: e.target.value })}
              placeholder="A one-line summary shown on the recipe card"
            />
          </label>
          <label className="field">
            <span className="field-label">Source name (optional)</span>
            <input
              type="text"
              value={draft.sourceName}
              onChange={(e) => set({ sourceName: e.target.value })}
              placeholder="e.g. Grandma's kitchen"
            />
          </label>
          <label className="field">
            <span className="field-label">Source link (optional)</span>
            <input
              type="url"
              value={draft.sourceUrl}
              onChange={(e) => set({ sourceUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>
          <label className="field">
            <span className="field-label">Cuisine</span>
            <select value={draft.cuisineId} onChange={(e) => set({ cuisineId: e.target.value })}>
              <option value="">Select cuisine…</option>
              {CUISINES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Primary meal type</span>
            <select value={draft.mealTypeId} onChange={(e) => set({ mealTypeId: e.target.value })}>
              <option value="">Select meal type…</option>
              {MEAL_TYPES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="tag-group">
          <legend>Dietary suitability</legend>
          <div className="chip-select">
            {DIETARY_TAGS.map((t) => {
              const active = draft.dietaryTagIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  className={'chip-toggle' + (active ? ' active' : '')}
                  aria-pressed={active}
                  onClick={() => set({ dietaryTagIds: toggleArray(draft.dietaryTagIds, t.id) })}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        </fieldset>
        <fieldset className="tag-group">
          <legend>Recipe categories</legend>
          <div className="chip-select">
            {RECIPE_CATEGORIES.map((c) => {
              const active = draft.categoryIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  className={'chip-toggle' + (active ? ' active' : '')}
                  aria-pressed={active}
                  onClick={() => set({ categoryIds: toggleArray(draft.categoryIds, c.id) })}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </fieldset>
      </FieldSection>

      {/* 2. Timing and yield */}
      <FieldSection title="Timing and yield">
        <div className="form-grid timing-grid">
          <label className="field">
            <span className="field-label">Servings</span>
            <div className="stepper">
              <button
                type="button"
                className="icon-btn"
                onClick={() => set({ servings: Math.max(1, clampInt(draft.servings, 1) - 1) })}
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className="stepper-value">{clampInt(draft.servings, 1)}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => set({ servings: clampInt(draft.servings, 1) + 1 })}
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </label>
          <label className="field">
            <span className="field-label">Prep time (minutes)</span>
            <input
              type="number"
              min="0"
              value={draft.prepTimeMinutes}
              onChange={(e) => set({ prepTimeMinutes: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Cook time (minutes)</span>
            <input
              type="number"
              min="0"
              value={draft.cookTimeMinutes}
              onChange={(e) => set({ cookTimeMinutes: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Total time (auto)</span>
            <input type="text" value={`${totalTimeMinutes} min`} readOnly disabled />
          </label>
        </div>
        <div className="spice-control">
          <span className="field-label">Spice level</span>
          <div className="spice-segment" role="radiogroup" aria-label="Spice level">
            {SPICE_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={draft.spiceLevel === i}
                className={'spice-option' + (draft.spiceLevel === i ? ' active' : '')}
                onClick={() => set({ spiceLevel: i })}
                title={label}
              >
                <span className="peppers">{'🌶'.repeat(i + 1)}</span>
                <span className="spice-name">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </FieldSection>

      {/* 3. Image and appearance */}
      <FieldSection title="Image and appearance">
        <div className="appearance-grid">
          <div className="cover-preview">
            <RecipeImage src={draft.coverImageUrl || draft.coverImageUpload} alt="Cover preview" />
            {!draft.coverImageUrl && !draft.coverImageUpload && (
              <span className="cover-hint">Placeholder used if no image</span>
            )}
          </div>
          <div className="cover-controls">
            <label className="field">
              <span className="field-label">Cover image</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <div className="btn-row">
                <button type="button" className="btn ghost" onClick={() => fileRef.current && fileRef.current.click()}>
                  Upload image
                </button>
                {draft.coverImageUpload && (
                  <button type="button" className="btn ghost danger-text" onClick={() => set({ coverImageUpload: '' })}>
                    Remove upload
                  </button>
                )}
              </div>
              <span className="field-hint">…or paste an image URL below.</span>
            </label>
            <label className="field">
              <span className="field-label">Image URL (alternative)</span>
              <input
                type="url"
                value={draft.coverImageUrl}
                onChange={(e) => set({ coverImageUrl: e.target.value })}
                placeholder="https://…"
              />
            </label>
          </div>
        </div>
        <div className="accent-control">
          <span className="field-label">Card accent color</span>
          <div className="swatch-row" role="radiogroup" aria-label="Card accent color">
            {ACCENT_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={draft.accentColor === color}
                aria-label={`Accent color ${color}`}
                className={'swatch' + (draft.accentColor === color ? ' active' : '')}
                style={{ background: color }}
                onClick={() => set({ accentColor: color })}
              />
            ))}
          </div>
        </div>
      </FieldSection>

      {/* 4. Ingredients */}
      <FieldSection
        title="Ingredients"
        hint="Organise ingredients into sections such as Main, Sauce or Garnish."
      >
        <IngredientsEditor
          sections={draft.sections}
          onChange={(sections) => set({ sections })}
        />
      </FieldSection>

      {/* 5. Method */}
      <FieldSection title="Method" hint="Add numbered cooking steps, each with an optional timer.">
        <StepsEditor steps={draft.steps} onChange={(steps) => set({ steps })} />
      </FieldSection>

      {/* 6. Meal planning options */}
      <FieldSection title="Meal planning options">
        <div className="options-panel">
          <Switch
            checked={draft.includeInMealSuggestions}
            onChange={(v) => set({ includeInMealSuggestions: v })}
            label="Make recipe available in meal-plan suggestions"
          />
          <Switch
            checked={draft.plan.add}
            onChange={(v) => setPlan({ add: v })}
            label="Immediately add this recipe to the meal plan"
          />
        </div>
        {draft.plan.add && (
          <div className="form-grid plan-grid">
            <label className="field">
              <span className="field-label">Meal-planning week (Monday)</span>
              <input
                type="date"
                value={draft.plan.week}
                onChange={(e) => handlePlanWeekChange(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Planned cooking date</span>
              <input
                type="date"
                value={draft.plan.date}
                onChange={(e) => setPlan({ date: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Planned serving time</span>
              <select value={draft.plan.slot} onChange={(e) => setPlan({ slot: e.target.value })}>
                {MEAL_SLOTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Specific date &amp; time (overrides above)</span>
              <input
                type="datetime-local"
                value={draft.plan.dateTime}
                onChange={(e) => setPlan({ dateTime: e.target.value })}
              />
              <span className="field-hint">
                When set, the exact date determines the week and the time of day selects the meal
                slot.
              </span>
            </label>
          </div>
        )}
      </FieldSection>

      {/* 7. Recipe options menu */}
      <FieldSection title="Recipe options">
        <div className="options-panel">
          <Switch
            checked={draft.options.includeInShoppingList}
            onChange={(v) => setOptions({ includeInShoppingList: v })}
            label="Include ingredients in generated shopping lists"
          />
          <Switch
            checked={draft.options.showNutrition}
            onChange={(v) => setOptions({ showNutrition: v })}
            label="Show nutrition information"
          />
          <Switch
            checked={draft.options.allowSubstitutions}
            onChange={(v) => setOptions({ allowSubstitutions: v })}
            label="Allow ingredient substitutions"
          />
        </div>
        <div className="unit-choice">
          <span className="field-label">Measurements</span>
          <div className="segmented" role="radiogroup" aria-label="Measurement system">
            <button
              type="button"
              role="radio"
              aria-checked={draft.options.measurementSystem === 'us'}
              className={'segment' + (draft.options.measurementSystem === 'us' ? ' active' : '')}
              onClick={() => setOptions({ measurementSystem: 'us' })}
            >
              US customary
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={draft.options.measurementSystem === 'metric'}
              className={'segment' + (draft.options.measurementSystem === 'metric' ? ' active' : '')}
              onClick={() => setOptions({ measurementSystem: 'metric' })}
            >
              Metric
            </button>
          </div>
        </div>
      </FieldSection>

      <div className="recipe-form-footer">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn primary" onClick={submit}>
          Save recipe
        </button>
      </div>
    </div>
  )
}

function addDaysSafe(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}