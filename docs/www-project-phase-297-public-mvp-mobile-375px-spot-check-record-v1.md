# WWW Project Phase 297 — Public MVP Mobile 375px Spot-Check Record v1

**Status:** QA record / review-only — docs + guard tests + README index. Records agent-assisted mobile viewport spot-check at approximately **375px width** for primary public MVP routes, addressing Phase 292 **FU-292-01** and Phase 296 **M-296-01** — without modifying runtime, CSS, layout, copy, deploy scripts, or production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This record is not release execution, not deployment, and not formal launch.**

**Baseline commit:** `89f6c8d` (`origin/master` after Phase 296 backlog planning checkpoint).

**Prior context:**

- [Phase 292 manual QA follow-up execution record](./www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md) — overall **PASS**; **FU-292-01** mobile ~375px **NEEDS FOLLOW-UP**
- [Phase 293 post-release monitoring notes draft](./www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md) — optional operator ~375px spot-check
- [Phase 296 backlog planning checkpoint](./www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md) — **M-296-01** candidate

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

---

## 1. Spot-Check Session Metadata

| Field | Value |
|-------|-------|
| Spot-check ID | `phase-297-2026-06-16` |
| Date | 2026-06-16 |
| Operator | Agent-assisted mobile viewport spot-check (browser @ 375×812 + `npm run demo:public:local`) |
| Baseline commit | `89f6c8d` |
| Environment | Local `www_test` via `npm run demo:public:local`; `http://127.0.0.1:3000` |
| Viewport | **375px** width × 812px height (mobile emulation, `deviceScaleFactor: 2`) |
| Scope | Primary public routes — header/CTA readability, form field overflow, empty states, FAQ blocks, vote/results demo privacy boundaries, `quality_badge` presentation-only |
| Browser | Cursor IDE browser (Chromium) with CDP `Emulation.setDeviceMetricsOverride` |

**Launch approval:** NO  
**Production approval:** NO  
**Release execution:** NO  
**Deployment:** NO

---

