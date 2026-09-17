import { cuisineName, mealTypeName, categoryNames } from '../lib/data.js'
import { CoverImage, SpiceMeter, formatMinutes } from './shared.jsx'

export default function RecipeCard({ recipe, onOpen }) {
  const accent = recipe.accentColor || '#D97757'
  const categories = categoryNames(recipe.categoryIds || []).slice(0, 3)

  return (
    <button
      className="recipe-card"
      style={{ '--accent': accent }}
      onClick={() => onOpen(recipe.id)}
      aria-label={`Open ${recipe.title}`}
    >
      <div className="recipe-card-media">
        <CoverImage url={recipe.coverImageUrl} title={recipe.title} />
        <span className="recipe-card-meal">{mealTypeName(recipe.mealTypeId) || 'Recipe'}</span>
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <p className="recipe-card-desc">{recipe.shortDescription}</p>
        <div className="recipe-card-meta">
          <span className="meta-item">{cuisineName(recipe.cuisineId)}</span>
          <span className="meta-item">{recipe.servings} servings</span>
          <span className="meta-item">{formatMinutes(recipe.totalTimeMinutes) || '—'}</span>
        </div>
        <div className="recipe-card-footer">
          <SpiceMeter level={recipe.spiceLevel} />
          {categories.length > 0 && (
            <div className="recipe-card-cats">
              {categories.map((c) => (
                <span key={c} className="mini-tag">{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
