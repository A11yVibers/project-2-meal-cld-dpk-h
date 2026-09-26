export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']

export const SLOT_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

// Map CSV meal-type ids onto the four weekly planner slots.
export const MEAL_TYPE_TO_SLOT = {
  MT01: 'breakfast',
  MT02: 'lunch',
  MT03: 'dinner',
  MT04: 'snack',
  MT05: 'snack', // Dessert
  MT06: 'dinner', // Side dish
}

export const ACCENT_COLORS = [
  '#D97757',
  '#8A9A5B',
  '#5B8AB5',
  '#B55A8A',
  '#E0A526',
  '#6B7280',
  '#A35BB5',
  '#5BB5A0',
  '#B55B5B',
  '#7A6F4E',
]

export const DIFFICULTY_LABELS = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Medium',
  4: 'Hard',
  5: 'Very hard',
}