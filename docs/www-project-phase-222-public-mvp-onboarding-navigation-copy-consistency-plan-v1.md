# WWW Project Phase 222 — Public MVP Onboarding / Navigation Copy Consistency Plan v1

**Status:** plan only. Phase 222 plans future low-risk public MVP onboarding and navigation copy consistency review and polish across homepage onboarding, header/navigation auth-state messaging, account-flow guidance (registration → login → profile), creator-flow guidance (poll creation / my-polls), participation guidance (vote unauthenticated / profile-incomplete), results demo/live/readonly guidance, and FAQ / trust-levels cross-page wording alignment — without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, or Reference Answer behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 222.**

**Baseline:** `origin/master` after Phase 221 public MVP state copy consistency milestone checkpoint (`57c7265`).

**Prior checkpoint:** [Phase 221 public MVP state copy consistency milestone checkpoint](./www-project-phase-221-public-mvp-state-copy-consistency-milestone-checkpoint-v1.md).

**Related polish context:**

- [Phase 94 registration/login navigation copy polish](./www-project-phase-94-registration-login-navigation-copy-polish-v1.md) — guest chip, registration/login CTA, no auto-login wording
- [Phase 125 public navigation auth-state runtime review checkpoint](./www-project-phase-125-public-navigation-auth-state-runtime-review-checkpoint-v1.md) — header auth chrome boundary
- [Phase 143 public CTA / link label consistency polish](./www-project-phase-143-public-cta-link-label-consistency-polish-v1.md) — shared `PUBLIC_CTA_*` labels
- [Phase 164 public onboarding flow clarity review checkpoint](./www-project-phase-164-public-onboarding-flow-clarity-review-checkpoint-v1.md) — registration → login → profile flow clarity
- [Phase 214 public MVP state copy consistency plan](./www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md) — empty/loading/error state copy (delivered Phase 214–220)
- [Phase 221 public MVP state copy consistency milestone checkpoint](./www-project-phase-221-public-mvp-state-copy-consistency-milestone-checkpoint-v1.md) — state copy arc complete
- [Phase 201–213 public MVP mobile and form accessibility polish](./www-project-phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint-v1.md) — latest mobile/form accessibility boundary

---

## 1. Plan Purpose

Phase 222 is **plan only**. It identifies low-risk, copy-only review and polish candidates for public MVP **onboarding and navigation guidance** after:

1. Phase 201–213 mobile and form accessibility polish milestones.
2. Phase 214–221 empty / loading / error / demo-live **state copy** consistency delivery.

This plan answers:

1. Which public MVP surfaces may receive future copy-only onboarding/navigation polish without reopening auth, profile, vote, eligibility, result visibility, or `quality_badge` boundaries.
2. Which copy categories are safe (neutral flow guidance, consistent registration/login/profile next-step wording, demo/live path clarity, FAQ/trust-levels cross-page alignment).
3. Which copy categories are forbidden (eligibility outcome disclosure, result counter leakage, backend error echo, auto-login hints, unavailable production behavior promises, hidden lifecycle details).
4. What explicit non-goals, page-by-page review checklist, copy principles, risk classification, guard tests, and review gates apply before any runtime phase.

Phase 222 does **not** approve implementation. Future copy polish runtime requires a separately approved phase (e.g. Phase 222-R review checkpoint + Phase 223+ runtime slice).

---

## 2. Scope

### 2.1 In scope (planning only)

Public MVP surfaces that may receive future **small, safe, copy-only** onboarding and navigation guidance review and polish:

