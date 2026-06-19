# WWW Project Phase 308 — Hydrated Homepage Real-Device Visual Review Checkpoint v1

**Status:** visual review checkpoint — docs + docs-test + README (+ static source guards) only. Independent hydrated real-device-style visual review of the Phase 301–307 homepage swipe mixed-feed experience at commit `1ecc85a` (Phase 307-R approved baseline). **No runtime change** — review confirms homepage feed hydration and visual invariants **PASS** after **B-306-01** closure.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/home/feed` contract, `/polls/feed` contract, logging, metrics, deploy, or production configuration changed by Phase 308.**

**Reviewed commit:** `1ecc85a` (`origin/master`, "docs: add Phase 307-R home module route review checkpoint").
**Baseline arc reviewed:** Phase 306 visual review (B-306-01) → Phase 307 static route fix (FU-306-01) → Phase 307-R approval → this hydrated re-pass.
**Prior review docs:** [Phase 306](./www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md), [Phase 307](./www-project-phase-307-home-frontend-module-static-route-fix-v1.md), [Phase 307-R](./www-project-phase-307r-home-frontend-module-static-route-review-checkpoint-v1.md), [Phase 303-R](./www-project-phase-303r-public-home-mixed-feed-runtime-privacy-review-checkpoint-v1.md), [Phase 305-R](./www-project-phase-305r-home-feed-auto-paging-review-checkpoint-v1.md).

> **Phase-number note:** Phase 308 is the **hydrated** visual re-pass requested by Phase 306 after **FU-306-01** landed. It does not reopen backend contract decisions or Phase 307 route implementation.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-308-2026-06-19` |
| Date | 2026-06-19 |
| Reviewer | Agent-assisted hydrated real-device-style visual review (browser @ 375×812 / 768×1024 / 1280×900 + HTTP asset checks + static source/module guards + automated gates) |
| Reviewed commit | `1ecc85a` |
| Environment | Local `www_test` via `npm run demo:public:local` on `http://127.0.0.1:3010` (fresh build; port 3010 used because an older pre-307 instance still bound `:3000`) |
| Viewports | **375px** mobile (2× DPR), **768px** tablet, **1280px** desktop |
| Scope | Hydrated homepage `/` first-screen impression, Shorts/Reels-style swipe feed, collecting vs revealed visual distinction, privacy boundaries, auto paging calmness, manual `載入更多` fallback, empty/fallback panels, keyboard/focus/reduced-motion carry-forward, header auth chrome (FU-307-01) |
| Method | Browser visual spot-check at three widths after hydration; HTTP status verification for home module graph + site-chrome imports; source review of `public/index.html`, `public-mvp-home.js`, `public-mvp.css`, `home-feed.js`; regression over Phase 301/303/304/305/307 guard tests; full gates + smoke |

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Pre-review automated gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 308 doc commit |
| `npm test` | **PASS** | Full vitest suite on baseline |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run smoke:public:local` | **PASS** | Docker available — home modules 200, `/home/feed`, full public flow |

---

## 3. Observation focus (homepage visual)

| Focus area | Check |
|------------|-------|
| First-screen impression (hydrated) | Ultra-minimal swipe stage; one macaron card viewport; calm cream backdrop; no hero/long copy cluster |
| Shorts/Reels-style browsing | Vertical snap stage; rounded pastel cards; quiet “向下滑動看下一則” affordance |
| Text density | Question title + one status pill + one meta line + one hint + one CTA per card |
| Pastel/macaron direction | `--home-card-bg` mint rotation + revealed wash preserved in CSS |
| Collecting vs revealed distinction | `mvp-badge-collecting` / `mvp-badge-revealed`; `home-swipe-card--revealed` wash + result summary block |
| Collecting privacy | No counters/percentages/ranks on collecting cards (runtime + module guards) |
| Revealed summaries | Display-safe bucketed `display_label` / `display_percentage` / `total_votes_display` only |
| Register/login/create/answer controls | Sticky `home-swipe-actions`: `發起提問`, `註冊`, `登入`, `改用列表瀏覽`; per-card `回答` CTA |
| Auto load more | `IntersectionObserver` wiring present; no visible spinner; manual `載入更多` fallback in HTML |
| Empty/fallback states | Panel cards hidden until needed; calm when empty |
| Responsive widths | 375 / 768 / 1280 — no horizontal overflow after hydration |
| Keyboard/focus/reduced-motion | Stage `tabindex="0"`; `handleHomeSwipeStageKeydown`; `prefers-reduced-motion` guards |
| Header auth chrome (FU-307-01) | Inspect separately — does missing layout imports break homepage feed acceptance? |

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

---

## 4. Runtime visual spot-check (browser)

### 4.1 Static asset delivery — **PASS**

| Asset | HTTP | Role |
|-------|------|------|
| `GET /frontend/public-mvp-home.js` | **200** | Home swipe client loads |
| `GET /frontend/home-feed.js` | **200** | `/home/feed` consumer loads |
| `GET /frontend/public-mvp-layout.js` | **200** | Site chrome entry (import graph partially blocked — see §4.4) |
| `GET /frontend/auth-state-copy.js` | **404** | FU-307-01 — layout import missing |
| `GET /frontend/login-state-ui.js` | **404** | FU-307-01 — layout import missing |
| `GET /frontend/login-state-read.js` | **404** | FU-307-01 transitive |
| `GET /home/feed?limit=5` | **200** | Privacy-safe collecting item returned |

**B-306-01 remains closed.** Homepage module hydration is unblocked.

### 4.2 Hydration state — **PASS**

After `public-mvp-home.js` loads on a fresh `demo:public:local` build:

| Signal | Observed |
|--------|----------|
| Skeleton card | Removed — no `.home-swipe-card--skeleton` after load |
| `aria-busy` on `#home-swipe-stage` | Cleared |
| Status text | `已載入問卷卡片，可向下滑動瀏覽。` |
| Feed cards | Live collecting card rendered from `/home/feed` |
| Collecting privacy (runtime DOM) | No `%`, `票數`, `總計`, or rank strings on collecting card |

