# WWW Project Phase 283 — Public MVP Documentation Cleanup / Release Docs Cross-Link Plan v1

**Status:** plan only — docs + guard tests + README index. Plans documentation cleanup and cross-linking for Public MVP release/authorization/operator documents after [Phase 282 product backlog seed plan](./www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md) — addressing backlog candidates **BL-282-03** and **BL-282-08** as planning/documentation cleanup only. Does not deploy, modify runtime, add deploy scripts, or change production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This phase does not perform deployment. This phase does not modify runtime. This phase does not add deploy scripts. This phase does not change production configuration.**

**Any actual documentation rename/delete/archive implementation requires a separate numbered phase if not done here.** **Any runtime bug must be fixed in a separate numbered phase.** **Any actual release execution must be separately executed and recorded.**

**Baseline HEAD:** `67431c9` (`origin/master` after Phase 282 post-authorization product backlog seed plan).

**Prior arc:**

- [Phase 282 public MVP post-authorization product backlog seed plan](./www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md)
- [Phase 281 public MVP post-authorization maintenance / next workstream plan](./www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md)
- [Phase 280 public MVP release authorization / not-executed status final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md)

---

## 1. Plan Purpose

Phase 283 is **plan only**. It plans **documentation cleanup** and **cross-link structure** for the Public MVP release/authorization/operator document arc (Phase 265–282). Phase 283 addresses Phase 282 backlog candidates **BL-282-03** (documentation cleanup) and **BL-282-08** (outdated checkpoint archive planning) without performing rename, delete, or archive operations on historical docs.

This plan answers:

1. What the current release status is and what this phase does **not** do.
2. How Phase 282 backlog items **BL-282-03** and **BL-282-08** map to this cleanup plan.
3. Which **documentation cleanup targets** should be cross-linked in a future implementation phase.
4. Which **cross-link arcs** organize the release/authorization/operator narrative.
5. Which **archive planning rules** govern historical docs.
6. That **documentation rename/delete/archive implementation** requires a **separate numbered phase** if not done here.
7. That **runtime bugs** require a **separate numbered phase**.
8. That **actual release execution** must be **separately executed and recorded**.

Phase 283 does **not** deploy. Phase 283 does **not** execute operator release.

**Plan keywords:** documentation cleanup; release docs cross-link plan; BL-282-03; BL-282-08; Actual deployment NOT EXECUTED; No deploy scripts added; does not modify production configuration; readiness arc; manual QA arc; launch decision arc; operator release arc; post-authorization backlog arc; do not delete historical docs in this phase; do not rename docs in this phase unless tests are updated; do not imply actual deployment happened; do not imply production configuration changed; separate numbered phase; separately executed and recorded.

---

## 2. Current Release Status

| Field | Value |
|-------|-------|
| **Plan baseline** | `67431c9` |
| Launch approved for manual release preparation | **YES** |
| Operator release execution authorized | **YES** |
| **Actual deployment executed** | **NO — NOT EXECUTED** |
| No deploy scripts added | **Confirmed** |
| No production configuration changed | **Confirmed** |
| Project launched | **NO** |
| Production deployment happened | **NO** |

---

## 3. Phase 282 Backlog Linkage

| Backlog ID | Category | Phase 283 scope |
|------------|----------|-----------------|
| **BL-282-03** | documentation cleanup | Consolidate Phase 273–281 operator handoff cross-links in README index and define cross-link arcs below |
| **BL-282-08** | documentation cleanup | Archive planning rules for superseded checkpoint notes with clear baseline HEAD references — plan only; no delete/rename in Phase 283 |

---

## 4. Proposed Documentation Cleanup Targets

Triage and cross-link planning only — no rename, delete, or content rewrite in Phase 283 unless explicitly scoped in a future numbered phase.

### 4.1 Phase 265–267 readiness docs

| Phase | Document | Role |
|-------|----------|------|
| 265 | [launch readiness checklist plan](./www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md) | Plan — readiness inventory |
| 266 | [launch readiness checklist checkpoint](./www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md) | Checkpoint — operator checklist |
| 267 | [launch readiness runtime review / final checkpoint](./www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md) | Final checkpoint — readiness arc exit |

### 4.2 Phase 268–271 manual QA docs

| Phase | Document | Role |
|-------|----------|------|
| 268 | [manual QA runbook / execution plan](./www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md) | Plan — operator QA steps |
| 269 | [manual QA dry-run checklist review / recording template checkpoint](./www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md) | Checkpoint — recording template |
| 270 | [manual QA execution record](./www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md) | Record — one QA pass |
| 271 | [manual QA pass review / freeze candidate checkpoint](./www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md) | Checkpoint — freeze candidate |

### 4.3 Phase 272–273 launch decision docs

| Phase | Document | Role |
|-------|----------|------|
| 272 | [launch decision packet / Go-No-Go review plan](./www-project-phase-272-public-mvp-launch-decision-packet-go-no-go-review-plan-v1.md) | Plan — Go/No-Go framework |
| 273 | [launch approval decision record](./www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md) | Record — launch approved for manual release preparation |

### 4.4 Phase 274–280 release/operator/NOT EXECUTED docs