| Surface | Current shell / runtime | Future copy review may touch |
|---------|-------------------------|------------------------------|
| `/` (homepage) | `index.html`, `profile-completion-prompt.js`, `public-mvp-layout.js` | Hero onboarding lead, trust-row bullets, account-flow preview links, demo nav switch note, profile-completion prompt wording |
| Header / navigation | `public-mvp-layout.js`, `auth-state-copy.js`, `login-state-ui.js`, `login-state-read.js` | Guest chip, demo identity chip, auth banner, nav labels, registration/login CTA labels — **not** session/token display |
| `/registration` | `registration.html`, `registration-page.js` | Registration-to-login guidance in success panel and adjacent helper copy |
| `/login` | `login.html`, `login-page.js` | Login-to-profile guidance, post-login next-step hints, registration cross-link copy |
| `/profile` | `profile.html`, `profile-page.js`, `profile-completion-prompt.js` | Profile completion guidance, unauthenticated onboarding, field-purpose helper copy (`birth_year_month` / `residential_region` only) |
| `/polls/new` | `create-poll.html`, `create-poll-page.js` | Poll creation demo vs `?live=1` onboarding guidance, share/next-step copy |
| `/my-polls` | `my-polls.html`, `my-polls-page.js` | My Polls creator flow guidance, demo dashboard vs `?live=1` path explanation, sign-in / creator-session onboarding |
| `/vote/:pollId` | `vote.html`, `vote-page.js`, `official-vote-pre-vote-hints.js` | Vote unauthenticated / profile-incomplete guidance, intro bullets linking FAQ/trust-levels — **not** eligibility outcomes |
| `/results/:pollId` | `results.html`, `result-page.js` | Results demo/live/readonly onboarding intro, visibility helper copy, demo path guidance |
| `/faq`, `/trust-levels` | `faq.html`, `trust-levels.html` | Cross-page wording alignment with participation/account/creator surfaces where relevant |

Shared assets likely touched in a future runtime slice:

- `public/frontend/public-mvp-ui.js` — `PUBLIC_CTA_*`, `PUBLIC_AUTH_STATE_USER_MESSAGES`, profile-completion helper constants, shared intro/lead constants
- `public/frontend/auth-state-copy.js` — header auth-state banner and chip copy
- `public/frontend/public-mvp-layout.js` — nav label consistency, footer/help links
- Surface page modules and static HTML shells — only user-visible onboarding/navigation strings; no new `fetch` paths

### 2.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- CSS/HTML layout, spacing, tap-target, or accessibility polish (covered by Phase 201–213; not reopened here unless copy host alignment is required in a future approved slice).
- Empty / loading / error **state copy** rewrites (covered by Phase 214–221; revisit only if onboarding copy host overlaps).
- Auth/session/login resolver, `UserAuthResolver`, Reference Answer changes.
- Vote transaction, vote-by-index, eligibility evaluator, result visibility tier changes.
- New profile fields beyond `birth_year_month` and `residential_region`.
- Registration auto-login, `Set-Cookie`, or `GET /users/me` reads on registration submit.
- Creator ownership / `creator_session` authority changes.
- Ranking, recommendation, personalization, `quality_badge` expansion, trust/score UI.
- `design-drafts/` commits.

---

## 3. Copy Principles (Future Runtime)

All future onboarding/navigation copy polish must follow these principles:

| Principle | Requirement |
|-----------|-------------|
| **Neutral** | No hype, blame, or answer-direction language; no vote guarantee or eligibility outcome disclosure |
| **User-facing** | Plain-language guidance for visitors; no engineer-facing jargon in primary copy |
| **Non-debug** | No request id, trace id, internal code, shard id, option id, or backend diagnostic tokens in UI |
| **No backend/internal error echo** | Use `resolvePublicErrorUserMessage` where errors appear; never echo `error.message` or foreign backend payloads |
| **No eligibility-result guarantee** | Do not promise `你符合資格` / `你不符合資格` / `已投過票` / `可以投票` before official vote submission |
| **No unavailable production behavior promise** | Demo/MVP paths must not imply features that production does not offer; `?live=1` and `creator_session` boundaries stay explicit |
| **No hidden counters or internal lifecycle details** | Onboarding copy must not leak vote counts, percentages, ranking, hidden result tiers, or internal poll lifecycle mechanics |

Additional alignment rules:

- Registration success must direct to `/login` only; no auto-login implication.
- Profile completion guidance references only `birth_year_month` and `residential_region`.
- Demo vs live paths remain visually and semantically distinct in creator and results onboarding.
- FAQ and trust-levels cross-links use consistent phrasing for collecting / readonly / locked periods and login requirements.

---

## 4. Allowed Copy-Only Future Changes

A future approved runtime phase (not Phase 222) may change **only** frontend-owned user-visible onboarding/navigation strings and their safe wiring:

