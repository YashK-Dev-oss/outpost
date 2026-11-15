import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const strings = JSON.parse(await readFile(join(root, "data/game/strings.en.json"), "utf8"));
let longest = 0;
let totalWords = 0;
let sentenceCount = 0;
for (const [key, text] of Object.entries(strings)) {
  const sentences = text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    longest = Math.max(longest, words);
    totalWords += words;
    sentenceCount += 1;
    if (words > 20) throw new Error(`${key} has ${words} words in one sentence`);
  }
}
const average = sentenceCount ? totalWords / sentenceCount : 0;
console.log(`Readability check: ${sentenceCount} sentences, longest ${longest} words, average ${average.toFixed(1)} words.`);
if (average > 20) process.exitCode = 1;
