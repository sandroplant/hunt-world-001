# The Hunt — World 001: independent consolidation and founder decisions

**Date:** 2026-09-29
**Written by:** Claude Opus 5.5, as the independent consolidator. This document builds nothing.
**For:** Sandro (founder and final decision-maker).
**Status:** Recommendations for your decision. Nothing here is approved until you sign Appendix A.
**Companion file:** `WORLD_001_FABLE_BUILD_SPEC_v1_2026-09-29.md`. This is the spec you hand to Fable.

**How the claims are labelled** (the same labels your project uses):
- **FOUNDER DECISION**: yours, and binding.
- **VERIFIED**: checked against a file, the code, or a primary source.
- **RECOMMENDATION**: my advice.
- **HYPOTHESIS**: untested.
- **OPEN**: undecided.

A fresh reviewer who had not seen the draft checked both documents against your files. This version includes its corrections.

> **Update, later on 2026-09-29.** A deeper research report (`Hunt platform strategy research.md`) changes some advice in this document:
> 1. **The signature.** The advice to make "the world contains a model of itself" your signature is withdrawn. Zoom stays the signature ("look closer: anything can become a new place"). The model becomes a tool.
> 2. **World 001.** The report recommends two steps. First, a search-first zoom chain of 5–6 nested places. Then *The Keeper's Model*, only if the first step passes.
> 3. **First buyers.** They should be company team events, not museums or libraries.
> 4. **Two facts in §2.2** are corrected below: the touch controls and the Sakura Crossing code.
>
> Nothing is approved until you decide.

---

## 0. The short answer

**1. The brief's main correction is right.** The Hunt must feel like entering a place you can search, not like a chain of riddles. A small walkable world is a sound next experiment.

**2. The brief's evidence is weaker than it reads, in two ways.**
- **The Fable example shows scenery, not gameplay.** The Fable example repository builds walkable scenery. It does not build gameplay. Its own Kyoto code says: "Nothing here is a puzzle and nothing here is a game mechanic."
- **The House failed for design reasons, not because it was 2D.** Its scenes were sparse, every usable object had a label, and progress came from choosing answers to text clues. A 3D world built the same way would fail the same way.

**3. As written, World 001 would test "a walkable place", not "a recursive Hunt world".** I changed its shape so that two things are at the center: zooming into a nested place, and coming back to a place that has changed.

**4. My World 001 is *The Keeper's Model*.**
- A small harbor town contains a model of itself.
- The model is the same town one hour earlier. The missing hour is still inside it.
- You zoom into the model to go in.
- What you change in the past changes the present.
- The clues are wordless sketches: "find the spot where this was drawn."

**5. It needs your signature first.**
- The brief conflicts with your freeze note, with your September 15 decision (which said no new world and no engine change), and with ADR-0011.
- A one-page authorization makes this clean (Appendix A).
- Your September 6 note said that any change to the 2D-first order must be "informed by a bounded prototype". That note did not approve a prototype. Your signature on Appendix A would.

**6. The evidence bar becomes clear, and higher than the brief's, but still lower than your July plan.**
- Five adults who have never seen the project test it.
- The pass/fail thresholds are written down before the test.
- There are two separate verdicts: one for the design, one for the method.
- Your July plan asked for 10 strangers. Some time limits are also looser than earlier proposals, on purpose, because this is a first 3D try.

**7. Cash can stay at $0.**
- On a Max plan, Fable 5.1 is included, up to 50% of your weekly usage limits.
- On Pro it is pay-as-you-go. Then stop and decide.

**8. Best next action.** Back up your uncommitted September work today (Appendix C, step 1). Then sign Appendix A and start Fable on Phase 0.

**How confident I am:**
- **High:** the facts about the conflicts and the evidence. I read them directly.
- **Medium:** the World 001 design. It is my judgment, and it is untested.
- **Low:** the time estimates.

---

## 1. What I read, and what I could not verify

### What I read
- I browsed `~/Projects/The-Hunt` directly today and copied the documents into my workspace to read. This covered:
  - all 159 Markdown and JSON files in `docs/`;
  - the root documents;
  - the House pilot's source and tests;
  - the screenshots.
- **In full, myself:**
  - the September 28 brief;
  - `CURRENT_STATE`, `PROJECT_BRIEF`, the decision register, and the source map;
  - the founder clarification, the freeze note, and the July adjudication;
  - ADR-0011 and the technology standard;
  - the vertical-slice definition and World Package v0.1;
  - the proposed benchmark gates and the zoom-world incubator entry;
  - the House work package, the player-clarity memo, and the September 7 context note;
  - `START_HERE` and the screenshots.
- **By three parallel research passes, with citations:** everything else. I checked their key claims against the files.

### What I checked outside
- Anthropic's Fable 5.1 pages and its plan page.
- The `PhiloLabs/fable51-worlds` repository. It was cloned, built, and loaded in a browser.

### What I could not verify
- **The Foundry source code itself.** I used the documents and the July review.
- **Whether your GitHub repository is private now.**
- **Whether you replayed the House after the September 15 clarity pass.** The brief suggests you did, but there is no record on disk.

