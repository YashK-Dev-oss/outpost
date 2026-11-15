let strings = {};

/**
 * Load the English string map.
 * @returns {Promise<void>}
 */
export async function loadStrings() {
  const response = await fetch("data/game/strings.en.json");
  if (!response.ok) {
    throw new Error(`String data request failed: ${response.status}`);
  }
  strings = await response.json();
}

export function setStrings(value) {
  strings = value || {};
}

/**
 * Resolve a string and replace simple `{param}` placeholders.
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  const value = strings[key];
  if (typeof value !== "string") {
    return key;
  }
  return value.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : match
  );
}
