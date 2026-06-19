# WWW Project Phase 311 — Results Reveal Animation Browser Visual Review Checkpoint v1

**Status:** visual review checkpoint — docs + docs-test + README (+ static source guards) only. Independent browser visual review of the [Phase 309 results reveal animation](./www-project-phase-309-results-reveal-animation-v1.md) (FU-304-02) after [Phase 310](./www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md) / [Phase 310-R](./www-project-phase-310r-site-chrome-results-module-route-review-checkpoint-v1.md) unblocked `/results` ES module delivery. **No runtime change** — review confirms FU-304-02 presentation behavior is **APPROVED** for build-on; one demo-preview follow-up noted (OBS-311-01).

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/home/feed` contract, `/polls/feed` contract, logging, metrics, deploy, or production configuration changed by Phase 311.**

**Reviewed commit:** `d624bb2` (`origin/master`, Phase 310-R review checkpoint).
**Implementation under review:** Phase 309 FU-304-02 (`328becf` — results reveal animation) with Phase 310 module-route prerequisites.
**Prior docs:** [Phase 309](./www-project-phase-309-results-reveal-animation-v1.md), [Phase 310](./www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md), [Phase 310-R](./www-project-phase-310r-site-chrome-results-module-route-review-checkpoint-v1.md).

> **Phase-number note:** Phase 311 is a browser visual re-pass for FU-304-02 only. It does not reopen result visibility rules, aggregate API shape, or Phase 310 static-route implementation.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-311-2026-06-19` |
| Date | 2026-06-19 |
| Reviewer | Agent-assisted browser visual review (browser @ 375×812 / 768×1024 / 1280×900 + reduced-motion emulation + static source/module guards + automated gates) |
| Reviewed commit | `d624bb2` |
| Environment | Local `www_test` via `npm run demo:public:local` on `http://127.0.0.1:3012` (fresh build; ports `:3000` / `:3011` held older pre-310 instances) |
| Viewports | **375px** mobile (2× DPR), **768px** tablet, **1280px** desktop |
| Scope | `/results/demo` runtime hydration, aggregate reveal presentation (FU-304-02), collecting/cancelled/unpublished demo states, reduced-motion, layout shift, keyboard/focus carry-forward, homepage hydration carry-forward |
| Method | Browser spot-check at three widths; demo state switches via `?ui_state=`; HTTP module 200 checks on Phase 310 routes; source review of `result-page.js`, `public-mvp.css`, `policy-ui-placeholders.js`; regression over Phase 309/310 guard tests; full gates + smoke |

**Port note:** Phase 310 delivery documented port **3456** `EADDRINUSE`; manual verification on **3457** was acceptable and non-blocking. Phase 311 used port **3012** on a fresh `demo:public:local` build at commit `d624bb2`.

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Pre-review automated gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 311 doc commit |
| `npm test` | **PASS** | Full vitest suite on baseline |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run smoke:public:local` | **PASS** | Site-chrome + result-page modules 200; full public flow |

---

## 3. Observation focus (results reveal visual)

| Focus area | Check |
|------------|-------|
| Runtime hydration | `/results/demo` no longer stuck at「載入結果中」after Phase 310 routes |
| Aggregate reveal calmness | CSS-only opacity + 6px translate; 520ms ease-out; staggered option delays |
| No live-counting implication | Animation gated on existing aggregate render only; no counter animation from hidden values |
| Collecting privacy | Collecting shell shows label-only options; no `.result-option-percent` elements |
| Cancelled / unpublished | Terminal shells; no reveal markers; no counter DOM |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables reveal animations |
| Layout shift | Keyframes use opacity/translate only — no width/height animation |
| Keyboard / focus | `.skip-link` present; site header hydrates; nav links reachable |
| Static HTML fallback | `results.html` retains「載入結果中」shell when JS unavailable — acceptable |
| Homepage carry-forward | `/` hydrates after Phase 310 — skeleton clears, feed cards render |

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

---

## 4. Runtime visual spot-check (browser)

### 4.1 Module delivery prerequisite — **PASS**

On fresh `demo:public:local` at `:3012`, all Phase 310 module routes return **200**. `#result-display` clears「載入結果中」; `#site-header` hydrates (`childElementCount > 0`). **Phase 310 prerequisite satisfied.**

### 4.2 `/results/demo?ui_state=revealed` — **PASS** (runtime) · **NEEDS FOLLOW-UP** (aggregate reveal markers on demo URL)

| Signal | Observed |
|--------|----------|
| Loading shell | Cleared — not stuck at「載入結果中」 |
| Site chrome | Header nav + auth copy banners render |
| `#result-display` DOM | Collecting shell (`結果尚未公開`) + label-only options + separate `ui-mock-state-panel` for「結果已公開」 |
| `.result-option-percent` | **0** — no numeric percentage DOM in `#result-display` |
| `results-aggregate-reveal` class | **Absent** on demo URL at runtime |
| `data-results-reveal-ready` | **Absent** on demo URL at runtime |

