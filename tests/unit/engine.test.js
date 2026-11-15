import test from "node:test";
import assert from "node:assert/strict";
import { loadGameData } from "../helpers/loadData.js";
import {
  createMission,
  submitPlan,
  computeScore,
  advanceSol
} from "../../js/engine/index.js";

const data = await loadGameData();

function plan(...slots) {
  return {
    slotCount: 3,
    slots: slots.map(([job, crewId = null]) => ({ job, crewId })),
    airMakerOn: true,
    shelter: false
  };
}

test("Rest keeps crew wellbeing bounded and resolves the sol", () => {
  const state = createMission({ seed: 10 }, data);
  const result = submitPlan(state, plan(["rest"], ["rest"], ["rest"]), data);
  assert.equal(result.state.phase, "evening");
  assert.deepEqual(result.state.crew.map((member) => member.wellbeing), [100, 100, 100]);
  assert.equal(result.state.resources.power, 98);
  assert.equal(result.state.resources.air, 80);
});

test("Science uses Kenji's bonus and adds outside dose", () => {
  const state = createMission({ seed: 11 }, data);
  const result = submitPlan(state, plan(["science", "kenji"], ["rest"], ["rest"]), data);
  const kenji = result.state.crew.find((member) => member.id === "kenji");
  assert.equal(result.state.score.science, 15);
  assert.equal(kenji.dose, 3);
  assert.equal(kenji.wellbeing, 93);
});

test("Build gives Amara the improved shield block effect", () => {
  const state = createMission({ seed: 12 }, data);
  const result = submitPlan(state, plan(["build", "amara"], ["rest"], ["rest"]), data);
  assert.equal(result.state.resources.shieldBlocks, 3);
  assert.equal(result.state.history[0].layers, 0);
});

test("Air Maker brownout pauses the maker when the power check fails", () => {
  const state = createMission({ seed: 13 }, data);
  state.resources.dust = 70;
  state.resources.power = 0;
  const result = submitPlan(state, plan(["rest"], ["rest"], ["rest"]), data);
  assert.ok(result.events.some((event) => event.type === "brownout"));
  assert.equal(result.state.resources.airMaker.health, 100);
});

test("Repeated sols preserve resource and crew invariants", () => {
  let state = createMission({ seed: 14 }, data);
  for (let index = 0; index < 30; index += 1) {
    const result = submitPlan(state, plan(["rest"], ["rest"], ["rest"]), data);
    state = result.state;
    assert.ok(state.resources.power >= 0 && state.resources.power <= state.resources.powerCap);
    assert.ok(state.resources.air >= 0 && state.resources.air <= 100);
    assert.ok(state.resources.dust >= 0 && state.resources.dust <= 70);
    assert.ok(state.crew.every((member) => member.wellbeing >= 0 && member.wellbeing <= 100));
    if (state.phase === "evening") state = advanceSol(state);
  }
});

test("Same seed and plan are deterministic and input is not mutated", () => {
  const first = createMission({ seed: 15 }, data);
  const second = createMission({ seed: 15 }, data);
  const before = structuredClone(first);
  const firstResult = submitPlan(first, plan(["rest"], ["rest"], ["rest"]), data);
  const secondResult = submitPlan(second, plan(["rest"], ["rest"], ["rest"]), data);
  assert.deepEqual(first, before);
  assert.deepEqual(firstResult, secondResult);
});

test("Score follows the hand-calculated initial completion values", () => {
  const state = createMission({ seed: 16 }, data);
  assert.deepEqual(computeScore(state), {
    survival: 0,
    wellbeing: 300,
    science: 0,
    reserves: 165,
    emergencies: 0,
    total: 465,
    stars: 2
  });
});
