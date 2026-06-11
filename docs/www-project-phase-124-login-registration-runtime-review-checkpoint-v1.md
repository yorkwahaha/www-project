# WWW Project Phase 124 — Login / Registration Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews `/login` and `/registration` auth-shell runtime in `login-page.js`, `registration-page.js`, `login-state-read.js`, `login-state-ui.js`, `public-mvp-layout.js`, and adjacent HTML shells, building on Phase 95 registration/login full-flow coverage and Phase 100 milestone checkpoint boundaries.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `POST /registration` behavior, `POST /login/session` behavior, `GET /users/me` behavior, `GET /users/me/profile` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 95 registration/login full-flow smoke coverage and Phase 100 registration/login/profile milestone checkpoint.

**Prior checkpoint:** [Phase 123 profile page runtime review](./www-project-phase-123-profile-page-runtime-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## Reviewed Surfaces

- `public/frontend/registration-page.js`
- `public/frontend/login-page.js`
- `public/frontend/login-state-read.js`
- `public/frontend/login-state-ui.js`
- `public/frontend/public-mvp-layout.js`
- `public/registration.html`
- `public/login.html`
- `tests/frontend/phase-95-registration-login-full-flow.test.ts`
- `tests/frontend/phase-96-registration-runtime-profile-boundary-guard.test.ts`

---

## Review Checkpoint Conclusion

Phase 124 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current login/registration runtime remains within approved registration/login-session/profile-field and Raw Option Linkage Ban boundaries.

### 1. `/registration` does not auto-login

- `submitRegistrationRequest()` posts only to `POST /registration` and treats `201` as success.
- Registration runtime does not call `POST /login/session`.
- Success copy states registration does not auto-login (`註冊不會自動登入`) and directs visitors to `/login`.

### 2. `/registration` does not Set-Cookie

- Registration fetch uses `credentials: 'same-origin'` but does not read or set session cookies in frontend code.
- Registration success does not mount signed-in header state or call `mountLoginStateRead()`.

### 3. `/registration` does not refresh login state via `/users/me`

- `registration.html` sets `data-login-state-read="disabled"`.
- `public-mvp-layout.js` `shouldReadLoginState()` skips `mountLoginStateRead()` on registration.
- `registration-page.js` does not call `GET /users/me` or `readLoginState()`.

### 4. Registration request body boundary preserved

- `normalizeRegistrationFormInput()` builds profile payload with `display_name`, `birth_year_month`, and `residential_region` only.
- `submitRegistrationRequest()` sends `JSON.stringify(profile)` in the POST body.
- Production credential proof travels in the `Authorization: Bearer` header, not in the JSON body.
- No gender, exact birthday, street address, precise location, or extra profile fields are added.

### 5. `/login` is the formal session-establishment entry

- `submitProductionLoginCredential()` posts to `POST /login/session` with `credentials: 'same-origin'`.
- Login success clears the credential field and calls `mountLoginStateRead()` to refresh header state.
- Registration remains account/profile creation only; login remains session creation only.

### 6. Login success reads `/users/me` only after session creation

- `mountLoginStateRead()` calls `readLoginState()` → `GET /users/me` with `credentials: 'same-origin'`.
- `parseAuthenticatedMeBody()` consumes only `display_name` for UI.
- Login runtime does not call `GET /users/me/profile` during submit.

### 7. Profile API shape boundaries preserved

- Backend `GET /users/me` remains limited to `user_id` and `display_name`.
- Backend `GET /users/me/profile` and registration profile fields remain limited to `birth_year_month` and `residential_region`.

### 8. Failure handling — frontend-owned copy only

- `messageForRegistrationFailure()` maps registration failure reasons to frontend constants; `submitRegistrationRequest()` does not echo API `error` or `message` fields.
- `messageForLoginFailure()` maps login failure reasons to frontend constants; `submitProductionLoginCredential()` does not parse or surface backend payloads.
- Validation errors on registration use frontend-owned field messages only.

### 9. No eligibility inference or analytics linkage

- Login/registration runtime does not display or infer eligibility outcomes, vote history, demographic breakdown, or ranking personalization.
- Login/registration runtime does not call vote, result, Reference Answer, or explore display paths.

### 10. `creator_session` and `X-User-Id` boundaries preserved

- Login/registration submit paths do not use `creator_session` or creator-session APIs.
- `creator_session` remains local/demo/test creator flow only and is not production identity.
- `X-User-Id` remains explicit non-production compatibility for local demo vote/profile paths only; login/registration runtime does not set `X-User-Id` headers.

### 11. No new observability linkage

- Phase 124 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between login/registration flows and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Registration and login runtime do not read, store, or display `option_id`, vote tokens, counters, shards, or selected option state.
- Failure states remain option-identity-free with respect to visitor identity.
- Backend error payloads are not echoed into user-visible copy.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- `POST /registration` and `POST /login/session` behavior unchanged.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.

---

## Added Guard Coverage

- `tests/frontend/phase-124-login-registration-runtime-review-checkpoint.test.ts`
  - confirms registration does not auto-login, Set-Cookie, or call `/users/me`.
  - confirms registration POST body contains only approved profile fields.
  - confirms login posts to `/login/session` then refreshes state via `mountLoginStateRead()`.
  - confirms `readLoginState()` consumes `display_name` only from `GET /users/me`.
  - confirms frontend-owned failure copy without backend payload echo.
  - confirms login/registration runtime avoids vote/option paths, eligibility display, and observability sinks.

- `tests/docs/phase-124-login-registration-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved runtime/API/schema/auth registration/login boundaries and Raw Option Linkage Ban.

---

## Validation

Required validation for this phase:

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Optional when Docker Desktop Linux engine is available:

```text
npm run smoke:public:local
```

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
