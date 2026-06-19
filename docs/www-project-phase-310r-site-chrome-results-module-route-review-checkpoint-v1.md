# WWW Project Phase 310-R — Site Chrome and Results Module Static Route Review Checkpoint v1

**Status:** runtime/privacy review checkpoint — docs + docs-test + README (+ static source guards) only. Independent review of the [Phase 310 site chrome frontend module static route fix](./www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md) delivered in commit `be6b83a`. **No runtime change** — review found no privacy, API, hydration, or result-visibility regression; the route-only fix is **APPROVED** and closes **FU-307-01** for module delivery.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/home/feed` contract, `/polls/feed` contract, result reveal animation logic, logging, metrics, deploy, or production configuration changed by Phase 310-R.**

**Reviewed commit:** `be6b83a` (`origin/master`, "fix: serve site chrome frontend modules").
**Baseline before Phase 310:** `328becf` (Phase 309 results reveal animation).
**Reviewed implementation doc:** `docs/www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md`.
**Prior observations:** [Phase 307-R review](./www-project-phase-307r-home-frontend-module-static-route-review-checkpoint-v1.md) — **FU-307-01** (site-chrome routes missing); [Phase 308 hydrated review](./www-project-phase-308-hydrated-homepage-visual-review-checkpoint-v1.md) — header chrome empty due to layout import 404s; [Phase 309 results reveal animation](./www-project-phase-309-results-reveal-animation-v1.md) — browser verification blocked until module graph loads.

> **Phase-number note:** Phase 310-R reviews only the `sendPublicFile` static route registrations added to unblock site-chrome and `/results` ES module hydration. It does not reopen Phase 309 reveal animation logic, Phase 303 `/home/feed` contract decisions, or Phase 301–305 homepage rendering behavior.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-310r-2026-06-19` |
| Reviewer | Agent-assisted runtime/privacy review (static source + HTTP route guards + automated gates + local smoke + manual browser spot-check) |
| Reviewed commit | `be6b83a` |
| Scope | FU-307-01 closure, static route delivery, `/results` runtime module graph, API boundary isolation, homepage hydration carry-forward, Phase 309 reveal browser verifiability, collecting/cancelled/unpublished privacy invariants, smoke regression guard |
| Method | `git diff 328becf..be6b83a` file-scope audit; source review of `src/http/server.ts`, `scripts/smoke-public-local.mjs`, `tests/http/frontend-page.test.ts`; regression over Phase 307/309/310 frontend guard tests; manual browser spot-check on port **3457** (`/results/demo?ui_state=revealed`, homepage `/`); full gates + smoke |

**Manual verification note:** A background test server on port **3456** failed with `EADDRINUSE` during Phase 310 delivery. Manual browser verification was completed on port **3457** instead. This port conflict is **non-blocking** and does not affect the reviewed commit or automated gates.

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Review scope results

### 2.1 File scope — PASS

`git diff 328becf..be6b83a` touches **only**:

| Path | Role |
|------|------|
| `src/http/server.ts` | Register site-chrome + `/results` runtime `sendPublicFile` static routes |
| `scripts/smoke-public-local.mjs` | Assert site-chrome and result-page static imports return 200 |
| `tests/http/frontend-page.test.ts` | HTTP tests for site-chrome + result-page module routes |
| `tests/frontend/phase-310-site-chrome-frontend-module-static-route-fix.test.ts` | Phase 310 source guards |
| `tests/docs/phase-310-site-chrome-frontend-module-static-route-fix-doc.test.ts` | Phase 310 doc guards |
| `tests/frontend/phase-307r-home-frontend-module-static-route-review-checkpoint.test.ts` | Phase 307-R historical guard reconciliation (FU-307-01 now closed) |
| `docs/www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md` | Phase 310 implementation doc |
| `README.md` | Phase index entry |

**Not in the commit:** `public/frontend/public-mvp-layout.js`, `public/frontend/result-page.js`, `public/frontend/public-mvp.css`, `public/results.html`, poll routes, `/home/feed` handler, `/polls/feed`, `/polls/:pollId/results` API, vote, auth, registration, profile, DB schema, migrations.

### 2.2 FU-307-01 closure — PASS

| Asset | Before Phase 310 | After Phase 310 |
|-------|------------------|-----------------|
| `GET /frontend/auth-state-copy.js` | **404** | **200** |
| `GET /frontend/login-state-ui.js` | **404** | **200** |
| `GET /frontend/login-state-read.js` | **404** | **200** |
| `GET /frontend/login-state-logout.js` | **404** | **200** |

Phase 307-R observation **F-1** (site-chrome layout imports 404) is **resolved**. **FU-307-01 CLOSED.**

### 2.3 `/results` runtime module graph — PASS

Browser verification during Phase 310 found that site-chrome routes alone still left `/results/demo` stuck at「載入結果中」because `result-page.js` also requires direct static imports. Phase 310 added four additional route-only registrations:

| Path | File |
|------|------|
| `/frontend/public-results-detail-layout.js` | `public/frontend/public-results-detail-layout.js` |
| `/frontend/public-vote-detail-layout.js` | `public/frontend/public-vote-detail-layout.js` |
| `/frontend/poll-lifecycle-controls.js` | `public/frontend/poll-lifecycle-controls.js` |
| `/frontend/creator-flow-copy.js` | `public/frontend/creator-flow-copy.js` |

