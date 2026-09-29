# The Hunt — World 001: "The Keeper's Model"

## Final build specification for Claude Fable 5.1 — v1.0

**Date:** 2026-09-29
**Written by:** Claude Opus 5.5, as independent consolidator. This document builds nothing.
**Builder:** Claude Fable 5.1 (`claude-fable-5-1`) in Claude Code.
**Valid only after** the founder signs the World 001 authorization. That is Appendix A of `context/WORLD_001_CONSOLIDATION_AND_FOUNDER_DECISIONS_2026-09-29.md`. The founder's kickoff message confirms that it is signed. Until then, do not start.
**Status note (later on 2026-09-29):** A research report (`Hunt platform strategy research.md`) recommends building a search-first zoom chain first, as "World 001 step 1". This Keeper's Model design would then be step 2. Do not start this spec until the founder chooses.
**Precedence:** This spec replaces the 2026-09-28 consolidation brief wherever they differ. The other files in `context/` are background. If a background file conflicts with this spec, this spec wins for World 001.

---

## 0. How to read this spec

- **MUST** means required for acceptance. **SHOULD** means do it unless it puts a MUST at risk. **COULD** means only if time remains after every MUST and SHOULD.
- A number marked *(guideline)* is a starting value. You may tune it in the graybox. The numbers in §20, §21 and §21b are pass/fail thresholds that were set in advance. Do not change them.
- You are the builder, not the judge. Reviewers and real people decide whether World 001 works. Never write "passed" or "done" about a player-experience criterion.
- Stop points are real. At each one, stop and report (§26). Wait for the founder's reply.
- Keep every file you write in short, plain sentences. The founder reads English as an additional language.

---

## 1. What this experiment is

World 001 answers two separate questions. Each gets its own verdict.

**The design question.**
- Can a player enter a coherent place, walk around it, and search it?
- Can they zoom into a place nested inside it, and come back to places that have changed?
- Do they stay curious for about 15–25 minutes? That is the design target. The pass band in §20 is 15–30 minutes.

**The method question.** Can Claude Fable 5.1, working from a written spec with light human direction, build that world in a web browser:
- at a quality the founder accepts,
- with a small, recorded amount of human effort,
- with no extra cash?

A fun world that needed heroic human effort is a **design pass and a method fail**. A fast, cheap build of a world that nobody enjoys is a **method pass and a design fail**. Record both verdicts. Never merge them.

**World 001 is:** a standalone, local, browser prototype. It is NON-COMPETITIVE. It has no prize. It is for internal testing only.

**World 001 is not:**
- the Hunt runtime;
- the World Foundry;
- a World Package;
- a decision about the engine, VR, or the data model;
- a public release.

---

## 2. The world concept

**Working title:** *The Keeper's Model.* You may propose a better title. It must be invented, not a real place or brand.

**The premise, in the player's words:**
- A small island harbor at dusk.
- Tonight the town lost an hour: its clock jumped from 6:59 to 8:00.
- An old model maker kept a model of the town in his workshop. The model shows the town one hour earlier, so the missing hour is still inside it.
- Look closely at the model and you can go inside.
- What you change in the earlier town also changes the later town.

**Three rules the player learns by doing, not by reading:**

1. The sketchbook shows places. Find where each sketch was drawn.
2. The model is the town, one hour earlier. Look closely to go in. You can back out at any time.
3. When you change something in the earlier town, the later town changes too.

**Why this concept.** Read this so you know what to protect when you make trade-offs.

- **Zooming carries you between places.** In the founder's vision, "zooming is the core act of travel". Here, walking moves you within a place, and zooming moves you into a place.
- **Coming back matters, by a clear rule.** Places you already visited change because the past changed. This is not a trick.
- **The nested copy matches by construction.** The model is the same world data and the same generators, drawn at another scale, another time, and another style. So the copy matches the outer town automatically. An image-generation pipeline struggles with exactly this: keeping nested scenes consistent.
  - This does **not** solve originality. A copy of the same town is not a new place. So the "street → shop → drawer → cat's eye → moon" vision, where every level is a new place, is only touched here by the moon secret.
- **One layout, three places.** The present, the past, and the unfinished model all come from one layout. This tests whether changing the state can multiply content without new art. The founder has already accepted this idea ("state-shifted loop-wrap reveals").
- **It continues The Missing Hour line** (a clock, a harbor, a lighthouse, a missing hour). It does not reuse the riddle structure of the House of the Missing Hours.

---

## 3. The player experience: the first 25 minutes

The timings are targets *(guideline)*. The exact solution chain is in **Appendix S (spoilers)**. Write your final version in `SOLUTIONS.md`.

| About when | What happens | What it tests |
|---|---|---|
| 0:00 | **The start.** The player stands at the edge of Clock Square, facing the harbor, at dusk. One line appears: *"This town lost an hour tonight. Find the places in the sketchbook."* Movement hints appear in place and fade once used. The sketchbook opens on one sketch. Its last page shows the clock tower door standing open. That is the goal. | Controls; a clear goal |
| 0:30–2:00 | **The first find.** The first sketch shows a place the player can see from the start. The player walks there and looks the right way. The sketch "locks" onto the real view. Two new pages appear. | A guaranteed find within about 60 seconds |
| 2–8 | **Around the village.** Two more sketches lead around the village: one to a high place, one to the model maker's workshop. | Walking, landmarks, vertical space, searching |
| 6–10 | **Into the model.** In the workshop, a large model of the town sits on a table under a lamp. The player looks closer at the model's Clock Square and holds the zoom. The camera dives smoothly into the model. Inside, it is sunset, the tide is low, the lamps are unlit, and the model's clock is stopped at 7:00. Above the rooftops, the giant workshop is the sky. | The nested transition; orientation |
| 10–16 | **Past changes present.** The player raises a flag in the model's square. After backing out, they see the real flag raised too, through the workshop window. One sketch only works after that change. Another sketch shows a place that exists only at low tide, so only in the model. | Spatial deduction; return |
| 14–20 | **The unfinished model.** In the model's own workshop, the model on the table is not finished yet, because an hour earlier the model maker was still building it. Inside it is a town drawn in pencil. The cause of the missing hour is there. | Deeper nesting; somewhere unexpected |
| 18–25 | **The hour returns.** The player backs out to the present. The VII is back on the tower's clock face. The bells ring. The tower door, shut all game, opens. It is in the square where the player started. | "I was here before. I didn't notice that." |
| any time | *(secret, COULD)* A harbor cat. Zoom all the way into its eye and you arrive on a small moon. | Curiosity is rewarded |

---

## 4. Spatial layout

### Depth 0 — The Town (the present, 8:00 pm)
Blue hour turning to night. High tide. The lamps are lit. The lighthouse beam turns.

