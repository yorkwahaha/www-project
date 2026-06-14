# WWW Project Phase 228 — Poll Creation / My Polls Onboarding Navigation Copy Plan v1

**Status:** plan only. Phase 228 plans future low-risk poll creation and my-polls onboarding / navigation copy consistency review and polish across `/polls/new`, `/my-polls`, and create ↔ my-polls next-step guidance — without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, creator session authority, or lifecycle behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 228.**

**Baseline:** `origin/master` after Phase 227 account onboarding copy milestone checkpoint (`878dfae`).

**Prior checkpoint:** [Phase 227 account onboarding copy milestone checkpoint](./www-project-phase-227-account-onboarding-copy-milestone-checkpoint-v1.md).

**Related context:**

- [Phase 222 public MVP onboarding / navigation copy consistency plan](./www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md) — broader onboarding plan; poll creation / my-polls slice deferred to this phase
- [Phase 219 poll creation / my polls state copy minimal runtime patch](./www-project-phase-219-poll-creation-my-polls-state-copy-runtime-v1.md) — loading / error / empty **state copy** (delivered)
- [Phase 220 poll creation / my polls state copy runtime review checkpoint](./www-project-phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint-v1.md) — Phase 219 review approval
- [Phase 129 creator poll creation runtime review checkpoint](./www-project-phase-129-creator-poll-creation-runtime-review-checkpoint-v1.md) — creator create API boundary
- [Phase 130 creator lifecycle controls runtime review checkpoint](./www-project-phase-130-creator-lifecycle-controls-runtime-review-checkpoint-v1.md) — lifecycle API boundary
- [Phase 121 my polls runtime review checkpoint](./www-project-phase-121-my-polls-runtime-review-checkpoint-v1.md) — owned-list API boundary

---

## 1. Plan Purpose

Phase 228 is **plan only**. It identifies low-risk, copy-only review and polish candidates for **creator onboarding and navigation guidance** on poll creation and my-polls surfaces after:

1. Phase 222–227 account onboarding copy plan, delivery, and milestone.
2. Phase 219–220 poll creation / my-polls **state copy** delivery (loading, error, empty, submit-pending).

This plan answers:

1. What users can do on `/polls/new` and `/my-polls` in plain language without implying new creator or auth behavior.
2. How demo vs `?live=1` creation paths should be explained without changing API selection logic.
3. How my-polls should explain managing polls created through the existing creator/session flow.
4. What next-step navigation copy is safe after creating or managing polls (create → my-polls, my-polls → create, success → share/manage).
5. Which copy categories are forbidden (new creator authority, vote/result visibility leakage, backend error echo, technical jargon in primary copy).
6. What explicit non-goals, page-by-page checklist, copy principles, risk classification, guard tests, and review gates apply before any runtime phase.

Phase 228 does **not** approve implementation. Future copy polish runtime requires a separately approved phase (e.g. Phase 228-R review checkpoint + Phase 229+ runtime slice).

---

## 2. Scope

### 2.1 In scope (planning only)

| Surface | Current shell / runtime | Future copy review may touch |
|---------|-------------------------|------------------------------|
| `/polls/new` | `create-poll.html`, `create-poll-page.js` | Page lead, demo banner, demo vs `?live=1` onboarding, post-create success next-step hints, navigation to `/my-polls` |
| `/my-polls` | `my-polls.html`, `my-polls-page.js` | Page lead, demo dashboard vs `?live=1` path explanation, sign-in / creator-session onboarding where existing behavior already supports it, navigation to `/polls/new` |
| Create ↔ My Polls navigation | `creator-flow-copy.js`, `PUBLIC_CTA_*`, shared creator hints in `public-mvp-ui.js` | Cross-links and next-step guidance between create poll and my-polls only |

Shared assets likely touched in a future runtime slice:

- `public/frontend/public-mvp-ui.js` — `PUBLIC_CREATE_POLL_PAGE_LEAD`, `PUBLIC_MY_POLLS_PAGE_LEAD`, `PUBLIC_CREATOR_*` hints, possible new `PUBLIC_CREATOR_ONBOARDING_MESSAGES` allowlist
- `public/frontend/creator-flow-copy.js` — re-exports of shared creator onboarding constants
- `public/frontend/create-poll-page.js` — `syncCreatePollPageOnboardingCopy` (or equivalent) for banner/lead/hint mount points
- `public/frontend/my-polls-page.js` — `syncMyPollsPageOnboardingCopy` for banner/lead/hint mount points
- `create-poll.html`, `my-polls.html` — static fallback + mount points only

