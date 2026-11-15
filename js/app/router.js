let renderer = null;
let current = "";

export function configureRouter(render) {
  renderer = render;
}

export function show(screenId, props = {}) {
  current = screenId;
  if (renderer) renderer(screenId, props);
  requestAnimationFrame(() => document.querySelector("main h1, main [autofocus], main button")?.focus());
}

export function currentScreen() { return current; }
