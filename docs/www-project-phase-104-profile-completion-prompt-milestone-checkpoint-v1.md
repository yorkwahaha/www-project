# WWW Project Phase 104 — Profile Completion Prompt Milestone Checkpoint v1

**Status:** milestone checkpoint and documentation only. Consolidates the stable profile completion prompt baseline delivered in Phases 101–103 as the reference point before Official Vote pre-vote eligibility UX work. **No runtime, frontend JS, API, DB schema, migration, `UserAuthResolver`, Official Vote, `vote-by-index`, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.**

**Baseline:** `origin/master` after Phase 103 profile completion prompt runtime review / hardening.

**Prior checkpoint:** [Phase 100 registration / login / profile milestone](./www-project-phase-100-registration-login-profile-milestone-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 104 records the completed profile completion prompt arc on top of the Phase 100 registration → login → profile setup baseline:

1. Phase 101 planned a neutral post-login profile completion prompt (docs/spec only).
2. Phase 102 implemented the minimal homepage prompt runtime through `profile-completion-prompt.js`.
3. Phase 103 reviewed and hardened the prompt runtime with focused guards and smoke static checks.

This checkpoint is the stable boundary reference before Official Vote pre-vote eligibility UX. It does not introduce new runtime behavior.

---

## 2. Phase 101–103 Delivery Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **101 (docs)** | Profile completion prompt plan — docs/spec only; signed-in users with `birth_year_month` or `residential_region` null may see a neutral prompt to `/profile`; does not guarantee eligibility; does not reveal eligibility determination details; excludes `/registration`, vote history, option linkage, and `/users/me` shape extension | **Complete (docs)** |
| **102** | Profile completion prompt runtime foundation — adds independent `profile-completion-prompt.js`; homepage-only mount after signed-in login-state read when `shouldReadLoginState(header)` is true; reads only `GET /users/me/profile` with `credentials: 'same-origin'`; shows neutral `/profile` link when either field is null; hides when both are set or user is anonymous; does not extend `GET /users/me` shape | **Complete** |
| **103** | Profile completion prompt runtime review / hardening — no runtime/API/schema/auth/vote gap found; added focused source guards and `smoke:public:local` static checks; confirmed non-blocking browse, no auto-redirect, no auto-vote, no eligibility recalculation/backfill, and no vote/registration/login-session/Reference Answer API calls from prompt runtime | **Complete** |

### 2.1 Phase references

- [Phase 101 profile completion prompt plan](./www-project-phase-101-profile-completion-prompt-plan-v1.md)
- [Phase 102 profile completion prompt runtime](./www-project-phase-102-profile-completion-prompt-runtime-v1.md)
- [Phase 103 profile completion prompt runtime review / hardening](./www-project-phase-103-profile-completion-prompt-runtime-review-v1.md)

---

## 3. Current Stable Prompt Flow

```text
Homepage visitor
  → shared chrome mountSiteChrome
  → if shouldReadLoginState(header) is false (e.g. /registration):
        no login-state read; no profile completion prompt
  → if pathname is not /:
        no profile completion prompt mount
  → if pathname is / and shouldReadLoginState(header) is true:
        GET /users/me (display_name only, shared chrome)
        if anonymous:
            no GET /users/me/profile; prompt hidden
        if signed in:
            GET /users/me/profile (credentials: same-origin)
            if birth_year_month === null OR residential_region === null:
                show neutral note + user-initiated /profile link
            else:
                hide prompt
```

`/registration` remains outside this flow:

- keeps `data-login-state-read="disabled"`
- does not read login state through shared chrome
- does not mount profile completion prompt logic

---

## 4. Fixed Boundaries After Phase 104

### 4.1 Identity and profile API

- `GET /users/me` returns only `user_id` and `display_name`.
- Shared chrome still displays only `display_name` from `GET /users/me`.
- `GET /users/me/profile` and `PUT /users/me/profile` are for profile setup/edit UI and profile completion prompt read only.
- Profile completion prompt checks only whether `birth_year_month` or `residential_region` is `null`.
- Profile completion prompt does not extend `GET /users/me` response shape.

### 4.2 Prompt display and behavior

- Profile completion prompt does not show eligibility yes/no outcomes.
- Profile completion prompt does not block general browsing.
- Profile completion prompt does not auto-redirect.
- Profile completion prompt does not auto-vote.
- Profile completion prompt does not recalculate existing vote eligibility.
- Profile completion prompt does not backfill historical eligibility.
- Prompt copy is neutral: some formal votes may require birth year/month and coarse residential region; completing profile data does not guarantee eligibility.

### 4.3 Registration and mount scope

- `/registration` keeps `data-login-state-read="disabled"`.
- `/registration` does not read login state and does not mount profile completion prompt.
- Current runtime mounts the prompt on homepage `/` only, behind `shouldReadLoginState(header)`.

### 4.4 Vote, eligibility, and analytics exclusion

- Official Vote eligibility is evaluated only at vote time by the existing vote-time evaluator.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.
- Raw Option Linkage Ban remains preserved.
- No new option choice + user/session/device/request/log/trace/metric/error payload linkage was added.
- No demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields were added.
- Profile completion prompt runtime does not call vote APIs, `POST /registration`, `POST /login/session`, `DELETE /login/session`, or Reference Answer APIs.

### 4.5 Non-production compatibility

- `creator_session` remains local/demo/test creator flow only and is not production user identity.
- explicit non-production `X-User-Id` compatibility remains limited to approved MVP/demo surfaces outside this prompt milestone.

### 4.6 Durable vote shapes unchanged

- Official Vote transaction order unchanged.
- `vote-by-index` eligibility remains before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.

---

## 5. Coverage Baseline

Representative tests and smoke checks consolidated by Phases 101–103:

| Area | Representative coverage |
|------|-------------------------|
| Prompt plan (docs) | `tests/docs/phase-101-profile-completion-prompt-plan-doc.test.ts` |
| Prompt runtime | `tests/frontend/profile-completion-prompt.test.ts`, `tests/frontend/phase-102-profile-completion-prompt-copy-guard.test.ts` |
| Prompt review / hardening | `tests/frontend/phase-103-profile-completion-prompt-runtime-guard.test.ts`, `tests/docs/phase-103-profile-completion-prompt-runtime-review-doc.test.ts` |
| Static asset route | `tests/http/frontend-page.test.ts` |
| Local smoke | `scripts/smoke-public-local.mjs` (layout homepage hook + prompt script static guards) |
| Prior profile baseline | Phase 100 coverage for `/profile`, `GET`/`PUT /users/me/profile`, registration/login boundaries |

---

## 6. Explicit Non-Changes

Phase 104 does not change:

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
