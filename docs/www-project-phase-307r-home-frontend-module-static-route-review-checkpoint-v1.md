# WWW Project Phase 307-R — Home Frontend Module Static Route Review Checkpoint v1

**Status:** runtime/privacy review checkpoint — docs + docs-test + README (+ static source guards) only. Independent review of the [Phase 307 home frontend module static route fix](./www-project-phase-307-home-frontend-module-static-route-fix-v1.md) delivered in commit `7f11604`. **No runtime change** — review found no privacy, API, or hydration regression; the route-only fix is **APPROVED** and closes **B-306-01** for module delivery.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/home/feed` contract, `/polls/feed` contract, logging, metrics, deploy, or production configuration changed by Phase 307-R.**

**Reviewed commit:** `7f11604` (`origin/master`, "fix: serve homepage frontend modules").
**Baseline before Phase 307:** `09b5535` (Phase 306 visual review checkpoint).
**Reviewed implementation doc:** `docs/www-project-phase-307-home-frontend-module-static-route-fix-v1.md`.
**Prior review:** [Phase 306 homepage visual review](./www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md) — identified **B-306-01**; **FU-306-01** implemented by Phase 307.

> **Phase-number note:** Phase 307-R reviews only the `sendPublicFile` static route registrations added to unblock homepage ES module hydration. It does not reopen Phase 303 `/home/feed` contract decisions, Phase 301–305 rendering/paging behavior, or Phase 306 shell visual conclusions.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-307r-2026-06-19` |
| Reviewer | Agent-assisted runtime/privacy review (static source + HTTP route guards + automated gates + local smoke) |
| Reviewed commit | `7f11604` |
| Scope | B-306-01 closure, static route delivery, API boundary isolation, homepage hydration, collecting/revealed privacy invariants, smoke regression guard, site-chrome route gap observation |
| Method | `git diff 09b5535..7f11604` file-scope audit; source review of `src/http/server.ts`, `scripts/smoke-public-local.mjs`, `tests/http/frontend-page.test.ts`; regression over Phase 301/303/305/307 frontend guard tests; manual `demo:public:local` spot-check; full gates + smoke |

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Review scope results

### 2.1 File scope — PASS

`git diff 09b5535..7f11604` touches **only**:

| Path | Role |
|------|------|
| `src/http/server.ts` | Register home frontend `sendPublicFile` static routes |
| `scripts/smoke-public-local.mjs` | Assert `GET /frontend/public-mvp-home.js` and `GET /frontend/home-feed.js` return 200 |
| `tests/http/frontend-page.test.ts` | HTTP tests for home scripts + transitive static imports |
| `tests/frontend/phase-307-home-frontend-module-static-route-fix.test.ts` | Phase 307 source guards |
| `tests/docs/phase-307-home-frontend-module-static-route-fix-doc.test.ts` | Phase 307 doc guards |
| `tests/frontend/phase-306-homepage-real-device-visual-review-checkpoint.test.ts` | Phase 306 historical guard reconciliation (no longer asserts missing routes) |
| `docs/www-project-phase-307-home-frontend-module-static-route-fix-v1.md` | Phase 307 implementation doc |
| `README.md` | Phase index entry |

**Not in the commit:** `public/frontend/public-mvp-home.js`, `public/frontend/home-feed.js`, `public-mvp.css`, `public/index.html`, poll routes, `/home/feed` handler, `/polls/feed`, vote/results, auth, registration, profile, DB schema, migrations.

### 2.2 B-306-01 closure — PASS

| Asset | Before Phase 307 | After Phase 307 |
|-------|------------------|-----------------|
| `GET /frontend/public-mvp-home.js` | **404** | **200** |
| `GET /frontend/home-feed.js` | **404** | **200** |

Phase 306 **B-306-01** (homepage ES module graph unreachable → skeleton stuck at `aria-busy="true"`) is **resolved for module delivery**. **FU-306-01 CLOSED.**

Manual `demo:public:local` spot-check confirms: collecting cards render, `aria-busy` clears after hydration, calm empty panel when feed is empty.

### 2.3 Static-serving-only / API boundary — PASS

- Phase 307 adds **only** explicit `GET` `sendPublicFile` branches in `src/http/server.ts` — no new API handlers, no middleware, no query parsing, no auth changes.
- `/home/feed`, `/polls/feed`, vote, results, creator, registration, login, profile, and admin routes are **untouched** in the diff.
- Static routes read files from `public/frontend/` and return `text/javascript` with existing CSP/`Cache-Control: no-store` headers — same pattern as other registered frontend modules.

Registered routes:

| Path | File |
|------|------|
| `/frontend/public-mvp-home.js` | `public/frontend/public-mvp-home.js` |
| `/frontend/home-feed.js` | `public/frontend/home-feed.js` |
| `/frontend/public-poll-card.js` | Transitive via `explore-page.js` import chain |
| `/frontend/quality-feedback-badge.js` | Transitive via `public-mvp-home.js` |
| `/frontend/public-unavailable-state.js` | Transitive via `public-mvp-home.js` |
| `/frontend/public-page-copy.js` | Transitive via `public-mvp-ui.js` (used by `home-feed.js`) |
| `/frontend/public-keyboard-focus-a11y.js` | Transitive via `public-mvp-ui.js` |

