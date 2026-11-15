# OUTPOST: Final Specification v1.0

**Team HORIZON · NASA Space Apps Challenge 2026 · "Build a Junior Astronaut Mission Trainer"**

**Status: FROZEN for implementation.** If something is not specified here, implement the simplest option and record it in `docs/DECISIONS.md`. Do not redesign.

## 0. How to Use This Document

- Save as `docs/SPEC.md`. The Copilot Agent reads it before every phase.
- Section 10 is the exact content of `.github/copilot-instructions.md`.
- Section 11 has one Copilot Agent prompt per phase. Run them in order, one fresh chat per phase, and commit after each phase.
- `[VERIFY]` means a human must check the value or fact against a NASA source before release.
- Provenance tiers used everywhere: **real** (taken directly from NASA data), **scaled** (real idea or ratio, simplified numbers), **game** (invented for gameplay).

## 1. Resolved Decisions

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Scenario | Mars, a generic small outpost (no claims about a real site) |
| 2 | Audience | Ages 7–12. Average reading level grade 5 or lower. Max 20 words per text bubble |
| 3 | Modes | Full Mission (30 sols), Classroom Mission (10 sols), Training Mission (3 sols) |
| 4 | Pacing | Turn-based. No timers. No reflex play |
| 5 | Core meters | **Power, Air, Shield** only. Crew **Wellbeing** is the outcome. Water and food are story text only |
| 6 | Crew | 3 fixed astronauts: Amara (Engineer), Kenji (Scientist), Luz (Medic). The player is the Commander |
| 7 | Daily actions | 3 job slots per sol, 6 job cards |
| 8 | NASA data | **DONKI** (flares, CMEs, solar energetic particles) and **JPL Horizons** (Earth–Mars light-time) |
| 9 | Real-data windows | A = Sept 2017 (Astronaut), B = May 2024 (Commander), C = June 2019 (Cadet) |
| 10 | Comms delay | Real one-way minutes per sol from JPL data drive the Emergency Clock |
| 11 | Randomness | Seeded `mulberry32`. Same seed + same choices = same game |
| 12 | Tech | Vanilla HTML/CSS/ES modules. No frameworks, no bundler, no runtime dependencies. Node 20+ only for tests and tools |
| 13 | Data loading | Static JSON loaded with `fetch`. The engine never fetches or touches the DOM |
| 14 | Saves | `localStorage`, versioned schema, last 3 checkpoints |
| 15 | Assets | System font stack, emoji plus inline SVG, WebAudio-synthesized sound (off by default) |
| 16 | Privacy | No accounts, analytics, cookies or runtime network requests to other origins |
| 17 | Language | English only, all text in `strings.en.json`, ready for translation |
| 18 | Failure | Never "you died". It is **Mission Paused** with rewind to a checkpoint |
| 19 | Hosting | GitHub Pages from `main` root, plus a GitHub Actions CI that runs tests |
| 20 | Branding | No NASA logo or "worm". Visible disclaimer: not an official NASA product |
| 21 | AI use | Disclosed in README and `docs/AI_DISCLOSURE.md` |

### 1.1 Challenge Compliance Checklist (human verifies against the official challenge page)

- [ ] Game clearly acts as a trainer for junior astronauts, with learning outcomes the team can state in two sentences.
- [ ] Incorporates NASA data or resources, and credits them visibly in-game and in the README.
- [ ] Real data is clearly separated from simplified gameplay values (badges, Data Lab, "What was real?" panel).
- [ ] Communication delay is a gameplay mechanic.
- [ ] Every major decision shows a trade-off.
- [ ] Third-party assets are licensed and credited. Source code is public with a license \[VERIFY whether required\].
- [ ] AI-assisted development disclosed per the current Space Apps rules \[VERIFY\].
- [ ] Submission package complete (summary, video, links, team info, deadline) \[VERIFY portal fields\].

## 2. Core Rules

### 2.1 Sol Structure

One game turn is one **sol** (Mars day). The UI shows a Mars clock; a sol is 24 h 39 m (real, simplified from 24 h 39 m 35 s). Job slots are Morning 08:00, Midday 12:00, Afternoon 16:00.

Phase state machine: `briefing → planning → resolving → (emergency) → evening → briefing (next sol)`. After the sol-30 evening report the phase is `complete`. If a crew member's Wellbeing reaches 0 the phase is `paused`.

### 2.2 Crew

| id | Name | Role | Skill |
| --- | --- | --- | --- |
| amara | Amara | Engineer | Clean, Build, Maintain effects ×1.5 (rounded down) |
| kenji | Kenji | Scientist | Science Walk gives 15 points instead of 10 |
| luz | Luz | Medic | **Medic Care**: at sol end, if Luz's Wellbeing ≥ 40, every other crew member under 50 gets +3. Best chance in injury emergency |

Each crew member has `wellbeing` (0–100, starts 100), cumulative `dose` (starts 0), and `restingUntilSol` (null or a sol number; a resting crew member cannot be assigned jobs).

### 2.3 Job Cards

| id | Icon | Effect | Type | Disabled when |
| --- | --- | --- | --- | --- |
| `clean` | ☀️ Clean Panels | `dust −35` (Engineer −52, min 0) | work | dust = 0 |
| `build` | 🧱 Build Shield | `+2 shield blocks` (Engineer +3) | work | layers = 3 |
| `maintain` | 🔧 Maintain | Air Maker `health +25` (Engineer +37, max 100) | work | health ≥ 90 |
| `science` | 🔬 Science Walk | `+10 science points` (Kenji 15). Assigned crew takes **+2 dose** (shield does not help outside) | work | shelter ON or storm active today |
| `rest` | 😴 Rest & Play | All crew `+8` Wellbeing | team | never |
| `talk` | 📡 Talk to Earth | All crew `+3` Wellbeing. Next sol's forecast looks 5 sols ahead instead of 2 | team | already used this sol |

Work jobs cost the assigned crew member `−4` Wellbeing. Team jobs use no crew member. The same job may fill several slots except `talk`. Rover and robot arms do the digging and cleaning, so only Science Walk exposes crew to extra radiation.

**Auto-assignment** for work jobs in slot order: candidates = crew not resting and not yet assigned this sol; score = `2` if the crew's skill matches the job + `wellbeing / 100`; pick the highest. If everyone is assigned, reuse the crew member with the fewest assignments. The player may override by tapping a crew chip on a slot.

### 2.4 Daily Controls

- **Air Maker switch** (`airMakerOn`): ON uses power and makes air. Default ON.
- **Storm Shelter** (`shelter`): only available on a sol with an active solar storm. Reduces storm dose to 20% but leaves only **1 job slot** that sol and disables Science Walk.
- **Slot count**: 3 normally. 1 on a shelter sol. A one-sol penalty from an emergency can lower it by 1 (minimum 1).
- The player must fill every available slot. **Auto-pick** fills empty slots with Rest & Play.

### 2.5 Constants (Astronaut tier baseline; all live in `data/game/constants.json`)

| Name | Value | Provenance |
| --- | --- | --- |
| SOLS | 30 | game |
| SLOTS | 3 | game |
| SOLAR\_MAX (power/sol, clean sky, clean panels) | 40 | scaled (Mars gets less sunlight than Earth \[VERIFY ratio\]) |
| BASE\_USE (power/sol) | 10 | game |
| AIR\_MAKER\_USE | 12 | game |
| BATTERY\_CAP | 100 | game |
| DUST\_RATE (%/sol, ×2 during dust storm) | 5, cap 70 | scaled |
| CREW\_AIR\_USE (per astronaut per sol) | 3 | scaled (ratio from NASA crew needs \[VERIFY\]) |
| AIR\_MAKER\_OUT (full health) | 14 | scaled (inspired by NASA MOXIE \[VERIFY\]) |
| AIR\_MAKER\_WEAR (health/sol while running) | 4 | game |
| Air Maker full output while health ≥ | 50 (below that, output = `14 × health/50`, floored) | game |
| BLOCKS\_PER\_LAYER / MAX\_LAYERS | 6 / 3 | game |
| SHIELD\_STEP (dose reduction per layer) | 0.15 → `f = 1 − 0.15 × layers` | scaled (regolith shielding idea \[VERIFY\]) |
| DOSE\_BASELINE (per crew per sol) | 1.0 × f | game (units are game units, not mSv) |
| DOSE\_SCIENCE\_WALK | +2 flat | game |
| DOSE\_STORM | `severity × 4 × f` (×0.2 if sheltered) | game |
| DOSE\_BANDS (cumulative) | Green < 40, Yellow 40–69, Orange 70–99, Red ≥ 100 | game |
| BAND\_PENALTY (Wellbeing per sol) | 0 / −1 / −3 / −6 | game |
| WB\_BASE\_STRESS | −2 | game |
| WB\_WORK | −4 per work job | game |
| WB\_REST / WB\_TALK | +8 per Rest slot / +3 if any Talk | game |
| WB\_AIR\_LOW | −5 if air < 30; −20 if air ≤ 0 (replaces) | game |
| WB\_POWER\_LOW | −5 if power < 20; −8 if power ≤ 0 (replaces) | game |
| SCIENCE\_PER\_WALK | 10 | game |
| START (Astronaut) | power 80, air 85, dust 0, blocks 0, Air Maker health 100, Wellbeing 100 | game |

### 2.6 Difficulty Tiers

