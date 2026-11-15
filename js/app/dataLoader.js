const gameFiles = ["constants", "difficulty", "jobs", "emergencies", "crew", "windows", "training", "classroom", "codex"];
const realFiles = ["donki-A", "donki-B", "donki-C", "delay-A", "delay-B", "delay-C"];

/** Load the local game and NASA data files. */
export async function loadData() {
  const files = [...gameFiles.map((name) => ["game", name]), ...realFiles.map((name) => ["real", name])];
  const entries = await Promise.all(files.map(async ([group, name]) => {
    const response = await fetch(`data/${group}/${name}.json`);
    if (!response.ok) throw new Error(`Could not load ${name}`);
    return [name, await response.json()];
  }));
  const data = Object.fromEntries(entries);
  const stringsResponse = await fetch("data/game/strings.en.json");
  if (!stringsResponse.ok) throw new Error("Could not load text");
  data.strings = await stringsResponse.json();
  return data;
}

export function engineData(data) {
  return {
    ...data,
    real: {
      "donki-A": data["donki-A"], "donki-B": data["donki-B"], "donki-C": data["donki-C"],
      "delay-A": data["delay-A"], "delay-B": data["delay-B"], "delay-C": data["delay-C"]
    }
  };
}
