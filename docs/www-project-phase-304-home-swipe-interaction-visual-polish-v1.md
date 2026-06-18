# WWW Project Phase 304 — Home Swipe Interaction / Visual Polish v1

**Status:** frontend-only homepage polish — HTML/CSS/JS + tests + docs. Refines the Phase 301–303 mixed `/home/feed` swipe experience (visual rhythm, snap feel, keyboard navigation, panel states). No backend, API, DB, or privacy-behavior change.

**Baseline commit:** `8f85b56` (Phase 303-R approved).

**No backend, API, DB, schema, migration, `/home/feed` contract, `/polls/feed`, auth, vote, result, eligibility, logging, metrics, or deploy configuration changed.**

---

## 1. Goal

Polish the public homepage `/` swipe shell after Phase 303 mixed feed:

- Softer macaron pastel cards with clearer collecting vs revealed distinction.
- Question titles readable but smaller than a landing hero.
- Improved vertical snap rhythm and calm “next card” affordance.
- Keyboard Arrow/Page Up/Down navigation on the stage (non-exclusive; `/explore` fallback remains).
- Whole-card click ignores scroll/swipe pointer movement; CTA links stay the keyboard target.
- Loading skeleton, empty, and error states share the same card visual system.
- `prefers-reduced-motion` disables shimmer, smooth scroll, and card transitions.

## 2. Files changed

| File | Change |
|------|--------|
| `public/index.html` | Stage `tabindex="0"` + keyboard roledescription; empty/error panels use card-system classes. |
| `public/frontend/public-mvp-home.js` | Keyboard adjacent-card helpers; pointer-movement click guard; revealed hint line; stage keydown wiring. |
| `public/frontend/public-mvp.css` | Phase 304 polish: macaron palette, snap-stop, focus-visible, panel cards, revealed wash, reduced-motion guards. |
| `tests/frontend/phase-304-home-swipe-interaction-visual-polish.test.ts` | Guards for polish wiring, keyboard helpers, privacy boundaries, `/home/feed` only. |

## 3. Boundaries preserved

- Collecting cards: question + status + hint only; no counts/percentages/ranks.
- Revealed cards: display-safe bucketed summary only (unchanged Phase 303 rules).
- `/home/feed` via `home-feed.js` only; `/polls/feed` and explore client untouched.
- No search, category filter, ranking, or personalization on home.

## 4. Follow-ups

- **FU-304-01** — Optional IntersectionObserver auto “load more” when the last card snaps into view.
- **FU-304-02** — Results-page “reveal” motion (separate from home; see design synthesis notes).
