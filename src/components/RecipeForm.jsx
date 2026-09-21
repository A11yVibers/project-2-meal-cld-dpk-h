import { useState } from 'react';
import { APPROVED_IMAGES } from '../approved-images.js';
import {
  CUISINES,
  MEAL_TYPES,
  DIETARY_TAGS,
  CATEGORIES,
  INGREDIENT_NAMES,
  UNIT_NAMES,
  resolveIngredient,
} from '../lib/data.js';
import { createEmptyRecipe, difficultyLabel, spiceLabel, todayStart, toDateKey, uid } from '../lib/utils.js';
import { Toggle, Segmented, Chip, IconButton } from './ui.jsx';
import SchedulePicker from './SchedulePicker.jsx';

const PRESET_COLORS = [
  '#D97757',
  '#8A9A5B',
  '#5B7A9A',
  '#9A5B7A',
  '#C09A3E',
  '#4E8A6E',
  '#8A6E4E',
  '#6E5B8A',
];

function Section({ step, title, children }) {
  return (
    <section className="form-section" aria-labelledby={`fs-${step}`}>
      <header className="form-section-head">
        <span className="form-step" aria-hidden="true">
          {step}
        </span>
        <h2 id={`fs-${step}`}>{title}</h2>
      </header>
      <div className="form-section-body">{children}</div>
    </section>
  );
}

