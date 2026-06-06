# WWW Project Phase 81 - UserAuthResolver Session Read Integration v1

**Status:** minimal production session read integration. `UserAuthResolver` can now resolve production identity from the Phase 80 `www_session` cookie when configured with the Phase 78 `user_sessions` repository. No migration, login UI, protected profile API expansion, Official Vote transaction change, Official Vote eligibility behavior change, `vote-by-index` order change, vote token schema change, counter schema change, creator-session production identity change, Reference Answer behavior change, ranking/personalization, demographic breakdown, analytics linkage, precise location, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior change is introduced by this phase.

---

## 1. Resolver Behavior

Production `UserAuthResolver` session read:

1. reads exactly one syntactically valid `www_session` cookie.
2. hashes the raw cookie token with SHA-256.
3. looks up `user_sessions.token_sha256`.
4. rejects missing, malformed, duplicate, unknown, expired, revoked, and inactive-user sessions.
5. returns `{ user_id, source: "production" }` only for valid sessions.
6. updates `last_used_at` only after successful session verification.

`last_used_at` remains bounded operational lifecycle metadata. It is not used for ranking, personalization, demographic analysis, analytics linkage, option-choice reconstruction, or result display.

The existing explicit trusted credential verifier path remains available. Missing session repository keeps production fail-closed unless another trusted verifier resolves identity.

---

## 2. Non-Production Compatibility

Local/demo/test `X-User-Id` compatibility is unchanged:

- `APP_ENV=development` uses explicit local-demo `X-User-Id` compatibility.
- `APP_ENV=test` uses explicit test `X-User-Id` compatibility.
- production never accepts raw `X-User-Id`.
- `creator_session` remains separate local/demo/test creator flow only.
- non-production modes do not treat `www_session` as identity.

---

## 3. Boundaries Preserved

Phase 81 does not change:

- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Official Vote eligibility behavior.
- Reference Answer behavior.
- profile eligibility behavior.
- protected profile API surface.
- frontend login UI.
- creator-session production identity.
- ranking, Wonder Flow, feed ordering, result display tiers, governance, or admin correction behavior.

No demographic breakdown, ranking personalization, analytics linkage, precise location, extra profile field, or option choice + user/session/device/request/log/trace/metric/error payload linkage is added.

---

## 4. Privacy and Integrity Self-Check

`UserAuthResolver` reads only the opaque `www_session` cookie value, computes its SHA-256 digest, and queries `user_sessions.token_sha256`. The raw cookie token is not stored, logged, returned, traced, emitted in metrics, or placed in diagnostics.

`user_sessions` remains limited to session lifecycle fields and does not store poll, option, Reference Answer, vote token, counter shard, profile eligibility denial paired with selected option, request, trace, device, analytics, precise location, demographic, ranking, or personalization data.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 5. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run test:integration:local
```

`design-drafts/` remains untracked and is not part of this phase.
