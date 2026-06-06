# WWW Project Phase 77 - Production Login Session Runtime Plan v1

**Status:** docs/spec only. No runtime change, frontend change, migration, DB schema change, API behavior change, verifier behavior change, login submit implementation, session issuance, cookie issuance, Bearer credential issuance, logout implementation, revocation implementation, Official Vote transaction change, vote token/counter schema change, Reference Answer behavior change, creator route behavior change, ranking/personalization change, demographic breakdown, analytics linkage, precise location, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior change is introduced by this phase.

**Baseline:** Phase 76 auth UX demo checkpoint is complete. Production route adapters for profile, Official Vote, `vote-by-index`, and production `/creator/*` already resolve identity through `UserAuthResolver`. Phase 72 provides a minimal `Authorization: Bearer` opaque credential verifier foundation. The `/login` page remains a disabled shell.

**Purpose:** choose the next production browser login/session runtime direction and define the implementation boundary for session table, cookie strategy, Bearer credential issuance, logout, expiration, revocation, CSRF/XSS, non-production `X-User-Id` compatibility, `creator_session`, and `UserAuthResolver` wiring without changing runtime behavior in Phase 77.

---

## 1. Phase 77 Scope

Phase 77 adds only this planning document, README index text, and a docs guard test.

In scope:

- Compare `HttpOnly Secure SameSite cookie session` with `Authorization: Bearer opaque credential`.
- Recommend the next production browser auth transport for WWW Project.
- Plan how `UserAuthResolver` and production `trustedCredentialVerifier` should consume the chosen credential.
- Plan how `/login` disabled submit becomes a formal login flow in a future implementation phase.
- Plan logout, session expiration, revoked credential API and UX behavior.
- Preserve local/demo/test `X-User-Id` compatibility as non-production only.
- Decide the future `creator_session` boundary.
- Re-state that Reference Answer `UserAuthResolver` cutover remains independent and outside this runtime phase.
- State that any required migration/DB schema must be implemented only in a separate approved implementation phase.

Out of scope:

- No `src/` runtime patch.
- No frontend behavior patch.
- No migration.
- No new table or column.
- No API route or response behavior change.
- No login submit, session issuance, cookie issuance, Bearer issuance, logout, refresh, or revocation implementation.
- No Reference Answer auth-source change.
- No vote, result, feed, ranking, profile, creator ownership, scheduler, logging, metrics, APM, analytics, debug, or error payload behavior change.

---

## 2. Non-Negotiable Invariants

Future implementation must preserve:

- Official Vote transaction order unchanged.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Raw Option Linkage Ban.
- No option choice + user/session/device/request/log/trace/metric/error payload linkage.
- No demographic breakdown.
- No ranking personalization.
- No analytics linkage.
- No precise location.
- No extra profile fields.

Any implementation that needs durable `user/session/request/device + poll option` linkage must stop and report before coding.

---

## 3. Candidate Runtime Options

### 3.1 Option A - HttpOnly Secure SameSite Cookie Session

Browser receives a server-issued opaque session ID in a cookie:

```text
Set-Cookie: www_session=<opaque>; HttpOnly; Secure; SameSite=Lax or Strict; Path=/; Max-Age=<bounded>
```

The server stores only a digest of the opaque session credential and session metadata. Route adapters call `UserAuthResolver`; the production `trustedCredentialVerifier` reads the cookie, hashes the opaque value, checks the production session store, and returns canonical `user_id`.

Expected future properties:

- Browser JavaScript cannot read the credential because it is `HttpOnly`.
- Session revocation can be immediate by marking the server-side row revoked.
- Expiration is enforced server-side and mirrored by cookie `Max-Age`.
- Logout clears the cookie and revokes the server-side credential.
- `SameSite=Lax` or `SameSite=Strict`, exact Origin checks for unsafe mutations, and optional synchronizer/double-submit CSRF token can bound CSRF risk.
- XSS can still perform same-origin actions while the page is compromised, but cannot exfiltrate the session token directly.

Risks and required controls:

- CSRF must be explicitly handled for unsafe methods. SameSite alone is not enough for all future deployment shapes.
- Cookie scope must be host-only unless a future deployment phase explicitly approves a domain cookie.
- Session records must not store poll option, selected option index, selected option text, Reference Answer payload, request ID, trace ID, device ID, analytics ID, precise location, demographic breakdown, or ranking personalization data.
- Logging must not include cookie values, session digests, or `session/user + poll option` structures.

