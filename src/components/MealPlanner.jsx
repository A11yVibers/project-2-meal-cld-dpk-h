import { useState } from 'react';
import { APPROVED_IMAGES } from '../approved-images.js';
import {
  MEAL_SLOTS,
  addDays,
  formatWeekLabel,
  startOfWeek,
  toDateKey,
  todayStart,
  weekDates,
} from '../lib/utils.js';

export default function MealPlanner({ schedule, recipesById, onOpenRecipe, onPickSlot, onRemove }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayStart()));
  const days = weekDates(weekStart);
  const todayKey = toDateKey(todayStart());

  function shiftWeek(n) {
    setWeekStart((ws) => addDays(ws, n * 7));
  }

  return (
    <section className="page" aria-labelledby="planner-heading">
      <header className="page-header">
        <div>
          <h1 id="planner-heading">Weekly meal plan</h1>
          <p className="page-sub">Plan breakfast, lunch, dinner, and snacks for the week.</p>
        </div>
        <div className="week-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => shiftWeek(-1)} aria-label="Previous week">
            ‹ Previous
          </button>
          <span className="week-label">{formatWeekLabel(weekStart)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => shiftWeek(1)} aria-label="Next week">
            Next ›
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(startOfWeek(todayStart()))}>
            This week
          </button>
        </div>
      </header>

      <div className="planner-scroll">
        <div className="planner-grid" role="grid" aria-label="Meal plan grid">
        <div className="planner-corner" />
        {days.map((d) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          return (
            <div key={key} className={`planner-day-head ${isToday ? 'is-today' : ''}`} role="columnheader">
              <span className="pd-weekday">{d.toLocaleDateString(undefined, { weekday: 'long' })}</span>
              <span className="pd-date">{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          );
        })}

          {MEAL_SLOTS.map((slot) => (
            <SlotRow
              key={slot}
              slot={slot}
              days={days}
              schedule={schedule}
              recipesById={recipesById}
              onOpenRecipe={onOpenRecipe}
              onPickSlot={onPickSlot}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SlotRow({ slot, days, schedule, recipesById, onOpenRecipe, onPickSlot, onRemove }) {
  return (
    <>
      <div className="planner-slot-label" role="rowheader">
        {slot}
      </div>
      {days.map((d) => {
        const dateKey = toDateKey(d);
        const recipeId = schedule[dateKey]?.[slot];
        const recipe = recipeId ? recipesById[recipeId] : null;
        return (
          <div key={dateKey} className="planner-cell" role="gridcell">
            {recipe ? (
              <div className="slot-card">
                <img
                  src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder}
                  alt=""
                  className="slot-thumb"
                />
                <div className="slot-info">
                  <button className="slot-title" onClick={() => onOpenRecipe(recipe.id)}>
                    {recipe.title}
                  </button>
                  <div className="slot-actions">
                    <button className="mini-btn" onClick={() => onPickSlot(dateKey, slot)}>
                      ⇄ Replace
                    </button>
                    <button className="mini-btn mini-btn-danger" onClick={() => onRemove(dateKey, slot)}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button className="slot-empty" onClick={() => onPickSlot(dateKey, slot)}>
                + Add
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
