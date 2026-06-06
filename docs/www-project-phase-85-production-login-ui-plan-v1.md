# WWW Project Phase 85 - Production Login UI Plan v1

**Status:** docs/spec only. No runtime behavior, frontend implementation, backend API behavior, migration, schema, `UserAuthResolver`, `GET /users/me` response shape, login-state read runtime, logout runtime, Official Vote, `vote-by-index`, vote token, counter, Reference Answer, profile eligibility, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 83 reads login state from `GET /users/me` and displays only `display_name`. Phase 84 adds a minimal logout hook that calls existing `DELETE /login/session`. Phase 85 plans the future production login form that may call existing `POST /login/session`.

---

## 1. Purpose

Phase 85 defines the minimum future production login UI contract. It does not implement the form.

The future UI should:

1. offer a clear production sign-in entry from the existing `/login` page or equivalent login surface.
2. submit only approved credential proof to existing `POST /login/session`.
3. rely on the server to issue the HttpOnly Secure SameSite `www_session` cookie.
4. refresh Phase 83 login state with `GET /users/me`.
5. display only `display_name` after authentication.
6. preserve Phase 84 logout behavior.

---

## 2. Minimal Form UX

The production login form should be small and explicit:

- Title: account sign-in for WWW Project.
- Credential fields: only the fields required by the approved production credential verifier.
- Submit control: a single primary submit button.
- Secondary action: a quiet return link to the public page the user came from, when available.
- No registration, password reset, profile editor, creator-session selector, or identity debugging panel in this phase.

Credential field examples are intentionally provider-dependent. If the configured verifier uses a first-party account proof, collect only that proof. If it uses a provider token exchange, the visible UI should trigger the provider flow instead of asking users to paste raw tokens.

The form must not ask for or accept:

- `user_id`.
- `X-User-Id`.
- `creator_session`.
- session ID.
- raw `www_session` cookie value.
- token digest.
- birth year-month.
- residential region.
- trust or role.
- poll ID, option ID, option text, or option index.

---

## 3. Submit Behavior

Future implementation should:

1. prevent double-submit while a request is in flight.
2. call `POST /login/session` with `credentials: 'same-origin'`.
3. send only the credential proof required by the configured trusted verifier.
4. rely on the browser to provide the request `Origin`.
5. rely on the server response `Set-Cookie` for `www_session`.
6. never read, display, copy, store, or log the cookie value.
7. treat non-201 responses as unauthenticated without exposing verifier details.

The UI must not store credentials, selected options, user identity, or session state in `localStorage`, `sessionStorage`, IndexedDB, URL parameters, readable cookies, hidden caches, service-worker caches, analytics queues, or history state.

---

## 4. Loading, Success, and Error States

### Loading

- Disable credential fields and submit button.
- Show neutral progress copy, such as `Signing in...`.
- Do not show credential values, account identifiers, request IDs, or backend error codes.

### Success

- On `201`, do not parse or display `expires_at` as user-facing session metadata unless separately approved.
- Immediately call `GET /users/me` with `credentials: 'same-origin'`.
- Use the Phase 83 display rule: show only `display_name`.
- Ignore `user_id` for UI display.
- Do not persist the `GET /users/me` response outside current JavaScript runtime state.
- Restore the intended return route only after the refreshed auth state succeeds or a bounded retry completes.

### Error

Use neutral, non-enumerating copy:

- Invalid or rejected credentials: `Sign-in failed. Check your credentials and try again.`
- Service unavailable or verifier unavailable: `Sign-in is unavailable right now. Please try again later.`
- Origin/CSRF rejection: `Sign-in could not be completed from this page. Reload and try again.`
- Network failure: `Network error. Please try again.`

Error UI must not reveal whether a user exists, whether a session exists, whether a credential was expired or revoked, whether an account is inactive, or whether a specific verifier rule failed.

---

## 5. Refreshing `GET /users/me` State

Successful login must integrate with Phase 83/84 state:

