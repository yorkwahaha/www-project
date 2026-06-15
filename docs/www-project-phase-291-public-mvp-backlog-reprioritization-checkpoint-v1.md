# WWW Project Phase 291 — Public MVP Backlog Reprioritization Checkpoint v1

**Status:** review checkpoint / planning only — docs, guard tests, and README index only. Reprioritizes the post-authorization Public MVP backlog after [Phase 290 post-copy polish checkpoint](./www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md) archived the Phase 285–289 copy polish arc — without deploying, modifying runtime, adding deploy scripts, or changing production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This phase does not perform deployment. This phase does not modify runtime. This phase does not add deploy scripts. This phase does not change production configuration.**

**Backlog reprioritization items in this document are candidates only — not implementation approval.** **Any runtime change requires a separate numbered phase.** **Deployment must be separately executed and recorded.**

**Baseline HEAD:** `45bb501` (`origin/master` after Phase 290 public MVP post-copy polish checkpoint).

**Prior arc:**

- [Phase 281 post-authorization maintenance / next workstream plan](./www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md)
- [Phase 282 post-authorization product backlog seed plan](./www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md)
- [Phase 290 post-copy polish checkpoint](./www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md) — **Phases 285–289 archived**

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; no deploy scripts added; no production configuration changed. See [Phase 280 final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) and [Phase 284 cross-link implementation](./www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md).

---

## 1. Checkpoint Purpose

Phase 291 confirms current post-authorization status after Phase 290, records which seed backlog items are **complete**, and reprioritizes **remaining** work into risk tiers suitable for model selection and human approval.

This phase answers:

1. Is the Phase 285–289 copy polish arc closed?
2. What is the authoritative release / deployment status?
3. Which backlog items remain and in what priority order?
4. What should **not** be started now?
5. What are **candidate directions** for Phases 292–295 (plan only — no implementation)?

---

## 2. Current Status Confirmation

| Field | Value |
|-------|-------|
| **Checkpoint baseline** | `45bb501` |
| Phase 285–289 copy polish arc | **Archived** by Phase 290 |
| Launch approved for manual release preparation | **YES** |
| Operator release execution authorized | **YES** |
| **Actual deployment executed** | **NO — NOT EXECUTED** |
| No deploy scripts added | **Confirmed** |
| No production configuration changed | **Confirmed** |
| Project formally launched | **NO** |

### 2.1 Completed backlog items (Phase 281–290)

| Item ID | Summary | Closed by |
|---------|---------|-----------|
| BL-282-02 | Public MVP copy consistency review | Phase 286 |
| BL-282-03 | Release docs cross-link consolidation | Phase 283 plan + Phase 284 implementation |
| BL-282-07 | Explore feed empty-state messaging | Phase 285 |
| BL-286-01 | Login account-flow card browser-session wording | Phase 287 |
| — | My-polls empty-state copy polish | Phase 288 |
| — | FAQ copy alignment (not-launched / neutral vote) | Phase 289 |
| — | Post-copy polish arc consolidation | Phase 290 |

### 2.2 Open backlog items (reprioritized below)

| Item ID | Original category | Status |
|---------|-------------------|--------|
| BL-282-01 | post-release monitoring notes | **Open** — execute after W-1 |
| BL-282-04 | manual QA follow-up | **Open** — recommended before W-1 |
| BL-282-05 | future production hardening | **Open** — high-risk; explicit review required |
| BL-282-06 | vote-page error UX evaluation | **Open** — high-risk; plan-only gate first |
| BL-282-08 | archive superseded checkpoint notes | **Partially addressed** — Phase 283/284 planned cross-links; physical archive/rename still open |
| BL-286-02 | dual copy sources (`public-page-copy.js` + `public-mvp-ui.js`) | **Open** — docs/guard maintenance only; **do not merge constants ad hoc** |

---

## 3. Reprioritized Backlog

> **All rows below remain candidates only — not approved for implementation.**

