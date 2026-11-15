/** Create the deterministic RNG state used by engine functions. */
export function createRng(seed) {
  return { rngState: seed >>> 0 };
}

/** Return the next float in [0, 1) and advance state.rngState. */
export function nextFloat(state) {
  state.rngState = (state.rngState + 0x6D2B79F5) >>> 0;
  let value = state.rngState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

/** Return a deterministic integer in the inclusive range. */
export function nextInt(state, min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError("nextInt requires an ordered integer range");
  }
  return min + Math.floor(nextFloat(state) * (max - min + 1));
}

/** Return a shuffled copy without changing the input array. */
export function shuffle(state, array) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = nextInt(state, 0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/** Pick one item from a non-empty array. */
export function pick(state, array) {
  if (array.length === 0) {
    throw new RangeError("pick requires a non-empty array");
  }
  return array[nextInt(state, 0, array.length - 1)];
}
