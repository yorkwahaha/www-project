# WWW Project Phase 180-R — Quality Feedback Aggregate Write API Runtime Review Checkpoint v1

**Status:** review checkpoint only. Audits Phase 180 aggregate write API runtime, repository, HTTP tests, integration tests, source guards, and documentation; records a **go/no-go decision** for Phase 181 post-vote quality feedback frontend UX. **Not implemented.** No migration, SQL DDL, runtime behavior, frontend UI, backend handler changes, API contract changes, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, eligibility evaluator, analytics, logging, metrics, APM, trace, debug payload, error payload, dashboard, or creator punishment score runtime is changed by this phase.

**Baseline:** `origin/master` after Phase 180 quality feedback aggregate write API runtime foundation (`5418b85`).

**Artifacts reviewed:**

- [Phase 179 Quality feedback aggregate write API runtime plan](./www-project-phase-179-quality-feedback-aggregate-write-api-runtime-plan-v1.md)
- [Phase 180 Quality feedback aggregate write API runtime foundation](./www-project-phase-180-quality-feedback-aggregate-write-api-runtime-foundation-v1.md)
- `src/http/quality-feedback-routes.ts`
- `src/http/poll-routes.ts`
- `src/http/server.ts`
- `src/polls/service.ts`
- `src/polls/repository.ts`
- `src/polls/in-memory-repository.ts`
- `src/polls/types.ts`
- `tests/http/quality-feedback-routes.test.ts`
- `tests/polls/quality-feedback-runtime.test.ts`
- `tests/integration/quality-feedback.pg.test.ts`
- `tests/polls/quality-feedback-runtime-source-guard.test.ts`
- `tests/docs/phase-180-quality-feedback-aggregate-write-api-runtime-foundation-doc.test.ts`

---

## 1. Review Purpose

Phase 180-R is a **write API runtime review checkpoint** only. It confirms that Phase 180 implemented the approved aggregate write path without forbidden linkage, without vote-transaction coupling, and without expanding API or DB scope beyond Phase 179 plan.

This checkpoint answers:

1. Is the API request/response shape exactly poll-level tag only?
2. Are only five MVP `feedback_tag` values accepted?
3. Does runtime write only `poll_quality_feedback_aggregate` with correct upsert semantics?
4. Are privacy and linkage boundaries preserved?
5. Are vote, auth, result, Reference Answer, and profile boundaries unchanged?
6. Are there blockers before Phase 181 post-vote frontend UX?

---

## 2. Review Findings (Phase 180)

### 2.1 API shape — **CONFIRMED**

**Route:** `POST /polls/:pollId/quality-feedback`

**Request body (exactly one field):**

```json
{ "feedback_tag": "表達清楚" }
```

| Check | Evidence | Result |
|-------|----------|--------|
| Single key `feedback_tag` only | `quality-feedback-routes.ts` rejects `Object.keys(body).length !== 1` or key !== `feedback_tag` | Pass |
| Extra fields rejected | HTTP test sends forbidden linkage fields with `feedback_tag`; all return 400 | Pass |
| Success response exactly `{ "ok": true }` | `service.submitQualityFeedback` returns `{ ok: true }`; HTTP tests assert `toEqual({ ok: true })` | Pass |
| No aggregate/threshold/bucket/result/option echo | HTTP test `expectSuccessBodySafe` serializes body and rejects forbidden substrings | Pass |

**Verdict:** Request and success response shapes match Phase 179 plan.

### 2.2 `feedback_tag` allowlist — **CONFIRMED**

`QUALITY_FEEDBACK_TAGS` in `src/polls/types.ts` and route-level `FEEDBACK_TAG_SET`:

| Tag | Allowed |
|-----|---------|
| **表達清楚** | Yes |
| **選項公平** | Yes |
| **值得思考** | Yes |
| **期待結果** | Yes |
| **題目不優** | Yes |

Invalid tags (e.g. `不太想答`), empty string, non-string, null, and missing tag return 400 `POLL_VALIDATION`.

