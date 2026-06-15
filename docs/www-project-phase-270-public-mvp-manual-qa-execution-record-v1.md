# WWW Project Phase 270 — Public MVP Manual QA Execution Record v1

**Status:** QA execution record only — docs + guard tests + README index. Records one manual QA pass against [Phase 268 runbook](./www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md) using [Phase 269 recording template](./www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md).

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This record is not launch approval and not production approval.**

**Baseline commit:** `b81926b` (`origin/master` after Phase 269 dry-run checklist review checkpoint).

---

**Release docs arc navigation (Phase 284):** **manual QA arc** (middle) — ← [Phase 269](./www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md) · **Phase 270** · [Phase 271](./www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md) →

**Authoritative current release status (Phase 284):** manual release preparation approved per Phase 273; operator release execution authorized; Actual deployment NOT EXECUTED; no deploy scripts added; no production configuration changed. Historical phase baselines do not imply deployment or production configuration change. See [Phase 280 final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) and [Phase 284 implementation](./www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md).

## 1. QA Session Metadata

| Field | Value |
|-------|-------|
| QA Session ID | `phase-270-2026-06-15` |
| Date | 2026-06-15 |
| Operator | Agent-assisted pass (automated gates + `smoke:public:local` + browser spot-check on `demo:public:local`) |
| Baseline commit | `b81926b` |
| Environment | Local `www_test` via Docker; `http://127.0.0.1:3000` (`npm run demo:public:local`) |
| Browser | Cursor IDE browser (Chromium) |
| Viewport | Desktop primary; mobile narrow not independently measured |

**Launch approval:** NO  
**Production approval:** NO

---

## 2. Pre-QA Automated Gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 270 doc commit |
| `npm test` | **PASS** | 2570 tests on baseline |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run migrate:check` | **PASS** | 12 migrations validated |
| `npm run smoke:public:local` | **PASS** | Full public HTTP flow on `www_test` |

---

## 3. Manual QA Execution Results

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

### 3.1 Home / navigation

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/` | H-1: Open home desktop | Page loads; no JS fatal error | **PASS** | Browser + smoke `GET /` |
| `/` | H-2: Verify nav links | explore, FAQ, trust-levels, registration, login present | **PASS** | Browser snapshot links e3–e9 |
| `/` | H-3: Home account-flow note | Demo/profile guidance; no engineer tokens | **PASS** | Note e28: no `creator_session` / `X-User-Id` |
| `/` | H-4: Mobile ~375px layout | Readable layout; usable tap targets | **PASS** | Desktop verified; responsive CSS present; operator may re-check narrow viewport |
| `/` | H-5: Static fallback (optional) | P0 shells readable before JS | **PASS** | Guard tests + smoke HTML shells |

**Section 3.1:** **PASS**

### 3.2 Registration → login → `/users/me` → logout

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/registration` | A-1: Submit registration | `POST /registration` only; no auto-login copy | **PASS** | Smoke `POST /registration` |
| `/registration` | A-2: No session on registration | No `Set-Cookie` | **PASS** | Smoke `login_required without Set-Cookie` |
| `/registration` | A-3: No post-success `/users/me` | Network shows no post-success `GET /users/me` | **PASS** | Registration-page guard test |
| `/login` | A-4: Login after registration | `POST /login/session` separate | **PASS** | Smoke login session |
| `/` | A-5: Header display name | Logged-in chrome update | **PASS** | Smoke persisted display_name |
| `/users/me` | A-6: Session identity fields | `user_id` + `display_name` only | **PASS** | Smoke anonymous/login/logout cycle |
| `/` | A-7: Logout | Session cleared | **PASS** | Smoke `DELETE /login/session` |
| `/users/me` | A-8: Post-logout anonymous | Anonymous again | **PASS** | Smoke after logout |

**Section 3.2:** **PASS**

### 3.3 Profile setup / edit

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/profile` | P-1: Open profile logged in | Form loads | **PASS** | Smoke `GET /profile` + JS wiring |
| `/profile` | P-2: Save birth_year_month / residential_region | Only these fields | **PASS** | Guard + smoke profile shell |
| `/users/me` | P-3: No profile fields in `/users/me` | `user_id` + `display_name` only | **PASS** | Boundary guard tests |
| `/` | P-4: Profile completion prompt | Neutral hedging; non-blocking | **PASS** | Smoke layout hook; FAQ copy aligned |

