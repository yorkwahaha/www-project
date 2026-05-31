# WWW Project — Phase 0–12

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

This repository implements delivery milestones **Phase 0 through Phase 12**: Poll Core, Reference Answer Design B, Official Vote, Result Display, frontend privacy closure (5A), the public freshness-only discovery feed (5B–5C), poll visibility/archive (6A), **admin typo correction governance (6B/6C)**, **admin correction audit read + review-context hardening (7.3B–7.5)**, the poll-scoped **public notice read API (8)**, the safe global **admin correction audit queue (9)**, DB-backed integration coverage synchronization for the Phase 8/9 read surfaces (10), the poll-scoped **public notice display UI (11)**, and the server-side **Admin Auth / RBAC v1 boundary (12)**.

Normative rules: `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md`.

Milestone summaries: `docs/www-project-milestone-phase-0-5b-handoff-v1.md` (through 5B), `docs/www-project-milestone-phase-0-5c-handoff-v1.md` (5C feed pagination), `docs/www-project-milestone-phase-10-handoff-v1.md` (Phase 8/9 PG integration synchronization), `docs/www-project-milestone-phase-11-handoff-v1.md` (public notice display UI), and `docs/www-project-milestone-phase-12-handoff-v1.md` (Admin Auth / RBAC v1).

**Phase 14 (docs):** Admin Auth v1 production deployment handoff — `docs/www-project-phase-14-admin-auth-deployment-v1.md` (configure and verify `ADMIN_AUTH_CREDENTIALS_JSON` before admin UI / JWT / OAuth work).

**Phase 15 (docs):** PostgreSQL integration test setup — `docs/www-project-phase-15-pg-integration-test-setup-v1.md` (use `npm run test:integration:local` for the isolated local Docker `www_test`, or run `npm run test:integration` when `DATABASE_URL` is set explicitly).

**Phase 20 (docs):** Correction / admin governance handoff index (Phase 8–19 baseline, validation commands, privacy boundaries, TODOs) — `docs/www-project-phase-20-correction-admin-governance-handoff-v1.md`.

**Spec note:** Agent spec **§32 Phase 5 (Wonder Flow / Ranking) is not fully complete.** Phases 5B–5C deliver only `GET /polls/feed` (public, non-personalized, freshness-only; no answer-direction signals).

**Admin / governance (Phase 6B–12):** Typo correction workflow, Dual-Admin decisions, apply, suspended correction with public notice **write**, safe **audit read** routes, blind `review-context` (`decision_summary` only; no `peer_decisions` / `final_decisions` / admin IDs / reason fields), poll-scoped public notice **read + display**, the safe global `GET /admin/correction-audit` queue, and a server-side opaque Bearer token + RBAC v1 boundary are **implemented**. Full login/session/JWT/OAuth management, real Spread Score calculation, and semantic typo detection are **not** implemented — see `docs/admin-correction-http.md` and `docs/www-project-milestone-phase-12-handoff-v1.md`.

## Prerequisites

- Node.js 20+
- PostgreSQL (optional for `npm run migrate`; required from Phase 1 onward)

## Commands

```bash
npm install
npm run typecheck
npm run build
npm start
npm test
npm run migrate:check
# Apply migrations when DATABASE_URL is set:
# DATABASE_URL=postgres://... npm run migrate
```

`npm test` stays **DB-free**. Optional PostgreSQL integration tests (local/manual, **PostgreSQL 17+**, isolated database **`www_test` only**). Full setup, safety checks, and single-file runs: **`docs/www-project-phase-15-pg-integration-test-setup-v1.md`**.

```bash
npm run test:integration:local
npm run smoke:admin:local
```

The integration quick command starts the local Docker test service if needed, waits for health, runs migration validation and apply, then runs the integration suite. The admin smoke command uses the same isolated `www_test` database with fake local-only admin credentials and synthetic fixture rows. Both commands intentionally leave the test container running for fast reruns. If `DATABASE_URL` is unset, the lower-level `npm run test:integration` exits immediately with setup instructions (environment not ready — not a unit-test regression). See Phase 15 doc §8 and Phase 14 doc §8.

## Layout

- `src/` — application code
- `tests/` — Vitest suites
- `migrations/` — ordered PostgreSQL migrations
- `docs/` — implementation specs and operator docs (e.g. `docs/admin-correction-http.md`)

## Public APIs (Phase 0–5C)