1. `POST /login/session` returns `201` and the browser receives `www_session`.
2. frontend calls `GET /users/me` with `credentials: 'same-origin'`.
3. if `GET /users/me` returns `200`, header state updates to signed-in and displays only `display_name`.
4. if `GET /users/me` returns `401` or fails, header state remains logged out and the form shows neutral retry copy.
5. Phase 84 logout remains the only logout control and continues to call existing `DELETE /login/session`.

The UI must never display `user_id` from `GET /users/me`. It may use the authenticated/unauthenticated result only to update visible login state.

---

## 6. CSRF and Origin Expectations

Existing backend behavior requires login session mutations to pass exact `Origin` validation.

Future UI must:

- be served from an allowed origin configured for login session mutations.
- use same-origin requests for `POST /login/session` and `DELETE /login/session`.
- use `credentials: 'same-origin'` so the browser can receive and later send `www_session`.
- not attempt to manually set, read, or serialize `www_session`.
- fail closed when the backend rejects the origin.

The UI must not introduce a separate client-side CSRF bypass, cross-origin login proxy, query-token login, or form action that sends credential proof to an unapproved origin.

---

## 7. Production vs Local/Demo/Test Separation

| Environment | Login UI behavior | Identity boundary |
|-------------|-------------------|-------------------|
| Production | Uses the approved credential verifier and existing `POST /login/session` | `UserAuthResolver` resolves from trusted verifier/session only |
| Local/demo | May continue explicit MVP `X-User-Id` compatibility for demo flows | Non-production only; never presented as production login |
| Test | May inject verifier fixtures or explicit test `X-User-Id` | Test configuration only |

Production UI must not:

- ask users to type `X-User-Id`.
- silently fall back to `X-User-Id`.
- use `creator_session` as public login identity.
- present local/demo identity as a real production account.

---

## 8. `creator_session` Separation

`creator_session` remains local/demo/test creator flow only.

Future production login UI must not:

- read `creator_session`.
- clear `creator_session` as part of public login success.
- use `creator_session` to satisfy `GET /users/me`.
- use `creator_session` for profile, Official Vote, `vote-by-index`, Reference Answer, or production creator ownership.
- show creator-session details in account state.

Production creator-owned routes continue to require `UserAuthResolver` plus ownership checks.

---

## 9. Accessibility and Mobile Requirements

Future implementation should satisfy:

- keyboard-operable fields, submit button, errors, and return link.
- visible focus states.
- labels programmatically associated with fields.
- `autocomplete` values only when appropriate for the approved credential type.
- status messages announced through an accessible live region.
- error copy adjacent to the form and not dependent on color alone.
- form layout usable on narrow mobile screens without horizontal scrolling.
- touch targets large enough for mobile use.
- copy short enough for Traditional Chinese and English variants without overlapping controls.

The UI should not use dense legal/security text inside the form. Security boundary details belong in docs, not in the submit surface.

---

## 10. Must Not Display or Leak

The production login UI and its error messages must not display, log, or send to analytics:

- `user_id`.
- `birth_year_month`.
- `residential_region`.
- trust or role.
- vote history.
- poll ID, option ID, option text, option index, selected answer payload, vote token, or counter shard.
- session ID.
- `token_sha256`.
- raw credential token.
- raw `www_session` cookie value.
- cookie attributes as account data.
- request ID, trace ID, device ID, or analytics ID linked to selected options.
- profile eligibility details paired with a selected option.

Do not add demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields.

---

## 11. Boundaries Preserved

Phase 85 does not change:

- `POST /login/session` behavior.
- `DELETE /login/session` behavior.
- `UserAuthResolver`.
- `GET /users/me` response shape.
- frontend login-state read runtime.
- frontend logout runtime.
- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary.
- profile eligibility behavior.
- `creator_session` local/demo/test creator flow separation.
- Raw Option Linkage Ban.

No option choice + user/session/device/request/log/trace/metric/error payload linkage is authorized.

---

## 12. Validation for This Docs Phase

```text
git diff --check
npm run typecheck
npm test
npm run build
```

`design-drafts/` remains excluded from git and delivery scope.
