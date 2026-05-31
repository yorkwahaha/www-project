# WWW Project — Phase 8 Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-8-handoff-v1.md`
**Status:** Delivery record (non-normative)
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-milestone-phase-7-handoff-v1.md`
**Starting remote baseline:** `origin/master` @ `b94993e` — `docs: sync phase 7 admin audit status`

Phase 8 adds a minimal poll-scoped public read surface for existing correction notices. It does not change notice writes, admin workflows, vote behavior, results, feed ranking, privacy rules, or database schema.

---

## 1. Delivered HTTP surface

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/polls/:pollId/public-notices` | Returns allowlisted visible correction notices for a public-readable poll |

Unknown, hidden, and notice-free polls return `{ "notices": [] }`. Invalid poll UUIDs return `400 INVALID_POLL_ID`.

---

## 2. Public-safe response

Each notice is limited to:

- `notice_id`
- `poll_id`
- `notice_type`
- `title`
- `body`
- `created_at`

The read path allowlists `suspended_typo_correction_applied` and never selects or returns admin identity, decision rows, reason fields, Spread Score, correction audit internals, voter data, tokens, counters, or option linkage.

---

## 3. Scope boundaries

- No migration or schema change.
- No global public notice feed.
- No optional global `GET /admin/correction-audit`.
- No change to suspended apply transaction semantics.
- No change to Official Vote, Reference Answer, result display, public feed ranking, or poll visibility rules.

---

*End of Phase 8 handoff v1.*
