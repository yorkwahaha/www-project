# WWW Project Phase 316-A — Deployment Operator Input Discovery Checkpoint v1

**Status:** operator input discovery checkpoint — docs + docs-test + README (+ static source guards) only. Inspected `package.json`, deployment-related docs, env readers, auth verifiers, migration scripts, and smoke scripts at `origin/master` commit `4442241` to produce the **exact staging deployment operator checklist**. **No deployment.** **No target migration.** **No secrets modified, printed, committed, or generated.**

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-option-resolve, Raw Option Linkage Ban, logging, metrics, deploy scripts, or production configuration changed by Phase 316-A.**

**Discovery commit:** `4442241` (`origin/master`, Phase 315 deployment blocked checkpoint).
**Prior checkpoint:** [Phase 315 deployment execution retry](./www-project-phase-315-deployment-execution-retry-checkpoint-v1.md) — **BLOCKED / NOT DEPLOYED**; operator inputs still absent.
**Related context:** [Phase 313 deployment plan and dry run](./www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md), [Phase 274 operator handoff](./www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md).

> **Phase-number note:** Phase 316-A discovers and documents operator inputs only. It does **not** deploy, does **not** apply migrations to a target database, and does **not** fake cutover readiness.

**Authoritative release status (unchanged):** manual release preparation approved; operator release execution authorized; **actual deployment NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

---

## 1. Checkpoint session metadata

| Field | Value |
|-------|-------|
| Checkpoint ID | `phase-316a-2026-06-20` |
| Date | 2026-06-20 |
| Reviewed commit | `4442241` |
| Scope | Staging deployment operator input discovery from repo source |
| Method | Static inspection of `package.json`, `src/`, `scripts/`, `migrations/`, Phase 313–315 docs |
| Deployment performed | **NO** |
| Target migration performed | **NO** |

**Staging deployment readiness (this phase):** **BLOCKED** — required operator-supplied values (target `DATABASE_URL`, JSON credential/origin configs, staging base URL, deployment channel, TLS/reverse proxy, cutover sign-off) are **not present** in the operator shell or repo. The checklist below is **READY TO USE** once operators supply those inputs out-of-band.

---

## 2. Verified commands (from repo)

All commands below are defined in `package.json` or invoked by `scripts/*.mjs`. The repo contains **no deploy scripts**; artifact delivery is operator-defined.

| Purpose | Command | Source | Notes |
|---------|---------|--------|-------|
| Install dependencies | `npm install` | standard | Node.js **≥ 20** (`package.json` `engines`) |
| Typecheck | `npm run typecheck` | `tsc -p tsconfig.json --noEmit` | Pre-deploy gate |
| Build artifact | `npm run build` | `tsc -p tsconfig.json` | Produces `dist/` |
| Start HTTP server | `npm start` | `node dist/index.js` | Requires runtime env (see §3); serves `public/` static assets via HTTP server |
| Migration validate (no DB) | `npm run migrate:check` | `node scripts/migrate.mjs --check` | Validates **12** SQL files in `migrations/` |
| Migration apply (target DB) | `DATABASE_URL=<target> npm run migrate` | `node scripts/migrate.mjs` | **Idempotent** — skips applied versions via `schema_migrations`; each file in one DB transaction |
| Lifecycle batch (operator/cron) | `DATABASE_URL=<target> npm run scheduler:lifecycle -- --limit 100` | `node dist/lifecycle-scheduler.js` | Separate from HTTP deploy; not auto-started |
| Unit/integration tests | `npm test` | `vitest run` | DB-free unit suite |
| Local public smoke (dry-run only) | `npm run smoke:public:local` | `scripts/smoke-public-local.mjs` | **Refuses non-`www_test`**; not a staging/production smoke substitute |
| Local admin smoke (dry-run only) | `npm run smoke:admin:local` | `scripts/smoke-admin-local.mjs` | Same `www_test` isolation |
| Local demo (dry-run only) | `npm run demo:public:local` | `scripts/demo-public-local.mjs` | Local fake credentials in process only — **do not copy to staging** |

### 2.1 Operator staging cutover sequence (high level — not executed in this phase)

```bash
# On release candidate commit with staging env injected via secret manager / host:
npm run migrate:check
DATABASE_URL=<staging> npm run migrate
npm run build
npm start
# Post-cutover: manual/API checks against staging base URL (§6); no target smoke script in repo
```

