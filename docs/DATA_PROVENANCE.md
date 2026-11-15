# Data Provenance

OUTPOST uses real NASA data alongside simplified educational and gameplay models.

## 1. NASA data sources

### NASA DONKI — Space Weather

**Provider:** NASA Community Coordinated Modeling Center (CCMC)

**Official resource:** https://ccmc.gsfc.nasa.gov/tools/DONKI/

OUTPOST includes archived space-weather event records retrieved from NASA DONKI for three historical periods:

- September 1–30, 2017
- May 1–30, 2024
- June 1–30, 2019

The downloaded records include:

- Solar flares (FLR)
- Coronal Mass Ejections (CME)
- Solar Energetic Particles (SEP)

The corresponding local datasets are:

- `data/real/donki-A.json`
- `data/real/donki-B.json`
- `data/real/donki-C.json`

The original query URLs and retrieval timestamps are recorded in each dataset's `_meta` field.

**API documentation:** https://ccmc.gsfc.nasa.gov/tools/API/

### NASA/JPL Horizons — Earth–Mars Communication Delay

**Provider:** NASA Jet Propulsion Laboratory

**Official resource:** https://ssd.jpl.nasa.gov/horizons/

OUTPOST uses Horizons observer ephemeris data to represent changing one-way light-travel time between Earth and Mars.

Three historical periods are included:

- September 1–30, 2017
- May 1–30, 2024
- June 1–30, 2019

The corresponding local datasets are:

- `data/real/delay-A.json`
- `data/real/delay-B.json`
- `data/real/delay-C.json`

The query metadata, retrieval timestamps and requested quantity are recorded in each dataset.

**API documentation:** https://ssd-api.jpl.nasa.gov/doc/horizons.html

## 2. Simplified educational models

Some scientific concepts are represented using simplified models so that younger players can understand and interact with them.

Examples include:

- Solar power generation and dust accumulation.
- Crew air consumption and Air Maker output.
- Radiation dose reduction from shielding.
- Crew wellbeing and resource-management effects.

These values are gameplay parameters, not precise engineering predictions or real Mars habitat specifications.

## 3. Game-specific values

The following are designed for game balance rather than taken directly from NASA measurements:

- Mission duration and daily job slots.
- Starting resource levels.
- Battery capacity and machine wear.
- Shield construction requirements.
- Radiation dose bands and wellbeing penalties.
- Science points and job effects.

The values are defined in the game's configuration files under `data/game/`.

## 4. Educational Codex

The in-game Codex introduces topics including Mars gravity, communication delay, solar flares, CMEs, radiation shielding, dust storms, oxygen production and Mars orbiters.

These entries are educational summaries. Their individual source metadata has not yet been fully completed, so they should not all be described as individually verified.

## 5. Data integrity and limitations

- NASA datasets are stored locally so the game does not require live API access during play.
- Historical space-weather records are used for educational scenarios, not as current forecasts.
- Historical Earth–Mars light-time data is used to illustrate communication delay.
- Simplified game values should not be interpreted as real mission-planning figures.
- OUTPOST is an independent student project and is not an official NASA product or endorsed by NASA.

## 6. Project files

| File | Purpose |
|---|---|
| `data/real/donki-*.json` | Historical NASA space-weather records |
| `data/real/delay-*.json` | NASA/JPL light-time data |
| `data/game/` | Game configuration and educational content |
| `tools/fetch-donki.mjs` | DONKI data retrieval |
| `tools/fetch-horizons.mjs` | Horizons data retrieval |
| `tools/validate-data.mjs` | Data validation and provenance reporting |
