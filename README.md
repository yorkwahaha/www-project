# WWW Project — Phase 1 (Poll Core)

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

Phase 1 adds poll creation, read, and creator delete. See `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md` for architecture and phases.

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

- `src/` — application code (Phase 0: health boot + logging scrubber)
- `tests/` — Vitest suites (scrubber + privacy placeholders)
- `migrations/` — SQL migrations (Phase 0: `schema_migrations` bootstrap only)

## Phase 1 APIs (stub auth)

All mutating poll routes require header `X-User-Id` (UUID). Optional `X-Display-Name` on create.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/polls` | Create draft or published poll |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking signals) |
| `DELETE` | `/polls/:id` | Creator soft-delete |
| `GET` | `/health` | Health check |

`PUT` / `PATCH` on polls return `405` (creator zero-edit after publish).

## Phase 1 scope

Implemented: `users`, `polls`, `poll_options`, poll service, HTTP APIs, creator delete, zero-edit enforcement.

Not implemented yet: Reference Answer, Official Vote, counters, results, ranking, admin governance.
