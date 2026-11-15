import test from "node:test";
import assert from "node:assert/strict";
import { loadGameData } from "../helpers/loadData.js";
import { createMission, submitPlan, autoAssign, buildSolReplay, buildSolSummary } from "../../js/engine/index.js";

const data = await loadGameData();
data.real = { "donki-A": { storms: [] }, "delay-A": { oneWayMinutes: [] } };

function planFor(state, jobs, airMakerOn = true) {
  return { slotCount: jobs.length, slots: autoAssign(state, jobs), airMakerOn, shelter: false };
}

function emptyDay(seed = 5) {
  let state = createMission({ seed, difficulty: "cadet", mode: "full" }, data);
  state.schedule.emergencies = [];
  return state;
}

test("replay slot deltas add up to the engine's job results", () => {
  const before = emptyDay();
  before.resources.dust = 40;
  before.resources.shieldBlocks = 4;
  before.resources.airMaker.health = 60;
  const plan = planFor(before, ["clean", "build", "maintain"]);
  const result = submitPlan(before, plan, data);
  const replay = buildSolReplay(before, plan, result.state, data);
  assert.equal(replay.slots.length, 3);
  const dustDrop = replay.slots.reduce((sum, slot) => sum + slot.delta.dust, 0);
  const blockGain = replay.slots.reduce((sum, slot) => sum + slot.delta.shieldBlocks, 0);
  assert.ok(dustDrop < 0);
  assert.ok(blockGain > 0);
  assert.equal(replay.slots[0].end.dust, Math.max(0, 40 - (plan.slots[0].crewId === "amara" ? 52 : 35)));
  assert.equal(replay.slots[2].end.makerHealth - replay.slots[2].start.makerHealth > 0, true);
});

test("replay night numbers match the engine's closed sol", () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const before = emptyDay(seed);
    before.resources.dust = 30;
    const plan = planFor(before, ["clean", "science", "rest"]);
    const result = submitPlan(before, plan, data);
    const replay = buildSolReplay(before, plan, result.state, data);
    assert.equal(replay.closed, true);
    assert.equal(replay.night.matchesEngine, true);
    assert.equal(replay.night.powerAfter, result.state.resources.power);
    assert.equal(replay.night.airAfter, result.state.resources.air);
  }
});

test("a zero-change job is reported as unchanged and never as a success", () => {
  const before = emptyDay();
  before.resources.shieldBlocks = 18;
  const plan = { slotCount: 3, slots: [{ job: "build", crewId: "amara" }, { job: "rest", crewId: null }, { job: "rest", crewId: null }], airMakerOn: true, shelter: false };
  const replay = buildSolReplay(before, plan, submitPlan(before, plan, data).state, data);
  assert.equal(replay.slots[0].delta.shieldBlocks, 0);
  assert.equal(replay.slots[0].changed, false);
  assert.equal(replay.slots[0].layerGained, false);
});

test("a brownout is reported when power cannot run the Air Maker", () => {
  const before = emptyDay();
  before.resources.power = 0;
  before.resources.dust = 70;
  const plan = planFor(before, ["rest", "rest", "rest"]);
  const result = submitPlan(before, plan, data);
  const replay = buildSolReplay(before, plan, result.state, data);
  assert.equal(replay.night.makerWanted, true);
  assert.equal(replay.night.makerRuns, false);
  assert.equal(replay.night.airMade, 0);
  const summary = buildSolSummary(before, plan, result.state, data);
  assert.ok(summary.why.some((item) => item.key === "why.makerStopped"));
});

test("emergency days have no night beat before the emergency resolves", () => {
  const before = createMission({ seed: 7, difficulty: "astronaut" }, data);
  before.schedule.emergencies = [{ sol: 1, type: "air_leak" }];
  const plan = planFor(before, ["rest", "rest", "rest"]);
  const result = submitPlan(before, plan, data);
  assert.equal(result.state.phase, "emergency");
  const replay = buildSolReplay(before, plan, result.state, data);
  assert.equal(replay.closed, false);
  assert.equal(replay.night, null);
  assert.equal(replay.emergencyType, "air_leak");
});

test("replay does not mutate its inputs", () => {
  const before = emptyDay();
  const plan = planFor(before, ["rest", "talk", "rest"]);
  const result = submitPlan(before, plan, data);
  const copy = structuredClone([before, plan, result.state]);
  buildSolReplay(before, plan, result.state, data);
  buildSolSummary(before, plan, result.state, data);
  assert.deepEqual([before, plan, result.state], copy);
});
