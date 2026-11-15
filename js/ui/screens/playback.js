import { t } from "../../app/i18n.js";
export function playbackScreen({ report, onContinue }) {
  const section = document.createElement("section"); section.className = "screen";
  const h = document.createElement("h1"); h.textContent = t("ui.playback"); section.append(h);
  const list = document.createElement("ul"); [["ui.power", report?.power], ["ui.air", report?.air], ["ui.wellbeing", report?.wellbeing]].forEach(([key, value]) => { const li = document.createElement("li"); li.textContent = `${t(key)}: ${value ?? "—"}`; list.append(li); }); section.append(list);
  const b = document.createElement("button"); b.textContent = t("ui.continueResults"); b.onclick = onContinue; section.append(b); return section;
}
