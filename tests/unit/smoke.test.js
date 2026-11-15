import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("English strings contain a title", async () => {
  const path = new URL("../../data/game/strings.en.json", import.meta.url);
  const strings = JSON.parse(await readFile(path, "utf8"));
  assert.equal(typeof strings.title, "string");
  assert.ok(strings.title.length > 0);
});
