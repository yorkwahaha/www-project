# Admin correction HTTP API (Phase 6B–12)

Operator-facing reference for **current** admin typo-correction routes on `master` (baseline `dd8c4bb` and later).

Normative privacy and governance rules: `/AGENTS.md`, `docs/www-project-agent-spec-v0.1.md` (§16–19, §33–35).

This document describes **implemented HTTP behavior**. It does not authorize new product surface beyond what the server already exposes.

---

## Authentication contract (Admin Auth v1)

All routes below require header:

```http
Authorization: Bearer <opaque-token>
```

| Condition | HTTP | `error` |
|-----------|------|---------|
| Header missing or empty | 401 | `ADMIN_AUTH_REQUIRED` |
| Malformed or unknown Bearer token | 401 | `ADMIN_AUTH_INVALID` |
| Authenticated credential lacks required permission | 403 | `ADMIN_FORBIDDEN` |
| Credential admin ID is not an **active** row in `admin_users` | 403 | `ADMIN_FORBIDDEN` |

### Server-side credential registry

Production startup requires `ADMIN_AUTH_CREDENTIALS_JSON`. It is a JSON array.

**Deployment / operator checklist (Phase 14):** safe env setup, digest generation, pre/post-deploy smoke tests, and security reminders — see `docs/www-project-phase-14-admin-auth-deployment-v1.md`.

```json
[
  {
    "token_sha256": "<64 lowercase hex SHA-256 digest>",
    "admin_user_id": "<uuid>",
    "role": "admin",
    "permissions": ["correction:read", "correction:write"]
  }
]
```

- Generate opaque high-entropy tokens outside the app. Store only their SHA-256 digests in the env registry.
- The server resolves token → admin ID and permissions. It does not accept client-provided admin identity.
- Missing, empty, malformed, ambiguous, or duplicate credential config fails closed at startup.
- The registry is static process config in v1. There is no login page, session cookie, JWT, OAuth flow, or rotation UI yet.

### RBAC boundary

| Permission | Routes |
|------------|--------|
| `correction:read` | `GET` review-context, audit-record, per-poll audit, global audit queue |
| `correction:write` | Create correction requests, submit decisions, apply corrections |

The credential registry role must be `admin`. Domain services also require the resolved admin ID to be an active `admin_users` row.

### Public identity headers are not admin identity

- **`X-User-Id` and legacy `X-Admin-User-Id` must not** be used as substitutes for `Authorization`.
- Admin permission is stored in `admin_users`, separate from `users.trust_level` (official vote eligibility).
- Sending only public or legacy identity headers on admin routes returns `401 ADMIN_AUTH_REQUIRED`.

---

## Route table

