# WWW Project Phase 274 — Public MVP Manual Release Handoff / Operator Checklist Plan v1

**Status:** plan only — docs + guard tests + README index. Translates the [Phase 273 launch approval decision record](./www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md) into an operator-facing manual release handoff and checklist — without deploying, modifying runtime, adding deploy scripts, or changing production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This phase does not perform deployment. This phase does not modify runtime. This phase does not add deploy scripts. This phase does not change production configuration.**

**Baseline HEAD:** `0fee2f0` (`origin/master` after Phase 273 public MVP launch approval decision record).

**Prior approval:** [Phase 273 public MVP launch approval decision record](./www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md).

**Related operator context:**

- [Phase 268 manual QA runbook / execution plan](./www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md) — pre-cutover browser QA
- [Phase 272 launch decision packet / Go-No-Go review plan](./www-project-phase-272-public-mvp-launch-decision-packet-go-no-go-review-plan-v1.md) — Go/No-Go and rollback fields

---

## 1. Plan Purpose

Phase 274 is **plan only**. It prepares the **manual release handoff** operators need after Phase 273 approved Public MVP launch for **manual release preparation**.

This plan answers:

1. What Phase 273 approved and what this phase does **not** do.
2. What operators must verify **before** any separately executed deployment.
3. Which environment readiness checks apply.
4. Which validation commands must pass on the release candidate commit.
5. What placeholders exist for manual release execution, post-release smoke, abort/rollback, and incident recording.
6. That **runtime bugs** require a **separate numbered phase**.
7. That **any actual deployment** must be **separately executed and recorded** in a future phase.

Phase 274 does **not** deploy. Phase 274 does **not** approve production deployment.

**Operator checklist keywords:** operator pre-release checklist; environment readiness checklist; required pre-release validation commands; manual release execution checklist placeholder; post-release smoke checklist placeholder; abort / rollback trigger checklist; incident / follow-up recording template.

---

## 2. Phase 273 Approval Summary

| Field | Value |
|-------|-------|
| Launch approval ID | `phase-273-2026-06-15` |
| Approval baseline | `dd76de4` |
| Decision | **APPROVED — Public MVP launch approved for manual release preparation** |
| Go evidence | **15 / 15 Confirmed** |
| No-Go triggers | **12 / 12 Clear** |
| Phase 270 manual QA | **PASS** — no FAIL / BLOCKED / NEEDS FOLLOW-UP |
| Production deployment authorized | **NO** |
| Deployment executed in Phase 273 | **NO** |

**Phase 273 explicit limits carried forward:**

- not production deployment
- no runtime modification in approval phase
- no production configuration change in approval phase
- deployment / handoff / operator execution → **this plan prepares checklists; execution remains separate**

---

## 3. Operator Pre-Release Checklist

Complete before any separately executed deployment. Mark each item **Done** / **Open** / **N/A**.

| # | Check | Source | Status |
|---|-------|--------|--------|
| PR-1 | Confirm release candidate commit SHA matches approved baseline or documented successor | Phase 273 §1 | |
| PR-2 | Re-run Phase 268 manual QA runbook (sections 3.1–3.10) on release candidate | Phase 268 | |
| PR-3 | Confirm no open FAIL / BLOCKED / NEEDS FOLLOW-UP from latest QA session | Phase 270 template | |
| PR-4 | Confirm `git diff --check` clean on release branch | Phase 268 gates | |
| PR-5 | Confirm protected paths unchanged without numbered phase: `src/`, `migrations/`, `public/*.html`, `public/frontend/*` | Phase 273 G-14 | |
| PR-6 | Confirm vote-by-index payload remains `{ option_index }` only | Privacy guards | |
| PR-7 | Confirm registration does not auto-login; no post-success `GET /users/me` | Auth guards | |
| PR-8 | Confirm `/users/me` fields: `user_id` + `display_name` only | Profile boundary | |
| PR-9 | Confirm profile fields: `birth_year_month` / `residential_region` only | Profile boundary | |
| PR-10 | Confirm `quality_badge` presentation-only (`positive_feedback` →「回饋良好」) | Badge guards | |
| PR-11 | Confirm Raw Option Linkage Ban — no durable user-option linkage introduced | AGENTS.md | |
| PR-12 | Confirm no `localStorage` / `sessionStorage` / analytics / APM / debug tracking added | Privacy guards | |
| PR-13 | Human operator sign-off recorded for release candidate | Phase 273 §1 | |
| PR-14 | Rollback commit documented (default: last known-good baseline) | Phase 273 §7 | |
| PR-15 | Open runtime bugs triaged — fixes require **separate numbered phase** | Separation rules | |