### 3.2 Option B - Authorization: Bearer Opaque Credential

Browser or client sends:

```text
Authorization: Bearer <opaque-token>
```

The Phase 72 foundation already supports a minimal env-configured opaque Bearer verifier. A future production implementation could issue opaque Bearer credentials from login submit and verify them through `trustedCredentialVerifier`.

Expected future properties:

- CSRF exposure is lower because browsers do not attach `Authorization` automatically.
- Non-browser clients and controlled service clients can use it naturally.
- It fits the existing Phase 72 `USER_AUTH_CREDENTIALS_JSON` verifier foundation.
- Revocation can be immediate if the token is backed by a server-side digest store or revocation list.

Risks and required controls:

- Browser JavaScript must hold or retrieve the credential to attach the header, increasing XSS exfiltration risk.
- The credential must not be stored in `localStorage`, `sessionStorage`, IndexedDB, URL params, readable cookies, history state, service-worker caches, analytics queues, or hidden durable caches.
- Pure in-memory Bearer storage creates page-refresh and multi-tab UX friction.
- Any refresh-token design would add more credential surface and must be separately specified.
- Bearer issuance must never embed or log selected option, poll option, eligibility denial paired with option selection, request ID, trace ID, device ID, analytics ID, or profile fields beyond canonical account identity.

---

## 4. Recommendation for WWW Project Next Step

**Phase 77 recommends Option A: HttpOnly Secure SameSite cookie session as the next production browser login/session runtime.**

Reasons:

1. WWW Project is browser-first and privacy-sensitive. Keeping the production browser credential outside JavaScript storage is the safer default.
2. The Raw Option Linkage Ban is easier to defend when frontend code never reads or transports the session secret manually.
3. Server-side session rows give straightforward expiration, logout, revocation, disabled-account checks, and emergency kill switches.
4. Cookie sessions fit the current same-origin public app shape and can be wired behind `UserAuthResolver` without domain services parsing credentials.
5. CSRF risk is real but bounded with `SameSite`, exact Origin checks for unsafe methods, and a future approved CSRF token design. XSS risk cannot be eliminated, but HttpOnly prevents direct token theft.
6. Bearer remains useful for non-browser clients, admin-style controlled credentials, or transitional verifier tests, but it is not the preferred production browser storage model.

Phase 72 `Authorization: Bearer` support should remain as a verifier foundation and controlled credential path. It should not force the browser login UX to store readable Bearer tokens.

---

## 5. Future Session Table and Migration Boundary

A production cookie session implementation will likely need a session table. Phase 77 does not create it.

If a future implementation phase chooses the recommended cookie-session runtime, it must open a separate migration/DB schema phase or include an explicitly approved migration section.

Minimum future session-store fields should be limited to credential lifecycle:

- `session_id` or equivalent internal UUID.
- `token_sha256` or stronger digest of the opaque cookie value.
- canonical `user_id`.
- `created_at`.
- `expires_at`.
- `revoked_at`.
- optional `last_seen_at` only if bounded and not used for ranking, analytics linkage, or option-choice reconstruction.

Forbidden session-store fields:

- `poll_id + option_id`.
- `poll_id + selected_option_index`.
- `poll_id + option_text`.
- selected answer payload.
- Reference Answer selected option data.
- vote token row copy.
- counter shard assignment.
- profile eligibility denial paired with selected option.
- request ID, trace ID, device ID, analytics ID, IP address, or user agent linked to a selected option.
- demographic breakdown fields.
- precise location.
- extra profile fields.
- ranking or personalization features.

Migration/DB schema if future needs arise must be a separate implementation phase. Phase 77 creates no durable storage.

---

## 6. `UserAuthResolver` / `trustedCredentialVerifier` Wiring Plan

Future production route adapters must keep this shape:

```text
HTTP request
  -> route adapter
  -> UserAuthResolver.resolveUserAuth(req)
  -> production trustedCredentialVerifier(req)
  -> AuthenticatedUserContext { user_id }
  -> domain service
```

For the recommended cookie session:

