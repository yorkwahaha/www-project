# WWW Project Phase 82 - Authenticated Me Endpoint Foundation v1

**Status:** minimal authenticated identity API foundation. Adds `GET /users/me`, which resolves the current user through `UserAuthResolver` and returns only `user_id` and `display_name`. No migration, login submit/logout behavior, frontend login UI, Official Vote transaction change, Official Vote eligibility behavior change, `vote-by-index` order change, vote token schema change, counter schema change, creator-session production identity change, Reference Answer behavior change, profile eligibility behavior, ranking/personalization, demographic breakdown, analytics linkage, precise location, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior change is introduced by this phase.

---

## 1. Endpoint

```text
GET /users/me
```

Successful response:

```json
{
  "user_id": "11111111-1111-4111-8111-111111111111",
  "display_name": "Display Name"
}
```

The endpoint does not return trust or role fields in Phase 82.

---

## 2. Auth Behavior

- Route auth must call `UserAuthResolver`.
- Production identity comes from Phase 81 `www_session` behavior when the resolver is configured with the Phase 78 `user_sessions` repository, or from the existing trusted credential verifier.
- Production does not accept raw `X-User-Id`.
- Development/test preserve explicit non-production `X-User-Id` compatibility.
- `creator_session` remains separate local/demo/test creator flow only and does not authorize this endpoint.

---

## 3. Sensitive Field Exclusion

`GET /users/me` must not return:

- `session_id`, `token_sha256`, raw token, cookie value, or `www_session`.
- `birth_year_month`, `residential_region`, profile eligibility details, demographic breakdowns, precise location, or extra profile fields.
- vote history, Reference Answer data, poll IDs, option IDs, option text, option indexes, shard IDs, counters, or result data.
- analytics, ranking, personalization, request, trace, device, or metric identifiers.

---

## 4. Boundaries Preserved

Phase 82 does not change:

- login submit or logout behavior.
- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Official Vote eligibility behavior.
- Reference Answer behavior or auth boundary.
- profile eligibility behavior.
- creator-session local/demo/test separation.
- ranking, Wonder Flow, feed ordering, result display tiers, governance, or admin correction behavior.

No durable option choice + user/session/device/request/log/trace/metric/error payload linkage is added.

---

## 5. Privacy and Integrity Self-Check

`GET /users/me` returns only already-stored user identity fields needed for current-account display: `user_id` and `display_name`. It does not expose session storage internals, profile eligibility fields, vote participation, option choices, or ranking/governance state.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 6. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run test:integration:local
```

`design-drafts/` remains excluded from this phase.
