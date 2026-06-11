# WWW Project Phase 137 — Public Loading / Pending State UX Polish v1

**Status:** frontend UX polish — unified public loading / pending / submitting states, safe frontend-owned copy, focused guard tests, docs, and README index.

**No runtime, API, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 136 public error copy runtime review checkpoint.

**Prior checkpoint:** [Phase 136 public error copy runtime review](./www-project-phase-136-public-error-copy-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 137 polishes public-page loading, pending, and submitting UX so visitors see consistent, safe, frontend-owned feedback while actions are in flight. It continues Phase 135 error-copy boundaries without reopening backend contracts or privacy rules.

Goals:

1. Disable submit / action buttons while pending to prevent duplicate submissions.
2. Show safe, fixed, frontend allowlist pending / loading copy (for example `處理中，請稍候。`, `載入中，請稍候。`).
3. Reset pending state after API success or failure.
4. must not echo raw backend payloads, foreign `error.message`, stack traces, or internal error codes in pending / loading copy.
5. Do not show vote counts, result previews, eligibility outcomes, or voter status during pending states.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_ACTION_PENDING_MESSAGE`, `PUBLIC_LOADING_PENDING_MESSAGE`, `PUBLIC_PENDING_USER_MESSAGES`, existing `setBusySubmitButton` / `markRegionBusy`.
- `public/frontend/login-page.js`, `registration-page.js`, `profile-page.js` — aligned submit / load pending copy and busy reset.
- `public/frontend/create-poll-page.js` — live create submit pending; `finally` busy reset on failure.
- `public/frontend/vote-page.js` — load / submit pending; initial form `aria-busy`.
- `public/frontend/explore-page.js`, `result-page.js`, `my-polls-page.js` — load pending copy alignment.
- `public/frontend/poll-lifecycle-controls.js` — lifecycle transition pending via `setBusySubmitButton`.
- `public/frontend/login-state-ui.js` — logout pending.
- `public/frontend/profile-completion-prompt.js` — homepage prompt fetch loading.
- Public HTML shells (`vote.html`, `results.html`, `explore.html`) — initial loading copy alignment.
- Focused frontend + doc tests.
- README Phase 137 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Official Vote transaction order, vote-by-index eligibility-before-resolve, option index → `option_id` early resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. Pending / loading rules

### 3.1 Must

- Use `setBusySubmitButton` (or equivalent `disabled` + `aria-busy`) for submit / action pending.
- Use frontend-owned pending / loading messages from `PUBLIC_PENDING_USER_MESSAGES` or surface-specific constants that follow `…中，請稍候。` pattern.
- Reset pending state in `finally` or explicit failure / success handlers.
- Keep lifecycle, vote submit, and logout pending copy free of creator tokens, internal ids, option choices, eligibility, or result previews.

### 3.2 Must not

- Must not echo raw backend payloads, API `message` fields, internal error codes, or stack traces during loading / pending.
- Show vote counts, result previews, eligibility status, or voter status unless already on a display-safe aggregate surface.
- Create durable user-option linkage in pending handlers.

---

## 4. Surface summary

| Surface | Loading copy | Submit / action pending |
|---------|--------------|-------------------------|
| `/login` | — | `LOGIN_FORM_LOADING_MESSAGE` (`登入中，請稍候。`) |
| `/registration` | — | `REGISTRATION_LOADING_MESSAGE` |
| `/profile` | `PROFILE_LOADING_MESSAGE` | `PROFILE_SAVING_MESSAGE` |
| `/polls/new` | — | `CREATE_POLL_SUBMIT_PENDING_MESSAGE` |
| `/vote/:id` | `VOTE_PAGE_LOADING_MESSAGE` | `VOTE_SUBMIT_PENDING_MESSAGE` |
| `/explore` | `EXPLORE_FEED_LOADING_MESSAGE` | `EXPLORE_LOAD_MORE_PENDING_MESSAGE` |
| `/results/:id` | `RESULT_PAGE_LOADING_MESSAGE` | — |
| `/my-polls?live=1` | `MY_POLLS_LOADING_MESSAGE` | lifecycle `LIFECYCLE_ACTION_PENDING_MESSAGE` |
| Header logout | — | `LOGIN_LOGOUT_PENDING_MESSAGE` |
| Homepage profile prompt | `PROFILE_COMPLETION_PROMPT_LOADING_MESSAGE` | — |

---

## 5. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local   # when local environment allows
```

Focused tests:

- `tests/frontend/phase-137-public-loading-pending-state-polish.test.ts`
- `tests/docs/phase-137-public-loading-pending-state-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Pending / loading UI does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
