import { createRng, nextInt, shuffle, pick } from "./rng.js";

function realWindow(data, windowId) {
  return data.real?.[`donki-${windowId}`] ?? data.real?.donki?.[windowId] ?? { storms: [] };
}

function delayWindow(data, windowId) {
  return data.real?.[`delay-${windowId}`] ?? data.real?.delay?.[windowId] ?? { oneWayMinutes: [] };
}

function chooseEmergencySol(rng, band, occupied) {
  let sol = nextInt(rng, band[0], band[1]);
  for (let attempt = 0; attempt <= band[1] - band[0] + 1; attempt += 1) {
    if (![...occupied].every((other) => Math.abs(other - sol) > 1)) return sol;
    sol += 1;
    if (sol > band[1]) sol = band[0];
  }
  return null;
}

/** Build the deterministic weather, emergency, and delay schedule. */
export function buildSchedule(seed, difficulty, windowId, data) {
  const rng = createRng(seed);
  const tier = data.difficulty[difficulty];
  const source = realWindow(data, windowId);
  const storms = [...(source.storms ?? [])];
  if (difficulty === "cadet" && tier.practiceStorm) {
    storms.push({
      sol: tier.practiceStorm.sol,
      severity: tier.practiceStorm.severity,
      realDate: null,
      components: {},
      provenance: { events: "game", severity: "game", dose: "game" }
    });
  }
  const bases = tier.dustStorms.map((storm, index) => {
    const base = storm.start ?? (difficulty === "cadet" ? 18 : difficulty === "astronaut" ? 14 : 8 + index * 12);
    return {
      startSol: Math.max(3, base + nextInt(rng, -1, 1)),
      durationSols: storm.duration,
      factor: storm.factor,
      provenance: "game"
    };
  });
  const occupied = new Set(storms.map((storm) => storm.sol));
  const emergencyTypes = difficulty === "astronaut"
    ? shuffle(rng, tier.emergencyTypes)
    : difficulty === "commander"
      ? [...shuffle(rng, tier.emergencyTypes), pick(rng, tier.emergencyTypes), pick(rng, tier.emergencyTypes)]
      : tier.emergencyTypes;
  const emergencies = [];
  tier.emergencyBands.forEach((band, index) => {
    const sol = chooseEmergencySol(rng, band, occupied);
    if (sol === null) return;
    occupied.add(sol);
    emergencies.push({ sol, type: emergencyTypes[index % emergencyTypes.length] });
  });
  return {
    storms: storms.sort((left, right) => left.sol - right.sol),
    dustStorms: bases,
    emergencies: emergencies.sort((left, right) => left.sol - right.sol),
    delayBySol: [...(delayWindow(data, windowId).oneWayMinutes ?? [])]
  };
}

/** Add current scheduled world events to a cloned state. */
export function applyWorldForSol(state, schedule) {
  const next = structuredClone(state);
  const dust = schedule.dustStorms.find((storm) =>
    next.sol >= storm.startSol && next.sol < storm.startSol + storm.durationSols
  );
  const storm = schedule.storms.find((item) => item.sol === next.sol) ?? null;
  next.world.dustStormActive = Boolean(dust);
  next.world.sunFactor = dust?.factor ?? 1;
  next.world.stormToday = storm;
  next.world.oneWayDelayMin = schedule.delayBySol[next.sol - 1] ?? 0;
  next.plan.slotCount = storm ? (next.plan.shelter ? 1 : next.plan.slotCount) : next.plan.slotCount;
  return next;
}
