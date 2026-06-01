# WWW Project — Phase 0–12

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

This repository implements delivery milestones **Phase 0 through Phase 12**: Poll Core, Reference Answer Design B, Official Vote, Result Display, frontend privacy closure (5A), the public freshness-only discovery feed (5B–5C), poll visibility/archive (6A), **admin typo correction governance (6B/6C)**, **admin correction audit read + review-context hardening (7.3B–7.5)**, the poll-scoped **public notice read API (8)**, the safe global **admin correction audit queue (9)**, DB-backed integration coverage synchronization for the Phase 8/9 read surfaces (10), the poll-scoped **public notice display UI (11)**, and the server-side **Admin Auth / RBAC v1 boundary (12)**.

Normative rules: `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md`.

Milestone summaries: `docs/www-project-milestone-phase-0-5b-handoff-v1.md` (through 5B), `docs/www-project-milestone-phase-0-5c-handoff-v1.md` (5C feed pagination), `docs/www-project-milestone-phase-10-handoff-v1.md` (Phase 8/9 PG integration synchronization), `docs/www-project-milestone-phase-11-handoff-v1.md` (public notice display UI), and `docs/www-project-milestone-phase-12-handoff-v1.md` (Admin Auth / RBAC v1).

**Phase 14 (docs):** Admin Auth v1 production deployment handoff — `docs/www-project-phase-14-admin-auth-deployment-v1.md` (configure and verify `ADMIN_AUTH_CREDENTIALS_JSON` before admin UI / JWT / OAuth work).

**Phase 15 (docs):** PostgreSQL integration test setup — `docs/www-project-phase-15-pg-integration-test-setup-v1.md` (use `npm run test:integration:local` for the isolated local Docker `www_test`, or run `npm run test:integration` when `DATABASE_URL` is set explicitly).

**Phase 20 (docs):** Correction / admin governance handoff index (Phase 8–19 baseline, validation commands, privacy boundaries, TODOs) — `docs/www-project-phase-20-correction-admin-governance-handoff-v1.md`.

**Phase 27 (docs):** Public MVP manual QA handoff (local setup, validation commands, browser checklist for `/` → create → vote → results) — `docs/www-project-public-mvp-manual-qa-v1.md`.

**Phase 31 (docs):** Public MVP demo/release handoff (showcase script, validation checklist, privacy boundaries, out-of-scope list) — `docs/www-project-public-mvp-demo-release-handoff-v1.md`.

**Phase 32 (docs):** Local public MVP demo startup (Docker `www_test`, session `DATABASE_URL`, migrate, `npm start`, troubleshooting) — `docs/www-project-local-demo-startup-v1.md`.

**Phase 37:** Local public MVP demo helper — `npm run demo:public:local` (seeds fake official demo voters on `www_test`, starts server); CSP fix so `public-mvp.css` loads. See `docs/www-project-local-demo-startup-v1.md`.

**Phase 33 (docs):** Public MVP manual QA checklist pass — doc cross-links and smoke-aligned route checks; see `docs/www-project-public-mvp-manual-qa-v1.md` (read order: startup → demo handoff → manual QA).

**Phase 34 (docs):** Cross-browser / device manual QA result log template — `docs/www-project-public-mvp-cross-browser-qa-log-v1.md` (fill when testing real browsers; smoke does not replace this).

**Phase 36 (docs):** Cross-browser QA log baseline updated — `docs/www-project-public-mvp-cross-browser-qa-log-v1.md` (limited Chromium automation + BLOCKED/SKIP for Chrome/Edge/Safari/mobile; Windows Chrome/Edge still need human fill-in).

**Phase 35 (docs):** Production readiness boundary — `docs/www-project-production-readiness-boundary-v1.md` (public MVP is demo-ready, not production-ready; gates and checklist before external trial).

**Phase 39 (docs, policy only — not implemented):** Poll lifecycle — close, reveal, public lock period, cancel, unpublish/archive, collecting result visibility — `docs/www-project-phase-39-poll-lifecycle-policy-v1.md`. Read together with Phase 40.

