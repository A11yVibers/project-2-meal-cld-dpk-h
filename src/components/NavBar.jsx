export default function NavBar({ view, onNavigate, shoppingCount }) {
  const tabs = [
    { key: 'catalog', label: 'Recipes' },
    { key: 'planner', label: 'Meal plan' },
    { key: 'shopping', label: 'Shopping list', badge: shoppingCount },
  ];

  return (
    <nav className="topnav" aria-label="Primary">
      <div className="topnav-inner">
        <button className="brand" onClick={() => onNavigate('catalog')}>
          <span className="brand-mark" aria-hidden="true">🍽</span>
          <span>Meal Planner</span>
        </button>
        <div className="nav-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`nav-tab ${view === t.key ? 'is-active' : ''}`}
              aria-current={view === t.key ? 'page' : undefined}
              onClick={() => onNavigate(t.key)}
            >
              {t.label}
              {typeof t.badge === 'number' && t.badge > 0 ? (
                <span className="nav-badge">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
