import { t } from "../../app/i18n.js";
import { announce } from "../../app/a11y.js";
import { tone } from "../../app/audio.js";
import { loadSettings, saveSettings } from "../../app/settings.js";
import { prefersReducedMotion } from "../../app/motion.js";
import { baseView } from "../baseView.js";
import { crewName, jobName, slotLabel, resultText, signed } from "../solText.js";

function el(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function hudChip(label, max) {
  const chip = el("div", "sol-chip");
  const name = el("small", "", label);
  const value = el("strong", "", "");
  const track = el("span", "sol-chip-track");
  const fill = el("i");
  track.append(fill);
  chip.append(name, value, track);
  chip.set = (number, text = String(Math.round(number))) => {
    value.textContent = text;
    fill.style.width = `${Math.max(0, Math.min(100, (number / max) * 100))}%`;
  };
  return chip;
}

/**
 * Play the sol as a short sequence on the outpost scene.
 * Every number shown comes from `replay` (see engine/replay.js), which is built
 * from the same engine functions that resolved the sol.
 */
export function solScreen({ before, plan, replay, data, finalState, onDone }) {
  const section = el("section", "screen sol-screen");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", t("ui.sol.region", { sol: before.sol }));
  const sound = () => loadSettings().sound;
  const blocksPerLayer = data.constants.BLOCKS_PER_LAYER.value;
  const layersOf = (blocks) => Math.min(3, Math.floor(blocks / blocksPerLayer));

  const header = el("div", "sol-header");
  header.append(el("h1", "", t("ui.sol.title", { sol: before.sol })));
  const clock = el("span", "sol-clock", slotLabel(0));
  const progress = el("small", "sol-progress");
  header.append(clock, progress);

  const world = baseView({ state: before, data, playback: true });
  const hud = el("div", "sol-hud");
  const powerChip = hudChip(t("ui.power"), 100);
  const airChip = hudChip(t("ui.air"), 100);
  const shieldChip = hudChip(t("ui.shield"), 3);
  const crewChip = hudChip(t("ui.sol.hudWellbeing"), 100);
  hud.append(powerChip, airChip, shieldChip, crewChip);
  const average = (list) => list.reduce((sum, value) => sum + value, 0) / (list.length || 1);
  const setHud = (values = {}) => {
    if (values.power !== undefined) powerChip.set(values.power);
    if (values.air !== undefined) airChip.set(values.air);
    if (values.shieldBlocks !== undefined) shieldChip.set(layersOf(values.shieldBlocks) + (layersOf(values.shieldBlocks) < 3 ? (values.shieldBlocks % blocksPerLayer) / blocksPerLayer : 0), t("ui.sol.hudShield", { layers: layersOf(values.shieldBlocks), blocks: values.shieldBlocks }));
    if (values.wellbeing !== undefined) crewChip.set(values.wellbeing);
  };
  setHud({ power: before.resources.power, air: before.resources.air, shieldBlocks: before.resources.shieldBlocks, wellbeing: average(before.crew.map((member) => member.wellbeing)) });

  const caption = el("p", "sol-caption");
  caption.setAttribute("aria-live", "polite");
  const controls = el("div", "sol-controls");
  const nextButton = el("button", "primary sol-next", t("ui.sol.next"));
  nextButton.type = "button";
  const speedButton = el("button", "sol-speed", "");
  speedButton.type = "button";
  const skipButton = el("button", "sol-skip", "");
  skipButton.type = "button";
  controls.append(nextButton, speedButton, skipButton);
  section.append(header, world, hud, caption, controls);

  const weatherKey = before.world.stormToday ? "ui.sol.weatherSolar" : before.world.dustStormActive ? "ui.sol.weatherDust" : "ui.sol.weatherClear";
  const sheltered = Boolean(plan.shelter) && Boolean(before.world.stormToday);
  const delayMin = before.world.oneWayDelayMin ?? 0;
  const night = replay.night;
  const reduced = prefersReducedMotion();
  const steps = [];

  steps.push({
    ms: 1600,
    text: t("ui.sol.begin", { sol: before.sol, weather: t(weatherKey) }),
    run: () => {
      world.applyState({ makerOn: Boolean(plan.airMakerOn) });
      world.setPlan({ ...plan, slots: plan.slots.map(() => ({ job: null, crewId: null })) }, 0);
      clock.textContent = slotLabel(0);
    }
  });

  replay.slots.forEach((beat, index) => {
    const job = beat.job;
    const isTeam = job === "rest" || job === "talk";
    const walkText = sheltered
      ? t("ui.sol.walkShelter", { slot: slotLabel(index) })
      : isTeam
        ? t("ui.sol.walkAll", { slot: slotLabel(index), job: jobName(data, job) })
        : t("ui.sol.walk", { slot: slotLabel(index), name: crewName(data, beat.crewId), job: jobName(data, job) });
    steps.push({
      ms: 1500,
      text: walkText,
      run: () => {
        world.clearFloats();
        clock.textContent = slotLabel(index);
        world.setPlan(plan, index);
        tone("tap", sound());
      }
    });
    steps.push({
      ms: 1700,
      text: sheltered ? t("ui.sol.res.shelter") : resultText(beat, data, delayMin),
      run: () => {
        world.clearFloats();
        if (sheltered) return;
        world.applyState({ dust: beat.end.dust, shieldBlocks: beat.end.shieldBlocks, makerHealth: beat.end.makerHealth });
        setHud({ shieldBlocks: beat.end.shieldBlocks });
        if (job === "clean") {
          if (beat.changed) { world.float(t("ui.sol.f.dust", { value: signed(beat.delta.dust) }), "panels", "good"); world.pulse(t("ui.solarPanels")); tone("success", sound()); }
          else { world.float(t("ui.sol.f.none"), "panels", "muted"); }
        } else if (job === "build") {
          if (beat.changed) {
            world.float(t("ui.sol.f.blocks", { value: signed(beat.delta.shieldBlocks) }), [430, 300], "good");
            if (beat.layerGained) world.float(t("ui.sol.f.layer"), [430, 276], "good");
            world.pulse(t("ui.shield"));
            tone("success", sound());
          } else { world.float(t("ui.sol.f.none"), [430, 300], "muted"); }
        } else if (job === "maintain") {
          if (beat.changed) { world.float(t("ui.sol.f.health", { value: signed(beat.delta.makerHealth) }), "maker", "good"); world.pulse(t("ui.airMaker")); tone("success", sound()); }
          else { world.float(t("ui.sol.f.none"), "maker", "muted"); }
        } else if (job === "science") {
          world.float(t("ui.sol.f.science", { value: signed(beat.delta.science) }), "site", "good");
          world.pulse(t("job.science.name"));
          tone("success", sound());
        } else if (job === "rest") {
          world.float(t("ui.sol.f.rest"), "hab", "info");
        } else if (job === "talk") {
          world.float(t("ui.sol.f.msg"), "dish", "info");
          world.pulse(t("ui.world.dish"));
        }
      }
    });
  });

  if (night) {
    steps.push({
      ms: 1500,
      text: t("ui.sol.night"),
      run: () => { world.clearFloats(); world.setNight(true); clock.textContent = t("ui.sol.nightLabel"); }
    });
    steps.push({
      ms: 2300,
      text: t("ui.sol.powerNight", { from: night.powerBefore, to: night.powerAfter, income: night.income, used: night.baseUse + night.makerUse }),
      run: () => {
        world.float(t("ui.sol.f.sun", { value: signed(night.income) }), "panels", "good");
        world.float(t("ui.sol.f.base", { value: signed(-night.baseUse) }), "hab", "bad");
        if (night.makerRuns) world.float(t("ui.sol.f.maker", { value: signed(-night.makerUse) }), "maker", "bad");
        if (night.dustRise > 0) world.float(t("ui.sol.f.dustRise", { value: signed(night.dustRise) }), [120, 250], "muted");
        world.applyState({ power: night.powerAfter, dust: finalState.resources.dust });
        setHud({ power: night.powerAfter });
        tone("tap", sound());
      }
    });
    steps.push({
      ms: 2300,
      text: night.makerRuns
        ? t("ui.sol.airNight", { from: night.airBefore, to: night.airAfter, made: night.airMade, used: night.crewAirUse })
        : night.makerWanted
          ? t("ui.sol.airStopped", { from: night.airBefore, to: night.airAfter })
          : t("ui.sol.airOff", { from: night.airBefore, to: night.airAfter, used: night.crewAirUse }),
      run: () => {
        world.clearFloats();
        world.applyState({ makerOn: night.makerRuns, makerHealth: finalState.resources.airMaker.health });
        if (night.makerRuns) {
          world.float(t("ui.sol.f.air", { value: signed(night.airMade) }), "maker", "good");
          tone("tap", sound());
        } else if (night.makerWanted) {
          world.float(t("ui.sol.f.stopped"), "maker", "bad");
          tone("alert", sound());
        } else {
          world.float(t("ui.sol.f.makerOff"), "maker", "muted");
        }
        world.float(t("ui.sol.f.crewAir", { value: signed(-night.crewAirUse) }), "hab", "bad");
        setHud({ air: night.airAfter });
      }
    });
    steps.push({
      ms: 2600,
      text: t("ui.sol.crewNight"),
      run: () => {
        world.clearFloats();
        world.applyState({ crew: night.crew.map((member) => ({ id: member.id, wellbeing: member.wellbeingAfter })) });
        night.crew.forEach((member) => {
          world.float(t("ui.sol.f.crew", { wb: signed(member.wellbeingAfter - member.wellbeingBefore), dose: signed(member.doseAfter - member.doseBefore, 1) }), `crew:${member.id}`, member.wellbeingAfter < member.wellbeingBefore ? "bad" : "good");
        });
        setHud({ wellbeing: average(night.crew.map((member) => member.wellbeingAfter)) });
      }
    });
    steps.push({ ms: 1100, text: t("ui.sol.complete", { sol: before.sol }), run: () => world.clearFloats() });
  } else if (replay.emergencyType) {
    steps.push({
      ms: 2400,
      text: t("ui.sol.emergency", { title: t(`em.${replay.emergencyType}.title`) }),
      run: () => { world.clearFloats(); world.setAlarm(true); tone("alert", sound()); }
    });
  }

  let index = -1;
  let timer = null;
  let fast = Boolean(loadSettings().fastSol);
  let finished = false;
  const emergencyEnd = !night && Boolean(replay.emergencyType);

  const updateButtons = () => {
    speedButton.textContent = t(fast ? "ui.sol.normal" : "ui.sol.fast");
    speedButton.setAttribute("aria-pressed", String(fast));
    skipButton.textContent = t(emergencyEnd ? "ui.sol.skipEmergency" : "ui.sol.skip");
    speedButton.hidden = reduced;
  };
  updateButtons();

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    onDone();
  }

  function schedule(step) {
    clearTimeout(timer);
    if (reduced || finished) return;
    timer = setTimeout(advance, step.ms * (fast ? 0.5 : 1));
  }

  function runStep(next) {
    index = next;
    const step = steps[index];
    step.run();
    caption.textContent = step.text;
    progress.textContent = t("ui.sol.step", { n: index + 1, total: steps.length });
    if (index === steps.length - 1) nextButton.textContent = t(emergencyEnd ? "ui.sol.toEmergency" : "ui.sol.toReport");
    schedule(step);
  }

  function advance() {
    if (finished) return;
    if (!section.isConnected && index >= 0) { finished = true; clearTimeout(timer); return; }
    if (index + 1 >= steps.length) finish(); else runStep(index + 1);
  }

  nextButton.onclick = advance;
  skipButton.onclick = finish;
  speedButton.onclick = () => {
    fast = !fast;
    saveSettings({ ...loadSettings(), fastSol: fast });
    updateButtons();
    announce(t(fast ? "ui.sol.fast" : "ui.sol.normal"));
    schedule(steps[Math.max(0, index)]);
  };

  setTimeout(() => { if (section.isConnected && index < 0) runStep(0); }, 60);
  return section;
}
