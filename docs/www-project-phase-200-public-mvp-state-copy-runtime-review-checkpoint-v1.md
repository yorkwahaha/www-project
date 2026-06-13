# WWW Project Phase 200 — Public MVP State Copy Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 199 public MVP empty / loading / error state copy runtime (`PUBLIC_*_LOADING_MESSAGE`, `PUBLIC_*_LOAD_FAILURE_MESSAGE`, `PUBLIC_PENDING_USER_MESSAGES`, `PUBLIC_LOAD_FAILURE_USER_MESSAGES`, `renderPublicInlineErrorNote`, load-error titles, `.mvp-error-panel` layout, and safe next-step CTAs) across `/explore`, `/vote/:pollId`, `/results/:pollId`, `/my-polls?live=1`, and `/profile`.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 199 public MVP empty / error / loading state polish (`fece1b6`).

**Prior delivery:** [Phase 199 public MVP empty / error / loading state polish](./www-project-phase-199-public-mvp-empty-error-loading-state-polish-v1.md).

**Prior governance context:** [Phase 195 quality feedback badge governance closure checkpoint](./www-project-phase-195-quality-feedback-badge-governance-closure-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 200 reviews the Phase 199 frontend state-copy runtime to confirm:

1. New `PUBLIC_*_LOADING_MESSAGE` and `PUBLIC_*_LOAD_FAILURE_MESSAGE` constants are user-facing only and do not expose backend or internal details.
2. `PUBLIC_LOAD_FAILURE_USER_MESSAGES` and `PUBLIC_PENDING_USER_MESSAGES` remain safe frontend-owned allowlists.
3. Profile loading copy change (`PUBLIC_PROFILE_PAGE_LOADING_MESSAGE`) alters visible pending text only; auth/session/profile API paths and behavior are unchanged.
4. Vote/results load-error titles (`PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE`, `PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE`) change visible panel headings only; result visibility and eligibility disclosure boundaries are unchanged.
5. `renderPublicInlineErrorNote` renders only frontend-owned `message` text plus optional safe CTA links; it does not echo internal error payloads.
6. Explore initial load failure and my-polls live load failure home CTAs are navigation-only; they do not add API calls or change auth behavior.
7. `.mvp-error-panel`, `#error-panel`, and `.mvp-empty-state` CSS changes are layout-only.
8. `quality_badge` presentation remains unchanged per Phase 195 (`positive_feedback` → `回饋良好`; null/missing/unexpected silent; no tooltip/debug/counts/score/rank).
9. No `localStorage`, `sessionStorage`, or cookie usage was introduced by Phase 199 state-copy polish.
10. No option choice + user/session/device/request/log/trace/metric/error linkage was introduced.

**Filename note:** The results page runtime module is `public/frontend/result-page.js` (not `results-page.js`). Phase 199 docs, tests, and this checkpoint use `result-page.js` consistently with the repository.

---

## 2. Phase 199 Delivery Under Review

| Area | Phase 199 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | Surface loading / load-failure constants, `PUBLIC_LOAD_FAILURE_USER_MESSAGES`, `renderPublicInlineErrorNote`, load-error titles | allowlist-only user copy |
| `explore-page.js` | Shared constants; `showError(..., { showHomeLink: true })` on initial load failure | no fetch/auth change |
| `my-polls-page.js` | Shared constants; home CTA on live load failure | sign-in vs load-failure CTA split unchanged |
| `vote-page.js` | `PUBLIC_VOTE_PAGE_LOADING_MESSAGE`; `PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE` | title/copy only |
| `result-page.js` | `PUBLIC_RESULTS_PAGE_LOADING_MESSAGE`; `PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE` | title/copy only; visibility unchanged |
| `profile-page.js` | `PUBLIC_PROFILE_PAGE_LOADING_MESSAGE`; shared failure constants | `/users/me/profile` paths unchanged |
| `explore.html` | `#explore-error` host is `div.mvp-error-panel` | DOM host only |
| `public-mvp.css` | `.mvp-error-panel` matches `#error-panel`; empty-state CTA spacing | layout only |

**Not modified by Phase 199:** `quality-feedback-badge.js`, backend `src/`, migrations, auth/session resolvers, vote transaction paths, result evaluator.

---

## 3. State Copy Flow Under Review

```text
PUBLIC_PENDING_USER_MESSAGES
  → surface re-exports (EXPLORE_FEED_LOADING_MESSAGE, VOTE_PAGE_LOADING_MESSAGE, …)
  → status regions / aria-busy titles during fetch

PUBLIC_LOAD_FAILURE_USER_MESSAGES
  → surface re-exports + existing module allowlists
  → resolvePublicErrorUserMessage fallbacks in catch handlers

renderPublicInlineErrorNote(host, { message, ctaHref, ctaLabel })
  → panel-message paragraph from caller-supplied frontend-owned message
  → optional mvp-action-link CTA only when both href and label provided

/explore
  → initial load failure: showError(EXPLORE_LOAD_FAILURE_MESSAGE, { showHomeLink: true })
  → load-more failure: plain message only (no home CTA)
  → fetchExploreFeedPage unchanged

/my-polls?live=1
  → sign-in required: login CTA only (showLoginLink: true)
  → list/load failure: renderPublicInlineErrorNote → home CTA
  → fetchCreatorOwnedPolls / prepareMyPollsLiveSession unchanged

/vote/:pollId, /results/:pollId
  → load catch: resolvePublicErrorUserMessage + existing allowlists
  → route error title: PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE / PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE
  → renderPublicErrorPanel showNav unchanged on results load failure

/profile
  → mountProfilePage announces PROFILE_LOADING_MESSAGE during load
  → loadUserProfile / saveUserProfile still target /users/me/profile only
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 200 found **no privacy, auth, result visibility, eligibility, vote transaction, API contract, `quality_badge` governance, or linkage gap** in the Phase 199 public MVP state-copy runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Phase 201 blockers: none identified.**

### 4.1 Loading / failure constants are frontend-owned only

- All new `PUBLIC_*_LOADING_MESSAGE` strings follow `…中，請稍候。` and are listed in `PUBLIC_PENDING_USER_MESSAGES`.
- All new `PUBLIC_*_LOAD_FAILURE_MESSAGE` strings follow `目前無法載入…，請稍後再試。` (or existing save-failure pattern) and are listed in `PUBLIC_LOAD_FAILURE_USER_MESSAGES`.
- No backend error codes, internal identifiers, vote counts, percentages, or eligibility outcomes appear in these constants.

### 4.2 Profile loading copy is display-only

- `PROFILE_LOADING_MESSAGE` now re-exports `PUBLIC_PROFILE_PAGE_LOADING_MESSAGE` (`載入個人資料中，請稍候。`).
- `loadUserProfile` and `saveUserProfile` still call `GET` / `PUT` `/users/me/profile` with the same credentials and body shape as before Phase 199.

### 4.3 Vote/results load-error titles are copy-only

- `bootstrapVotePage` uses `PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE` for the visible error panel heading on load failure.
- `bootstrapResultPage` uses `PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE` for the visible error panel heading on load failure.
- Result display tiers, collecting/unavailable shells, and `renderResultDisplay` visibility rules are unchanged.

### 4.4 `renderPublicInlineErrorNote` is safe CTA fallback only

- Renders `message` via `textContent` on a `panel-message` paragraph.
- Optional CTA is a plain `mvp-action-link` anchor when both `ctaHref` and `ctaLabel` are provided.
- Does not read `error.message`, API payloads, or stack traces.

### 4.5 Explore / my-polls error CTAs do not alter API or auth

- Explore home CTA appears only when `showHomeLink: true` (initial feed reset failure).
- My-polls home CTA appears only on non-sign-in load failures; sign-in path still renders login link only.
- No new `fetch` paths, credentials changes, or session mutations were added to error handlers.

### 4.6 CSS changes are layout-only

- `.mvp-error-panel` shares margin, padding, border, and background with `#error-panel`.
- `.mvp-empty-state` CTA spacing adds margin only; no new data hooks or visibility logic.

### 4.7 `quality_badge` behavior unchanged

- `quality-feedback-badge.js` was not modified in Phase 199.
- `shouldRenderQualityFeedbackBadge` gates on `quality_badge === 'positive_feedback'` only.
- Visible label remains `回饋良好`; null/missing/unexpected values do not render; no tooltip/debug/counts/score/rank paths added.

### 4.8 No client storage or linkage regression

- Phase 199 state-copy modules do not use `localStorage`, `sessionStorage`, or cookies.
- State handlers do not log or persist option-level choice linkage.

### 4.9 Raw Option Linkage Ban preserved

- Phase 199 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-200-public-mvp-state-copy-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-200-public-mvp-state-copy-runtime-review-checkpoint-doc.test.ts`

Phase 199 delivery guard tests remain the baseline:

- `tests/frontend/phase-199-public-mvp-empty-error-loading-state-polish.test.ts`
- `tests/docs/phase-199-public-mvp-empty-error-loading-state-polish-doc.test.ts`

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

Phase 200 is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
