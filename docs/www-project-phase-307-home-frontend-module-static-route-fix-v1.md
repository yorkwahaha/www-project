# WWW Project Phase 307 — Home Frontend Module Static Route Fix v1

**Status:** runtime fix — `src/http/server.ts` static routes only (+ tests/docs/smoke). Implements **FU-306-01** to close Phase 306 blocker **B-306-01** so the homepage can hydrate dynamic swipe cards instead of remaining on the skeleton shimmer.

**Baseline commit:** `09b5535` (Phase 306 visual review checkpoint).
**Prior review:** [Phase 306 homepage visual review](./www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md) — identified **B-306-01**.

**No homepage card rendering logic, CSS, layout, copy, `/home/feed` contract, `/polls/feed`, Explore behavior, vote/results, creator, auth, registration, profile, privacy, eligibility, DB, schema, or migration changed.**

---

## 1. Problem (B-306-01)

Phase 306 found:

| Asset | Before Phase 307 |
|-------|------------------|
| `GET /frontend/public-mvp-home.js` | **404** |
| `GET /frontend/home-feed.js` | **404** |

`public/index.html` references `public-mvp-home.js`, which imports `home-feed.js` and (transitively) other already-existing public frontend modules. Without `sendPublicFile` routes, the ES module graph could not load and the homepage stayed on the static skeleton (`aria-busy="true"`).

---

## 2. Fix (smallest route-only patch)

Added explicit `GET` static routes in `src/http/server.ts`:

| Path | File |
|------|------|
| `/frontend/public-mvp-home.js` | `public/frontend/public-mvp-home.js` |
| `/frontend/home-feed.js` | `public/frontend/home-feed.js` |

**Transitive static imports required for module hydration** (no logic change; same `sendPublicFile` pattern):

| Path | Why required |
|------|----------------|
| `/frontend/public-poll-card.js` | First import chain via `explore-page.js` (`formatExploreCategory`) |
| `/frontend/quality-feedback-badge.js` | Imported by `public-mvp-home.js` and `public-poll-card.js` |
| `/frontend/public-unavailable-state.js` | Imported by `public-mvp-home.js` and `explore-page.js` |
| `/frontend/public-page-copy.js` | Imported by `public-mvp-ui.js` (used by `home-feed.js`) |
| `/frontend/public-keyboard-focus-a11y.js` | Imported by `public-mvp-ui.js` (used by `home-feed.js`) |

No changes to `public/frontend/public-mvp-home.js`, `public/frontend/home-feed.js`, or any rendering/validator logic.

---

## 3. Boundaries preserved

- collecting cards still render question-only; no counters/results.
- revealed cards still use display-safe bucketed summaries only.
- `/home/feed` API contract unchanged; routes serve static files only.
- Raw Option Linkage Ban preserved — no new logs, metrics, APM, debug, or analytics payloads.

---

## 4. Files changed

| File | Change |
|------|--------|
| `src/http/server.ts` | Register home frontend static module routes |
| `tests/http/frontend-page.test.ts` | HTTP tests for home scripts + transitive imports |
| `scripts/smoke-public-local.mjs` | Smoke guard for `public-mvp-home.js` + `home-feed.js` (would have caught B-306-01) |
| `tests/frontend/phase-307-home-frontend-module-static-route-fix.test.ts` | Phase 307 guards |
| `tests/docs/phase-307-home-frontend-module-static-route-fix-doc.test.ts` | Doc guards |
| `tests/frontend/phase-306-homepage-real-device-visual-review-checkpoint.test.ts` | Phase 306 historical doc guard (no longer asserts missing routes) |
| `README.md` | Phase 307 index |

---

## 5. Manual verification

On `demo:public:local`:

| Check | Expected |
|-------|----------|
| `GET /frontend/public-mvp-home.js` | **200** |
| `GET /frontend/home-feed.js` | **200** |
| Homepage after load | Skeleton replaced by feed cards (or calm empty panel when feed is empty) |

---

## 6. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run smoke:public:local
```

---

## 7. Conclusion

**FU-306-01 CLOSED.** Phase 307 adds the missing static module routes so the Phase 301–305 homepage client can hydrate. **B-306-01 resolved** for module delivery; hydrated visual re-review can proceed in a future checkpoint.

---

## 8. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