Admin routes are mounted only when the HTTP server is wired with admin correction services (`createApp()` in `src/app.ts`). Poll-only test servers may return `404` for `/admin/*`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/admin/correction-requests` | Create typo correction request for **active** or **closed** poll |
| `GET` | `/admin/correction-requests/:requestId/review-context` | Blind review context for one admin |
| `GET` | `/admin/correction-requests/:requestId/audit-record` | Read-only safe audit snapshot and neutral timeline |
| `GET` | `/admin/polls/:pollId/correction-audit` | Read-only paginated safe correction audit list for one poll |
| `GET` | `/admin/correction-audit` | Read-only paginated safe global correction audit queue |
| `POST` | `/admin/correction-requests/:requestId/decisions` | Submit independent approve/reject decision |
| `POST` | `/admin/correction-requests/:requestId/apply` | Apply **approved** request (active/closed path) |
| `POST` | `/admin/suspended-correction-requests` | Create request for **suspended** poll; poll → `correction_pending` |
| `POST` | `/admin/suspended-correction-requests/:requestId/apply` | Apply **approved** suspended request; poll → `active` + public notice |
| `GET` | `/polls/:pollId/public-notices` | Public read of visible correction notices for one poll |

Invalid `:requestId` (non-UUID) → `400 INVALID_REQUEST_ID`.

---

## Request bodies (summary)

### Create correction (both `POST …/correction-requests` and `POST …/suspended-correction-requests`)

```json
{
  "poll_id": "<uuid>",
  "correction_target_field": "title | description | option_text",
  "correction_target_id": "<uuid, required only for option_text>",
  "proposed_text": "<string>",
  "reason": "<string>"
}
```

- `correction_target_field` must be one of `title`, `description`, `option_text`.
- For `option_text`, `correction_target_id` is the `poll_options.id` being corrected.
- Typo guard today: non-empty reason, normalized text must differ from current text (see **Stubs** below).

### Submit decision (`POST …/decisions`)

```json
{
  "decision": "approve | reject",
  "reason_code": "<non-empty string>",
  "reason_text": "<optional string>"
}
```

---

## Response DTO allowlist principles

HTTP handlers return **minimal** JSON. Internal DB columns (Spread Score, requester admin, raw decision rows) stay server-side unless listed below.

### Allowed on create (201)

| Field | Notes |
|-------|--------|
| `request_id` | UUID |
| `status` | Always `pending` on create |
| `requires_dual_admin` | Boolean (today always `true` via stub) |
| `valid_until` | ISO 8601 |
| `poll_status` | **Suspended create only:** `correction_pending` |

### Allowed on decision submit (200)

| Field | Notes |
|-------|--------|
| `request_id` | |
| `request_status` | `pending`, `approved`, `rejected`, `expired`, … |
| `decision_id` | UUID of this admin’s `admin_decision_logs` row |

### Allowed on apply — active/closed path (200)

| Field | Notes |
|-------|--------|
| `request_id` | |
| `status` | `applied` |
| `correction_log_id` | |

### Allowed on apply — suspended path (200)

| Field | Notes |
|-------|--------|
| `request_id` | |
| `status` | `applied` |
| `poll_status` | `active` |
| `correction_log_id` | |
| `public_notice_id` | Notice row created in same transaction |

### Allowed on review context (200)

| Field | Notes |
|-------|--------|
| `request_id`, `poll_id` | |
| `request_status`, `poll_status` | |
| `correction_target_field`, `correction_target_id` | |
| `original_text`, `proposed_text` | |
| `requires_dual_admin`, `valid_until` | |
| `viewer_has_submitted` | Whether **this** admin already decided |
| `decision_summary` | While pending: `{ "state": "pending_blind" }`. After finalization: anonymous `approve_count`, `reject_count`, `quorum_met`, `is_finalized` only. |

Review context never returns admin IDs, per-admin decisions, decision reasons, Spread Score values, or public notice content.

### Allowed on audit record (200)

| Field | Notes |
|-------|--------|
| Request snapshot | `request_id`, `poll_id`, `request_status`, `poll_status`, `correction_target_field`, `correction_target_id`, `original_text`, `proposed_text`, `requires_dual_admin`, `submitted_at`, `valid_until`, `updated_at` |
| Applied correction | `correction_log_id`, `applied_text`, `applied_at`, `has_public_notice`; nullable except the boolean |
| `decision_summary` | While pending: `{ "state": "pending_blind" }`. After finalization: anonymous `approve_count`, `reject_count`, `quorum_met`, `is_finalized` only. |
| `timeline` | Neutral lifecycle events and timestamps only: `submitted`, `decision_quorum_met`, `rejected`, `expired`, `applied` |

Audit records never return admin IDs, per-admin decisions, decision reasons, Spread Score values, public notice IDs, or public notice content.

### Allowed on poll correction audit list (200)

`GET /admin/polls/:pollId/correction-audit` accepts `limit` (default `20`, max `50`) and an opaque `cursor`. Unknown polls return `{ "items": [], "next_cursor": null }`.

Each item is limited to `request_id`, `request_status`, `correction_target_field`, `submitted_at`, `valid_until`, `has_public_notice`, and optional `correction_log_id`. Ordering is `submitted_at DESC`, then request ID for stable pagination.

### Allowed on global correction audit queue (200)

`GET /admin/correction-audit` accepts `limit` (default `20`, max `50`), opaque `cursor`, optional `status`, optional `valid_before`, and optional `valid_after`. Timestamp filters are inclusive against `valid_until`.

Each item uses the poll audit list fields plus `poll_id`. Ordering is fixed: `submitted_at DESC`, then request ID for stable pagination. Sort parameters, Spread Score filtering, and score-based priority are not supported.

### Must not appear in HTTP responses

| Category | Examples |
|----------|----------|
| Spread Score internals | `spread_score_at_submit`, `spread_score_locked_until` |
| Requester identity | `requester_admin_id` |
| Peer / per-admin decisions | `peer_decisions`, `final_decisions`, raw decision rows |
| Vote / result / feed linkage | Raw counters, tokens, shard ids, option-level vote aggregates |
| Recovery helpers | Internal poll-restore utilities (not exposed as routes) |

Errors use `{ "error": "<CODE>", "message": "<text>" }` (e.g. `CORRECTION_EXPIRED`, `CORRECTION_STALE_TARGET`, `PROPOSER_CANNOT_APPROVE`).

---

## Status machines

### Correction request

```text
pending → approved | rejected | expired
approved → applied   (via apply, if not expired and target text still matches snapshot)
```

- **Dual-admin (implemented):** two independent `approve` decisions → `approved`; any `reject` → `rejected`; requester cannot `approve` own request.
- **Expired:** past `valid_until` on decision or apply → `expired` (no decision log row on expiry-only decision attempt).

### Poll — active/closed typo path

Poll status stays `active` or `closed` through create → review → apply. Only allowed text fields (`title`, `description`, `option_text`) and `poll_correction_logs` change.

### Poll — suspended typo path

```text
suspended → correction_pending   (create suspended correction request)
correction_pending → active      (successful suspended apply)
correction_pending → suspended   (rejected request, or expired decision/apply on suspended path)
```

While `correction_pending`, the poll is **hidden** from public GET/feed/vote/result/reference-answer (same as `suspended`).

---

## Public notices

| Topic | Current behavior |
|-------|------------------|
| Write | **Suspended apply only** — one `public_notices` row per successful suspended apply (fixed template in `buildSuspendedCorrectionPublicNotice`) |
| Read / display API | `GET /polls/:pollId/public-notices` returns visible allowlisted notices for public-readable polls; unknown, hidden, or notice-free polls return `{ "notices": [] }` |
| Active/closed apply | Does **not** insert `public_notices` (`public_notice_id` is null on correction log) |

Public notice response fields are limited to `notice_id`, `poll_id`, `notice_type`, `title`, `body`, and `created_at`. The endpoint does not expose admin identity, correction workflow rows, decision details, reason fields, Spread Score, public notice write internals, or vote/result/feed data.

---

## Database tables (reference)

Phase 6B migration `007_phase6b_admin_correction_foundation.sql`:

- `admin_users`
- `poll_correction_requests`
- `admin_decision_logs`
- `public_notices`
- `poll_correction_logs`

No durable **user ↔ selected option** linkage is created by these flows. `correction_target_id` refers to poll structure only.

---

## Implemented vs stubs / future work

### Implemented (Phase 6B / 6C)

- Correction request create for active/closed and suspended polls
- Dual-admin independent decisions and blind `review-context` (pending summary masked; finalized summary anonymous)
- Approved apply with `original_text` stale guard
- Suspended single-transaction apply (content + log + `active` + public notice)
- Poll recovery: `correction_pending` → `suspended` on reject or expired (decision and apply paths)
- Admin HTTP routes with safe response DTOs
- Admin-only safe audit snapshot and per-poll paginated audit list
- PostgreSQL + in-memory repositories; integration tests under `tests/integration/`
- Review-context hardened (Phase 7.5): `decision_summary` only — no `peer_decisions`, `final_decisions`, `admin_id`, or reason fields in responses
- Public notice read (Phase 8): `GET /polls/:pollId/public-notices` — allowlisted notice types only; empty list for unknown/hidden/no-notice polls
- Public notice display (Phase 11): `/results/:pollId` loads the poll-scoped public notice endpoint; empty or failed notice reads remain hidden and do not block result display
- Admin Auth / RBAC v1 (Phase 12): opaque Bearer token registry, SHA-256 digests only in config, centralized `/admin/*` authentication, and read/write permission checks

### Stubs / not yet implemented

| Area | Notes |
|------|--------|
| **Spread Score** | Stub: score `0`, `requires_dual_admin` always true; no risk-based dual-admin bypass |
| **24h pre-apply guard** | No recompute of Spread Score at apply when request age > 24h |
| **Semantic typo guard** | Only normalization + non-empty / must-differ checks |
| **Admin auth remainder** | No login page, session lifecycle, JWT/OAuth flow, rotation UI, or automated secret distribution |
| **Cross-poll admin audit queue** | Implemented in Phase 9: bounded global list with safe status / validity filters |
| **Public notice global feed** | No notification center, unread state, personalization, or cross-poll notice listing |
| **Passive expiry job** | Expiry enforced when an admin hits decision/apply, not by background scheduler |

### Explicit non-goals (do not add via this API family)

- Ranking / Wonder Flow signals or answer-direction features
- Changes to public vote, result, feed, or counter behavior
- User–option durable linkage in logs, metrics, or responses
- Senior review, creator appeal, high-sensitivity category launch

---

## Related tests

- HTTP contracts: `tests/http/admin-correction-routes.test.ts`
- Admin Auth v1: `tests/http/admin-auth.test.ts`
- Audit HTTP contracts: `tests/http/admin-audit-routes.test.ts`
- Public notice HTTP contracts: `tests/http/public-notice-routes.test.ts`
- Domain: `tests/admin/correction-*.test.ts`, `tests/admin/suspended-correction-service.test.ts`
- PostgreSQL: `tests/integration/admin-correction-http.pg.test.ts`, `correction-*.pg.test.ts`, `suspended-correction.pg.test.ts`
- Audit PostgreSQL: `tests/integration/admin-audit-http.pg.test.ts`

**Integration validation:** PostgreSQL coverage lives under `tests/integration/*.pg.test.ts` (including `admin-audit-http.pg.test.ts` for Phase 8/9 read surfaces). Requires `DATABASE_URL` pointing at isolated **`www_test`** only. Setup and safety rules: `docs/www-project-phase-15-pg-integration-test-setup-v1.md`. Unit tests (`npm test`) cover HTTP and service contracts without PostgreSQL.
