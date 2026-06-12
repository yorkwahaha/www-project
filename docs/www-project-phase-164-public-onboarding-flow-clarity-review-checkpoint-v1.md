# WWW Project Phase 164 — Public Onboarding Flow Clarity Review & Guard Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits public onboarding flow clarity across registration, login, profile, homepage profile prompt, vote pre-vote UX, and header/nav CTAs without adding copy centralization or visual CSS polish.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 163 public frontend visual regression guard checkpoint (`18bc7af`).

**Prior checkpoint:** [Phase 163 public frontend visual regression guard checkpoint](./www-project-phase-163-public-frontend-visual-regression-guard-checkpoint-v1.md).

**Related milestones:** [Phase 134 auth profile flow milestone review checkpoint](./www-project-phase-134-auth-profile-flow-milestone-review-checkpoint-v1.md), [Phase 107 official vote pre-vote UX runtime guard](./www-project-phase-107-official-vote-pre-vote-ux-runtime-review-v1.md), [Phase 127 homepage profile prompt runtime review checkpoint](./www-project-phase-127-homepage-profile-prompt-runtime-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 164 reviews the public onboarding flow to confirm clarity and boundary preservation:

1. **Registration vs login:** `POST /registration` only; no `Set-Cookie`; no auto-login; no `GET /users/me`; success copy directs users to `/login`.
2. **Login session boundary:** `POST /login/session` creates the browser session; `GET /users/me` is used only by login-state read flows and exposes `display_name` only in UI.
3. **Profile edit boundary:** `/profile` is the only public surface that **saves** `birth_year_month` and `residential_region` via `PUT /users/me/profile`. Registration may collect initial profile fields at account creation via `POST /registration`, but does not establish a session or call profile edit APIs.
4. **Homepage prompt:** `mountProfileCompletionPrompt` runs only on `/` after `shouldReadLoginState(header)` succeeds; it reads `GET /users/me/profile` for null-field completeness only (no eligibility outcome fields).
5. **Vote pre-vote UX:** anonymous users see `/login` guidance without profile reads; authenticated incomplete-profile users see `/profile` guidance; complete-profile users see neutral submit copy only (no eligibility pass/fail disclosure).
6. **Header/nav/CTA consistency:** guest header chip, registration/login/profile shells, and homepage links keep `/login` and `/registration` CTAs aligned with shared `PUBLIC_*` / `AUTH_STATE_COPY` constants.

No new onboarding runtime polish was applied during this checkpoint review.

**Out of scope (unchanged):** copy centralization expansion; Phase 161–163 visual CSS polish; `policy-ui-placeholders.js` / `HELP_COPY` bodies; backend, API, DB, migration, auth resolver; new logs, metrics, analytics, tracking, or APM traces; `design-drafts/` commits.

---

## 2. Onboarding Flow Under Review

```text
/registration
  → POST /registration (account + initial profile fields)
  → data-login-state-read="disabled" (no GET /users/me)
  → success → href="/login" + PUBLIC_REGISTRATION_SUCCESS_MESSAGE

/login
  → POST /login/session
  → mountLoginStateRead → GET /users/me (display_name only in UI)

/profile
  → unauthenticated → login/registration CTAs (no profile API)
  → authenticated → GET/PUT /users/me/profile (birth_year_month + residential_region only)

/ (homepage)
  → shouldReadLoginState(header) → mountLoginStateRead
  → mountProfileCompletionPrompt (authenticated only)
  → GET /users/me/profile completeness → /profile CTA if incomplete

/vote/:id
  → mountOfficialVotePreVoteHint
  → anonymous → /login hint (no profile fetch)
  → profile-incomplete → /profile hint
  → profile-complete → neutral submit hint (no eligibility outcome)
```

---

## 3. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-164-public-onboarding-flow-clarity-review-checkpoint.test.ts` | Consolidated onboarding boundary and clarity guards |
| `tests/frontend/phase-134-auth-profile-flow-milestone-review-checkpoint.test.ts` | Auth/profile milestone guards (retained) |
| `tests/frontend/phase-107-official-vote-pre-vote-ux-runtime-guard.test.ts` | Pre-vote hint runtime guards (retained) |
| `tests/frontend/phase-127-homepage-profile-prompt-runtime-review-checkpoint.test.ts` | Homepage prompt guards (retained) |
| `tests/docs/phase-164-public-onboarding-flow-clarity-review-checkpoint-doc.test.ts` | Doc + README index guard |

---

## 4. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-164-public-onboarding-flow-clarity-review-checkpoint.test.ts`
- `tests/docs/phase-164-public-onboarding-flow-clarity-review-checkpoint-doc.test.ts`

---

## 5. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Onboarding flow review does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`. `/users/me` remains `user_id` + `display_name` only at the API layer with `display_name` only in UI. `/users/me/profile` remains `birth_year_month` + `residential_region` only for edit saves. Vote-by-index body remains `{ option_index }` only.
