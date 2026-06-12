# WWW Project Phase 175 — Quality Feedback Schema Foundation Plan v1

**Status:** docs/spec only. Plans a future **database schema foundation** for poll quality feedback aggregates after Phases 171–174. **Not implemented.** No migration, SQL DDL commit, runtime behavior, frontend UI, backend handlers, API routes, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, eligibility evaluator, analytics, logging, metrics, APM, trace, debug payload, error payload, dashboard, or creator punishment score runtime is changed by this phase.

**Baseline:** `origin/master` after Phase 174 quality feedback API & runtime boundary planning spec (`163cf91`).

**Prior specs:**

- [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md)
- [Phase 172 Quality feedback privacy & abuse boundary spec](./www-project-phase-172-quality-feedback-privacy-abuse-boundary-spec-v1.md)
- [Phase 173 Quality feedback data model planning spec](./www-project-phase-173-quality-feedback-data-model-planning-spec-v1.md)
- [Phase 174 Quality feedback API & runtime boundary planning spec](./www-project-phase-174-quality-feedback-api-runtime-boundary-planning-spec-v1.md)

---

## 1. Purpose

Phase 175 records the **schema foundation plan** for a future poll quality feedback aggregate table (or equivalent). It translates Phases 171–174 into concrete column, constraint, and indexing direction—without creating migrations, tables, or runtime code.

Phase 175 defines:

1. poll-level aggregate-only durable shape.
2. primary/composite uniqueness on `poll_id + feedback_tag`.
3. approved MVP `feedback_tag` enum constraint.
4. `aggregate_count` non-negative invariant.
5. forbidden columns, tables, and foreign-key patterns.
6. separation from vote counter shards and Official Vote storage.
7. explicit non-goals and open schema design questions.

**Core principle:** One future aggregate row represents **anonymous poll-level tag count only**. Schema must not admit per-user events, option linkage, or vote-counter coupling.

---

## 2. Non-Goals

Phase 175 does **not**:

- create migration files, apply DDL, or add schema to the repository.
- implement runtime, backend, API, frontend UI, auth, analytics, logs, or metrics.
- change vote token schema, counter schema, Official Vote transaction order, `vote-by-index` behavior, eligibility, result visibility, Reference Answer, `UserAuthResolver`, or profile fields (`birth_year_month`, `residential_region`).
- introduce ranking personalization, creator punishment score, analytics tables, observability dashboards, or feedback event logs.
- claim that feedback schema exists in production.

Explicit non-goals for this phase:

- **no migration**
- **no schema implementation**
- **no runtime**
- **no API**
- **no UI**
- **no analytics**
- **no ranking/personalization**
- **no creator punishment score**
- **no logs/metrics/APM/dashboards** on feedback storage path

---

## 3. Planned Aggregate Table (Directional Only)

Directional name and shape—not committed DDL:

```text
poll_quality_feedback_aggregate
  poll_id            UUID / public poll identity FK
  feedback_tag       enum (approved MVP tags only)
  aggregate_count    BIGINT NOT NULL DEFAULT 0 CHECK (aggregate_count >= 0)
  updated_at         TIMESTAMPTZ NULL          -- optional column; see §8
  threshold_state    TEXT/ENUM NULL            -- optional; see §8
  bucket_state       TEXT/ENUM NULL            -- optional; see §8
```

**Uniqueness (required planning constraint):**

```text
PRIMARY KEY or UNIQUE (poll_id, feedback_tag)
```

At most one aggregate row per poll per tag. No secondary uniqueness on voter, session, option, or request dimensions.

---

## 4. Column Semantics and Constraints

### 4.1 `poll_id`

- References **public poll identity** (same poll entity used by public poll routes).
- Scope is **poll-level only**; must not imply option-level linkage.
- FK to polls table is acceptable; FK to vote tokens, counter shards, or per-option tables is **not**.

### 4.2 `feedback_tag`

Must be limited to approved MVP tags only:

| Tag | Polarity |
|-----|----------|
| **表達清楚** | Positive |
| **選項公平** | Positive |
| **值得思考** | Positive |
| **期待結果** | Positive |
| **題目不優** | Soft negative |

Planning constraint: DB enum, check constraint, or application-enforced allowlist matching this set. No free-text tags. No per-option tag variants.

### 4.3 `aggregate_count`

- **Non-negative** at all times (`>= 0`).
- Planning direction: monotonic increment on accepted feedback submit only; no decrement except explicit governance rollback in a separate approved process (not planned here).
- Does **not** store vote counts, shard totals, or result percentages.

### 4.4 Optional `updated_at`

- Last time the **aggregate row** was mutated (rollup timestamp).
- Must **not** store per-voter submit time or last voter identity.
- Whether required vs optional remains open (§8).