**Deploy artifacts:** sync **`dist/`** (compiled server) and **`public/`** (static HTML/JS/CSS) to the staging host per operator deployment channel (process supervisor, container image, or file sync). Reverse proxy must terminate TLS when using production-parity `APP_ENV=production`.

---

## 3. Required environment variables for staging deployment

Discovered from `src/db/client.ts`, `src/app.ts`, `src/http/admin-auth.ts`, `src/auth/user-auth-resolver.ts`, `src/auth/production-credential-verifier.ts`, `src/http/login-session-routes.ts`, and `src/creator-sessions/config.ts`.

**No secret values below.**

### 3.1 Always required at runtime (server startup)

| Variable | Required | Role | Startup / runtime behavior |
|----------|----------|------|----------------------------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `getPool()` throws if unset (`src/db/client.ts`) |
| `ADMIN_AUTH_CREDENTIALS_JSON` | **Yes** | Admin Bearer digest registry | `createAdminAuthFromEnv()` throws if unset or invalid (`src/http/admin-auth.ts`) |
| `APP_ENV` | **Yes** (explicit recommended) | Runtime discriminator | Allowed: `development`, `test`, `production`. Defaults to **`production`** if unset (`parseAppEnvironment` / `parseEnvironment`) |

### 3.2 Required for production-parity staging (recommended)

Use when staging should mirror production auth, cookie, and origin rules.

| Variable | Required | Role | Notes |
|----------|----------|------|-------|
| `APP_ENV` | **Yes** | Set to **`production`** | Disables `X-User-Id` fallback (`src/auth/user-auth-resolver.ts`) |
| `LOGIN_SESSION_ALLOWED_ORIGINS_JSON` | **Yes** | Allowed `Origin` for `POST/DELETE /login/session` | Must include exact staging site origin(s); empty/unset → no origins allowed → mutations rejected |
| `CREATOR_SESSION_ALLOWED_ORIGINS_JSON` | **Yes** | Creator session mutation origins | Same origin format; **`https:` only** when `APP_ENV=production` |
| `USER_AUTH_CREDENTIALS_JSON` | **Yes** for full Public MVP auth UX | Trusted Bearer credential registry | Verifier optional if unset, but **`src/app.ts` only wires `POST /registration` and login session routes when verifier is configured** — without this, registration/login session APIs return **501 NOT_IMPLEMENTED** |

### 3.3 Optional / conditional

| Variable | Default | Role | Staging notes |
|----------|---------|------|---------------|
| `PORT` | `3000` | HTTP listen port | `src/index.ts`, `src/app.ts` |
| `USER_AUTH_CREDENTIALS_JSON` | unset | Production trusted user Bearer digests | See §3.2 — effectively required for registration/login/session |
| `CREATOR_SESSION_ALLOW_INSECURE_COOKIE` | `false` | Allow non-Secure creator cookie | **`true` forbidden when `APP_ENV=production`** |
| `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED` | `false` | Local/test creator session issuer | **`true` forbidden when `APP_ENV=production`**; enables dev issuer only outside production |

### 3.4 HTTP staging alternative (non-production-parity)

If staging uses plain HTTP without TLS, operators may set `APP_ENV=development` or `APP_ENV=test` and explicitly enable:

- `CREATOR_SESSION_ALLOW_INSECURE_COOKIE=true`
- `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED=true` (for local-style creator session issuance)

This path **must not** be used for production cutover. Login session cookies still use **`Secure`** flag in `serializeLoginSessionCookie` (`src/http/login-session-routes.ts`) regardless of creator cookie settings — HTTPS reverse proxy remains required for browser login cookies even in this mode.

### 3.5 Out-of-repo operator inputs (not env vars)

| Item | Required for staging cutover |
|------|------------------------------|
| Staging **base URL** (scheme + host + port) | Post-cutover smoke, origin JSON values |
| **Deployment channel** | Deliver `dist/` + `public/`; restart process |
| **TLS / reverse proxy** | Production-parity staging (`APP_ENV=production`) |
| **Human operator sign-off** | Phase 313 DR-7 |
| **`admin_users` / `users` DB rows** | Admin `admin_user_id` and user `user_id` in JSON configs must exist in target DB |

---

## 4. JSON schemas (discovered from code)

