# WWW Project Phase 100 — Registration / Login / Profile Milestone Checkpoint v1

**Status:** milestone checkpoint and documentation only. Consolidates the stable registration, login, and profile setup baseline delivered in Phases 89–99 as the reference point before the next delivery stage. **No runtime, frontend JS, API, DB schema, migration, `UserAuthResolver`, Official Vote, `vote-by-index`, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.**

**Baseline:** `origin/master` after Phase 99 profile setup UI runtime review / hardening.

---

## 1. Milestone Purpose

Phase 100 records the completed registration → login → profile setup arc:

1. production account registration through `POST /registration`
2. explicit login through `POST /login/session`
3. signed-in header state through `GET /users/me`
4. post-login profile setup/edit through `GET /profile` and `GET`/`PUT /users/me/profile`

This checkpoint is the stable boundary reference for later work. It does not introduce new runtime behavior.

---

## 2. Phase 89–99 Delivery Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **89** | Registration runtime foundation — verifier-backed `POST /registration` with JSON body limited to `display_name`, `birth_year_month`, `residential_region`; credential proof only via `Authorization: Bearer <proof>`; no session issuance, no `Set-Cookie`, no auto-login | **Complete** |
| **90** | Registration runtime review / hardening — reviewed Phase 89 parsing, verifier handling, duplicate/conflict behavior, and response/error bodies; added focused sensitive-field rejection tests; no runtime/API/schema behavior changed | **Complete** |
| **91 (docs)** | Minimal registration UI plan — docs/spec only; registration success must proceed to `/login`; no session or `Set-Cookie` | **Complete (docs)** |
| **92** | Minimal registration form runtime — `GET /registration` and `registration-page.js`; success clears credential proof and links to `/login`; does not call `/users/me` or `/login/session` | **Complete** |
| **93** | Registration UI hardening — `data-login-state-read="disabled"` on `/registration`; shared chrome does not mount login-state reader on registration page | **Complete** |
| **94** | Registration/login navigation copy polish — guest chip links to `/login`; registration CTA `/registration`; login CTA `/login`; copy states registration does not equal login | **Complete** |
| **95** | Full-flow smoke coverage — registration → login → `/users/me` → logout; registration does not auto-login; login shows `display_name`-only header; logout restores guest/demo chips | **Complete** |
| **96** | Registration runtime/profile boundary review — confirmed registration/login/profile separation; `/users/me` remains `user_id` + `display_name` only; Raw Option Linkage Ban preserved | **Complete** |
| **97 (docs)** | Minimal profile setup UI plan — only `birth_year_month` and coarse `residential_region`; excludes gender, exact birthday, address, precise location, extra profile fields | **Complete (docs)** |
| **98** | Minimal profile setup UI runtime — `GET /profile`; unauthenticated visitors guided to `/login` without profile API calls; signed-in users use same-origin `GET`/`PUT /users/me/profile` with two-field full-replacement PUT bodies | **Complete** |
| **99** | Profile setup UI runtime review / hardening — no runtime gap found; added focused profile guards and `smoke:public:local` static checks; shared chrome remains `display_name`-only | **Complete** |

### 2.1 Phase references

- [Phase 89 registration runtime foundation](./www-project-phase-89-registration-runtime-foundation-v1.md)
- [Phase 90 registration runtime review / hardening](./www-project-phase-90-registration-runtime-review-hardening-v1.md)
- [Phase 91 minimal registration UI plan](./www-project-phase-91-minimal-registration-ui-plan-v1.md)
- [Phase 92 minimal registration form runtime](./www-project-phase-92-minimal-registration-form-runtime-v1.md)
- [Phase 93 registration UI runtime review / hardening](./www-project-phase-93-registration-ui-runtime-review-hardening-v1.md)
- [Phase 94 registration/login navigation copy polish](./www-project-phase-94-registration-login-navigation-copy-polish-v1.md)
- [Phase 95 registration/login full-flow smoke coverage](./www-project-phase-95-registration-login-full-flow-smoke-coverage-v1.md)
- [Phase 96 registration runtime/profile boundary review](./www-project-phase-96-registration-runtime-profile-boundary-review-v1.md)
- [Phase 97 minimal profile setup UI plan](./www-project-phase-97-minimal-profile-setup-ui-plan-v1.md)
- [Phase 98 minimal profile setup UI runtime](./www-project-phase-98-minimal-profile-setup-ui-runtime-v1.md)
- [Phase 99 profile setup UI runtime review / hardening](./www-project-phase-99-profile-setup-ui-runtime-review-v1.md)

