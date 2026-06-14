# WWW Project Phase 231 — Vote / Results Onboarding Navigation Copy Plan v1

**Status:** plan only. Phase 231 plans future low-risk vote and results onboarding / navigation copy consistency review and polish across `/vote/:pollId`, `/results/:pollId`, and vote ↔ results next-step guidance — without implementing any runtime, API, DB, schema, migration, auth, creator session, lifecycle, eligibility evaluator, result visibility, Official Vote transaction order, vote-by-index, `quality_badge`, or registration/login/profile behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 231.**

**Baseline:** `origin/master` after Phase 230 poll creation / my-polls onboarding navigation copy runtime review checkpoint (`d09ae42`).

**Prior checkpoint:** [Phase 230 poll creation / my-polls onboarding navigation copy runtime review checkpoint](./www-project-phase-230-poll-creation-my-polls-onboarding-navigation-copy-runtime-review-checkpoint-v1.md).

**Related context:**

- [Phase 222 public MVP onboarding / navigation copy consistency plan](./www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md) — broader onboarding plan; vote / results slice deferred to this phase
- [Phase 215 explore / vote / results state copy minimal runtime patch](./www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md) — participation **state copy** (loading / error / collecting / pre-vote hints; delivered)
- [Phase 105 official vote pre-vote eligibility UX plan](./www-project-phase-105-official-vote-pre-vote-eligibility-ux-plan-v1.md) — pre-vote hint authority and neutrality boundaries
- [Phase 110 vote UX error handling polish plan](./www-project-phase-110-vote-ux-error-handling-polish-plan-v1.md) — vote success / failure / lifecycle copy map
- [Phase 113 results page empty / unavailable state UX plan](./www-project-phase-113-results-page-empty-unavailable-state-ux-plan-v1.md) — results collecting / unavailable / empty aggregate copy map
- [Phase 227 account onboarding copy milestone checkpoint](./www-project-phase-227-account-onboarding-copy-milestone-checkpoint-v1.md) — registration / login / profile onboarding alignment baseline

---

## 1. Plan Purpose

Phase 231 is **plan only**. It identifies low-risk, copy-only review and polish candidates for **vote and results onboarding and navigation guidance** on `/vote/:pollId` and `/results/:pollId` after:

1. Phase 222–227 account and creator onboarding copy plan, delivery, and milestone.
2. Phase 215 explore / vote / results **state copy** delivery (loading, error, collecting, pre-vote hints, demo vs live results intro split).
3. Phase 229–230 poll creation / my-polls onboarding copy delivery and review.

This plan answers:

1. What users can do on vote pages in plain language without implying new vote or auth behavior.
2. How formal voting may require login / profile completion without revealing eligibility outcomes or guaranteeing qualification.
3. How results pages should explain visibility states without changing lifecycle or result visibility rules.
4. How demo / preview / read-only wording should stay distinct where existing behavior already supports it.
5. What vote ↔ results navigation hints are safe (success panel, results intro, bottom nav, shared CTAs).
6. Which copy categories are forbidden (eligibility disclosure, counter leakage, backend error echo, technical jargon in primary copy).
7. What explicit non-goals, page-by-page checklist, copy principles, risk classification, guard tests, and review gates apply before any runtime phase.

Phase 231 does **not** approve implementation. Future copy polish runtime requires a separately approved phase (e.g. Phase 231-R review checkpoint + Phase 232+ runtime slice).

---

## 2. Scope

### 2.1 In scope (planning only)

