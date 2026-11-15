import { t } from "../app/i18n.js";

const SLOT_KEYS = ["ui.slotMorning", "ui.slotMidday", "ui.slotAfternoon"];

export const slotLabel = (index) => t(SLOT_KEYS[index] ?? SLOT_KEYS[0]);

export function crewName(data, id) {
  const info = data.crew.find((item) => item.id === id);
  return t(info?.nameKey ?? `crew.${id}.name`);
}

export function jobName(data, id) {
  const job = data.jobs.find((item) => item.id === id);
  return job ? t(job.nameKey) : String(id);
}

/** Format a number with an explicit sign, using a real minus sign. */
export function signed(value, digits = 0) {
  const rounded = Number(Number(value).toFixed(digits));
  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `−${Math.abs(rounded)}`;
  return "0";
}

/** Sentence for what a work/team job actually did. Reads engine replay data only. */
export function resultText(slot, data, delayMin = 0) {
  const { job, start, end, delta } = slot;
  if (job === "clean") {
    return delta.dust === 0 ? t("ui.sol.res.cleanNone") : t("ui.sol.res.clean", { from: start.dust, to: end.dust });
  }
  if (job === "build") {
    if (delta.shieldBlocks === 0) return t("ui.sol.res.buildNone");
    const base = t("ui.sol.res.build", { from: start.shieldBlocks, to: end.shieldBlocks });
    return slot.layerGained ? `${base} ${t("ui.sol.res.buildLayer", { layers: slot.layers })}` : base;
  }
  if (job === "maintain") {
    return delta.makerHealth === 0 ? t("ui.sol.res.maintainNone") : t("ui.sol.res.maintain", { from: start.makerHealth, to: end.makerHealth });
  }
  if (job === "science") {
    return t("ui.sol.res.science", { name: crewName(data, slot.crewId), points: delta.science });
  }
  if (job === "rest") return t("ui.sol.res.rest");
  if (job === "talk") {
    return delayMin > 0 ? t("ui.sol.res.talk", { minutes: Math.round(delayMin) }) : t("ui.sol.res.talkNoDelay");
  }
  return "";
}
