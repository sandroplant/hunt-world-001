# PROGRESS.md — resume here

**Last updated:** 2026-09-29, end of the third round (free walking, the teaching street, real-input proof).
**Current stop:** the third STOP A. After the founder's second play (`DECISIONS.md` D-009) seven changes were asked for; all seven are done. Waiting for the founder to play again. The founder's earlier note stands: the next round after a go is one street style frame, not the full art pass.

## What exists
- A playable graybox of the whole chain with free walking: tap the ground or hold W A S D; walls, furniture and edges block (`src/game/walk.ts`, derived from the world data); full 360° turning; live openings that show the next place inside its dive target, with a glowing rim on the one you can enter; a continuous dive through the opening with a measured hand-over (`tools/seam.mjs`); a keyhole mark and rattle on locked things; a one-time glint after 45 s idle; a plain trail at the top; "Copy log" and "Copy frame times".
- The street is a teaching place: the shop door is open from the start, the lit shop and the cat on its counter show inside, six ordinary things only. The key-and-lock puzzle is in the shop (key on the counter, locked blue drawer).
- The start screen shows three pictures with a few words: drag to look, tap the ground to walk, hold the lens on a glowing opening. The same three sit in the view until each is done once.
- Everything from Phase A still: six places, the ending, six sketches, twelve hidden objects (judged by position and line of sight), nine required steps, hints, sketchbook, save and restart, touch, mouse and keyboard, reduced motion, large text, quality tiers, describe, procedural sounds, session log, frame recorder, test mode, dev-only debug tools.
- Tests: 150 unit tests; 11 end-to-end tests, of which 4 run on the playtest build with real mouse, touch or keyboard input and no hooks (`tests/e2e/*.playtest.spec.ts`). `npm test` runs typecheck, lint, unit tests, both builds and all end-to-end tests.
- Screenshots in `REVIEW/screenshots/graybox/`; hand-over frames in `REVIEW/screenshots/seam/`.

## How to run
```
npm ci
npm run build && npm run preview     # http://127.0.0.1:4173  (add ?debug=1 for the debug panel)
npm run build:playtest && npm run preview:playtest   # http://127.0.0.1:4174, debug removed
npm test                             # everything; needs both builds
npm run test:playtest                # only the real-input tests on the playtest build
node tools/seam.mjs                  # measures the dive hand-over on all six dives
```

## How to resume in a new session
1. Read `SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md` completely. It governs.
2. Read this file, `DECISIONS.md` (D-006 to D-009 hold the founder's decisions), `PLAN.md`, then `DESIGN.md`. Read `SOLUTIONS.md` (with §12 to §14) when building or auditing.
3. Check the founder's decision after the third play. On a go, the next round is a single street style frame (spec §7 style frames start with the street). Under D-009 rule 2, anything new must be reached by a real-input test on the playtest build before it is called working.
4. Add a row to `PRODUCTION_LOG.md` at the start of the session and update it as you go.

## Known gaps and notes
- Art is graybox: flat colours, plain shapes. The openings show the real next place, also in graybox.
- The dive hand-over is measured, not guessed: `tools/seam.mjs` prints a mean per-channel difference (0–255) between the frame just before and just after the hand-over. Values under about 4 are texture resampling; anything larger means something sits in front of the opening.
- Frame numbers here are headless on a software renderer ("headless, indicative only").
- End-of-Phase-B checks (18 canonical screenshots, full-chain keyboard run, headed frame capture, leak test, clean-clone rebuild) belong to Phase B2.
- Cost is not visible from inside the session; the founder's credit balance goes in `PRODUCTION_LOG.md`.
- Places 2 to 6 are proven only by the hook-driven route test on the dev build. Under D-009 rule 2 they do not yet count as working; real-input tests for them are the next testing job.
- The container cannot download from polyhaven.com, kenney.nl or quaternius.com (proxy 403). Assets must come through the founder.
