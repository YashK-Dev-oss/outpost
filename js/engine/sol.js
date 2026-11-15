import { executeJobs, planStats } from "./jobs.js";
import { resolveResources } from "./resources.js";
import { resolveCrew } from "./crew.js";
import { applyWorldForSol } from "./schedule.js";

function event(type, sol, key, params = {}) {
  return { type, sol, key, params, provenance: "game" };
}

/** Close the current sol without weather or emergency processing. */
export function closeSol(state, data) {
  let next = structuredClone(state);
  const resourceResult = resolveResources(next, data);
  next = resourceResult.state;
  const crewResult = resolveCrew(next, planStats(next), data);
  next = crewResult;
  const layers = Math.floor(next.resources.shieldBlocks / data.constants.BLOCKS_PER_LAYER.value);
  const wellbeing = next.crew.map((member) => member.wellbeing);
  const dose = next.crew.map((member) => member.dose);
  next.history.push({
    sol: next.sol,
    power: next.resources.power,
    air: next.resources.air,
    dust: next.resources.dust,
    layers,
    wellbeing,
    dose
  });
  const events = [...resourceResult.events];
  if (layers > Math.floor(state.resources.shieldBlocks / data.constants.BLOCKS_PER_LAYER.value)) {
    events.push(event("shield_layer", next.sol, "event.shield_layer"));
  }
  if (next.crew.some((member) => member.wellbeing === 0)) {
    next.phase = "paused";
  } else {
    next.phase = "evening";
  }
  return {
    state: next,
    events,
    report: {
      sol: next.sol,
      power: next.resources.power,
      air: next.resources.air,
      wellbeing,
      dose
    }
  };
}

/** Move from an evening report to the next briefing. */
export function advanceSol(state) {
  const next = structuredClone(state);
  if (next.phase !== "evening") {
    return next;
  }
  if (next.sol >= next.totalSols) {
    next.phase = "complete";
    return next;
  }
  next.sol += 1;
  next.phase = "briefing";
  next.plan.slotCount = Math.max(1, next.meta.baseSlotCount - (next.flags.slotPenaltyNextSol > 0 ? 1 : 0));
  next.plan.slots = Array.from({ length: next.plan.slotCount }, () => ({ job: null, crewId: null }));
  next.plan.airMakerOn = next.resources.airMaker.on;
  next.plan.shelter = false;
  next.flags.slotPenaltyNextSol = 0;
  return applyWorldForSol(next, next.schedule);
}

/** Submit a plan, execute jobs, and close the sol. */
export function resolvePlan(state, plan, data, shouldClose = true) {
  const next = structuredClone(state);
  next.plan = structuredClone(plan);
  const execution = executeJobs(next, next.plan.slots, data);
  if (!shouldClose) {
    return { state: execution.state, events: [] };
  }
  const closed = closeSol(execution.state, data);
  return { state: closed.state, events: closed.events, report: closed.report };
}
