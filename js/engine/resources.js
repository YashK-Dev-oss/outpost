function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function constant(data, name) {
  return data.constants[name].value;
}

/** Apply a single job's resource effect to a cloned state. */
export function applyJobEffect(state, job, crewId, data) {
  const next = structuredClone(state);
  const engineer = crewId === "amara";
  const scientist = crewId === "kenji";
  if (job === "clean") {
    next.resources.dust = Math.max(0, next.resources.dust - (engineer ? 52 : 35));
  } else if (job === "build") {
    next.resources.shieldBlocks = Math.min(
      constant(data, "MAX_LAYERS") * constant(data, "BLOCKS_PER_LAYER"),
      next.resources.shieldBlocks + (engineer ? 3 : 2)
    );
  } else if (job === "maintain") {
    next.resources.airMaker.health = Math.min(100, next.resources.airMaker.health + (engineer ? 37 : 25));
  } else if (job === "science") {
    next.score.science += scientist ? 15 : constant(data, "SCIENCE_PER_WALK");
  }
  return next;
}

/** Resolve power, air, Air Maker wear, and dust for one sol. */
export function resolveResources(state, data) {
  const next = structuredClone(state);
  next.resources.airMaker.on = next.plan.airMakerOn;
  const tier = data.difficulty[next.meta.difficulty];
  const solarMax = constant(data, "SOLAR_MAX");
  const baseUse = tier.constants.BASE_USE;
  const airMakerUse = constant(data, "AIR_MAKER_USE");
  const dustRate = tier.constants.DUST_RATE;
  const income = Math.round(solarMax * next.world.sunFactor * (1 - next.resources.dust / 100));
  const makerWants = next.resources.airMaker.on
    && next.flags.forcedAirMakerOffSol !== next.sol;
  const makerRuns = makerWants
    && next.resources.power + income - baseUse - airMakerUse >= 0;
  const use = baseUse + (makerRuns ? airMakerUse : 0);
  next.resources.power = clamp(next.resources.power + income - use, 0, next.resources.powerCap);
  const health = next.resources.airMaker.health;
  const airGain = makerRuns
    ? Math.floor(constant(data, "AIR_MAKER_OUT") * Math.min(1, health / constant(data, "AIR_MAKER_FULL_OUTPUT_HEALTH")))
    : 0;
  next.resources.air = clamp(
    next.resources.air + airGain - constant(data, "CREW_AIR_USE") * next.crew.length,
    0,
    100
  );
  if (makerRuns) {
    next.resources.airMaker.health = Math.max(0, health - constant(data, "AIR_MAKER_WEAR"));
  }
  next.resources.dust = Math.min(70, next.resources.dust + dustRate * (next.world.dustStormActive ? 2 : 1));
  return {
    state: next,
    makerRuns,
    income,
    events: makerWants && !makerRuns
      ? [{ type: "brownout", sol: next.sol, key: "event.brownout", params: {}, provenance: "game" }]
      : []
  };
}
