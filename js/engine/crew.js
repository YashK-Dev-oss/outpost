function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function constant(data, name) {
  return data.constants[name].value;
}

function bandFor(dose, bands) {
  if (dose >= bands.red[0]) return "red";
  if (dose >= bands.orange[0]) return "orange";
  if (dose >= bands.yellow[0]) return "yellow";
  return "green";
}

/** Assign work jobs using the deterministic score from the specification. */
export function autoAssign(state, jobIds) {
  const assignments = [];
  const counts = new Map(state.crew.map((member) => [member.id, 0]));
  for (const job of jobIds) {
    if (job === "rest" || job === "talk") {
      assignments.push({ job, crewId: null });
      continue;
    }
    const available = state.crew.filter((member) =>
      (!member.restingUntilSol || member.restingUntilSol <= state.sol) && counts.get(member.id) === 0
    );
    const candidates = available.length > 0
      ? available
      : state.crew.filter((member) => !member.restingUntilSol || member.restingUntilSol <= state.sol);
    const selected = candidates
      .map((member) => ({
        member,
        score: (member.id === "amara" && ["clean", "build", "maintain"].includes(job) ? 2 : 0)
          + (member.id === "kenji" && job === "science" ? 2 : 0)
          + member.wellbeing / 100,
        count: counts.get(member.id)
      }))
      .sort((left, right) => right.score - left.score || left.count - right.count)[0];
    assignments.push({ job, crewId: selected?.member.id ?? null });
    if (selected) counts.set(selected.member.id, selected.count + 1);
  }
  return assignments;
}

/** Apply dose and wellbeing changes at sol close. */
export function resolveCrew(state, planStats, data) {
  const next = structuredClone(state);
  const doseBands = constant(data, "DOSE_BANDS");
  const bandPenalty = constant(data, "BAND_PENALTY");
  const doses = new Map();
  for (const member of next.crew) {
    const walked = planStats.walkers.has(member.id);
    const layers = Math.floor(next.resources.shieldBlocks / constant(data, "BLOCKS_PER_LAYER"));
    const shieldFactor = 1 - constant(data, "SHIELD_STEP") * layers;
    const doseToday = constant(data, "DOSE_BASELINE") * shieldFactor
      + (next.world.stormToday
        ? next.world.stormToday.severity * constant(data, "DOSE_STORM") * shieldFactor
          * (next.plan.shelter ? 0.2 : 1)
        : 0)
      + (walked ? constant(data, "DOSE_SCIENCE_WALK") : 0);
    member.dose += doseToday;
    doses.set(member.id, doseToday);
  }
  const luz = next.crew.find((member) => member.id === "luz");
  for (const member of next.crew) {
    const airPenalty = next.resources.air <= 0
      ? constant(data, "WB_AIR_LOW").at0
      : next.resources.air < 30 ? constant(data, "WB_AIR_LOW").below30 : 0;
    const powerPenalty = next.resources.power <= 0
      ? constant(data, "WB_POWER_LOW").at0
      : next.resources.power < 20 ? constant(data, "WB_POWER_LOW").below20 : 0;
    const workCount = planStats.workJobs.get(member.id) ?? 0;
    const care = member.id !== "luz" && member.wellbeing < 50 && luz.wellbeing >= 40 ? 3 : 0;
    const band = bandFor(member.dose, doseBands);
    const change = constant(data, "WB_BASE_STRESS")
      + constant(data, "WB_WORK") * workCount
      + constant(data, "WB_REST") * planStats.restSlots
      + (planStats.talkUsed ? constant(data, "WB_TALK") : 0)
      - airPenalty
      - powerPenalty
      - doses.get(member.id)
      + bandPenalty[band]
      + care;
    member.wellbeing = clamp(Math.round(member.wellbeing + change), 0, 100);
  }
  return next;
}
