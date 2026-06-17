# WWW Project Phase 301 — Home Swipe Card Visual Shell v1

**Status:** frontend-only homepage redesign — HTML/CSS/JS + tests + docs. Reworks the public homepage `/` into an ultra-minimal, vertically swipeable pastel **poll card feed** (Shorts/Reels-style, but calm), reusing the existing freshness-only `/polls/feed` contract. Collecting-only cards; no revealed-result cards in this phase.

> **Phase-number note:** this feature track shares the number "301" with the unrelated release-documentation artifact [Phase 301 final pre-release gate checklist](./www-project-phase-301-final-pre-release-gate-checklist-v1.md). They are different tracks: that doc is a release-gate QA record; **this** doc is the home swipe card visual shell frontend redesign requested under the label "Phase 301: Home Swipe Card Visual Shell".

**No backend, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `/polls/feed` contract, logging, metrics, analytics, or deploy/production configuration changed.** This is a frontend presentation change only.

**Baseline commit:** `3c41667` (`origin/master` after Phase 302 verification handoff packet).

---

## 1. Goal

Replace the previous content-rich landing page (hero featured card, quiet list, sample poll grid, trust row, value/principle cards, account/demo note, FAQ/trust/profile link cluster, long explanatory copy) with an ultra-minimal swipeable card feed:

- Fixed/minimal top bar with brand `What We Wonder / 大家想知道` (existing site header).
- Guest access: Register / Login (existing header + home access links).
- Full-viewport vertical snap card stage; one large rounded pastel poll card per viewport.
- Persistent Create Poll affordance.
- Fallback link to `/explore` (the non-swipe list, unchanged).

## 2. Home card behavior (collecting-only)

Each card is rendered from `/polls/feed` items and shows **only**:

- question title
- calm `收集中` status pill
- existing category · freshness meta (`最近發布`)
- short hint that answers/results are hidden until reveal (`收集中 · 答案截止後才公開`)
- primary CTA `回答` → `/vote/:id`

Whole-card click also navigates to `/vote/:id`, but clicks originating from the CTA (or any interactive descendant) are ignored so focus/keyboard activation is never hijacked, and a scroll/swipe gesture never fires a click. The card is not itself focusable, so snap-scroll does not trap focus.

### Privacy invariant (collecting-only)

Home cards must never render counts, percentages, totals, ranks, trends, progress, or any hidden aggregate. This is enforced two ways:

- The card renderer reads only `poll_id`, `title`, `category`, `published_display`.
- It reuses the strict `isExploreFeedItemSafe` guard (re-exported as `isHomeSwipeFeedItemSafe`), which rejects any item carrying an aggregate or extra field or a non-`active` status. Revealed-result cards are therefore impossible in this phase.

## 3. Accessibility & motion

- Live `role="status" aria-live="polite"` region announces loading / ready / empty / error states.
- Calm loading **skeleton** card, **empty** state (with Create CTA), and **error** state (retry button + `/explore` fallback).
- A single skeleton **shimmer** animation is the only added motion; it is disabled under `@media (prefers-reduced-motion: reduce)`, which also forces `scroll-behavior: auto` on the stage.
- Non-swipe fallback link to `/explore` is always present.

## 4. Files changed

| File | Change |
|------|--------|
| `public/index.html` | Rewritten to the swipe shell (stage, status region, skeleton, load-more, empty/error panels, actions cluster). |
| `public/frontend/public-mvp-home.js` | Rewritten into the swipe-feed controller (`renderHomeSwipeCard`, `mountHomeSwipeFeed`, `isHomeSwipeFeedItemSafe`); reuses `fetchExploreFeedPage` from `explore-page.js`. |
| `public/frontend/public-mvp.css` | Added home-only `home-swipe-*` classes (macaron palette, cream backdrop, larger radius, softer shadows, skeleton, reduced-motion guard). Shared explore/result card primitives untouched. |
| `public/frontend/public-page-copy.js` | Added `PUBLIC_HOME_SWIPE_*` presentation constants. |
| `public/frontend/public-mvp-layout.js` | Added `data-auth-banner="off"` opt-out so the minimal home suppresses the onboarding banner (additive; other pages unaffected). |
| `tests/frontend/phase-301-home-swipe-card-visual-shell.test.ts` | New guard test: shell structure, collecting-only card, no-aggregate guard, `/polls/feed` reuse, no search/category, no revealed cards. |

## 5. Test reconciliation (superseded historical home)

Phase 301 intentionally supersedes the pre-301 homepage. Per the review directive:

- **Current-state guards** (`tests/http/frontend-page.test.ts`, `explore-page.test.ts`, `public-mvp-a11y.test.ts`, nav/onboarding/static-shell guards, reduced-motion guards) were **updated** to assert the new swipe shell while preserving each test's unrelated assertions.
- **Historical checkpoint / milestone / review-record tests** that only asserted the removed homepage structure (account-flow note, `syncHomePage*` runtime helpers, static sample cards) had their stale home assertions **narrowed or skipped** with an explicit Phase 301 note, leaving the records historically truthful rather than rewritten.
- Long-form boundary / account / privacy copy continues to live on the FAQ / login / registration pages.

## 6. Non-goals (unchanged boundaries)

No backend / DB / schema / migration / auth-behavior / vote / result / creator API changes; no `/polls/feed` contract change; no revealed-result cards; no aggregate display on collecting cards; no search box; no category nav/filter. `design-drafts/` is not committed.

## 7. Follow-ups

- **FU-301-01** — Revealed-result home cards require a future `/polls/feed` (or new endpoint) contract change to expose result summaries safely; out of scope here.
- **FU-301-02** — Optional auto-advance / IntersectionObserver paging could replace the explicit "載入更多" button; current button + scroll is the low-risk baseline.
- **FU-301-03** — Public search / category browsing remains unbuilt by design; if added later it should stay login-free and live on `/explore`, not the home.
