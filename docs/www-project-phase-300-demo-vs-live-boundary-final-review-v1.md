# WWW Project Phase 300 — Demo vs Live Boundary Final Review v1

**Status:** boundary review / QA record only — docs + guard tests + README index. Final independent audit that public MVP **demo**, **preview**, and **`?live=1` live** paths remain cleanly separated across poll creation, creator management, vote, results, auth, and storage/tracking surfaces — without modifying runtime, copy, CSS, layout, deploy scripts, or production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This review is not release execution, not deployment, and not formal launch.**

**Baseline commit:** `71b5267` (`origin/master` after Phase 299 static HTML vs runtime copy drift review).

**Prior context:**

- [Phase 290 post-copy polish checkpoint](./www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md) — registration/profile/vote/results boundary reaffirmation
- [Phase 166 my-polls creator lifecycle UX review](./www-project-phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint-v1.md) — demo/live shell separation
- [Phase 169 public MVP full-flow smoke checkpoint](./www-project-phase-169-public-mvp-full-flow-smoke-checkpoint-v1.md) — create poll / my-polls / vote / results boundaries
- [Phase 268 manual QA runbook](./www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md) — section 3.6 my-polls demo/live shell
- [Phase 292 manual QA follow-up execution record](./www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md) — overall **PASS**
- [Phase 296 backlog planning checkpoint](./www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md) — sealed Phase 291–295 arc
- [Phase 299 static HTML vs runtime copy drift review](./www-project-phase-299-static-html-fallback-vs-runtime-copy-drift-review-v1.md) — **FU-292-02 closed**; **M-296-03 closed**

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

---

## 1. Review Session Metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-300-2026-06-16` |
| Date | 2026-06-16 |
| Operator | Agent-assisted boundary audit (static source + existing Phase 169/290/299 guards + automated gates) |
| Baseline commit | `71b5267` |
| Environment | Local `www_test` via `npm run smoke:public:local` |
| Scope | Demo vs live / preview boundary across poll creation, my-polls, vote, results, auth, creator session, storage/tracking |
| Method | Broad source assertions on `parseLiveApiMode`, demo submit helpers, official vote path, result visibility tiers, registration/login/session copy, and forbidden storage/tracking patterns |

**Launch approval:** NO  
**Production approval:** NO  
**Release execution:** NO  
**Deployment:** NO

---

