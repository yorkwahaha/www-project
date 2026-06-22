# WWW Project Phase 316-B — Node Staging Cutover Planning Checkpoint v1

**Status:** Node staging cutover planning checkpoint — docs + docs-test + README (+ static source guards) only. Records the **Node-compatible staging cutover plan** at `origin/master` commit `cde552d` after [Phase 316-A operator input discovery](./www-project-phase-316a-deployment-operator-input-discovery-checkpoint-v1.md). **No deployment.** **No target migration.** **No secrets modified, printed, committed, or generated.**

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-option-resolve, Raw Option Linkage Ban, logging, metrics, deploy scripts, or production configuration changed by Phase 316-B-plan.**

**Planning commit:** `cde552d` (`origin/master`, Phase 316-A deployment operator input discovery checkpoint).
**Prior checkpoint:** [Phase 316-A deployment operator input discovery](./www-project-phase-316a-deployment-operator-input-discovery-checkpoint-v1.md) — operator inputs and JSON schemas discovered; staging **BLOCKED** pending out-of-band inputs.
**Related context:** [Phase 315 deployment execution retry](./www-project-phase-315-deployment-execution-retry-checkpoint-v1.md) (M-1–M-10 blockers), [Phase 313 deployment plan and dry run](./www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md). Phase 316-CF-A (Cloudflare Workers feasibility review, not committed to repo) concluded **Workers suitable only after adapter; does not replace Phase 316-B**.

> **Phase-number note:** Phase 316-B-plan records Node staging cutover planning only. It does **not** deploy, does **not** apply migrations to a target database, does **not** add deploy scripts, and does **not** change runtime behavior or production configuration. **No Cloudflare Workers, wrangler config, Temporary Accounts, or Worker adapter work is in scope.**

**Authoritative release status (unchanged):** manual release preparation approved; operator release execution authorized; **actual deployment NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

**Active deployment track:** **Node staging cutover** on a Node.js **≥ 20** host running `npm start` → `node dist/index.js`. Cloudflare Workers remains a **future adapter path only** — not the current cutover route.

---

## 1. Checkpoint session metadata

| Field | Value |
|-------|-------|
| Checkpoint ID | `phase-316b-plan-2026-06-22` |
| Date | 2026-06-22 |
| Reviewed commit | `cde552d` |
| Scope | Node-compatible staging cutover planning from Phase 316-A operator inputs |
| Method | Plan synthesis from Phase 313–316-A docs and repo source inspection |
| Deployment performed | **NO** |
| Target migration performed | **NO** |
| Production deployment approval granted | **NO** |

**Staging deployment readiness (this phase):** **BLOCKED** — Phase 315 operator-input blockers M-1 through M-10 remain open. These are **operator-input blockers, not code blockers**. The cutover plan below is **READY TO USE** once operators supply required inputs out-of-band.

---

## 2. Phase 316-B-plan scope reaffirmation

| Statement | Status |
|-----------|--------|
| Phase 316-B is Node staging cutover **planning only** | **Confirmed** |
| No deployment is executed in this phase | **Confirmed** |
| No target DB migration is executed in this phase | **Confirmed** |
| No runtime behavior is changed | **Confirmed** |
| No production configuration is changed | **Confirmed** |
| No Cloudflare Workers / wrangler / Temporary Accounts work | **Out of scope** |
| No deploy scripts added | **Confirmed** |
| No Worker adapter implementation | **Confirmed** |
| `pg` dependency placement unchanged | **Confirmed** — packaging risk documented only |

---

## 3. Node-compatible deployment requirements

The staging target must support the verified commands and artifacts defined in `package.json` and Phase 316-A. The repo contains **no deploy scripts**; artifact delivery is operator-defined.

| Requirement | Source / rationale |
|-------------|-------------------|
| **Node.js ≥ 20** (`>= 20` in `package.json` `engines`) | `package.json` `engines` |
| **`npm run build`** | `tsc -p tsconfig.json` → `dist/` |
| **`npm start` → `node dist/index.js`** | `package.json` `scripts.start`; `src/index.ts` calls `createApp().startHttpServer(port)` |
| **`dist/` + `public/` on runtime host** | API from `dist/`; static HTML/JS/CSS served via `readFile` from `public/` in `src/http/server.ts` |
| **Staging PostgreSQL reachable via `DATABASE_URL`** | `src/db/client.ts` `getPool()` throws if unset |
| **TLS / reverse proxy** | Required for production-parity staging (`APP_ENV=production`); login session cookies emit `Secure` |
| **Env secret injection** | Secret manager or host environment; **never commit** secrets or `.env` files |
| **Migration outside HTTP request handling** | `scripts/migrate.mjs` is a separate operator/CI command — **not** invoked during `npm start` or normal request routing |

