import { applyJobEffect, resolveResources } from "./resources.js";
import { planStats } from "./jobs.js";

function constant(data, name) {
  return data.constants[name].value;
}

function snapshot(state) {
  return {
    dust: state.resources.dust,
    shieldBlocks: state.resources.shieldBlocks,
    makerHealth: state.resources.airMaker.health,
    science: state.score.science
  };
}

/**
 * Break a sol into the beats the player watches. Every number comes from the same
 * engine functions that resolve the sol, so the replay cannot invent outcomes.
 * @param {object} before State at the start of the sol (before submitPlan).
 * @param {{slots: {job: string, crewId: string|null}[], airMakerOn: boolean}} plan The submitted plan.
 * @param {object} after State returned by the engine after the plan (and any emergency).
 * @param {object} data Engine data.
 */
export function buildSolReplay(before, plan, after, data) {
  let working = structuredClone(before);
  working.plan = structuredClone(plan);
  const blocksPerLayer = constant(data, "BLOCKS_PER_LAYER");
  const slots = plan.slots.map((slot, index) => {
    const prev = working;
    const job = slot.job;
    const isWork = job && job !== "rest" && job !== "talk";
    working = isWork ? applyJobEffect(prev, job, slot.crewId, data) : structuredClone(prev);
    const start = snapshot(prev);
    const end = snapshot(working);
    const delta = {
      dust: end.dust - start.dust,
      shieldBlocks: end.shieldBlocks - start.shieldBlocks,
      makerHealth: end.makerHealth - start.makerHealth,
      science: end.science - start.science
    };
    return {
      index,
      job,
      crewId: slot.crewId ?? null,
      start,
      end,
      delta,
      changed: Object.values(delta).some((value) => value !== 0),
      layerGained: Math.floor(end.shieldBlocks / blocksPerLayer) > Math.floor(start.shieldBlocks / blocksPerLayer),
      layers: Math.floor(end.shieldBlocks / blocksPerLayer)
    };
  });

  const afterJobs = working;
  const emergencyToday = before.schedule.emergencies.some((item) => item.sol === before.sol);
  const closed = !emergencyToday && (after.phase === "evening" || after.phase === "paused");
  const tier = data.difficulty[before.meta.difficulty];
  const baseUse = tier.constants.BASE_USE;
  const resolved = resolveResources(afterJobs, data);
  const makerWanted = Boolean(plan.airMakerOn) && before.flags.forcedAirMakerOffSol !== before.sol;
  const makerUse = resolved.makerRuns ? constant(data, "AIR_MAKER_USE") : 0;
  const airMade = resolved.makerRuns
    ? Math.floor(constant(data, "AIR_MAKER_OUT")
      * Math.min(1, afterJobs.resources.airMaker.health / constant(data, "AIR_MAKER_FULL_OUTPUT_HEALTH")))
    : 0;
  const crewAirUse = constant(data, "CREW_AIR_USE") * before.crew.length;
  const sun = {
    income: resolved.income,
    baseUse,
    dust: afterJobs.resources.dust,
    sunPercent: Math.round(before.world.sunFactor * 100),
    dustStorm: Boolean(before.world.dustStormActive),
    dustRise: after.resources.dust - afterJobs.resources.dust
  };
  const night = closed ? {
    ...sun,
    makerWanted,
    makerRuns: resolved.makerRuns,
    makerUse,
    airMade,
    crewAirUse,
    powerBefore: afterJobs.resources.power,
    powerAfter: after.resources.power,
    airBefore: afterJobs.resources.air,
    airAfter: after.resources.air,
    matchesEngine: resolved.state.resources.power === after.resources.power
      && resolved.state.resources.air === after.resources.air
      && resolved.state.resources.dust === after.resources.dust,
    crew: after.crew.map((member) => {
      const start = before.crew.find((item) => item.id === member.id);
      return {
        id: member.id,
        wellbeingBefore: start.wellbeing,
        wellbeingAfter: member.wellbeing,
        doseBefore: start.dose,
        doseAfter: member.dose
      };
    })
  } : null;

  return {
    sol: before.sol,
    slots,
    night,
    sun,
    closed,
    emergencyType: emergencyToday ? (after.emergency?.type ?? null) : null
  };
}

/** Collect the facts shown in the Sol Report. Only states what the engine did. */
export function buildSolSummary(before, plan, after, data) {
  const replay = buildSolReplay(before, plan, after, data);
  const blocksPerLayer = constant(data, "BLOCKS_PER_LAYER");
  const stats = planStats({ ...before, plan });
  const workJobs = [...stats.workJobs.values()].reduce((sum, count) => sum + count, 0);
  const layers = Math.floor(after.resources.shieldBlocks / blocksPerLayer);
  const why = [];
  why.push({ key: "why.sun", params: { income: replay.sun.income, dust: Math.round(replay.sun.dust) } });
  if (replay.sun.dustStorm) why.push({ key: "why.dustStorm", params: { percent: replay.sun.sunPercent } });
  why.push({ key: "why.baseUse", params: { amount: replay.sun.baseUse } });
  if (replay.night) {
    if (replay.night.makerRuns) why.push({ key: "why.makerRan", params: { power: replay.night.makerUse, air: replay.night.airMade } });
    else if (replay.night.makerWanted) why.push({ key: "why.makerStopped", params: {} });
    else why.push({ key: "why.makerOff", params: {} });
  } else if (!plan.airMakerOn) {
    why.push({ key: "why.makerOff", params: {} });
  }
  why.push({ key: "why.crewAir", params: { crew: before.crew.length, air: constant(data, "CREW_AIR_USE") * before.crew.length } });
  if (replay.sun.dustRise > 0) why.push({ key: "why.dustRise", params: { amount: replay.sun.dustRise } });
  if (before.world.stormToday) {
    if (plan.shelter) why.push({ key: "why.stormSheltered", params: {} });
    else if (layers > 0) why.push({ key: "why.stormShield", params: { layers } });
    else why.push({ key: "why.stormBare", params: {} });
  }
  if (workJobs > 0) why.push({ key: "why.work", params: { amount: Math.abs(constant(data, "WB_WORK")) } });
  if (stats.restSlots > 0) why.push({ key: "why.rest", params: {} });
  if (stats.talkUsed) why.push({ key: "why.talk", params: {} });
  if (after.resources.air < 30) why.push({ key: "why.lowAir", params: {} });
  if (after.resources.power < 20) why.push({ key: "why.lowPower", params: {} });
  if (after.emergency?.resolved) why.push({ key: `em.${after.emergency.type}.lesson`, params: {}, lesson: true });

  return {
    sol: before.sol,
    rows: [
      { key: "power", before: before.resources.power, after: after.resources.power },
      { key: "air", before: before.resources.air, after: after.resources.air },
      { key: "dust", before: before.resources.dust, after: after.resources.dust },
      { key: "shield", before: before.resources.shieldBlocks, after: after.resources.shieldBlocks },
      { key: "maker", before: before.resources.airMaker.health, after: after.resources.airMaker.health },
      { key: "science", before: before.score.science, after: after.score.science }
    ],
    slots: replay.slots,
    crew: after.crew.map((member) => {
      const start = before.crew.find((item) => item.id === member.id);
      return {
        id: member.id,
        wellbeingBefore: start.wellbeing,
        wellbeingAfter: member.wellbeing,
        doseBefore: start.dose,
        doseAfter: member.dose
      };
    }),
    why
  };
}
