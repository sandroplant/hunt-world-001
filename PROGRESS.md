# PROGRESS.md — resume here

**Last updated:** 2026-09-30, end of the fourth round (street style frame, guidance, dependency chart).
**Current stop:** the fourth STOP. Direction A (realistic) was chosen; the street is dressed with the CC0 Poly Haven pack (`DECISIONS.md` D-010); the sketchbook now carries a drawn current page and a stuck-player hint offer; the puzzle chart is in `REVIEW/`. Waiting for the founder's verdict on the style frame and the next place to dress (the shop, which then needs its own tone-mapped live picture).

## What exists
- **The street in a realistic dusk style** (`src/render/assets.ts`, `src/render/dressing.ts`, `look` fields in `props.json`): HDRI sky and light, sun shadows, filmic tone mapping, mist, PBR textures tiled by metres, seven built houses with frames, sills, doorsteps, gutters and lit windows, glTF models for lamps, crates, buckets, lanterns, a bench, planters, a ladder, a lifebuoy and the stall table, a reflective water plane. 37.3 MB of assets, loaded only for the street. Screenshots in `REVIEW/screenshots/style/` (desktop and phone, high and low tiers).
- **Guidance:** the sketchbook's first page is a drawing of the next main-path thing; a minute without progress pulses the book button and puts a hint button on that page; a locked thing that rattles makes the needed thing glint. Begin reads "Loading…" until the place's assets are in.
- Tests: 151 unit tests; 13 end-to-end tests, 5 of them real input on the playtest build (mouse, touch and keyboard runs of place 1, the shop with the sketchbook only, and the panels). The real-input tests run the street on the low tier and wait on frames; the 60 s rule is asserted only at device speed and printed otherwise (this container renders in software).
- `REVIEW/puzzle_chart.png` (and `.svg`): the puzzle dependency chart with ten stuck points marked. `tools/puzzle_chart.mjs` redraws it.
- A playable graybox of the whole chain with free walking: tap the ground or hold W A S D; walls, furniture and edges block (`src/game/walk.ts`, derived from the world data); full 360° turning; live openings that show the next place inside its dive target, with a glowing rim on the one you can enter; a continuous dive through the opening with a measured hand-over (`tools/seam.mjs`); a keyhole mark and rattle on locked things; a one-time glint after 45 s idle; a plain trail at the top; "Copy log" and "Copy frame times".
- The street is a teaching place: the shop door is open from the start, the lit shop and the cat on its counter show inside, six ordinary things only. The key-and-lock puzzle is in the shop (key on the counter, locked blue drawer).
- The start screen shows three pictures with a few words: drag to look, tap the ground to walk, hold the lens on a glowing opening. The same three sit in the view until each is done once.
- Everything from Phase A still: six places, the ending, six sketches, twelve hidden objects (judged by position and line of sight), nine required steps, hints, sketchbook, save and restart, touch, mouse and keyboard, reduced motion, large text, quality tiers, describe, procedural sounds, session log, frame recorder, test mode, dev-only debug tools.
- `npm test` runs typecheck, lint, unit tests, both builds and all end-to-end tests (about 20 minutes here with the street's assets).
- Screenshots in `REVIEW/screenshots/graybox/`; hand-over frames in `REVIEW/screenshots/seam/`.

## How to run
```
npm ci
npm run build && npm run preview     # http://127.0.0.1:4173  (add ?debug=1 for the debug panel)
npm run build:playtest && npm run preview:playtest   # http://127.0.0.1:4174, debug removed
npm test                             # everything; needs both builds
npm run test:playtest                # only the real-input tests on the playtest build
node tools/seam.mjs                  # measures the dive hand-over on all six dives
node tools/style_shots.mjs [--phone] [--low]   # style-frame screenshots, download size, headless frame times
node tools/puzzle_chart.mjs          # redraws REVIEW/puzzle_chart.svg/.png
```

## How to resume in a new session
1. Read `SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md` completely. It governs.
2. Read this file, `DECISIONS.md` (D-006 to D-010 hold the founder's decisions), `PLAN.md`, then `DESIGN.md`. Read `SOLUTIONS.md` (with §12 to §14) when building or auditing.
3. Check the founder's decision after the third play. On a go, the next round is a single street style frame (spec §7 style frames start with the street). Under D-009 rule 2, anything new must be reached by a real-input test on the playtest build before it is called working.
4. Add a row to `PRODUCTION_LOG.md` at the start of the session and update it as you go.

## Known gaps and notes
- Art is graybox: flat colours, plain shapes. The openings show the real next place, also in graybox.
- The dive hand-over is measured, not guessed: `tools/seam.mjs` prints a mean per-channel difference (0–255) between the frame just before and just after the hand-over. Values under about 4 are texture resampling; anything larger means something sits in front of the opening.
- Frame numbers here are headless on a software renderer ("headless, indicative only").
- End-of-Phase-B checks (18 canonical screenshots, full-chain keyboard run, headed frame capture, leak test, clean-clone rebuild) belong to Phase B2.
- Cost is not visible from inside the session; the founder's credit balance goes in `PRODUCTION_LOG.md`.
- Places 2 to 6 are proven only by the hook-driven route test on the dev build. Under D-009 rule 2 they do not yet count as working; real-input tests for them are the next testing job.
- The container cannot download from polyhaven.com, kenney.nl or quaternius.com (proxy 403). Assets come through the founder or the build lead (see `public/assets/polyhaven/PROVENANCE.md`).
- Tone mapping is per place (filmic in realistic places, none in graybox ones) so the openings' live pictures match at the hand-over. Dressing the shop next means its live picture must be tone mapped too; see D-010.
- Phone frame rate is unmeasured: only headless software numbers exist. The low tier drops shadows and antialiasing.