1. `trustedCredentialVerifier` reads only the approved `www_session` cookie.
2. It rejects missing, malformed, duplicate, expired, revoked, inactive-user, or unknown sessions.
3. It hashes the opaque cookie value before lookup.
4. It returns only canonical `user_id` and minimal auth context.
5. It does not receive or inspect option choice, selected option index, selected option text, Reference Answer payload, result counters, ranking signals, profile eligibility denial paired with an option selection, request ID, trace ID, analytics ID, or device ID.
6. It does not fall back to raw `X-User-Id`, `creator_session`, body user IDs, query user IDs, forwarded identity headers, request IDs, trace IDs, IP addresses, device IDs, analytics IDs, or demo fixtures in production.

For Bearer credentials:

1. `trustedCredentialVerifier` may continue accepting `Authorization: Bearer <opaque-token>` only if the future phase explicitly preserves that path.
2. Cookie and Bearer precedence must be specified before implementation. The recommended browser path should avoid ambiguous dual credentials.
3. Any Bearer path must use digest lookup or an approved verifier and must preserve the same no-linkage rules.

Domain services must not parse cookies, Bearer tokens, `X-User-Id`, or `creator_session` directly.

---

## 7. Login Submit Future Flow

The current `/login` shell remains disabled in Phase 77.

A future implementation may turn login submit into a formal flow only after approving:

1. Login provider or credential proof.
2. POST endpoint name and request body.
3. CSRF / Origin behavior for the login mutation.
4. Session issuance transaction.
5. Cookie serialization policy.
6. Error response shape.
7. UX copy for success, failure, expired session, revoked session, and unavailable verifier.
8. Tests proving no production `X-User-Id` fallback.
9. Tests proving no `creator_session` production public identity.
10. Tests proving no option-choice linkage in storage, logs, traces, metrics, debug payloads, analytics, or error payloads.

Recommended future browser flow:

```text
GET /login
  -> enabled form or provider redirect only in the implementation phase
POST /login/session
  -> validate credential proof
  -> create server-side session row with token digest
  -> Set-Cookie: www_session=<opaque>; HttpOnly; Secure; SameSite=Lax or Strict; Path=/; Max-Age=<bounded>
  -> return display-safe current-user state or redirect to intended route
Subsequent protected calls
  -> cookie attached by browser
  -> UserAuthResolver verifies through trustedCredentialVerifier
```

The login flow must not ask users to type a raw user ID, paste `X-User-Id`, choose a creator identity, or select a profile identity.

---

## 8. Logout, Expiration, and Revocation Behavior

Phase 77 does not implement these behaviors. Future implementation should plan the following API and UX behavior.

### Logout

Recommended API:

```text
DELETE /login/session
```

Expected behavior:

- Require valid session cookie when present.
- Revoke the server-side session row if found.
- Return `204 No Content` or a display-safe success body.
- Send an expired `www_session` cookie with matching attributes.
- Do not report poll option, selected option, vote status, or Reference Answer state.

UX:

- Header changes to logged-out state.
- Protected pages show the existing login-required state.
- In-progress Official Vote selection must not be durably stored for post-login replay.
- Reference Answer runtime memory rules remain unchanged.

### Session Expiration

Recommended API behavior:

- Protected APIs return `401` with a generic auth-required or session-expired code approved by the implementation phase.
- The response must not reveal whether the user had selected an option, had voted, was eligible for a selected option, or had Reference Answer state.
- Vote endpoints must preserve `vote-by-index` eligibility before option resolve after auth succeeds; auth failure must not cause option resolution or option-specific diagnostics.

UX:

- Show a login-required or session-expired banner.
- Offer return to `/login`.
- Do not persist selected option in localStorage, sessionStorage, IndexedDB, cookies, URL params, history state, service-worker caches, or analytics queues.

### Revoked Credential

Recommended API behavior:

- Protected APIs return `401` with a generic revoked/reauth-required code approved by the implementation phase.
- Clear cookie when safe and appropriate.
- Do not include session row details, revocation reason tied to a request, poll option data, or profile eligibility details paired with selected option.

UX:

- Show reauth-required copy.
- Return to `/login`.
- Do not distinguish revocation in a way that leaks poll participation or answer direction.

---

## 9. CSRF and XSS Boundary

For the recommended cookie-session runtime, a future implementation must include:

- `HttpOnly`.
- `Secure` in production.
- `SameSite=Lax` or `SameSite=Strict`; if cross-site auth callbacks are needed, document the exact exception.
- Host-only cookie by default.
- Exact Origin checks for unsafe mutations.
- CSRF token design for unsafe browser mutations if SameSite + Origin is insufficient for the chosen deployment.
- No CORS credential broadening without explicit approval.
- No session token exposure to JavaScript.

