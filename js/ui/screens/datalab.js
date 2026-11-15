import { t } from "../../app/i18n.js";
import { badge } from "../components/badge.js";
export function dataLabScreen({ data, windowId = "A", onBack }) {
  const section = document.createElement("section"); section.className = "screen";
  const h = document.createElement("h1"); h.textContent = t("ui.dataLab"); section.append(h);
  const real = data[`donki-${windowId}`]; const delays = data[`delay-${windowId}`];
  const note = document.createElement("p"); note.textContent = t("ui.realDataNote"); section.append(note); section.append(badge("real"));
  const chart = document.createElement("div"); chart.className = "data-strip"; (real.storms || []).forEach((storm) => {
    const item = document.createElement("span"); item.textContent = `Sol ${storm.sol}: ★${storm.severity}`; item.title = storm.realDate || ""; chart.append(item);
  }); section.append(chart);
  const delay = document.createElement("p"); const min = Math.min(...delays.oneWayMinutes); const max = Math.max(...delays.oneWayMinutes);
  delay.textContent = `${t("ui.delayChart")}: ${min}–${max} min`; section.append(delay);
  const details = document.createElement("p"); details.textContent = `${t("ui.realPanel")}: dates and light delay are NASA DATA. Storm severity and meter effects are simplified for play.`; section.append(details);
  const back = document.createElement("button"); back.textContent = t("ui.back"); back.onclick = onBack; section.append(back); return section;
}
