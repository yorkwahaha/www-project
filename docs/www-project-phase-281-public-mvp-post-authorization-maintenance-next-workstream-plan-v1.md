# WWW Project Phase 281 — Public MVP Post-Authorization Maintenance / Next Workstream Plan v1

**Status:** plan only — docs + guard tests + README index. Defines post-authorization maintenance and next workstream options after [Phase 280 final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) — without deploying, modifying runtime, adding deploy scripts, or changing production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This phase does not perform deployment. This phase does not modify runtime. This phase does not add deploy scripts. This phase does not change production configuration.**

**Any runtime bug must be fixed in a separate numbered phase.** **Any actual release execution must be separately executed and recorded.** **Post-release smoke must be recorded after any real deployment.** **Abort / rollback / incident / follow-up must be recorded if triggered.**

**Baseline HEAD:** `bfc1dd3` (`origin/master` after Phase 280 release authorization / not-executed status final checkpoint).

**Prior arc:**

- [Phase 280 public MVP release authorization / not-executed status final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md)
- [Phase 278 public MVP manual release execution authorization record](./www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md)
- [Phase 274 public MVP manual release handoff / operator checklist plan](./www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md)

---

**Release docs arc navigation (Phase 284):** **post-authorization backlog/docs arc** (entry) — ← [Phase 280](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) · **Phase 281** · [Phase 282](./www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md) → · ← [operator release arc exit](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md)

**Authoritative current release status (Phase 284):** manual release preparation approved per Phase 273; operator release execution authorized; Actual deployment NOT EXECUTED; no deploy scripts added; no production configuration changed. Historical phase baselines do not imply deployment or production configuration change. See [Phase 280 final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) and [Phase 284 implementation](./www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md).

## 1. Plan Purpose

Phase 281 is **plan only**. It defines **post-authorization maintenance** and **next workstream** options after Phase 280 confirmed:

- launch approved for manual release preparation
- operator release execution authorized
- actual deployment **NOT EXECUTED**

This plan answers:

1. What the current release status is and what this phase does **not** do.
2. Which **allowed next workstreams** may proceed as separate numbered phases.
3. Which actions are **disallowed** in this plan phase.
4. Which **backlog categories** may be triaged without deployment.
5. That **runtime bugs** require a **separate numbered phase**.
6. That **actual release execution** must be **separately executed and recorded**.

Phase 281 does **not** deploy. Phase 281 does **not** execute operator release.

**Plan keywords:** post-authorization maintenance; next workstream plan; Actual deployment NOT EXECUTED; No deploy scripts added; does not modify production configuration; post-release smoke must be recorded; abort / rollback / incident / follow-up must be recorded if triggered; runtime/API/DB/backend/auth/vote/result/creator/profile/privacy changes; actual operator release execution and record update / separate phase; runtime bugfix phase; post-authorization product backlog planning; post-release monitoring notes; product polish candidates; documentation cleanup; manual QA follow-up; future production hardening candidates; separately executed and recorded; separate numbered phase.

---

## 2. Current Release Status (from Phase 280)

| Field | Value |
|-------|-------|
| Checkpoint baseline | `274369f` (Phase 280) |
| **Plan baseline** | `bfc1dd3` |
| Launch approved for manual release preparation | **YES** |
| Operator release execution authorized | **YES** |
| **Actual deployment executed** | **NO — NOT EXECUTED** |
| No deploy scripts added (Phase 273–280) | **Confirmed** |
| No production configuration changed (Phase 273–280) | **Confirmed** |
| Project launched | **NO** |
| Production deployment happened | **NO** |

---

## 3. Allowed Next Workstreams

Proceed only as **separate numbered phases**. This plan does not execute them.

