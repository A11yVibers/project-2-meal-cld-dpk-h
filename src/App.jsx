import React, { useEffect, useMemo, useState } from 'react'
import { SEED_RECIPES } from './data.js'
import {
  loadUserRecipes,
  saveUserRecipes,
  loadSchedule,
  saveSchedule,
  loadPantry,
  savePantry,
  loadChecked,
  saveChecked,
  setSlot,
  weekKey,
  dayIndexOf,
  parseISODate,
} from './store.js'
import Catalog from './components/Catalog.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

const VIEWS = [
  { key: 'catalog', label: 'Recipes' },
  { key: 'planner', label: 'Planner' },
  { key: 'shopping', label: 'Shopping list' },
]

export default function App() {
  const [view, setView] = useState('catalog')
  const [userRecipes, setUserRecipes] = useState(() => loadUserRecipes())
  const [schedule, setSchedule] = useState(() => loadSchedule())
  const [pantry, setPantry] = useState(() => loadPantry())
  const [checked, setChecked] = useState(() => loadChecked())
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => saveUserRecipes(userRecipes), [userRecipes])
  useEffect(() => saveSchedule(schedule), [schedule])
  useEffect(() => savePantry(pantry), [pantry])
  useEffect(() => saveChecked(checked), [checked])

  const recipes = useMemo(() => [...userRecipes, ...SEED_RECIPES], [userRecipes])
  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.id === selectedId) || null,
    [recipes, selectedId]
  )

  const handleAddRecipe = (recipe, planInfo) => {
    setUserRecipes((prev) => [recipe, ...prev])
    if (planInfo && planInfo.date && planInfo.slot) {
      const date = parseISODate(planInfo.date)
      setSchedule((prev) => setSlot(prev, weekKey(date), dayIndexOf(date), planInfo.slot, recipe.id))
    }
    setView('catalog')
  }

  const handleDetailAssign = (dateStr, slotKey) => {
    const date = parseISODate(dateStr)
    setSchedule((prev) => setSlot(prev, weekKey(date), dayIndexOf(date), slotKey, selectedId))
  }

  const handleAssign = (wk, dayIndex, slotKey, recipeId) => {
    setSchedule((prev) => setSlot(prev, wk, dayIndex, slotKey, recipeId))
  }

  const handleRemove = (wk, dayIndex, slotKey) => {
    setSchedule((prev) => setSlot(prev, wk, dayIndex, slotKey, null))
  }

  const handleTogglePantry = (name) => {
    const key = name.trim().toLowerCase()
    setPantry((prev) => (prev.includes(key) ? prev.filter((n) => n !== key) : [...prev, key]))
  }

  const handleToggleChecked = (key) => {
    setChecked((prev) => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      return next
    })
  }

  const handleClearChecked = () => setChecked({})

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand" onClick={() => setView('catalog')} role="button" tabIndex={0}>
          <span className="app-logo" aria-hidden="true">
            🥘
          </span>
          <span className="app-name">Meal Planner</span>
        </div>
        <nav className="app-nav" aria-label="Main navigation">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              className={'nav-tab' + (view === v.key ? ' active' : '')}
              aria-current={view === v.key ? 'page' : undefined}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <button type="button" className="btn primary nav-add" onClick={() => setView('add')}>
          + New recipe
        </button>
      </header>

      <main className="app-main">
        {view === 'catalog' && (
          <Catalog recipes={recipes} onOpen={setSelectedId} onAdd={() => setView('add')} />
        )}
        {view === 'add' && (
          <RecipeForm onSave={handleAddRecipe} onCancel={() => setView('catalog')} />
        )}
        {view === 'planner' && (
          <Planner
            recipes={recipes}
            schedule={schedule}
            onAssign={handleAssign}
            onRemove={handleRemove}
            onOpenRecipe={setSelectedId}
            onOpenCatalog={() => setView('catalog')}
          />
        )}
        {view === 'shopping' && (
          <ShoppingList
            schedule={schedule}
            recipes={recipes}
            pantry={pantry}
            onTogglePantry={handleTogglePantry}
            checked={checked}
            onToggleChecked={handleToggleChecked}
            onClearChecked={handleClearChecked}
            onOpenPlanner={() => setView('planner')}
          />
        )}
      </main>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedId(null)}
          onAssign={handleDetailAssign}
        />
      )}
    </div>
  )
}