| Surface | Current shell / runtime | Future copy review may touch |
|---------|-------------------------|------------------------------|
| `/vote/:pollId` | `vote.html`, `vote-page.js`, `official-vote-pre-vote-hints.js`, `policy-ui-placeholders.js` | Page reminder lead, policy panel bullets, collecting notice, pre-vote hints (anonymous / profile-incomplete / neutral submit), demo banner, success → results navigation hints |
| `/results/:pollId` | `results.html`, `result-page.js` | Demo vs live intro leads, readonly intro (`renderResultsReadOnlyIntro`), collecting / unavailable summaries, demo path guidance, vote-page cross-link hints |
| Vote ↔ Results navigation | `public-mvp-ui.js` `PUBLIC_CTA_*`, vote success panel, results intro vote hint, results bottom nav | Shared CTA labels and next-step guidance between voting and results only |
| Signed-in / signed-out / profile guidance | `official-vote-pre-vote-hints.js`, existing login/profile CTAs | Neutral login and profile-completion guidance only where existing behavior already supports it |

Shared assets likely touched in a future runtime slice:

- `public/frontend/public-mvp-ui.js` — `PUBLIC_VOTE_PAGE_*`, `PUBLIC_VOTE_PRE_VOTE_*`, `PUBLIC_VOTE_SUCCESS_*`, `PUBLIC_RESULTS_*`, `PUBLIC_CTA_*` vote/results navigation labels; possible new `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` allowlist
- `public/frontend/official-vote-pre-vote-hints.js` — re-exports of shared pre-vote hint constants; mount wiring only
- `public/frontend/vote-page.js` — `syncVotePageSectionHeadings`, `syncVotePageLeadParagraphs`; possible `syncVotePageOnboardingCopy` for banner/lead/hint mount points
- `public/frontend/result-page.js` — `syncResultsPageLeadParagraphs`, `renderResultsReadOnlyIntro`, `syncResultsPageSectionHeadings`
- `vote.html`, `results.html` — static fallback + mount points only

### 2.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- Homepage, header/auth-state, registration, login, profile, poll creation, my-polls onboarding slices (covered by Phase 222–230 or separate future phases).
- Explore page onboarding (covered by Phase 215 state copy; broader explore onboarding deferred).
- Empty / loading / error **state copy** rewrites beyond onboarding/navigation guidance (covered by Phase 110–113, 215; revisit only if onboarding copy host overlaps).
- CSS/HTML layout, spacing, tap-target, or accessibility polish (Phase 201–213; not reopened unless copy host alignment required in a future approved slice).
- Auth/session/login resolver, `UserAuthResolver`, registration/login/profile behavior changes.
- Vote transaction, vote-by-index body, eligibility evaluator, result visibility tier changes.
- Creator session, ownership, lifecycle, poll creation behavior.
- New profile fields beyond `birth_year_month` and `residential_region`.
- Registration does not auto-login (no auto-login), `Set-Cookie`, or `GET /users/me` reads on registration submit.
- Ranking, recommendation, personalization, `quality_badge` expansion, trust/score UI.
- `design-drafts/` commits.

---

## 3. Current Copy Baseline (Pre-Runtime Review Targets)

Phase 231 plans copy-only improvements on top of the existing vote / results runtime boundary:

| Area | Current constant / surface | Plan focus |
|------|---------------------------|------------|
| Vote page reminder lead | `PUBLIC_VOTE_PAGE_REMINDER_LEAD` via `#vote-page-reminder-lead` | Clarify what users can do; formal vote may need login; demo paths do not persist votes |
| Vote policy panel | `vote.html` bullets + `PUBLIC_VOTE_POLICY_PANEL_HEADING` | Clarify collecting hidden-count policy, follow-results purpose, quality feedback scope — align with FAQ/trust-levels |
| Pre-vote hints | `PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT`, `PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT`, `PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT`, `PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT` via `official-vote-pre-vote-hints.js` | Neutral login/profile guidance; no eligibility pass/fail; no vote guarantee |
| Vote success → results | `PUBLIC_VOTE_SUCCESS_RESULT_HINT`, `PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT` | Clarify collecting vs revealed navigation; href-only CTAs |
| Results demo intro | `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` via `#results-page-demo-intro` | Clarify showcase / non-production; distinct from live path |
| Results live intro | `PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD` via `syncResultsPageLeadParagraphs` | Clarify readonly public results; collecting hidden-count; display-safe aggregate ceiling |
| Results readonly intro | `PUBLIC_RESULTS_INTRO_LEAD_HINT`, `PUBLIC_RESULTS_INTRO_SCOPE_HINT`, `PUBLIC_RESULTS_INTRO_VOTE_HINT` via `renderResultsReadOnlyIntro` | Clarify page purpose, scope, vote cross-link |
| Results visibility states | `PUBLIC_RESULTS_COLLECTING_*`, `PUBLIC_RESULTS_CANCELLED_*`, `PUBLIC_RESULTS_UNPUBLISHED_*` | Clarify lifecycle-blocked states without changing evaluator tiers |
| Vote ↔ results CTAs | `PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL`, `PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL`, related labels | Align navigation wording between pages |

