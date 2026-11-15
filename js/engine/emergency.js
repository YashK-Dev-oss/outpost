import { advanceClock, canAskEarth, chanceFor, rollSuccess, roundTripMinutes } from "./comms.js";
import { closeSol } from "./sol.js";
import { nextInt } from "./rng.js";

function effect(state, values) {
  const next = structuredClone(state);
  const crew = next.crew.find((member) => member.id === next.emergency.crewId);
  for (const [key, value] of Object.entries(values ?? {})) {
    if (key === "power") next.resources.power = Math.max(0, next.resources.power + value);
    else if (key === "air") next.resources.air = Math.max(0, Math.min(100, next.resources.air + value));
    else if (key === "allWellbeing") next.crew.forEach((member) => { member.wellbeing = Math.max(0, Math.min(100, member.wellbeing + value)); });
    else if (key === "crewWellbeing" && crew) crew.wellbeing = Math.max(0, Math.min(100, crew.wellbeing + value));
    else if (key === "airMakerHealthSet") next.resources.airMaker.health = value;
    else if (key === "airMakerHealthAdd") next.resources.airMaker.health = Math.max(0, Math.min(100, next.resources.airMaker.health + value));
    else if (key === "batteryCapAdd") next.resources.powerCap = Math.max(0, next.resources.powerCap + value);
    else if (key === "forcedAirMakerOffNextSol") next.flags.forcedAirMakerOffSol = next.sol + 1;
    else if (key === "slotPenaltyNextSol") next.flags.slotPenaltyNextSol = Math.max(next.flags.slotPenaltyNextSol, value);
    else if (key === "restSols" && crew) crew.restingUntilSol = next.sol + value;
  }
  return next;
}

function finish(state, outcome, data) {
  const next = structuredClone(state);
  next.emergency.resolved = true;
  next.emergency.outcome = outcome;
  if (outcome === "clean") next.score.emergenciesClean += 1;
  else if (outcome === "afterFail") next.score.emergenciesAfterFail += 1;
  else next.score.emergenciesDeadline += 1;
  const closed = closeSol(next, data);
  return { state: closed.state, events: closed.events, report: closed.report };
}

/** Start an emergency after jobs have executed. */
export function startEmergency(state, data) {
  const next = structuredClone(state);
  const scheduled = next.schedule.emergencies.find((item) => item.sol === next.sol);
  if (!scheduled) return { state: next, events: [] };
  const config = data.emergencies[scheduled.type];
  let crewId = null;
  if (scheduled.type === "crew_injury") {
    const available = next.crew.filter((member) => !member.restingUntilSol || member.restingUntilSol <= next.sol);
    crewId = available[nextInt(next, 0, available.length - 1)]?.id ?? next.crew[0].id;
  }
  next.emergency = {
    type: scheduled.type,
    crewId,
    clockMin: 0,
    deadlineMin: config.deadlineMin + data.difficulty[next.meta.difficulty].deadlineMod,
    roundTripMin: roundTripMinutes(next),
    askedEarth: false,
    earthReplied: false,
    adviceOptionId: null,
    challengeSolved: false,
    disabledOptions: [],
    attempts: [],
    damage: {},
    resolved: false,
    outcome: null
  };
  if (config.trigger) {
    return { state: effect(next, config.trigger), events: [{ type: "emergency_start", sol: next.sol, key: `emergency.${scheduled.type}.start`, params: {}, provenance: "game" }] };
  }
  return { state: next, events: [{ type: "emergency_start", sol: next.sol, key: `emergency.${scheduled.type}.start`, params: {}, provenance: "game" }] };
}

/** Take one emergency action or ask Earth. */
export function emergencyAct(state, action, data) {
  if (!state.emergency || state.emergency.resolved) return { state: structuredClone(state), events: [] };
  if (action === "challenge") {
    const next = structuredClone(state);
    next.emergency.challengeSolved = true;
    return { state: next, events: [{ type: "emergency_step", sol: next.sol, key: "emergency.challengeSolved", params: {}, provenance: "game" }] };
  }
  if (action === "askEarth") {
    if (!canAskEarth(state, data)) return { state: structuredClone(state), events: [], errorKey: "emergency.earthTooSlow" };
    let next = advanceClock(state, roundTripMinutes(state), data);
    next.emergency.askedEarth = true;
    next.emergency.earthReplied = true;
    next.emergency.adviceOptionId = data.emergencies[next.emergency.type].earthBest;
    if (next.emergency.clockMin >= next.emergency.deadlineMin) return emergencyForceDeadline(next, data);
    return { state: next, events: [{ type: "emergency_step", sol: next.sol, key: "emergency.earthReply", params: {}, provenance: "game" }] };
  }
  const config = data.emergencies[state.emergency.type];
  const option = config.options.find((item) => item.id === action);
  if (!option || state.emergency.disabledOptions.includes(action)) {
    return { state: structuredClone(state), events: [], errorKey: "emergency.invalidOption" };
  }
  let next = advanceClock(state, option.durationMin, data);
  next.emergency.attempts.push({ optionId: action, success: false, atMin: next.emergency.clockMin });
  const rolled = rollSuccess(next, chanceFor(next, option, data));
  next = rolled.state;
  if (rolled.success) {
    next = effect(next, option.onSuccess);
    next = effect(next, option.costs);
    const outcome = next.emergency.attempts.length === 1 ? "clean" : "afterFail";
    return finish(next, outcome, data);
  }
  next = effect(next, option.onFail);
  next.emergency.disabledOptions.push(action);
  if (next.emergency.clockMin >= next.emergency.deadlineMin) return emergencyForceDeadline(next, data);
  return { state: next, events: [{ type: "emergency_step", sol: next.sol, key: "emergency.failed", params: {}, provenance: "game" }] };
}

/** Force Auto-Safe Mode for development and deterministic tests. */
export function emergencyForceDeadline(state, data) {
  if (!state.emergency) return { state: structuredClone(state), events: [] };
  let next = structuredClone(state);
  next = advanceClock(next, next.emergency.deadlineMin - next.emergency.clockMin, data);
  next = effect(next, data.emergencies[next.emergency.type].deadlineFailure);
  return finish(next, "deadline", data);
}
