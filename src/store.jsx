import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SEED_RECIPES, DEFAULT_RECIPE_OPTIONS } from './lib/data.js'
import { loadJSON, saveJSON, makeId } from './lib/storage.js'
import { buildShoppingList } from './lib/shopping.js'

const AppContext = createContext(null)

const initialUserRecipes = () => loadJSON('userRecipes', [])
const initialMealPlan = () => loadJSON('mealPlan', {})
const initialShopping = () =>
  loadJSON('shopping', { checked: {}, pantry: [] })

export function AppProvider({ children }) {
  const [userRecipes, setUserRecipes] = useState(initialUserRecipes)
  const [mealPlan, setMealPlan] = useState(initialMealPlan)
  const [shopping, setShopping] = useState(initialShopping)

  // Navigation state.
  const [view, setView] = useState('recipes')
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)

  useEffect(() => saveJSON('userRecipes', userRecipes), [userRecipes])
  useEffect(() => saveJSON('mealPlan', mealPlan), [mealPlan])
  useEffect(() => saveJSON('shopping', shopping), [shopping])

  const recipes = useMemo(() => [...SEED_RECIPES, ...userRecipes], [userRecipes])

  const recipesById = useMemo(() => {
    const map = {}
    for (const r of recipes) map[r.id] = r
    return map
  }, [recipes])

  const shoppingList = useMemo(
    () => buildShoppingList(recipesById, mealPlan),
    [recipesById, mealPlan]
  )

  // ---- Recipe actions ------------------------------------------------------

  function addRecipe(recipe) {
    const id = makeId('U')
    const complete = {
      ...recipe,
      id,
      isSeed: false,
      options: { ...DEFAULT_RECIPE_OPTIONS, ...(recipe.options || {}) },
    }
    setUserRecipes((prev) => [...prev, complete])
    return complete
  }

  function updateRecipe(recipe) {
    setUserRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)))
  }

  function deleteRecipe(id) {
    setUserRecipes((prev) => prev.filter((r) => r.id !== id))
    // Remove any meal-plan references to the deleted recipe.
    setMealPlan((prev) => {
      const next = {}
      for (const dateKey of Object.keys(prev)) {
        const day = prev[dateKey]
        const newDay = {}
        for (const slot of Object.keys(day)) {
          const entry = day[slot]
          newDay[slot] = entry && entry.recipeId === id ? null : entry
        }
        next[dateKey] = newDay
      }
      return next
    })
    if (selectedRecipeId === id) {
      setSelectedRecipeId(null)
      setView('recipes')
    }
  }

  // ---- Meal plan actions ---------------------------------------------------

  function assignToSlot(dateKey, slot, recipeId, time) {
    setMealPlan((prev) => {
      const day = { ...(prev[dateKey] || {}) }
      day[slot] = { recipeId, time: time || null }
      return { ...prev, [dateKey]: day }
    })
  }

  function removeFromSlot(dateKey, slot) {
    setMealPlan((prev) => {
      const day = { ...(prev[dateKey] || {}) }
      day[slot] = null
      return { ...prev, [dateKey]: day }
    })
  }

  // ---- Navigation ----------------------------------------------------------

  function openRecipe(id) {
    setSelectedRecipeId(id)
    setView('recipeDetail')
  }

  function startAddRecipe() {
    setSelectedRecipeId(null)
    setView('addRecipe')
  }

  function startEditRecipe(id) {
    setSelectedRecipeId(id)
    setView('editRecipe')
  }

  // ---- Shopping list actions ----------------------------------------------

  function toggleChecked(itemKey) {
    setShopping((prev) => {
      const checked = { ...(prev.checked || {}) }
      checked[itemKey] = !checked[itemKey]
      return { ...prev, checked }
    })
  }

  function clearChecked() {
    setShopping((prev) => ({ ...prev, checked: {} }))
  }

  function addPantryItem(name) {
    const n = (name || '').trim()
    if (!n) return
    setShopping((prev) => {
      const pantry = prev.pantry || []
      if (pantry.some((p) => p.toLowerCase() === n.toLowerCase())) return prev
      return { ...prev, pantry: [...pantry, n] }
    })
  }

  function removePantryItem(name) {
    setShopping((prev) => ({
      ...prev,
      pantry: (prev.pantry || []).filter((p) => p.toLowerCase() !== name.toLowerCase()),
    }))
  }

  const pantrySet = useMemo(
    () => new Set((shopping.pantry || []).map((p) => p.toLowerCase())),
    [shopping.pantry]
  )

  const value = {
    recipes,
    recipesById,
    userRecipes,
    mealPlan,
    shopping,
    shoppingList,
    pantrySet,
    checked: shopping.checked || {},
    view,
    selectedRecipeId,
    setView,
    openRecipe,
    startAddRecipe,
    startEditRecipe,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    assignToSlot,
    removeFromSlot,
    toggleChecked,
    clearChecked,
    addPantryItem,
    removePantryItem,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
