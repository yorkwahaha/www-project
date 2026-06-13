# WWW Project Phase 188 — High-quality Poll Badge Minimal Public Read Runtime v1

**Status:** minimal public read runtime. Adds `quality_badge: null | "positive_feedback"` to public poll read surfaces after Phase 187-R approval. No schema/migration, no frontend badge presentation, no durable badge table, and no public counts/tag breakdown/score/rank/creator score exposure.

**Baseline:** `origin/master` after Phase 187-R high-quality poll badge runtime implementation plan review checkpoint (`0dd22bd`).

**Prior checkpoint:** [Phase 187-R High-quality poll badge runtime implementation plan review checkpoint](./www-project-phase-187r-high-quality-poll-badge-runtime-implementation-plan-review-checkpoint-v1.md).

---

## 1. Scope

Phase 188 is **minimal public read runtime** only.

It adds:

- `deriveQualityBadge()` read helper in `src/polls/quality-badge.ts`.
- Poll-scoped aggregate read queries on existing `poll_quality_feedback_aggregate`.
- `quality_badge` on public poll read surfaces:
  - `GET /polls/:id`
  - `GET /polls/:id/results`
  - `GET /polls/feed` item objects
- Focused unit, HTTP, source, and static guard tests.
- This document and README index entry.

Phase 188 does **not** add:

- Schema/migration.
- Durable badge table.
- Frontend badge DOM, copy, class, or id.
- Frontend badge presentation.
- Creator-facing explanation/debug fields.
- Threshold/bucket runtime exposed via API.
- Ranking, recommendation ordering, hotness, trend, or personalization.

---

## 2. Public API ceiling

Public responses may include only:

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

Rules:

- `quality_badge` is the only new public badge field.
- `null` means no badge should be shown.
- `"positive_feedback"` means a future frontend phase may show a low-resolution positive badge.
- Public output must **not distinguish reasons** for `null` across not-qualified, low-volume, not-computed, and conservative-gating cases.

Forbidden public fields remain banned:

- `aggregate_count`
- `tag_counts`
- `tag_breakdown`
- `raw_feedback_total`
- `score`
- `rank`
- `percentile`
- `threshold_state`
- `bucket_state`
- `creator_score`
- `reason_code`
- `eligibility_status`

---

## 3. Read helper behavior

`deriveQualityBadge(aggregates)`:

- Input: poll-level rows from `poll_quality_feedback_aggregate` only.
- Output: `null | "positive_feedback"` only.
- Uses internal conservative positive-tag totals and negative-tag gating.
- Does **not** return reasons, intermediate counts, threshold state, or bucket state.
- Returns `null` when no aggregate exists or data is insufficient.

Positive tags considered internally:

- `表達清楚`
- `選項公平`
- `值得思考`
- `期待結果`

Negative tag `題目不優` is used only for internal conservative gating. It is never exposed publicly.

---

## 4. Repository boundary

Read queries:

```sql
SELECT poll_id, feedback_tag, aggregate_count, updated_at
FROM poll_quality_feedback_aggregate
WHERE poll_id = $1
```

and batch:

```sql
SELECT poll_id, feedback_tag, aggregate_count, updated_at
FROM poll_quality_feedback_aggregate
WHERE poll_id = ANY($1::uuid[])
```

Rules:

- Poll-scoped only.
- No `option_id` reads.
- No joins to users, sessions, requests, devices, vote tokens, or poll options.
- `aggregate_count` stays server-internal; public API mappers do not echo it.

---

## 5. Service integration

`createPollService()` resolves `quality_badge` in:

- `getPollById()`
- `getPollResults()` including collecting/unavailable shells
- `getPublicFeed()` via batch aggregate read

Feed ordering, explore ordering, result visibility, lifecycle, auth, vote transaction, vote-by-index, eligibility, Reference Answer, `UserAuthResolver`, and profile fields are unchanged.

---

## 6. Frontend boundary

**No frontend badge presentation.**

Phase 188 does **not** add frontend badge presentation.

Allowed frontend-only tolerance:

- `public/frontend/explore-page.js` feed item validation accepts `quality_badge: null | "positive_feedback"` so feed parsing does not fail when the API field is present.

Forbidden:

- Frontend badge DOM
- Badge rendering copy such as `回饋良好`
- Badge id/class such as `quality-badge` or `high-quality`
- `localStorage` / `sessionStorage` / cookie badge state

---

## 7. Explicit non-goals

Phase 188 does not add:

- Schema/migration.
- Durable badge table.
- Frontend badge presentation.
- Creator-facing explanation/debug fields.
- Ranking.
- Recommendation ordering.
- Hotness.
- Trend.
- Personalization.
- Punishment.
- Demotion / 降權.
- Blocking.
- Abuse decision.
- Per-user feedback event table.
- Option/user/session/device/request/log/trace/metric/error/analytics linkage.

Quality feedback remains **poll-level aggregate signal only**.

Feedback must not be linked with option choice or voter identity.

---

## 8. Privacy and governance boundaries

Raw Option Linkage Ban remains in force.

Feedback does **not** affect:

- Vote transaction
- `vote-by-index`
- Eligibility
- Result visibility
- Auth
- Reference Answer
- `UserAuthResolver`
- Profile fields
- Poll lifecycle

Official Vote transaction order unchanged. `vote-by-index` eligibility-before-option-resolve unchanged.

---

## 9. Validation Plan

```bash
npm test
npm run typecheck
npm run build
npm run smoke:public:local
```

Focused tests:

- `tests/polls/quality-badge.test.ts`
- `tests/polls/quality-badge-public-read-runtime.test.ts`
- `tests/docs/phase-188-high-quality-poll-badge-minimal-public-read-runtime-doc.test.ts`
- `tests/frontend/phase-188-high-quality-poll-badge-minimal-public-read-runtime.test.ts`

`design-drafts/` must remain uncommitted.

---

## 10. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 188 adds minimal public read runtime only. No migration, durable badge table, frontend badge presentation, or forbidden public count/score/rank leakage.
