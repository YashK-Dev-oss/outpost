# Test Plan

## Automated

- Run `npm test` for deterministic engine, schedule, emergency, save, and data tests.
- Run `npm run validate` for schemas, provenance, references, and real-data windows.
- Run `npm run readability` for short, child-friendly strings.
- Run `npm run validate -- --release` only after a human verifies every Codex source.

## Manual release checks

Test Chrome, Edge, Firefox, Safari iOS, and Android at 360px, 768px, and 1280px.
Use keyboard, touch, and mouse. Check reduced motion, high contrast, 200% zoom,
offline reload, save recovery, training, a full mission, rewind, and printing.
Confirm no third-party requests, cookies, or console errors.
