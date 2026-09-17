import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import {
  CUISINES,
  MEAL_TYPES,
  DIETARY_TAGS,
  RECIPE_CATEGORIES,
} from '../lib/data.js'
import RecipeCard from './RecipeCard.jsx'

export default function RecipeCatalog() {
  const { recipes, openRecipe, startAddRecipe } = useApp()
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState('')
  const [dietary, setDietary] = useState('')
  const [category, setCategory] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      if (q && !`${r.title} ${r.shortDescription || ''}`.toLowerCase().includes(q)) return false
      if (cuisine && r.cuisineId !== cuisine) return false
      if (mealType && r.mealTypeId !== mealType) return false
      if (dietary && !(r.dietaryTagIds || []).includes(dietary)) return false
      if (category && !(r.categoryIds || []).includes(category)) return false
      return true
    })
  }, [recipes, query, cuisine, mealType, dietary, category])

  return (
    <div className="catalog">
      <div className="catalog-hero">
        <div>
          <h1>Recipe Catalog</h1>
          <p className="subtle">
            {recipes.length} recipes — browse, filter, and add to your weekly plan.
          </p>
        </div>
        <button className="btn btn-primary" onClick={startAddRecipe}>
          + New Recipe
        </button>
      </div>

      <div className="catalog-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          <option value="">All cuisines</option>
          {CUISINES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option value="">All meal types</option>
          {MEAL_TYPES.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select value={dietary} onChange={(e) => setDietary(e.target.value)}>
          <option value="">All dietary</option>
          {DIETARY_TAGS.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match your filters.</p>
          <button className="btn btn-secondary" onClick={startAddRecipe}>
            Add a new recipe
          </button>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onOpen={openRecipe} />
          ))}
        </div>
      )}
    </div>
  )
}
