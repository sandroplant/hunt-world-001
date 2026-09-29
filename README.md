# hunt-world-001 — Into the Cat's Eye

**The Hunt, World 001, step 1.** A standalone browser prototype: six small places nested inside each other, searched from a fixed viewpoint with a lens, joined by dives, with wordless sketch clues.

**Prototype · non-competitive · no prize.** Local use only. No accounts, no network at runtime, no analytics.

## AI disclosure

The code, data and generated art in this repository were built by **Claude Fable 5.1** (`claude-fable-5-1`) in Claude Code on the web, under the founder's direction, starting 2026-09-29. The design documents (`DESIGN.md`, `SOLUTIONS.md`, `PLAN.md`) were written by the same model on 2026-09-29 from the founder's spec. The spec itself was written by Claude Opus 5.5 as planner. Every dependency is listed with its license in `PROVENANCE.md`. Nothing was downloaded from asset sites and no code was copied from other repositories.

## Documents

- `SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md` governs the build. `AUTHORIZATION.md` is the founder's decision.
- `DESIGN.md` is the world bible without spoilers. `SOLUTIONS.md` has the spoilers.
- `PLAN.md`, `DECISIONS.md`, `PROGRESS.md`, `PRODUCTION_LOG.md`, `PROVENANCE.md`.
- `REVIEW/screenshots/` holds screenshots. `context/` is read-only background.

## Run it

Needs Node 22 or later. Everything is pinned in `package.json` and `package-lock.json`.

```
npm ci
npm run dev             # development server on http://127.0.0.1:5173
npm run build           # production build into dist/ (debug tools available with ?debug=1)
npm run preview         # serve dist/ on http://127.0.0.1:4173
npm run build:playtest  # playtest build into dist-playtest/ with debug tools removed
npm run preview:playtest
npm test                # typecheck, lint, unit tests, build, end-to-end tests
```

For a phone on the home network: `npm run preview -- --host`. Never deploy publicly.

Query flags:

| Flag | What it does |
|---|---|
| `?perf=1` | Records frame times (real frame deltas, not JavaScript timing). Menu → "Download frame times". In every build. |
| `?test=1` | Fixes the clock and pauses ambient motion so screenshots are stable. |
| `?debug=1` | Dev builds only: jump to any place, do the next step, state inspector, FPS, `window.__hunt` hooks (including a dive freeze for the seam check). Not in the playtest build. |

The session log for observers is off by default. Turn it on in the menu at the start; "Save session log" downloads a JSON file. Nothing is sent anywhere.

## Controls

| Action | Phone | Laptop mouse | Keyboard only |
|---|---|---|---|
| Look around (full turn) | drag | drag | arrow keys |
| Move to a spot | tap its ring on the ground | click its ring | W A S D toward it, or E on it |
| Zoom (lens) | pinch, or hold the lens button | scroll wheel, or hold the right button | hold Z |
| Open or use | tap when the verb shows | click | E or Enter |
| Dive | hold the lens on the opening, or tap it | same | hold Z on it, or Enter |
| Back out | Back button | Back button or Esc | X or Backspace |
| Sketchbook | book button | book button | B |
| Hints | ? button | ? button | H |
| Describe surroundings | menu | menu | V |

Tab is never a game key. The dive is one continuous move through the opening into the next place and takes the same time on every device. Reduced motion (in the menu) replaces it with a cross-fade of the same total length. The session log and frame times are copied to the clipboard from the menu ("Copy log", "Copy frame times").

## Layout

```
src/world/    DATA ONLY (JSON): places, objects, props, sketches, hints, strings, answers
src/game/     rules engine, the judge (reads only answers.json), state, save, recorders
src/gen/      the sketch renderer (draws sketches from the world itself)
src/render/   scene builder, renderer, quality tiers, the dive
src/player/   viewpoint camera, lens, input
src/ui/       HUD, panels, styles
src/audio/    procedural WebAudio
src/debug/    dev-only debug tools
tests/unit/   Vitest      tests/e2e/   Playwright      tools/   screenshots.mjs and seam.mjs (dive hand-over check)
```

Trust rules (spec §6): every "is this found?" decision goes through `src/game/judge.ts`, which reads only `src/world/answers.json`. That file is marked to move server-side before any prize hunt. The renderer and the UI never decide a find.
