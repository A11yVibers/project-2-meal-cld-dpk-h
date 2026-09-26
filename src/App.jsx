import { useEffect, useMemo, useRef, useState } from 'react'
import { DATA } from './data/loadData.js'
import { dayIndexOf, parseISODate, toISODate, weekKey } from './lib/dates.js'
import { loadItem, saveItem } from './lib/storage.js'
import { buildShoppingList } from './lib/shopping.js'
import { clone } from './lib/utils.js'
import RecipeCard from './components/RecipeCard.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import MealPlanner from './components/MealPlanner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

export default function App() {
  const [userRecipes, setUserRecipes] = useState(() => loadItem('recipes', []))
  const [mealPlan, setMealPlan] = useState(() => loadItem('mealPlan', {}))
  const [checked, setChecked] = useState(() => new Set(loadItem('checked', [])))
  const [pantry, setPantry] = useState(() => new Set(loadItem('pantry', [])))
  const [excludePantry, setExcludePantry] = useState(() => loadItem('excludePantry', false))
  const [plannerWeek, setPlannerWeek] = useState(() => loadItem('plannerWeek', weekKey(new Date())))

  const [view, setView] = useState('catalog')
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [toast, setToast] = useState(null)

  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogMealType, setCatalogMealType] = useState('')
  const [catalogDietary, setCatalogDietary] = useState('')

  const toastTimer = useRef(null)

  // Persist everything that should survive a refresh.
  useEffect(() => saveItem('recipes', userRecipes), [userRecipes])
  useEffect(() => saveItem('mealPlan', mealPlan), [mealPlan])
  useEffect(() => saveItem('checked', Array.from(checked)), [checked])
  useEffect(() => saveItem('pantry', Array.from(pantry)), [pantry])
  useEffect(() => saveItem('excludePantry', excludePantry), [excludePantry])
  useEffect(() => saveItem('plannerWeek', plannerWeek), [plannerWeek])

  const recipes = useMemo(() => [...userRecipes, ...DATA.seedRecipes], [userRecipes])
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])

  const shoppingGroups = useMemo(() => buildShoppingList(recipes, mealPlan), [recipes, mealPlan])

  const filteredRecipes = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase()
    return recipes.filter((r) => {
      if (q && !(r.title.toLowerCase().includes(q) || (r.shortDescription || '').toLowerCase().includes(q))) return false
      if (catalogMealType && r.mealTypeId !== catalogMealType) return false
      if (catalogDietary && !(r.dietaryTagIds || []).includes(catalogDietary)) return false
      return true
    })
  }, [recipes, catalogQuery, catalogMealType, catalogDietary])

  function showToast(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  function go(viewName, id) {
    setSelectedRecipeId(id || null)
    setView(viewName)
    window.scrollTo(0, 0)
  }

  function assignRecipe(weekKeyStr, dayIndex, slot, assignment) {
    setMealPlan((prev) => {
      const next = clone(prev)
      next[weekKeyStr] = next[weekKeyStr] || {}
      next[weekKeyStr][dayIndex] = next[weekKeyStr][dayIndex] || {}
      next[weekKeyStr][dayIndex][slot] = assignment
      return next
    })
  }

  function removeAssignment(weekKeyStr, dayIndex, slot) {
    setMealPlan((prev) => {
      const next = clone(prev)
      const day = next[weekKeyStr] && next[weekKeyStr][dayIndex]
      if (day) delete day[slot]
      return next
    })
  }

  function currentAssignment(weekKeyStr, dayIndex, slot) {
    const assignment = mealPlan[weekKeyStr] && mealPlan[weekKeyStr][dayIndex] && mealPlan[weekKeyStr][dayIndex][slot]
    return assignment ? recipeById.get(assignment.recipeId) : null
  }

  function addToPlan(recipeId, dateISO, slot, time) {
    const d = dateISO ? parseISODate(dateISO) : new Date()
    const wk = weekKey(d)
    const dayIdx = dayIndexOf(d)
    const recipe = recipeById.get(recipeId)
    const previous = currentAssignment(wk, dayIdx, slot)
    assignRecipe(wk, dayIdx, slot, { recipeId, time: time || '' })
    setPlannerWeek(wk)
    showToast(previous ? `Replaced ${previous.title} with ${recipe.title}` : `${recipe.title} added to ${toISODate(d)}`)
  }

  function removeFromPlan(wk, dayIdx, slot) {
    const previous = currentAssignment(wk, dayIdx, slot)
    removeAssignment(wk, dayIdx, slot)
    if (previous) showToast(`Removed ${previous.title} from the plan`)
  }

  function handleSaveRecipe(recipe, planConfig) {
    setUserRecipes((prev) => [recipe, ...prev])
    if (planConfig) {
      const d = planConfig.date ? parseISODate(planConfig.date) : new Date()
      const wk = weekKey(d)
      assignRecipe(wk, dayIndexOf(d), planConfig.slot, { recipeId: recipe.id, time: planConfig.time || '' })
      setPlannerWeek(wk)
    }
    go('catalog')
    showToast(`${recipe.title} saved`)
  }

  function toggleChecked(key) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function togglePantry(ingredientKey) {
    setPantry((prev) => {
      const next = new Set(prev)
      if (next.has(ingredientKey)) next.delete(ingredientKey)
      else next.add(ingredientKey)
      return next
    })
  }

  const selectedRecipe = selectedRecipeId ? recipeById.get(selectedRecipeId) : null

  const plannedCount = Object.values(mealPlan).reduce(
    (acc, week) => acc + Object.values(week).reduce((a, day) => a + Object.keys(day).length, 0),
    0
  )

  const shoppingCount = Object.values(shoppingGroups).reduce((a, items) => a + items.length, 0)

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <button type="button" className="brand" onClick={() => go('catalog')}>Meal Planner</button>
          <nav className="main-nav">
            <button type="button" className={view === 'catalog' ? 'active' : ''} onClick={() => go('catalog')}>Recipes</button>
            <button type="button" className={view === 'planner' ? 'active' : ''} onClick={() => go('planner')}>Meal Plan</button>
            <button type="button" className={view === 'shopping' ? 'active' : ''} onClick={() => go('shopping')}>
              Shopping List{shoppingCount > 0 ? <span className="nav-badge">{shoppingCount}</span> : null}
            </button>
            <button type="button" className="nav-add" onClick={() => go('new')}>+ Add recipe</button>
          </nav>
        </div>
      </header>

      <main className="main">
        {view === 'catalog' && (
          <div className="catalog">
            <div className="page-head">
              <h1>Recipe catalog</h1>
              <p>Browse the collection. Open a recipe for full details or add a new one of your own.</p>
            </div>

            <div className="catalog-filters">
              <input
                className="filter-search"
                type="text"
                value={catalogQuery}
                placeholder="Search recipes…"
                onChange={(e) => setCatalogQuery(e.target.value)}
              />
              <select value={catalogMealType} onChange={(e) => setCatalogMealType(e.target.value)}>
                <option value="">All meal types</option>
                {DATA.mealTypes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={catalogDietary} onChange={(e) => setCatalogDietary(e.target.value)}>
                <option value="">All dietary tags</option>
                {DATA.dietaryTags.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="empty-state">
                <h3>No recipes found</h3>
                <p>Try a different search, or add a new recipe.</p>
              </div>
            ) : (
              <div className="recipe-grid">
                {filteredRecipes.map((r) => (
                  <RecipeCard key={r.id} recipe={r} onOpen={(id) => go('detail', id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onBack={() => go('catalog')}
            onAddToPlan={addToPlan}
          />
        )}

        {view === 'new' && (
          <RecipeForm onSave={handleSaveRecipe} onCancel={() => go('catalog')} />
        )}

        {view === 'planner' && (
          <MealPlanner
            recipes={recipes}
            mealPlan={mealPlan}
            plannerWeek={plannerWeek}
            onWeekChange={setPlannerWeek}
            onAssign={(wk, di, slot, recipeId, time) => assignRecipe(wk, di, slot, { recipeId, time: time || '' })}
            onRemove={removeFromPlan}
            onOpenRecipe={(id) => go('detail', id)}
          />
        )}

        {view === 'shopping' && (
          <ShoppingList
            grouped={shoppingGroups}
            checked={checked}
            pantry={pantry}
            excludePantry={excludePantry}
            totalPlanned={plannedCount}
            onToggleChecked={toggleChecked}
            onTogglePantry={togglePantry}
            onToggleExcludePantry={setExcludePantry}
          />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}