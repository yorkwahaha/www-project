# WWW Project Phase 261 — Public Static HTML Shell Copy Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 260 public static HTML shell fallback copy alignment (`public/index.html`, `public/login.html`, `public/vote.html`, `public/results.html`, `public/create-poll.html`, `public/my-polls.html`).

**No runtime change, no API change, no frontend behavior change, no migration, no schema change.** Review documentation and guard tests only.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 260 public static HTML shell fallback copy alignment (`7a99bc3`).

**Prior delivery:** [Phase 260 public static HTML shell copy alignment](./www-project-phase-260-public-static-html-shell-copy-alignment-v1.md) (`docs/www-project-phase-260-public-static-html-shell-copy-alignment-v1.md`).

**Prior plan:** [Phase 259 public static HTML shell copy alignment plan](./www-project-phase-259-public-static-html-shell-copy-alignment-plan-v1.md).

---

## 1. Review Purpose

Phase 261 reviews Phase 260 static HTML shell fallback copy alignment to confirm:

1. Phase 260 modified **only** P0/P1 HTML shells (`index.html`, `login.html`, `vote.html`, `results.html`, `create-poll.html`, `my-polls.html`) — static text node / list item replacement aligned with Phase 257 `public-page-copy.js` `PUBLIC_*` constants.
2. `public/faq.html` was **not** modified in Phase 260 (aligned in Phase 257).
3. `public/registration.html`, `public/profile.html`, `public/explore.html`, and `public/trust-levels.html` were verified only — no Phase 260 alignment required.
4. No new or removed `<script>` tags, inline handlers, module imports, API calls, `localStorage` / `sessionStorage`, or tracking in touched HTML shells.
5. Form / button / link `href`, `id`, `class`, and `data-*` contracts preserved on touched shells.
6. `public/frontend/*.js` and `public/frontend/public-mvp.css` were **not** modified by Phase 260.
7. JavaScript page modules still call existing `sync*OnboardingCopy` / `sync*Page*` helpers that overwrite synced mount points with `public-page-copy.js` constants at load.
8. Auth / registration / profile, vote, result, lifecycle, and creator ownership boundaries remain unchanged.
9. Raw Option Linkage Ban and `quality_badge` presentation-only boundary remain unchanged.

**Known residual (out of Phase 260 / 261 scope):** `syncHomePageAccountFlowNote` in `public-mvp-home.js` still injects `creator_session` and `X-User-Id` at runtime after load. Phase 260 aligned the **static HTML fallback** only. This runtime engineer-token display is a **Phase 262 candidate** (JS runtime copy alignment); not corrected in Phase 261.

---

## 2. Phase 260 Delivery Under Review

| Area | Phase 260 change | Review focus |
|------|------------------|--------------|
| `public/index.html` | Hero lead, demo account note, quality value card, collecting help tip | copy-only; contracts preserved |
| `public/login.html` | Lead, form hints, credential label, auth grid rephrase | copy-only; no engineer fallback in static HTML |
| `public/vote.html` | Reminder lead order, policy quality-feedback bullet | copy-only |
| `public/results.html` | Demo intro without ranking/trust quality wording | copy-only |
| `public/create-poll.html` | Lead, banner, live hint, nav hint, static「發起須知」 | copy-only |
| `public/my-polls.html` | Lead「修改或刪除」, banner live-mode wording | copy-only |
| Phase 260 guard tests | HTML copy-only boundary guards | baseline guard coverage |

**Not modified by Phase 260:** `public/frontend/*.js`, `public/frontend/public-mvp.css`, `public/faq.html`, backend vote/result/creator/auth route handlers, migrations, `UserAuthResolver`, lifecycle state machine, result evaluator, vote transaction order, eligibility-before-resolve, profile fields, registration/login/session semantics.

**Verified unchanged (no Phase 260 edit):** `public/registration.html`, `public/profile.html`, `public/explore.html`, `public/trust-levels.html`.

---

## 3. Static Fallback vs Runtime Sync Model