| Category | Allowed change | Constraint |
|----------|----------------|------------|
| Homepage onboarding | Hero lead, trust-row bullets, account-flow preview, explore/create CTA labels | No vote counts, ranking, or eligibility outcomes |
| Header / nav auth-state | Guest chip, demo chip, auth banner, nav CTA labels via `auth-state-copy.js` / `PUBLIC_CTA_*` | No session/token/cookie values; no auto-login on registration |
| Registration-to-login | Success panel and helper copy clarifying post-registration login step | Links to `/login` only; no `GET /users/me` after success |
| Login-to-profile | Post-login next-step hints toward `/profile` when profile incomplete | No profile field expansion; no eligibility disclosure |
| Profile completion | Homepage prompt and profile page helper copy for two-field setup | `/profile` CTA only; no vote-guarantee language |
| Poll creation demo/live | Demo submit vs `?live=1` `POST /creator/polls` onboarding guidance | No new API calls; no ownership authority change |
| My Polls creator flow | Demo dashboard vs `?live=1` path explanation, sign-in / creator-session onboarding | No hidden counters or lifecycle authority change in copy |
| Vote unauthenticated / profile-incomplete | Intro bullets and pre-vote hint labels linking FAQ/trust-levels | No eligibility outcome language in hints |
| Results demo/live/readonly | Demo intro vs live visibility onboarding; readonly/collecting guidance | No counter/tier leakage; result visibility evaluator unchanged |
| FAQ / trust-levels alignment | Cross-page wording for login requirements, collecting/readonly rules, demo paths | Policy pages remain static; no new backend reads |

**Default forbidden in future runtime unless explicitly approved in a separate governance phase:**

- New `fetch` paths, credentials changes, or API payload fields
- Backend error code / `message` field echo in UI
- Vote counts, percentages, eligibility outcomes, or result-tier leakage in onboarding copy
- `localStorage`, `sessionStorage`, cookie usage for onboarding memory
- `console.*`, analytics, APM, or debug payloads in onboarding handlers

---

## 5. Page-by-Page Review Checklist (Future Runtime)

Use this checklist in a future implementation phase. Each item is **copy-only** unless a real blocker requires separate governance approval.

### 5.1 Homepage — onboarding copy

- [ ] Hero lead (`#home-hero-lead`) stays neutral about collecting/readonly rules
- [ ] Trust-row bullets align with FAQ/results visibility wording
- [ ] Account-flow preview (`註冊` / `登入`) states registration does not auto-login
- [ ] Demo nav switch note remains clearly non-production
- [ ] Profile-completion prompt (`profile-completion-prompt.js`) stays homepage-only with `/profile` CTA
- [ ] **Must not change:** `GET /users/me` read ceiling (`user_id`, `display_name` only)

### 5.2 Header / navigation — auth-state copy

- [ ] `auth-state-copy.js` guest chip and banner copy stay neutral; registration ≠ login
- [ ] Demo identity chip explains `X-User-Id` vs `creator_session` without authority drift
- [ ] Nav labels use shared `PUBLIC_CTA_*` constants where applicable
- [ ] Authenticated header shows `display_name` only via `login-state-read.js`
- [ ] **Must not change:** `POST /login/session`; fail-closed behavior; no session/token echo

### 5.3 Registration — registration-to-login guidance

- [ ] `#registration-success` directs to `/login` only; no auto-login wording
- [ ] Helper copy adjacent to form clarifies account creation ≠ session issuance
- [ ] Cross-links to FAQ/trust-levels use consistent phrasing
- [ ] **Must not change:** `POST /registration` only; no `Set-Cookie`; no `GET /users/me`

### 5.4 Login — login-to-profile guidance

- [ ] Post-login next-step hints may encourage `/profile` for incomplete profiles
- [ ] Registration cross-link copy stays consistent with registration page
- [ ] No credential/token/session value display
- [ ] **Must not change:** `POST /login/session`; fail-closed behavior

### 5.5 Profile — profile completion guidance

- [ ] Unauthenticated block keeps `/login` + `/registration` guidance only
- [ ] Field-purpose helper copy references `birth_year_month` and `residential_region` only
- [ ] Profile completion prompt wording aligns with vote pre-vote profile-incomplete hints
- [ ] **Must not change:** `GET`/`PUT /users/me/profile` with two fields only

### 5.6 Poll creation — demo/live guidance

- [ ] Demo submit vs `?live=1` `POST /creator/polls` onboarding remains distinct
- [ ] Share/next-step copy does not imply unavailable production behavior
- [ ] FAQ/trust-levels links for high-sensitivity category rules stay aligned
- [ ] **Must not change:** poll-definition payload; creator session boundary

### 5.7 My Polls — creator flow guidance

