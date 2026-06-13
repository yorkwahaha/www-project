# WWW Project Phase 193 — Quality Badge Presentation Milestone Checkpoint v1

**Status:** milestone checkpoint, focused doc guards, frontend/static guards, and README index only. Consolidates Phase 177–192-R quality feedback and quality badge presentation delivery and review conclusions into the stable boundary reference before any future creator-facing explanation, durable badge cache, ranking/recommendation ordering, threshold/bucket runtime, creator score, punishment/demotion, or additional badge surfaces.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-option-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 192-R high-quality poll badge detail / results rendering review checkpoint (`8d02811`).

**Prior checkpoint:** [Phase 192-R High-quality poll badge detail / results rendering review checkpoint](./www-project-phase-192r-high-quality-poll-badge-detail-results-rendering-review-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 193 records the completed quality feedback and quality badge presentation arc across schema, write API, post-vote UX, public read runtime, and minimal frontend rendering on `/explore`, `/vote/:pollId`, and `/results/:pollId`. It is the stable boundary reference for what quality feedback and public quality badge presentation **are** today and what they **must not become** without a separately approved phase.

This milestone answers:

1. What Phase 177–192-R delivered and what remains fixed.
2. Which data, API, frontend, privacy, vote, auth, result, and governance boundaries quality badge presentation must not cross.
3. Which future product surfaces (creator-facing explanation, durable badge cache, ranking, threshold/bucket, creator score, punishment) require a new phase with explicit governance rules.

---

## 2. Phase 177–192-R Milestone Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **177** | `poll_quality_feedback_aggregate` schema foundation — poll-level rows only | **Complete** |
| **178-R** | Schema runtime readiness review — approves write API plan | **Complete** |
| **179 (plan)** | Write API runtime plan — `POST /polls/:pollId/quality-feedback` | **Complete (plan)** |
| **180** | Write API runtime foundation — aggregate upsert only | **Complete** |
| **180-R** | Write API runtime review — approves post-vote UX | **Complete** |
| **181** | Post-vote quality feedback UX on `/vote/:pollId` success panel only | **Complete** |
| **181-R** | Post-vote UX runtime review — approves Phase 182 milestone | **Complete** |
| **182** | Quality feedback milestone & governance boundary | **Complete** |
| **183** | High-quality poll presentation governance spec | **Complete (docs)** |
| **184 (plan)** | High-quality poll badge eligibility plan | **Complete (plan)** |
| **185-R** | Badge eligibility plan review — approves read-model plan | **Complete** |
| **186 (plan)** | High-quality poll badge read-model / presentation plan | **Complete (plan)** |
| **186-R** | Read-model plan review — approves runtime implementation plan | **Complete** |
| **187 (plan)** | High-quality poll badge runtime implementation plan | **Complete (plan)** |
| **187-R** | Runtime implementation plan review — approves public read runtime | **Complete** |
| **188** | Minimal public read runtime — `quality_badge` on public poll APIs | **Complete** |
| **188-R** | Public read runtime review — approves frontend presentation plan | **Complete** |
| **189 (plan)** | High-quality poll badge frontend presentation plan | **Complete (plan)** |
| **189-R** | Frontend presentation plan review — approves explore rendering runtime | **Complete** |
| **190** | Minimal frontend rendering runtime — `/explore` badge chip | **Complete** |
| **190-R** | Explore rendering runtime review — approves detail/results plan | **Complete** |
| **191 (plan)** | Poll detail / results presentation plan | **Complete (plan)** |
| **191-R** | Detail / results plan review — approves detail/results runtime | **Complete** |
| **192** | Poll detail / results minimal frontend rendering runtime | **Complete** |
| **192-R** | Detail / results rendering review — approves Phase 193 milestone | **Complete** |

### 2.1 Phase references

**Quality feedback foundation (177–182):**

- [Phase 177 Quality feedback aggregate schema foundation](./www-project-phase-177-quality-feedback-aggregate-schema-foundation-v1.md)
- [Phase 178-R Quality feedback aggregate schema runtime readiness review checkpoint](./www-project-phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint-v1.md)
- [Phase 179 Quality feedback aggregate write API runtime plan](./www-project-phase-179-quality-feedback-aggregate-write-api-runtime-plan-v1.md)
- [Phase 180 Quality feedback aggregate write API runtime foundation](./www-project-phase-180-quality-feedback-aggregate-write-api-runtime-foundation-v1.md)
- [Phase 180-R Quality feedback write API runtime review checkpoint](./www-project-phase-180r-quality-feedback-write-api-runtime-review-checkpoint-v1.md)
- [Phase 181 Post-vote quality feedback UX](./www-project-phase-181-post-vote-quality-feedback-ux-v1.md)
- [Phase 181-R Post-vote quality feedback UX runtime review checkpoint](./www-project-phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint-v1.md)
- [Phase 182 Quality feedback milestone & governance boundary](./www-project-phase-182-quality-feedback-milestone-governance-boundary-v1.md)

**Quality badge governance and runtime (183–192-R):**

- [Phase 183 High-quality poll presentation governance spec](./www-project-phase-183-high-quality-poll-presentation-governance-spec-v1.md)
- [Phase 184 High-quality poll badge eligibility plan](./www-project-phase-184-high-quality-poll-badge-eligibility-plan-v1.md)
- [Phase 185-R High-quality poll badge eligibility plan review checkpoint](./www-project-phase-185r-high-quality-poll-badge-eligibility-plan-review-checkpoint-v1.md)
- [Phase 186 High-quality poll badge read-model / presentation plan](./www-project-phase-186-high-quality-poll-badge-read-model-presentation-plan-v1.md)
- [Phase 186-R High-quality poll badge read-model presentation plan review checkpoint](./www-project-phase-186r-high-quality-poll-badge-read-model-presentation-plan-review-checkpoint-v1.md)
- [Phase 187 High-quality poll badge runtime implementation plan](./www-project-phase-187-high-quality-poll-badge-runtime-implementation-plan-v1.md)
- [Phase 187-R High-quality poll badge runtime implementation plan review checkpoint](./www-project-phase-187r-high-quality-poll-badge-runtime-implementation-plan-review-checkpoint-v1.md)
- [Phase 188 High-quality poll badge minimal public read runtime](./www-project-phase-188-high-quality-poll-badge-minimal-public-read-runtime-v1.md)
- [Phase 188-R High-quality poll badge minimal public read runtime review checkpoint](./www-project-phase-188r-high-quality-poll-badge-minimal-public-read-runtime-review-checkpoint-v1.md)
- [Phase 189 High-quality poll badge frontend presentation plan](./www-project-phase-189-high-quality-poll-badge-frontend-presentation-plan-v1.md)
- [Phase 189-R High-quality poll badge frontend presentation plan review checkpoint](./www-project-phase-189r-high-quality-poll-badge-frontend-presentation-plan-review-checkpoint-v1.md)
- [Phase 190 High-quality poll badge minimal frontend rendering runtime](./www-project-phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-v1.md)
- [Phase 190-R High-quality poll badge minimal frontend rendering runtime review checkpoint](./www-project-phase-190r-high-quality-poll-badge-minimal-frontend-rendering-runtime-review-checkpoint-v1.md)
- [Phase 191 High-quality poll badge poll detail / results presentation plan](./www-project-phase-191-high-quality-poll-badge-poll-detail-results-presentation-plan-v1.md)
- [Phase 191-R High-quality poll badge poll detail / results presentation plan review checkpoint](./www-project-phase-191r-high-quality-poll-badge-poll-detail-results-presentation-plan-review-checkpoint-v1.md)
- [Phase 192 High-quality poll badge poll detail / results minimal frontend rendering runtime](./www-project-phase-192-high-quality-poll-badge-detail-results-minimal-frontend-rendering-runtime-v1.md)
- [Phase 192-R High-quality poll badge detail / results rendering review checkpoint](./www-project-phase-192r-high-quality-poll-badge-detail-results-rendering-review-checkpoint-v1.md)

### 2.2 Consolidated delivery facts

Phase 177–192-R together delivered:

1. **`poll_quality_feedback_aggregate` schema foundation** — poll-level rows keyed by `(poll_id, feedback_tag)` with non-negative `aggregate_count`.
2. **`POST /polls/:pollId/quality-feedback`** — write API that increments aggregate counts only; response `{ "ok": true }` only.
3. **Post-vote frontend UX** — feedback chips mount only after a successful vote on `/vote/:pollId`.
4. **`deriveQualityBadge()` public read runtime** — `quality_badge: null | "positive_feedback"` on `GET /polls/:id`, `GET /polls/:id/results`, and `GET /polls/feed`.
5. **Minimal frontend badge rendering** — shared `renderQualityFeedbackBadge()` / `mountQualityFeedbackBadgeNearTitle()` on `/explore`, `/vote/:pollId`, and `/results/:pollId`.
6. **Runtime review checkpoints** — Phase 178-R through 192-R confirmed boundaries with no blocker before this milestone.

---

## 3. Current Data Model Contract (Fixed)

### 3.1 Durable source — only `poll_quality_feedback_aggregate`

| Rule | Current behavior |
|------|------------------|
| Durable feedback source | **`poll_quality_feedback_aggregate` only** |
| Row key | `(poll_id, feedback_tag)` |
| Columns in use | `poll_id`, `feedback_tag`, `aggregate_count`, `updated_at` |
| Per-user event table | **No** |
| Durable badge table | **No** |
| `threshold_state` | **Not stored** |
| `bucket_state` | **Not stored** |
| Public `score` / `rank` / `counts` / tag breakdown | **Not exposed** |

Badge derivation is boolean-like at read time via `deriveQualityBadge()` from aggregate rows only. Derivation details (minimum volume, positive/negative balance) are internal and never returned by public APIs.

### 3.2 Write API (unchanged from Phase 182)

**Route:** `POST /polls/:pollId/quality-feedback`

**Request body — only:**

```json
{ "feedback_tag": "表達清楚" }
```

**Success response — only:**

```json
{ "ok": true }
```

The response does **not** return `aggregate_count`, `threshold_state`, `bucket_state`, `quality_badge`, ranking signal, creator score, poll result, or option info.

---

## 4. Current Public API Contract (Fixed)

### 4.1 `quality_badge` field ceiling

Public poll APIs return:

```text
quality_badge: null | "positive_feedback"
```

**Routes:**

| Route | `quality_badge` field |
|-------|----------------------|
| `GET /polls/:id` | Yes |
| `GET /polls/:id/results` | Yes |
| `GET /polls/feed` | Yes (per feed item) |

### 4.2 Derivation rules (internal only)

- `deriveQualityBadge()` reads `poll_quality_feedback_aggregate` only.
- Not-qualified, low-volume, not-computed, and gated cases unify to `null` without reason distinction.
- Public APIs do **not** return `aggregate_count`, tag count, tag breakdown, raw feedback total, `score`, `rank`, percentile, `threshold_state`, `bucket_state`, or `creator_score`.

---

## 5. Current Frontend Presentation Contract (Fixed)

### 5.1 Display rule

Display is allowed **only when**:

```text
quality_badge === "positive_feedback"
```

| Case | Behavior |
|------|----------|
| `quality_badge === "positive_feedback"` | Render low-key chip with copy **回饋良好** |
| `quality_badge === null` | completely not display badge |
| Missing field | completely not display badge |
| Unexpected value | completely not display badge |

The only visible public label is **回饋良好**. No `尚未達標`, `回饋不足`, `品質不足`, `未取得徽章`, `優質題目`, `高分題目`, `熱門`, `排名`, `品質分數`, or `低品質`.

### 5.2 Surfaces and placement

| Surface | Badge rendering | Placement |
|---------|-----------------|-----------|
| `/explore` feed card | Yes | Card title / status badge row |
| `/vote/:pollId` poll detail | Yes | Near `#poll-title` |
| `/results/:pollId` results | Yes | Near `#page-title` |
| Public HTML static shells | No hard-coded badge | N/A |

### 5.3 Shared helpers

| Helper | Role |
|--------|------|
| `renderQualityFeedbackBadge()` | Creates chip DOM when `quality_badge === "positive_feedback"`; returns `null` otherwise |
| `mountQualityFeedbackBadgeNearTitle()` | Inserts badge row immediately after title element on detail/results pages |
| `shouldRenderQualityFeedbackBadge()` | Single strict equality gate — no second copy or gate logic |

Module: `public/frontend/quality-feedback-badge.js`

### 5.4 Forbidden presentation details

Phase 193 does **not** add and the current runtime does **not** include:

- tooltip
- detail panel
- debug reason
- explanation
- `aggregate_count` display
- tag breakdown / tag counts
- ratio
- threshold / bucket display
- `score` / `rank` / `creator_score`

### 5.5 Behavior boundaries

Quality badge presentation must **not** affect:

- ordering
- filtering
- CTA
- vote eligibility
- results visibility
- result interpretation

No `localStorage`, `sessionStorage`, or cookie for quality badge state.

---

## 6. Governance Boundary (What Phase 193 Does Not Add)

Phase 193 is a documentation milestone. It does **not** implement any of the following:

| Forbidden in Phase 193 | Reason |
|------------------------|--------|
| Creator-facing explanation / debug UI | Requires separate phase with privacy boundary |
| Durable badge table or cache | Requires separate schema/migration phase |
| Ranking or recommendation ordering | Quality badge must not manipulate poll ranking direction |
| Threshold or bucket state runtime | Deferred to future governance phase |
| Creator score | No identity-linked or aggregate punishment score |
| Punishment / demotion / 降權 | No automatic creator penalty from feedback |
| Additional badge surfaces beyond `/explore`, `/vote/:pollId`, `/results/:pollId` | Requires explicit new phase |
| Public count / score / rank leakage | Violates low-resolution presentation contract |
| API expansion | Requires separate approved phase |

Future work on any of the above must open a **new phase** with explicit governance rules, minimum volume, privacy boundary, abuse boundary, display copy, and public vs creator-facing boundary.

---

## 7. Protected Boundaries (Unchanged)

Phase 193 confirms these boundaries remain intact from prior phases:

| Boundary | Status |
|----------|--------|
| **Raw Option Linkage Ban** | Preserved |
| **Official Vote transaction order** | Unchanged |
| **vote-by-index** | Unchanged |
| **eligibility-before-option-resolve** | Unchanged |
| **Reference Answer** | Unchanged |
| **UserAuthResolver** | Unchanged |
| **Result visibility** | Unchanged |
| **Eligibility** | Unchanged |
| **Profile fields** | Unchanged |
| **Poll lifecycle** | Unchanged |

No new option choice + user/session/device/request/log/trace/metric/error payload linkage.

Vote token schema: `user_id + poll_id`. Counter schema: `poll_id + option_id + shard_id`.

---

## 8. Non-Goals (This Checkpoint)

Phase 193 does **not**:

- modify `src/` runtime, HTTP handlers, repository, service, or `public/frontend/` behavior.
- add migration, schema DDL, or API contract changes.
- add ranking, threshold, bucket, creator score, recommendation ordering, or penalty behavior.
- add analytics, logs, metrics, APM, dashboards, or abuse-prevention runtime.
- commit `design-drafts/`.

Explicit non-goals:

- **no migration**
- **no schema change**
- **no runtime change**
- **no API change**
- **no frontend change**
- **no ranking**
- **no threshold**
- **no bucket**
- **no creator score**
- **no recommendation ordering**
- **no penalty / demotion / 降權**
- **no abuse-prevention decision**
- **no durable badge table**
- **no creator-facing explanation**

**Docs/checkpoint only.** Phase 193 delivery scope is limited to this document, guard tests, and README index entry.

---

## 9. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-193-quality-badge-presentation-milestone-checkpoint-doc.test.ts` | Doc + README index guard |
| `tests/frontend/phase-193-quality-badge-presentation-milestone-checkpoint.test.ts` | Frontend/static guard for current badge contract and helper usage |

Retained quality feedback and badge guards from prior phases include Phase 182, 188-R, 190-R, 192, and 192-R test files.

---

## 10. Validation

```bash
npm test
npm run typecheck
npm run build
npm run smoke:public:local
```

Focused tests:

- `tests/docs/phase-193-quality-badge-presentation-milestone-checkpoint-doc.test.ts`
- `tests/frontend/phase-193-quality-badge-presentation-milestone-checkpoint.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 11. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 193 is documentation and doc/static guards only. No migration, schema DDL, runtime, API, DB, or frontend changes. Raw Option Linkage Ban preserved.

Quality feedback remains poll-level aggregate signal only. `poll_quality_feedback_aggregate` is the only durable source. Public quality badge presentation is low-resolution (`null | "positive_feedback"`) with copy **回饋良好** only on `/explore`, `/vote/:pollId`, and `/results/:pollId`.
