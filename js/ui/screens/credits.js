import { t } from "../../app/i18n.js";
import { readAloud, speechAvailable } from "../../app/speech.js";
export function creditsScreen({ onBack }) {
  const section = document.createElement("section"); section.className = "screen";
  const h = document.createElement("h1"); h.textContent = t("ui.credits"); section.append(h);
  const p = document.createElement("p"); p.textContent = t("ui.creditsText"); section.append(p);
  if (speechAvailable()) {
    const read = document.createElement("button");
    read.textContent = t("ui.readAloud");
    read.onclick = () => readAloud(p.textContent);
    section.append(read);
  }
  const b = document.createElement("button"); b.textContent = t("ui.back"); b.onclick = onBack; section.append(b); return section;
}
