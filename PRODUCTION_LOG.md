# PRODUCTION_LOG.md — written as we go

One row per work session. Never rebuilt from memory afterwards. Times are UTC. "Usage shown" is what the builder can see inside its session; it is a token counter, not a dollar figure. "Cash" is the dollar cost the founder reads from the Claude Code usage view and pastes back at each stop.

| Date | Start–end (UTC) | Who | Phase | What was done | Minutes | Usage shown by Claude Code | Cash | Result / failures |
|---|---|---|---|---|---|---|---|---|
| 2026-09-29 | 17:34–17:46 | Fable 5.1 (builder) | 0 | Read the spec, the authorization, all of `context/` (including the v1 step-2 spec for its §16, §19, §24, the research report, the consolidation document, the House images). Wrote `DESIGN.md`, `SOLUTIONS.md`, `PLAN.md` (with nine proposed §3 changes), `DECISIONS.md`, `PROGRESS.md`, this log. Committed and pushed. | 12 | Session token counter moved from about 15.00M to about 14.75M during Phase 0 (about 250k tokens). Counter only, not a cost. | **$10** (founder: balance $250 → $240) | Phase 0 complete. STOP 0. No code written. |

| 2026-09-29 | 18:25–19:29 | Fable 5.1 (builder) | A | Graybox of the whole chain after "Go Phase A": stack pinned (Vite 8.3.1, TypeScript 6.0.3, Three 0.186.1, Vitest 5.0.2, Playwright 1.56.1, ESLint 10.11.0), 7 data files, judge, rules engine, save, 92 unit tests, renderer, camera, input (touch/mouse/keyboard), dive, sketch renderer, HUD, panels, hints, audio, recorders, debug tools, 7 end-to-end tests, screenshots of every place, README, PROVENANCE, tuning log in SOLUTIONS.md §12. Committed and pushed. | 64 | Session token counter moved from about 15.00M to about 14.69M (about 310k). Counter only, not a cost. | **Dollar cost not visible to the builder.** Founder to paste the credit balance. | Phase A complete. STOP A (Gate A). `npm test` green: 92 unit + 7 e2e. |

| 2026-09-29 | 19:33–20:36 | Fable 5.1 (builder) | A (redesign once) | Gate A result recorded (D-008). Built the founder's eight changes: 360° turning; four stand spots per place with rings, tap/E/W A S D moves at a fixed speed; live openings showing the next place; a continuous dive through the opening with a measured hand-over (`tools/seam.mjs`: 0.3–3.9 on 0–255 for all six dives); keyhole and socket marks with a rattle; the 45 s idle glint; the plain trail with dots, below the buttons on phones; copy-to-clipboard logs. Hidden objects judged by position from any spot. 105 unit tests, 9 end-to-end tests, screenshots, docs updated. Committed and pushed. | 63 | Session token counter moved from about 15.00M to about 14.84M (about 160k). Counter only, not a cost. | **Dollar cost not visible to the builder.** The founder's message left the balance as a placeholder. | Redesign round complete. Second STOP A. `npm test` green. |

| 2026-09-29 | 21:25–22:15 | Fable 5.1 (builder) | A (third round) | Founder's second play recorded (D-009). Reproduced the ring-click miss with real mouse events (the hit area was the thin ring line). Built free walking with derived blockers, platforms and path finding; the teaching street (door open, six ordinary things, key puzzle moved to the shop); the three-picture start screen; glowing dive openings; line-of-sight for hidden objects (five buried ones found and moved); position-based sketch locks; a Playwright project on the playtest build with three real-input tests (mouse, touch, keyboard) and no hooks. 150 unit + 11 e2e green; seam unchanged. Download check: all three sites refused. Docs updated. Committed and pushed. | 50 | Session token counter moved from about 14.93M to about 14.59M (about 340k). Counter only, not a cost. | **Dollar cost not visible to the builder.** Founder to paste the credit balance. | Third round complete. Third STOP A. |

## Phase totals

| Phase | Sessions | Minutes | Cash (from the founder) | Note |
|---|---|---|---|---|
| 0 | 1 | 12 | $10 | Early-warning line is about $60 per phase; hard stop $200 total. |

| A | 1 | 64 | not visible to the builder | Founder rule: stop and report at about $60 even if unfinished. Founder to fill in from the credit balance. |
| A, redesign once | 1 | 63 | not visible to the builder | Founder rule for this round: stop at $50. Balance placeholder in the founder's message was not filled in. |
| A, third round | 1 | 50 | not visible to the builder | Founder rule for this round: stop at $35. |

## Repeated tasks (task, times, minutes each)
| Task | Times | Minutes each (approx.) |
|---|---|---|
| Re-shoot the screenshot set after a data change | 5 | 2 |
| Run the end-to-end suite | 12 | 2.5 |
| Probe a picking or rendering question with a throwaway Playwright script | 14 | 3 |
| Run the seam check after moving something in front of an opening | 9 | 2 |
| Run the full `npm test` (both builds, 11 e2e) | 3 | 4 |
