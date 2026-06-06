# WWW Project Phase 79 - Production Login Submit / Session Cookie Issuance Plan v1

**Status:** docs/spec only. No runtime behavior, route, migration, schema change, cookie issuance, login submit, logout API, CSRF runtime, `UserAuthResolver` behavior, production `trustedCredentialVerifier` behavior, protected API behavior, frontend behavior, Official Vote transaction change, profile eligibility change, vote token schema change, counter schema change, Reference Answer behavior change, creator route behavior change, ranking/personalization change, demographic breakdown, analytics linkage, precise location, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior change is introduced by this phase.

**Baseline:** Phase 77 recommended HttpOnly Secure SameSite cookie session as the next production browser runtime. Phase 78 added the digest-backed `user_sessions` schema and repository foundation, but did not wire it into login, cookies, `UserAuthResolver`, or production credential verification.

**Purpose:** define the future implementation boundary for production login submit and session cookie issuance using Phase 78 `user_sessions`, without enabling the runtime in Phase 79.

---

## 1. Phase 79 Scope

Phase 79 adds only this planning document, README index text, and a docs guard test.

In scope:

- production login submit boundary.
- session token issuance boundary.
- `Set-Cookie` requirements and flags.
- raw token handling rules.
- `token_sha256` / digest-only persistence rule.
- expiration, `revoked_at`, and `last_used_at` behavior.
- logout / revoke boundary.
- CSRF protection strategy.
- future `trustedCredentialVerifier` / `UserAuthResolver` integration boundary.
- production vs local/demo/test identity separation.
- `creator_session` separation from production identity.
- `X-User-Id` explicit non-production compatibility only.
- auth/privacy invariants for vote, Reference Answer, ranking, analytics, profile, and Raw Option Linkage Ban.

Out of scope:

- No route implementation.
- No login submit implementation.
- No session cookie issuance.
- No logout API.
- No CSRF runtime.
- No migration or schema change.
- No `UserAuthResolver` behavior change.
- No production `trustedCredentialVerifier` behavior change.
- No protected API behavior change.
- No frontend behavior change.

---

## 2. Non-Negotiable Invariants

Future implementation must preserve:

- Official Vote transaction order unchanged.
- `vote-by-index` eligibility before option resolve unchanged.
- Vote token schema unchanged: `user_id + poll_id`.
- Counter schema unchanged: `poll_id + option_id + shard_id`.
- Reference Answer unchanged.
- Raw Option Linkage Ban unchanged.
- No option-choice identity linkage.
- No option choice + user/session/device/request/log/trace/metric/error payload linkage.
- No demographic breakdown.
- No ranking personalization.
- No analytics linkage.
- No precise location.
- No extra profile fields.

Any implementation that requires durable selected-option linkage, Reference Answer option storage, or logs/metrics/traces/errors that can reconstruct `user/session/request/device + poll option` must stop and report before coding.

---

## 3. Production Login Submit Boundary

Future production login submit should be implemented only in a separate approved implementation phase.

Recommended future route shape:

```text
POST /login/session
```

The future route may:

1. accept an approved production credential proof from a login provider or first-party account proof.
2. validate CSRF / Origin requirements before creating a session.
3. map the credential proof to a canonical `users.id`.
4. create a Phase 78 `user_sessions` row.
5. issue one opaque session cookie.
6. return display-safe current-user state or a redirect.

The future route must not:

- accept raw `X-User-Id` as production identity.
- accept `creator_session` as production identity.
- accept body/query user IDs as production identity.
- let frontend code choose `user_id`.
- receive or persist selected poll option, option index, option text, Reference Answer selected option, vote state, profile eligibility denial paired with option selection, request ID, trace ID, device ID, analytics ID, precise location, or extra profile fields.
- change `/users/me/profile`, Official Vote, `vote-by-index`, creator routes, or Reference Answer.

The current `/login` shell remains disabled until a future implementation phase explicitly changes it.

---

## 4. Session Token Issuance Boundary

Future implementation should generate a high-entropy opaque session token server-side using a CSPRNG.

Rules:

- Raw session token exists only during issuance and cookie serialization.
- Raw session token must never be stored in a database.
- The raw token is never stored; only `token_sha256` or a stronger approved digest may be persisted.
- Raw session token must never be logged, traced, emitted in metrics, placed in error payloads, returned in JSON, stored in analytics, or copied into debug payloads.
- `user_sessions.token_sha256` stores only a SHA-256 digest or stronger approved digest of the raw token.
- Session lookup compares digests, not raw tokens.
- Session ID is not a substitute for the raw cookie token.
- Token generation must not derive from `user_id`, timestamp, poll ID, option ID, request ID, trace ID, IP address, user agent, device ID, analytics ID, or profile field.

