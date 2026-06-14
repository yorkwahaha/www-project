# WWW Project Phase 235 — FAQ Onboarding / Help Copy Plan v1

**Status:** plan only. Phase 235 plans future low-risk FAQ and help copy consistency review and polish across `/faq`, `/trust-levels` cross-page alignment, and FAQ links from account, creator, and participant onboarding surfaces — without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility evaluator, creator session, lifecycle, Official Vote transaction order, vote-by-index, `quality_badge`, or registration/login/profile behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 235.**

**Baseline:** `origin/master` after Phase 234 public onboarding copy milestone checkpoint (`677252e`).

**Prior checkpoint:** [Phase 234 public onboarding copy milestone checkpoint](./www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md).

**Related context:**

- [Phase 222 public MVP onboarding / navigation copy consistency plan](./www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md) — original FAQ / trust-levels alignment slice (deferred)
- [Phase 234 public onboarding copy milestone checkpoint](./www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md) — completed account, creator, and participant onboarding copy arcs
- [Public FAQ draft](./www-project-public-faq-draft-v1.md) — user-facing FAQ source material (non-runtime)
- [Phase 39 poll lifecycle policy](./www-project-phase-39-poll-lifecycle-policy-v1.md) — lifecycle meaning authority
- [Phase 40 user profile eligibility follow policy](./www-project-phase-40-user-profile-eligibility-follow-policy-v1.md) — profile/eligibility policy authority

---

## 1. Plan Purpose

Phase 235 is **plan only**. It identifies low-risk, copy-only review and polish candidates for **FAQ and help onboarding guidance** after:

1. Phase 222–234 public onboarding copy plan, delivery, review checkpoints, and milestone.
2. Completed onboarding slices for account (home/header/registration/login/profile), creator (poll creation/my-polls), and participant (vote/results).

This plan answers:

1. How FAQ/help copy can explain registration → login → profile in plain language aligned with Phase 223–226 account onboarding copy.
2. How FAQ/help copy can explain create poll → my-polls in plain language aligned with Phase 229–230 creator onboarding copy.
3. How FAQ/help copy can explain vote → results in plain language aligned with Phase 232–233 participant onboarding copy.
4. How demo / live / preview / read-only wording should stay distinct only where existing behavior already supports it.
5. Which copy categories are forbidden (eligibility disclosure expansion, counter leakage, backend error echo, technical jargon in primary copy, policy/lifecycle/result visibility meaning drift).
6. What explicit non-goals, page-by-page checklist, copy principles, risk classification, guard tests, and review gates apply before any runtime phase.

Phase 235 does **not** approve implementation. Future FAQ copy polish runtime requires a separately approved phase (e.g. Phase 235-R review checkpoint + Phase 236+ runtime slice).

---

## 2. Scope

### 2.1 In scope (planning only)

