import { t } from "../../app/i18n.js";
export function badge(provenance) {
  const element = document.createElement("span"); element.className = `badge badge-${provenance}`;
  element.textContent = provenance === "real" ? "🛰 NASA DATA" : provenance === "scaled" ? "🛰≈ NASA-BASED, SIMPLIFIED" : "🎮 GAME VALUE";
  return element;
}
