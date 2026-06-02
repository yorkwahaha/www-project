# WWW Project Phase 65B - Creator-Owned Poll APIs v1

**Status:** backend-only authenticated creator ownership wiring.

## Boundary

- Adds authenticated creator-owned poll routes under `/creator/polls`.
- Uses only the Phase 65A `creator_session` cookie as creator authority.
- Does not trust `X-User-Id`, `X-Display-Name`, request-body identity fields, or forwarding headers.
- Keeps existing public `/polls` vote, Reference Answer, result, feed, notice, and lifecycle behavior unchanged.
- Adds no frontend UX or `/my-polls` transport switch.

## Routes

| Method | Route | Behavior |
|--------|-------|----------|
| `POST` | `/creator/polls` | Create draft or published poll with session `userId` as `creator_id` |
| `GET` | `/creator/polls` | List owned visible polls with a fixed limit of 50 |
| `DELETE` | `/creator/polls/:id` | Reuse guarded creator delete/repost path |
| `POST` | `/creator/polls/:id/cancel` | Reuse `collecting -> cancelled` transaction |
| `POST` | `/creator/polls/:id/close` | Reuse guarded `collecting -> revealed` transaction |
| `POST` | `/creator/polls/:id/unpublish` | Reuse guarded `post_lock -> unpublished` transaction |

All mutations require the existing exact-match creator Origin gate. Invalid, expired,
revoked, or inactive creator sessions fail closed with the generic creator-session `401`.

## Owned List

`GET /creator/polls` uses a deterministic polls-table-only query ordered by
`created_at DESC, id ASC`. It excludes deleted, archived, suspended, and
`correction_pending` rows.

The response allowlist is limited to:

- `poll_id`
- `title`
- `category`
- `public_lifecycle_state`
- `closes_at`
- `revealed_at`
- `public_lock_ends_at`
- `cancelled_at`
- `unpublished_at`

The query does not join options, counters, vote tokens, Reference Answer tokens, users,
ranking data, or personalization data.

## Schema And Transaction Boundary

- No migration is required.
- Existing `polls.creator_id`, creator indexes, and Phase 65A `creator_sessions` are sufficient.
- Creator creation reuses the existing poll-plus-options transaction without provisioning a
  user from request headers.
- Lifecycle and delete actions reuse existing bounded poll-row transaction guards.

## Preserved Privacy And Integrity Rules

- Creator cookies never authorize Official Vote or Reference Answer.
- Collecting, cancelled, unpublished, and draft result paths remain counter-free.
- No raw option linkage, event log, result snapshot, counter change, scheduler change, or
  result-display threshold change is added.

## Deferred Phase 65C Risk

Legacy creator-write routes under `/polls` still accept development-era `X-User-Id`.
Phase 65C must switch the live frontend transport to `/creator/polls`, then retire or
development-gate those legacy creator-write routes. Phase 65B is not a production auth
cutover by itself.

## Explicit Non-Goals

- Frontend session UX or `/my-polls` transport switch
- Legacy creator-write retirement or development gate
- Production credential verifier
- Sliding session TTL or refresh
- Eligibility profile or evaluator
- Ranking, personalization, or feed changes
- Scheduler changes
- Official Vote, Reference Answer, or result visibility changes