**Verdict:** Five MVP tags only at runtime validation layer; DB CHECK from Phase 177 remains aligned.

### 2.3 DB write semantics — **CONFIRMED**

Phase 180 adds **no migration or schema change**. Write path uses existing `poll_quality_feedback_aggregate` only.

PostgreSQL (`repository.ts`):

```sql
INSERT INTO poll_quality_feedback_aggregate (poll_id, feedback_tag, aggregate_count, updated_at)
VALUES ($1, $2, 1, NOW())
ON CONFLICT (poll_id, feedback_tag)
DO UPDATE SET
  aggregate_count = poll_quality_feedback_aggregate.aggregate_count + 1,
  updated_at = NOW()
```

| Semantics | Confirmed |
|-----------|-----------|
| Key only `(poll_id, feedback_tag)` | Yes |
| First write `aggregate_count = 1` | Yes — HTTP, service, PG integration tests |
| Conflict `aggregate_count + 1` | Yes |
| `updated_at = NOW()` on write | Yes |
| No new migration | Yes — Phase 180 commit has no `migrations/` changes |

In-memory repository mirrors increment-only behavior for tests.

**Verdict:** Aggregate upsert matches approved minimal write path.

### 2.4 Privacy and linkage — **CONFIRMED**

Phase 180 does **not** add or use:

| Forbidden item | Status |
|----------------|--------|
| Per-user feedback event table | Absent |
| `user_id` / `session_id` / `creator_session` | Not read or written on feedback path |
| `vote_token` | Not read or written |
| `option_id` / `option_index` / selected option | Not accepted in body; not read |
| `request_id` / device / IP / UA | Not persisted |
| trace / metric / error / analytics id | Not used |
| Counter shard FK or reads | HTTP + PG tests assert vote counters untouched |
| `threshold_state` / `bucket_state` | Absent |
| Logs / metrics / APM / analytics | No new observability on feedback path |
| Dashboard / ranking / personalization / creator punishment | Absent |

The route is **unauthenticated** and does not call `UserAuthResolver`. Ignored `X-User-Id` / `Cookie` headers do not affect writes (documented behavior; no identity linkage).

**Verdict:** Raw Option Linkage Ban preserved on feedback write path.

### 2.5 Preserved vote, auth, result, Reference Answer boundaries — **CONFIRMED**

Phase 180 commit (`5418b85`) did not modify:

| Area | Status |
|------|--------|
| Raw Option Linkage Ban | Preserved |
| Official Vote transaction order | Unchanged — `official-vote-routes.ts` has no feedback wiring |
| `vote-by-index` eligibility-before-option-resolve | Unchanged |
| `vote-by-index` body `{ option_index }` | Unchanged |
| Vote token schema (`user_id + poll_id`) | Unchanged |
| Counter schema (`poll_id + option_id + shard_id`) | Unchanged |
| Result visibility | Unchanged |
| Eligibility | Unchanged — feedback checks poll existence only |
| Auth / `UserAuthResolver` | Unchanged — feedback route bypasses auth |
| Reference Answer | Unchanged — source guard confirms no feedback in reference-answer routes |
| Profile fields | Unchanged |
| `/users/me` | Unchanged |
| `/users/me/profile` | Unchanged |
| `creator_session` production identity boundary | Unchanged |

Protected runtime files (`official-vote-routes.ts`, `reference-answer-routes.ts`, `user-profile-routes.ts`, `user-auth-resolver.ts`) contain no `quality-feedback` / `submitQualityFeedback` references per source guard.

**Verdict:** All fixed boundaries intact.

### 2.6 Test and guard coverage — **CONFIRMED**

| Artifact | Role |
|----------|------|
| `tests/http/quality-feedback-routes.test.ts` | HTTP contract, tag validation, extra-field rejection, no auth, no vote/counter touch |
| `tests/polls/quality-feedback-runtime.test.ts` | Service-level increment semantics |
| `tests/integration/quality-feedback.pg.test.ts` | PostgreSQL upsert + vote table isolation |
| `tests/polls/quality-feedback-runtime-source-guard.test.ts` | Static forbidden-field and protected-file isolation |

