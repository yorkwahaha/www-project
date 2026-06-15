# WWW Project Phase 260 — Public Static HTML Shell Copy Alignment v1

**Status:** delivered. minimal static HTML shell fallback copy alignment per [Phase 259 plan](./www-project-phase-259-public-static-html-shell-copy-alignment-plan-v1.md). Presentation-only text replacement in allowlisted `public/*.html` shells; no runtime behavior, API, DB, auth, vote, result, creator, or profile boundary changes.

**Baseline:** `origin/master` after Phase 259 public static HTML shell copy alignment plan (`f62bc8f`).

**Prior plan:** [Phase 259 public static HTML shell copy alignment plan](./www-project-phase-259-public-static-html-shell-copy-alignment-plan-v1.md).

**Prior delivery:** [Phase 257 public help / FAQ copy refinement](./www-project-phase-257-public-help-faq-copy-refinement-v1.md).

---

## 1. Delivery Summary

Phase 260 aligns static HTML fallback copy in P0/P1 public shells with Phase 257 `public-page-copy.js` refined `PUBLIC_*` constants. JavaScript page modules still overwrite synced mount points at load; this phase closes no-JS / slow-JS / BFCache-before-sync drift only.

### 1.1 Modified files

| Priority | Path | Changes |
|----------|------|---------|
| P0 | `public/index.html` | Hero lead「截止後」; demo account note without engineer tokens; quality value card + collecting help tip aligned |
| P0 | `public/login.html` | Lead, form hint, credential label, shell hint, auth grid rephrased to user-facing credential / account-flow copy |
| P0 | `public/vote.html` | Reminder lead order; policy quality-feedback bullet aligned |
| P0 | `public/results.html` | Demo intro without ranking/trust quality wording |
| P0 | `public/create-poll.html` | Lead, banner, live hint, nav hint, static「發起須知」, founder lock tooltip aligned |
| P1 | `public/my-polls.html` | Lead「修改或刪除」; banner live-mode wording aligned |
| Guards | `tests/frontend/phase-260-public-static-html-shell-copy-alignment.test.ts` | HTML copy-only boundary guards |
| Guards | `tests/docs/phase-260-public-static-html-shell-copy-alignment-doc.test.ts` | Doc + README index guards |
| Docs | `README.md` | Phase 260 index entry |

### 1.2 Out of scope (unchanged)

| Path | Reason |
|------|--------|
| `public/faq.html` | Aligned in Phase 257 |
| `public/registration.html`, `public/profile.html`, `public/explore.html` | Fallback already aligned; verified only |
| `public/trust-levels.html` | No Phase 259 allowlist drift requiring change |
| `public/frontend/*.js`, `public/frontend/public-mvp.css` | Phase 260 is static HTML fallback only |
| `src/**`, `migrations/**` | No backend / API / DB change |

---

## 2. Copy Alignment Themes

| Theme | Stale fallback removed | Aligned constant direction |
|-------|------------------------|----------------------------|
| Quality feedback |「優質題目」「多種訊號」| `PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY`, `PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT`, `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` |
| Engineer auth copy | `X-User-Id`, `creator_session`, `production credential proof` | `PUBLIC_LOGIN_PAGE_LEAD_SECONDARY`, `PUBLIC_LOGIN_FORM_READY_HINT`, user-facing demo boundary |
| Lifecycle vocabulary |「編輯」「期中結果」「變更公開狀態」| `PUBLIC_MY_POLLS_PAGE_LEAD`, `PUBLIC_CREATE_POLL_PAGE_LEAD`, `PUBLIC_CREATE_POLL_LIVE_MODE_HINT` |
| Demo vs live |「公開展示版」wording order | `PUBLIC_CREATE_POLL_PAGE_BANNER_BODY`, `PUBLIC_MY_POLLS_PAGE_BANNER_BODY` |
| Hero timing |「統計結束後」| `PUBLIC_HOME_HERO_LEAD`（「截止後」）|

`quality_badge` boundary unchanged: `positive_feedback` →「回饋良好」only; no score, rank, recommendation, trust, governance, tooltip, count, or debug expansion in HTML.

---

## 3. Explicit Non-Goals (Unchanged)

Phase 260 did **not**:

- API / DB / backend / migration changes
- Change API, DB, migrations, auth resolver, vote evaluator, result evaluator, or creator lifecycle APIs
- Change vote-by-index payload shape or eligibility-before-option-resolve order
- Add registration auto-login, `Set-Cookie`, or post-success `GET /users/me` (registration does not call `GET /users/me` after success)
- Expand profile fields beyond `birth_year_month` / `residential_region`
- Add `localStorage`, `sessionStorage`, analytics / APM / debug tracking
- Modify runtime handlers, submit/click/navigation/form behavior, or `public-mvp.css` layout
- Change `id`, `class`, `data-*`, form fields, button types, link `href`, or script tags
- Commit `design-drafts/`
- Option choice + user/session/device/request/log/trace/metric/error linkage

---

## 4. Fixed Boundaries

### 4.1 vote-by-index

- Request body remains `{ option_index }` only.

### 4.2 Registration / `/users/me`

- Registration submits to `/registration` only; no auto-login; no `GET /users/me` after success.
- `/users/me` returns only `user_id` and `display_name`.

### 4.3 `quality_badge`

- `QUALITY_FEEDBACK_BADGE_LABEL` remains「回饋良好」.
- Only `positive_feedback` renders; `null`, missing, or unexpected values do not render.

### 4.4 Raw Option Linkage Ban

- No new durable or observability linkage of option choice to user, session, device, request, or traceable identifier.

---

## 5. Validation Checklist

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

Guard tests:

- `tests/frontend/phase-260-public-static-html-shell-copy-alignment.test.ts`
- `tests/docs/phase-260-public-static-html-shell-copy-alignment-doc.test.ts`

---

## 6. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 260 changed static HTML fallback copy and guard tests/docs only. No migration, schema DDL, backend runtime, API contract, vote transaction, or auth behavior changes.
