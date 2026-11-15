const KEY = "outpost.save.v1";
export function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    return saved?.schema === 1 && saved.state ? saved : null;
  } catch { return null; }
}
export function saveMission(state, checkpoints = []) {
  const payload = { schema: 1, state, checkpoints: checkpoints.slice(-3) };
  localStorage.setItem(KEY, JSON.stringify(payload));
  return payload;
}
export function clearSave() { localStorage.removeItem(KEY); }
export function checkpoint(state, checkpoints = []) { return saveMission(state, [...checkpoints, structuredClone(state)]); }
