export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diff)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(str) {
  const [y, m, d] = String(str).split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Monday of the week that contains `date`, expressed as "YYYY-MM-DD".
export function weekKey(date) {
  return toISODate(startOfWeek(date))
}

// Monday = 0 ... Sunday = 6
export function dayIndexOf(date) {
  return (date.getDay() + 6) % 7
}

export function formatWeekLabel(monday) {
  const sunday = addDays(monday, 6)
  const endOpts =
    monday.getFullYear() === sunday.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
  return `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString(undefined, endOpts)}`
}

export function formatDayHeading(date) {
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${DAY_SHORT[dayIndexOf(date)]} ${label}`
}