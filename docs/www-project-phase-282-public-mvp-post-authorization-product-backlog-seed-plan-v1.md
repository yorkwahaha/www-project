# WWW Project Phase 282 — Public MVP Post-Authorization Product Backlog Seed Plan v1

**Status:** plan only — docs + guard tests + README index. Seeds the post-authorization Public MVP product backlog after [Phase 281 maintenance / next workstream plan](./www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md) — without deploying, modifying runtime, adding deploy scripts, or changing production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This phase does not perform deployment. This phase does not modify runtime. This phase does not add deploy scripts. This phase does not change production configuration.**

**Backlog items in this document are candidates only — not implementation approval.** **Any runtime change requires a separate numbered phase.** **Deployment must be separately executed and recorded.** **Production hardening candidates require explicit review before implementation.**

**Baseline HEAD:** `68d2d6c` (`origin/master` after Phase 281 post-authorization maintenance / next workstream plan).

**Prior arc:**

- [Phase 281 public MVP post-authorization maintenance / next workstream plan](./www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md)
- [Phase 280 public MVP release authorization / not-executed status final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md)
- [Phase 278 public MVP manual release execution authorization record](./www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md)

---

**Release docs arc navigation (Phase 284):** **post-authorization backlog/docs arc** (middle) — ← [Phase 281](./www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md) · **Phase 282** · [Phase 283](./www-project-phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-v1.md) →

**Authoritative current release status (Phase 284):** manual release preparation approved per Phase 273; operator release execution authorized; Actual deployment NOT EXECUTED; no deploy scripts added; no production configuration changed. Historical phase baselines do not imply deployment or production configuration change. See [Phase 280 final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) and [Phase 284 implementation](./www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md).

## 1. Plan Purpose

Phase 282 is **plan only**. It **seeds** the post-authorization Public MVP **product backlog** after Phase 281 defined allowed next workstreams. Phase 282 does **not** approve implementation of any backlog item.

This plan answers:

1. What the current release status is and what this phase does **not** do.
2. Which **backlog categories** may be triaged without deployment.
3. Which **candidate backlog rules** govern follow-up work.
4. A small **seed backlog table** with item id, category, summary, risk level, and required next action — all marked **candidates only**.
5. That **runtime changes** require a **separate numbered phase**.
6. That **deployment** must be **separately executed and recorded**.

Phase 282 does **not** deploy. Phase 282 does **not** execute operator release.

**Plan keywords:** post-authorization product backlog seed plan; Actual deployment NOT EXECUTED; No deploy scripts added; does not modify production configuration; backlog items are not implementation approval; runtime changes require a separate numbered phase; deployment must be separately executed and recorded; production hardening candidates require explicit review before implementation; auth/privacy/vote/result/schema-related work must be treated as high-risk; post-release monitoring notes; product polish candidates; documentation cleanup; manual QA follow-up; future production hardening candidates; later runtime improvement candidates; candidates only.

---

## 2. Current Release Status

| Field | Value |
|-------|-------|
| **Plan baseline** | `68d2d6c` |
| Launch approved for manual release preparation | **YES** |
| Operator release execution authorized | **YES** |
| **Actual deployment executed** | **NO — NOT EXECUTED** |
| No deploy scripts added | **Confirmed** |
| No production configuration changed | **Confirmed** |
| Project launched | **NO** |
| Production deployment happened | **NO** |

---

## 3. Backlog Categories

Triage only — no implementation in Phase 282 unless a future numbered phase explicitly approves scope.

| Category | Scope notes |
|----------|-------------|
| **post-release monitoring notes** | Operator observability checklist placeholders after W-1 execution; no analytics/APM/debug tracking that links options to users |
| **product polish candidates** | Copy, layout, UX friction — presentation-only; no vote/result/ranking integrity changes |
| **documentation cleanup** | README, phase docs, operator runbooks — docs only |
| **manual QA follow-up** | Re-run Phase 268 runbook on release candidate before operator release execution |
| **future production hardening candidates** | Infra/secrets/supervisor notes — out-of-band; requires explicit review before implementation |
| **later runtime improvement candidates** | Performance, error UX, API ergonomics — separate numbered phase required; auth/privacy/vote/result/schema work is high-risk |