**Must not change in future runtime without separate governance approval:** `submitVoteByIndex` body `{ option_index }` only; eligibility-before-option-resolve; Official Vote transaction order; `GET /polls/:id/results` display-safe result object ceiling; result visibility evaluator tiers; `mountOfficialVotePreVoteHint` login/profile read boundaries; `loadPreVoteProfile` → `GET /users/me/profile` only when signed in.

---

## 4. Copy Principles (Future Runtime)

All future vote / results onboarding copy polish must follow these principles:

| Principle | Requirement |
|-----------|-------------|
| **Simple** | Short, plain-language guidance; one primary idea per hint |
| **User-facing** | Avoid engineer-facing jargon (`option_index`, `shard_id`, internal codes) in primary onboarding copy; demo-path notes may reference MVP demo paths only where already required |
| **Non-debug** | No request id, trace id, internal code, shard id, option id, or backend diagnostic tokens in UI |
| **No backend/internal error echo** | Use `resolvePublicErrorUserMessage` where errors appear; never echo `error.message` or foreign backend payloads |
| **No new vote/auth behavior implication** | Copy must not imply new login types, auto session creation, eligibility preview APIs, or vote guarantees beyond existing behavior |
| **No eligibility disclosure** | Do not reveal pass/fail eligibility, age thresholds, region allowlists, trust rules, or which condition would fail |
| **No result visibility drift** | Do not weaken collecting hidden-count, display-safe result tier, or lifecycle meaning in onboarding copy |
| **No hidden counters or internal lifecycle details** | Onboarding copy must not leak vote counts, percentages, ranking, or internal poll lifecycle mechanics beyond existing neutral policy wording |
| **Demo vs live clarity** | Demo/showcase paths (`/vote/demo`, `/results/demo`) and live poll paths remain visually and semantically distinct |
| **Read-only results clarity** | Results page copy must state readonly / non-voting purpose without implying edit or vote authority on the results surface |

Additional alignment rules:

- Pre-vote hints may guide to `/login` or `/profile` only; must not auto-redirect or block poll reading.
- Vote success may guide to results page with href-only CTAs; no new API calls.
- Results intro may guide to vote page with href-only CTAs; no voter-state or eligibility disclosure.
- Signed-in / signed-out guidance uses only paths already supported by runtime (login CTAs, profile completion hints).
- Wording for login/profile requirements should align with Phase 225–227 account onboarding copy without guaranteeing eligibility.

---

## 5. Allowed Copy-Only Future Changes

A future approved runtime phase (not Phase 231) may change **only** frontend-owned user-visible onboarding/navigation strings and their safe wiring:

| Category | Allowed change | Constraint |
|----------|----------------|------------|
| Vote page participant guidance | Reminder lead, policy bullets, collecting notice, form legend hints | No new `fetch` paths; no payload changes |
| Pre-vote login/profile guidance | `PUBLIC_VOTE_PRE_VOTE_*` neutral hints and CTA labels | No eligibility outcome language; no vote guarantee |
| Demo vote wording | Demo banner, demo success messages, `/vote/demo` path notes | No API selection logic change |
| Results visibility guidance | Demo vs live intro, readonly intro, collecting/unavailable summaries | No result evaluator tier change |
| Vote ↔ results navigation | Success panel result hints, results intro vote hint, bottom nav, shared `PUBLIC_CTA_*` | Navigation href only |
| Signed-in / signed-out guidance | Neutral sign-in or profile-completion copy where already mounted | No new auth resolver behavior |
| Static HTML fallback alignment | `vote.html`, `results.html` fallback matches JS mount constants | Mount points only |