| Surface | Current shell / runtime | Future copy review may touch |
|---------|-------------------------|------------------------------|
| `/faq` | `faq.html` (static policy info page) | Hero lead, summary cards, FAQ Q&A items, cross-links to `/registration`, `/login`, `/profile`, `/polls/new`, `/my-polls`, `/vote/demo`, `/results/demo` |
| `/trust-levels` | `trust-levels.html` (static policy info page) | Hero lead, matrix intro notes, cross-links to `/faq`; wording alignment with collecting/readonly/login guidance only |
| Cross-page FAQ links | `public-mvp-home.js`, `vote-page.js`, `my-polls-page.js`, `create-poll.html`, `login.html`, `index.html`, `results.html` | Link label consistency only (`PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL`, existing「常見問題」anchors); no new fetch or behavior |
| Help alignment with onboarding slices | Completed allowlists in `public-mvp-ui.js`: `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, `PUBLIC_CREATOR_ONBOARDING_MESSAGES`, `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` | FAQ answers should use the same user-facing phrases for registration auto-login denial, profile fields, demo paths, collecting hidden-count, lifecycle blocked states |

Shared assets likely touched in a future runtime slice:

- `public/faq.html` — static FAQ copy and mount-point structure only
- `public/trust-levels.html` — static trust-levels intro/copy alignment only
- `public/frontend/public-mvp-ui.js` — possible new `PUBLIC_FAQ_ONBOARDING_MESSAGES` allowlist; shared FAQ link labels
- Possible future `syncFaqPageOnboardingCopy` or equivalent static-shell sync only if mount points are introduced in a future approved slice

### 2.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- Account, creator, and participant **onboarding surface** copy rewrites (delivered in Phase 223–233; revisit only for cross-page phrase alignment).
- Empty / loading / error **state copy** rewrites (covered by Phase 215, 219–220; not reopened).
- CSS/HTML layout, spacing, tap-target, or accessibility polish (Phase 201–213; not reopened unless copy host alignment required in a future approved slice).
- Auth/session/login resolver, `UserAuthResolver`, registration/login/profile behavior changes.
- Vote transaction, vote-by-index body, eligibility evaluator, result visibility tier changes.
- Creator session authority, ownership rules, lifecycle transition logic, poll creation payload, delete/close/cancel/unpublish behavior.
- New profile fields beyond `birth_year_month` and `residential_region`.
- Registration does not auto-login (no auto-login), `Set-Cookie`, or `GET /users/me` reads on registration submit.
- Ranking, recommendation, personalization, `quality_badge` expansion, trust/score UI beyond existing static matrix draft.
- `design-drafts/` commits.

---

## 3. Current Copy Baseline (Pre-Runtime Review Targets)

Phase 235 plans copy-only improvements on top of the existing FAQ/help static boundary:

| Area | Current surface | Plan focus |
|------|-----------------|------------|
| FAQ hero lead | `faq.html` `#faq-heading` section | Clarify help purpose; link to `/trust-levels` with consistent collecting/readonly wording |
| FAQ summary cards | `.mvp-faq-summary-grid` | Align collecting hidden-count, close/lock period, cancel vs unpublish with Phase 232–233 participant copy and Phase 39 lifecycle policy |
| Profile / eligibility FAQ |「為什麼要填出生年月與居住地區？」| Align with `PUBLIC_PROFILE_COMPLETION_PROMPT_HINT` and Phase 225–227 profile guidance; 出生年月/居住地區 only; no eligibility guarantee |
| Eligibility failure FAQ |「沒有投票資格怎麼辦？」| Align with neutral pre-vote hint boundaries; do not expand pass/fail rule disclosure beyond existing MVP behavior |
| Account flow FAQ (gap) | No dedicated FAQ item today | Plan new Q&A for registration → login → profile using Phase 223–226 phrases (註冊不會自動登入; login → profile next step) |
| Creator flow FAQ (gap) | No dedicated FAQ item today | Plan new Q&A for `/polls/new` demo vs `?live=1` and `/my-polls` management using Phase 229–230 phrases |
| Participant flow FAQ (gap) | Partial coverage in collecting/close/cancel items | Plan vote → results navigation and readonly results purpose using Phase 232–233 phrases |
| Engineer-facing residue | `faq.html` notes mentioning `X-User-Id`, `creator_session`, `production user-auth wiring later` | Replace with user-facing demo/production boundary copy aligned with account/creator onboarding delivery |
| Trust-levels cross-page | `trust-levels.html` hero + matrix intro | Align login/requirement wording with FAQ; no new permission matrix behavior |
| Cross-links from onboarding surfaces | `/faq` anchors on vote policy, home, my-polls, create-poll, login | Ensure linked FAQ sections exist and use consistent terminology |

**Must not change in future runtime without separate governance approval:** lifecycle meaning (collecting, close, public lock, cancel, unpublish); result visibility evaluator tiers; Official Vote transaction order; `submitVoteByIndex` body `{ option_index }` only; eligibility-before-option-resolve; registration/login/profile/creator session API behavior.

---

## 4. Copy Principles (Future Runtime)

All future FAQ / help copy polish must follow these principles:

| Principle | Requirement |
|-----------|-------------|
| **Simple** | Short, plain-language Q&A; one primary idea per answer |
| **User-facing** | Avoid engineer-facing jargon (`X-User-Id`, `creator_session`, `AUTH_REQUIRED`, `fail closed`, internal codes) in primary FAQ copy |
| **Non-debug** | No request id, trace id, internal code, shard id, option id, or backend diagnostic tokens in UI |
| **No backend/internal error echo** | FAQ must not instruct users to read API errors or backend payloads |
| **No new behavior implication** | FAQ must not imply new login types, auto session creation, eligibility preview APIs, vote guarantees, or unavailable production features |
| **No eligibility disclosure expansion** | Do not add age thresholds, region allowlists, trust-rule breakdowns, or which condition failed beyond existing MVP neutral wording |
| **No profile completion guarantee** | Profile FAQ must not imply filling 出生年月/居住地區 guarantees voting eligibility |
| **No result visibility drift** | Collecting hidden-count, display-safe result tier, and lifecycle-blocked meaning must match Phase 232–233 and result evaluator policy |
| **No policy/lifecycle meaning change** | FAQ clarifies existing rules; does not invent new lifecycle transitions or result visibility tiers |
| **Demo vs live clarity** | Demo/showcase paths (`/vote/demo`, `/results/demo`, `?live=1` notes) remain distinct from live production paths |
| **Read-only results clarity** | Results FAQ explains readonly public aggregate purpose without implying vote authority on results surface |
| **Onboarding slice alignment** | FAQ phrases for account, creator, and participant flows should match completed `PUBLIC_*_ONBOARDING_MESSAGES` constants where applicable |