Recommended future issuance sequence:

```text
validate login proof
generate opaque session token
hash token -> token_sha256
insert user_sessions row
serialize Set-Cookie with raw token
discard raw token from server variables after response assembly
```

No Phase 79 runtime implements this sequence.

---

## 5. `Set-Cookie` Requirements

Recommended future cookie name:

```text
www_session
```

Recommended production cookie attributes:

```text
Set-Cookie: www_session=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<bounded>
```

Required future properties:

- `HttpOnly` always.
- `Secure` in production.
- `SameSite=Lax` by default for same-origin app navigation.
- `SameSite=Strict` may be used if product flow permits.
- `SameSite=None` is forbidden unless a future auth-provider callback design explicitly requires it and adds compensating CSRF controls.
- Host-only cookie by default; no `Domain` attribute unless explicitly approved.
- `Path=/` unless a future route design proves a narrower path works for all protected routes.
- bounded `Max-Age` aligned with `user_sessions.expires_at`.
- no selected option, poll, profile, request, device, trace, analytics, or ranking data in cookie value or attributes.

The cookie value must be the opaque raw token only. It must not be a JWT carrying profile, vote, poll, option, eligibility, demographic, analytics, ranking, location, or creator-session data.

---

## 6. `user_sessions` Lifecycle Behavior

Phase 78 table remains the storage foundation:

- `session_id`.
- `token_sha256`.
- `user_id`.
- `created_at`.
- `expires_at`.
- `revoked_at`.
- `last_used_at`.

### Expiration

Future verifier behavior:

- reject sessions when `expires_at <= now`.
- do not extend `expires_at` unless a separate approved renewal policy exists.
- auth failure must not resolve poll options or emit option-specific diagnostics.

Future UX:

- show generic session expired / login required copy.
- do not reveal whether the user selected an option, voted, was eligible for a selected option, or had Reference Answer state.

### `revoked_at`

Future verifier behavior:

- reject sessions when `revoked_at IS NOT NULL`.
- revoked sessions remain unusable even if not expired.
- revocation must not write poll option data or selected-option context.

Future UX:

- show generic reauth-required copy.
- do not reveal revocation reason tied to poll participation or answer direction.

### `last_used_at`

Future verifier behavior:

- may update `last_used_at` after successful session verification.
- must keep `last_used_at` bounded by Phase 78 constraints.
- must not use `last_used_at` for ranking, personalization, demographic analysis, analytics linkage, or option-choice reconstruction.
- must not update `last_used_at` after auth failure in a way that links failed requests to selected options.

`last_used_at` is operational lifecycle metadata only.

---

## 7. Logout / Revoke Boundary

Phase 79 does not implement logout.

Recommended future route shape:

```text
DELETE /login/session
```

Future logout should:

- require CSRF / Origin protection for the unsafe mutation.
- locate the session by cookie token digest.
- set `revoked_at` if the session exists and is not already revoked.
- clear the `www_session` cookie with matching attributes.
- return `204 No Content` or a display-safe generic body.

Future logout must not:

- disclose whether the session was associated with a poll, selected option, vote, Reference Answer, eligibility result, creator action, or ranking signal.
- revoke by raw `X-User-Id`.
- revoke by `creator_session`.
- log raw token, token digest, or `user/session + poll option` structures.

---

## 8. CSRF Protection Strategy

Cookie-based production auth requires CSRF controls before runtime implementation.

Minimum future controls:

- exact Origin checks for unsafe same-origin mutations.
- reject unsafe requests with missing or untrusted Origin unless an explicitly approved browser compatibility exception exists.
- `SameSite=Lax` or `SameSite=Strict` cookie by default.
- CSRF token for unsafe browser mutations if SameSite + Origin is insufficient for the deployment shape.
- no broad credentialed CORS.
- no login submit, logout, profile update, vote, `vote-by-index`, creator mutation, or admin mutation may rely on cookie presence alone if the CSRF strategy for that route requires an additional token.

CSRF failure responses must be generic and must not reveal option choice, vote state, eligibility details tied to selected option, or Reference Answer state.

---

## 9. Future `trustedCredentialVerifier` / `UserAuthResolver` Integration

Future implementation must preserve this boundary:

```text
HTTP request
  -> route adapter
  -> UserAuthResolver.resolveUserAuth(req)
  -> production trustedCredentialVerifier(req)
  -> user_sessions digest lookup
  -> AuthenticatedUserContext { user_id }
  -> domain service
```

