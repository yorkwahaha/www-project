# WWW Project Phase 301-R — Home Swipe Card Visual Shell Runtime Review Checkpoint v1

**Status:** runtime review checkpoint / docs + docs-test + README only. Independent review of the completed [Phase 301 home swipe card visual shell](./www-project-phase-301-home-swipe-card-visual-shell-v1.md) as delivered in commit `57f023e`. **No runtime change** — review found no regression; the implementation is **APPROVED**.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `/polls/feed` contract, logging, metrics, analytics, deploy, or production configuration changed by Phase 301 or by this review.**

**Reviewed commit:** `57f023e` (`origin/master`, "Phase 301: Home Swipe Card Visual Shell (frontend-only)").
**Baseline before Phase 301:** `3c41667`.
**Reviewed Phase 301 delivery doc:** `docs/www-project-phase-301-home-swipe-card-visual-shell-v1.md`.

> **Phase-number note:** "301" is shared with the unrelated release-documentation artifact [Phase 301 final pre-release gate checklist](./www-project-phase-301-final-pre-release-gate-checklist-v1.md). This 301-R checkpoint reviews the **home swipe card visual shell** frontend feature track only.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-301r-2026-06-18` |
| Date | 2026-06-18 |
| Reviewer | Agent-assisted runtime review (static source + existing automated gates + local smoke) |
| Reviewed commit | `57f023e` |
| Scope | Homepage `/` swipe shell structure, privacy/data boundaries, `public-mvp-home.js`, `public-mvp.css`, test reconciliation, smoke update, stash boundary |
| Method | Source review of `public/index.html`, `public/frontend/public-mvp-home.js`, `public/frontend/public-mvp.css`, `public/frontend/public-page-copy.js`, `public/frontend/public-mvp-layout.js`, `scripts/smoke-public-local.mjs`; commit file-scope audit; skip-list audit; full gates + smoke |

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Review focus results

### 2.1 Homepage `/` is the intended ultra-minimal swipe shell — PASS

- `public/index.html` is a single `<main class="mvp-page home-swipe" data-auth-banner="off" data-home-swipe-feed="collecting-only">` containing: sr-only `<h1>`, a live `role="status" aria-live="polite"` region (`#home-swipe-status`), the vertical snap stage (`#home-swipe-stage`) with a single calm skeleton card, a `載入更多` button, empty (`#home-swipe-empty`) and error (`#home-swipe-error`) panels, and a sticky actions cluster (`發起提問` Create CTA + register/login + `改用列表瀏覽` `/explore` fallback).
- The brand / auth top area is the existing shared site header (brand `大家想知道`, guest Register/Login + auth chip), unchanged.
- Removed from the home body and **not present** in `index.html`: hero featured card, quiet list, sample poll grid (`data-static-examples`), trust row, value/principle grid (`mvp-value-grid`), account/demo note (`home-account-flow-note`), FAQ/trust/profile link cluster (`mvp-preview-links`), and long explanatory copy. Confirmed by negative assertions in the Phase 301 guard test.

### 2.2 Privacy and data boundaries — PASS

- Commit file-scope audit: only `public/` (5), `scripts/` (1), `tests/` (33), `docs/` (1), `README.md` changed. **No `src/`, `migrations/`, or `dist/` change** → no backend/API/DB/schema/migration change.
- `/polls/feed` contract unchanged: the home reuses `fetchExploreFeedPage` (limit + cursor only); no new params, no `/polls/search`.
- No revealed-result cards: the feed guard forces `status === 'active'`, so only collecting items render.
- Collecting cards render only `poll_id`, `title`, `category`, `published_display`. A source scan for `vote_count|percentage|option_id|百分比|票數|排名|趨勢|進度|總計|aggregate|rank|total` in `public-mvp-home.js` / `index.html` matches **only the forbidding JSDoc comment text**, never a rendered field.
- No search box and no category nav/filter were added. Category remains **display-only** meta (`分類 · 最近發布`), consistent with explore.

### 2.3 `public/frontend/public-mvp-home.js` — PASS

- `isHomeSwipeFeedItemSafe = isExploreFeedItemSafe` is a **pure re-export** of the strict freshness-only feed guard; it does not relax any field/status check. `renderHomeSwipeCard` re-validates with `isExploreFeedItemSafe(poll)` and **throws** on an unsafe item, so an accidental aggregate/extra field can never reach the DOM.
- `fetchExploreFeedPage` reuse does **not** weaken explore safety: it is the same exported function (same `credentials: 'omit'`, same `isExploreFeedPayloadSafe` validation). Importing `explore-page.js` triggers its `mountExplorePage` side-effect, which returns early on `/` (no `#explore-feed-list`) — benign no-op.
- Whole-card click does **not** hijack CTA / keyboard / swipe: the listener ignores any event whose target `.closest('a, button')` is set (so the `回答` link and any interactive descendant own their own activation), and only a genuine tap/click — never a scroll/swipe gesture — triggers `location.assign`. The card is not itself focusable, so the snap stage does not trap focus; keyboard users tab through the card CTAs. The listener is attached only when `typeof article.addEventListener === 'function'`.
- Loading / empty / error states are minimal and safe: fixed `PUBLIC_HOME_SWIPE_*` copy, a live status region, a retry button that re-fetches, and an `/explore` fallback; no backend payload is echoed into any state.

