# SOLUTIONS.md — SPOILERS

**Founder: do not read this if you want your own play to stay fresh.** This file holds the exact chain, every sketch pose, every hidden-object position, every required step, the decoy lists, and all hint text. The Hunt-design auditor works with this file open.

**Status:** Phase 0 draft, 2026-09-29. Every number is a *(guideline)* starting value to be tuned in the graybox. The rules (order, what blocks, what never blocks) are not guidelines.

---

## 0. Conventions

**Coordinates.** Each place is its own Three.js scene with its own units. Y is up. Each viewpoint has a forward direction; **yaw** is degrees from that forward, positive turns left; **pitch** is degrees, positive looks up. **Zoom** is lens magnification (1× = the default 60° vertical field of view; 4× is the maximum).

**Viewpoints.** Every place has two: **A** (where the dive lands) and **B**. Each has turn limits. The player glides between them with *Stand here*.

**Reach.** A usable thing shows its verb only when it is centered, its projected size is big enough, and it is within that place's *reach* distance from the current viewpoint. Hidden objects have no reach limit: they are found by zooming and tapping from wherever they are visible. Dive targets need reach.

**A pose** is `{ viewpoint, yaw, pitch, zoom }`. **Sketch lock:** same viewpoint, within 10° of the direction, zoom within ±35% of the stored zoom, held 0.8 s. **Getting warm:** same viewpoint, within 25°. **A hidden-object find:** the object is centered within its hit cone, and the current zoom ≥ its `minZoom` (chosen so the object is at least 44 CSS px across on a 390-px-wide phone). The judge (`src/game/judge.ts`) makes all of these decisions from `src/world/answers.json`.

**Priority rule.** If an active dive target is centered and the lens is held, the dive ring runs and sketch locking is suspended. Dive targets become active only after their place's required step is done. This stops a sketch lock and a dive from firing together.

**Carried items.** The pocket slot holds at most one item. Three items are carried in the whole game, each for a short time: the key (place 1), the feather (places 3–4), the light (place 6).

---

## 1. The chain in one table

| # | Place | Required step (blocks) | Dive target (active after the step) | Sketch (never blocks) | Hidden 1 | Hidden 2 |
|---|---|---|---|---|---|---|
| 1 | Street | Take the key from the shop's windowsill; Use it on the shop door | the open doorway | S1 lighthouse between two roofs | red umbrella | ship in a bottle |
| 2 | Shop | Open the blue drawer | the open blue drawer | S2 counter and tall clock from the doorway | teacup with a star | glass marble |
| 3 | Drawer | Open the envelope; Take the feather; Use it on the cat's nose | the cat's neck fur | S3 the key bridge | paper boat | stamp with the moon missing |
| 4 | Cat | Use the feather on the ear | the open eye | S4 the bell charm | flea with a hat | fish bone |
| 5 | Eye | Use (cover) the reflected lamp so the pupil widens | the round pupil | S5 the star pattern | comet | tiny reflected lighthouse |
| 6 | Moon | Take the light from the crater; Use it on the lamp | the moon's edge | S6 the harbor far below | footprint | lost glove |
| ✓ | Street at night | — | — | the last page draws itself | — | — |

Required steps: 6. Dives: 6 (five down, one home). Optional finds: 18. Total finds: 24.

Two of these differ from spec §3 and are **proposed changes**, listed in `PLAN.md` §1: the key is a required step instead of a hidden object (a hidden object must never block), and place 5 gets a real open-or-use step (the reflected lamp) before its dive. If the founder rejects them, the fallbacks are also written below.

---

## 2. Place 1 — Harbor street (units: metres; eye height 1.6 m; reach 3.5 m)

**Viewpoints.**
- **A** — middle of the street, beside the fish stall: position (0, 1.6, 0), forward −Z (toward the harbor). Yaw limits ±120°, pitch −35° to +55°.
- **B** — the shop's step: position (−3.5, 1.6, −6.5), forward −X (facing the shop front). Yaw ±100°, pitch −40° to +50°.

