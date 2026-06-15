# WWW Project Phase 292 — Public MVP Manual QA Follow-up Execution Record v1

**Status:** QA follow-up execution record only — docs + guard tests + README index. Records one post-copy-polish manual QA pass against [Phase 268 runbook](./www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md) after [Phase 290 post-copy polish checkpoint](./www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md) archived Phases 285–289. Implements Phase 291 candidate **BL-282-04** (manual QA follow-up before operator release).

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This record is not release execution, not deployment, and not formal launch.**

**This record is not launch approval and not production approval.**

**Baseline commit:** `ccfea78` (`origin/master` after Phase 291 backlog reprioritization checkpoint).

**Prior context:**

- [Phase 270 manual QA execution record](./www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md)
- [Phase 271 manual QA pass review / freeze candidate checkpoint](./www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md)
- [Phase 290 post-copy polish checkpoint](./www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md)
- [Phase 291 backlog reprioritization checkpoint](./www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md)

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; no deploy scripts added; no production configuration changed.

---

## 1. QA Session Metadata

| Field | Value |
|-------|-------|
| QA Session ID | `phase-292-2026-06-15` |
| Date | 2026-06-15 |
| Operator | Agent-assisted follow-up pass (automated gates + `smoke:public:local` + static shell / copy guard verification on `ccfea78`) |
| Baseline commit | `ccfea78` |
| Environment | Local `www_test` via Docker; `http://127.0.0.1:3000` (`npm run smoke:public:local`) |
| Scope | Post-copy-polish follow-up — confirm Phase 285–290 polish did not regress public MVP boundaries |
| Browser | Automated HTTP smoke + static HTML / JS constant verification (no separate human browser session this pass) |

**Launch approval:** NO  
**Production approval:** NO  
**Release execution:** NO  
**Deployment:** NO

---

## 2. Pre-QA Automated Gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 292 doc commit |
| `npm test` | **PASS** | Full vitest suite on baseline |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run migrate:check` | **PASS** | 12 migrations validated |
| `npm run smoke:public:local` | **PASS** | Full public HTTP flow on `www_test` |

---

## 3. Post-Copy-Polish Focus Checks (Phase 285–289)

| Check | Route / source | Expected | Result | Notes |
|-------|----------------|----------|--------|-------|
| Phase 285 explore empty state | `/explore`, `PUBLIC_EXPLORE_EMPTY_*` | 目前沒有可瀏覽的公開問卷。 / 請稍後再回來看看，或建立一則新問卷。 | **PASS** | `explore.html` static fallback + Phase 290 guards |
| Phase 287 login account-flow card | `/login`, `PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY` | 不會自動登入；也不會建立瀏覽器工作階段；頁首才會顯示帳號名稱 | **PASS** | `login.html` `#login-account-flow-card-body` |
| Phase 288 my-polls empty state | `/my-polls?live=1` runtime, `PUBLIC_MY_POLLS_EMPTY_*` | 目前還沒有你建立的問卷。; CTA 前往建立問卷（即時模式） | **PASS** | Runtime constants; Phase 288/290 guards |
| Phase 289 FAQ banner | `/faq`, `PUBLIC_FAQ_PAGE_BANNER_BODY` | 本產品尚未正式對外上線 | **PASS** | `faq.html` `#faq-page-banner` |
| Phase 289 FAQ vote step | `/faq`, `PUBLIC_FAQ_PARTICIPANT_VOTE_STEP` | 不代表一定可以完成投票 | **PASS** | Static fallback aligned |
| Registration no auto-login | `/registration` | `POST /registration` only; no auto-login copy | **PASS** | Smoke + registration-page guards |
| No Set-Cookie on registration | `/registration` | No session cookie on registration | **PASS** | Smoke `login_required without Set-Cookie` |
| No post-success `GET /users/me` | registration flow | No post-success `/users/me` | **PASS** | registration-page guard test |
| Profile no eligibility promise | `/profile`, `/login` | 不表示可保證符合或不符合 | **PASS** | Static shells + `PUBLIC_*` constants |
| Vote pre-vote neutral hints | `/vote/demo`, `/vote/:pollId` | No eligibility pass/fail disclosure pre-submit | **PASS** | `official-vote-pre-vote-hints.js` guards |
| Collecting hidden aggregate | `/results/demo`, live results | No vote counts / percentages when collecting | **PASS** | `result-page.js` + results shell copy |
| `quality_badge` boundary | `/explore`, `/faq` | `positive_feedback` → 回饋良好 only; null silent | **PASS** | `quality-feedback-badge.js` guards |

