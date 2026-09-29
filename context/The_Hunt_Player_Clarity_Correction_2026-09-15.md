# The Hunt — Player Clarity Correction

Date: 2026-09-15
Status: Recommendation and bounded Codex implementation task. No local files have been changed by this document. Sending the task below to local Codex authorizes the described implementation, not publication or final approval.
Canonical local project: `~/Projects/The-Hunt/`
Reported experiment route: `/experiments/the-midnight-gallery`

## 1. What this correction addresses

Sandro played the current House of the Missing Hours and could not understand what he was supposed to do. He reports excessive or unclear instructions and a greater emphasis on riddles than on visual exploration. He is willing to continue evaluating this puzzle-oriented experiment, but wants its directions to be simpler and understandable.

The latest supplied Codex completion summary reports 13 nodes, three independent branches, 11 clues, 28 interactions, three cross-branch deductions, an optional discovery, and passing focused tests. Those are reported results, not independently verified by this review. The older uploaded CODEX_CONTEXT_CHECK.md and creative-feasibility documents predate this implementation and must not override the current source or work package.

The reviewer has not accessed the local running build or audited its current strings. Suggested copy below is proposed replacement text, not a quotation from the game. Codex must verify each instruction against actual implemented behavior.

## 2. Product decision

Keep this version and correct its onboarding, controls, objectives, feedback, help, and clue presentation. Do not create another world, add rooms, change engines, or expand the Foundry.

The design principle is: a mystery can hide its solution, but should not hide how to operate the game or what the player is trying to achieve.

Keep the digital-only, visually led, recursive exploration direction. Evaluating this puzzle prototype does not approve a permanent riddle-first product or prove that more continuous exploration is technically impossible.

Do not increase reading, obscure wording, delay movement, or shrink targets merely to obtain a 20-minute session. Play duration remains unmeasured until observed with non-authors.

## 3. Player-facing requirements

### 3.1 A short, truthful opening

Show the immediate scene with one plain goal, a short introduction, and an obvious start control. Avoid a mandatory lore page, glossary, full solution map, or simultaneous list of all 11 clues.

Suggested opening, conditional on matching the implemented story:

> Explore the house and restore the missing hours. Look closely at objects; the clues you find will help you open new places.

Suggested start control: `Start exploring`.
Suggested optional starting suggestion: `The clock is a good place to start.`

Use the actual names of implemented objects consistently. Never promise interactions, progress retention, or navigation behavior that does not exist. Atmospheric story may remain under an optional `Read the story` control or in discovered documents. Do not silently rewrite the narrative premise.

A roughly 35–45-word opening is a working copy budget, not a mandate to omit necessary information or abbreviate sentences.

### 3.2 Teach by doing, without imposing a fixed branch order

Offer a short, skippable, replayable introduction using existing scene interactions. The first useful action should be inspecting something visible and seeing a clear result—not deciphering prose or entering an unexplained answer.

Show one contextual instruction at a time. For example:

- `Select the clock to inspect it.`
- `Use + to look closer.`
- `This clue is now in your notebook.` — only when that exact observation has actually been stored.

The player may dismiss the guidance and visit any currently available branch. The tutorial must not solve a required deduction, bypass a lock, award a branch completion, or impose a new puzzle order. Controls help can explain input; it must not reveal hidden answers.

Show touch-appropriate and keyboard-accessible guidance. Do not depend exclusively on hover, color, double-clicks, or transient instructions. Keep explicit zoom controls available where already implemented.

### 3.3 Distinguish goal, current activity, observation, and riddle

A compact objective area should answer the main goal and current context, not dictate every discovery. Derive completion/progress from the same authoritative local state as gameplay.

For the current place, use an ordinary verb and concrete object: inspect, open, select, turn, compare, return. These are authoring examples, not presumed existing controls. Do not replace meaningful in-world names wholesale; use familiar words for operating instructions and define unavoidable terms locally.

Keep branch choice. Show one contextual suggestion at most, with other leads available on demand. Help must not point to completed tasks, inaccessible prerequisites, or destinations not yet discoverable under the current rules.

Put optional background prose separately from the action prompt. Readability means clear purpose, not merely shorter sentences.

### 3.4 Keep looking and acting central

The scene remains the main view. Do not solve text overload by adding a permanent large tutorial panel or forcing the notebook open after every observation.

