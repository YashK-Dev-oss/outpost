import { t } from "../../app/i18n.js";
export function titleScreen({ onPlay, onContinue, hasSave, onCodex, onDataLab, onReport, onCredits, onTraining, onSettings }) {
  const section = document.createElement("section"); section.className = "title-screen";
  const art = document.createElement("div"); art.className = "title-art"; art.setAttribute("aria-hidden", "true");
  art.innerHTML = `<div class="planet"></div><div class="mars-horizon"></div><div class="title-stars"></div><div class="title-base"><span></span><i></i><b></b></div><div class="title-sun"></div>`;
  const hero = document.createElement("div"); hero.className = "title-hero";
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = t("ui.missionObjective"); hero.append(eyebrow);
  const h = document.createElement("h1"); h.textContent = t("title"); hero.append(h);
  const team = document.createElement("p"); team.className = "title-team"; team.textContent = t("team"); hero.append(team);
  const brief = document.createElement("p"); brief.className = "title-brief"; brief.textContent = t("ui.commanderBrief"); hero.append(brief);
  const actions = document.createElement("div"); actions.className = "title-actions";
  const play = document.createElement("button"); play.className = "primary hero-button"; play.textContent = t("ui.play"); play.onclick = onPlay; actions.append(play);
  if (hasSave) { const button = document.createElement("button"); button.className = "secondary-button"; button.textContent = t("ui.continue"); button.onclick = onContinue; actions.append(button); }
  hero.append(actions);
  const tools = document.createElement("nav"); tools.className = "title-tools"; tools.setAttribute("aria-label", t("ui.missionTools"));
  [["ui.training", onTraining], ["ui.codex", onCodex], ["ui.dataLab", onDataLab], ["ui.credits", onCredits], ["ui.settings", onSettings]].forEach(([key, action]) => { const button = document.createElement("button"); button.className = "tool-button"; button.textContent = t(key); button.onclick = action; tools.append(button); });
  if (hasSave && onReport) { const button = document.createElement("button"); button.className = "tool-button"; button.textContent = t("ui.report"); button.onclick = onReport; tools.append(button); }
  const disclaimer = document.createElement("p"); disclaimer.className = "disclaimer"; disclaimer.textContent = t("disclaimer");
  section.append(art, hero, tools, disclaimer);
  return section;
}
