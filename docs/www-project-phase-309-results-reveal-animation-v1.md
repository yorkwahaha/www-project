# WWW Project Phase 309 — Results Reveal Animation v1 (FU-304-02)

**Status:** frontend presentation-only — `result-page.js` + `public-mvp.css` + tests + docs. Implements **FU-304-02**: a calm reveal animation for display-safe aggregate results on `/results/:pollId` after they are already allowed to render.

**Baseline commit:** `c7b1783` (Phase 308 hydrated homepage visual review PASS).

**No backend, API, DB, schema, migration, result visibility rules, aggregate data shape, `/home/feed`, `/polls/feed`, homepage, vote, creator, auth, registration, profile, eligibility, logging, metrics, or deploy configuration changed.**

---

## 1. Goal

Add a subtle, trustworthy reveal animation on the public results page for **aggregate** lifecycle states (`revealed`, `locked`, `post_lock`) only:

- Presentation-only — does not change when results become visible.
- Does not imply live counting or animate hidden counters into view.
- Does not apply to collecting, cancelled, unpublished, or unavailable shells.
- Respects `prefers-reduced-motion`.
- Avoids layout shift (opacity + translate only).
- Static HTML fallback remains acceptable when JS is unavailable.

---

## 2. Implementation

| Piece | Behavior |
|-------|----------|
| `syncResultsAggregateRevealPresentation` | Adds `results-aggregate-reveal` + `data-results-reveal-ready` on `#result-display` only when `resolveResultRenderMode` is `aggregate` (CSS-only animation; no JS timers or `requestAnimationFrame`). |
| `renderResultDisplay` | Calls sync after every render path; collecting/unavailable clear reveal markers. |
| `paintResultPageFromPayload` | Clears reveal markers on terminal mock states (`cancelled` / `unpublished`). |
| CSS Phase 309 | `@keyframes results-aggregate-reveal-in` — calm 520ms fade + 6px rise; staggered option delays; disabled under `prefers-reduced-motion`. |

Demo preview: `/results/demo?ui_state=revealed`.

---

## 3. Boundaries preserved

- Collecting / cancelled / unpublished remain counter-free.
- Revealed / locked / post_lock still show only existing display-safe aggregates.
- No API or payload shape change.
- Raw Option Linkage Ban preserved — no new logs/metrics/APM/debug payloads.

---

## 4. Files changed

| File | Change |
|------|--------|
| `public/frontend/result-page.js` | Reveal presentation helpers + `renderResultDisplay` wiring |
| `public/frontend/public-mvp.css` | Phase 309 results aggregate reveal animation |
| `tests/frontend/phase-309-results-reveal-animation.test.ts` | Phase 309 guards |
| `tests/docs/phase-309-results-reveal-animation-doc.test.ts` | Doc guards |
| `README.md` | Phase index |

---

## 5. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run smoke:public:local
```

Manual: `/results/demo?ui_state=revealed` — aggregate rows fade in calmly; `/results/demo` (collecting) — no reveal class; reduced-motion — no animation dependency.

---

## 6. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