**Compatible deployment channels (operator choice):** VPS + process supervisor, container image on a Node-compatible platform, or file sync to a Node host. All must preserve the same process model: long-running HTTP listener on `PORT` (default `3000`) with env injected at start.

**Not in scope for this track:** Cloudflare Workers fetch handler, wrangler, Hyperdrive-only adapter, or Temporary Accounts deployment.

---

## 4. Staging cutover sequence

### 4.1 Pre-cutover gates (release candidate — no target DB required for migrate:check)

Run on the release candidate commit before any staging cutover execution phase:

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
```

| Gate | Purpose |
|------|---------|
| `git diff --check` | Whitespace/conflict hygiene |
| `npm test` | Full vitest suite including privacy/integrity guards |
| `npm run typecheck` | TypeScript compile check without emit |
| `npm run build` | Produce `dist/` deployment artifact |
| `npm run migrate:check` | Validate **12** SQL files in `migrations/` without DB |

### 4.2 Cutover execution sequence (successor execute phase only — **not run in Phase 316-B-plan**)

Requires operator sign-off (M-9 / Phase 313 DR-7) and closed M-1 through M-8 (and M-10 per operator policy):

```bash
# 1. Target migration (outside HTTP; operator shell or CI with staging DATABASE_URL)
DATABASE_URL=<staging> npm run migrate

# 2. Build and deliver artifacts (if not already built in gates)
npm run build
# Operator syncs dist/ + public/ to staging host per deployment channel (M-7)

# 3. Start HTTP server with staging env injected
npm start

# 4. Post-cutover smoke against staging base URL (M-6) — not smoke:public:local
# Manual/API checks per §7; smoke:public:local refuses non-www_test
```

**Lifecycle scheduler (separate from HTTP cutover):**

```bash
DATABASE_URL=<staging> npm run scheduler:lifecycle -- --limit 100
```

Operator cron responsibility — not auto-started by `npm start`.

---

## 5. Phase 315 operator-input blockers (still open)

Phase 315 blockers M-1 through M-10 remain **operator-input blockers, not code blockers**. Phase 316-B-plan does not close them.

| # | Missing item | Required for | Status |
|---|--------------|--------------|--------|
| M-1 | Production/staging **`DATABASE_URL`** | Target migration apply (`npm run migrate`) | **Missing** |
| M-2 | **`APP_ENV=production`** (or documented staging equivalent) | Production runtime discriminator | **Missing** |
| M-3 | **`ADMIN_AUTH_CREDENTIALS_JSON`** | Admin route auth (SHA-256 digests, out-of-band) | **Missing** |
| M-4 | **`LOGIN_SESSION_ALLOWED_ORIGINS_JSON`** | Login session cookie origins (HTTPS JSON array) | **Missing** |
| M-5 | **`CREATOR_SESSION_ALLOWED_ORIGINS_JSON`** | Creator session cookie origins (HTTPS JSON array) | **Missing** |
| M-6 | Target **host / URL** identity | Post-cutover smoke base URL | **Not identified** |
| M-7 | **Deployment channel** (process supervisor, container platform, or host sync procedure) | Artifact delivery of `dist/` + `public/` | **Not configured** — repo has **no deploy scripts** |
| M-8 | **TLS / reverse proxy** plan | Production HTTPS termination | **Out of repo** — operator responsibility |
| M-9 | **Human operator sign-off** for cutover | Phase 313 DR-7 | **Open** |
| M-10 | **`USER_AUTH_CREDENTIALS_JSON`** | Full registration/login staging smoke | **Missing** (see §6.2) |

**Operator action to unblock:** Provide staging configuration out-of-band, document deployment channel and base URL, record cutover sign-off, then execute a successor cutover phase (e.g. Phase 316-B-execute).

---

## 6. Production-parity staging environment guidance

Use when staging should mirror production auth, cookie, and origin rules. **No secret values below.**

### 6.1 Required for production-parity staging

| Variable | Requirement |
|----------|-------------|
| `APP_ENV` | Set to **`production`** |
| `DATABASE_URL` | Must point to **staging** PostgreSQL — not `www_test` unless intentional isolated staging |
| `ADMIN_AUTH_CREDENTIALS_JSON` | Configured out-of-band; SHA-256 digests only; `admin_user_id` must exist in staging DB |
| `LOGIN_SESSION_ALLOWED_ORIGINS_JSON` | JSON string array including **exact HTTPS staging origin** (e.g. `https://staging.example.com`) |
| `CREATOR_SESSION_ALLOWED_ORIGINS_JSON` | JSON string array including **exact HTTPS staging origin**; **`https:` only** when `APP_ENV=production` |

### 6.2 Registration / login staging smoke