### 2.4 Homepage hydration — PASS

- `public/index.html` still loads `public-mvp-layout.js` then `public-mvp-home.js` as ES modules.
- The `public-mvp-home.js` import graph (`explore-page.js` → `formatExploreCategory`, `home-feed.js`, `quality-feedback-badge.js`, `public-unavailable-state.js`, `public-mvp-ui.js` → `public-page-copy.js` / `public-keyboard-focus-a11y.js`) is fully servable after Phase 307.
- `mountHomeSwipeFeed` runs; skeleton is replaced by feed cards or the calm empty panel.

### 2.5 Collecting / revealed privacy invariants — PASS

Phase 307 does **not** edit rendering or validator logic. Carry-forward from Phase 303-R / 305-R remains intact:

- **Collecting cards** render question-only (`收集中`, meta, hint, `回答`); no counters, percentages, ranks, or aggregate fields.
- **Revealed cards** render only display-safe bucketed summaries (`leading_option.display_label`, `display_percentage`, `total_votes_display`) plus `看完整結果`; no raw `option_id`, `option_index`, `vote_count`, or `option_text`.
- `home-feed.js` validators (`isHomeCollectingFeedItemSafe`, `isHomeRevealedFeedItemSafe`, `isHomeFeedItemSafe`, `isHomeFeedPayloadSafe`) are unchanged.

### 2.6 Raw Option Linkage Ban — PASS

- Phase 307 adds **no durable storage**, no logging, no metrics, no APM/debug/analytics payloads, and no new feed fields.
- Static file serving does not read or transmit `option_id`, vote tokens, shard IDs, or user/session/request/device/trace identifiers.
- Route handlers do not log request paths with option linkage.

### 2.7 Smoke regression guard — PASS

`scripts/smoke-public-local.mjs` now explicitly:

1. Asserts landing HTML references `/frontend/public-mvp-home.js`.
2. Fetches `GET /frontend/public-mvp-home.js` → expects **200** and `fetchHomeFeedPage` in body.
3. Fetches `GET /frontend/home-feed.js` → expects **200** and `'/home/feed'` in body.

This guard would have caught **B-306-01** before Phase 306 visual review. `tests/http/frontend-page.test.ts` mirrors the same HTTP 200 checks in the vitest HTTP suite.

### 2.8 Test / governance reconciliation — PASS

- Phase 307 adds focused HTTP + source + doc guards; Phase 307-R adds review checkpoint guards.
- Prior Phase 301/303/305/306 guard suites remain green.
- `it.skip` total remains **14** (13 Phase 301 historical home-structure skips + 1 Phase 194 pin) — unchanged.

| Guard file | Role |
|------------|------|
| `tests/frontend/phase-307r-home-frontend-module-static-route-review-checkpoint.test.ts` | Phase 307-R static source guards |
| `tests/docs/phase-307r-home-frontend-module-static-route-review-checkpoint-doc.test.ts` | Phase 307-R doc guards |

---

## 3. Findings

| # | Severity | Finding |
|---|----------|---------|
| F-1 | none (observation) | **`auth-state-copy.js`**, **`login-state-ui.js`**, and their transitive imports (`login-state-read.js`, `login-state-logout.js`) are **not** registered in `src/http/server.ts`. `public/index.html` loads `public-mvp-layout.js` (which imports the first two), but layout chrome hydration is a **separate** module graph from the home swipe client. Homepage feed hydration succeeds because `public-mvp-home.js` loads independently. |
| F-2 | none (classification) | **F-1 is not a release blocker** for the home mixed-feed MVP delivered in Phases 301–307: swipe cards, `/home/feed` consumption, and collecting/revealed privacy are unblocked. **F-1 is a separate follow-up** (`FU-307-01`) for site-chrome static route completeness — header auth-state display, logout chip, and profile-completion prompt wiring may remain degraded on pages that depend on the layout import graph until those routes are registered. A future **Phase 308** hydrated visual review should note header chrome separately from swipe-card hydration; it is **not** a Phase 307-R blocker and does not reopen B-306-01. |

No correctness, privacy, API, or hydration regression was found in the Phase 307 route patch. **No runtime change is made by this checkpoint.**

---

## 4. Conclusion

**APPROVED.** Phase 307 (`7f11604`) adds the missing `sendPublicFile` static routes so the Phase 301–305 homepage client can hydrate. **B-306-01 is closed** for module delivery; **FU-306-01 is closed**. Route additions are static-serving-only and do not alter API behavior. Collecting cards do not leak aggregates; revealed cards still show only public-safe summaries; Raw Option Linkage Ban remains intact; smoke now guards against missing home module routes. **Phase 307 is safe to build on. Phase 307-R blockers: none identified.**

Open follow-up (not a blocker): **FU-307-01** — register remaining site-chrome transitive static routes (`auth-state-copy.js`, `login-state-ui.js`, and dependencies) in a future route-only phase; re-check header auth chrome during Phase 308 hydrated visual sign-off.

---

## 5. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean |
| `npm test` | pass (2880 passed, 14 skipped) |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | pass — `/`, `/frontend/public-mvp-home.js`, `/frontend/home-feed.js`, `/home/feed`, `/polls/feed`, full public flow |

---

## 6. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
