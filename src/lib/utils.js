// Shared helpers: ids, dates, labels, quantity formatting and unit conversion.

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export const SPICE_LABELS = ['Mild', 'Mild', 'Medium', 'Medium', 'Spicy', 'Very spicy'];

export const DIFFICULTY_LABELS = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very hard',
};

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key) {
  const [y, m, d] = String(key || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatDateShort(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateMedium(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateLong(d) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatWeekLabel(weekStart) {
  const end = addDays(weekStart, 6);
  return `${formatDateShort(weekStart)} – ${formatDateShort(end)}, ${weekStart.getFullYear()}`;
}

export function spiceLabel(level) {
  const i = Math.min(5, Math.max(0, Number(level) || 0));
  return SPICE_LABELS[i];
}

export function difficultyLabel(level) {
  return DIFFICULTY_LABELS[level] || '';
}

export function fmtQty(q) {
  if (q === '' || q == null) return '';
  const n = Number(q);
  if (Number.isFinite(n)) return String(Math.round(n * 100) / 100);
  return String(q);
}

export function formatQuantity(qty, unit) {
  const q = fmtQty(qty);
  return [q, unit].filter(Boolean).join(' ').trim() || '—';
}

// Approximate culinary conversions used to display quantities in metric.
const METRIC_CONVERSIONS = {
  cup: { f: 240, unit: 'ml' },
  tbsp: { f: 15, unit: 'ml' },
  tsp: { f: 5, unit: 'ml' },
  'fl oz': { f: 30, unit: 'ml' },
  oz: { f: 28, unit: 'g' },
  lb: { f: 450, unit: 'g' },
  pint: { f: 473, unit: 'ml' },
  quart: { f: 946, unit: 'ml' },
  gallon: { f: 3.8, unit: 'L' },
};

export function convertQuantity(qty, unit, toMetric) {
  const raw = (qty ?? '').toString().trim();
  if (raw === '') return { qty: '', unit: unit || '' };
  if (!toMetric) return { qty: fmtQty(qty), unit };
  const u = (unit || '').trim().toLowerCase();
  const conv = METRIC_CONVERSIONS[u];
  if (!conv) return { qty: fmtQty(qty), unit };
  const n = Number(qty);
  if (!Number.isFinite(n)) return { qty: fmtQty(qty), unit };
  const v = n * conv.f;
  return { qty: String(Math.round(v * 10) / 10), unit: conv.unit };
}

export function createEmptyRecipe() {
  const mainSectionId = uid('sec');
  return {
    id: uid('user'),
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    cuisineId: 'CU15',
    mealTypeId: 'MT03',
    dietaryTagIds: [],
    categoryIds: [],
    difficulty: 2,
    spiceLevel: 2,
    accentColor: '#D97757',
    coverImageUrl: '',
    includeInMealSuggestions: true,
    includeInShoppingList: true,
    showNutrition: false,
    allowSubstitutions: false,
    measurementSystem: 'us',
    sections: [{ id: mainSectionId, name: 'Main' }],
    ingredients: [
      {
        id: uid('ing'),
        sectionId: mainSectionId,
        ingredientId: null,
        name: '',
        quantity: '',
        unit: '',
        notes: '',
        optional: false,
      },
    ],
    steps: [{ id: uid('step'), instruction: '', timerMinutes: '' }],
    addToPlanNow: false,
    plannedDate: '',
    plannedSlot: 'Dinner',
  };
}