| Variable | Requirement |
|----------|-------------|
| `USER_AUTH_CREDENTIALS_JSON` | **Required for full registration/login staging smoke.** When unset, `createProductionCredentialVerifierFromEnv` returns `undefined` and `src/app.ts` does **not** wire `POST /registration` or login session routes — those APIs return **501 NOT_IMPLEMENTED**. Operators choosing staging without this variable must **document** that registration/login smoke (DS-6, DS-7) is **N/A** until credentials are configured. |

### 6.3 Production-parity forbiddens

| Variable | Staging rule |
|----------|--------------|
| `CREATOR_SESSION_ALLOW_INSECURE_COOKIE` | **Unset or false** |
| `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED` | **Unset or false** |
| Demo seed / local fake credentials | **Do not copy** from `demo:public:local` or `smoke:public:local` |

**JSON schemas:** See Phase 316-A §4.

---

## 7. Known packaging risk — `pg` in devDependencies

| Item | Detail |
|------|--------|
| Current placement | `pg` is listed under `devDependencies` in `package.json` |
| Risk | Deployment hosts running `npm ci --omit=dev` may **fail at runtime** when `import 'pg'` resolves from `src/db/client.ts` |
| Phase 316-B-plan action | **Document only — do not fix in this phase** |
| Follow-up | Address in Phase 316-B-prep or 316-B-execute if operator channel uses production-only dependency install |

---

## 8. Post-cutover smoke plan (staging base URL — not run in this phase)

Execute on the **staging base URL** (M-6) after cutover in a successor execute phase. `npm run smoke:public:local` is **not** a staging substitute — it refuses non-`www_test`.

| # | Check | Pass criterion |
|---|-------|----------------|
| DS-1 | Homepage loads and hydrates | `GET /` 200; feed modules load |
| DS-2 | `/home/feed` privacy-safe | No `option_id`/raw counts; no user/session identity fields |
| DS-3 | Results page loads | `GET /results/:pollId` or demo equivalent |
| DS-4 | Collecting states counter-free | No raw aggregate exposure |
| DS-5 | Aggregate display-safe | Bucketed summaries only |
| DS-6 | Registration boundary | `POST /registration` → 201 **without** `Set-Cookie` (requires `USER_AUTH_CREDENTIALS_JSON`) |
| DS-7 | Login/session boundary | Session only after explicit login; `GET /users/me` minimal fields |
| DS-8 | Profile boundary | `birth_year_month` / `residential_region` only |
| DS-9 | Vote path | `POST /polls/:pollId/vote-by-index` with `{ option_index }` only; eligibility-before-resolve |

---

## 9. Privacy and integrity reaffirmation

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | **Preserved** — planning only; no schema change |
| result visibility (collecting/cancelled/unpublished hidden) | **Unchanged** |
| Official Vote transaction order | **Unchanged** |
| vote-by-index eligibility-before-option-resolve | **Unchanged** |
| Registration no auto-login / no `Set-Cookie` | **Unchanged** |
| `/users/me` minimal | **Unchanged** |
| Profile fields only | **Unchanged** |
| Auth/profile/registration/vote/creator boundaries | **Unchanged** |
| No new option-linked logs/metrics/APM/debug/analytics | **Confirmed** — this phase adds none |

---

## 10. Cloudflare Workers relationship (out of current track)

Phase 316-CF-A concluded Cloudflare Workers is **suitable only after adapter** and **does not replace Phase 316-B**. The current deployment track remains **Node staging cutover**. No wrangler config, Temporary Accounts deployment, or Worker adapter implementation is in scope for Phase 316-B-plan or the active cutover track.

---

## 11. Conclusion

**Staging deployment status: BLOCKED** pending operator inputs M-1 through M-10. Phase 316-B-plan records the Node-compatible staging cutover plan, verified requirements, cutover sequence, production-parity env guidance, and `pg` packaging risk. **No deployment** and **no target migration** were performed. **No production deployment approval** is granted by this phase.

**Next step:** Operator closes M-1 through M-10, documents deployment channel and staging base URL, records sign-off, then executes a successor cutover phase (e.g. Phase 316-B-execute).

---

## 12. Files changed (Phase 316-B-plan checkpoint only)

| File | Change |
|------|--------|
| `docs/www-project-phase-316b-node-staging-cutover-planning-checkpoint-v1.md` | Phase 316-B-plan Node staging cutover planning record |
| `tests/docs/phase-316b-node-staging-cutover-planning-checkpoint-doc.test.ts` | Phase 316-B-plan doc guards |
| `tests/frontend/phase-316b-node-staging-cutover-planning-checkpoint.test.ts` | Phase 316-B-plan static source guards |
| `README.md` | Phase 316-B-plan index |

---

## 13. Validation (pre-commit, local)

| Gate | Result |
|------|--------|
| `git status` | clean tracked tree; allowed untracked only |
| `git diff --check` | clean |
| `npm test` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run migrate:check` | pass |

---

## 14. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
