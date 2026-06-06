# WWW Project Phase 80 - Production Login Submit Runtime Foundation v1

**Status:** minimal runtime foundation. Adds production `POST /login/session` and `DELETE /login/session` only when an existing trusted credential verifier is explicitly wired with a Phase 78 `user_sessions` repository. No migration, protected API auth cutover, frontend login UI behavior, Official Vote transaction change, profile eligibility change, vote token schema change, counter schema change, creator-session production identity change, Reference Answer behavior change, ranking/personalization, demographic breakdown, analytics linkage, precise location, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior change is introduced by this phase.

**Baseline:** Phase 78 added digest-backed `user_sessions`. Phase 79 specified the login submit, cookie, logout, CSRF, and privacy boundaries. Phase 80 implements only the submit/revoke foundation.

---

## 1. Routes Added

```text
POST /login/session
DELETE /login/session
```

The routes are configured only when:

- a `TrustedCredentialVerifier` boundary is provided.
- a `UserSessionRepository` is provided.
- exact allowed login mutation origins are configured.

Without that wiring, `/login/session` remains unavailable and fails closed.

---

## 2. Login Submit Behavior

`POST /login/session`:

1. validates the exact `Origin`.
2. verifies the request through the existing `trustedCredentialVerifier` boundary.
3. rejects missing, malformed, rejected, throwing, unknown-user, or inactive-user credentials.
4. generates a high-entropy opaque raw session token with server-side CSPRNG.
5. stores only `token_sha256` in `user_sessions`.
6. returns:

```text
Set-Cookie: www_session=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<bounded>
```

The JSON response contains only display-safe auth state and `expires_at`.

The raw token is never persisted. It exists only during issuance and cookie serialization.

---

## 3. Logout / Revoke Behavior

`DELETE /login/session`:

1. validates the exact `Origin`.
2. reads exactly one syntactically valid `www_session` cookie when present.
3. hashes the raw cookie token and looks up `user_sessions.token_sha256`.
4. revokes the active, non-expired, non-revoked, active-user session by `session_id`.
5. clears the cookie with matching safe attributes.
6. returns `204 No Content`.

Malformed, duplicate, missing, unknown, expired, revoked, or inactive-user cookies do not reveal session state and do not create option-choice, poll, profile, ranking, or analytics linkage.

---

## 4. Boundaries Preserved

Phase 80 does not change:

- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- `/users/me/profile` auth behavior.
- Official Vote or `vote-by-index` auth behavior.
- creator-owned route auth behavior.
- Reference Answer behavior or runtime-memory-only selected option handling.
- `creator_session` local/demo/test-only role.
- `X-User-Id` explicit non-production compatibility role.
- result display tiers, Wonder Flow, feed ranking, governance workflows, or admin correction behavior.

No protected user APIs, profile APIs, vote auth changes, frontend login UI submit behavior, eligibility behavior changes, demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields are added.

---

## 5. Privacy and Integrity Self-Check

`user_sessions` stores only:

- `session_id`.
- `token_sha256`.
- `user_id`.
- `created_at`.
- `expires_at`.
- `revoked_at`.
- `last_used_at`.

It does not store `poll_id`, `option_id`, `selected_option_index`, `option_text`, selected answer payloads, Reference Answer option state, vote token row copies, counter shard assignments, profile eligibility denial paired with selected option, request IDs, trace IDs, device IDs, analytics IDs, precise location, demographic breakdown fields, ranking features, or personalization features.

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

`design-drafts/` remains untracked and is not part of this phase.
