import { t } from "../../app/i18n.js";
export function pausedScreen({ onRewind, onReport }) {
  const section = document.createElement("section"); section.className = "screen";
  const h = document.createElement("h1"); h.textContent = t("ui.paused"); section.append(h);
  const p = document.createElement("p"); p.textContent = t("ui.paused"); section.append(p);
  [[t("ui.rewindThree"), 3], [t("ui.rewindOne"), 1]].forEach(([label, amount]) => { const b = document.createElement("button"); b.textContent = label; b.onclick = () => onRewind(amount); section.append(b); });
  const report = document.createElement("button"); report.textContent = t("ui.seeReport"); report.onclick = onReport; section.append(report); return section;
}
