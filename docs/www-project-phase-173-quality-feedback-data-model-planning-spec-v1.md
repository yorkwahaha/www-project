# WWW Project Phase 173 — Quality Feedback Data Model Planning Spec v1

**Status:** docs/spec only. Plans a future poll quality feedback **data model direction** for implementation phases that follow Phase 171 (product spec) and Phase 172 (privacy & abuse boundary spec). **Not implemented.** No runtime behavior, frontend UI, backend, API, DB schema, migration, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, analytics, logging, metrics, APM, trace, debug payload, error payload, or creator punishment score runtime is changed by this phase.

**Baseline:** `origin/master` after Phase 172 quality feedback privacy & abuse boundary spec (`7afb013`).

**Prior specs:**

- [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md)
- [Phase 172 Quality feedback privacy & abuse boundary spec](./www-project-phase-172-quality-feedback-privacy-abuse-boundary-spec-v1.md)

**Related policy draft (separate, not implemented):** [Quality question incentive policy draft](./www-project-quality-question-incentive-policy-draft-v1.md).

---

## 1. Purpose

Phase 173 translates Phase 171–172 product and privacy rules into a **data model planning direction** only. It describes what a future durable store may contain, what it must never contain, and which design choices remain open before any migration or API work.

Phase 173 defines:

1. poll-level aggregate-only feedback as the only approved durable granularity.
2. an allowed future row shape and optional metadata columns.
3. forbidden columns, tables, joins, and side channels.
4. separation from vote counter shards and Official Vote storage.
5. open design choices for write path, deduplication, display thresholds, qualification, and eligibility gating.
6. explicit non-goals and compatibility confirmations.

**Core principle:** The feedback data model stores **anonymous poll-level tag counts** only. It must not store per-user feedback events, option-linked feedback, or identifiers that reconstruct who submitted which tag.

---

## 2. Non-Goals

Phase 173 does **not**:

- implement schema, migration, runtime, backend, API, frontend UI, auth, analytics, logs, or metrics.
- create tables, indexes, queues, or materialized views in this repository phase.
- change vote token schema, counter schema, Official Vote transaction order, `vote-by-index` behavior, result visibility, Reference Answer, `UserAuthResolver`, or profile fields (`birth_year_month`, `residential_region`).
- introduce ranking personalization, analytics tracking, creator punishment score, or feedback dashboards.
- connect feedback aggregates to vote counter shards or official result counters.
- claim that feedback storage or APIs exist.

Explicit non-goals for this phase:

- **no schema/migration**
- **no runtime**
- **no API**
- **no UI**
- **no analytics**
- **no ranking/personalization**
- **no creator punishment score**

---

## 3. Feedback Tags (Reference)

Future MVP tags (from Phase 171):

| Tag | Role |
|-----|------|
| **表達清楚** | Positive — question and options understandable |
| **選項公平** | Positive — option set feels fair |
| **值得思考** | Positive — topic invites reflection |
| **期待結果** | Positive — interest in eventual aggregate outcome |
| **題目不優** | Soft negative — poll quality felt low |

All durable aggregates are **poll-level**; no tag is stored per `option_id` or `option_index`.

---

## 4. Allowed Future Durable Shape (Directional Only)

### 4.1 Poll-level aggregate only

Feedback must remain **poll-level aggregate only**. The coarsest approved durable unit is one aggregate counter per `(poll_id, feedback_tag)` pair.

Directional example (not a committed migration):

```text
poll_quality_feedback_aggregate
  poll_id          — FK to poll; poll scope only
  feedback_tag     — enum/text constrained to approved tag set
  aggregate_count  — non-negative integer; monotonic increment only in planning direction
  updated_at       — optional; last aggregate mutation time (no voter timestamp)
```

Optional future columns (each requires separate privacy review before adoption):

| Column | Purpose |
|--------|---------|
| `display_threshold_met` | boolean or bucket state — whether creator-facing display minimum is satisfied |
| `qualification_bucket` | coarse lifecycle bucket for **「優質題目」** evaluation (e.g. `pending` / `eligible` / `blocked`) derived from aggregates only |
| `aggregation_window_ends_at` | optional boundary when rollups are allowed to change |

No column in this table may hold voter identity, vote internals, or option choice.

### 4.2 What aggregate rows represent

- **May represent:** how many times participants selected each tag for a poll, rolled up without attribution.
- **Must not represent:** who voted, who tagged, which option was selected, or per-request write history.

### 4.3 Forbidden durable shapes

Do **not** plan or implement:

| Forbidden shape | Reason |
|-----------------|--------|
| Per-user feedback event rows | Creates `user_id + poll_id + feedback_tag` linkage |
| Per-session feedback event rows | Reconstructable voter attribution |
| `poll_id + option_id + feedback_tag` rows | Option-level quality signal |
| `poll_id + option_index + feedback_tag` rows | Option-level quality signal |
| Selected option + feedback tag join tables | Answer-direction leakage |
| Feedback rows keyed by `vote_token` | Links feedback to vote path identity |
| Feedback rows keyed by `request_id`, trace id, metric id, or error id | Observability side channel |
| IP / device id / user agent columns on feedback storage | Fingerprinting and voter reconstruction |
| Append-only feedback event log | Durable per-submit history with identity risk |

