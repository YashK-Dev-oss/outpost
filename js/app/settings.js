const KEY = "outpost.settings.v3";
const defaults = { textSize: "m", contrast: false, reduceMotion: false, sound: true, music: true, autoReadAloud: false, coachTips: true };
export function loadSettings() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { ...defaults }; }
}
export function saveSettings(settings) {
  const next = { ...defaults, ...settings };
  localStorage.setItem(KEY, JSON.stringify(next));
  document.documentElement.dataset.contrast = next.contrast ? "high" : "normal";
  document.documentElement.dataset.textSize = next.textSize;
  document.documentElement.dataset.reduceMotion = next.reduceMotion ? "reduce" : "full";
  return next;
}

export function applySettings(settings = loadSettings()) {
  return saveSettings(settings);
}
