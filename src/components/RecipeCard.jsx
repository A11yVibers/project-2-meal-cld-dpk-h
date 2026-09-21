import { useMemo } from 'react';
import { APPROVED_IMAGES } from '../approved-images.js';
import { CUISINE_BY_ID, MEAL_TYPE_BY_ID, DIETARY_BY_ID } from '../lib/data.js';
import { spiceLabel } from '../lib/utils.js';

export default function RecipeCard({ recipe, onOpen }) {
  const img = recipe.coverImageUrl || APPROVED_IMAGES.placeholder;
  const total = recipe.totalTime || (Number(recipe.prepTime) + Number(recipe.cookTime));
  const level = Number(recipe.spiceLevel) || 0;
  const peppers = level === 0 ? '' : '🌶'.repeat(Math.min(level, 3));

  return (
    <article
      className="card"
      style={{ '--accent': recipe.accentColor || '#D97757' }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(recipe.id);
        }
      }}
    >
      <div className="card-media">
        <img src={img} alt={recipe.title} loading="lazy" />
        <span className="card-badge card-time">{total} min</span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{recipe.title}</h3>
        <p className="card-desc">{recipe.shortDescription}</p>
        <div className="card-meta">
          {recipe.mealTypeId && <span className="tag">{MEAL_TYPE_BY_ID[recipe.mealTypeId]}</span>}
          {recipe.cuisineId && <span className="tag">{CUISINE_BY_ID[recipe.cuisineId]}</span>}
          <span className="tag">{recipe.servings} servings</span>
          <span className="tag tag-spice" title={`Spice: ${spiceLabel(level)}`}>
            {peppers}
            {peppers ? ' ' : ''}
            {spiceLabel(level)}
          </span>
        </div>
        {recipe.dietaryTagIds.length > 0 && (
          <div className="card-tags">
            {recipe.dietaryTagIds.slice(0, 3).map((id) => (
              <span key={id} className="tag tag-soft">
                {DIETARY_BY_ID[id] || id}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
