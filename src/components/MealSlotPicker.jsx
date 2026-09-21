import { useEffect, useMemo, useRef, useState } from 'react';
import { APPROVED_IMAGES } from '../approved-images.js';
import { MEAL_TYPE_BY_ID } from '../lib/data.js';
import { formatDateLong, todayStart, toDateKey } from '../lib/utils.js';
import SchedulePicker from './SchedulePicker.jsx';

// Modal used for two flows:
//  - picking a date/slot for a known recipe (fixedRecipeId set)
//  - picking a recipe for a known date/slot (fixedDateKey + fixedSlot set)
export default function MealSlotPicker({
  recipes,
  recipesById,
  fixedRecipeId,
  fixedDateKey,
  fixedSlot,
  onAssign,
  onClose,
}) {
  const [selectedRecipeId, setSelectedRecipeId] = useState(fixedRecipeId || null);
  const [selectedDate, setSelectedDate] = useState(fixedDateKey || toDateKey(todayStart()));
  const [selectedSlot, setSelectedSlot] = useState(fixedSlot || 'Dinner');
  const [query, setQuery] = useState('');
  const [suggestionsOnly, setSuggestionsOnly] = useState(false);
  const overlayRef = useRef(null);

  const fixedRecipe = fixedRecipeId ? recipesById[fixedRecipeId] : null;
  const slotFixed = Boolean(fixedDateKey && fixedSlot);
  const fixedDate = fixedDateKey ? new Date(fixedDateKey + 'T00:00:00') : null;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    overlayRef.current?.focus();
    return () => {
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, []);

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const modal = overlayRef.current;
    if (!modal) return;
    const focusables = Array.from(
      modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.disabled && el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (suggestionsOnly && !r.includeInMealSuggestions) return false;
      if (q) {
        const hay = `${r.title} ${r.shortDescription}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, query, suggestionsOnly]);

  const canAssign = selectedRecipeId && selectedDate && selectedSlot;

  function assign(recipeId) {
    if (selectedDate && selectedSlot) onAssign(selectedDate, selectedSlot, recipeId);
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={fixedRecipe ? 'Schedule this recipe' : 'Choose a recipe for this slot'}
      ref={overlayRef}
      tabIndex={-1}
      onKeyDown={trapFocus}
    >
      <div className="modal">
        <header className="modal-head">
          <h2>{fixedRecipe ? 'Schedule this recipe' : 'Choose a recipe'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="modal-body">
          {fixedRecipe && (
            <div className="picker-recipe">
              <img
                src={fixedRecipe.coverImageUrl || APPROVED_IMAGES.placeholder}
                alt=""
                className="picker-thumb"
              />
              <div>
                <strong>{fixedRecipe.title}</strong>
                <span className="picker-sub">
                  {MEAL_TYPE_BY_ID[fixedRecipe.mealTypeId] || ''} · {fixedRecipe.servings} servings
                </span>
              </div>
            </div>
          )}

          {fixedRecipe && (
            <SchedulePicker
              value={{ dateKey: selectedDate, slot: selectedSlot }}
              onChange={(next) => {
                setSelectedDate(next.dateKey);
                setSelectedSlot(next.slot);
              }}
            />
          )}

          {!fixedRecipe && (
            <>
              <p className="picker-slot-line">
                Assigning to <strong>{formatDateLong(fixedDate)}</strong> · <strong>{fixedSlot}</strong>
              </p>
              <div className="picker-search">
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search recipes…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search recipes"
                />
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={suggestionsOnly}
                    onChange={(e) => setSuggestionsOnly(e.target.checked)}
                  />
                  Suggested only
                </label>
              </div>
              <ul className="picker-list">
                {filtered.length === 0 && <li className="muted">No recipes found.</li>}
                {filtered.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={`picker-item ${selectedRecipeId === r.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedRecipeId(r.id)}
                    >
                      <img
                        src={r.coverImageUrl || APPROVED_IMAGES.placeholder}
                        alt=""
                        className="picker-thumb"
                      />
                      <span className="picker-item-info">
                        <span className="picker-item-title">
                          {r.includeInMealSuggestions && <span title="Suggested">★ </span>}
                          {r.title}
                        </span>
                        <span className="picker-sub">
                          {MEAL_TYPE_BY_ID[r.mealTypeId] || ''} ·{' '}
                          {r.totalTime || (Number(r.prepTime) + Number(r.cookTime))} min
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <footer className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!canAssign}
            onClick={() => assign(selectedRecipeId)}
          >
            {slotFixed ? 'Assign to slot' : 'Add to meal plan'}
          </button>
        </footer>
      </div>
    </div>
  );
}
