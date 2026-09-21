import { useMemo } from 'react';
import { groupByCategory } from '../lib/shopping.js';

export default function ShoppingList({
  items,
  checked,
  pantry,
  scheduledCount,
  onToggleChecked,
  onTogglePantry,
  onUncheckAll,
  onRestoreAllPantry,
}) {
  const { active, checkedItems, pantryItems } = useMemo(() => {
    const active = items.filter((i) => !checked[i.key] && !pantry[i.key]);
    const checkedItems = items.filter((i) => checked[i.key] && !pantry[i.key]);
    const pantryItems = items.filter((i) => pantry[i.key]);
    return { active, checkedItems, pantryItems };
  }, [items, checked, pantry]);

  const groups = groupByCategory(active);

  return (
    <section className="page" aria-labelledby="shopping-heading">
      <header className="page-header">
        <div>
          <h1 id="shopping-heading">Shopping list</h1>
          <p className="page-sub">
            Auto-generated from {scheduledCount} scheduled{' '}
            {scheduledCount === 1 ? 'recipe' : 'recipes'} in your meal plan.
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your shopping list is empty.</p>
          <p className="muted">Add recipes to your meal plan and their ingredients will appear here.</p>
        </div>
      ) : (
        <>
          {active.length === 0 && checkedItems.length + pantryItems.length > 0 && (
            <div className="empty-state">
              <p>All done — nothing left to buy. 🎉</p>
            </div>
          )}

          {groups.map((group) => {
            const catId = `cat-${group.category.replace(/[^a-zA-Z0-9]+/g, '-')}`;
            return (
            <section key={group.category} className="shop-group" aria-labelledby={catId}>
              <h2 id={catId} className="shop-cat">
                {group.category}
              </h2>
              <ul className="shop-list">
                {group.items.map((item) => (
                  <li key={item.key} className="shop-item">
                    <label className="shop-check">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => onToggleChecked(item.key)}
                        aria-label={`Mark ${item.name} as bought`}
                      />
                      <span className="checkmark" aria-hidden="true" />
                    </label>
                    <span className="shop-name">
                      {item.name}
                      {item.optional && <span className="ing-optional">optional</span>}
                    </span>
                    {item.quantity && <span className="shop-qty">{item.quantity}</span>}
                    {item.notes.length > 0 && (
                      <span className="shop-notes">({item.notes.join(', ')})</span>
                    )}
                    <button
                      className="mini-btn"
                      onClick={() => onTogglePantry(item.key)}
                      title="I already have this in my pantry"
                      aria-label={`Exclude ${item.name} — already in pantry`}
                    >
                      🏠 Have it
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            );
          })}

          {checkedItems.length > 0 && (
            <details className="shop-details">
              <summary>Bought ({checkedItems.length})</summary>
              <ul className="shop-list shop-list-done">
                {checkedItems.map((item) => (
                  <li key={item.key} className="shop-item is-done">
                    <label className="shop-check">
                      <input
                        type="checkbox"
                        checked
                        onChange={() => onToggleChecked(item.key)}
                        aria-label={`Unmark ${item.name}`}
                      />
                      <span className="checkmark" aria-hidden="true" />
                    </label>
                    <span className="shop-name">{item.name}</span>
                    {item.quantity && <span className="shop-qty">{item.quantity}</span>}
                  </li>
                ))}
              </ul>
              <button className="btn btn-ghost btn-sm" onClick={onUncheckAll}>
                Uncheck all
              </button>
            </details>
          )}

          {pantryItems.length > 0 && (
            <details className="shop-details">
              <summary>In pantry — excluded ({pantryItems.length})</summary>
              <ul className="shop-list shop-list-done">
                {pantryItems.map((item) => (
                  <li key={item.key} className="shop-item is-done">
                    <span className="shop-name">{item.name}</span>
                    {item.quantity && <span className="shop-qty">{item.quantity}</span>}
                    <button className="mini-btn" onClick={() => onTogglePantry(item.key)}>
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
              <button className="btn btn-ghost btn-sm" onClick={onRestoreAllPantry}>
                Restore all
              </button>
            </details>
          )}
        </>
      )}
    </section>
  );
}
