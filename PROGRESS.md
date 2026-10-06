# PROGRESS.md — resume here

**Last updated:** 2026-10-06, end of the fifth round (street and shop as a small complete game).
**Current stop:** the fifth STOP. The playtest build is the street and the curiosity shop, ending at the blue drawer with "To be continued" (`DECISIONS.md` D-011). Next: 3 to 5 strangers play it.

## What exists
- **A small complete game for the playtest (D-011).** The street and the shop; the dive into the open blue drawer ends the playtest with a short screen: "To be continued", the time, the finds ("N of 12") and the hints used; "Keep looking" goes back to the shop. Places 3 to 6 are in the data and on the dev build, but nothing of them loads on the playtest build (the drawer shows a warm light, not the next place).
- **Always on screen:** the next main-path goal as a small drawing in the bottom-right card (tap, click, or Tab then Enter: opens the sketchbook), and "N of 12 found" under the top-right buttons (also opens the sketchbook).
- **Twelve optional finds**, six in each place (6 easy, 4 medium, 2 hard). A find plays a sound and flies into the sketchbook button; the counter ticks up.
- **One look.** The shop is dressed with the eight Poly Haven models (low chest of drawers holding the blue drawer, grandfather clock, display shelves, two worn bookshelves with books on their shelves, two wooden tables, the tea set, the mantel clock, the oil lamp), warm lamp light and a dusk window. Everything the pack has no model for is a code-made, textured object (`src/render/kit/`, 37 builders). No flat placeholder shape is left in the street or the shop; the key is polished brass beside the lamp.
- **Download:** 12.5 MB for both places (512 px textures and models, 1k HDRI; `tools/download_size.mjs`).
- **Seam:** street→shop 0.85, shop→drawer 0.71 (`node tools/seam.mjs --only=street,shop`; the dev build keeps the real drawer place behind the opening).
- Tests: 192 unit tests pass. End-to-end on the final build: the mouse run (960×600) and the touch run (390×844) go from Begin to "To be continued" with real input on the playtest build, through the goal card, the key, one find (counter 0 → 1 of 12) and the blue drawer; the panels test and all 8 dev-build tests pass. **Failing: both keyboard tests** (the new keyboard run to the ending never got past the key; the place-1 keyboard run passed once this round and timed out on the last run). See D-011 "Testing" and "Not proven".
- Screenshots in `REVIEW/screenshots/round5/`: street arrival, the shop from the door (high tier, and the low tier from the mouse test), the blue drawer shut and open, the ending screen, phone frames (390×844).
- Everything from the earlier rounds: the six-place chain on the dev build, free walking, the dive and its seam check, sketches, hints, save and restart, touch, mouse and keyboard, quality tiers, recorders, dev-only debug tools.

## How to run
```
npm ci
npm run build && npm run preview     # http://127.0.0.1:4173  (add ?debug=1 for the debug panel)
npm run build:playtest && npm run preview:playtest   # http://127.0.0.1:4174, debug removed
npm test                             # everything; needs both builds
npm run test:playtest                # only the real-input tests on the playtest build
node tools/seam.mjs [--only=street,shop]   # measures the dive hand-over (needs `npm run build`)
node tools/download_size.mjs         # what the playtest build downloads (needs `npm run build:playtest`)
node tools/round5_shots.mjs <dir>    # round-5 look-check screenshots through the dev hooks (dev server, port 4195)
node tools/kit_shots.mjs <png> "name:WxHxD,..."   # preview code-made kit objects
node tools/resize_assets.mjs         # makes the 512 px textures and models from the 1k originals
node tools/style_shots.mjs [--phone] [--low]   # style-frame screenshots, download size, headless frame times
node tools/puzzle_chart.mjs          # redraws REVIEW/puzzle_chart.svg/.png
```

## How to resume in a new session
1. Read `SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md` completely. It governs.
2. Read this file, `DECISIONS.md` (D-006 to D-011 hold the founder's decisions), `PLAN.md`, then `DESIGN.md`. Read `SOLUTIONS.md` (with §12 to §16) when building or auditing.
3. Read the playtest notes the founder brings back from the strangers' sessions. D-011 holds this round. Under D-009 rule 2, anything new must be reached by a real-input test on the playtest build before it is called working.
4. Add a row to `PRODUCTION_LOG.md` at the start of the session and update it as you go.

## Known gaps and notes
- Places 3 to 6 are still graybox and are not in the playtest. On the dev build they still work (hook-driven route test).
- The playtest's drawer shows a warm light instead of the drawer place's live picture; the dev build keeps the live picture so the chain's seam stays measured.
- The dive hand-over is measured, not guessed: `tools/seam.mjs` prints a mean per-channel difference (0–255) between the frame just before and just after the hand-over. Values under about 4 are texture resampling.
- Frame numbers here are headless on a software renderer ("headless, indicative only"). A phone frame rate is still unmeasured; phones pick the low tier (no shadows, three quarters of the pixels).
- The 60 s rule for place 1 is asserted only at device speed; here the real-input tests print the seconds instead.
- Cost is not visible from inside the session; the founder's credit balance goes in `PRODUCTION_LOG.md`.
- The container cannot download from asset sites (proxy 403). Assets come through the founder or the build lead (see `public/assets/polyhaven/PROVENANCE.md`); the 512 px files are derived from them here.
