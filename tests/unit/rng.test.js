import test from "node:test";
import assert from "node:assert/strict";
import { createRng, nextFloat, nextInt, pick, shuffle } from "../../js/engine/rng.js";

test("RNG produces the same sequence for the same seed", () => {
  const first = createRng(42);
  const second = createRng(42);
  const firstValues = Array.from({length: 5}, () => nextFloat(first));
  const secondValues = Array.from({length: 5}, () => nextFloat(second));
  assert.deepEqual(firstValues, secondValues);
});

test("RNG helpers stay within their requested ranges", () => {
  const state = createRng(7);
  for (let index = 0; index < 1000; index += 1) {
    assert.ok(nextFloat(state) >= 0 && nextFloat(state) < 1);
    const value = nextInt(state, 2, 4);
    assert.ok(value >= 2 && value <= 4);
  }
});

test("shuffle and pick are deterministic and preserve source arrays", () => {
  const source = ["a", "b", "c", "d"];
  const first = shuffle(createRng(9), source);
  const second = shuffle(createRng(9), source);
  assert.deepEqual(first, second);
  assert.deepEqual(source, ["a", "b", "c", "d"]);
  assert.ok(source.includes(pick(createRng(9), source)));
});
