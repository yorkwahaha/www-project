# WWW Project — Phase 0–5B

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

This repository implements delivery milestones **Phase 0 through Phase 5B**: Poll Core, Reference Answer Design B, Official Vote, Result Display, frontend privacy closure (5A), and the public freshness-only discovery feed safe slice (5B).

Normative rules: `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md`.
Milestone summary and handoff: `docs/www-project-milestone-phase-0-5b-handoff-v1.md`.

**Spec note:** Agent spec **§32 Phase 5 (Wonder Flow / Ranking) is not fully complete.** Phase 5B delivers only `GET /polls/feed` (freshness-only, no answer-direction signals). Phase 6–9 admin/governance features are not implemented.

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

## Layout

- `src/` — application code
- `tests/` — Vitest suites
- `migrations/` — ordered PostgreSQL migrations

## Current APIs (Phase 0–5B)

All mutating poll routes require header `X-User-Id` (UUID). Optional `X-Display-Name` on create.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/polls` | Create draft or published poll |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking signals) |
| `DELETE` | `/polls/:id` | Creator soft-delete |
| `POST` | `/polls/:id/reference-answer` | Record Reference Answer participation only |
| `POST` | `/polls/:id/vote` | Record Official Vote and increment aggregate shard |
| `GET` | `/polls/:id/results` | Read display-safe aggregate Official Vote results |
| `GET` | `/polls/feed` | Public freshness-only discovery feed (Phase 5B) |
| `GET` | `/results/:id` | Public identity-neutral result page |
| `GET` | `/health` | Health check (`milestone: phase-0-5b`) |
| `GET` | `/frontend/*` | Static frontend assets (Phase 5A) |

`PUT` / `PATCH` on polls return `405` (creator zero-edit after publish).

## Current scope (Phase 0–5B)

**Implemented:**

- `users`, `polls`, `poll_options`
- Reference Answer Design B (participation token only; no durable option storage)
- Official Vote tokens and aggregate sharded counters
- Privacy-safe result display tiers
- Frontend selection state in page-local runtime memory; cleared on submit, `pagehide`, and BFCache `pageshow`
- `GET /polls/feed` — freshness-only public feed (no vote/option/ranking signals)

**Not implemented (see handoff for detail):**

- Full spec §32 Phase 5 Wonder Flow / ranking beyond the 5B feed slice
- Phase 6–9 admin typo correction, Dual-Admin, suspended correction, high-sensitivity guardrails