### 3.1 Low-risk — suitable for Composer / Gemini fast models

Presentation-only, docs-only, or guard-maintenance work with no API/DB/auth/vote/result/lifecycle change.

| Priority | Item | Summary | Suggested model | Next action |
|----------|------|---------|-----------------|-------------|
| P1 | BL-282-08 (continuation) | Docs-only phase index / archive pointer maintenance for superseded checkpoints | Composer / Gemini | Separate docs-only numbered phase |
| P2 | BL-286-02 (maintenance mode) | Document dual-copy-source policy; add guard tests only — **no constant merge** | Composer / Gemini | Docs/guards only unless dedicated merge phase approved |
| P3 | BL-282-01 (pre-W-1 draft) | Draft operator post-release smoke checklist placeholders (routes only; no analytics/APM) | Composer / Gemini | Docs-only; record for use **after** W-1 |
| P4 | Presentation polish (new) | CSS/layout/spacing/accessibility label tweaks without copy-semantics or API change | Composer / Gemini | Separate presentation-only phase per surface |
| P5 | README / phase index hygiene | Keep Phase 292+ index entries and arc tables current | Composer / Gemini | Docs-only with each numbered phase |

### 3.2 Medium-risk — requires fuller guard tests and review checkpoint

Operator-facing or cross-surface work that touches multiple routes but should still avoid backend drift.

| Priority | Item | Summary | Suggested model | Next action |
|----------|------|---------|-----------------|-------------|
| M1 | BL-282-04 | Re-run Phase 268 manual QA runbook on current `HEAD` before operator release | Composer + human operator | Record pass/fail; no runtime fix in same phase |
| M2 | Share / a11y regression review | Re-check keyboard focus, reduced motion, copy/share feedback across public shells | Composer + review checkpoint | Docs/guards + optional presentation-only fixes in separate phase |
| M3 | Static HTML fallback audit | Verify P0/P1 shells still match `PUBLIC_*` allowlists after copy polish arc | Composer + review checkpoint | Checkpoint only unless clear bug |
| M4 | Demo vs live copy boundary review | Confirm `?live=1` / `?creator=1` banners still distinct and accurate | Composer + review checkpoint | Docs/guards preferred |

### 3.3 High-risk — requires GPT-5.5-class reasoning and/or explicit human decision

Any work that can affect privacy, vote integrity, auth, schema, governance, deployment, or production configuration.

| Priority | Item | Summary | Suggested model | Next action |
|----------|------|---------|-----------------|-------------|
| H1 | W-1 (Phase 281) | Actual operator release execution and record update | **Human operator** + GPT-5.5 for record drafting | Separately executed and recorded; updates Phase 279 successor to EXECUTED |
| H2 | BL-282-05 | Production hardening (secrets rotation, supervisor, infra) | GPT-5.5 + human | Explicit review before any implementation phase |
| H3 | BL-282-06 | Vote-page error UX without changing vote transaction order | GPT-5.5 | **Plan-only phase first**; privacy/vote integrity review mandatory |
| H4 | Copy constant consolidation | Merge overlapping `public-page-copy.js` / `public-mvp-ui.js` constants | GPT-5.5 | **Dedicated numbered phase only** — not ad hoc cleanup |
| H5 | Auth / session / schema / privacy / governance | Any `UserAuthResolver`, registration/login/session, profile schema, admin correction, or Raw Option Linkage Ban adjacent work | GPT-5.5 + human | Separate high-risk numbered phase with explicit approval |
| H6 | Vote / result / lifecycle runtime | Official Vote transaction, vote-by-index resolve order, result evaluator, lifecycle state machine | GPT-5.5 + human | Bugfix-only separate phase; no drive-by refactors |
| H7 | `quality_badge` expansion | New badge states, counters, ranking use, creator score | GPT-5.5 + human | **Not recommended** in current post-authorization window |

---

## 4. Not Recommended Now