### 2.4 `public/frontend/public-mvp.css` — PASS

- All new rules are home-only `home-swipe-*` classes (plus a `body.mvp-body:has(.home-swipe)` cream-backdrop rule scoped to the home). Shared `mvp-poll-card*` / explore / results primitives are **not** mutated; `mvp-badge-collecting` is reused read-only.
- Reduced-motion is covered: the only added motion is the `@keyframes home-swipe-shimmer` loading skeleton, disabled under `@media (prefers-reduced-motion: reduce)`, which also forces `scroll-behavior: auto` on the stage. The Phase 253 reduced-motion block was relocated after the Phase 301 block so its "no base-level motion before this marker" guards stay meaningful (verified by phase-252/253/254).
- Mobile/desktop layout remains usable: the stage uses `scroll-snap-type: y mandatory` with a viewport-bounded `max-height`; the `@media (max-width: 640px)` block enlarges cards and makes the CTA full-width; the actions cluster is sticky with safe-area padding.

### 2.5 Test reconciliation — PASS

- **13 skipped tests**, all stale historical home-structure assertions about removed features (account-flow note, `syncHomePage*` onboarding/copy-sync helpers, static sample section): in `phase-160`, `phase-223`, `phase-224`, `phase-227`, `phase-261`, `phase-262` (×4), `phase-263` (×4). Each carries an explicit Phase 301 supersession note.
- **No** privacy / auth / vote / result / `quality_badge` / Official-Vote / vote-by-index guard was skipped. Current-state guards (`tests/http/frontend-page.test.ts`, `explore-page.test.ts`, `public-mvp-a11y.test.ts`, nav/onboarding/static-shell/reduced-motion guards) remain **active** and were updated to assert the new shell while preserving their unrelated assertions.
- New active guard `tests/frontend/phase-301-home-swipe-card-visual-shell.test.ts` asserts shell structure, the collecting-only card, the no-aggregate guard, `/polls/feed` reuse, and the no-search/no-category/no-revealed posture.
- Historical records remain historically truthful (assertions narrowed/skipped with notes, not rewritten to claim they always described the swipe shell).

### 2.6 Smoke update — PASS

- `scripts/smoke-public-local.mjs` updates **only** the `GET /` landing-page assertion block to require the Phase 301 swipe-shell markers (`data-home-swipe-feed="collecting-only"`, `#home-swipe-stage`, absence of `data-static-examples`) plus the `/polls/new`, `/explore`, `/registration`, `/login` links and the shared stylesheet. The rest of the public flow (registration → login → `/polls/new` → `/creator/polls` → vote-by-index → results, display-safe assertions) is **unchanged** and still passes end-to-end.

### 2.7 Stash boundary — PASS

- `stash@{0}` (`phase-301-superseded-spotlight-curiosity-home-draft`) is **intact and was not popped or reused**.
- No superseded spotlight/curiosity content entered Phase 301: `index.html` contains no `mvp-featured-question`, `mvp-quiet-list`, `mvp-result-preview`, `約 63%`, or `共 1,284 人` markers (verified by the Phase 301 guard test's negative assertions). `design-drafts/` and `.tmp-chrome-home-desktop/` remain **untracked / not committed**.

---

## 3. Findings

| # | Severity | Finding |
|---|----------|---------|
| F-1 | none (observation) | Importing `explore-page.js` runs its `mountExplorePage` side-effect on `/`; it returns early (no explore DOM on the home) — benign, no action needed. |
| F-2 | none (observation) | Home cards are not themselves focusable; keyboard navigation flows through the per-card `回答` CTA links, and the scroll container is not a focus trap — acceptable and intended. |

No correctness, privacy, accessibility, or boundary regression was found. **No runtime change is made by this checkpoint.**

---

## 4. Conclusion

**APPROVED.** Phase 301 (`57f023e`) delivers the intended ultra-minimal collecting-only swipe card homepage within all stated boundaries. Review-only; docs + docs-test + README index. **Phase 301-R blockers: none identified.**

Open follow-ups (carried from Phase 301, not blockers):

- **FU-301-01** — revealed-result home cards require a future `/polls/feed` (or new endpoint) contract change.
- **FU-301-02** — optional IntersectionObserver auto-paging could replace the explicit `載入更多` button.
- **FU-301-03** — public search/category remains unbuilt by design; if added, keep it login-free on `/explore`.

---

## 5. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean (only benign LF/CRLF warnings) |
| `npm test` | pass (550 files, 2830 passed, 13 skipped) |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | pass (Docker available; `/` swipe shell + full registration/login/create/vote/results flow) |
