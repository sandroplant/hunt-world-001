# PROGRESS.md — resume here

**Last updated:** 2026-09-29, end of Phase A (graybox).
**Current stop:** STOP A (Gate A). Waiting for the founder to play the grey version for 15 minutes and for 3–5 strangers to play it. The founder decides: go, redesign once, or stop (spec §11, §13 S1). Phase B1 starts only on "Go B1".

## What exists
- A playable graybox of the whole chain: six places, the ending, all six dives and back-outs, six sketches, twelve hidden objects, ten required steps, 148 ordinary usable things, hints (three levels each), the depth ribbon, the sketchbook with held-up sketches and "getting warm", the pocket, save and restart, touch, mouse and keyboard, reduced motion, large text, quality tiers, "Describe surroundings", procedural sounds with captions, the session log, the frame recorder, test mode, and dev-only debug tools.
- Data in `src/world/` (7 JSON files). The judge in `src/game/judge.ts` reads only `answers.json`.
- Tests: 92 unit tests (Vitest) and 7 end-to-end tests (Playwright). `npm test` runs typecheck, lint, unit tests, the build and the end-to-end tests.
- Screenshots of every place in `REVIEW/screenshots/graybox/`.
- `README.md` (how to run, controls, AI disclosure), `PROVENANCE.md` (every dependency with its license), `DECISIONS.md` D-001 to D-007.

## How to run
```
npm ci
npm run build && npm run preview     # http://127.0.0.1:4173  (add ?debug=1 for the debug panel)
npm run build:playtest && npm run preview:playtest   # http://127.0.0.1:4174, debug removed
npm test
```

## How to resume in a new session
1. Read `SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md` completely. It governs.
2. Read this file, `PLAN.md`, `DECISIONS.md`, then `DESIGN.md`. Read `SOLUTIONS.md` (with its §12 tuning log) when building or auditing.
3. Check the founder's Gate A decision. On "Go B1": make the three style frames (spec §7) and stop at STOP B1.
4. Add a row to `PRODUCTION_LOG.md` at the start of the session and update it as you go.

## Known gaps and notes for Gate A
- Art is graybox: flat colours, plain shapes, no textures. Sketches are line renders of those shapes.
- Frame numbers measured here are headless on a software renderer ("headless, indicative only"). The founder measures on real devices.
- The end-of-Phase-B checks (18 canonical screenshots, keyboard-only full chain, headed frame capture, leak test, clean-clone rebuild) are not done yet; they belong to Phase B2. A keyboard run of place 1 and a back-out round trip are tested now.
- The playtest build strips the debug panel and the `window.__hunt` hooks. Empty method shells remain in the bundle; they do nothing.
- Cost for Phase A is not visible from inside the session; the founder reads it from the usage view.
