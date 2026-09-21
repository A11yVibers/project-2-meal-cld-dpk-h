import { useMemo, useState } from 'react';
import { CUISINES, MEAL_TYPES, DIETARY_TAGS, CATEGORIES } from '../lib/data.js';
import RecipeCard from './RecipeCard.jsx';

export default function Catalog({ recipes, onOpen, onAdd }) {
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [mealType, setMealType] = useState('');
  const [dietary, setDietary] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (q) {
        const hay = `${r.title} ${r.shortDescription}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cuisine && r.cuisineId !== cuisine) return false;
      if (mealType && r.mealTypeId !== mealType) return false;
      if (dietary && !r.dietaryTagIds.includes(dietary)) return false;
      if (category && !r.categoryIds.includes(category)) return false;
      return true;
    });
  }, [recipes, query, cuisine, mealType, dietary, category]);

  function resetFilters() {
    setQuery('');
    setCuisine('');
    setMealType('');
    setDietary('');
    setCategory('');
  }

  const hasFilters = query || cuisine || mealType || dietary || category;

  return (
    <section className="page" aria-labelledby="catalog-heading">
      <header className="page-header">
        <div>
          <h1 id="catalog-heading">Recipe catalog</h1>
          <p className="page-sub">
            {recipes.length} recipes · browse, open, and plan your week
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          + New recipe
        </button>
      </header>

      <div className="filterbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search recipes"
        />
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {CUISINES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={mealType} onChange={(e) => setMealType(e.target.value)} aria-label="Filter by meal type">
          <option value="">All meal types</option>
          {MEAL_TYPES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={dietary} onChange={(e) => setDietary(e.target.value)} aria-label="Filter by dietary tag">
          <option value="">All dietary tags</option>
          {DIETARY_TAGS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button className="btn btn-ghost" onClick={resetFilters}>
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match your filters.</p>
          {hasFilters && (
            <button className="btn btn-ghost" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
