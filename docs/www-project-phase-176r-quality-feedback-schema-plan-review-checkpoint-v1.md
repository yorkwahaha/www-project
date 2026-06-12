# WWW Project Phase 176-R — Quality Feedback Schema Plan Review Checkpoint v1

**Status:** review checkpoint only. Audits Phases 171–175 quality feedback planning docs and records a **go/no-go decision** for the future first schema migration (Phase 177). **Not implemented.** No migration, SQL DDL, runtime behavior, frontend UI, backend handlers, API routes, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, eligibility evaluator, analytics, logging, metrics, APM, trace, debug payload, error payload, dashboard, or creator punishment score runtime is changed by this phase.

**Baseline:** `origin/master` after Phase 175 quality feedback schema foundation plan (`9301f17`).

**Prior specs reviewed:**

- [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md)
- [Phase 172 Quality feedback privacy & abuse boundary spec](./www-project-phase-172-quality-feedback-privacy-abuse-boundary-spec-v1.md)
- [Phase 173 Quality feedback data model planning spec](./www-project-phase-173-quality-feedback-data-model-planning-spec-v1.md)
- [Phase 174 Quality feedback API & runtime boundary planning spec](./www-project-phase-174-quality-feedback-api-runtime-boundary-planning-spec-v1.md)
- [Phase 175 Quality feedback schema foundation plan](./www-project-phase-175-quality-feedback-schema-foundation-plan-v1.md)

---

## 1. Review Purpose

Phase 176-R is a **schema plan review checkpoint** only. It does not authorize DDL execution; it confirms that Phases 171–175 are internally consistent and that a **minimal first migration** can proceed without violating MVP privacy, vote integrity, or Raw Option Linkage Ban.

This checkpoint answers:

1. Does feedback remain poll-level aggregate only?
2. Is a per-user feedback event table required? (Expected: **no**.)
3. Are forbidden durable linkages still excluded?
4. Is the planned table direction sound?
5. Should the first migration exclude `threshold_state` and `bucket_state`?
6. Are required constraints (`UNIQUE`, non-negative count, tag allowlist) confirmed?
7. Are vote, auth, result, and Reference Answer boundaries unchanged?
8. Are analytics, logs, metrics, APM, ranking personalization, creator punishment score, and dashboards still out of scope?
9. Are there blockers before Phase 177 migration?

---

## 2. Review Findings (Phases 171–175)

### 2.1 Poll-level aggregate only — **CONFIRMED**

Phases 171–175 consistently define feedback as **poll-level quality signal** only. The coarsest approved durable unit is one counter per `(poll_id, feedback_tag)`. No phase introduces option-level feedback rows, per-option tag breakdowns, or option-linked aggregates.

| Phase | Confirmation |
|-------|----------------|
| 171 | Tags describe poll quality from participant perspective; no option-choice linkage |
| 172 | Poll-level (not option-level); `poll_id + feedback_tag → aggregate_count` |
| 173 | Aggregate-only durable shape; no `option_id` / `option_index` columns |
| 174 | Payload `poll_id` + `feedback_tags` only; no option fields |
| 175 | `poll_quality_feedback_aggregate` poll scope only |

**Verdict:** Poll-level aggregate only is consistent across all prior phases. No contradiction found.

### 2.2 No per-user feedback event table — **CONFIRMED**

Phases 172–175 explicitly forbid per-user, per-session, and per-request feedback event rows. Abuse prevention is directed toward rate limits, coarse eligibility, delayed aggregation, minimum thresholds, and anomaly review **without voter exposure**—not toward durable event logging.

**Verdict:** A per-user feedback event table is **not needed** for MVP and must **not** be introduced in Phase 177.

### 2.3 Forbidden durable linkages — **CONFIRMED**

Phases 171–175 align on forbidding durable linkage between:

| Forbidden linkage | Status |
|-------------------|--------|
| Selected option ↔ user | Forbidden (Raw Option Linkage Ban; vote path already compliant) |
| Selected option ↔ feedback tag | Forbidden (would leak answer-direction quality bias) |
| Feedback tag ↔ user / session / device / request | Forbidden |
| Feedback tag ↔ log / trace / metric / error payload | Forbidden |

Forbidden column patterns (`user_id`, `session_id`, `creator_session`, `vote_token`, `option_id`, `option_index`, `request_id`, device/IP/UA/trace/metric/error/analytics/ranking ids) are listed consistently in Phases 173 and 175.

