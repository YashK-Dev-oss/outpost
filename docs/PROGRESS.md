# Progress

## Phase 0

Complete: repository scaffold, static title screen, CSS tokens, local server,
smoke test, data validation command, and CI workflow.

## Phase 1

Complete: game data schemas, provenance metadata, deterministic RNG, schema
validation, trade-off checks, string reference checks, and provenance reports.

Next: Phase 2 engine core.

Known issues: NASA real-data files remain empty until the live fetch tools run.
Scientific claims in Codex entries remain `[VERIFY]` pending human review.

## Phase 2

Complete: pure mission state creation, job assignment and effects, resource
resolution, crew dose and wellbeing, sol progression, projections, scoring,
mission reports, invariants, determinism, and non-mutation tests.

Deferred: schedules, weather, and emergencies remain out of scope for Phase 2.

## Phase 3

Implemented: deterministic schedules, weather state, forecasts, communication
delay handling, all four emergency clocks and effects, deadline forcing,
fixture tests, and balance-bot tooling.

Verification: `npm test` passes with 18 tests.

## Phase 5

Implemented: data loading, routing, store, settings, versioned saves, checkpoints,
localization helpers, live-region announcements, responsive command-loop screens,
meters, job planning, estimates, evening reports, and the emergency placeholder.
The existing pure engine API now drives mission creation, planning, resolution,
autosave, and sol progression. Full emergency interaction, playback, reports,
and learning screens remain scheduled for later phases.

Verification: `npm test` and `npm run validate` pass.

## Phase 4

Complete: NASA DONKI and JPL Horizons tools generated and validated all six
real-data files for windows A, B, and C. The DONKI endpoint uses the current
CCMC API route. Horizons parsing accepts the official space-separated table.

Verification: `npm run data:build`, `npm test`, and `npm run validate` pass.

## Phase 6

Implemented: interactive emergency clock, Ask Earth timing, option trade-offs,
damage display, action results, emergency lessons, paused and rewind choices,
evening results, and mission report routing. The command loop now connects
emergency actions to the pure engine.

## Phase 7

Implemented: Codex, Data Lab views backed by committed DONKI and Horizons JSON,
mission score/history report, training entry flow, credits attribution, and
read-aloud-ready localized screen text. Charts use serializable report history.

Known issue: browser speech and audio require a user gesture and remain off by default.

## Phase 8

Implemented: inline outpost cutaway artwork, crew avatars, optional WebAudio tones,
speech helpers, settings controls for text size, contrast, motion, sound, and
read-aloud, focus-visible styling, reduced-motion-safe animation, and friendly
loading errors.

## Phase 9

Implemented: browser smoke page, readability validator, release human-verification
gate, test plan, teacher guide, credits, and submission checklist.

Final automated checks: `npm test`, `npm run validate`, `npm run readability`,
`npm run validate -- --report`, browser smoke, syntax checks, and
`git diff --check` pass. The release gate remains intentionally blocked until
human Codex verification and real-device/child playtesting are complete.

Browser verification: a Cadet mission was played through all 30 sols,
including an emergency, and reached Mission Report without console errors.

Balance note: the existing bot harness now completes all 2,400 runs, but its
targets are not all met. GreedyScience pauses early as expected; Lazy and
Commander completion targets need tuning in a future balance pass.

## Visual refresh

Implemented a visual command-console pass without changing engine rules:
the title screen now has a Mars outpost hero scene, mission objective, and
clear primary action. Command planning now uses resource bars, richer job
cards with descriptions and trade-offs, and a responsive two-column layout.
Browser smoke verification confirms the updated title and Command screens load.

## Gameplay cleanup pass

Added a first-time mission explanation, clearer Cadet/Astronaut/Commander
choices, resource and crew explanations, a forecast hint, and a visible
three-job planning instruction. The Evening Report now shows visual Power,
Air, and crew Wellbeing results plus the next action.

Verification: `npm test`, `npm run validate`, `npm run readability`, and
`git diff --check` pass. Browser verification completed a planned Sol 1 and
showed the updated Evening Report.

## Guided gameplay pass

Fixed planning order: the player now selects Morning, Midday, or Afternoon
before choosing a job, with clear slot names and separate Clear controls.
Sol 1 includes a short mission-control tutorial, story beats appear across
the 30-sol arc, objectives react to storms and scheduled critical events,
and engine event messages now appear in the mission log and Evening Report.

