# WWW Project Phase 217 — Login / Registration / Profile State Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned Login, Registration, and Profile account state messaging after Phase 214 plan, Phase 214-R review checkpoint, Phase 215 runtime, and Phase 216 review checkpoint.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 216 Explore / Vote / Results state copy runtime review checkpoint (`dd73a1f`).

**Prior delivery:** [Phase 216 Explore / Vote / Results state copy runtime review checkpoint](./www-project-phase-216-explore-vote-results-state-copy-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 217 implements the **minimal approved slice** from Phase 214-R for Login, Registration, and Profile state copy only. Changes are limited to frontend-owned constants and safe static text wiring.

Goals:

1. Centralize login / registration / profile loading, error, success-adjacent, and unauthenticated state copy in `public-mvp-ui.js`.
2. Wire `login-page.js`, `registration-page.js`, and `profile-page.js` to re-export shared constants.
3. Add `PUBLIC_AUTH_STATE_USER_MESSAGES` allowlist for auth/profile state copy guards.
4. Align profile unauthenticated copy to reference only `birth_year_month` / `residential_region` (出生年月與居住地區).
5. Align login origin failure wording with registration (`無法從目前頁面完成…`).
6. Preserve registration success-to-login boundary, auth flows, and profile field ceiling.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — auth/profile state copy constants and `PUBLIC_AUTH_STATE_USER_MESSAGES`.
- `public/frontend/login-page.js` — login form state copy re-exports.
- `public/frontend/registration-page.js` — registration form state copy re-exports.
- `public/frontend/profile-page.js` — profile load/save/unauthenticated state copy re-exports.
- `public/profile.html` — unauthenticated shell copy alignment.
- Focused frontend + doc tests.
- README Phase 217 index.

### 2.2 Out of scope

- Explore, vote, results, poll-creation, my-polls, homepage profile-completion prompt.
- Backend, API contract, DB, migration, auth resolver.
- Vote transaction, eligibility evaluation, result visibility tiers.
- `quality-feedback-badge.js` behavior changes.
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant | Change |
|----------|--------|
| `PUBLIC_LOGIN_FORM_LOADING_MESSAGE` | New shared login loading constant |
| `PUBLIC_LOGIN_FORM_*` | New shared login failure / verify-state constants |
| `PUBLIC_REGISTRATION_FORM_LOADING_MESSAGE` | New shared registration loading constant |
| `PUBLIC_REGISTRATION_FORM_*` and related failure constants | New shared registration state constants |
| `PUBLIC_PROFILE_FORM_SAVING_MESSAGE` | New shared profile save pending constant |
| `PUBLIC_PROFILE_VALIDATION_MESSAGE` | Centralized profile validation copy |
| `PUBLIC_LOGIN_FORM_ORIGIN_FAILURE_MESSAGE` | `無法從目前頁面完成登入，請重新整理後再試。` |
| `PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE` | References 出生年月與居住地區 only |
| `PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE` | References 出生年月與居住地區 only |
| `PUBLIC_AUTH_STATE_USER_MESSAGES` | New allowlist for login / registration / profile state copy |
| `PUBLIC_PENDING_USER_MESSAGES` | Uses shared login / registration / profile pending constants |

Unchanged: `POST /login/session`, `POST /registration`, `GET`/`PUT /users/me/profile` payloads, auth redirects, `PUBLIC_REGISTRATION_SUCCESS_MESSAGE`（註冊不會自動登入；請前往登入頁）, `/users/me` shape.

---

## 4. Boundaries preserved

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| Vote-by-index `{ option_index }` only | Unchanged |
| Result visibility tiers | Unchanged |
| Registration auto-login / Set-Cookie | Unchanged — success copy still requires login |
| Profile fields `birth_year_month` / `residential_region` only | Unchanged |
| `/users/me` `user_id` / `display_name` only | Unchanged |
| `quality_badge` presentation-only | Unchanged (`positive_feedback` → `回饋良好`) |

---

## 5. Guard tests

- `tests/frontend/phase-217-login-registration-profile-state-copy-runtime.test.ts`
- `tests/docs/phase-217-login-registration-profile-state-copy-runtime-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm test -- --runInBand
npm run typecheck
npm run build
npm run migrate:check
```

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 217 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