Rules:

- Route adapters keep calling `UserAuthResolver`.
- Domain services must not parse cookies, Bearer tokens, raw `X-User-Id`, body user IDs, query user IDs, or `creator_session`.
- `trustedCredentialVerifier` may read only the approved production credential source.
- Cookie lookup must hash the raw cookie value and query `user_sessions.token_sha256`.
- Missing, malformed, duplicate, expired, revoked, inactive-user, or unknown sessions fail closed.
- No fallback to raw `X-User-Id`.
- No fallback to `creator_session`.
- No fallback to demo fixture identity.
- No fallback to body/query identity.

Phase 79 does not wire this integration.

---

## 10. Production vs Local/Demo/Test Identity Separation

Production:

- formal production identity must come only from the approved `trustedCredentialVerifier`.
- future cookie sessions must use `user_sessions`.
- raw `X-User-Id` is not production identity.
- `creator_session` is not production identity.

Local/demo/test:

- explicit MVP `X-User-Id` compatibility may remain under non-production configuration only.
- local/demo/test `creator_session` may remain for creator demo flows only.
- both paths must be labeled as non-production compatibility.
- neither path may be used as production fallback.

Future tests must prove production fails closed when only raw `X-User-Id` or `creator_session` is present.

---

## 11. `creator_session` Boundary

`creator_session` must remain unrelated to production identity.

Rules:

- It must not authorize production profile routes.
- It must not authorize Official Vote.
- It must not authorize `vote-by-index`.
- It must not authorize Reference Answer.
- It must not authorize public reads, results, feed, notices, scheduler, ranking, analytics, or personalization behavior.
- It must not be accepted by production `trustedCredentialVerifier`.
- It must not be merged into `user_sessions`.
- It must not become production logout state.

Production creator-owned routes should continue resolving identity through `UserAuthResolver` plus creator ownership checks.

---

## 12. Reference Answer Boundary

Reference Answer remains unchanged in Phase 79.

Rules:

- Reference Answer is not cut over to `UserAuthResolver`.
- Reference Answer does not use production session cookie state.
- Reference Answer does not use profile eligibility.
- Reference Answer selected option memory remains JavaScript runtime memory only.
- Reference Answer runtime memory must still clear on `pagehide`.
- Reference Answer runtime memory must still clear on `pageshow` when `event.persisted === true`.
- Any future Reference Answer `UserAuthResolver` cutover must be a separate approved phase.

---

## 13. Logs / Metrics / APM / Error Payload Boundary

Allowed future telemetry, if separately implemented, must be aggregate auth health only:

- aggregate login success/failure count.
- aggregate session issuance failure count.
- aggregate expired-session count.
- aggregate revoked-session count.
- aggregate CSRF rejection count.

Forbidden:

- raw session token.
- `token_sha256`.
- `session_id + poll_id + option_id`.
- `user_id + poll_id + selected_option_index`.
- `request_id + user_id + option_text`.
- `trace_id + selected answer payload`.
- `device_id + poll_id + selected option`.
- `creator_session + selected option`.
- auth error payloads containing selected option, option text, option index, resolved `option_id`, vote state, eligibility denial paired with selected option, or Reference Answer selected option data.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 14. Future Implementation Entry Criteria

A future implementation phase must specify:

1. login provider / credential proof.
2. `POST /login/session` request and response contract.
3. exact cookie name, flags, TTL, and clearing attributes.
4. raw token generation and disposal rules.
5. `token_sha256` digest-only persistence and lookup tests.
6. expiration behavior.
7. `revoked_at` behavior.
8. `last_used_at` update behavior.
9. `DELETE /login/session` logout/revoke behavior, if implemented.
10. CSRF / Origin runtime controls.
11. `trustedCredentialVerifier` / `UserAuthResolver` source guards.
12. production no-fallback tests for `X-User-Id`.
13. production no-fallback tests for `creator_session`.
14. Reference Answer unchanged tests.
15. no option-choice linkage tests for storage, logs, traces, metrics, analytics, debug payloads, and error payloads.
16. Official Vote transaction order and `vote-by-index` eligibility-before-option-resolve regression tests.

Stop and report if implementation requires durable selected-option linkage, Reference Answer option storage, creator_session production public identity, vote transaction order changes, vote token/counter schema changes, demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields.

---

## 15. Validation for Phase 79 Docs

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Docs guard: `tests/docs/phase-79-production-login-session-cookie-plan-doc.test.ts`

`design-drafts/` remains excluded from git and delivery scope.