### Repository state today (VERIFIED)
- The branch is `docs/consolidate-digital-xr-2026-09-06`.
- The last commit is from July 2 (the freeze note).
- **All September work is uncommitted:** 1,267 changed or new files, about 75 MB. That includes the docs, the research, and the House pilot.
- **It exists only on this Mac.** The recovery bundle is on this Mac too.
- I checked the files that would be backed up. There is no `.claude` folder, no secret-looking file (such as `.env` or `.pem`), and no file over 50 MB.

### One incident
My read-only `git status` left an empty lock file (`.git/index.lock`), because I cannot delete files on your Mac. I moved it to `.git/_to_delete/`. Git works normally. Appendix C has the command to delete it.

---

## 2. What the evidence actually shows

### 2.1 Why the House of the Missing Hours felt wrong (VERIFIED from the screenshots and code)

**What it is:**
- 13 flat, provisional scenes: vector drawings, with some engraving art.
- Each scene has only 1–5 objects you can use (28 in total).
- Every usable object carries a visible label ("Inspect the clock"). Nothing is hidden.
- Zoom is never needed. Everything can be read at "Fit view".
- Progress works like this:
  - You read an inscription.
  - You choose one of three buttons (STAR, MOTH CYLINDER, BLUE).
  - The last lock is "22:57 + GLASS + UNWIND".

It is a riddle game inside a picture frame. It never asks you to look for anything.

**So "2D failed" is not proven:**
- A dense 2D search world, like Hidden Folks, was never built.
- Your July fun-test was never run either. It would have used 8–12 dense illustrations and 10 strangers.
- No one outside the project has played any build. Every verdict so far has been yours alone.

**What this means for World 001.** 3D does not fix this by itself. The spec bans the four causes:
1. labels on objects;
2. sparse scenes;
3. typed or multiple-choice answers;
4. zoom being optional.

### 2.2 What the Fable example proves (VERIFIED by cloning and building it)

**What it is:**
- A real repository: MIT license, 17 commits between September 2 and 8, 2026.
- Six separate apps: three built by Fable, three by a GPT model.
- **Union Square:** walkable city blocks, plus two stores you can walk into.
- **Kyoto:** one continuous walking route. The "seven scenes" are seven shots in its film. Most of its 142 "interactions" play a sound.
- **Death Star:** a flight cinematic.

**What is missing:**
- No world has touch controls for walking. (One GPT-built viewer can turn the camera by touch.)
- There are no phone measurements.
- Frames were timed with JavaScript only.
- None of the worlds rebuilds from a clean copy. An open pull request says so.
- Two README images use Creative Commons photos without credit.
- The GPT-built Kyoto world reuses code from another open-source project (Sakura Crossing) and credits it. The Fable-built Kyoto world has a small overlap, about 2.5% of its lines, and no third-party notice. (Corrected later on 2026-09-29.)
- The "Fable vs Codex" comparison is one side-by-side video, with unmatched cameras and no scores.
- The cost, about $33 and about 8 million tokens, is self-reported on Hacker News. It is unverified.

**It proves:** Fable can build walkable, stylized scenery from a long spec in a few days, with a review loop.

**It does not prove:** searching, hidden places, nesting, coming back to changed places, phone play, or cost.

So World 001 tests something new. The spec makes gameplay the first thing built (a grey "graybox" version) and the first gate.

### 2.3 Model facts (VERIFIED against Anthropic's pages)

**The brief is right on these:**
- Fable 5.1: 1M context, 128K output, released September 1, 2026, $10/$50 per million tokens on the API.
- Opus 5.5: 1M context, 128K output, $4/$20 per million tokens.

**Corrections:**
- **The brief's wording shifts Anthropic's advice.** Anthropic says: when unsure, start with Opus 5.5. Use Fable 5.1 for demanding, long agentic work, **or** when Opus at higher effort still falls short. The brief merged these two reasons into one.
- **Fable's default effort** is High in Claude Code and Medium on claude.ai. This is from Anthropic's Fable and Mythos 5.1 announcement.
- **Fable 5.1 needs Claude Code 2.1.255 or later.**

**Is Fable the right builder?** Probably yes:
- this task is long, has many files, and needs visual self-checks;
- your question is about the Fable method.

But record the model as a variable. If Fable usage runs out, Opus 5.5 at high effort is the fallback, and the switch is logged.

---

## 3. A — Reconciled requirements

### Founder decisions (binding)

1. **The game is entirely digital.** No physical travel, geolocation, or physical objects. *(Founder clarification, 2026-09-06)*
2. **Long-term, the game is immersive 3D**, with virtual walking and optional flight on headsets. Phone access stays. No engine, headset, or schema is chosen. *(Founder clarification; project brief)*
3. **The July 2 freeze stands.** Exceptions are given one bounded task at a time. *(Freeze note; START_HERE, 2026-09-15)*
4. **Fun comes before the Foundry.** Foundry scope is frozen. *(July adjudication, decisions A and B)*
5. **ADR-0011: 2D first.**
   - Hybrid or 3D comes only through a benchmark with thresholds set in advance, and your approval.
   - A full 3D world is "Build Later".
   - Its September 6 note says it is "not a permanent prohibition".
   - Your founder clarification adds that any change of order must be "informed by a bounded prototype, not by a model announcement alone".