---

## 4. Environment Readiness Checklist

| # | Environment item | Requirement | Status |
|---|------------------|-------------|--------|
| ER-1 | Node.js | 20+ on operator build host | |
| ER-2 | PostgreSQL | Production/staging DB reachable; migrations reviewed | |
| ER-3 | `DATABASE_URL` | Set for target environment; not `www_test` unless intentional staging | |
| ER-4 | Docker (if used locally) | `docker-compose.test.yml` only for local `www_test` — not production substitute | |
| ER-5 | Secrets | `ADMIN_AUTH_CREDENTIALS_JSON` and session secrets configured out-of-band — **not committed** | |
| ER-6 | Port / reverse proxy | HTTP listener and TLS termination planned | |
| ER-7 | Lifecycle scheduler | Operator knows `npm run scheduler:lifecycle` is manual/cron — not auto-deployed | |
| ER-8 | Backup / restore | DB backup before cutover documented | |
| ER-9 | Monitoring | Operator incident contact path defined (no new APM in repo) | |
| ER-10 | Demo seed data | Fake demo voters (`demo:public:local`) **not** copied to production | |

---

## 5. Required Pre-Release Validation Commands

Run on the **release candidate commit** before any separately executed deployment:

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

Optional (environment permitting):

```bash
npm run test:integration:local
npm run smoke:admin:local
```

| Command | Purpose | Pass required |
|---------|---------|---------------|
| `git diff --check` | Whitespace/conflict hygiene | Yes |
| `npm test` | Unit + guard regression | Yes |
| `npm run typecheck` | TypeScript compile check | Yes |
| `npm run build` | `dist/` build | Yes |
| `npm run migrate:check` | Migration file validation | Yes |
| `npm run smoke:public:local` | Public HTTP flow on isolated `www_test` | Yes |
| `npm run test:integration:local` | PostgreSQL integration (optional) | Recommended |
| `npm run smoke:admin:local` | Admin smoke on `www_test` (optional) | Recommended |

Record command outputs in the deployment execution record phase — not in this plan.

---

## 6. Manual Release Execution Checklist (Placeholder)

**Placeholder only.** Operators complete this section during a **separately executed and recorded** deployment phase. Phase 274 does not execute these steps.

| Step | Action | Operator | Timestamp | Result |
|------|--------|----------|-----------|--------|
| RE-1 | Tag or record release candidate SHA | | | |
| RE-2 | Apply migrations (`npm run migrate`) on target DB | | | |
| RE-3 | Deploy `dist/` + `public/` artifacts to target host | | | |
| RE-4 | Set environment variables (secrets out-of-band) | | | |
| RE-5 | Start HTTP server (`npm start` or process supervisor) | | | |
| RE-6 | Verify health endpoint / home page loads | | | |
| RE-7 | Record deployment phase ID and operator sign-off | | | |

---

## 7. Post-Release Smoke Checklist (Placeholder)

**Placeholder only.** Complete after deployment in a separate execution record phase.

| # | Check | Route / API | Result | Notes |
|---|-------|-------------|--------|-------|
| PS-1 | Home loads | `GET /` | | |
| PS-2 | Profile shell | `GET /profile` | | |
| PS-3 | Registration shell | `GET /registration` | | |
| PS-4 | Login shell | `GET /login` | | |
| PS-5 | Explore feed | `GET /explore`, `GET /polls/feed` | | |
| PS-6 | Vote page shell | `GET /vote/:pollId` | | |
| PS-7 | Results display-safe API | `GET /polls/:pollId/results` | | No shard/token leak |
| PS-8 | Creator flow (if enabled) | `POST /creator/session`, `GET /creator/polls` | | |
| PS-9 | My-polls shell | `GET /my-polls` | | |
| PS-10 | Phase 268 spot-check subset | Browser | | Subset of §3.1–3.10 |