**Default forbidden in future runtime unless explicitly approved in a separate governance phase:**

- New `fetch` paths, credentials changes, or API payload fields
- Backend error code / `message` field echo in UI
- Vote counts, percentages, eligibility outcomes, or result-tier leakage in onboarding copy
- Implying the visitor voted, which option they chose, or whether they were eligible on results pages
- `localStorage`, `sessionStorage`, cookie usage for onboarding memory
- `console.*`, analytics, APM, or debug payloads in onboarding handlers
- New eligibility checks, vote-time evaluator reads for copy, or qualification disclosure beyond existing behavior
- Implying registration auto-login, Set-Cookie, or new vote authority

---

## 6. Page-by-Page Review Checklist (Future Runtime)

Use this checklist in a future implementation phase. Each item is **copy-only** unless a real blocker requires separate governance approval.

### 6.1 `/vote/:pollId` — participant guidance

- [ ] `#vote-page-reminder-lead` clarifies what users can do (read poll, select option, submit vote) and that formal voting may require login
- [ ] Policy panel bullets explain collecting hidden-count, follow-results purpose, and quality feedback without internal jargon
- [ ] `official-vote-pre-vote-hints.js` anonymous / profile-incomplete / neutral-submit states remain neutral; no pass/fail eligibility copy
- [ ] Demo path (`/vote/demo`, showcase submit) states votes are not persisted; distinct from live Official Vote path
- [ ] Vote success panel result hints guide to results page with consistent `PUBLIC_CTA_*` labels
- [ ] FAQ/trust-levels links in policy bullets stay aligned with account onboarding copy
- [ ] **Must not change:** `submitVoteByIndex` body `{ option_index }` only; eligibility-before-option-resolve; Official Vote transaction order

### 6.2 `/results/:pollId` — result visibility guidance

- [ ] `#results-page-demo-intro` and `syncResultsPageLeadParagraphs` keep demo vs live intro distinct
- [ ] `renderResultsReadOnlyIntro` clarifies readonly purpose, display-safe aggregate scope, and non-voting authority
- [ ] Collecting / cancelled / unpublished / unavailable onboarding does not leak counters or hidden-tier explanation
- [ ] Demo path links (`/results/demo`) remain clearly non-production
- [ ] Lifecycle-blocked copy matches existing evaluator meaning without changing tiers
- [ ] **Must not change:** result visibility evaluator tiers; display-safe result object ceiling; `GET /polls/:id/results` behavior

### 6.3 Vote ↔ Results navigation hints

- [ ] Vote success → results CTA uses `PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL` or aligned shared label
- [ ] Results intro vote hint and bottom nav use `PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL` or aligned shared label
- [ ] Demo vs live navigation wording does not imply unavailable production behavior
- [ ] Navigation hints do not imply vote counts, result previews, or eligibility outcomes
- [ ] **Must not change:** header auth-state behavior; registration/login/profile flows; creator session/lifecycle APIs

### 6.4 Signed-in / signed-out / profile guidance (existing behavior only)

- [ ] Anonymous pre-vote hint offers `/login` CTA only; does not call `GET /users/me/profile`
- [ ] Profile-incomplete hint references 出生年月/居住地區 only; does not guarantee eligibility
- [ ] Profile-load-failed hint stays neutral; does not block poll reading
- [ ] Wording aligns with Phase 225–227 account onboarding copy
- [ ] **Must not change:** `GET /users/me/profile` read timing; profile fields `birth_year_month` / `residential_region` only

---

## 7. Risk Classification