**Scene notes.** Houses on the left (−X), the shop at z ≈ −6.5. Fish stall on the right (+X) at z ≈ −3. Quay at z ≈ −16. Lighthouse on the headland at about (−40, 12, −70): from A it sits in the gap between the gables of the second and third houses. The dull moon is above the roofs at yaw −15°, pitch +40° from A. Street lamps at z = −2, −9, −14 (unlit at dusk).

| Find | Pose / position | Notes |
|---|---|---|
| **S1** lighthouse between two roofs | from **A**: yaw +28°, pitch +14°, zoom 1.8× | Features: the lighthouse with its lamp gallery; the two gables that frame it; the fish weathervane on the left gable. |
| **H1a** red umbrella | from **A**: yaw −55°, pitch −18°, minZoom 2.5× | Folded, red, hooked handle, leaning behind the fish stall's crates among oars and rods. Position about (2.6, 0.3, −4.2). |
| **H1b** ship in a bottle | from **A**: yaw −20°, pitch +22°, minZoom 3× | On the inside sill of a lit first-floor window of the house across the street (right side), position about (4.5, 4.2, −8). |
| **Key** (required) | from **B**: yaw +15°, pitch −8°, zoom ≥ 2× to see it; verb *Take* | Tiny brass key on the shop's outside windowsill, half under a geranium pot, position about (−5.2, 1.1, −5.4). From A it can be seen at 4× but is out of reach. |
| **Shop door** (required) | from **B**: yaw −10°, pitch 0°; verb *Use* | Without the key: the door rattles, the window cat's ear flicks. With the key: it swings open, amber light inside. |
| **Dive target** | the open doorway from **B**: yaw −10°, pitch +2° | Active after the door opens. Verb *Look closer*. |

**Fallback if the founder keeps the key as a hidden object:** the door is not locked; *Use* opens it. The key on the sill stays a hidden object (outline: a tiny key), and the ship in a bottle moves to the decoy list.

