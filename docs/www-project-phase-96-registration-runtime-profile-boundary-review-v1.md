# WWW Project Phase 96 - Registration Runtime/Profile Boundary Review v1

**Status:** review, documentation, and focused guard tests only. Reviewed the Phase 89-95 registration/login/profile flow across `POST /registration`, `POST /login/session`, `DELETE /login/session`, `GET /users/me`, `/registration` frontend runtime, `/login` frontend runtime, login-state read/logout UI, and `smoke:public:local` coverage. No runtime/API/schema behavior changed.

---

## 1. Review Conclusion

No runtime, API, or schema defect requiring a behavior change was found.

Confirmed boundaries:

- `POST /registration` creates the registered user/profile row only and returns `{ registered: true, login_required: true }`.
- `POST /registration` does not issue a session and does not set `Set-Cookie`.
- `/registration` keeps `data-login-state-read="disabled"` and does not mount the shared login-state reader.
- `registration-page.js` does not call `GET /users/me`, does not call `POST /login/session`, and does not read `Set-Cookie`.
- registration credential proof is sent only as `Authorization: Bearer <proof>`.
- registration JSON body remains exactly `display_name`, `birth_year_month`, and `residential_region`.
- successful registration still requires the user to complete the existing `/login` flow.
- `POST /login/session` is the only reviewed path that issues `www_session`.
- `DELETE /login/session` only revokes the current valid session by digest and clears the session cookie.
- `GET /users/me` remains limited to `user_id` and `display_name`.

---

## 2. Profile and Response Boundary

`GET /users/me` must not expose:

- `birth_year_month`
- `residential_region`
- trust or role fields
- session IDs
- `token_sha256`
- raw tokens
- cookie values
- vote, poll, option, shard, or eligibility data

The separate `/users/me/profile` route remains the profile route for `birth_year_month` and coarse `residential_region`. This review did not change profile storage, profile update behavior, or profile eligibility behavior.

---

## 3. Error, Logging, and Observability Boundary

Reviewed registration, login, logout, `/users/me`, frontend copy guards, and smoke coverage for sensitive payload exposure.

No new logs, metrics, debug payloads, analytics, APM traces, or error payloads were added. Existing neutral error responses do not echo raw token values, `token_sha256`, cookie values, credential proof, profile eligibility details, or option-choice data.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 4. Fixed Boundaries Preserved

Phase 96 does not change:

- DB schema or migrations.
- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer isolation from `UserAuthResolver` and profile eligibility.
- `creator_session` local/demo/test creator-flow role.
- explicit non-production `X-User-Id` compatibility.
- ranking, demographic breakdowns, analytics linkage, precise location, exact birthday, gender, address, or extra profile fields.

Raw Option Linkage Ban remains preserved. Phase 96 adds no option choice + user/session/device/request/log/trace/metric/error payload linkage.

---

## 5. Coverage Reviewed / Added

Reviewed existing coverage:

- `tests/http/registration-routes.test.ts`
- `tests/http/login-session-routes.test.ts`
- `tests/http/user-me-routes.test.ts`
- `tests/http/phase-95-registration-login-full-flow.test.ts`
- `tests/frontend/registration-page.test.ts`
- `tests/frontend/login-page.test.ts`
- `tests/frontend/login-state-read.test.ts`
- `tests/frontend/login-state-logout.test.ts`
- `tests/frontend/phase-95-registration-login-full-flow.test.ts`
- `scripts/smoke-public-local.mjs`

Added focused Phase 96 guards:

- `tests/frontend/phase-96-registration-runtime-profile-boundary-guard.test.ts`
- `tests/docs/phase-96-registration-runtime-profile-boundary-review-doc.test.ts`

Validation:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` remains excluded from git and delivery scope.
