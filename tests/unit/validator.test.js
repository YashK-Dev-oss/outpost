import test from "node:test";
import assert from "node:assert/strict";
import { validateData, validateGameData } from "../../tools/validate-data.mjs";

test("validator accepts the Phase 1 game data", async () => {
  const data = await validateData();
  assert.equal(data.codex.length, 14);
  assert.equal(data.jobs.length, 6);
});

test("validator rejects an invalid provenance fixture", async () => {
  const data = await validateData();
  const fixture = structuredClone(data);
  fixture.constants.SOLS.provenance = "invented";
  assert.throws(() => validateGameData(fixture), /Invalid provenance/);
});

test("validator rejects an emergency option without a trade-off", async () => {
  const data = await validateData();
  const fixture = structuredClone(data);
  const option = fixture.emergencies.air_leak.options[0];
  option.successBlind = 1;
  assert.throws(() => validateGameData(fixture), /No trade-off/);
});
