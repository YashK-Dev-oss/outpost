# OUTPOST

**An interactive Mars survival mission trainer by Team HORIZON.**

OUTPOST is a browser-based Mars outpost survival game created for the **NASA Space Apps Challenge 2026**. Players take command of a three-person crew and manage a developing Mars outpost across a 30-sol mission.

Your decisions determine whether the crew and their outpost can survive the challenges of the Martian environment.

## Gameplay

- **Manage resources:** Balance power, oxygen and radiation shielding to keep the outpost operational.
- **Assign crew jobs:** Direct three crew members to different tasks and manage their wellbeing.
- **Experience a living outpost:** Watch the crew move around the base as the Martian day progresses through morning, midday and afternoon.
- **Respond to emergencies:** Make decisions during unexpected events, weighing risks and resource costs.
- **Adapt to Martian conditions:** Deal with environmental changes and space-weather events.
- **Review your progress:** Examine sol reports, mission outcomes and resource changes.
- **Continue your mission:** Use the save and continue functionality to return to your progress.

## How to play

1. Start a new mission.
2. Review your crew, resources and mission conditions.
3. Assign jobs to your crew for each sol.
4. Monitor the outpost as the day progresses.
5. Respond to emergencies and unexpected events.
6. Review your Sol Report and prepare for the next day.
7. Try to keep your crew and outpost operational for all 30 sols.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run serve
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

Run the automated tests:

```bash
npm test
```

Validate the game data:

```bash
npm run validate
```

## Technology

OUTPOST is built using:

- HTML
- CSS
- JavaScript (ES modules)
- Node.js development and validation tools
- Inline SVG for the outpost environment

The project is designed to run as a static website without paid APIs or hosting dependencies.

## Data and resources

OUTPOST uses NASA-related resources for its space-weather and planetary-data context:

- **NASA DONKI (CCMC):** Space-weather event information.
- **NASA/JPL Horizons System:** Solar system and planetary data.

See [DATA_PROVENANCE.md](docs/DATA_PROVENANCE.md) for the project's data provenance and verification notes.

## AI disclosure

AI tools assisted with portions of the source code and documentation during development. The project was reviewed and tested by the student team.

See [AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md) for further details.

## Project team

**Team HORIZON**

Created for the NASA Space Apps Challenge 2026.

OUTPOST is an independent student project. It is not an official NASA product and is not endorsed by NASA.