Do **not** start these without a dedicated, explicitly approved numbered phase and the appropriate risk review:

| Category | Examples | Reason |
|----------|----------|--------|
| **Production deployment execution** | Running W-1 operator release without recorded pre-gates and post-release smoke | Deployment must be separately executed and recorded |
| **Deploy script / config change** | Adding `npm run deploy`, CI deploy workflow, production env files in repo | Violates current NOT EXECUTED boundary |
| **Auth / session / schema / privacy / governance** | Auto-login, new session fields, profile expansion, admin workflow changes | High-risk; MVP boundaries fixed |
| **Copy constant merge** | Collapsing `public-page-copy.js` and `public-mvp-ui.js` overlapping leads without a dedicated phase | BL-286-02 — regression risk across all public routes |
| **Analytics / metrics / APM / debug tracking** | Client or server telemetry linking users to options | Raw Option Linkage Ban |
| **`quality_badge` expansion** | Negative badges, counts, ranking signals | Governance and display integrity |
| **Hidden aggregate exposure** | Showing vote counts/percentages during collecting | Result visibility rules |
| **Ranking / recommendation / personalization** | Feed ordering beyond freshness-only | Wonder Flow rules |
| **Formal launch claims** | Public copy or docs stating product is live for general audience | Actual deployment NOT EXECUTED |

---

## 5. Suggested Phase 292–295 Candidate Directions (Plan Only)

These are **direction candidates only** — Phase 291 does **not** approve implementation.

| Phase | Candidate direction | Backlog linkage | Risk | Type |
|-------|---------------------|-----------------|------|------|
| **292** | Manual QA follow-up execution record — re-run Phase 268 runbook on baseline `45bb501+`; record `PASS`/`FAIL`/`BLOCKED` per section; no runtime fixes in-phase | BL-282-04 | medium | record / checkpoint |
| **293** | Post-release monitoring notes draft — operator smoke checklist placeholders for routes `/`, `/profile`, `/registration`, `/login`, `/explore`, `/vote`, `/results`, `/my-polls`; explicitly **for use after W-1** | BL-282-01 | low | docs / plan |
| **294** | Documentation archive / phase index maintenance — implement BL-282-08 archive pointers and README index for Phase 285–291 without delete/rename of historical docs | BL-282-08 | low | docs / guards |
| **295** | Vote-page error UX evaluation **plan** — scope BL-282-06 as plan-only: neutral error copy, no vote transaction order change, no option/user linkage in logs; implementation deferred to a later phase after plan review | BL-282-06 | high (plan-only) | plan |

**Explicitly deferred (not assigned to 292–295):**

- W-1 operator release execution — human operator; separate phase when ready
- BL-282-05 production hardening — after explicit security review
- BL-286-02 constant merge — only if a **dedicated** consolidation phase is approved
- Any auth/schema/vote/result/lifecycle runtime change

---

## 6. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md` | this document |
| `tests/frontend/phase-291-public-mvp-backlog-reprioritization-checkpoint.test.ts` | guard tests |
| `tests/docs/phase-291-public-mvp-backlog-reprioritization-checkpoint-doc.test.ts` | doc tests |
| `README.md` | Phase 291 index |

**No `public/`, `src/`, or migration changes.**

---

## 7. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- profile: `birth_year_month` / `residential_region` only
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; not used for ranking/recommendation/personalization/trust/score/governance
- no hidden aggregate in collecting results
- actual deployment **NOT EXECUTED**; no deploy scripts; no production configuration change
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 8. Validation

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

**APPROVED — Phase 291 public MVP backlog reprioritization checkpoint complete.**

Phase 285–289 copy polish is **archived**. Remaining backlog is reprioritized into low / medium / high risk tiers. Phases 292–295 candidate directions are recorded as **plan-only suggestions**.

**This phase does not perform deployment. This phase does not modify runtime.**

**Phase 292 blockers: none identified.**

---

## 10. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
