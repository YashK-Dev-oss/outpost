import { spawn } from "node:child_process";

function run(script, windowId) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, windowId], { stdio: "inherit" });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} ${windowId} exited with ${code}`)));
  });
}

for (const windowId of ["A", "B", "C"]) {
  await run("tools/fetch-donki.mjs", windowId);
  await run("tools/fetch-horizons.mjs", windowId);
}
