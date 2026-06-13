# WWW Project Phase 201 — Public MVP Mobile Readability Polish v1

**Status:** frontend/CSS/layout polish — mobile readability for `/explore`, `/vote/:pollId`, and `/results/:pollId`; focused guard tests, docs, and README index.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 200 public MVP state copy runtime review checkpoint (`9f40050`).

**Prior checkpoint:** [Phase 200 public MVP state copy runtime review checkpoint](./www-project-phase-200-public-mvp-state-copy-runtime-review-checkpoint-v1.md).

**Planning context:** [Phase 196 public MVP post-quality-badge UX polish plan](./www-project-phase-196-public-mvp-post-quality-badge-ux-polish-plan-v1.md) §3.5 mobile readability.

---

## 1. Purpose

Phase 201 improves mobile readability on the three public participation surfaces after Phase 197–200 copy and state polish. Changes are CSS-first with minimal static HTML page-class wrappers only.

Goals:

1. Improve mobile typography, line length, and vertical rhythm on explore feed cards, vote form/policy panels, and results aggregate panels.
2. Keep copy behavior and API calls unchanged.
3. Preserve `quality_badge` presentation exactly per Phase 195.
4. Add guard tests proving Phase 201 is frontend/CSS/layout only.

---

## 2. Scope

### 2.1 In scope

| Area | Change |
|------|--------|
| `public/frontend/public-mvp.css` | Phase 201 mobile readability rules scoped to `.explore-page`, `.vote-page`, `.results-page` |
| `public/vote.html` | `vote-page` class on `<main>` |
| `public/results.html` | `results-page` class on `<main>`; `results-page-demo-intro` class replaces inline margin style |
| Guard tests | CSS/page-class coverage; no backend linkage; `quality_badge` unchanged |
| README | Phase 201 index |

`public/explore.html` already exposes `explore-page` on `<main>`; no markup change required.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- `explore-page.js`, `vote-page.js`, `result-page.js`, `quality-feedback-badge.js` behavior changes.
- Copy centralization or new `PUBLIC_*` constants.
- `design-drafts/` commits.

---

## 3. CSS changes (summary)

### 3.1 `/explore`

- Status line (`#explore-status`) spacing and line-height.
- Full-width `#explore-load-more` with top margin.
- Mobile: page intro lead/meta line-height; poll card title/meta/hint font rhythm; quality badge row spacing; error/empty panel top margin.

### 3.2 `/vote/:pollId`

- Mobile: poll title and description wrap rhythm; policy panel list item size/line-height; mock banner readability; fieldset legend spacing; form message and submit spacing; side panel top margin.

### 3.3 `/results/:pollId`

- `.results-page-demo-intro` line-height (replaces inline style).
- Mobile: page title clamp; intro/demo meta size; collecting/unavailable/intro panel padding; result option and label rhythm; footer nav stacked full-width links; error panel and public notice line-height.

---

## 4. `quality_badge` unchanged

- `quality-feedback-badge.js` not modified.
- `shouldRenderQualityFeedbackBadge` gates on `quality_badge === 'positive_feedback'` only.
- Visible label remains `回饋良好`; null/missing/unexpected values do not render; no tooltip/debug/counts/score/rank.

---

## 5. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-201-public-mvp-mobile-readability-polish.test.ts`
- `tests/docs/phase-201-public-mvp-mobile-readability-polish-doc.test.ts`

---

## 6. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Mobile readability polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`. Vote-by-index body remains `{ option_index }` only.
