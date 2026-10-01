// LocalStorage persistence + date/week helpers for the meal planner.

const PREFIX = 'mealplanner:v1:'

export const LS_KEYS = {
  userRecipes: PREFIX + 'userRecipes',
  schedule: PREFIX + 'schedule',
  pantry: PREFIX + 'pantry',
  checked: PREFIX + 'checked',
}

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be full (e.g. large uploaded images) – fail silently.
  }
}

export const loadUserRecipes = () => readLS(LS_KEYS.userRecipes, [])
export const saveUserRecipes = (v) => writeLS(LS_KEYS.userRecipes, v)

export const loadSchedule = () => readLS(LS_KEYS.schedule, {})
export const saveSchedule = (v) => writeLS(LS_KEYS.schedule, v)

export const loadPantry = () => readLS(LS_KEYS.pantry, [])
export const savePantry = (v) => writeLS(LS_KEYS.pantry, v)

export const loadChecked = () => readLS(LS_KEYS.checked, {})
export const saveChecked = (v) => writeLS(LS_KEYS.checked, v)

// --- Week / date helpers (weeks start on Monday) --------------------------
export function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s) {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function weekKey(date) {
  return toISODate(startOfWeek(date))
}

export function dayIndexOf(date) {
  return (date.getDay() + 6) % 7
}

export function deriveSlotFromHour(hour) {
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 15) return 'lunch'
  if (hour >= 17 && hour < 22) return 'dinner'
  return 'snack'
}

// --- Schedule helpers -----------------------------------------------------
// schedule[weekKey][dayIndex][slotKey] = recipeId
export function setSlot(schedule, wk, dayIndex, slotKey, recipeId) {
  const next = { ...schedule }
  const days = { ...(next[wk] || {}) }
  const slots = { ...(days[dayIndex] || {}) }
  if (recipeId == null) {
    delete slots[slotKey]
  } else {
    slots[slotKey] = recipeId
  }
  if (Object.keys(slots).length === 0) {
    delete days[dayIndex]
  } else {
    days[dayIndex] = slots
  }
  if (Object.keys(days).length === 0) {
    delete next[wk]
  } else {
    next[wk] = days
  }
  return next
}

export function removeRecipeFromSchedule(schedule, recipeId) {
  const next = {}
  for (const [wk, days] of Object.entries(schedule)) {
    for (const [dayIndex, slots] of Object.entries(days)) {
      for (const [slotKey, id] of Object.entries(slots)) {
        if (id === recipeId) continue
        next[wk] = next[wk] || {}
        next[wk][dayIndex] = next[wk][dayIndex] || {}
        next[wk][dayIndex][slotKey] = id
      }
    }
  }
  return next
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10)
}