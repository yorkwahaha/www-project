# Admin correction HTTP API (Phase 6B / 6C)

Operator-facing reference for **current** admin typo-correction routes on `master` (baseline `522dac7` and later).

Normative privacy and governance rules: `/AGENTS.md`, `docs/www-project-agent-spec-v0.1.md` (§16–19, §33–35).

This document describes **implemented HTTP behavior**. It does not authorize new product surface beyond what the server already exposes.

---

## Authentication contract (MVP)

All routes below require header:

```http
X-Admin-User-Id: <uuid>
```

| Condition | HTTP | `error` |
|-----------|------|---------|
| Header missing or empty | 401 | `ADMIN_AUTH_REQUIRED` |
| Not a UUID | 400 | `INVALID_ADMIN_USER_ID` |
| UUID not an **active** row in `admin_users` | 403 | `ADMIN_FORBIDDEN` |

### Not production session auth

- There is **no** session cookie, JWT, or OAuth middleware for admin routes today.
- The server **trusts** `X-Admin-User-Id` when it matches `admin_users.user_id` with `status = 'active'`.
- Suitable for **local/dev/integration** and controlled staging only until real admin auth ships.

### `X-User-Id` is not admin identity

- **`X-User-Id` must not** be used as a substitute for `X-Admin-User-Id` on admin routes.
- Admin permission is stored in `admin_users`, separate from `users.trust_level` (official vote eligibility).
- Sending only `X-User-Id` on admin routes returns `401 ADMIN_AUTH_REQUIRED`.

---

## Route table

Admin routes are mounted only when the HTTP server is wired with admin correction services (`createApp()` in `src/app.ts`). Poll-only test servers may return `404` for `/admin/*`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/admin/correction-requests` | Create typo correction request for **active** or **closed** poll |
| `GET` | `/admin/correction-requests/:requestId/review-context` | Blind review context for one admin |
| `POST` | `/admin/correction-requests/:requestId/decisions` | Submit independent approve/reject decision |
| `POST` | `/admin/correction-requests/:requestId/apply` | Apply **approved** request (active/closed path) |
| `POST` | `/admin/suspended-correction-requests` | Create request for **suspended** poll; poll → `correction_pending` |
| `POST` | `/admin/suspended-correction-requests/:requestId/apply` | Apply **approved** suspended request; poll → `active` + public notice |

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
| `peer_decisions` | **`null` while request not finalized** |
| `final_decisions` | **Non-null only** when request is `approved`, `rejected`, `expired`, or `applied`; each item: `admin_id`, `decision`, `reason_code`, `reason_text`, `submitted_at` |

### Must not appear in HTTP responses

| Category | Examples |
|----------|----------|
| Spread Score internals | `spread_score_at_submit`, `spread_score_locked_until` |
| Requester identity | `requester_admin_id` |
| Pending peer leakage | `peer_decisions` entries before request is finalized |
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
| Read / display API | **Not implemented** — no `GET` route for notices; public poll APIs do not embed notice text |
| Active/closed apply | Does **not** insert `public_notices` (`public_notice_id` is null on correction log) |

Any future public notice read API is **high-risk** (governance narrative, caching, feed boundaries) and requires a separate threat model before implementation.

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
- Dual-admin independent decisions and blind `review-context` (`peer_decisions` null until finalized)
- Approved apply with `original_text` stale guard
- Suspended single-transaction apply (content + log + `active` + public notice)
- Poll recovery: `correction_pending` → `suspended` on reject or expired (decision and apply paths)
- Admin HTTP routes with safe response DTOs
- PostgreSQL + in-memory repositories; integration tests under `tests/integration/`

### Stubs / not yet implemented

| Area | Notes |
|------|--------|
| **Spread Score** | Stub: score `0`, `requires_dual_admin` always true; no risk-based dual-admin bypass |
| **24h pre-apply guard** | No recompute of Spread Score at apply when request age > 24h |
| **Semantic typo guard** | Only normalization + non-empty / must-differ checks |
| **Real admin auth** | No session middleware; header trust model only |
| **Admin audit / log visibility** | No HTTP query API for `admin_decision_logs` or `poll_correction_logs` |
| **Public notice read/display** | Write-side only; threat model and API design outstanding |
| **Passive expiry job** | Expiry enforced when an admin hits decision/apply, not by background scheduler |

### Explicit non-goals (do not add via this API family)

- Ranking / Wonder Flow signals or answer-direction features
- Changes to public vote, result, feed, or counter behavior
- User–option durable linkage in logs, metrics, or responses
- Senior review, creator appeal, high-sensitivity category launch

---

## Related tests

- HTTP contracts: `tests/http/admin-correction-routes.test.ts`
- Domain: `tests/admin/correction-*.test.ts`, `tests/admin/suspended-correction-service.test.ts`
- PostgreSQL: `tests/integration/admin-correction-http.pg.test.ts`, `correction-*.pg.test.ts`, `suspended-correction.pg.test.ts`
