# WWW Project Phase 305 — Home Feed Auto Paging Polish v1

**Status:** frontend-only homepage polish — JS + tests + docs. Adds conservative `IntersectionObserver` auto paging when the last home swipe card is substantially visible inside the stage; the manual `載入更多` button remains as fallback.

**Baseline commit:** `f783fc4` (Phase 304).

**No backend, API, DB, schema, migration, `/home/feed` contract, `/polls/feed`, auth, vote, result, eligibility, logging, metrics, or deploy configuration changed.**

---

## 1. Goal

Implement **FU-304-01** without removing the explicit load-more control:

- When `next_cursor` exists and the user scrolls/snaps the **last rendered card** mostly into the stage viewport, fetch the next `/home/feed` page.
- Disconnect the observer while a fetch is in flight to avoid duplicate requests.
- If `IntersectionObserver` is unavailable, manual `載入更多` still works.

## 2. Behavior

| Guard | Rule |
|-------|------|
| Auto trigger | `next_cursor` set, `loading === false`, `cardCount > 0` |
| Observe target | Last `.home-swipe-card` excluding skeleton |
| Root | `#home-swipe-stage` scroll container |
| Threshold | `0.55` intersection ratio (conservative) |
| During fetch | Observer disconnected until page settles |
| Fallback | `#home-swipe-load-more` unchanged |

## 3. Files changed

| File | Change |
|------|--------|
| `public/frontend/public-mvp-home.js` | Auto-paging helpers + observer wiring in `mountHomeSwipeFeed`. |
| `tests/frontend/phase-305-home-feed-auto-paging-polish.test.ts` | Guards for gating, observer root/target, privacy boundaries. |

## 4. Boundaries preserved

- `/home/feed` via `home-feed.js` only; `/polls/feed` untouched.
- Phase 303 validators and collecting no-leak rendering unchanged.
- No search, category filter, ranking, or personalization.

## 5. Follow-ups

- **FU-305-01** — Optional aria-live announcement when auto paging appends cards (only if copy review wants it).
