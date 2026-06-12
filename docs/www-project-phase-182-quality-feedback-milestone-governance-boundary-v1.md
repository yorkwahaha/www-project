# WWW Project Phase 182 — Quality Feedback Milestone & Governance Boundary v1

**Status:** milestone checkpoint, focused doc guards, and README index only. Consolidates Phase 177–181-R quality feedback delivery and review conclusions, and establishes the governance boundary before any future **優質題目** badge, ranking, threshold/bucket, creator score, punishment/demotion, or abuse-prevention product decisions.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-option-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 181-R post-vote quality feedback UX runtime review checkpoint (`47285b5`).

**Prior checkpoint:** [Phase 181-R Post-vote quality feedback UX runtime review checkpoint](./www-project-phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 182 records the completed quality feedback foundation arc across schema, write API, post-vote frontend UX, and runtime review checkpoints. It is the stable boundary reference for what quality feedback **is** today (poll-level aggregate signal only) and what it **must not become** without a separately approved phase.

This milestone answers:

1. What Phase 177–181-R delivered and what remains fixed.
2. Which privacy, vote, auth, result, and governance boundaries quality feedback must not cross.
3. Which future product surfaces (優質題目, ranking, threshold/bucket, creator score, punishment) require a new phase with explicit governance rules.

---

## 2. Phase 177–181-R Milestone Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **177** | `poll_quality_feedback_aggregate` schema foundation — `poll_id`, five-tag `feedback_tag`, `aggregate_count`, `updated_at`, `UNIQUE (poll_id, feedback_tag)`; poll-level aggregate only | **Complete** |
| **178-R (checkpoint)** | Schema runtime readiness review — approves Phase 179 write API plan; no per-user event table, threshold/bucket, option/user/session/request/trace linkage | **Complete** |
| **179 (plan)** | Write API runtime plan — `POST /polls/:pollId/quality-feedback`, body `{ "feedback_tag" }` only, response `{ "ok": true }` only | **Complete (plan)** |
| **180** | Write API runtime foundation — aggregate upsert `(poll_id, feedback_tag)`; no schema/migration, dedup, or linkage | **Complete** |
| **180-R (checkpoint)** | Write API runtime review — approves Phase 181 post-vote frontend UX | **Complete** |
| **181** | Post-vote quality feedback frontend UX on `/vote/:pollId` success panel only | **Complete** |
| **181-R (checkpoint)** | Post-vote UX runtime review — approves Phase 182 milestone boundary work | **Complete** |

### 2.1 Phase references

- [Phase 177 Quality feedback aggregate schema foundation](./www-project-phase-177-quality-feedback-aggregate-schema-foundation-v1.md)
- [Phase 178-R Quality feedback aggregate schema runtime readiness review checkpoint](./www-project-phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint-v1.md)
- [Phase 179 Quality feedback aggregate write API runtime plan](./www-project-phase-179-quality-feedback-aggregate-write-api-runtime-plan-v1.md)
- [Phase 180 Quality feedback aggregate write API runtime foundation](./www-project-phase-180-quality-feedback-aggregate-write-api-runtime-foundation-v1.md)
- [Phase 180-R Quality feedback write API runtime review checkpoint](./www-project-phase-180r-quality-feedback-write-api-runtime-review-checkpoint-v1.md)
- [Phase 181 Post-vote quality feedback UX](./www-project-phase-181-post-vote-quality-feedback-ux-v1.md)
- [Phase 181-R Post-vote quality feedback UX runtime review checkpoint](./www-project-phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint-v1.md)

### 2.2 Consolidated delivery facts

Phase 177–181-R together delivered:

1. **`poll_quality_feedback_aggregate` schema foundation** — poll-level rows keyed by `(poll_id, feedback_tag)` with non-negative `aggregate_count`.
2. **`POST /polls/:pollId/quality-feedback`** — write API that increments aggregate counts only.
3. **Post-vote frontend UX** — feedback chips mount only after a successful vote on `/vote/:pollId`.
4. **Runtime review checkpoints** — Phase 178-R, 180-R, and 181-R confirmed boundaries with no blocker before this milestone.

---

## 3. Current Quality Feedback Contract (Fixed)

### 3.1 Write API

**Route:** `POST /polls/:pollId/quality-feedback`

**Request body — only:**

```json
{ "feedback_tag": "表達清楚" }
```

**MVP tags — only five:**

| Tag | Allowed |
|-----|---------|
| **表達清楚** | Yes |
| **選項公平** | Yes |
| **值得思考** | Yes |
| **期待結果** | Yes |
| **題目不優** | Yes |

**Success response — only:**

```json
{ "ok": true }
```

The response does **not** return `aggregate_count`, `threshold_state`, `bucket_state`, ranking signal, creator score, poll result, or option info.

### 3.2 Frontend UX

| Rule | Current behavior |
|------|------------------|
| Display timing | Feedback mounts **only after vote success** on `/vote/:pollId` |
| Demo polls | Preview-only placeholder; **does not call** the write API |
| Credentials | `credentials: 'omit'` on feedback submit |
| Success handling | page-local soft lock after success; chips disabled for remainder of page session |
| Failure handling | Neutral frontend-owned copy only |
| Durable dedup | **No durable dedup** — no server-side or client-side durable duplicate prevention |
| Client storage | No `localStorage`, `sessionStorage`, or cookie for feedback state |

### 3.3 Data model posture

Quality feedback is currently **poll-level aggregate signal only**:

- One anonymous count per `(poll_id, feedback_tag)`.
- **No** per-user feedback event table.
- **No** durable linkage between feedback and option, user, session, device, request, log, trace, metric, error payload, or analytics record.

---

## 4. Governance Boundary (What Phase 182 Does Not Add)

Phase 182 is a documentation milestone. It does **not** implement any of the following:

| Forbidden in Phase 182 | Reason |
|------------------------|--------|
| **優質題目** badge or label | Requires governance rule, minimum volume, privacy boundary, abuse boundary, display copy, and public vs creator-facing boundary |
| **Ranking** or recommendation ordering | Quality feedback must not manipulate poll ranking direction |
| **Threshold** or **bucket** state | Deferred to future governance phase |
| **Creator score** | No identity-linked or aggregate punishment score |
| **Punishment / demotion /降權** | No automatic creator penalty from feedback |
| **Abuse prevention decisions** | Rate limits, dedup policy, anomaly review require separate approval |

Quality feedback today must **not** be interpreted as:

- a vote-quality gate,
- an eligibility signal,
- a result-visibility input,
- a ranking feature,
- a creator reputation score,
- or a public shame mechanism.

---

## 5. Systems Quality Feedback Must Not Affect

Quality feedback does **not** affect:

| System | Boundary |
|--------|----------|
| Vote transaction | Official Vote path unchanged; feedback is separate from vote token + counter increment |
| `vote-by-index` | Body remains `{ option_index }` only; eligibility-before-option-resolve unchanged |
| Eligibility | No feedback-driven eligibility change |
| Result visibility | No feedback-driven result tier change |
| Auth | No feedback-driven auth or session change |
| Reference Answer | Remains disconnected from feedback |
| `UserAuthResolver` | Unchanged |
| Profile fields / `/users/me` / `/users/me/profile` | Unchanged |
| Poll lifecycle | No feedback-driven lifecycle transition |

---

## 6. Privacy and Linkage Prohibitions (Fixed)

Quality feedback must **not** create durable linkage involving:

- `option_id` / `option_index` / selected option
- `user_id` / `session_id` / `creator_session` / `vote_token`
- `request_id` / device / IP / UA
- log / trace / metric / error / analytics identifiers

Forbidden structures include any equivalent that can reconstruct which option a voter selected or which user/session/device submitted which feedback tag.

**Raw Option Linkage Ban** remains in force. Phase 182 does not weaken it.

---

## 7. Future Work Requires a New Phase

Any future work on **優質題目** or other public/creator-facing quality feedback presentation **must open a new phase** and complete these prerequisites first:

1. **Governance rule** — what qualifies, who decides, and what is forbidden.
2. **Minimum volume** — aggregate thresholds before any display.
3. **Privacy boundary** — no voter exposure, no option linkage, no identity-linked histories.
4. **Abuse boundary** — rate limits, anomaly review, and safe handling of `題目不優` without public shame.
5. **Display copy** — neutral, frontend-owned or governance-approved wording.
6. **Public vs creator-facing boundary** — separate surfaces, delayed/bucketed creator views as needed.

Phase 182 does **not** approve or implement any of the above. It only records that they are required before presentation work begins.

---

## 8. Fixed Boundaries (Unchanged)

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| `vote-by-index` eligibility-before-option-resolve | Unchanged |
| `vote-by-index` body `{ option_index }` only | Unchanged |
| Vote token schema | Unchanged |
| Counter schema | Unchanged |
| Result visibility | Unchanged |
| Eligibility | Unchanged |
| Auth | Unchanged |
| Reference Answer | Unchanged |
| `UserAuthResolver` | Unchanged |
| Profile fields | Unchanged |
| `creator_session` production identity boundary | Unchanged |
| `design-drafts/` | Not committed delivery scope |

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged.

---

## 9. Non-Goals (This Checkpoint)

Phase 182 does **not**:

- modify `src/` runtime, HTTP handlers, repository, service, or frontend.
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
- **no 優質題目 badge**

---

## 10. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-182-quality-feedback-milestone-governance-boundary-doc.test.ts` | Doc + README index guard |

Retained quality feedback guards from prior phases:

- `tests/polls/phase-180r-quality-feedback-write-api-runtime-review-checkpoint.test.ts`
- `tests/http/quality-feedback-routes.test.ts`
- `tests/frontend/phase-181-post-vote-quality-feedback-ux.test.ts`
- `tests/frontend/phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-180r-quality-feedback-write-api-runtime-review-checkpoint-doc.test.ts`
- `tests/docs/phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint-doc.test.ts`

---

## 11. Validation

```bash
npm test
npm run typecheck
npm run build
```

Focused test:

- `tests/docs/phase-182-quality-feedback-milestone-governance-boundary-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 12. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 182 is documentation and doc guards only. No migration, schema DDL, runtime, API, DB, or frontend changes. Raw Option Linkage Ban preserved.

Quality feedback remains poll-level aggregate signal only. Governance boundary before **優質題目**, ranking, threshold/bucket, creator score, and punishment is **recorded**.
