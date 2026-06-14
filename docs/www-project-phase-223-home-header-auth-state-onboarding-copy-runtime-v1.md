# WWW Project Phase 223 — Home + Header/Auth-State Onboarding Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned homepage onboarding and header/auth-state navigation copy after Phase 222 plan and Phase 222-R review checkpoint.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 222-R public MVP onboarding / navigation copy consistency plan review checkpoint (`fb3713e`).

**Prior delivery:** [Phase 222-R public MVP onboarding / navigation copy consistency plan review checkpoint](./www-project-phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 223 implements the **minimal approved slice** from Phase 222-R for homepage onboarding and header/auth-state navigation copy only. Changes are limited to frontend-owned constants and safe static text wiring.

Goals:

1. Centralize header/auth-state onboarding copy in `public-mvp-ui.js` (`PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`).
2. Wire `auth-state-copy.js` to re-export shared auth-state constants.
3. Wire remaining homepage onboarding notes (account flow, sample polls section, static examples footer) through `public-mvp-home.js`.
4. Align profile-completion prompt and vote pre-vote incomplete-profile hint wording (出生年月與居住地區 only; no eligibility guarantee).
5. Replace engineer-facing `fail closed` banner wording with user-facing「會拒絕存取」.
6. Preserve registration success-to-login boundary, auth flows, and profile field ceiling.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, home account-flow constants, profile-completion hint alignment.
- `public/frontend/auth-state-copy.js` — re-export shared auth-state onboarding constants.
- `public/frontend/public-mvp-home.js` — sync homepage onboarding notes and CTAs.
- `public/index.html` — onboarding note mount points only (`home-account-flow-note`, `home-sample-polls-section-note`, `home-static-examples-footer-note`).
- Focused frontend + doc tests.
- README Phase 223 index.

### 2.2 Out of scope

- Login, registration, profile page, vote, results, poll-creation, my-polls onboarding copy (future Phase 225+ slices).
- Backend, API contract, DB, migration, auth resolver.
- Vote transaction, eligibility evaluation, result visibility tiers.
- `quality-feedback-badge.js` behavior changes.
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant / surface | Change |
|--------------------|--------|
| `PUBLIC_AUTH_GUEST_CHIP_TITLE` | Centralized; unchanged meaning (no auto-login) |
| `PUBLIC_AUTH_BANNER_GUEST_BODY` | `fail closed` → `會拒絕存取` (user-facing) |
| `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` | New allowlist for header/auth-state onboarding copy |
| `PUBLIC_HOME_ACCOUNT_FLOW_*` | New constants for homepage account/demo flow note |
| `PUBLIC_HOME_SAMPLE_POLLS_SECTION_NOTE` | Split explore link label; wired via `syncHomePageSamplePollsSectionNote` |
| `PUBLIC_HOME_STATIC_EXAMPLES_FOOTER_NOTE` | Wired via `syncHomePageStaticExamplesFooterNote` |
| `PUBLIC_PROFILE_COMPLETION_PROMPT_HINT` | Aligned wording; 出生年月與居住地區 only |
| `PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT` | Aligned with profile-completion hint |

Unchanged: `POST /login/session`, `POST /registration`, `GET`/`PUT /users/me/profile` payloads, auth redirects, `/users/me` shape, API call timing.

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
| Registration `GET /users/me` after success | Unchanged — not called |
| Profile fields `birth_year_month` / `residential_region` only | Unchanged |
| `/users/me` `user_id` / `display_name` only | Unchanged |
| Creator session / lifecycle APIs | Unchanged |
| `quality_badge` presentation-only | Unchanged (`positive_feedback` → `回饋良好`) |

---

## 5. Guard tests

- `tests/frontend/phase-223-home-header-auth-state-onboarding-copy-runtime.test.ts`
- `tests/docs/phase-223-home-header-auth-state-onboarding-copy-runtime-doc.test.ts`

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

Phase 223 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
