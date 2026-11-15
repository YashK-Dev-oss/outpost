import { createRng } from "./rng.js";
import { buildSchedule, applyWorldForSol } from "./schedule.js";

function valueOf(constants, name) {
  return constants[name].value;
}

function difficultyFor(options, data) {
  const difficulty = options.difficulty ?? "astronaut";
  const selected = data.difficulty[difficulty];
  if (!selected) {
    throw new RangeError(`Unknown difficulty: ${difficulty}`);
  }
  return { difficulty, selected };
}

/** Create a pure initial mission state with no generated schedule. */
export function createMission(options = {}, data) {
  const { difficulty, selected } = difficultyFor(options, data);
  const constants = data.constants;
  const seed = Number.isInteger(options.seed) ? options.seed : 1;
  const mode = options.mode ?? "full";
  const totalSols = mode === "classroom"
    ? data.classroom.totalSols
    : mode === "training"
      ? data.training.totalSols
      : valueOf(constants, "SOLS");
  const slots = valueOf(constants, "SLOTS");
  const crew = data.crew.map((member) => ({
    id: member.id,
    wellbeing: valueOf(constants, "START").wellbeing,
    dose: 0,
    restingUntilSol: null
  }));
  const missionCode = `${selected.windowId}-${seed}`;

  const initial = {
    schema: 1,
    meta: {
      mode,
      difficulty,
      windowId: selected.windowId,
      seed,
      missionCode,
      playerName: options.playerName ?? "",
      createdAt: options.createdAt ?? "",
      updatedAt: options.updatedAt ?? "",
      blocksPerLayer: valueOf(constants, "BLOCKS_PER_LAYER"),
      baseSlotCount: slots
    },
    rngState: createRng(seed).rngState,
    sol: 1,
    totalSols,
    phase: "briefing",
    resources: {
      power: selected.startPower,
      powerCap: valueOf(constants, "BATTERY_CAP"),
      air: selected.startAir,
      dust: valueOf(constants, "START").dust,
      shieldBlocks: valueOf(constants, "START").blocks,
      airMaker: {
        on: true,
        health: valueOf(constants, "START").airMakerHealth
      }
    },
    crew,
    plan: {
      slotCount: slots,
      slots: Array.from({ length: slots }, () => ({ job: null, crewId: null })),
      airMakerOn: true,
      shelter: false
    },
    world: {
      dustStormActive: false,
      sunFactor: 1,
      stormToday: null,
      oneWayDelayMin: 0
    },
    schedule: buildSchedule(seed, difficulty, selected.windowId, data),
    emergency: null,
    flags: {
      talkedSol: null,
      forcedAirMakerOffSol: null,
      slotPenaltyNextSol: 0,
      trainingStep: 0
    },
    score: {
      science: 0,
      emergenciesClean: 0,
      emergenciesAfterFail: 0,
      emergenciesDeadline: 0
    },
    history: [],
    log: []
  };
  return applyWorldForSol(initial, initial.schedule);
}