Operators generate raw tokens out-of-band, store **SHA-256 hex digests** in JSON env vars, and inject via secret manager. **Never commit raw tokens or env files.**

### 4.1 `ADMIN_AUTH_CREDENTIALS_JSON`

**Top-level type:** JSON **array** (non-empty).

**Each element:**

| Field | Type | Constraints |
|-------|------|-------------|
| `token_sha256` | string | Lowercase hex **SHA-256** of raw admin Bearer token; pattern `^[0-9a-f]{64}$` |
| `admin_user_id` | string | UUID matching `^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` (case-insensitive) |
| `role` | string | Must be exactly **`"admin"`** |
| `permissions` | string[] | Each entry must be **`correction:read`** and/or **`correction:write`** |

**Registry rules:** duplicate `token_sha256` values rejected at startup; empty array rejected; malformed entries throw `Invalid ADMIN_AUTH_CREDENTIALS_JSON credential entry`.

**Runtime auth:** clients send `Authorization: Bearer <raw-token>`; server compares SHA-256 digest only.

**Source:** `src/http/admin-auth.ts`, `tests/http/admin-auth.test.ts`.

### 4.2 `LOGIN_SESSION_ALLOWED_ORIGINS_JSON`

**Top-level type:** JSON **string array**.

**Each element:** exact absolute **origin** string:

- Valid `http:` or `https:` URL
- Must equal `url.origin` (no path beyond `/`, no `username`/`password`, no `search`, no `hash`)
- Example shape: `"https://staging.example.com"` or `"http://127.0.0.1:3000"`

**Unset/empty:** parses to empty set → login session mutations fail origin check (`LOGIN_SESSION_ORIGIN_REJECTED`).

**Note:** unlike creator origins, login parser does **not** enforce HTTPS-only when `APP_ENV=production`; cookies still emit `Secure`.

**Source:** `src/http/login-session-routes.ts` (`parseAllowedOrigins`).

### 4.3 `CREATOR_SESSION_ALLOWED_ORIGINS_JSON`

**Top-level type:** JSON **string array** with the **same origin format** as §4.2.

**Additional rule:** when `APP_ENV=production`, each origin must use **`https:`** protocol.

**Unset/empty:** empty set → creator session origin checks fail closed.

**Source:** `src/creator-sessions/config.ts` (`parseAllowedOrigins`).

### 4.4 `USER_AUTH_CREDENTIALS_JSON` (optional verifier; effectively required for auth routes)

**Top-level type:** JSON **array** (non-empty when set).

**Each element:**

| Field | Type | Constraints |
|-------|------|-------------|
| `token_sha256` | string | Lowercase hex SHA-256 of raw user Bearer token; pattern `^[0-9a-f]{64}$` |
| `user_id` | string | UUID (same pattern as admin `admin_user_id`) |
| `expires_at` | string | ISO 8601 date string parseable by `Date` |
| `revoked_at` | string \| null | Optional; ISO 8601 date when present |

**Registry rules:** duplicate `token_sha256` rejected; empty array rejected when explicitly configured; malformed entries throw `Invalid USER_AUTH_CREDENTIALS_JSON credential entry`.

**Runtime auth:** `Authorization: Bearer <raw-token>`; expired or revoked entries ignored.

**Route wiring:** when unset, `createProductionCredentialVerifierFromEnv` returns `undefined` and registration/login session handlers are **not mounted** (`src/app.ts`).

**Source:** `src/auth/production-credential-verifier.ts`, `tests/auth/production-credential-verifier.test.ts`.

---

## 5. Staging deployment operator checklist

Mark each item **Done** / **Open** before cutover. Phase 316-A marks all **Open** because operator inputs were not supplied.