At least the opening interaction should connect guidance to an actual visible object. Make existing inspection/opening behavior understandable before considering new mechanics.

Preserve substantive puzzle reasoning. Where a clue requires interpreting visible evidence, make the evidence readable and the required input understandable rather than simply printing the answer in the instructions.

### 3.5 Improve the existing notebook and feedback

Reuse the notebook rather than build a second quest/inventory system. Make the goal, discovered clues, and optional story easy to distinguish. Where available, pair an observed clue with its image/detail and source location.

Record only evidence the player has actually discovered. Do not silently infer answers, expose undiscovered content, or mark a branch restored because a scene was visited.

Success feedback should identify the actual result: an observed clue was recorded, a compartment opened, or a mechanism changed. Separate observation from completion.

Answer fields must state the expected kind of input without exposing the solution. Explain permitted format near the control. Normalize harmless presentation differences when semantically correct; for example, case or surrounding spaces. Treat `XI`, `11`, and `eleven` as equivalent only if the puzzle asks for the hour's value, not if interpreting or manipulating symbols is the challenge. Test valid and invalid variants.

Wrong answers must not unlock progress or silently consume/reset discoveries. Distinguish format errors from incorrect deductions where useful. Do not claim a missing piece of evidence is in the notebook when it has not been found.

### 3.6 Offer graduated, optional help

Reuse/extend existing hints. Provide an obvious `Need a hint?` entry with progressively explicit help:

1. Where to look — a relevant accessible place or previously discovered clue.
2. What to notice — the feature or relationship to examine.
3. Show the solution — clearly labeled and opened only by deliberate request.

Do not automatically show the next hint or solution after elapsed time, an incorrect answer, or a visit. No penalty is needed for hints in this prize-free internal experiment. Help must respect state, remain keyboard accessible, and not erase progress.

Do not add a difficulty-mode framework or automatic LLM hint service.

## 4. Quality evidence and stopping rules

Proposed human-review targets, not measured results:

- After roughly 30 seconds, a new player can explain the main goal and identify one action they can try, without outside explanation.
- Within roughly 60 seconds, they can inspect an object and understand the visible result. This is not a mandatory puzzle-completion deadline.
- After leaving and returning to a branch, they can recover their context from the game.
- They understand what an answer control expects without guessing the required spelling or syntax.
- They can request useful help without involuntary spoilers.

Codex can verify UI behavior and perform an interface walkthrough. It cannot label its own source-informed playthrough an independent novice test or certify a 20–30-minute session from automation.

Founder comprehension is the first review gate. Subsequently observe two or three non-authors for this narrow clarity check; that does not replace the wider external pilot or physical-phone validation.

If clear directions expose a puzzle with missing or contradictory evidence, flag the actual defect. Do not hide it by giving the answer away in the tutorial or inventing a new story. Implement straightforward wording/format fixes; materially changing a deduction requires a separate explicit decision.

## 5. Exact local Codex task

Continue locally in `~/Projects/The-Hunt/`.

I authorize one bounded player-clarity revision of the existing House of the Missing Hours experiment. This is implementation authorization for the onboarding, copy, contextual guidance, existing notebook/hints, necessary local UI state, and focused tests described here. It is not a new world, engine decision, Foundry task, publication, or spending approval.

### A. Inspect the current build, not the obsolete pre-build attachment

1. Read applicable AGENTS instructions, the existing `HOUSE_OF_MISSING_HOURS_WORK_PACKAGE.md`, and the actual experiment source. Verify current branch, HEAD, pending changes, and current local route; do not assume historical Git counts remain current.
2. Preserve tracked and untracked work, original art, current puzzle logic, and user progress. Do not reset, clean, stage everything, switch branches, or recreate consolidation.
3. Inspect the local application and capture before screenshots of the introduction, one representative branch interaction, an answer prompt, the notebook, and help. Use a separate browser profile/storage state for fresh-start checks rather than erasing the founder's progress. Do not inspect unrelated sites or directories.
4. Audit the actual player-visible strings, including instructions, labels, errors, hints, and completion messages. In the existing work package, keep a compact before/after table with real source paths and reasons. Do not fabricate quotes or create another broad project report.

### B. Implement the correction

Apply section 3 with minimal necessary source changes. Preserve the 13-node/three-branch graph where it exists, its independent branch order, core evidence and solutions, completed-state semantics, optional discovery, navigation, and ending. Verify the actual counts rather than manufacturing content to fit the report.

