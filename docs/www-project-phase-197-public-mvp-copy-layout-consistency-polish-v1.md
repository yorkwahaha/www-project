# WWW Project Phase 197 — Public MVP Copy & Layout Consistency Polish v1

**Status:** frontend UX polish — small copy/layout consistency slice after Phase 196 plan, without API, DB, backend, auth, vote, result visibility, eligibility, Reference Answer, or `quality_badge` behavior changes.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 196 public MVP post-quality-badge UX polish plan (`2ff2bf7`).

**Prior checkpoint:** [Phase 196 Public MVP post-quality-badge UX polish plan](./www-project-phase-196-public-mvp-post-quality-badge-ux-polish-plan-v1.md).

---

## 1. Purpose

Phase 197 implements a minimal, safe runtime polish slice from the Phase 196 plan:

1. Consistent page title / lead hierarchy and spacing via shared `.mvp-page-intro` and existing `.mvp-info-hero` rhythm.
2. Aligned empty / loading / CTA copy on explore, login, registration, profile, my-polls, and homepage hero CTAs using centralized `PUBLIC_*` constants and mount-time sync helpers.
3. Preserved `quality_badge` presentation exactly per Phase 195 governance — no badge logic, label, gate, or placement semantics change.

---

## 2. Scope

### 2.1 In scope

| Surface | Polish |
|---------|--------|
| `/` | Hero CTA labels via `syncHomePageCtas` |
| `/explore` | `.mvp-page-intro` wrapper; `syncExplorePageLeadLinks`; `syncExplorePageStatusCopy` |
| `/vote/:pollId` | Vote page brand label via `PUBLIC_VOTE_PAGE_BRAND_LABEL` |
| `/results/:pollId` | No change (existing Phase 155/192 sync preserved) |
| `/login` | `syncLoginPageCtas` for submit / register / home links |
| `/registration` | `syncRegistrationPageCtas` for submit / login / success CTAs |
| `/profile` | `syncProfilePageCtas` for brand and unauthenticated CTAs |
| `/my-polls` | `.mvp-page-intro` wrapper; `#my-polls-heading` sync |

### 2.2 Out of scope

- API, DB, schema, migration, backend, auth/session changes.
- Vote transaction, eligibility, result visibility, Reference Answer changes.
- `quality_badge` contract, gate, label, tooltip, or placement semantics change.
- Ranking, recommendation, personalization, trust/score/creator-score use.
- `design-drafts/` commits.

---

## 3. Copy / layout rules

### 3.1 Must

- Use frontend-owned `PUBLIC_*` copy constants and mount-time sync helpers only.
- Keep API-driven poll titles on vote/results pages unchanged.
- Keep `renderQualityFeedbackBadge()` / `mountQualityFeedbackBadgeNearTitle()` unchanged.
- **回饋良好** remains the only visible badge label.

### 3.2 Must not

- Echo backend payloads, internal error codes, or stack traces in polish copy.
- Add eligibility pass/fail wording or vote-guarantee language.
- Change CTA routes, gating, or badge-adjacent behavior.

---

## 4. New / updated frontend artifacts

| File | Change |
|------|--------|
| `public/frontend/public-mvp-ui.js` | `PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL`, `PUBLIC_VOTE_PAGE_BRAND_LABEL` |
| `public/frontend/public-mvp.css` | `.mvp-page-intro` title/lead spacing |
| `public/explore.html`, `public/my-polls.html` | `.mvp-page-intro` header wrappers |
| `public/frontend/explore-page.js` | `syncExplorePageLeadLinks`, `syncExplorePageStatusCopy` |
| `public/frontend/login-page.js` | `syncLoginPageCtas` |
| `public/frontend/registration-page.js` | `syncRegistrationPageCtas` |
| `public/frontend/profile-page.js` | `syncProfilePageCtas` |
| `public/frontend/public-mvp-home.js` | `syncHomePageCtas` |
| `public/frontend/vote-page.js` | vote page brand sync |
| `public/frontend/my-polls-page.js` | `#my-polls-heading` sync |

---

## 5. Validation

```bash
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-197-public-mvp-copy-layout-consistency-polish.test.ts`
- `tests/docs/phase-197-public-mvp-copy-layout-consistency-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 197 copy/layout polish does not introduce durable user-option linkage or pre-vote answer-direction signals. `quality_badge` remains presentation-only per Phase 195. Raw Option Linkage Ban preserved.