---

## 8. Abort / Rollback Trigger Checklist

Abort cutover or initiate rollback if any trigger fires. Do not patch around these in operator notes without a **separate numbered phase**.

| # | Abort / rollback trigger | Action |
|---|--------------------------|--------|
| AB-1 | Pre-release validation command fails | **Abort** — fix in numbered phase; re-run gates |
| AB-2 | Phase 268 re-QA records **FAIL** | **Abort** — fix in numbered phase; re-QA |
| AB-3 | Migration apply error on target DB | **Abort** — restore from backup; incident record |
| AB-4 | Vote path error or duplicate-vote integrity failure post-cutover | **Rollback** — revert to rollback commit; incident record |
| AB-5 | Auth/session leak suspected (registration auto-login, wrong `/users/me` fields) | **Rollback** — auth fix phase required |
| AB-6 | Result visibility leak (hidden aggregate on collecting/cancelled/unpublished) | **Rollback** — result fix phase required |
| AB-7 | `option_id` or user-option linkage in logs/metrics/errors | **Rollback** — privacy fix phase required |
| AB-8 | Undeclared `src/` / migration / public delivery drift at cutover SHA | **Abort** — reconcile in numbered phase |
| AB-9 | Operator loses sign-off confidence | **Abort** — document reason; re-review Phase 273 limits |

**Default rollback commit:** `0fee2f0` (Phase 274 plan baseline) unless superseded by a documented post-approval baseline.

---

## 9. Incident / Follow-Up Recording Template

Use when abort, rollback, or post-release follow-up is required. Status vocabulary: **OPEN** / **RESOLVED** / **DEFERRED**.

| Field | Value |
|-------|-------|
| Incident ID | e.g. `incident-YYYY-MM-DD-NNN` |
| Date / time | |
| Operator | |
| Release candidate SHA | |
| Trigger (AB-n or custom) | |
| Summary | |
| User impact | |
| Privacy / integrity impact | Does this involve option_id or user-option linkage? **must be NO** |
| Rollback performed | Yes / No |
| Rollback commit | |
| Follow-up phase ID | **separate numbered phase** required for runtime fixes |
| Phase 268 re-QA required | Yes / No |
| Status | OPEN / RESOLVED / DEFERRED |

**Do not store durable user-option linkage in incident notes.**

---

## 10. Separation Rules

| Rule | Status |
|------|--------|
| Any runtime bug must be fixed in a **separate numbered phase** | **Required** |
| Any actual deployment must be **separately executed and recorded** | **Required** |
| Phase 274 is plan-only | **Confirmed** |
| Phase 274 does not perform deployment | **Confirmed** |
| Phase 274 does not add deploy scripts | **Confirmed** |
| Phase 274 does not change production configuration | **Confirmed** |
| Phase 274 does not modify runtime | **Confirmed** |

---

## 11. Fixed Boundaries (Unchanged)

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

## 12. Phase 274 Delivery (This Phase)

Phase 274 itself is **plan only**:

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

1. `docs/www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md` (this document)
2. `tests/docs/phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-doc.test.ts`
3. `tests/frontend/phase-274-public-mvp-manual-release-handoff-operator-checklist-plan.test.ts`
4. README Phase 274 index

`design-drafts/` excluded from commit.

---

## 13. Focused Guard Tests

- `tests/frontend/phase-274-public-mvp-manual-release-handoff-operator-checklist-plan.test.ts`
- `tests/docs/phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-doc.test.ts`

Phase 265–273 guard tests remain baseline.

---

## 14. Validation (Phase 274 commit)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 15. Conclusion

**Phase 274 is plan-only.** The manual release handoff translates Phase 273 **APPROVED — Public MVP launch approved for manual release preparation** into operator pre-release, environment readiness, validation command, execution placeholder, post-release smoke placeholder, abort/rollback, and incident recording checklists.

**This phase does not perform deployment.** Runtime bugs require a **separate numbered phase**. Any actual deployment must be **separately executed and recorded**.

**Phase 275 blockers: none identified.**

---

## 16. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 274 is plan documentation and guard tests only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
