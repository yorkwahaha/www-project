# WWW Project — Phase 2 (Reference Answer Design B)

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

Phase 2 adds privacy-preserving Reference Answer participation tokens. See `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md` for architecture and phases.

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

## Phase 2 APIs (stub auth)

All mutating poll routes require header `X-User-Id` (UUID). Optional `X-Display-Name` on create.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/polls` | Create draft or published poll |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking signals) |
| `DELETE` | `/polls/:id` | Creator soft-delete |
| `POST` | `/polls/:id/reference-answer` | Record Reference Answer participation only |
| `GET` | `/health` | Health check |

`PUT` / `PATCH` on polls return `405` (creator zero-edit after publish).

## Phase 2 scope

Implemented: `users`, `polls`, `poll_options`, `poll_reference_answer_tokens`, poll service, HTTP APIs, creator delete, zero-edit enforcement, and Reference Answer Design B.

Not implemented yet: frontend runtime selection memory and BFCache clearing because this repository has no frontend. Add page-local memory clearing on `pagehide` and BFCache `pageshow` before a frontend is introduced.

Also not implemented: Official Vote, counters, results, ranking, admin governance.