| Phase | Document | Role |
|-------|----------|------|
| 274 | [manual release handoff / operator checklist plan](./www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md) | Plan — operator handoff |
| 275 | [release execution record template / final operator readiness checkpoint](./www-project-phase-275-public-mvp-release-execution-record-template-final-operator-readiness-checkpoint-v1.md) | Checkpoint — execution template |
| 276 | [manual release execution record](./www-project-phase-276-public-mvp-manual-release-execution-record-v1.md) | Record — NOT EXECUTED |
| 277 | [manual release pre-execution gate review](./www-project-phase-277-public-mvp-manual-release-pre-execution-gate-review-v1.md) | Review — pre-execution gate |
| 278 | [manual release execution authorization record](./www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md) | Record — operator authorized |
| 279 | [manual release execution record / operator result](./www-project-phase-279-public-mvp-manual-release-execution-record-operator-result-v1.md) | Record — NOT EXECUTED |
| 280 | [release authorization / not-executed status final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) | Checkpoint — authorization arc exit |

### 4.5 Phase 281–282 next workstream/backlog docs

| Phase | Document | Role |
|-------|----------|------|
| 281 | [post-authorization maintenance / next workstream plan](./www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md) | Plan — allowed next workstreams |
| 282 | [post-authorization product backlog seed plan](./www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md) | Plan — backlog seed BL-282-01–08 |

---

## 5. Proposed Cross-Link Structure

Five narrative arcs for README index and inter-doc navigation (implementation in a future numbered phase if approved):

| Arc | Phases | Entry doc | Exit doc | Status note |
|-----|--------|-----------|----------|-------------|
| **readiness arc** | 265 → 266 → 267 | Phase 265 plan | Phase 267 final checkpoint | **APPROVED — launch readiness final checkpoint complete**; not launch approval |
| **manual QA arc** | 268 → 269 → 270 → 271 | Phase 268 runbook | Phase 271 freeze candidate checkpoint | Phase 270 **PASS**; not launch approval |
| **launch decision arc** | 272 → 273 | Phase 272 Go-No-Go plan | Phase 273 approval record | **APPROVED — launch approved for manual release preparation** |
| **operator release arc** | 274 → 275 → 276 → 277 → 278 → 279 → 280 | Phase 274 handoff plan | Phase 280 final checkpoint | Operator **AUTHORIZED**; actual deployment **NOT EXECUTED** |
| **post-authorization backlog arc** | 281 → 282 → 283 | Phase 281 workstream plan | Phase 283 cross-link plan (this doc) | Plan-only; backlog candidates only |

Post-release smoke routes reference: `/`, `/profile`, `/registration`, `/login`, `/explore`, `/vote`, `/results`, `/my-polls`.

---

## 6. Archive Planning Rules

| Rule | Status |
|------|--------|
| **Do not delete historical docs in this phase** | **Required** |
| **Do not rename docs in this phase unless tests are updated** | **Required** |
| **Do not imply actual deployment happened** | **Required** |
| **Do not imply production configuration changed** | **Required** |
| Superseded checkpoint notes retain baseline HEAD references when archived in a future phase | **Planned** |
| README index remains authoritative navigation; cross-links supplement, not replace | **Required** |

---

## 7. Separation Rules

| Rule | Status |
|------|--------|
| This phase is **plan only** | **Confirmed** |
| This phase does **not perform deployment** | **Confirmed** |
| This phase does **not add deploy scripts** | **Confirmed** |
| This phase does **not modify production configuration** | **Confirmed** |
| This phase does **not modify runtime** | **Confirmed** |
| **Any actual documentation rename/delete/archive implementation requires a separate numbered phase if not done here** | **Required** |
| **Any runtime bug must be fixed in a separate numbered phase** | **Required** |
| **Any actual release execution must be separately executed and recorded** | **Required** |
| Post-release smoke must be **recorded** after any real deployment | **Required** |
| Abort / rollback / incident / follow-up must be **recorded if triggered** | **Required** |

---

## 8. Disallowed Actions (This Phase)

| Action | Status |
|--------|--------|
| deployment | **Disallowed** |
| production configuration changes | **Disallowed** |
| deploy script additions | **Disallowed** |
| runtime changes | **Disallowed** |
| API changes | **Disallowed** |
| DB / migration / schema changes | **Disallowed** |
| backend / auth / vote / result / creator / profile / privacy changes | **Disallowed** |
| historical doc delete | **Disallowed** |
| historical doc rename (without test update in same phase) | **Disallowed** |

---

## 9. Fixed Boundaries (Unchanged)

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

## 10. Phase 283 Delivery (This Phase)

Phase 283 itself is **plan only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes**
- **no backend / auth / vote / result / creator / profile changes**
- **no deploy scripts or production configuration**
- **no deployment performed**
- **no historical doc delete or rename**

Added:

1. `docs/www-project-phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-v1.md` (this document)
2. `tests/docs/phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-doc.test.ts`
3. `tests/frontend/phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan.test.ts`
4. README Phase 283 index

`design-drafts/` excluded from commit.

---

## 11. Focused Guard Tests

- `tests/frontend/phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan.test.ts`
- `tests/docs/phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-doc.test.ts`

Phase 265–282 guard tests remain baseline.

---

## 12. Validation (Phase 283 commit)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 13. Conclusion

**Phase 283 is plan-only — documentation cleanup / release docs cross-link plan complete.**

Current status: **launch approved for manual release preparation**; **operator release execution authorized**; **actual deployment NOT EXECUTED**; **no deploy scripts added**; **no production configuration changed**.

Addresses BL-282-03 (documentation cleanup cross-links) and BL-282-08 (archive planning rules). Defines five cross-link arcs: readiness, manual QA, launch decision, operator release, post-authorization backlog.

**This phase does not perform deployment. This phase does not add deploy scripts. This phase does not modify production configuration.** **Documentation rename/delete/archive implementation requires a separate numbered phase if not done here.** **Runtime bugs require a separate numbered phase.** **Actual release execution must be separately executed and recorded.**

**Phase 284 blockers: none identified.**

---

## 14. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 283 is a docs/guards-only plan. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