### 2.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- Homepage, header/auth-state, registration, login, profile, vote, results, FAQ/trust-levels onboarding slices (covered by Phase 222–227 or separate future phases).
- Empty / loading / error **state copy** rewrites (covered by Phase 219–220; revisit only if onboarding copy host overlaps).
- CSS/HTML layout, spacing, tap-target, or accessibility polish (Phase 201–213; not reopened unless copy host alignment required in a future approved slice).
- Auth/session/login resolver, `UserAuthResolver`, registration/login/profile behavior changes.
- Vote transaction, vote-by-index, eligibility evaluator, result visibility tier changes.
- Creator session authority, ownership rules, lifecycle transition logic, poll creation payload, delete/close/cancel/unpublish behavior.
- New profile fields beyond `birth_year_month` and `residential_region`.
- Registration does not auto-login (no auto-login), `Set-Cookie`, or `GET /users/me` reads on registration submit.
- Ranking, recommendation, personalization, `quality_badge` expansion, trust/score UI.
- `design-drafts/` commits.

---

## 3. Current Copy Baseline (Pre-Runtime Review Targets)

Phase 228 plans copy-only improvements on top of the existing creator runtime boundary:

| Area | Current constant / surface | Plan focus |
|------|---------------------------|------------|
| Create page lead | `PUBLIC_CREATE_POLL_PAGE_LEAD` via `#create-poll-page-lead` | Clarify what users can do; publish immutability; no mid-collection result preview |
| Demo creation | `PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD`, demo banner in `create-poll.html` | Clarify showcase submit does not persist; distinct from `?live=1` |
| Live creation | `?live=1` + `POST /creator/polls` via `submitCreatePoll` | Clarify live path uses existing creator session flow; no new auth behavior implied |
| Post-create success | `PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT`, `PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT` via `creator-flow-copy.js` | Clarify share vote link and next steps to my-polls / creator results |
| My Polls lead | `PUBLIC_MY_POLLS_PAGE_LEAD`, `PUBLIC_CREATOR_MY_POLLS_LEAD_HINT` | Clarify owned-poll management through creator/session flow |
| Demo my-polls | `my-polls.html` mock banner, `data-mock-dashboard` | Clarify example dashboard vs `?live=1` owned list without implying new login types |
| Signed-out guidance | `PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE` (where mounted) | Use existing sign-in paths only; no new auth behavior |
| Cross-navigation | `PUBLIC_CTA_GO_TO_MY_POLLS_LABEL`, `PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL` | Align create ↔ my-polls next-step wording |

