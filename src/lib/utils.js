export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function formatNumber(n) {
  if (n === null || n === undefined || n === '') return ''
  const num = Number(n)
  if (!Number.isFinite(num)) return ''
  const rounded = Math.round(num * 100) / 100
  return String(rounded)
}

export function formatMinutes(total) {
  const n = Number(total)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n < 60) return `${n} min`
  const h = Math.floor(n / 60)
  const m = n % 60
  return m ? `${h} hr ${m} min` : `${h} hr`
}

export function formatTimeHM(t) {
  if (!t) return ''
  const parts = String(t).split(':')
  const h = Number(parts[0])
  if (Number.isNaN(h)) return String(t)
  const m = parts[1] != null ? Number(parts[1]) : 0
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}