XSS boundary:

- HttpOnly prevents direct cookie theft but not forged same-origin actions from a compromised page.
- Frontend must keep selected option state in runtime memory only where required, and must not persist option selections through login redirects.
- Error rendering must not echo credential values, option IDs, option text, selected option index, request IDs tied to option choice, or raw diagnostic payloads.

---

## 10. Local/Demo/Test `X-User-Id` Compatibility

Local/demo/test `X-User-Id` compatibility remains explicit non-production only.

Rules:

- Allowed only under non-production configuration such as `APP_ENV=development` or `APP_ENV=test`.
- Must fail closed in production.
- Must never be accepted by production `trustedCredentialVerifier`.
- Must not be accepted as fallback when cookie session or Bearer verification fails.
- Must not be logged with option choices or selected option data.
- Must remain clearly labeled as MVP demo-style identity in UX and docs until removed.

Future implementation must include guards proving production does not accept raw `X-User-Id`.

---

## 11. `creator_session` Future Boundary

Phase 77 recommends keeping `creator_session` as local/demo/test only and eventually retiring it from production-facing documentation once formal production login/session is implemented.

Rules:

- `creator_session` must not become production public identity.
- `creator_session` must not authorize profile, Official Vote, `vote-by-index`, Reference Answer, public reads, results, feed, notices, scheduler, ranking, or analytics behavior.
- Production `/creator/*` routes should continue resolving identity through `UserAuthResolver` plus creator ownership checks.
- Local/demo/test creator flow may keep `creator_session` compatibility until a future cleanup phase removes or renames the demo-only path.
- `creator_session` logout is not production account logout.

If a future implementation wants to retire `creator_session`, it must do so in a separate implementation phase with demo QA updates.

---

## 12. Reference Answer Boundary

Reference Answer whether to cut UserAuthResolver is independent and not part of Phase 77 runtime.

Rules:

- Reference Answer remains outside this production login/session runtime plan.
- Reference Answer is not cut over to `UserAuthResolver` by Phase 77.
- Reference Answer does not use profile eligibility by Phase 77.
- Reference Answer selected option memory remains JavaScript runtime memory only.
- Reference Answer runtime memory must still clear on `pagehide`.
- Reference Answer runtime memory must still clear on `pageshow` when `event.persisted === true`.
- Any future Reference Answer `UserAuthResolver` cutover must be a separate approved phase and must re-evaluate Design B, BFCache clearing, diagnostics, and Raw Option Linkage Ban.

---

## 13. Logs / Metrics / APM / Error Payload Boundary

Allowed future operational telemetry is limited to aggregate auth health that cannot reconstruct answer choices:

- aggregate login success/failure count.
- aggregate expired-session count.
- aggregate revoked-session count.
- aggregate CSRF rejection count.
- aggregate auth failure count by route class if it cannot link a user/session/request to selected option.

Forbidden:

- `user_id + poll_id + option_id`.
- `session_id + poll_id + option_index`.
- `request_id + user_id + option_text`.
- `device_id + poll_id + selected option`.
- `trace_id + selected answer payload`.
- `creator_session + selected option`.
- auth failure logs that include selected option, option text, option index, resolved `option_id`, or Reference Answer selected option data.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 14. Future Implementation Entry Criteria

A future implementation phase must specify:

1. Final credential transport and whether cookie, Bearer, or both are accepted.
2. Session table migration and rollback plan, if a table is used.
3. Cookie name, attributes, TTL, renewal rules, and revocation behavior.
4. Login submit API and UX.
5. Logout API and UX.
6. Expired and revoked credential API and UX.
7. CSRF and Origin checks.
8. XSS credential exposure controls.
9. `UserAuthResolver` / `trustedCredentialVerifier` source guard tests.
10. Production no-fallback tests for `X-User-Id`.
11. Production no-fallback tests for `creator_session`.
12. Reference Answer separation tests.
13. Logs / metrics / APM / error payload no-linkage tests.
14. Validation for Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, and counter schema.

Stop and report if implementation requires durable selected-option linkage, Reference Answer option storage, profile eligibility plus selected option linkage, `creator_session` production public identity, vote transaction order changes, vote token/counter schema changes, demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields.

---

## 15. Validation for Phase 77 Docs

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Docs guard: `tests/docs/phase-77-production-login-session-runtime-plan-doc.test.ts`

`design-drafts/` remains excluded from git and delivery scope.
