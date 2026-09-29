# Idea Incubator Entry — The Zoom-World: Vision & Structural Decisions (2026-07-01)

**Type:** Founder vision + founder-approved structural direction (NOT implementation authorization).
**Status:** ACTIVE. Decisions below are founder-made on research evidence; prototype tasks remain open.
**Sources:** `The_Hunt_Zoom_World_Structure_Research_2026-07.md` (evidence), founder session decisions 2026-07-01, `The_Hunt_Recursive_Hybrid_Deep_Research_2026-06.md` (prior competitor analysis), ADR-0011 (2D-first premise).

---

## 1. The world vision (founder's own description, canonical)

The foundation is a Zoomquilt-style seamless, recursive, multi-directional zoom canvas that feels endless — achieved through seamless transitions, depth, variety, and looping, **not literal infinity** ("the more infinite it feels, the better"). Zooming is the core act of travel: it doesn't just magnify, it carries the player between scales and places — a street into a shop into a drawer into a cat into the cat's eye and, after zooming further into the eye, out onto the moon; on the moon a store one can enter (later capability), and onward into new things without perceivable boundary. Onto that endless-zoom foundation are layered what Zoomquilt lacks: dense searchable scenes (Hidden Folks), openable and stateful objects (The Room), hidden objects and clues, and multi-directional navigation the player controls — all as a fair, live treasure hunt. The zoom-canvas is the world; the objects, hidden things, and clues are the play.

## 2. Structural decisions (founder-approved 2026-07-01, on research evidence)

**D1 — Looping is the PRIMARY structure.** Verified by existing works (Zoomquilt 1/2, Arkadia, Infinite Flowers — all finite loops made seamless by edge-blending) as the strongest proven felt-infinity technique, and the simplest for a small team (art-heavy, code-light). Cost scales linearly with unique scenes — accepted.

**D2 — Recombinant (shared-layer) is a MANUAL-ONLY fallback, not an automatic trigger.** Research found no precedent for a recombinant zoom world; repetition risk is real ("even a few visible repeats can break the magic"). Therefore: recombinant is NEVER adopted automatically. The fallback QUESTION does not even arise unless a looping world's art cost reaches **5× the affordable art budget** (founder set this threshold, deliberately more conservative than the research's ~2× suggestion). At 5×+, the question may be raised — but the DECISION remains a manual founder act; absent that explicit decision, the design stays looping.

**D3 — The hybrid stays a live option.** Loop the major world segments (variety + felt-infinity in the big chunks) while reusing connector/transition layers between them (saving effort on low-value connective tissue). No precedent; promising; a prototype question, not a now-decision.

**D4 — Multi-directional branching is kept in the plans as a conditional aspiration.** Research found branching multi-directional zoom essentially unexplored (all published works are single-path). The street→cat's-eye→moon multi-directional vision is genuinely novel territory — exciting, likely significantly more costly, and dependent on Foundry maturity, tech progress, and other factors. Kept in plans; not committed; revisit as capabilities and costs clarify.

## 3. Open prototype tasks (research said only hands-on can settle these)

P1 — **Repetition perception:** small recombinant test (2–3 shared layers stitched in ~4 orders) — do users notice reuse? (Informs D2's viability if ever triggered.)
P2 — **Clue management in reused layers:** place a unique clue in a shared layer; check for off-path encounters. (Informs D2/D3 complexity.)
P3 — **Loop orientation:** a small loop (~6 scenes in a circle) — does the wrap confuse players; is a visual signpost needed? (Informs D1.)
P4 — **Multi-directional branching:** a minimal two-direction branch prototype. (Informs D4 — novel, no playbook exists.)

## 4. Interactions with the rest of the platform

- **Does NOT block the single canary** (Foundry pipe test — independent of world structure).
- Shapes the future **runtime recursive-transition grammar** (scene-linking, scale-jump transitions, loop-wrap handling) — a separate build from the Foundry, on the other side of the World Package boundary.
- Clue-fairness constraint recorded: looping needs once-only clue triggering; recombinant (if ever) needs per-instance clue/state scoping — a known complexity cost of D2.
- Premises held: 2D deep-zoom grammar, 3D deferred (ADR-0011); provider selection via future bake-off (separate track).
