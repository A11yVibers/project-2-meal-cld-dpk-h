import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import {
  CUISINES,
  MEAL_TYPES,
  DIETARY_TAGS,
  RECIPE_CATEGORIES,
  INGREDIENT_NAMES,
  UNIT_NAMES,
  INGREDIENT_CATEGORY_MAP,
  PLANNER_SLOTS,
  PLACEHOLDER_IMAGE,
  DEFAULT_RECIPE_OPTIONS,
} from '../lib/data.js'
import { addDays, toDateKey, parseDateKey, mondayOf } from '../lib/date.js'

const ACCENT_COLORS = [
  '#D97757', '#E07A5F', '#E0A458', '#C9A227', '#8A9A5B', '#5B8A72',
  '#3D5A80', '#6C5B7B', '#B56576', '#9C6644', '#4A4E69', '#7F8C8D',
]

const newIngredient = (sectionName = 'Main') => ({
  sectionName,
  ingredientName: '',
  ingredientId: '',
  quantity: '',
  unit: '',
  notes: '',
  optional: false,
})

const newStep = () => ({ instruction: '', timerMinutes: '' })

function buildInitial(recipe) {
  if (recipe) {
    return {
      title: recipe.title || '',
      shortDescription: recipe.shortDescription || '',
      sourceName: recipe.sourceName || '',
      sourceUrl: recipe.sourceUrl || '',
      cuisineId: recipe.cuisineId || '',
      mealTypeId: recipe.mealTypeId || '',
      dietaryTagIds: recipe.dietaryTagIds || [],
      categoryIds: recipe.categoryIds || [],
      servings: recipe.servings || 4,
      prepTimeMinutes: recipe.prepTimeMinutes || '',
      cookTimeMinutes: recipe.cookTimeMinutes || '',
      spiceLevel: recipe.spiceLevel ?? 2,
      accentColor: recipe.accentColor || ACCENT_COLORS[0],
      coverImageUrl: recipe.coverImageUrl || '',
      includeInMealSuggestions: recipe.includeInMealSuggestions !== false,
      ingredients:
        recipe.ingredients && recipe.ingredients.length
          ? recipe.ingredients.map((i) => ({
              sectionName: i.sectionName || 'Main',
              ingredientName: i.ingredientName || '',
              ingredientId: i.ingredientId || '',
              quantity: i.quantity ?? '',
              unit: i.unit || '',
              notes: i.notes || '',
              optional: !!i.optional,
            }))
          : [newIngredient()],
      steps:
        recipe.steps && recipe.steps.length
          ? recipe.steps.map((s) => ({ instruction: s.instruction || '', timerMinutes: s.timerMinutes || '' }))
          : [newStep()],
      options: { ...DEFAULT_RECIPE_OPTIONS, ...(recipe.options || {}) },
      addToPlan: false,
      planWeek: '',
      planDate: '',
      planSlot: 'dinner',
      planTime: '',
    }
  }
  return {
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    cuisineId: '',
    mealTypeId: '',
    dietaryTagIds: [],
    categoryIds: [],
    servings: 4,
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    spiceLevel: 2,
    accentColor: ACCENT_COLORS[0],
    coverImageUrl: '',
    includeInMealSuggestions: true,
    ingredients: [newIngredient()],
    steps: [newStep()],
    options: { ...DEFAULT_RECIPE_OPTIONS },
    addToPlan: false,
    planWeek: '',
    planDate: '',
    planSlot: 'dinner',
    planTime: '',
  }
}

