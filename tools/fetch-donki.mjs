import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { mapStorms } from "./lib/mapStorms.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const windows = {
  A: ["2017-09-01", "2017-09-30"],
  B: ["2024-05-01", "2024-05-30"],
  C: ["2019-06-01", "2019-06-30"]
};
const windowId = process.argv[2];
if (!windows[windowId]) throw new Error("Usage: node tools/fetch-donki.mjs A|B|C");
if (process.env.NASA_API_KEY) {
  console.warn("NASA_API_KEY is set; the current public DONKI endpoint does not require it.");
} else {
  console.warn("NASA_API_KEY is not set; the current public DONKI endpoint does not require it.");
}
const [startDate, endDate] = windows[windowId];
const cacheDir = join(root, "tools", ".cache");
await mkdir(cacheDir, { recursive: true });

async function request(type) {
  const url = `https://ccmc.gsfc.nasa.gov/DONKI-API/get/${type}?startDate=${startDate}&endDate=${endDate}`;
  const cachePath = join(cacheDir, `donki-${windowId}-${type}.json`);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const body = await response.text();
      await writeFile(cachePath, body);
      return JSON.parse(body);
    } catch (error) {
      if (attempt === 2) throw new Error(`DONKI ${type} failed. Re-run the command after fixing network/API access: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

const responses = [];
for (const [index, type] of ["FLR", "CME", "SEP"].entries()) {
  if (index > 0) await new Promise((resolve) => setTimeout(resolve, 500));
  responses.push(await request(type));
}
const [flares, cmes, seps] = responses;
const mapped = mapStorms({
  flares: flares.map((item) => ({ id: item.flrID, peakTime: item.peakTime, beginTime: item.beginTime, classType: item.classType })),
  cmes: cmes.map((item) => ({ id: item.activityID, startTime: item.startTime, cmeAnalyses: item.cmeAnalyses })),
  seps: seps.map((item) => ({ id: item.sepID, eventTime: item.eventTime }))
}, startDate);
const output = {
  _meta: {
    windowId, startDate, endDate, source: "NASA DONKI (CCMC)",
    endpoints: ["/DONKI-API/get/FLR", "/DONKI-API/get/CME", "/DONKI-API/get/SEP"],
    queries: [
      `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=${startDate}&endDate=${endDate}`,
      `https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME?startDate=${startDate}&endDate=${endDate}`,
      `https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=${startDate}&endDate=${endDate}`
    ],
    retrievedAt: new Date().toISOString(), toolVersion: "1.0", provenance: "real"
  },
  events: {
    flares: flares.map((item) => ({ id: item.flrID, peakTime: item.peakTime, classType: item.classType, sol: null })),
    cmes: cmes.map((item) => ({ id: item.activityID, startTime: item.startTime, speedKmS: item.cmeAnalyses?.find((analysis) => analysis.isMostAccurate)?.speed ?? null, sol: null })),
    seps: seps.map((item) => ({ id: item.sepID, eventTime: item.eventTime, sol: null }))
  },
  storms: mapped
};
const outputPath = join(root, "data", "real", `donki-${windowId}.json`);
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`DONKI ${windowId}: ${mapped.length} storms`);
