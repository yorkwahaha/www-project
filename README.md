# WWW Project — Phase 0–7.5

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

This repository implements delivery milestones **Phase 0 through Phase 7.5**: Poll Core, Reference Answer Design B, Official Vote, Result Display, frontend privacy closure (5A), the public freshness-only discovery feed (5B–5C), poll visibility/archive (6A), **admin typo correction governance (6B/6C)**, and **admin correction audit read + review-context hardening (7.3B–7.5)**.

Normative rules: `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md`.

Milestone summaries: `docs/www-project-milestone-phase-0-5b-handoff-v1.md` (through 5B), `docs/www-project-milestone-phase-0-5c-handoff-v1.md` (5C feed pagination).

**Spec note:** Agent spec **§32 Phase 5 (Wonder Flow / Ranking) is not fully complete.** Phases 5B–5C deliver only `GET /polls/feed` (public, non-personalized, freshness-only; no answer-direction signals).

**Admin / governance (Phase 6B–7.5 on current `master`):** Typo correction workflow, Dual-Admin decisions, apply, suspended correction with public notice **write**, safe **audit read** routes, and blind `review-context` (`decision_summary` only; no `peer_decisions` / `final_decisions` / admin IDs / reason fields) are **implemented**. Spread Score (real calculation), semantic typo detection, real admin session auth, public notice **read**, and optional global `GET /admin/correction-audit` are **not** implemented — see `docs/admin-correction-http.md` and `docs/www-project-milestone-phase-7-handoff-v1.md`.

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

`npm test` stays **DB-free**. Optional PostgreSQL integration tests (local/manual, **PostgreSQL 17+**, isolated database **`www_test` only**):

```bash
docker compose -f docker-compose.test.yml up -d
# Windows PowerShell:
# $env:DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/www_test"
npm run migrate
npm run test:integration
```

**Validation gap (Phase 7.6):** `npm run test:integration` (including admin audit PG suites) is **pending** until `DATABASE_URL` points at an isolated test database. Non-PG checks (`typecheck`, `build`, `npm test`) pass on `master` @ `dd8c4bb`.

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

## Admin correction APIs (Phase 6B–6C)

Require header **`X-Admin-User-Id`** (not `X-User-Id`). MVP trusts this header against `admin_users`; not production session auth.

Full route table, DTO allowlist, status machines, public notice behavior, and stubs: **`docs/admin-correction-http.md`**.

| Method | Path | Summary |
|--------|------|---------|
| `POST` | `/admin/correction-requests` | Create correction for active/closed poll |
| `GET` | `/admin/correction-requests/:id/review-context` | Blind review context (`decision_summary` only) |
| `GET` | `/admin/correction-requests/:id/audit-record` | Safe read-only audit snapshot |
| `GET` | `/admin/polls/:pollId/correction-audit` | Paginated safe correction audit list for one poll |
| `POST` | `/admin/correction-requests/:id/decisions` | Submit approve/reject |
| `POST` | `/admin/correction-requests/:id/apply` | Apply approved correction |
| `POST` | `/admin/suspended-correction-requests` | Suspended poll → `correction_pending` |
| `POST` | `/admin/suspended-correction-requests/:id/apply` | Apply + reactivate + write public notice |

There is **no** public API to read `public_notices` yet.

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

**Not implemented (see spec and `docs/admin-correction-http.md`):**

- Full spec §32 Phase 5 Wonder Flow / ranking beyond the 5B–5C feed slice
- Feed discovery UI, filters, personalization, `total_count`
- Real Spread Score, 24h pre-apply recompute, semantic typo guard; Spread Score used for ranking
- Production admin session authentication middleware (JWT / OAuth / RBAC)
- Public notice read/display API
- Optional global `GET /admin/correction-audit` queue
- Phase 9 high-sensitivity category guardrails (and other post-7.5 spec phases)

Run `npm run migrate:check` for the current migration count. Run `npm test` on any branch; run `npm run test:integration` only when `DATABASE_URL` is set to an isolated test DB (currently **pending** in environments without it).
