# WWW Project Phase 310 — Site Chrome Frontend Module Static Route Fix v1

**Status:** runtime fix — `src/http/server.ts` static routes only (+ tests/docs/smoke). Implements **FU-307-01** so shared site chrome ES modules load and `/results/:pollId` runtime can start when `public-mvp-layout.js` is referenced.

**Baseline commit:** `328becf` (Phase 309 results reveal animation).
**Prior observation:** [Phase 307-R review](./www-project-phase-307r-home-frontend-module-static-route-review-checkpoint-v1.md) and [Phase 308 hydrated review](./www-project-phase-308-hydrated-homepage-visual-review-checkpoint-v1.md) — **FU-307-01** (site-chrome static routes missing).
**Related:** [Phase 309 results reveal animation](./www-project-phase-309-results-reveal-animation-v1.md) — browser verification blocked until site-chrome modules load.

**No changes to `public-mvp-layout.js`, `result-page.js` reveal logic, `public-mvp.css`, copy, layout, animation behavior, `/results` API, result visibility rules, `/home/feed`, `/polls/feed`, Explore, homepage card rendering, vote, creator, auth, registration, profile, eligibility, DB, schema, or migrations.**

---

## 1. Problem (FU-307-01)

Phase 309 manual browser check of `/results/demo?ui_state=revealed` could remain stuck at「載入結果中」because the ES module graph failed before `result-page.js` could bootstrap:

| Asset | Before Phase 310 |
|-------|------------------|
| `GET /frontend/auth-state-copy.js` | **404** |
| `GET /frontend/login-state-ui.js` | **404** |
| `GET /frontend/login-state-read.js` | **404** |
| `GET /frontend/login-state-logout.js` | **404** |

`public/results.html` loads `/frontend/public-mvp-layout.js`; `result-page.js` also imports it. `public-mvp-layout.js` imports the site-chrome modules above. Without `sendPublicFile` routes, layout chrome cannot load and `/results` runtime stalls on the static HTML loading shell.

---

## 2. Fix (smallest route-only patch)

Added explicit `GET` static routes in `src/http/server.ts`:

| Path | File |
|------|------|
| `/frontend/auth-state-copy.js` | `public/frontend/auth-state-copy.js` |
| `/frontend/login-state-ui.js` | `public/frontend/login-state-ui.js` |
| `/frontend/login-state-read.js` | `public/frontend/login-state-read.js` |
| `/frontend/login-state-logout.js` | `public/frontend/login-state-logout.js` |

**Result-page direct static imports (required for `/results` ES module bootstrap):**

| Path | File |
|------|------|
| `/frontend/public-results-detail-layout.js` | `public/frontend/public-results-detail-layout.js` |
| `/frontend/public-vote-detail-layout.js` | `public/frontend/public-vote-detail-layout.js` |
| `/frontend/poll-lifecycle-controls.js` | `public/frontend/poll-lifecycle-controls.js` |
| `/frontend/creator-flow-copy.js` | `public/frontend/creator-flow-copy.js` |

**`public-mvp-layout.js` import graph review:** direct imports are `auth-state-copy.js`, `login-state-ui.js`, and `profile-completion-prompt.js` (already served). Transitive imports introduced by the layout graph are `login-state-read.js` and `login-state-logout.js` via `login-state-ui.js`; `auth-state-copy.js` depends only on `public-mvp-ui.js` (already served). No additional layout-graph routes required beyond the four above.

**`/results` runtime graph (same route-only patch):** `result-page.js` also imports `public-results-detail-layout.js` and `poll-lifecycle-controls.js` directly. Browser verification showed `/results/demo` remained on「載入結果中」until these and their already-served transitive deps (`public-vote-detail-layout.js`, `creator-flow-copy.js`) were registered alongside the site-chrome routes.

No changes to frontend module behavior.

---

## 3. Boundaries preserved

- collecting / cancelled / unpublished states still hide counters on `/results`.
- aggregate result states still show only existing display-safe summaries.
- `/results` API contract and visibility rules unchanged; routes serve static files only.
- Raw Option Linkage Ban preserved — no new logs, metrics, APM, debug, or analytics payloads.

---

## 4. Files changed

| File | Change |
|------|--------|
| `src/http/server.ts` | Register site-chrome frontend static module routes |
| `tests/http/frontend-page.test.ts` | HTTP tests for site-chrome modules (200) |
| `scripts/smoke-public-local.mjs` | Smoke guard for results layout site-chrome module graph |
| `tests/frontend/phase-310-site-chrome-frontend-module-static-route-fix.test.ts` | Phase 310 guards |
| `tests/docs/phase-310-site-chrome-frontend-module-static-route-fix-doc.test.ts` | Doc guards |
| `README.md` | Phase 310 index |

---

## 5. Manual verification

On `demo:public:local`:

| Check | Expected |
|-------|----------|
| `GET /frontend/auth-state-copy.js` | **200** |
| `GET /frontend/login-state-ui.js` | **200** |
| `GET /frontend/login-state-read.js` | **200** |
| `GET /frontend/login-state-logout.js` | **200** |
| `/results/demo?ui_state=revealed` | No longer stuck at「載入結果中」solely due to missing site-chrome modules; Phase 309 reveal animation inspectable |
| Homepage hydration | Still working (`public-mvp-home.js`, `/home/feed` unchanged) |

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

**FU-307-01 CLOSED.** Phase 310 adds the missing site-chrome static module routes so layout imports resolve for `/results` and header chrome can hydrate. Phase 309 reveal animation browser verification is unblocked for the site-chrome failure mode.

---

## 8. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
