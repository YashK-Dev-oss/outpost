/** True when the player asked for reduced motion in Settings or in their system. */
export function prefersReducedMotion() {
  if (document.documentElement.dataset.reduceMotion === "reduce") return true;
  return Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}
