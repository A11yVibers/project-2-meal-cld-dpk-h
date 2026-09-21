import { useMemo, useState } from 'react';
import {
  MEAL_SLOTS,
  addDays,
  formatDateMedium,
  formatWeekLabel,
  parseDateKey,
  startOfWeek,
  toDateKey,
  todayStart,
  weekDates,
} from '../lib/utils.js';

// Compact week + day + meal-slot selector used by the slot picker and the
// "add to meal plan now" section of the recipe form.
export default function SchedulePicker({ value, onChange, defaultSlot = 'Dinner' }) {
  const initialWeek = useMemo(
    () => startOfWeek(value && value.dateKey ? parseDateKey(value.dateKey) : todayStart()),
    []
  );
  const [weekStart, setWeekStart] = useState(initialWeek);

  const days = weekDates(weekStart);
  const todayKey = toDateKey(todayStart());
  const selectedDate = value?.dateKey || '';
  const selectedSlot = value?.slot || defaultSlot;

  function chooseDate(dateKey) {
    onChange({ dateKey, slot: selectedSlot });
  }

  function chooseSlot(slot) {
    onChange({ dateKey: selectedDate || todayKey, slot });
  }

  function shiftWeek(n) {
    setWeekStart((ws) => addDays(ws, n * 7));
  }

  return (
    <div className="schedule-picker">
      <div className="schedule-week">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => shiftWeek(-1)} aria-label="Previous week">
          ‹
        </button>
        <span className="schedule-week-label">{formatWeekLabel(weekStart)}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => shiftWeek(1)} aria-label="Next week">
          ›
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setWeekStart(startOfWeek(todayStart()))}
        >
          This week
        </button>
      </div>

      <div className="schedule-days" role="radiogroup" aria-label="Choose a day">
        {days.map((d) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selectedDate === key}
              className={`day-btn ${selectedDate === key ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => chooseDate(key)}
            >
              <span className="day-name">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
              <span className="day-num">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="schedule-slots" role="radiogroup" aria-label="Choose a meal slot">
        {MEAL_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            role="radio"
            aria-checked={selectedSlot === slot}
            className={`slot-btn ${selectedSlot === slot ? 'is-selected' : ''}`}
            onClick={() => chooseSlot(slot)}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}
