# WWW Project Phase 177 — Quality Feedback Aggregate Schema Foundation v1

**Status:** migration + focused schema guards only. Adds the minimal `poll_quality_feedback_aggregate` table for poll-level quality feedback aggregates. No runtime API, frontend UI, feedback write path, analytics, logging, metrics, APM, trace, debug payload, error payload, dashboard, ranking personalization, creator punishment score, threshold state, or bucket state is implemented by this phase.

**Baseline:** `origin/master` after Phase 176-R quality feedback schema plan review checkpoint (`4ab6f32`).

**Prior specs:**

- [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md)
- [Phase 172 Quality feedback privacy & abuse boundary spec](./www-project-phase-172-quality-feedback-privacy-abuse-boundary-spec-v1.md)
- [Phase 173 Quality feedback data model planning spec](./www-project-phase-173-quality-feedback-data-model-planning-spec-v1.md)
- [Phase 174 Quality feedback API & runtime boundary planning spec](./www-project-phase-174-quality-feedback-api-runtime-boundary-planning-spec-v1.md)
- [Phase 175 Quality feedback schema foundation plan](./www-project-phase-175-quality-feedback-schema-foundation-plan-v1.md)
- [Phase 176-R Quality feedback schema plan review checkpoint](./www-project-phase-176r-quality-feedback-schema-plan-review-checkpoint-v1.md)

---

## 1. Scope

Phase 177 creates only the poll-level aggregate schema foundation:

```text
poll_quality_feedback_aggregate
  poll_id
  feedback_tag
  aggregate_count
  updated_at
```

One row represents an anonymous aggregate count for one `(poll_id, feedback_tag)` pair. The table has no option, user, session, device, request, log, trace, metric, error, analytics, or ranking dimension.

---

## 2. Migration Summary

Migration:

```text
migrations/012_phase177_quality_feedback_aggregate_foundation.sql
```

Table:

```text
poll_quality_feedback_aggregate
```

Constraints:

- `poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE`
- `feedback_tag TEXT NOT NULL`
- `feedback_tag` DB-level allowlist:
  - `表達清楚`
  - `選項公平`
  - `值得思考`
  - `期待結果`
  - `題目不優`
- `aggregate_count BIGINT NOT NULL DEFAULT 0`
- `CHECK (aggregate_count >= 0)`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `UNIQUE (poll_id, feedback_tag)`

`poll_id` references poll identity only. It does not reference options, users, sessions, requests, devices, logs, traces, metrics, errors, analytics, vote tokens, or counter shards.

---

## 3. Explicit Exclusions

Phase 177 does not create:

- per-user feedback event table
- per-session feedback event table
- per-request feedback event table
- `threshold_state`
- `bucket_state`
- vote token FK
- counter shard FK
- `user_id`
- `session_id`
- `creator_session`
- `option_id`
- `option_index`
- `request_id`
- device / IP / UA columns
- trace / metric / error / analytics id columns
- selected option + feedback_tag linkage
- logs / metrics / analytics / APM / dashboard surfaces
- ranking personalization
- creator punishment score

This phase also does not handle runtime API behavior, frontend prompts, aggregate write API, queueing, deduplication, threshold display, bucket display, ranking, dashboard, punishment, analytics, or creator-facing feedback reads.

Phase 178 or later may discuss aggregate write API/runtime behavior only after a separate privacy review preserves the Raw Option Linkage Ban and keeps feedback outside the Official Vote transaction.

---

## 4. Preserved Boundaries

Unchanged by Phase 177:

- Raw Option Linkage Ban
- Official Vote transaction order
- `vote-by-index` eligibility-before-option-resolve ordering
- `vote-by-index` body remains `{ option_index }`
- Vote token schema remains `user_id + poll_id`
- Counter schema remains `poll_id + option_id + shard_id`
- Result visibility
- Eligibility
- Auth
- Reference Answer
- `UserAuthResolver`
- profile fields
- `/users/me`
- `/users/me/profile`
- `creator_session` production identity boundary (creator_session production identity boundary)

No durable data added by this phase can reconstruct which option a user selected.

---

## 5. Validation Plan

Required checks for this phase:

```bash
npm run migrate:check
npm test
npm run typecheck
```

Focused guards cover:

- table, column, type, `NOT NULL`, default, `CHECK`, `UNIQUE`, and FK shape.
- forbidden columns and forbidden linkages.
- five-tag `feedback_tag` allowlist.
- this document and README Phase 177 index entry.
