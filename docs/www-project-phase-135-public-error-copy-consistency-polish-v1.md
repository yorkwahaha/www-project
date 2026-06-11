# WWW Project Phase 135 — Public Error Copy Consistency Polish v1

**Status:** frontend UX polish — unified public error fallback copy, safe caught-error resolution, focused guard tests, docs, and README index.

**No runtime, API, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 134 auth / profile flow milestone review checkpoint.

**Prior checkpoint:** [Phase 134 auth / profile flow milestone review](./www-project-phase-134-auth-profile-flow-milestone-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 135 polishes public-page and creator demo/live flow error copy so visitors see consistent, neutral, actionable frontend-owned messages. It continues review conclusions from Phases 113–134 without reopening backend contracts or privacy boundaries.

Goals:

1. Unify load / submit / unavailable fallback copy across `/explore`, `/vote/:id`, `/results/:id`, `/my-polls?live=1`, `/login`, `/registration`, `/profile`, logout, homepage profile prompt, and creator lifecycle controls.
2. Stop catch handlers from echoing foreign `error.message` (network, backend, runtime).
3. Keep copy free of backend payloads, internal identifiers, vote outcomes, eligibility outcomes, and linkage hints.

User-visible catch handlers must not echo raw backend payloads to users.

User-visible catch handlers must not echo foreign `error.message` to users.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `resolvePublicErrorUserMessage`, shared poll load / submit allowlists.
- `public/frontend/explore-page.js` — load / empty copy punctuation consistency.
- `public/frontend/vote-page.js` — load / submit catch allowlists.
- `public/frontend/result-page.js` — load catch allowlist; unavailable copy punctuation.
- `public/frontend/my-polls-page.js` — load / sign-in / creator session failure copy.
- `public/frontend/registration-page.js`, `profile-page.js`, `profile-completion-prompt.js` (existing constants), `login-page.js`, `login-state-logout.js` — auth/profile failure boundaries.
- `public/frontend/poll-lifecycle-controls.js` — lifecycle transition catch allowlist; exported `CREATOR_SESSION_FAILURE`.
- `public/frontend/create-poll-page.js` — create failure catch allowlist.
- Focused frontend + doc tests.
- README Phase 135 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Creator ownership, lifecycle backend, vote evaluator, result evaluator.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. Copy rules

### 3.1 Must

- Use frontend-owned neutral copy for user-visible failures.
- Use `resolvePublicErrorUserMessage(error, fallback, allowedMessages)` in catch handlers that previously read `error.message` directly.
- Keep load-failure pattern consistent: `目前無法載入…，請稍後再試。`
- Keep unavailable pattern consistent: `問卷目前無法使用。` / lifecycle-specific shells where already defined.
- Preserve actionable hints where already present (login, profile, refresh) without guaranteeing vote eligibility.

### 3.2 Must not

- Echo raw backend payloads, API `message` fields, internal error codes, or stack traces to users.
- Echo foreign `error.message` from network/runtime/backend errors.
- Show `user_id`, session id, creator token, vote token, counter shard, or internal identifiers.
- Show vote counts, result previews, voter status, or eligibility status in error copy.
- Add eligibility judgment or display.

---

## 4. Surface summary

| Surface | Load failure | Submit / action failure | Unavailable / blocked |
|---------|--------------|-------------------------|------------------------|
| `/explore` | `EXPLORE_LOAD_FAILURE_MESSAGE` | `EXPLORE_LOAD_MORE_FAILURE_MESSAGE` | `EXPLORE_FEED_EMPTY_MESSAGE` |
| `/vote/:id` | `VOTE_PAGE_LOAD_FAILURE` + poll load allowlist | `GENERIC_VOTE_SUBMIT_FAILURE` + submit allowlist | `messageForPollVotingBlocked` |
| `/results/:id` | `RESULTS_LOAD_FAILURE_MESSAGE` | refresh deferred copy unchanged | `RESULTS_POLL_UNAVAILABLE_MESSAGE` + lifecycle shells |
| `/my-polls?live=1` | `MY_POLLS_LOAD_FAILURE_MESSAGE` | — | `MY_POLLS_SIGN_IN_REQUIRED_MESSAGE`, `CREATOR_SESSION_FAILURE` |
| `/registration` | — | `REGISTRATION_USER_ERROR_MESSAGES` | — |
| `/login` | — | `messageForLoginFailure` (unchanged) | verify-state failure copy unchanged |
| `/profile` | `PROFILE_LOAD_FAILURE_MESSAGE` | `PROFILE_SAVE_FAILURE_MESSAGE` | unauthenticated guidance unchanged |
| Logout | — | `LOGIN_LOGOUT_FAILURE_MESSAGE` | — |
| Homepage prompt | `PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE` | — | — |
| Creator lifecycle | — | `LIFECYCLE_USER_ERROR_MESSAGES` | — |

---

## 5. Privacy and integrity check

- Raw Option Linkage Ban preserved — no new durable user-option linkage.
- `/users/me` still `user_id` + `display_name` only; `/users/me/profile` still `birth_year_month` + `residential_region` only.
- `creator_session` remains non-production identity.
- Registration still does not auto-login, Set-Cookie, or read `/users/me`.
- Official Vote transaction order and vote-by-index eligibility-before-resolve unchanged.

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-135-public-error-copy-consistency-polish.test.ts`
- `tests/docs/phase-135-public-error-copy-consistency-polish-doc.test.ts`

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
