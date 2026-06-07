# WWW Project Phase 103 — Profile Completion Prompt Runtime Review / Hardening v1

**Status:** review, focused guard tests, local smoke coverage, and documentation only. Reviewed `public/frontend/profile-completion-prompt.js`, homepage hook in `public/frontend/public-mvp-layout.js`, `public/frontend/public-mvp.css`, `src/http/server.ts` static asset route for `/frontend/profile-completion-prompt.js`, Phase 102 prompt tests/docs, and `smoke:public:local` static checks. **No runtime, API, or schema behavior changed.**

**Baseline:** Phase 102 profile completion prompt runtime. Phase 101 profile completion prompt plan. Phase 98–99 post-login `/profile` editing baseline.

---

## 1. Review Conclusion

No runtime, API, or schema defect requiring a behavior change was found.

Confirmed boundaries:

### 1.1 Homepage-only signed-in mount

- `public-mvp-layout.js` calls `mountProfileCompletionPrompt` only when `shouldReadLoginState(header)` is true **and** `pathname === '/' || pathname === ''`.
- Anonymous visitors return `{ status: 'anonymous' }` from `mountProfileCompletionPrompt` before any profile API call.
- `/registration` keeps `data-login-state-read="disabled"`, so shared chrome does not mount login-state read and does not reach the homepage prompt hook.
- Other routes (for example `/profile`, `/login`, `/explore`) load shared chrome but skip the prompt because pathname is not `/`.

### 1.2 Profile read boundary

- Signed-in prompt logic calls **only** `GET /users/me/profile` with `credentials: 'same-origin'` and `cache: 'no-store'`.
- Completeness uses only whether `birth_year_month` or `residential_region` is `null`.
- The module does not read `user_id`, vote history, option choice, device/session/request identifiers, or eligibility evaluator output.

### 1.3 Display and copy boundary

- Prompt renders when either field is `null`; clears when both are non-null strings.
- Copy is neutral: explains that some formal votes may require birth year/month and coarse residential region; invites review on `/profile`.
- Copy does not say the user is eligible or ineligible.
- Load failure shows neutral retry copy only; no error codes, session/token/cookie values, or eligibility traces.
- UI is a non-blocking `role="note"` aside with a user-initiated `/profile` link; no modal overlay, no `window.location` redirect, no auto-submit.

### 1.4 Behavior boundary

Profile completion prompt does not:

- block general browsing.
- auto-redirect or auto-vote.
- recalculate or backfill Official Vote eligibility.
- call vote APIs, `POST /registration`, `POST /login/session`, `DELETE /login/session`, or Reference Answer APIs.

Official Vote eligibility remains vote-time evaluator authority only.

### 1.5 Shared chrome boundary

- Header login-state readers still call `GET /users/me` for `display_name` only.
- `GET /users/me` shape remains `user_id` and `display_name` only.
- `birth_year_month` and `residential_region` are not surfaced through shared chrome chips, banners, or login-state UI.
- Profile completeness lives only in `profile-completion-prompt.js`, not in `login-state-read.js` or `login-state-ui.js`.

---

## 2. Hardening Applied

Phase 103 adds focused source guards and `smoke:public:local` static checks for:

- anonymous gating before `GET /users/me/profile`.
- homepage-only `mountProfileCompletionPrompt` hook behind `shouldReadLoginState`.
- `/registration` login-state-read opt-out remaining intact.
- same-origin `GET /users/me/profile` with two-field null completeness only.
- separation from registration/login/session/vote/reference paths and forbidden copy.
- login-state/shared-chrome sources remaining free of profile-field leakage into header display.

No frontend runtime logic was changed in this phase.

---

## 3. Privacy and Integrity Boundaries

Unchanged:

- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- `creator_session` remains separate local/demo/test creator flow only.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.
- Raw Option Linkage Ban remains preserved.
- No demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields were added.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

---

## 4. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` remains excluded from git and delivery scope.
