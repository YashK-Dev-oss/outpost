import { autoAssign, getJobAvailability } from "../js/engine/jobs.js";
import { emergencyForceDeadline } from "../js/engine/index.js";

function firstAvailable(state, jobs, data) {
  const availability = getJobAvailability(state, data);
  return jobs.find((job) => availability[job]?.enabled) ?? "rest";
}

function safeJob(state, job, data) {
  return getJobAvailability(state, data)[job]?.enabled ? job : "rest";
}

export function choosePlan(state, data, botName) {
  const slots = state.plan.slotCount;
  if (botName === "Lazy") return Array.from({ length: slots }, () => ({ job: "rest", crewId: null }));
  if (botName === "GreedyScience") {
    return autoAssign(state, Array.from({ length: slots }, () => safeJob(state, "science", data)));
  }
  if (botName === "Random") {
    const jobs = ["clean", "build", "maintain", "science", "rest"];
    return autoAssign(state, Array.from({ length: slots }, () => firstAvailable(state, [jobs[state.rngState % jobs.length]], data)));
  }
  const planned = [];
  for (let index = 0; index < slots; index += 1) {
    const job = state.resources.dust > 35 && index === 0
      ? "clean"
      : state.resources.airMaker.health < 60 && index === 0
        ? "maintain"
        : Math.floor(state.resources.shieldBlocks / data.constants.BLOCKS_PER_LAYER.value) < 2 && index === 0
          ? "build"
          : state.crew.some((member) => member.wellbeing < 60) ? "rest" : "science";
    planned.push(safeJob(state, job, data));
  }
  return autoAssign(state, planned);
}

export function resolveBotEmergency(state, data) {
  return emergencyForceDeadline(state, data);
}
