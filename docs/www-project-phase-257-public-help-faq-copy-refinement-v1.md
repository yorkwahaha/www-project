# WWW Project Phase 257 — Public Help / FAQ Copy Refinement v1

**Status:** delivered. Minimal public help / FAQ / guide copy refinement per [Phase 256 plan](./www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md). Presentation-only string changes; no runtime behavior, API, DB, auth, vote, result, creator, or profile boundary changes.

**Baseline:** `origin/master` after Phase 256 plan (`faa5c20`).

**Prior plan:** [Phase 256 public help / FAQ copy refinement plan](./www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md).

---

## 1. Delivery Summary

Phase 257 refines user-facing help / FAQ / onboarding copy for clarity and cross-page consistency while preserving eligibility hedging, demo/live distinctions, and `quality_badge` presentation boundaries.

### 1.1 Modified copy surfaces

| Area | Primary source | Changes |
|------|----------------|---------|
| Shared public copy | `public/frontend/public-page-copy.js` (new) | Centralized Phase 257 refined `PUBLIC_*` strings |
| Re-exports / allowlists | `public/frontend/public-mvp-ui.js` | Re-exports from `public-page-copy.js`; allowlists reference `PAGE_COPY.*` |
| Creator hints | `public/frontend/creator-flow-copy.js` | Imports refined creator hint constants |
| FAQ static fallback | `public/faq.html` | Aligned lifecycle, demo/live, profile, and quality-feedback explanatory copy |

### 1.2 Copy refinement themes

1. **Lifecycle vocabulary** — aligned cancel / close / unpublish wording with vote, results, my-polls, and create-poll surfaces.
2. **Demo vs live** — clarified「展示模式」and「即時模式（?live=1）」without new product promises.
3. **Account guidance** — replaced engineer-facing credential wording with「已核准的登入憑證／憑證」; removed `X-User-Id` / `creator_session` from user-visible login lead copy.
4. **Eligibility hedging preserved** — retained「不表示可保證符合或不符合」and similar non-guarantee language.
5. **Quality feedback clarity** — removed「優質題目」from refined copy; `quality_badge` remains presentation-only `positive_feedback` →「回饋良好」; FAQ explains badge as feedback evaluation, not score/rank/recommendation.

---

## 2. Explicit Non-Goals (Unchanged)

Phase 257 did **not**:

- Change API, DB, migrations, auth resolver, vote evaluator, result evaluator, or creator lifecycle APIs
- Change vote-by-index payload shape or eligibility-before-option-resolve order
- Add registration auto-login, `Set-Cookie`, or post-success `GET /users/me`
- Expand profile fields beyond `birth_year_month` / `residential_region`
- Add `localStorage`, `sessionStorage`, analytics, APM, or debug tracking
- Modify runtime handlers, submit/click/navigation/form behavior, or `public-mvp.css` layout
- Change static HTML shells other than `public/faq.html` (runtime sync applies refined constants at load)

---

## 3. Fixed Boundaries

### 3.1 vote-by-index

- Request body remains `{ option_index }` only.

### 3.2 Registration / `/users/me`

- Registration submits to `/registration` only; no auto-login; no `GET /users/me` after success.
- `/users/me` returns only `user_id` and `display_name`.

### 3.3 `quality_badge`

- `QUALITY_FEEDBACK_BADGE_LABEL` remains「回饋良好」.
- Only `positive_feedback` renders; `null`, missing, or unexpected values do not render.
- No tooltip, score, rank, count, or governance copy added to badge runtime.

### 3.4 Raw Option Linkage Ban

- No new durable or observability linkage of option choice to user, session, device, request, or traceable identifier.

---

## 4. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 5. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 257 changed presentation-only copy modules and `public/faq.html` static fallback. No migration, schema DDL, backend runtime, API contract, vote transaction, or auth behavior changes.