**Verdict:** No prior phase weakens these boundaries. Phase 177 must not introduce any forbidden column or join table.

### 2.4 Future table direction — **CONFIRMED**

Phases 173 and 175 converge on:

```text
poll_quality_feedback_aggregate
  poll_id
  feedback_tag
  aggregate_count
  updated_at          -- optional in planning; recommended in minimal migration
```

- `poll_id` references public poll identity only; no FK to vote tokens or counter shards.
- No connection to vote counter shards or Official Vote transaction.

**Verdict:** Table name and core columns are approved as planning direction.

### 2.5 First migration should exclude `threshold_state` and `bucket_state` — **CONFIRMED**

Phase 175 lists `threshold_state` and `bucket_state` as **optional** columns with open questions (stored vs derived, **「優質題目」** qualification, creator display minimum). These are **display/qualification concerns**, not prerequisites for storing anonymous tag counts.

**Verdict:** Phase 177 first migration should **exclude** `threshold_state` and `bucket_state` unless a later phase documents a strong, privacy-reviewed reason. Threshold and bucket logic can remain **application-layer or read-time derived** from `aggregate_count` until a separate approved phase adds durable state.

### 2.6 `UNIQUE (poll_id, feedback_tag)` — **CONFIRMED**

Phases 173 and 175 require at most one aggregate row per poll per tag. Phase 175 §9 migration checklist includes this constraint.

**Verdict:** Required in Phase 177.

### 2.7 `aggregate_count` non-negative — **CONFIRMED**

Phases 173 and 175 require `aggregate_count >= 0` with monotonic increment on accepted feedback only.

**Verdict:** Required `CHECK (aggregate_count >= 0)` (or equivalent) in Phase 177.

### 2.8 `feedback_tag` constrained to five approved MVP tags — **CONFIRMED**

| Tag | Polarity |
|-----|----------|
| **表達清楚** | Positive |
| **選項公平** | Positive |
| **值得思考** | Positive |
| **期待結果** | Positive |
| **題目不優** | Soft negative |

Phase 171 defines tag semantics; Phases 172–175 require DB enum, check constraint, or application allowlist matching this set. No free-text tags.

**Verdict:** Required constraint in Phase 177.

### 2.9 Vote, auth, result, Reference Answer boundaries unchanged — **CONFIRMED**

Phases 171–175 each include compatibility tables confirming **no changes** to:

| Area | Constraint |
|------|------------|
| Official Vote transaction order | Unchanged |
| `vote-by-index` | Eligibility before option resolve; body `{ option_index }` only |
| Vote token schema | Unchanged |
| Counter schema | Unchanged |
| Result visibility | Lifecycle-tier rules unchanged |
| Eligibility | Vote-time evaluator only |
| Reference Answer | Design B; no durable option storage |
| `UserAuthResolver` | Unchanged |
| Profile fields | `birth_year_month`, `residential_region` only |

Phase 176-R introduces no runtime or schema changes to these areas.

**Verdict:** All boundaries preserved. Phase 177 migration must touch **only** feedback aggregate objects.

### 2.10 No analytics, logs, metrics, APM, ranking, creator punishment, dashboards — **CONFIRMED**

Phases 171–175 explicitly exclude:

- analytics tables or tracking on feedback path
- logs, metrics, APM traces, or observability dashboards for feedback storage
- ranking personalization or pre-vote answer-direction signals from feedback
- creator punishment score or auto-penalty from **「題目不優」**

**Verdict:** Out of scope for Phase 177 migration. Aggregate table must not enable these via schema design.

---

## 3. Phase 177 Migration Decision

### 3.1 Decision: **APPROVED** (minimal first migration)

Phases 171–175 are **internally consistent**. No privacy contradiction, Raw Option Linkage Ban violation, or vote-transaction coupling was found that would block a minimal aggregate-only migration.

Phase 177 is **approved** to add **only** the minimal `poll_quality_feedback_aggregate` table described in §4. Phase 177 must remain a **schema-only** phase unless a separate user request explicitly combines runtime work.

### 3.2 Minimal approved future migration shape (directional DDL)

Phase 177 should create **one table only** (names may use project migration conventions):

