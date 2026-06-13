# WWW Project Phase 214 — Public MVP Empty / Loading / Error State Copy Consistency Plan v1

**Status:** plan only. Phase 214 plans future low-risk public MVP empty-state, loading-state, error-state, unauthenticated-prompt, profile-incomplete-prompt, and demo/live copy consistency review and polish across public MVP surfaces, without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, or Reference Answer behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 214.**

**Baseline:** `origin/master` after Phase 213 public MVP mobile and form accessibility polish final review checkpoint (`5036ff8`).

**Prior checkpoint:** [Phase 213 public MVP mobile and form accessibility polish final review checkpoint](./www-project-phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint-v1.md).

**Related polish context:**

- [Phase 199 public MVP empty / error / loading state polish](./www-project-phase-199-public-mvp-empty-error-loading-state-polish-v1.md) — `PUBLIC_PENDING_USER_MESSAGES`, `PUBLIC_LOAD_FAILURE_USER_MESSAGES`, `renderPublicInlineErrorNote`
- [Phase 200 public MVP state copy runtime review checkpoint](./www-project-phase-200-public-mvp-state-copy-runtime-review-checkpoint-v1.md) — Phase 199 review approval
- [Phase 102 profile completion prompt runtime](./www-project-phase-102-profile-completion-prompt-runtime-v1.md) — homepage-only neutral profile completion prompt
- [Phase 107 official vote pre-vote UX](./www-project-phase-107-official-vote-pre-vote-ux-v1.md) — pre-vote hint states without eligibility disclosure
- [Phase 213 public MVP mobile and form accessibility polish final review checkpoint](./www-project-phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint-v1.md) — latest mobile/form accessibility boundary

---

## 1. Plan Purpose

Phase 214 is **plan only**. It identifies low-risk, copy-only review and polish candidates for public MVP empty, loading, error, unauthenticated, profile-incomplete, and demo/live state messaging after Phase 199–200 state copy delivery and Phase 201–213 mobile/form accessibility polish.

This plan answers:

1. Which public MVP surfaces may receive future copy-only state-message polish without reopening auth, profile, vote, eligibility, result visibility, or `quality_badge` boundaries.
2. Which copy categories are safe (neutral pending/failure wording, consistent `…中，請稍候。` / `目前無法載入…` patterns, safe next-step CTAs, demo/live label clarity).
3. Which copy categories are forbidden (eligibility outcome disclosure, result counter leakage, backend error echo, auto-login hints, new profile fields, option linkage).
4. What explicit non-goals, page-by-page review checklist, risk classification, guard tests, and review gates apply before any runtime phase.

Phase 214 does **not** approve implementation. Future copy polish runtime requires a separately approved phase (e.g. Phase 214-R review checkpoint + Phase 215 runtime slice).

---

## 2. Scope

### 2.1 In scope (planning only)

Public MVP surfaces that may receive future **small, safe, copy-only** state-message review and polish:

| Surface | Current shell / runtime | Future copy review may touch |
|---------|-------------------------|------------------------------|
| `/` (homepage) | `index.html`, `profile-completion-prompt.js`, `public-mvp-layout.js` | Logged-in prompt / profile completion prompt wording; neutral helper hint; safe `/profile` CTA only |
| `/explore` | `explore.html`, `explore-page.js` | Empty feed, `#explore-status` loading, `#explore-error` load failure, load-more pending copy |
| `/vote/:pollId` | `vote.html`, `vote-page.js`, `official-vote-pre-vote-hints.js` | Route loading, load failure, unauthenticated prompt, profile-incomplete hint, pre-vote hints — **not** eligibility outcomes |
| `/results/:pollId` | `results.html`, `result-page.js` | Loading, load failure, collecting/unavailable/readonly states, demo intro vs live visibility copy |
| `/login` | `login.html`, `login-page.js` | `#login-shell-message` form errors, pending/loading, success-adjacent navigation copy |
| `/registration` | `registration.html`, `registration-page.js` | `#registration-form-message` errors/loading, `#registration-success` success-to-login copy |
| `/profile` | `profile.html`, `profile-page.js` | Unauthenticated prompt, profile load pending, load failure, save pending/success/failure |
| `/polls/new` | `create-poll.html`, `create-poll-page.js` | Demo vs `?live=1` helper copy, `#form-message` validation/error, submit pending/success |
| `/my-polls` | `my-polls.html`, `my-polls-page.js` | Demo dashboard vs `?live=1` empty/loading/error, sign-in required, creator-session unavailable, action-state copy |

Shared assets likely touched in a future runtime slice:

