import { useMemo } from 'react';
import { APPROVED_IMAGES } from '../approved-images.js';
import {
  CUISINE_BY_ID,
  MEAL_TYPE_BY_ID,
  DIETARY_BY_ID,
  CATEGORY_BY_ID,
} from '../lib/data.js';
import { convertQuantity, difficultyLabel, formatQuantity, spiceLabel } from '../lib/utils.js';

function Meta({ label, children }) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{children}</span>
    </div>
  );
}

export default function RecipeDetail({ recipe, onBack, onAddToPlan }) {
  const img = recipe.coverImageUrl || APPROVED_IMAGES.placeholder;
  const total = recipe.totalTime || (Number(recipe.prepTime) + Number(recipe.cookTime));
  const metric = recipe.measurementSystem === 'metric';

  const sections = useMemo(() => {
    const map = new Map();
    for (const ing of recipe.ingredients || []) {
      const name = ing.section || 'Ingredients';
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(ing);
    }
    return [...map.entries()];
  }, [recipe.ingredients]);

  return (
    <section className="page page-detail" aria-labelledby="detail-title">
      <div className="detail-topbar">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back to recipes
        </button>
        <button className="btn btn-primary" onClick={() => onAddToPlan(recipe.id)}>
          + Add to meal plan
        </button>
      </div>

      <header className="detail-hero">
        <div className="detail-img" style={{ '--accent': recipe.accentColor || '#D97757' }}>
          <img src={img} alt={recipe.title} />
        </div>
        <div className="detail-head">
          <h1 id="detail-title">{recipe.title}</h1>
          {recipe.shortDescription && <p className="detail-desc">{recipe.shortDescription}</p>}
          {recipe.sourceUrl ? (
            <a className="detail-source" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              Source: {recipe.sourceName || recipe.sourceUrl}
            </a>
          ) : recipe.sourceName ? (
            <p className="detail-source">Source: {recipe.sourceName}</p>
          ) : null}

          <div className="meta-grid">
            <Meta label="Meal type">{MEAL_TYPE_BY_ID[recipe.mealTypeId] || '—'}</Meta>
            <Meta label="Cuisine">{CUISINE_BY_ID[recipe.cuisineId] || '—'}</Meta>
            <Meta label="Servings">{recipe.servings}</Meta>
            <Meta label="Prep time">{recipe.prepTime} min</Meta>
            <Meta label="Cook time">{recipe.cookTime} min</Meta>
            <Meta label="Total time">{total} min</Meta>
            <Meta label="Spice">{spiceLabel(recipe.spiceLevel)}</Meta>
            <Meta label="Difficulty">{difficultyLabel(recipe.difficulty) || '—'}</Meta>
          </div>

          <div className="chip-row" aria-label="Tags">
            {(recipe.dietaryTagIds || []).map((id) => (
              <span key={id} className="chip chip-readonly">
                {DIETARY_BY_ID[id] || id}
              </span>
            ))}
            {(recipe.categoryIds || []).map((id) => (
              <span key={id} className="chip chip-readonly">
                {CATEGORY_BY_ID[id] || id}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="options-badges" aria-label="Recipe options">
        <span className={`badge ${recipe.includeInShoppingList ? 'badge-on' : 'badge-off'}`}>
          {recipe.includeInShoppingList ? '✓ In shopping list' : '✕ Excluded from shopping list'}
        </span>
        <span className={`badge ${recipe.showNutrition ? 'badge-on' : 'badge-off'}`}>
          {recipe.showNutrition ? '✓ Nutrition shown' : '✕ Nutrition hidden'}
        </span>
        <span className={`badge ${recipe.allowSubstitutions ? 'badge-on' : 'badge-off'}`}>
          {recipe.allowSubstitutions ? '✓ Substitutions allowed' : '✕ Substitutions off'}
        </span>
        <span className="badge badge-neutral">
          {metric ? 'Metric measurements' : 'US customary measurements'}
        </span>
      </div>

      <div className="detail-grid">
        <section className="detail-section" aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading">Ingredients</h2>
          {sections.length === 0 ? (
            <p className="muted">No ingredients listed.</p>
          ) : (
            sections.map(([sectionName, ings]) => (
              <div key={sectionName} className="ing-section">
                {sectionName !== 'Ingredients' && <h3 className="ing-section-title">{sectionName}</h3>}
                <ul className="ing-list">
                  {ings.map((ing) => {
                    const c = convertQuantity(ing.quantity, ing.unit, metric);
                    return (
                      <li key={ing.id} className="ing-item">
                        <span className="ing-qty">{formatQuantity(c.qty, c.unit)}</span>
                        <span className="ing-name">{ing.name}</span>
                        {ing.notes && <span className="ing-notes">({ing.notes})</span>}
                        {ing.optional && <span className="ing-optional">optional</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="detail-section" aria-labelledby="method-heading">
          <h2 id="method-heading">Method</h2>
          {recipe.steps.length === 0 ? (
            <p className="muted">No steps listed.</p>
          ) : (
            <ol className="step-list">
              {recipe.steps.map((step, i) => (
                <li key={step.id} className="step-item">
                  <span className="step-num">{i + 1}</span>
                  <div className="step-content">
                    <p className="step-text">{step.instruction}</p>
                    {Number(step.timerMinutes) > 0 && (
                      <span className="step-timer">⏱ {step.timerMinutes} min</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {recipe.showNutrition && (
        <section className="detail-section nutrition-panel" aria-labelledby="nutrition-heading">
          <h2 id="nutrition-heading">Nutrition</h2>
          <p className="muted">
            Nutrition information is enabled for this recipe. Detailed per-serving nutrition
            data isn't included with this recipe yet.
          </p>
        </section>
      )}
    </section>
  );
}
