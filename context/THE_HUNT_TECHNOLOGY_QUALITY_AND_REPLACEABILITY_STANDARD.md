# The Hunt — Technology Quality and Replaceability Standard

**Status:** Founder-approved permanent project standard
**Established:** 2026-06-21
**Source:** Explicit founder decisions recorded during World Foundry Alpha Phase 2A completion
**Supersedes:** No prior document — this is a new standing document

---

## How to read this document

Each section is labeled with one of the following:

- **FOUNDER-APPROVED PRINCIPLE** — a locked decision that governs all technology and architecture work
- **RESEARCH FINDING** — a conclusion reached from documented research (may be updated as evidence changes)
- **RECOMMENDATION** — a suggested approach not yet locked as a principle
- **HYPOTHESIS** — an untested assumption that requires measurement before being treated as fact
- **PLACEHOLDER** — a temporary solution with documented limitations and a planned migration path
- **UNRESOLVED RESEARCH QUESTION** — a question that must be answered before a durable decision can be made

---

## 1. Quality-first doctrine

**FOUNDER-APPROVED PRINCIPLE**

Finished-product quality is The Hunt's top priority.

Every material technology, architecture, runtime, framework, language, storage, security, data, production, testing, creative-tool, and AI-provider decision must be evaluated against the strongest credible current alternatives for its Hunt-specific requirements.

A technology must not be selected merely because it:

- is already integrated;
- is familiar;
- is cheaper;
- is fashionable;
- is convenient;
- or was mentioned in an older specification.

"Best" means the highest-quality best fit for the defined requirement, considering:

- participant experience;
- artistic quality;
- reliability;
- performance;
- security;
- integrity;
- accessibility;
- rights and provenance;
- maintainability;
- operational control;
- portability;
- replaceability;
- total human correction burden;
- and long-term cost.

---

## 2. Replaceable placeholders

**FOUNDER-APPROVED PRINCIPLE**

When the preferred solution is unaffordable, unavailable, immature, or premature, the project may:

- defer the feature; or
- use a clearly documented replaceable placeholder.

Every placeholder must record:

- why it was selected;
- its limitations;
- what the preferred future solution is;
- what depends on it;
- its replaceability class;
- the migration path;
- estimated replacement cost;
- and replacement triggers.

### Current known placeholders (as of 2026-06-21)

These will be fully catalogued in the upcoming Architecture and Technology Quality Audit.

**PLACEHOLDER — Fixture image provider**

| Field | Value |
|-------|-------|
| Why selected | Zero external cost; deterministic; enables pipeline development and testing without a production provider |
| Limitations | Does not test real image quality, continuity, style, or cost behavior |
| Preferred solution | A human-evaluated, rights-cleared AI image provider proven superior for Hunt-specific requirements |
| Depends on it | Phase 2A pipeline tests; canary templates; image ingest validation |
| Replaceability class | Adapter swap — provider interface exists (`provider-types.ts`) |
| Migration path | Implement a real provider in a new adapter; run a controlled canary; evaluate quality/cost/rights |
| Estimated replacement cost | Unknown — requires the full Architecture and Technology Quality Audit |
| Replacement triggers | Founder decision following canary evidence review |

**PLACEHOLDER — OpenAI image adapter boundary**

| Field | Value |
|-------|-------|
| Why selected | Placeholder structure created in advance of a provider decision; disabled pending documentation review and founder authorization |
| Limitations | Makes no HTTP call, no SDK call, no image request in any configuration; not a real integration |
| Preferred solution | Determined by the Architecture and Technology Quality Audit comparing available providers against Hunt-specific requirements |
| Depends on it | `providers/openai-image.ts` (disabled boundary only) |
| Replaceability class | Full replacement — the disabled adapter file should be treated as a structural placeholder, not a provider commitment |
| Migration path | Evaluate current documentation; benchmark against alternatives; founder approval; controlled implementation |
| Estimated replacement cost | Unknown |
| Replacement triggers | Completion of Architecture and Technology Quality Audit; founder approval of provider selection |

**PLACEHOLDER — SQLite database**