## 2. Pre-Spot-Check Automated Gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 297 doc commit |
| `npm test` | **PASS** | Full vitest suite on baseline |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run migrate:check` | **PASS** | |
| `npm run smoke:public:local` | **PASS** | Full public HTTP flow on `www_test` |

---

## 3. Observation Focus (375px)

| Focus area | Check |
|------------|-------|
| Header / CTA readability | Site chrome, primary/secondary links, page titles visible without horizontal scroll |
| Form fields | Inputs/selects fit within viewport (`getBoundingClientRect().right ≤ innerWidth`) |
| Empty states | Phase 285 explore empty copy readable at narrow width |
| FAQ blocks | Accordion headings and policy banner readable |
| Vote / results demo | No numeric vote aggregate leak in collecting/demo shell; pre-vote neutral hints present |
| `quality_badge` | Presentation-only; `positive_feedback` →「回饋良好」only; null/absent silent |
| Horizontal overflow | `document.documentElement.scrollWidth ≤ clientWidth + 1` |

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

---

## 4. Per-Route Spot-Check Results

| Route | Header / CTA | Forms / fields | Empty / content blocks | Privacy / badge | Result | Notes |
|-------|--------------|----------------|------------------------|-----------------|--------|-------|
| `/` | Readable hero, nav links, demo CTAs | N/A (no form) | Homepage sections readable | No aggregate numbers; policy copy only | **PASS** | `scrollWidth` 375; no horizontal overflow |
| `/explore` | H1 + lead readable | N/A | Phase 285 empty state readable (`目前沒有可瀏覽的公開問卷。`) | Feed `quality_badge: null` — no badge shown | **PASS** | After API load; empty-state CTA visible |
| `/faq` | H1 + policy banner readable | N/A | 9 FAQ accordion controls readable | FAQ copy neutral; no eligibility pass/fail | **PASS** | Banner「本產品尚未正式對外上線」visible |
| `/login` | H1 + account-flow card readable | 1 input; width ~317px; **0 overflow** | Identity / account-flow regions readable | No session auto-login implication in layout | **PASS** | Phase 287 card body visible |
| `/registration` | H1 + field labels readable | 4 inputs; width ~317px; **0 overflow** | Registration hints readable | No post-success session UI | **PASS** | Combobox fits viewport |
| `/profile` | H1 + sign-in-required panel readable | Guest state — form hidden behind login gate | Eligibility disclaimer readable | No eligibility promise in visible copy | **PASS** | Expected guest layout |
| `/polls/new` | H1 + demo notice readable | 10 fields; **0 overflow** | Create-poll checklist readable | No vote aggregate on create page | **PASS** | CTA「建立問卷（展示用，不儲存）」fits |
| `/my-polls` | H1 + demo dashboard readable | N/A | Demo table + CTA links readable | No vote counts in visible shell | **PASS** | Phase 288 empty copy path not shown on default demo shell |
| `/vote/demo` | Vote shell + pre-vote region readable | Options not rendered in quick check window | Pre-vote hints + collecting notice readable | **No aggregate leak**; neutral vote guidance | **PASS** | Demo shell shows static loading title; layout/chrome readable — not a 375px defect |
| `/results/demo` | H1 + visibility notice readable | N/A | Collecting demo message readable | **No hidden aggregate** (`aggregateLeak: false`); no result bars | **PASS** | Demo collecting copy present |

**Per-route section:** all **PASS** — no **FAIL** or **BLOCKED**.

---

## 5. Cross-Cutting Privacy / Integrity Checks (375px)

| Check | Result | Notes |
|-------|--------|-------|
| Collecting hidden aggregate on `/results/demo` | **PASS** | No numeric vote counts / percentages in visible body |
| Vote pre-vote neutrality on `/vote/demo` | **PASS** | Pre-vote region present; no eligibility pass/fail disclosure |
| `quality_badge` presentation-only | **PASS** | No unexpected badge chips on checked routes; explore feed item `quality_badge: null` |
| Registration / login layout does not expose option data | **PASS** | Forms contain profile/auth fields only |
| Horizontal overflow on all 10 routes | **PASS** | `scrollWidth === 375` on each checked page |
| Raw Option Linkage Ban | **PASS** | Spot-check observational only; no new logging/tracking introduced |

---

## 6. FU-292-01 Resolution

| Field | Value |
|-------|-------|
| **FU-292-01** original item | H-4 mobile ~375px layout not independently measured in Phase 292 |
| Phase 297 action | Independent 375px viewport spot-check on 10 primary public routes |
| **FU-292-01 status** | **CLOSED — spot-check PASS** |
| Remaining follow-up | None required for mobile 375px layout from this spot-check |

**FU-292-02** (BL-286-02 dual copy-source maintenance) remains open — out of Phase 297 scope; no constant merge performed.

---

## 7. Optional Non-Blocking Observation (Recorded Only)

| ID | Item | Severity | Action |
|----|------|----------|--------|
| OBS-297-01 | `/vote/demo` and `/results/demo` demo shells may show loading placeholder in title area during brief observation window while demo JS hydrates | low | Observational only; **not** a 375px layout defect; no runtime fix in Phase 297 |

---

## 8. Session Summary

| Metric | Value |
|--------|-------|
| Routes checked | 10 / 10 |
| **PASS** | 10 |
| **FAIL** | 0 |
| **BLOCKED** | 0 |
| **NEEDS FOLLOW-UP** | 0 |
| **Overall mobile 375px spot-check result** | **PASS** |

**No layout defects requiring a separate presentation-only fix phase were identified at 375px.**

---

## 9. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-297-public-mvp-mobile-375px-spot-check-record-v1.md` | this document |
| `tests/docs/phase-297-public-mvp-mobile-375px-spot-check-record-doc.test.ts` | doc tests |
| `tests/frontend/phase-297-public-mvp-mobile-375px-spot-check-record.test.ts` | QA record guards |
| `README.md` | Phase 297 index |

Phase 297 itself is **QA record / review-only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no CSS / layout change**
- **no copy change**
- **no migration**

**No `public/`, `src/`, or migration changes.**

`design-drafts/` excluded from commit.

---

## 10. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- ineligible vs nonexistent `option_index` user-visible response must remain indistinguishable
- result visibility / lifecycle state machine / result evaluator unchanged
- collecting / cancelled / unpublished hidden aggregate unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- profile: `birth_year_month` / `residential_region` only
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; presentation-only; not expanded
- actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts; no production configuration change
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 11. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 12. Conclusion

**Mobile 375px spot-check recorded — overall PASS.**

Phase 297 closes **FU-292-01** with independent narrow-viewport verification. No runtime, CSS, layout, or copy changes were made. Any future layout defect found on other viewports or devices requires a separate numbered presentation-only phase.

**This phase does not execute release, deploy, or formal launch.**

**Phase 298 blockers: none identified.**

---

## 13. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 297 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
