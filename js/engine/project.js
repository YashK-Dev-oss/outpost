function constant(data, name) {
  return data.constants[name].value;
}

/** Project current power, air, and shield status without changing state. */
export function projectSols(state, data) {
  const tier = data.difficulty[state.meta.difficulty];
  const income = Math.round(
    constant(data, "SOLAR_MAX") * state.world.sunFactor * (1 - state.resources.dust / 100)
  );
  const makerRuns = state.plan.airMakerOn && state.resources.airMaker.on;
  const powerNet = income - tier.constants.BASE_USE - (makerRuns ? constant(data, "AIR_MAKER_USE") : 0);
  const airGain = makerRuns
    ? Math.floor(constant(data, "AIR_MAKER_OUT") * Math.min(1, state.resources.airMaker.health / constant(data, "AIR_MAKER_FULL_OUTPUT_HEALTH")))
    : 0;
  const airNet = airGain - constant(data, "CREW_AIR_USE") * state.crew.length;
  const estimate = (value, net) => net >= 0 ? { statusKey: "projection.steady", sols: null } : {
    statusKey: "projection.limited",
    sols: Math.min(30, Math.ceil(value / -net))
  };
  const layers = Math.floor(state.resources.shieldBlocks / constant(data, "BLOCKS_PER_LAYER"));
  return {
    power: estimate(state.resources.power, powerNet),
    air: estimate(state.resources.air, airNet),
    shield: {
      layers,
      maxLayers: constant(data, "MAX_LAYERS"),
      nextLayerInJobs: layers >= constant(data, "MAX_LAYERS")
        ? 0
        : constant(data, "BLOCKS_PER_LAYER") - (state.resources.shieldBlocks % constant(data, "BLOCKS_PER_LAYER"))
    }
  };
}
