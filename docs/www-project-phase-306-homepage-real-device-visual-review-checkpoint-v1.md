# WWW Project Phase 306 — Homepage Real-Device Visual Review Checkpoint v1

**Status:** visual review checkpoint — docs + docs-test + README (+ static source guards) only. Independent real-device-style visual review of the Phase 301–305 homepage swipe mixed-feed experience at commit `510d8e7` (Phase 305-R approved baseline). **No runtime change** — review documents one **BLOCKER** that prevents full hydrated feed visual sign-off; shell-first-screen and static/module visual invariants **PASS**.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/home/feed` contract, `/polls/feed` contract, logging, metrics, deploy, or production configuration changed by Phase 306.**

**Reviewed commit:** `510d8e7` (`origin/master`, "docs: add Phase 305-R home feed auto paging review checkpoint").
**Baseline arc reviewed:** Phase 301 home swipe shell → Phase 303 mixed `/home/feed` → Phase 304 visual/interaction polish → Phase 305 auto paging → Phase 305-R approval.
**Prior review docs:** [Phase 301-R](./www-project-phase-301r-home-swipe-card-visual-shell-runtime-review-checkpoint-v1.md), [Phase 303-R](./www-project-phase-303r-public-home-mixed-feed-runtime-privacy-review-checkpoint-v1.md), [Phase 305-R](./www-project-phase-305r-home-feed-auto-paging-review-checkpoint-v1.md).

> **Phase-number note:** Phase 306 is a **visual** checkpoint distinct from Phase 305-R (paging-safety/code review). It exercises local `demo:public:local` in browser emulation at mobile/tablet/desktop widths plus static source/module render guards. It does not reopen backend contract decisions.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-306-2026-06-19` |
| Date | 2026-06-19 |
| Reviewer | Agent-assisted real-device-style visual review (browser @ 375×812 / 768×1024 / 1280×900 + static source + module render guards + automated gates) |
| Reviewed commit | `510d8e7` |
| Environment | Local `www_test` via `npm run demo:public:local`; `http://127.0.0.1:3000` |
| Viewports | **375px** mobile (2× DPR), **768px** tablet, **1280px** desktop |
| Scope | Homepage `/` first-screen impression, Shorts/Reels-style swipe shell, collecting vs revealed visual distinction (static/module), privacy boundaries, auto paging affordance, empty/fallback calmness, keyboard/focus/reduced-motion carry-forward |
| Method | Browser visual spot-check at three widths; `curl` static asset verification; source review of `public/index.html`, `public/frontend/public-mvp-home.js`, `public/frontend/public-mvp.css`, `public/frontend/home-feed.js`, `src/http/server.ts`; regression over Phase 301/303/304/305 frontend guard tests; full gates + smoke |

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Pre-review automated gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 306 doc commit |
| `npm test` | **PASS** | Full vitest suite on baseline |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run smoke:public:local` | **PASS** | Docker available — `/`, `/home/feed`, `/polls/feed`, full public flow |

---

## 3. Observation focus (homepage visual)

| Focus area | Check |
|------------|-------|
| First-screen impression | Ultra-minimal swipe stage; one card viewport; calm cream backdrop; no hero/long copy cluster |
| Shorts/Reels-style browsing | Vertical snap stage; rounded macaron cards; quiet “next card” affordance |
| Text density | Question title + one status pill + one meta line + one hint + one CTA per card (module render) |
| Pastel/macaron direction | `--home-card-bg` rotation + revealed wash preserved in CSS |
| Collecting vs revealed distinction | `mvp-badge-collecting` / `mvp-badge-revealed`; `home-swipe-card--revealed` wash + result summary block |
| Collecting privacy | No counters/percentages/ranks on collecting cards (module + source guards) |
| Revealed summaries | Display-safe bucketed `display_label` / `display_percentage` / `total_votes_display` only |
| Register/login/create/answer controls | Sticky `home-swipe-actions`: `發起提問`, `註冊`, `登入`, `改用列表瀏覽`; per-card `回答` CTA (module) |
| Auto load more | `IntersectionObserver` wiring present; no visible spinner; manual `載入更多` fallback in HTML |
| Empty/fallback states | Panel cards share card-system classes; hidden until needed |
| Responsive widths | 375 / 768 / 1280 — no horizontal overflow on shell |
| Keyboard/focus/reduced-motion | Stage `tabindex="0"`; `handleHomeSwipeStageKeydown`; `prefers-reduced-motion` guards shimmer/scroll |

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

---

## 4. Runtime visual spot-check (browser)

### 4.1 Static asset delivery — **BLOCKER**

| Asset | HTTP | Impact |
|-------|------|--------|
| `GET /frontend/public-mvp-layout.js` | **200** | Site chrome loads |
| `GET /frontend/public-mvp-home.js` | **404** | Home feed mount never runs |
| `GET /frontend/home-feed.js` | **404** | `/home/feed` consumer unreachable from browser |
| `GET /home/feed?limit=5` | **200** | API returns valid collecting item (privacy-safe) |

`src/http/server.ts` enumerates many `/frontend/*.js` paths but **does not register** `public-mvp-home.js` or `home-feed.js`. After Phase 301 moved body content to JS-only rendering, the live page remains on the static skeleton shimmer (`aria-busy="true"`, status “載入問卷卡片中，請稍候。”) indefinitely.

**Finding ID:** **B-306-01** (blocker).

### 4.2 Per-viewport shell results (hydration blocked)

| Viewport | First-screen shell | Horizontal overflow | Actions findable | Feed cards hydrated | Result |
|----------|-------------------|---------------------|------------------|---------------------|--------|
| **375×812** mobile | Pastel skeleton card + sticky actions | `scrollWidth === clientWidth` (375) | `發起提問` / `註冊` / `登入` / `改用列表瀏覽` visible | **No** — stuck on skeleton | **BLOCKED** (hydration) |
| **768×1024** tablet | Same calm shell; wider card rhythm | No overflow (753px content width) | Actions visible | **No** | **BLOCKED** (hydration) |
| **1280×900** desktop | Same; centered card column | No overflow | Actions visible | **No** | **BLOCKED** (hydration) |

**Shell-only sub-result (ignoring hydration):** **PASS** — first-screen impression is ultra-minimal, macaron-rounded, and quiet; CTAs are findable but not noisy; `載入更多` is present in DOM (hidden while skeleton persists).

**Hydrated feed visual sub-result:** **BLOCKED** by B-306-01 — cannot observe live collecting/revealed cards, swipe snap between real items, or auto paging append in the browser.

---

## 5. Static / module visual invariant review — **PASS**

Where runtime hydration is blocked, Phase 306 relies on existing Phase 301/303/304/305 guard tests and source review:

| Invariant | Evidence | Result |
|-----------|----------|--------|
| Collecting card renders question-only | `renderHomeSwipeCard` → `mvp-badge-collecting`, `收集中`, hint, `回答`; no result DOM | **PASS** |
| Revealed card visual distinction | `home-swipe-card--revealed`, `mvp-badge-revealed`, `home-swipe-card-result-*` bucketed summary | **PASS** |
| Collecting items reject aggregates | `isHomeCollectingFeedItemSafe` exact-key-set; Phase 303/304/305 tests | **PASS** |
| Revealed summaries display-safe only | `leading_option.display_label` / `display_percentage`; `total_votes_display` bucket | **PASS** |
| Auto paging calm wiring | `syncAutoLoadObserver` / `disconnectAutoLoadObserver`; no loading spinner markup added | **PASS** |
| Manual `載入更多` fallback | `#home-swipe-load-more` in `index.html` | **PASS** |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables shimmer + smooth scroll on stage | **PASS** |
| Keyboard navigation | `#home-swipe-stage` `tabindex="0"` + `handleHomeSwipeStageKeydown` | **PASS** |
| `/home/feed` only | `fetchHomeFeedPage` from `home-feed.js`; no explore/search coupling | **PASS** |

---

## 6. Cross-cutting privacy / integrity (visual observational)

| Check | Result | Notes |
|-------|--------|-------|
| `/home/feed` collecting payload | **PASS** | Smoke + live fetch: no `option_id`, counts, or percentages on collecting items |
| Collecting card DOM (module) | **PASS** | No `vote_count` / raw percentage fields rendered |
| Revealed summary DOM (module) | **PASS** | Bucketed strings only; `看完整結果` CTA |
| Raw Option Linkage Ban | **PASS** | Review observational only; no new logging/tracking introduced |
| Phase 301–305 boundaries | **PASS** | No regression in prior guard suites |

---

## 7. Findings

| # | Severity | Finding |
|---|----------|---------|
| **B-306-01** | **blocker** | `GET /frontend/public-mvp-home.js` and `GET /frontend/home-feed.js` return **404** — `server.ts` lacks static routes. Homepage cannot hydrate feed cards; visual review of collecting/revealed/swipe/auto-paging **blocked** at runtime. **Requires a future numbered runtime phase** (add `sendPublicFile` routes only — out of Phase 306 scope). |
| OBS-306-01 | low (observation) | Shell skeleton + sticky actions still match Phase 304 macaron direction even while hydration is blocked. |
| OBS-306-02 | low (observation) | **FU-305-01** (optional aria-live on auto append) remains open; not evaluable until B-306-01 is resolved. |

No privacy regression, ranking manipulation, or aggregate leak was identified in API payloads or module render paths. **No runtime change is made by this checkpoint.**

---

## 8. Recommended follow-up (not Phase 306)

| ID | Action | Owner track |
|----|--------|-------------|
| **FU-306-01** | Add `GET /frontend/public-mvp-home.js` and `GET /frontend/home-feed.js` routes to `src/http/server.ts` (+ HTTP guard test); re-run Phase 306 hydrated visual pass | Future runtime phase |
| FU-305-01 | Optional aria-live when auto paging appends cards | Future frontend polish |

---

## 9. Session summary

| Metric | Value |
|--------|-------|
| Viewports checked | 3 / 3 (shell) |
| Shell-first-screen visual | **PASS** |
| Hydrated feed visual | **BLOCKED** (B-306-01) |
| Static/module visual invariants | **PASS** |
| **FAIL** | 0 |
| **BLOCKED** | 1 (B-306-01) |
| **NEEDS FOLLOW-UP** | 1 (full hydrated sign-off after FU-306-01) |
| **Overall homepage real-device visual review** | **NEEDS FOLLOW-UP** |

---

## 10. Files touched (Phase 306)

| File | Change |
|------|--------|
| `docs/www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md` | this document |
| `tests/docs/phase-306-homepage-real-device-visual-review-checkpoint-doc.test.ts` | doc guards |
| `tests/frontend/phase-306-homepage-real-device-visual-review-checkpoint.test.ts` | static visual/privacy guards |
| `README.md` | Phase 306 index |

Phase 306 itself is **review-only**:

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

**NEEDS FOLLOW-UP.** Phase 306 records a real-device-style visual review at `510d8e7`. Shell-first-screen impression at 375 / 768 / 1280 **PASS**es the ultra-minimal macaron swipe direction; static/module guards confirm collecting vs revealed visual distinction and privacy invariants **PASS**. Runtime hydrated feed visual review is **BLOCKED** by **B-306-01** (missing static JS routes for `public-mvp-home.js` and `home-feed.js`). **FU-306-01** must land in a future runtime phase before full homepage visual sign-off.

**Phase 306 blockers for full hydrated visual approval: B-306-01.**

Open follow-up (not a Phase 306 defect fix): **FU-306-01** — register home frontend modules in `server.ts`; **FU-305-01** — optional aria-live on auto append.

---

## 14. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 306 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
