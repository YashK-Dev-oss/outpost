import { projectSols } from "./project.js";

function forecast(state, lookAhead) {
  const items = [];
  for (const storm of state.schedule.storms) {
    const distance = storm.sol - state.sol;
    if (distance >= 0 && distance <= lookAhead && (distance === 0 || storm.severity >= 2 || lookAhead === 5)) {
      items.push({ kind: "solar", ...storm, solsUntil: distance, provenance: storm.provenance });
    }
  }
  for (const dust of state.schedule.dustStorms) {
    const distance = dust.startSol - state.sol;
    if (distance >= 0 && distance <= lookAhead) {
      items.push({ kind: "dust", ...dust, solsUntil: distance, provenance: "game" });
    }
  }
  return items.sort((left, right) => left.solsUntil - right.solsUntil);
}

/** Build the briefing forecast, Earth message, tip, and projections. */
export function getBriefing(state, data) {
  const lookAhead = state.flags.talkedSol === state.sol - 1 ? 5 : 2;
  const items = forecast(state, lookAhead);
  let tipKey = "";
  const projection = projectSols(state, data);
  if (projection.power.sols !== null && projection.power.sols < 6) tipKey = "tip.powerLow";
  else if (state.resources.dust > 40) tipKey = "tip.panelsDusty";
  else if (state.resources.airMaker.health < 50) tipKey = "tip.airMakerCare";
  else if (items.some((item) => item.kind === "solar") && !state.plan.shelter) tipKey = "tip.stormComing";
  else if (state.crew.some((member) => member.wellbeing < 50)) tipKey = "tip.crewTired";
  return {
    sunFactor: state.world.sunFactor,
    forecast: items,
    earthMessageKey: "ui.earthReport",
    earthMessageParams: { minutes: state.world.oneWayDelayMin },
    tipKey: data.difficulty[state.meta.difficulty].coachTips ? tipKey : "",
    projections: projection
  };
}
