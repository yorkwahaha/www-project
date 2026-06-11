# WWW Project Phase 145 — Public Status Badge / State Label Consistency Polish v1

**Status:** frontend UX polish — unified public status badge / state label copy, safe frontend-owned constants, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 144 public CTA / link label runtime review checkpoint (`ab06692`).

**Prior checkpoint:** [Phase 144 public CTA / link label runtime review checkpoint](./www-project-phase-144-public-cta-link-label-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 145 polishes public-page status badges and state labels so visitors see consistent, safe, frontend-owned lifecycle / auth / profile / vote / results state copy across header auth, vote, results, explore, my-polls, create-poll, profile completion prompt, and creator lifecycle controls. It continues Phase 135–144 error / pending / success / unavailable / CTA boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined status badge / state labels via `PUBLIC_STATUS_LABELS`, `PUBLIC_POLL_LIFECYCLE_STATUS_LABELS`, and shared `PUBLIC_*_STATUS_*` constants.
2. Guide users with neutral state copy without revealing internal ids, tokens, vote sensitivity, eligibility outcomes, or backend payloads.
3. Keep vote / results status labels neutral — no option confirmation, eligibility result, result preview, vote token, or counter shard leakage in badge text.
4. Keep results status labels free of aggregate preview unless lifecycle is already in display-safe aggregate mode (`revealed` / `locked` / `post_lock`).
5. Must not echo raw backend payloads, foreign `error.message`, stack traces, or internal error codes in status badge / state label text.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_STATUS_LABELS`, `PUBLIC_POLL_LIFECYCLE_STATUS_LABELS`, `formatPublicPollLifecycleStatusLabel`, shared status constants.
- `public/frontend/auth-state-copy.js` — header guest / demo identity chip status labels.
- `public/frontend/login-state-ui.js` — signed-in status aria prefix and logout status label.
- `public/frontend/vote-page.js` — vote success panel status aria label.
- `public/frontend/result-page.js` — collecting / unavailable status aria labels and page titles.
- `public/frontend/explore-page.js` — feed card collecting status badge and hint.
- `public/frontend/my-polls-page.js` — poll lifecycle status badges via shared formatter.
- `public/frontend/create-poll-page.js` — live submit status label and success panel aria label.
- `public/frontend/profile-completion-prompt.js` — incomplete profile status label and aria labels.
- `public/frontend/poll-lifecycle-controls.js` — exported `lifecycleNoteForState` state notes.
- `public/frontend/public-mvp-demo.js` — demo UI state preview link labels.
- Focused frontend + doc tests.
- README Phase 145 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Official Vote transaction order, vote-by-index eligibility-before-resolve, option index → `option_id` early resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. Status badge / state label rules

### 3.1 Must

- Use frontend-owned labels from `PUBLIC_STATUS_LABELS` or surface constants that re-export shared values.
- Auth chips (`未登入`, `MVP 測試身份`, `已登入`) use `PUBLIC_AUTH_*_STATUS_*` constants only.
- Poll lifecycle badges (`收集中`, `已公開`, `已取消`, etc.) use `formatPublicPollLifecycleStatusLabel` / `PUBLIC_POLL_LIFECYCLE_STATUS_LABELS`.
- Vote / results status labels use neutral copy without vote counts, percentages, ranking, or eligibility outcomes.
- Profile incomplete status uses fixed copy (`PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL` = `資料未完成`) without raw `birth_year_month` / `residential_region` echo.
- Creator / explore / my-polls status labels do not expose creator token, session id, or internal identifiers.

### 3.2 Must not

- Echo raw backend payloads, API `message` fields, internal error codes, or stack traces in status badge / state label text.
- Show option id, option text confirmation, eligibility result, result preview, vote token, or counter shard in status text.
- Create durable user-option linkage in status handlers.

---

## 4. Surface summary

| Surface | Status badge / state labels | Notes |
|---------|----------------------------|-------|
| header auth chip | `PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL`, `PUBLIC_AUTH_DEMO_IDENTITY_CHIP_STATUS_LABEL` | guest / demo identity |
| signed-in header | `PUBLIC_AUTH_SIGNED_IN_STATUS_ARIA_PREFIX`, `PUBLIC_AUTH_LOGOUT_STATUS_LABEL` | display_name only in name span |
| `/vote/:id` success | `PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL`, `PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE` | neutral success status |
| `/results/:id` | `PUBLIC_RESULTS_COLLECTING_STATUS_ARIA_LABEL`, page titles, refresh notice aria | no aggregate in collecting status |
| `/explore` | `PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL`, `PUBLIC_EXPLORE_COLLECTING_STATUS_HINT` | feed card badge |
| `/my-polls?live=1` | `formatPublicPollLifecycleStatusLabel` badges | lifecycle state only |
| `/polls/new` | `PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL`, success panel aria | demo vs live submit label |
| profile prompt | `PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL`, prompt aria labels | no raw profile echo |
| lifecycle controls | `lifecycleNoteForState` → `PUBLIC_LIFECYCLE_*` notes | fixed state notes |
| demo preview links | `RESULT_UI_STATE_PREVIEW_LINKS` lifecycle labels | shared lifecycle constants |

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

- `tests/frontend/phase-145-public-status-badge-state-label-consistency-polish.test.ts`
- `tests/docs/phase-145-public-status-badge-state-label-consistency-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Status badge / state label polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
