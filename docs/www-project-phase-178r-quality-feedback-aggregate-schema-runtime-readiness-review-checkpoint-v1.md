# WWW Project Phase 178-R — Quality Feedback Aggregate Schema Runtime Readiness Review Checkpoint v1

**Status:** review checkpoint only. Audits Phase 177 migration, schema guards, and documentation; records a **go/no-go decision** for Phase 179 aggregate write API/runtime planning. **Not implemented.** No migration, SQL DDL, runtime behavior, frontend UI, backend handlers, API routes, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, eligibility evaluator, analytics, logging, metrics, APM, trace, debug payload, error payload, dashboard, or creator punishment score runtime is changed by this phase.

**Baseline:** `origin/master` after Phase 177 quality feedback aggregate schema foundation (`91eaae6`).

**Artifacts reviewed:**

- [Phase 176-R Quality feedback schema plan review checkpoint](./www-project-phase-176r-quality-feedback-schema-plan-review-checkpoint-v1.md)
- [Phase 177 Quality feedback aggregate schema foundation](./www-project-phase-177-quality-feedback-aggregate-schema-foundation-v1.md)
- `migrations/012_phase177_quality_feedback_aggregate_foundation.sql`
- `tests/polls/quality-feedback-aggregate-schema-guard.test.ts`
- `tests/docs/phase-177-quality-feedback-aggregate-schema-foundation-doc.test.ts`

---

## 1. Review Purpose

Phase 178-R is a **schema runtime readiness review checkpoint** only. It confirms that Phase 177 delivered the approved minimal aggregate table without forbidden linkage, and that the repository remains free of feedback write/read runtime before Phase 179 planning begins.

This checkpoint answers:

1. Is `poll_quality_feedback_aggregate` poll-level aggregate only?
2. Does `poll_id` FK poll identity only?
3. Is `feedback_tag` DB-constrained to five MVP tags?
4. Is `aggregate_count` non-negative `BIGINT` with default 0?
5. Is `updated_at` a row rollup timestamp without request/log/trace linkage?
6. Is `UNIQUE (poll_id, feedback_tag)` present?
7. Did Phase 177 avoid forbidden tables, columns, and runtime surfaces?
8. Are vote, auth, result, Reference Answer, and profile boundaries unchanged?
9. Are there blockers before Phase 179 aggregate write API/runtime planning?

---

## 2. Review Findings (Phase 177)

### 2.1 Poll-level aggregate only — **CONFIRMED**

Migration `012_phase177_quality_feedback_aggregate_foundation.sql` creates **one table only**: `poll_quality_feedback_aggregate`. Each row stores one anonymous counter for `(poll_id, feedback_tag)`. No option dimension, no per-voter grain, no event log.

| Evidence | Result |
|----------|--------|
| Single `CREATE TABLE` in migration | `poll_quality_feedback_aggregate` only |
| Phase 177 doc §1 scope | Poll-level aggregate foundation |
| Schema guard: created tables list | `['poll_quality_feedback_aggregate']` |

**Verdict:** Poll-level aggregate only.

### 2.2 `poll_id` FK to poll identity only — **CONFIRMED**

```sql
poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE
```

No FK to `poll_options`, `users`, `user_sessions`, `creator_sessions`, `poll_vote_tokens`, `poll_option_vote_counters`, or observability tables. Schema guard asserts absence of forbidden `REFERENCES` targets.

**Verdict:** `poll_id` references public poll identity only.

### 2.3 `feedback_tag` DB-level five-tag allowlist — **CONFIRMED**

`poll_quality_feedback_aggregate_feedback_tag_check` constrains `feedback_tag IN (...)`:

| Tag | Present in CHECK |
|-----|------------------|
| **表達清楚** | Yes |
| **選項公平** | Yes |
| **值得思考** | Yes |
| **期待結果** | Yes |
| **題目不優** | Yes |

Schema guard extracts allowlist and asserts exact match to MVP set. No free-text tags.

**Verdict:** DB-level five-tag constraint confirmed.

### 2.4 `aggregate_count` non-negative BIGINT — **CONFIRMED**

```sql
aggregate_count BIGINT NOT NULL DEFAULT 0
CONSTRAINT poll_quality_feedback_aggregate_count_check CHECK (aggregate_count >= 0)
```

**Verdict:** `BIGINT NOT NULL DEFAULT 0` with `CHECK (aggregate_count >= 0)`.

### 2.5 `updated_at` row rollup only — **CONFIRMED**

```sql
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

- Stores last **aggregate row** mutation time only.
- No `request_id`, `submitted_at` per voter, `trace_id`, `log_id`, or session timestamp columns.
- Default `NOW()` is standard row-level rollup; it does not introduce request/log/trace time linkage because no identity or request dimension exists on the row.

**Verdict:** `TIMESTAMPTZ NOT NULL DEFAULT NOW()`; no request/log/trace linkage columns.

### 2.6 `UNIQUE (poll_id, feedback_tag)` — **CONFIRMED**

```sql
CONSTRAINT poll_quality_feedback_aggregate_poll_tag_unique
  UNIQUE (poll_id, feedback_tag)