---

## 3. Current Stable Flow

```text
Guest
  → GET /registration
  → POST /registration
      body: display_name, birth_year_month, residential_region
      credential proof: Authorization: Bearer <proof>
      result: registered + login_required; no session; no Set-Cookie
  → GET /login
  → POST /login/session
      credential proof: Authorization: Bearer <proof>
      result: www_session cookie issued
  → GET /users/me
      response: user_id, display_name only
  → GET /profile (signed in)
  → GET /users/me/profile
  → PUT /users/me/profile
      body: birth_year_month, residential_region (nullable full replacement)
  → DELETE /login/session
      result: session revoked; cookie cleared
```

Unauthenticated `/profile` visitors:

- may trigger shared chrome `GET /users/me` for login-state display only
- see neutral copy and `/login` guidance
- do not call `GET /users/me/profile`
- do not mount editable profile form wiring

---

## 4. Fixed Boundaries After Phase 100

### 4.1 Identity and session

- `GET /users/me` returns only `user_id` and `display_name`.
- `GET /users/me/profile` and `PUT /users/me/profile` are for profile setup/edit UI only.
- Shared chrome uses `GET /users/me` for `display_name` only and must not call `GET /users/me/profile`.
- `POST /registration` does not issue a session, does not set `Set-Cookie`, and does not auto-login.
- `POST /login/session` is the only reviewed formal login session establishment boundary.
- `DELETE /login/session` only revokes the current valid session and clears the session cookie.

### 4.2 Registration and profile fields

- Registration JSON body remains exactly `display_name`, `birth_year_month`, and `residential_region`.
- Registration credential proof travels only as `Authorization: Bearer <proof>`.
- Profile setup/edit UI collects and writes only `birth_year_month` and coarse `residential_region`.
- Profile setup does not collect or display gender, exact birthday, address, precise location, extra profile fields, trust/role, session/token/cookie values, or vote/option data.

### 4.3 Vote, eligibility, and analytics exclusion

- Profile setup does not auto-submit votes, recalculate eligibility, or backfill historical eligibility.
- Official Vote eligibility is evaluated only at vote time by the existing vote-time evaluator.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.
- Raw Option Linkage Ban remains preserved.
- No new option choice + user/session/device/request/log/trace/metric/error payload linkage was added.
- No demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields were added.

### 4.4 Non-production compatibility

- `creator_session` remains local/demo/test creator flow only and is not production user identity.
- explicit non-production `X-User-Id` compatibility remains limited to approved MVP/demo surfaces outside this registration/login/profile milestone.

### 4.5 Durable vote shapes unchanged

- Official Vote transaction order unchanged.
- `vote-by-index` eligibility remains before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.

---

## 5. Coverage Baseline

Representative tests and smoke checks consolidated by Phases 89–99:

| Area | Representative coverage |
|------|-------------------------|
| Registration API | `tests/http/registration-routes.test.ts` |
| Login/session API | `tests/http/login-session-routes.test.ts` |
| `/users/me` API | `tests/http/user-me-routes.test.ts` |
| Profile API | `tests/http/user-profile-routes.test.ts` |
| Full flow | `tests/http/phase-95-registration-login-full-flow.test.ts`, `tests/frontend/phase-95-registration-login-full-flow.test.ts` |
| Registration UI | `tests/frontend/registration-page.test.ts`, `tests/frontend/phase-92-registration-form-copy-guard.test.ts` |
| Login UI | `tests/frontend/login-page.test.ts`, `tests/frontend/login-state-read.test.ts`, `tests/frontend/login-state-logout.test.ts` |
| Profile UI | `tests/frontend/profile-page.test.ts`, `tests/frontend/phase-98-profile-setup-copy-guard.test.ts`, `tests/frontend/phase-99-profile-setup-ui-runtime-guard.test.ts` |
| Boundary guards | `tests/frontend/phase-96-registration-runtime-profile-boundary-guard.test.ts` |
| Static routes / smoke | `tests/http/frontend-page.test.ts`, `scripts/smoke-public-local.mjs` |

---

## 6. Explicit Non-Changes

Phase 100 does not change:

- runtime or frontend JS behavior
- DB schema or migrations
- `POST /registration`
- `POST /login/session` or `DELETE /login/session`
- `UserAuthResolver`
- `GET /users/me` response shape
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior
- Official Vote transaction order
- `vote-by-index` eligibility before option resolve
- vote token schema or counter schema
- Reference Answer auth boundary

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

---

## 7. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
```

`design-drafts/` remains excluded from git and delivery scope.
