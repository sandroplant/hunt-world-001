# PLAN.md — World 001, step 1: Into the Cat's Eye

**Status:** Phase A graybox built and redesigned twice, 2026-09-29 (`DECISIONS.md` D-008 free turning and openings, D-009 free walking and the teaching street). Waiting for the founder's third play. The nine proposals in §1 were accepted at STOP 0 (D-006).
**Governing spec:** `SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md`.

---

## 1. Proposed changes to spec §3, with reasons

These are proposals. Nothing here is decided until the founder says so. Each one has a fallback in `SOLUTIONS.md` if it is rejected.

1. **The key becomes a required step, not a hidden object.** In §3, place 1 lists "a tiny key on a windowsill" as a hidden object, and the required step is "the shop door, opened with the key". That breaks the beat rule "hidden objects never block the way forward". Proposal: the key is part of the required step (Take the key, Use it on the door), with its own three hints. A new hidden object replaces it: a ship in a bottle on a lit windowsill across the street. *Fallback:* keep the key as a hidden object and leave the door unlocked.

2. **Place 5 gets a real open-or-use step.** In §3, the pupil is both the "open or use" step and the dive target, so place 5 has only three finds and its required step is trivial. Proposal: the eye's wet highlight reflects the shop lamp. *Use* on that reflected lamp covers it, the highlight dims, and the pupil widens from a slit into a round dark door. Pupils widen in the dark, so it is a fair, wordless discovery. *Fallback:* the pupil widens on *Look closer*, and place 5 keeps three finds.

3. **"The tickle" in place 4 is the feather, carried from place 3.** §3 does not say what tickles the cat up close. Proposal: the feather stays in the pocket slot after the nose step, and *Use* on the ear opens the eye. This teaches carrying with one item and keeps the feather's story going. *Fallback:* ringing the bell charm opens the eye.

4. **Sketch poses include zoom, and the lock checks a zoom band.** §5 says a sketch is drawn from a stored camera pose. With no walking, a sketch made only of direction is too easy from a fixed viewpoint: the player just turns. Proposal: the pose stores zoom, and the lock needs the zoom within about ±35% *(guideline)*. Several sketches are drawn zoomed in on a detail. This makes the lens, the spec's core act, part of every find.

5. **Two viewpoints per place, marked as ordinary usable spots.** §4 allows 2–4 viewpoints "only if a place needs it". Every place needs two: §3's own sketch spots ("from beside the fish stall", "from the doorway") differ from where the player lands, and the reach rule for opening things needs a close spot. The marks are worn patches or chalk rings with the verb *Stand here*, the same affordance as everything else. No labels from a distance.

6. **The last sketchbook page shows the goal from the start.** §3 says the last page "draws itself" at the ending. Proposal: from the start, the last page shows the dark moon and its empty lamp, as the goal picture. At the end it redraws as the cat looking up at the glowing moon. Reason: E2 asks players to say the goal at 2:00; one line of text plus a picture is stronger than the line alone.

7. **Keep looking after the ending.** Hidden objects and sketches never block, so a player who finishes with 12 of 24 must be able to go back. Proposal: the end screen offers *Keep looking*, which returns to the night street; the player can back out up the chain, and everything keeps its state.

8. **Hint ladders for hidden objects too.** §5 requires three levels for required steps and sketches. The ladder is data-driven, so hidden objects get it at no extra cost. Hints are shown only when asked, so this cannot make the game easier for a player who does not ask.

9. **The moon's missing light does not glow from a distance.** §3 says "find the missing light in a crater". §5 says nothing glows from a distance. Proposal: it is a dim spark seen only when looking into the crater with the lens, and it lights up when taken.

---

## 2. Phases, stop points and estimates

Time estimates are agent sessions of roughly 2–4 hours each. **Confidence: low.** Cash per phase is unknown until the usage view is read; the hard stop is $200 total and the early-warning line is about $60 in any single phase (spec §12).

| Phase | What | Deliverables | Estimate | Stop |
|---|---|---|---|---|
| 0 | Plan | `DESIGN.md`, `SOLUTIONS.md`, `PLAN.md`, `DECISIONS.md`, `PROGRESS.md`, `PRODUCTION_LOG.md` | 1 session (done) | **STOP 0** (done) |
| A | Graybox | Six places and the ending in flat shapes; all dives, sketches, hidden objects, required steps, hints; depth ribbon, sketchbook, save/restart; touch, mouse, keyboard; the judge; Gate A tests | 1 session (done) | **STOP A** (this one) — the founder plays 15 min; 3–5 strangers play grey |
| B1 | Style frames | 3 screenshots: street, drawer, eye | 1 session | **STOP B1** — founder approves |
| B2 | Art and completeness | Full art, density ≥150 props per place, audio, tiers, accessibility, onboarding, the rest of §10 checks | 4–6 sessions | — |
| C1 | Review prep | `REVIEW/` set up, screenshot set, clean-clone check | 1 session | **STOP C1** — founder runs reviews |
| C2 | One fix cycle | Fixes from the reviews, then a re-check | 1–2 sessions | — |
| C3 | Playtest build | `dist-playtest/`, `REPORT.md`, `PLAYTEST/` sheets | 1 session | **STOP C3** — human playtests |
| D | Up to 3 changes | Each logged with its time | 1–3 sessions | — |

