# WWW Project — Phase 6B.6 Admin HTTP API Plan (Audit-Only)

**Document path:** `docs/www-project-phase-6b6-admin-http-api-plan.md`  
**Status:** Audit-only planning (no route implementation in this phase)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-phase-6b-admin-correction-design-v1.md`  
**Service baseline:** Phase 6B.2–6B.5 domain services and repositories under `src/admin/` (no `/admin/*` HTTP surface yet)

This document plans the **minimal Admin HTTP API** required to expose the **correction workflow only**. It does not authorize code changes to `src/http/server.ts`, vote/result/feed paths, or public visibility helpers in this phase.

---

## 1. Scope and intent

### 1.1 In scope (HTTP planning only)

| Capability | Maps to existing service |
|------------|-------------------------|
| Create normal (active/closed) correction request | `CorrectionService.createCorrectionRequest` |
| Create suspended correction request | `SuspendedCorrectionService.createSuspendedCorrectionRequest` |
| Blind review context | `CorrectionDecisionService.getReviewContext` |
| Submit admin decision | `CorrectionDecisionService.submitCorrectionDecision` |
| Apply approved active/closed correction | `CorrectionApplyService.applyCorrectionRequest` |
| Apply suspended correction | `SuspendedCorrectionApplyService.applySuspendedCorrectionRequest` |

### 1.2 Out of scope for 6B.6 HTTP surface

See §12 **Explicit non-goals**. In particular: no reports/takedown/archive APIs, no creator edit, no senior review, no Spread Score admin tooling, no exposure of internal poll recovery helpers.

---

## 2. Route list

All routes are **admin-authenticated** (§3). Request/response bodies are JSON (`Content-Type: application/json`). UUID path parameters use the same pattern as public poll routes (`POLL_ID_PATTERN` in `src/http/server.ts`).

| Method | Path | Purpose | Success | Delegates to |
|--------|------|---------|---------|--------------|
| `POST` | `/admin/correction-requests` | Create normal typo correction request (poll `active` or `closed`) | `201` | `CorrectionService` |
| `POST` | `/admin/suspended-correction-requests` | Create suspended-path request; atomically `suspended → correction_pending` | `201` | `SuspendedCorrectionService` |
| `GET` | `/admin/correction-requests/:requestId/review-context` | Blind review context for any correction request | `200` | `CorrectionDecisionService.getReviewContext` |
| `POST` | `/admin/correction-requests/:requestId/decisions` | Submit independent approve/reject decision | `200` | `CorrectionDecisionService.submitCorrectionDecision` |
| `POST` | `/admin/correction-requests/:requestId/apply` | Apply **approved** request on active/closed poll | `200` | `CorrectionApplyService` |
| `POST` | `/admin/suspended-correction-requests/:requestId/apply` | Apply **approved** suspended-path request (`correction_pending → active` + notice) | `200` | `SuspendedCorrectionApplyService` |

**Routing notes (implementation phase, not this doc task):**

- Add `src/http/admin-routes.ts` (or `admin-correction-routes.ts`) with handlers mirroring `src/http/poll-routes.ts` error wrapping.
- Extend `HttpServerOptions` with an `adminCorrection` service bundle; register admin paths in `routeRequest` **above** the generic 404 handler.
- **Do not** add routes for `restorePollToSuspendedIfCorrectionPending` — that remains an internal repository side effect on reject (§8).

**Idempotency:** `POST` apply is **not** idempotent; repeat apply returns `409 CORRECTION_ALREADY_APPLIED`. Decision submit is **not** idempotent; duplicate returns `409 CORRECTION_DECISION_ALREADY_SUBMITTED`.

---

## 3. Auth / admin identity MVP boundary

### 3.1 Separation from official vote identity

| Concept | MVP rule |
|---------|----------|
| `users.trust_level` (`official` / `low`) | Official Vote and Reference Answer only; **does not** grant admin rights. |
| `admin_users` | Source of truth for admin permission (`user_id`, `status = active`). |
| HTTP stub auth | **Distinct header** from poll mutating routes: `X-Admin-User-Id` (UUID). |

Rationale (Phase 6B design §3): avoid conflating “can vote officially” with “can propose or approve typo correction,” and keep admin audit trails explicit.

### 3.2 MVP stub behavior

1. Every `/admin/*` route requires `X-Admin-User-Id` (trimmed UUID string).
2. Missing header → `401` `ADMIN_AUTH_REQUIRED` (parallel to public `AUTH_REQUIRED` for `X-User-Id`).
3. Invalid UUID format → `400` `INVALID_ADMIN_USER_ID`.
4. UUID not in `admin_users` with `status = 'active'` → `403` `ADMIN_FORBIDDEN` (maps `AdminForbiddenError`).
5. **No** session cookies, JWT, or OAuth in 6B.6 MVP.
6. **No** role granularity beyond `admin_users.role = 'admin'` (schema allows only `'admin'`).

### 3.3 Proposer vs reviewer

- `requester_admin_id` on `poll_correction_requests` is set from `X-Admin-User-Id` on create.
- Review context **must not** include `requester_admin_id` (blind to reviewer identity of proposer at HTTP layer; aligns with existing `CorrectionReviewContext`).
- Submit decision enforces `PROPOSER_CANNOT_APPROVE` when proposer attempts `approve` (service layer; HTTP maps to `403`).

### 3.4 Logging boundary

Access logs for `/admin/*` may record: method, path, `requestId`, HTTP status, **admin user id** (from header), correlation id.  
**Must not** log: `proposed_text` diff payloads at debug level with voter headers, `spread_score_*`, peer decision bodies before finalization, or any `option_id` tied to end users.

---

## 4. Request / response DTO contracts

Field names use **snake_case** in JSON to match existing public poll HTTP responses. Internal TypeScript services may keep camelCase mappers in the route layer.

### 4.1 `POST /admin/correction-requests`

**Request body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `poll_id` | UUID | yes | |
| `correction_target_field` | `"title"` \| `"description"` \| `"option_text"` | yes | |
| `correction_target_id` | UUID | if `option_text` | Must reference `poll_options.id` for poll |
| `proposed_text` | string | yes | Typo-only guard in service |
| `reason` | string | yes | Non-empty; admin governance text, not voter data |

**Response `201`**

| Field | Type | Notes |
|-------|------|-------|
| `request_id` | UUID | |
| `status` | `"pending"` | |
| `requires_dual_admin` | boolean | Coarse governance flag only |
| `valid_until` | ISO-8601 string | |

**Omit from HTTP response (privacy / internal):** `spread_score_at_submit`, `spread_score_locked_until`, raw Spread Score inputs.

### 4.2 `POST /admin/suspended-correction-requests`

Same request body as §4.1.

**Response `201`:** same shape as §4.1.

**Side effect (not in response):** poll becomes `correction_pending`; public routes remain 404 per Phase 6A (unchanged).

### 4.3 `GET /admin/correction-requests/:requestId/review-context`

No body.

**Response `200`:** see §6 **Blind review response contract**.

### 4.4 `POST /admin/correction-requests/:requestId/decisions`

**Request body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `decision` | `"approve"` \| `"reject"` | yes | |
| `reason_code` | string | yes | Opaque admin code; not voter-linked |
| `reason_text` | string | no | Defaults to `""` |

**Response `200`**

| Field | Type |
|-------|------|
| `request_id` | UUID |
| `request_status` | `"pending"` \| `"approved"` \| `"rejected"` \| `"expired"` |
| `decision_id` | UUID |

### 4.5 `POST /admin/correction-requests/:requestId/apply`

No body (admin identity from header only).

**Response `200`**

| Field | Type | Notes |
|-------|------|-------|
| `request_id` | UUID | |
| `request_status` | `"applied"` | |
| `correction_log_id` | UUID | |
| `poll_id` | UUID | |
| `correction_target_field` | string | |
| `public_notice_id` | `null` | Active path does not create notice |

### 4.6 `POST /admin/suspended-correction-requests/:requestId/apply`

No body.

**Response `200`:** §4.5 fields, with `public_notice_id` as UUID (admin-visible reference only in 6B.6; see §7).

---

## 5. HTTP error mapping

Standard error envelope (match public routes):

```json
{ "error": "<CODE>", "message": "<human-readable>" }
```

| HTTP | `error` code | Source | When |
|------|--------------|--------|------|
| 400 | `INVALID_JSON` | Route | Malformed JSON body |
| 400 | `INVALID_REQUEST_ID` | Route | Bad `:requestId` UUID |
| 400 | `INVALID_POLL_ID` | Route | Bad `poll_id` in body |
| 400 | `INVALID_ADMIN_USER_ID` | Route | Bad `X-Admin-User-Id` |
| 400 | `CORRECTION_VALIDATION` | `CorrectionValidationError` | Typo guard / target validation |
| 400 | `POLL_NOT_ELIGIBLE` | `CorrectionPollNotEligibleError` | Normal create on non-active/closed |
| 400 | `POLL_NOT_SUSPENDED` | `CorrectionPollNotSuspendedError` | Suspended create when not `suspended` |
| 400 | `POLL_NOT_CORRECTION_PENDING` | `CorrectionPollNotCorrectionPendingError` | Suspended apply when poll not `correction_pending` |
| 400 | `CORRECTION_REQUEST_NOT_PENDING` | `CorrectionRequestNotPendingError` | Decision on non-pending request |
| 400 | `CORRECTION_REQUEST_NOT_APPROVED` | `CorrectionRequestNotApprovedError` | Apply when not `approved` |
| 400 | `CORRECTION_EXPIRED` | `CorrectionExpiredError` | Past `valid_until` (may commit `expired` status) |
| 401 | `ADMIN_AUTH_REQUIRED` | Route | Missing `X-Admin-User-Id` |
| 403 | `ADMIN_FORBIDDEN` | `AdminForbiddenError` | Not active admin |
| 403 | `PROPOSER_CANNOT_APPROVE` | `ProposerCannotApproveError` | Proposer `approve` |
| 404 | `POLL_NOT_FOUND` | `CorrectionPollNotFoundError` | Unknown poll |
| 404 | `CORRECTION_REQUEST_NOT_FOUND` | `CorrectionRequestNotFoundError` | Unknown request |
| 409 | `CORRECTION_CONFLICT` | `CorrectionConflictError` | Duplicate pending target |
| 409 | `CORRECTION_ALREADY_APPLIED` | `CorrectionAlreadyAppliedError` | Repeat apply |
| 409 | `CORRECTION_STALE_TARGET` | `CorrectionStaleTargetError` | Live text ≠ snapshot at apply |
| 409 | `CORRECTION_DECISION_ALREADY_SUBMITTED` | `CorrectionDecisionAlreadySubmittedError` | Duplicate decision |
| 405 | `METHOD_NOT_ALLOWED` | Server | Wrong HTTP method on `/admin/*` |
| 500 | `INTERNAL_ERROR` | Server | Unhandled exception (no stack in body) |

**404 vs 403:** Use existing admin service semantics: unknown poll on create → `POLL_NOT_FOUND` (404); inactive admin → `ADMIN_FORBIDDEN` (403). Do not return 404 for forbidden admin to avoid existence leaks on arbitrary IDs where applicable.

**Unhandled errors:** Same as `createHttpServer` catch-all — generic `INTERNAL_ERROR` only.

---

## 6. Blind review response contract

HTTP response mirrors `CorrectionReviewContext` (`src/admin/types.ts`) with these normative rules:

### 6.1 Always included

| Field | Type | Purpose |
|-------|------|---------|
| `request_id` | UUID | |
| `poll_id` | UUID | |
| `request_status` | string | `pending` \| `approved` \| `rejected` \| `expired` \| `applied` |
| `poll_status` | string | Public-status enum only (e.g. `active`, `correction_pending`) |
| `correction_target_field` | string | |
| `correction_target_id` | UUID \| null | Poll structure metadata; not user choice |
| `original_text` | string | Snapshot at submit |
| `proposed_text` | string | |
| `requires_dual_admin` | boolean | Coarse flag; **not** numeric Spread Score |
| `valid_until` | ISO-8601 | |
| `viewer_has_submitted` | boolean | Whether `X-Admin-User-Id` already decided |

### 6.2 Blind fields (spec §18 / AGENTS.md §11)

| Field | Rule |
|-------|------|
| `peer_decisions` | **Always `null`** until request reaches a **final** status (`approved`, `rejected`, `expired`, `applied`). Never expose another admin’s in-flight decision while `pending`. |
| `final_decisions` | **`null`** while `pending`. When final, array of `{ admin_id, decision, reason_code, reason_text, submitted_at }` for audit UI **after** workflow completion. |

### 6.3 Must never appear in review-context JSON

- `spread_score_at_submit`, `spread_score_locked_until`, Spread Score component breakdown
- Other admin’s decision/reason/classification while request is `pending`
- Voter identities, vote tokens, reference-answer tokens, shard ids
- Raw counter rows or result tier internals
- `requester_admin_id` (prevents proposer bias before decision)
- Request `reason` proposer note is **optional product choice**: current service stores but does not return it in `CorrectionReviewContext`; HTTP **should not add** proposer `reason` to blind context unless explicitly approved later

### 6.4 Optional future enrichment (not 6B.6)

Spec §18 allows “poll content” and “risk flags.” MVP HTTP may add **display-safe** poll title/description/options labels in a later revision **only if** they do not include vote-linked data. Current service returns `poll_status` only; 6B.6 HTTP stays aligned with service — no extra poll payload.

---

## 7. Public notice read API decision

**Decision for Phase 6B.6:** **No new public HTTP read route** for `public_notices`.

| Topic | Decision |
|-------|----------|
| Rationale | Phase 6A public visibility rules are frozen for this phase. Adding `GET /polls/:id` fields or new public endpoints changes the public contract and needs a dedicated visibility review. |
| Storage | Suspended apply continues to write `public_notices` + link `poll_correction_logs.public_notice_id` (6B.5 behavior). |
| Admin visibility | Suspended apply HTTP response includes `public_notice_id` for operational confirmation only. |
| End-user visibility | Deferred to **post-6B.6** milestone (e.g. `GET /polls/:id/governance-notice` or embedded `governance_notice` on poll detail) with copy limited to spec §19 safe fields. |
| Forbidden in future public notice API | Voter info, admin PII, Spread Score, peer admin deliberation, internal suspension codes |

Until a public read API exists, users see corrected poll text via normal `GET /polls/:id` after `active` restoration; notice text is not yet surfaced on the wire.

---

## 8. Privacy and integrity boundaries

### 8.1 Raw Option Linkage Ban (unchanged)

Admin HTTP must not introduce durable or log-only linkage of users/sessions/devices to `option_id` or selected options. `correction_target_id` when correcting `option_text` remains poll-structure metadata only (AGENTS.md §3; spec §5.8).

### 8.2 Vote / result / feed / ranking invariants

Admin routes **must not**:

- Call vote, reference-answer, counter, token, or feed services
- Mutate `poll_vote_tokens`, `poll_option_vote_counters`, or result aggregation
- Change `src/polls/public-visibility.ts` behavior
- Add pre-vote ranking signals

Apply paths only update allowed text columns via existing apply repositories.

### 8.3 Internal recovery helper (forbidden exposure)

`suspended-correction-poll-recovery` (`restorePollToSuspendedIfCorrectionPending*`) runs **inside** decision reject transactions. It is **not** callable via HTTP, CLI, or admin debug endpoints in MVP.

### 8.4 Spread Score secrecy

Spread Score is used for governance risk only. HTTP create/review responses expose at most `requires_dual_admin`. Numeric score, lock timestamps, and recompute diagnostics are **admin-internal** (DB + future admin tooling), not REST fields.

### 8.5 Governance logs

`admin_decision_logs.metadata_json` remains `{}` at write time. HTTP must not accept client-supplied metadata that could smuggle option or voter identifiers.

---

## 9. Implementation wiring sketch (future phase; not executed in 6B.6 audit)

```text
createHttpServer({
  pollService,
  adminCorrection: {
    correctionService,
    suspendedCorrectionService,
    decisionService,
    applyService,
    suspendedApplyService,
  },
})
```

Suggested module boundaries:

- `src/http/admin-routes.ts` — route table + `requireAdminUserId`
- `src/http/admin-error.ts` — `handleAdminRouteError(err)` mapping `AdminError` subclasses
- `tests/http/admin-correction-routes.test.ts` — in-memory or PG-backed HTTP contract tests

**Explicit:** editing `src/http/server.ts` is allowed only in the **implementation** task that follows this plan, not in the audit-only 6B.6 doc task.

---

## 10. Test matrix

Tests should mirror existing service/integration coverage at the HTTP boundary. Prefer reusing PG integration helpers (`tests/helpers/pg-integration.ts`) for one happy path per route.

| ID | Route | Scenario | Expected |
|----|-------|----------|----------|
| H1 | POST normal create | active poll, valid typo | `201`, `status=pending`, poll stays `active` |
| H2 | POST normal create | closed poll | `201` |
| H3 | POST normal create | suspended poll | `400 POLL_NOT_ELIGIBLE` |
| H4 | POST normal create | duplicate pending same target | `409 CORRECTION_CONFLICT` |
| H5 | POST normal create | non-admin header | `403 ADMIN_FORBIDDEN` |
| H6 | POST normal create | missing header | `401 ADMIN_AUTH_REQUIRED` |
| H7 | POST suspended create | suspended poll | `201`, poll `correction_pending`, public `GET /polls/:id` still 404 |
| H8 | POST suspended create | active poll | `400 POLL_NOT_SUSPENDED` |
| H9 | GET review-context | pending, viewer not decided | `200`, `peer_decisions=null`, `final_decisions=null` |
| H10 | GET review-context | pending, other admin approved | `200`, still no peer leak |
| H11 | GET review-context | approved final | `200`, `final_decisions` length 2 |
| H12 | POST decision | first approve | `200`, `request_status=pending` |
| H13 | POST decision | two approves | `200`, `request_status=approved` |
| H14 | POST decision | reject | `200`, `request_status=rejected` |
| H15 | POST decision | proposer approve | `403 PROPOSER_CANNOT_APPROVE` |
| H16 | POST decision | duplicate | `409 CORRECTION_DECISION_ALREADY_SUBMITTED` |
| H17 | POST decision | expired | `400 CORRECTION_EXPIRED`, status `expired` |
| H18 | POST apply normal | approved active | `200`, text updated, no `public_notice_id` |
| H19 | POST apply normal | not approved | `400 CORRECTION_REQUEST_NOT_APPROVED` |
| H20 | POST apply normal | stale live text | `409 CORRECTION_STALE_TARGET` |
| H21 | POST apply suspended | approved + correction_pending | `200`, `active`, notice row exists |
| H22 | POST apply suspended | wrong poll status | `400 POLL_NOT_CORRECTION_PENDING` |
| H23 | Regression | POST vote on active poll | Unchanged behavior vs pre-admin routes |
| H24 | Regression | GET feed / results | No new fields; hidden states still 404 |
| H25 | Privacy | Error bodies / logs | No `option_id` + user pairing in responses or test log hooks |

**Service tests already cover** most business rules (`tests/admin/*`, `tests/integration/correction*.pg.test.ts`). HTTP tests should focus on auth header, JSON mapping, status codes, and blind-review JSON shape.

---

## 11. Traceability

| Requirement | Plan section |
|-------------|--------------|
| Spec §15–19 Admin correction / Dual-Admin / Suspended × Correction | §2, §6, §8 |
| Spec §18 Review context API | §2, §6 |
| Phase 6B design v1 two paths | §2, §7 |
| AGENTS.md §3 Raw Option Linkage Ban | §8.1 |
| AGENTS.md §11 Dual-Admin blind review | §6 |
| AGENTS.md §12 Suspended × Correction transaction | §2 apply suspended route |
| Phase 6A public-hidden `correction_pending` | §7, H7, H24 |

---

## 12. Explicit non-goals

- Implementing routes or modifying `src/http/server.ts` in the **audit-only** task (this document only).
- Exposing `restorePollToSuspendedIfCorrectionPending` or any “recovery” HTTP/CLI helper.
- Public `GET` (or feed) API for `public_notices` in 6B.6.
- Reports, takedown, suspend/unsuspend (except via existing non-HTTP admin flows), archive APIs.
- Creator post-publish edit (`PUT`/`PATCH` `/polls/*` remains 405).
- Senior review, auto-tiebreak, sequential dual-admin, shared draft decisions.
- Spread Score admin UI, numeric score in JSON, or recompute triggers via HTTP.
- Changing vote token TTL, shard count, counter logic, result tiers, or feed ranking.
- Redis async counter, vote event logs, poll status snapshots.
- Reference Answer cross-session storage or Lv1 option counters.
- AI semantic pre-review, high-sensitivity category launch.
- Production OAuth/JWT (stub header only for MVP).
- Commit/push as part of the audit-only deliverable.

---

## 13. Phase 6B.6 audit checklist

Before marking HTTP implementation ready (future task):

- [ ] All six routes registered with `X-Admin-User-Id` gate
- [ ] Error mapping table §5 implemented in `handleAdminRouteError`
- [ ] Review context matches §6 blind rules
- [ ] No Spread Score numbers in HTTP payloads
- [ ] No public notice read route unless §7 superseded by explicit user approval
- [ ] Test matrix §10 green for HTTP + regression H23–H25
- [ ] Privacy self-check: no new logs/metrics/traces linking voters to `option_id`

---

*End of Phase 6B.6 Admin HTTP API plan (audit-only).*
