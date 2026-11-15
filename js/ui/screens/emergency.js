import { t } from "../../app/i18n.js";
import { emergencyAct } from "../../engine/index.js";
export function emergencyScreen({ state, data, onAction, onChallenge }) {
  const section = document.createElement("section"); section.className = "screen emergency-screen";
  const config = data.emergencies[state.emergency.type];
  const h = document.createElement("h1"); h.textContent = `${config.icon} ${t(`em.${state.emergency.type}.title`)}`; section.append(h);
  const story = document.createElement("p"); story.textContent = t(`em.${state.emergency.type}.story`); section.append(story);
  const clock = document.createElement("p"); clock.setAttribute("role", "status"); clock.textContent = `${t("ui.clock")}: ${state.emergency.clockMin} / ${state.emergency.deadlineMin} min`; section.append(clock);
  const damage = Object.values(state.emergency.damage || {}).reduce((sum, value) => sum + Math.abs(value), 0);
  const waiting = document.createElement("p"); waiting.textContent = `${t("ui.damageWaiting", { damage: Math.round(damage) })} ${t("ui.earthReport", { minutes: state.emergency.roundTripMin / 2 })}`; section.append(waiting);
  const fact = document.createElement("p"); fact.textContent = t(`em.${state.emergency.type}.fact`); section.append(fact);
  const challenge = document.createElement("aside"); challenge.className = "emergency-challenge";
  const challengeTitle = document.createElement("h2"); challengeTitle.textContent = t("ui.emergencyDrill");
  const challengeHelp = document.createElement("p"); challengeHelp.textContent = state.emergency.challengeSolved ? t("ui.drillSolved") : t("ui.drillHelp");
  challenge.append(challengeTitle, challengeHelp);
  if (!state.emergency.challengeSolved) {
    const symbols = ["🔧", "🔧", "💨", "💨", "🔋", "🔋"];
    const shuffled = symbols.slice((state.sol + state.emergency.clockMin) % 3).concat(symbols.slice(0, (state.sol + state.emergency.clockMin) % 3));
    const grid = document.createElement("div"); grid.className = "drill-grid";
    let open = [];
    let matches = 0;
    shuffled.forEach((symbol, index) => {
      const card = document.createElement("button"); card.type = "button"; card.className = "drill-card"; card.textContent = "?"; card.setAttribute("aria-label", t("ui.drillCard", { number: index + 1 }));
      card.onclick = () => {
        if (card.classList.contains("matched") || open.includes(card)) return;
        card.textContent = symbol; card.classList.add("open"); open.push(card);
        if (open.length === 2) {
          if (open[0].textContent === open[1].textContent) {
            open.forEach((item) => item.classList.add("matched")); matches += 1;
            if (matches === 3) onChallenge();
          } else {
            const pair = open; setTimeout(() => pair.forEach((item) => { item.textContent = "?"; item.classList.remove("open"); }), 450);
          }
          open = [];
        }
      };
      grid.append(card);
    });
    challenge.append(grid);
  }
  section.append(challenge);
  const earth = document.createElement("button"); earth.textContent = `${t("ui.askEarth")} 🛰`; earth.disabled = state.emergency.askedEarth; earth.onclick = () => onAction("askEarth"); section.append(earth);
  const heading = document.createElement("h2"); heading.textContent = t("ui.chooseAction"); section.append(heading);
  for (const option of config.options) {
    const button = document.createElement("button");
    const advised = state.emergency.adviceOptionId === option.id ? " ✓" : "";
    button.textContent = `${option.id.replaceAll("_", " ")} · ${option.durationMin} min${advised}`;
    button.disabled = state.emergency.disabledOptions.includes(option.id);
    button.setAttribute("aria-label", t(option.tradeoffKey));
    button.onclick = () => onAction(option.id);
    section.append(button);
    const tradeoff = document.createElement("p"); tradeoff.textContent = t(option.tradeoffKey); section.append(tradeoff);
  }
  return section;
}