**Phase A build order** (so a playable slice exists early):
1. Project skeleton, data files, the judge, unit tests for reachability and no dead ends.
2. Place 1 alone: viewpoint, lens, affordance, one sketch, two hidden objects, the key and door. Touch, mouse, keyboard.
3. The dive between two scenes, then places 2–6 and the ending.
4. Sketchbook, depth ribbon, hints, save/restart, session log, frame recorder, test mode, debug mode.
5. Playwright: clean boot, scripted route, phone-size run.

---

## 3. Code layout (spec §9; as in v1 §16 with the listed changes)

```
hunt-world-001/
  SPEC_WORLD_001_STEP_1_INTO_THE_CATS_EYE.md   governs
  AUTHORIZATION.md
  README.md            how to run, controls, what this is, AI disclosure
  DESIGN.md            world bible (no spoilers)
  SOLUTIONS.md         SPOILERS: chain, poses, positions, hints
  PLAN.md              this file
  PROGRESS.md          updated at the end of every session
  DECISIONS.md         decision records and the placeholder record
  PROVENANCE.md        every dependency and font, with its license (from Phase A)
  PRODUCTION_LOG.md    real-time log
  REPORT.md            end-of-build evidence (Phase C3)
  REVIEW/              reviewer reports and screenshots
  PLAYTEST/            protocol copy, observer sheet, session logs, results
  context/             read-only background
  src/
    world/             DATA ONLY (JSON): places, objects, sketches, hints, strings, answers
    gen/               deterministic generators: props, canvas textures, sketch renderer
    render/            renderer, materials, post, quality tiers, dive
    game/              state store, rules engine, judge.ts, save
    player/            input (keyboard/mouse/touch), camera, lens, viewpoints
    ui/                HUD, sketchbook, ribbon, hints, settings, prompts, describe
    audio/             procedural audio
    debug/             debug tools (dev builds only)
  tests/unit/  tests/e2e/  tools/   (frame capture, screenshot set, leak test)
```

Dropped from v1: `differences.json`, `causality.json`, the depth-state files, collision, the map. Added: `src/game/judge.ts`, `src/world/answers.json`.

---

## 4. Data files and the judge

**`src/world/` holds data only.** The World Package v0.1 words are used where they fit; 3D fields sit under `x3d`.

| File | Holds |
|---|---|
| `places.json` | the six places and the ending state: id, label, colour grade, viewpoints (position, forward, yaw/pitch limits), reach, scale unit, landmarks for *Describe surroundings* |
| `objects.json` | every usable object: id, place, label for describe, `states`, `initial_state`, `transitions` (trigger, conditions, effects: `change_state`, `play_sfx`, `emit_event`, `take_item`, `consume_item`), `hidden: true/false`, `x3d` (position, size, hit radius) |
| `sketches.json` | sketch ids, place, alt text, which page they appear on |
| `hints.json` | three levels per target id |
| `strings.json` | the opening line, verbs, alt text, captions, menu text |
| `answers.json` | poses, hidden-object directions and minZoom, required-step order, dive activation. **Read only by the judge.** Marked "to move server-side before any prize hunt". |

**The judge (`src/game/judge.ts`).** One small module with a pure interface, written so it could move to a server:
- `judgeSketch(sketchId, view) → { warm: 0..1, locked: boolean }`
- `judgeHidden(objectId, view, tap) → boolean`
- `judgeStep(stepId, state) → boolean` (is this required step allowed now, and is it done)
- `canDive(place, state) → target | null`
- `reachable(state) → boolean` and `noDeadEnds()` for tests

`view` is `{ place, viewpoint, yaw, pitch, zoom, screenPx }`. The renderer and the UI never decide a find; they only ask the judge and show the answer.

**The rules engine** applies transitions from `objects.json`. It does not hard-code object ids, except in tests.

---

## 5. How the main systems will be built

**Viewpoint camera and lens.** A perspective camera at the viewpoint. Yaw and pitch clamped to the place's limits. Zoom sets the field of view (60° ÷ zoom). Drag, arrow keys, pinch, wheel, right-button hold, Z hold and the lens button all feed the same controller. A short glide between viewpoints (about 1 s, eased).

**Affordance.** Each frame, a raycast from the screen center (three-mesh-bvh if needed). If the hit object is usable, within reach, and big enough on screen, the crosshair changes and its verb shows. One verb at a time. Hidden objects are found by tap: the judge checks direction and zoom, not the raycast.

**The dive.** Two scenes are alive during a dive: the current one and the target. The camera moves toward the target object on a log-scale curve for about 2 s. At the midpoint, the renderer swaps scenes; the target scene starts drawn small and "grows" so the motion reads as continuous. Each scene keeps its own coordinates near its origin, so precision never breaks. Back out plays it in reverse. Reduced motion: a 0.6 s cross-fade with the same total time.

