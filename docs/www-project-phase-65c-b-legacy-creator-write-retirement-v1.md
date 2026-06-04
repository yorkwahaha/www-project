# WWW Project Phase 65C-B - Legacy Creator-Write Retirement v1

**Status:** legacy `/polls` creator-write retirement.

## Boundary

Phase 65C-B retires the development-era creator-write routes that accepted
client-selected `X-User-Id` as creator authority:

- `POST /polls`
- `DELETE /polls/:id`
- `POST /polls/:id/cancel`
- `POST /polls/:id/close`
- `POST /polls/:id/unpublish`

These routes now return:

```json
{
  "error": "LEGACY_CREATOR_WRITE_RETIRED",
  "message": "Legacy creator-write routes are retired; use /creator/polls"
}
```

with HTTP `410`.

## Configuration

There is no development, local, staging, or production bypass for the retired
legacy creator-write routes.

Production and default behavior are identical: legacy `/polls` creator writes
fail closed and do not accept `X-User-Id` or `X-Display-Name` as creator
ownership authority.

## Preserved Creator Routes

Creator writes remain available only through the Phase 65B creator-owned API
using the Phase 65A `creator_session` cookie:

- `POST /creator/polls`
- `GET /creator/polls`
- `DELETE /creator/polls/:id`
- `POST /creator/polls/:id/cancel`
- `POST /creator/polls/:id/close`
- `POST /creator/polls/:id/unpublish`

The creator owned-list remains counter-free and does not include options,
counters, result previews, ranking data, tokens, or user-option linkage.

## Preserved Public Routes

Phase 65C-B does not change:

- `GET /polls/:id`
- `GET /polls/:id/results`
- `GET /polls/feed`
- `POST /polls/:id/vote`
- `POST /polls/:id/vote-by-index`
- `POST /polls/:id/reference-answer`
- `GET /polls/:id/public-notices`
- Public pages and frontend assets
- Lifecycle scheduler behavior

Public vote and Reference Answer keep their existing public `X-User-Id`
behavior. The creator cookie does not authorize those public submission routes.

## Privacy And Integrity

No schema or migration was added.

The retirement does not change result-display privacy:

- `collecting`, `cancelled`, `unpublished`, and `draft` remain counter-free.
- Aggregate results remain readable only for `revealed`, `locked`, and
  `post_lock`.

No durable storage, logs, metrics, analytics, APM traces, or debug payloads are
introduced by this phase.

## Non-Goals

- No production credential verifier.
- No frontend UX redesign.
- No eligibility evaluator or profile.
- No ranking, personalization, or feed logic change.
- No scheduler change.
- No schema or migration.

## Validation

Required validation for this phase:

```text
npm run migrate:check
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local
npm run test:integration:local
```
