# WWW Project — Phase 11 Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-11-handoff-v1.md`
**Status:** Delivery record (non-normative)
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-milestone-phase-10-handoff-v1.md`
**Starting remote baseline:** `origin/master` @ `aeb9f69` — `test: add phase 10 pg integration coverage`

Phase 11 adds poll-scoped public notice display to the existing public result page. It does not change the backend API contract, database schema, public feed, ranking, results, Official Vote, or Reference Answer behavior.

---

## 1. Delivered frontend behavior

`/results/:pollId` loads `GET /polls/:pollId/public-notices` after the display-safe result content succeeds.

- Empty notice lists remain hidden.
- Failed notice reads remain hidden and do not block result display.
- The frontend renders only `suspended_typo_correction_applied`.
- Visible notice content is limited to a neutral label plus public DTO fields `title`, `body`, and `created_at`.
- No notification center, global notice feed, personalization, or unread state is added.

---

## 2. Privacy boundaries

The UI does not render correction request IDs, admin identity, decision rows, admin reasons, review context, audit internals, Spread Score, vote data, tokens, counters, public user identity, or user-option linkage.

---

## 3. Scope boundaries

- No migration or schema change.
- No backend API change.
- No change to Phase 7.5 review-context hardening.
- No change to public feed, ranking, results, Official Vote, or Reference Answer behavior.
- No durable user-option linkage.

---

## 4. Still not implemented

- Real admin auth/session/JWT/RBAC.
- Real Spread Score calculation.
- Spread Score ranking / priority.
- Other frontend admin UI.

---

*End of Phase 11 handoff v1.*
