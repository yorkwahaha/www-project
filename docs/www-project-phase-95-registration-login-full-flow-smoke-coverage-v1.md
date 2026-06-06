# WWW Project Phase 95 — Registration / Login Full Flow Smoke Coverage v1

**Status:** tests, documentation, and local smoke coverage only. Adds frontend unit coverage, HTTP flow coverage, and `smoke:public:local` checks for the registration/login split established in Phases 92–94. No backend auth/session behavior, `POST /registration`, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me` response shape, schema, Official Vote, `vote-by-index`, vote token, counter, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 94 registration/login navigation & copy polish.

---

## 1. Delivery

| Item | Path |
|------|------|
| Frontend full-flow tests | `tests/frontend/phase-95-registration-login-full-flow.test.ts` |
| HTTP full-flow tests | `tests/http/phase-95-registration-login-full-flow.test.ts` |
| Static route smoke assertions | `tests/http/frontend-page.test.ts` |
| Local public smoke script | `scripts/smoke-public-local.mjs` |
| Phase doc test | `tests/docs/phase-95-registration-login-full-flow-smoke-coverage-doc.test.ts` |

---

## 2. Covered Flow Scenarios

### 2.1 Guest homepage auth navigation

- Guest chip **未登入** links to `/login`.
- Header primary CTA **註冊** links to `/registration`.
- Header secondary CTA **登入** links to `/login`.
- Auth banner and homepage note explain: registration does not auto-login; after registration go to `/login`; login controls signed-in header state.

### 2.2 `/registration` does not call `GET /users/me`

- `data-login-state-read="disabled"` remains on the registration header.
- Shared chrome honors the opt-out and does not mount the login-state reader.
- Registration runtime does not call `GET /users/me`, `POST /login/session`, or read `Set-Cookie`.

### 2.3 Registration success routes to login only

- `POST /registration` success clears credential proof input.
- Success copy and CTA guide users to `/login`.
- No `POST /login/session`, no `GET /users/me`, no signed-in header state.

### 2.4 `/login` success refreshes `GET /users/me`

- `POST /login/session` success triggers login-state refresh via `GET /users/me`.
- Header shows `display_name` only.
- No `user_id`, session, token, cookie, `birth_year_month`, `residential_region`, or vote/option data in UI copy.

### 2.5 Logout restores guest/demo chips

- `DELETE /login/session` success hides signed-in UI.
- Guest/demo auth chips return.
- Failure copy stays neutral and does not expose technical details.

---

## 3. Smoke Script Additions

`npm run smoke:public:local` now also checks:

- homepage, `/registration`, and `/login` HTML markers for the auth navigation split.
- registration/login frontend assets avoid forbidden session/profile linkage calls in static source checks.
- API flow with local verifier config: `POST /registration` → anonymous `GET /users/me` → `POST /login/session` → persisted active session + registered `display_name` in PostgreSQL → `DELETE /login/session` → anonymous `GET /users/me`.

`smoke:public:local` keeps `APP_ENV=test` so existing `creator_session` and `X-User-Id` vote smoke paths remain available. Session-cookie `GET /users/me` after login is covered by `tests/http/phase-95-registration-login-full-flow.test.ts`; smoke verifies the persisted session row and registered `display_name` instead.

Smoke uses isolated fake credential fixtures only. It does not change production verifier configuration.

---

## 4. Boundaries Preserved

Phase 95 does not change:

- DB schema or migrations.
- `POST /registration` backend behavior.
- `POST /login/session` or `DELETE /login/session`.
- `UserAuthResolver` or `GET /users/me` response shape.
- registration page login-state-read opt-out removal.
- Official Vote transaction order or `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary and profile eligibility exclusion.
- `creator_session` local/demo/test creator flow separation.
- Raw Option Linkage Ban.

---

## 5. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` remains excluded from git and delivery scope.
