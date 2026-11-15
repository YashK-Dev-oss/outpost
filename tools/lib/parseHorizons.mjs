function numericFields(line) {
  return line.trim().split(",").filter((value) => value.trim()).map((value) => Number(value.trim())).filter(Number.isFinite);
}

function trailingValue(line) {
  const fields = numericFields(line);
  if (fields.length > 0) return fields[fields.length - 1];
  const match = line.trim().match(/([-+]?\d+(?:\.\d+)?(?:[Ee][-+]?\d+)?)\s*$/);
  return match ? Number(match[1]) : null;
}

/** Parse Horizons $$SOE/$$EOE output into one-way minutes. */
export function parseHorizons(payload, quantity = "21") {
  const result = typeof payload === "string" ? payload : payload?.result;
  if (typeof result !== "string") throw new Error("Horizons response has no result text");
  const start = result.indexOf("$$SOE");
  const end = result.indexOf("$$EOE");
  if (start === -1 || end === -1 || end <= start) throw new Error("Horizons response is missing $$SOE/$$EOE");
  const values = [];
  for (const line of result.slice(start + 5, end).split(/\r?\n/)) {
    const value = trailingValue(line);
    if (value === null || !Number.isFinite(value)) continue;
    values.push(quantity === "20" ? value * 8.3167 : value);
  }
  return values.map((value) => Math.round(value * 10) / 10);
}
