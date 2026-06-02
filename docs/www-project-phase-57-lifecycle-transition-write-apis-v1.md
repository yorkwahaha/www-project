# WWW Project Phase 57 — Lifecycle Transition Write APIs v1

**狀態：** 已實作最小 lifecycle transition write API 與內部 service helper；不含 scheduler 部署、frontend、notification 或 schema 變更。

## 1. 已實作

- Creator-authenticated `POST /polls/:pollId/cancel`: only `collecting -> cancelled`; writes server `cancelled_at`.
- Creator-authenticated `POST /polls/:pollId/close`: only `collecting -> revealed` at or after `closes_at`; atomically writes server `revealed_at` and `public_lock_ends_at = revealed_at + 5 days`.
- Creator-authenticated `POST /polls/:pollId/unpublish`: only `post_lock -> unpublished` after the lock period; writes server `unpublished_at`.
- Internal `revealPoll(pollId)` helper for a future server close worker.
- Internal `advancePublicLifecycle(pollId)` helper for `revealed -> locked` and `locked -> post_lock`.
- Public freshness feed now requires `public_lifecycle_state='collecting'`, so cancelled polls cannot remain listed before `closes_at`.

All PostgreSQL lifecycle writes lock one poll row and complete in one bounded transaction. Client requests do not provide lifecycle states, timestamps, counters, shard values, or aggregate values.

## 2. Privacy And Integrity Boundary

- `public_lifecycle_state` remains authoritative. Legacy `status='closed'` and `total >= 30` do not reveal results.
- Collecting, draft, cancelled, and unpublished result shells do not read or JOIN aggregate counters.
- Official Vote and Reference Answer still require `public_lifecycle_state='collecting'`.
- No lifecycle event log, result snapshot, raw vote event, option-level Reference Answer counter, or durable user-option linkage was added.
- No frontend behavior changed.

## 3. Validation Coverage

- Unit tests cover creator authorization, repeat conflicts, early reveal rejection, atomic reveal timestamps, internal advancement, fixed unavailable shells, and counter-free lifecycle source guards.
- PostgreSQL integration covers explicit reveal through unpublish and Reference Answer rejection for every non-collecting lifecycle state without token or counter writes.

## 4. Remaining Scope

- Scheduler deployment and job orchestration remain future work. The internal helpers are callable without a deployed scheduler.
- Full age/region eligibility evaluation remains future work.
