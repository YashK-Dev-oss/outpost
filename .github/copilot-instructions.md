# Copilot Instructions: OUTPOST (Team HORIZON)

You are the sole developer of OUTPOST, a browser game for the NASA Space Apps Challenge "Build a Junior Astronaut Mission Trainer". Children aged 7-12 manage a Mars outpost for 30 sols. The complete, frozen design is in `docs/SPEC.md`.

## Prime directives

1. **`docs/SPEC.md` is the source of truth.** Read the sections relevant to your task before writing code. Do not redesign, rename, or add features. If the spec is silent, choose the simplest option and write it in `docs/DECISIONS.md`. If the spec contradicts itself, follow the more specific section and log it.
2. **Work only on the phase the user names.** Do not start later phases. Do not refactor unrelated code.
3. **Never invent science.** Do not write factual claims about NASA, Mars or space weather that are not in the spec or in a data file with a source. Mark unknowns `[VERIFY]` in `docs/DECISIONS.md` and leave the claim out of the UI.
4. **Never fabricate NASA data.** Files in `data/real/` are produced only by `tools/` scripts from live NASA responses. If a fetch fails, stop and tell the user what command to re-run.

## Hard constraints

- Languages: HTML, CSS, vanilla JavaScript (ES2022 modules). No frameworks, no bundlers, no TypeScript, no CDN links, no web fonts, no analytics, no cookies, no runtime network requests to other origins. Zero npm dependencies (Node built-ins only for tools and tests).
- Must run on GitHub Pages as static files. All paths relative. Data loaded with `fetch` from `data/`.
- Must work on mobile (360 px wide) and desktop. Touch targets >= 48 px.
- Do not use the NASA logo or insignia. Keep the disclaimer "not an official NASA product" visible on Title and Credits.

## Architecture rules

- `js/engine/` is **pure**: no DOM, no `fetch`, no `Date`, no `Math.random`, no `localStorage`. Functions take `(state, input, data)` and return new state plus events. Clone, then mutate the clone. Randomness only via `rng.js` using `state.rngState`.
- All tunable numbers live in `data/game/*.json` with a `provenance` field of `real`, `scaled` or `game`. No magic numbers in engine code.
- `js/ui/` renders from state and calls engine functions. UI never contains game rules.
- All user-visible text lives in `data/game/strings.en.json` and is read via `t(key, params)`. No hard-coded sentences in JS or HTML (labels like aria-hidden icons excepted).
- Real data and game data are separated: `data/real/` vs `data/game/`. Anything shown from real data carries the NASA DATA badge; scaled values the SIMPLIFIED badge; invented values the GAME badge.

## Code style

- Small modules, one responsibility each, named exports, JSDoc types on public functions, no classes unless clearly useful, no global variables.
- Descriptive names, early returns, no clever one-liners. Comments explain why, not what.
- Handle errors: never crash the game. Show a friendly message and offer a safe action.
- Escape or avoid `innerHTML` with dynamic text; prefer `textContent` and DOM creation helpers.

## Kid-friendly content rules

- Reading level grade 5 or lower, sentences <= 15 words, bubbles <= 20 words.
- Positive, encouraging tone. No death or violence language. Failure is "Mission Paused".
- Every decision shows its trade-off in one short sentence.

## Accessibility rules

- Keyboard operable, visible focus, logical headings, ARIA labels on icon buttons and meters, polite live region for changes.
- WCAG AA contrast, never color alone, respect `prefers-reduced-motion`, text size setting.

## Testing rules

- Use `node:test` and `node:assert/strict`. Every engine function gets unit tests. Tests must be deterministic (seeded).
- Before finishing any task run `npm test` and `npm run validate`. Fix failures. Do not weaken or delete tests to make them pass.
- Never claim something works without running it. Report the exact commands you ran and their results.

## Workflow for every task

1. Read `docs/SPEC.md` (relevant sections), `docs/PROGRESS.md`, `docs/DECISIONS.md`.
2. State your plan briefly, then implement.
3. Run tests and validators.
4. Update `docs/PROGRESS.md` (what is done, what is next, known issues) and `CHANGELOG.md`.
5. Finish with a summary: files created or changed, commands run, results, open `[VERIFY]` items, and a suggested commit message.

## Do not

- Add dependencies, build steps, or services. Add features not in the spec. Change numbers in the spec without logging it in DECISIONS.md. Rewrite working modules without being asked. Commit secrets (never put API keys in files; read `NASA_API_KEY` from the environment).
