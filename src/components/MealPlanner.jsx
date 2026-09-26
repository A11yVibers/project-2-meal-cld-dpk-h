import { useState } from 'react'
import { SLOTS, SLOT_LABELS } from '../lib/constants.js'
import { addDays, dayIndexOf, formatDayHeading, formatWeekLabel, parseISODate, weekKey } from '../lib/dates.js'
import { formatTimeHM } from '../lib/utils.js'
import RecipePickerModal from './RecipePickerModal.jsx'

export default function MealPlanner({
  recipes,
  mealPlan,
  plannerWeek,
  onWeekChange,
  onAssign,
  onRemove,
  onOpenRecipe,
}) {
  const [picker, setPicker] = useState(null) // { dayIndex, slot, replace }
  const [confirmKey, setConfirmKey] = useState(null)

  const monday = parseISODate(plannerWeek)
  const days = [...Array(7).keys()].map((i) => addDays(monday, i))

  function openPicker(dayIndex, slot) {
    setPicker({ dayIndex, slot })
  }
  function handlePick(recipeId) {
    if (picker) {
      onAssign(plannerWeek, picker.dayIndex, picker.slot, recipeId, '')
    }
    setPicker(null)
  }

  function confirmRemove(dayIndex, slot) {
    onRemove(plannerWeek, dayIndex, slot)
    setConfirmKey(null)
  }

  return (
    <div className="planner">
      <div className="page-head">
        <h1>Weekly meal planner</h1>
        <p>Assign recipes to meal slots, then jump into the shopping list for everything you have planned.</p>
      </div>

      <div className="planner-toolbar">
        <button type="button" className="icon-button" onClick={() => onWeekChange(weekKey(addDays(monday, -7)))} aria-label="Previous week">‹</button>
        <div className="planner-week-label">{formatWeekLabel(monday)}</div>
        <button type="button" className="icon-button" onClick={() => onWeekChange(weekKey(addDays(monday, 7)))} aria-label="Next week">›</button>
        <button type="button" className="button button-secondary" onClick={() => onWeekChange(weekKey(new Date()))}>This week</button>
      </div>

      <div className="planner-grid" style={{ '--cols': 7 }}>
        <div className="planner-corner">Meals</div>
        {days.map((d, i) => (
          <div key={i} className={'planner-day-head' + (i === dayIndexOf(new Date()) && weekKey(new Date()) === plannerWeek ? ' today' : '')}>
            <span className="planner-day-name">{formatDayHeading(d)}</span>
          </div>
        ))}

        {SLOTS.map((slot) => (
          <div className="planner-row" key={slot} data-slot={slot}>
            <div className="planner-slot-label">{SLOT_LABELS[slot]}</div>
            {days.map((d, i) => {
              const assignment = (mealPlan[plannerWeek] && mealPlan[plannerWeek][i] && mealPlan[plannerWeek][i][slot]) || null
              const recipe = assignment ? recipes.find((r) => r.id === assignment.recipeId) : null
              const cellKey = `${i}-${slot}`

              if (recipe) {
                return (
                  <div className="planner-cell filled" key={i}>
                    <button type="button" className="planner-recipe" onClick={() => onOpenRecipe(recipe.id)}>
                      {recipe.title}
                    </button>
                    {assignment.time ? <span className="planner-time">{formatTimeHM(assignment.time)}</span> : null}
                    <div className="planner-cell-actions">
                      <button type="button" className="mini-button" onClick={() => openPicker(i, slot)}>Replace</button>
                      {confirmKey === cellKey ? (
                        <>
                          <button type="button" className="mini-button danger" onMouseLeave={() => setConfirmKey(null)} onClick={() => confirmRemove(i, slot)}>Remove?</button>
                          <button type="button" className="mini-button" onClick={() => setConfirmKey(null)}>Keep</button>
                        </>
                      ) : (
                        <button type="button" className="mini-button" onClick={() => setConfirmKey(cellKey)}>×</button>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div className="planner-cell" key={i}>
                  <button type="button" className="planner-add" onClick={() => openPicker(i, slot)}>
                    + Add
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {picker && (
        <RecipePickerModal
          recipes={recipes}
          title={`Choose a recipe for ${formatDayHeading(days[picker.dayIndex])} · ${SLOT_LABELS[picker.slot]}`}
          onPick={handlePick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}