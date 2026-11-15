import { loadData, engineData } from "./app/dataLoader.js";
import { loadStrings, setStrings, t } from "./app/i18n.js";
import { show } from "./app/router.js";
import { createMission, submitPlan, advanceSol, emergencyAct, autoAssign, buildSolReplay, buildSolSummary } from "./engine/index.js";
import { titleScreen } from "./ui/screens/title.js";
import { selectScreen } from "./ui/screens/select.js";
import { commandScreen } from "./ui/screens/command.js";
import { eveningScreen } from "./ui/screens/evening.js";
import { solScreen } from "./ui/screens/sol.js";
import { emergencyScreen } from "./ui/screens/emergency.js";
import { codexScreen } from "./ui/screens/codex.js";
import { dataLabScreen } from "./ui/screens/datalab.js";
import { reportScreen } from "./ui/screens/report.js";
import { pausedScreen } from "./ui/screens/paused.js";
import { playbackScreen } from "./ui/screens/playback.js";
import { creditsScreen } from "./ui/screens/credits.js";
import { settingsScreen } from "./ui/screens/settings.js";
import { applySettings, loadSettings } from "./app/settings.js";
import { tone, startMusic } from "./app/audio.js";
import { loadSave, saveMission, checkpoint } from "./app/save.js";
import { announce } from "./app/a11y.js";

const app = document.querySelector("#app");
let data;
let state;
let save = loadSave();
let checkpoints = save?.checkpoints || [];
let solRecord = null;

function render(screen) { app.replaceChildren(screen); }
document.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("button")) {
    tone("tap", loadSettings().sound);
  }
}, { capture: true });

function beginAudio() {
  const settings = loadSettings();
  startMusic(settings.music);
}
function goTitle() {
  show("title");
  render(titleScreen({ hasSave: Boolean(save), onPlay: () => { beginAudio(); showSelect(); }, onContinue: () => { beginAudio(); state = save.state; showCommand(); }, onCodex: showCodex, onDataLab: () => showDataLab(), onReport: () => state && showReport(), onCredits: showCredits, onTraining: () => { beginAudio(); showSelect("training"); }, onSettings: showSettings }));
}
function showSelect(mode = "full") { show("select"); render(selectScreen({ initialMode: mode, onStart: (options) => { state = createMission({ ...options, seed: Date.now() % 2147483647 }, data); save = checkpoint(state, []); checkpoints = save.checkpoints; showCommand(); } })); }
function showCommand() { show("command"); render(commandScreen({ state, data, onStart: startSol })); }
function startSol(plan) {
  plan.slots = autoAssign(state, plan.slots.map((slot) => slot.job || "rest"));
  const before = state;
  const result = submitPlan(state, plan, data);
  if (result.errorKeys?.length) { announce(t("ui.saveError")); return; }
  state = result.state; save = saveMission(state, checkpoints);
  solRecord = { before, plan: structuredClone(plan), events: [...(result.events || [])] };
  const goNext = () => { if (state.phase === "emergency") showEmergency(); else if (state.phase === "paused") showPaused(); else showEvening(result.report, solRecord.events); };
  try {
    const replay = buildSolReplay(before, plan, state, data);
    show("sol");
    render(solScreen({ before, plan, replay, data, finalState: state, onDone: goNext }));
  } catch (error) {
    // The sequence is a bonus view. Never block the sol if it cannot play.
    console.error(error);
    goNext();
  }
}
function showEmergency() { tone("alert", loadSettings().sound); show("emergency"); render(emergencyScreen({ state, data, onChallenge: () => { const result = takeEmergency(state, "challenge"); state = result.state; save = saveMission(state, checkpoints); showEmergency(); }, onAction: (action) => { const result = action === "askEarth" ? takeEmergency(state, action) : takeEmergency(state, action); state = result.state; save = saveMission(state, checkpoints); if (state.phase === "emergency") showEmergency(); else if (state.phase === "paused") showPaused(); else { solRecord?.events.push(...(result.events || [])); showEvening(result.report, solRecord?.events || []); } } })); }
function takeEmergency(current, action) { return emergencyAct(current, action, data); }
function showEvening(report, events = []) { tone("success", loadSettings().sound); show("evening"); let summary = null; try { if (solRecord && solRecord.before.sol === state.sol) summary = buildSolSummary(solRecord.before, solRecord.plan, state, data); } catch (error) { console.error(error); } render(eveningScreen({ state, data, report, events, summary, onNext: () => { state = advanceSol(state); if (state.phase === "complete") showReport(); else { save = checkpoint(state, checkpoints); checkpoints = save.checkpoints; showCommand(); } } })); }
function showPaused() { show("paused"); render(pausedScreen({ onRewind: (amount) => { const restored = checkpoints[Math.max(0, checkpoints.length - amount - 1)]; if (restored) { state = structuredClone(restored); save = saveMission(state, checkpoints); showCommand(); } }, onReport: showReport })); }
function showReport() { show("report"); render(reportScreen({ state, data, onBack: goTitle })); }
function showCodex() { show("codex"); render(codexScreen({ data, onBack: goTitle })); }
function showDataLab() { show("datalab"); render(dataLabScreen({ data, windowId: state?.meta.windowId || "A", onBack: goTitle })); }
function showCredits() { show("credits"); render(creditsScreen({ onBack: goTitle })); }
function showSettings() { show("settings"); render(settingsScreen({ onBack: goTitle })); }

try {
  applySettings(loadSettings());
  data = engineData(await loadData());
  setStrings(data.strings);
  await loadStrings();
  goTitle();
} catch (error) {
  console.error(error);
  app.replaceChildren(Object.assign(document.createElement("p"), { className: "load-error", textContent: t("loadError") }));
}
