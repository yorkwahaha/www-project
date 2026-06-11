# WWW Project Phase 141 — Public Disabled / Unavailable Action Copy Polish v1

**Status:** frontend UX polish — unified public disabled / unavailable action states, safe frontend-owned copy, focused guard tests, docs, and README index.

**No runtime, API, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 140 public success / completion state runtime review checkpoint.

**Prior checkpoint:** [Phase 140 public success / completion state runtime review](./www-project-phase-140-public-success-completion-state-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 141 polishes public-page disabled and unavailable action UX so visitors see consistent, safe, frontend-owned guidance when an action cannot be taken yet. It continues Phase 135–140 error / pending / success boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined disabled / unavailable copy across vote, results, explore, my-polls lifecycle, create poll demo, profile auth gates, and guest navigation CTAs.
2. Guide users to safe next steps without revealing internal ids, tokens, vote sensitivity, eligibility outcomes, or backend payloads.
3. Keep vote unavailable neutral — no option confirmation, eligibility result, result preview, vote token, or counter shard leakage.
4. Keep results unavailable free of aggregate preview unless lifecycle is in display-safe aggregate states (`revealed` / `locked` / `post_lock`).
5. must not echo raw backend payloads, foreign `error.message`, stack traces, or internal error codes in disabled / unavailable copy.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_UNAVAILABLE_USER_MESSAGES`, vote route/blocked constants, `messageForPollVotingBlocked` / `messageForPollLoadFailure` alignment.
- `public/frontend/vote-page.js` — route unavailable title/body; submit disabled when voting blocked.
- `public/frontend/official-vote-pre-vote-hints.js` — neutral pre-vote unavailable hints.
- `public/frontend/result-page.js` — collecting / cancelled / unpublished unavailable shells; non-aggregate summary.
- `public/frontend/explore-page.js` — empty feed and load-more unavailable copy.
- `public/frontend/my-polls-page.js` — sign-in required unavailable copy.
- `public/frontend/profile-page.js` — unauthenticated edit unavailable copy.
- `public/frontend/poll-lifecycle-controls.js` — lifecycle action unavailable messages and state notes.
- `public/frontend/create-poll-page.js` — demo submit label (non-persist unavailable).
- `public/frontend/auth-state-copy.js` — guest sign-in CTA unavailable aria label.
- Focused frontend + doc tests.
- README Phase 141 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Official Vote transaction order, vote-by-index eligibility-before-resolve, option index → `option_id` early resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. Disabled / unavailable rules

### 3.1 Must

- Use frontend-owned messages from `PUBLIC_UNAVAILABLE_USER_MESSAGES` or surface constants that re-export shared values.
- Vote blocked / route unavailable copy uses `PUBLIC_VOTE_*` and `PUBLIC_POLL_*` constants only.
- Submit buttons disable with `disabled` + `aria-disabled` when voting is blocked.
- Results collecting / cancelled / unpublished shells do not show vote counts, percentages, ranking, or trends.
- Lifecycle unavailable notes and mapped failure copy do not expose creator token, session id, or internal identifiers.
- Guest auth CTA uses fixed copy without `user_id` or session values.

### 3.2 Must not

- Echo raw backend payloads, API `message` fields, internal error codes, or stack traces on disabled / unavailable paths.
- Show option id, option text confirmation, eligibility result, result preview, vote token, or counter shard on vote unavailable UI.
- Create durable user-option linkage in unavailable handlers.

---

## 4. Surface summary

| Surface | Unavailable copy | Notes |
|---------|------------------|-------|
| `/vote/:id` route | `PUBLIC_VOTE_ROUTE_*` | Missing/invalid poll id |
| `/vote/:id` blocked | `messageForPollVotingBlocked` | Submit disabled + status message |
| `/vote/:id` pre-vote | `PRE_VOTE_HINT_COPY` | Neutral `/login` / `/profile` hints |
| `/results/:id` | `RESULTS_COLLECTING_*`, `RESULTS_CANCELLED_*`, `RESULTS_UNPUBLISHED_*` | No aggregate outside display-safe mode |
| `/explore` | `EXPLORE_FEED_EMPTY_MESSAGE`, `EXPLORE_LOAD_MORE_FAILURE_MESSAGE` | Empty / load-more unavailable |
| `/my-polls?live=1` | `MY_POLLS_SIGN_IN_REQUIRED_MESSAGE` | Auth gate |
| `/profile` | `PROFILE_UNAUTHENTICATED_*` | Unauthenticated edit gate |
| lifecycle controls | `LIFECYCLE_USER_ERROR_MESSAGES`, state notes | Action unavailable by state |
| `/polls/new` demo | `CREATE_POLL_DEMO_SUBMIT_LABEL` | Non-persist demo label |
| header auth CTA | `AUTH_STATE_COPY.guestChipAriaLabel` | Guest sign-in guidance |

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

- `tests/frontend/phase-141-public-disabled-unavailable-action-copy-polish.test.ts`
- `tests/docs/phase-141-public-disabled-unavailable-action-copy-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Disabled / unavailable UI does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