Additional alignment rules:

- FAQ may link to `/registration`, `/login`, `/profile`, `/polls/new`, `/my-polls`, vote/results pages with href-only anchors.
- FAQ must not add `fetch`, storage, auth checks, or eligibility evaluation.
- Trust-levels matrix remains a static draft table; FAQ alignment is wording only.

---

## 5. Allowed Copy-Only Future Changes

A future approved runtime phase (not Phase 235) may change **only** frontend-owned user-visible FAQ/help strings and their safe wiring:

| Category | Allowed change | Constraint |
|----------|----------------|------------|
| Account flow FAQ | Registration → login → profile Q&A | Align with `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`; no auto-login implication |
| Creator flow FAQ | Create poll → my-polls Q&A | Align with `PUBLIC_CREATOR_ONBOARDING_MESSAGES`; no new creator authority |
| Participant flow FAQ | Vote → results, collecting/readonly Q&A | Align with `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`; no counter leakage |
| Lifecycle / visibility FAQ | Collecting, close, lock, cancel, unpublish answers | Lifecycle meaning unchanged |
| Demo / preview FAQ | Demo path notes for vote/results/create | No API selection logic change |
| Engineer residue removal | Replace `X-User-Id` / `creator_session` demo notes with user-facing wording | No new auth behavior |
| Trust-levels intro alignment | Hero/matrix intro cross-links and collecting/login phrasing | Static page only |
| Shared allowlist | Possible `PUBLIC_FAQ_ONBOARDING_MESSAGES` in `public-mvp-ui.js` | Frontend-owned copy only |
| Cross-page link labels | Consistent「常見問題」/ FAQ anchor labels on existing links | href only |

**Default forbidden in future runtime unless explicitly approved in a separate governance phase:**

- New `fetch` paths, credentials changes, or API payload fields
- Backend error code / `message` field echo in FAQ
- Vote counts, percentages, eligibility outcomes, or result-tier leakage in FAQ answers
- Implying the visitor voted, which option they chose, or whether they were eligible
- `localStorage`, `sessionStorage`, cookie usage
- `console.*`, analytics, APM, or debug payloads
- New eligibility checks, vote-time evaluator reads for copy, or qualification disclosure beyond existing behavior
- Implying registration auto-login, Set-Cookie, or new vote/creator authority
- Changing lifecycle policy, result visibility tiers, or `quality_badge` behavior
- tooltip, debug, explanation, counts, score, rank, ranking, recommendation, personalization, trust, creator score, or governance expansion in FAQ answers

---

## 6. Page-by-Page Review Checklist (Future Runtime)

Use this checklist in a future implementation phase. Each item is **copy-only** unless a real blocker requires separate governance approval.

### 6.1 `/faq` — account onboarding help

- [ ] Add or refine Q&A for registration → login → profile using Phase 223–226 phrases
- [ ] State 註冊不會自動登入; success directs to `/login` with same credential
- [ ] State login establishes session and shows display name in header
- [ ] Profile Q&A references 出生年月/居住地區 only; does not guarantee eligibility
- [ ] Remove or rewrite engineer-facing `X-User-Id` / `production user-auth wiring later` notes
- [ ] Cross-link `/trust-levels` with consistent login/collecting phrasing
- [ ] **Must not change:** `POST /registration`, `POST /login/session`, profile API fields

### 6.2 `/faq` — creator-flow help

- [ ] Add or refine Q&A for `/polls/new` demo vs `?live=1` using Phase 229 phrases
- [ ] Add or refine Q&A for `/my-polls` owned-poll management using Phase 229–230 phrases
- [ ] Explain create → my-polls next steps without implying external poll management
- [ ] Align collecting hidden-count wording with vote/results onboarding copy
- [ ] **Must not change:** `POST /creator/polls`, `GET /creator/session`, `GET /creator/polls`, lifecycle APIs

### 6.3 `/faq` — participant vote/results help

- [ ] Align collecting hidden-count FAQ with `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT`
- [ ] Align close / lock / cancel / unpublish FAQ with existing lifecycle meaning
- [ ] Add or refine vote → results and results → vote navigation guidance using Phase 232–233 phrases
- [ ] Clarify demo/showcase paths (`/vote/demo`, `/results/demo`) as non-persisting preview where applicable
- [ ] Eligibility-failure FAQ stays neutral; no expanded rule disclosure
- [ ] **Must not change:** Official Vote transaction order; `{ option_index }` only; result visibility tiers

### 6.4 `/trust-levels` — cross-page alignment

- [ ] Hero intro cross-link to `/faq` uses consistent collecting/readonly/login phrasing
- [ ] Matrix intro notes do not contradict account/creator/participant onboarding copy
- [ ] No new permission behavior implied beyond existing static draft matrix
- [ ] **Must not change:** trust matrix structure as behavior contract; wording only

