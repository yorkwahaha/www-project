# WWW Project — Phase 7.3 Admin Audit / Log Visibility Design

**Document path:** `docs/www-project-phase-7-3-admin-audit-log-visibility-design.md`  
**Status:** Design-only (normative for future implementation)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md` (§5.8–5.10, §15–19), Phase 7.3A audit findings  
**Baseline:** `origin/master` @ `8d869e7` (Phase 6B/6C admin correction write path delivered)

This document defines **admin-only, read-only** HTTP surfaces for typo-correction governance visibility. It does **not** authorize code changes in this phase.

---

## 1. Purpose and non-goals

### Purpose

- Give operators a **post-hoc, read-only** view of correction request lifecycle and applied correction logs.
- Support governance review and internal audit without adding vote, result, feed, or ranking behavior.
- Reuse existing durable tables: `poll_correction_requests`, `admin_decision_logs`, `poll_correction_logs`, `public_notices` (metadata only).
- Stay separate from the **workflow** API (`review-context`, decisions, apply) so blind dual-admin review invariants are not weakened.

### Non-goals (this phase and these APIs)

- Implement routes, services, repositories, migrations, or tests (future implementation task only).
- Real session auth, JWT, OAuth, or RBAC (continue `X-Admin-User-Id` stub until a dedicated auth phase).
- Public notice **read** or **display** API; notice **body** in JSON responses.
- Spread Score numeric fields, lock timestamps, recompute diagnostics, or score-based queue ordering.
- Ranking / Wonder Flow / answer-direction signals; changes to vote, result, feed, Reference Answer, or public poll visibility.
- Durable user–option linkage; vote tokens; sharded counters; raw counter exposure.
- Exposing `admin_id`, `requester_admin_id`, peer decisions, or decision reasons in normal admin read responses.
- Senior review, creator appeal, AI pre-review, passive expiry jobs, or Phase 2 collusion analytics export.

---

## 2. Proposed future route boundary

All routes:

- Live under existing `/admin/` prefix (same mount as Phase 6B correction workflow).
- Require `X-Admin-User-Id` + active `admin_users` row (same stub contract as `docs/admin-correction-http.md`).
- Are **GET-only**; no mutations.
- Return display-safe JSON DTOs only (no raw DB rows).

### 2.1 `GET /admin/correction-requests/:requestId/audit-record`

**Purpose:** Single correction request audit snapshot + neutral timeline.

| Item | Rule |
|------|------|
| `:requestId` | UUID; invalid → `400 INVALID_REQUEST_ID` |
| Not found | `404` (no existence leak beyond admin scope) |
| vs `review-context` | Workflow blind review stays on `review-context`; this route is for **audit visibility**, not pre-submit review |

### 2.2 `GET /admin/polls/:pollId/correction-audit`

**Purpose:** Paginated list of correction requests and applied logs for one poll.

| Item | Rule |
|------|------|
| Query | `limit` (bounded, e.g. max 50), `cursor` (opaque, stable sort key) |
| Default sort | `submitted_at` descending only |
| Invalid poll / empty | `200` with empty `items` or `404` per existing admin error style (pick one in implementation; document in HTTP reference) |

### 2.3 Optional later: `GET /admin/correction-audit`

**Purpose:** Cross-poll operator queue (e.g. pending/expired nearing `valid_until`).

| Item | Rule |
|------|------|
| Query filters | `status` (enum), optional `valid_before` / `valid_after` (ISO timestamps) |
| Sort allowlist | `submitted_at`, `valid_until` only — **never** `spread_score_*` |
| Deferral | Implement only after 7.3B.1 and 7.3B.2 are stable; not required for first implementation slice |

### Wiring sketch (future)

- New `CorrectionAuditReadService` + `CorrectionAuditReadRepository` (PG + in-memory test double).
- Handlers in dedicated module (e.g. `src/http/admin-audit-routes.ts`); register in `src/http/server.ts` beside existing admin routes.
- Do **not** extend `CorrectionDecisionService.getReviewContext` with audit fields.

---

## 3. Field allowlist

Fields below may appear in **audit read** JSON when sourced from governance tables. Omitted fields are not returned.

### 3.1 Request core (`poll_correction_requests`)

| Field | Notes |
|-------|--------|
| `request_id` | UUID |
| `poll_id` | UUID |
| `request_status` | `pending` \| `approved` \| `rejected` \| `expired` \| `applied` |
| `poll_status` | Public-status enum at read time (e.g. `active`, `correction_pending`, `suspended`) |
| `correction_target_field` | `title` \| `description` \| `option_text` |
| `correction_target_id` | UUID when `option_text`; poll structure metadata only |
| `original_text` | Snapshot at submit |
| `proposed_text` | From request |
| `requires_dual_admin` | Boolean only (from DB flag; not derived from numeric score) |
| `submitted_at` | ISO 8601 |
| `valid_until` | ISO 8601 |
| `updated_at` | ISO 8601 (optional on list items) |

### 3.2 Applied log (`poll_correction_logs`), when `request_status === 'applied'`

| Field | Notes |
|-------|--------|
| `correction_log_id` | UUID |
| `applied_text` | Text actually applied |
| `applied_at` | ISO 8601 |
| `has_public_notice` | Boolean (`public_notice_id IS NOT NULL`) |

### 3.3 Decision summary (aggregated, not per-admin)

| Field | Notes |
|-------|--------|
| `decision_summary` | Object; see §5 |

### 3.4 Timeline (`timeline[]`)

| Field | Notes |
|-------|--------|
| `event` | Closed enum, e.g. `submitted`, `decision_quorum_met`, `rejected`, `expired`, `applied`, `poll_entered_correction_pending`, `poll_restored_suspended`, `poll_reactivated` |
| `at` | ISO 8601 |

### 3.5 List item (`GET …/correction-audit`)

Subset of §3.1–3.2 per row: `request_id`, `request_status`, `correction_target_field`, `submitted_at`, `valid_until`, `has_public_notice`, optional `correction_log_id` if applied.

---

## 4. Field denylist

Must **never** appear in audit read responses or query parameters:

| Category | Examples |
|----------|----------|
| Admin identity | `admin_id`, `requester_admin_id`, `applied_by_admin_id`, `created_by_admin_id`, display names tied to admins |
| Peer / per-admin decisions | `peer_decisions`, `final_decisions`, arrays of `{ admin_id, decision, reason_* }` |
| Decision reasons | `reason_code`, `reason_text`, `metadata_json` |
| Spread Score | `spread_score_at_submit`, `spread_score_locked_until`, numeric score, component breakdown, `sort=spread_score` |
| Public notice content | `title`, `body`, `notice_type` text, `GET /public-notices/*` |
| Vote / result / feed | tokens, shards, counters, tiers, feed scores, user trust for voting |
| Internal | raw SQL rows, `metadata_json`, recovery helper names, debug payloads |

`correction_target_id` is allowed (poll structure); it must not be joined or logged with end-user identifiers.

---

## 5. Rules for hiding admin identity and peer decisions

1. **No raw admin UUIDs** in audit read JSON, including indirect exposure via `final_decisions`-style arrays.
2. **No per-admin decision rows** in audit responses. Aggregate only via `decision_summary`:
   - `approve_count`, `reject_count` (integers)
   - `quorum_met` (boolean; e.g. two approves for MVP dual-admin)
   - `is_finalized` (boolean; request not `pending`)
3. While `request_status === 'pending'`:
   - Do **not** return counts that reveal **which** admin approved (e.g. do not return `approve_count: 1` if that enables peer inference before second submit). Safe pattern: `decision_summary: { "state": "pending_blind" }` only, or omit `decision_summary` entirely until finalized.
4. After finalize (`approved`, `rejected`, `expired`, `applied`):
   - May return aggregate counts **without** tying counts to identities.
   - Still **no** `reason_code` / `reason_text` (see §4 and user constraint for normal read responses).
5. **Do not** use audit endpoints to bypass blind review on `GET …/review-context`. Operators reviewing a pending request for approval must use workflow routes only.
6. Long-term collusion analysis using `admin_decision_logs.admin_id` remains **offline / Phase 2**; not exposed via these REST DTOs.

**Phase 7.5 note:** `review-context` now follows the same masking rule: pending responses return only `{ "state": "pending_blind" }`, and finalized responses return anonymous aggregate counts without admin IDs or reason fields.

---

## 6. Rules for not exposing Spread Score as ranking/priority

1. Audit responses expose **at most** `requires_dual_admin` (boolean).
2. Never return `spread_score_at_submit`, `spread_score_locked_until`, or derived numeric risk.
3. List/queue endpoints (`correction-audit`, optional global queue) must not accept or implement sort/filter by spread score.
4. Allowed sort keys: `submitted_at`, `valid_until` (asc/desc documented per endpoint).
5. Spread Score remains governance-internal (DB + future admin tooling); spec §16 “do not use Spread Score as pre-vote ranking input” applies unchanged.

---

## 7. Rules for not exposing public notice body / read API

1. No `GET` route for `public_notices` in this API family.
2. Audit DTOs use `has_public_notice: boolean` only (derived from `poll_correction_logs.public_notice_id`).
3. Do not return `public_notice_id` if it enables fetching notice content elsewhere without an approved read API; if an opaque id is needed for support, restrict to internal tools **outside** this REST surface.
4. Do not embed notice `title` / `body` in poll public APIs as part of this work.
5. Suspended apply continues to **write** notices in the existing transaction (Phase 6B.5); this design only limits **read** exposure.

---

## 8. Minimum future tests before implementation

### HTTP (`tests/http/admin-audit-routes.test.ts` or equivalent)

- `401` / `403` / `400` for missing or invalid `X-Admin-User-Id`.
- Response bodies omit all denylist keys (mirror `assertBlindReviewContext` style).
- Pending request: `audit-record` has no peer leakage (no approve/reject counts that identify partial quorum, no reason fields).
- Finalized request: aggregate `decision_summary` only; no `admin_id`, no `reason_*`.
- `GET …/polls/:pollId/correction-audit`: pagination, sort stability, no `spread_score_*`.
- Public routes unchanged: audit calls do not alter `GET /polls/*`, vote, result, feed.

### Service (unit)

- Timeline assembly from request + log + poll status transitions.
- Pending vs finalized masking rules for `decision_summary`.

### PostgreSQL integration

- Full dual-admin + apply (active and suspended paths); audit read matches DB state without selecting denied columns into DTO mapper.
- `has_public_notice === true` without notice text in HTTP body.

### Schema / privacy guard

- No new tables that link users to selected options.
- New repository queries must not `JOIN` vote tokens or reference-answer tables.

### Logging self-check (implementation report)

Confirm no new logs/metrics/APM payloads combine option choice with user/session/device/request identifiers; admin audit routes must not log `reason_text` or `admin_id` with voter headers.

---

## 9. Explicit out-of-scope list

- Any implementation in `src/`, `tests/`, `migrations/`, or `README` in the design-only delivery.
- Ranking, Wonder Flow, heat, trending, homepage placement, answer-direction features.
- Changes to Official Vote, Reference Answer, result tiers, sharded counters, or `public-visibility` behavior.
- Public notice read/display API or caching of notice body for end users.
- Real admin authentication and role-based authorization.
- Exposing `admin_id`, `requester_admin_id`, peer decisions, or decision reasons in audit read responses.
- Spread Score numeric exposure or score-based ordering.
- Durable user–option linkage; append-only vote event logs; `poll_status_snapshot`.
- Senior review, creator appeal, AI semantic pre-review, high-sensitivity category launch.
- Passive expiry background job; real Spread Score computation; 24h pre-apply recompute (still stubbed in Phase 6B).
- Data warehouse export, APM dashboards, ETL on `admin_decision_logs` with REST-facing identity fields.
- Modifying `review-context` contract (unless a separate approved task).

---

## 10. Traceability

| Topic | Reference |
|-------|-----------|
| Raw Option Linkage Ban | AGENTS.md §3 |
| Dual-admin blind review | AGENTS.md §11; spec §17–18 |
| Governance tables | spec §5.8–5.10; migration `007_phase6b_admin_correction_foundation.sql` |
| Current HTTP (write path) | `docs/admin-correction-http.md` |
| Spread Score not for ranking | spec §16 |
| Suspended notice write-only | spec §19; `src/admin/public-notice-content.ts` |

---

*End of Phase 7.3 admin audit / log visibility design (design-only).*
