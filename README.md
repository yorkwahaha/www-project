# WWW Project — Phase 0

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

Phase 0 provides project foundation only. See `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md` for architecture and phases.

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

## Phase 0 scope

Implemented: AGENTS.md, agent spec, minimal boot, migration runner, logging scrubber + tests.

Not implemented yet: polls, Reference Answer, Official Vote, results, ranking, admin governance.