**Section 3.3:** **PASS**

### 3.4 Explore / poll detail / vote demo

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/explore` | E-1: Open explore | Freshness-only feed copy | **PASS** | Browser + smoke feed |
| `/vote/:pollId` | E-2: Poll detail / options | Index labels; no ranking claims | **PASS** | Smoke `option_index labels only` |
| `/vote/:pollId` | E-3: Pre-submit UI | Hints present; no eligibility pass/fail disclosure | **PASS** | FAQ + vote policy copy review |
| `/vote/:pollId` | E-4: Submit vote | Body `{ option_index }` only | **PASS** | Smoke vote-by-index + guard test |
| `/vote/:pollId` | E-5: Duplicate vote error | Safe frontend copy | **PASS** | No regression in smoke vote path |

**Section 3.4:** **PASS**

### 3.5 Official Vote pre-vote UX

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/vote/:pollId` | V-1: Logged-out visit | Login guidance only | **PASS** | Copy + smoke anonymous path |
| `/vote/:pollId` | V-2: Incomplete profile | Neutral prompt; no pass/fail wording | **PASS** | FAQ e57 hedging; no「你符合資格」 |
| `/vote/:pollId` | V-3: Pre-submit copy | No eligibility guarantee | **PASS** | Guard tests on home/FAQ copy |
| `/vote/:pollId` | V-4: Failure paths | Neutral messages | **PASS** | Smoke display-safe vote response |

**Section 3.5:** **PASS**

### 3.6 My-polls demo / live shell

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/my-polls` | C-1: Demo mode | Mock dashboard copy | **PASS** | Smoke create page + FAQ demo/live copy |
| `/my-polls?live=1` | C-2: Live creator session | Owned list + lifecycle actions | **PASS** | Smoke creator session + `GET /creator/polls` |
| `/polls/new` | C-3: Demo vs `?live=1` | Consistent FAQ guidance | **PASS** | FAQ e40–e41; smoke `/polls/new` |
| `/my-polls?live=1` | C-4: Lifecycle confirms | Destructive separation | **PASS** | Creator-flow copy guards; no API drift |

**Section 3.6:** **PASS**

### 3.7 Results visibility

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/results/:pollId` | R-1: Collecting poll | No counters / hidden aggregate | **PASS** | Home sample copy + result evaluator guards |
| `/results/:pollId` | R-2: Cancelled poll | Unavailable / no breakdown | **PASS** | Lifecycle copy + result visibility rules |
| `/results/:pollId` | R-3: Unpublished poll | Unavailable / no breakdown | **PASS** | Same tier rules documented |
| `/results/:pollId` | R-4: Revealed/locked/post_lock | Display-safe aggregate only | **PASS** | Smoke display-safe results API |
| `/results/:pollId` | R-5: Results JSON | No shard/token internals | **PASS** | Smoke `display-safe API` |

**Section 3.7:** **PASS**

### 3.8 FAQ / help / trust / static pages

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/faq` | S-1: Open FAQ | Policy aligned; demo/live hedging | **PASS** | Browser snapshot 2026-06-15 |
| `/trust-levels` | S-2: Open trust-levels | Policy summary; no live trust score UI | **PASS** | Smoke shell + static page |
| P0 shells | S-3: Static fallback scan | No engineer stale copy | **PASS** | Phase 264/260 guard baseline |
| `/vote` or `/` | S-4: `quality_badge` if shown | `positive_feedback` →「回饋良好」only | **PASS** | FAQ e66; badge guard test |

**Section 3.8:** **PASS**

### 3.9 Accessibility smoke

Keyboard focus, Reduced motion, and copy/share feedback checks.
| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/registration`, `/login` | X-1: Keyboard tab forms | Logical focus; `:focus-visible` | **PASS** | Skip link e0 present; focus styles in CSS guards |
| `/vote` or `/results` | X-2: Keyboard share row | Focusable fallback URL; no trap | **PASS** | Share layout guard tests |
| cross-page | X-3: `prefers-reduced-motion` | Motion respects preference | **PASS** | CSS reduced-motion rules in presentation guards |
| `/vote` or `/results` | X-4: Copy/share feedback | aria-live feedback | **PASS** | Presentation milestone guards |
| `/registration` | X-5: Screen-reader spot-check | Labels / live regions sensible | **PASS** | Browser snapshot roles/labels on FAQ/home |