**Must not change in future runtime without separate governance approval:** `POST /creator/polls`, `GET /creator/session`, `GET /creator/polls`, `POST /creator/polls/:id/cancel|close|unpublish`, `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, `CREATOR_OWNED_POLL_ALLOWED_KEYS`, demo vs live API selection logic.

---

## 4. Copy Principles (Future Runtime)

All future poll creation / my-polls onboarding copy polish must follow these principles:

| Principle | Requirement |
|-----------|-------------|
| **Simple** | Short, plain-language guidance; one primary idea per hint |
| **User-facing** | Avoid engineer-facing jargon (`creator_session`, `X-User-Id`, internal codes) in primary onboarding copy; demo-path notes may reference MVP demo paths only where already required |
| **Non-debug** | No request id, trace id, internal code, shard id, option id, or backend diagnostic tokens in UI |
| **No backend/internal error echo** | Use `resolvePublicErrorUserMessage` where errors appear; never echo `error.message` or foreign backend payloads |
| **No new creator/auth behavior implication** | Copy must not imply new login types, auto session creation, ownership authority, or lifecycle powers beyond existing APIs |
| **No vote/result visibility drift** | Do not weaken collecting hidden-count, display-safe result tier, or lifecycle meaning in onboarding copy |
| **No hidden counters or internal lifecycle details** | Onboarding copy must not leak vote counts, percentages, ranking, or internal poll lifecycle mechanics beyond existing neutral policy wording |
| **Demo vs live clarity** | Demo/showcase paths and `?live=1` creator paths remain visually and semantically distinct |

Additional alignment rules:

- Post-create success may guide to `/my-polls` or creator results links only; no new API calls.
- My-polls onboarding explains managing polls from the existing creator/session flow; does not promise unavailable production features.
- Signed-in / signed-out guidance uses only paths already supported by runtime (login CTAs, creator-session-unavailable neutral copy).
- Navigation between create poll and my-polls uses shared `PUBLIC_CTA_*` labels where applicable.

---

## 5. Allowed Copy-Only Future Changes

A future approved runtime phase (not Phase 228) may change **only** frontend-owned user-visible onboarding/navigation strings and their safe wiring:

| Category | Allowed change | Constraint |
|----------|----------------|------------|
| Poll creation page guidance | Lead, banner, demo/live intro, field-purpose helper copy | No new `fetch` paths; no payload changes |
| Demo vs live creation wording | Clarify showcase vs `?live=1` `POST /creator/polls` | No API selection logic change |
| Post-create next-step hints | Share vote link, go to my-polls, creator results guidance | Navigation href only |
| My Polls management guidance | Owned-list purpose, demo dashboard vs live owned list | No hidden counters; no lifecycle authority change in copy |
| Create ↔ My Polls navigation | Cross-links, CTA labels, success-panel next-step hints | Shared `PUBLIC_CTA_*` / creator hint constants |
| Signed-in / signed-out guidance | Neutral sign-in or creator-session-unavailable copy where already mounted | No new auth resolver behavior |
| Static HTML fallback alignment | `create-poll.html`, `my-polls.html` fallback matches JS mount constants | Mount points only |

**Default forbidden in future runtime unless explicitly approved in a separate governance phase:**

- New `fetch` paths, credentials changes, or API payload fields
- Backend error code / `message` field echo in UI
- Vote counts, percentages, eligibility outcomes, or result-tier leakage in onboarding copy
- `localStorage`, `sessionStorage`, cookie usage for onboarding memory
- `console.*`, analytics, APM, or debug payloads in onboarding handlers
- Implying registration auto-login, Set-Cookie, or new creator ownership authority

---

## 6. Page-by-Page Review Checklist (Future Runtime)

Use this checklist in a future implementation phase. Each item is **copy-only** unless a real blocker requires separate governance approval.

### 6.1 `/polls/new` — poll creation guidance

- [ ] `#create-poll-page-lead` clarifies what users can do on this page (create poll, publish immutability, no mid-collection result preview)
- [ ] Demo banner / `PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD` states showcase submit does not persist data
- [ ] `?live=1` onboarding explains live creation uses existing creator session flow without implying new auth behavior
- [ ] Post-create success hints (`PUBLIC_CREATOR_CREATE_SUCCESS_*`) guide share vote link and next steps to my-polls / creator results
- [ ] Cross-link to `/my-polls` uses shared `PUBLIC_CTA_*` labels
- [ ] FAQ/trust-levels policy references stay aligned where linked
- [ ] **Must not change:** `submitCreatePoll` / `submitCreatePollDemo` API selection; `POST /creator/polls` payload; creator session boundary

### 6.2 `/my-polls` — owned poll management guidance

