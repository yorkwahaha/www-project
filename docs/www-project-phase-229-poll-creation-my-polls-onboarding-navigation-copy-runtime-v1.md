# WWW Project Phase 229 — Poll Creation / My Polls Onboarding Navigation Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned poll creation and my-polls onboarding / navigation copy after Phase 228 plan, Phase 228-R review checkpoint, and Phase 227 account onboarding milestone.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, result visibility, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 228-R poll creation / my-polls onboarding navigation copy plan review (`f80e315`).

**Prior delivery:** [Phase 228-R poll creation / my-polls onboarding navigation copy plan review](./www-project-phase-228r-poll-creation-my-polls-onboarding-navigation-copy-plan-review-v1.md).

---

## 1. Purpose

Phase 229 implements the **minimal approved slice** from Phase 228-R for poll creation and my-polls onboarding / navigation copy only. Changes are limited to frontend-owned constants, safe static HTML fallback copy, and JS mount-point sync.

Goals:

1. Centralize poll creation / my-polls onboarding copy in `public-mvp-ui.js` (`PUBLIC_CREATOR_ONBOARDING_MESSAGES`).
2. Clarify demo vs `?live=1` creation wording on `/polls/new` without changing API selection logic.
3. Clarify my-polls manages polls created through the existing creator flow.
4. Add create ↔ my-polls navigation hints using shared `PUBLIC_CTA_*` labels.
5. Replace engineer-facing my-polls banner wording (`creator_session`, `X-User-Id`) with user-facing copy.
6. Keep static HTML fallback and JS-mounted runtime copy consistent.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_CREATOR_ONBOARDING_MESSAGES`, page lead/banner/hint constants.
- `public/frontend/creator-flow-copy.js` — re-exports shared creator onboarding constants.
- `public/frontend/create-poll-page.js` — `syncCreatePollPageOnboardingCopy`, banner/lead/nav-hint mount sync.
- `public/frontend/my-polls-page.js` — `syncMyPollsPageOnboardingCopy`, banner/quota/nav-hint mount sync.
- `public/create-poll.html`, `public/my-polls.html` — static fallback + mount points.
- Focused frontend + doc tests.
- README Phase 229 index.

### 2.2 Out of scope

- Homepage, header/auth-state, registration, login, profile, vote, results onboarding slices.
- Backend, API contract, DB, migration, auth resolver.
- Poll creation / my-polls loading / error / empty **state copy** rewrites (Phase 219–220 baseline).
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant / surface | Change |
|--------------------|--------|
| `PUBLIC_CREATE_POLL_PAGE_LEAD` | Clarify create/publish purpose; immutability; no mid-collection preview |
| `PUBLIC_CREATE_POLL_PAGE_BANNER_BODY` | Demo vs `?live=1` creation banner |
| `PUBLIC_CREATE_POLL_LIVE_MODE_HINT` | Live creation next-step guidance toward my-polls |
| `PUBLIC_CREATE_POLL_MY_POLLS_NAV_HINT_*` | Create → my-polls navigation hint |
| `PUBLIC_MY_POLLS_PAGE_LEAD` | Owned-poll management through existing creator flow |
| `PUBLIC_MY_POLLS_PAGE_BANNER_BODY` | Demo dashboard vs `?live=1` owned list |
| `PUBLIC_MY_POLLS_QUOTA_PANEL_*` | User-facing quota panel without internal auth jargon |
| `PUBLIC_MY_POLLS_CREATE_POLL_NAV_HINT_*` | My-polls → create poll navigation hint |
| `PUBLIC_CREATOR_MY_POLLS_LEAD_HINT` | Remove engineer-facing session wording |
| `PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT` | Post-create manage guidance toward my-polls |
| `PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE` | Simple signed-out guidance |
| `PUBLIC_MY_POLLS_EMPTY_SUMMARY` | Empty state guides to create poll |
| `PUBLIC_CREATOR_ONBOARDING_MESSAGES` | New allowlist for creator onboarding navigation copy |

Unchanged: `POST /creator/polls` payload, `GET /creator/session`, `GET /creator/polls`, lifecycle `POST /creator/polls/:id/*`, demo vs `?live=1` API selection, `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`.

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

- `tests/frontend/phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime.test.ts`
- `tests/docs/phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime-doc.test.ts`

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

Phase 229 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
