# WWW Project Phase 198 — Public MVP Copy/Layout Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 197 public MVP copy/layout runtime (`.mvp-page-intro` wrappers, CTA element `id`s, mount-time `sync*PageCtas` / `syncExplorePageLeadLinks` / `syncExplorePageStatusCopy` helpers, `PUBLIC_VOTE_PAGE_BRAND_LABEL`, and centralized `PUBLIC_*` CTA constants across `/`, `/explore`, `/vote/:pollId`, `/login`, `/registration`, `/profile`, and `/my-polls`).

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 197 public MVP copy/layout consistency polish (`7873287`).

**Prior delivery:** [Phase 197 public MVP copy/layout consistency polish](./www-project-phase-197-public-mvp-copy-layout-consistency-polish-v1.md).

**Prior governance context:** [Phase 195 quality feedback badge governance closure checkpoint](./www-project-phase-195-quality-feedback-badge-governance-closure-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 198 reviews the Phase 197 frontend copy/layout runtime to confirm:

1. CTA element `id`s added in HTML shells are mounted by the intended Phase 197 sync helpers via `getElementById` (no href-based selectors that would widen guard-test surface).
2. CTA labels remain consistent and non-contradictory across login, registration, profile, homepage, and explore surfaces.
3. `/explore` and `/my-polls` `.mvp-page-intro` wrappers are layout-only; they do not alter feed fetch, cursor pagination, or creator API calls.
4. Explore loading / empty / status copy sync uses frontend-owned pending messages only; no counters, percentages, or internal state echo.
5. Vote page brand sync changes only the visible `.mvp-brand` label to `參與投票`; poll title remains API-driven.
6. `quality_badge` presentation remains unchanged per Phase 195 (`positive_feedback` → `回饋良好`; null/missing/unexpected silent; no tooltip/debug/counts/score/rank).
7. No `localStorage`, `sessionStorage`, or cookie usage was introduced by Phase 197 copy/layout polish.
8. No option choice + user/session/device/request/log/trace/metric/error linkage was introduced.

---

## 2. Phase 197 Delivery Under Review

| Area | Phase 197 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | `PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL`, `PUBLIC_VOTE_PAGE_BRAND_LABEL` | CTA allowlist + vote brand constant only |
| `public-mvp.css` | `.mvp-page-intro` spacing | layout rhythm only |
| `explore.html`, `my-polls.html` | `.mvp-page-intro` header wrappers | no fetch/DOM hook change |
| `index.html`, `login.html`, `registration.html`, `profile.html` | CTA `id` attributes | wired to sync helpers |
| `explore-page.js` | `syncExplorePageLeadLinks`, `syncExplorePageStatusCopy` | status copy + home link only |
| `login-page.js` | `syncLoginPageCtas` | submit / register / home labels |
| `registration-page.js` | `syncRegistrationPageCtas` | submit / login / success CTAs |
| `profile-page.js` | `syncProfilePageCtas` | brand + unauthenticated CTAs |
| `public-mvp-home.js` | `syncHomePageCtas` | hero explore / create labels |
| `vote-page.js` | brand sync in `syncVotePageSectionHeadings` | `.mvp-brand` label only |
| `my-polls-page.js` | `#my-polls-heading` sync | heading text only |

**Not modified by Phase 197:** `quality-feedback-badge.js`, backend `src/`, migrations, auth/session resolvers, vote transaction paths.

---

## 3. CTA `id` → Sync Helper Bindings

| HTML `id` | Shell | Sync helper | `PUBLIC_*` constant |
|-----------|-------|-------------|---------------------|
| `login-shell-submit` | `login.html` | `syncLoginPageCtas` | `PUBLIC_CTA_SIGN_IN_LABEL` (`登入`) |
| `login-register-cta` | `login.html` | `syncLoginPageCtas` | `PUBLIC_CTA_CREATE_ACCOUNT_LABEL` |
| `login-home-cta` | `login.html` | `syncLoginPageCtas` | `PUBLIC_CTA_GO_HOME_LABEL` |
| `registration-submit` | `registration.html` | `syncRegistrationPageCtas` | `PUBLIC_CTA_REGISTER_LABEL` (`註冊`) |
| `registration-login-cta` | `registration.html` | `syncRegistrationPageCtas` | `PUBLIC_CTA_GO_TO_LOGIN_FROM_REGISTRATION_LABEL` |
| `registration-success-login-cta` | `registration.html` | `syncRegistrationPageCtas` | `PUBLIC_CTA_GO_TO_LOGIN_LABEL` |
| `registration-success-home-cta` | `registration.html` | `syncRegistrationPageCtas` | `PUBLIC_CTA_GO_HOME_LABEL` |
| `profile-login-cta` | `profile.html` | `syncProfilePageCtas` | `PUBLIC_CTA_GO_TO_LOGIN_LABEL` |
| `profile-register-cta` | `profile.html` | `syncProfilePageCtas` | `PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL` |
| `home-explore-cta` | `index.html` | `syncHomePageCtas` | `PUBLIC_CTA_EXPLORE_LABEL` |
| `home-create-cta` | `index.html` | `syncHomePageCtas` | `PUBLIC_CTA_CREATE_POLL_NAV_LABEL` |
| `explore-home-cta` | `explore.html` | `syncExplorePageLeadLinks` | `PUBLIC_CTA_GO_HOME_LABEL` |
| `my-polls-heading` | `my-polls.html` | `syncMyPollsPageSectionHeadings` | `PUBLIC_MY_POLLS_PAGE_TITLE` |

Mount wiring:

- `mountLoginShellPage` → `syncLoginPageCtas`
- `mountRegistrationPage` → `syncRegistrationPageCtas`
- `mountProfilePage` → `syncProfilePageCtas`
- `public-mvp-home.js` module load → `syncHomePageCtas`
- `mountExplorePage` → `syncExplorePageLeadLinks`, `syncExplorePageStatusCopy` (before `fetchExploreFeedPage`)
- `wireMyPollsDemoPage` → `syncMyPollsPageSectionHeadings`
- `bootstrapVotePage` → `syncVotePageSectionHeadings` (includes brand label)

---

## 4. Runtime Review Checkpoint Conclusion

Phase 198 found **no privacy, auth, result visibility, eligibility, vote transaction, API contract, `quality_badge` governance, or linkage gap** in the Phase 197 public MVP copy/layout runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Phase 199 blockers: none identified.**

### 4.1 CTA `id` bindings are complete and consistent

- All Phase 197 CTA `id`s in HTML shells are referenced by the intended sync helpers through `getElementById`.
- Login submit remains `登入`; registration submit remains `註冊`.
- Cross-surface navigation copy is aligned: registration stresses post-registration login; profile unauthenticated panel offers login + register without contradictory auto-login wording.

### 4.2 `.mvp-page-intro` is layout-only

- `explore.html` and `my-polls.html` wrap existing title/lead nodes; feed list, status region, error panel, and `fetchExploreFeedPage` / `loadPage` logic in `explore-page.js` are unchanged.
- `my-polls-page.js` heading sync targets `#my-polls-heading` with fallback to legacy `#main-content > h1`; no new API calls.

### 4.3 Explore status / empty copy stays display-safe

- `syncExplorePageStatusCopy` writes `EXPLORE_FEED_LOADING_MESSAGE` (`載入探索列表中，請稍候。`), listed in `PUBLIC_PENDING_USER_MESSAGES`.
- Empty-state sync continues to use `PUBLIC_EXPLORE_EMPTY_MESSAGE` / `PUBLIC_EXPLORE_EMPTY_SUMMARY`; no vote counts or percentages.

### 4.4 Vote brand sync is label-only

- `syncVotePageSectionHeadings` sets `.mvp-vote-main > p.mvp-brand` to `PUBLIC_VOTE_PAGE_BRAND_LABEL` (`參與投票`).
- `#poll-title` remains API-driven after poll detail load; badge mount path unchanged.

### 4.5 `quality_badge` behavior unchanged

- `quality-feedback-badge.js` was not modified in Phase 197.
- `shouldRenderQualityFeedbackBadge` gates on `quality_badge === 'positive_feedback'` only.
- Visible label remains `回饋良好`; null/missing/unexpected values do not render; no tooltip/debug/counts/score/rank paths added.

### 4.6 No client storage or linkage regression

- Phase 197 sync modules do not use `localStorage`, `sessionStorage`, or cookies.
- Copy/layout polish does not log or persist option-level choice linkage.

### 4.7 Raw Option Linkage Ban preserved

- Phase 197 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-198-public-mvp-copy-layout-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-198-public-mvp-copy-layout-runtime-review-checkpoint-doc.test.ts`

Phase 197 delivery guard tests remain the baseline:

- `tests/frontend/phase-197-public-mvp-copy-layout-consistency-polish.test.ts`
- `tests/docs/phase-197-public-mvp-copy-layout-consistency-polish-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 198 is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