| Setting | Cadet | Astronaut | Commander |
| --- | --- | --- | --- |
| Real-data window | C (June 2019, calm Sun) | A (Sept 2017) | B (May 2024) |
| Start power / air | 100 / 100 | 80 / 85 | 70 / 75 |
| BASE\_USE | 8 | 10 | 11 |
| DUST\_RATE | 4 | 5 | 6 |
| Emergencies | 2 | 4 | 6 |
| Dust storms | 1 (3 sols, factor 0.5) | 1 (5 sols, 0.35) | 2 (4 and 6 sols, 0.3) |
| Emergency deadline modifier | +30 min | 0 | −10 min |
| Blind success chance modifier | +0.2 (cap 1.0) | 0 | 0 |
| Coach tips / daily tip | On | On | Off |
| Practice storm (game) | Yes, sol 12, severity 2 | No | No |

Classroom Mission = Cadet values with `totalSols = 10`, fixed schedule in `classroom.json`: emergencies on sols 4 and 8 (breakdown, injury), practice storm sol 6 (severity 2), no dust storm, window C delay data.

### 2.7 Sol Resolution Algorithm (exact order; implement as pure functions)

`submitPlan` applies steps 1–3. If an emergency is scheduled today, the phase becomes `emergency` after step 3 and `closeSol` (steps 4–8) runs after it resolves. Otherwise `closeSol` runs immediately.

1. **Validate** the plan (slot count, disabled jobs, one `talk`). Store toggles.
2. **Assign crew** (auto or override).
3. **Execute jobs** in slot order using the table in 2.3. Count `workJobs[crew]`, `restSlots`, `talkUsed`, `walkers` (crew on Science Walk).
4. **Emergency** (if scheduled): run the Emergency Clock (section 4). Its effects apply to state immediately.
5. **Power and Air**
   - `sunFactor` = storm factor if a dust storm is active, else 1.
   - `income = round(SOLAR_MAX × sunFactor × (1 − dust/100))`
   - `makerWants = airMakerOn && !forcedOffToday`
   - `makerRuns = makerWants && (power + income − BASE_USE − AIR_MAKER_USE ≥ 0)` (otherwise a **brownout**: the Air Maker pauses and an event is logged)
   - `use = BASE_USE + (makerRuns ? AIR_MAKER_USE : 0)`
   - `power = clamp(power + income − use, 0, powerCap)`
   - `airGain = makerRuns ? floor(AIR_MAKER_OUT × min(1, health/50)) : 0`
   - `air = clamp(air + airGain − 3 × 3, 0, 100)`
   - If `makerRuns`: `health = max(0, health − 4)`
   - `dust = min(70, dust + DUST_RATE × (dustStormActive ? 2 : 1))`
6. **Dose** for each crew member: `f = 1 − 0.15 × layers`; `base = 1.0 × f`; `storm = stormToday ? severity × 4 × f × (shelter ? 0.2 : 1) : 0`; `walk = 2 if on Science Walk`; `doseToday = base + storm + walk`; `dose += doseToday`.
7. **Wellbeing** for each crew member: `Δ = −2 − 4×workJobs + 8×restSlots + (talkUsed ? 3 : 0) − airPenalty − powerPenalty − doseToday − bandPenalty(dose after today) + medicCare`, then `wellbeing = clamp(round(wellbeing + Δ), 0, 100)`. `medicCare` is +3 for non-medic crew under 50 when Luz's Wellbeing (before this update) is ≥ 40.
8. **Close**: if any Wellbeing = 0 → phase `paused`. Else push a history row, write the checkpoint, build the Evening Report, set phase `evening`. When the player continues: `sol += 1` and phase `briefing` (or `complete` after sol 30).

### 2.8 Projections ("lasts about N sols")

`projectSols(state)` uses today's income, current dust, current switch positions and the Air Maker's current output. If net change ≥ 0 show **Steady**. Otherwise show `ceil(value / −net)`, capped at "30+". Shield shows `layers/3` and "next layer in K jobs".

### 2.9 Scoring and Ending

- `survival` = 300 if sol 30 completed, else `10 × sols completed`
- `wellbeing` = `round(average final Wellbeing × 3)` (max 300)
- `science` = total science points
- `reserves` = `power + air + 20 × layers` (max 260)
- `emergencies` = +25 per emergency solved with no failed attempt, +10 if solved after a failed attempt, 0 if the deadline was reached
- **Stars**: total ≥ 1000 → 5★, ≥ 800 → 4★, ≥ 600 → 3★, ≥ 400 → 2★, otherwise 1★. A paused mission shows 0★ and a learning report.
- **Mission Paused** screen offers: Rewind 3 sols (restore oldest checkpoint), Rewind 1 sol, or See Mission Report.

## 3. World Events, Forecast and Schedule

### 3.1 Two Kinds of Weather

| Event | Source | Effect | Provenance |
| --- | --- | --- | --- |
| **Solar storm** (severity 1–4) | Real DONKI events mapped to sols (section 5) | Adds storm dose that sol (`severity × 4 × f`). Shelter reduces it | dates **real**, severity **scaled**, dose **game** |
| **Dust storm** | Game schedule (Mars has real global dust storms) | `sunFactor` drops to the storm's factor for its duration; dust builds twice as fast | **game** schedule, effect **scaled** |

Solar storms are resolved in the normal sol loop. They are not emergencies and use no minute clock.

### 3.2 Forecast Rules (Briefing screen)

- Base look-ahead is **2 sols**. If the player used **Talk to Earth** on the previous sol, look-ahead is **5 sols**.
- Storms of severity ≥ 2 and all dust storms appear in the forecast inside the look-ahead window. Severity-1 storms appear only with the 5-sol look-ahead. On the day itself every active event is shown.
- Each forecast chip shows an icon, sols until arrival, and a provenance badge.
- **Daily tip** (Cadet and Astronaut): the first matching rule wins: power projection < 6 sols → "Power is getting low"; dust > 40 → "Panels are dusty"; Air Maker health < 50 → "Air Maker needs care"; storm in forecast and shelter not yet used → "A storm is coming. Think about shelter"; any Wellbeing < 50 → "Your crew is tired"; else a rotating fun fact.

### 3.3 Schedule Generation (`buildSchedule(seed, difficulty, windowId, data)`)

Runs once in `createMission`. Output is stored in `state.schedule` and never changes.

1. **Storms**: read `data/real/donki-<window>.json` → `storms[]` (already mapped by the tool). Cadet adds one game storm on sol 12, severity 2, flagged `provenance: "game"`.
2. **Dust storms**: use the tier table. Start sol = base + seeded jitter in {−1, 0, +1}. Warning is visible through the normal forecast.
3. **Emergencies**: sol bands per tier (below). Pick one sol per band with the seeded RNG. If a pick is within 1 sol of a solar storm sol, move it forward until free.
   - Cadet (2): bands 9–13, 20–25. Types drawn from `machine_breakdown`, `crew_injury`.
   - Astronaut (4): bands 5–8, 11–14, 17–21, 24–28. Each of the 4 types once, in seeded random order.
   - Commander (6): bands 4–6, 8–10, 13–15, 17–19, 21–23, 26–28. Each type once plus 2 seeded repeats.
4. **Delay**: `delayBySol[1..30]` copied from `data/real/delay-<window>.json`.
5. Injury victim is chosen when the emergency triggers (seeded, from crew not resting).

## 4. Emergencies and Communication Delay

### 4.1 Why Delay Matters

Earth is minutes away by light. Mars missions cannot call for instant help. OUTPOST makes this the central decision of every emergency: **ask Earth and wait, or act now and risk a mistake.**

- One-way delay = `delayBySol[sol]` minutes (**real**, from JPL Horizons; roughly 3–22 min depending on Earth–Mars distance \[VERIFY range\]). Round trip = `ceil(2 × oneWay)`.
- The delay is shown on the Comm Dish, in the Emergency screen, in Talk to Earth messages, and in the Data Lab chart, always with the 🛰 NASA DATA badge.

### 4.2 Emergency Clock Rules