| Field | Value |
|-------|-------|
| Why selected | Zero infrastructure cost; appropriate for single-node development |
| Limitations | Single-writer; no horizontal scaling; not suitable for high-concurrency production |
| Preferred solution | Determined by Architecture and Technology Quality Audit |
| Depends on it | All Prisma models and migrations |
| Replaceability class | Schema-compatible migration via Prisma |
| Migration path | Prisma migration to a production-grade database |
| Estimated replacement cost | Unknown — requires audit |
| Replacement triggers | Evidence of concurrency limits, data volume, or production requirements that SQLite cannot meet |

**PLACEHOLDER — Local asset storage (`storage/foundry/`)**

| Field | Value |
|-------|-------|
| Why selected | Zero infrastructure cost; avoids premature decisions about CDN and object storage |
| Limitations | Not scalable; no CDN; no authenticated serving route implemented; local disk only |
| Preferred solution | Determined by Architecture and Technology Quality Audit |
| Depends on it | Asset ingest, storedPath in all asset records |
| Replaceability class | Storage adapter swap |
| Migration path | Implement object storage adapter; migrate existing files; update serving routes |
| Estimated replacement cost | Unknown |
| Replacement triggers | First need for hosted access or multi-machine deployment |

---

## 3. Research before durable commitment

**FOUNDER-APPROVED PRINCIPLE**

Unresolved material technology questions must become research tasks before a durable production commitment is made.

Existing working systems should not be replaced merely because a newer option exists. Replacement requires evidence that the improvement justifies migration risk, cost, and disruption.

---

## 4. Human accountability

**FOUNDER-APPROVED PRINCIPLE**

Humans remain accountable for:

- art direction;
- world structure;
- continuity;
- anchor fairness;
- clue fairness;
- rights;
- accessibility;
- integrity;
- security approval;
- and final publication.

Greater automation is acceptable only when it preserves or improves quality and accountability.

---

## 5. Technology adoption process

**FOUNDER-APPROVED PRINCIPLE**

New technology should be evaluated and, when proven materially superior, integrated into the Foundry through:

- a versioned replaceable adapter;
- a provider-neutral interface;
- or a controlled migration.

Technology adoption must include:

1. capability and terms research;
2. isolated evaluation;
3. a Hunt-specific benchmark;
4. comparison against the current method;
5. human correction-time measurement;
6. security, rights, and portability review;
7. controlled canary testing;
8. rollback capability;
9. and founder approval.

The Foundry must not rewrite or upgrade itself without human approval.

---

## 6. Behavioral search-integrity baseline

**UNRESOLVED RESEARCH QUESTION — future research assignment**

The platform should eventually establish evidence-based behavioral baselines for legitimate human exploration, including:

- movement speed;
- direction changes;
- inspection pauses;
- wandering time;
- revisits;
- clue-response behavior;
- candidate-location inspection patterns;
- coverage patterns;
- and realistic interaction timing.

Sessions materially outside the expected human range may be flagged for observation and manual review.

Behavioral deviation alone must never automatically disqualify a participant.

The system must account for:

- highly skilled players;
- accessibility tools;
- different devices;
- connection quality;
- teams;
- different navigation styles;
- and other legitimate causes of unusual behavior.

The detailed model, privacy boundaries, evidence thresholds, and false-positive controls require separate research before implementation.

This is a future research assignment. No implementation should begin until a focused research program is completed and founder-approved.

---

## 7. Relationship to other documents

This standard governs but does not replace:

- `The_Hunt_Master_Plan_Revised_v10.md` — product doctrine, phase sequencing, and economics
- `STAGE_7_WORLD_FOUNDRY_LEVELS.md` — Foundry autonomy level definitions and transition criteria
- `STAGE_7_WORLDFOUNDRY_DECISIONS_AND_SEQUENCE.md` — Build Now / Build Next / Build Later sequence
- `THE_HUNT_PENDING_FOUNDATIONAL_RESEARCH.md` — current research task queue
- `STAGE_7_WORLD_FOUNDRY_LEARNING_AND_EVOLUTION_SPEC.md` — Foundry learning and evolution direction

When this standard conflicts with an older specification, this standard governs for all new decisions. Older specifications remain as historical records of prior decisions.

---

## 8. Amendment process

This document may be amended by explicit founder decision.

Proposed amendments must state:

- the principle being changed or added;
- the reason for the change;
- the evidence supporting it;
- and what prior decisions are affected.

A coding agent or AI assistant may not amend this document without explicit founder instruction recorded in a task or commit.