- `public/frontend/public-mvp-ui.js` — `PUBLIC_PENDING_USER_MESSAGES`, `PUBLIC_LOAD_FAILURE_USER_MESSAGES`, `resolvePublicErrorUserMessage`, `renderPublicInlineErrorNote`, profile-completion helper constants
- Surface page modules — only user-visible string constants, allowlists, and status-region text wiring; no new `fetch` paths
- Static HTML shells — only if copy is authored inline and not yet centralized (prefer centralization first)

### 2.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- CSS/HTML layout, spacing, tap-target, or accessibility polish (covered by Phase 201–213; not reopened here unless copy host alignment is required in a future approved slice).
- Auth/session/login resolver, `UserAuthResolver`, Reference Answer changes.
- Vote transaction, vote-by-index, eligibility evaluator, result visibility tier changes.
- New profile fields beyond `birth_year_month` and `residential_region`.
- Registration auto-login, `Set-Cookie`, or `GET /users/me` reads on registration submit.
- Creator ownership / `creator_session` authority changes.
- Ranking, recommendation, personalization, `quality_badge` expansion, trust/score UI.
- `design-drafts/` commits.

---

## 3. Allowed Copy-Only Future Changes

A future approved runtime phase (not Phase 214) may change **only** frontend-owned user-visible strings and their safe wiring:

| Category | Allowed change | Constraint |
|----------|----------------|------------|
| Loading / pending copy | Align surface-specific `…中，請稍候。` messages via `PUBLIC_PENDING_USER_MESSAGES` or module re-exports | No backend `message` echo; no eligibility or vote-outcome language |
| Load / save failure copy | Align `目前無法載入…，請稍後再試。` patterns via `PUBLIC_LOAD_FAILURE_USER_MESSAGES` or existing allowlists | Use `resolvePublicErrorUserMessage`; never echo `error.message` |
| Empty states | Neutral empty-feed / empty-owned-list copy with safe CTAs (`/polls/new`, `/login`, `/`) | No vote counts, percentages, ranking, or hidden-result explanation |
| Unauthenticated prompts | Neutral `請先登入…` copy with `/login` guidance | No session/token/cookie values; no auto-login implication on registration |
| Profile-incomplete prompts | Neutral profile-setup encouragement via `/profile` only | No age/region pass/fail outcomes; no vote-guarantee language |
| Pre-vote hints | Existing `official-vote-pre-vote-hints.js` state labels only | No `你符合資格` / `你不符合資格` / `已投過票` / `可以投票` disclosure |
| Demo / live labels | Clarify demo/mock vs `?live=1` production paths in helper copy | No new API calls; no ownership authority change |
| Success-adjacent copy | Registration success → `/login`; login success → existing refresh only | Registration must not imply auto-login |
| Inline error notes | `renderPublicInlineErrorNote` safe fallback CTAs (`返回首頁`, create poll, login) | No new observability or linkage fields |

**Default forbidden in future runtime unless explicitly approved in a separate governance phase:**

- New `fetch` paths, credentials changes, or API payload fields
- Backend error code / `message` field echo in UI
- Vote counts, percentages, eligibility outcomes, or result-tier leakage in state copy
- `localStorage`, `sessionStorage`, cookie usage for state messaging
- `console.*`, analytics, APM, or debug payloads in state handlers

---

## 4. Page-by-Page Review Checklist (Future Runtime)

Use this checklist in a future implementation phase. Each item is **copy-only** unless a real blocker requires separate governance approval.

### 4.1 Homepage — logged-in prompt / profile completion prompt

- [ ] `profile-completion-prompt.js` mount remains homepage-only
- [ ] Prompt copy stays neutral; links only to `/profile`
- [ ] No eligibility outcome, vote guarantee, or profile field expansion beyond `birth_year_month` / `residential_region`
- [ ] Uses frontend-owned constants from `public-mvp-ui.js` where applicable
- [ ] **Must not change:** `GET /users/me` read ceiling (`user_id`, `display_name` only); no `GET /users/me/profile` on homepage for vote-state

### 4.2 Explore — empty / loading / error states

- [ ] `PUBLIC_EXPLORE_FEED_LOADING_MESSAGE` / `PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE` remain frontend-owned
- [ ] Empty feed copy keeps safe create-poll CTA without ranking/trend language
- [ ] Initial load failure may keep `renderPublicInlineErrorNote` home CTA
- [ ] **Must not change:** `GET /polls/feed` boundary; `quality_badge` chip behavior on cards

### 4.3 Vote — loading / error / unauthenticated / profile-incomplete / pre-vote hints

