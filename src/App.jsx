import { AppProvider, useApp } from './store.jsx'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import MealPlanner from './components/MealPlanner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

function Shell() {
  const { view, recipesById, selectedRecipeId } = useApp()

  let content
  switch (view) {
    case 'recipeDetail':
      content = <RecipeDetail recipe={recipesById[selectedRecipeId]} />
      break
    case 'addRecipe':
      content = <RecipeForm recipe={null} />
      break
    case 'editRecipe':
      content = <RecipeForm recipe={recipesById[selectedRecipeId]} />
      break
    case 'planner':
      content = <MealPlanner />
      break
    case 'shopping':
      content = <ShoppingList />
      break
    default:
      content = <RecipeCatalog />
  }

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">{content}</main>
    </div>
  )
}

function Navbar() {
  const { view, setView } = useApp()

  const tabs = [
    { key: 'recipes', label: 'Cookbook' },
    { key: 'planner', label: 'Meal Planner' },
    { key: 'shopping', label: 'Shopping List' },
  ]

  const activeTab = view === 'recipeDetail' || view === 'addRecipe' || view === 'editRecipe' ? 'recipes' : view

  return (
    <header className="navbar">
      <button className="brand" onClick={() => setView('recipes')}>
        <span className="brand-mark">🍽</span> Meal Planner
      </button>
      <nav className="nav-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`nav-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setView(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