**Phase 40 (docs, policy only — not implemented):** User profile, voting eligibility (age/region), ineligible UX, follow-result notification — `docs/www-project-phase-40-user-profile-eligibility-follow-policy-v1.md`. Implementation must satisfy **both** Phase 39 and Phase 40 (no collecting-stage result leakage; founders without intermediate signals during collecting).

**Phase 41 (docs, planning only — not implemented):** Public MVP UI policy implementation plan — maps Phase 39 lifecycle and Phase 40 eligibility/follow policies onto current pages (`/`, `/polls/new`, `/vote/:id`, `/results/:id`, `/explore`); classifies UI-only vs schema/API work — `docs/www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md`.

**Phase 47–48 (Public MVP static UI):** FAQ page (`/faq`), trust-level permission matrix (`/trust-levels`), policy-aligned demo copy, mobile readability polish — commit **`630baea`** on `origin/master` after Phase 48 push. Browser surfaces are **static/demo-facing**; normative drafts remain `docs/www-project-public-faq-draft-v1.md` and `docs/www-project-trust-level-policy-draft-v1.md`. Align with Phase 39–41.

**Phase 49 (docs):** Public MVP demo/status sync — this README section and `docs/www-project-public-mvp-demo-release-handoff-v1.md` (demo routes, product rules, not-yet-implemented list).

**Phase 50:** Public MVP demo QA and copy consistency — commit **`023cf9b`** (`fix: polish public mvp demo consistency`).

**Phase 51 (docs, planning only — not implemented):** Real MVP implementation boundary — baseline `023cf9b`, risk categories, product invariants, suggested Phase 52–60 roadmap from planning through lifecycle backend (no DB/auth/notification/scoring in this phase) — `docs/www-project-phase-51-real-mvp-implementation-boundary-v1.md`.

**Phase 52 (docs, planning only — not implemented):** Real MVP data model plan — entities, lifecycle states, privacy-sensitive fields, Phase 54 migration prep (no schema/API in this phase) — `docs/www-project-phase-52-real-mvp-data-model-plan-v1.md`. Baseline planning chain: Phase 51 @ `eab9a91`.

**Phase 53 (docs, planning only — not implemented):** Public poll lifecycle API/spec plan — endpoints, state gates, collecting privacy responses, error model (no route implementation in this phase) — `docs/www-project-phase-53-public-lifecycle-api-spec-plan-v1.md`. Baseline @ `6d71358`.

**Phase 54:** Real MVP public lifecycle schema foundation — `migrations/008_phase54_public_lifecycle_foundation.sql` adds server-controlled `polls.public_lifecycle_state`, reveal/lock/cancel/unpublish timestamps, scheduler-support indexes, and minimal `poll_eligibility_rules`. No public lifecycle routes, frontend behavior, auth/session logic, result snapshots, or counter exposure were added. Decisions and rollback notes: `docs/www-project-phase-54-public-lifecycle-schema-foundation-v1.md`.

**Phase 55A:** Public result lifecycle guard — existing `GET /polls/:id/results` reads aggregate counters only when `public_lifecycle_state` is `revealed`, `locked`, or `post_lock`. Collecting and unavailable states return a counter-free shell; legacy `status='closed'` and vote-count thresholds do not reveal results by themselves. No new route, schema, frontend, auth/session, scheduler, or notification behavior was added.

**Phase 55B:** Public read response alignment — existing `GET /polls/:id/results` responses now expose `public_lifecycle_state`; unavailable shells include lifecycle-safe copy without aggregate reads. Existing `GET /polls/:id` detail responses add the same safe lifecycle field. This remains a response-only alignment before public create/read expansion: no new route, schema, frontend behavior, auth/session, scheduler, or notification behavior was added.

**Phase 55C:** Public result page lifecycle rendering — `public/frontend/result-page.js` consumes `public_lifecycle_state` and `user_message` from existing read APIs; lifecycle collecting and unavailable shells stay counter-free, while revealed/locked/post_lock render display-safe aggregates without treating display-tier sub-30 `collecting` as lifecycle collecting. Demo `ui_state` previews unchanged. No backend schema, route, auth, or notification changes.