### 4.5 Optional `threshold_state` / `bucket_state`

- Coarse derived flags for creator-facing display or **「優質題目」** qualification buckets (Phase 172–173).
- May be stored or computed at read time—open question (§8).
- Must not encode voter identity or option choice.

---

## 5. Forbidden Schema Elements

### 5.1 Forbidden columns

The aggregate table (and any feedback-related table) must **not** include:

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
- ranking id

### 5.2 Forbidden tables and patterns

| Forbidden pattern | Reason |
|-------------------|--------|
| Per-user feedback event rows | `user_id + poll_id + feedback_tag` linkage |
| Per-session feedback event log | Reconstructable voter attribution |
| `poll_id + option_id + feedback_tag` rows | Option-level quality signal |
| Selected option + feedback tag join tables | Answer-direction leakage |
| FK from aggregate table to vote counter shard rows | Couples feedback to vote internals |
| Trigger on vote token insert that writes feedback rows | Violates transaction separation |
| Materialized view joining votes to feedback tags | User-option-feedback reconstruction |

### 5.3 No connection to vote counter shards

- No shared table between feedback aggregates and official vote counter shards.
- No column in aggregate table referencing `shard_id`.
- Feedback aggregate `UPDATE` must not run inside Official Vote transaction (Phase 174).
- Official Vote remains: vote token creation + counter increment in **one** DB transaction; unchanged.

---

## 6. Indexing Direction (Planning Only)

If implemented later, likely indexes:

| Index | Purpose |
|-------|---------|
| `UNIQUE (poll_id, feedback_tag)` | Primary access pattern; enforce one row per tag per poll |
| `(poll_id)` | Poll-scoped reads for thresholded aggregate display |

Must **not** plan indexes on `(user_id, …)`, `(option_id, …)`, `(session_id, …)`, or `(feedback_tag, updated_at)` that enable voter reconstruction exports.

---

## 7. Compatibility Confirmation (Unchanged)

| Area | Constraint |
|------|------------|
| Official Vote body | `{ option_index }` only |
| Official Vote transaction order | Unchanged |
| `vote-by-index` | Eligibility before option resolve; unchanged |
| Vote token schema | Unchanged |
| Counter schema | Unchanged |
| Result visibility | Lifecycle-tier rules unchanged |
| Eligibility | Vote-time evaluator only |
| Reference Answer | Design B; no durable option storage |
| `UserAuthResolver` | Unchanged |
| Profile fields | `birth_year_month`, `residential_region` only |

Existing poll lifecycle, vote, and result tables are not modified by this planning phase.

---

## 8. Open Schema Design Questions

1. **`updated_at` required or optional?** Is null acceptable for never-updated placeholder rows, or must every increment touch `updated_at`?
2. **`threshold_state` / `bucket_state` stored or derived?** Should display/qualification flags live in the aggregate table, a sibling poll-level summary table, or be computed at read time from `aggregate_count` only?
3. **Pre-create vs insert-on-first-feedback?** Should all five tag rows be inserted at poll publish, or only when first feedback arrives for each tag?
4. **`題目不優` dominance vs `優質題目`?** If **「題目不優」** `aggregate_count` share dominates after collection end, does schema need a `qualification_blocked` bucket state, or is that purely application logic?
5. **Privacy-safe queue before aggregate update?** Should schema assume synchronous `UPDATE aggregate_count = aggregate_count + 1`, or a queue worker that only ever writes `poll_id + feedback_tag` payloads (Phase 173–174)?
6. **Minimum threshold before creator-facing display?** Is `threshold_state` set when sum of counts crosses N, or is N enforced only at API read layer without durable state?

This phase records questions only; it does not decide them.

---

## 9. Future Migration Phase Checklist (Not Authorized Here)

When a later phase adds migrations, it should verify:

- [ ] `UNIQUE (poll_id, feedback_tag)` present
- [ ] `feedback_tag` constrained to five approved MVP values
- [ ] `aggregate_count >= 0` check constraint
- [ ] No forbidden columns in §5.1
- [ ] No FK to vote counter shards or vote tokens
- [ ] No per-user event table introduced alongside aggregate table
- [ ] Privacy review for optional `threshold_state` / `bucket_state`
- [ ] Rollback migration drops only feedback aggregate objects; vote schema untouched

Phase 175 does not authorize executing this checklist.

---

## 10. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-175-quality-feedback-schema-foundation-plan-doc.test.ts` | Doc + README index guard |

No frontend runtime guard is required for this docs-only phase.

---

## 11. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused test:

- `tests/docs/phase-175-quality-feedback-schema-foundation-plan-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 12. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 175 is documentation only. No migration, schema DDL, runtime, or observability changes. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Feedback schema foundation is **not implemented**.