```sql
-- Directional only; Phase 177 must adapt to project migration style
CREATE TABLE poll_quality_feedback_aggregate (
  poll_id          UUID NOT NULL REFERENCES polls(id),  -- or project poll FK convention
  feedback_tag     TEXT NOT NULL CHECK (feedback_tag IN (
                     '表達清楚', '選項公平', '值得思考', '期待結果', '題目不優'
                   )),
  aggregate_count  BIGINT NOT NULL DEFAULT 0 CHECK (aggregate_count >= 0),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT poll_quality_feedback_aggregate_poll_tag_unique
    UNIQUE (poll_id, feedback_tag)
);
```

**Included in first migration:**

- `poll_id`, `feedback_tag`, `aggregate_count`, `updated_at`
- `UNIQUE (poll_id, feedback_tag)`
- `aggregate_count >= 0` check
- `feedback_tag` allowlist check (or equivalent enum)
- FK to poll identity table only
- Index on `(poll_id)` for poll-scoped reads (optional but reasonable)

**Excluded from first migration (unless separately approved):**

- `threshold_state`, `bucket_state`, `display_threshold_met`, `qualification_bucket`
- Per-user or per-session feedback event tables
- Any column in Phase 175 §5.1 forbidden list
- FK to vote tokens, counter shards, or option tables
- Triggers on vote tables that write feedback rows

**Rollback:** Drop only `poll_quality_feedback_aggregate` (and related indexes/constraints). Vote schema untouched.

---

## 4. Open Questions (Not Phase 177 Blockers)

The following remain **open** from Phases 171–175. They affect **runtime/API/UI** phases after migration, not the minimal schema decision:

| # | Open question | Why not a blocker |
|---|---------------|-------------------|
| 1 | Pre-create five tag rows at poll publish vs insert-on-first-feedback | Either pattern works with `UNIQUE (poll_id, feedback_tag)` |
| 2 | Synchronous aggregate increment vs privacy-safe queue worker | Write path choice; aggregate table shape unchanged |
| 3 | Short-lived non-durable dedup guard (in-memory/Redis) | Explicitly non-durable; no schema required |
| 4 | Feedback after failed or ineligible vote attempts | UX/API policy; table still poll-level only |
| 5 | Creator display minimum threshold N | Read-layer or derived logic; no `threshold_state` in v1 migration |
| 6 | **「題目不優」** dominance vs **「優質題目」** qualification | Application logic from `aggregate_count`; no bucket columns in v1 migration |
| 7 | **「不太想答」** as future optional tag | Not in MVP five-tag set; would require separate product approval |

**Verdict:** No open question blocks Phase 177 **minimal** migration. Runtime phases must resolve write-path and display policies before exposing feedback UI.

---

## 5. Blockers Before Phase 177

| Blocker | Status |
|---------|--------|
| Poll-level-only vs option-level feedback conflict | **None** — phases agree on poll-level only |
| Requirement for per-user feedback event table | **None** — explicitly forbidden |
| Forbidden linkage introduced in planning docs | **None** |
| Vote transaction / counter schema coupling in planning docs | **None** — separation confirmed |
| Unresolved tag allowlist | **None** — five MVP tags fixed |
| Missing uniqueness or non-negative constraints in plan | **None** — Phase 175 documents both |
| `threshold_state` / `bucket_state` required for v1 | **None** — deferred by this review |

**Phase 177 blockers: none identified.**

---

## 6. Non-Goals (This Checkpoint)

Phase 176-R does **not**:

- create migration files, apply DDL, or add schema to the repository.
- implement runtime, backend, API, frontend UI, auth, analytics, logs, or metrics.
- change vote token schema, counter schema, Official Vote transaction order, `vote-by-index` behavior, eligibility, result visibility, Reference Answer, `UserAuthResolver`, or profile fields.
- introduce ranking personalization, creator punishment score, or feedback dashboards.
- commit `design-drafts/`.

Explicit non-goals for this phase:

- **no migration**
- **no schema implementation**
- **no runtime**
- **no API**
- **no UI**
- **no analytics**
- **no ranking/personalization**
- **no creator punishment score**
- **no logs/metrics/APM/dashboards**

---

## 7. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-176r-quality-feedback-schema-plan-review-checkpoint-doc.test.ts` | Doc + README index guard |

No frontend runtime guard is required for this docs-only review checkpoint.

---

## 8. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused test:

- `tests/docs/phase-176r-quality-feedback-schema-plan-review-checkpoint-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 9. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 176-R is documentation only. No migration, schema DDL, runtime, or observability changes. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Quality feedback schema plan review is **complete**; Phase 177 minimal migration is **approved**.