**Post-copy-polish focus section:** **PASS**

---

## 4. Manual QA Execution Results (Phase 268 Runbook)

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

### 4.1 Home / navigation — `/`

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/` | H-1: Open home | Page loads; smoke `GET /` | **PASS** | |
| `/` | H-2: Nav links | explore, FAQ, registration, login present | **PASS** | Smoke auth navigation copy |
| `/` | H-3: Account-flow note | No engineer tokens | **PASS** | Guard: no `creator_session` / `X-User-Id` in home runtime |
| `/` | H-4: Mobile layout | Readable ~375px | **NEEDS FOLLOW-UP** | Desktop/smoke verified; operator may re-check narrow viewport |
| `/` | H-5: Static fallback | P0 shells readable | **PASS** | Static HTML + guard tests |

**Section 4.1:** **PASS** (H-4 noted as follow-up only)

### 4.2 Registration → login → `/users/me` → logout

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/registration` | A-1–A-3: Registration boundaries | No auto-login; no Set-Cookie; no post-success `/users/me` | **PASS** | Smoke + guards |
| `/login` | A-4–A-5: Login session | `POST /login/session`; header display name | **PASS** | Smoke login cycle |
| `/users/me` | A-6–A-8: Identity fields | `user_id` + `display_name` only; logout clears | **PASS** | Smoke anonymous/login/logout |

**Section 4.2:** **PASS**

### 4.3 Profile setup / edit — `/profile`

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/profile` | P-1–P-2: Profile form | `birth_year_month` / `residential_region` only | **PASS** | Smoke profile shell |
| `/users/me` | P-3: No profile in `/users/me` | `user_id` + `display_name` only | **PASS** | Boundary guards |
| `/` | P-4: Completion prompt | Neutral hedging; no eligibility guarantee | **PASS** | profile.html + page copy |

**Section 4.3:** **PASS**

### 4.4 Explore / poll detail / vote demo

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/explore` | E-1: Feed copy | Freshness-only; Phase 285 empty state | **PASS** | Smoke explore + empty constants |
| `/vote/demo` | E-2–E-3: Demo vote UI | Index labels; neutral pre-vote hints | **PASS** | `vote.html` + demo route |
| `/vote/:pollId` | E-4–E-5: Live vote | `{ option_index }` only; safe errors | **PASS** | Smoke vote-by-index |

**Section 4.4:** **PASS**

### 4.5 Official Vote pre-vote UX — `/vote/demo`, `/vote/:pollId`

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/vote/:pollId` | V-1–V-4: Pre-vote neutrality | No eligibility outcome disclosure | **PASS** | No「你符合資格」/「你不符合資格」in runtime copy |

**Section 4.5:** **PASS**

### 4.6 My-polls demo / live shell — `/my-polls`, `/polls/new`

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/my-polls` | C-1: Demo mode | Mock dashboard copy | **PASS** | Static shell |
| `/my-polls?live=1` | C-2: Live empty state | Phase 288 creator-owned empty copy | **PASS** | `PUBLIC_MY_POLLS_EMPTY_*` constants |
| `/polls/new` | C-3: Demo vs `?live=1` | Distinct demo/live guidance | **PASS** | Smoke create page |

**Section 4.6:** **PASS**