### 6.5 Cross-page FAQ links from onboarding surfaces

- [ ] Vote policy FAQ link (`PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL`) targets aligned FAQ section
- [ ] Home, login, create-poll, my-polls, results FAQ links use consistent labels
- [ ] Link targets remain `/faq` or `/trust-levels` href only
- [ ] **Must not change:** onboarding sync functions beyond link label/anchor text if needed

---

## 7. Risk Classification

| Risk area | Default risk | Future copy polish rule |
|-----------|--------------|-------------------------|
| Account flow FAQ (registration/login/profile) | High | No auto-login/Set-Cookie implication; no eligibility guarantee |
| Profile / eligibility FAQ | High | 出生年月/居住地區 only; no pass/fail rule expansion |
| Creator flow FAQ | Medium | No new creator authority; demo vs `?live=1` clarity only |
| Participant vote/results FAQ | High | No counter/tier leakage; lifecycle meaning unchanged |
| Demo / preview / read-only FAQ | Medium | No unavailable production behavior promise |
| Trust-levels cross-page alignment | Medium | Wording only; no permission matrix behavior change |
| Engineer residue removal | Low–Medium | User-facing replacement only |
| Raw Option Linkage Ban | High | No option choice + user/session/device/request/log/trace/metric/error linkage |
| Backend/API/schema | High | Out of scope for all FAQ copy polish slices |

---

## 8. Privacy, Auth, API, and Schema Boundaries

Future FAQ / help copy polish must **preserve**:

| Boundary | Requirement |
|----------|-------------|
| Raw Option Linkage Ban | No durable user-option linkage in FAQ copy, logs, metrics, analytics, APM, or error payloads |
| Option linkage | No option choice + user/session/device/request/log/trace/metric/error linkage added |
| Official Vote transaction order | Unchanged |
| Vote-by-index | `{ option_index }` only; eligibility-before-option-resolve unchanged |
| Registration | No auto-login; no Set-Cookie; does not call `GET /users/me` after success |
| Login | `POST /login/session` then `GET /users/me` unchanged |
| `/users/me` | `user_id` / `display_name` only |
| Profile API | `birth_year_month` / `residential_region` only |
| Creator session / ownership / lifecycle | Unchanged |
| Poll creation / delete / close / cancel / unpublish | Unchanged |
| Result visibility tiers | Unchanged |
| Lifecycle meaning | Unchanged |
| `quality_badge` | Presentation-only (`positive_feedback` → `回饋良好`; null/missing/unexpected silent) |
| `UserAuthResolver` | Unchanged |

---

## 9. Suggested Future Phase Sequence

1. **Phase 235 (this phase)** — FAQ / help copy plan only.
2. **Phase 235-R** — plan review checkpoint against Phase 234 governance; approve constrained copy-only FAQ runtime slice.
3. **Phase 236+** — minimal FAQ / help copy runtime patch (static `faq.html` / `trust-levels.html` alignment, possible `PUBLIC_FAQ_ONBOARDING_MESSAGES` allowlist) followed by review checkpoint.

Each runtime slice should remain small, copy-only, and preceded by explicit governance review.

---

## 10. Explicit Non-Goals

Phase 235 does **not** implement or approve:

| Non-goal | Status |
|----------|--------|
| no runtime change | **This phase** — plan/docs only |
| no API change | **This phase** |
| no frontend change | **This phase** |
| no migration | **This phase** |
| no schema change | **This phase** |
| no CSS/HTML/JS copy changes | **This phase** — future approved runtime only |
| DB / schema / migration | Out of scope |
| API contract / payload changes | Out of scope |
| Auth / session / `UserAuthResolver` changes | Out of scope |
| Registration auto-login or cookie issuance | Out of scope |
| New profile fields beyond `birth_year_month` / `residential_region` | Out of scope |
| Vote transaction / eligibility evaluator changes | Out of scope |
| Result visibility / result evaluator changes | Out of scope |
| Lifecycle meaning changes | Out of scope |
| Creator session / ownership / lifecycle behavior changes | Out of scope |
| Poll creation / delete / close / cancel / unpublish behavior changes | Out of scope |
| Option/user/session/device/request/log/trace/metric/error linkage | Out of scope |
| `design-drafts/` commits | Out of scope |

---

## 11. Focused Guard Tests

- `tests/docs/phase-235-faq-onboarding-help-copy-plan-doc.test.ts`

Phase 234 milestone guards remain the onboarding alignment baseline:

- `tests/frontend/phase-234-public-onboarding-copy-milestone-checkpoint.test.ts`
- `docs/www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md`

Public FAQ draft remains reference material only:

- `docs/www-project-public-faq-draft-v1.md`

---

## 12. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 13. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 235 is plan documentation and doc guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