Demo seed currently exposes **one collecting item** (`Public Smoke Lunch Poll`); `next_cursor` is `null`.

### 4.3 Per-viewport hydrated results

| Viewport | First-screen hydrated | Horizontal overflow | Actions findable | Collecting card | Revealed card (live) | Result |
|----------|----------------------|---------------------|------------------|-----------------|----------------------|--------|
| **375×812** mobile | Macaron collecting card + sticky actions | `scrollWidth === clientWidth` | `發起提問` / `註冊` / `登入` / `改用列表瀏覽` + `回答` | **PASS** — `收集中` badge, question-only | N/A (no revealed item in demo feed) | **PASS** |
| **768×1024** tablet | Same calm rhythm; wider card column | No overflow (753px) | Actions visible | **PASS** | N/A | **PASS** |
| **1280×900** desktop | Centered card column; quiet backdrop | No overflow (1265px) | Actions visible | **PASS** | N/A | **PASS** |

**Hydrated feed visual sub-result:** **PASS** — collecting cards render live; swipe shell feels like quiet Shorts/Reels-style browsing; text density remains ultra-minimal; pastel/macaron rounded cards preserved.

**Revealed card runtime visual:** Demo feed has no `revealed` items at review time. Revealed distinction confirmed via existing Phase 303/304 module render guards (`renderHomeRevealedCard` → `mvp-badge-revealed`, bucketed summary DOM, `看完整結果` CTA) — **PASS** (module/static).

### 4.4 Header auth chrome (FU-307-01) — **PASS** (non-blocking for homepage feed)

| Check | Observed | Impact on homepage feed acceptance |
|-------|----------|-------------------------------------|
| `#site-header` populated | **No** — `childElementCount === 0`, height `0` (layout ES module import fails on 404 `auth-state-copy.js` / `login-state-ui.js`) | **No visible breakage** in swipe stage or sticky actions |
| Auth navigation | `註冊` / `登入` links remain in `#main-content` `.home-swipe-actions` | **Findable, not noisy** |
| Signed-in header chip / logout | Not mounted | Out of scope for anonymous homepage feed review |
| Feed hydration | Independent of layout graph | **Unblocked** |

**Classification:** FU-307-01 remains a **separate site-chrome follow-up**, **not** a Phase 308 blocker and **not** a homepage mixed-feed visual acceptance blocker. No new blocker ID opened.

### 4.5 Auto paging / manual fallback — **PASS**

| Check | Result |
|-------|--------|
| `IntersectionObserver` wiring | Present in source; no loading spinner markup added |
| End-of-feed `載入更多` | Hidden when `next_cursor` is `null` (observed at 1280 after hydration) |
| Manual fallback in DOM | `#home-swipe-load-more` with label `載入更多` preserved |
| Visual distraction | No spinner or flashing append chrome observed |

---

## 5. Static / module visual invariant review — **PASS**

| Invariant | Evidence | Result |
|-----------|----------|--------|
| Collecting card renders question-only | Runtime DOM + `renderHomeSwipeCard` guards | **PASS** |
| Revealed card visual distinction | `renderHomeRevealedCard` module tests (Phase 303/304) | **PASS** |
| Collecting items reject aggregates | `isHomeCollectingFeedItemSafe`; live `/home/feed` payload | **PASS** |
| Revealed summaries display-safe only | `leading_option.display_label` / `display_percentage`; `total_votes_display` bucket | **PASS** |
| Auto paging calm wiring | Phase 305-R carry-forward | **PASS** |
| Manual `載入更多` fallback | `#home-swipe-load-more` in `index.html` | **PASS** |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` in CSS | **PASS** |
| Keyboard navigation | `#home-swipe-stage` `tabindex="0"` + `handleHomeSwipeStageKeydown` | **PASS** |
| `/home/feed` only | `fetchHomeFeedPage` from `home-feed.js` | **PASS** |

