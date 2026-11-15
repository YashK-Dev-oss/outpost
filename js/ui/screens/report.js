import { t } from "../../app/i18n.js";
import { makeMissionReport } from "../../engine/index.js";
import { lineChart } from "../components/chart.js";
export function reportScreen({ state, data, onBack }) {
  const section = document.createElement("section"); section.className = "screen";
  const report = makeMissionReport(state); const h = document.createElement("h1"); h.textContent = t("ui.report"); section.append(h);
  const score = document.createElement("p"); score.textContent = `${t("ui.stars", { stars: report.score.stars })} · ${t("ui.total", { total: report.score.total })}`; section.append(score);
  [["ui.survival", report.score.survival], ["ui.finalWellbeing", report.score.wellbeing], ["ui.scienceScore", report.score.science], ["ui.reserves", report.score.reserves], ["ui.emergencyScore", report.score.emergencies]].forEach(([key, value]) => { const p = document.createElement("p"); p.textContent = `${t(key)}: ${value}`; section.append(p); });
  const heading = document.createElement("h2"); heading.textContent = t("ui.reportHistory"); section.append(heading);
  section.append(lineChart(report.charts.power, t("ui.power")), lineChart(report.charts.air, t("ui.air")), lineChart(report.charts.wellbeing, t("ui.wellbeing")));
  const list = document.createElement("ol"); state.history.forEach((row) => { const li = document.createElement("li"); li.textContent = `Sol ${row.sol}: ${t("ui.power")} ${row.power}, ${t("ui.air")} ${row.air}`; list.append(li); }); section.append(list);
  const real = document.createElement("p"); real.textContent = t("ui.realPanel"); section.append(real);
  const back = document.createElement("button"); back.textContent = t("ui.back"); back.onclick = onBack; section.append(back); return section;
}
