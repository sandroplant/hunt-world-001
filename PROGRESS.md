# PROGRESS.md — resume here

**Last updated:** 2026-09-29, end of the redesign round after Gate A.
**Current stop:** the second STOP A. The founder decided "redesign once" at Gate A (`DECISIONS.md` D-008) and listed eight changes. All eight are built. Waiting for the founder to play again. The next round after that is one street style frame, not the full art pass.

## What exists
- A playable graybox of the whole chain with the redesign: full 360° turning; four stand spots per place, moved by tapping a ring, E on it, or W A S D; live openings (portals) that show the next place inside its dive target before the dive; a continuous dive through the opening with a measured hand-over (see `tools/seam.mjs`); a keyhole mark and rattle on locked things; a one-time glint after 45 s idle; a plain trail at the top (reached places by name, the rest as dots); "Copy log" and "Copy frame times" instead of downloads.
- Everything from Phase A still: six places, the ending, six sketches, twelve hidden objects (now findable from any spot), ten required steps, 148 ordinary usable things, hints, sketchbook, save and restart, touch, mouse and keyboard, reduced motion, large text, quality tiers, describe, procedural sounds, session log, frame recorder, test mode, dev-only debug tools.
- Tests: 105 unit tests, 9 end-to-end tests. `npm test` runs typecheck, lint, unit tests, the build and the end-to-end tests.
- Screenshots in `REVIEW/screenshots/graybox/`; hand-over frames in `REVIEW/screenshots/seam/`.

## How to run
```
npm ci
npm run build && npm run preview     # http://127.0.0.1:4173  (add ?debug=1 for the debug panel)
npm run build:playtest && npm run preview:playtest   # http://127.0.0.1:4174, debug removed
npm test
node tools/seam.mjs                  # measures the dive hand-over on all six dives
```

## How to resume in a new session
1. Read `SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md` completely. It governs.
2. Read this file, `DECISIONS.md` (D-006 to D-008 hold the founder's decisions), `PLAN.md`, then `DESIGN.md`. Read `SOLUTIONS.md` (with §12 and §13) when building or auditing.
3. Check the founder's decision after the second Gate A play. On a go, the next round is a single street style frame (spec §7 style frames start with the street).
4. Add a row to `PRODUCTION_LOG.md` at the start of the session and update it as you go.

## Known gaps and notes
- Art is graybox: flat colours, plain shapes. The openings show the real next place, also in graybox.
- The dive hand-over is measured, not guessed: `tools/seam.mjs` prints a mean per-channel difference (0–255) between the frame just before and just after the hand-over. Values under about 4 are texture resampling; anything larger means something sits in front of the opening.
- Frame numbers here are headless on a software renderer ("headless, indicative only").
- End-of-Phase-B checks (18 canonical screenshots, full-chain keyboard run, headed frame capture, leak test, clean-clone rebuild) belong to Phase B2.
- Cost is not visible from inside the session; the founder's credit balance goes in `PRODUCTION_LOG.md`.