```text
Static HTML fallback (Phase 260 aligned)
  → visible before JS; visible if JS fails
  → P0/P1 shells no longer contain stale「優質題目」/ X-User-Id / creator_session in static copy

Runtime sync at module load (unchanged by Phase 260)
  → syncHomePageOnboardingCopy, syncLoginPageOnboardingCopy,
    syncVotePageOnboardingCopy, syncResultsPageOnboardingCopy,
    syncCreatePollPageOnboardingCopy, syncMyPollsPageOnboardingCopy
  → overwrites known mount ids with PUBLIC_* from public-page-copy.js

Residual runtime drift (Phase 262 candidate)
  → syncHomePageAccountFlowNote still appends creator_session / X-User-Id codes
  → not a Phase 260 regression; explicit out-of-scope for static-only delivery
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 261 found **no privacy, auth, creator API, lifecycle, vote transaction, result visibility, API contract, `quality_badge` governance, or linkage gap** in the Phase 260 static HTML shell fallback copy alignment requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Phase 260 public static HTML shell fallback copy alignment is presentation/static-fallback-copy-only; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

**Phase 262 blockers: none identified.**

### 4.1 Static HTML shell copy-only

| Rule | Status |
|------|--------|
| Only P0/P1 shells modified | **Confirmed** |
| `faq.html` not modified | **Confirmed** |
| registration / profile / explore / trust-levels verified only | **Confirmed** |
| No new / removed `<script>` tags on touched shells | **Confirmed** |
| No `onclick` / inline handlers / storage / tracking in touched shells | **Confirmed** |
| `id` / `class` / `data-*` / form / link contracts preserved | **Confirmed** |
| Stale fallback markers removed from static HTML | **Confirmed** |

### 4.2 Frontend runtime / CSS unchanged

| Rule | Status |
|------|--------|
| `public/frontend/*.js` not modified by Phase 260 | **Confirmed** |
| `public-mvp.css` not modified by Phase 260 | **Confirmed** |
| Existing `sync*OnboardingCopy` helpers still present | **Confirmed** |
| `public-page-copy.js` constants-only / side-effect-free | **Confirmed** |

### 4.3 Auth / registration / profile boundaries unchanged

| Boundary | Status |
|----------|--------|
| registration `POST /registration` only; no auto-login / `Set-Cookie` | **Fixed** |
| no post-success `GET /users/me` | **Fixed** |
| `GET /users/me` public copy boundary (`user_id`, `display_name` only) | **Fixed** |
| profile fields `birth_year_month` / `residential_region` only | **Fixed** |
| login / logout / profile submit handlers | **Fixed** |

### 4.4 Vote / result / creator boundaries unchanged

| Boundary | Status |
|----------|--------|
| vote-by-index body `{ option_index }` only | **Fixed** |
| eligibility-before-option-resolve in Official Vote transaction | **Fixed** |
| result visibility tiers and result display evaluator | **Fixed** |
| creator lifecycle POST flow and ownership rules | **Fixed** |
| `UserAuthResolver` semantics | **Fixed** |

### 4.5 Raw Option Linkage Ban preserved

- Static HTML copy alignment operates on presentation strings only.
- No option choice + user/session/device/request/log/trace/metric/error linkage introduced.

### 4.6 `quality_badge` boundary unchanged

- Remains presentation-only via `quality-feedback-badge.js`.
- Only `positive_feedback` → `回饋良好`; `null`, missing, or unexpected values do not render.
- Not used for ranking, recommendation, personalization, trust, score, creator score, or governance.
- No tooltip, debug, explanation, counts, score, rank, or hidden aggregate added.

### 4.7 Phase 262 candidate (not a blocker)

| Item | Notes |
|------|-------|
| `syncHomePageAccountFlowNote` runtime engineer tokens | `creator_session` / `X-User-Id` still injected at JS load; static fallback aligned in Phase 260; **Phase 262 candidate** for JS runtime copy alignment |

---

## 5. Focused Guard Tests

- `tests/frontend/phase-261-public-static-html-shell-copy-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-261-public-static-html-shell-copy-runtime-review-checkpoint-doc.test.ts`

Phase 260 delivery guard tests remain the baseline:

- `tests/frontend/phase-260-public-static-html-shell-copy-alignment.test.ts`
- `tests/docs/phase-260-public-static-html-shell-copy-alignment-doc.test.ts`

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

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 261 is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, CSS, HTML shell, or frontend behavior changes.