**Ordinary usable things (decoys, at least 16; important usable things here: key, door, doorway, 2 hidden = 5, so ≥ 20 wanted):**
1. fish stall awning (rolls down and up)
2. fish crate (opens: fish)
3. ice bucket (tips)
4. fish stall chalkboard (flips: pictures of fish and prices as coins)
5. scale on the stall (pans swing)
6. bicycle bell (rings)
7. bicycle (wheel spins)
8. rope coil (uncoils)
9. mooring cleat (rope tightens)
10. boat lantern (lights)
11. boat bell (rings)
12. gull on a post (flies off, comes back)
13. house shutter (closes, opens)
14. house doorbell (rings; nobody comes)
15. letterbox (flap opens; a doodle of a fish inside)
16. weathervane (spins)
17. street lamp (flickers, will not light)
18. flowerpot on the shop sill (rocks; hides the key until moved — the key is visible around it anyway)
19. shop sign (a painted cat's eye; swings)
20. cat in the window (ear twitch, a purr; ordinary until place 3)
21. drainpipe (drips)
22. barrel lid (lifts: water and a reflection of the moon)
23. window box (a snail moves)
24. curb stone (loose; wobbles)

**Props target:** ≥150. Cobbles (instanced), roof tiles (instanced), 5 house fronts with windows, shutters, sills, pots, 3 lamps, 6 crates, 2 barrels, nets, 8 rods, oars, 2 boats, 6 mooring posts, 12 gulls, 2 bicycles, a cart, signs, ropes, buckets, a ladder, chimney pots, weathervanes, the moon, the lighthouse, the headland.

**Ending state of this scene (night):** sky Night blue; lamps lit; windows Warm window; the moon glows (emissive) and a small light shows in its lamp; the cat is on the shop step looking up; the shop door is shut again; fish stall awning down; two boat lanterns lit.

---

## 3. Place 2 — The curiosity shop (units: metres; eye height 1.6 m; reach 2.5 m)

**Viewpoints.**
- **A** — just inside the doorway: (0, 1.6, 0), forward −Z. Yaw ±110°, pitch −45° to +50°.
- **B** — beside the chest of drawers, right wall: (2.2, 1.6, −3.0), forward +X (facing the chest). Yaw ±120°, pitch −50° to +60°.

**Scene notes.** Counter at z ≈ −4, slightly left. Tall clock behind it at (−1, 0, −6). Shelves on both walls floor to ceiling. Chest of 24 small drawers (4 rows × 6) on the right wall at (3.4, 1.0..1.9, −3.0); the blue drawer is row 3, column 2.

| Find | Pose / position | Notes |
|---|---|---|
| **S2** counter and tall clock | from **A**: yaw −12°, pitch −3°, zoom 1.3× | Features: the counter with brass scales; the tall clock's face; the birdcage hanging top-right. Gift pacing: it is the first thing seen after the first dive, but it needs the right zoom. |
| **H2a** teacup with a star | from **B**: yaw +35°, pitch +30°, minZoom 3× | One cup among 12 on a high shelf near the chest; the star is painted on its side. Position about (3.2, 2.6, −1.4). |
| **H2b** glass marble | from **A**: yaw −15°, pitch −28°, minZoom 3× | Rolled against the counter's front foot, next to a mouse hole. Position about (−0.6, 0.03, −3.6). |
| **Blue drawer** (required) | from **B**: yaw −5°, pitch −10°; verb *Open* | Slides out. Inside, tiny hills of letters and a glint of ink. All other drawers open too (buttons, string, stamps, pins, seeds, coins). |
| **Dive target** | the open blue drawer from **B**: yaw −5°, pitch −12° | Active after it opens. Verb *Look closer*. |

**Ordinary usable things (≥16; important usable here: blue drawer, its interior, 2 hidden = 4):**
1–8. eight other drawers (each opens: buttons, string, stamps, pins, seeds, coins, a dried flower, nothing)
9. wall clock (chimes)
10. cuckoo clock (bird pops)
11. counter bell (dings)
12. brass scales (pans swing)
13. globe (spins)
14. music box (plays four notes)
15. rolled map (unrolls: a drawn island, no words)
16. big book (opens: a doodle of a fish)
17. birdcage (swings; empty)
18. telescope (turns)
19. oil lamp (dims, brightens)
20. cash drawer (opens: a button)
21. hand mirror (shows the doorway behind you)
22. stuffed fish (mouth opens)
23. jar of buttons (opens)
24. the door sign (flips: a drawn sun / a drawn moon)

**Props target:** ≥150. Books (instanced, ~60), jars (~30), cups, bottles, clocks (6), maps, globes, boxes, a ladder, rugs, lamps, tins, brass things, feathers, shells, frames with drawn pictures.

---

## 4. Place 3 — Inside the drawer (units: centimetres; eye height 4 units; reach 12 units)

**Viewpoints.**
- **A** — the drawer's front lip: (0, 4, 0), forward −Z (into the drawer). Yaw ±90°, pitch −45° to +40°.
- **B** — the top of the letter hill, near the key bridge: (−6, 6, −18), forward −Z. Yaw ±130°, pitch −50° to +50°.

**Scene notes.** The drawer interior is about 40 × 30 units. Letter hills fill the left and middle. The ink pool at (4, 0, −14) to (12, 0, −22). The key bridge spans it at z ≈ −18 from x = 2 to x = 12. The stamp tower at (−14, 0, −24), 9 units tall. The sock pillow at (0..14, 0, −28..−36); the cat on it, head at about (2, 8, −30), nose at (−1, 7, −27), tail curling over the pillow's edge.

| Find | Pose / position | Notes |
|---|---|---|
| **S3** the key bridge | from **B**: yaw −10°, pitch −6°, zoom 1.5× | Features: the bridge of keys over the ink; the stamp tower behind; the cat's curled tail. |
| **H3a** paper boat | from **A**: yaw +8°, pitch −20°, minZoom 2.5× | On the ink pool under the bridge, position about (7, 0.2, −17). |
| **H3b** stamp with the moon missing | from **B**: yaw +30°, pitch +10°, minZoom 3× | Near the top of the stamp tower; the stamp shows a night sky over a harbor with a blank where the moon should be. Position about (−14, 8, −24). |
| **Envelope** (required, part 1) | from **B**: yaw +50°, pitch −15°; verb *Open* → *Take* | One of many envelopes; this one lies flap-up beside the hill. Opening shows a small grey feather. Position about (−12, 1, −14). |
| **Cat's nose** (required, part 2) | from **B**: yaw −35°, pitch +5°; verb *Use* (feather) | The cat sneezes softly, the ear flicks, the head lifts a little, the neck fur is presented toward B. |
| **Dive target** | the cat's neck fur, from **B**: yaw −25°, pitch +8° | Active after the nose step. Verb *Look closer*. |

**Ordinary usable things (≥16; important usable here: envelope, feather, nose, neck, 2 hidden = 6):**
1–6. six other envelopes (open: a doodle, a pressed flower, sand, a button, a ticket, nothing)
7. thimble (rings when tapped)
8. spool (unrolls a little)
9. pencil stub (rolls)
10. wax seal (leaves a print in the letter)
11. matchbox (opens: a sleeping beetle)
12. tiny bell (rings)
13. ribbon (uncurls)
14. ticket stub (flips: a drawn boat)
15. photograph (flips: a doodle of a lighthouse)
16. sock on the pillow (wiggles)
17. cat's tail (twitches)
18. coin (spins)
19. paperclip chain (sways)
20. a key in the bridge (turns in place)
21. button pile (spills)
22. a loose stamp (flips)
23. an old ticket roll (unrolls)
24. a dried flower (petals fall)

**Props target:** ≥150. Letters (~40, folded), envelopes (~15), keys in the bridge (~25), stamps (~30), buttons (~40, instanced), thimbles, spools, pins, coins, the matchbox, the ribbon, socks (6), the cat.

---

## 5. Place 4 — The cat, up close (units: millimetres; eye height 15 units; reach 60 units)

**Viewpoints.**
- **A** — on the cat's cheek, below the ear: (0, 15, 0), forward −Z (toward the front of the face). Yaw ±120°, pitch −30° to +70°.
- **B** — at the collar, among the charms: (40, 12, 60), forward +X (along the collar). Yaw ±110°, pitch −40° to +50°.

**Scene notes.** Fur hairs are instanced blades 20–50 units tall. The ear rises above A at pitch +45°. The closed eye is a soft mound at A yaw +5°, pitch +30°, about 120 units away. The collar runs along z ≈ 60. Charms along it from B: fish (x = 60), house (x = 90), **bell** (x = 120), heart (x = 150), tag (x = 180).

| Find | Pose / position | Notes |
|---|---|---|
| **S4** the bell charm | from **B**: yaw +10°, pitch +5°, zoom 2× | Features: the bell charm between the fish charm and the house charm; the collar's stitching line; a whisker crossing above. |
| **H4a** flea wearing a tiny hat | from **A**: yaw −40°, pitch +20°, minZoom 3.5× | Sitting on a hair, hat visible. Position about (−45, 30, −35). |
| **H4b** fish bone | from **B**: yaw −45°, pitch −10°, minZoom 2.5× | Caught in the fur at the collar's edge. Position about (25, 6, 95). |
| **Ear** (required) | from **A**: yaw +15°, pitch +45°; verb *Use* (feather) | The ear flicks twice; the eye opens: the mound splits and the iris glows deep blue with gold. Without the feather, the ear just twitches. |
| **Dive target** | the open eye from **A**: yaw +5°, pitch +30° | Active after the ear step. Verb *Look closer*. |

**Ordinary usable things (≥16; important usable here: ear, eye, 2 hidden = 4):**
1. hair (parts and springs back)
2. whisker (twangs)
3. burr (rolls out)
4. claw (flexes)
5. paw pad (squishes; the cat purrs)
6. fish charm (swings)
7. house charm (its tiny door opens; nothing inside)
8. heart charm (glints)
9. tag with a paw print (flips)
10. drop of milk on the chin (wobbles)
11. moth on the fur (flies off)
12. fur knot (unties)
13. nose (sniffs, without the feather)
14. eyelid, before it opens (twitches)
15. a loose hair (floats away)
16. collar buckle (clicks)
17. the ear, before the feather (twitches)
18. a crumb (rolls)
19. a second flea, no hat (hops away)
20. dust mote (drifts)

**Props target:** ≥150. Fur blades (thousands, instanced, one draw call), whiskers (12), charms (5), the collar, the buckle, the ear, the eye, burrs, moths, crumbs, knots, a few seeds.

---

## 6. Place 5 — The cat's eye (units: "eye units", iris radius 100; eye height 5 units; reach 40 units)

**Viewpoints.**
- **A** — the iris edge: (0, 5, 0), forward −Z (across the iris toward the pupil at z = −100). Yaw ±100°, pitch −20° to +80°.
- **B** — on a gold ring near the pupil: (0, 5, −70), forward −Z. Yaw ±140°, pitch −30° to +70°.

**Scene notes.** The iris is a curved dish. Gold rings at radii 85, 60, 35 glow softly. Stars scattered between rings (about 200, instanced). The highlight (the wet reflection) hangs high at A yaw −25°, pitch +45°: it shows a reflected lamp, a window frame, and, very small, the lighthouse. The pupil at z = −100 is a vertical slit 6 units wide at the start.

| Find | Pose / position | Notes |
|---|---|---|
| **S5** the star pattern | from **A**: yaw +25°, pitch +30°, zoom 2× | Features: three bright stars in a line; the arc of the outer gold ring crossing them; the corner of the reflected window. |
| **H5a** comet | from **B**: yaw −35°, pitch +25°, minZoom 3× | A small frozen streak with a tail, between the middle and inner rings. Position about (−30, 25, −45). |
| **H5b** tiny reflected lighthouse | from **A**: yaw −30°, pitch +40°, minZoom 3.5× | Inside the highlight, a tiny tower with a lit top. |
| **Reflected lamp** (required, proposed) | from **A**: yaw −20°, pitch +45°; verb *Use* | The reflected shop lamp in the highlight. *Use* covers it: the highlight dims, and the pupil widens from a slit into a round dark door (pupils widen in the dark). |
| **Dive target** | the round pupil from **B**: yaw 0°, pitch 0° | Active after the lamp step. Verb *Look closer*. Also usable from A at 4× but out of reach; the player must stand at B. |

**Fallback if the founder keeps spec §3 as written:** the pupil is the open-or-use step and the dive target. *Look closer* on the slit widens it, and holding the lens dives. Place 5 then has only three finds.

**Ordinary usable things (≥16; important usable here: reflected lamp, pupil, 2 hidden = 4):**
1. a star (twinkles when tapped)
2. a second star (twinkles)
3. a ring segment (hums)
4. the reflected window (a curtain moves)
5. a reflected bottle on the reflected sill (rolls)
6. a floating speck (drifts away)
7. a fleck of gold (turns)
8. a tiny reflected boat (rocks)
9. a shooting star trail (fades and comes back)
10. an eyelash shadow at the edge (sweeps)
11. a reflected clock (its hand moves)
12. a small cloud in the iris (parts)
13. the pupil's edge, before it widens (ripples)
14. a reflected gull (flaps)
15. a dark fleck (blinks)
16. a ring crossing (chimes)
17. a reflected lamp post (flickers)
18. a star cluster (spins slowly)

**Props target:** ≥150. Stars (instanced ~200), ring segments, flecks, reflected objects (~20), clouds, lash shadows.

---

## 7. Place 6 — The moon (units: metres; eye height 1.6 m; reach 3 m)

**Viewpoints.**
- **A** — the crater field: (0, 1.6, 0), forward −Z (toward the rise). Yaw ±150°, pitch −50° to +60°.
- **B** — the rise beside the lamp, at the moon's edge: (0, 3.4, −14), forward −Z (the edge is ahead, the harbor far below). Yaw ±120°, pitch −70° to +50°.

**Scene notes.** Craters of 0.5–6 m. The lamp at (1.5, 3.4, −15), an old street lamp, dark. The moon's edge at z ≈ −17 from B; the harbor far below at pitch −35°, with the lighthouse blinking. The sky holds the harbor's dusk glow low on the horizon.

| Find | Pose / position | Notes |
|---|---|---|
| **S6** the harbor far below | from **B**: yaw −30°, pitch −35°, zoom 1.5× | Features: the lighthouse mole; the curve of the harbor wall; the moon's rim in the foreground. |
| **H6a** footprint | from **A**: yaw +35°, pitch −25°, minZoom 2.5× | In the dust by a crater rim, position about (−3, 0.02, −4). |
| **H6b** lost glove | from **A**: yaw −50°, pitch −15°, minZoom 3× | Half-buried in a small crater, position about (5, 0.1, −5). |
| **The light** (required, part 1) | from **A**: yaw +10°, pitch −30°, zoom ≥ 2× to see; verb *Take* | A faint ember in a small crater, position about (−0.8, 0.05, −3.2). It does not glow from a distance; it is a dim spark seen only when looking in. |
| **The lamp** (required, part 2) | from **B**: yaw +15°, pitch +10°; verb *Use* (light) | The lamp lights. The moon glows, the sky brightens, the dust turns silver. |
| **Dive target** | the moon's edge from **B**: yaw −30°, pitch −50° | Active after the lamp lights. Verb *Look closer*. Note: S6 is at pitch −35°, the edge at −50°, so a sketch lock and the dive ring do not overlap. |

**Ordinary usable things (≥16; important usable here: light, lamp, edge, 2 hidden = 5):**
1. rock (turns over: a beetle-shaped pebble)
2. big rock (does not move; dust falls)
3. crater (echo)
4. the lamp's door (opens, closes)
5. picture flag (flaps)
6. telescope (turns; shows the harbor closer)
7. pebble (skips)
8. dust pile (puffs)
9. small meteorite (warm; glows a little)
10. crack (dust trickles)
11. bottle (rolls)
12. coin (spins)
13. a star in the sky (twinkles)
14. the lamp's glass (rattles) before the light
15. a second footprint trail (leads nowhere)
16. a tin cup (rings)
17. a rope end (frays)
18. a dust bunny (rolls)
19. a signpost with pictures (spins)
20. a pale plant (closes)

**Props target:** ≥150. Rocks (instanced ~80), pebbles (~40), craters (12), the lamp, the flag, the telescope, cracks, bottles, cups, a signpost, dust piles, plants.

---

## 8. Ending — the street at night

Landing viewpoint: **A** of place 1, in the night state. The last sketchbook page draws itself: the cat on the step looking up at the glowing moon. Then the end screen: time, finds (n of 24), hints used, **Keep looking**, **Restart**. *Keep looking* returns to the night street; the player can back out up the chain to find what they missed, and everything keeps its state.

Things that were there all along: the dull moon above the roofs (now glowing); the cat in the shop window (now on the step); the shop's painted cat's-eye sign; the unlit lamps (now lit); the barrel whose water reflected the moon.

---

## 9. Hints (three levels each; shown only when asked)

Level 3 is never text: it is an arrow at the screen edge toward the target, or a highlight when the target is in view. `type: point` with the object id. Level 1 and 2 are one short line. Hints for a place are offered only while the player is in that place.

### Required steps

| Step | L1 — where to look | L2 — what to notice | L3 |
|---|---|---|---|
| Key (1) | Stand on the shop's step. | Something small is under the flowerpot on the sill. | point: key |
| Shop door (1) | The door is locked. What did you pick up? | Use the key on the door. | point: door |
| First dive (1) | Look closer at the open door. | Hold the lens on the dark doorway until the ring fills. | point: doorway |
| Blue drawer (2) | Stand by the chest of little drawers. | One drawer is not the same colour as the others. | point: blue drawer |
| Envelope (3) | Stand on the letter hill. | One envelope near you has its flap up. | point: envelope |
| Feather on the cat (3) | Use what was in the envelope. | Cats hate a feather on the nose. | point: nose |
| Ear (4) | You still have the feather. | Look up. Tickle the ear. | point: ear |
| Reflected lamp (5) | Look up at the wet shine of the eye. | Pupils widen in the dark. Cover the light. | point: reflected lamp |
| The light (6) | Look into the small craters near where you landed. | One crater has a spark in it. | point: light |
| The lamp (6) | Stand by the old lamp on the rise. | Put the light in the lamp. | point: lamp |
| Dive home (6) | Stand at the edge and look down. | Hold the lens on the edge of the moon. | point: edge |

### Sketches

| Sketch | L1 | L2 | L3 |
|---|---|---|---|
| S1 | It was drawn from the middle of the street. | Look up and to the left. Two roofs. Zoom in. | point: sketch pose S1 |
| S2 | It was drawn from the doorway. | The counter and the tall clock. Zoom a little. | point: S2 |
| S3 | It was drawn from the top of the letter hill. | The bridge of keys, with the tail behind it. | point: S3 |
| S4 | It was drawn from the collar. | Three charms in a row. The bell is in the middle. | point: S4 |
| S5 | It was drawn from the edge of the iris. | Three stars in a line, with a ring crossing them. | point: S5 |
| S6 | It was drawn from the rise, beside the lamp. | Look down over the edge. The harbor. | point: S6 |

### Hidden objects

| Object | L1 | L2 | L3 |
|---|---|---|---|
| Red umbrella | Behind the fish stall. | Among the oars and rods, low down. Zoom. | point |
| Ship in a bottle | A lit window across the street. | On the sill, first floor. Zoom right in. | point |
| Teacup with a star | High shelves near the chest of drawers. | Twelve cups. One has a star. | point |
| Glass marble | Low, by the counter. | At the counter's foot, near the mouse hole. | point |
| Paper boat | The ink pool. | Under the bridge. | point |
| Stamp with the moon missing | The tower of stamps. | Near the top. A night sky with a hole. | point |
| Flea with a hat | The fur on the cheek. | On one hair, high up. Zoom right in. | point |
| Fish bone | Where the fur meets the collar. | Behind the fish charm. | point |
| Comet | Between the rings, from the ring near the pupil. | A streak with a tail. | point |
| Tiny reflected lighthouse | The wet shine, from the iris edge. | Something very small has a light on top. | point |
| Footprint | The dust near where you landed. | By a crater rim, to the left. | point |
| Lost glove | A small crater near where you landed. | Half-buried, to the right. | point |

---

## 10. Sketchbook alt text (for `strings.json`)

- S1: "A lighthouse seen between two pointed roofs. A fish-shaped weathervane on the left roof."
- S2: "A shop counter with brass scales. A tall clock behind it. A birdcage hangs above."
- S3: "A bridge made of old keys over dark ink. A tower of stamps behind. A cat's tail curls at the edge."
- S4: "Three charms on a collar: a fish, a bell, a house. A whisker crosses above."
- S5: "Three bright stars in a line. A curved gold ring crosses them. The corner of a window."
- S6: "A small harbor far below, seen over a grey rim. A lighthouse on a stone pier."
- Last page (start): "A grey moon with an old lamp. The lamp is dark."
- Last page (end): "A cat on a step, looking up at a glowing moon."
- Outlines: "a folded umbrella with a hooked handle", "a small ship inside a bottle", "a teacup with a star on its side", "a glass marble", "a paper boat", "a stamp showing a night sky with a hole where the moon should be", "a flea wearing a tiny hat", "a fish bone", "a comet with a tail", "a tiny lighthouse", "a footprint", "a glove".

---

## 11. Shape of `src/world/answers.json` (read only by the judge)

```json
{
  "_notice": "ANSWER DATA. To move server-side before any prize hunt.",
  "order": ["street", "shop", "drawer", "cat", "eye", "moon", "street_night"],
  "requiredSteps": {
    "street": ["take_key", "use_key_on_door"],
    "shop": ["open_blue_drawer"],
    "drawer": ["open_envelope", "take_feather", "use_feather_on_nose"],
    "cat": ["use_feather_on_ear"],
    "eye": ["cover_reflected_lamp"],
    "moon": ["take_light", "use_light_on_lamp"]
  },
  "diveTargets": {
    "street": { "object": "doorway", "activeAfter": "use_key_on_door", "to": "shop" },
    "shop": { "object": "blue_drawer_inside", "activeAfter": "open_blue_drawer", "to": "drawer" },
    "drawer": { "object": "cat_neck", "activeAfter": "use_feather_on_nose", "to": "cat" },
    "cat": { "object": "eye_open", "activeAfter": "use_feather_on_ear", "to": "eye" },
    "eye": { "object": "pupil_round", "activeAfter": "cover_reflected_lamp", "to": "moon" },
    "moon": { "object": "moon_edge", "activeAfter": "use_light_on_lamp", "to": "street_night" }
  },
  "sketches": {
    "S1": { "place": "street", "viewpoint": "A", "yaw": 28, "pitch": 14, "zoom": 1.8, "lockDeg": 10, "warmDeg": 25, "zoomTol": 0.35, "holdMs": 800 }
  },
  "hidden": {
    "umbrella": { "place": "street", "viewpoint": "A", "yaw": -55, "pitch": -18, "minZoom": 2.5, "hitDeg": 2.0 }
  }
}
```

The rest of the entries follow the tables above. Positions of hidden objects are also stored as scene coordinates in `objects.json` (under `x3d`), and a build-time check confirms that each `answers.json` direction actually points at the object from its viewpoint.

---

## 12. Graybox tuning log (Phase A, 2026-09-29)

Guideline numbers changed while building the grey version. The rules did not change. The tables above are updated where they matter; this log records what moved and why.

| What | Was (Phase 0) | Now | Why |
|---|---|---|---|
| Street houses and lighthouse | houses 10 m tall; lighthouse on a headland at (−40, −70), 12 m | houses 5 m; lighthouse on a mole at (−22, −40), 20 m tall | From street level a distant lighthouse was hidden behind the house row. Now it shows between the second and third gables. |
| **S1** pose | A, yaw 28, pitch 14, zoom 1.8 | A, yaw 29, pitch 17, zoom 1.8 | Follows the lighthouse move. |
| Drawer layout | ink pool and key bridge to the right of the letter hill | ink pool at (−14, 0, −30), bridge across it at z = −29, stamp tower at (−16, 4.5, −37), all to the left-front of B | The original S3 direction looked at the cat, not the bridge. |
| **S3** pose | B, yaw −10, pitch −6, zoom 1.5 | B, yaw 35, pitch −14, zoom 1.4 | Follows the drawer layout. |
| Paper boat (hidden) | A, yaw 8, pitch −20, 15 units | A, yaw 25, pitch −7, 33 units | The old direction pointed below the drawer floor. |
| Stamp with the moon missing (hidden) | B, yaw 30, pitch 10, 9 units | B, yaw 30, pitch 6, 20 units | Sits on the moved stamp tower. |
| Cat collar viewpoint B | (40, 12, 60), facing +X along the collar | (40, 12, −40), facing −Z; the collar runs across in front at z = −76 | Standing on the collar's line made it fill the view as a wall. |
| Charm colours | all brass | fish teal, house cream, bell bright gold, heart red, tag grey | Brass charms vanished against the orange head. Not colour-only: the shapes differ too. |
| S4 alt text | "a fish, a bell, a house" | "a house, a bell, a heart" | Matches the order along the collar. |
| Moon ground | 300 × 300 plane | 80 × 44 plane ending at the rise | The plane hid the harbor below the edge. |
| **S6** pose and the edge | B, yaw −30, pitch −35; edge at yaw −30, pitch −50 | B, yaw 24, pitch −41, zoom 1.5; edge at yaw 24, pitch −56 | The harbor far below sits to the left of the rise, not the right. |
| Turn limits | drawer B ±130, cat B ±110, eye B ±140, moon B ±120 | drawer B ±170, cat B ±140, eye B ±180, moon B ±180 | Each stand mark must be visible from the other viewpoint. |
| Lens hold | not specified | holding the lens zooms toward 4× in about a second; letting go eases back to the wheel or pinch level | Phones need a one-finger zoom that also works for the dive ring. |
| Look direction | — | the world follows the finger: drag right to look left, drag down to look up; arrow keys turn 70° per second at 1×, slower when zoomed | One convention for both axes. |

Not changed: every rule in §0, the chain in §1, the hint text (two lines reworded to match the moved bridge and the moon's edge), the decoy counts.
