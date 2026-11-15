import { t } from "../../app/i18n.js";
import { getBriefing, getJobAvailability, autoAssign, previewPlan } from "../../engine/index.js";
import { crewCard } from "../components/crewCard.js";
import { meter } from "../components/meter.js";
import { baseView } from "../baseView.js";
import { announce } from "../../app/a11y.js";
function button(text, onClick) { const element = document.createElement("button"); element.textContent = text; element.onclick = onClick; return element; }
function storyKey(sol, total) {
  if (sol >= total) return "ui.story30";
  if (sol >= 25) return "ui.story25";
  if (sol >= 20) return "ui.story20";
  if (sol >= 15) return "ui.story15";
  if (sol >= 10) return "ui.story10";
  if (sol >= 5) return "ui.story5";
  if (sol === 1) return "ui.story1";
  return "ui.storyOngoing";
}
function pulseKey(state) {
  if (state.schedule?.emergencies?.some((item) => item.sol === state.sol)) return "ui.pulseEmergency";
  if (state.world.stormToday) return "ui.pulseStorm";
  if (state.resources.air < 40) return "ui.pulseAir";
  if (state.crew.some((member) => member.wellbeing < 60)) return "ui.pulseCrew";
  if (state.resources.dust > 35) return "ui.pulseDust";
  if (state.resources.airMaker.health < 60) return "ui.pulseMaker";
  return "ui.pulseReady";
}
export function commandScreen({ state, data, onStart }) {
  const section = document.createElement("section"); section.className = "command screen";
  const h = document.createElement("h1"); h.className = "command-title"; h.textContent = t("ui.command"); section.append(h);
  const top = document.createElement("p"); top.textContent = t("ui.solOf", { sol: state.sol, total: state.totalSols }); section.append(top);
  const clock = document.createElement("div"); clock.className = "mission-clock";
  const clockTitle = document.createElement("strong"); clockTitle.textContent = t("ui.missionClock");
  const clockTrack = document.createElement("span"); clockTrack.className = "mission-clock-track";
  const clockFill = document.createElement("span"); clockFill.style.width = `${Math.min(100, (state.sol / state.totalSols) * 100)}%`;
  clockTrack.append(clockFill);
  const clockHelp = document.createElement("small"); clockHelp.textContent = t("ui.missionClockHelp", { sol: state.sol - 1, total: state.totalSols });
  clock.append(clockTitle, clockTrack, clockHelp); section.append(clock);
  const mission = document.createElement("aside"); mission.className = "mission-coach";
  const missionTitle = document.createElement("strong"); missionTitle.textContent = t("ui.missionGoalTitle");
  const missionGoal = document.createElement("span"); missionGoal.textContent = t("ui.missionGoal");
  const story = document.createElement("small"); story.className = "mission-story"; story.textContent = t(storyKey(state.sol, state.totalSols));
  const next = document.createElement("small"); next.textContent = `${t("ui.nextStep")}: ${t("ui.nextStepPlan")}`;
  const emergencyToday = state.schedule?.emergencies?.some((item) => item.sol === state.sol);
  const objective = document.createElement("small"); objective.className = "mission-objective";
  objective.textContent = t(emergencyToday ? "ui.objectiveEmergency" : state.world.stormToday ? "ui.objectiveStorm" : state.sol === 1 ? "ui.objectiveFirst" : "ui.objectiveDefault");
  mission.append(missionTitle, missionGoal, story, objective, next); section.append(mission);
  const pulse = document.createElement("aside"); pulse.className = "command-pulse";
  const pulseTitle = document.createElement("strong"); pulseTitle.textContent = t("ui.commandPulseTitle");
  const pulseText = document.createElement("span");
  pulseText.textContent = t(pulseKey(state), { value: state.resources.air });
  pulse.append(pulseTitle, pulseText); section.append(pulse);
  if (state.sol === 1) {
    const tutorial = document.createElement("aside"); tutorial.className = "tutorial-card";
    const tutorialTitle = document.createElement("strong"); tutorialTitle.textContent = t("ui.tutorialTitle");
    const steps = document.createElement("div"); [1, 2, 3].forEach((step) => { const item = document.createElement("span"); item.textContent = t(`ui.tutorialStep${step}`); steps.append(item); });
    const close = button(t("ui.tutorialClose"), () => tutorial.remove()); close.className = "tutorial-close";
    tutorial.append(tutorialTitle, steps, close); section.append(tutorial);
  }
  const outpostTitle = document.createElement("h2"); outpostTitle.className = "section-title"; outpostTitle.textContent = t("ui.outpostStatus"); section.append(outpostTitle);
  const meters = document.createElement("div"); meters.className = "meter-strip";
  const shieldBlocks = state.resources.shieldBlocks;
  const shieldLayers = Math.floor(shieldBlocks / data.constants.BLOCKS_PER_LAYER.value);
  const shieldHelp = shieldLayers >= data.constants.MAX_LAYERS.value ? t("ui.shieldMax") : `${t("ui.shieldHelp")} ${t("ui.shieldBlocks", { blocks: shieldBlocks % data.constants.BLOCKS_PER_LAYER.value })}`;
  [[t("ui.power"), state.resources.power, 100, t("ui.powerHelp")], [t("ui.air"), state.resources.air, 100, t("ui.airHelp")], [t("ui.shield"), shieldLayers, 3, shieldHelp]].forEach(([label, value, max, help]) => { const card = meter(label, value, max); const hint = document.createElement("small"); hint.className = "meter-help"; hint.textContent = help; card.append(hint); meters.append(card); });
  section.append(meters);
  const crewTitle = document.createElement("h2"); crewTitle.className = "section-title"; crewTitle.textContent = t("ui.crewStatus"); section.append(crewTitle);
  const crew = document.createElement("div"); crew.className = "crew-row"; state.crew.forEach((member) => crew.append(crewCard(member, data.crew))); section.append(crew);
  const world = baseView({ state, data, onExplain: (key, message) => announce(message) }); section.append(world);
  const briefing = getBriefing(state, data); const forecast = document.createElement("div"); forecast.className = "forecast-card"; const forecastTitle = document.createElement("strong"); forecastTitle.textContent = t("ui.forecast"); const forecastHelp = document.createElement("small"); forecastHelp.textContent = t("ui.forecastHelp"); const forecastText = document.createElement("span"); forecastText.textContent = briefing.forecast.length ? briefing.forecast.map((item) => `${item.kind} · ${item.solsUntil}`).join("  ") : t("ui.noForecast"); forecast.append(forecastTitle, forecastHelp, forecastText); section.append(forecast);
  const planTitle = document.createElement("h2"); planTitle.className = "section-title"; planTitle.textContent = t("ui.planTitle"); section.append(planTitle);
  const planHelp = document.createElement("p"); planHelp.className = "plan-help"; planHelp.textContent = t("ui.planHelp"); section.append(planHelp);
  const slots = document.createElement("div"); slots.className = "slots";
  const plan = structuredClone(state.plan);
  let selectedSlot = plan.slots.findIndex((slot) => !slot.job);
  if (selectedSlot < 0) selectedSlot = 0;
  let draggedJobId = null; let focusSlot = 0;
  let updateEstimate = () => {};
  const planError = document.createElement("p"); planError.className = "plan-error"; planError.setAttribute("role", "alert");
  function slotLabel(index) { return t(["ui.slotMorning", "ui.slotMidday", "ui.slotAfternoon"][index] || "ui.emptySlot"); }
  function validatePlan() {
    const missing = plan.slots.map((slot, index) => slot.job ? null : slotLabel(index)).filter(Boolean);
    if (missing.length > 0) {
      planError.textContent = `${t("ui.planIncomplete")} ${missing.map((slot) => t("ui.addActivityForSlot", { slot })).join(" ")}`;
      selectedSlot = plan.slots.findIndex((slot) => !slot.job);
      syncSlots();
      return false;
    }
    const currentAvailability = getJobAvailability({ ...state, plan }, data);
    const blocked = plan.slots.map((slot) => {
      const availability = currentAvailability[slot.job];
      if (availability?.enabled) return null;
      const job = data.jobs.find((item) => item.id === slot.job);
      return t("ui.blockedActivity", { job: t(job?.nameKey ?? slot.job), reason: t(availability?.reasonKey ?? "ui.planInvalid") });
    }).filter(Boolean);
    if (blocked.length > 0) {
      planError.textContent = `${t("ui.planInvalid")} ${blocked.join(" ")}`;
      const blockedIndex = plan.slots.findIndex((slot) => !currentAvailability[slot.job]?.enabled);
      selectedSlot = blockedIndex >= 0 ? blockedIndex : selectedSlot;
      syncSlots();
      return false;
    }
    planError.textContent = t("ui.planReady");
    return true;
  }
  const start = button(t("ui.startSol"), () => { if (validatePlan()) onStart(structuredClone(plan)); });
  start.className = "primary";
  function assignJob(jobId) {
    if (selectedSlot < 0 || selectedSlot >= plan.slots.length) return;
    focusSlot = selectedSlot;
    plan.slots[selectedSlot].job = jobId;
    plan.slots[selectedSlot].crewId = null;
    planError.textContent = "";
    const nextEmpty = plan.slots.findIndex((slot) => !slot.job);
    selectedSlot = nextEmpty >= 0 ? nextEmpty : selectedSlot;
    syncSlots();
  }
  function syncSlots() {
    plan.slots.forEach((slot, index) => {
      const item = slots.children[index];
      const select = item.querySelector(".slot-select");
      const clear = item.querySelector(".slot-clear");
      select.textContent = `${t(["ui.slotMorning", "ui.slotMidday", "ui.slotAfternoon"][index] || "ui.emptySlot")}: ${slot.job ? t(data.jobs.find((job) => job.id === slot.job)?.nameKey ?? slot.job) : t("ui.emptySlot")}`;
      select.classList.toggle("selected", selectedSlot === index);
      clear.disabled = !slot.job;
    });
    start.disabled = false;
    start.setAttribute("aria-describedby", "plan-validation");
    planError.id = "plan-validation";
    if (plan.slots.every((slot) => slot.job)) planError.textContent = t("ui.planReady");
    world.setPlan(plan, focusSlot);
    updateEstimate();
  }
  plan.slots.forEach((slot, index) => {
    const item = document.createElement("div"); item.className = "slot-card"; item.dataset.slotIndex = String(index);
    const select = document.createElement("button"); select.type = "button"; select.className = "slot-select"; select.setAttribute("aria-label", `${t("ui.selectSlot")}: ${t(["ui.slotMorning", "ui.slotMidday", "ui.slotAfternoon"][index] || "ui.emptySlot")}`); select.onclick = () => { selectedSlot = index; focusSlot = index; syncSlots(); };
    const clear = document.createElement("button"); clear.type = "button"; clear.className = "slot-clear"; clear.textContent = t("ui.clearSlotButton"); clear.onclick = () => { plan.slots[index].job = null; plan.slots[index].crewId = null; selectedSlot = index; planError.textContent = ""; syncSlots(); };
    item.ondragover = (event) => { event.preventDefault(); item.classList.add("drop-target"); };
    item.ondragleave = () => item.classList.remove("drop-target");
    item.ondrop = (event) => { event.preventDefault(); item.classList.remove("drop-target"); const jobId = event.dataTransfer?.getData("text/plain") || draggedJobId; if (jobId) { selectedSlot = index; assignJob(jobId); } };
    item.append(select, clear);
    slots.append(item);
  });
  section.append(slots);
  const jobs = document.createElement("div"); jobs.className = "job-tray";
  let refreshJobAvailability = () => {};
  const availability = getJobAvailability({ ...state, plan }, data);
  data.jobs.forEach((job) => {
    const card = document.createElement("button");
    card.className = "job-card";
    card.type = "button";
    card.draggable = true;
    card.dataset.jobId = job.id;
    card.setAttribute("aria-label", t("ui.dragJob", { job: t(job.nameKey) }));
    const icon = document.createElement("span"); icon.className = "job-icon"; icon.textContent = job.icon;
    const name = document.createElement("strong"); name.textContent = t(job.nameKey);
    const desc = document.createElement("small"); desc.textContent = t(job.descKey);
    const tradeoff = document.createElement("em"); tradeoff.textContent = t(job.tradeoffKey);
    card.append(icon, name, desc, tradeoff);
    const disabledReason = document.createElement("small"); disabledReason.className = "job-disabled-reason";
    if (!availability[job.id]?.enabled) {
      disabledReason.textContent = t(availability[job.id].reasonKey);
      card.title = disabledReason.textContent;
      card.append(disabledReason);
    }
    card.disabled = !availability[job.id]?.enabled;
    card.onclick = () => assignJob(job.id);
    card.ondragstart = (event) => { draggedJobId = job.id; event.dataTransfer?.setData("text/plain", job.id); if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy"; card.classList.add("dragging"); };
    card.ondragend = () => { draggedJobId = null; card.classList.remove("dragging"); document.querySelectorAll(".drop-target").forEach((target) => target.classList.remove("drop-target")); };
    jobs.append(card);
  });
  refreshJobAvailability = () => {
    const currentAvailability = getJobAvailability({ ...state, plan }, data);
    jobs.querySelectorAll(".job-card").forEach((card) => {
      const current = currentAvailability[card.dataset.jobId];
      card.disabled = !current?.enabled;
      const reason = card.querySelector(".job-disabled-reason");
      if (reason) reason.textContent = current?.enabled ? "" : t(current.reasonKey);
      card.title = current?.enabled ? "" : t(current.reasonKey);
    });
  };
  section.append(jobs);
  const dragHint = document.createElement("p"); dragHint.className = "drag-hint"; dragHint.textContent = t("ui.dragHint"); section.append(dragHint);
  section.append(button(t("ui.autoPick"), () => {
    const currentAvailability = getJobAvailability({ ...state, plan }, data);
    plan.slots = autoAssign(state, plan.slots.map((slot) => slot.job && currentAvailability[slot.job]?.enabled ? slot.job : "rest"));
    selectedSlot = 0;
    syncSlots();
  }));
  const maker = document.createElement("label"); const makerInput = document.createElement("input"); makerInput.type = "checkbox"; makerInput.checked = plan.airMakerOn; makerInput.onchange = () => { plan.airMakerOn = makerInput.checked; updateEstimate(); }; maker.append(makerInput, document.createTextNode(t("ui.airMaker"))); section.append(maker);
  const shelter = document.createElement("label");
  const shelterInput = document.createElement("input");
  shelterInput.type = "checkbox";
  shelterInput.checked = plan.shelter;
  shelterInput.disabled = !state.world.stormToday;
  shelterInput.onchange = () => { plan.shelter = shelterInput.checked; refreshJobAvailability(); updateEstimate(); };
  shelter.append(shelterInput, document.createTextNode(t("ui.shelter")));
  section.append(shelter);
  section.append(start, planError);
  const estimate = document.createElement("p"); estimate.className = "estimate";
  updateEstimate = () => {
    world.setPlan(plan);
    const preview = previewPlan(state, plan, data);
    const previewLayers = Math.floor(preview.state.resources.shieldBlocks / data.constants.BLOCKS_PER_LAYER.value);
    estimate.textContent = `${t("ui.estimate")}: ${t("ui.power")} ${preview.state.resources.power}, ${t("ui.air")} ${preview.state.resources.air}. ${t("ui.shieldPreview", { layers: previewLayers, blocks: preview.state.resources.shieldBlocks })}`;
  };
  section.append(estimate);
  const log = document.createElement("aside"); log.className = "event-log";
  const logTitle = document.createElement("strong"); logTitle.textContent = t("ui.eventLog");
  const logText = document.createElement("span"); logText.textContent = t("ui.noEvents");
  log.append(logTitle, logText); section.append(log);
  syncSlots();
  return section;
}
