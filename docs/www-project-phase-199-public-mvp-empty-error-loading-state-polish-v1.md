# WWW Project Phase 199 — Public MVP Empty / Error / Loading State Polish v1

**Status:** frontend UX polish — aligned public empty / loading / error state copy, minimal inline error layout, safe next-step CTAs, focused guard tests, docs, and README index.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 198 public MVP copy/layout runtime review checkpoint (`07759a3`).

**Prior checkpoint:** [Phase 198 public MVP copy/layout runtime review checkpoint](./www-project-phase-198-public-mvp-copy-layout-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 199 polishes public-page empty, loading, and error states after Phase 197–198 copy/layout alignment. It centralizes surface-specific pending and load-failure copy in `public-mvp-ui.js`, keeps user-visible failures frontend-owned, and adds minimal layout consistency for inline error panels and empty-state CTAs.

Goals:

1. Align loading copy style across `/explore`, `/vote/:pollId`, `/results/:pollId`, `/my-polls?live=1`, and `/profile` using `…中，請稍候。` surface-specific constants listed in `PUBLIC_PENDING_USER_MESSAGES`.
2. Align empty-state copy and keep existing safe next-step CTAs (create poll / login) without adding eligibility disclosure.
3. Align load-failure copy using `目前無法載入…，請稍後再試。` constants listed in `PUBLIC_LOAD_FAILURE_USER_MESSAGES`.
4. Add safe home CTA on explore initial load failure and my-polls live load failure via `renderPublicInlineErrorNote`.
5. Use shared load-error titles for vote and results route error panels.
6. Preserve `quality_badge`, result visibility, and auth/profile boundaries exactly.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — surface loading / load-failure constants, `PUBLIC_LOAD_FAILURE_USER_MESSAGES`, `renderPublicInlineErrorNote`, load-error titles.
- `public/frontend/explore-page.js` — shared constants; initial load error home CTA.
- `public/frontend/my-polls-page.js` — shared constants; live load failure home CTA.
- `public/frontend/vote-page.js` — shared loading constant; `PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE`.
- `public/frontend/result-page.js` — shared loading / failure constants; `PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE`.
- `public/frontend/profile-page.js` — `PUBLIC_PROFILE_PAGE_LOADING_MESSAGE` and shared failure constants.
- `public/explore.html` — explore error host uses `div.mvp-error-panel`.
- `public/frontend/public-mvp.css` — `.mvp-error-panel` matches `#error-panel`; empty-state CTA spacing.
- Focused frontend + doc tests.
- README Phase 199 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Vote transaction, eligibility evaluation, result visibility tiers.
- `quality-feedback-badge.js` behavior changes.
- `design-drafts/` commits.

---

## 3. Copy rules

### 3.1 Must

- Use frontend-owned loading / pending copy from `PUBLIC_PENDING_USER_MESSAGES` or surface re-exports.
- Use frontend-owned load / save failure copy from `PUBLIC_LOAD_FAILURE_USER_MESSAGES` or existing module allowlists.
- Use `resolvePublicErrorUserMessage` in catch handlers; never echo foreign `error.message`.
- Keep auth/profile prompts neutral (`請先登入…`) without eligibility outcome disclosure.
- Keep result pages free of counters or hidden-result explanation leakage in empty / unavailable / loading states.

### 3.2 Must not

- Echo raw backend payloads, API `message` fields, internal error codes, or stack traces.
- Show vote counts, percentages, ranking, trends, or eligibility outcomes in loading / empty / error states.
- Change `quality_badge` rendering (`positive_feedback` → `回饋良好` only; null/missing/unexpected silent).
- Create durable user-option linkage in state handlers.

---

## 4. Surface summary

| Surface | Loading copy | Load failure copy | Empty / error CTA |
|---------|--------------|-------------------|-------------------|
| `/explore` | `PUBLIC_EXPLORE_FEED_LOADING_MESSAGE` | `PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE` | empty → create poll; initial load error → home |
| `/vote/:pollId` | `PUBLIC_VOTE_PAGE_LOADING_MESSAGE` | `VOTE_PAGE_LOAD_FAILURE` + allowlist | existing public nav on route error panel |
| `/results/:pollId` | `PUBLIC_RESULTS_PAGE_LOADING_MESSAGE` | `PUBLIC_RESULTS_LOAD_FAILURE_MESSAGE` + allowlist | existing public nav on route error panel |
| `/my-polls?live=1` | `PUBLIC_MY_POLLS_LOADING_MESSAGE` | `PUBLIC_MY_POLLS_LOAD_FAILURE_MESSAGE` | empty → create poll; sign-in → login; load error → home |
| `/profile` | `PUBLIC_PROFILE_PAGE_LOADING_MESSAGE` | `PUBLIC_PROFILE_LOAD_FAILURE_MESSAGE` / save failure | unauthenticated → login + register |

---

## 5. `quality_badge` unchanged

- `quality-feedback-badge.js` not modified.
- `shouldRenderQualityFeedbackBadge` gates on `quality_badge === 'positive_feedback'` only.
- Visible label remains `回饋良好`; null/missing/unexpected values do not render; no tooltip/debug/counts/score/rank.

---

## 6. Validation

```bash
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-199-public-mvp-empty-error-loading-state-polish.test.ts`
- `tests/docs/phase-199-public-mvp-empty-error-loading-state-polish-doc.test.ts`

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Empty / loading / error UI does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.
