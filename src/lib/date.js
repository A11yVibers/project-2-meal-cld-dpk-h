// Date helpers for the weekly meal planner.

export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Monday of the week that contains the given date.
export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

// The seven day keys (Mon–Sun) for the week containing `weekStart` (a Monday).
export function weekDayKeys(weekStartDate) {
  const monday = mondayOf(weekStartDate)
  const keys = []
  for (let i = 0; i < 7; i++) {
    keys.push(toDateKey(addDays(monday, i)))
  }
  return keys
}

export function formatDayLabel(dateKey, style = 'short') {
  const date = parseDateKey(dateKey)
  const weekday = date.toLocaleDateString(undefined, { weekday: style === 'long' ? 'long' : 'short' })
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return { weekday, monthDay }
}

export function formatDateLong(dateKey) {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function isToday(dateKey) {
  return dateKey === toDateKey(new Date())
}

export function todayKey() {
  return toDateKey(new Date())
}
