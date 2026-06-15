# WWW Project Phase 262 — Home Account Flow Runtime Copy Token Cleanup v1

**Status:** delivered. copy-only runtime cleanup for homepage `#home-account-flow-note` (`syncHomePageAccountFlowNote`); removes engineer tokens (`creator_session`, `X-User-Id`) injected after JS load. No login, registration, creator session, auth resolver, API, DB, or flow behavior changes.

**Baseline:** `origin/master` after Phase 261 public static HTML shell copy runtime review checkpoint (`bbdce6f`).

**Prior checkpoint:** [Phase 261 public static HTML shell copy runtime review checkpoint](./www-project-phase-261-public-static-html-shell-copy-runtime-review-checkpoint-v1.md).

**Prior delivery:** [Phase 260 public static HTML shell copy alignment](./www-project-phase-260-public-static-html-shell-copy-alignment-v1.md).

---

## 1. Delivery Summary

Phase 261 identified a residual drift: Phase 260 aligned the **static HTML fallback** in `public/index.html`, but `syncHomePageAccountFlowNote` in `public-mvp-home.js` still rebuilt the mount point with `<code>creator_session</code>` and `<code>X-User-Id</code>` after module load.

Phase 262 aligns runtime copy with the Phase 260 static fallback and Phase 257 `public-page-copy.js` `PUBLIC_HOME_ACCOUNT_FLOW_*` / `PUBLIC_HOME_DEMO_*` constants.

### 1.1 Modified files

| Path | Changes |
|------|---------|
| `public/frontend/public-mvp-home.js` | `syncHomePageAccountFlowNote` — user-facing demo/profile copy only; no engineer `<code>` tokens; no `PUBLIC_HOME_MANUAL_QA_DOC_NOTE` append (matches static fallback) |
| Guards | `tests/frontend/phase-262-home-account-flow-runtime-copy-token-cleanup.test.ts` |
| Guards | `tests/docs/phase-262-home-account-flow-runtime-copy-token-cleanup-doc.test.ts` |
| Guards | `tests/frontend/phase-261-public-static-html-shell-copy-runtime-review-checkpoint.test.ts` — Phase 262 residual now fixed |
| Docs | `README.md` — Phase 262 index entry |

### 1.2 Out of scope (unchanged)

| Path | Reason |
|------|--------|
| `public/index.html` | Static fallback already aligned in Phase 260; DOM contract unchanged |
| `public/frontend/public-page-copy.js` | Existing `PUBLIC_*` constants sufficient; constants-only / side-effect-free |
| `public/frontend/public-mvp.css` | Explicit non-goal |
| `src/**`, `migrations/**` | No backend / API / DB change |
| Login / registration / logout / creator session handlers | Copy-only scope |
| `design-drafts/` | Not committed |

---

## 2. Copy Alignment

| Before (runtime) | After (runtime) |
|------------------|-----------------|
| `<code>creator_session</code>` after create-poll link | `PUBLIC_HOME_DEMO_CREATOR_SESSION_NOTE` plain text |
| `／投票用 MVP <code>X-User-Id</code>` | profile link + `PUBLIC_HOME_DEMO_PROFILE_VOTE_NOTE` suffix |
| Trailing `PUBLIC_HOME_MANUAL_QA_DOC_NOTE` | Removed — matches Phase 260 static fallback |

Preserved:

- `PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE` —「只建立帳號，不會自動登入」
- `PUBLIC_HOME_ACCOUNT_FLOW_LOGIN_NOTE` —「登入後頁首才會顯示帳號名稱」
- Link `href` targets: `/registration`, `/login`, `/polls/new?live=1`, `/profile`
- Mount id `#home-account-flow-note`; no new `data-*`, class, or script changes

Does **not** imply registration auto-login, guaranteed official vote eligibility, or new product promises.

---

## 3. Explicit Non-Goals (Unchanged)

Phase 262 did **not**:

- API / DB / backend / migration changes
- Change auth resolver, vote evaluator, result evaluator, or creator lifecycle APIs
- Change vote-by-index payload shape or eligibility-before-option-resolve order
- Add registration auto-login, `Set-Cookie`, or post-success `GET /users/me` (registration does not call `GET /users/me` after success)
- Expand profile fields beyond `birth_year_month` / `residential_region`
- Add `localStorage`, `sessionStorage`, analytics / APM / debug tracking
- Modify submit/click/navigation handlers or `public-mvp.css` layout
- Change `id`, `class`, `data-*`, form fields, button types, link contracts, or script tags
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

- `tests/frontend/phase-262-home-account-flow-runtime-copy-token-cleanup.test.ts`
- `tests/docs/phase-262-home-account-flow-runtime-copy-token-cleanup-doc.test.ts`

---

## 6. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 262 changed homepage runtime copy in `public-mvp-home.js` and guard tests/docs only. No migration, schema DDL, backend runtime, API contract, vote transaction, or auth behavior changes.
