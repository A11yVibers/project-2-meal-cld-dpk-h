import { INGREDIENT_BY_NAME, SHOPPING_CATEGORIES } from './data.js';
import { fmtQty } from './utils.js';

// Derive a shopping list from the meal-plan schedule.
// `schedule` looks like: { [dateKey]: { [slot]: recipeId } }
// `recipesById` maps every recipe id (seed + user) to its recipe object.
export function buildShoppingList(schedule, recipesById) {
  const entries = new Map();
  const order = [];

  for (const dateKey of Object.keys(schedule || {})) {
    const day = schedule[dateKey] || {};
    for (const slot of Object.keys(day)) {
      const recipe = recipesById[day[slot]];
      if (!recipe || recipe.includeInShoppingList === false) continue;

      for (const ing of recipe.ingredients || []) {
        const name = (ing.name || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();

        if (!entries.has(key)) {
          const match = INGREDIENT_BY_NAME[key];
          entries.set(key, {
            key,
            name,
            category: match ? match.category : 'Other',
            quantities: new Map(),
            texts: [],
            notes: [],
            totalCount: 0,
            optionalCount: 0,
          });
          order.push(key);
        }

        const entry = entries.get(key);
        entry.totalCount += 1;
        if (ing.optional) entry.optionalCount += 1;
        if (ing.notes && !entry.notes.includes(ing.notes)) entry.notes.push(ing.notes);

        const qtyStr = (ing.quantity ?? '').toString().trim();
        const unit = (ing.unit || '').trim();
        const n = Number(qtyStr);

        if (qtyStr !== '' && Number.isFinite(n) && n !== 0) {
          entry.quantities.set(unit, (entry.quantities.get(unit) || 0) + n);
        } else if (qtyStr === '' && unit) {
          // e.g. unit "to taste" with no numeric amount.
          if (!entry.texts.includes(unit)) entry.texts.push(unit);
        } else if (qtyStr !== '') {
          if (!entry.texts.includes(qtyStr)) entry.texts.push(qtyStr);
        }
      }
    }
  }

  return order.map((key) => {
    const entry = entries.get(key);
    const parts = [];
    for (const [unit, value] of entry.quantities) {
      parts.push(unit ? `${fmtQty(value)} ${unit}` : `${fmtQty(value)}`);
    }
    parts.push(...entry.texts);

    return {
      key: entry.key,
      name: entry.name,
      category: entry.category,
      quantity: parts.join(' + '),
      notes: entry.notes,
      optional: entry.optionalCount > 0 && entry.optionalCount === entry.totalCount,
    };
  });
}

export function groupByCategory(items) {
  const byCategory = new Map();
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  const groups = [];
  for (const category of SHOPPING_CATEGORIES) {
    const list = byCategory.get(category);
    if (list && list.length) groups.push({ category, items: list });
  }
  // Defensive: anything not in the canonical order (e.g. "Other").
  for (const [category, list] of byCategory) {
    if (!SHOPPING_CATEGORIES.includes(category)) groups.push({ category, items: list });
  }
  return groups;
}