- [ ] `PUBLIC_VOTE_PAGE_LOADING_MESSAGE` and `PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE` remain copy-only
- [ ] Unauthenticated state uses neutral login guidance only
- [ ] `official-vote-pre-vote-hints.js` states: `anonymous`, `profile-incomplete`, `profile-complete`, `profile-load-failed` — no pass/fail eligibility copy
- [ ] **Must not change:** `submitVoteByIndex` body `{ option_index }` only; vote transaction order; Reference Answer path

### 4.4 Results — loading / error / readonly / demo / live visibility copy

- [ ] `PUBLIC_RESULTS_PAGE_LOADING_MESSAGE` / `PUBLIC_RESULTS_LOAD_FAILURE_MESSAGE` remain frontend-owned
- [ ] Collecting / unavailable / readonly states do not leak counters or hidden-tier explanation
- [ ] `results-page-demo-intro` demo label remains distinct from live result visibility
- [ ] **Must not change:** result visibility evaluator tiers; display-safe result object ceiling

### 4.5 Login — form errors / loading / success-adjacent copy

- [ ] `#login-shell-message` pending/failure/success-adjacent copy stays frontend-owned
- [ ] No credential/token/session value display
- [ ] **Must not change:** `POST /login/session`; fail-closed behavior

### 4.6 Registration — form errors / loading / success-to-login copy

- [ ] `#registration-form-message` and `#registration-success` copy remain neutral
- [ ] Success panel directs to `/login` only; no auto-login wording
- [ ] **Must not change:** `POST /registration` only; no `Set-Cookie`; no `GET /users/me`

### 4.7 Profile — loading / error / save states

- [ ] `PUBLIC_PROFILE_PAGE_LOADING_MESSAGE` and save/load failure allowlists remain frontend-owned
- [ ] Unauthenticated block keeps `/login` + `/registration` guidance only
- [ ] **Must not change:** `GET`/`PUT /users/me/profile` with `birth_year_month` and `residential_region` only

### 4.8 Poll creation — demo / live helper / error states

- [ ] Demo submit vs `?live=1` `POST /creator/polls` helper copy remains visually and semantically distinct
- [ ] `#form-message` validation/error copy stays frontend-owned
- [ ] **Must not change:** poll-definition payload; creator session boundary

### 4.9 My Polls — loading / error / empty / action states