Manual spot-check on port **3457**: `/results/demo?ui_state=revealed` no longer remains on the static HTML「載入結果中」shell; site header hydrates; result-page runtime bootstraps; Phase 309 reveal presentation is **browser-verifiable** (aggregate reveal markers apply when demo UI state is aggregate).

### 2.4 Static-serving-only / API boundary — PASS

- Phase 310 adds **only** explicit `GET` `sendPublicFile` branches in `src/http/server.ts` — no new API handlers, no middleware, no query parsing, no auth changes.
- `/home/feed`, `/polls/feed`, `/polls/:pollId/results`, vote, creator, registration, login, profile, and admin routes are **untouched** in the diff.
- Static routes read files from `public/frontend/` and return `text/javascript` with existing CSP / `Cache-Control: no-store` headers — same pattern as Phase 307 home module routes.
- Route blocks do not invoke `pollRoutes`, `handleGetPollResults`, or any feed handlers.

### 2.5 Homepage hydration carry-forward — PASS

- Phase 310 does **not** modify Phase 307 home module routes (`public-mvp-home.js`, `home-feed.js`, transitive imports).
- `public/index.html` still loads `public-mvp-layout.js` then `public-mvp-home.js`; `mountHomeSwipeFeed` runs and home swipe client hydration remains independent of the newly registered site-chrome routes.
- Smoke still asserts home scripts return 200 and `/home/feed` payload privacy rules hold.

### 2.6 Collecting / cancelled / unpublished / aggregate privacy — PASS

Phase 310 does **not** edit rendering, validator, or result visibility logic:

- **Collecting / cancelled / unpublished** shells on `/results` remain counter-free; no new aggregate fields exposed.
- **Aggregate** (`revealed` / `locked` / `post_lock`) still shows only existing display-safe summaries inside `renderResultDisplay`; Phase 309 reveal animation is presentation-only and gated on `resolveResultRenderMode === 'aggregate'`.
- `home-feed.js` validators (`isHomeCollectingFeedItemSafe`, `isHomeRevealedFeedItemSafe`) are unchanged.

### 2.7 Raw Option Linkage Ban — PASS

- Phase 310 adds **no durable storage**, no logging, no metrics, no APM/debug/analytics payloads, and no new API or feed fields.
- Static file serving does not read or transmit `option_id`, vote tokens, shard IDs, or user/session/request/device/trace identifiers.
- Route handlers do not log request paths with option linkage.

### 2.8 Smoke / HTTP regression guard — PASS

`scripts/smoke-public-local.mjs` now explicitly after the results HTML check:

1. Fetches all four site-chrome modules → expects **200** and ES module `export` tokens.
2. Fetches all four result-page runtime modules → expects **200** and ES module `export` tokens.

`tests/http/frontend-page.test.ts` mirrors site-chrome and result-page module HTTP 200 checks. Phase 310 source guards lock route registration in `server.ts`. Together these guards would catch missing homepage, site-chrome, or `/results` module routes going forward.

### 2.9 Test / governance reconciliation — PASS

- Phase 310 adds focused HTTP + source + doc guards; Phase 310-R adds review checkpoint guards.
- Prior Phase 307/308/309 guard suites remain green.
- `it.skip` total remains **14** (13 Phase 301 historical home-structure skips + 1 Phase 194 pin) — unchanged.

| Guard file | Role |
|------------|------|
| `tests/frontend/phase-310r-site-chrome-results-module-route-review-checkpoint.test.ts` | Phase 310-R static source guards |
| `tests/docs/phase-310r-site-chrome-results-module-route-review-checkpoint-doc.test.ts` | Phase 310-R doc guards |

---

## 3. Findings

| # | Severity | Finding |
|---|----------|---------|
| F-1 | none (resolved) | Phase 307-R **F-1** (site-chrome modules 404) — **closed by Phase 310**. Header auth chrome and layout imports now resolve on pages loading `public-mvp-layout.js`. |
| F-2 | none (observation) | Phase 310 required four **additional** result-page static routes beyond the original FU-307-01 four-pack. This was discovered during browser verification, not spec drift; all eight additions remain `sendPublicFile`-only. |
| F-3 | none (observation) | Port **3456** test-server `EADDRINUSE` during Phase 310 delivery — manual verification on port **3457** is acceptable and non-blocking. |

No correctness, privacy, API, hydration, or result-visibility regression was found in the Phase 310 route patch. **No runtime change is made by this checkpoint.**

---

## 4. Conclusion

**APPROVED.** Phase 310 (`be6b83a`) adds the missing `sendPublicFile` static routes so site-chrome and `/results` ES module graphs can load. **FU-307-01 is closed** for module delivery. Route additions are static-serving-only and do not alter API behavior, auth behavior, result visibility, or aggregate data shape. Collecting/cancelled/unpublished states still hide counters; aggregate states still show only public-safe summaries; homepage hydration remains intact; Phase 309 reveal animation is browser-verifiable; Raw Option Linkage Ban remains intact; smoke and HTTP tests guard against missing module routes. **Phase 310 is safe to build on. Phase 310-R blockers: none identified.**

---

## 5. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean |
| `npm test` | pass (2908+ passed, 14 skipped) |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | pass — `/`, home modules, site-chrome modules, result-page modules, `/home/feed`, `/polls/feed`, full public flow |

---

## 6. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
