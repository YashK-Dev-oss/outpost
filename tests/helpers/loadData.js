import { readFile } from "node:fs/promises";

const gameFiles = [
  "constants", "difficulty", "jobs", "emergencies", "crew",
  "windows", "classroom", "training", "codex", "strings.en"
];

export async function loadGameData() {
  const data = {};
  for (const name of gameFiles) {
    const path = new URL(`../../data/game/${name}.json`, import.meta.url);
    const key = name === "strings.en" ? "strings" : name;
    data[key] = JSON.parse(await readFile(path, "utf8"));
  }
  return data;
}
