import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from './lib/store.js';

// useState that transparently persists to localStorage.
export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => loadJSON(key, initialValue));

  useEffect(() => {
    saveJSON(key, state);
  }, [key, state]);

  return [state, setState];
}