6. **Your world vision.** "Zooming is the core act of travel." Looping is the main structure. Branching in many directions is a hope that depends on conditions. *(Zoom-world incubator, 2026-07-01)*
7. **Ideas you already accepted:** *(July adjudication, Part 2)*
   - scale-locked clues;
   - state-shifted repeats;
   - the one-transition runtime;
   - the depth-ribbon plus fog-of-war atlas;
   - "guaranteed find in 60 seconds".
8. **Standing doctrine** *(project brief; technology standard)*:
   - Quality first. No "convenient" technology choices.
   - Every placeholder is recorded. Humans stay accountable.
   - No crypto, NFTs, ad analytics, or autonomous approval.
   - One new world for each major competitive hunt.
9. **$0 additional spending.** *(START_HERE; "effectively zero discretionary budget")*
10. **September 15:** "Do not create another world, add rooms, change engines, or expand the Foundry." This applied to that clarity pass. The September 28 brief goes against it, and there is no signed record yet.

### Verified findings
- The repository state (§1).
- The House facts. There has been no outside playtest, and play time was never measured.
- The Foundry, from the documents:
  - the safety envelope exists, but the real generation path does not;
  - the known blockers remain;
  - World Package v0.1 is shaped for 2D deep-zoom tiles, and it bans executable code.
- The model facts and the Fable example facts (§2).

### Recommendations (not approved)
- **The 3D engine.** The September 7 memo names Babylon.js as the provisional lead for a 3D room. It also says: "Do not add a new runtime now."
- **Proposed playtest gates:** 8/10 learn the controls, 7/10 finish within 15 minutes, 6/10 want a second hunt.
- **Other proposals:** the one-room 3D comparison, the three-view cabinet pilot, and commission-led distribution.

### Hypotheses (untested)
- A 15–25 minute session.
- A 70/30 split between exploration and puzzles.
- Code-as-world can fit the World Package idea.
- Fable is the best builder.
- Spatial twins as a future source of worlds.

### Open questions (from your register)
- the 3D runtime;
- a spatial extension to the World Package;
- the list of supported devices;
- fairness across devices;
- the scope of player tests;
- the paid-tool budget;
- reopening the Foundry;
- prize policy;
- team size;
- evidence of distribution.

---

## 4. B — Critique of the September 28 brief

### 4.1 Contradictions, and how the spec fixes each one

**1. No authorization.** The brief says "Build Now", but there is no signed record.
*Fix:* Appendix A.

**2. ADR-0011.**
- The brief lists ADR-0011 as reading, but it never deals with the conflict.
- World 001 is a full "3D world" in ADR-0011's own terms (§11). That is "not current scope".
- It also skips two steps: a passed 2D slice (§21 step 1), and a hybrid experiment before any full 3D (§21 step 7).

*Fix:*
- Appendix A waives both steps, for this experiment only.
- The spec's §18–21b is the benchmark plan, written in advance.
- World 001 alone cannot change ADR-0011's order. §24 asks for a comparison with the same experience in 2D.

**3. Walking versus zooming.** The brief makes walking primary. Your vision makes zoom the way you travel.
*Fix:* walking moves you within a place, and zooming moves you into a place. The dive into the model is the center of the game.

**4. Code-as-world versus the World Package.** The package bans executable code. So the brief's "potentially compatible" is not true as written.
*Fix:*
- The world's identity and rules live in data files.
- The generators are separate.
- The renderer never decides outcomes.

**5. Three.js was chosen because the Fable example used it.** Your standard forbids "convenient" choices, and the September 7 memo names Babylon.js.
*Fix:* a written placeholder record. The Hunt-specific reason is less correction work for an AI builder. The renderer layer stays replaceable.

**6. Money.** Fable costs $10/$50 per million tokens on the API, and the brief sets no cap.
*Fix:* use your subscription only, with checks in Appendix C. Stop if anything would bill.

**7. The evidence bar is too low.** "Founder plus one non-author" is below every bar in your project. The slice asked for 5 blind testers. The July fun-test asked for 10 strangers.
*Fix:* 5 adults from outside the project, with thresholds written in advance.

**8. Measurement.** Three parts of the brief conflict: §9 "must be measured", §17 "can plausibly occupy", and §12 "no analytics".
*Fix:* a stopwatch protocol, plus an opt-in session log. The log stays on the device and is saved as a file.

**9. You must play blind, but you are reading the spec.**
*Fix:* the solutions go into a separate file (`SOLUTIONS.md`), and the spec's Appendix S is marked as spoilers. Your play is "informed". The strangers are the real test.

**10. "No glowing hotspots", but no rule for how players find usable things.** Also, an accessible list of objects would reveal everything.
*Fix:*
- A usable object shows its action only when you are close and looking at it.
- "Describe surroundings" lists only what is visible.

**11. "Something here is not what it seems" is a mood, not a goal.** It would probably fail your own 30-second test.
*Fix:*
- The opening line: "This town lost an hour tonight. Find the places in the sketchbook."
- The sketchbook's last page shows the tower door open. That is the goal, as a picture.

### 4.2 Claims in the brief that are overstated (VERIFIED)

**About Anthropic and the Fable example:**
- Anthropic's advice was merged into one reason (§2.3).
- "Independent" evidence: it is one unaudited showcase, a week old.
- "Text, image, or video input": only text briefs are published.
- "Seven connected scenes": they are film shots.
- "Reusable procedural code": only inside each world.
- "Reviewed by independent agents": only Union Square has reviews, and one of those reports was run by the builder itself.
- "Rather than redistributing reference photos": two images are uncredited.
- "Represented as code": Union Square ships 206 binary mesh files plus JSON.
- "Cheaply and repeatedly": there is one self-reported cost, and no world rebuilds from a clean copy.

