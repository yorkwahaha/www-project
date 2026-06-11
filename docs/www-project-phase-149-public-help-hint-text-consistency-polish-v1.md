# WWW Project Phase 149 — Public Help / Hint Text Consistency Polish v1

**Status:** frontend UX polish — unified public help / hint / helper text copy, safe frontend-owned constants, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 148 public empty / no-data state runtime review checkpoint.

**Prior checkpoint:** [Phase 148 public empty / no-data state runtime review checkpoint](./www-project-phase-148-public-empty-no-data-state-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 149 polishes public-page help, hint, and helper text so visitors see consistent, safe, frontend-owned guidance across login, registration, profile prompt, vote pre-vote hints, create-poll share/demo panels, explore, results intro, my-polls creator flow, lifecycle controls, and demo UI preview. It continues Phase 135–148 error / pending / success / unavailable / CTA / status / empty boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined help / hint copy via `PUBLIC_HINT_TEXT_MESSAGES` and shared `PUBLIC_*_HINT` constants.
2. Guide users with neutral helper text without revealing internal ids, tokens, vote sensitivity, eligibility outcomes, counters, or backend payloads.
3. Keep hint text neutral — no vote counts, percentages, ranking, eligibility outcomes, or option confirmation unless lifecycle is already in display-safe aggregate mode.
4. Must not echo raw backend payloads, foreign `error.message`, stack traces, or internal error codes in help / hint text.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_HINT_TEXT_MESSAGES`, shared `PUBLIC_*_HINT` constants.
- `public/frontend/login-page.js` — login form ready / demo shell hints.
- `public/frontend/registration-page.js` — registration ready hint.
- `public/frontend/profile-completion-prompt.js` — profile completion helper hint.
- `public/frontend/official-vote-pre-vote-hints.js` — pre-vote hint re-exports (unchanged behavior).
- `public/frontend/explore-page.js` — feed list summary hints.
- `public/frontend/result-page.js` — results intro helper hints.
- `public/frontend/creator-flow-copy.js` — creator flow / lifecycle helper hints.
- Focused frontend + doc tests.
- README Phase 149 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Official Vote transaction order, vote-by-index eligibility-before-resolve, option index → `option_id` early resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.
- Full migration of `policy-ui-placeholders.js` / `HELP_COPY` tooltip bodies (policy panels remain separate; key runtime hints centralized in `PUBLIC_HINT_TEXT_MESSAGES`).

---

## 3. Help / hint text rules

### 3.1 Must

- Use frontend-owned copy from `PUBLIC_HINT_TEXT_MESSAGES` or surface constants that re-export shared values.
- Login / registration ready hints use `PUBLIC_LOGIN_*` / `PUBLIC_REGISTRATION_*` constants only.
- Pre-vote hints use existing `PUBLIC_VOTE_PRE_VOTE_*` constants via `PRE_VOTE_HINT_COPY`.
- Explore feed summary, results intro, and creator flow leads use shared `PUBLIC_*_HINT` constants.
- Hint text remains neutral — no eligibility outcome, voter state, or aggregate preview outside display-safe states.

### 3.2 Must not

- Echo raw backend payloads, API `message` fields, internal error codes, or stack traces in help / hint text.
- Show `user_id`, session id, creator token, vote token, counter shard, or internal identifiers in hint copy.
- Create durable user-option linkage in hint handlers.

---

## 4. Surface summary

| Surface | Help / hint copy | Notes |
|---------|------------------|-------|
| `/login` | `PUBLIC_LOGIN_FORM_READY_HINT`, `PUBLIC_LOGIN_SHELL_DEMO_HINT` | form ready + demo shell |
| `/registration` | `PUBLIC_REGISTRATION_READY_HINT` | no auto-login hint |
| profile prompt | `PUBLIC_PROFILE_COMPLETION_PROMPT_HINT` | neutral eligibility wording |
| `/vote/:id` pre-vote | `PUBLIC_VOTE_PRE_VOTE_*` via `PRE_VOTE_HINT_COPY` | login/profile CTAs only |
| `/polls/new` demo/share | `PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD`, share lead | existing shared constants |
| `/explore` | `PUBLIC_EXPLORE_FEED_LIST_*`, card collecting hint | feed summary hints |
| `/results/:id` intro | `PUBLIC_RESULTS_INTRO_*` | read-only scope + vote hint |
| creator flow / lifecycle | `PUBLIC_CREATOR_*_HINT` | my-polls lead, action guide |
| demo UI preview | `PUBLIC_DEMO_UI_STATE_PREVIEW_LEAD` | unchanged |

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

- `tests/frontend/phase-149-public-help-hint-text-consistency-polish.test.ts`
- `tests/docs/phase-149-public-help-hint-text-consistency-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Help / hint text polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