export default function RecipeForm({ onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createEmptyRecipe());
  const [error, setError] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // ---- ingredient helpers ----
  function setIngredient(id, patch) {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }

  function updateIngredientName(id, name) {
    const match = resolveIngredient(name, null);
    setIngredient(id, { name, ingredientId: match ? match.id : null });
  }

  function removeIngredient(id) {
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i.id !== id) }));
  }

  function addIngredient(sectionId) {
    setDraft((d) => {
      const item = { id: uid('ing'), sectionId, ingredientId: null, name: '', quantity: '', unit: '', notes: '', optional: false };
      const lastIdx = d.ingredients.reduce((acc, ing, i) => (ing.sectionId === sectionId ? i : acc), -1);
      const arr = [...d.ingredients];
      arr.splice(lastIdx + 1, 0, item);
      return { ...d, ingredients: arr };
    });
  }

  function moveIngredient(id, dir) {
    setDraft((d) => {
      const idx = d.ingredients.findIndex((i) => i.id === id);
      if (idx === -1) return d;
      const item = d.ingredients[idx];
      const sectionItems = d.ingredients.filter((i) => i.sectionId === item.sectionId);
      const localIdx = sectionItems.findIndex((i) => i.id === id);
      const targetLocal = localIdx + dir;
      if (targetLocal < 0 || targetLocal >= sectionItems.length) return d;
      const target = sectionItems[targetLocal];
      const targetIdx = d.ingredients.findIndex((i) => i.id === target.id);
      const arr = [...d.ingredients];
      [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
      return { ...d, ingredients: arr };
    });
  }

  function addSection() {
    const name = newSectionName.trim() || 'New section';
    setDraft((d) => ({ ...d, sections: [...d.sections, { id: uid('sec'), name }] }));
    setNewSectionName('');
  }

  function removeSection(id) {
    setDraft((d) => {
      if (d.sections.length <= 1) return d;
      return {
        ...d,
        sections: d.sections.filter((s) => s.id !== id),
        ingredients: d.ingredients.filter((i) => i.sectionId !== id),
      };
    });
  }

  function moveSection(id, dir) {
    setDraft((d) => {
      const idx = d.sections.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= d.sections.length) return d;
      const arr = [...d.sections];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...d, sections: arr };
    });
  }

  // ---- step helpers ----
  function addStep() {
    setDraft((d) => ({ ...d, steps: [...d.steps, { id: uid('step'), instruction: '', timerMinutes: '' }] }));
  }

  function removeStep(id) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((s) => s.id !== id) }));
  }

  function moveStep(id, dir) {
    setDraft((d) => {
      const idx = d.steps.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= d.steps.length) return d;
      const arr = [...d.steps];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...d, steps: arr };
    });
  }

  function setStep(id, patch) {
    setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }

  // ---- image ----
  function handleImageFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      downscaleImage(reader.result)
        .then((url) => set({ coverImageUrl: url }))
        .catch(() => set({ coverImageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError('Please add a recipe title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    const recipe = buildRecipe();
    const planInfo =
      draft.addToPlanNow && draft.plannedDate
        ? { dateKey: draft.plannedDate, slot: draft.plannedSlot }
        : null;
    onSave(recipe, planInfo);
  }

  function buildRecipe() {
    const sectionName = Object.fromEntries(draft.sections.map((s) => [s.id, s.name]));
    const prep = Number(draft.prepTime) || 0;
    const cook = Number(draft.cookTime) || 0;
    return {
      id: draft.id,
      title: draft.title.trim(),
      shortDescription: draft.shortDescription.trim(),
      sourceName: draft.sourceName.trim(),
      sourceUrl: draft.sourceUrl.trim(),
      servings: Number(draft.servings) || 1,
      prepTime: prep,
      cookTime: cook,
      totalTime: prep + cook,
      cuisineId: draft.cuisineId,
      mealTypeId: draft.mealTypeId,
      dietaryTagIds: draft.dietaryTagIds,
      categoryIds: draft.categoryIds,
      difficulty: Number(draft.difficulty) || 0,
      spiceLevel: Number(draft.spiceLevel) || 0,
      accentColor: draft.accentColor || '#D97757',
      coverImageUrl: draft.coverImageUrl,
      includeInMealSuggestions: draft.includeInMealSuggestions,
      includeInShoppingList: draft.includeInShoppingList,
      showNutrition: draft.showNutrition,
      allowSubstitutions: draft.allowSubstitutions,
      measurementSystem: draft.measurementSystem,
      ingredients: draft.ingredients
        .filter((i) => i.name.trim() !== '')
        .map((i) => ({
          id: i.id,
          section: sectionName[i.sectionId] || 'Ingredients',
          ingredientId: i.ingredientId,
          name: i.name.trim(),
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes.trim(),
          optional: i.optional,
        })),
      steps: draft.steps
        .filter((s) => s.instruction.trim() !== '')
        .map((s) => ({ id: s.id, instruction: s.instruction.trim(), timerMinutes: Number(s.timerMinutes) || 0 })),
      isSeed: false,
    };
  }

  const totalTime = (Number(draft.prepTime) || 0) + (Number(draft.cookTime) || 0);
  const imagePreview = draft.coverImageUrl || APPROVED_IMAGES.placeholder;

  return (
    <form className="page" onSubmit={handleSubmit} aria-labelledby="form-heading">
      <header className="page-header">
        <div>
          <h1 id="form-heading">Add a new recipe</h1>
          <p className="page-sub">Fill in the sections below to create your recipe.</p>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save recipe
          </button>
        </div>
      </header>

      {error && (
        <p id="form-error" className="form-error" role="alert">
          {error}
        </p>
      )}

      <datalist id="ingredient-options">
        {INGREDIENT_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="unit-options">
        {UNIT_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <Section step={1} title="Recipe details">
        <div className="field">
          <label className="label" htmlFor="r-title">
            Recipe title <span className="req">*</span>
          </label>
          <input
            id="r-title"
            className="input"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Honey Garlic Salmon Bowls"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'form-error' : undefined}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="r-desc">
            Short description
          </label>
          <textarea
            id="r-desc"
            className="input"
            rows={2}
            value={draft.shortDescription}
            onChange={(e) => set({ shortDescription: e.target.value })}
            placeholder="A one-line summary shown on the recipe card"
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="r-source-name">
              Source name
            </label>
            <input
              id="r-source-name"
              className="input"
              value={draft.sourceName}
              onChange={(e) => set({ sourceName: e.target.value })}
              placeholder="e.g. My Kitchen"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="r-source-url">
              Source link
            </label>
            <input
              id="r-source-url"
              className="input"
              type="url"
              value={draft.sourceUrl}
              onChange={(e) => set({ sourceUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="r-cuisine">
              Cuisine
            </label>
            <select
              id="r-cuisine"
              className="input"
              value={draft.cuisineId}
              onChange={(e) => set({ cuisineId: e.target.value })}
            >
              {CUISINES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="r-mealtype">
              Primary meal type
            </label>
            <select
              id="r-mealtype"
              className="input"
              value={draft.mealTypeId}
              onChange={(e) => set({ mealTypeId: e.target.value })}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="r-difficulty">
              Difficulty
            </label>
            <select
              id="r-difficulty"
              className="input"
              value={draft.difficulty}
              onChange={(e) => set({ difficulty: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} — {difficultyLabel(n)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="field">
          <legend className="label">Dietary suitability</legend>
          <div className="chip-row">
            {DIETARY_TAGS.map((t) => (
              <Chip
                key={t.id}
                selected={draft.dietaryTagIds.includes(t.id)}
                onClick={() =>
                  set({
                    dietaryTagIds: draft.dietaryTagIds.includes(t.id)
                      ? draft.dietaryTagIds.filter((x) => x !== t.id)
                      : [...draft.dietaryTagIds, t.id],
                  })
                }
              >
                {t.name}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="label">Recipe categories</legend>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                selected={draft.categoryIds.includes(c.id)}
                onClick={() =>
                  set({
                    categoryIds: draft.categoryIds.includes(c.id)
                      ? draft.categoryIds.filter((x) => x !== c.id)
                      : [...draft.categoryIds, c.id],
                  })
                }
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section step={2} title="Timing and yield">
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="r-servings">
              Servings
            </label>
            <div className="stepper">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => set({ servings: Math.max(1, Number(draft.servings) - 1) })}
                aria-label="Decrease servings"
              >
                −
              </button>
              <input
                id="r-servings"
                className="input input-center"
                type="number"
                min="1"
                value={draft.servings}
                onChange={(e) => set({ servings: Number(e.target.value) || 1 })}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => set({ servings: Number(draft.servings) + 1 })}
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="r-prep">
              Prep time (minutes)
            </label>
            <input
              id="r-prep"
              className="input"
              type="number"
              min="0"
              value={draft.prepTime}
              onChange={(e) => set({ prepTime: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="r-cook">
              Cook time (minutes)
            </label>
            <input
              id="r-cook"
              className="input"
              type="number"
              min="0"
              value={draft.cookTime}
              onChange={(e) => set({ cookTime: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="field">
            <span className="label">Total time</span>
            <div className="readonly-value">{totalTime} min (auto)</div>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="r-spice">
            Spice level: <strong>{spiceLabel(draft.spiceLevel)}</strong>
          </label>
          <div className="spice-row">
            <input
              id="r-spice"
              type="range"
              min="0"
              max="5"
              step="1"
              value={draft.spiceLevel}
              onChange={(e) => set({ spiceLevel: Number(e.target.value) })}
            />
            <span className="spice-scale">
              <span>Mild</span>
              <span>Very spicy</span>
            </span>
          </div>
        </div>
      </Section>

      <Section step={3} title="Image and appearance">
        <div className="field-row image-row">
          <div className="image-preview">
            <img src={imagePreview} alt="Cover preview" />
          </div>
          <div className="field image-controls">
            <label className="label" htmlFor="r-image-url">
              Cover image URL
            </label>
            <input
              id="r-image-url"
              className="input"
              type="url"
              value={draft.coverImageUrl.startsWith('data:') ? '' : draft.coverImageUrl}
              onChange={(e) => set({ coverImageUrl: e.target.value })}
              placeholder="https://… (leave empty for placeholder)"
            />
            <label className="label" htmlFor="r-image-file">
              Or upload an image (stored in this browser only)
            </label>
            <input
              id="r-image-file"
              className="input"
              type="file"
              accept="image/*"
              onChange={handleImageFile}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ coverImageUrl: '' })}>
              Clear image
            </button>
          </div>
        </div>

        <fieldset className="field">
          <legend className="label">Recipe card accent color</legend>
          <div className="color-row">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${draft.accentColor === c ? 'is-selected' : ''}`}
                style={{ background: c }}
                onClick={() => set({ accentColor: c })}
                aria-label={`Accent color ${c}`}
                aria-pressed={draft.accentColor === c}
              />
            ))}
            <label className="color-custom">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(e) => set({ accentColor: e.target.value })}
                aria-label="Custom accent color"
              />
              <span>Custom</span>
            </label>
          </div>
        </fieldset>
      </Section>

      <Section step={4} title="Ingredients">
        {draft.sections.map((section) => {
          const items = draft.ingredients.filter((i) => i.sectionId === section.id);
          return (
            <div key={section.id} className="ing-section-block">
              <div className="ing-section-head">
                <input
                  className="input ing-section-name"
                  value={section.name}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      sections: d.sections.map((s) => (s.id === section.id ? { ...s, name: e.target.value } : s)),
                    }))
                  }
                  aria-label="Section name"
                />
                <div className="ing-section-tools">
                  <IconButton label="Move section up" onClick={() => moveSection(section.id, -1)}>
                    ↑
                  </IconButton>
                  <IconButton label="Move section down" onClick={() => moveSection(section.id, 1)}>
                    ↓
                  </IconButton>
                  <IconButton
                    label="Remove section"
                    onClick={() => removeSection(section.id)}
                    disabled={draft.sections.length <= 1}
                  >
                    ✕
                  </IconButton>
                </div>
              </div>

              {items.map((ing) => (
                <div key={ing.id} className="ing-row">
                  <input
                    className="input ing-name"
                    list="ingredient-options"
                    placeholder="Ingredient"
                    value={ing.name}
                    onChange={(e) => updateIngredientName(ing.id, e.target.value)}
                    aria-label="Ingredient"
                  />
                  <input
                    className="input ing-qty"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => setIngredient(ing.id, { quantity: e.target.value })}
                    aria-label="Quantity"
                  />
                  <input
                    className="input ing-unit"
                    list="unit-options"
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => setIngredient(ing.id, { unit: e.target.value })}
                    aria-label="Unit"
                  />
                  <input
                    className="input ing-notes"
                    placeholder="Notes (optional)"
                    value={ing.notes}
                    onChange={(e) => setIngredient(ing.id, { notes: e.target.value })}
                    aria-label="Notes"
                  />
                  <label className="check-label ing-optional">
                    <input
                      type="checkbox"
                      checked={ing.optional}
                      onChange={(e) => setIngredient(ing.id, { optional: e.target.checked })}
                    />
                    Optional
                  </label>
                  <div className="ing-tools">
                    <IconButton label="Move ingredient up" onClick={() => moveIngredient(ing.id, -1)}>
                      ↑
                    </IconButton>
                    <IconButton label="Move ingredient down" onClick={() => moveIngredient(ing.id, 1)}>
                      ↓
                    </IconButton>
                    <IconButton label="Remove ingredient" onClick={() => removeIngredient(ing.id)}>
                      ✕
                    </IconButton>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addIngredient(section.id)}>
                + Add ingredient to {section.name}
              </button>
            </div>
          );
        })}

        <div className="add-section-row">
          <input
            className="input"
            placeholder="New section name (e.g. Sauce)"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            aria-label="New ingredient section name"
          />
          <button type="button" className="btn btn-ghost" onClick={addSection}>
            + Add ingredient section
          </button>
        </div>
      </Section>

      <Section step={5} title="Method">
        {draft.steps.map((step, i) => (
          <div key={step.id} className="step-row">
            <span className="step-num">{i + 1}</span>
            <textarea
              className="input step-text"
              rows={2}
              placeholder="Describe this step…"
              value={step.instruction}
              onChange={(e) => setStep(step.id, { instruction: e.target.value })}
              aria-label={`Step ${i + 1}`}
            />
            <label className="step-timer">
              <span className="label">Timer (min)</span>
              <input
                className="input input-center"
                type="number"
                min="0"
                placeholder="—"
                value={step.timerMinutes}
                onChange={(e) => setStep(step.id, { timerMinutes: e.target.value })}
                aria-label={`Step ${i + 1} timer in minutes`}
              />
            </label>
            <div className="ing-tools step-tools">
              <IconButton label="Move step up" onClick={() => moveStep(step.id, -1)}>
                ↑
              </IconButton>
              <IconButton label="Move step down" onClick={() => moveStep(step.id, 1)}>
                ↓
              </IconButton>
              <IconButton label="Remove step" onClick={() => removeStep(step.id)}>
                ✕
              </IconButton>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={addStep}>
          + Add step
        </button>
      </Section>

      <Section step={6} title="Meal planning options">
        <div className="stack">
          <Toggle
            checked={draft.includeInMealSuggestions}
            onChange={(v) => set({ includeInMealSuggestions: v })}
            label="Available in meal-plan suggestions"
            description="Show this recipe when suggesting dishes for an empty meal slot."
          />
          <Toggle
            checked={draft.addToPlanNow}
            onChange={(v) =>
              set({
                addToPlanNow: v,
                plannedDate: v && !draft.plannedDate ? toDateKey(todayStart()) : draft.plannedDate,
              })
            }
            label="Add to the meal plan now"
            description="Immediately schedule this recipe when it is saved."
          />
          {draft.addToPlanNow && (
            <SchedulePicker
              value={{ dateKey: draft.plannedDate || toDateKey(todayStart()), slot: draft.plannedSlot }}
              onChange={(next) => set({ plannedDate: next.dateKey, plannedSlot: next.slot })}
            />
          )}
        </div>
      </Section>

      <Section step={7} title="Recipe options">
        <div className="options-menu">
          <Toggle
            checked={draft.includeInShoppingList}
            onChange={(v) => set({ includeInShoppingList: v })}
            label="Include ingredients in shopping lists"
            description="Add this recipe's ingredients to your generated shopping list."
          />
          <Toggle
            checked={draft.showNutrition}
            onChange={(v) => set({ showNutrition: v })}
            label="Show nutrition information"
            description="Display the nutrition panel on the recipe detail page."
          />
          <Toggle
            checked={draft.allowSubstitutions}
            onChange={(v) => set({ allowSubstitutions: v })}
            label="Allow ingredient substitutions"
            description="Mark this recipe as flexible for swapping ingredients."
          />
          <div className="field">
            <span className="label">Measurements</span>
            <Segmented
              name="Measurement system"
              value={draft.measurementSystem}
              onChange={(v) => set({ measurementSystem: v })}
              options={[
                { value: 'us', label: 'US customary' },
                { value: 'metric', label: 'Metric' },
              ]}
            />
          </div>
        </div>
      </Section>

      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save recipe
        </button>
      </div>
    </form>
  );
}

// Downscale an uploaded image to a compact data URL so it fits comfortably in
// localStorage. Falls back to the original on any failure.
function downscaleImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 900;
      if (img.width <= max) {
        resolve(dataUrl);
        return;
      }
      const scale = max / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = max;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