**Root cause (OBS-311-01):** `getDemoCollectingResultPayload()` seeds `public_lifecycle_state: 'collecting'`. `toRevealedPreviewPayload()` spreads that field unchanged, so `resolveResultRenderMode()` stays `collecting` even when `?ui_state=revealed`. The page correctly renders collecting privacy UI and a separate mock policy panel, but **does not enter aggregate render mode** in the browser for the demo URL alone.

**FU-304-02 implementation correctness:** **PASS** via Phase 309 module tests — `syncResultsAggregateRevealPresentation` / `renderResultDisplay` with `public_lifecycle_state: 'revealed'` applies `results-aggregate-reveal` + `data-results-reveal-ready='true'`. CSS `@keyframes results-aggregate-reveal-in` confirmed (opacity + translateY only).

### 4.3 Demo terminal / collecting states — **PASS**

| URL | `#result-display` | Reveal markers | Counter DOM |
|-----|-------------------|----------------|-------------|
| `?ui_state=collecting` (default demo) | Collecting shell | None | None |
| `?ui_state=cancelled` |「問卷已取消」unavailable shell | None | None |
| `?ui_state=unpublished` | Unpublished shell (module guard parity) | None | None |
| `?ui_state=locked` | Collecting shell + locked mock panel | None | None |

Collecting/cancelled/unpublished do **not** receive reveal-ready presentation. Privacy copy explicitly states counters hidden.

### 4.4 Per-viewport results page layout — **PASS**

| Viewport | Runtime loads | Horizontal overflow | Skip link | Result |
|----------|---------------|---------------------|-----------|--------|
| **375×812** mobile | Yes | `scrollWidth === clientWidth` | Present | **PASS** |
| **768×1024** tablet | Yes | No overflow | Present | **PASS** |
| **1280×900** desktop | Yes | No overflow | Present | **PASS** |

### 4.5 Reduced-motion — **PASS**

With `prefers-reduced-motion: reduce` emulated, a `#result-display.results-aggregate-reveal[data-results-reveal-ready='true']` test node computes `animationName: none` / `animationDuration: 0s`. CSS guard at Phase 309 disables motion without JS timers.

### 4.6 Homepage hydration carry-forward — **PASS**

After navigating to `/` on the same `:3012` demo build:

| Signal | Observed |
|--------|----------|
| Status text | `已載入問卷卡片，可向下滑動瀏覽。` |
| Skeleton | Removed |
| Feed cards | **3** live collecting cards |
| Phase 310 home routes | Unaffected — hydration intact |

---

## 5. Findings

| # | Severity | Finding |
|---|----------|---------|
| F-1 | none (resolved) | Phase 310 closed ES module 404 blockers — `/results` runtime and site chrome hydrate in browser. |
| F-2 | none (observation) | **OBS-311-01:** Demo `?ui_state=revealed|locked|post_lock` mock payloads inherit `public_lifecycle_state: 'collecting'`, so browser runtime on `/results/demo` does not mount aggregate reveal markers. FU-304-02 code path is verified by Phase 309 module tests; demo preview lifecycle alignment is a **separate follow-up** (not a Phase 311 blocker). |
| F-3 | none (observation) | Older servers on ports `:3000` / `:3011` without Phase 310 routes still 404 site-chrome modules — use fresh `demo:public:local` build (Phase 311 used `:3012`). |

No privacy, API, result-visibility, or homepage regression found. **No runtime change is made by this checkpoint.**

---

## 6. Conclusion

**APPROVED.** Phase 309 FU-304-02 reveal presentation is correct and privacy-safe: aggregate-only gating, collecting/cancelled/unpublished counter-free, reduced-motion CSS disable, opacity/translate-only animation, and static HTML fallback preserved. Phase 310 module delivery unblocks browser inspection of `/results/demo`; runtime no longer stalls on「載入結果中」. Homepage hydration carry-forward **PASS**. **Phase 311 blockers: none identified.**

Open follow-up (not a blocker): **OBS-311-01** — align demo `toRevealedPreviewPayload()` lifecycle fields so `/results/demo?ui_state=revealed` enters aggregate render mode in browser for full motion visual sign-off.

---

## 7. Files changed (Phase 311 checkpoint only)

| File | Change |
|------|--------|
| `docs/www-project-phase-311-results-reveal-animation-browser-visual-review-checkpoint-v1.md` | Phase 311 browser visual review doc |
| `tests/frontend/phase-311-results-reveal-animation-browser-visual-review-checkpoint.test.ts` | Phase 311 static guards |
| `tests/docs/phase-311-results-reveal-animation-browser-visual-review-checkpoint-doc.test.ts` | Phase 311 doc guards |
| `README.md` | Phase 311 index |

---

## 8. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean |
| `npm test` | pass (2917+ passed, 14 skipped) |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | pass |

---

## 9. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
