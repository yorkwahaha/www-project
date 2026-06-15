# WWW Project Phase 264 — Public Help / FAQ Copy Milestone Checkpoint v1

**Status:** milestone checkpoint, focused doc guards, frontend/static guards, and README index only. Consolidates Phase 256–263 public help / FAQ copy refinement, static HTML shell fallback alignment, and homepage account-flow runtime copy cleanup — into the stable boundary reference before any future public copy work that might touch vote, eligibility, result visibility, creator session, lifecycle, or privacy behavior.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 263 home account flow runtime copy review checkpoint (`fe5427c`).

**Prior checkpoint:** [Phase 255 public presentation & accessibility polish milestone checkpoint](./www-project-phase-255-public-presentation-accessibility-polish-milestone-checkpoint-v1.md).

**Prior delivery:** [Phase 263 home account flow runtime copy review checkpoint](./www-project-phase-263-home-account-flow-runtime-copy-review-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 264 records the completed **public help / FAQ / static HTML shell / runtime copy cleanup** arc across Phase 256–263. It is the stable boundary reference for what those phases **delivered** across centralized `PUBLIC_*` copy constants, FAQ alignment, P0/P1 static HTML fallback alignment, runtime onboarding copy sync, and homepage account-flow engineer-token removal, and what they **must not have changed** without a separately approved phase.

This milestone answers:

1. What Phase 256–263 delivered and what remains fixed.
2. Which copy categories were allowed (`public-page-copy.js` constants, `public-mvp-ui.js` re-exports/allowlists, static HTML fallback text replacement, `sync*OnboardingCopy` mount sync, homepage account-flow note assembly).
3. Which vote, result, creator lifecycle, auth, profile, `quality_badge`, and privacy boundaries the copy arc preserved.
4. That `public-page-copy.js` remains constants-only / side-effect-free and helper/runtime copy modules do not introduce new API calls, storage, or tracking beyond pre-existing approved page flows.
5. Which future work still requires a new phase with explicit governance review.

**Phase 256–263 public help / FAQ / static HTML shell / runtime copy cleanup work is complete for this milestone.**

---

## 2. Phase 256–263 Milestone Summary

| Phase | Delivery | Surface | Status |
|-------|----------|---------|--------|
| **256** | Public help / FAQ copy refinement plan | plan-only | **Complete** |
| **257** | Public help / FAQ copy refinement — `public-page-copy.js`, FAQ alignment | `public-page-copy.js`, `public-mvp-ui.js`, `faq.html` | **Complete** |
| **258** | Public help / FAQ copy runtime review checkpoint | review | **Complete** |
| **259** | Public static HTML shell copy alignment plan | plan-only | **Complete** |
| **260** | Public static HTML shell copy alignment — P0/P1 HTML fallback | `index.html`, `login.html`, `vote.html`, `results.html`, `create-poll.html`, `my-polls.html` | **Complete** |
| **261** | Public static HTML shell copy runtime review checkpoint | review | **Complete** |
| **262** | Home account flow runtime copy token cleanup | `syncHomePageAccountFlowNote` in `public-mvp-home.js` | **Complete** |
| **263** | Home account flow runtime copy review checkpoint | review | **Complete** |

### 2.1 Phase references

- [Phase 256 public help / FAQ copy refinement plan](./www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md)
- [Phase 257 public help / FAQ copy refinement](./www-project-phase-257-public-help-faq-copy-refinement-v1.md)
- [Phase 258 public help / FAQ copy runtime review checkpoint](./www-project-phase-258-public-help-faq-copy-runtime-review-checkpoint-v1.md)
- [Phase 259 public static HTML shell copy alignment plan](./www-project-phase-259-public-static-html-shell-copy-alignment-plan-v1.md)
- [Phase 260 public static HTML shell copy alignment](./www-project-phase-260-public-static-html-shell-copy-alignment-v1.md)
- [Phase 261 public static HTML shell copy runtime review checkpoint](./www-project-phase-261-public-static-html-shell-copy-runtime-review-checkpoint-v1.md)
- [Phase 262 home account flow runtime copy token cleanup](./www-project-phase-262-home-account-flow-runtime-copy-token-cleanup-v1.md)
- [Phase 263 home account flow runtime copy review checkpoint](./www-project-phase-263-home-account-flow-runtime-copy-review-checkpoint-v1.md)

### 2.2 Consolidated delivery facts

Phase 256–263 together delivered:

1. **Copy refinement plan (256)** — inventories help/FAQ/guide copy; defines Phase 257 minimal copy-only scope; explicit non-goals for ranking/trust/governance/analytics/storage.
2. **Centralized copy constants (257)** — `public-page-copy.js` `PUBLIC_*` strings; re-exported by `public-mvp-ui.js` and referenced by `creator-flow-copy.js`; `faq.html` static fallback aligned; removes「優質題目」from refined copy.
3. **Copy runtime review (258)** — **APPROVED** — `public-page-copy.js` constants-only / side-effect-free; `PAGE_COPY.*` allowlist boundaries preserved; presentation-only copy delivery.
4. **Static shell alignment plan (259)** — inventories post–Phase 257 static fallback drift; defines Phase 260 HTML allowlist.
5. **Static HTML fallback alignment (260)** — P0/P1 shells aligned with Phase 257 constants; removes stale engineer auth fallback (`X-User-Id`, `creator_session`, `production credential proof`); `faq.html` out of scope (Phase 257 aligned).
6. **Static shell runtime review (261)** — **APPROVED** — Phase 260 static-only; `syncHomePageAccountFlowNote` engineer tokens noted as Phase 262 candidate.
7. **Homepage runtime token cleanup (262)** — `syncHomePageAccountFlowNote` no longer injects `creator_session` / `X-User-Id`; runtime matches Phase 260 static fallback direction.
8. **Homepage runtime copy review (263)** — **APPROVED** — Phase 262 copy assembly only; no login/registration/creator session drift.

Runtime patches across the arc were limited to **centralized copy constants, re-export/allowlist wiring, static HTML fallback text replacement, and homepage account-flow note text assembly** only.

**No behavior change hidden behind copy changes.**

---

## 3. Current Public Help / FAQ Copy Contract (Fixed)

### 3.1 Allowed copy categories (delivered)

| Category | Phase 256–263 behavior |
|----------|------------------------|
| Centralized constants | `public-page-copy.js` — `export const PUBLIC_*` only |
| Re-export / allowlist | `public-mvp-ui.js` — `export * from './public-page-copy.js'`, `PAGE_COPY.*` onboarding allowlists |
| Creator flow copy import | `creator-flow-copy.js` — imports `PUBLIC_CREATOR_*` / related constants from `public-page-copy.js` only for copy strings |
| Static HTML fallback | P0/P1 shells — text node replacement aligned with `PUBLIC_*` constants |
| Runtime mount sync | `sync*OnboardingCopy` helpers overwrite known mount ids at module load |
| Homepage account flow note | `syncHomePageAccountFlowNote` — user-facing demo/profile copy; no engineer `<code>` tokens |

### 3.2 `public-page-copy.js` is constants-only

- exports `PUBLIC_*` string constants only
- no `fetch`, event listeners, `localStorage`, `sessionStorage`, or DOM mutation
- no `export function` / `export async function`

### 3.3 Static HTML shell contract (Phase 260)

| Rule | Status |
|------|--------|
| P0/P1 shells static fallback copy-only | **Fixed** |
| No new / removed `<script>` tags on touched shells | **Fixed** |
| No `onclick` / inline handlers / storage / tracking in touched shells | **Fixed** |
| `id` / `class` / `data-*` / form / link contracts preserved | **Fixed** |
| Stale markers removed: `X-User-Id`, `creator_session`, `優質題目`, `多種訊號`, `production credential proof` | **Fixed** |
| `faq.html` aligned in Phase 257; not modified in Phase 260 | **Fixed** |

### 3.4 Homepage runtime account-flow copy (Phase 262–263)

| Rule | Status |
|------|--------|
| No `creator_session` / `X-User-Id` in `public-mvp-home.js` | **Fixed** |
| Registration note `PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE`「只建立帳號，不會自動登入」preserved | **Fixed** |
| Link `href` targets preserved (`/registration`, `/login`, `/polls/new?live=1`, `/profile`) | **Fixed** |
| No eligibility outcome disclosure or vote-eligibility guarantee | **Fixed** |
| No new fetch / listener / storage / tracking in `public-mvp-home.js` | **Fixed** |

### 3.5 `quality_badge` presentation gate (unchanged)

| Rule | Status |
|------|--------|
| `positive_feedback` →「回饋良好」only | **Fixed** |
| `null` / missing / unexpected → silent (no render) | **Fixed** |
| Not used for ranking / recommendation / personalization / trust / score / creator score / governance | **Fixed** |
| No tooltip / debug / explanation / counts / score / rank | **Fixed** |
| No hidden aggregate display | **Fixed** |

### 3.6 Vote and result boundaries (unchanged)

| Boundary | Status |
|----------|--------|
| vote-by-index body `{ option_index }` only | **Fixed** |
| eligibility-before-option-resolve in Official Vote transaction | **Fixed** |
| result visibility tiers and result display evaluator | **Fixed** |
| Official Vote transaction order | **Fixed** |

### 3.7 Creator and account boundaries (unchanged)

| Boundary | Status |
|----------|--------|
| registration `POST /registration` only; no auto-login / `Set-Cookie` | **Fixed** |
| no post-success `GET /users/me` (registration does not call `GET /users/me` after success) | **Fixed** |
| `/users/me` returns `user_id` / `display_name` only | **Fixed** |
| profile fields `birth_year_month` / `residential_region` only | **Fixed** |
| login / logout / creator session handlers unchanged by Phase 256–263 copy arc | **Fixed** |
| creator lifecycle POST flow and ownership rules unchanged | **Fixed** |
| `UserAuthResolver` semantics unchanged | **Fixed** |

### 3.8 Forbidden copy additions (not delivered)

- tooltip / debug / explanation / counts / score / rank
- hidden aggregate display
- localStorage / sessionStorage
- analytics / metrics / APM / debug tracking
- registration auto-login implication or guaranteed vote eligibility promise
- option choice + user/session/device/request/log/trace/metric/error linkage

**No option choice + user/session/device/request/log/trace/metric/error linkage** was introduced by Phase 256–263.

---

## 4. Phase 264 Checkpoint Review

### 4.1 Review method

Phase 264 re-reads Phase 256–263 deliverables, `public-page-copy.js`, `public-mvp-ui.js` allowlists, `creator-flow-copy.js`, P0/P1 static HTML shells, `public-mvp-home.js` account-flow sync, `faq.html`, and focused guard tests. It does **not** change runtime, CSS, HTML, JS modules, migrations, or backend APIs.

### 4.2 Findings by slice

| Slice | Review focus | Drift found |
|-------|--------------|-------------|
| **256–257 copy refinement** | `public-page-copy.js` constants-only; FAQ aligned | **None** |
| **258 copy runtime review** | re-export/allowlist boundaries | **None** |
| **259–260 static shell** | P0/P1 fallback copy-only; contracts preserved | **None** |
| **261 static shell review** | static-only delivery confirmed | **None** |
| **262–263 homepage runtime** | engineer tokens removed; copy assembly only | **None** |

### 4.3 Cross-cutting checks

| Check | Result |
|-------|--------|
| `public-page-copy.js` constants-only / side-effect-free | **Pass** |
| `public-mvp-ui.js` re-export / `PAGE_COPY.*` allowlist unchanged | **Pass** |
| `creator-flow-copy.js` copy imports only; no creator API drift | **Pass** |
| P0/P1 static fallback free of stale engineer/misleading copy | **Pass** |
| Homepage runtime copy free of `creator_session` / `X-User-Id` | **Pass** |
| `faq.html` Phase 257 aligned; Phase 260 did not modify | **Pass** |
| registration copy does not imply auto-login | **Pass** |
| vote-by-index `{ option_index }` only | **Pass** |
| Official Vote transaction order unchanged | **Pass** |
| `quality_badge` gate and non-ranking use | **Pass** |
| no new localStorage / sessionStorage | **Pass** |
| no analytics / metrics / APM / debug tracking | **Pass** |
| Raw Option Linkage Ban preserved | **Pass** |
| protected backend / API / migrations free of Phase 256–264 copy markers | **Pass** |

---

## 5. Phase 264 Delivery (This Phase)

Phase 264 itself is **review-only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes** (unless a clear regression were found — none identified)

Added:

1. `docs/www-project-phase-264-public-help-faq-copy-milestone-checkpoint-v1.md` (this document)
2. `tests/frontend/phase-264-public-help-faq-copy-milestone-checkpoint.test.ts`
3. `tests/docs/phase-264-public-help-faq-copy-milestone-checkpoint-doc.test.ts`
4. README Phase 264 index

`design-drafts/` excluded from commit.

---

## 6. Focused Guard Tests

- `tests/frontend/phase-264-public-help-faq-copy-milestone-checkpoint.test.ts`
- `tests/docs/phase-264-public-help-faq-copy-milestone-checkpoint-doc.test.ts`

---

## 7. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 8. Conclusion

**APPROVED — Public help / FAQ / static HTML shell / runtime copy cleanup milestone complete (Phase 256–263); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

Phase 256–263 changes were limited to centralized `PUBLIC_*` copy constants, FAQ and static HTML fallback alignment, runtime onboarding copy sync, and homepage account-flow engineer-token removal. Vote integrity, result visibility, creator lifecycle, auth/profile boundaries, and Raw Option Linkage Ban remain intact.

**Phase 265 blockers: none identified.**

---

## 9. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 264 is a docs/guards-only milestone checkpoint. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