---

## 4. Candidate Backlog Rules

| Rule | Status |
|------|--------|
| **Backlog items are not implementation approval** | **Required** |
| **Runtime changes require a separate numbered phase** | **Required** |
| **Deployment must be separately executed and recorded** | **Required** |
| **Production hardening candidates require explicit review before implementation** | **Required** |
| **auth/privacy/vote/result/schema-related work must be treated as high-risk** | **Required** |
| This phase is **plan only** | **Confirmed** |
| This phase does **not perform deployment** | **Confirmed** |
| This phase does **not add deploy scripts** | **Confirmed** |
| This phase does **not modify production configuration** | **Confirmed** |
| This phase does **not modify runtime** | **Confirmed** |
| Post-release smoke must be **recorded** after any real deployment | **Required** |
| Abort / rollback / incident / follow-up must be **recorded if triggered** | **Required** |

---

## 5. Seed Backlog Table (Candidates Only)

> **All rows below are candidates only — not approved for implementation.**

| Item ID | Category | Summary | Risk level | Required next action |
|---------|----------|---------|------------|----------------------|
| BL-282-01 | post-release monitoring notes | Draft operator post-release smoke checklist placeholders (routes, profile, vote, results) | low | Record after W-1 deployment; no analytics/APM that links options to users |
| BL-282-02 | product polish candidates | Review public MVP copy consistency across home, explore, vote, results shells | low | Separate presentation-only phase if approved |
| BL-282-03 | documentation cleanup | Consolidate Phase 273–281 operator handoff cross-links in README index | low | Docs-only numbered phase |
| BL-282-04 | manual QA follow-up | Re-run Phase 268 manual QA runbook on release candidate before operator release | medium | Execute before W-1; record pass/fail |
| BL-282-05 | future production hardening candidates | Review secrets rotation and process supervisor notes (out-of-band) | high | Explicit review before any implementation phase |
| BL-282-06 | later runtime improvement candidates | Evaluate vote-page error UX without changing vote transaction order | high | Separate numbered phase; privacy/vote integrity review |
| BL-282-07 | later runtime improvement candidates | Evaluate explore feed empty-state messaging (presentation-only) | low | Separate numbered phase if approved |
| BL-282-08 | documentation cleanup | Archive superseded phase checkpoint notes with clear baseline HEAD references | low | Docs-only numbered phase |

---

## 6. Disallowed Actions (This Phase)

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

Post-release smoke routes reference: `/`, `/profile`, `/registration`, `/login`, `/explore`, `/vote`, `/results`, `/my-polls`.

---

## 8. Phase 282 Delivery (This Phase)

Phase 282 itself is **plan only**:

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

1. `docs/www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md` (this document)
2. `tests/docs/phase-282-public-mvp-post-authorization-product-backlog-seed-plan-doc.test.ts`
3. `tests/frontend/phase-282-public-mvp-post-authorization-product-backlog-seed-plan.test.ts`
4. README Phase 282 index

`design-drafts/` excluded from commit.

---

## 9. Focused Guard Tests

- `tests/frontend/phase-282-public-mvp-post-authorization-product-backlog-seed-plan.test.ts`
- `tests/docs/phase-282-public-mvp-post-authorization-product-backlog-seed-plan-doc.test.ts`

Phase 265–281 guard tests remain baseline.

---

## 10. Validation (Phase 282 commit)

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

**Phase 282 is plan-only — post-authorization product backlog seed plan complete.**

Current status: **launch approved for manual release preparation**; **operator release execution authorized**; **actual deployment NOT EXECUTED**; **no deploy scripts added**; **no production configuration changed**.

Backlog categories seeded: post-release monitoring notes, product polish candidates, documentation cleanup, manual QA follow-up, future production hardening candidates, later runtime improvement candidates. All seed items are **candidates only**.

**This phase does not perform deployment. This phase does not add deploy scripts. This phase does not modify production configuration.** **Runtime changes require a separate numbered phase.** **Deployment must be separately executed and recorded.** **Production hardening candidates require explicit review before implementation.**

**Phase 283 blockers: none identified.**

---

## 12. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 282 is a docs/guards-only plan. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
