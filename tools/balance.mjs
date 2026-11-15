import { readFile } from "node:fs/promises";
import { createMission, submitPlan, advanceSol, computeScore } from "../js/engine/index.js";
import { choosePlan, resolveBotEmergency } from "./bots.mjs";

async function loadData() {
  const names = ["constants", "difficulty", "jobs", "emergencies", "crew", "windows", "classroom", "training", "codex", "strings.en"];
  const data = {};
  for (const name of names) {
    const key = name === "strings.en" ? "strings" : name;
    data[key] = JSON.parse(await readFile(new URL(`../data/game/${name}.json`, import.meta.url), "utf8"));
  }
  data.real = {};
  return data;
}

const data = await loadData();
const bots = ["Balanced", "GreedyScience", "Lazy", "Random"];
for (const difficulty of ["cadet", "astronaut", "commander"]) {
  for (const bot of bots) {
    let completed = 0;
    let stars = 0;
    let wellbeing = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      let state = createMission({ seed, difficulty }, data);
      while (state.phase !== "complete" && state.phase !== "paused") {
        const result = submitPlan(state, {
          slotCount: state.plan.slotCount,
          slots: choosePlan(state, data, bot),
          airMakerOn: true,
          shelter: false
        }, data);
        state = result.state;
        if (state.phase === "emergency") state = resolveBotEmergency(state, data).state;
        if (state.phase === "evening") state = advanceSol(state);
      }
      if (state.phase === "complete") completed += 1;
      const finalWellbeing = state.crew.reduce((sum, member) => sum + member.wellbeing, 0) / state.crew.length;
      wellbeing += finalWellbeing;
      stars += computeScore(state).stars;
    }
    console.log(JSON.stringify({
      difficulty,
      bot,
      completionRate: completed / 200,
      averageStars: stars / 200,
      averageFinalWellbeing: wellbeing / 200
    }));
  }
}
