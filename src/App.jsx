import { useCallback, useMemo, useState } from 'react';
import { SEED_RECIPES } from './lib/data.js';
import { buildShoppingList } from './lib/shopping.js';
import { usePersistentState } from './hooks.js';
import { formatDateMedium, parseDateKey } from './lib/utils.js';
import NavBar from './components/NavBar.jsx';
import Catalog from './components/Catalog.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';
import RecipeForm from './components/RecipeForm.jsx';
import MealPlanner from './components/MealPlanner.jsx';
import ShoppingList from './components/ShoppingList.jsx';
import MealSlotPicker from './components/MealSlotPicker.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [view, setView] = useState('catalog');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [picker, setPicker] = useState(null);
  const [toast, setToast] = useState(null);

  const [userRecipes, setUserRecipes] = usePersistentState('mealplan.userRecipes.v1', []);
  const [schedule, setSchedule] = usePersistentState('mealplan.schedule.v1', {});
  const [checked, setChecked] = usePersistentState('mealplan.checked.v1', {});
  const [pantry, setPantry] = usePersistentState('mealplan.pantry.v1', {});

  const recipes = useMemo(() => [...SEED_RECIPES, ...userRecipes], [userRecipes]);
  const recipesById = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes]);

  const shoppingItems = useMemo(
    () => buildShoppingList(schedule, recipesById),
    [schedule, recipesById]
  );

  const activeShoppingCount = useMemo(
    () => shoppingItems.filter((i) => !checked[i.key] && !pantry[i.key]).length,
    [shoppingItems, checked, pantry]
  );

  const scheduledCount = useMemo(() => {
    const ids = new Set();
    for (const dateKey of Object.keys(schedule)) {
      for (const slot of Object.keys(schedule[dateKey] || {})) {
        ids.add(schedule[dateKey][slot]);
      }
    }
    return ids.size;
  }, [schedule]);

  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);

  const navigate = useCallback((next) => {
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  const openRecipe = useCallback((id) => {
    setSelectedRecipeId(id);
    setView('detail');
    window.scrollTo({ top: 0 });
  }, []);

  const openPickerForRecipe = useCallback((recipeId) => {
    setPicker({ recipeId });
  }, []);

  const openPickerForSlot = useCallback((dateKey, slot) => {
    setPicker({ dateKey, slot });
  }, []);

  const closePicker = useCallback(() => setPicker(null), []);

  const assignSlot = useCallback(
    (dateKey, slot, recipeId) => {
      setSchedule((prev) => ({
        ...prev,
        [dateKey]: { ...(prev[dateKey] || {}), [slot]: recipeId },
      }));
      setPicker(null);
      const recipe = recipesById[recipeId];
      showToast(`Added "${recipe?.title || 'recipe'}" to ${formatDateMedium(parseDateKey(dateKey))} · ${slot}`);
    },
    [setSchedule, recipesById, showToast]
  );

  const removeSlot = useCallback(
    (dateKey, slot) => {
      const recipe = recipesById[schedule[dateKey]?.[slot]];
      setSchedule((prev) => {
        const day = { ...(prev[dateKey] || {}) };
        delete day[slot];
        const next = { ...prev };
        if (Object.keys(day).length) next[dateKey] = day;
        else delete next[dateKey];
        return next;
      });
      if (recipe) {
        showToast(`Removed "${recipe.title}" from ${formatDateMedium(parseDateKey(dateKey))} · ${slot}`);
      }
    },
    [schedule, setSchedule, recipesById, showToast]
  );

  const saveRecipe = useCallback(
    (recipe, planInfo) => {
      setUserRecipes((prev) => [...prev, recipe]);
      if (planInfo) {
        setSchedule((prev) => ({
          ...prev,
          [planInfo.dateKey]: { ...(prev[planInfo.dateKey] || {}), [planInfo.slot]: recipe.id },
        }));
        showToast(`"${recipe.title}" saved and added to your meal plan.`);
      } else {
        showToast(`"${recipe.title}" saved to your recipes.`);
      }
      navigate('catalog');
    },
    [setUserRecipes, setSchedule, showToast, navigate]
  );

  const toggleChecked = useCallback((key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, [setChecked]);

  const togglePantry = useCallback((key) => {
    setPantry((prev) => ({ ...prev, [key]: !prev[key] }));
  }, [setPantry]);

  const uncheckAll = useCallback(() => setChecked({}), [setChecked]);
  const restoreAllPantry = useCallback(() => setPantry({}), [setPantry]);

  let content;
  if (view === 'detail' && selectedRecipeId && recipesById[selectedRecipeId]) {
    content = (
      <RecipeDetail
        recipe={recipesById[selectedRecipeId]}
        onBack={() => navigate('catalog')}
        onAddToPlan={openPickerForRecipe}
      />
    );
  } else if (view === 'add') {
    content = <RecipeForm onSave={saveRecipe} onCancel={() => navigate('catalog')} />;
  } else if (view === 'planner') {
    content = (
      <MealPlanner
        schedule={schedule}
        recipesById={recipesById}
        onOpenRecipe={openRecipe}
        onPickSlot={openPickerForSlot}
        onRemove={removeSlot}
      />
    );
  } else if (view === 'shopping') {
    content = (
      <ShoppingList
        items={shoppingItems}
        checked={checked}
        pantry={pantry}
        scheduledCount={scheduledCount}
        onToggleChecked={toggleChecked}
        onTogglePantry={togglePantry}
        onUncheckAll={uncheckAll}
        onRestoreAllPantry={restoreAllPantry}
      />
    );
  } else {
    content = (
      <Catalog
        recipes={recipes}
        onOpen={openRecipe}
        onAdd={() => navigate('add')}
      />
    );
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <NavBar view={view} onNavigate={navigate} shoppingCount={activeShoppingCount} />
      <main id="main-content" className="main">{content}</main>

      {picker && (
        <MealSlotPicker
          recipes={recipes}
          recipesById={recipesById}
          fixedRecipeId={picker.recipeId}
          fixedDateKey={picker.dateKey}
          fixedSlot={picker.slot}
          onAssign={assignSlot}
          onClose={closePicker}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
