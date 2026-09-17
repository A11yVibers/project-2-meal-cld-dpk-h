// Lightweight, approximate unit conversion for the per-recipe
// US-customary / metric measurement preference.

const US_TO_METRIC = {
  oz: { unit: 'g', factor: 28.3495 },
  lb: { unit: 'g', factor: 453.592 },
  cup: { unit: 'ml', factor: 236.588 },
  tbsp: { unit: 'ml', factor: 14.7868 },
  tsp: { unit: 'ml', factor: 4.92892 },
  'fl oz': { unit: 'ml', factor: 29.5735 },
  pint: { unit: 'ml', factor: 473.176 },
  quart: { unit: 'ml', factor: 946.353 },
  gallon: { unit: 'L', factor: 3.78541 },
}

const METRIC_TO_US = {
  g: { unit: 'oz', factor: 1 / 28.3495 },
  kg: { unit: 'lb', factor: 2.20462 },
  ml: { unit: 'cup', factor: 1 / 236.588 },
  L: { unit: 'cup', factor: 4.22675 },
}

// Units that should not be converted in either direction.
const UNCONVERTIBLE = new Set([
  'piece', 'clove', 'can', 'package', 'pinch', 'to taste', 'bunch', 'slice', 'handful', 'sprig',
])

function round(n) {
  if (Math.abs(n) >= 100) return Math.round(n).toString()
  if (Math.abs(n) >= 10) return (Math.round(n * 10) / 10).toString()
  return (Math.round(n * 100) / 100).toString()
}

function parseQty(q) {
  const s = String(q).trim()
  if (!s) return null
  // Fractions such as "1/2" or "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

// Convert a quantity/unit pair into the requested measurement system.
// Returns { quantity: string, unit: string } (or the original if unconvertible).
export function convertQuantity(quantity, unit, system) {
  const u = (unit || '').trim().toLowerCase()
  const q = parseQty(quantity)
  if (q == null || !u || UNCONVERTIBLE.has(u)) {
    return { quantity: String(quantity ?? ''), unit: unit || '' }
  }

  if (system === 'metric') {
    const conv = US_TO_METRIC[u]
    if (!conv) return { quantity: String(quantity ?? ''), unit: unit || '' }
    let value = q * conv.factor
    let outUnit = conv.unit
    if (conv.unit === 'g' && value >= 1000) {
      value /= 1000
      outUnit = 'kg'
    } else if (conv.unit === 'ml' && value >= 1000) {
      value /= 1000
      outUnit = 'L'
    }
    return { quantity: round(value), unit: outUnit }
  }

  // system === 'us'
  const conv = METRIC_TO_US[u]
  if (!conv) return { quantity: String(quantity ?? ''), unit: unit || '' }
  let value = q * conv.factor
  let outUnit = conv.unit
  if (conv.unit === 'cup' && value >= 4) {
    value /= 4
    outUnit = 'quart'
  }
  return { quantity: round(value), unit: outUnit }
}

// Display a quantity + unit according to a measurement system.
export function formatIngredientAmount(quantity, unit, system) {
  const { quantity: q, unit: u } = convertQuantity(quantity, unit, system)
  if (!q) return u || ''
  if (!u) return q
  return `${q} ${u}`
}
