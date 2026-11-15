let value = null;
const listeners = new Set();
export function createStore(initial) {
  value = initial;
  return { getState: () => value, setState(next) { value = next; listeners.forEach((listener) => listener(value)); }, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}
export function getState() { return value; }
export function setState(next) { value = next; listeners.forEach((listener) => listener(value)); }
export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
