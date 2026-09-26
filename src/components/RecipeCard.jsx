import { PLACEHOLDER_IMAGE, lookups } from '../data/loadData.js'
import { formatMinutes } from '../lib/utils.js'

export function SpiceMeter({ level }) {
  const n = Math.max(0, Math.min(5, Number(level) || 0))
  return (
    <span className="spice-meter" title={`Spice level ${n} of 5`} aria-label={`Spice level ${n} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={'spice-dot' + (i < n ? ' on' : '')} />
      ))}
    </span>
  )
}

export default function RecipeCard({ recipe, onOpen }) {
  const img = recipe.coverImageUrl || PLACEHOLDER_IMAGE
  const total = recipe.totalTimeMinutes || recipe.prepTimeMinutes + recipe.cookTimeMinutes
  const dietary = lookups.dietaryNames(recipe.dietaryTagIds).slice(0, 3)

  return (
    <article className="recipe-card" onClick={() => onOpen(recipe.id)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(recipe.id) } }}>
      <div className="recipe-card-accent" style={{ backgroundColor: recipe.accentColor || '#D97757' }} />
      <div className="recipe-card-thumb">
        <img
          src={img}
          alt={recipe.title}
          loading="lazy"
          onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER_IMAGE) e.currentTarget.src = PLACEHOLDER_IMAGE }}
        />
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          <span>{lookups.mealTypeName(recipe.mealTypeId) || 'Meal'}</span>
          {lookups.cuisineName(recipe.cuisineId) ? <span>{lookups.cuisineName(recipe.cuisineId)}</span> : null}
          <span>{recipe.servings} servings</span>
          {total ? <span>{formatMinutes(total)}</span> : null}
        </div>
        <div className="recipe-card-footer">
          <SpiceMeter level={recipe.spiceLevel} />
          {dietary.length > 0 && (
            <div className="tag-list">
              {dietary.map((d) => (
                <span key={d} className="tag tag-dietary">{d}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}