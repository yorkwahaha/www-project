# WWW Project Phase 134 — Auth / Profile Flow Milestone Review Checkpoint v1

**Status:** milestone review checkpoint, focused guard tests, docs, and README index only. Consolidates auth and profile-flow review conclusions from Phases 123–127 (profile page, login/registration, public navigation auth state, logout/session clear, and homepage profile prompt runtime reviews) as the stable boundary reference for `/registration`, `/login`, `/profile`, header auth state, logout, and homepage profile completion prompt.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `POST /registration` behavior, `POST /login/session` behavior, `DELETE /login/session` behavior, `GET /users/me` behavior, `GET /users/me/profile` behavior, `PUT /users/me/profile` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 133 public participation / results flow milestone review checkpoint.

**Prior checkpoint:** [Phase 133 public participation / results flow milestone review](./www-project-phase-133-public-participation-results-flow-milestone-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 134 records the completed auth / profile flow review arc across registration, login, profile editing, header auth state, logout, and homepage profile prompt surfaces:

1. Phase 123 reviewed `/profile` runtime with no auth, profile-field, eligibility, or linkage gap found.
2. Phase 124 reviewed `/registration` and `/login` runtime with no registration/login-session boundary gap found.
3. Phase 125 reviewed public navigation / header auth state with no session or identifier leakage gap found.
4. Phase 126 reviewed logout / session clear with no creator_session conflation gap found.
5. Phase 127 reviewed homepage profile completion prompt with no completeness/eligibility conflation gap found.

This checkpoint confirms the auth / profile flow as a whole currently has no auth, session, profile-field, eligibility, privacy, or Raw Option Linkage Ban gap requiring a runtime, API, schema, auth, vote-backend, or result-evaluator patch.

---

## 2. Phase 123–127 Delivery Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **123 (checkpoint)** | Profile page runtime review — unauthenticated no form/no profile API; authenticated `GET`/`PUT /users/me/profile` with two nullable fields only; neutral failure copy | **Complete** |
| **124 (checkpoint)** | Login/registration runtime review — registration no auto-login/Set-Cookie/`GET /users/me`; login `POST /login/session` then header `GET /users/me`; registration body allowlist | **Complete** |
| **125 (checkpoint)** | Public navigation auth state review — guest chip + login/registration CTAs; signed-in `display_name` only; `GET /users/me` reader only; registration login-state-read opt-out | **Complete** |
| **126 (checkpoint)** | Logout/session clear review — `DELETE /login/session` only; post-logout anonymous UI; no `creator_session` use/clear | **Complete** |
| **127 (checkpoint)** | Homepage profile prompt review — homepage-only mount; anonymous no profile API; null-check completeness only; no vote guarantee | **Complete** |

### 2.1 Phase references

- [Phase 123 profile page runtime review checkpoint](./www-project-phase-123-profile-page-runtime-review-checkpoint-v1.md)
- [Phase 124 login/registration runtime review checkpoint](./www-project-phase-124-login-registration-runtime-review-checkpoint-v1.md)
- [Phase 125 public navigation auth state runtime review checkpoint](./www-project-phase-125-public-navigation-auth-state-runtime-review-checkpoint-v1.md)
- [Phase 126 logout/session clear runtime review checkpoint](./www-project-phase-126-logout-session-clear-runtime-review-checkpoint-v1.md)
- [Phase 127 homepage profile prompt runtime review checkpoint](./www-project-phase-127-homepage-profile-prompt-runtime-review-checkpoint-v1.md)

---

## 3. Current Stable Auth / Profile Flow

```text
/registration
  → data-login-state-read="disabled" (no header GET /users/me)
  → POST /registration body: display_name, birth_year_month, residential_region
  → credential in Authorization header only
  → no POST /login/session, no Set-Cookie, no auto-login
  → success directs to /login

/login
  → POST /login/session (formal session establishment)
  → mountLoginStateRead → GET /users/me → display_name in header only

Header auth state
  → readLoginState → GET /users/me only
  → guest: 未登入 chip + /login + /registration CTAs
  → signed-in: display_name + logout button only

Logout
  → DELETE /login/session only
  → applyLoginStateIndicator anonymous reset
  → does not use or clear creator_session

/profile
  → readLoginState first
  → unauthenticated: login guidance only; no GET /users/me/profile; no form wiring
  → authenticated: GET /users/me/profile + PUT /users/me/profile
  → fields: birth_year_month, residential_region (nullable)

Homepage / only
  → mountProfileCompletionPrompt after signed-in login-state read
  → anonymous: no GET /users/me/profile
  → signed-in: GET /users/me/profile null checks only
  → incomplete → neutral /profile CTA; no eligibility guarantee
```

Formal voter session (`www_session` via `POST /login/session`) and creator session (`creator_session`) remain separate boundaries.

---

## 4. Milestone Review Checkpoint Conclusion

Phase 134 found **no overall auth / profile-flow gap** requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

### 4.1 `/registration` does not auto-login

- `submitRegistrationRequest()` posts only to `POST /registration`.
- Registration runtime does not call `POST /login/session`.
- Success copy directs visitors to `/login`.

### 4.2 `/registration` does not Set-Cookie

- Registration success does not mount signed-in header state or call `mountLoginStateRead()`.
- Frontend does not treat registration response as session establishment.

### 4.3 `/registration` does not call `/users/me`

- `registration.html` sets `data-login-state-read="disabled"`.
- `shouldReadLoginState()` skips header auth read on registration.
- `registration-page.js` does not call `readLoginState()` or `GET /users/me`.

### 4.4 Registration success still requires `/login`

- Success UI and copy guide visitors to `/login` for session establishment.
- Registration remains account/profile creation only.

### 4.5 Registration request body contains only `display_name`, `birth_year_month`, `residential_region`

- `normalizeRegistrationFormInput()` builds the allowlisted profile payload only.
- Credential proof travels in `Authorization: Bearer`, not in the JSON body.
- No gender, exact birthday, address, precise location, or extra profile fields.

### 4.6 `/login` is the formal login session establishment entry

- `submitProductionLoginCredential()` posts to `POST /login/session`.
- Login success calls `mountLoginStateRead()` to refresh header state.

### 4.7 `POST /login/session` is the formal login/session creation boundary

- Production browser session is created only through the login path.
- Registration does not create `www_session`.

### 4.8 Login success reads `/users/me` only after session creation

- `mountLoginStateRead()` → `readLoginState()` → `GET /users/me`.
- Login submit path does not call `GET /users/me/profile`.

### 4.9 Header auth state reads `GET /users/me` only

- `readLoginState()` performs a single `GET /users/me` with `credentials: 'same-origin'`.
- Header auth runtime does not call profile, vote, result, or Reference Answer APIs during auth read.

### 4.10 Signed-in header shows `display_name` only

- `parseAuthenticatedMeBody()` consumes only `display_name` for UI.
- `user_id` from `GET /users/me` is not written into header DOM.

### 4.11 Header does not show `user_id`, session id, creator token, or internal identifiers

- Header modules do not render session ids, vote tokens, shard ids, or creator tokens.
- Demo nav mock labels are explicit non-production presentation only.

### 4.12 Logout calls `DELETE /login/session` only

- `requestLogoutSession()` performs only `DELETE /login/session` with `credentials: 'same-origin'`.
- Logout does not call registration, vote, result, or Reference Answer APIs.

### 4.13 Post-logout UI returns to anonymous / guest state

- `handleLoginStateLogout()` resets header to anonymous indicator on success.
- Signed-in name span and logout button are removed.

### 4.14 Logout does not use, clear, or depend on `creator_session` as production identity

- Logout modules do not call `/creator/session` or creator cookie helpers.
- `creator_session` remains local/demo/test creator flow only.

### 4.15 `/profile` unauthenticated — no profile form mount

- `mountProfilePage()` returns before `wireProfileForm()` when not authenticated.
- Unauthenticated shell shows login guidance only.

### 4.16 `/profile` unauthenticated — no `GET /users/me/profile`

- Unauthenticated path does not call `loadUserProfile()` or `saveUserProfile()`.

### 4.17 `/profile` authenticated — reads `GET /users/me` and `GET /users/me/profile` only

- Auth probe via `readLoginState()` → `GET /users/me`.
- Profile load via `loadUserProfile()` → `GET /users/me/profile`.
- Profile save via `saveUserProfile()` → `PUT /users/me/profile`.

### 4.18 `GET /users/me` returns only `user_id` and `display_name`

- Backend response shape unchanged.
- UI consumes `display_name` only for chrome and profile shell context.

### 4.19 `GET /users/me/profile` contains only `birth_year_month` and `residential_region`

- Profile parsers read only those two nullable fields.
- Extra profile fields and eligibility outcomes are not parsed for display.

### 4.20 `PUT /users/me/profile` sends only `birth_year_month` and `residential_region`

- `saveUserProfile()` PUT body is `{ birth_year_month, residential_region }` only.
- `normalizeProfileFormInput()` allows empty fields to become `null`.

### 4.21 `birth_year_month` / `residential_region` allow null

- Nullable values are valid profile states.
- Empty form fields normalize to `null`.

### 4.22 No gender, exact birthday, address, precise location, or extra profile fields

- Registration, profile page, and prompt runtime avoid forbidden extra profile fields.
- No demographic breakdown fields are added.

### 4.23 Homepage profile prompt mounts on homepage only

- `mountProfileCompletionPrompt()` runs only when `pathname === '/'` or `pathname === ''` and `shouldReadLoginState(header)` is true.
- Other routes skip the prompt hook.

### 4.24 Homepage profile prompt — anonymous path does not call `/users/me/profile`

- Anonymous visitors return `{ status: 'anonymous' }` without profile API reads.

### 4.25 Profile completeness checks only `birth_year_month` / `residential_region` nullness

- `isProfileIncomplete()` returns true only when either field is `null`.
- Completeness does not evaluate eligibility outcomes.

### 4.26 Profile completeness does not equal eligibility

- Prompt and profile runtime do not infer `can_vote`, `age_passed`, `region_passed`, or equivalent outcomes.
- Official Vote eligibility remains vote-time evaluator authority only.

### 4.27 No `can_vote`, `age_passed`, `region_passed`, or eligibility judgment display

- Auth/profile surfaces do not show pass/fail eligibility badges or vote guarantees.

### 4.28 Profile prompt copy does not guarantee voting

- `PROFILE_COMPLETION_PROMPT_MESSAGE` states completeness does not mean eligible or ineligible.
- Copy does not say the visitor can vote or will pass eligibility.

### 4.29 Error handling uses frontend neutral fallback without echoing backend payload or raw `error.message`

- Registration: `messageForRegistrationFailure()` mapped constants.
- Login: `messageForLoginFailure()` mapped constants.
- Profile: `messageForProfileFailure()` mapped constants.
- Logout: `LOGIN_LOGOUT_FAILURE_MESSAGE`.
- Prompt: `PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE`.
- Auth read failures bucket to anonymous state without payload echo.

### 4.30 `creator_session` boundary unchanged — not production identity

- Auth/profile runtime does not use `creator_session` for production user identity.
- `creator_session` remains local/demo/test creator flow only.

### 4.31 `X-User-Id` remains explicit non-production compatibility only

- Registration, login, profile, header, logout, and prompt submit/read paths do not set `X-User-Id` headers.
- Non-production `X-User-Id` compatibility remains on other approved MVP/demo paths only.

### 4.32 Raw Option Linkage Ban preserved

- Auth/profile runtime does not read, store, or transmit option choices with user/session/device/request identifiers.
- Profile completeness is not linked to poll options or vote intent.

### 4.33 No demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields

- Auth/profile surfaces avoid demographic, analytics, ranking-personalization, and extra profile-field reads.

### 4.34 Reference Answer remains disconnected from UserAuthResolver and profile eligibility

- Auth/profile runtime does not import Reference Answer modules.

### 4.35 No new observability linkage

- Phase 134 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## 5. Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between auth/profile-flow runtime and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Registration and profile fields remain identity/setup data only; they do not bind to poll option choices.
- Header auth, logout, and profile prompt do not reconstruct which option a user selected.
- Phase 134 review adds docs/tests only; no new option-user linkage paths were introduced.

---

## 6. Coverage Baseline

Representative tests consolidated by Phases 123–127:

| Area | Representative coverage |
|------|-------------------------|
| Profile page review | `tests/frontend/phase-123-profile-page-runtime-review-checkpoint.test.ts`, `tests/docs/phase-123-profile-page-runtime-review-checkpoint-doc.test.ts` |
| Login/registration review | `tests/frontend/phase-124-login-registration-runtime-review-checkpoint.test.ts`, `tests/docs/phase-124-login-registration-runtime-review-checkpoint-doc.test.ts` |
| Header auth state review | `tests/frontend/phase-125-public-navigation-auth-state-runtime-review-checkpoint.test.ts`, `tests/docs/phase-125-public-navigation-auth-state-runtime-review-checkpoint-doc.test.ts` |
| Logout/session clear review | `tests/frontend/phase-126-logout-session-clear-runtime-review-checkpoint.test.ts`, `tests/docs/phase-126-logout-session-clear-runtime-review-checkpoint-doc.test.ts` |
| Homepage profile prompt review | `tests/frontend/phase-127-homepage-profile-prompt-runtime-review-checkpoint.test.ts`, `tests/docs/phase-127-homepage-profile-prompt-runtime-review-checkpoint-doc.test.ts` |
| Milestone guard (this phase) | `tests/frontend/phase-134-auth-profile-flow-milestone-review-checkpoint.test.ts`, `tests/docs/phase-134-auth-profile-flow-milestone-review-checkpoint-doc.test.ts` |
| Local smoke | `scripts/smoke-public-local.mjs` |

---

## 7. Explicit Non-Changes

Phase 134 does not change:

- runtime or frontend JS behavior
- DB schema or migrations
- backend API routes or handlers
- auth resolver or session schema
- `POST /registration`, `POST /login/session`, `DELETE /login/session` backend behavior
- `GET /users/me` or `GET`/`PUT /users/me/profile` backend behavior
- vote evaluator or result evaluator
- Official Vote transaction order
- `vote-by-index` eligibility before option resolve
- Reference Answer auth boundary
- `creator_session` local/demo boundary

---

## 8. Validation

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

## 9. Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