- [ ] `#my-polls-page-lead` clarifies my-polls is for managing polls created through the existing creator/session flow
- [ ] Demo dashboard banner explains example data vs `?live=1` owned list
- [ ] `PUBLIC_CREATOR_MY_POLLS_LEAD_HINT` / live manage panel lead stays neutral; no hidden counters
- [ ] Sign-in required / creator-session-unavailable copy uses safe CTAs only where existing behavior supports it
- [ ] Cross-link to `/polls/new` or `/polls/new?live=1` uses shared CTA labels without promising unavailable production behavior
- [ ] Lifecycle action hints (`PUBLIC_CREATOR_ACTION_*`) remain policy-accurate; no new lifecycle powers implied
- [ ] **Must not change:** `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, `CREATOR_OWNED_POLL_ALLOWED_KEYS`, lifecycle `POST /creator/polls/:id/*`

### 6.3 Create ↔ My Polls navigation hints

- [ ] Post-create success panel guides to my-polls and/or creator results with consistent wording
- [ ] My-polls empty or onboarding state may guide to create poll when appropriate
- [ ] Navigation hints do not imply vote counts, result previews, or eligibility outcomes
- [ ] **Must not change:** header auth-state behavior; registration/login/profile flows

---

## 7. Risk Classification

| Risk area | Default risk | Future copy polish rule |
|-----------|--------------|-------------------------|
| Poll creation page onboarding | Medium | Demo vs live clarity only; no API drift |
| Demo vs live creation wording | Medium | No unavailable production behavior promise |
| Post-create next-step navigation | Low–Medium | href-only CTAs; no new API calls |
| My Polls owned-list onboarding | Medium | No ownership/session authority change in copy |
| Signed-in / signed-out guidance | Medium | Use existing auth/creator-session paths only |
| Create ↔ my-polls cross-navigation | Low | Shared `PUBLIC_CTA_*`; consistent next-step wording |
| Vote / result visibility adjacent copy | High | No counter/tier leakage; lifecycle meaning unchanged |
| `quality_badge` adjacent copy | Medium | No badge explanation expansion; `positive_feedback` → `回饋良好` only |
| Raw Option Linkage Ban | High | No option choice + user/session/device/request/log/trace/metric/error linkage |
| Backend/API/schema | High | Out of scope for all copy polish slices |

---

## 8. Privacy, Auth, API, and Schema Boundaries

Future poll creation / my-polls onboarding copy polish must **preserve**:

| Boundary | Requirement |
|----------|-------------|
| Raw Option Linkage Ban | No durable user-option linkage in onboarding copy, logs, metrics, analytics, APM, or error payloads |
| Option linkage | No option choice + user/session/device/request/log/trace/metric/error linkage added |
| Official Vote | Transaction order unchanged |
| Vote-by-index | Body `{ option_index }` only; eligibility-before-option-resolve unchanged |
| Result visibility | Display-safe tiers unchanged; no counter leakage in onboarding copy |
| Eligibility / auth | No `UserAuthResolver` drift; registration/login/profile behavior unchanged |
| Profile fields | Only `birth_year_month` / `residential_region` |
| Registration | Does not auto-login; does not Set-Cookie; `POST /registration` unchanged |
| Registration success | does not call `GET /users/me` after success |
| Login | `POST /login/session` then `GET /users/me` (`user_id` / `display_name` only) unchanged |
| Creator session | `GET /creator/session`, `GET /creator/polls`, `POST /creator/polls`, `POST /creator/polls/:id/*` unchanged |
| Poll creation | Payload and ownership rules unchanged; no delete/close/cancel/unpublish behavior change |
| `quality_badge` | Presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected silent; not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank |
| Observability | No new `console.*`, analytics, APM, or debug payloads in onboarding handlers |

---

## 9. Suggested Future Phase Sequence

| Phase | Purpose |
|-------|---------|
| **228** (this phase) | Plan only — poll creation / my-polls onboarding navigation copy consistency |
| **228-R** | Plan review checkpoint — governance approval before runtime |
| **229** | Poll creation / my-polls onboarding navigation copy minimal runtime patch (home slice optional only if explicitly scoped) |
| **229 review checkpoint** | Runtime review — confirm copy-only delivery |

Future runtime should follow the Phase 223–226 account onboarding pattern: centralize constants in `public-mvp-ui.js`, add sync functions, align static HTML fallback with JS mount points, add focused guard tests, and run review checkpoint before milestone consolidation if needed.

---

## 10. Explicit Non-Goals

Phase 228 does **not** implement or approve:

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
| Creator session / ownership / lifecycle behavior changes | Out of scope |
| Poll creation delete / close / cancel / unpublish behavior changes | Out of scope |
| Option/user/session/device/request/log/trace/metric/error linkage | Out of scope |
| `design-drafts/` commits | Out of scope |

---

## 11. Focused Guard Tests

- `tests/docs/phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-doc.test.ts`

Phase 219–220 state-copy guards remain the baseline for loading/error copy:

- `tests/frontend/phase-219-poll-creation-my-polls-state-copy-runtime.test.ts`
- `tests/frontend/phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint.test.ts`

---

## 12. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 13. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 228 is plan documentation and doc guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
