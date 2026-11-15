# Decisions

- Phase 0 uses the simplest static title screen and leaves gameplay modules as placeholders.
- Phase 1 keeps the existing empty `data/real/` files because NASA data must come from the live fetch tools; the validator checks their schemas when populated.
- Difficulty dust-storm start sols are not specified in section 2.6, so Phase 2 schedule generation will choose seeded starts from the listed durations and factors.
- `[VERIFY]` NASA facts remain out of the UI until real sources are fetched and human-verified.
- Phase 2 keeps `schedule` empty and does not resolve weather or emergencies; those behaviors begin in later phases.
- Engine timestamps use caller-provided `meta.createdAt` and `meta.updatedAt`; the pure engine never creates timestamps.
- Phase 3 exposes `emergencyForceDeadline` for deterministic development and deadline-path tests.
- NASA migrated DONKI from the legacy `api.nasa.gov/DONKI` route to the current CCMC `DONKI-API/get` route. The fetch tool uses the current documented route and does not place API keys in requests.
- JPL Horizons returns space-separated date/time and value columns in its official table. The parser accepts that shape and the earlier comma-separated fixture shape.
- Phase 8 graphics use inline SVG and CSS only. This avoids external assets, runtime network requests, and licensing uncertainty while keeping the outpost readable offline.
- The Phase 9 release gate intentionally remains red until a human fills Codex source, reviewer, and date fields. Device accessibility and child playtests are human-only checks.
- The final balance run is reported without changing game constants: the harness now handles invalid bot jobs safely, but Lazy and Commander targets still need a dedicated tuning pass.
- Phase 6 uses the existing checkpoint list for rewind choices; the simplest safe
  behavior restores the selected prior checkpoint and returns to Command.
- Phase 7 renders the committed real-data summaries without adding runtime
  network calls. Unverified Codex source metadata remains out of user-visible
  source links until human verification.
- Phase 8 keeps sound and speech off by default. Browser APIs are optional and activate only from a user-controlled setting or button.
- Phase 9 release validation intentionally fails until a human verifies the Codex entries; this is a required release gate, not a test failure to bypass.
- Balance tuning: `WB_REST` changed from 8 to 1 because three Rest slots gave +24 Wellbeing per sol and made Lazy a guaranteed 3-star Astronaut strategy. The lower value keeps rest useful while requiring resource jobs.
- Balance tuning: `AIR_MAKER_OUT` changed from 14 to 10 because Air stayed full until the final sols even when the player ignored Air Maker wear. The lower value makes maintenance and the Air Maker switch meaningful without changing the engine rules.
- Balance tuning: `CREW_AIR_USE` changed from 3 to 4 because Lazy still completed every no-storm balance run after the Air Maker output change. This makes Air decline when maintenance is ignored while preserving the existing Maintain action.
- Balance tuning: `CREW_AIR_USE` changed from 4 to 5 and low-resource wellbeing penalties were softened to 0.5/1. This keeps Cadet recoverable while making ignored Air and Power reduce mission stars.
- Audio remains dependency-free WebAudio. Sound now defaults on, starts only after the player's action, and can be disabled in Settings.
- Settings storage moved to `outpost.settings.v2` so existing sessions receive the new audio default instead of retaining an old disabled value.
- Phase 10: the outpost scene previews crew positions with the engine's own `autoAssign`, so the preview matches what happens on Start Sol. Scene wording is game-level only and makes no new NASA claims. Styles live in `css/world.css`.
- Phase 11: sequence numbers come from a new pure `js/engine/replay.js` that re-uses `applyJobEffect` and `resolveResources`. It adds no game rules and does not change the engine's results. UI never computes outcomes.
- Phase 11: wellbeing and radiation are shown at night, not per job, because the engine only resolves them at sol close. Showing a per-job number would invent an outcome.
- Phase 11: on emergency sols the night breakdown is skipped (emergency effects change power and air before the sol closes). The Sol Report still shows true before/after totals and the emergency lesson.
- Phase 11: with reduced motion the sequence is click-through (no timers). Settings key `fastSol` is stored in the existing settings object; no storage version change was needed because settings merge with defaults.
- Phase 11: Sol Report shield row uses blocks (not layers) so partial progress is visible. Radiation is labelled as game units.
