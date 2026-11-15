import { t } from "../../app/i18n.js";
import { crewName, jobName, slotLabel, resultText } from "../solText.js";
export function eveningScreen({ state, data, report, events = [], summary = null, onNext }) {
  const section = document.createElement("section"); section.className = "screen evening-screen";
  const h = document.createElement("h1"); h.textContent = t("ui.eveningTitle", { sol: state.sol }); section.append(h);
  const intro = document.createElement("p"); intro.className = "screen-intro"; intro.textContent = t("ui.eveningHelp"); section.append(intro);
  if (summary) section.append(solReport(summary, state, data));
  const grid = document.createElement("div"); grid.className = "evening-grid";
  const shieldBlocks = state.resources.shieldBlocks;
  const blocksPerLayer = data.constants.BLOCKS_PER_LAYER.value;
  const shieldLayers = Math.floor(shieldBlocks / blocksPerLayer);
  [["ui.powerAfter", report?.power, 100], ["ui.airAfter", report?.air, 100], ["ui.shield", shieldLayers, 3]].forEach(([key, value, max]) => {
    const card = document.createElement("article"); card.className = "evening-card";
    const name = document.createElement("strong"); name.textContent = t(key);
    const valueText = document.createElement("span"); valueText.textContent = key === "ui.shield" ? `${value}/${max} · ${shieldBlocks} blocks` : `${value}/${max}`;
    const track = document.createElement("div"); track.className = "evening-track"; const fill = document.createElement("i"); fill.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`; track.append(fill);
    card.append(name, valueText, track); grid.append(card);
  });
  const wellbeing = document.createElement("article"); wellbeing.className = "evening-card";
  const wellbeingValues = report?.wellbeing || state.crew.map((member) => member.wellbeing);
  const wellbeingAverage = Math.round(wellbeingValues.reduce((sum, value) => sum + value, 0) / wellbeingValues.length);
  const wellbeingName = document.createElement("strong"); wellbeingName.textContent = t("ui.wellbeingAfter");
  const wellbeingValue = document.createElement("span"); wellbeingValue.textContent = `${wellbeingAverage}/100`;
  const wellbeingTrack = document.createElement("div"); wellbeingTrack.className = "evening-track"; const wellbeingFill = document.createElement("i"); wellbeingFill.style.width = `${wellbeingAverage}%`; wellbeingFill.className = "wellbeing-fill"; wellbeingTrack.append(wellbeingFill);
  wellbeing.append(wellbeingName, wellbeingValue, wellbeingTrack); grid.append(wellbeing);
  section.append(grid);
  const nextHelp = document.createElement("p"); nextHelp.className = "next-help"; nextHelp.textContent = t("ui.nextSolHelp"); section.append(nextHelp);
  const log = document.createElement("aside"); log.className = "event-log";
  const logTitle = document.createElement("strong"); logTitle.textContent = t("ui.eventLog"); log.append(logTitle);
  if (events.length === 0) { const empty = document.createElement("span"); empty.textContent = t("ui.noEvents"); log.append(empty); }
  events.forEach((event) => { const item = document.createElement("span"); item.textContent = t(event.key, event.params); log.append(item); });
  section.append(log);
  const button = document.createElement("button"); button.className = "primary form-submit"; button.textContent = t("ui.nextSol"); button.onclick = onNext; section.append(button); return section;
}

function listSection(titleKey, className) {
  const wrap = document.createElement("section"); wrap.className = `sol-report-block ${className}`;
  const title = document.createElement("h2"); title.textContent = t(titleKey); wrap.append(title);
  return wrap;
}

/** Sol Report: what changed, what the crew did, and why. All values come from the engine replay. */
function solReport(summary, state, data) {
  const report = document.createElement("div"); report.className = "sol-report";
  const heading = document.createElement("h2"); heading.className = "sol-report-title"; heading.textContent = t("ui.report.title", { sol: summary.sol }); report.append(heading);
  const labels = { power: t("ui.power"), air: t("ui.air"), dust: t("ui.report.dust"), shield: t("ui.report.shieldBlocks"), maker: t("ui.report.maker"), science: t("ui.report.science") };

  const changes = listSection("ui.report.changes", "sol-changes");
  const table = document.createElement("ul"); table.className = "sol-rows";
  summary.rows.forEach((row) => {
    const item = document.createElement("li");
    const diff = row.after - row.before;
    const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "•";
    const word = diff > 0 ? t("ui.report.up", { amount: diff }) : diff < 0 ? t("ui.report.down", { amount: Math.abs(diff) }) : t("ui.report.same");
    item.dataset.trend = diff > 0 ? "up" : diff < 0 ? "down" : "same";
    const name = document.createElement("strong"); name.textContent = labels[row.key];
    const values = document.createElement("span"); values.textContent = `${row.before} → ${row.after}`;
    const trend = document.createElement("small"); trend.textContent = `${arrow} ${word}`;
    item.append(name, values, trend); table.append(item);
  });
  changes.append(table); report.append(changes);

  const happened = listSection("ui.report.happened", "sol-did");
  const list = document.createElement("ul");
  summary.slots.forEach((slot) => {
    const item = document.createElement("li");
    const who = slot.job === "rest" || slot.job === "talk" ? t("ui.report.everyone") : crewName(data, slot.crewId);
    const head = document.createElement("strong"); head.textContent = t("ui.report.slot", { slot: slotLabel(slot.index), who, job: jobName(data, slot.job) });
    const result = document.createElement("span"); result.textContent = resultText(slot, data, state.world?.oneWayDelayMin ?? 0);
    item.append(head, result); list.append(item);
  });
  happened.append(list); report.append(happened);

  const why = listSection("ui.report.why", "sol-why");
  const whyList = document.createElement("ul");
  summary.why.forEach((entry) => { const item = document.createElement("li"); item.textContent = entry.lesson ? t("ui.lesson", { text: t(entry.key) }) : t(entry.key, entry.params); whyList.append(item); });
  why.append(whyList); report.append(why);

  const crew = listSection("ui.report.crew", "sol-crew");
  const crewList = document.createElement("ul");
  summary.crew.forEach((member) => {
    const item = document.createElement("li");
    item.textContent = t("ui.report.crewLine", { name: crewName(data, member.id), from: member.wellbeingBefore, to: member.wellbeingAfter, dfrom: member.doseBefore.toFixed(1), dto: member.doseAfter.toFixed(1) });
    crewList.append(item);
  });
  const note = document.createElement("small"); note.textContent = t("ui.report.doseNote");
  crew.append(crewList, note); report.append(crew);
  return report;
}
