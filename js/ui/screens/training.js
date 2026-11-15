import { t } from "../../app/i18n.js";
export function trainingScreen({ onStart }) {
  const section = document.createElement("section"); section.className = "screen";
  const h = document.createElement("h1"); h.textContent = t("ui.training"); section.append(h);
  const p = document.createElement("p"); p.textContent = t("ui.trainingIntro"); section.append(p);
  const b = document.createElement("button"); b.textContent = t("ui.startTraining"); b.onclick = onStart; section.append(b); return section;
}