- **Size** *(guideline)*: a walkable area of about 180 × 140 m. The island's shore is the natural boundary. A full loop on foot takes about 2–3 minutes.
- **Hub: Clock Square.** The player starts here. The clock tower can be seen from almost everywhere. It is the main landmark for finding your way. Its face has no VII, which an attentive player can notice from the start. Its door is sealed shut.
- **Zones (4):**
  - **A. Quay and harbor basin:** boats, crates, nets, and harbor steps down to the water.
  - **B. Lighthouse rock:** reached by a causeway. It has climbable stairs to an outside gallery. This is the vertical zone.
  - **C. Upper lanes and the workshop:** the model maker's workshop has a red roof. Its window looks down on Clock Square.
  - **D. Cliff path and cove:** the sea-cave mouth is under water at high tide.
- **Side places (2–3):** for example a bell loft (vertical), a boathouse, and a small shop interior. Each has ordinary things to open. Each has at least one detail that matters for a sketch or a secret.
- **Landmarks:** each zone has one unique shape on the skyline, for example the clock tower, the lighthouse, a large anchor sculpture, the red roof, a chapel bell.
- **Views:** at least 3 places where the player sees most of the town, the sea horizon, and a far island.

### Depth 1 — The Model (the past, 7:00 pm — inside the lost hour)
Sunset. **Low tide.** The lamps are unlit. The lighthouse is dark. The model's clock is stopped at 7:00.

- **Same generators, new state.** Built from the same layout data and the same generators as Depth 0, with a different state preset.
- **Few, deliberate differences.** Depth 0 and Depth 1 differ in only 6–10 places *(guideline)*. The differences are clues.
  - Put most of them along the routes players actually use: the square, the harbor, and the workshop lane.
  - List every difference in `src/world/differences.json`, so reviewers can check them.
- **The giant workshop overhead.** Looking up shows the giant workshop: its beams, the big lamp as the sun, and the edge of the table. Low detail is fine. This keeps the player oriented.
- **Low tide opens places.** Places that are under water in Depth 0 become reachable.

### Depth 2 — The Unfinished Model (earlier still, before seven)
In the Depth 1 workshop it is 7:00 pm, and the model maker has not finished his model yet. So the model on that table is unfinished. Going into it takes the player to the town at an earlier time, drawn only as far as he had drawn it.

- **The look.** The same layout, drawn as an unfinished pencil drawing: paper-white surfaces, graphite lines, some buildings only outlined, some missing.
- **The walking rule (MUST, and consistent everywhere):**
  - **Hatched** walls and stairs (shaded with pencil lines) are solid.
  - **Outline-only** walls are not built yet, so the player can walk through them.
  - Put one small outline-only wall on the path from the arrival point, so players learn the rule early.
- **The edge.** Bound the walkable area with a torn paper edge. Only Clock Square and two streets must be walkable. The rest can be outline-only scenery beyond the torn edge.
- **The cause of the missing hour is here:** the wedge that jams the clock.

### The secret — The Moon *(COULD)*
Reached by zooming all the way into the eye of the harbor cat in Depth 0. It is a small scene: grey dust, stars, and the island far below. It holds one small delight. Backing out returns the player to the cat. This nods to the founder's own image: "into a cat, into the cat's eye, and out onto the moon".

### How the depths connect
- **Going in.** The player moves from Depth n to Depth n+1 only by zooming into the Clock Square of a model on a table (§6). They always land in that depth's Clock Square, facing the tower.
- **Backing out.** It moves up one depth and is always available (a key, a button, and a touch control). It returns the player to the table they dived from, facing the model.
- **No deeper levels in v1.** Recursion stops at Depth 2. The Depth 2 workshop table holds a blank sheet of paper.

### Spatial truth rules (MUST)
- One shared layout file defines every depth. The depths differ only by:
  - their state presets;
  - the listed differences;
  - the cause-and-effect changes;
  - their drawing style.
- The model is about 1:50 scale *(guideline)*, so the town becomes a table model of roughly 3.6 × 2.8 m. Tune it so the model reads well from standing height.
- Nothing in the layout is random per session. Use fixed seeds. The same build always makes the same world.
- No movable or changeable object may ever block a required route.

---

## 5. Movement (MUST unless marked)

- **Walking.** First-person walking with collision against buildings, props, walls, and water edges. The player steps up stairs and curbs, walks up slopes, never falls through the world, and gets unstuck automatically.
- **Speed.** About 3.2 m/s by default *(guideline)*. A faster pace of about 5 m/s, with Shift or a toggle. Never slow the player to stretch play time.
- **Desktop controls:**
  - WASD to move.
  - Mouse to look. Drag-to-look is the default; pointer lock is an option.
  - Arrow keys also turn left and right and look up and down.
- **Click or tap to walk:** the player clicks or taps a visible ground point and walks there. Use straight-line movement that slides along obstacles. Simple routing around obstacles *(SHOULD)*.
- **Touch (MUST by Phase B):**
  - a left-thumb stick to move;
  - right-side drag to look;
  - tap to interact;
  - pinch, or an on-screen lens button, to zoom;
  - an on-screen back-out button.
- **Keyboard only:** the whole game must be playable without a mouse. Final key map, documented in the README:

  | Key | Action |
  |---|---|
  | WASD | move |
  | Arrow keys | turn and look |
  | E or Enter | interact |
  | Z (hold) | zoom |
  | B | sketchbook |
  | X or Backspace | back out |
  | M | map |
  | H | hints |
  | V | describe surroundings |
  | Esc | menu |

  Do not use Tab for game actions. Tab moves the keyboard focus in the browser.
- **Comfort:**
  - no head bob;
  - optional snap turn;
  - a field-of-view slider (60–90°);
  - a turn-speed setting;
  - a reduced-motion setting (§6).
- **Boundaries:** natural ones (sea, cliffs, railings, walls). Avoid invisible walls on open ground. Where a limit is needed, show a physical reason for it.
- **No jumping and no flying** in v1. This keeps routes fair and collision simple.

---

## 6. Camera and zoom

- **Eye and view.** Eye height is 1.6 m at the player's current scale. The default field of view is 70°.
- **The lens (zoom).** Hold the right mouse button, hold Z, pinch, or hold the on-screen lens button.
  - The view narrows smoothly to about 4× magnification, with a light lens edge.
  - Use it to inspect far or tiny things: the model's streets, a cat's eye, a distant window.
  - **Looking through the lens never starts a dive by itself.**
- **Entering (the dive).**
  - There are only two dive targets: the Clock Square of a model on a table, and the cat's eye.
  - When the lens is held on a dive target from close range (≤ 2 m *(guideline)*), a thin ring fills for 1 second.
  - When the ring is full, the dive begins. Letting go of the lens before then cancels it.
  - The first time the player is near a dive target, a small prompt says *"Look closer"*. For accessibility, pressing Enter at that prompt also starts the dive.
