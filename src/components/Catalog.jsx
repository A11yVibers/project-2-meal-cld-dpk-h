import React, { useMemo, useState } from 'react'
import RecipeCard from './RecipeCard.jsx'
import { EmptyState } from './ui.jsx'
import { CUISINES, MEAL_TYPES, RECIPE_CATEGORIES } from '../data.js'

export default function Catalog({ recipes, onOpen, onAdd }) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState('')
  const [category, setCategory] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      if (q) {
        const hay = [r.title, r.shortDescription, r.sourceName].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (cuisine && r.cuisineId !== cuisine) return false
      if (mealType && r.mealTypeId !== mealType) return false
      if (category && !r.categoryIds.includes(category)) return false
      return true
    })
  }, [recipes, query, cuisine, mealType, category])

  return (
    <div className="catalog">
      <div className="catalog-head">
        <h2>Recipe catalog</h2>
        <button type="button" className="btn primary" onClick={onAdd}>
          + New recipe
        </button>
      </div>
      <div className="catalog-tools">
        <input
          type="search"
          className="catalog-search"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No recipes found"
          hint="Try adjusting your search or filters."
          action={
            <button type="button" className="btn primary" onClick={onAdd}>
              Create a recipe
            </button>
          }
        />
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}