The priority order is opening clarity, understandable first interaction, objective/context visibility, readable and correctly labeled inputs, then notebook and graduated-help improvements. Complete a usable pass through all required branch and final-convergence instructions, not just the opening paragraph.

Do not force the sample wording when it contradicts actual mechanics; adapt it accurately and record the difference. Do not replace all riddles with plain solutions, add a forced linear route, place huge tutorial panels over the artwork, or tell players to interact with an unavailable object.

Keep labels consistent between scene, notebook, directions, and focus/accessible names. Guidance may describe an object's observable identity; it must not leak an unearned solution through labels or hidden accessibility text.

### C. Validate locally

Run safe focused state/browser tests, lint, and scoped type checks using already-installed, pinned tooling. Inspect scripts before execution. Do not install tooling or generate a Prisma client to cure an unrelated full-repository check. Report unrelated failures separately; do not call the whole repository clean if it is not.

Verify:

- Fresh-start introduction, skipping/replaying controls guidance, and an existing-progress entry without reset.
- All three branches remain independently accessible in their intended orders; help/objectives correspond to current state. Test all six branch-completion orders where the existing fixture makes this practical, including different mid-branch visitation orders.
- Notebook contains discovered observations only; progress counts agree with gameplay state.
- Wrong answers do not unlock anything; semantically equivalent accepted inputs behave consistently without weakening symbol-based puzzles.
- Hint tiers require deliberate action; ordinary controls/help do not reveal solutions.
- Back, restart, zoom, keyboard focus, reduced motion, and mobile-width layouts work; no hover-only required guidance.
- Final convergence still requires the same legitimate progress.
- No unintended external runtime requests or console errors.

Do not confuse mobile emulation with physical-phone testing or a scripted walkthrough with a human-comprehension pass.

### D. Deliver the actual revision

Import this correction once into the existing dated research/experiment structure and add only the necessary index reference. Amend the House work package with the before/after copy examples, scope, results, limitations, and proposed human check.

Open the revised local experiment for the founder. Use an existing correct server or start an isolated server bound to `127.0.0.1` with the pinned command. Verify the actual port and process. Do not expose it publicly, kill a process based on an old PID, or erase saved progress to demonstrate onboarding.

Return the actual URL, several before/after instruction examples, screenshots, checks run/results, remaining puzzle or art limitations, changed files, and Git status. Explicitly mark novice comprehension and physical-phone validation as outstanding until observed.

Constraints: $0 new spending for this revision; no provider/API calls, new dependencies, account/database/migration work, asset purchases, large downloads, CI changes, Foundry expansion, commits, pushes, or deployment. Do not alter unrelated routes. No repeat context intake or new architecture survey. Stop after the clarity revision is running for founder review.

## 6. Sequence and review

- **Build Now:** this in-place clarity and interaction-guidance revision.
- **Build Next:** founder replays the introduction without an external explanation, then a brief non-author comprehension check. Decide whether particular riddles remain too text-dependent from observed behavior.
- **Build Later:** revisit the balance of visual exploration and puzzle gates after the interface is understandable. Preserve the larger recursive-world direction without restarting production in this task.

Failure conditions: a new player still cannot tell what to do; help contradicts state; shorter copy hides necessary meaning; guidance spoils deductions; accessibility regresses; branching is lost; automated tests are represented as proof of player understanding.

Best next action: run this one task in the current local Codex project, then review the changed first minute inside the game rather than read a separate walkthrough explaining how to play it.

## 7. Research basis and limits

Current primary guidance reviewed 2026-09-15:

- Microsoft Xbox Accessibility Guideline 109, Objective clarity: https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/109
  Supports reviewable objectives/progress, concise task context, and interactive/revisitable teaching rather than static controls lists alone.
- Microsoft Xbox Accessibility Guideline 114, UI context: https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/114
  Supports clear and consistent labels, explaining expected inputs, contextual help, and understandable operational text while distinguishing it from narrative prose.
- Microsoft Xbox Accessibility Guideline 108, Game difficulty options: https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/108
  Supports player-controllable assistance; it does not require this small experiment to build a new difficulty-mode system as part of the current recommendation.

These documents support the usability principles. The copy, time targets, scope, and implementation choices above are Hunt-specific recommendations, not Microsoft-prescribed numeric thresholds, proof of accessibility conformance, or verified details of the current build.
