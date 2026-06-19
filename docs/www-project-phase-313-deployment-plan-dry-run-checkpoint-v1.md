# WWW Project Phase 313 — Deployment Plan and Dry Run Checkpoint v1

**Status:** deployment plan and dry run checkpoint — docs + docs-test + README (+ static source guards) only. Translates [Phase 312 release readiness](./www-project-phase-312-public-mvp-release-readiness-checkpoint-v1.md) into an operator-facing deployment plan, local dry-run gate reaffirmation, and post-cutover smoke/monitoring expectations at `origin/master` commit `59b73cd`. **No runtime change** — **actual deployment NOT EXECUTED** in this phase.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/home/feed` contract, `/polls/feed` contract, logging, metrics, deploy scripts, or production configuration changed by Phase 313.**

**Reviewed commit:** `59b73cd` (`origin/master`, Phase 312 release readiness checkpoint).
**Prior checkpoint:** [Phase 312 public MVP release readiness](./www-project-phase-312-public-mvp-release-readiness-checkpoint-v1.md) — **APPROVED for release/deployment planning**; release blockers: none.
**Related operator context:** [Phase 274 manual release handoff plan](./www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md), [Phase 280 NOT EXECUTED checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md), [Local demo startup](./www-project-local-demo-startup-v1.md).

> **Phase-number note:** Phase 313 plans deployment and records a **local dry run** only. **This phase does not deploy** to production, does not add deploy scripts, and does not change production configuration.

**Authoritative release status (reaffirmed, unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

---

## 1. Checkpoint session metadata

| Field | Value |
|-------|-------|
| Checkpoint ID | `phase-313-2026-06-19` |
| Date | 2026-06-19 |
| Reviewer | Agent-assisted deployment plan audit (Phase 312 carry-forward + local dry-run gates + static guards) |
| Reviewed commit | `59b73cd` |
| Scope | Deployment readiness checklist, environment variable inventory (names only), migration/rollback posture, deployment smoke plan, monitoring expectations, next-phase recommendation |
| Method | Reconcile Phase 312 conclusions; local dry-run gate execution; smoke/migrate script review; no production cutover |

**Launch approval (this phase):** NO · **Production approval (this phase):** NO · **Release execution (this phase):** NO · **Deployment (this phase):** NO · **Actual deployment:** **NOT EXECUTED**. This checkpoint is **not release execution**, not deployment, and not formal launch.

---

## 2. Local dry-run automated gates (reaffirmed)

Phase 313 re-runs the same gates Phase 312 recorded on the release candidate lineage. These constitute the **local dry run** — not production deployment.

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 313 doc commit |
| `npm test` | **PASS** | Full vitest suite including Phase 301–312 guards |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | Produces `dist/` artifacts for deployment |
| `npm run migrate:check` | **PASS** | 12 migration files validated |
| `npm run smoke:public:local` | **PASS** | Isolated `www_test` public HTTP flow |

**Dry-run interpretation:** Passing local gates on `59b73cd` confirms the release candidate **builds, migrates (check), and passes public smoke** on an isolated test database. Operators must still run target-environment migration apply and post-cutover smoke separately during actual deployment execution.

---

## 3. Public MVP deployment readiness checklist

Complete before any separately executed production deployment. Mark each item **Done** / **Open** / **N/A**.

### 3.1 Release candidate gates

| # | Check | Required record | Dry-run status |
|---|-------|-----------------|----------------|
| DR-1 | Release candidate SHA | `59b73cd` on `origin/master` | **Done** (this checkpoint) |
| DR-2 | Phase 312 release readiness | **APPROVED**; blockers: none | **Done** |
| DR-3 | Homepage mixed-feed MVP line | Phase 301–308 closed; hydrated visual **PASS** | **Done** |
| DR-4 | Results reveal animation line | Phase 309–311-R closed | **Done** |
| DR-5 | Static module routes guarded | smoke + HTTP tests for home/site chrome/results | **Done** |
| DR-6 | Privacy/integrity blockers | none identified | **Done** |
| DR-7 | Human operator sign-off for cutover | recorded in deployment execution phase | **Open** |

### 3.2 Environment and secrets (names only — do not commit values)

| Variable | Role | Production notes |
|----------|------|------------------|
| `DATABASE_URL` | PostgreSQL connection string | **Required.** Target environment DB; not `www_test` unless intentional staging. |
| `PORT` | HTTP listen port | Optional; default `3000`. |
| `APP_ENV` | Runtime environment discriminator | **Required.** Must be `production` in production (`development` / `test` for non-prod). |
| `ADMIN_AUTH_CREDENTIALS_JSON` | Admin Bearer token config (SHA-256 digests) | **Required** for admin routes. JSON array; configure out-of-band. **Never commit.** |
| `USER_AUTH_CREDENTIALS_JSON` | Trusted user credential verifier (SHA-256 digests) | Optional production path via `createProductionCredentialVerifierFromEnv`. **Never commit.** |
| `LOGIN_SESSION_ALLOWED_ORIGINS_JSON` | Allowed origins for login session cookies | **Required** in production. JSON string array of absolute HTTPS origins. |
| `CREATOR_SESSION_ALLOWED_ORIGINS_JSON` | Allowed origins for creator session cookies | **Required** in production. JSON string array of absolute HTTPS origins. |
| `CREATOR_SESSION_ALLOW_INSECURE_COOKIE` | Local/test insecure cookie flag | **Must be unset or false in production.** |
| `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED` | Local test issuer flag | **Must be unset or false in production.** |

**Secrets handling:** Operators inject secrets via environment or secret manager at deploy time. Phase 313 does not print, store, or commit secret values. Demo seed fixtures (`demo:public:local`, `USER_AUTH_CREDENTIALS_JSON` test entries) **must not** be copied to production.

**Infrastructure (out of repo):** TLS termination, reverse proxy, process supervisor, DB backup, and incident contact path remain operator responsibilities per [Phase 274](./www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md).

### 3.3 Database migration expectations

| Item | Expectation |
|------|-------------|
| Migration count | **12** files (`001`–`012` in `migrations/`) |
| Pre-apply validation | `npm run migrate:check` on release candidate commit |
| Apply command | `DATABASE_URL=<target> npm run migrate` |
| Apply semantics | Idempotent — skips already-applied versions via `schema_migrations` |
| Transaction boundary | Each migration file applied in a single DB transaction; failure rolls back that file |
| Forbidden schema | No tables linking user/session/device/request to `option_id` (Raw Option Linkage Ban) |
| Lifecycle scheduler | `npm run scheduler:lifecycle` is a separate operator/cron command — not auto-deployed |

### 3.4 Rollback posture (high level)

| Item | Posture |
|------|---------|
| Default rollback target | Last known-good deployed commit (document at cutover; baseline candidate: `59b73cd` predecessor if first deploy) |
| Application rollback | Redeploy previous `dist/` + `public/` artifact; restart HTTP process |
| Database rollback | **Forward-fix preferred.** Migrations are append-only; do not run ad hoc DDL rollback without a numbered phase and operator sign-off |
| Abort triggers | Migration failure, vote integrity failure, auth boundary regression, result visibility leak, Raw Option Linkage Ban violation — see Phase 274 §8 |
| Demo data | Do not restore `www_test` demo seed into production during rollback |

---

## 4. Deployment smoke test plan

Execute on the **target environment** after cutover (not during Phase 313). Phase 313 documents the plan; local `smoke:public:local` is the dry-run analogue on `www_test`.

### 4.1 Automated smoke (operator host)

```bash
# On release candidate with target DATABASE_URL configured:
npm run migrate:check
npm run migrate
npm run build
npm start
# In separate shell against target base URL — adapt smoke or manual checks:
npm run smoke:public:local   # local dry-run only; production needs equivalent manual/API checks
```

### 4.2 Post-cutover checks (target environment)

| # | Check | Route / signal | Pass criterion |
|---|-------|----------------|----------------|
| DS-1 | Homepage loads and hydrates | `GET /`, `GET /frontend/public-mvp-home.js`, `GET /frontend/home-feed.js` | 200; skeleton clears; feed status copy present |
| DS-2 | `/home/feed` privacy-safe | `GET /home/feed` | Discriminated union; no `option_id`/raw counts; no user/session identity fields |
| DS-3 | Results page loads | `GET /results/:pollId` or `/results/demo` | 200; module graph loads; not stuck at「載入結果中」 |
| DS-4 | Collecting states counter-free | collecting poll results UI/API | No `.result-option-percent`; hidden aggregate on API |
| DS-5 | Revealed aggregate display-safe | revealed/locked/post_lock poll | Bucketed summaries only; no raw shard/token leak |
| DS-6 | Registration boundary | `POST /registration` | 201 without `Set-Cookie`; no auto-login |
| DS-7 | Login/session boundary | `POST /login/session`, `GET /users/me` | Session only after explicit login; `/users/me` minimal fields |
| DS-8 | Profile boundary | `GET /profile`, profile save API | `birth_year_month` / `residential_region` only |
| DS-9 | Vote path | `POST /polls/:pollId/vote-by-index` | `{ option_index }` only; eligibility-before-resolve |
| DS-10 | Explore feed frozen | `GET /polls/feed` | Collecting-only; unchanged contract |

### 4.3 Known non-blocking observations (not smoke blockers)

| Observation | Impact on deployment smoke |
|-------------|---------------------------|
| **OBS-311-01** — demo `?ui_state=revealed` inherits collecting lifecycle | Demo URL only; production aggregate path unaffected. **Not a deployment blocker.** |
| Port `EADDRINUSE` during local `demo:public:local` | Local operator environment only; use alternate port/fresh build. **Not a deployment blocker.** |

---

## 5. Post-deployment monitoring expectations

Phase 313 does **not** add new logs, metrics, APM traces, debug payloads, or analytics. Operators should monitor using **existing** application behavior only:

| Area | Expectation |
|------|-------------|
| HTTP availability | Home, vote, results, registration, login pages respond |
| Error rates | Watch process exit/restart; investigate 5xx spikes |
| Migration health | Confirm `schema_migrations` matches expected 12 versions |
| Privacy self-check | Confirm no new payloads capture `option_id` linked to user/session/device/request |
| Lifecycle | Run `scheduler:lifecycle` on operator schedule if poll close transitions required |
| Incidents | Record abort/rollback per Phase 274 incident template if triggers fire |

**Forbidden in monitoring (MVP):** demographic breakdowns, option-level user linkage, durable vote event logs, or option-choice analytics.

---

## 6. Privacy and integrity reaffirmation

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | **Preserved** — no durable user-option linkage |
| Official Vote transaction order | **Unchanged** |
| vote-by-index eligibility-before-option-resolve | **Unchanged** |
| Result visibility (collecting/cancelled/unpublished hidden) | **Unchanged** |
| Aggregate display-safe summaries only | **Unchanged** |
| Registration no auto-login / no `Set-Cookie` | **Unchanged** |
| `/users/me` minimal | **Unchanged** |
| Profile fields only | **Unchanged** |
| No new option-linked logs/metrics/APM/debug/analytics | **Confirmed** — this phase adds none |

---

## 7. Next-phase recommendation

| Option | Assessment |
|--------|------------|
| **A. Actual deployment execution** | **Recommended.** Phase 312 found no release blockers. OBS-311-01 is demo-preview only and deferred. Static routes, privacy guards, and local dry-run gates pass on `59b73cd`. Operator release execution remains authorized per Phase 278; deployment should be a **separately executed and recorded** numbered phase. |
| **B. Remaining OBS/FU triage before deployment** | **Optional, not required.** Only if operator wants demo preview lifecycle alignment (OBS-311-01) before cutover. Does not block production aggregate/results paths. |

**Phase 313 recommendation:** Proceed to **actual deployment execution** as the next numbered phase unless operator explicitly chooses optional OBS-311-01 triage first.

---

## 8. Findings

| # | Severity | Finding |
|---|----------|---------|
| F-1 | none (resolved) | Local dry-run gates pass on release candidate lineage. |
| F-2 | none (resolved) | Deployment readiness checklist, env inventory, migration/rollback posture, and smoke plan documented. |
| F-3 | none (observation) | **OBS-311-01** remains deferred — not a deployment blocker. |
| F-4 | none (observation) | Port `EADDRINUSE` local cases — alternate build acceptable; not a deployment blocker. |

**Deployment blockers identified:** none.

---

## 9. Conclusion

**APPROVED — deployment plan and local dry run complete.** `origin/master` at `59b73cd` remains a release candidate. Deployment readiness checklist, environment variable inventory (names only), migration expectations, rollback posture, deployment smoke plan, and monitoring expectations are documented. Privacy and integrity boundaries unchanged. **Actual deployment NOT EXECUTED.** **Phase 313 blockers: none identified.**

**Recommended next phase:** actual deployment execution (separately recorded), unless operator opts for optional OBS-311-01 triage first.

---

## 10. Files changed (Phase 313 checkpoint only)

| File | Change |
|------|--------|
| `docs/www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md` | Phase 313 deployment plan doc |
| `tests/docs/phase-313-deployment-plan-dry-run-checkpoint-doc.test.ts` | Phase 313 doc guards |
| `tests/frontend/phase-313-deployment-plan-dry-run-checkpoint.test.ts` | Phase 313 static source guards |
| `README.md` | Phase 313 index |

---

## 11. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean |
| `npm test` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run migrate:check` | pass |
| `npm run smoke:public:local` | pass |

---

## 12. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