## Drag-and-drop planning

Job cards are draggable into named time slots. Drop targets highlight during
dragging, and tapping a card or selecting a slot remains available for touch,
keyboard, and assistive-technology users.

Start Sol now stays actionable when the plan is incomplete. It reports each
missing slot by name instead of presenting a disabled button with no reason.

The planner now refreshes job availability after Storm Shelter changes and
shows plain-language reasons for disabled jobs such as a healthy Air Maker or
empty panels.

Shield progress now exposes its block count and the live plan preview updates
after Build Shield, so partial progress is visible before starting the sol.

Balance tuning: `WB_REST` remains 1, `CREW_AIR_USE` is 5, and low-resource
wellbeing penalties are softened to keep Cadet recoverable. The latest balance
run meets the Lazy Astronaut target through a two-star result, but Commander
Balanced still exceeds the target completion band and needs a later tuning pass.

## Engagement pass

Added a mission clock, a dynamic Command Pulse, and clearer moment-to-moment
priorities based on actual Air, dust, crew, storm, and Air Maker state. Added
default-on WebAudio cues for planning, emergencies, and sol results. Sound can
be disabled in Settings.
Settings use a new version key so existing browser sessions receive the audio
default.

Verification: `npm test`, `npm run validate`, `npm run readability`, and
`git diff --check` pass. The local browser reloads the updated title screen.

Emergency drills now appear during disasters. Matching three repair pairs gives
the next response a success bonus. Blocked saved plans now explain the exact
job problem instead of appearing to do nothing.

## Space mission-control visual pass

Updated the shared visual system with a starfield background, orbital-blue HUD
panels, stronger status lights, clearer mission title treatment, and more
spacecraft-like resource and forecast cards. Browser verification confirms the
revamped OUTPOST title screen loads correctly.

Audio now includes a quiet procedural ambient loop. Players can turn it off in
Settings, and it starts only after a user action.
Playback levels were raised after browser listening feedback.
Interactive buttons now play a short click cue when Sound is enabled.

## Phase 10: Living Outpost scene

Implemented: `js/ui/baseView.js` is now a living Mars outpost scene (inline SVG + CSS only).
Crew walk to the stations of the jobs planned for the selected slot, the sun and sky move
Morning/Midday/Afternoon, "Watch the sol" previews the whole day, dust storms and solar
storms change the scene, panels get dusty, battery cells show power, shield berm layers grow,
Air Maker steams or sparks by health, and tapping parts explains them. The Earth dish text uses
the real one-way delay (JPL Horizons data already in state). No engine changes.

## Phase 11: Playable Sol sequence (Segment 2)

Implemented: pressing Start Sol now plays the sol on the Segment 1 outpost scene instead of jumping to text.
Morning, Midday and Afternoon beats show the real crew assignment walking to each job, with floating
numbers and scene changes (panel dust, shield blocks and layers, Air Maker health). If the sol closes
without an emergency, a Night sequence shows power (sunlight, base use, Air Maker), air (made and breathed),
dust and each astronaut's wellbeing and radiation change. Emergency sols play the job beats, then a
flashing alarm, then go to the existing emergency screen. The evening screen now opens with a Sol Report:
what changed (before to after), what each crew member did and what it did, why it happened, and per-crew changes.

Truthfulness: `js/engine/replay.js` (new, pure) derives every beat from the same engine functions
(`applyJobEffect`, `resolveResources`) and the before/after states. Tests in `tests/unit/replay.test.js`
check that the replay matches the engine, that zero-change jobs are reported as unchanged, that brownouts
are reported, and that inputs are not mutated. If the sequence ever throws, the game skips straight to the
old flow so a sol is never blocked.

Controls and accessibility: Next, Skip, and a Fast speed toggle. With reduced motion (Settings or system)
nothing auto-advances: the player steps through with Next, and floating numbers stay on screen as text.
A polite live region carries every caption. The Reduce motion setting now also disables CSS animation globally.

Known gaps: story, mini cinematics and a tutorial are not done. Music is unchanged. The sequence does not
replay the emergency itself (the existing emergency screen handles it). Night breakdowns are not shown on
emergency sols because emergency effects change the numbers before the sol closes; the report shows the
real before and after instead. Crew wellbeing changes are shown at night, not per job, because the engine
only calculates them at the end of the sol.
