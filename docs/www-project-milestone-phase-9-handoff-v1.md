# WWW Project — Phase 9 Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-9-handoff-v1.md`
**Status:** Delivery record (non-normative)
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-phase-7-3-admin-audit-log-visibility-design.md`
**Starting remote baseline:** `origin/master` @ `975bcc3` — `feat: add public notice read API`

Phase 9 adds the previously optional global admin correction audit queue. It is admin-only, read-only, and uses the same safe list visibility model as the Phase 7.4 poll-scoped audit endpoint.

---

## 1. Delivered HTTP surface

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/admin/correction-audit` | Returns a paginated safe cross-poll correction audit list |

---

## 2. Query contract

| Parameter | Rule |
|-----------|------|
| `limit` | Optional integer `1..50`; default `20` |
| `cursor` | Optional opaque keyset cursor |
| `status` | Optional correction request status |
| `valid_before` | Optional inclusive ISO timestamp filter against `valid_until` |
| `valid_after` | Optional inclusive ISO timestamp filter against `valid_until` |

Ordering is fixed: `submitted_at DESC`, then request ID. Score-based sorting, filtering, and priority are not implemented.

---

## 3. Safe list DTO

Each item is limited to:

- `request_id`
- `poll_id`
- `request_status`
- `correction_target_field`
- `submitted_at`
- `valid_until`
- `has_public_notice`
- optional `correction_log_id` when applied

The queue does not expose admin identity, per-admin decisions, decision reasons, Spread Score, public notice content, vote data, tokens, counters, or user-option linkage.

---

## 4. Scope boundaries

- No migration or schema change.
- No real admin session, JWT, or RBAC implementation.
- No change to review-context privacy hardening.
- No change to public notice API, Official Vote, Reference Answer, results, feed ranking, or poll visibility.

---

*End of Phase 9 handoff v1.*
