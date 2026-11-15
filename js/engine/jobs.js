import { applyJobEffect } from "./resources.js";

/** Assign work jobs to the best available crew members. */
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

/** Return availability for every configured job. */
export function getJobAvailability(state, data) {
  const maxLayers = data.constants.MAX_LAYERS.value;
  const availability = {};
  for (const job of data.jobs) {
    let enabled = true;
    let reasonKey = "";
    if (job.id === "clean" && state.resources.dust === 0) {
      enabled = false; reasonKey = "job.disabled.clean";
    } else if (job.id === "build" && Math.floor(state.resources.shieldBlocks / data.constants.BLOCKS_PER_LAYER.value) >= maxLayers) {
      enabled = false; reasonKey = "job.disabled.build";
    } else if (job.id === "maintain" && state.resources.airMaker.health >= 90) {
      enabled = false; reasonKey = "job.disabled.maintain";
    } else if (job.id === "science" && (state.plan.shelter || state.world.stormToday)) {
      enabled = false; reasonKey = "job.disabled.science";
    } else if (job.id === "talk" && state.flags.talkedSol === state.sol) {
      enabled = false; reasonKey = "job.disabled.talk";
    }
    availability[job.id] = { enabled, reasonKey };
  }
  return availability;
}

/** Execute jobs in slot order and return planning statistics. */
export function executeJobs(state, slots, data) {
  let next = structuredClone(state);
  const stats = {
    workJobs: new Map(next.crew.map((member) => [member.id, 0])),
    restSlots: 0,
    talkUsed: false,
    walkers: new Set()
  };
  for (const slot of slots) {
    const job = typeof slot === "string" ? slot : slot.job;
    const crewId = typeof slot === "string" ? null : slot.crewId;
    if (job === "rest") {
      stats.restSlots += 1;
    } else if (job === "talk") {
      stats.talkUsed = true;
      next.flags.talkedSol = next.sol;
    } else if (job) {
      stats.workJobs.set(crewId, (stats.workJobs.get(crewId) ?? 0) + 1);
      if (job === "science") stats.walkers.add(crewId);
      next = applyJobEffect(next, job, crewId, data);
      next.log.push({ sol: next.sol, kind: "job", key: `job.${job}.done`, params: { crewId }, provenance: "game" });
    }
  }
  return { state: next, stats };
}

/** Count work and team jobs from a stored plan. */
export function planStats(state) {
  const stats = {
    workJobs: new Map(state.crew.map((member) => [member.id, 0])),
    restSlots: 0,
    talkUsed: false,
    walkers: new Set()
  };
  for (const slot of state.plan.slots) {
    if (slot.job === "rest") stats.restSlots += 1;
    else if (slot.job === "talk") stats.talkUsed = true;
    else if (slot.job) {
      stats.workJobs.set(slot.crewId, (stats.workJobs.get(slot.crewId) ?? 0) + 1);
      if (slot.job === "science") stats.walkers.add(slot.crewId);
    }
  }
  return stats;
}
