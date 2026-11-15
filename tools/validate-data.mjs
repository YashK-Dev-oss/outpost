import { readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const gameDir = join(root, "data", "game");
const provenanceValues = new Set(["real", "scaled", "game"]);
const effectKeys = new Set([
  "power", "air", "allWellbeing", "crewWellbeing", "airMakerHealthSet",
  "airMakerHealthAdd", "batteryCapAdd", "forcedAirMakerOffNextSol",
  "slotPenaltyNextSol", "restSols"
]);

export async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateEffects(effects, label) {
  assert(effects && typeof effects === "object" && !Array.isArray(effects), `${label} must be an object`);
  for (const key of Object.keys(effects)) {
    assert(effectKeys.has(key), `${label} has unknown effect key ${key}`);
  }
}

function validateConstants(constants) {
  const names = [
    "SOLS", "SLOTS", "SOLAR_MAX", "BASE_USE", "AIR_MAKER_USE",
    "BATTERY_CAP", "DUST_RATE", "CREW_AIR_USE", "AIR_MAKER_OUT",
    "AIR_MAKER_WEAR", "AIR_MAKER_FULL_OUTPUT_HEALTH", "BLOCKS_PER_LAYER",
    "MAX_LAYERS", "SHIELD_STEP", "DOSE_BASELINE", "DOSE_SCIENCE_WALK",
    "DOSE_STORM", "DOSE_BANDS", "BAND_PENALTY", "WB_BASE_STRESS",
    "WB_WORK", "WB_REST", "WB_TALK", "WB_AIR_LOW", "WB_POWER_LOW",
    "SCIENCE_PER_WALK", "START"
  ];
  for (const name of names) {
    const entry = constants[name];
    assert(entry && Object.hasOwn(entry, "value"), `Missing constant ${name}`);
    assert(provenanceValues.has(entry.provenance), `Invalid provenance for ${name}`);
    assert(typeof entry.note === "string" && entry.note.length > 0, `Missing note for ${name}`);
  }
}

function validateDifficulty(difficulty) {
  const expected = {
    cadet: {windowId: "C", startPower: 100, startAir: 100, emergencyCount: 2},
    astronaut: {windowId: "A", startPower: 80, startAir: 85, emergencyCount: 4},
    commander: {windowId: "B", startPower: 70, startAir: 75, emergencyCount: 6}
  };
  for (const tier of ["cadet", "astronaut", "commander"]) {
    const value = difficulty[tier];
    assert(value && value.windowId === expected[tier].windowId, `Invalid ${tier} window`);
    assert(value.startPower === expected[tier].startPower && value.startAir === expected[tier].startAir, `Invalid ${tier} start`);
    assert(value.emergencyCount === expected[tier].emergencyCount, `Invalid ${tier} emergency count`);
    assert(Array.isArray(value.emergencyBands), `Missing ${tier} emergency bands`);
    assert(Array.isArray(value.dustStorms), `Missing ${tier} dust storms`);
    assert(typeof value.coachTips === "boolean", `Invalid ${tier} coach tips`);
    assert(typeof value.deadlineMod === "number", `Invalid ${tier} deadline modifier`);
    assert(typeof value.blindMod === "number", `Invalid ${tier} blind modifier`);
  }
}

function validateJobs(jobs) {
  assert(Array.isArray(jobs) && jobs.length === 6, "jobs.json must contain six jobs");
  assert(jobs.map((job) => job.id).join(",") === "clean,build,maintain,science,rest,talk", "Invalid job ids");
  for (const job of jobs) {
    for (const key of ["id", "icon", "type", "nameKey", "descKey", "tradeoffKey", "provenance"]) {
      assert(typeof job[key] === "string" && job[key], `Job missing ${key}`);
    }
    assert(provenanceValues.has(job.provenance), `Invalid job provenance: ${job.id}`);
  }
}

function validateCrew(crew) {
  assert(Array.isArray(crew) && crew.length === 3, "crew.json must contain three crew members");
  assert(crew.map((member) => member.id).join(",") === "amara,kenji,luz", "Invalid crew ids");
  for (const member of crew) {
    assert(provenanceValues.has(member.provenance), `Invalid crew provenance: ${member.id}`);
    assert(Array.isArray(member.skillJobs), `Missing skill jobs for ${member.id}`);
  }
}

function validateWindows(windows) {
  assert(Array.isArray(windows) && windows.length === 3, "windows.json must contain three windows");
  for (const window of windows) {
    assert(["A", "B", "C"].includes(window.id), `Invalid window id ${window.id}`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(window.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(window.endDate), `Invalid dates for ${window.id}`);
    assert(provenanceValues.has(window.provenance), `Invalid window provenance: ${window.id}`);
    assert(window.dataFiles?.donki && window.dataFiles?.delay, `Missing data files for ${window.id}`);
  }
}

function validateMissionModes(classroom, training) {
  assert(classroom.totalSols === 10 && classroom.windowId === "C", "Invalid classroom mission");
  assert(classroom.emergencies.length === 2 && classroom.practiceStorm.provenance === "game", "Invalid classroom events");
  assert(training.totalSols === 3 && training.sols.length === 3, "Invalid training mission");
  assert(training.sols[2].events[0].provenance === "game", "Invalid training event provenance");
}

function validateEmergencies(emergencies) {
  assert(Object.keys(emergencies).length === 4, "emergencies.json must contain four emergencies");
  for (const [id, emergency] of Object.entries(emergencies)) {
    assert(emergency.provenance === "game", `Invalid provenance for ${id}`);
    assert(typeof emergency.deadlineMin === "number", `Missing deadline for ${id}`);
    validateEffects(emergency.perMinute, `${id}.perMinute`);
    validateEffects(emergency.deadlineFailure, `${id}.deadlineFailure`);
    assert(Array.isArray(emergency.options) && emergency.options.length === 3, `${id} must have three options`);
    for (const option of emergency.options) {
      assert(option.provenance === "game", `Missing provenance for ${id}.${option.id}`);
      assert(typeof option.tradeoffKey === "string" && option.tradeoffKey, `Missing trade-off for ${id}.${option.id}`);
      assert(option.successBlind < 1 || Object.keys(option.costs ?? {}).length > 0, `No trade-off for ${id}.${option.id}`);
      validateEffects(option.onSuccess, `${id}.${option.id}.onSuccess`);
      validateEffects(option.onFail, `${id}.${option.id}.onFail`);
      validateEffects(option.costs, `${id}.${option.id}.costs`);
    }
  }
}

function validateCodex(codex) {
  assert(Array.isArray(codex) && codex.length === 14, "codex.json must contain 14 entries");
  for (const entry of codex) {
    for (const key of ["id", "titleKey", "textKey", "kind", "sourceName", "sourceUrl", "verifiedBy", "verifiedDate", "status"]) {
      assert(Object.hasOwn(entry, key), `Codex entry ${entry.id ?? "unknown"} missing ${key}`);
    }
    assert(provenanceValues.has(entry.kind), `Invalid codex kind: ${entry.id}`);
    assert(entry.status === "needs-verification", `Unexpected codex status: ${entry.id}`);
  }
}

function validateStringReferences(data, strings) {
  const references = [];
  for (const job of data.jobs) {
    references.push(job.nameKey, job.descKey, job.tradeoffKey);
  }
  for (const emergency of Object.values(data.emergencies)) {
    references.push(emergency.titleKey, emergency.storyKey, emergency.factKey, emergency.earthReplyKey, emergency.lessonKey);
    for (const option of emergency.options) {
      references.push(option.tradeoffKey);
    }
  }
  for (const entry of data.codex) {
    references.push(entry.titleKey, entry.textKey);
  }
  for (const crewMember of data.crew) {
    references.push(crewMember.nameKey, crewMember.roleKey);
  }
  for (const key of references) {
    assert(typeof strings[key] === "string", `Missing string key ${key}`);
  }
}

function validateRealDataPlaceholders() {
  for (const windowId of ["A", "B", "C"]) {
    const donkiPath = join(root, "data", "real", `donki-${windowId}.json`);
    const delayPath = join(root, "data", "real", `delay-${windowId}.json`);
    if (existsSync(donkiPath) && existsSync(delayPath)) {
      const donki = JSON.parse(requirePlaceholderRead(donkiPath));
      const delay = JSON.parse(requirePlaceholderRead(delayPath));
      if (Object.keys(donki).length === 0 && Object.keys(delay).length === 0) {
        continue;
      }
      assert(donki._meta?.provenance === "real", `Invalid DONKI ${windowId} provenance`);
      assert(Array.isArray(donki.storms), `Missing DONKI ${windowId} storms`);
      assert(delay._meta?.provenance === "real", `Invalid delay ${windowId} provenance`);
      assert(Array.isArray(delay.oneWayMinutes) && delay.oneWayMinutes.length === 30, `Invalid delay ${windowId} length`);
      assert(delay.oneWayMinutes.every((value) => typeof value === "number" && value > 0), `Invalid delay ${windowId} values`);
    }
  }
}

function requirePlaceholderRead(path) {
  return readFileSync(path, "utf8");
}

export function validateGameData(data) {
  validateConstants(data.constants);
  validateDifficulty(data.difficulty);
  validateJobs(data.jobs);
  validateEmergencies(data.emergencies);
  validateCodex(data.codex);
  validateStringReferences(data, data.strings);
  for (const [key, value] of Object.entries(data.strings)) {
    if (value.split(/[.!?]+/).some((sentence) => sentence.trim().split(/\s+/).filter(Boolean).length > 20)) {
      console.warn(`Warning: string ${key} has a sentence group over 20 words`);
    }
  }
}

export async function validateData() {
  assert(existsSync(gameDir), "Missing data/game directory");
  const data = {
    constants: await readJson("data/game/constants.json"),
    difficulty: await readJson("data/game/difficulty.json"),
    jobs: await readJson("data/game/jobs.json"),
    emergencies: await readJson("data/game/emergencies.json"),
    crew: await readJson("data/game/crew.json"),
    windows: await readJson("data/game/windows.json"),
    classroom: await readJson("data/game/classroom.json"),
    training: await readJson("data/game/training.json"),
    codex: await readJson("data/game/codex.json"),
    strings: await readJson("data/game/strings.en.json")
  };
  validateGameData(data);
  validateCrew(data.crew);
  validateWindows(data.windows);
  validateMissionModes(data.classroom, data.training);
  validateRealDataPlaceholders();
  return data;
}

function buildReport(data) {
  const groups = { real: [], scaled: [], game: [] };
  for (const [name, entry] of Object.entries(data.constants)) {
    groups[entry.provenance].push(`- \`${name}\`: ${JSON.stringify(entry.value)} — ${entry.note}`);
  }
  for (const entry of data.jobs) {
    groups[entry.provenance].push(`- job \`${entry.id}\``);
  }
  for (const entry of data.codex) {
    groups[entry.kind].push(`- codex \`${entry.id}\`: ${entry.status}`);
  }
  return `# Data Provenance\n\nGenerated by \`npm run validate -- --report\`.\n\n${Object.entries(groups)
    .map(([group, entries]) => `## ${group}\n\n${entries.join("\n") || "- None"}`)
    .join("\n\n")}\n`;
}

const data = await validateData().catch((error) => {
  console.error(`Data validation failed: ${error.message}`);
  process.exitCode = 1;
  return null;
});

if (data && process.argv.includes("--release")) {
  for (const entry of data.codex) {
    assert(entry.status === "verified" && entry.verifiedBy && entry.verifiedDate, `Human verification required for Codex entry ${entry.id}`);
  }
}

if (data && process.argv.includes("--report")) {
  await writeFile(join(root, "docs", "DATA_PROVENANCE.md"), buildReport(data));
}
