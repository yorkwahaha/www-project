# WWW Project — Phase 10 Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-10-handoff-v1.md`
**Status:** Delivery record (non-normative)
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-milestone-phase-8-handoff-v1.md`, `docs/www-project-milestone-phase-9-handoff-v1.md`
**Starting remote baseline:** `origin/master` @ `9f3ebc3` — `feat: add global admin correction audit queue`

Phase 10 synchronizes PostgreSQL integration coverage and safety documentation for the Phase 8 public notice read API and Phase 9 global admin correction audit queue. It does not change production behavior, database schema, ranking, results, Official Vote, or Reference Answer.

---

## 1. Added PostgreSQL integration coverage

`tests/integration/admin-audit-http.pg.test.ts` now verifies:

- `GET /polls/:pollId/public-notices`: unknown, hidden, notice-free, non-allowlisted, and allowlisted notice behavior against PostgreSQL repositories.
- Public notice responses remain limited to `notice_id`, `poll_id`, `notice_type`, `title`, `body`, and `created_at`.
- `GET /admin/correction-audit`: cross-poll default-limit pagination, opaque keyset cursor, fixed `submitted_at DESC, request_id DESC` ordering, safe status and inclusive validity filters, admin guards, read-only behavior, bounded `1..50` limits, and rejection of `sort=spread_score`.
- Global audit queue items remain limited to the documented safe list fields, with optional `correction_log_id` only for applied/completed items.

---

## 2. Validation status

`npm run test:integration` was **not executed** during Phase 10 synchronization because `DATABASE_URL` was missing.

This is an environment gap, not a Phase 10 code failure. Run the suite against an isolated `www_test` database when `DATABASE_URL` is available.

---

## 3. Scope boundaries

- No migration or schema change.
- No production code change.
- No change to Phase 7.5 review-context hardening.
- No change to public feed, ranking, results, Official Vote, or Reference Answer.
- No durable user-option linkage.

---

## 4. Still not implemented

- Real admin auth/session/JWT/RBAC.
- Real Spread Score calculation.
- Spread Score ranking / priority.
- Public notice display UI.
- Other frontend admin UI.

---

*End of Phase 10 handoff v1.*
