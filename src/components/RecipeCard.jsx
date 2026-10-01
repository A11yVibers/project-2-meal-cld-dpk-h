import React from 'react'
import {
  PLACEHOLDER_IMAGE,
  CUISINES_BY_ID,
  MEAL_TYPES_BY_ID,
  DIETARY_TAGS_BY_ID,
  spiceLabel,
} from '../data.js'

export function RecipeImage({ src, alt, className }) {
  const safe = src && src !== PLACEHOLDER_IMAGE ? src : PLACEHOLDER_IMAGE
  return (
    <img
      className={className || ''}
      src={safe}
      alt={alt || ''}
      loading="lazy"
      onError={(e) => {
        if (e.target.src !== PLACEHOLDER_IMAGE) {
          e.target.src = PLACEHOLDER_IMAGE
        }
      }}
    />
  )
}

function formatTime(min) {
  const total = Number(min) || 0
  if (total === 0) return '—'
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function RecipeCard({ recipe, onOpen }) {
  return (
    <article
      className="recipe-card"
      style={{ '--accent': recipe.accentColor || '#8A9A5B' }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(recipe.id)
        }
      }}
    >
      <div className="recipe-card-img">
        <RecipeImage src={recipe.coverImageUrl} alt={recipe.title} />
        {recipe.isUserCreated && <span className="my-recipe-badge">My recipe</span>}
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        {recipe.shortDescription && <p className="recipe-card-desc">{recipe.shortDescription}</p>}
        <div className="chip-row">
          {recipe.mealTypeId && (
            <span className="chip chip-solid">{MEAL_TYPES_BY_ID[recipe.mealTypeId]?.name}</span>
          )}
          {recipe.cuisineId && (
            <span className="chip">{CUISINES_BY_ID[recipe.cuisineId]?.name}</span>
          )}
          {recipe.dietaryTagIds.slice(0, 3).map((id) => (
            <span key={id} className="chip chip-diet">
              {DIETARY_TAGS_BY_ID[id]?.name}
            </span>
          ))}
        </div>
        <div className="recipe-card-meta">
          <span className="meta-item" title="Total time">
            ⏱ {formatTime(recipe.totalTimeMinutes)}
          </span>
          <span className="meta-item" title="Servings">
            🍽 {recipe.servings}
          </span>
          <span className="meta-item spice" title={`Spice: ${spiceLabel(recipe.spiceLevel)}`}>
            {'🌶'.repeat(Math.min(5, recipe.spiceLevel) || 0) || '–'} {spiceLabel(recipe.spiceLevel)}
          </span>
        </div>
      </div>
    </article>
  )
}