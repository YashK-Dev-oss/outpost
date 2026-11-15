import { t } from "../app/i18n.js";
import { autoAssign } from "../engine/index.js";
import { prefersReducedMotion } from "../app/motion.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SLOT_KEYS = ["ui.slotMorning", "ui.slotMidday", "ui.slotAfternoon"];
const SUN_SPOTS = [[140, 125], [400, 70], [660, 125]];
// Where each job happens in the scene. Feet positions in SVG units.
const STATIONS = {
  clean: [120, 388], build: [330, 392], maintain: [600, 388],
  science: [720, 392], talk: [500, 392], rest: [395, 392], idle: [395, 392]
};
const CREW_COLORS = { amara: "#E8743B", kenji: "#5BB8FF", luz: "#4ADE80" };

function node(name, attributes = {}, parent) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  parent?.append(element);
  return element;
}

function text(content, x, y, className) {
  const element = node("text", { x, y, class: className });
  element.textContent = content;
  return element;
}

function hotspot(parent, key, labelText, onExplain) {
  const group = node("g", { class: "ow-hotspot", tabindex: "0", role: "button", "aria-label": labelText }, parent);
  const fire = () => onExplain?.(key);
  group.addEventListener("click", fire);
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fire(); }
  });
  return group;
}

function buildAstronaut(id) {
  const group = node("g", { class: "ow-crew", "data-crew": id });
  const body = node("g", { class: "ow-crew-body" }, group);
  node("ellipse", { cx: 0, cy: 2, rx: 17, ry: 4, class: "ow-shadow" }, group);
  node("rect", { x: -14, y: -36, width: 10, height: 26, rx: 5, class: "ow-pack" }, body);
  node("rect", { x: -9, y: -12, width: 7, height: 12, rx: 3, class: "ow-suit-dark" }, body);
  node("rect", { x: 2, y: -12, width: 7, height: 12, rx: 3, class: "ow-suit-dark" }, body);
  const torso = node("rect", { x: -10, y: -34, width: 20, height: 26, rx: 8 }, body);
  torso.style.fill = CREW_COLORS[id] ?? "#FFFFFF";
  node("circle", { cx: 0, cy: -44, r: 11, class: "ow-helmet" }, body);
  node("ellipse", { cx: 3, cy: -44, rx: 7, ry: 5.5, class: "ow-visor" }, body);
  const bubble = node("g", { class: "ow-bubble" }, group);
  node("circle", { cx: 0, cy: -78, r: 14, class: "ow-bubble-bg" }, bubble);
  bubble.append(text("", 0, -72, "ow-bubble-icon"));
  const mood = node("circle", { cx: 16, cy: -56, r: 5, class: "ow-mood" }, group);
  mood.setAttribute("data-mood", "good");
  group.append(text("", 0, 18, "ow-name"));
  return group;
}

/**
 * Render the living outpost scene. Scene art uses inline SVG and CSS only.
 * Returns a wrapper element with `setPlan(plan, slotIndex)` for live previews.
 */