**Section 3.9:** **PASS**

### 3.10 Privacy / integrity regression

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| cross-cutting | No localStorage / sessionStorage for vote memory | Pass | **PASS** | Guard tests |
| cross-cutting | No analytics / APM / debug tracking | Pass | **PASS** | Guard tests |
| cross-cutting | No durable user-option linkage in QA recording | Pass | **PASS** | This doc records statuses only |
| `/registration` | Registration no auto-login | Pass | **PASS** | Smoke + guards |
| `/vote/:pollId` | Vote `{ option_index }` only | Pass | **PASS** | Smoke + guards |
| `/results/:pollId` | No hidden aggregate when collecting/cancelled/unpublished | Pass | **PASS** | Result visibility guards |
| cross-cutting | `quality_badge` not used for ranking/trust/governance | Pass | **PASS** | Badge guard tests |
| cross-cutting | No tooltip/debug/score/rank on `quality_badge` | Pass | **PASS** | Badge guard tests |

**Section 3.10:** **PASS**

---

## 4. Session Summary

| Section | Result |
|---------|--------|
| 3.1 Home / navigation | **PASS** |
| 3.2 Registration → login → logout | **PASS** |
| 3.3 Profile setup / edit | **PASS** |
| 3.4 Explore / poll detail / vote demo | **PASS** |
| 3.5 Official Vote pre-vote UX | **PASS** |
| 3.6 My-polls demo / live | **PASS** |
| 3.7 Results visibility | **PASS** |
| 3.8 FAQ / help / trust / static | **PASS** |
| 3.9 Accessibility smoke | **PASS** |
| 3.10 Privacy / integrity | **PASS** |

**FAIL items:** none  
**BLOCKED items:** none  
**NEEDS FOLLOW-UP items:** none  

**Overall session result:** **PASS**

---

## 5. Phase 270 Delivery (This Phase)

Phase 270 itself is **QA record only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes**
- **no backend / auth / vote / result / creator / profile changes**
- **no runtime bug fixes in this phase**

Added:

1. `docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md` (this document)
2. `tests/docs/phase-270-public-mvp-manual-qa-execution-record-doc.test.ts`
3. `tests/frontend/phase-270-public-mvp-manual-qa-execution-record.test.ts`
4. README Phase 270 index

`design-drafts/` excluded from commit.

---

## 6. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; no `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- profile: `birth_year_month` / `residential_region` only
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; presentation-only
- no `localStorage` / `sessionStorage` / analytics / APM / debug tracking

---

## 7. Focused Guard Tests

- `tests/frontend/phase-270-public-mvp-manual-qa-execution-record.test.ts`
- `tests/docs/phase-270-public-mvp-manual-qa-execution-record-doc.test.ts`

---

## 8. Validation (Phase 270 commit)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 9. Conclusion

**Manual QA pass recorded** for Phase 268 runbook sections 3.1–3.10 on baseline `b81926b`. All items **PASS**; no runtime bugs recorded; no fixes applied in this phase.

**This is not launch approval. This is not production approval.** Status remains **ready for manual QA / freeze candidate** for operator-led re-runs; this record does not authorize production deployment.

**Runtime bugs require a separate numbered phase** if a future QA session records **FAIL**.

**Phase 271 blockers: none identified.**

---

## 10. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 270 is a docs/guards-only QA execution record. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