```

**Verdict:** Uniqueness constraint present.

### 2.7 Phase 177 exclusions — **CONFIRMED**

Migration and guards confirm Phase 177 did **not** add:

| Excluded item | Status |
|---------------|--------|
| Per-user feedback event table | Absent |
| `threshold_state` | Absent |
| `bucket_state` | Absent |
| Vote token FK | Absent |
| Counter shard FK | Absent |
| `option_id` / `option_index` | Absent |
| `user_id` / `session_id` / `creator_session` | Absent |
| `request_id` / device / IP / UA | Absent |
| trace / metric / error / analytics id | Absent |
| Selected option + feedback_tag linkage | Absent |
| Logs / metrics / APM / dashboard / ranking / creator punishment score schema | Absent |

Phase 177 commit (`91eaae6`) touched only: migration, Phase 177 doc, README index, schema guard, doc guard, and `tests/helpers/pg-integration.ts` (truncate list). No `src/` runtime, HTTP routes, or frontend feedback write path was added.

**Verdict:** All Phase 176-R / Phase 177 exclusions honored.

### 2.8 Preserved vote, auth, result, Reference Answer boundaries — **CONFIRMED**

Phase 177 did not modify:

| Area | Status |
|------|--------|
| Raw Option Linkage Ban | Preserved — no user-option-feedback linkage |
| Official Vote transaction order | Unchanged — migration 004 untouched |
| `vote-by-index` eligibility-before-option-resolve | Unchanged |
| Vote token schema (`user_id + poll_id`) | Unchanged |
| Counter schema (`poll_id + option_id + shard_id`) | Unchanged |
| Result visibility | Unchanged |
| Eligibility | Unchanged |
| Auth / `UserAuthResolver` | Unchanged — no `src/` feedback code |
| Reference Answer | Unchanged |
| Profile fields (`birth_year_month`, `residential_region`) | Unchanged |

`src/` contains no `feedback` or `poll_quality_feedback` references. Existing `policy-ui-placeholders.js` quality-feedback **preview** remains policy-panel mock only (pre-Phase 177); it is not wired to Phase 177 schema or runtime.

**Verdict:** All preserved boundaries intact.

---

## 3. Phase 179 Decision

### 3.1 Decision: **APPROVED** (aggregate write API/runtime planning)

Phase 177 migration, guards, and documentation match the Phase 176-R approved minimal shape. No privacy contradiction, Raw Option Linkage Ban violation, or vote-transaction coupling was found in committed artifacts.

**Phase 179 is approved** to plan aggregate write API/runtime **as docs/spec or implementation**, subject to Phase 174 boundaries:

- Feedback submit **separate** from Official Vote transaction.
- Payload poll-level only (`poll_id`, `feedback_tags`); no option or identity fields.
- No logs/metrics/APM/analytics on feedback hot path.
- No ranking personalization or creator punishment score.

Phase 179 planning must **not** add per-user event tables or reconnect feedback to vote internals.

### 3.2 Runtime readiness posture

| Layer | Phase 177 state | Phase 179 may plan |
|-------|-----------------|-------------------|
| Schema | `poll_quality_feedback_aggregate` exists | Write path targeting aggregate `UPDATE` / `INSERT … ON CONFLICT` |
| API | None | Separate POST route (not in vote transaction) |
| Frontend | Policy preview mock only | Post-vote prompt wiring (separate phase) |
| Analytics / dashboards | None | Still forbidden without separate approval |

---

## 4. Blockers Before Phase 179

| Blocker | Status |
|---------|--------|
| Missing `UNIQUE (poll_id, feedback_tag)` | **None** — present |
| Missing tag allowlist CHECK | **None** — present |
| Missing non-negative count CHECK | **None** — present |
| Forbidden columns in migration | **None** |
| Per-user event table introduced | **None** |
| Vote/auth/runtime files modified by Phase 177 | **None** — `src/` untouched |
| Schema/runtime contradiction with Phases 171–176-R | **None** |

**Phase 179 blockers: none identified.**

Open runtime questions from Phases 171–174 (pre-create vs insert-on-first, sync vs queue, failed-vote feedback, display threshold, `優質題目`) remain **planning choices**, not schema blockers.

---

## 5. Non-Goals (This Checkpoint)

Phase 178-R does **not**:

- modify migration `012_phase177_quality_feedback_aggregate_foundation.sql`.
- implement runtime, backend, API, frontend UI, auth, analytics, logs, or metrics.
- change vote token schema, counter schema, Official Vote transaction order, `vote-by-index` behavior, eligibility, result visibility, Reference Answer, `UserAuthResolver`, or profile fields.
- commit `design-drafts/`.

Explicit non-goals:

- **no migration**
- **no schema change**
- **no runtime**
- **no API implementation**
- **no UI implementation**
- **no analytics**
- **no ranking/personalization**
- **no creator punishment score**
- **no logs/metrics/APM/dashboards**

---

## 6. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint-doc.test.ts` | Doc + README index guard |
| `tests/polls/phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint.test.ts` | Static schema + runtime absence guard |

Retained Phase 177 guards:

- `tests/polls/quality-feedback-aggregate-schema-guard.test.ts`
- `tests/docs/phase-177-quality-feedback-aggregate-schema-foundation-doc.test.ts`

---

## 7. Validation

```bash
npm test
npm run typecheck
npm run migrate:check
```

Focused tests:

- `tests/docs/phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint-doc.test.ts`
- `tests/polls/phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 8. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 178-R is documentation and static guards only. No migration, schema DDL, runtime, or observability changes. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Quality feedback aggregate schema runtime readiness review is **complete**; Phase 179 aggregate write API/runtime planning is **approved**.