**Sketches.** At load time, each sketch pose is rendered into a small offscreen target with a line pass (normals and depth edges) plus a paper texture made with canvas. This runs from the world data, so a sketch never goes stale. The "held-up" card shows this image; "getting warm" blends it toward a live line render of the current view by the warmth value from the judge.

**Hidden objects and the 44 px rule.** `minZoom` for each hidden object is computed at build time from its size and distance so that it spans at least 44 CSS px on a 390-px-wide screen. A build-time check fails if any object cannot reach 44 px at 4×.

**Hints.** Levels 1–2 show text from `hints.json`. Level 3 draws an arrow at the screen edge toward the target, or a soft highlight when it is in view. Hints are per place and shown only on request.

**Save.** A single JSON state object in `localStorage` after every change. Restart clears it. A blocked store shows one warning and continues in memory.

**Recorders.** `?perf=1`: frame times from `requestAnimationFrame` deltas, downloaded as JSON with the device's browser details. Session log: off by default, toggled by the observer in the menu, downloads JSON. `?test=1`: fixed clock, no ambient motion. `?debug=1`: only in dev builds; stripped from `build:playtest` by a Vite define.

**Quality tiers.** High and Low, detected by screen size and a quick GPU check, with a manual override. Low drops shadows, fog quality and distant clutter, never anything a find depends on. Budget on Low: ≤150 draw calls and ≤300k triangles per place, using instancing for cobbles, books, hairs, stars and rocks.

---

## 6. Automated checks (spec §10)

| When | Check | How |
|---|---|---|
| Gate A | every required step and the ending reachable | Vitest over the judge and the rules engine |
| Gate A | no dead ends from any state | exhaustive walk of the state graph (it is small) |
| Gate A | save/load and restart | Vitest with a fake store |
| Gate A | each sketch locks from its pose, not from 30° off | Vitest over `judgeSketch` |
| Gate A | each hidden object found only when zoomed | Vitest over `judgeHidden` |
| Gate A | boots with zero console errors, zero outside requests | Playwright, request log asserted |
| Gate A | scripted route completes the chain (debug jumps) | Playwright |
| Gate A | 390×844 touch run completes place 1 | Playwright device emulation |
| End of B | same first screenshot with `?test=1` | Playwright, pixel diff |
| End of B | ≥18 screenshots in `REVIEW/screenshots/` | `tools/screenshots` |
| End of B | keyboard-only full run | Playwright, keyboard only |
| End of B | frame capture: median, p95, p99, draw calls, triangles | `tools/perf`, headed if possible; else labelled "headless, indicative only" |
| End of B | leak test: 5 round trips, memory counts return, heap +<10% | `tools/leak` with `--expose-gc` |
| End of B | clean rebuild: `npm ci && npm run build && npm test` | fresh clone in a temp folder |

**Cloud note.** Headed browsers may not be available in this cloud session. Frame numbers measured here will be labelled "headless, indicative only". The founder measures on real devices.

---

## 7. Stack and budget

- Vite + TypeScript (strict) + Three.js (WebGL2), exact versions pinned, lockfile committed. `three-mesh-bvh` only if raycasts need it. Dev tools: Vitest, Playwright, ESLint. Node in this session: v22. Every dependency goes in `PROVENANCE.md` with its license.
- No backend, no network at runtime, no CDN, no fonts fetched, no analytics.
- Cash: the founder's Claude Code cloud credits ($250; hard stop $200). Cost is reported in `PRODUCTION_LOG.md` at every stop. **From inside this cloud session the dollar cost is not visible.** The founder reads it from the usage view; the builder records what it can see and says plainly when it cannot.

---

## 8. Top risks

1. **The dive between two scenes at very different scales.** If the swap is visible, the promise breaks. Mitigation: build the dive in Phase A step 3, before places 3–6, and test it in the grey version.
2. **Fur and stars against the phone budget.** Thousands of instanced hairs are cheap in draw calls but not in fill rate. Mitigation: fewer, larger blades on Low; measure early with `?perf=1`.
3. **Grey sketches may not be readable enough for E3.** A line render of flat shapes can look like nothing. Mitigation: pick strong silhouettes for S1 (lighthouse, gables, weathervane); tune in the graybox.
4. **"Stand here" marks may be missed** with no labels. Mitigation: the marks are large and worn-looking; the first-time hint shows a footprint icon that fades; hint level 1 names the viewpoint.
5. **Cost visibility.** If the builder cannot see spend, the $60 early warning depends on the founder checking the usage view at each stop.

---

## 9. What the founder decides at STOP 0

1. The nine proposals in §1: accept all, or say which to drop.
2. Whether the proposed second viewpoint per place is acceptable, or whether places should try one viewpoint first.
3. Paste the usage or cost shown for this session, so `PRODUCTION_LOG.md` can carry a real number.
