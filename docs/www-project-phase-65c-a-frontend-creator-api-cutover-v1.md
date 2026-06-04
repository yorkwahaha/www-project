# WWW Project Phase 65C-A - Frontend Creator API Cutover v1

**Status:** frontend transport cutover only.

## Boundary

- `/polls/new?live=1` now creates through `POST /creator/polls`.
- `/my-polls?live=1` now reads the backend owned list through `GET /creator/polls`.
- Creator lifecycle controls now call:
  - `POST /creator/polls/:id/cancel`
  - `POST /creator/polls/:id/close`
  - `POST /creator/polls/:id/unpublish`
- All creator frontend calls use `credentials: 'same-origin'`.
- Frontend creator flows no longer send `X-User-Id` or `X-Display-Name` as creator authority.

## Local MVP Creator Session

Live mode checks `GET /creator/session` before creator API writes or owned-list reads.
If the check returns unauthenticated on `127.0.0.1` or `localhost`, the frontend calls
the Phase 65A local-test issuer:

```text
POST /creator/session
{ "user_id": "11111111-1111-4111-8111-111111111111" }
```

Production issuance remains fail-closed because Phase 65A config still disables the
local-test issuer in production. This phase does not add a production credential
verifier or login UX.

## Owned List Behavior

`/my-polls?live=1` no longer uses `sessionStorage` recent-poll bookkeeping as an
ownership source. Empty owned lists show the existing link to `/polls/new?live=1`.
Owned-list payloads remain the Phase 65B allowlist and do not include counters,
options, `creator_id`, result preview, ranking, tokens, or user-option linkage.

## Preserved Public Behavior

- Public vote and Reference Answer routes still use their existing public `X-User-Id`
  behavior and are not authorized by creator cookies.
- Public results, feed, public notices, scheduler behavior, and lifecycle backend
  semantics are unchanged.
- Collecting, cancelled, unpublished, and draft result guarantees remain counter-free.

## Non-Goals

- No Phase 65C-B legacy creator-write retirement or development gate.
- No production credential verifier.
- No eligibility evaluator or profile.
- No ranking, personalization, or feed logic change.
- No scheduler change.
- No schema or migration.
- No UX redesign beyond transport-aligned copy.

## Remaining Phase 65C-B Risk

Legacy creator-write routes under `/polls` still accept development-era `X-User-Id`.
Phase 65C-B must retire or development-gate:

- `POST /polls`
- `DELETE /polls/:id`
- `POST /polls/:id/cancel`
- `POST /polls/:id/close`
- `POST /polls/:id/unpublish`

Public vote, Reference Answer, reads, feed, results, and public notices must remain
available when Phase 65C-B gates only legacy creator-write routes.

**Resolved by Phase 65C-B:** see
`docs/www-project-phase-65c-b-legacy-creator-write-retirement-v1.md`.

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
