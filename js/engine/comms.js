import { nextFloat } from "./rng.js";

export function roundTripMinutes(state) {
  return Math.ceil(2 * state.world.oneWayDelayMin);
}

export function shortestRemainingOption(state, data) {
  const emergency = data.emergencies[state.emergency.type];
  return Math.min(...emergency.options
    .filter((option) => !state.emergency.disabledOptions.includes(option.id))
    .map((option) => option.durationMin));
}

export function canAskEarth(state, data) {
  if (!state.emergency || state.emergency.askedEarth) return false;
  const remaining = state.emergency.deadlineMin - state.emergency.clockMin;
  return roundTripMinutes(state) + shortestRemainingOption(state, data) <= remaining;
}

export function advanceClock(state, minutes, data) {
  const next = structuredClone(state);
  const emergency = data.emergencies[next.emergency.type];
  const start = next.emergency.clockMin;
  const end = Math.min(next.emergency.deadlineMin, start + minutes);
  const elapsed = end - start;
  for (const [key, rate] of Object.entries(emergency.perMinute)) {
    const amount = Math.round(rate * elapsed);
    if (key === "air") next.resources.air = Math.max(0, next.resources.air - amount);
    if (key === "power") next.resources.power = Math.max(0, next.resources.power - amount);
    if (key === "crewWellbeing") {
      const crew = next.crew.find((member) => member.id === next.emergency.crewId);
      if (crew) crew.wellbeing = Math.max(0, crew.wellbeing - amount);
    }
    next.emergency.damage[key] = (next.emergency.damage[key] ?? 0) + amount;
  }
  next.emergency.clockMin = end;
  return next;
}

export function chanceFor(state, option, data) {
  if (state.emergency.adviceOptionId === option.id) return option.successAdvised;
  let chance = option.successBlind + data.difficulty[state.meta.difficulty].blindMod;
  if (state.emergency.challengeSolved) chance += data.constants.MINIGAME_BONUS.value;
  if (state.emergency.type === "crew_injury" && option.id === "medic_treat") {
    const luz = state.crew.find((member) => member.id === "luz");
    const injured = state.crew.find((member) => member.id === state.emergency.crewId);
    if (luz?.wellbeing < 30 || injured?.id === "luz") chance = 0.4;
  }
  return Math.min(1, chance);
}

export function rollSuccess(state, chance) {
  const next = structuredClone(state);
  const success = nextFloat(next) < chance;
  return { state: next, success };
}
