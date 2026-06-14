# WWW Project Phase 236 — FAQ Onboarding / Help Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned FAQ and help onboarding copy after Phase 235 plan, Phase 235-R review checkpoint, and Phase 234 public onboarding milestone.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, result visibility, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 235-R FAQ onboarding / help copy plan review (`64e6ca2`).

**Prior delivery:** [Phase 235-R FAQ onboarding / help copy plan review](./www-project-phase-235r-faq-onboarding-help-copy-plan-review-v1.md).

---

## 1. Purpose

Phase 236 implements the **minimal approved slice** from Phase 235-R for FAQ / help onboarding copy only. Changes are limited to frontend-owned constants, safe static HTML fallback copy, and JS mount-point sync.

Goals:

1. Centralize FAQ onboarding copy in `public-mvp-ui.js` (`PUBLIC_FAQ_ONBOARDING_MESSAGES`).
2. Add account-flow FAQ (registration → login → profile) aligned with `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`.
3. Add creator-flow FAQ (create poll → my-polls, demo vs `?live=1`) aligned with `PUBLIC_CREATOR_ONBOARDING_MESSAGES`.
4. Add participant-flow FAQ (vote → results) aligned with `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`.
5. Remove engineer-facing residue from `faq.html` (`X-User-Id`, `creator_session`, `production user-auth wiring later`).
6. Replace internal terms in FAQ user copy (`Official Vote`, `Reference Answer`) with user-facing wording.
7. Wire `syncFaqPageOnboardingCopy` and keep static HTML fallback aligned.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_FAQ_ONBOARDING_MESSAGES`, FAQ onboarding constants.
- `public/frontend/faq-page.js` — `syncFaqPageOnboardingCopy`, hero/answer mount sync.
- `public/faq.html` — static fallback + mount points, new account/creator/participant FAQ items.
- Focused frontend + doc tests.
- README Phase 236 index.

### 2.2 Out of scope

- `trust-levels.html` structural changes (cross-link already aligned).
- Backend, API contract, DB, migration, auth resolver.
- Registration, login, profile, vote, results, poll creation, my-polls **onboarding surface** rewrites beyond FAQ phrase alignment.
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant / surface | Change |
|--------------------|--------|
| `PUBLIC_FAQ_PAGE_HERO_LEAD` | Broaden hero to include account/creator/participant flows |
| `PUBLIC_FAQ_ACCOUNT_FLOW_INTRO` | Registration does not auto-login |
| `PUBLIC_FAQ_ACCOUNT_FLOW_LOGIN_STEP` / `PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP` | Login → profile next steps without eligibility guarantee |
| `PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP` | Demo create poll path; no persistence |
| `PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP` / `PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP` | `?live=1` and my-polls scoped to site creation flow |
| `PUBLIC_FAQ_PARTICIPANT_VOTE_STEP` | Vote flow; login may be required; no eligibility guarantee |
| `PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE` | User-facing demo/production boundary (replaces engineer residue) |
| `PUBLIC_FAQ_PROFILE_ELIGIBILITY_HINT` | Aligns with `PUBLIC_PROFILE_COMPLETION_PROMPT_HINT`; no eligibility guarantee |
| `PUBLIC_FAQ_COLLECTING_HIDDEN_*` | Align collecting FAQ with vote/results onboarding copy |
| `PUBLIC_FAQ_ELIGIBILITY_FAILURE_REFERENCE_NOTE` | User-facing trial-answer note (replaces `Reference Answer`) |
| `PUBLIC_FAQ_ONBOARDING_MESSAGES` | New allowlist for FAQ onboarding / help copy |

Unchanged: `POST /registration`, `POST /login/session`, profile APIs, creator session APIs, `submitVoteByIndex` body `{ option_index }` only, Official Vote transaction order, eligibility-before-option-resolve, result visibility tiers, lifecycle meaning, `quality_badge` presentation.

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

- `tests/frontend/phase-236-faq-onboarding-help-copy-runtime.test.ts`
- `tests/docs/phase-236-faq-onboarding-help-copy-runtime-doc.test.ts`

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

Phase 236 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
