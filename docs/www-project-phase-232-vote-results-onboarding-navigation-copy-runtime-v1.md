# WWW Project Phase 232 — Vote / Results Onboarding Navigation Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned vote and results onboarding / navigation copy after Phase 231 plan, Phase 231-R review checkpoint, and Phase 230 poll creation / my-polls onboarding milestone.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, result visibility, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 231-R vote / results onboarding navigation copy plan review (`2b16bbb`).

**Prior delivery:** [Phase 231-R vote / results onboarding navigation copy plan review](./www-project-phase-231r-vote-results-onboarding-navigation-copy-plan-review-v1.md).

---

## 1. Purpose

Phase 232 implements the **minimal approved slice** from Phase 231-R for vote and results onboarding / navigation copy only. Changes are limited to frontend-owned constants, safe static HTML fallback copy, and JS mount-point sync.

Goals:

1. Centralize vote / results onboarding copy in `public-mvp-ui.js` (`PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`).
2. Clarify `/vote/:pollId` participant guidance (read poll, select option, submit; login may be required; no eligibility guarantee).
3. Clarify `/results/:pollId` result visibility and readonly purpose without changing evaluator tiers.
4. Add vote ↔ results navigation hints using shared `PUBLIC_CTA_*` labels where existing navigation already supports href-only CTAs.
5. Wire policy panel, side panel, demo/live intro, and navigation hint mount points via `syncVotePageOnboardingCopy` and `syncResultsPageOnboardingCopy`.
6. Keep static HTML fallback and JS-mounted runtime copy consistent.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`, vote/results onboarding constants.
- `public/frontend/vote-page.js` — `syncVotePageOnboardingCopy`, policy/side-panel/nav-hint mount sync.
- `public/frontend/result-page.js` — `syncResultsPageOnboardingCopy`, results vote-nav-hint mount sync.
- `public/vote.html`, `public/results.html` — static fallback + mount points.
- Focused frontend + doc tests.
- README Phase 232 index.

### 2.2 Out of scope

- Homepage, header/auth-state, registration, login, profile, poll creation, my-polls onboarding slices.
- Backend, API contract, DB, migration, auth resolver.
- Vote / results loading / error / collecting **state copy** rewrites beyond onboarding host overlap (Phase 215 baseline).
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant / surface | Change |
|--------------------|--------|
| `PUBLIC_VOTE_PAGE_REMINDER_LEAD` | Clarify participant actions; login may be required; demo path does not persist votes |
| `PUBLIC_VOTE_POLICY_LOGIN_TEXT` | Centralize vote policy login guidance without eligibility guarantee |
| `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` | Centralize collecting hidden-count policy bullet |
| `PUBLIC_VOTE_POLICY_FOLLOW_RESULTS_TEXT` / `PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT` | Centralize follow-results and quality-feedback bullets |
| `PUBLIC_VOTE_COLLECTING_NOTICE_BODY` | Align collecting notice with policy wording |
| `PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_BODY` / `PUBLIC_VOTE_FOLLOW_RESULTS_MOCK_NOTE` | Centralize side-panel follow-results copy |
| `PUBLIC_VOTE_VIEW_RESULTS_NAV_HINT_*` | Vote page → results navigation hint |
| `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` | Clarify demo/showcase path and readonly preview |
| `PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD` | Clarify live readonly results purpose and hidden-count policy |
| `PUBLIC_RESULTS_INTRO_LEAD_HINT` / `PUBLIC_RESULTS_INTRO_SCOPE_HINT` | Clarify readonly scope without counter leakage |
| `PUBLIC_RESULTS_VOTE_NAV_HINT_*` | Results page → vote navigation hint |
| `PUBLIC_VOTE_SUCCESS_RESULT_HINT` / `PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT` | Clarify post-vote results navigation guidance |
| `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` | New allowlist for vote/results onboarding navigation copy |

Unchanged: `submitVoteByIndex` body `{ option_index }` only, Official Vote transaction order, eligibility-before-option-resolve, `GET /polls/:id/results` display-safe ceiling, `syncResultsPageLeadParagraphs` demoOnly selection, `mountOfficialVotePreVoteHint` profile read boundaries, registration/login/profile/auth behavior.

---

## 4. Boundaries preserved

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| Vote-by-index `{ option_index }` only | Unchanged |
| eligibility-before-option-resolve | Unchanged |
| Result visibility tiers | Unchanged |
| Registration auto-login / Set-Cookie | Unchanged |
| Profile fields `birth_year_month` / `residential_region` only | Unchanged |
| `/users/me` `user_id` / `display_name` only | Unchanged |
| Creator session / ownership / lifecycle APIs | Unchanged |
| `quality_badge` presentation-only | Unchanged (`positive_feedback` → `回饋良好`) |

---

## 5. Guard tests

- `tests/frontend/phase-232-vote-results-onboarding-navigation-copy-runtime.test.ts`
- `tests/docs/phase-232-vote-results-onboarding-navigation-copy-runtime-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 232 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