1. The emergency starts at `clockMin = 0` with `deadlineMin` (tier-adjusted).
2. Every minute that passes applies the emergency's `perMinute` damage (rounded to whole units when applied).
3. The player picks one action at a time. An option takes `durationMin` minutes. Then the result is decided:
   - If Earth has already advised this option: success chance = `successAdvised`.
   - Otherwise success chance = `successBlind` (+ tier modifier, cap 1.0; injury treatment uses Luz's modifier).
   - Roll `rng() < chance` using the mission RNG.
4. **Success**: apply `onSuccess` and `costs`, end the emergency. **Failure**: apply `onFail`, disable that option, and the clock keeps running. The player picks again.
5. **Ask Earth 📡** (once per emergency) advances the clock by the round trip. Afterward Earth's reply is shown, the best option gets a ✓ and its success becomes `successAdvised`. If `roundTrip + shortest remaining option duration > deadlineMin − clockMin`, the button is disabled with the text "Earth is too far away to help in time. You decide!".
6. **Deadline** (`clockMin ≥ deadlineMin` with no success): **Auto-Safe Mode**. Apply `deadlineFailure` and end the emergency. The mission is never ended by an emergency.
7. Damage accrued before the result is applied together with the result. The Evening Report shows "Minutes used: X. Damage while waiting: Y".

### 4.3 The Four Emergencies (all values **game**, stored in `data/game/emergencies.json`)

Success chances are Astronaut tier. Deadlines: Cadet +30, Commander −10.

**E1 Air Leak** (`air_leak`): deadline 60 min. `perMinute`: air −0.4. Deadline failure: air −10, all crew Wellbeing −5. Earth's best option: `patch`.

| Option | Time | Blind / Advised | Costs and notes |
| --- | --- | --- | --- |
| `patch` Patch the leak | 10 | 0.5 / 1.0 | None on success. Failure: air −3 (wrong spot) |
| `foam` Seal with foam | 25 | 1.0 / 1.0 | Power −12 |
| `seal_room` Close the door | 5 | 1.0 / 1.0 | Air −8 and next sol has 1 fewer job slot |

**E2 Air Maker Breakdown** (`machine_breakdown`): on trigger Air Maker health = 0. Deadline 90 min. `perMinute`: air −0.1. Deadline failure: air −6 (health stays 0). Earth's best: `restart`.

| Option | Time | Blind / Advised | Result and costs |
| --- | --- | --- | --- |
| `restart` Restart it | 5 | 0.4 / 1.0 | Health → 50. Failure: power −2 |
| `spare_parts` Swap in spare parts | 30 | 0.8 / 1.0 | Health → 100. Power −8 |
| `backup_tank` Use backup air tank | 5 | 1.0 / 1.0 | Air +12. Air Maker stays at 0 and needs Maintain jobs |

**E3 Crew Injury** (`crew_injury`): injured crew chosen by seeded RNG. Deadline 90 min. `perMinute`: injured Wellbeing −0.3. Deadline failure: injured Wellbeing −10 and resting for 2 sols. Earth's best: `medic_treat`.

| Option | Time | Blind / Advised | Result and costs |
| --- | --- | --- | --- |
| `medic_treat` Luz treats them | 20 | 0.7 (0.4 if Luz < 30 or Luz is the patient) / 1.0 | Injured +10. Failure: injured −10 |
| `rest_watch` Rest and watch | 5 | 1.0 / 1.0 | Injured crew rests for 2 sols (cannot be assigned). Others cover the work |
| `carry_medbay` Carry to Med-Bay | 15 | 1.0 / 1.0 | Injured +5. All crew Wellbeing −5 (tiring) |

**E4 Battery Fault** (`battery_fault`): deadline 60 min. `perMinute`: power −0.5. Deadline failure: power −15 and battery cap −10. Earth's best: `isolate_cell`.

| Option | Time | Blind / Advised | Result and costs |
| --- | --- | --- | --- |
| `isolate_cell` Switch off bad cell | 10 | 0.5 / 1.0 | Battery cap −15 for the rest of the mission. Failure: power −5 |
| `cool_down` Cool it down | 15 | 1.0 / 1.0 | Air Maker forced OFF next sol |
| `reset_grid` Reset the whole grid | 20 | 1.0 / 1.0 | Power −15 |

**Trade-off rule:** every option must have a cost, or a risk (`successBlind < 1`). A unit test enforces this for all data (section 12).

### 4.4 Emergency Content Requirements

Each emergency needs: title, 2-sentence kid-friendly story, one icon, a "Why this happens on Mars" fact (Codex link), per-option trade-off sentence ("Fast, but might not work"), Earth's reply text ("Earth says: patch the left wall, not the loud spot!"), and a lesson line for the Evening Report.

### 4.5 Worked Example (for tests)

Air leak, Astronaut, one-way delay 15 min, deadline 60. Player taps Ask Earth: clock = 30, air −12 so far. Earth recommends `patch`. Player taps `patch`: clock = 40, success guaranteed, air −16 total, emergency solved with no failed attempt (+25 score). If instead the player patches blind: clock = 10, air −4; 50% success.

### 4.6 Other Communication Features

- **Talk to Earth** job: shows a short message "Sent 09:05. Earth heard you at 09:20. Reply arrived 09:35" using the real delay for that sol, plus a friendly scripted message from the Earth team (from `strings.en.json`, rotating).
- **Earth Report** line in each Briefing: "This message left Earth 15 minutes ago." (delay value, real).
- No communication blackout is simulated. The Codex explains solar conjunction as a fact only \[VERIFY\].

## 5. NASA Data and How It Is Used

### 5.1 Datasets

| ID | Dataset | Used for | Provenance |
| --- | --- | --- | --- |
| D1 | **NASA DONKI** (Space Weather Database Of Notifications, Knowledge, Information) via `https://api.nasa.gov/DONKI/FLR`, `/CME`, `/SEP` | Real flare, CME and SEP dates and strengths → solar storm schedule, Data Lab | real data, scaled mapping |
| D2 | **JPL Horizons** system (`https://ssd.jpl.nasa.gov/api/horizons.api`), Mars relative to Earth, one-way light-time | Real daily communication delay per sol → Emergency Clock, Data Lab chart | real |

Both are free. D1 needs a free NASA API key (`DEMO_KEY` is allowed but rate-limited \[VERIFY limits\]). D2 needs no key. **Neither is called at runtime.** Tools download once; the JSON files are committed. This avoids rate limits, keys in public code, outages and privacy concerns.

### 5.2 Real-Data Windows

Both datasets use the same 30 real calendar days. Real day *i* maps to sol *i* (the real 24 h 39 m sol vs 24 h day difference is ignored and labeled simplified).

| Window | Dates | Tier | Kid title | Expectation \[VERIFY by running the tool\] |
| --- | --- | --- | --- | --- |
| A | 2017-09-01 to 2017-09-30 | Astronaut | "The Great Solar Storms" | Several X-class flares around Sept 6–10 |
| B | 2024-05-01 to 2024-05-30 | Commander | "A Record Storm Month" | Multiple strong flares and CMEs, big storms |
| C | 2019-06-01 to 2019-06-30 | Cadet | "The Calm Sun" | Very few or no storms. Game says so honestly |

If window C returns no storms, the game shows "The Sun was calm this month!" and Cadet uses its game practice storm, clearly badged 🎮 GAME. The team may swap a window for a better month after reviewing the tool's summary; update `windows.json` and docs.

### 5.3 Fetch Tools (dev-only, Node 20+, no dependencies)

`tools/fetch-donki.mjs <windowId>`

- Reads `NASA_API_KEY` from the environment, falling back to `DEMO_KEY`.
- For each of `FLR`, `CME`, `SEP` calls `https://api.nasa.gov/DONKI/<TYPE>?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY`. Waits 1.5 s between calls and retries 3 times with back-off.
- Caches raw responses in `tools/.cache/` (gitignored).
- Expected fields (verify against live responses and tolerate missing ones): FLR `flrID`, `beginTime`, `peakTime`, `classType` (e.g. "X9.3"); CME `activityID`, `startTime`, `cmeAnalyses[]` with `speed` and `isMostAccurate`; SEP `sepID`, `eventTime`.
- Calls `mapStorms()` (pure function in `tools/lib/mapStorms.mjs`) and writes `data/real/donki-<id>.json`.
- **Never fabricate data.** If a call fails, exit with an error and instructions to re-run.

`tools/fetch-horizons.mjs <windowId>`

- Calls Horizons with `COMMAND='499'` (Mars), `CENTER='500@399'` (Earth geocenter), `EPHEM_TYPE='OBSERVER'`, the window dates, `STEP_SIZE='1 d'`, `QUANTITIES='21'` (one-way light-time in minutes) and `format=json`.
- Parses the table between `$$SOE` and `$$EOE` in `result`. If quantity 21 is unavailable, request `QUANTITIES='20'` and convert `range_AU × 8.3167` minutes \[VERIFY constant: light travels 1 AU in about 499 s\].
- Writes `data/real/delay-<id>.json` with 30 one-way values rounded to 0.1 min.

`tools/build-windows.mjs` runs both tools for A, B and C and prints a human summary (storms per sol, delay range) for review.

### 5.4 Storm Mapping (`mapStorms(events, startDate)`, pure and unit-tested)

For each real date `d` in the window:

```
flare = 1 if strongest flare that day is M-class
        2 if X1.0 to X4.9
        3 if X5.0 or stronger
        0 otherwise
sep   = 1 if any SEP event dated d
cme   = 1 if any CME that day has a most-accurate speed >= 1000 km/s
raw   = flare + sep + cme
severity = min(4, raw) if raw >= 1
sol   = dayIndex + 1
```

Then filter: drop sols 1–2 (grace period). Keep at most the **5 highest-severity** storms (ties: earlier sol). Enforce a **minimum gap of 2 sols**: if two storms are adjacent, keep the higher (ties: earlier). Output sorted by sol. Severity labels: 1 Small ★, 2 Medium ★★, 3 Big ★★★, 4 Giant ★★★★.

### 5.5 File Schemas

`data/real/donki-A.json`

```json
{
  "_meta": {
    "windowId": "A", "startDate": "2017-09-01", "endDate": "2017-09-30",
    "source": "NASA DONKI (CCMC)", "endpoints": ["/DONKI/FLR", "/DONKI/CME", "/DONKI/SEP"],
    "queries": ["https://api.nasa.gov/DONKI/FLR?startDate=2017-09-01&endDate=2017-09-30"],
    "retrievedAt": "ISO-8601", "toolVersion": "1.0", "provenance": "real"
  },
  "events": {
    "flares": [{ "id": "...", "peakTime": "...", "classType": "X9.3", "sol": 6 }],
    "cmes":   [{ "id": "...", "startTime": "...", "speedKmS": 1200, "sol": 6 }],
    "seps":   [{ "id": "...", "eventTime": "...", "sol": 6 }]
  },
  "storms": [{
    "sol": 6, "realDate": "2017-09-06", "severity": 4,
    "components": { "flare": "X9.3", "sep": true, "cmeSpeedKmS": 1200 },
    "provenance": { "events": "real", "severity": "scaled", "dose": "game" }
  }]
}
```

`data/real/delay-A.json`: `{ "_meta": {source: "NASA/JPL Horizons", query, retrievedAt, quantity, provenance: "real"}, "oneWayMinutes": [ 30 numbers ] }`.

### 5.6 How Real Data Reaches the Player

1. **Mission Select**: "Your mission replays the real Sun from September 2017." 🛰 badge.
2. **Briefing**: storm forecast chip shows the real flare class ("Flare X9.3 on Earth date Sept 6") with badge and a "Learn more" link to the Codex.
3. **Emergency Clock**: round-trip time from D2.
4. **Data Lab** screen: a 30-sol strip of real flares, CMEs and SEPs, a line chart of real delay, and a plain "What the game did with this" panel that separates **real**, **scaled**, **game**.
5. **Mission Report**: "What was real?" panel listing which events and delays the player actually met.
6. Credits screen and README: attribution text and links.

### 5.7 Provenance Badges

| Tier | Badge | Label | Meaning |
| --- | --- | --- | --- |
| real | 🛰 (blue) | NASA DATA | Taken directly from NASA data |
| scaled | 🛰≈ (blue outline) | NASA-BASED, SIMPLIFIED | Real idea or ratio, game numbers |
| game | 🎮 (gray) | GAME VALUE | Invented for gameplay |

Every constant in `constants.json` and `emergencies.json` has a `provenance` field. `docs/DATA_PROVENANCE.md` is generated from them by `tools/validate-data.mjs --report`.

### 5.8 Attribution and Branding Text (use exactly, Credits screen, footer and README)

"OUTPOST is a student project by Team HORIZON. It is not an official NASA product and is not endorsed by NASA. Space weather data: NASA DONKI (CCMC). Planet positions: NASA/JPL Horizons System." \[VERIFY current NASA media and data usage guidelines\].

### 5.9 Facts Needing Human Verification Before Release (Codex and UI claims)

Mars/Earth light-time range; Mars sol length; Mars sunlight ratio; Mars radiation environment vs Earth and the ISS; the September 2017 storm being detected on Mars; MOXIE oxygen results; Mars dust storms reducing solar power (including the 2018 storm and the Opportunity rover); regolith shielding; crew oxygen needs; solar flare classes, CMEs and SEPs. Every Codex entry stores `sourceName`, `sourceUrl`, `verifiedBy` and `verifiedDate`. Release is blocked until all are filled (test in section 12).

## 6. Game State and Data Structures

### 6.1 `GameState` (plain JSON, always serializable, treated as immutable)

```js
/** @typedef {Object} GameState */
{
  schema: 1,
  meta: {
    mode: 'full' | 'classroom' | 'training',
    difficulty: 'cadet' | 'astronaut' | 'commander',
    windowId: 'A' | 'B' | 'C',          // training uses 'C'
    seed: 123456789,                      // integer
    missionCode: 'A-123456',              // windowId-seed, shown in report
    playerName: '',                       // optional, max 16 chars, local only
    createdAt: 'ISO', updatedAt: 'ISO'
  },
  rngState: 123456789,                    // mulberry32 internal state
  sol: 1,                                 // 1..totalSols
  totalSols: 30,
  phase: 'briefing'|'planning'|'emergency'|'evening'|'complete'|'paused',
  resources: {
    power: 80, powerCap: 100, air: 85, dust: 0, shieldBlocks: 0,
    airMaker: { on: true, health: 100 }
  },
  crew: [ { id:'amara', wellbeing:100, dose:0, restingUntilSol:null } /* x3 */ ],
  plan: {                                 // the current day's plan
    slotCount: 3,
    slots: [ { job: null, crewId: null } /* x slotCount */ ],
    airMakerOn: true, shelter: false
  },
  world: {
    dustStormActive: false, sunFactor: 1,
    stormToday: null,                     // {sol, severity, ...} or null
    oneWayDelayMin: 15.2
  },
  schedule: {
    storms: [ { sol, severity, realDate, components, provenance } ],
    dustStorms: [ { startSol, durationSols, factor } ],
    emergencies: [ { sol, type } ],
    delayBySol: [ /* totalSols numbers */ ]
  },
  emergency: null | {
    type: 'air_leak'|'machine_breakdown'|'crew_injury'|'battery_fault',
    crewId: null,                         // injured crew for crew_injury
    clockMin: 0, deadlineMin: 60, roundTripMin: 30,
    askedEarth: false, earthReplied: false, adviceOptionId: null,
    disabledOptions: [], attempts: [ { optionId, success, atMin } ],
    damage: { air: 0, power: 0, wellbeing: 0 },   // accumulated, applied at end
    resolved: false, outcome: null        // 'clean'|'afterFail'|'deadline'
  },
  flags: {
    talkedSol: null,                      // sol when Talk to Earth was last used
    forcedAirMakerOffSol: null,           // sol when the Air Maker is forced OFF
    slotPenaltyNextSol: 0,
    trainingStep: 0
  },
  score: { science: 0, emergenciesClean: 0, emergenciesAfterFail: 0, emergenciesDeadline: 0 },
  history: [ { sol, power, air, dust, layers, wellbeing:[a,b,c], dose:[a,b,c] } ],
  log: [ { sol, kind, key, params, provenance } ]   // text keys, never raw text
}
```

Engine rules: every function returns a **new** state (`structuredClone` then mutate the clone). All random numbers come from `rng(state)`, which advances `state.rngState`. No `Date.now()`, `Math.random()` or DOM access in the engine (timestamps are set by the UI layer).

### 6.2 Data Files (all validated by `tools/validate-data.mjs`)

`data/game/constants.json`: one object per constant, e.g. `"SOLAR_MAX": { "value": 40, "provenance": "scaled", "note": "...", "sourceUrl": "" }`. Contains every value in section 2.5.

`data/game/difficulty.json`: `{ "cadet": { "windowId":"C", "startPower":100, "startAir":100, "constants": {"BASE_USE":8,"DUST_RATE":4}, "emergencyCount":2, "emergencyBands":[[9,13],[20,25]], "emergencyTypes":["machine_breakdown","crew_injury"], "dustStorms":[{"start":18,"duration":3,"factor":0.5}], "deadlineMod":30, "blindMod":0.2, "coachTips":true, "practiceStorm":{"sol":12,"severity":2} }, ... }`

`data/game/jobs.json`: `[ { "id":"clean", "icon":"☀️", "type":"work", "nameKey":"job.clean.name", "descKey":"job.clean.desc", "tradeoffKey":"job.clean.tradeoff", "skill":"engineer", "provenance":"game" }, ... ]`

`data/game/emergencies.json`:

```json
{ "air_leak": {
  "icon": "💨", "deadlineMin": 60,
  "perMinute": { "air": 0.4 },
  "deadlineFailure": { "air": -10, "allWellbeing": -5 },
  "earthBest": "patch", "codexId": "air-leaks",
  "options": [
    { "id": "patch", "durationMin": 10, "successBlind": 0.5, "successAdvised": 1.0,
      "onSuccess": {}, "onFail": { "air": -3 }, "costs": {},
      "tradeoffKey": "em.air_leak.patch.tradeoff" }
  ]
} }
```

Effect keys allowed in effect objects: `power`, `air`, `allWellbeing`, `crewWellbeing` (injured or acting crew), `airMakerHealthSet`, `airMakerHealthAdd`, `batteryCapAdd`, `forcedAirMakerOffNextSol` (bool), `slotPenaltyNextSol` (int), `restSols` (int, injured crew). The engine ignores unknown keys but the validator rejects them.

`data/game/codex.json`: `[ { "id":"light-delay", "titleKey":"codex.light-delay.title", "textKey":"codex.light-delay.text", "kind":"real"|"scaled"|"game", "unlock":{"onEvent":"emergency_started"}, "sourceName":"", "sourceUrl":"", "verifiedBy":"", "verifiedDate":"" } ]`

`data/game/strings.en.json`: flat key to string map. Supports `{param}` placeholders. Kid-friendly rules in section 8.9.

`data/game/crew.json`, `windows.json` (id, dates, kid title, tier, `"dataFiles"`), `training.json`, `classroom.json` follow the same patterns.

### 6.3 Save Format

`localStorage['outpost.save.v1'] = { schema:1, state: GameState, checkpoints: [GameState x up to 3] }`. A checkpoint is stored at the start of each sol's briefing. `outpost.settings.v1` holds settings. If `schema` differs, show "Your saved mission is from an older version" with Start New and Cancel (never crash).

## 7. Engine API (`js/engine/index.js`, pure functions)

| Function | Purpose |
| --- | --- |
| `createMission(options, data)` | Builds initial state, runs `buildSchedule`, seeds RNG |
| `getBriefing(state, data)` | Returns `{ sunFactor, forecast[], earthMessageKey, tipKey, projections }` |
| `getJobAvailability(state, data)` | Per job: `{enabled, reasonKey}` |
| `autoAssign(state, jobIds)` | Returns slots with crew assigned |
| `validatePlan(state, plan, data)` | `{ ok, errorKeys[] }` |
| `submitPlan(state, plan, data)` | Steps 1–3, may start an emergency. Returns `{ state, events }` |
| `emergencyAct(state, action, data)` | `action` = optionId or `'askEarth'`. Returns `{ state, events }` |
| `closeSol(state, data)` | Steps 5–8. Returns `{ state, events, report }` |
| `advanceSol(state)` | Moves from `evening` to next `briefing` or `complete` |
| `projectSols(state, data)` | Section 2.8 |
| `computeScore(state)` | Section 2.9 |
| `makeMissionReport(state, data)` | Stars, breakdown, charts data, "what was real" list |
| `rewind(save, solsBack)` | Restore a checkpoint |

Events are `{ type, sol, key, params, provenance }`. Types: `job_done`, `meter_change`, `storm_start`, `storm_end`, `dust_start`, `dust_end`, `brownout`, `emergency_start`, `emergency_step`, `emergency_end`, `crew_hurt`, `shield_layer`, `fact_unlocked`.

## 8. Screens, UI and Interactions

### 8.1 Visual Design Tokens (`css/tokens.css`)

Dark space theme with a warm Mars accent. Required CSS variables: `--bg #0B1020`, `--panel #151B33`, `--panel-2 #1E2646`, `--text #F4F6FF`, `--muted #AAB3D6`, `--mars #E8743B`, `--power #FFC83D`, `--air #4FD1E8`, `--shield #9B7BFF`, `--good #4ADE80`, `--warn #FBBF24`, `--bad #F87171`, `--real #5BB8FF`, `--game #A3A3B5`. All text/background pairs must meet WCAG AA. High-contrast theme overrides them under `[data-contrast="high"]`. Fonts: `system-ui, -apple-system, "Segoe UI", Roboto, "Trebuchet MS", sans-serif`; base size 18 px (setting: 16/18/22). Minimum tap target 48 px. Border radius 16 px. Meters never rely on color alone: each has an icon and a number.

### 8.2 Layout

- **Mobile (< 768 px, portrait)**: single column. Order: TopBar, MeterStrip, CrewRow, main panel with bottom tab bar (**Base / Plan / Log**). Sheets slide up from the bottom.
- **Desktop (≥ 1024 px)**: three columns: left Crew and Log, center Base View and Plan tray, right Meters and Forecast. Max width 1280 px.
- **Tablet**: mobile layout in a centered column, max width 720 px.
- Screens render into `#app`. The router is a simple `show(screenId, props)` function with focus management. No framework.

### 8.3 Screen List

| ID | Screen | Purpose |
| --- | --- | --- |
| `title` | Title | Logo, **Play**, **Continue** (if save), **Training**, Codex, Data Lab, Credits, footer disclaimer |
| `select` | Mission Select | Difficulty cards (Cadet/Astronaut/Commander), Classroom toggle, name field, mission code field, shows the real month for the tier. First run pre-selects Training |
| `command` | Command (main) | Briefing + Planning + Base View + meters + crew (below) |
| `playback` | Resolution Playback | Animated results of the sol |
| `emergency` | Emergency | Minute clock and options |
| `evening` | Evening Report | What changed and why |
| `paused` | Mission Paused | Gentle failure, rewind choices |
| `report` | Mission Report | Stars, score, charts, "What was real?" |
| `codex` | Codex | Unlocked facts with badges |
| `datalab` | Data Lab | Real NASA data explorer |
| `settings` | Settings | Accessibility and options |
| `credits` | Credits & Data | Attribution, AI disclosure, licenses |

### 8.4 Command Screen (main gameplay)

**TopBar**: ☰ menu, "Sol 7 of 30", Mars clock, the real month badge "🛰 Sun data: Sept 2017", 🔊 toggle, 🗣 Read Aloud button.

**MeterStrip** (3 large meters): ⚡ Power (0–100 bar, number, trend ▲▼▬ vs. last sol, "lasts about N sols"), 💨 Air, 🛡️ Shield (3 segments, "Layer 1 of 3"). Tap a meter → explainer sheet: what it is, what changes it today (list of + and − numbers), provenance badge, Codex link.

**CrewRow**: three cards with avatar (inline SVG), name, role icon, Wellbeing ring with number, radiation band chip (Green/Yellow/Orange/Red with text), status chip ("Resting", "Tired" under 40). Tap → sheet with the reasons behind today's change.

**Base View** (SVG cutaway, viewBox 0 0 800 500): hotspots with 48 px minimum hit areas and labels.

- ☀️ Solar Panels (dust haze overlay scales with `dust`), sky tint during dust storm.
- 💨 Air Maker (green lamp ON, gray OFF, red BROKEN; health bar). Tap opens a sheet with the ON/OFF switch and the cost text "Uses 12 power each sol".
- 🧱 Shield Wall (layers drawn as stacked regolith blocks).
- 🏠 Storm Shelter (glows when a storm is forecast).
- 📡 Comm Dish (shows "Earth is 15 min away 🛰"). Tap → explains light delay.
- Crew sprites shown at their current job location.

**Briefing Card** (top of the Plan tab, collapsible): greeting bubble from Mission Control, forecast chips (⚠️ storm with stars, 🌪 dust, each with days-to-arrival and badge), Earth message line, daily tip.

**Job Tray**: three slot boxes (Morning, Midday, Afternoon) and six job cards below. Tap a card → fills the next empty slot (or drag on desktop). Tap a filled slot → clears it. Each filled work slot shows a crew chip; tap it to cycle crew (shows Wellbeing). Each job card shows: icon, name (≤ 3 words), one-line effect, one-line trade-off ("Costs: crew tired"). Disabled cards are dimmed and show the reason when tapped.

**Controls**: Air Maker switch (with live text "+14 air, −12 power"), Storm Shelter switch (only on a storm sol, text "Safer, but only 1 job today"), **Auto-pick** button, **Start Sol** button (primary, disabled until all slots are filled). A live **Forecast of today** line updates as the player plans ("Power: 62 → 54") using engine `projectSols` and a `previewPlan()` helper that calls `closeSol` on a clone with no emergency. This preview is labeled "Estimate".

### 8.5 Playback Screen

A short (max 6 s) sequence: each job gets a caption with an animated icon, then each meter animates to its new value with a plain-language reason ("Panels were dusty, so solar power was low"). **Skip** button always visible. Reduced-motion setting replaces animation with an instant summary. Live-region announcement for screen readers.

### 8.6 Emergency Screen

- Header: icon, title, 2-line story, Mission Control message.
- **Clock bar**: segmented bar from 0 to deadline in minutes, current marker, red zone in the last 25%.
- **Earth distance pill**: "📡 Earth is 15 min away (🛰 NASA DATA)". Tap → explains light delay.
- **Damage counter**: live "While you wait: air −6".
- **Options** (3 cards): name, "⏱ 10 min", risk icon (🎲 "might not work" or ✅ "will work"), cost line, trade-off sentence.
- **Ask Earth** button: "Ask Earth 📡 (reply in 30 min)". Pressing animates a signal pulse along a line to a small Earth and back, advances the clock, then shows the reply card and marks the best option ✓ with updated risk icons. Disabled with explanation when too slow.
- Result card after each action: what happened, minutes used, damage so far, Continue.
- After the emergency a lesson card appears and the related Codex entry unlocks.

### 8.7 Evening Report, Paused, Mission Report

**Evening Report**: header "Sol 7 complete"; table of meter changes with arrows; up to 3 **cause cards** in the exact format "You chose X → Y happened → but Z" (generated from events); crew changes; one **Space Fact** with badge (from unlocked Codex or a rotating real fact); **Next Sol** button.

**Mission Paused**: calm tone, "Luz needs a break. Let's learn what happened." Shows the top 2 causes, buttons Rewind 3 sols, Rewind 1 sol, See Report.

**Mission Report**: 0–5 stars, score breakdown bars, three line charts (Power, Air, average Wellbeing over sols, drawn by an inline-SVG chart helper), "Your key choices" timeline (emergencies and storms with the option picked), **"What was real?"** panel (lists the real DONKI events and delays you met, clearly separated from game values), "3 things you learned" (selected from unlocked Codex), mission code, **Play Again**, **Print Certificate** (print stylesheet, shows name, date, stars, mission month, team and disclaimer).

### 8.8 Codex, Data Lab, Settings, Credits, Training

- **Codex**: grid of cards, locked ones show a silhouette. Filter chips: All, 🛰 Real, 🛰≈ Simplified, 🎮 Game. Detail view shows text, badge, source name and link, "Read Aloud". Initial entries (about 14): Sol, Mars gravity, Light delay, Space weather, Solar flare, CME, SEP, Radiation shielding, Dust storms, Solar panels on Mars, Making oxygen on Mars (MOXIE), Orbiters as weather reporters, Why exercise, Teamwork and rest. Unlock on first encounter.
- **Data Lab**: month selector (A/B/C). Shows (1) a 30-sol strip with dots for real flares, CMEs and SEP events (hover/tap shows class, speed, date, NASA link), storms highlighted; (2) line chart of real one-way delay; (3) a three-column panel "Real / Simplified / Game" explaining what the game did with the data; (4) links to DONKI and Horizons. Works offline from the committed JSON.
- **Settings**: text size (S/M/L), high contrast, reduce motion, sound (default off), auto Read Aloud (default off), coach tips, reset save (confirmation).
- **Credits**: team HORIZON, attribution text (5.8), data sources with links, AI-use disclosure (2 sentences), asset licenses, version, privacy statement ("No data leaves your device").
- **Training Mission** (3 scripted sols, `training.json`, practice events badged 🎮): Sol 1 meters, Clean Panels, Rest. Sol 2 Air Maker switch and the power trade-off. Sol 3 practice Air Leak with Ask Earth (fixed 12 min delay, labeled game practice) plus a shelter explanation card. Coach overlays are highlighted tooltips with Next buttons. Completion sets a local badge and returns to Mission Select.

### 8.9 Interaction, Accessibility and Content Rules

- Keyboard: every control reachable by Tab, activated by Enter/Space, Esc closes sheets, visible focus ring, focus trapped in modals and restored on close.
- ARIA: meters use `role="meter"` with labels; a polite live region announces meter changes; headings in order; buttons have text labels.
- Touch: no hover-only information; no drag-only interaction (tap alternative always).
- Motion: respect `prefers-reduced-motion` and the setting. No flashing.
- Read Aloud uses `speechSynthesis` when available and hides the button otherwise.
- Text rules: sentences ≤ 15 words, text bubbles ≤ 20 words, no jargon without a Codex link, positive tone ("Let's try again"), no violence, no death language. Numbers always with units or icons.
- Layout must work at 360 px width without horizontal scrolling and at 200% zoom.
- Performance: first load < 500 KB total, no layout thrash, charts are plain SVG.
- Sound (optional): short WebAudio tones for tap, alert, success. Never autoplay. Muted by default.

## 9. Final Project Folder Structure

```
outpost/
├── index.html                  # single entry; loads js/main.js as a module
├── package.json                # "type":"module"; scripts only; zero dependencies
├── README.md  LICENSE (MIT)  CHANGELOG.md  .gitignore  .nojekyll
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/ci.yml        # node 20: npm test, npm run validate
├── docs/
│   ├── SPEC.md                 # this document
│   ├── PROGRESS.md             # agent updates after every phase
│   ├── DECISIONS.md            # any deviation or gap decision
│   ├── DATA_PROVENANCE.md      # generated by tools/validate-data.mjs --report
│   ├── TEST_PLAN.md  TEACHER_GUIDE.md  AI_DISCLOSURE.md  CREDITS.md  SUBMISSION.md
├── css/
│   ├── tokens.css  base.css  layout.css  components.css  screens.css  print.css
├── js/
│   ├── main.js                 # bootstrap: load data, load save, show title
│   ├── app/
│   │   ├── router.js  store.js  save.js  settings.js
│   │   ├── dataLoader.js  i18n.js  a11y.js  audio.js  speech.js
│   ├── engine/                 # PURE: no DOM, no fetch, no Date, no Math.random
│   │   ├── index.js  rng.js  mission.js  schedule.js  briefing.js
│   │   ├── jobs.js  sol.js  resources.js  crew.js
│   │   ├── emergency.js  comms.js  project.js  score.js  report.js
│   └── ui/
│       ├── components/  meter.js  crewCard.js  jobCard.js  badge.js
│       │                sheet.js  toast.js  clockBar.js  chart.js
│       ├── baseView.js
│       └── screens/  title.js  select.js  command.js  playback.js  emergency.js
│                     evening.js  paused.js  report.js  codex.js  datalab.js
│                     settings.js  credits.js  training.js
├── data/
│   ├── real/                   # NASA-sourced, generated by tools, never hand-edited
│   │   ├── donki-A.json  donki-B.json  donki-C.json
│   │   └── delay-A.json  delay-B.json  delay-C.json
│   └── game/                   # team-tuned, every value has provenance
│       ├── constants.json  difficulty.json  jobs.json  emergencies.json
│       ├── crew.json  windows.json  training.json  classroom.json
│       ├── codex.json  strings.en.json
├── assets/svg/                 # logo, avatars, base parts (hand-written inline-friendly SVG)
├── tools/                      # dev-only Node scripts, no dependencies
│   ├── fetch-donki.mjs  fetch-horizons.mjs  build-windows.mjs
│   ├── validate-data.mjs  readability.mjs  serve.mjs
│   ├── bots.mjs  balance.mjs
│   └── lib/  mapStorms.mjs  parseHorizons.mjs
└── tests/
    ├── helpers/loadData.js
    ├── unit/*.test.js          # node:test
    ├── fixtures/               # small DONKI and Horizons samples
    └── browser/smoke.html      # manual in-browser self-test page
```

`package.json` scripts: `test` = `node --test`; `validate` = `node tools/validate-data.mjs`; `serve` = `node tools/serve.mjs` (static server, port 8080); `data:build` = `node tools/build-windows.mjs`; `balance` = `node tools/balance.mjs`; `readability` = `node tools/readability.mjs`.

Import paths are relative with explicit `.js` extensions. The browser build is the source itself: no transpiling.

## 10. `.github/copilot-instructions.md` (copy exactly)

```md
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
```

## 11. Implementation Sequence and Copilot Agent Prompts

### 11.1 Working Method (for the 3 team members)

1. Use **VS Code Copilot Chat in Agent mode**, choosing the strongest model your Premium plan offers.
2. **One fresh chat per phase.** Paste only that phase's prompt. Let the agent run terminal commands and approve them.
3. After each phase: run `npm test` yourself, open the game, click around, **commit and push**. Fix problems in the same phase before moving on.
4. If the agent goes off-spec, reply: "Follow docs/SPEC.md section X exactly. Revert unrelated changes."
5. Suggested roles: Member 1 owns phases 1–3 (engine) and balance; Member 2 owns phases 5–8 (UI) and playtests; Member 3 owns phase 4, science verification (Codex and DATA\_PROVENANCE), docs and the submission.

| Phase | Goal | Done when |
| --- | --- | --- |
| 0 | Scaffold, CI, GitHub Pages | Live URL shows placeholder |
| 1 | Data files, validator, RNG | `npm run validate` passes with real rules |
| 2 | Engine core | Formulas match hand-calculated test vectors |
| 3 | Schedule, weather, emergencies, comms, bots | Balance targets in section 12 reached |
| 4 | NASA data tools and real data files | A, B, C JSON committed and validated |
| 5 | UI foundation and playable command loop | 30-sol game playable (emergencies stubbed) |
| 6 | Playback, Emergency UI, reports, save/rewind | Full loop with emergencies works |
| 7 | Learning layer | Training, Codex, Data Lab, Mission Report |
| 8 | Polish and accessibility | Lighthouse and device checks pass |
| 9 | QA, balance, docs, submission | Definition of Done met |

### 11.2 Prompts

Every prompt assumes `.github/copilot-instructions.md` and `docs/SPEC.md` are already in the repo.

#### Phase 0: Scaffold and Deployment

```text
Read .github/copilot-instructions.md and docs/SPEC.md fully (especially sections 1, 5.8, 8.1, 9 and 10). Implement Phase 0 only: repository scaffold and deployment.

Tasks:
1. Create the complete folder structure from SPEC section 9. Placeholder files get a one-line header comment. No game logic.
2. index.html: valid HTML5, lang=en, viewport meta, title OUTPOST, a div with id app, a noscript message, css links, and a module script js/main.js.
3. js/main.js and js/app/i18n.js: a minimal t(key, params) helper that loads data/game/strings.en.json, then render a styled placeholder title screen "OUTPOST" with "Team HORIZON" and the disclaimer text from SPEC 5.8. All text comes from strings.en.json.
4. css/tokens.css with every token in SPEC 8.1 (plus a high-contrast override block). css/base.css with reset, typography, focus ring, prefers-reduced-motion handling. Other css files can be stubs.
5. package.json (type module, engines node >=20, scripts exactly as in SPEC 9, zero dependencies), .gitignore (node_modules, tools/.cache, .env), .nojekyll, MIT LICENSE (Team HORIZON), CHANGELOG.md, README.md (summary, run with npm run serve, test with npm test, data sources, AI disclosure sentence, status), docs/PROGRESS.md, docs/DECISIONS.md, docs/AI_DISCLOSURE.md (stub).
6. tools/serve.mjs: dependency-free static server on port 8080 with correct MIME types for html, js, mjs, json, svg, css.
7. tools/validate-data.mjs (minimal: exits 0 if data/game exists), tests/unit/smoke.test.js (checks strings.en.json parses and has a title key), .github/workflows/ci.yml (push and pull_request, Node 20, npm test and npm run validate).
8. Do not write any gameplay code.

Verify: run npm test and npm run validate. Run npm run serve and confirm index.html loads with no console errors (say exactly how you checked).
Finish: update docs/PROGRESS.md and CHANGELOG.md, suggest a commit message, and give me exact GitHub Pages steps (Settings, Pages, Deploy from a branch, main, root) and how to confirm the live URL.
```

#### Phase 1: Data and Validation Foundation

```text
Read .github/copilot-instructions.md and docs/SPEC.md sections 1, 2, 4.3, 5.5, 5.7, 6.2 and 12. Implement Phase 1 only.

Tasks:
1. Create every file in data/game/: constants.json (all values from SPEC 2.5, each with value, provenance, note), difficulty.json (cadet, astronaut, commander exactly as SPEC 2.6), jobs.json (6 jobs from 2.3), emergencies.json (all 4 emergencies, options, perMinute, deadlineFailure exactly as SPEC 4.3), crew.json, windows.json (A, B, C with dates, kid titles, data file names), classroom.json, training.json (3 sols as SPEC 8.8), codex.json (14 entries listed in 8.8 with kind, unlock event, empty sourceName, sourceUrl, verifiedBy, verifiedDate and status needs-verification; write each text at grade 5 reading level and make NO unverified numeric claims), strings.en.json (every key referenced by the data files, plus keys for job names, descriptions, trade-offs, emergency stories, option trade-offs, Earth replies, lessons, tips, UI labels, and the 5.8 disclaimer).
2. js/engine/rng.js: mulberry32 with createRng(seed), nextFloat(state), nextInt(state, min, max), shuffle(state, array), pick(state, array). State is just state.rngState (an integer). Deterministic.
3. Full tools/validate-data.mjs: schema checks; every constant has provenance real|scaled|game; allowed effect keys only (SPEC 6.2); the trade-off rule (every emergency option has a non-empty cost or successBlind below 1); all strings keys referenced exist; codex fields present; no string over 20 words per sentence group (warn only). Add a --report flag that writes docs/DATA_PROVENANCE.md grouped by provenance.
4. Tests: rng determinism and distribution sanity, validator accepts good data and rejects bad fixtures.

Verify: npm test, npm run validate, npm run validate -- --report. Do not write engine logic beyond rng.js.
Finish: update PROGRESS.md and CHANGELOG.md, list any gaps you logged in DECISIONS.md, suggest a commit message.
```

#### Phase 2: Engine Core

```text
Read .github/copilot-instructions.md and docs/SPEC.md sections 2, 6.1, 7 and 12. Implement Phase 2 only: the pure engine core without schedules, weather events or emergencies.

Tasks:
1. js/engine/mission.js: createMission(options, data) building a valid GameState exactly as SPEC 6.1 (empty schedule for now), difficulty and mode handling, mission code.
2. jobs.js (availability, autoAssign per SPEC 2.3), resources.js (power, air, dust, Air Maker, shield blocks and layers, dose, bands: SPEC 2.5 and 2.7), crew.js (Wellbeing update, Medic Care, resting), sol.js (submitPlan steps 1-3, closeSol steps 5-8, advanceSol; emergency hook left as a clearly marked TODO for Phase 3), project.js (projectSols), score.js (computeScore, stars), index.js exporting the API in SPEC 7.
3. Everything is pure: clone state, mutate the clone, return { state, events }. Read all numbers from data.constants, never hard-code.
4. Unit tests using these hand-calculated vectors (Astronaut, window C fixture, no weather):
   a. Plan [rest, rest, rest], Air Maker ON, dust 0, start 80 power 85 air: power 98, air 90, Air Maker health 96, dust 5, every crew Wellbeing 100.
   b. Plan [science, science, science]: auto-assign gives one walk each; science points 15+10+10 = 35; each crew dose is 1+2 = 3; Wellbeing 100 becomes 91 for each.
   c. Plan [build, build, build]: blocks 3+2+2 = 7, so 1 layer.
   d. Brownout: set power 5 and dust 70; Air Maker pauses, an event is emitted, air only drops by 9.
   e. Invariants hold over 1000 random plans: power in 0..cap, air 0..100, dust 0..70, Wellbeing integers 0..100, layers at most 3.
   f. Same seed and same plans give identical states (determinism); the input state is never mutated.

Verify: npm test and npm run validate all green. Report the test vectors and results.
Finish: update PROGRESS.md, CHANGELOG.md, DECISIONS.md and suggest a commit message.
```

#### Phase 3: Weather, Emergencies, Communication Delay, Balance Harness

```text
Read .github/copilot-instructions.md and docs/SPEC.md sections 2.7, 3, 4, 6.1, 12. Implement Phase 3 only. Use small fixture files in tests/fixtures/ for DONKI-style storms and delay arrays (do not call any network).

Tasks:
1. js/engine/schedule.js: buildSchedule exactly as SPEC 3.3 (storms from window data, game practice storm for Cadet, dust storms with seeded jitter, emergency bands and types, delayBySol). Classroom and Training schedules come from classroom.json and training.json.
2. js/engine/briefing.js: getBriefing with forecast rules and daily tip rules from SPEC 3.2.
3. Weather in sol.js: dust storm sunFactor and double dust, storm dose, Storm Shelter (1 slot, Science Walk disabled), slotPenaltyNextSol, forcedAirMakerOff, batteryCap.
4. js/engine/comms.js and emergency.js: the Emergency Clock exactly as SPEC 4.2 and 4.3 (Ask Earth, advised vs blind chance, tier modifiers, deadline Auto-Safe Mode, damage per minute, effects keys). Wire into submitPlan and closeSol. Also export emergencyForceDeadline(state, data) for development and testing; log it in DECISIONS.md.
5. Tests: the worked example in SPEC 4.5; Ask Earth disabled when too slow; every option of every emergency resolvable; deadline path; schedule determinism and fairness (no emergency within 1 sol of a storm); trade-off rule over all data.
6. tools/bots.mjs and tools/balance.mjs: bots Balanced, GreedyScience, Lazy, Random as SPEC 12.4 describes; balance.mjs runs 200 seeds per bot per tier and prints completion rate, average stars and average final Wellbeing.

Verify: npm test, npm run validate, npm run balance. Report the balance table. If targets in SPEC 12.4 are missed, tune ONLY data/game constants and difficulty values, log every change and reason in DECISIONS.md, and rerun.
Finish: PROGRESS.md, CHANGELOG.md, commit message.
```

#### Phase 4: NASA Data Tools and Real Data Files

```text
Read .github/copilot-instructions.md and docs/SPEC.md section 5 completely. Implement Phase 4 only.

Tasks:
1. tools/lib/mapStorms.mjs: the pure mapping in SPEC 5.4. tools/lib/parseHorizons.mjs: parse the JSON result text between $$SOE and $$EOE into numbers.
2. tools/fetch-donki.mjs and tools/fetch-horizons.mjs and tools/build-windows.mjs exactly as SPEC 5.3. Read NASA_API_KEY from the environment (fall back to DEMO_KEY with a warning), polite delays, retries, raw-response cache in tools/.cache. Never write the key to any file.
3. Unit tests for mapStorms and parseHorizons using small hand-made fixtures that copy the real response SHAPE (check the live shape first and adapt the parser if field names differ; log differences in DECISIONS.md).
4. Extend tools/validate-data.mjs: data/real files must have _meta with source, retrievedAt and provenance real; delay arrays length 30 with values between 1 and 30; donki-A and donki-B must contain at least 3 storms; donki-C may have 0.
5. Run npm run data:build to fetch windows A, B and C and write data/real/donki-*.json and data/real/delay-*.json. NEVER fabricate or hand-edit these files. If the network or the API is blocked, stop, explain, and give me the exact command to run myself.
6. Print a human-readable summary (storms per window with date, flare class, severity; delay min, max, average) for the team to review. If A or B has fewer than 3 storms, or window C looks unsuitable, report it and do NOT change windows without asking.

Verify: npm test, npm run validate.
Finish: PROGRESS.md, CHANGELOG.md, DECISIONS.md (include the summary table) and a commit message.
```

#### Phase 5: UI Foundation and Playable Command Loop

```text
Read .github/copilot-instructions.md and docs/SPEC.md sections 6.3, 7 and 8 (all). Implement Phase 5 only: a fully playable 30-sol game for desktop and mobile, with emergencies shown by a simple placeholder screen.

Tasks:
1. js/app: dataLoader.js (fetch all data/game and data/real JSON, show a friendly error if loading fails), router.js (show(screenId, props) with focus management), store.js (state plus subscribe), settings.js and save.js (localStorage, schema check, 3 checkpoints per SPEC 6.3), i18n.js, a11y.js (live region helper).
2. CSS: tokens, base, layout (mobile single column with bottom tabs Base, Plan, Log; desktop 3 columns), components, screens. Mobile first, working at 360 px.
3. Screens: title, select, command (TopBar, MeterStrip with projections, CrewRow, simple SVG Base View with hotspots and sheets, Briefing Card, Job Tray with auto-assignment and crew chips, Air Maker and Shield switches, Auto-pick, Start Sol with previewPlan estimate), and a plain evening screen (meter changes list and Next Sol).
4. Components: meter, crewCard, jobCard, badge (real, scaled, game), sheet, toast.
5. Connect everything to engine submitPlan, closeSol, advanceSol. Autosave at every sol start.
6. Emergency placeholder: show the emergency title and a button "Continue (Phase 6 will add this screen)" that calls emergencyForceDeadline.
7. Use textContent or DOM helpers, not innerHTML with dynamic text. All text from strings.

Verify: npm test, npm run validate, play a complete Cadet mission and a Commander mission in the browser, note any bugs fixed. Check 360 px and 1280 px widths.
Finish: PROGRESS.md, CHANGELOG.md, commit message.
```

#### Phase 6: Playback, Emergency Screen, Reports, Save and Rewind

```text
Read .github/copilot-instructions.md and docs/SPEC.md sections 4, 6.3 and 8.5 to 8.7. Implement Phase 6 only.

Tasks:
1. Playback screen (max 6 s, Skip button, reduced-motion instant summary, live-region announcements) with per-job captions and animated meter changes with plain-language reasons.
2. Real Emergency screen exactly as SPEC 8.6: clock bar, Earth distance pill with NASA DATA badge, damage counter, option cards with time, risk icon, cost and trade-off sentence, Ask Earth with a signal-pulse animation and a disabled state with the "too far away" explanation, result cards, lesson card, Codex unlock hook. Replace the Phase 5 placeholder.
3. Evening Report: meter table, up to 3 cause cards in the exact format "You chose X, Y happened, but Z" generated from engine events, crew changes, Space Fact with badge, Next Sol.
4. Mission Paused screen with Rewind 3 sols, Rewind 1 sol and See Report, using engine rewind and the checkpoints. Continue button on the title screen restores the autosave.
5. Sol-30 completion flow goes to a basic Mission Report page (full report comes in Phase 7).
6. Explainer sheets for each meter and crew member showing + and - contributions for today.

Verify: npm test; play through all four emergencies using different options and Ask Earth; test an emergency deadline; test pause and rewind; test reload mid-sol resumes correctly.
Finish: PROGRESS.md, CHANGELOG.md, commit message.
```

#### Phase 7: Learning Layer

```text
Read .github/copilot-instructions.md and docs/SPEC.md sections 1, 5.6, 5.7, 8.7, 8.8 and 8.9. Implement Phase 7 only.

Tasks:
1. Training Mission (3 scripted sols from data/game/training.json) with coach overlays (highlight, tooltip, Next), practice events badged GAME, completion badge saved locally, and Mission Select pre-selecting Training for first-time players.
2. Codex screen with unlocks from engine fact_unlocked events, silhouettes for locked cards, filter chips, detail view with provenance badge, source name and link, and Read Aloud. Entries with status needs-verification show a small "Being checked by the team" note.
3. Data Lab screen: month selector, 30-sol strip with real flares, CMEs and SEPs (tap for details and NASA link), real delay line chart (ui/components/chart.js, plain SVG), and the Real / Simplified / Game three-column explainer.
4. Full Mission Report per SPEC 8.7: stars, score bars, three line charts, key-choices timeline, "What was real?" panel, 3 things you learned, mission code, Play Again, Print Certificate with css/print.css.
5. speech.js Read Aloud (hidden if unsupported) wired to briefing, cards and Codex. Coach tips and daily tip for Cadet and Astronaut.
6. Fill any missing strings. Keep reading level grade 5 or lower.

Verify: npm test; npm run readability (create tools/readability.mjs: Flesch-Kincaid grade per string group, fail above grade 6 average, warn above 8 for any single string); complete Training and a full mission; print preview of the certificate.
Finish: PROGRESS.md, CHANGELOG.md, commit message.
```

#### Phase 8: Polish and Accessibility

```text
Read .github/copilot-instructions.md and docs/SPEC.md section 8 (all) and 12.6. Implement Phase 8 only: polish, no new game rules.

Tasks:
1. Redraw the Base View as a clear friendly SVG cutaway with dust haze, shield layers, lit lamps, storm shelter glow and crew sprites. Create SVG avatars for Amara, Kenji and Luz and a simple OUTPOST logo (no NASA marks).
2. Subtle animations (meter fills, signal pulse, storm flash-free overlay), all disabled by reduced motion.
3. js/app/audio.js: WebAudio synthesized tones for tap, alert, success, off by default, no autoplay.
4. Settings screen: text size, high contrast (data-contrast attribute), reduce motion, sound, auto Read Aloud, coach tips, reset save with confirmation.
5. Accessibility pass: keyboard-only play, focus order, focus trap in sheets, aria labels and role meter, live regions, colour-only cues removed, 200 percent zoom and 360 px checks, touch targets at least 48 px.
6. Performance pass: total first load under 500 KB, no layout thrash, lazy-render charts.
7. Error handling: friendly messages for data load failure, corrupt save, unsupported browser.

Verify: npm test; list what you checked manually; run Chrome Lighthouse (accessibility, performance) if available and report scores; fix anything under 95 accessibility.
Finish: PROGRESS.md, CHANGELOG.md, commit message.
```

#### Phase 9: QA, Balance, Documentation, Submission

```text
Read .github/copilot-instructions.md and docs/SPEC.md sections 1.1, 5.9 and 12. Implement Phase 9 only.

Tasks:
1. Run npm run balance for all tiers and bots. Meet every target in SPEC 12.4 by tuning data/game values only. Log each change in DECISIONS.md. Re-run all tests.
2. Write docs/TEST_PLAN.md from SPEC 12 with a results table to fill. Add tests/browser/smoke.html (in-browser self-test page that loads data, runs a deterministic 30-sol bot mission and reports pass or fail).
3. Add a release gate to tools/validate-data.mjs: with the flag --release, fail if any Codex entry marked real or scaled lacks sourceName, sourceUrl, verifiedBy and verifiedDate, or if any [VERIFY] marker remains in strings or data.
4. Documentation: README (screenshots placeholders, how to play, how data is used and labelled, tech, AI disclosure, license, credits), docs/TEACHER_GUIDE.md (one page: learning goals, 10-sol classroom plan, discussion questions on light delay and trade-offs), docs/CREDITS.md, docs/AI_DISCLOSURE.md (what AI did, what humans reviewed), docs/SUBMISSION.md (200-word summary, 2-minute video script with shot list, 5 judging-criteria talking points, list of NASA data used).
5. Check there are no runtime network requests to other origins (search the code; describe your method) and no console errors.
6. Produce a final checklist table of SPEC 12.7 (Definition of Done) with pass, fail or needs-human for each line.

Verify: npm test, npm run validate, npm run validate -- --release (expected to fail only on human-verification items; list them).
Finish: PROGRESS.md, CHANGELOG.md, commit message.
```

### 11.3 Human-Only Tasks (AI cannot do these)

| When | Task |
| --- | --- |
| Before Phase 4 | Create a free NASA API key at api.nasa.gov and set `NASA_API_KEY` locally (never commit it) |
| After Phase 4 | Review the storm and delay summary. Confirm the windows are interesting and honest |
| Phases 7–9 | Verify every Codex fact against NASA sources and fill `sourceUrl`, `verifiedBy`, `verifiedDate` |
| Phase 8–9 | Test on a real phone and tablet. Run the kid playtest (section 12.6) |
| Phase 9 | Re-read the official challenge page; tick section 1.1; record the demo video; fill the submission portal |

## 12. Testing and Verification Plan

### 12.1 Automated Tests (`npm test`, `node:test`)

- **Formulas**: the hand-calculated vectors in Phase 2, plus one per job, per emergency effect and per band.
- **Invariants**: bounds hold over thousands of random plans on all tiers.
- **Determinism**: same seed and plans → byte-identical state; input state never mutated.
- **Schedule**: counts, bands, spacing, injury victim rule, Cadet practice storm flagged game.
- **Emergency Clock**: worked example, Ask Earth disabled when too slow, every option path, deadline path.
- **Data**: trade-off rule on all options; effect keys allowed; every string key exists; provenance present everywhere.
- **NASA tools**: `mapStorms` and `parseHorizons` on fixtures, including empty windows and missing fields.
- **Save**: round trip, corrupt JSON, old schema, rewind.

### 12.2 Data Validation (`npm run validate`)

Schema checks, provenance, trade-offs, real-data `_meta`, delay array length 30 and plausible range, storm counts (A and B at least 3), `--report` regenerates `docs/DATA_PROVENANCE.md`, `--release` enforces Codex verification.

### 12.3 Content Checks

`npm run readability`: average Flesch-Kincaid grade ≤ 6 across strings, no single bubble above grade 8, no sentence above 20 words. Manual check of tone: no death or violence language.

### 12.4 Balance Targets (200 seeds per bot per tier; tune constants only)

| Bot | Behavior | Target |
| --- | --- | --- |
| Balanced | Cleans at dust > 35, maintains at health < 60, builds shield to 2 layers, rests when any Wellbeing < 60 else Science Walk, shelters on storms ≥ 3, uses Ask Earth when it fits the clock, else best blind option | Cadet: ≥ 98% complete. Astronaut: ≥ 90% complete, average ≥ 3★. Commander: 60–85% complete |
| GreedyScience | 3 Science Walks every sol | Pauses before sol 30 in ≥ 80% of Astronaut seeds |
| Lazy | 3 Rest every sol, never cleans | Pauses or ≤ 2★ in ≥ 80% of Astronaut seeds |
| Random | Random legal plans | 10–60% complete on Astronaut |

Also: do-nothing power must hit 0 between sol 12 and 22 on Astronaut. Ask Earth must be the better choice in at least one emergency and a worse choice in at least one (delay long relative to deadline), across the three windows, so the trade-off is real.

### 12.5 Manual and Device Tests

| Area | Check |
| --- | --- |
| Browsers | Chrome, Edge, Firefox (desktop), Safari (iOS 16+), Chrome (Android) |
| Viewports | 360×640, 768×1024, 1280×800; 200% zoom |
| Input | Touch only, keyboard only, mouse only |
| Flows | Training → Cadet full mission → report → certificate; pause and rewind; reload mid-sol; Classroom mission |
| Offline/Privacy | DevTools Network tab shows only same-origin requests; no cookies; saves stay in localStorage |
| Accessibility | Lighthouse accessibility ≥ 95, WCAG AA contrast, screen-reader pass on one screen, reduced motion honored |
| Performance | Lighthouse performance ≥ 90 on mobile profile, first load < 500 KB |

### 12.6 Child Playtest Protocol

Test with at least 5 children aged 7–12 (or classroom volunteers) with a parent or teacher present; collect **no personal data**; ask permission first. Give no instructions except "Try to keep your crew safe." Observe and note: where they hesitate, what they misread, what they tap first. After Training ask: "Why did Earth's answer take so long?" and "What did you give up when you chose Shelter?" Targets: ≥ 80% finish Training without adult help; ≥ 70% can explain the delay; ≥ 70% can name one trade-off; average session under 30 minutes for a full mission. Log fixes in `docs/DECISIONS.md`.

### 12.7 Definition of Done

- [ ] All automated tests and validators pass in CI on `main`; GitHub Pages URL is live and works on phone and desktop.
- [ ] Balance targets met.
- [ ] Full Training, Classroom and Full Missions playable start to finish with no console errors.
- [ ] Two real NASA datasets (DONKI and JPL Horizons) are committed, credited, and visible in the Data Lab.
- [ ] Every number and fact is labelled real, scaled or game; "What was real?" appears in the Mission Report.
- [ ] Communication delay changes decisions in emergencies (verified by balance rule in 12.4).
- [ ] Every decision has a visible trade-off.
- [ ] Codex `--release` validation passes (human verification complete).
- [ ] Accessibility, performance and privacy checks pass; kid playtest targets met.
- [ ] README, teacher guide, credits, AI disclosure and submission pack complete; section 1.1 checklist ticked after reading the official page.

## 13. Your Exact First Step

**Before pasting anything:**

1. Create a GitHub repository named `outpost` (public, no template). Clone it and open it in VS Code with GitHub Copilot Chat available.
2. Export this document as Markdown and save it as `docs/SPEC.md`.
3. Create `.github/copilot-instructions.md` and paste the contents of the code block in section 10 (without the outer fence lines).
4. Commit and push these two files.
5. Open Copilot Chat, switch to **Agent** mode, start a new chat, and paste the Phase 0 prompt from section 11.2 (the first prompt there).

When Phase 0 finishes, enable Pages (Settings, Pages, Deploy from a branch, `main`, `/ (root)`), confirm the live URL, then continue with Phase 1.
