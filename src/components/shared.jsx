import { PLACEHOLDER_IMAGE } from '../lib/data.js'

export function SpiceMeter({ level = 0, max = 5 }) {
  const labels = ['Mild', 'Mild-medium', 'Medium', 'Medium-hot', 'Hot', 'Very spicy']
  return (
    <span className="spice-meter" title={`Spice: ${labels[Math.min(level, 5)]}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`flame ${i < level ? 'lit' : ''}`}>
          🌶
        </span>
      ))}
    </span>
  )
}

export function SpiceLabel({ level = 0 }) {
  const labels = ['Mild', 'Mild-medium', 'Medium', 'Medium-hot', 'Hot', 'Very spicy']
  return labels[Math.min(Math.max(level, 0), 5)]
}

export function formatMinutes(mins) {
  const m = Number(mins) || 0
  if (m <= 0) return ''
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h} hr ${rem} min` : `${h} hr`
}

export function CoverImage({ url, title, className = '' }) {
  const src = url || PLACEHOLDER_IMAGE
  return (
    <img
      className={`cover-image ${className}`}
      src={src}
      alt={title || 'Recipe'}
      loading="lazy"
      onError={(e) => {
        if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
          e.currentTarget.src = PLACEHOLDER_IMAGE
        }
      }}
    />
  )
}

export function Chip({ children, tone = '' }) {
  return <span className={`chip ${tone}`}>{children}</span>
}
