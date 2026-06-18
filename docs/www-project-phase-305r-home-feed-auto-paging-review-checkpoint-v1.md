# WWW Project Phase 305-R — Home Feed Auto Paging Review Checkpoint v1

**Status:** frontend review checkpoint — docs + docs-test + README (+ static source guards) only. Independent review of the [Phase 305 home feed auto paging polish](./www-project-phase-305-home-feed-auto-paging-polish-v1.md) delivered in commit `5078e66`. **No runtime change** — review found no privacy, paging-safety, or interaction regression; the implementation is **APPROVED** and safe to build on.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/home/feed` contract, `/polls/feed` contract, logging, metrics, deploy, or production configuration changed by Phase 305 or by this review.**

**Reviewed commit:** `5078e66` (`origin/master`, "feat: add home feed auto paging polish").
**Baseline before Phase 305:** `f783fc4` (Phase 304 home swipe interaction / visual polish).
**Reviewed implementation doc:** `docs/www-project-phase-305-home-feed-auto-paging-polish-v1.md`.

> **Phase-number note:** Phase 305-R reviews only the conservative `IntersectionObserver` auto-paging layer added on top of the Phase 301–304 home swipe shell and Phase 303 mixed `/home/feed` consumer. It does not reopen Phase 303 backend contract decisions.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-305r-2026-06-19` |
| Reviewer | Agent-assisted frontend/privacy review (static source + automated gates + local smoke) |
| Reviewed commit | `5078e66` |
| Scope | Auto-paging guards, duplicate/infinite fetch prevention, `/home/feed` consumer safety, collecting/revealed rendering invariants, Phase 301/303/304 boundary carry-forward, fallback controls |
| Method | `git diff f783fc4..5078e66` file-scope audit; source review of `public-mvp-home.js`; regression pass over Phase 301/303/304/305 frontend guard tests; full gates + smoke |

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Review scope results

### 2.1 File scope — PASS

`git diff f783fc4..5078e66` touches **only**:

| Path | Role |
|------|------|
| `public/frontend/public-mvp-home.js` | Auto-paging helpers + `mountHomeSwipeFeed` wiring |
| `tests/frontend/phase-305-home-feed-auto-paging-polish.test.ts` | Phase 305 guards |
| `docs/www-project-phase-305-home-feed-auto-paging-polish-v1.md` | Phase 305 doc |
| `README.md` | Phase index entry |

**Not in the commit:** `src/`, `migrations/`, `home-feed.js`, `explore-page.js`, `public-mvp.css`, `public/index.html`, backend routes, DB schema, auth/vote/result modules.

### 2.2 Auto paging conservatism — PASS

- **Frontend-only.** Phase 305 adds no network surface beyond the existing `fetchHomeFeedPage` → `GET /home/feed?limit=&cursor=` call already used since Phase 303.
- **Conservative trigger.** `shouldHomeAutoLoadMore` requires all of: `next_cursor` truthy, `loading === false`, `cardCount > 0`.
- **Conservative visibility.** `createHomeAutoLoadIntersectionObserver` uses the **stage scroll root** (`#home-swipe-stage`) and requires `intersectionRatio >= HOME_SWIPE_AUTO_LOAD_INTERSECTION_THRESHOLD` (`0.55`) before firing — not merely a edge peek.
- **Observe target.** `getHomeAutoLoadObserveTarget` watches the **last** `.home-swipe-card:not(.home-swipe-card--skeleton)` only (not every card).
- **Manual fallback preserved.** `#home-swipe-load-more` (`載入更多`) remains in `public/index.html`; `updateLoadMore` visibility/disabled behavior is unchanged. If `IntersectionObserver` is missing, `createHomeAutoLoadIntersectionObserver` returns `null` and paging stays manual-only.

### 2.3 Duplicate / infinite load-more prevention — PASS

| Guard | Mechanism |
|-------|-----------|
| In-flight dedupe | `loadPage` early-returns when `loading` is already `true` |
| Observer pause | `disconnectAutoLoadObserver()` at the **start** of every `loadPage` (auto and manual) |
| Callback re-check | Intersection callback re-validates `shouldHomeAutoLoadMore` before calling `loadPage` |
| End-of-feed stop | When `next_cursor` becomes `null`, `shouldHomeAutoLoadMore` is false → `syncAutoLoadObserver` does not reattach |
| Target refresh | After each fetch settles (`finally`), observer is rebuilt against the **new** last card (prevents stale-target loops) |

No unbounded auto-fetch loop was identified: each successful page advances `next_cursor`; when exhausted, auto paging stops while the manual button hides (`updateLoadMore`).

### 2.4 `/home/feed` consumer safety — PASS