- **The dive itself.** It is continuous: no loading screen, no page change, and no fade to black in the default mode.
  - The camera moves toward the target while the scale changes smoothly, on a log curve, for about 1.5–2.5 seconds.
  - At the end, the new depth is the world at normal player scale, and the player stands in its Clock Square, facing the tower.
- **Backing out** plays the dive in reverse.
- **Reduced motion:** replace the dive with a 0.6-second cross-fade. There is no camera shake and no automatic camera movement.
- **Precision:** always keep the current depth at 1:1 scale near the world origin, and re-center it on every dive. Never render the active world at extremely tiny or huge coordinates. Adjust the near and far planes during the dive.

---

## 7. How the player interacts

**The verbs:** walk, look, zoom (the lens), interact (open, close, turn, push, pull, pick up), enter (by zoom, or at the prompt), back out, sketchbook, map, hint.

**Objects are state machines, declared in data.**
- Each object has states, transitions, and effects.
- Use the World Package v0.1 words where they fit: `change_state`, `reveal_layer`, `play_sfx`, `emit_event`.
- Add one experiment-only effect, `set_world_flag`, for changes that cross depths.
- Put 3D-only fields (position, rotation, collider, depth) under an `x3d` key.
- Do not edit or import the real Hunt schema.

**The affordance rule: no glowing hotspots (MUST).**
- Nothing glows, pulses, sparkles, or shows a label from a distance.
- When the player is within about 2.5 m *(guideline)* of something usable **and** looking at it, the crosshair changes and one verb appears ("Open", "Turn", "Pull", "Look closer").
- Important objects and ordinary objects use exactly the same affordance.

**No riddle machinery (MUST).**
- No typed answers.
- No multiple-choice answer panels.
- No codes worked out from numbers or words.
- Progress comes only from **being** somewhere, **looking** from somewhere, or **operating** something in the world.

**Decoys (MUST).**
- At least 30 ordinary usable objects across Depths 0 and 1.
- They respond in ordinary ways: a drawer with spoons, a crate with fish, a door into a small storeroom, a bell that rings.
- Keep at least 4 ordinary usable objects for every important one. Clicking everything must not be a winning strategy.

**Carrying.** At most one or two carried items in the whole game, shown in a small pocket slot. No inventory system. No combining items.

---

## 8. Exploration density

- **Street detail.** Every street view is full of ordinary detail: windows, shutters, shop signs with pictures instead of words, crates, nets, barrels, lamps, washing lines, plants, birds, boats, steps, alleys.
- **Quantity.** At least 250 placed props in Depth 0 (instancing is fine), plus hand-placed dressing around every discovery.
- **Hiding.** Each zone has at least one important detail hidden in plain sight, and at least four details that look important but are not.
- **No visible repetition.**
  - Vary each building by its seed.
  - No two neighbouring building fronts may be identical.
  - Use at least 6 building-front types, with colour and trim variation.
- **On the phone quality tier,** you may thin out distant clutter. Never remove anything that a sketch, a difference, or a discovery depends on.

---

## 9. How nesting works

- **Entering.** A nest is entered by zooming into a physical object in the world. Never by a menu or a floating button.
- **Staying oriented.** Every nest keeps the player oriented:
  - The parent world stays visible or implied, like the giant workshop in the sky.
  - A small label shows where you are, for example *"Now · 8:00"*, *"The model · 7:00"*, *"The unfinished model"*.
- **Leaving.** Backing out is always available. It returns you to where you entered.
- **Cause and effect across depths** (the core of "coming back matters"):
  - Store state per depth.
  - A deeper depth is an earlier time. A change at an earlier time may set flags that change later times (shallower depths).
  - Never the reverse. The present cannot change the past.
  - Declare every link in `src/world/causality.json`. The game code reads the links; it does not hard-code them.
- **Continuity by construction.**
  - All depths come from the same layout data and the same generators.
  - The only deliberate differences are the ones listed in `differences.json`, plus the cause-and-effect changes.
  - Reviewers will check that everything else matches.

---

## 10. Discoveries and clues

**The sketchbook is the goal.**
- It opens on one sketch (S1). Finding sketches adds pages.
- There are 6 required sketches and up to 2 optional ones *(guideline)*.
- The last page always shows the clock tower door standing open. That is the final goal, and it is shown as a picture.
- The sketchbook also holds the map (§15). It is never a numbered list of objectives.

**A sketch is a view drawn from a real spot in one of the depths.**
- The engine renders it from a stored camera position and direction with an ink or pencil shader. Then it gets a hand-drawn treatment: paper texture and slightly wobbly lines.
- Generate every sketch from the world itself, at build time or load time. Then a sketch can never go out of date when the world changes.
- Each sketch MUST show at least 2 recognizable landmarks or features. It must not depend on colour alone.

**Holding up a sketch.** The player can pick one sketch to "hold up". It shows as a small card in a corner of the screen while they walk.

**Getting warm (MUST).**
- When a held sketch's spot is within about 4 m and 25° *(guideline)*, the card's lines start to drift toward the real view.
- Nothing happens from farther away.