All mutating poll routes require header `X-User-Id` (UUID). Optional `X-Display-Name` on create.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/polls` | Create draft or published poll |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking signals) |
| `DELETE` | `/polls/:id` | Creator soft-delete |
| `POST` | `/polls/:id/reference-answer` | Record Reference Answer participation only |
| `POST` | `/polls/:id/vote` | Record Official Vote and increment aggregate shard |
| `GET` | `/polls/:id/results` | Read display-safe aggregate Official Vote results |
| `GET` | `/polls/feed` | Public freshness-only discovery feed (5B–5C; see below) |
| `GET` | `/polls/:id/public-notices` | Read visible public correction notices (Phase 8) |
| `GET` | `/results/:id` | Public identity-neutral result page |
| `GET` | `/health` | Health check |
| `GET` | `/frontend/*` | Static frontend assets (Phase 5A) |

`PUT` / `PATCH` on polls return `405` (creator zero-edit after publish).

Polls in `suspended` or `correction_pending` are hidden from public GET/feed/vote/result/reference-answer.

### `GET /polls/feed` (Phase 5B–5C)

**Privacy / ranking contract (unchanged):**

- Public, **non-personalized**, **freshness-only** — no ranking by engagement, option percentages, vote growth, Manipulation Integrity Warning, or user answer direction.
- SQL uses **`polls` only** — no dependency on `poll_options`, `poll_vote_tokens`, `poll_reference_answer_tokens`, or `poll_option_vote_counters`.
- Filter: `status = 'active'` and `published_at IS NOT NULL`.
- Order: `published_at DESC`, `id ASC`.
- Response items do **not** expose precise `published_at`, participation fields, options, or vote/token/counter data.

**Pagination (Phase 5C):**

| Query param | Rules |
|-------------|--------|
| `limit` | Optional; integer **1..50**; default **50** |
| `cursor` | Optional; opaque `v1.<base64url>` keyset cursor |
| *(other)* | `400 UNSUPPORTED_QUERY_PARAMS` |

Response includes `polls` (same safe fields as 5B) and `next_cursor` (`string` or `null`). Cursor payload encodes only **`published_at` + `poll_id`** for keyset continuation (not `user_id`, options, or vote data). Pagination uses **keyset** (`published_at` / `id`), not `OFFSET`.

PostgreSQL partial index: `idx_polls_public_feed_freshness` (`migrations/005_phase5c_public_feed_index.sql`).

## Admin correction APIs (Phase 6B–12)

Require `Authorization: Bearer <opaque-token>`. Production config supplies SHA-256 token digests, admin IDs, role, and permissions through `ADMIN_AUTH_CREDENTIALS_JSON`; legacy `X-Admin-User-Id` is not trusted. See `docs/admin-correction-http.md` and `docs/www-project-phase-14-admin-auth-deployment-v1.md`.

Full route table, DTO allowlist, status machines, public notice behavior, and stubs: **`docs/admin-correction-http.md`**.

| Method | Path | Summary |
|--------|------|---------|
| `POST` | `/admin/correction-requests` | Create correction for active/closed poll |
| `GET` | `/admin/correction-requests/:id/review-context` | Blind review context (`decision_summary` only) |
| `GET` | `/admin/correction-requests/:id/audit-record` | Safe read-only audit snapshot |
| `GET` | `/admin/polls/:pollId/correction-audit` | Paginated safe correction audit list for one poll |
| `GET` | `/admin/correction-audit` | Paginated safe global correction audit queue |
| `POST` | `/admin/correction-requests/:id/decisions` | Submit approve/reject |
| `POST` | `/admin/correction-requests/:id/apply` | Apply approved correction |
| `POST` | `/admin/suspended-correction-requests` | Suspended poll → `correction_pending` |
| `POST` | `/admin/suspended-correction-requests/:id/apply` | Apply + reactivate + write public notice |

Public correction notices are read through `GET /polls/:id/public-notices`; see `docs/admin-correction-http.md`.

## Current scope

**Implemented:**

- `users`, `polls`, `poll_options`
- Reference Answer Design B (participation token only; no durable option storage)
- Official Vote tokens and aggregate sharded counters
- Privacy-safe result display tiers
- Frontend selection state in page-local runtime memory; cleared on submit, `pagehide`, and BFCache `pageshow`
- `GET /polls/feed` — freshness-only public feed with optional cursor pagination (5C)
- Poll visibility / archive (6A)
- Admin typo correction foundation (6B): schema, requests, Dual-Admin decisions, apply, suspended path, admin HTTP routes (6C)
- Admin correction audit read API (7.4): `audit-record`, per-poll `correction-audit`
- Review-context decision leak fix (7.5): anonymous `decision_summary` only on workflow read
- Poll-scoped public notice read API (8): visible fixed-template notices only
- Global admin correction audit queue (9): safe cross-poll list with bounded filters
- Poll-scoped public notice display UI (11): allowlisted public notices only on `/results/:id`
- Admin Auth / RBAC v1 (12): opaque Bearer token registry + server-side permission boundary for `/admin/*`

**Not implemented (see spec and `docs/admin-correction-http.md`):**

- Full spec §32 Phase 5 Wonder Flow / ranking beyond the 5B–5C feed slice
- Feed discovery UI, filters, personalization, `total_count`
- Real Spread Score calculation, 24h pre-apply recompute, semantic typo guard
- Spread Score ranking / priority
- Full admin login/session/JWT/OAuth management and token rotation automation
- Other frontend admin UI
- Future high-sensitivity category guardrails and other deferred spec phases

Run `npm run migrate:check` for the current migration count. Run `npm test` on any branch; use `npm run test:integration:local` for the isolated local Docker `www_test`, or run `npm run test:integration` when `DATABASE_URL` points at an isolated `www_test` (see Phase 15 doc).
