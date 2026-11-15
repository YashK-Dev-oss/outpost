import { createMission } from "./mission.js";
import { autoAssign, getJobAvailability } from "./jobs.js";
import { closeSol, advanceSol, resolvePlan } from "./sol.js";
import { projectSols } from "./project.js";
import { computeScore, makeMissionReport } from "./score.js";
import { startEmergency, emergencyAct as takeEmergencyAction, emergencyForceDeadline } from "./emergency.js";
import { getBriefing as buildBriefing } from "./briefing.js";

/** Create the Phase 2 initial state. Schedule generation is deferred. */
export { createMission };

/** Return the current forecast, Earth message, tip, and projections. */
export function getBriefing(state, data) {
  return buildBriefing(state, data);
}

export { getJobAvailability, autoAssign, closeSol, advanceSol, projectSols, computeScore, makeMissionReport };

/** Validate a plan before submission. */
export function validatePlan(state, plan, data) {
  const errors = [];
  if (!plan || !Array.isArray(plan.slots) || plan.slots.length !== state.plan.slotCount) {
    errors.push("plan.slotCount");
  }
  const availability = getJobAvailability(state, data);
  let talkCount = 0;
  for (const slot of plan?.slots ?? []) {
    if (!slot?.job || !availability[slot.job]?.enabled) {
      errors.push(`plan.job.${slot?.job ?? "missing"}`);
    }
    if (slot?.job && !["rest", "talk"].includes(slot.job)) {
      const crewMember = state.crew.find((member) => member.id === slot.crewId);
      if (!crewMember || (crewMember.restingUntilSol && crewMember.restingUntilSol > state.sol)) {
        errors.push(`plan.crew.${slot.crewId ?? "missing"}`);
      }
    }
    if (slot?.job === "talk") talkCount += 1;
  }
  if (talkCount > 1 || (talkCount === 1 && state.flags.talkedSol === state.sol)) {
    errors.push("plan.talk");
  }
  return { ok: errors.length === 0, errorKeys: errors };
}

/** Validate, execute, and close a plan in the Phase 2 no-event loop. */
export function submitPlan(state, plan, data) {
  const validation = validatePlan(state, plan, data);
  if (!validation.ok) {
    return { state: structuredClone(state), events: [], errorKeys: validation.errorKeys };
  }

  const scheduled = state.schedule.emergencies.find((item) => item.sol === state.sol);
  const result = resolvePlan(state, plan, data, !scheduled);
  if (!scheduled) return result;
  const started = startEmergency({ ...result.state, phase: "emergency" }, data);
  return { state: started.state, events: [...result.events, ...started.events] };
}

/** Estimate a plan without changing the mission. */
export function previewPlan(state, plan, data) {
  const result = resolvePlan(structuredClone(state), plan, data, true);
  return { state: result.state, events: result.events, report: result.report };
}

export function emergencyAct(state, action, data) {
  return takeEmergencyAction(state, action, data);
}

export { emergencyForceDeadline };

export { buildSolReplay, buildSolSummary } from "./replay.js";