- Homepage still imports **`fetchHomeFeedPage` from `home-feed.js` only** — not `fetchExploreFeedPage`, not `/polls/feed`.
- Phase 305 does **not** edit `home-feed.js`; `isHomeCollectingFeedItemSafe`, `isHomeRevealedFeedItemSafe`, `isHomeFeedItemSafe`, and `isHomeFeedPayloadSafe` are unchanged.
- No new query params (`q`, `category`, ranking, personalization) were added to the home client.
- Smoke continues to exercise `/` and the full public flow without weakening `/home/feed` or `/polls/feed` checks from prior phases.

### 2.5 Collecting / revealed rendering — PASS

Phase 305 does not alter `renderHomeSwipeCard`, `renderHomeRevealedCard`, or `renderHomeFeedItem` logic — only mount/paging orchestration.

- **Collecting cards** remain question-only (`收集中`, meta, hint, `回答`); Phase 303/304/305 tests still reject aggregate fields on collecting items.
- **Revealed cards** still render only the display-safe bucketed summary (`leading_option.display_label`, `display_percentage`, `total_votes_display`) plus `看完整結果`; no raw counts or option linkage keys are introduced by auto paging.
- Auto paging appends cards through the same `renderHomeFeedItem` path; invalid items are still dropped (`null`) or throw on direct unsafe render.

### 2.6 Privacy / Raw Option Linkage Ban — PASS

- Phase 305 adds **no durable storage**, no logging, no metrics, no APM/debug/analytics payloads, and no new fields on feed items.
- Auto paging does not read or transmit `option_id`, `option_index`, `vote_count`, vote tokens, shard IDs, or `user_id` / `session` / `request_id` / `device` / `trace` identifiers.
- The Raw Option Linkage Ban remains intact: homepage rendering still cannot reconstruct user-option linkage from feed payloads or client-side paging state.

### 2.7 Phase 301 / 303 / 304 boundary carry-forward — PASS

| Prior phase boundary | Status after 305 |
|----------------------|------------------|
| Phase 301 swipe shell, skeleton, empty/error, `/explore` fallback | Unchanged HTML/CSS; paging layer is additive |
| Phase 303 mixed feed + validators + revealed summary rules | `home-feed.js` untouched; renderers untouched |
| Phase 304 keyboard adjacent-card nav (`handleHomeSwipeStageKeydown`) | Still wired; not removed or trapped by observer |
| Phase 304 pointer-movement whole-card click guard | Unchanged in `attachWholeCardNavigation` |
| Phase 304 reduced-motion CSS | `public-mvp.css` not edited in Phase 305; `@media (prefers-reduced-motion: reduce)` skeleton shimmer guard unchanged |
| Phase 304 focus-visible / stage `tabindex="0"` | Unchanged in Phase 305 |

### 2.8 Test / governance reconciliation — PASS

- Phase 305 adds **3** focused frontend tests (gating, observer root/threshold, `/home/feed`-only + privacy guards).
- Prior Phase 301/303/304 guard suites remain green (no regressions).
- `it.skip` total remains **14** (13 Phase 301 historical home-structure skips + 1 Phase 194 pin) — unchanged by Phase 305.

---

## 3. Findings

| # | Severity | Finding |
|---|----------|---------|
| F-1 | none (observation) | If the last card stays ≥55% visible after a page append **and** `next_cursor` remains set, a second intersection event could schedule another fetch once `loading` returns false. This is intended “read until end visible” behavior, not an infinite loop; `loading` + disconnect still prevent concurrent duplicate requests. |
| F-2 | none (observation) | **FU-305-01** (optional aria-live when auto append completes) remains open; not required for approval. |

No correctness, privacy, paging-safety, accessibility, or boundary regression was found. **No runtime change is made by this checkpoint.**

---

## 4. Conclusion

**APPROVED.** Phase 305 (`5078e66`) adds conservative, frontend-only `IntersectionObserver` auto paging on the existing `/home/feed` consumer without changing the feed contract, explore feed, backend, or rendering invariants. Duplicate in-flight fetches are prevented; end-of-feed stops auto paging; manual `載入更多` remains; collecting cards do not leak aggregates; revealed cards still show only public-safe summaries; Raw Option Linkage Ban and Phase 301/303/304 boundaries remain intact. **Phase 305 is safe to build on. Phase 305-R blockers: none identified.**

Open follow-up (not a blocker): **FU-305-01** — optional aria-live copy when auto paging appends cards.

---

## 5. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean (benign LF/CRLF warnings only) |
| `npm test` | pass (558 files, 2866 passed, 14 skipped) |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | pass (Docker available) — `/`, `/home/feed`, `/polls/feed`, full registration/login/create/vote/results flow |