- [ ] `PUBLIC_MY_POLLS_LOADING_MESSAGE` / `PUBLIC_MY_POLLS_LOAD_FAILURE_MESSAGE` remain frontend-owned
- [ ] Demo dashboard vs `?live=1` owned-list empty/error copy stays distinct
- [ ] Sign-in required / creator-session-unavailable blocks keep safe CTAs only
- [ ] **Must not change:** `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, lifecycle `POST /creator/polls/:id/*`

---

## 5. Risk Classification

| Risk area | Default risk | Future copy polish rule |
|-----------|--------------|-------------------------|
| Homepage profile completion prompt | Medium | Homepage-only; neutral copy; `/profile` CTA only; no eligibility disclosure |
| Explore empty/loading/error | Low | Reuse `PUBLIC_*` constants; no feed-ranking copy |
| Vote pre-vote hints | High | No eligibility outcome language; no vote guarantee |
| Results visibility copy | High | No counter/tier leakage in loading/error/unavailable states |
| Login / registration state copy | Medium | No auto-login implication; no session echo |
| Profile save/load states | Medium | Two-field ceiling only; no vote-state reads |
| Poll creation demo/live copy | Medium | Demo vs live path clarity only; no API drift |
| My Polls live empty/error | Medium | No ownership/session authority change in copy |
| `quality_badge` adjacent state copy | Medium | No badge explanation expansion; `positive_feedback` → `回饋良好` only |
| Raw Option Linkage Ban | High | No option choice + user/session/device/request/log/trace/metric/error linkage |
| Backend/API/schema | High | Out of scope for all copy polish slices |

---

## 6. Privacy, Auth, API, and Schema Boundaries

Future copy polish must **preserve**:

| Boundary | Requirement |
|----------|-------------|
| Raw Option Linkage Ban | No durable user-option linkage in state copy, logs, metrics, analytics, APM, or error payloads |
| Option linkage | No option choice + user/session/device/request/log/trace/metric/error linkage added |
| Official Vote | Transaction order unchanged |
| Vote-by-index | Body `{ option_index }` only; eligibility-before-option-resolve unchanged |
| Result visibility | Display-safe tiers unchanged; no counter leakage in state copy |
| Eligibility / auth | No `UserAuthResolver` drift; no eligibility outcome disclosure in state copy |
| Profile fields | Only `birth_year_month` / `residential_region` |
| Registration | Does not auto-login; does not Set-Cookie |
| `/users/me` | Only `user_id` / `display_name` |
| Creator session | Ownership / lifecycle APIs unchanged (`GET /creator/session`, `GET /creator/polls`, `POST /creator/polls/:id/*`) |
| `quality_badge` | Presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected silent; not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank |
| Observability | No new `console.*`, analytics, APM, or debug payloads in state handlers |

---

## 7. Explicit Non-Goals

Phase 214 does **not** implement or approve:

| Non-goal | Status |
|----------|--------|
| DB / schema / migration | **Out of scope** |
| API contract / payload changes | **Out of scope** |
| CSS / HTML / JS runtime behavior changes (default) | **Out of scope** — copy-only unless separately approved |
| Auth / session / `UserAuthResolver` changes | **Out of scope** |
| Registration auto-login or cookie issuance | **Forbidden** |
| New profile fields beyond `birth_year_month` / `residential_region` | **Forbidden** |
| Vote transaction / eligibility evaluator changes | **Out of scope** |
| Result visibility / result evaluator changes | **Out of scope** |
| Reference Answer integration changes | **Out of scope** |
| Creator ownership / lifecycle API behavior changes | **Out of scope** |
| Ranking / recommendation / personalization | **Out of scope** |
| `quality_badge` behavior or label expansion | **Out of scope** |
| Eligibility outcome disclosure in state copy | **Forbidden** |
| Option/user/session/device/request/log/trace/metric/error linkage | **Forbidden** |
| `design-drafts/` commits | **Excluded** |

**Plan/docs only.** No `src/`, `migrations/`, `public/frontend/*.js`, `public/*.html`, or `public-mvp.css` runtime change in Phase 214.

---

## 8. Suggested Guard Tests for Future Implementation Phase

When a future runtime phase is approved, add focused tests similar to Phase 199/200 patterns:

| Test focus | Example assertions |
|------------|-------------------|
| Copy constants | `PUBLIC_PENDING_USER_MESSAGES` / `PUBLIC_LOAD_FAILURE_USER_MESSAGES` contain only frontend-owned strings |
| No backend echo | State handlers use `resolvePublicErrorUserMessage`; no `error.message` display |
| Vote pre-vote hints | `official-vote-pre-vote-hints.js` contains no eligibility outcome copy |
| Registration boundary | Success copy links to `/login` only; no auto-login strings |
| Profile boundary | Load/save failure allowlists; two fields only |
| Results visibility | Loading/error/unavailable copy contains no raw counts or tier leakage |
| `quality_badge` | `shouldRenderQualityFeedbackBadge` unchanged; no tooltip/debug paths |
| Linkage / observability | No forbidden tokens; no `localStorage`/`sessionStorage`/cookie in state modules |
| Backend untouched | `src/`, migrations lack phase marker |

Suggested filenames (future, not Phase 214):

- `tests/frontend/phase-215-public-mvp-state-copy-consistency-polish.test.ts`
- `tests/docs/phase-215-public-mvp-state-copy-consistency-polish-doc.test.ts`
- `tests/frontend/phase-216-public-mvp-state-copy-consistency-runtime-review-checkpoint.test.ts` (review checkpoint after runtime)

---

## 9. Suggested Future Phase Sequence (Not Approved Here)

1. **Phase 214-R (review checkpoint)** — review this plan against Phase 195–213 governance; approve a minimal copy-only runtime slice (e.g. participation surfaces: explore + vote + results state copy first).
2. **Phase 215 (runtime)** — implement only the approved slice with focused guard tests; copy/constants only, no new API paths.
3. **Phase 216 (review checkpoint)** — confirm no auth/profile/creator/vote/result/`quality_badge` boundary drift.
4. **Phase 217+ (optional slices)** — auth/profile/creator form state copy consistency in small approved slices, each followed by a review checkpoint.

Each runtime slice must remain copy-only unless a separate governance phase explicitly approves more.

---

## 10. Guard Tests Added (Phase 214)

| Test file | Role |
|-----------|------|
| `tests/docs/phase-214-public-mvp-state-copy-consistency-plan-doc.test.ts` | Doc + README index guard |

---

## 11. Validation Checklist

Phase 214 (plan delivery):

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
```

Focused test:

- `tests/docs/phase-214-public-mvp-state-copy-consistency-plan-doc.test.ts`

Future runtime phase (when approved) should additionally run:

```bash
npm run smoke:public:local
```

`design-drafts/` remains outside the committed delivery scope.

---

## 12. Privacy and Integrity Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 214 is planning documentation and doc guards only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes. Raw Option Linkage Ban preserved.