## 2. Pre-Review Automated Gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 300 doc commit |
| `npm test` | **PASS** | Full vitest suite including Phase 299 guards |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run migrate:check` | **PASS** | |
| `npm run smoke:public:local` | **PASS** | Full public HTTP flow on `www_test` |

---

## 3. Demo vs Live Boundary Architecture (Unchanged)

| Surface | Demo / preview path | Live path | Separation mechanism |
|---------|---------------------|-----------|----------------------|
| Poll creation `/polls/new` | Default — local validation only | `?live=1` — `POST /creator/polls` | `parseLiveApiMode(search)` → `submitCreatePollDemo` vs `ensureCreatorSessionForLiveMode` + `submitCreatePoll` |
| My polls `/my-polls` | Default — `data-mock-dashboard` static shell | `?live=1` — `GET /creator/polls` owned list | `parseLiveApiMode` → mock dashboard vs `data-live-owned-list` + creator APIs |
| Vote `/vote/:pollId` | `/vote/demo` — `isDemoPollRouteId` | Live poll id — Official Vote controller | `demoOnly` branch → `submitVoteDemo` (no network) vs `controller.submit()` |
| Results `/results/:pollId` | `/results/demo` — demo payloads / `ui_state` preview | Live poll id — result API when not demo | `isDemoPollRouteId` / `demoOnly` skips live fetch; visibility tiers unchanged |
| Creator session | N/A on demo surfaces | `?live=1` creator flows only | `ensureCreatorSessionForLiveMode` → `/creator/session`; scoped to `/creator/*`; not public user identity |
| Registration | `POST /registration` only | same | No auto-login; no `Set-Cookie`; no post-success `GET /users/me` |
| Profile | Eligibility hedging copy only | same | Completing profile does not guarantee vote eligibility |

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

---

## 4. Boundary Focus Checks

### 4.1 Poll creation — `/polls/new` demo vs `?live=1`

| Check | Demo default | `?live=1` | Result |
|-------|--------------|-----------|--------|
| API selection | `submitCreatePollDemo` → `status: 'demo_static'` | `submitCreatePoll` → `POST /creator/polls` | **PASS** |
| Session requirement | none | `ensureCreatorSessionForLiveMode` before submit | **PASS** |
| Static shell guidance | `create-poll.html` banner states demo; links `?live=1` | same shell; runtime switches submit label | **PASS** |
| Data persistence | none | creator-owned poll via backend | **PASS** |

### 4.2 My polls — demo shell vs `?live=1` creator APIs

| Check | Demo default | `?live=1` | Result |
|-------|--------------|-----------|--------|
| Dashboard mode | `data-mock-dashboard` mock table | `data-live-owned-list` + `GET /creator/polls` | **PASS** |
| Creator session | not required for static shell | `ensureCreatorSessionForLiveMode` before fetch | **PASS** |
| User auth confusion | demo row copy directs to `?live=1` for management | live manage panel + lifecycle actions | **PASS** |
| `/users/me` on my-polls | not used for owned list | creator session only | **PASS** |

### 4.3 Vote — demo/preview vs Official Vote

| Check | `/vote/demo` | Live poll vote | Result |
|-------|--------------|----------------|--------|
| Route detection | `isDemoPollRouteId('demo')` | real poll id | **PASS** |
| Submit path | `submitVoteDemo({ optionIndex })` — returns `{ ok: true, demo: true }` | `controller.submit()` — official vote API | **PASS** |
| Eligibility evaluation | not triggered on demo submit | vote-time eligibility on live path only | **PASS** |
| Pre-vote hints | neutral; no pass/fail disclosure | same neutral copy family | **PASS** |
| Runtime memory | cleared after demo submit | official vote token path unchanged | **PASS** |

### 4.4 Results — demo vs hidden aggregate states

| Check | `/results/demo` | Live results | Result |
|-------|-----------------|--------------|--------|
| Demo intro | `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` | `PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD` when live | **PASS** |
| Collecting / cancelled / unpublished | hidden aggregate — no counters or percentages rendered | `resolveResultRenderMode` ≠ `aggregate` | **PASS** |
| Revealed / locked / post_lock | demo `ui_state` preview only | display-safe aggregate labels when API allows | **PASS** |
| Numeric leak in collecting render | `renderResultDisplay` strips percentages/counts | unchanged Phase 167/290 guard | **PASS** |

### 4.5 `creator_session` scope

| Check | Result | Notes |
|-------|--------|-------|
| Used only for `/creator/*` flows | **PASS** | `create-poll-page.js`, `my-polls-page.js`, `poll-lifecycle-controls.js` |
| Not treated as public user identity | **PASS** | `auth-state-copy.js` documents MVP X-User-Id vs creator_session separation |
| Not exposed in public HTML shells as engineer token | **PASS** | `my-polls.html` uses user-facing「即時模式」wording |
| Not used for Official Vote auth | **PASS** | vote uses user session / production auth path |

### 4.6 Registration — no auto-login / no `Set-Cookie`

| Check | Result | Notes |
|-------|--------|-------|
| `submitRegistrationRequest` posts `/registration` only | **PASS** | `registration-page.js` |
| No post-success `GET /users/me` | **PASS** | guard tests + source audit |
| Copy states no auto-login / no browser session | **PASS** | Phase 287/299 alignment |
| No `Set-Cookie` in registration frontend | **PASS** | static + runtime |

### 4.7 Profile — no eligibility guarantee

| Check | Result | Notes |
|-------|--------|-------|
| Lead / guidance hedging present | **PASS** | `不表示可保證符合或不符合` |
| Profile completion ≠ vote eligibility | **PASS** | FAQ + profile copy unchanged |
| `/users/me` fields bounded | **PASS** | `user_id` / `display_name` only |

### 4.8 Storage / analytics / metrics / APM / debug tracking

| Check | Result | Notes |
|-------|--------|-------|
| No `localStorage` / `sessionStorage` in `public/frontend/*.js` | **PASS** | broad frontend scan |
| No new analytics / metrics / APM / debug tracking | **PASS** | forbidden pattern scan |
| Raw Option Linkage Ban | **PASS** | no durable user-option linkage introduced |

**Focus section overall:** **PASS**

---

## 5. `quality_badge` Boundary (Unchanged)

| Check | Result |
|-------|--------|
| `positive_feedback` →「回饋良好」only | **PASS** |
| null / missing / unexpected silent | **PASS** |
| Not used for ranking / recommendation / personalization | **PASS** |
| Demo results intro「優質題目」is policy language, not score leak | **PASS** |

---

## 6. Session Summary

| Metric | Value |
|--------|-------|
| Boundary areas checked | 8 / 8 |
| Boundary defects | 0 |
| **FAIL** | 0 |
| **BLOCKED** | 0 |
| **NEEDS FOLLOW-UP** | 0 |
| Runtime behavior changed | **NO** |
| **Overall boundary review result** | **PASS** |

**PASS conclusion criterion:** demo vs live boundaries remain clean — demo/preview paths do not submit official votes, do not trigger vote-time eligibility, do not reveal hidden aggregates, do not collapse creator session into public identity, do not auto-login on registration, do not promise eligibility on profile completion, and do not introduce forbidden storage or tracking. **All criteria met.**

---

## 7. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-300-demo-vs-live-boundary-final-review-v1.md` | this document |
| `tests/docs/phase-300-demo-vs-live-boundary-final-review-doc.test.ts` | doc tests |
| `tests/frontend/phase-300-demo-vs-live-boundary-final-review.test.ts` | boundary review guards |
| `README.md` | Phase 300 index |

Phase 300 is **boundary review / docs-tests-README only**:

- **no runtime change**
- **no API change**
- **no DB / migration change**
- **no deploy script or production config change**

**No `public/`, `src/`, or migration changes.**

`design-drafts/` excluded from commit.

---

## 8. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- `quality_badge`: presentation-only; not expanded
- `creator_session`: scoped to `/creator/*`; not public identity
- actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 9. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 10. Conclusion

**Demo vs live boundary final review — overall PASS.**

Phase 300 confirms that demo, preview, and `?live=1` live paths remain cleanly separated across poll creation, my-polls, vote, results, registration, profile, and creator session surfaces. No boundary defect requiring a runtime fix phase was identified.

**This phase does not execute release, deploy, or formal launch.**

**Phase 301 blockers: none identified.**

---

## 11. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 300 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