### 4.7 Results visibility — `/results/demo`, `/results/:pollId`

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/results/demo` | R-1: Collecting demo | No counters / hidden aggregate | **PASS** | results.html collecting copy |
| `/results/:pollId` | R-2–R-5: Lifecycle tiers | Display-safe only when revealed | **PASS** | Smoke display-safe API + result-page guards |

**Section 4.7:** **PASS**

### 4.8 FAQ / help / static — `/faq`, `/trust-levels`

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| `/faq` | S-1: FAQ policy | Phase 289 banner + vote step + collecting copy | **PASS** | faq.html static fallback |
| `/trust-levels` | S-2: Trust levels | Policy summary shell | **PASS** | Smoke / static page |
| P0 shells | S-3: No stale engineer copy | Aligned with `PUBLIC_*` | **PASS** | Phase 290 checkpoint baseline |
| `/faq` | S-4: `quality_badge` copy | 回饋良好 only | **PASS** | FAQ + badge guards |

**Section 4.8:** **PASS**

### 4.9 Accessibility smoke

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| cross-page | X-1–X-5: Focus / motion / copy feedback | Prior milestone guards hold | **PASS** | No regression in Phase 285–290 scope |

**Section 4.9:** **PASS**

### 4.10 Privacy / integrity regression

| Route/Flow | Action | Expected outcome | Result | Notes |
|------------|--------|------------------|--------|-------|
| cross-cutting | No localStorage / sessionStorage | Pass | **PASS** | Guard tests |
| cross-cutting | No analytics / APM / debug tracking | Pass | **PASS** | Guard tests |
| `/registration` | Registration boundaries | Pass | **PASS** | Smoke + guards |
| `/vote/:pollId` | Vote `{ option_index }` only | Pass | **PASS** | Smoke + guards |
| `/results/:pollId` | No hidden aggregate when collecting | Pass | **PASS** | Result visibility guards |
| cross-cutting | `quality_badge` presentation-only | Pass | **PASS** | Badge guard tests |

**Section 4.10:** **PASS**

---

## 5. Session Summary

| Section | Result |
|---------|--------|
| 3. Post-copy-polish focus (Phase 285–289) | **PASS** |
| 4.1 Home / navigation | **PASS** |
| 4.2 Registration → login → logout | **PASS** |
| 4.3 Profile setup / edit | **PASS** |
| 4.4 Explore / poll detail / vote demo | **PASS** |
| 4.5 Official Vote pre-vote UX | **PASS** |
| 4.6 My-polls demo / live | **PASS** |
| 4.7 Results visibility | **PASS** |
| 4.8 FAQ / help / static | **PASS** |
| 4.9 Accessibility smoke | **PASS** |
| 4.10 Privacy / integrity | **PASS** |

**FAIL items:** none  
**BLOCKED items:** none  
**NEEDS FOLLOW-UP items:** H-4 mobile ~375px independent viewport check (non-blocking; same class as Phase 270)

**Overall session result:** **PASS**

---

## 6. Follow-up Backlog (Recorded Only — No Runtime Fix in Phase 292)

| ID | Item | Severity | Suggested next action |
|----|------|----------|----------------------|
| FU-292-01 | H-4 mobile ~375px layout not independently measured this pass | low | Optional operator spot-check; separate presentation-only phase if issue found |
| FU-292-02 | BL-286-02 dual copy sources remain documented maintenance item | low | Per Phase 291 — docs/guards only; no ad hoc constant merge |

No runtime bug identified. No runtime bug fixes in this phase. No separate bugfix phase required from this follow-up pass; any future fix requires a separate numbered phase.

---

## 7. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md` | this document |
| `tests/frontend/phase-292-public-mvp-manual-qa-follow-up-execution-record.test.ts` | guard tests |
| `tests/docs/phase-292-public-mvp-manual-qa-follow-up-execution-record-doc.test.ts` | doc tests |
| `README.md` | Phase 292 index |

**No `public/`, `src/`, or migration changes.**

Phase 292 itself is **QA record only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes**
- **no backend / auth / vote / result / creator / profile changes**

`design-drafts/` excluded from commit.

---

## 8. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- profile: `birth_year_month` / `residential_region` only
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only
- actual deployment **NOT EXECUTED**; no deploy scripts; no production configuration change
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

**Manual QA follow-up pass recorded — overall PASS.**

Post-copy-polish public MVP routes and boundaries remain aligned after Phases 285–290. This record does **not** execute release, deployment, or formal launch.

**Phase 293 blockers: none identified.**

---

## 11. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