**Phase 55D (docs only):** Lifecycle transition API boundary plan — documents server-controlled `collecting → cancelled`, `collecting → revealed`, `revealed → locked`, `locked → post_lock`, and `post_lock → unpublished` boundaries before implementation. Phase 57 remains the proposed implementation phase; Phase 56 stays reserved for eligibility and collecting privacy guardrails. See `docs/www-project-phase-55d-lifecycle-transition-api-boundary-plan-v1.md`.

**Phase 56:** Eligibility and collecting privacy guardrails — public collecting results remain one identity-neutral counter-free shell for guests, creators, currently ineligible users, and eligible users. Shared participation checks now require `public_lifecycle_state='collecting'`, preventing Official Vote and Reference Answer after cancel/reveal/lock/post-lock/unpublish. The full age/region `poll_eligibility_rules` evaluator remains future because user profile fields are not yet implemented. See `docs/www-project-phase-56-eligibility-collecting-privacy-guardrails-v1.md`.

**Quality question incentive draft (docs, policy only — not implemented):** Creator levels, daily poll limits, quality signals, abuse rules, MVP “document and mock UI first” — `docs/www-project-quality-question-incentive-policy-draft-v1.md`. No scoring schema or API in this draft.

**Phase 28:** Shared lightweight stylesheet `public/frontend/public-mvp.css` for all public MVP pages (mobile-friendly layout; no UI framework).

**Spec note:** Agent spec **§32 Phase 5 (Wonder Flow / Ranking) is not fully complete.** Phases 5B–5C deliver only `GET /polls/feed` (public, non-personalized, freshness-only; no answer-direction signals).

**Admin / governance (Phase 6B–12):** Typo correction workflow, Dual-Admin decisions, apply, suspended correction with public notice **write**, safe **audit read** routes, blind `review-context` (`decision_summary` only; no `peer_decisions` / `final_decisions` / admin IDs / reason fields), poll-scoped public notice **read + display**, the safe global `GET /admin/correction-audit` queue, and a server-side opaque Bearer token + RBAC v1 boundary are **implemented**. Full login/session/JWT/OAuth management, real Spread Score calculation, and semantic typo detection are **not** implemented — see `docs/admin-correction-http.md` and `docs/www-project-milestone-phase-12-handoff-v1.md`.

## Prerequisites

- Node.js 20+
- PostgreSQL (optional for `npm run migrate`; required from Phase 1 onward)

## Commands

```bash
npm install
npm run typecheck
npm run build
npm start
npm test
npm run migrate:check
# Apply migrations when DATABASE_URL is set:
# DATABASE_URL=postgres://... npm run migrate
```

`npm test` stays **DB-free**. Optional PostgreSQL integration tests (local/manual, **PostgreSQL 17+**, isolated database **`www_test` only**). Full setup, safety checks, and single-file runs: **`docs/www-project-phase-15-pg-integration-test-setup-v1.md`**.

```bash
npm run test:integration:local
npm run smoke:admin:local
npm run smoke:public:local
npm run demo:public:local
```

`npm run demo:public:local` starts Docker `www_test` if needed, applies migrations, seeds **local-only** fake official demo voters (for reliable manual voting on `127.0.0.1`), sets fake `ADMIN_AUTH_CREDENTIALS_JSON` in the process only, then listens on port 3000 until Ctrl+C. Refuses non-`www_test` URLs. Does not commit secrets.

The integration quick command starts the local Docker test service if needed, waits for health, runs migration validation and apply, then runs the integration suite. The admin smoke command uses the same isolated `www_test` database with fake local-only admin credentials and synthetic fixture rows. The public flow smoke command validates `GET /` → `/polls/new` → create poll → `/vote/:pollId` → vote-by-index → `/results/:pollId` without a browser, and checks that public JSON responses do not expose `option_id`, vote tokens, or shard internals. All local smoke commands intentionally leave the test container running for fast reruns. If `DATABASE_URL` is unset, the lower-level `npm run test:integration` exits immediately with setup instructions (environment not ready — not a unit-test regression). See Phase 15 doc §8 and Phase 14 doc §8.

## Layout

- `src/` — application code
- `tests/` — Vitest suites
- `migrations/` — ordered PostgreSQL migrations
- `docs/` — implementation specs and operator docs (e.g. `docs/admin-correction-http.md`)

