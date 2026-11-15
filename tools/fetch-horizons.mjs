import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHorizons } from "./lib/parseHorizons.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const windows = { A: ["2017-09-01", "2017-09-30"], B: ["2024-05-01", "2024-05-30"], C: ["2019-06-01", "2019-06-30"] };
const windowId = process.argv[2];
if (!windows[windowId]) throw new Error("Usage: node tools/fetch-horizons.mjs A|B|C");
const [startDate, endDate] = windows[windowId];
const cacheDir = join(root, "tools", ".cache");
await mkdir(cacheDir, { recursive: true });
const params = new URLSearchParams({
  format: "json", COMMAND: "'499'", CENTER: "'500@399'", EPHEM_TYPE: "'OBSERVER'",
  START_TIME: `'${startDate}'`, STOP_TIME: `'${endDate}'`, STEP_SIZE: "'1 d'", QUANTITIES: "'21'"
});
const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
let response;
try {
  response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
} catch (error) {
  throw new Error(`JPL Horizons failed. Re-run the command after fixing network access: ${error.message}`);
}
const payload = await response.json();
await writeFile(join(cacheDir, `horizons-${windowId}.json`), JSON.stringify(payload));
let values;
try {
  values = parseHorizons(payload, "21");
} catch {
  const fallbackParams = new URLSearchParams(params);
  fallbackParams.set("QUANTITIES", "'20'");
  const fallback = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${fallbackParams}`);
  const fallbackPayload = await fallback.json();
  values = parseHorizons(fallbackPayload, "20");
}
if (values.length !== 30) throw new Error(`JPL Horizons returned ${values.length} values; expected 30.`);
const output = {
  _meta: { windowId, source: "NASA/JPL Horizons", query: url, retrievedAt: new Date().toISOString(), quantity: "21", provenance: "real" },
  oneWayMinutes: values
};
await writeFile(join(root, "data", "real", `delay-${windowId}.json`), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Horizons ${windowId}: ${Math.min(...values)}-${Math.max(...values)} minutes`);
