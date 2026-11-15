function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Compute the score and star rating from the current state. */
export function computeScore(state) {
  const completedSols = state.history.length;
  const survival = state.phase === "complete" ? 300 : 10 * completedSols;
  const finalWellbeing = state.crew.reduce((total, member) => total + member.wellbeing, 0) / state.crew.length;
  const wellbeing = Math.round(finalWellbeing * 3);
  const science = state.score.science;
  const reserves = clamp(
    state.resources.power + state.resources.air
      + 20 * Math.floor(state.resources.shieldBlocks / state.meta.blocksPerLayer),
    0,
    260
  );
  const emergencies = state.score.emergenciesClean * 25
    + state.score.emergenciesAfterFail * 10;
  const total = survival + wellbeing + science + reserves + emergencies;
  const stars = state.phase === "paused"
    ? 0
    : total >= 1000 ? 5
      : total >= 800 ? 4
        : total >= 600 ? 3
          : total >= 400 ? 2 : 1;
  return { survival, wellbeing, science, reserves, emergencies, total, stars };
}

/** Build the Phase 2 mission report without adding UI concerns. */
export function makeMissionReport(state) {
  return {
    score: computeScore(state),
    charts: {
      power: state.history.map((row) => ({ sol: row.sol, value: row.power })),
      air: state.history.map((row) => ({ sol: row.sol, value: row.air })),
      wellbeing: state.history.map((row) => ({
        sol: row.sol,
        value: row.wellbeing.reduce((sum, value) => sum + value, 0) / row.wellbeing.length
      }))
    },
    whatWasReal: []
  };
}
