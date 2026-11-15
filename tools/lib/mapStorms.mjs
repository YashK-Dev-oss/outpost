function datePart(value) {
  return String(value ?? "").slice(0, 10);
}

function flareScore(classType) {
  const match = String(classType ?? "").match(/^([MX])(\d+(?:\.\d+)?)/i);
  if (!match) return 0;
  const level = Number(match[2]);
  if (match[1].toUpperCase() === "M") return 1;
  if (level >= 5) return 3;
  return 2;
}

/** Map DONKI event arrays into spaced solar storms. */
export function mapStorms(events, startDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const dates = new Map();
  for (const flare of events.flares ?? []) {
    const date = datePart(flare.peakTime ?? flare.beginTime);
    const entry = dates.get(date) ?? { flare: 0, flareClass: null, sep: false, cmeSpeedKmS: null };
    const score = flareScore(flare.classType);
    if (score > entry.flare) {
      entry.flare = score;
      entry.flareClass = flare.classType ?? null;
    }
    dates.set(date, entry);
  }
  for (const sep of events.seps ?? []) {
    const date = datePart(sep.eventTime);
    const entry = dates.get(date) ?? { flare: 0, flareClass: null, sep: false, cmeSpeedKmS: null };
    entry.sep = true;
    dates.set(date, entry);
  }
  for (const cme of events.cmes ?? []) {
    const date = datePart(cme.startTime);
    const analysis = (cme.cmeAnalyses ?? []).find((item) => item.isMostAccurate) ?? cme.cmeAnalyses?.[0];
    const speed = Number(analysis?.speed);
    const entry = dates.get(date) ?? { flare: 0, flareClass: null, sep: false, cmeSpeedKmS: null };
    if (Number.isFinite(speed) && speed >= 1000) entry.cmeSpeedKmS = speed;
    dates.set(date, entry);
  }
  const candidates = [];
  for (const [date, parts] of dates) {
    const dayIndex = Math.floor((Date.parse(`${date}T00:00:00Z`) - start.getTime()) / 86400000);
    const sol = dayIndex + 1;
    const raw = parts.flare + (parts.sep ? 1 : 0) + (parts.cmeSpeedKmS ? 1 : 0);
    if (sol <= 2 || raw < 1) continue;
    candidates.push({
      sol,
      realDate: date,
      severity: Math.min(4, raw),
      components: {
        flare: parts.flareClass,
        sep: parts.sep,
        cmeSpeedKmS: parts.cmeSpeedKmS
      },
      provenance: { events: "real", severity: "scaled", dose: "game" }
    });
  }
  candidates.sort((left, right) => right.severity - left.severity || left.sol - right.sol);
  const selected = [];
  for (const candidate of candidates.slice(0, 5)) {
    const adjacent = selected.findIndex((item) => Math.abs(item.sol - candidate.sol) < 2);
    if (adjacent === -1) selected.push(candidate);
    else if (candidate.severity > selected[adjacent].severity) selected[adjacent] = candidate;
  }
  return selected.sort((left, right) => left.sol - right.sol);
}
