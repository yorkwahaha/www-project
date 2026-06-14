# WWW Project Phase 225 — Registration / Login / Profile Onboarding Navigation Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned registration → login → profile onboarding navigation copy after Phase 224 Home + Header/Auth-State onboarding copy runtime review checkpoint.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 224 Home + Header/Auth-State onboarding copy runtime review checkpoint (`85fe017`).

**Prior delivery:** [Phase 224 Home + Header/Auth-State onboarding copy runtime review checkpoint](./www-project-phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 225 implements the **minimal approved account-flow slice** from Phase 222-R for registration → login → profile onboarding navigation copy only. Changes are limited to frontend-owned constants, safe static HTML fallback copy, and JS mount-point sync.

Goals:

1. Centralize account onboarding navigation copy in `public-mvp-ui.js` (`PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`).
2. Align registration success copy: registration complete; login required next; no auto-login.
3. Align login copy for users arriving after registration; add login → profile next-step hint.
4. Align profile page lead and signed-in guidance: helps prepare for formal voting without eligibility guarantee.
5. Replace engineer-facing login banner/lead wording (`fail closed`, `401 AUTH_REQUIRED`) with user-facing copy.
6. Keep static HTML fallback and JS-mounted runtime copy consistent.

Registration success copy states 註冊不會自動登入 and directs users to `/login` with the same credential.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, banner/lead/hint constants.
- `public/frontend/registration-page.js` — `syncRegistrationPageBanner`, `syncRegistrationPageOnboardingCopy`.
- `public/frontend/login-page.js` — `syncLoginPageBanner`, `syncLoginOnboardingNavigationHints`, `syncLoginPageOnboardingCopy`.
- `public/frontend/profile-page.js` — `syncProfileSignedInGuidance`, `syncProfilePageOnboardingCopy`.
- `public/registration.html`, `public/login.html`, `public/profile.html` — static fallback + mount points.
- Focused frontend + doc tests.
- README Phase 225 index.

### 2.2 Out of scope

- Homepage, header/auth-state, vote, results, poll-creation, my-polls onboarding copy (other Phase 222-R slices).
- Backend, API contract, DB, migration, auth resolver.
- Vote transaction, eligibility evaluation, result visibility tiers.
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant / surface | Change |
|--------------------|--------|
| `PUBLIC_REGISTRATION_PAGE_BANNER_BODY` | User-facing registration banner |
| `PUBLIC_REGISTRATION_SUCCESS_MESSAGE` | Registration complete; go to login with same credential; no auto-login/session |
| `PUBLIC_LOGIN_PAGE_BANNER_BODY` | User-facing login banner; post-registration guidance; `會拒絕存取` |
| `PUBLIC_LOGIN_PAGE_LEAD_PRIMARY` | Supports users arriving after registration |
| `PUBLIC_LOGIN_PAGE_LEAD_SECONDARY` | `fail closed` / `401 AUTH_REQUIRED` → user-facing denial wording |
| `PUBLIC_LOGIN_FORM_REGISTRATION_CROSSLINK_*` | Registration crosslink with post-registration guidance |
| `PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT` | Login → profile next-step hint |
| `PUBLIC_PROFILE_PAGE_LEAD` | Profile helps prepare voting; no eligibility guarantee |
| `PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE` | Unauthenticated onboarding with registration → login path |
| `PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE` | Signed-in edit guidance without eligibility guarantee |
| `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` | New allowlist for account onboarding navigation copy |

Unchanged: `POST /login/session`, `POST /registration`, `GET`/`PUT /users/me/profile` payloads, auth redirects, `/users/me` shape, API call timing.

---

## 4. Boundaries preserved

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| Vote-by-index `{ option_index }` only | Unchanged |
| eligibility-before-option-resolve | Unchanged |
| Result visibility tiers | Unchanged |
| Registration auto-login / Set-Cookie | Unchanged |
| Registration `GET /users/me` after success | Unchanged — not called |
| Profile fields `birth_year_month` / `residential_region` only | Unchanged |
| `/users/me` `user_id` / `display_name` only | Unchanged |
| Creator session / lifecycle APIs | Unchanged |
| `quality_badge` presentation-only | Unchanged (`positive_feedback` → `回饋良好`) |

---

## 5. Guard tests

- `tests/frontend/phase-225-registration-login-profile-onboarding-navigation-copy-runtime.test.ts`
- `tests/docs/phase-225-registration-login-profile-onboarding-navigation-copy-runtime-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 225 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