| # | Workstream | Description | Recording requirement |
|---|------------|-------------|----------------------|
| W-1 | **Actual operator release execution and record update / separate phase** | Operator runs Phase 274 handoff + Phase 275 templates per Phase 278 authorization; updates Phase 279 or successor record to **EXECUTED** | released commit; release timestamp; operator note; post-release smoke result; abort / rollback status; incident / follow-up status |
| W-2 | **Runtime bugfix phase** | Fix runtime/API/DB/auth/vote/result/creator/profile/privacy bugs found during QA or release checks | Separate numbered phase only; no silent hotfix in plan phase |
| W-3 | **Post-authorization product backlog planning** | Triage backlog categories below without deployment | Plan/docs only unless separate implementation phase approved |

**Pre-release gates for W-1 (operator must run before any actual manual release):**

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

Post-release smoke routes reference: `/`, `/profile`, `/registration`, `/login`, `/explore`, `/vote`, `/results`, `/my-polls`.

---

## 4. Disallowed Actions (This Phase)

| Action | Status |
|--------|--------|
| deployment | **Disallowed** |
| production configuration changes | **Disallowed** |
| deploy script additions | **Disallowed** |
| runtime changes | **Disallowed** |
| API changes | **Disallowed** |
| DB / migration / schema changes | **Disallowed** |
| backend / auth / vote / result / creator / profile / privacy changes | **Disallowed** |

---

## 5. Backlog Categories

Triage only — no implementation in Phase 281 unless a future numbered phase explicitly approves scope.

| Category | Scope notes |
|----------|-------------|
| **post-release monitoring notes** | Operator observability checklist placeholders; no analytics/APM/debug tracking that links options to users |
| **product polish candidates** | Copy, layout, UX friction — presentation-only; no vote/result/ranking integrity changes |
| **documentation cleanup** | README, phase docs, operator runbooks — docs only |
| **manual QA follow-up** | Re-run Phase 268 runbook on release candidate before W-1 |
| **future production hardening candidates** | Infra/secrets/supervisor notes — out-of-band; no production configuration change in repo without numbered phase |

---

## 6. Separation Rules

| Rule | Status |
|------|--------|
| This phase is **plan only** | **Confirmed** |
| This phase does **not perform deployment** | **Confirmed** |
| This phase does **not add deploy scripts** | **Confirmed** |
| This phase does **not modify production configuration** | **Confirmed** |
| This phase does **not modify runtime** | **Confirmed** |
| Any runtime bug must be fixed in a **separate numbered phase** | **Required** |
| Any actual release execution must be **separately executed and recorded** | **Required** |
| Post-release smoke must be **recorded** after any real deployment | **Required** |
| Abort / rollback / incident / follow-up must be **recorded if triggered** | **Required** |

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
- `quality_badge`: `positive_feedback` →「回饋良好」only; presentation-only
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 8. Phase 281 Delivery (This Phase)

Phase 281 itself is **plan only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes**
- **no backend / auth / vote / result / creator / profile changes**
- **no deploy scripts or production configuration**
- **no deployment performed**

Added:

1. `docs/www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md` (this document)
2. `tests/docs/phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-doc.test.ts`
3. `tests/frontend/phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan.test.ts`
4. README Phase 281 index

`design-drafts/` excluded from commit.

---

## 9. Focused Guard Tests

- `tests/frontend/phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan.test.ts`
- `tests/docs/phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-doc.test.ts`

Phase 265–280 guard tests remain baseline.

---

## 10. Validation (Phase 281 commit)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 11. Conclusion

**Phase 281 is plan-only — post-authorization maintenance / next workstream plan complete.**

Current status: **launch approved for manual release preparation**; **operator release execution authorized**; **actual deployment NOT EXECUTED**; **no deploy scripts added**; **no production configuration changed**.

Allowed next workstreams: (1) actual operator release execution and record update / separate phase, (2) runtime bugfix phase, (3) post-authorization product backlog planning.

**This phase does not perform deployment. This phase does not add deploy scripts. This phase does not modify production configuration.** **Runtime bugs require a separate numbered phase.** **Actual release execution must be separately executed and recorded.**

**Phase 282 blockers: none identified.**

---

## 12. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 281 is a docs/guards-only plan. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