---

## 6. Cross-cutting privacy / integrity (visual observational)

| Check | Result | Notes |
|-------|--------|-------|
| `/home/feed` collecting payload | **PASS** | Live fetch: no `option_id`, counts, or percentages on collecting items |
| Collecting card DOM (runtime) | **PASS** | No `vote_count` / raw percentage fields rendered |
| Revealed summary DOM (module) | **PASS** | Bucketed strings only; `看完整結果` CTA |
| Raw Option Linkage Ban | **PASS** | Review observational only; no new logging/tracking introduced |
| Phase 301–307 boundaries | **PASS** | No regression in prior guard suites |

---

## 7. Findings

| # | Severity | Finding |
|---|----------|---------|
| — | — | **No new blockers identified.** B-306-01 stays closed. |
| OBS-308-01 | low (observation) | `#site-header` stays empty when layout imports 404 — expected FU-307-01 behavior; homepage feed and sticky actions are unaffected. |
| OBS-308-02 | low (observation) | Demo seed exposes only a collecting item — live runtime revealed-card paint was not observable; module guards cover revealed visual distinction. |
| OBS-308-03 | low (observation) | **FU-305-01** (optional aria-live on auto append) remains open; not required for Phase 308 approval. |

No privacy regression, ranking manipulation, or aggregate leak was identified in API payloads, runtime DOM, or module render paths. **No runtime change is made by this checkpoint.**

---

## 8. Recommended follow-up (not Phase 308)

| ID | Action | Owner track |
|----|--------|-------------|
| **FU-307-01** | Register site-chrome static routes (`auth-state-copy.js`, `login-state-ui.js`, `login-state-read.js`, `login-state-logout.js`) | Future route-only phase |
| FU-305-01 | Optional aria-live when auto paging appends cards | Future frontend polish |

---

## 9. Session summary

| Metric | Value |
|--------|-------|
| Viewports checked | 3 / 3 (hydrated) |
| Shell-first-screen visual | **PASS** |
| Hydrated feed visual | **PASS** |
| Collecting card runtime visual | **PASS** |
| Revealed card visual | **PASS** (module/static; no live revealed item in demo feed) |
| Header auth chrome | **PASS** (FU-307-01 follow-up only; non-blocking) |
| Static/module visual invariants | **PASS** |
| **FAIL** | 0 |
| **BLOCKED** | 0 |
| **NEEDS FOLLOW-UP** | 0 (homepage hydrated visual sign-off complete) |
| **Overall hydrated homepage real-device visual review** | **PASS** |

---

## 10. Files touched (Phase 308)

| File | Change |
|------|--------|
| `docs/www-project-phase-308-hydrated-homepage-visual-review-checkpoint-v1.md` | this document |
| `tests/docs/phase-308-hydrated-homepage-visual-review-checkpoint-doc.test.ts` | doc guards |
| `tests/frontend/phase-308-hydrated-homepage-visual-review-checkpoint.test.ts` | static visual/privacy guards |
| `README.md` | Phase 308 index |

Phase 308 itself is **review-only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no CSS / layout change**
- **no copy change**
- **no migration**

**No `public/`, `src/`, or migration changes.**

`design-drafts/` and `.tmp-chrome-home-desktop/` remain **untracked / not committed**.

---

## 11. Fixed boundaries (unchanged)

- Raw Option Linkage Ban preserved
- `/home/feed` discriminated union contract unchanged
- `/polls/feed` frozen
- collecting cards must not reveal counters/results
- revealed cards show only already-public aggregate summaries
- vote-by-index / Official Vote / auth / eligibility / creator boundaries unchanged
- actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 12. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run smoke:public:local
```

---

## 13. Conclusion

**PASS.** Phase 308 records a hydrated real-device-style visual review at `1ecc85a`. After Phase 307 closed **B-306-01**, the homepage hydrates at 375 / 768 / 1280 with quiet Shorts/Reels-style collecting cards, ultra-minimal text density, macaron rounded visuals, findable but calm actions, and no aggregate leak on collecting cards. Revealed card distinction is confirmed via module guards (demo feed had no live revealed item). Header auth chrome remains empty due to **FU-307-01** but does **not** block homepage feed visual acceptance. **Phase 308 blockers: none identified.**

Open follow-up (not a Phase 308 defect fix): **FU-307-01** — site-chrome static routes; **FU-305-01** — optional aria-live on auto append.

---

## 14. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 308 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