---

## 5. Forbidden Identifiers and Joins

Future feedback storage must **not** durably store:

- `user_id`
- `session_id`
- `creator_session`
- `vote_token`
- `option_id`
- `option_index`
- `request_id`
- device id
- IP address
- user agent
- trace id
- metric id
- error id
- analytics id

Do **not**:

- join feedback aggregates to vote counter shard tables;
- update official vote counters inside feedback write transactions;
- share transactions between Official Vote (token + counter increment) and feedback aggregate updates unless a later phase proves isolation and still keeps vote transaction order unchanged;
- derive feedback rows from counter shard reads combined with voter knowledge.

Official Vote remains:

```text
vote body: { option_index }
transaction: vote token creation + counter increment (same DB transaction)
```

Feedback aggregate writes are a **separate concern** and must not alter that path.

---

## 6. Open Design Choices

A future implementation phase must decide the following. Phase 173 records options only.

### 6.1 Synchronous aggregate update vs privacy-safe queue

| Option | Tradeoff |
|--------|----------|
| **Synchronous increment** | Simple `UPDATE ... SET aggregate_count = aggregate_count + 1` on submit; must not log identity + tag on failure |
| **Privacy-safe queue** | Submit ack returns before durable rollup; queue payloads must contain only `poll_id + feedback_tag` (no user/session/option fields); workers increment aggregates without voter attribution |

Neither option may introduce per-user event tables. Queue dead-letter storage must not retain identity + tag payloads.

### 6.2 Short-lived non-durable anti-duplicate guard

Phase 172 discussed ephemeral dedup without `user_id + poll_id + tag` rows.

Open question: may a **short-lived, non-durable** guard exist (for example in-memory TTL, Redis key with no tag dimension, or single-use server nonce) to prevent double-submit from the same browser session?

Constraints if allowed:

- must not durably store `user_id`, `session_id`, or `feedback_tag` together;
- must expire quickly;
- must not be written to backups, logs, or metrics with reconstructable identity;
- must not block feedback based on which option was voted.

### 6.3 Minimum threshold before creator-facing display

Creator-facing display (Phase 172: delayed, bucketed, thresholded, aggregate-only) needs a minimum `aggregate_count` sum and/or per-tag floor before any proportion is shown.

Open questions:

- global platform minimum vs per-poll dynamic minimum;
- whether display waits until collection ends;
- whether **「題目不優」** proportions use the same threshold as positive tags.

### 6.4 **「題目不優」** dominance and **「優質題目」** qualification

Open question: when **「題目不優」** share dominates aggregate feedback (after thresholds and collection end), may that **block** **「優質題目」** qualification while the poll remains publicly visible?

Planning direction:

- qualification uses **aggregate thresholds only** (Phase 172);
- dominance may block qualification, not ordinary display, unless a separate governance process applies;
- no automatic creator punishment score derived from dominance.

### 6.5 Feedback after ineligible or failed vote attempts

Phase 171 limits feedback to an **allowed post-vote UX point** after successful Official Vote.

Open question: should feedback be **disallowed entirely** for ineligible denials, duplicate-vote denials, lifecycle-not-collecting denials, and transport failures?

Planning bias:

- default **no** — only successful vote completion triggers the feedback prompt;
- if a future phase allows feedback after denial, it must not store denial reason, eligibility outcome, or `option_index` alongside the tag, and must not create new durable linkage.

---

## 7. Compatibility Confirmation (Unchanged)

| Area | Constraint |
|------|------------|
| Official Vote body | `{ option_index }` only |
| Official Vote transaction order | Vote token + counter increment in same transaction; unchanged |
| `vote-by-index` | Eligibility before option resolve; unchanged |
| Vote token schema | Unchanged |
| Counter schema | Unchanged; feedback not stored in shard rows |
| Result visibility | Lifecycle-tier rules unchanged |
| Reference Answer | Design B; no durable option storage |
| `UserAuthResolver` | Unchanged |
| Profile fields | `birth_year_month`, `residential_region` only |
| Explore / ranking | Freshness-only; no feedback-driven personalization |

---

## 8. Future Implementation Sequence (Not This Phase)

When a later phase implements storage, expected order:

1. adopt enum/tag constraint matching Phase 171 set;
2. add aggregate table (or equivalent) with columns limited to §4;
3. add write path isolated from Official Vote transaction;
4. add display/qualification read models that expose only thresholded aggregates;
5. privacy review before any optional column in §4.1 optional list.

This phase does not authorize step 1–5 execution.

---

## 9. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-173-quality-feedback-data-model-planning-spec-doc.test.ts` | Doc + README index guard |

No frontend runtime guard is required for this docs-only phase.

---

## 10. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused test:

- `tests/docs/phase-173-quality-feedback-data-model-planning-spec-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 11. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 173 is documentation only. It plans poll-level aggregate feedback storage direction without schema, migration, API, runtime, or observability changes. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Feedback aggregates must not connect to vote counter shards. Poll quality feedback data model is **not implemented**.
