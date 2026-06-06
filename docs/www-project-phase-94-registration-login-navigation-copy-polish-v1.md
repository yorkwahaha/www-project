# WWW Project Phase 94 — Registration / Login Navigation & Copy Polish v1

**Status:** frontend navigation and user-facing copy polish only. Clarifies the split between registration (account setup) and login (signed-in state) across homepage, header auth chips, auth banner, `/login`, and `/registration`. No backend auth/session behavior, `POST /registration`, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me` response shape, schema, Official Vote, `vote-by-index`, vote token, counter, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 92–93 registration form runtime and registration-page login-state-read opt-out.

---

## 1. Delivery

| Item | Path |
|------|------|
| Shared copy | `public/frontend/auth-state-copy.js` |
| Header/banner wiring | `public/frontend/public-mvp-layout.js` |
| Homepage note | `public/index.html` |
| Login page copy | `public/login.html` |
| Registration page copy | `public/registration.html` |
| Tests | `tests/frontend/phase-94-registration-login-nav.test.ts`, `tests/frontend/phase-94-registration-login-nav-copy-guard.test.ts` |

---

## 2. Navigation and Copy Behavior

- Guest header chip shows **未登入** and links to `/login`.
- Guest header primary CTA **註冊** links to `/registration`.
- Guest header secondary CTA **登入** links to `/login`.
- Auth banner explains: registration creates account data only; registration does not log the user in; after registration the user should go to `/login`; login controls signed-in header state.
- Auth banner includes explicit **註冊** and **登入** links.
- Homepage account note mirrors the same registration/login split.
- `/login` explains that users without an account should register first and links to `/registration`.
- `/registration` explains that registration does not create a session and links back to `/login`.
- `/registration` keeps `data-login-state-read="disabled"` so shared chrome does not call `GET /users/me`.

---

## 3. Privacy and Sensitive Field Exclusion

Polished copy must not display, log, or send to analytics:

- `user_id`, `birth_year_month`, `residential_region`, trust/role, vote history, poll/option data, session IDs, token digests, raw tokens, or cookie values.
- profile eligibility calculations paired with option choice.
- request/trace/device identifiers linked to option choice.

Registration still must not call `GET /users/me` or issue session/`Set-Cookie` after submit.

---

## 4. Boundaries Preserved

Phase 94 does not change:

- `POST /registration` backend behavior.
- `POST /login/session` or `DELETE /login/session`.
- `UserAuthResolver` or `GET /users/me` response shape.
- registration page login-state-read opt-out.
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
