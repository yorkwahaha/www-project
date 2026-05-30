# WWW Project — Phase 4 (Result Display)

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

Phase 4 adds privacy-safe display tiers for aggregate Official Vote results. See `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md` for architecture and phases.

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

## Layout

- `src/` — application code
- `tests/` — Vitest suites
- `migrations/` — ordered PostgreSQL migrations

## Phase 4 APIs (stub auth)

All mutating poll routes require header `X-User-Id` (UUID). Optional `X-Display-Name` on create.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/polls` | Create draft or published poll |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking signals) |
| `DELETE` | `/polls/:id` | Creator soft-delete |
| `POST` | `/polls/:id/reference-answer` | Record Reference Answer participation only |
| `POST` | `/polls/:id/vote` | Record Official Vote and increment aggregate shard |
| `GET` | `/polls/:id/results` | Read display-safe aggregate Official Vote results |
| `GET` | `/health` | Health check |

`PUT` / `PATCH` on polls return `405` (creator zero-edit after publish).

## Phase 4 scope

Implemented: `users`, `polls`, `poll_options`, Reference Answer Design B, Official Vote tokens, official aggregate sharded counters, and privacy-safe result display tiers.

Not implemented yet: frontend runtime selection memory and BFCache clearing because this repository has no frontend. Add page-local memory clearing on `pagehide` and BFCache `pageshow` before a frontend is introduced.

Also not implemented: ranking and admin governance.