## Public APIs (Phase 0–5C)

All mutating poll routes require header `X-User-Id` (UUID). Optional `X-Display-Name` on create.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/polls` | Create draft or published poll |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking signals) |
| `DELETE` | `/polls/:id` | Creator soft-delete |
| `POST` | `/polls/:id/reference-answer` | Record Reference Answer participation only |
| `POST` | `/polls/:id/vote` | Record Official Vote and increment aggregate shard |
| `POST` | `/polls/:id/vote-by-index` | Record Official Vote from a public option index; internal option ID stays server-side |
| `GET` | `/polls/:id/results` | Read display-safe aggregate Official Vote results |
| `GET` | `/polls/feed` | Public freshness-only discovery feed (5B–5C; see below) |
| `GET` | `/polls/:id/public-notices` | Read visible public correction notices (Phase 8) |
| `GET` | `/results/:id` | Public identity-neutral result page |
| `GET` | `/` | Public landing page (entry to create poll flow) |
| `GET` | `/explore` | Read-only placeholder explaining no public poll list yet (not a feed UI) |
| `GET` | `/faq` | Static FAQ (policy-aligned Traditional Chinese; demo-facing) |
| `GET` | `/trust-levels` | Static trust-level permission matrix (demo-facing) |
| `GET` | `/my-polls` | Creator dashboard mock (inert controls) |
| `GET` | `/vote/demo` | Static vote policy shell (`?ui_state=`, `?nav=`) |
| `GET` | `/results/demo` | Static results policy shell (`?ui_state=`, `?nav=`) |
| `GET` | `/polls/new` | Minimal public poll creation UI |
| `GET` | `/vote/:id` | Minimal public voting UI |
| `GET` | `/health` | Health check |
| `GET` | `/frontend/*` | Static frontend assets (JS, shared `public-mvp.css`) |

`PUT` / `PATCH` on polls return `405` (creator zero-edit after publish).

Minimal public poll creation UI: `GET /polls/new`. It submits to the existing `POST /polls` contract with general MVP defaults and does not add login, session, ranking, or edit behavior.

Minimal public voting UI: `GET /vote/:id`. It loads public poll detail, submits the selected public `option_index` to `POST /polls/:id/vote-by-index`, and links to the identity-neutral result page without exposing internal option IDs.

**Minimal public flow (Phase 23–24):**

1. `GET /` — landing page; primary circulation is **share links** (vote/results URLs)
2. `GET /explore` — placeholder only: explains list/explore is not open; does not query or list polls (Phase 30)
3. `GET /polls/new` — create a poll
4. Success shows shareable full URLs for `GET /vote/:pollId` and `GET /results/:pollId` (copy buttons + visible links; poll id only, no tokens)
5. `GET /vote/:pollId` — vote; success links to results
6. `GET /results/:pollId` — **read-only** display-safe results with vote-page navigation; no login, real feed UI, ranking, or admin UI (Phase 29–30)

Manual browser checklist (Traditional Chinese): **`docs/www-project-public-mvp-manual-qa-v1.md`**.

Demo/release handoff (Traditional Chinese, showcase + boundaries): **`docs/www-project-public-mvp-demo-release-handoff-v1.md`**.

Cross-browser QA log (Traditional Chinese, PASS/WARN/FAIL tables for real devices): **`docs/www-project-public-mvp-cross-browser-qa-log-v1.md`**.

**Production readiness boundary (Traditional Chinese, demo vs production gates; not a deploy completion proof):** **`docs/www-project-production-readiness-boundary-v1.md`**.

**Local demo startup (Traditional Chinese):** preferred: `npm run demo:public:local` → open `http://127.0.0.1:3000/`. Manual path: session `DATABASE_URL` on `www_test`, seed demo users, migrate, build, `npm start`. Step-by-step: **`docs/www-project-local-demo-startup-v1.md`** (not for production deploy). Public MVP UI is a functional CSS skeleton; full visual redesign is a later UI Phase.

### Public MVP current status (Phase 49 — demo handoff)

**Baseline commit (Phase 48):** `630baea` — FAQ, trust-level matrix, mobile readability polish.

The public browser surface remains **share-link first** and **static/demo-facing** for policy UX: create a poll, copy vote/results URLs, vote once per user header (`X-User-Id`), read display-safe results when the backend lifecycle allows. There is **no** real login/session, DB-backed public lifecycle UI, notification persistence, trust scoring persistence, feedback persistence, or production ranking/feed personalization on these pages.

| Page | Route | Notes |
|------|-------|--------|
| Landing | `/` | Entry; links to create, explore, FAQ, trust matrix |
| FAQ | `/faq` | Static policy Q&A (Traditional Chinese); aligns with Phase 39–41 drafts |
| Trust levels | `/trust-levels` | Static Lv.0–Lv.4 permission matrix (demo copy) |
| Create poll | `/polls/new` | Posts to `POST /polls`; shows share URLs on success |
| My polls (mock) | `/my-polls` | Creator dashboard **mock** only — buttons inert |
| Vote | `/vote/:pollId` | Submits `option_index` via `vote-by-index` |
| Vote (demo) | `/vote/demo` | Static policy shell; optional `?ui_state=` for QA |
| Results | `/results/:pollId` | Read-only display-safe stats when revealed |
| Results (demo) | `/results/demo` | Static lifecycle shells via `?ui_state=` (see handoff doc) |
| Explore | `/explore` | **Placeholder** — sample cards link to demo routes; **not** `GET /polls/feed` UI |

**Demo query params (static pages only):**

| Param | Values | Purpose |
|-------|--------|---------|
| `nav` | `guest`, `logged-in-mock` | Toggle header/nav mock (not real auth) |
| `ui_state` | `collecting`, `revealed`, `locked`, `post_lock`, `cancelled`, `unpublished`, … | Preview lifecycle copy on `/vote/demo`, `/results/demo`, etc. |

Full demo URL list and product rules: **`docs/www-project-public-mvp-demo-release-handoff-v1.md`**.

**Collecting-stage privacy (product rule, MVP UI + future API):** While a poll is **collecting**, do **not** show vote counts, percentages, totals, ranking, trends, or progress — including to the **creator**. **Close** ends the voting/statistical period and reveals aggregate results; it does **not** mean the public lock period ends (MVP may use close time as reveal time). **Public lock period (MVP draft):** ~5 days after reveal — during lock, creator cannot unpublish/delete/edit/reopen/hide results; after lock, creator may unpublish. **Cancel** stops collecting (not “unpublish”); unpublish copy: 「此問卷已結束公開鎖定期，並由發起者下架。」 Ineligible users may see basic info, cannot vote, cannot see collecting results, but may **follow results** (MVP = in-app notification placeholder; email/push future). **Skip voting, view results** remains future.

**Trust levels (direction, static matrix):** Lv.0 訪客 · Lv.1 註冊用戶 · Lv.2 可信註冊用戶 · Lv.3 高信任分用戶 · Lv.4 高信任（尚未開放）. Trust level cannot bypass political/high-risk review. **功能點數** may be paid later for features/exposure but **cannot buy trust**. **信用點數** comes from quality and positive contribution and **cannot be purchased**. High-risk topics cannot bypass review by points or payment.

**Not yet implemented (Public MVP product path):** DB-backed public flow; real auth; notification persistence; trust scoring persistence; feedback persistence; production ranking/feed personalization.

Polls in `suspended` or `correction_pending` are hidden from public GET/feed/vote/result/reference-answer (backend behavior unchanged).

### `GET /polls/feed` (Phase 5B–5C)

**Privacy / ranking contract (unchanged):**

- Public, **non-personalized**, **freshness-only** — no ranking by engagement, option percentages, vote growth, Manipulation Integrity Warning, or user answer direction.
- SQL uses **`polls` only** — no dependency on `poll_options`, `poll_vote_tokens`, `poll_reference_answer_tokens`, or `poll_option_vote_counters`.
- Filter: `status = 'active'` and `published_at IS NOT NULL`.
- Order: `published_at DESC`, `id ASC`.
- Response items do **not** expose precise `published_at`, participation fields, options, or vote/token/counter data.

**Pagination (Phase 5C):**

| Query param | Rules |
|-------------|--------|
| `limit` | Optional; integer **1..50**; default **50** |
| `cursor` | Optional; opaque `v1.<base64url>` keyset cursor |
| *(other)* | `400 UNSUPPORTED_QUERY_PARAMS` |

Response includes `polls` (same safe fields as 5B) and `next_cursor` (`string` or `null`). Cursor payload encodes only **`published_at` + `poll_id`** for keyset continuation (not `user_id`, options, or vote data). Pagination uses **keyset** (`published_at` / `id`), not `OFFSET`.

PostgreSQL partial index: `idx_polls_public_feed_freshness` (`migrations/005_phase5c_public_feed_index.sql`).

## Admin correction APIs (Phase 6B–12)

Require `Authorization: Bearer <opaque-token>`. Production config supplies SHA-256 token digests, admin IDs, role, and permissions through `ADMIN_AUTH_CREDENTIALS_JSON`; legacy `X-Admin-User-Id` is not trusted. See `docs/admin-correction-http.md` and `docs/www-project-phase-14-admin-auth-deployment-v1.md`.

Full route table, DTO allowlist, status machines, public notice behavior, and stubs: **`docs/admin-correction-http.md`**.

| Method | Path | Summary |
|--------|------|---------|
| `POST` | `/admin/correction-requests` | Create correction for active/closed poll |
| `GET` | `/admin/correction-requests/:id/review-context` | Blind review context (`decision_summary` only) |
| `GET` | `/admin/correction-requests/:id/audit-record` | Safe read-only audit snapshot |
| `GET` | `/admin/polls/:pollId/correction-audit` | Paginated safe correction audit list for one poll |
| `GET` | `/admin/correction-audit` | Paginated safe global correction audit queue |
| `POST` | `/admin/correction-requests/:id/decisions` | Submit approve/reject |
| `POST` | `/admin/correction-requests/:id/apply` | Apply approved correction |
| `POST` | `/admin/suspended-correction-requests` | Suspended poll → `correction_pending` |
| `POST` | `/admin/suspended-correction-requests/:id/apply` | Apply + reactivate + write public notice |

Public correction notices are read through `GET /polls/:id/public-notices`; see `docs/admin-correction-http.md`.

## Current scope

**Implemented:**

- `users`, `polls`, `poll_options`
- Reference Answer Design B (participation token only; no durable option storage)
- Official Vote tokens and aggregate sharded counters
- Privacy-safe result display tiers
- Frontend selection state in page-local runtime memory; cleared on submit, `pagehide`, and BFCache `pageshow`
- `GET /polls/feed` — freshness-only public feed with optional cursor pagination (5C)
- Poll visibility / archive (6A)
- Real MVP public lifecycle schema foundation (54): server-controlled lifecycle fields and minimal `poll_eligibility_rules`; API behavior remains future work
- Admin typo correction foundation (6B): schema, requests, Dual-Admin decisions, apply, suspended path, admin HTTP routes (6C)
- Admin correction audit read API (7.4): `audit-record`, per-poll `correction-audit`
- Review-context decision leak fix (7.5): anonymous `decision_summary` only on workflow read
- Poll-scoped public notice read API (8): visible fixed-template notices only
- Global admin correction audit queue (9): safe cross-poll list with bounded filters
- Poll-scoped public notice display UI (11): allowlisted public notices only on `/results/:id`
- Admin Auth / RBAC v1 (12): opaque Bearer token registry + server-side permission boundary for `/admin/*`

**Not implemented (see spec and `docs/admin-correction-http.md`):**

- Full spec §32 Phase 5 Wonder Flow / ranking beyond the 5B–5C feed slice
- Feed discovery UI, filters, personalization, `total_count`
- Real Spread Score calculation, 24h pre-apply recompute, semantic typo guard
- Spread Score ranking / priority
- Full admin login/session/JWT/OAuth management and token rotation automation
- Other frontend admin UI
- Future high-sensitivity category guardrails and other deferred spec phases

Run `npm run migrate:check` for the current migration count. Run `npm test` on any branch; use `npm run test:integration:local` for the isolated local Docker `www_test`, or run `npm run test:integration` when `DATABASE_URL` points at an isolated `www_test` (see Phase 15 doc).
