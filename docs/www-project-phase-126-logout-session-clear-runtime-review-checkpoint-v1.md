# WWW Project Phase 126 — Logout / Session Clear Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews logout and session-clear runtime in `login-state-logout.js`, `login-state-ui.js`, `login-state-read.js`, and adjacent public navigation chrome, building on Phase 84 frontend logout hook, Phase 83 login-state read, Phase 125 public navigation auth-state review, and Phase 124 login/registration runtime boundaries.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `DELETE /login/session` behavior, `GET /users/me` behavior, `GET /users/me/profile` behavior, `POST /registration` behavior, `POST /login/session` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 84 frontend logout UI hook and Phase 125 public navigation auth-state runtime review.

**Prior checkpoint:** [Phase 125 public navigation auth state runtime review](./www-project-phase-125-public-navigation-auth-state-runtime-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## Reviewed Surfaces

- `public/frontend/login-state-logout.js`
- `public/frontend/login-state-ui.js`
- `public/frontend/login-state-read.js`
- `public/frontend/public-mvp-layout.js`
- `public/registration.html`
- `public/frontend/profile-page.js` (unauthenticated boundary reference)
- `tests/frontend/login-state-logout.test.ts`
- `tests/frontend/phase-84-login-state-logout-copy-guard.test.ts`
- `tests/frontend/phase-125-public-navigation-auth-state-runtime-review-checkpoint.test.ts`

---

## Review Checkpoint Conclusion

Phase 126 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current logout and session-clear runtime remain within approved login-session, auth-state reset, and Raw Option Linkage Ban boundaries.

### 1. Logout entry uses formal login session boundary only

- Header logout is wired through `wireLoginStateLogout()` → `handleLoginStateLogout()` → `requestLogoutSession()`.
- `requestLogoutSession()` performs only `DELETE /login/session` with `credentials: 'same-origin'`.
- Logout runtime does not call `POST /login/session`, registration APIs, vote APIs, result APIs, or Reference Answer paths.

### 2. Header logout button calls `DELETE /login/session`

- Authenticated header indicator renders `.mvp-login-state-logout` beside `display_name`.
- Click handler invokes `requestLogoutSession()` against `/login/session` with method `DELETE`.
- Successful `204` or `ok` response is treated as session cleared.

### 3. Logout does not use or clear `creator_session`

- Logout modules do not call `/creator/session`, creator-session delete routes, or creator cookie helpers.
- `creator_session` remains local/demo/test creator flow only and is not production identity.
- Logout success resets header login-state UI only; it does not attempt to reconcile or impersonate creator-session identity.

### 4. Post-logout UI returns to anonymous / guest state

- `handleLoginStateLogout()` on success calls `applyLoginStateIndicator(mount, { status: LOGIN_STATE_ANONYMOUS })`.
- `syncAuthStateChipsForLoginRead(actions, false)` restores guest/demo chip visibility.
- Signed-in name span and logout button are removed from the header mount.

### 5. Post-logout UI does not expose internal identifiers

- Anonymous reset hides `#mvp-login-state`; no `display_name`, `user_id`, session id, creator token, or internal identifier remains in the header indicator.
- Logout failure messaging does not include backend identifiers or session tokens.

### 6. Auth state reset / reread uses neutral fallback

- `requestLogoutSession()` buckets transport and HTTP failures to `{ ok: false }` without parsing response JSON.
- `readLoginState()` after logout would return anonymous on `401`/`403`/non-OK responses; it does not echo backend `error` or `message` fields.
- Logout failure uses frontend-owned `LOGIN_LOGOUT_FAILURE_MESSAGE` via `showLoginStateLogoutError()`.

### 7. Logout failure copy is frontend-owned

- `LOGIN_LOGOUT_FAILURE_MESSAGE` is `目前無法登出，請稍後再試。`
- `handleLoginStateLogout()` does not surface API `error`, `message`, or raw payload text on failure.

### 8. `/users/me` response-shape boundary preserved

- Backend `GET /users/me` remains limited to `user_id` and `display_name`.
- Header auth read still consumes `display_name` only via `parseAuthenticatedMeBody()`.

### 9. `/registration` boundary preserved

- `registration.html` keeps `data-login-state-read="disabled"`.
- Registration does not auto-login and does not refresh signed-in header state via `/users/me`.

### 10. `/profile` unauthenticated boundary preserved

- Unauthenticated `mountProfilePage()` returns before profile form wiring.
- Unauthenticated profile path does not call `GET /users/me/profile`.

### 11. `X-User-Id` compatibility boundary preserved

- Logout runtime does not set `X-User-Id` headers.
- `X-User-Id` remains explicit non-production compatibility documented in static demo copy only.

### 12. No eligibility, vote-personal-state, or analytics linkage

- Logout runtime does not display or infer eligibility outcomes, vote status, voter status, demographic breakdown, ranking personalization, or result previews.
- Logout runtime does not write to logs, metrics, analytics, APM, or trace sinks.

### 13. No new observability linkage

- Phase 126 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between logout/session-clear flows and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Logout runtime does not read, store, or display `option_id`, vote tokens, counters, shards, or selected option state.
- Failure and reset states remain option-identity-free with respect to visitor identity.
- Backend error payloads are not echoed into logout copy.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- `DELETE /login/session`, `GET /users/me`, `GET /users/me/profile`, `POST /registration`, and `POST /login/session` behavior unchanged.
- Reference Answer remains disconnected from logout/session-clear runtime.

---

## Added Guard Coverage

- `tests/frontend/phase-126-logout-session-clear-runtime-review-checkpoint.test.ts`
  - confirms header logout calls `DELETE /login/session` only.
  - confirms successful logout resets header to anonymous/guest state without internal identifiers.
  - confirms logout failure uses frontend-owned neutral copy without backend payload echo.
  - confirms logout runtime avoids `creator_session`, vote/option paths, and observability sinks.
  - confirms preserved `/registration`, `/profile` unauthenticated, and `/users/me` boundaries.

- `tests/docs/phase-126-logout-session-clear-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved runtime/API/schema/auth logout boundaries and Raw Option Linkage Ban.

---

## Validation

Required validation for this phase:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