**Verdict:** Phase 180 runtime is covered by focused HTTP, service, integration, and source guards.

---

## 3. Phase 181 Decision

### 3.1 Decision: **APPROVED** (post-vote quality feedback frontend UX)

Phase 180 implements the Phase 179-approved minimal write API. No privacy contradiction, vote-transaction coupling, or forbidden linkage was found in committed runtime artifacts.

**Phase 181 is approved** to add post-vote quality feedback **frontend UX** that:

- calls `POST /polls/:pollId/quality-feedback` with `{ "feedback_tag": "<tag>" }` only;
- appears only at allowed post-vote UX points (Phase 171 / 174);
- keeps selected option in frontend runtime memory only (Design B; no durable storage);
- uses neutral success/loading/error copy without backend payload echo;
- does not wire feedback into Official Vote transaction or vote success handler internals.

Phase 181 must **not** add per-user feedback event storage, option-linked payloads, or creator-facing real-time feedback surfaces without separate approval.

### 3.2 Known open choices (not Phase 181 blockers)

| Open choice | Notes |
|-------------|-------|
| No durable duplicate prevention | Phase 180 intentional; abuse handling deferred |
| API does not require login | Frontend may still gate prompt to post-vote context only |
| API checks poll existence only | Post-vote timing is frontend/UX policy |
| Policy preview mock in `policy-ui-placeholders.js` | Separate from Phase 180 runtime; Phase 181 should not conflate mock with live API without explicit wiring |

---

## 4. Blockers Before Phase 181

| Blocker | Status |
|---------|--------|
| API body not exactly `{ "feedback_tag" }` only | **None** |
| Success response not exactly `{ "ok": true }` | **None** |
| Forbidden linkage fields accepted | **None** |
| Vote token / counter shard touched on feedback write | **None** |
| New migration or schema in Phase 180 | **None** |
| Feedback wired into Official Vote transaction | **None** |
| Protected vote/auth/profile files modified | **None** |

**Phase 181 blockers: none identified.**

---

## 5. Non-Goals (This Checkpoint)

Phase 180-R does **not**:

- modify `src/` runtime, HTTP handlers, repository, service, or frontend.
- add migration, schema DDL, or API contract changes.
- change vote token schema, counter schema, Official Vote transaction order, `vote-by-index` behavior, eligibility, result visibility, Reference Answer, `UserAuthResolver`, or profile fields.
- commit `design-drafts/`.

Explicit non-goals:

- **no migration**
- **no schema change**
- **no runtime change**
- **no API change**
- **no frontend change**
- **no analytics**
- **no ranking/personalization**
- **no creator punishment score**
- **no logs/metrics/APM/dashboards**

---

## 6. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-180r-quality-feedback-write-api-runtime-review-checkpoint-doc.test.ts` | Doc + README index guard |
| `tests/polls/phase-180r-quality-feedback-write-api-runtime-review-checkpoint.test.ts` | Static API/runtime review guard |

Retained Phase 180 guards:

- `tests/http/quality-feedback-routes.test.ts`
- `tests/polls/quality-feedback-runtime.test.ts`
- `tests/integration/quality-feedback.pg.test.ts`
- `tests/polls/quality-feedback-runtime-source-guard.test.ts`
- `tests/docs/phase-180-quality-feedback-aggregate-write-api-runtime-foundation-doc.test.ts`

---

## 7. Validation

```bash
npm test
npm run typecheck
npm run migrate:check
```

Focused tests:

- `tests/docs/phase-180r-quality-feedback-write-api-runtime-review-checkpoint-doc.test.ts`
- `tests/polls/phase-180r-quality-feedback-write-api-runtime-review-checkpoint.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 8. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 180-R is documentation and static guards only. No migration, schema DDL, runtime, API, or frontend changes. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Quality feedback write API runtime review is **complete**; Phase 181 post-vote quality feedback frontend UX is **approved**.
