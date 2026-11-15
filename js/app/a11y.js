let region;
export function liveRegion(root = document.body) {
  if (!region) { region = document.createElement("div"); region.className = "sr-only"; region.setAttribute("aria-live", "polite"); root.append(region); }
  return region;
}
export function announce(message) { liveRegion().textContent = message; }