export function baseView({ state, data, onExplain: externalExplain, playback = false } = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "outpost-world";
  const onExplain = (key) => wrapper.explainPart(key);
  const res = state?.resources ?? { dust: 0, power: 0, shieldBlocks: 0, airMaker: { on: true, health: 100 } };
  // `view` is the scene's current look. Segment 2 playback updates it step by step.
  const view = { dust: res.dust, power: res.power, shieldBlocks: res.shieldBlocks, makerOn: res.airMaker.on !== false, makerHealth: res.airMaker.health };
  const blocksPerLayer = data?.constants?.BLOCKS_PER_LAYER?.value ?? 6;
  const dustStorm = Boolean(state?.world?.dustStormActive);
  const solarStorm = Boolean(state?.world?.stormToday);

  const svg = node("svg", { viewBox: "0 0 800 450", role: "img", "aria-label": t("ui.baseView"), class: "base-art ow-svg" });
  svg.dataset.weather = solarStorm ? "solar" : dustStorm ? "dust" : "clear";
  const defs = node("defs", {}, svg);
  [["ow-sky0", "#f2b27a", "#c9693a"], ["ow-sky1", "#f0c58f", "#d98253"], ["ow-sky2", "#b8593a", "#5a2f4a"], ["ow-sky3", "#0b1020", "#3a2040"]].forEach(([id, top, bottom]) => {
    const gradient = node("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    node("stop", { offset: "0", "stop-color": top }, gradient);
    node("stop", { offset: "1", "stop-color": bottom }, gradient);
  });

  [0, 1, 2, 3].forEach((index) => node("rect", { width: 800, height: 450, rx: 24, fill: `url(#ow-sky${index})`, class: "ow-sky", "data-time": index }, svg));
  const stars = node("g", { class: "ow-stars" }, svg);
  for (let index = 0; index < 28; index += 1) {
    node("circle", { cx: (index * 97) % 800, cy: 12 + ((index * 53) % 190), r: index % 4 === 0 ? 2 : 1.2, class: "ow-star", style: `animation-delay:${(index % 7) * 0.4}s` }, stars);
  }

  const sun = node("g", { class: "ow-sun" }, svg);
  const rays = node("g", { class: "ow-flare-rays" }, sun);
  for (let index = 0; index < 12; index += 1) {
    node("line", { x1: 0, y1: -42, x2: 0, y2: -66 - (index % 2) * 14, transform: `rotate(${index * 30})`, class: "ow-ray" }, rays);
  }
  node("circle", { r: 34, class: "ow-sun-disc" }, sun);

  node("path", { d: "M0 300 L90 250 L190 295 L300 235 L420 300 L540 245 L660 292 L800 240 V330 H0Z", class: "ow-far" }, svg);
  node("path", { d: "M0 318 Q160 282 320 318 T640 308 T800 318 V450 H0Z", class: "ow-ground" }, svg);
  [[60, 420, 18], [210, 435, 12], [760, 425, 20], [530, 440, 10], [670, 330, 8]].forEach(([x, y, r]) => node("ellipse", { cx: x, cy: y, rx: r, ry: r * 0.6, class: "ow-rock" }, svg));

  // Solar panels
  const dustCoats = [];
  const panels = hotspot(svg, "power", t("ui.solarPanels"), onExplain);
  [0, 1, 2].forEach((index) => {
    const x = 36 + index * 78;
    node("rect", { x: x + 33, y: 238, width: 6, height: 92, class: "ow-pole" }, panels);
    const points = `${x},${196 - index * 4} ${x + 72},${180 - index * 4} ${x + 78},${240 - index * 4} ${x + 6},${258 - index * 4}`;
    node("polygon", { points, class: "ow-panel" }, panels);
    dustCoats.push(node("polygon", { points, class: "ow-dust-coat", opacity: Math.min(0.85, (view.dust / 100) * 1.3) }, panels));
    node("path", { d: `M${x + 24},${192 - index * 4} L${x + 30},${252 - index * 4} M${x + 48},${186 - index * 4} L${x + 54},${246 - index * 4}`, class: "ow-panel-lines" }, panels);
    if (res.dust < 20 && !dustStorm) node("circle", { cx: x + 22, cy: 205 - index * 4, r: 3, class: "ow-glint", style: `animation-delay:${index * 0.6}s` }, panels);
  });
  panels.append(text(t("ui.solarPanels"), 40, 292, "ow-label"));

  // Battery
  const battery = hotspot(svg, "battery", t("ui.world.battery"), onExplain);
  node("rect", { x: 262, y: 262, width: 40, height: 68, rx: 7, class: "ow-battery" }, battery);
  const cells = [];
  for (let index = 0; index < 5; index += 1) {
    cells.push(node("rect", { x: 268, y: 270 + (4 - index) * 11, width: 28, height: 8, rx: 2, class: "ow-cell" }, battery));
  }

  // Shield berm
  const berm = hotspot(svg, "shield", t("ui.shield"), onExplain);
  berm.classList.add("ow-berm");
  const bermShapes = node("g", { class: "ow-berm-shapes" }, berm);
  let drawnBlocks = null;
  function drawBerm() {
    const layers = Math.min(3, Math.floor(view.shieldBlocks / blocksPerLayer));
    const partial = view.shieldBlocks % blocksPerLayer;
    const grew = drawnBlocks !== null && view.shieldBlocks > drawnBlocks;
    bermShapes.replaceChildren();
    [345, 515].forEach((cx) => {
      for (let layer = 0; layer < layers; layer += 1) {
        const fresh = grew && layer === layers - 1 && Math.floor(drawnBlocks / blocksPerLayer) < layers;
        node("ellipse", { cx, cy: 334 - layer * 10, rx: 58 - layer * 8, ry: 18, class: `ow-berm-layer ow-berm-${layer}${fresh ? " ow-berm-new" : ""}` }, bermShapes);
      }
      node("ellipse", { cx, cy: 336, rx: 60, ry: 8, class: "ow-berm-base" }, bermShapes);
    });
    for (let index = 0; index < partial; index += 1) {
      node("rect", { x: 306 + index * 12, y: 318 - layers * 10, width: 10, height: 8, rx: 2, class: grew && index >= partial - (view.shieldBlocks - drawnBlocks) ? "ow-block ow-block-new" : "ow-block" }, bermShapes);
    }
    drawnBlocks = view.shieldBlocks;
  }
  drawBerm();

  // Habitat
  const hab = hotspot(svg, "base", t("ui.outpostBase"), onExplain);
  node("path", { d: "M300 336 Q300 200 430 200 Q560 200 560 336Z", class: "ow-dome" }, hab);
  node("rect", { x: 404, y: 272, width: 52, height: 64, rx: 10, class: "ow-door" }, hab);
  [335, 380, 480, 525].forEach((cx, index) => {
    if (index === 1 || index === 2) node("circle", { cx, cy: 262, r: 9, class: "ow-window", "data-window": index }, hab);
  });
  const dish = hotspot(svg, "dish", t("ui.world.dish"), onExplain);
  node("path", { d: "M520 210 L520 178", class: "ow-pole" }, dish);
  const dishHead = node("g", { class: "ow-dish" }, dish);
  node("path", { d: "M502 170 Q520 190 538 170 Z", class: "ow-dish-bowl" }, dishHead);
  node("path", { d: "M520 178 L520 156 M514 156 H526", class: "ow-dish-arm" }, dishHead);
  node("circle", { cx: 430, cy: 232, r: 6, class: "ow-lamp ow-lamp-on" }, hab);

  svg.append(berm); // piled against the habitat wall, in front of the dome

  // Air Maker
  const maker = hotspot(svg, "air", t("ui.airMaker"), onExplain);
  node("rect", { x: 598, y: 248, width: 44, height: 84, rx: 9, class: "ow-tank" }, maker);
  node("path", { d: "M620 248 V224 M608 224 H632", class: "ow-pipe" }, maker);
  const lamp = node("circle", { cx: 620, cy: 268, r: 6, class: "ow-lamp" }, maker);
  const steam = node("g", { class: "ow-steam" }, maker);
  [0, 1, 2].forEach((index) => node("circle", { cx: 620 + (index - 1) * 8, cy: 220, r: 6, class: "ow-puff", style: `animation-delay:${index * 0.7}s` }, steam));
  const sparks = node("g", { class: "ow-sparks" }, maker);
  [[606, 300], [632, 290], [620, 312]].forEach(([x, y], index) => node("path", { d: `M${x} ${y} l4 -6 l-3 0 l4 -6`, class: "ow-spark", style: `animation-delay:${index * 0.25}s` }, sparks));
  maker.append(text(t("ui.airMaker"), 586, 352, "ow-label"));

  // Science site
  const site = hotspot(svg, "science", t("job.science.name"), onExplain);
  [[690, 340, 22], [748, 346, 16]].forEach(([cx, cy, rx]) => node("ellipse", { cx, cy, rx, ry: rx * 0.55, class: "ow-rock ow-rock-big" }, site));
  node("path", { d: "M766 340 V296 M766 296 L786 304 L766 312", class: "ow-flag" }, site);

  // Weather overlays
  const haze = node("rect", { width: 800, height: 450, rx: 24, class: "ow-dust-haze" }, svg);
  const hazeLevel = () => (dustStorm ? 0.5 : Math.min(0.3, view.dust / 150));
  node("rect", { width: 800, height: 450, rx: 24, class: "ow-alarm" }, svg);
  if (dustStorm) {
    const drift = node("g", { class: "ow-drift" }, svg);
    for (let index = 0; index < 16; index += 1) {
      node("ellipse", { cx: (index * 61) % 800, cy: 120 + ((index * 47) % 260), rx: 14, ry: 3, class: "ow-grain", style: `animation-delay:${(index % 8) * -0.7}s` }, drift);
    }
  }
  if (solarStorm) {
    node("rect", { width: 800, height: 450, rx: 24, class: "ow-flash" }, svg);
    const rain = node("g", { class: "ow-rad" }, svg);
    for (let index = 0; index < 18; index += 1) {
      node("line", { x1: 30 + index * 42, y1: 0, x2: 14 + index * 42, y2: 26, class: "ow-rad-line", style: `animation-delay:${(index % 6) * -0.4}s` }, rain);
    }
  }

  // Crew
  const crewLayer = node("g", { class: "ow-crew-layer" }, svg);
  const walkers = new Map();
  const crewPos = new Map();
  const floatLayer = node("g", { class: "ow-floats", "aria-hidden": "true" }, svg);
  (state?.crew ?? []).forEach((member) => {
    const walker = buildAstronaut(member.id);
    const info = data?.crew?.find((item) => item.id === member.id);
    walker.querySelector(".ow-name").textContent = t(info?.nameKey ?? `crew.${member.id}.name`);
    walker.querySelector(".ow-mood").setAttribute("data-mood", member.wellbeing >= 60 ? "good" : member.wellbeing >= 30 ? "warn" : "bad");
    crewLayer.append(walker);
    walkers.set(member.id, walker);
  });

  // Weather banner
  const bannerKey = solarStorm ? "ui.world.solarStorm" : dustStorm ? "ui.world.dustStorm" : "ui.world.clearSky";
  const banner = node("g", { class: "ow-banner", "data-weather": svg.dataset.weather }, svg);
  node("rect", { x: 16, y: 16, width: 250, height: 34, rx: 17, class: "ow-banner-bg" }, banner);
  banner.append(text(t(bannerKey), 34, 39, "ow-banner-text"));

  // Controls and caption
  const controls = document.createElement("div"); controls.className = "ow-controls";
  const caption = document.createElement("p"); caption.className = "ow-caption"; caption.setAttribute("aria-live", "polite");
  const explain = document.createElement("p"); explain.className = "ow-explain"; explain.textContent = t("ui.baseHelp");
  const slotButtons = SLOT_KEYS.map((key, index) => {
    const button = document.createElement("button"); button.type = "button"; button.className = "ow-slot-btn"; button.textContent = t(key);
    button.onclick = () => { stopPlay(); setSlot(index); };
    controls.append(button);
    return button;
  });
  const playButton = document.createElement("button"); playButton.type = "button"; playButton.className = "ow-play"; playButton.textContent = t("ui.world.play");
  controls.append(playButton);

  let currentPlan = state?.plan ?? { slots: [] };
  let currentSlot = 0;
  let timer = null;
  let nightMode = false;
  const moods = new Map((state?.crew ?? []).map((member) => [member.id, member.wellbeing]));

  function jobName(jobId) {
    const job = data?.jobs?.find((item) => item.id === jobId);
    return job ? t(job.nameKey) : jobId;
  }

  function render() {
    const slots = currentPlan.slots ?? [];
    const sol = state?.sol ?? 1;
    const filled = slots.map((slot) => slot.job || "rest");
    // Playback plans already carry the real crew choices. Planning previews use the same autoAssign as Start Sol.
    const submitted = slots.some((item) => item.crewId);
    const assigned = submitted ? slots : (state ? autoAssign(state, filled) : []);
    const slot = slots[currentSlot];
    const job = slot?.job ?? null;
    const sheltered = Boolean(currentPlan.shelter) && solarStorm;
    const skyIndex = nightMode ? 3 : currentSlot;

    svg.querySelectorAll(".ow-sky").forEach((sky) => sky.classList.toggle("ow-sky-on", Number(sky.dataset.time) === skyIndex));
    svg.classList.toggle("ow-night", nightMode);
    const [sx, sy] = nightMode ? [720, 420] : (SUN_SPOTS[currentSlot] ?? SUN_SPOTS[0]);
    sun.style.transform = `translate(${sx}px, ${sy}px)`;
    slotButtons.forEach((button, index) => { button.classList.toggle("active", index === currentSlot); button.setAttribute("aria-pressed", String(index === currentSlot)); });

    const makerWorks = view.makerOn && (playback || currentPlan.airMakerOn !== false);
    lamp.setAttribute("class", `ow-lamp ${makerWorks ? "ow-lamp-on" : "ow-lamp-off"}`);
    steam.classList.toggle("ow-on", makerWorks);
    sparks.classList.toggle("ow-on", makerWorks && view.makerHealth < 50);
    svg.querySelectorAll(".ow-window").forEach((win) => win.classList.toggle("ow-window-lit", sheltered || nightMode));
    const litCells = Math.ceil(Math.max(0, Math.min(100, view.power)) / 20);
    cells.forEach((cell, index) => cell.setAttribute("class", index < litCells ? "ow-cell ow-cell-on" : "ow-cell"));
    dustCoats.forEach((coat) => coat.setAttribute("opacity", Math.min(0.85, (view.dust / 100) * 1.3)));
    haze.setAttribute("opacity", hazeLevel());
    drawBerm();

    const lines = [];
    let seat = 0;
    (state?.crew ?? []).forEach((member) => {
      const walker = walkers.get(member.id);
      const resting = member.restingUntilSol && member.restingUntilSol > sol;
      let station = "idle";
      let activity = null;
      if (nightMode) {
        station = "idle";
      } else if (sheltered || resting) {
        station = "rest";
      } else if (job === "rest" || job === "talk") {
        station = job; activity = job;
      } else if (job && assigned[currentSlot]?.crewId === member.id) {
        station = job; activity = job;
      }
      const [x0, y0] = STATIONS[station] ?? STATIONS.idle;
      const x = x0 + (seat % 3) * 46 - 46;
      seat += 1;
      const y = y0 + (seat % 2) * 6;
      crewPos.set(member.id, [x, y]);
      walker.style.transform = `translate(${x}px, ${y}px)`;
      walker.querySelector(".ow-mood").setAttribute("data-mood", moods.get(member.id) >= 60 ? "good" : moods.get(member.id) >= 30 ? "warn" : "bad");
      walker.classList.toggle("ow-working", Boolean(activity) && !sheltered);
      walker.classList.toggle("ow-sheltered", sheltered);
      walker.classList.toggle("ow-asleep", !nightMode && (job === "rest" || resting));
      const icon = data?.jobs?.find((item) => item.id === activity)?.icon ?? (resting ? "😴" : "");
      walker.querySelector(".ow-bubble-icon").textContent = icon;
      walker.querySelector(".ow-bubble").classList.toggle("ow-bubble-on", Boolean(icon) && !sheltered && !nightMode);
      if (activity && job !== "rest" && job !== "talk") {
        const info = data?.crew?.find((item) => item.id === member.id);
        lines.push(t("ui.world.crewJob", { name: t(info?.nameKey ?? `crew.${member.id}.name`), job: jobName(activity) }));
      }
    });
    const slotName = t(SLOT_KEYS[currentSlot] ?? SLOT_KEYS[0]);
    let body;
    if (sheltered) body = t("ui.world.sheltered");
    else if (!job) body = t("ui.world.idle");
    else if (job === "rest" || job === "talk") body = t("ui.world.everyone", { job: jobName(job) });
    else body = lines.join(" ");
    caption.textContent = `${slotName}: ${body}`;
  }

  function setSlot(index) { currentSlot = Math.max(0, Math.min(SLOT_KEYS.length - 1, index)); render(); }
  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playButton.textContent = t("ui.world.play");
  }
  playButton.onclick = () => {
    if (timer) { stopPlay(); return; }
    playButton.textContent = t("ui.world.stop");
    setSlot(0);
    timer = setInterval(() => {
      if (!wrapper.isConnected || currentSlot >= SLOT_KEYS.length - 1) { stopPlay(); return; }
      setSlot(currentSlot + 1);
    }, 2600);
  };

  wrapper.setPlan = (plan, slotIndex) => {
    currentPlan = plan;
    if (Number.isInteger(slotIndex)) currentSlot = Math.max(0, Math.min(SLOT_KEYS.length - 1, slotIndex));
    render();
  };
  wrapper.explainPart = (key) => {
    const params = key === "dish" ? { minutes: Math.round(state?.world?.oneWayDelayMin ?? 0) } : {};
    explain.textContent = t(`ui.world.explain.${key}`, params);
    externalExplain?.(key, explain.textContent);
  };

  // ---- Segment 2 playback API (used by the Sol sequence) ----
  const ANCHORS = { panels: [120, 225], battery: [282, 250], hab: [430, 190], maker: [620, 212], site: [740, 290], dish: [520, 140] };
  wrapper.applyState = (patch = {}) => {
    ["dust", "power", "shieldBlocks", "makerOn", "makerHealth"].forEach((key) => { if (patch[key] !== undefined) view[key] = patch[key]; });
    (patch.crew ?? []).forEach((item) => moods.set(item.id, item.wellbeing));
    render();
  };
  wrapper.setNight = (on) => { nightMode = Boolean(on); render(); };
  wrapper.setAlarm = (on) => svg.classList.toggle("ow-alarm-on", Boolean(on));
  wrapper.float = (message, where, tone = "info") => {
    const spot = typeof where === "string"
      ? (where.startsWith("crew:") ? (crewPos.get(where.slice(5)) ?? ANCHORS.hab).map((value, index) => (index === 1 ? value - 92 : value)) : (ANCHORS[where] ?? ANCHORS.hab))
      : where;
    const group = node("g", { transform: `translate(${spot[0]} ${spot[1]})`, class: "ow-float-wrap" }, floatLayer);
    const label = text(message, 0, 0, `ow-float ow-float-${tone}${prefersReducedMotion() ? " ow-float-static" : ""}`);
    group.append(label);
    if (!prefersReducedMotion()) setTimeout(() => group.remove(), 2600);
  };
  wrapper.clearFloats = () => floatLayer.replaceChildren();
  wrapper.pulse = (key) => {
    const target = svg.querySelector(`[aria-label="${key}"]`);
    if (!target || prefersReducedMotion()) return;
    target.classList.remove("ow-pulse"); void target.getBoundingClientRect(); target.classList.add("ow-pulse");
  };
  if (playback) wrapper.append(svg); else wrapper.append(svg, controls, caption, explain);
  render();
  return wrapper;
}