**Finding a sketch.**
- The player stands within about 1.5 m of the spot *(guideline, at that depth's scale)* and looks within about 12° of the drawn direction, for about 0.8 seconds.
- Then the drawing overlays the real view and fades into it: the sketch "locks". A soft sound plays, and the reward appears.
- Nothing needs to be typed or confirmed.

**Captions.** Some sketches may have a short handwritten caption of at most 8 words. A caption only names a thing plainly ("the old quay"). It is never a riddle.

**The difficulty ladder (required sketches):**

| Sketch | Kind |
|---|---|
| S1 | easy, visible from the start |
| S2, S3 | moderate, in the present town |
| S4 | exists only after a cause-and-effect change |
| S5 | exists only in the past (low tide) |
| S6 | inside the unfinished model |

Optional sketches (COULD): one in the past, one high vantage point.

**Deductions (3–4), all spatial.** The kinds of thinking wanted:
- "This sketch shows a boat sitting on mud. The harbor is full of water now. The tide is only low in the model."
- "This sketch shows the flag flying, but the flag is down. Maybe I can raise it in the past."
- "The tower is sealed now and in the model. In the unfinished model, one of its walls is only a drawing."

**Text.**
- The only required text is the opening line.
- No paragraph is ever needed to make progress.
- Optional letters and notes may add atmosphere. They are never required.

**Hints (MUST).**
- Every required step in `SOLUTIONS.md` has three hint levels. That includes each sketch, the first dive, the key, the dome, the wedge, and the final door.
- The levels are:
  1. where, or when;
  2. what to notice;
  3. show the spot on the map.
- Hints appear only when the player asks. Never automatically.

**Fairness (MUST).**
- Every required spot can be reached and seen without pixel-perfect aim.
- No clue depends only on colour or only on sound.
- **Checked by people, not by you:** at Gate A, each required spot must be found within 5 minutes, using hint levels 1–2 at most.

---

## 11. Coming back (MUST)

There must be at least two return moments, plus the final one:

- **R1 — A difference.** Something that exists only in the past shows where to go, or what is possible. In the reference chain, that is the boat on the mud at low tide.
- **R2 — Cause and effect.** An action in the past visibly changes a place in the present. The player goes back and sees it. In the reference chain, that is the flag, seen through the workshop window.
- **The final.** The finish happens where the player started, in Clock Square, after the final change.

Every return target must be **visible but not usable, or not yet understood,** on the player's first pass.

---

## 12. Visual direction

**House style: "a handmade miniature at dusk."**
- The town looks like a beautiful hand-built model: painted wood, plaster, paper, brass, glass, felt.
- Simple shapes are fine if they look intentional. This turns code-built geometry into a style instead of a weakness.

**Palette.** Define 8–10 named colours: lamp amber, dusk blue, sea teal, terracotta, cream plaster, brass, ink, and a few others. Write them in `DESIGN.md`.

**One colour grade per depth:**
- Depth 0: blue hour with warm windows.
- Depth 1: golden sunset.
- Depth 2: paper white and graphite, with one brass accent for the wedge.

**Rendering.**
- Toon or soft painterly shading.
- Gentle ink outlines.
- Atmospheric fog.
- Soft, cheap shadows.
- Simple animated water.
- A sky gradient.
- Tilt-shift focus only when looking at a model from outside.

**Readability beats realism.** Landmarks can be read from 50 m away. Clue objects can be read on a phone screen.

**Textures.** Generate them with canvas in code: wood, plaster, roof tiles, brick, paper, pencil lines. No photographs.

**Style references.** These are for direction only. Never copy assets or distinctive designs: stop-motion sets, tabletop model railways, picture-book harbors, clean isometric puzzle games, cozy town-builder games.

**Style frames first (MUST).** Before the full art pass, make 3 screenshots in the final style:
- the square at dusk;
- the harbor at low tide in the model;
- the model seen from above in the workshop.

The founder approves them before you continue.

**Forbidden:** real brands, logos, real place names, real people, franchise designs, and recognizable copyrighted characters. Signs use pictures, not words.

**Safety.** Nothing may flash more than 3 times per second. Reduced motion also stops decorative UI animation.

---

## 13. Audio *(SHOULD)*

- **Procedural only.** Use WebAudio, with no audio files. Sounds: sea, wind, gulls, bells (FM synthesis), footsteps (filtered noise), the dive, and the sketch lock.
- **Controls.** Sound starts after the player's first input, as browsers require. There is a volume control and a mute.
- **Never required.** Sound is never needed to make progress. Every important sound has a caption, for example "The bells ring."

---

## 14. Sources, rights and provenance (MUST)

- **Original only.** Everything is original and generated by code in this repository: geometry, textures, sketches, audio.
- **Allowed outside material:**
  - the npm packages you list in `PROVENANCE.md`;
  - system fonts, or one OFL-licensed font bundled with its license file.
- **No downloaded content.** Do not download images, 3D models, textures, sounds, or code snippets from other projects. If you believe one is essential, stop and ask first. Record its URL, author, license, date, and SHA-256.
- **No copied code.** Do not copy code from `PhiloLabs/fable51-worlds`, Sakura Crossing, or any other repository. General techniques are fine. Copied code is not.
- **Disclosure.** `README.md` states that the code and assets were generated by Claude Fable 5.1 (`claude-fable-5-1`) under the founder's direction, with dates.
- **Privacy.** Do not put personal or private information in the repository or in prompts.

---

## 15. Technical stack

- **Core:** Vite + TypeScript (strict) + Three.js, using the WebGL2 renderer. Pin exact versions. Commit the lockfile.
- **Allowed helper:** `three-mesh-bvh` (MIT) for collision and raycasts, if needed. Any other runtime dependency needs a line in `DECISIONS.md` with its reason, license, and size.
- **Dev tools:** Vitest, Playwright, ESLint. Keep them minimal. Installing npm packages and Playwright's own browser download counts as tooling. It is allowed, and it is not an "asset download" under §14.
- **Node:** use the founder's Node 24. Start commands with `source ~/.nvm/nvm.sh && nvm use 24`.
- **No backend.** Static files only.
  - `npm run dev` — development.
  - `npm run build` then `npm run preview` — the normal build.
  - `npm run build:playtest` builds to `dist-playtest/`, and `npm run preview:playtest` serves it.
  - For a phone test on the home network, add `-- --host`. That serves on the local network only. Never deploy publicly.
- **No network at runtime:** no CDN, no analytics, no external fonts, no remote calls.
- **Save.**
  - Autosave to `localStorage`: depth, position, flags, sketches found, settings.
  - Restart clears the save.
  - If storage is blocked, show a warning and keep going in memory.
- **The map.**
  - A hand-drawn-style map of the island seen from above, generated from the same layout data.
  - Fog covers places not visited yet. Pins mark found sketches.
  - It never shows things not yet found, except the one spot a player asks for with a level-3 hint.
  - The same map works for each depth, labelled with the time.
- **Frame recorder (MUST, in every build, playtest included):**
  - With `?perf=1`, the game records frame times.
  - A button downloads them as a JSON file, together with the device's browser details.
  - This is how phone performance is measured (T2).
- **Session log for playtests.**
  - Off by default. The observer turns it on at the start.
  - It records in memory, with timestamps: the start, each sketch found, each dive and back-out, each hint level used, map opens, the finish, and quitting.
  - Nothing is sent anywhere. At the end, "Save session log" downloads a JSON file for the observer.
- **Test mode.** `?test=1` fixes the clock and pauses water, birds, and other ambient movement, so screenshots are stable.
- **Debug mode.** Only in development builds, with `?debug=1`: teleports, a flag inspector, FPS. It is removed from the playtest build.
- **Quality tiers.** High (desktop) and Low (phone). Detected automatically, with a manual override in settings.
- **Label.** The menu and the title screen show *"Prototype · non-competitive · no prize"* in small text.
- **Placeholder record.** Write the Three.js placeholder record in `DECISIONS.md`, with the fields in §24.

---

## 16. Code structure

```
hunt-world-001/
  README.md            how to run, controls, what this is, AI disclosure
  DESIGN.md            world bible (no spoilers): places, depths, palette, rules
  SOLUTIONS.md         SPOILERS: exact chain, sketch spots, differences, links, hints
  PLAN.md              phases, milestones, risks
  PROGRESS.md          updated at the end of every session, so any session can resume
  DECISIONS.md         short decision records and placeholder records
  PROVENANCE.md        every dependency, font, and outside item, with its license
  PRODUCTION_LOG.md    real-time log (§22)
  REPORT.md            end-of-build evidence (§22)
  REVIEW/              reviewer reports and screenshots (§19)
  PLAYTEST/            protocol copy, observer sheet, session logs, results
  context/             read-only background files from the founder
  src/
    world/             DATA ONLY (JSON): layout, depths (state presets), objects,
                       sketches, differences, causality, hints, strings
    gen/               deterministic generators: buildings, props, terrain, water,
                       sky, canvas textures, sketch renderer
    render/            renderer, materials, post-processing, detail levels,
                       depth manager, dive
    game/              state store, rules engine (reads world data), sketch checks, save
    player/            controller, collision, input (keyboard/mouse/touch), camera, lens
    ui/                HUD, sketchbook, map, hints, settings, prompts, accessibility
    audio/             procedural audio
    debug/             debug tools (not in the playtest build)
  tests/unit/  tests/e2e/  tools/   (frame capture, screenshot set)
```

**Rules (MUST):**
- `src/world/` holds data only: no functions, no executable code.
- The game rules read the data. They do not hard-code object IDs, except in tests.
- The renderer never decides game outcomes.
- World Package concepts stay recognizable:
  - places and depths;
  - objects with states, transitions and effects;
  - sketch targets similar to anchors.

  This keeps a future renderer-neutral package possible. It does not make this repository a World Package.

---

## 17. Build phases and stop points

**Budget (MUST).**
- Use only the founder's existing Claude subscription. If anything would bill pay-as-you-go credits or API charges, stop and ask.
- If a usage limit is reached, update `PROGRESS.md` and stop cleanly. The founder resumes later.
- If Fable usage runs out for the week and the founder chooses to continue with Opus 5.5, log the switch in `PRODUCTION_LOG.md`. It changes the method being measured.
- Commit locally at the end of each phase. Never push. The founder pushes.

**Content scope.**
- **MUST:** the main chain in Appendix S. That is S1–S6, the flag, the key and the dome, the wedge, and the final door: about 10 discoveries, 3 deductions, and 2 return moments.
- **SHOULD:** the map, audio, and a polished touch feel.
- **COULD:** the optional sketches, the lighthouse-beam side path, and the moon.

### Phase 0 — Plan (small)
- Read this spec and everything in `context/`.
- Write `DESIGN.md` (no spoilers), `SOLUTIONS.md` (spoilers, including all hints), and `PLAN.md`.
- Draw a map of the layout seen from above (SVG or ASCII). The copy in `DESIGN.md` shows zones and landmarks only. The copy in `SOLUTIONS.md` also marks the sketch spots.
- Draft `differences.json` and `causality.json`.

**STOP 0.** The founder reads `DESIGN.md` only, then says "go" or asks for changes.

### Phase A — Graybox (only what Gate A needs)
Everything in simple shapes and flat colours:
- Depth 0 and Depth 1, with the dive and back-out;
- S1–S6 and their lock checks, including the "getting warm" feedback;
- the flag and its cause-and-effect link;
- the key and the dome;
- a small Depth 2: the square, the outline-wall lesson, the tower, and the wedge;
- the ending trigger;
- hints for every required step;
- save and restart;
- keyboard and mouse controls;
- debug teleports.

Tests at Gate A: the unit tests, the clean start, and the scripted route (§18).

**STOP A — Gate A.**
- The founder plays for 15 minutes without opening `SOLUTIONS.md`. One or two people from outside the project play too, if possible.
- The question: *did searching feel good, even in grey?*
- The founder decides: go on, redesign once, or stop (§21a, S1).

### Phase B — Art, feel and completeness
- **B1.** Make the 3 style frames (§12). **STOP B1:** the founder approves them.
- **B2.** Then complete everything else:
  - the full art pass and density dressing;
  - touch controls;
  - the full Depth 2 area;
  - the map and audio;
  - quality tiers, comfort and accessibility settings;
  - polished onboarding;
  - the rest of the tests in §18.

### Phase C — Reviews, fixes, and the playtest build
- **C1.** Prepare for the reviews. **STOP C1:** ask the founder to run the three reviewer sessions (§19).
- **C2.** One fix cycle based on the reviews, then one re-check by the same reviewer roles.
- **C3.** Build the playtest version. Write `REPORT.md`. **STOP C3:** the founder runs the human playtests (companion document, Appendix D).

### Phase D — The change test (after the playtests)
- Make up to 3 changes the founder asks for after the playtests.
- Log the time each one takes. Run all tests after each change.
- This measures how easy the world is to edit.

---

## 18. Automated checks (MUST)

### At Gate A
- **Unit tests (Vitest):**
  - **Reachability:** from the start, every required step and the finish can be reached.
  - **No dead ends:** from every reachable state, the finish can still be reached.
  - **Links:** every cause-and-effect link changes exactly the flags it declares.
  - **Save:** save and load keep all state. Restart clears it.
  - **Sketch checks:** each sketch locks from its intended position and direction. It does not lock from 3 m away, or when looking 30° off.
- **Clean start (Playwright):** the world boots with zero console errors and zero requests to anything outside the local server. Log every request and check the log.
- **Scripted route (Playwright):** using debug teleports, reach every required sketch spot, and see each sketch lock.

### By the end of Phase B
- **Same start every time:** with `?test=1`, two fresh boots give the same starting screenshot, within a small tolerance.
- **Screenshot set:** at least 24 fixed viewpoints across all depths, saved to `REVIEW/screenshots/`. Put the camera position and the depth in each file name.
- **Keyboard only:** one run completes the main chain with the keyboard alone.
- **Phone emulation:** one run in a 390 × 844 touch emulation. This does not replace a real phone.
- **Frame capture (`tools/perf`):**
  - Run it in a visible (headed) Chrome window, not a hidden one.
  - Measure real frame times over a scripted 60-second camera path through the heaviest views: the workshop looking at the model, Depth 1 looking up at the workshop sky, and a dive.
  - Report the median, p95, and p99 frame time, the draw calls, and the triangle counts. (p95 means 95 of every 100 frames draw faster than this.)
  - **Never report JavaScript-only render timing as frame time.** The Fable precedent made this mistake. Measure real frames.
- **Leak test:**
  - Dive in and back out 10 times.
  - Three.js's own memory counts (`renderer.info.memory`: geometries and textures) must return to their starting values.
  - Chrome's JavaScript heap, measured after garbage collection, must grow by less than 10%. Launch Chromium with `--js-flags=--expose-gc` to force garbage collection.
- **Clean rebuild:** a fresh clone, then `npm ci && npm run build && npm test`, succeeds. It may use only npm's cache and Playwright's browser download from outside the repository. The precedent repository failed this.

---

## 19. Independent reviewers (MUST)

**How reviews run.**
- The founder runs each review in a **fresh Claude Code session**, never in the builder's session. Opus 5.5 is fine for reviews, and it is cheaper.
- Both Fable and Opus are Anthropic models, so they share a lineage. That is why every finding needs evidence, not opinion.
- Reviewers never edit code. They only write reports in `REVIEW/`.
- Every finding needs three things:
  - a severity (blocker, major, or minor);
  - steps to reproduce it;
  - evidence: a screenshot with the camera position and depth, or a measured number.
- **The builder never marks its own work as passed.** If a reviewer stalls, the review is run again. It is never replaced by the builder.

**1. Technical reviewer.**
- Builds from a clean clone and runs every test and the frame capture.
- Tries to break movement: corners, stairs, water edges, diving in and out 20 times fast, resizing the window, blocking storage.
- Checks the zero-errors and zero-outside-requests rules.
- Reports T1 and T3–T8 (§21) as PASS, FAIL, or UNTESTED, each with evidence.

**2. Spatial and art reviewer.**
- Uses the screenshot set plus their own walk through the world.
- Judges:
  - coherence and proportions;
  - whether landmarks can be read from 50 m;
  - density and visible repetition;
  - whether the model truly reads as the same town;
  - whether the dive is clear;
  - consistency with the approved style frames.
- Lists every spot that looks like crude "programmer art".

**3. Hunt-design auditor.** Works with `SOLUTIONS.md` open. An AI cannot truly play a first-person game blind, so the blind play is done by people at Gate A and in the playtests. For each required step, the auditor checks the evidence:
- screenshots taken from the spot;
- that the spot is visible from where players will be;
- which landmarks the sketch shows;
- the route to reach it;
- the hint text.

The auditor also checks:
- the decoy ratio;
- that no progress depends on reading text;
- that no object gives itself away from a distance;
- that R1, R2, and the final return exist;
- that there are no dead ends.

The founder makes the final call on clue fairness.

---

## 20. Experience thresholds, set in advance (the design verdict)

People judge these, not you. They are listed here so you design toward them.

**The test group.**
- **5 adults** who have never seen the project, observed with the protocol in the companion document.
- The founder also plays. The founder already knows the concept, so the founder's play counts as an **informed** play.
- This bar is higher than the brief's (the founder plus one person). It is lower than the founder's July plan (10 strangers).

| ID | Criterion | Pass |
|---|---|---|
| E1 | Controls | ≥ 4 of 5 walk, look, and zoom without coaching within 60 s (target: 30 s) |
| E2 | Goal | At 2:00, the observer asks once: *"What are you trying to do right now?"* ≥ 4 of 5 give an answer that matches the game's goal |
| E3 | First find | ≥ 4 of 5 find S1 within 2 minutes without hints (the design target is 60 s) |
| E4 | Searching, not riddles | ≥ 3 of 5 find at least one later sketch spot by looking around and comparing. The observer judges this. |
| E5 | Nesting | ≥ 4 of 5 enter the model without observer help (hints allowed). ≥ 3 of 5 name the model or a dive when asked "What moment do you remember most?" |
| E6 | Return | ≥ 3 of 5 go back to an earlier place because of something learned elsewhere, and find something new there |
| E7 | Duration | Active time runs from first input to the finish or quitting, stuck time included, capped at 35 minutes. Pass: the median is 15–30 minutes, **and** ≥ 3 of 5 reach the ending within 35 minutes using only in-game hints. Stuck time is recorded separately. |
| E8 | Wanting more | ≥ 3 of 5 accept a real invitation to play a second, different world |
| E9 | Comfort | Asked "Did you feel dizzy or sick at any point?": ≤ 1 of 5 says yes, and nobody has to stop |
| E10 | Founder | After the informed play, the founder answers "yes" to: *"Is this the kind of Hunt I want to build more of?"* |

**Design verdict = PASS** only if E1–E9 all pass and E10 is "yes".

---

## 21. Method thresholds (the method verdict)

| ID | Criterion | Pass |
|---|---|---|
| T1 | Desktop performance (founder's MacBook, High tier) | In Chrome, measured by `tools/perf`: median frame time ≤ 16.7 ms, p95 ≤ 20 ms, p99 ≤ 33 ms in the heaviest views. Loads and becomes usable within 3 s from the local server. In Safari, the founder checks by hand that it runs without errors and feels smooth. |
| T2 | Phone performance (founder's own phone, Low tier, home Wi-Fi, measured with `?perf=1`) | Median frame time ≤ 33 ms (30 fps); p95 ≤ 50 ms over a 10-minute session; no crash or forced reload. Becomes usable within 8 s (target: 5 s). Record the phone model. If it is not an ordinary mid-range phone, note that this does not yet meet ADR-0011's "mid-range devices" requirement. |
| T3 | Size | Initial download ≤ 3 MB gzipped (target); 8 MB is the hard limit |
| T4 | Clean runtime | Zero console errors; zero outside requests; the same start every time |
| T5 | Rebuild | The clean-clone build and tests pass on the founder's Mac |
| T6 | Collision | No walking through walls and no falling out of the world during a 10-minute walk that deliberately tries to break it; getting unstuck works |
| T7 | State | No dead ends (tested); save, load, and restart work |
| T8 | Accessibility | The main chain can be completed with the keyboard only; reduced motion works; no colour-only or sound-only clue; UI text scales to 200%; "Describe surroundings" works without revealing hidden things |
| P1 | Production log | Complete and written in real time (§22) |
| P2 | Founder effort | ≤ 10 hours of the founder's hands-on time across Phases 0–C, not counting playtests. The founder writes no code. |
| P3 | Fix cycles | ≤ 3 fix cycles after Gate A to reach the playtest build |
| P4 | Cash | $0 beyond the existing subscription, or the founder's written cap |
| P5 | Provenance | Complete; no uncredited outside content |
| P6 | Editability | The 3 Phase D changes each take ≤ 1 session and cause no regressions |

**Method verdict = PASS** only if T1, T3–T8, and P1–P6 all pass.

**T2 is recorded separately.** If T2 fails, the method passes **for desktop only**. The founder's vision keeps phone access, so a T2 failure blocks adopting this route for the product until it is fixed.

**"Describe surroundings" (T8).** The V key and a menu item. It lists, in text:
- the landmarks in view;
- the exits;
- usable things within about 3 m that are in view.

It never lists hidden or undiscovered things. Each sketch also has a short text description of what it shows (alt text).

**Known accessibility gap.** Full non-visual play of 3D walking is not expected in v1. Record it in `REPORT.md` as a blocker for adoption. It does not block this experiment.

---

## 21a. Stop conditions (set in advance)

Stop and report if any of these happens. Do not push on.

- **S1 — Gate A.** The founder says searching did not feel good in the graybox. You get one redesign. If the second graybox also fails, World 001 stops.
- **S2 — Budget.** Anything would bill money. Or usage limits run out and the founder does not resume.
- **S3 — Correction burden.** More than 3 fix cycles after Gate A. Or the founder would need to do technical work beyond running commands and playing.
- **S4 — Desktop performance.** T1 still fails after one optimization pass. First reduce detail: thinner clutter, and a simpler model at a distance. If it still fails, stop.
- **S5 — Rights.** Any content with unclear provenance. Remove it, or stop.
- **S6 — Quality.** The approved style frames cannot be matched across the whole world, and the art reviewer and the founder agree it looks crude. Stop before the playtests.
- **S7 — Test integrity.** Any sign that the build is tuned to pass tests instead of to be good, for example test routes hard-coded into the game logic. Stop and report.

After the human playtests, failed E criteria mean a **design** failure, not a method failure. Record which one it was.

---

## 21b. How this plan meets ADR-0011 §22

ADR-0011 §22 lists criteria that any new grammar must meet, with numbers set before the experiment. This table maps each one to this plan. The criteria marked "recorded" have no pass/fail number in this experiment. They are measured and reported, not scored.

| ADR-0011 §22 criterion | In this plan |
|---|---|
| Artistic quality | Style frames approved by the founder; art review; E10; stop condition S6 (judged by people, not a number) |
| Participant preference (measured) | E5, E8, E10 |
| Clue visibility and fairness | §10 fairness rules; Gate A human check (each spot within 5 minutes, hints ≤ level 2); E3, E4 |
| Navigation clarity | E1, E6, and E7 stuck time |
| Mobile performance on mid-range devices | T2 (phone model recorded) |
| Loading time | T1 (desktop ≤ 3 s), T2 (phone ≤ 8 s) |
| Memory use | Leak test (§18); no crash in the 10-minute phone session; JavaScript heap recorded |
| Correction hours per asset | Recorded: agent hours and founder hours per depth and per phase (P2 is the overall cap) |
| Production cost per scene | P4 (cash) plus recorded agent hours per depth |
| Accessibility | T8; the known gap recorded |
| Rights and provenance | P5 |
| Maintainability | T5 and P6 |
| Replaceability | The data-and-renderer separation, checked by the technical reviewer (recorded); the §24 placeholder record |
| Human approval burden | P2 and P3 |

**What this experiment cannot do under ADR-0011 §24.** ADR-0011 §24 asks for a comparison with "the equivalent 2D experience". World 001 has no 2D twin, so it alone cannot change ADR-0011's order. It is evidence toward that decision.

---

## 22. Production record (MUST)

`PRODUCTION_LOG.md` is written **as you go**. Never rebuild it from memory afterwards. Write one row per work session:

| Date | Start–end | Who (Fable / reviewer / founder) | Phase | What was done | Minutes | Usage shown by Claude Code (or % of limit) | Cash | Result / failures |
|---|---|---|---|---|---|---|---|---|

At the end, `REPORT.md` summarizes:
- the model or models, and their versions;
- the agent's time and the founder's time. Split the founder's time by activity: reading and approving, playing, directing, tool trouble, and running playtests;
- the agent hours per depth;
- the number of fix cycles;
- rejected approaches and known failures;
- cash spent;
- lines of code per folder;
- the final download size;
- every measured number;
- whether the clean rebuild works.

---

## 23. Exact exclusions (MUST NOT)

- **The Hunt project.** Do not read, edit, or run anything in `~/Projects/The-Hunt`. Use only the copies in `context/`.
- **Hunt systems.** No database, Prisma, migrations, World Foundry, World Package schema edits, or Hunt runtime code.
- **Network and accounts.** No network calls at runtime. No analytics, accounts, payments, prizes, leaderboards, or multiplayer.
- **AI and paid services.** No AI image, 3D, or audio generation services. No paid services. No live AI at runtime.
- **Publishing.** No public deployment or hosting. Local and home network only.
- **Engines and XR.** No Unity, Unreal, Godot, proprietary cloud-world platforms, or WebXR/VR code in v1.
- **Riddle mechanics.** No typed answers and no multiple-choice riddles.
- **Rights.** No real brands, places, people, or copyrighted characters. No copied outside code.
- **Movement.** No jumping and no flying.
- **Git.** Never push to any remote.

---

## 24. Replaceability statement (MUST be copied into `DECISIONS.md`)

**Code generated by Fable is an experiment, not a Hunt architecture commitment.**

World 001 selects no engine, renderer, schema, provider, or production pipeline for The Hunt. Any later adoption follows ADR-0011: a benchmark, a new ADR, and the founder's approval. The lasting Hunt format stays the Hunt-owned World Package. It is never "Fable output".

**Three.js placeholder record:**

| Field | Value |
|---|---|
| Why selected | A light, MIT-licensed, widely supported WebGL2 library. It is the library the builder model has the most public evidence of using well (fable51-worlds). For this experiment, a smaller correction effort for an AI builder is a Hunt-specific requirement. |
| Limitations | No built-in game framework, physics, navigation, or XR-ready interaction layer. More must be assembled by hand. Phone performance depends on our own discipline. |
| Preferred future solution | Unknown. The September 7 research names Babylon.js as the provisional lead for an interaction-heavy 3D room, with PlayCanvas as the comparator. That needs a benchmark. |
| What depends on it | `src/render/`, `src/player/`, and parts of `src/gen/`. Not `src/world/` (data) and not `src/game/` (rules). |
| Replaceability class | Easy for this experiment. Moderate if the code is reused. |
| Migration path | Keep the world data and the rules free of renderer code. Rewrite the render, player, and generator layers against the same data. |
| Estimated replacement cost | Roughly half the code, mostly rendering and generators *(estimate, low confidence)*. |
| Replacement triggers | T1 or T2 cannot be met; XR or physics needs that Three.js handles poorly; or a benchmark shows a clearly better engine for Hunt worlds. |

---

## 25. What you receive

The founder copies these into `context/`. Treat them as read-only background:

1. **This spec.** It governs.
2. **`WORLD_001_CONSOLIDATION_AND_FOUNDER_DECISIONS_2026-09-29.md`** — why these choices were made, the authorization (Appendix A), and the playtest protocol (Appendix D).
3. **`PROJECT_BRIEF.md`** — the product definition and the three separate systems.
4. **`FOUNDER_CLARIFICATION_2026-09-06.md`** — the game is digital only; 3D is the long-term direction.
5. **`THE_HUNT_INCUBATOR_ZOOM_WORLD_STRUCTURE.md`** — the founder's own world vision.
6. **`THE_HUNT_TECHNOLOGY_QUALITY_AND_REPLACEABILITY_STANDARD.md`** — the rules for placeholders.
7. **`STAGE_7_HUNT_WORLD_PACKAGE_V0_1.md`** — vocabulary to mirror, not to implement.
8. **`The_Hunt_Player_Clarity_Correction_2026-09-15.md`** — lessons about clear goals and hints. **Ignore its §5.** That section is an old task for another tool, and it points into `~/Projects/The-Hunt`.
9. **Three images of the previous prototype** (`after-opening.png`, `after-answer.png`, `CONTACT_SHEET.png`). They show what **not** to repeat: sparse scenes, labelled hotspots, and answer panels.

**Lessons from earlier builds. Do not repeat these:**
- **The House of the Missing Hours:**
  - Every usable object had a visible label.
  - Scenes were sparse, with only 1–5 usable objects each, so there was nothing to search.
  - Progress came from reading text clues and choosing answers from buttons.
  - Zoom was never needed.
  - An early version lost progress on a page reload. This was fixed later.
- **fable51-worlds:**
  - It has no touch controls for walking. One GPT-built viewer can only turn the camera by touch.
  - It has no gameplay. Its own code says "Nothing here is a puzzle and nothing here is a game mechanic."
  - It timed frames with JavaScript only.
  - It could not be rebuilt from a clean clone.
  - Its media used photos without credit.
  - Its Fable-built Kyoto world shares about 2.5% of its code lines with another project and has no third-party notice. Always check licenses and code similarity.
  - When a reviewer stalled, the builder graded itself.

---

## 26. How to report at each stop

Keep each report short and plain:

1. **What exists now,** with a run command and a URL.
2. **What works and what does not,** with evidence: test output, numbers, screenshots.
3. **Decisions you made,** and why.
4. **The 3 most important risks or open questions.**
5. **Time and usage for this phase,** copied from `PRODUCTION_LOG.md`.
6. **What you need from the founder:** one clear question, or "go".

Never claim that a player-experience criterion has passed.

---

## Appendix S — Reference solution chain (SPOILERS)

> **Founder:** skip this appendix if you want your own play to be less spoiled.
> **Fable:** this is a reference, not a script. Keep its beats and its rules. Improve the details. Write your final chain and all hints in `SOLUTIONS.md`.

**Backstory** (never told in full; optional notes can hint at it).
- The model maker loved one hour of this town: seven o'clock, when the ferry lights come home.
- While he was still drawing his model, he jammed a brass wedge into its clock, so that hour would never end.
- Since then, the real town skips that hour, and the tower clock has no VII.
- The wedge shows in every later version of the model. It can only be reached in the unfinished one.

### Main chain (MUST)

1. **Start (Depth 0, 8:00).** The player stands at the edge of Clock Square, facing the harbor. The sketchbook shows S1. Its last page shows the tower door open.

2. **S1 — easy.** The anchor sculpture at the quay end of the square, with the lighthouse behind it. It is drawn from a spot about 20 m from the start. Locking it adds S2 and S3.

3. **S2 — vertical.** The view from the lighthouse gallery back toward the clock tower. The player crosses the causeway and climbs the stairs.
   - From the top, the lens shows the red-roofed workshop.
   - Locking S2 adds **S5**: a small boat resting on mud beside dry harbor steps, with the clock tower behind. That view is impossible now, because the harbor is full of water.

4. **S3 — the workshop.** The side alley under the red roof. It leads to the workshop.
   - Inside, the model sits under a lamp. Its tiny clock shows 7:00. Through the window, the real tower shows 8:00, and the real square's flag hangs down.
   - Locking S3 adds **S4**: the square seen from this window, with the flag flying. That is impossible now, because the flag is down.

5. **Dive 1.** The player holds the lens on the model's Clock Square until the ring fills, and dives. They land in the model's Clock Square, facing the tower.

6. **Depth 1 (7:00, sunset, low tide).**
   - The model's tower has all twelve numerals, but its pendulum is still.
   - Through a small tower window, a brass wedge can be seen jamming it.
   - The tower door is sealed shut, as it is in the present.

7. **The flag (R2, teaching).** The flagpole stands by the arrival point, and its rope says "Pull". The player raises the flag, then backs out.
   - At the workshop table, a flapping sound comes through the window.
   - The real flag in the square is now flying. The flag on the model is up too.
   - Standing at the window now locks **S4**. This teaches rule 3 by doing.
   - Locking S4 adds **S6**: the tower's wheels with the wedge jammed in them, drawn in pencil.

8. **The Depth 1 workshop.** On its table sits the unfinished pencil model, under a locked glass dome with a visible keyhole.

9. **S5 (R1, a difference).**
   - In the model, at low tide, the harbor steps lead down to dry mud and the model maker's small boat.
   - Standing where the sketch was drawn, in the boat and looking at the tower, locks S5.
   - The dome key lies under the seat. This is the one carried item.
   - The key can be taken even if S5 has not been found yet. A found sketch is a reward, never a lock on a physical object.

10. **Dive 2.** The player unlocks the dome, holds the lens on the unfinished model's Clock Square, and dives into Depth 2.

11. **Depth 2 (the unfinished model).**
    - On the path from the arrival point, a small outline-only wall teaches the rule: outline walls can be walked through.
    - One wall of the tower is outline-only. The player walks in and climbs the hatched (solid) stairs to the wheels.
    - Standing at the top locks **S6**.
    - The wedge is the only fully coloured object. "Pull": the pendulum swings, colour washes through the drawing, and the clock strikes.

12. **Back out twice.**
    - In Depth 1, the model's clock is running again.
    - In Depth 0, the VII is back on the tower face, and the bells ring.
    - Through the workshop window, the player can already see the change. The tower door in Clock Square, sealed all game, stands open.
    - Inside is a small final room: 2–3 short lines of ending text and one last view.
    - The player has crossed this square many times.

### Optional content (COULD)
- **A low-tide sketch:** the sea cave at the cove, visible only in the model. Inside is an optional letter and a view out to sea.
- **A bell-loft sketch:** a high vantage point over the harbor.
- **The lighthouse beam:** in Depth 1, the dark lighthouse lens can be turned. In Depth 0, its beam then rests on the cliff and lights up a carved mark, which gives a small reward.
- **The secret:** zoom all the way into the harbor cat's eye to reach the moon.

### Differences between Depth 0 and Depth 1 (examples)
- the tide level, and the harbor steps wet or dry;
- the boats' positions, and whether the model maker's boat is there;
- lamps lit or unlit;
- the lighthouse lit or dark;
- the clock running at 8:00, or stopped at 7:00;
- washing on the line, or still in the basket;
- the shop door open or shut;
- the cat on the wall, or on a roof.

### The deductions
1. S5 shows mud where there is water now. So it must be in the past: the model.
2. S4 shows the flag up, but it is down. So raise it in the past, and the present changes.
3. The tower is sealed in the present and in the model. But in the unfinished model, one of its walls is only a drawing.
4. *(Optional)* If you turn the lighthouse lens at seven, it still points the same way at eight.
