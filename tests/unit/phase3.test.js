import test from "node:test";
import assert from "node:assert/strict";
import { loadGameData } from "../helpers/loadData.js";
import { buildSchedule } from "../../js/engine/schedule.js";
import { createMission, submitPlan, emergencyAct } from "../../js/engine/index.js";
import { mapStorms } from "../../tools/lib/mapStorms.mjs";
import { parseHorizons } from "../../tools/lib/parseHorizons.mjs";

const data = await loadGameData();

test("storm mapping drops grace days and keeps spaced storms", () => {
  const storms = mapStorms({
    flares: [
      { peakTime: "2017-09-01T00:00:00Z", classType: "X9.0" },
      { peakTime: "2017-09-06T00:00:00Z", classType: "X2.0" }
    ],
    cmes: [{ startTime: "2017-09-06T00:00:00Z", cmeAnalyses: [{ speed: 1200, isMostAccurate: true }] }],
    seps: [{ eventTime: "2017-09-06T00:00:00Z" }]
  }, "2017-09-01");
  assert.equal(storms.length, 1);
  assert.equal(storms[0].sol, 6);
  assert.equal(storms[0].severity, 4);
});

test("Horizons parser reads the 30-minute table shape", () => {
  const result = "header\n$$SOE\n2017-SEP-01, 15.0\n2017-SEP-02, 16.25\n$$EOE";
  assert.deepEqual(parseHorizons(result), [15, 16.3]);
});

test("Horizons parser reads the official space-separated API table", () => {
  const result = JSON.stringify({
    result: "header\n$$SOE\n 2017-Sep-01 00:00       21.91799044\n 2017-Sep-02 00:00       21.90328395\n$$EOE"
  });
  assert.deepEqual(parseHorizons(JSON.parse(result)), [21.9, 21.9]);
});

test("schedule generation is deterministic and keeps emergency spacing", () => {
  const first = buildSchedule(22, "astronaut", "A", data);
  const second = buildSchedule(22, "astronaut", "A", data);
  assert.deepEqual(first, second);
  for (const emergency of first.emergencies) {
    assert.ok(first.storms.every((storm) => Math.abs(storm.sol - emergency.sol) > 1));
  }
});

test("Air Leak worked example uses Earth advice and round-trip delay", () => {
  const mission = createMission({ seed: 33, difficulty: "astronaut" }, data);
  mission.schedule.emergencies = [{ sol: 1, type: "air_leak" }];
  mission.schedule.delayBySol = [15];
  mission.world.oneWayDelayMin = 15;
  const started = submitPlan(mission, {
    slotCount: 3,
    slots: [{ job: "rest", crewId: null }, { job: "rest", crewId: null }, { job: "rest", crewId: null }],
    airMakerOn: true,
    shelter: false
  }, data).state;
  const advised = emergencyAct(started, "askEarth", data);
  assert.equal(advised.state.emergency.clockMin, 30);
  const solved = emergencyAct(advised.state, "patch", data);
  assert.equal(solved.state.emergency.outcome, "clean");
  assert.equal(solved.state.emergency.damage.air, 16);
  assert.equal(solved.state.resources.air, 64);
});

test("Emergency drill marks the response bonus without advancing the clock", () => {
  const mission = createMission({ seed: 34, difficulty: "astronaut" }, data);
  mission.schedule.emergencies = [{ sol: 1, type: "air_leak" }];
  const started = submitPlan(mission, {
    slotCount: 3,
    slots: [{ job: "rest", crewId: null }, { job: "rest", crewId: null }, { job: "rest", crewId: null }],
    airMakerOn: true,
    shelter: false
  }, data).state;
  const result = emergencyAct(started, "challenge", data);
  assert.equal(result.state.emergency.challengeSolved, true);
  assert.equal(result.state.emergency.clockMin, 0);
});