| Risk area | Default risk | Future copy polish rule |
|-----------|--------------|-------------------------|
| Vote page participant onboarding | High | No eligibility outcome language; no vote guarantee |
| Pre-vote login/profile guidance | High | Neutral hints only; no pass/fail disclosure |
| Demo vs live vote wording | Medium | No unavailable production behavior promise |
| Results demo/live/readonly onboarding | High | No counter/tier leakage in intro copy |
| Results lifecycle-blocked copy | High | Lifecycle meaning unchanged; no evaluator drift |
| Vote ↔ results navigation | Low–Medium | href-only CTAs; shared `PUBLIC_CTA_*`; consistent next-step wording |
| Signed-in / signed-out guidance | Medium | Use existing auth/profile paths only |
| `quality_badge` adjacent copy | Medium | No badge explanation expansion; `positive_feedback` → `回饋良好` only |
| Raw Option Linkage Ban | High | No option choice + user/session/device/request/log/trace/metric/error linkage |
| Backend/API/schema | High | Out of scope for all copy polish slices |

---

## 8. Privacy, Auth, API, and Schema Boundaries

Future vote / results onboarding copy polish must **preserve**:

| Boundary | Requirement |
|----------|-------------|
| Raw Option Linkage Ban | No durable user-option linkage in onboarding copy, logs, metrics, analytics, APM, or error payloads |
| Option linkage | No option choice + user/session/device/request/log/trace/metric/error linkage added |
| Official Vote | Transaction order unchanged |
| Vote-by-index | Body `{ option_index }` only; eligibility-before-option-resolve unchanged |
| Result visibility | Display-safe tiers unchanged; no counter leakage in onboarding copy |
| Eligibility / auth | No `UserAuthResolver` drift; no new eligibility checks or qualification disclosure for copy |
| Profile fields | Only `birth_year_month` / `residential_region` |
| Registration | Does not auto-login; does not Set-Cookie; `POST /registration` unchanged |
| Registration success | does not call `GET /users/me` after success |
| Login | `POST /login/session` then `GET /users/me` (`user_id` / `display_name` only) unchanged |
| Pre-vote profile read | `GET /users/me/profile` only when signed in; anonymous must not call profile API |
| Results API | `GET /polls/:id/results` display-safe aggregate ceiling unchanged |
| Creator session / lifecycle | `GET /creator/session`, lifecycle APIs unchanged; creator results panel copy out of scope unless navigation host overlaps |
| `quality_badge` | Presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected silent; not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank |
| Observability | No new `console.*`, analytics, APM, or debug payloads in onboarding handlers |

---

## 9. Suggested Future Phase Sequence

| Phase | Purpose |
|-------|---------|
| **231** (this phase) | Plan only — vote / results onboarding navigation copy consistency |
| **231-R** | Plan review checkpoint — governance approval before runtime |
| **232** | Vote / results onboarding navigation copy minimal runtime patch |
| **232 review checkpoint** | Runtime review — confirm copy-only delivery |

Future runtime should follow the Phase 223–229 onboarding pattern: centralize constants in `public-mvp-ui.js`, add sync functions where needed, align static HTML fallback with JS mount points, add focused guard tests, and run review checkpoint before milestone consolidation if needed.

---

## 10. Explicit Non-Goals

Phase 231 does **not** implement or approve:

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
| Poll creation / my-polls behavior changes | Out of scope |
| Option/user/session/device/request/log/trace/metric/error linkage | Out of scope |
| `design-drafts/` commits | Out of scope |

---

## 11. Focused Guard Tests

- `tests/docs/phase-231-vote-results-onboarding-navigation-copy-plan-doc.test.ts`

Phase 215 state-copy guards remain the baseline for loading/error/collecting copy:

- `tests/frontend/phase-215-explore-vote-results-state-copy-runtime.test.ts`

Phase 105–110 vote UX and Phase 113 results UX plan guards remain authoritative for error/success scenario boundaries.

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

Phase 231 is plan documentation and doc guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