export default function RecipeForm({ recipe }) {
  const { addRecipe, updateRecipe, assignToSlot, setView, openRecipe } = useApp()
  const [form, setForm] = useState(() => buildInitial(recipe))
  const [error, setError] = useState('')

  const isEdit = Boolean(recipe)

  const weekOptions = useMemo(() => {
    const monday = mondayOf(new Date())
    return Array.from({ length: 6 }).map((_, i) => {
      const d = addDays(monday, i * 7)
      return { key: toDateKey(d), label: `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` }
    })
  }, [])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setOptions(key, value) {
    setForm((f) => ({ ...f, options: { ...f.options, [key]: value } }))
  }

  function toggleInList(listKey, id) {
    setForm((f) => {
      const list = f[listKey] || []
      return {
        ...f,
        [listKey]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      }
    })
  }

  // ---- Ingredients ---------------------------------------------------------

  function updateIngredient(index, patch) {
    setForm((f) => {
      const ingredients = f.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing))
      return { ...f, ingredients }
    })
  }

  function addIngredient() {
    setForm((f) => {
      const last = f.ingredients[f.ingredients.length - 1]
      const sectionName = last?.sectionName || 'Main'
      return { ...f, ingredients: [...f.ingredients, newIngredient(sectionName)] }
    })
  }

  function addSection() {
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, newIngredient(`Section ${f.ingredients.length + 1}`)],
    }))
  }

  function removeIngredient(index) {
    setForm((f) => {
      const ingredients = f.ingredients.filter((_, i) => i !== index)
      return { ...f, ingredients: ingredients.length ? ingredients : [newIngredient()] }
    })
  }

  function moveIngredient(index, dir) {
    setForm((f) => {
      const ingredients = [...f.ingredients]
      const target = index + dir
      if (target < 0 || target >= ingredients.length) return f
      ;[ingredients[index], ingredients[target]] = [ingredients[target], ingredients[index]]
      return { ...f, ingredients }
    })
  }

  // ---- Steps ---------------------------------------------------------------

  function updateStep(index, patch) {
    setForm((f) => {
      const steps = f.steps.map((s, i) => (i === index ? { ...s, ...patch } : s))
      return { ...f, steps }
    })
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, newStep()] }))
  }

  function removeStep(index) {
    setForm((f) => {
      const steps = f.steps.filter((_, i) => i !== index)
      return { ...f, steps: steps.length ? steps : [newStep()] }
    })
  }

  function moveStep(index, dir) {
    setForm((f) => {
      const steps = [...f.steps]
      const target = index + dir
      if (target < 0 || target >= steps.length) return f
      ;[steps[index], steps[target]] = [steps[target], steps[index]]
      return { ...f, steps }
    })
  }

  // ---- Image ---------------------------------------------------------------

  function onCoverUpload(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('coverImageUrl', reader.result)
    reader.readAsDataURL(file)
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    if (!form.title.trim()) {
      setError('Please give your recipe a title.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError('')

    const prep = Number(form.prepTimeMinutes) || 0
    const cook = Number(form.cookTimeMinutes) || 0

    const payload = {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      sourceName: form.sourceName.trim(),
      sourceUrl: form.sourceUrl.trim(),
      cuisineId: form.cuisineId,
      mealTypeId: form.mealTypeId,
      dietaryTagIds: form.dietaryTagIds,
      categoryIds: form.categoryIds,
      servings: Number(form.servings) || 1,
      prepTimeMinutes: prep,
      cookTimeMinutes: cook,
      totalTimeMinutes: prep + cook,
      spiceLevel: Number(form.spiceLevel) || 0,
      difficulty: recipe?.difficulty || 1,
      accentColor: form.accentColor,
      coverImageUrl: form.coverImageUrl,
      includeInMealSuggestions: form.includeInMealSuggestions,
      ingredients: form.ingredients
        .map((ing) => ({
          sectionName: ing.sectionName.trim() || 'Main',
          ingredientName: ing.ingredientName.trim(),
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes.trim(),
          optional: ing.optional,
        }))
        .filter((ing) => ing.ingredientName),
      steps: form.steps
        .map((s) => ({
          instruction: s.instruction.trim(),
          timerMinutes: Number(s.timerMinutes) || 0,
        }))
        .filter((s) => s.instruction),
      options: { ...form.options },
    }

    let savedRecipe
    if (isEdit) {
      savedRecipe = { ...payload, id: recipe.id, isSeed: false }
      updateRecipe(savedRecipe)
    } else {
      savedRecipe = addRecipe(payload)
    }

    if (form.addToPlan && form.planDate) {
      assignToSlot(form.planDate, form.planSlot, savedRecipe.id, form.planTime || null)
    }

    setView('recipes')
    openRecipe(savedRecipe.id)
  }

  const totalTime = (Number(form.prepTimeMinutes) || 0) + (Number(form.cookTimeMinutes) || 0)
  const previewSrc = form.coverImageUrl || PLACEHOLDER_IMAGE

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <div className="form-topbar">
        <button type="button" className="btn btn-ghost" onClick={() => setView(recipe ? 'recipeDetail' : 'recipes')}>
          ← Cancel
        </button>
        <h1>{isEdit ? 'Edit Recipe' : 'New Recipe'}</h1>
        <button type="submit" className="btn btn-primary">Save recipe</button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Section title="Recipe details" number="1">
        <div className="form-row">
          <label className="field field-wide">
            <span>Recipe title *</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Honey Garlic Salmon Bowls"
            />
          </label>
          <label className="field field-wide">
            <span>Source link</span>
            <input
              type="url"
              value={form.sourceUrl}
              onChange={(e) => set('sourceUrl', e.target.value)}
              placeholder="https://…"
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Cuisine</span>
            <select value={form.cuisineId} onChange={(e) => set('cuisineId', e.target.value)}>
              <option value="">Select cuisine…</option>
              {CUISINES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select value={form.mealTypeId} onChange={(e) => set('mealTypeId', e.target.value)}>
              <option value="">Select meal type…</option>
              {MEAL_TYPES.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Short description</span>
          <textarea
            rows={2}
            value={form.shortDescription}
            onChange={(e) => set('shortDescription', e.target.value)}
            placeholder="A quick summary shown on the recipe card…"
          />
        </label>

        <MultiSelect
          label="Dietary suitability"
          options={DIETARY_TAGS}
          selected={form.dietaryTagIds}
          onToggle={(id) => toggleInList('dietaryTagIds', id)}
        />
        <MultiSelect
          label="Recipe categories"
          options={RECIPE_CATEGORIES}
          selected={form.categoryIds}
          onToggle={(id) => toggleInList('categoryIds', id)}
        />
      </Section>

      <Section title="Timing and yield" number="2">
        <div className="form-row">
          <div className="field">
            <span>Servings</span>
            <div className="stepper">
              <button type="button" onClick={() => set('servings', Math.max(1, (Number(form.servings) || 1) - 1))}>−</button>
              <input
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) => set('servings', e.target.value)}
              />
              <button type="button" onClick={() => set('servings', (Number(form.servings) || 1) + 1)}>+</button>
            </div>
          </div>
          <label className="field">
            <span>Prep time (minutes)</span>
            <input
              type="number"
              min="0"
              value={form.prepTimeMinutes}
              onChange={(e) => set('prepTimeMinutes', e.target.value)}
              placeholder="15"
            />
          </label>
          <label className="field">
            <span>Cook time (minutes)</span>
            <input
              type="number"
              min="0"
              value={form.cookTimeMinutes}
              onChange={(e) => set('cookTimeMinutes', e.target.value)}
              placeholder="25"
            />
          </label>
          <div className="field">
            <span>Total time</span>
            <div className="total-time">{totalTime > 0 ? `${totalTime} min` : '—'}</div>
          </div>
        </div>
        <div className="field">
          <span>Spice level — <strong>{['Mild', 'Mild-medium', 'Medium', 'Medium-hot', 'Hot', 'Very spicy'][Number(form.spiceLevel) || 0]}</strong></span>
          <input
            className="spice-slider"
            type="range"
            min="0"
            max="5"
            step="1"
            value={form.spiceLevel}
            onChange={(e) => set('spiceLevel', e.target.value)}
          />
          <div className="spice-scale"><span>Mild</span><span>Very spicy</span></div>
        </div>
      </Section>

      <Section title="Image and appearance" number="3">
        <div className="appearance-row">
          <div className="cover-preview">
            <img src={previewSrc} alt="Cover preview" />
          </div>
          <div className="appearance-controls">
            <label className="field">
              <span>Cover image upload</span>
              <input type="file" accept="image/*" onChange={onCoverUpload} />
            </label>
            <label className="field">
              <span>…or paste an image URL</span>
              <input
                type="url"
                value={form.coverImageUrl.startsWith('data:') ? '' : form.coverImageUrl}
                onChange={(e) => set('coverImageUrl', e.target.value)}
                placeholder="https://…"
              />
            </label>
            {form.coverImageUrl && (
              <button type="button" className="btn btn-ghost" onClick={() => set('coverImageUrl', '')}>
                Use placeholder image
              </button>
            )}
            <div className="field">
              <span>Card accent color</span>
              <div className="swatches">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`swatch ${form.accentColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => set('accentColor', c)}
                    aria-label={`Accent color ${c}`}
                  />
                ))}
                <label className="swatch swatch-custom" title="Custom color">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Ingredients" number="4">
        <IngredientSection
          ingredients={form.ingredients}
          onUpdate={updateIngredient}
          onAdd={addIngredient}
          onAddSection={addSection}
          onRemove={removeIngredient}
          onMove={moveIngredient}
        />
      </Section>

      <Section title="Method" number="5">
        <div className="steps-editor">
          {form.steps.map((step, i) => (
            <div key={i} className="step-editor-row">
              <span className="step-number">{i + 1}</span>
              <textarea
                rows={2}
                value={step.instruction}
                onChange={(e) => updateStep(i, { instruction: e.target.value })}
                placeholder="Describe this step…"
              />
              <label className="timer-field">
                <span>Timer (min)</span>
                <input
                  type="number"
                  min="0"
                  value={step.timerMinutes}
                  onChange={(e) => updateStep(i, { timerMinutes: e.target.value })}
                />
              </label>
              <div className="row-controls">
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} title="Move up">↑</button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} title="Move down">↓</button>
                <button type="button" className="btn-danger-icon" onClick={() => removeStep(i)} title="Remove step">✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addStep}>+ Add step</button>
        </div>
      </Section>

      <Section title="Meal planning options" number="6">
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.includeInMealSuggestions}
            onChange={(e) => set('includeInMealSuggestions', e.target.checked)}
          />
          <span>Make this recipe available in meal-plan suggestions</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.addToPlan}
            onChange={(e) => set('addToPlan', e.target.checked)}
          />
          <span>Add this recipe to the meal plan now</span>
        </label>

        {form.addToPlan && (
          <div className="plan-options form-row">
            <label className="field">
              <span>Meal-planning week</span>
              <select
                value={form.planWeek || weekOptions[0].key}
                onChange={(e) => {
                  const key = e.target.value
                  setForm((f) => ({ ...f, planWeek: key, planDate: key }))
                }}
              >
                {weekOptions.map((w) => (
                  <option key={w.key} value={w.key}>{w.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Planned cooking date</span>
              <select value={form.planDate} onChange={(e) => set('planDate', e.target.value)}>
                <option value="">Select a date…</option>
                {weekDayOptions(form.planWeek || weekOptions[0].key)}
              </select>
            </label>
            <label className="field">
              <span>Planned serving time</span>
              <select value={form.planSlot} onChange={(e) => set('planSlot', e.target.value)}>
                {PLANNER_SLOTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Specific time (optional)</span>
              <input type="time" value={form.planTime} onChange={(e) => set('planTime', e.target.value)} />
            </label>
          </div>
        )}
      </Section>

      <Section title="Recipe options" number="7">
        <div className="recipe-options-menu">
          <ToggleRow
            label="Include ingredients in generated shopping lists"
            checked={form.options.includeInShoppingList}
            onChange={(v) => setOptions('includeInShoppingList', v)}
          />
          <ToggleRow
            label="Show nutrition information"
            checked={form.options.showNutrition}
            onChange={(v) => setOptions('showNutrition', v)}
          />
          <ToggleRow
            label="Allow ingredient substitutions"
            checked={form.options.allowSubstitutions}
            onChange={(v) => setOptions('allowSubstitutions', v)}
          />
          <div className="measurement-choice">
            <span className="menu-label">Measurements</span>
            <div className="segmented">
              <button
                type="button"
                className={form.options.measurementSystem === 'us' ? 'active' : ''}
                onClick={() => setOptions('measurementSystem', 'us')}
              >
                US customary
              </button>
              <button
                type="button"
                className={form.options.measurementSystem === 'metric' ? 'active' : ''}
                onClick={() => setOptions('measurementSystem', 'metric')}
              >
                Metric
              </button>
            </div>
          </div>
        </div>
      </Section>

      <div className="form-submit-bar">
        <button type="button" className="btn btn-ghost" onClick={() => setView(recipe ? 'recipeDetail' : 'recipes')}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">{isEdit ? 'Save changes' : 'Add recipe'}</button>
      </div>
    </form>
  )
}

function weekDayOptions(weekKey) {
  const monday = parseDateKey(weekKey)
  return Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(monday, i)
    const key = toDateKey(d)
    return (
      <option key={key} value={key}>
        {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </option>
    )
  })
}

function Section({ title, number, children }) {
  return (
    <section className="form-section">
      <h2 className="form-section-title">
        <span className="section-number">{number}</span> {title}
      </h2>
      <div className="form-section-body">{children}</div>
    </section>
  )
}

function MultiSelect({ label, options, selected, onToggle }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="multi-options">
        {options.map((o) => {
          const active = selected.includes(o.id)
          return (
            <button
              key={o.id}
              type="button"
              className={`multi-option ${active ? 'active' : ''}`}
              onClick={() => onToggle(o.id)}
            >
              {o.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IngredientSection({ ingredients, onUpdate, onAdd, onAddSection, onRemove, onMove }) {
  return (
    <div className="ingredients-editor">
      <datalist id="ingredient-list">
        {INGREDIENT_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="unit-list">
        {UNIT_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {ingredients.map((ing, i) => {
        const hint = INGREDIENT_CATEGORY_MAP[(ing.ingredientName || '').trim().toLowerCase()]
        return (
          <div key={i} className="ingredient-editor-row">
            <input
              className="section-name-input"
              type="text"
              value={ing.sectionName}
              onChange={(e) => onUpdate(i, { sectionName: e.target.value })}
              placeholder="Section"
              title="Ingredient section name"
            />
            <input
              className="ingredient-name-input"
              type="text"
              list="ingredient-list"
              value={ing.ingredientName}
              onChange={(e) => onUpdate(i, { ingredientName: e.target.value })}
              placeholder="Ingredient"
            />
            <input
              className="qty-input"
              type="text"
              value={ing.quantity}
              onChange={(e) => onUpdate(i, { quantity: e.target.value })}
              placeholder="Qty"
              title="Quantity"
            />
            <input
              className="unit-input"
              type="text"
              list="unit-list"
              value={ing.unit}
              onChange={(e) => onUpdate(i, { unit: e.target.value })}
              placeholder="Unit"
              title="Unit"
            />
            <label className="optional-check" title="Optional ingredient">
              <input
                type="checkbox"
                checked={ing.optional}
                onChange={(e) => onUpdate(i, { optional: e.target.checked })}
              />
              optional
            </label>
            <div className="row-controls">
              <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} title="Move up">↑</button>
              <button type="button" onClick={() => onMove(i, 1)} disabled={i === ingredients.length - 1} title="Move down">↓</button>
              <button type="button" className="btn-danger-icon" onClick={() => onRemove(i)} title="Remove ingredient">✕</button>
            </div>
            {hint && <span className="ingredient-hint">→ {hint}</span>}
          </div>
        )
      })}

      <div className="editor-actions">
        <button type="button" className="btn btn-secondary" onClick={onAdd}>+ Add ingredient</button>
        <button type="button" className="btn btn-secondary" onClick={onAddSection}>+ Add section</button>
      </div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </label>
  )
}