**About your own records:**
- Your register classes the August 8 spatial-twin note as a historical proposal, not current research.
- Some House failures in the brief appear nowhere else: little movement, zoom not central, and duration far below target. They are your testimony, and that counts. But the duration was never measured.

### 4.3 What was missing (now in the spec)

- **The game itself:**
  - a concrete goal;
  - hints for every required step;
  - "getting warm" feedback near a sketch spot;
  - help with orientation: a depth label, a map, landmarks;
  - save and restart;
  - a defined ending;
  - touch controls.
- **The test:**
  - accessibility and comfort in the pass criteria;
  - numeric thresholds, including how to measure each one;
  - two separate verdicts;
  - a playtest protocol with consent;
  - a non-competitive label.
- **Control of the build:**
  - caps on spending and effort;
  - where the code lives;
  - style frames approved before the art pass;
  - a license check on any outside code;
  - a clean-copy rebuild test;
  - an editability test;
  - honest frame timing;
  - a phone frame recorder.
- **Before anything new starts:** a backup of your current repository.

### 4.4 Constraints that are too strict, or not needed

- **"No analytics".** As worded, it blocks measurement. *Replace with:* a local opt-in session log.
- **Too much at once.** The brief asks for 8–12 discoveries, 3–5 zones, and 15–25 minutes all at once. That risks spreading quality thin.
  - The spec makes the main chain MUST: about 10 discoveries, 3 deductions, and 2 return moments.
  - The extras are COULD.
  - A grey version is played before any art.
- **F3 cannot happen inside World 001.** F3 means "a second world through the same pipeline", and that needs a second world. So World 001 can show "once", never "repeatedly".
- **The brief's Foundry trigger (F1–F4) ignores your freeze triggers.** Reopening the Foundry stays a separate founder decision under the freeze note.

### 4.5 Risks, and what reduces them

**Technical:**
- **The phone may be too slow,** because the town is drawn twice. *Reduce with:* simpler distant detail, reused geometry, a Low quality tier, and early measurement.
- **The dive may break at tiny scales.** *Reduce with:* re-centering the world on every dive.
- **Collision may fail** on stairs and edges. *Reduce with:* a walk test that deliberately tries to break it.
- **iPhone Safari** has pointer-lock quirks. *Reduce with:* drag-to-look as the default.
- **Memory may leak** after repeated dives. *Reduce with:* a leak test.

**Art:**
- **Crude "programmer art".** *Reduce with:* the handmade-miniature style, style frames approved first, and an art reviewer.
- **Visible repetition.** *Reduce with:* variation by seed for every building.
- **The model may not read as the same town.** *Reduce with:* the same generators, tilt-shift focus, and your own check.
- **Sketches may not match the real views.** *Reduce with:* sketches drawn automatically from the world.

**Production:**
- **The builder may favor scenery over gameplay,** as the Fable example did. *Reduce with:* a graybox first, and a gameplay gate.
- **Scope may creep.** *Reduce with:* MUST, SHOULD, and COULD levels, plus stop points.
- **The builder may grade itself.** *Reduce with:* reviewers in fresh sessions, and real people.
- **Usage limits may run out in the middle of the build.** *Reduce with:* `PROGRESS.md`, so any session can resume.
- **Your time.** *Reduce with:* a 10-hour cap.
- **The uncommitted repository.** *Reduce with:* backing it up first.

---

## 5. C — The right World 001

### The options

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. A museum at night.** The brief's museum idea; the Midnight Gallery line. | Continuity with earlier work. Lots to inspect. Interiors are cheap to render. | Rooms and corridors bring back the "separate rooms" feel your master plan rejected. Every painting-world is a separate, authored place, so nothing matches automatically. Weak views and landmarks. | No |
| **B. A harbor town that contains a model of itself.** | Tests all four parts of the hypothesis. The nested copy matches automatically. Changing the state multiplies content. Continues the Missing Hour line. | The town is drawn twice, which is a risk on phones. The dive is hard to build. The rule "the model is the past" must be taught. | **Yes** |
| **C. One dense cabinet-house.** | Dense and cozy. | Moves from room to room. A small sense of place. | No |
| **D. A tiny planet.** | Natural looping. A strong identity. | Spherical gravity and camera are complex. Can cause nausea. Hard on phones. | No |
| **E. A dense 2D search world in OpenSeadragon.** | The cheapest. Fits ADR-0011. Tests searching. | Does not test walking or 3D, which you now want. | Not now. It is the fallback. |

### My recommendation: B, The Keeper's Model

1. **It tests all four parts of the hypothesis at once:** exploring, spatial discovery, nested discovery, and coming back to changed places.
2. **The nested copies match automatically,** because they are built from the same code.
   - This fixes half of the problem your research called the hardest: continuity across nested levels.
   - It does not fix the other half, originality. A copy of the town is not a new place.
3. **One layout gives three places** (present, past, unfinished) with little new art.
4. **It uses your own images:** the missing hour, the clock, the lighthouse, and "into the cat's eye and out onto the moon".

