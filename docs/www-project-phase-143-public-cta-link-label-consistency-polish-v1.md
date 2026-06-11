# WWW Project Phase 143 — Public CTA / Link Label Consistency Polish v1

**Status:** frontend UX polish — unified public CTA / link label copy, safe frontend-owned constants, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 142 public disabled / unavailable action runtime review checkpoint.

**Prior checkpoint:** [Phase 142 public disabled / unavailable action runtime review](./www-project-phase-142-public-disabled-unavailable-action-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 143 polishes public-page CTA and link label copy so visitors see consistent, safe, frontend-owned navigation guidance across auth, profile, vote, results, explore, my-polls, create-poll share panels, and creator lifecycle controls. It continues Phase 135–142 error / pending / success / unavailable boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined CTA / link labels via `PUBLIC_CTA_LINK_LABELS` and shared `PUBLIC_CTA_*` constants.
2. Guide users to safe next steps without revealing internal ids, tokens, vote sensitivity, eligibility outcomes, or backend payloads.
3. Keep vote / results CTAs neutral — no option confirmation, eligibility result, result preview, vote token, or counter shard leakage in link text.
4. Keep results CTAs free of aggregate preview unless lifecycle is already in display-safe aggregate mode.
5. Must not echo raw backend payloads, foreign `error.message`, stack traces, or internal error codes in CTA / link labels.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_CTA_LINK_LABELS`, shared CTA constants, `renderPublicNav`, `renderPollSharePanel`.
- `public/frontend/auth-state-copy.js` — header auth CTA labels.
- `public/frontend/login-page.js` — login submit CTA label.
- `public/frontend/registration-page.js` — registration submit CTA label.
- `public/frontend/profile-page.js` / `profile-completion-prompt.js` — profile CTA labels.
- `public/frontend/official-vote-pre-vote-hints.js` — pre-vote login / profile CTA links.
- `public/frontend/vote-page.js` — vote success result-page CTA.
- `public/frontend/result-page.js` — vote / my-polls CTA links.
- `public/frontend/explore-page.js` — feed card vote CTA.
- `public/frontend/my-polls-page.js` — sign-in, create, vote, results CTAs.
- `public/frontend/create-poll-page.js` — demo success next-step CTAs.
- `public/frontend/creator-flow-copy.js` — creator manage link CTAs.
- `public/frontend/poll-lifecycle-controls.js` — creator results CTA.
- Focused frontend + doc tests.
- README Phase 143 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Official Vote transaction order, vote-by-index eligibility-before-resolve, option index → `option_id` early resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. CTA / link label rules

### 3.1 Must

- Use frontend-owned labels from `PUBLIC_CTA_LINK_LABELS` or surface constants that re-export shared values.
- Auth CTAs (`登入`, `註冊`, `前往登入`, `前往註冊`) use `PUBLIC_CTA_*` constants only.
- Vote / results CTAs use neutral navigation copy (`前往投票頁`, `查看公開結果頁`) without vote counts, percentages, ranking, or eligibility outcomes.
- Profile CTAs use fixed copy (`前往個人資料`) without raw `birth_year_month` / `residential_region` echo.
- Creator / my-polls CTAs do not expose creator token, session id, or internal identifiers in link text.

### 3.2 Must not

- Echo raw backend payloads, API `message` fields, internal error codes, or stack traces in CTA / link labels.
- Show option id, option text confirmation, eligibility result, result preview, vote token, or counter shard in CTA text.
- Create durable user-option linkage in CTA handlers.

---

## 4. Surface summary

| Surface | CTA / link labels | Notes |
|---------|-------------------|-------|
| header auth | `PUBLIC_CTA_SIGN_IN_LABEL`, `PUBLIC_CTA_REGISTER_LABEL`, aria labels | guest chip + banner links |
| `/login` | `LOGIN_SUBMIT_CTA_LABEL` | submit button |
| `/registration` | `REGISTRATION_SUBMIT_CTA_LABEL` | submit button; no auto-login |
| profile prompt / page | `PUBLIC_CTA_GO_TO_PROFILE_LABEL`, `PUBLIC_CTA_GO_TO_LOGIN_LABEL` | neutral profile guidance |
| `/vote/:id` pre-vote | `PRE_VOTE_HINT_LINKS` | login / profile CTAs |
| `/vote/:id` success | `VOTE_RESULT_CTA_LABEL` | neutral result-page link |
| `/results/:id` | `RESULTS_VOTE_CTA_LABEL`, `RESULTS_MY_POLLS_CTA_LABEL` | no aggregate in CTA text |
| `/explore` | `EXPLORE_VOTE_CTA_LABEL` | feed card vote CTA |
| `/my-polls?live=1` | `MY_POLLS_*_CTA_LABEL` | sign-in / create / vote / results |
| `/polls/new` demo success | `CREATE_POLL_DEMO_*_CTA_LABEL` | next-step links |
| create share panel | `PUBLIC_CTA_OPEN_VOTE_PAGE_LABEL`, copy labels | share / open links |
| creator flow / lifecycle | `CREATOR_FLOW_*_CTA_LABEL`, `LIFECYCLE_CREATOR_RESULTS_CTA_LABEL` | manage next steps |

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

- `tests/frontend/phase-143-public-cta-link-label-consistency-polish.test.ts`
- `tests/docs/phase-143-public-cta-link-label-consistency-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

CTA / link label polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