- [ ] Demo dashboard vs `?live=1` owned-list path explanation stays distinct
- [ ] Sign-in required / creator-session-unavailable onboarding keeps safe CTAs only
- [ ] Creator flow copy does not expose hidden counters or internal lifecycle details
- [ ] **Must not change:** `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, lifecycle `POST /creator/polls/:id/*`

### 5.8 Vote — unauthenticated / profile-incomplete guidance

- [ ] Intro bullets link FAQ/trust-levels with consistent login/eligibility wording
- [ ] `official-vote-pre-vote-hints.js` states remain neutral; no pass/fail eligibility copy
- [ ] Unauthenticated state uses neutral login guidance only
- [ ] **Must not change:** `submitVoteByIndex` body `{ option_index }` only; vote transaction order

### 5.9 Results — demo/live/readonly guidance

- [ ] Demo intro vs live visibility onboarding (`syncResultsPageLeadParagraphs`) stays distinct
- [ ] Collecting / unavailable / readonly onboarding does not leak counters or hidden-tier explanation
- [ ] Demo path links (`/results/demo`) remain clearly non-production
- [ ] **Must not change:** result visibility evaluator tiers; display-safe result object ceiling

### 5.10 FAQ / trust-levels — cross-page wording alignment

- [ ] Collecting / readonly / locked-period wording matches homepage trust-row and vote/results intros
- [ ] Login and profile requirements align with registration/login/profile onboarding copy
- [ ] Demo/MVP path notes (`X-User-Id`, `?live=1`, `creator_session`) stay consistent across surfaces
- [ ] **Must not change:** static policy page structure; no new backend reads for alignment

---

## 6. Risk Classification

| Risk area | Default risk | Future copy polish rule |
|-----------|--------------|-------------------------|
| Homepage onboarding / profile-completion prompt | Medium | Homepage-only prompt; neutral copy; `/profile` CTA only; no eligibility disclosure |
| Header / nav auth-state copy | Medium | No session/token echo; registration ≠ login; demo vs production paths explicit |
| Registration-to-login guidance | Medium | Success → `/login` only; no auto-login implication |
| Login-to-profile guidance | Medium | Encourage profile setup without vote guarantee or field expansion |
| Profile completion guidance | Medium | Two-field ceiling only; align with vote pre-vote hints |
| Poll creation demo/live onboarding | Medium | Demo vs live path clarity only; no API drift |
| My Polls creator flow onboarding | Medium | No ownership/session authority change in copy |
| Vote unauthenticated / profile-incomplete guidance | High | No eligibility outcome language; no vote guarantee |
| Results demo/live/readonly onboarding | High | No counter/tier leakage in intro copy |
| FAQ / trust-levels cross-page alignment | Low–Medium | Wording only; no policy expansion beyond MVP |
| `quality_badge` adjacent onboarding copy | Medium | No badge explanation expansion; `positive_feedback` → `回饋良好` only |
| Raw Option Linkage Ban | High | No option choice + user/session/device/request/log/trace/metric/error linkage |
| Backend/API/schema | High | Out of scope for all copy polish slices |

---

## 7. Privacy, Auth, API, and Schema Boundaries

Future onboarding/navigation copy polish must **preserve**:

| Boundary | Requirement |
|----------|-------------|
| Raw Option Linkage Ban | No durable user-option linkage in onboarding copy, logs, metrics, analytics, APM, or error payloads |
| Option linkage | No option choice + user/session/device/request/log/trace/metric/error linkage added |
| Official Vote | Transaction order unchanged |
| Vote-by-index | Body `{ option_index }` only; eligibility-before-option-resolve unchanged |
| Result visibility | Display-safe tiers unchanged; no counter leakage in onboarding copy |
| Eligibility / auth | No `UserAuthResolver` drift; no eligibility outcome disclosure in onboarding copy |
| Profile fields | Only `birth_year_month` / `residential_region` |
| Registration | Does not auto-login; does not Set-Cookie |
| Registration success | does not call `GET /users/me` after success |
| `/users/me` | Only `user_id` / `display_name` |
| Creator session | Ownership / lifecycle APIs unchanged (`GET /creator/session`, `GET /creator/polls`, `POST /creator/polls/:id/*`) |
| `quality_badge` | Presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected silent; not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank |
| Observability | No new `console.*`, analytics, APM, or debug payloads in onboarding handlers |

---

## 8. Explicit Non-Goals

Phase 222 does **not** implement or approve:

| Non-goal | Status |
|----------|--------|
| no runtime change | **This phase** — plan/docs only |
| no API change | **Out of scope** |
| no frontend change | **Out of scope** — copy-only in future approved slices |
| no migration | **Out of scope** |
| no schema change | **Out of scope** |
| no CSS/HTML/JS copy changes | **Out of scope in Phase 222** — future approved runtime only |
| DB / schema / migration | **Out of scope** |
| API contract / payload changes | **Out of scope** |
| Auth / session / `UserAuthResolver` changes | **Out of scope** |
| Registration auto-login or cookie issuance | **Forbidden** |
| New profile fields beyond `birth_year_month` / `residential_region` | **Forbidden** |
| Vote transaction / eligibility evaluator changes | **Out of scope** |
| Result visibility / result evaluator changes | **Out of scope** |
| Reference Answer integration changes | **Out of scope** |
| Creator ownership / lifecycle API behavior changes | **Out of scope** |
| Ranking / recommendation / personalization | **Out of scope** |
| `quality_badge` behavior or label expansion | **Out of scope** |
| Eligibility outcome disclosure in onboarding copy | **Forbidden** |
| Unavailable production behavior promises in demo/MVP copy | **Forbidden** |
| Hidden counters or internal lifecycle details in onboarding copy | **Forbidden** |
| Option/user/session/device/request/log/trace/metric/error linkage | **Forbidden** |
| `design-drafts/` commits | **Excluded** |

**Plan/docs only.** No `src/`, `migrations/`, `public/frontend/*.js`, `public/*.html`, or `public-mvp.css` runtime change in Phase 222.

---

## 9. Suggested Guard Tests for Future Implementation Phase

When a future runtime phase is approved, add focused tests similar to Phase 94/143/164 patterns:

| Test focus | Example assertions |
|------------|-------------------|
| Onboarding copy constants | `auth-state-copy.js`, `PUBLIC_CTA_*`, profile-completion constants contain only frontend-owned strings |
| Registration-to-login | Success copy links to `/login` only; no auto-login strings |
| Login-to-profile | Post-login hints may reference `/profile`; no field expansion |
| Header auth-state | Guest/demo chip copy; no session/token echo |
| Vote guidance | Intro bullets and pre-vote hints contain no eligibility outcome copy |
| Results onboarding | Demo/live intro separation; no raw counts in intro copy |
| FAQ/trust-levels alignment | Shared collecting/readonly/login phrases across surfaces |
| `quality_badge` | `shouldRenderQualityFeedbackBadge` unchanged; no tooltip/debug paths |
| Linkage / observability | No forbidden tokens; no `localStorage`/`sessionStorage`/cookie in onboarding modules |
| Backend untouched | `src/`, migrations lack phase marker |

Suggested filenames (future, not Phase 222):

- `tests/frontend/phase-223-public-mvp-onboarding-navigation-copy-consistency-polish.test.ts`
- `tests/docs/phase-223-public-mvp-onboarding-navigation-copy-consistency-polish-doc.test.ts`
- `tests/frontend/phase-224-public-mvp-onboarding-navigation-copy-runtime-review-checkpoint.test.ts` (review checkpoint after runtime)

---

## 10. Suggested Future Phase Sequence (Not Approved Here)

1. **Phase 222-R (review checkpoint)** — review this plan against Phase 201–221 governance; approve a minimal copy-only runtime slice (e.g. homepage + header auth-state onboarding copy first).
2. **Phase 223 (runtime)** — implement only the approved slice with focused guard tests; copy/constants only, no new API paths.
3. **Phase 224 (review checkpoint)** — confirm no auth/profile/creator/vote/result/`quality_badge` boundary drift.
4. **Phase 225+ (optional slices)** — account-flow guidance (registration/login/profile), creator-flow guidance (poll creation/my-polls), participation guidance (vote/results), FAQ/trust-levels alignment — each in small approved slices followed by a review checkpoint.

Each runtime slice must remain copy-only unless a separate governance phase explicitly approves more.

---

## 11. Guard Tests Added (Phase 222)

| Test file | Role |
|-----------|------|
| `tests/docs/phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-doc.test.ts` | Doc + README index guard |

---

## 12. Validation Checklist

Phase 222 (plan delivery):

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
```

Focused test:

- `tests/docs/phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-doc.test.ts`

Future runtime phase (when approved) should additionally run:

```bash
npm run smoke:public:local
```

`design-drafts/` remains outside the committed delivery scope.

---

## 13. Privacy and Integrity Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 222 is planning documentation and doc guards only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes. Raw Option Linkage Ban preserved.
