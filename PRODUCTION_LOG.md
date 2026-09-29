# PRODUCTION_LOG.md — written as we go

One row per work session. Never rebuilt from memory afterwards. Times are UTC. "Usage shown" is what the builder can see inside its session; it is a token counter, not a dollar figure. "Cash" is the dollar cost the founder reads from the Claude Code usage view and pastes back at each stop.

| Date | Start–end (UTC) | Who | Phase | What was done | Minutes | Usage shown by Claude Code | Cash | Result / failures |
|---|---|---|---|---|---|---|---|---|
| 2026-09-29 | 17:34–17:46 | Fable 5.1 (builder) | 0 | Read the spec, the authorization, all of `context/` (including the v1 step-2 spec for its §16, §19, §24, the research report, the consolidation document, the House images). Wrote `DESIGN.md`, `SOLUTIONS.md`, `PLAN.md` (with nine proposed §3 changes), `DECISIONS.md`, `PROGRESS.md`, this log. Committed and pushed. | 12 | Session token counter moved from about 15.00M to about 14.75M during Phase 0 (about 250k tokens). Counter only, not a cost. | **$10** (founder: balance $250 → $240) | Phase 0 complete. STOP 0. No code written. |

| 2026-09-29 | 18:25–19:29 | Fable 5.1 (builder) | A | Graybox of the whole chain after "Go Phase A": stack pinned (Vite 8.3.1, TypeScript 6.0.3, Three 0.186.1, Vitest 5.0.2, Playwright 1.56.1, ESLint 10.11.0), 7 data files, judge, rules engine, save, 92 unit tests, renderer, camera, input (touch/mouse/keyboard), dive, sketch renderer, HUD, panels, hints, audio, recorders, debug tools, 7 end-to-end tests, screenshots of every place, README, PROVENANCE, tuning log in SOLUTIONS.md §12. Committed and pushed. | 64 | Session token counter moved from about 15.00M to about 14.69M (about 310k). Counter only, not a cost. | **Dollar cost not visible to the builder.** Founder to paste the credit balance. | Phase A complete. STOP A (Gate A). `npm test` green: 92 unit + 7 e2e. |

## Phase totals

| Phase | Sessions | Minutes | Cash (from the founder) | Note |
|---|---|---|---|---|
| 0 | 1 | 12 | $10 | Early-warning line is about $60 per phase; hard stop $200 total. |

| A | 1 | 64 | not visible to the builder | Founder rule: stop and report at about $60 even if unfinished. Founder to fill in from the credit balance. |

## Repeated tasks (task, times, minutes each)
| Task | Times | Minutes each (approx.) |
|---|---|---|
| Re-shoot the screenshot set after a data change | 5 | 2 |
| Run the end-to-end suite | 8 | 1.5 |
| Probe a picking or rendering question with a throwaway Playwright script | 5 | 3 |