| # | Check | Source of truth | Status |
|---|-------|-----------------|--------|
| OI-1 | Release candidate SHA on `origin/master` | `4442241` (or newer agreed commit) | **Open** (operator to confirm at cutover) |
| OI-2 | `npm run migrate:check` on candidate | `scripts/migrate.mjs --check` | **Open** (run at cutover) |
| OI-3 | Staging `DATABASE_URL` injected (not accidental `www_test`) | `src/db/client.ts` | **Open** |
| OI-4 | `APP_ENV` set for chosen staging mode (`production` recommended) | `src/auth/user-auth-resolver.ts`, `src/creator-sessions/config.ts` | **Open** |
| OI-5 | `ADMIN_AUTH_CREDENTIALS_JSON` configured; digests only | `src/http/admin-auth.ts` | **Open** |
| OI-6 | `USER_AUTH_CREDENTIALS_JSON` configured if registration/login required | `src/app.ts` | **Open** |
| OI-7 | `LOGIN_SESSION_ALLOWED_ORIGINS_JSON` includes staging origin(s) | `src/http/login-session-routes.ts` | **Open** |
| OI-8 | `CREATOR_SESSION_ALLOWED_ORIGINS_JSON` includes staging origin(s) | `src/creator-sessions/config.ts` | **Open** |
| OI-9 | `CREATOR_SESSION_ALLOW_INSECURE_COOKIE` and `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED` unset/false for production-parity staging | `src/creator-sessions/config.ts` | **Open** |
| OI-10 | Staging base URL documented for post-cutover smoke | Phase 313 §4.2 | **Open** |
| OI-11 | Deployment channel documented (supervisor/container/sync) | Repo has no deploy scripts | **Open** |
| OI-12 | TLS / reverse proxy ready for HTTPS staging | Operator infrastructure | **Open** |
| OI-13 | Human operator cutover sign-off | Phase 313 DR-7 | **Open** |
| OI-14 | `DATABASE_URL=<staging> npm run migrate` applied | `scripts/migrate.mjs` | **Open** |
| OI-15 | `npm run build` + deploy `dist/` + `public/` + `npm start` | `package.json` | **Open** |

---

## 6. Post-cutover smoke plan (target staging — not run in this phase)

No automated staging smoke script exists in the repo. After cutover, operators run manual or adapted checks per [Phase 313 §4.2](./www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md):

| # | Check |
|---|-------|
| DS-1 | Homepage loads and hydrates mixed-feed cards |
| DS-2 | `GET /home/feed` privacy-safe discriminated union |
| DS-3 | Results page or `/results/demo` equivalent loads |
| DS-4 | Collecting/cancelled/unpublished states counter-free |
| DS-5 | Aggregate states display-safe only |
| DS-6 | `POST /registration` → 201 without `Set-Cookie` |
| DS-7 | Login/session + minimal `GET /users/me` |
| DS-8 | Profile fields only (`birth_year_month`, `residential_region`) |
| DS-9 | Vote-by-index boundary if safe test poll available |

Local analogue only: `npm run smoke:public:local` on **`www_test`** — **not** staging cutover proof.

---

## 7. Privacy and integrity reaffirmation

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | **Preserved** — discovery only; no schema change |
| Result visibility rules | **Unchanged** |
| Official Vote transaction order | **Unchanged** |
| vote-by-index eligibility-before-option-resolve | **Unchanged** |
| Registration no auto-login / no `Set-Cookie` | **Unchanged** |
| `/users/me` minimal | **Unchanged** |
| Profile fields only | **Unchanged** |
| No new option-linked logs/metrics/APM/debug/analytics | **Confirmed** — this phase adds none |

---

## 8. Conclusion

**Staging deployment status: BLOCKED.** Phase 316-A produced the exact operator input checklist, env var inventory, JSON schemas, and verified commands from repository source. **No deployment** and **no target migration** were performed. Staging cutover becomes **READY** when operators supply §3–§5 inputs out-of-band and complete OI-1 through OI-15 at cutover time.

**Next step:** Operator injects staging configuration via secret manager or host environment, documents deployment channel and base URL, records sign-off, then executes a successor deployment phase (e.g. Phase 316-B cutover).

---

## 9. Files changed (Phase 316-A checkpoint only)

| File | Change |
|------|--------|
| `docs/www-project-phase-316a-deployment-operator-input-discovery-checkpoint-v1.md` | Phase 316-A operator input discovery record |
| `tests/docs/phase-316a-deployment-operator-input-discovery-checkpoint-doc.test.ts` | Phase 316-A doc guards |
| `tests/frontend/phase-316a-deployment-operator-input-discovery-checkpoint.test.ts` | Phase 316-A static source guards |
| `README.md` | Phase 316-A index |

---

## 10. Validation (pre-commit, local)

| Gate | Result |
|------|--------|
| `git status` | clean tracked tree; allowed untracked only |
| `git diff --check` | clean |
| `npm test` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run migrate:check` | pass |

---

## 11. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