### What would change my mind
- **If the grey version is not fun:** one redesign. If the second grey version also fails, stop World 001 and consider option E.
- **If the phone fails (T2):** keep the desktop result, but do not adopt this route for the product yet.
- **If testers cannot understand "the model is the past"** (E5 or E6 fail): simplify to a single nest that is a new place, such as a painting you walk into.

### What World 001 cannot prove
- **Your "new place at every level" vision** (street → shop → drawer → cat's eye → moon), and "looping is primary". Only the moon secret touches it.
- **Repeatability.** That needs World 002.
- **Anything at scale:** live events, teams, and prize fairness.
- **Headset comfort.**
- **Production cost at scale.**
- **Long-term retention.**
- **A 2D-versus-3D verdict.** ADR-0011 needs the same experience built in 2D for that.

---

## 6. E — Replaceability

**Code generated by Fable is an experiment, not a Hunt architecture commitment.** World 001 chooses no engine, renderer, schema, provider, or pipeline.

What keeps it replaceable:
- The world's identity and rules live in data files.
- Three.js is a documented placeholder (spec §24).
- The Hunt-owned World Package stays the lasting format.

Any adoption follows ADR-0011: a benchmark, then a new ADR, then your approval. "Fable output" never becomes the package.

---

## 7. F — Founder decision summary

### Build Now
1. **Back up the September work.** Today; about 10 minutes (Appendix C, step 1).
2. **Sign Appendix A.** Then make the edits in Appendix B. Save the original files first.
3. **Build World 001 with Fable,** in this order:
   - Phase 0: the plan.
   - Gate A: you play the grey version.
   - Style frames: you approve the look.
   - Phase B: art and completeness.
   - Reviews, then one fix cycle.
   - 5 stranger playtests.
   - Phase D: 3 change requests.

### Build Next
Only if both verdicts pass. Under your freeze rules, each item needs its own small authorization.
- **Record the results** and update the source-of-truth documents.
- **Decide how to handle ADR-0011's order.** Either plan the 2D comparison that ADR-0011 §24 asks for, or amend ADR-0011 by a written founder decision that gives your reasons.
- **World 002.** A world that is clearly different, built from the same spec template, using half your World 001 time or less. This is the "repeatable" test.
- **A one-week "Daily Sketch" test** inside World 001 (Suggestion 4).
- **One commission conversation,** with World 001 as the demo (Suggestion 5).

### Build Later
- A Foundry redesigned around world generators plus a data manifest. Only after the F1–F4 conditions and a new ADR.
- A spatial extension to the World Package.
- Headsets and WebXR.
- A two-player mode.
- Live events.
- Prizes, after the legal work.
- Spatial twins.
- Creator tools.

### If it fails
- **Gate A fails twice:** stop World 001. Consider option E, a dense 2D search world.
- **The playtests fail but the method passes:** the builder works, so one more design round is cheap: a new grey version, then 5 new testers.
- **The method fails:** go back to option E, with your art direction.

### Acceptance criteria
- **The design verdict:** E1–E10 (spec §20).
- **The method verdict:** T1, T3–T8, and P1–P6 (spec §21).
- **T2**, the phone result, is recorded separately.

### Failure conditions
S1–S7 (spec §21a).

### Effort estimate (low confidence)
- **Fable:** about 15–30 hours of agent time, spread over 1–3 weeks by usage limits.
- **You:** about 10 hours during the build, plus about 5 hours of playtests.
- **Cash:** $0 on a Max plan.

### Best next action
Back up the September work today. Then sign Appendix A, and start Phase 0 with the kickoff prompt in Appendix C.

---

## 8. Five creative-director suggestions

These are the five changes I believe most increase the chance that The Hunt succeeds, in order of impact.

### 1. Change the heartbeat of the project from documents to players

This is the hardest one to hear.

**The facts:**
- The project has about 2.9 MB of planning documents.
- Several prototypes have been built: the portal proof, the four-view Missing Hour, the House, and its clarity revision.
- Zero people from outside the project have played any of them.
- The July freeze note named "the fun is unvalidated" as the core problem. Three months later, that is still true.

**The ritual:**
- Every week, 3–5 new people play the current build for 20 minutes, using the fixed script in Appendix D.
- You write one page of results, make one change, and repeat.
- One rule: no new governance or research document until the next playtest has happened.
- Under your freeze rules, give this ritual its own one-line authorization.

**Where to find players:**
- friends, and your soccer team;
- **NYU Game Center's Playtest Thursday** at 370 Jay Street, Brooklyn. It is free and open to the public, Thursdays 5:30–7:30 pm, and you bring your game. Check the page for the room and the visitor form;
- NYC indie-developer nights listed on Eventbrite. Playcrafting has run them.

Every other suggestion depends on this one.

### 2. Make "the world contains a model of itself" The Hunt's signature, and its factory

*(Withdrawn later on 2026-09-29. See the update at the top. Zoom stays the signature, and the model is one tool inside it.)*

In most worlds, a nested scene is new art that must match its parent. That is expensive, and it drifts. In a world built from code, the nested copy is the same code: at another scale, at another time, or in another style (a pencil drawing, winter, a storm).

That makes continuity cheap. It also gives you a look people will remember.

Two honest limits:
- **Originality still needs new places.** The moon secret points the way: some nests should be completely new worlds.
- **The idea is not unique on its own.** *Maquette* (2021) lets you walk inside a model of the world you are standing in. *The Past Within* (Rusty Lake, 2022) puts one player in the past and one in the future, and they must talk to solve it.

The Hunt's version can still stand apart. Put the model-within-the-world together with dense searching, wordless clues, and live shared hunts. The future two-player mode would then be natural for your team events: one player in the town, one in the model, each changing the other's world.

### 3. Use wordless clues: "find where this was drawn"

A sketch of a place is a clue anyone can use, in any language. That matters for a global event, and for players reading in a second language.

Why it beats a text riddle:
- The core skill becomes **looking**, which is what you want The Hunt to be.
- **Fairness can be checked by code.** The game knows exactly where each sketch was drawn from.
- **Clues never go out of date.** In a world built from code, the sketch is drawn from the world itself, so it updates when the world changes.
- **It works live.** Post one sketch publicly, and everyone searches the same world at the same moment.

### 4. One world, a new hunt every day

Worlds are expensive, so get many hunts out of each one.

**The "Daily Sketch":**
- Each day, one new sketch of a spot somewhere in the world, including inside the model.
- Players find it and share a small result card with no spoilers: time, hints used, depth reached. Wordle's shareable result grid is the model here.
- Add a harder weekly hunt.
- Add seasonal versions of the same town: the same generators with a new state, such as winter or a storm.

**Why it helps:**
- It spreads the cost of a world over many hunts.
- It builds a daily habit.
- It grows the audience for your big live events, instead of waiting for them.

Keep the daily hunts prize-free. Skill-based play is the right base for prizes later. But under your novelty rule, a prize hunt still needs a new or unsolved world.

### 5. Sell before you scale

Your strongest skill is selling, and the freeze happened because of income. Once World 001 passes its playtests, use it as a demo to land **one paid, commissioned world.**

**Who to approach:** a partner who already owns art and an audience, for example:
- a museum or a library that wants a "night at the museum" hunt;
- a children's book illustrator or publisher;
- a Brooklyn venue or brand.

**How to price it:** cover your real cost. The illustrative example in your own research shows that a $1,000 fee can underpay the work.

**What it gives you:**
- It pays for World 002.
- It tests distribution.
- It follows the path your research ranked strongest for early revenue.

Like suggestion 1, it needs its own authorization under the freeze.

**One more thing: the name.** To sell The Hunt, people need to be able to find it. "The Hunt" is hard to search for, and the trademark space is probably crowded. Test 3–5 names with your playtesters.

---

## Appendix A — World 001 authorization (draft for your signature)

> **FOUNDER DECISION — World 001 bounded experiment**
> Date: ____________
>
> 1. **What I authorize.** One bounded, local, standalone experiment: World 001, "The Keeper's Model". Claude Fable 5.1 builds it according to `WORLD_001_FABLE_BUILD_SPEC_v1_2026-09-29.md` (SHA-256: ______________________).
> 2. **The freeze.** This is a narrow exception to the July 2 freeze, like the House pilot. It does not reopen the application, the World Foundry, the database, or the World Package.
> 3. **ADR-0011.**
>    - World 001 is a "3D world" in ADR-0011 §11.
>    - For this experiment only, I waive (skip) two steps of ADR-0011 §21: step 1 (a passed 2D vertical slice), and the order in step 7 and §10 (a hybrid experiment before any full 3D world).
>    - My September 6 clarification did not authorize a prototype. This decision does.
>    - Spec §18–21b is the benchmark plan, written before the experiment. Criteria from ADR-0011 §22 that have no number there are recorded, not scored.
>    - No 3D grammar, engine, schema, or provider is adopted by this decision.
>    - World 001 alone cannot change ADR-0011's order. That needs a 2D comparison or a written amendment with my reasons, then a new ADR and my approval.
> 4. **Cash.** $0 beyond my existing Claude subscription. If anything would bill extra, the work stops. (Optional written cap: $______.)
> 5. **Location.** The build lives in `~/Projects/hunt-world-001`, a separate folder with its own git history. It gets read-only copies of context files only. Nothing in `~/Projects/The-Hunt` changes.
> 6. **Stop points.** I decide at each one: Phase 0, Gate A, the style frames, before the reviews, and before the playtests.
> 7. **Testing.** Five adults from outside the project play it, using the protocol in Appendix D. It is non-competitive, with no prize and no public release.
> 8. **What this replaces.** For World 001 only, this replaces the September 15 instruction "do not create another world ... change engines". The spec replaces the September 28 brief wherever they differ.
> 9. **The July fun-test.** The July fun-test exception stays open and unused. This decision does not replace it.
>
> Signed: Sandro Makharo

---

## Appendix B — The ADR-0011 note and other source-of-truth edits

**First, keep the originals.** Your founder clarification says to keep the original bytes before editing. Copy ADR-0011, `START_HERE.md`, and the decision register into `docs/history/`, in a dated folder, before editing them. The September 6 edits were handled the same way.

**Add at the top of ADR-0011**, dated, like the September 6 note:

> **FOUNDER DECISION — 2026-__-__:** One bounded 3D-world experiment, World 001, is authorized as prototype evidence. For this experiment only, it waives §21 step 1 and the §10 / §21 step 7 order. It selects no engine, renderer, schema, or provider. On its own, it cannot change this ADR's order. That needs a 2D comparison (§24) or a written founder amendment with reasons, then a new ADR. See `docs/experiments/world-001/`.

**Other edits:**
- **The decision register:** add the row "World 001 bounded 3D experiment — FOUNDER DECISION (date) — evidence toward the 3D-runtime question; no adoption."
- **START_HERE.md:** add one line under "Read this first" that points to World 001 and its authorization.
- **A new folder, `docs/experiments/world-001/`,** holding:
  - this document;
  - the spec;
  - the signed authorization;
  - later, `RESULTS.md`.
- **CURRENT_STATE.md:** update it only after the results.
- **The September 28 brief:** keep it unchanged, as history.

---

## Appendix C — Running it, one command at a time

Run each command on its own. Send me the output if anything looks wrong.

### Step 1 — Back up your September work (1,267 files, about 75 MB, only on this Mac)

**1. Go to the project.**
```
cd ~/Projects/The-Hunt
```

**2. Check the branch.** It must print `docs/consolidate-digital-xr-2026-09-06`. If not, stop.
```
git branch --show-current
```

**3. Check the repository is private.** It must print `"visibility":"PRIVATE"`. If `gh` is not found, stop and tell me.
```
gh repo view sandroplant/the-hunt-demo --json visibility
```
If it says PUBLIC, make it private first:
```
gh repo edit sandroplant/the-hunt-demo --visibility private --accept-visibility-change-consequences
```

**4. Count the files to save.** It should print about 1267.
```
git status --short --untracked-files=all | wc -l
```

**5. Look for private files.** It must print nothing. (I checked today: nothing.) If it prints anything, stop and send it to me.
```
git status --short --untracked-files=all | grep -E '\.claude/|\.env|\.db$|\.sqlite|\.pem|\.key$'
```

**6. Look for very large files.** It must print nothing. (I checked today: nothing.)
```
find . -path ./.git -prune -o -path ./node_modules -prune -o -type f -size +50M -print
```

**7. Stage, commit, and push.**
```
git add -A
```
```
git commit -m "Preserve September docs, research and House of the Missing Hours pilot"
```
```
git push -u origin docs/consolidate-digital-xr-2026-09-06
```

**8. Remove the empty lock file I moved aside.**
```
rm ~/Projects/The-Hunt/.git/_to_delete/index.lock
```
```
rmdir ~/Projects/The-Hunt/.git/_to_delete
```

### Step 2 — Fingerprint the spec, then make the World 001 folder

**1. Fingerprint the spec, for Appendix A.** Use the folder where you saved it (for example `~/Downloads`). Copy the long code it prints into Appendix A.
```
shasum -a 256 ~/Downloads/WORLD_001_FABLE_BUILD_SPEC_v1_2026-09-29.md
```

**2. Make the folder.**
```
mkdir -p ~/Projects/hunt-world-001/context
```

**3. Copy the two new documents** (from where you saved them):
```
cp ~/Downloads/WORLD_001_FABLE_BUILD_SPEC_v1_2026-09-29.md ~/Projects/hunt-world-001/context/
```
```
cp ~/Downloads/WORLD_001_CONSOLIDATION_AND_FOUNDER_DECISIONS_2026-09-29.md ~/Projects/hunt-world-001/context/
```

**4. Copy the background files from the project:**
```
cp ~/Projects/The-Hunt/docs/current/PROJECT_BRIEF.md ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/docs/governance/FOUNDER_CLARIFICATION_2026-09-06.md ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/docs/THE_HUNT_INCUBATOR_ZOOM_WORLD_STRUCTURE.md ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/docs/THE_HUNT_TECHNOLOGY_QUALITY_AND_REPLACEABILITY_STANDARD.md ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/docs/STAGE_7_HUNT_WORLD_PACKAGE_V0_1.md ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/docs/research/2026-09-15-player-clarity/The_Hunt_Player_Clarity_Correction_2026-09-15.md ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/docs/experiments/the-missing-hour/player-clarity-2026-09-15/after-opening.png ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/docs/experiments/the-missing-hour/player-clarity-2026-09-15/after-answer.png ~/Projects/hunt-world-001/context/
```
```
cp ~/Projects/The-Hunt/public/world/the-midnight-gallery/src/house/CONTACT_SHEET.png ~/Projects/hunt-world-001/context/
```

Do **not** copy the September 28 brief. The spec already carries its useful parts, and the brief contains claims the spec corrects.

### Step 3 — Make sure nothing can bill, then start Fable

**1. Go to the new folder and start a git history.**
```
cd ~/Projects/hunt-world-001
```
```
git init
```

**2. Check for an API key.** It must print `not set`. If it prints a key, Claude Code would bill that key. Stop and tell me.
```
echo "${ANTHROPIC_API_KEY:-not set}"
```

**3. Check the Claude Code version.** It must be 2.1.255 or later. If it is older, run `claude update`.
```
claude --version
```

**4. Start Claude Code.**
```
claude
```

**5. Check the account.** Inside Claude Code, type `/status`. It should show your Claude subscription, not an API key.
- In your Claude plan settings, keep any pay-as-you-go or "extra usage" option switched off.

**6. Choose Fable.** Type `/model` and choose **Fable 5.1**.

**7. Paste the kickoff message:**

> You are the builder for The Hunt — World 001. Read `context/WORLD_001_FABLE_BUILD_SPEC_v1_2026-09-29.md` completely before you do anything. It governs. The other files in `context/` are background. Work only inside this folder. Do Phase 0 only (spec §17). Then stop and report as spec §26 describes. Do not start Phase A until I reply "Go Phase A".

**8. Later messages.** Send "Go Phase A", "Go B1", "Go B2", "Go C1", "Go C2", "Go C3" as each stop is approved.

### Reviews
For each review:
1. Open a **new** terminal and run `claude` in the same folder.
2. Choose Opus 5.5 with `/model`.
3. Paste the matching reviewer role from spec §19, plus: "You may not edit any file except your report in `REVIEW/`."

### Optional — a private online backup for World 001
After Phase 0, when Fable has made its first commit:
```
gh repo create hunt-world-001 --private --source . --push
```
After that, run `git push` at each stop.

---

## Appendix D — Playtest protocol (the 5 strangers)

### Who
- 5 adults (18+) who have never heard about the project. Not close family.
- Mix people who play games often with people who rarely do.
- If the phone passed T2, use 3 laptops and 2 phones. If not, use laptops only.

### Setup
- Use the playtest build (`npm run build:playtest`, then `npm run preview:playtest`).
- Use a fresh browser profile, with sound on.
- Turn the session log on.
- Have a stopwatch and an observer sheet ready.

### Consent
Say: *"I'll take notes on what you do. I won't record audio or video unless you say yes. I'll only write down your first name."*

### Say only this
> "This is an early prototype of an exploration game. Please think aloud if you can. I can't help you while you play, but the game has hints. Play as long as you enjoy it. Stop whenever you like."

### While they play
- Do not help. Do not react.
- **At exactly 2:00,** ask once: *"What are you trying to do right now?"* Write the answer down word for word. (This is E2.)
- Note the times of:
  - their first move;
  - the first sketch found;
  - entering the model;
  - the ending.
- Note every time they are stuck for more than 2 minutes, and where.
- Note every hint they use, and the wrong places they try.
- Note each time they go back to an earlier place, and why.
- Note their exact words when they are delighted or confused.
- **Stop** when they finish, when they quit, or at 35 minutes.

### After — ask exactly these six questions, in order
1. "Tell me what you were trying to do."
2. "What moment do you remember most?"
3. "Where did you feel lost or stuck?"
4. "How would you describe the place you were in?"
5. "Did you feel dizzy or sick at any point?"
6. "If there were another world like this next week, would you want to play it?" If yes, make it a real invitation, and note it.

**Never** ask "Did you like it?" Never explain the design before they finish.

### Record
- Write one row per tester in `PLAYTEST/results.md`, and attach their session-log file.
- **Active time** runs from their first input to the finish or quitting, capped at 35 minutes.
- Score E1–E9 from spec §20.

---

## Sources

**Local** (read on your Mac, 2026-09-29):
- `~/Projects/The-Hunt/START_HERE.md`
- `docs/current/*`
- `docs/governance/*`
- `docs/THE_HUNT_REVIEW_ADJUDICATION_2026-07-02.md`
- `docs/architecture-decisions/ADR-0011-world-grammar-strategy.md`
- `docs/THE_HUNT_TECHNOLOGY_QUALITY_AND_REPLACEABILITY_STANDARD.md`
- `docs/THE_HUNT_GENERATION_TARGET_RESEARCH_TASK.md`
- `docs/STAGE_7_VERTICAL_SLICE_DEFINITION.md`
- `docs/STAGE_7_HUNT_WORLD_PACKAGE_V0_1.md`
- `docs/THE_HUNT_INCUBATOR_ZOOM_WORLD_STRUCTURE.md`
- `docs/research/2026-09-06-restart/HUNT_BENCHMARK_AND_STAGE_GATES.md`
- `docs/research/2026-09-07-architecture/The_Hunt_Product_Architecture_Foundry_and_Growth_2026-09-07_v2_No_New_Spending.md`
- `docs/research/2026-09-15-player-clarity/The_Hunt_Player_Clarity_Correction_2026-09-15.md`
- `docs/experiments/the-missing-hour/HOUSE_OF_MISSING_HOURS_WORK_PACKAGE.md`
- `src/app/experiments/the-midnight-gallery/house-content.ts`
- the House screenshots and contact sheet
- all other files in `docs/`, read by the research passes

**External:**
- [Claude models overview](https://platform.claude.com/docs/en/models/overview)
- [Claude Fable 5.1 overview](https://platform.claude.com/docs/en/models/fable-5-1/overview)
- [What's new in Fable 5.1](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)
- [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Anthropic — Claude Fable and Mythos 5.1 announcement](https://www.anthropic.com/claude-fable-and-mythos-5-1)
- [Claude Fable models on your plan](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan)
- [PhiloLabs/fable51-worlds](https://github.com/PhiloLabs/fable51-worlds)
- [Sakura Crossing](https://github.com/Kenton-GMI/sakura-crossing)
- [Hacker News thread with the self-reported cost](https://news.ycombinator.com/item?id=49541458)
- [NYU Game Center — Playtest Thursdays](https://gamecenter.nyu.edu/events/playtest-thursdays/)
- [Playcrafting](https://playcrafting.com/)
