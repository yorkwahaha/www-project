# WWW Project — Phase 0–12

**What We Wonder／大家想知道** — privacy-preserving public poll platform.

This repository implements delivery milestones **Phase 0 through Phase 12**: Poll Core, Reference Answer Design B, Official Vote, Result Display, frontend privacy closure (5A), the public freshness-only discovery feed (5B–5C), poll visibility/archive (6A), **admin typo correction governance (6B/6C)**, **admin correction audit read + review-context hardening (7.3B–7.5)**, the poll-scoped **public notice read API (8)**, the safe global **admin correction audit queue (9)**, DB-backed integration coverage synchronization for the Phase 8/9 read surfaces (10), the poll-scoped **public notice display UI (11)**, and the server-side **Admin Auth / RBAC v1 boundary (12)**.

Normative rules: `/AGENTS.md` and `docs/www-project-agent-spec-v0.1.md`.

Milestone summaries: `docs/www-project-milestone-phase-0-5b-handoff-v1.md` (through 5B), `docs/www-project-milestone-phase-0-5c-handoff-v1.md` (5C feed pagination), `docs/www-project-milestone-phase-10-handoff-v1.md` (Phase 8/9 PG integration synchronization), `docs/www-project-milestone-phase-11-handoff-v1.md` (public notice display UI), and `docs/www-project-milestone-phase-12-handoff-v1.md` (Admin Auth / RBAC v1).

**Phase 14 (docs):** Admin Auth v1 production deployment handoff — `docs/www-project-phase-14-admin-auth-deployment-v1.md` (configure and verify `ADMIN_AUTH_CREDENTIALS_JSON` before admin UI / JWT / OAuth work).

**Phase 15 (docs):** PostgreSQL integration test setup — `docs/www-project-phase-15-pg-integration-test-setup-v1.md` (use `npm run test:integration:local` for the isolated local Docker `www_test`, or run `npm run test:integration` when `DATABASE_URL` is set explicitly).

**Phase 20 (docs):** Correction / admin governance handoff index (Phase 8–19 baseline, validation commands, privacy boundaries, TODOs) — `docs/www-project-phase-20-correction-admin-governance-handoff-v1.md`.

**Phase 27 (docs):** Public MVP manual QA handoff (local setup, validation commands, browser checklist for `/` → create → vote → results) — `docs/www-project-public-mvp-manual-qa-v1.md`. **Lifecycle / creator live flow:** prefer Phase 60 doc first when testing `?live=1` and `?creator=1`.

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

**Phase 56:** Eligibility and collecting privacy guardrails — public collecting results remain one identity-neutral counter-free shell for guests, creators, currently ineligible users, and eligible users. Shared participation checks now require `public_lifecycle_state='collecting'`, preventing Official Vote and Reference Answer after cancel/reveal/lock/post-lock/unpublish. At Phase 56, the full age/region `poll_eligibility_rules` evaluator remained future because user profile fields were not yet implemented; Phase 66C has since implemented the Official Vote profile eligibility evaluator only. See `docs/www-project-phase-56-eligibility-collecting-privacy-guardrails-v1.md`.

**Phase 57:** Public lifecycle transition write APIs — creator-authenticated `POST /polls/:id/cancel`, `POST /polls/:id/close`, and `POST /polls/:id/unpublish` now use bounded row-lock transactions with server-written timestamps. Internal `revealPoll` and `advancePublicLifecycle` service helpers support scheduler calls without deploying a scheduler. `public_lifecycle_state` remains authoritative; collecting and unavailable result paths remain counter-free. See `docs/www-project-phase-57-lifecycle-transition-write-apis-v1.md`.

**Phase 58A:** Lifecycle scheduler advancement foundation — `createPublicLifecycleSchedulerService` can advance `revealed → locked` and `locked → post_lock` in bounded batches; **no cron or deployment wiring yet**. See `docs/www-project-phase-58a-lifecycle-scheduler-advancement-foundation-v1.md`.

**Phase 58B–58D:** Frontend creator lifecycle controls on `/polls/new?live=1`, `/my-polls?live=1`, and `/results/:id?creator=1`; result display re-fetch after successful transitions; safe copy when re-fetch fails. See `docs/www-project-phase-58b-frontend-creator-lifecycle-controls-v1.md`.

**Phase 59:** Public MVP creator flow polish — shared Traditional Chinese guidance for vote sharing, poll management links, and cancel / close-reveal / unpublish semantics. See `docs/www-project-phase-59-public-mvp-creator-flow-polish-v1.md`.

**Phase 60 (docs):** Public MVP lifecycle manual QA and handoff refresh (Phases 57–59 live flow, checklist, known limitations) — `docs/www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`. Updates read order in `docs/www-project-public-mvp-manual-qa-v1.md`.

**Phase 60F–61 (docs):** README Public MVP status — live creator routes (`?live=1`, `?creator=1`), Minimal public flow, and `GET /polls/:id/results` lifecycle gating wording.

**Phase 62 (docs):** Public MVP status checkpoint and next-phase planning (post Phases 57–61; candidate phases with risk labels) — `docs/www-project-phase-62-public-mvp-status-checkpoint-v1.md`.

**Phase 63:** Public explore feed UI — `GET /explore` lists collecting polls from existing `GET /polls/feed` (freshness-only; no vote counts, ranking, or personalization).

**Phase 64:** Explicit lifecycle scheduler runner — after build, `npm run scheduler:lifecycle -- --limit 100` runs one bounded server-side batch for due `revealed → locked` and `locked → post_lock` transitions. It is safe for manual or cron invocation, but no production cron is installed by this repository. See `docs/www-project-phase-64-lifecycle-scheduler-runner-v1.md`.

**Phase 65A:** Creator session foundation — digest-backed fixed-TTL `creator_session` cookies, exact-match Origin gate, local/test-only issuance, and production fail-closed behavior. No frontend UX or creator ownership rewiring. See `docs/www-project-phase-65a-creator-session-foundation-v1.md`.

**Phase 65B:** Backend creator-owned poll APIs — authenticated `/creator/polls` create/list/delete/lifecycle routes use only the Phase 65A cookie principal. Owned list reads are bounded, deterministic, polls-table-only, and counter-free. The then-deferred legacy `/polls` creator-write risk is resolved by Phase 65C-A/B. See `docs/www-project-phase-65b-creator-owned-poll-apis-v1.md`.

**Phase 65C-A:** Live creator frontend cutover — `/polls/new?live=1`, `/my-polls?live=1`, and creator lifecycle controls now use Phase 65B `/creator/polls` APIs with the Phase 65A cookie. Local/demo live mode bootstraps only the local-test creator session; no production login UX, schema change, ranking, scheduler, or legacy route retirement was added in that phase. The remaining legacy `/polls` creator-write risk is resolved by Phase 65C-B. See `docs/www-project-phase-65c-a-frontend-creator-api-cutover-v1.md`.

**Phase 65C-B:** Legacy creator-write retirement — development-era `/polls` creator writes that trusted client-selected `X-User-Id` now fail closed with `410 LEGACY_CREATOR_WRITE_RETIRED`. There is no dev or production bypass. Use `/creator/polls` with the Phase 65A creator cookie for create/delete/lifecycle writes. Public reads, vote, vote-by-index, Reference Answer, feed, notices, results, and scheduler behavior are unchanged. See `docs/www-project-phase-65c-b-legacy-creator-write-retirement-v1.md`.

**Phase 65 (docs):** Final creator auth & ownership checkpoint — summarizes 65A session, 65B `/creator/polls`, 65C-A live frontend cutover, 65C-B legacy 410 retirement, remaining non-goals, and Phase 66 plan-only entry — `docs/www-project-phase-65-final-creator-auth-ownership-checkpoint-v1.md`.

**Phase 66A (docs):** Profile / eligibility / demographic qualification boundary spec (66P-R approved; 66B schema limited to display name, birth year-month, region; gender excluded; vote-by-index eligibility ordering and indistinguishable denials) — `docs/www-project-phase-66-profile-eligibility-boundary-spec-v1.md`.

**Phase 66B:** Minimal user profile schema foundation — `migrations/010_phase66b_user_profile_foundation.sql` adds nullable user-scoped `birth_year_month` and `residential_region`; existing `users.display_name` remains the display field. No gender, exact birthday, evaluator, API/runtime/frontend behavior, vote flow, Reference Answer behavior, ranking, personalization, or demographic breakdowns were added.

**Phase 66C:** Profile eligibility evaluator only — Official Vote and `vote-by-index` now check `poll_eligibility_rules` against nullable user profile fields inside the vote transaction before option resolution, vote token write, or counter increment. Reference Answer eligibility, frontend UX, ranking, personalization, demographic breakdowns, public result behavior, and creator eligibility edits remain unchanged.

**Phase 66E-P (docs):** Profile update API foundation plan — user-authenticated future API draft for `birth_year_month` and coarse `residential_region` only; no runtime, schema, frontend, Reference Answer, ranking, result, feed, notice, scheduler, or demographic behavior changes — `docs/www-project-phase-66e-profile-update-api-plan-v1.md`.

**Phase 66E-A:** Profile update API foundation — `GET /users/me/profile` and `PUT /users/me/profile` read/update only `birth_year_month` and coarse `residential_region` through user auth. No gender, exact birthday, migration, frontend UX, Reference Answer eligibility, ranking, result, feed, notice, scheduler, personalization, demographic breakdown, vote-time snapshot, backfill, or historical recalculation was added.

**Phase 66F-P (docs):** Profile UX / onboarding plan — future profile UI may collect only `birth_year_month` and coarse `residential_region` for Official Vote eligibility prompts; no gender, exact birthday, precise location, runtime/frontend/API/schema, Reference Answer, ranking, personalization, demographic, snapshot, backfill, or recalculation behavior changes — `docs/www-project-phase-66f-profile-ux-onboarding-plan-v1.md`.

**Phase 66F:** Profile UX — `GET /profile` collects only `birth_year_month` and coarse `residential_region` via `GET`/`PUT /users/me/profile` with MVP `X-User-Id` (no creator cookie). Save/clear, fixed ineligible vote copy, mobile-readable form. No gender, exact birthday, precise location, Reference Answer eligibility, ranking, or demographic breakdowns.

**Phase 66 (docs):** Final profile eligibility checkpoint — summarizes 66A–66F (boundary spec, schema, evaluator, route tests, profile API, profile UX), vote-by-index ordering, Reference Answer exclusion, Raw Option Linkage Ban, manual QA checklist, and MVP `X-User-Id` auth limitation — `docs/www-project-phase-66-final-profile-eligibility-checkpoint-v1.md`.

**Phase 67 (docs + UX copy):** Profile eligibility demo QA & public UX hardening — end-to-end demo/QA handoff for `/profile`, live creator flow, vote eligibility copy, results boundaries; README index; fixed vote policy panel + copy guard tests. Frontend auth remains MVP `X-User-Id` (production auth later). No schema, evaluator, transaction order, or Reference Answer scope changes — `docs/www-project-phase-67-profile-eligibility-demo-qa-v1.md`.

**Phase 68 (docs + UX copy):** Public demo polish & manual QA closure — README demo test order, integrated Phase 65–67 manual QA (creator session, profile, vote eligibility, results), FAQ/handoff updates, public page copy consistency, copy guard tests. No schema, auth, evaluator, or Reference Answer scope changes — `docs/www-project-phase-68-public-demo-polish-manual-qa-closure-v1.md`.

**Phase 69 (docs):** MVP demo release readiness & handoff closure — consolidates Phases 65–68 into a showcase-ready, testable, handoff state: release readiness checklist, demo startup, tester operation order, known limits (MVP `X-User-Id`, production auth later, scheduler not in `npm start`), and invariant boundaries. **Recommended tester entry:** `docs/www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md`. No schema, auth, evaluator, or Reference Answer scope changes.

**Phase 70A:** Production user auth resolver foundation — `src/auth/user-auth-resolver.ts` defines `UserAuthResolver` / `AuthenticatedUserContext`, production fail-closed behavior without a trusted verifier, and explicit local/test MVP `X-User-Id` compatibility marked as non-production. `/users/me/profile`, Official Vote, `vote-by-index`, creator-owned routes, and Reference Answer are not cut over yet; Phase 70B is the profile API cutover. Plan and boundaries: `docs/www-project-phase-70-production-user-auth-account-boundary-plan-v1.md`.

**Phase 70B:** Profile API production auth cutover — `GET /users/me/profile` and `PUT /users/me/profile` now resolve identity via `UserAuthResolver` instead of reading raw `X-User-Id` directly. Production (`APP_ENV=production`) fail-closed unless a trusted credential verifier is configured; local/demo/test (`APP_ENV=development|test`) keep explicit MVP `X-User-Id` compatibility. `creator_session` does not authorize profile routes. Vote, vote-by-index, creator, and Reference Answer routes are unchanged. No schema, response shape, or eligibility evaluator changes.

**Phase 70C-P (docs):** Official Vote UserAuth cutover plan — specifies how future `POST /polls/:id/vote` and `POST /polls/:id/vote-by-index` should move to `UserAuthResolver` while preserving transaction order, `vote-by-index` ineligible indistinguishability, Reference Answer separation, creator-session separation, and the Raw Option Linkage Ban. No runtime, migration, API behavior, vote transaction, Reference Answer, result/feed/notices/scheduler/ranking/personalization, or creator behavior changes — `docs/www-project-phase-70c-official-vote-user-auth-cutover-plan-v1.md`.

**Phase 70C-I:** Official Vote route adapter UserAuth cutover — `POST /polls/:id/vote` and `POST /polls/:id/vote-by-index` now resolve identity via `UserAuthResolver` instead of reading raw `X-User-Id` directly. Production (`APP_ENV=production`) fail-closed unless a trusted credential verifier is configured; local/demo/test keep explicit MVP `X-User-Id` compatibility. `creator_session` does not authorize public vote routes. Reference Answer, profile API, service transaction order, token/counter schema, and eligibility evaluator are unchanged. Plan: `docs/www-project-phase-70c-official-vote-user-auth-cutover-plan-v1.md`.

**Phase 70D-P (docs):** Production creator_session strategy plan — recommends keeping `creator_session` local/demo-only while production `/creator/*` moves toward formal `UserAuthResolver` user auth plus creator ownership checks. This is specification only: no runtime, migration, API behavior, profile, vote, Reference Answer, ranking, result, feed, notice, scheduler, or frontend behavior has been implemented — `docs/www-project-phase-70d-production-creator-session-strategy-plan-v1.md`.

**Phase 70D-I-A (docs):** Creator route adapter UserAuth cutover plan — specifies the future production `/creator/*` route adapter move from creator_session-only authority to `UserAuthResolver` plus creator ownership checks, with route-by-route rules and validation requirements. This is specification only; no runtime, migration, API behavior, creator session, profile, vote, Reference Answer, ranking, result, feed, notice, scheduler, or frontend behavior has been implemented — `docs/www-project-phase-70d-creator-route-adapter-userauth-cutover-plan-v1.md`.

**Phase 70D-I-B:** Creator route adapter UserAuth cutover — production `/creator/polls` and production `GET /creator/session` now resolve creator identity via `UserAuthResolver` instead of `creator_session` or raw `X-User-Id`. Production (`APP_ENV=production`) fail-closed unless a trusted credential verifier is configured; `POST /creator/session` issuance remains fail-closed. Local/demo/test keep explicit `creator_session` compatibility (non-production identity). `creator_session` does not authorize public vote, vote-by-index, profile, or Reference Answer. Service ownership checks, Origin gate, and owned-list counter-free behavior are unchanged. Plan: `docs/www-project-phase-70d-creator-route-adapter-userauth-cutover-plan-v1.md`.

**Phase 70 (final checkpoint):** Production auth boundary cutover checkpoint — consolidates Phase 70 plan, 70A resolver foundation, 70B profile cutover, 70C Official Vote / vote-by-index cutover, and 70D creator_session strategy + `/creator/*` cutover. Production route adapters for profile, vote, vote-by-index, and creator-owned polls use `UserAuthResolver`; raw `X-User-Id` is not production identity; `creator_session` remains local/demo/test-only and does not authorize public vote, profile, or Reference Answer. Reference Answer is not cut over to `UserAuthResolver`. Remaining work: production credential verifier, formal user session integration, and frontend production login UX — `docs/www-project-phase-70-final-production-auth-boundary-checkpoint-v1.md`.

**Phase 71 (docs):** Production credential verifier / formal user session planning — defines the future `trustedCredentialVerifier` responsibility boundary, formal session credential lifecycle, frontend production login UX minimum boundary, explicit non-production-only `X-User-Id` compatibility, `creator_session` exclusion from production public identity, Reference Answer deferral, fail-closed rollback, and auth/privacy guardrails. No runtime, frontend, migration, schema, API behavior, vote transaction, profile eligibility, Reference Answer, creator route, ranking, personalization, logging, metrics, APM, debug, analytics, or error payload behavior changes — `docs/www-project-phase-71-production-credential-verifier-plan-v1.md`.

**Phase 72:** Production credential verifier foundation — adds a minimal `USER_AUTH_CREDENTIALS_JSON` opaque Bearer verifier for `UserAuthResolver` production wiring. Config stores SHA-256 token digests, canonical `user_id`, `expires_at`, and optional `revoked_at`; missing verifier config remains production fail-closed. Local/demo/test `X-User-Id` compatibility remains explicit non-production only; `creator_session` is still not production public identity. No login UX, frontend behavior, migration, DB schema, API behavior, vote token/counter schema, vote transaction order, profile eligibility, Reference Answer, creator route behavior, ranking, personalization, analytics, metrics, traces, debug payload, or error payload behavior changes — `docs/www-project-phase-72-production-credential-verifier-foundation-v1.md`.

**Phase 73 (docs):** Production login / session UX planning — defines the future production login UX minimum flow, logout / expired / revoked credential copy boundaries, frontend credential storage risks, production vs local/demo/test auth flow split, `Authorization: Bearer` + `UserAuthResolver` boundary, `creator_session` exclusion from production identity, Reference Answer deferral, fail-closed rollback, and auth/privacy guardrails. No runtime, frontend, migration, DB schema, API behavior, verifier behavior, vote transaction, profile eligibility, vote token/counter schema, Reference Answer, creator route behavior, ranking, personalization, analytics linkage, precise location, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior changes — `docs/www-project-phase-73-production-login-session-ux-plan-v1.md`.

**Phase 74:** Production login UI shell / auth state UX foundation — adds static `GET /login` page and `login-page.js` shell explaining that **正式登入尚未啟用**, production protected routes **fail closed** without an approved verifier, and local/demo continues explicit MVP `X-User-Id` / `creator_session` test identity. Guest header links route to `/login`; form controls are disabled and do not call login APIs or browser credential storage. No DB, session issuance, `UserAuthResolver`/verifier runtime change, or protected API behavior change — `docs/www-project-phase-74-production-login-ui-shell-checkpoint-v1.md`.

**Phase 75:** Auth state display / navigation UX polish — shared `auth-state-copy.js`, header auth state chips, `renderAuthStateBanner`, and clearer demo nav switch copy across home, profile, vote, and my-polls pages. Distinguishes production login-not-yet-enabled, MVP `X-User-Id` test identity, and `creator_session` creator-only demo flow; guest CTAs stay aligned with `/login`. No DB, session issuance, verifier runtime change, or protected API behavior change — `docs/www-project-phase-75-auth-state-navigation-ux-checkpoint-v1.md`.

**Phase 76 (docs):** Public demo release checkpoint / auth UX QA closure — consolidates Phase 70–75 auth/login/demo UX state, demo testable routes (`/`、`/login`、`/profile`、`?live=1` creator flow、`/vote/:id`、`/results/:id`、`/explore`), production `UserAuthResolver` + Bearer verifier foundation vs disabled `/login` shell vs explicit non-production `X-User-Id` / `creator_session`, Reference Answer deferral, and sealed invariants (Official Vote transaction order, vote-by-index eligibility before option resolve, vote token / counter schema, Raw Option Linkage Ban). No runtime, frontend UX, DB, API, or verifier behavior change — `docs/www-project-phase-76-public-demo-auth-ux-qa-closure-checkpoint-v1.md`.

**Phase 77 (docs):** Production login session runtime plan — compares HttpOnly Secure SameSite cookie sessions with `Authorization: Bearer` opaque credentials, recommends cookie session as the next production browser login/session runtime, and defines future `UserAuthResolver` / `trustedCredentialVerifier`, login submit, logout, expiration, revocation, CSRF/XSS, non-production `X-User-Id`, `creator_session`, Reference Answer, migration/DB schema, and auth/privacy boundaries. No runtime, frontend, DB, migration, API behavior, verifier behavior, vote transaction, vote token/counter schema, Reference Answer, ranking, personalization, demographic, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior change — `docs/www-project-phase-77-production-login-session-runtime-plan-v1.md`.

**Phase 78:** Production session schema foundation — `migrations/011_phase78_production_user_session_foundation.sql` adds digest-backed `user_sessions` lifecycle storage (`session_id`, `token_sha256`, `user_id`, timestamps) plus repository and tests. No login submit, `Set-Cookie`, formal logout API, `UserAuthResolver` behavior, production `trustedCredentialVerifier` behavior, protected API behavior, vote transaction, profile eligibility, vote token/counter schema, Reference Answer, ranking, personalization, demographic, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior changed — `docs/www-project-phase-78-production-session-schema-foundation-v1.md`.

**Phase 79 (docs):** Production login submit / session cookie issuance plan — defines future login submit, raw session token handling, digest-only `token_sha256` persistence, `Set-Cookie` flags, expiration, revocation, `last_used_at`, logout/revoke, CSRF, `UserAuthResolver` / `trustedCredentialVerifier`, production vs local/demo/test identity, `creator_session`, `X-User-Id`, Reference Answer, vote, Raw Option Linkage Ban, and privacy boundaries. No runtime, route, migration, schema, cookie issuance, login submit, logout API, CSRF runtime, verifier, resolver, protected API, frontend, vote, profile, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior change — `docs/www-project-phase-79-production-login-session-cookie-plan-v1.md`.

**Phase 80:** Production login submit runtime foundation — `POST /login/session` is available only when backed by the existing `trustedCredentialVerifier` boundary and Phase 78 `user_sessions`; successful verification issues a Secure HttpOnly SameSite=Lax `www_session` cookie while persisting only `token_sha256`. `DELETE /login/session` revokes the current valid session by digest and clears the cookie. Protected APIs, frontend login UI submit behavior, Official Vote, `vote-by-index`, profile eligibility, Reference Answer, creator-session identity, ranking, analytics, logs/metrics/APM/error payloads, vote token schema, and counter schema are unchanged — `docs/www-project-phase-80-production-login-submit-runtime-foundation-v1.md`.

**Phase 81:** UserAuthResolver session read integration — when configured with the Phase 78 repository, `UserAuthResolver` can resolve production identity from `www_session` by hashing the raw cookie token and looking up `user_sessions.token_sha256`; missing, malformed, unknown, expired, revoked, and inactive-user sessions fail closed, and `last_used_at` updates only after successful verification. Non-production `X-User-Id` compatibility is unchanged; `creator_session` remains separate local/demo/test creator flow only. Official Vote, `vote-by-index`, Reference Answer, profile eligibility, frontend login UI, ranking, analytics, vote token schema, and counter schema are unchanged — `docs/www-project-phase-81-user-auth-resolver-session-read-integration-v1.md`.

**Phase 82:** Authenticated me endpoint foundation — `GET /users/me` resolves identity through `UserAuthResolver` and returns only `user_id` and `display_name`. Production identity follows Phase 81 `www_session` behavior; development/test preserve explicit `X-User-Id` compatibility. No session internals, token/cookie values, profile eligibility fields, vote or option data, frontend login UI, Reference Answer, Official Vote, ranking, analytics, vote token schema, or counter schema changes — `docs/www-project-phase-82-authenticated-me-endpoint-foundation-v1.md`.

**Phase 83:** Frontend login state read / minimal UI hook — site chrome calls `GET /users/me` with `credentials: 'same-origin'` and shows only `display_name` in the header when authenticated; logged-out state stays quiet. No login/registration form UI, logout button, backend auth/session behavior change, profile update UI change, or protected API behavior change — `docs/www-project-phase-83-frontend-login-state-read-v1.md`.

**Phase 84:** Frontend logout UI hook — when Phase 83 read shows a signed-in `display_name`, a small **登出** control calls `DELETE /login/session` with `credentials: 'same-origin'`; success hides the signed-in display and restores guest/demo auth chips, failure shows a neutral message only. No login/registration form UI, backend auth/session behavior change, `GET /users/me` response shape change, or protected API behavior change — `docs/www-project-phase-84-frontend-logout-ui-hook-v1.md`.

**Phase 85 (docs):** Production login UI plan — defines the future minimal production login form UX that will call existing `POST /login/session`, refresh Phase 83 state with `GET /users/me`, preserve Phase 84 logout behavior, and keep production session identity separate from local/demo/test `X-User-Id` and `creator_session`. No runtime, frontend form implementation, backend auth/session behavior, `UserAuthResolver`, `GET /users/me` response shape, Official Vote, Reference Answer, profile eligibility, ranking, analytics, vote token schema, or counter schema changes — `docs/www-project-phase-85-production-login-ui-plan-v1.md`.

**Phase 86:** Minimal production login form runtime — `/login` now offers a single credential-proof form that calls existing `POST /login/session` with `credentials: 'same-origin'`, refreshes Phase 83 `GET /users/me` state on `201`, and preserves Phase 84 logout behavior. Failure copy is neutral; no backend auth/session behavior, `UserAuthResolver`, `GET /users/me` shape, Official Vote, Reference Answer, profile eligibility, ranking, analytics, vote token schema, or counter schema changes — `docs/www-project-phase-86-minimal-production-login-form-runtime-v1.md`.

**Phase 87:** Production login runtime review / hardening — reviewed Phase 78-86 `user_sessions`, `POST`/`DELETE /login/session`, `UserAuthResolver` `www_session` verification, `GET /users/me`, frontend login-state read/logout UI, and `/login` form. No runtime defect requiring schema, migration, API, Official Vote, `vote-by-index`, Reference Answer, profile eligibility, ranking, logging, metrics, APM, trace, debug payload, analytics, or error payload changes was found; documentation now records the auth/privacy boundary confirmation — `docs/www-project-phase-87-production-login-runtime-review-hardening-v1.md`.

**Phase 88 (docs):** Registration / profile setup plan — defines a future production account setup flow requiring `display_name`, `birth_year_month`, and coarse `residential_region`, while excluding gender, exact birthday, precise location, registration runtime, profile setup UI, schema changes, login/session behavior changes, Official Vote transaction changes, Reference Answer integration, ranking personalization, demographic breakdowns, and analytics linkage — `docs/www-project-phase-88-registration-profile-setup-plan-v1.md`.

**Phase 89:** Registration runtime foundation — adds verifier-backed `POST /registration` to prepare a production user with `display_name`, month-granular `birth_year_month`, and coarse `residential_region`. It does not issue `www_session`; successful responses return `{ registered: true, login_required: true }` and the browser must still use existing `POST /login/session` for session issuance. No schema, `/users/me`, login/session, Official Vote, `vote-by-index`, Reference Answer, ranking, analytics, gender, exact birthday, precise location, or extra profile-field behavior changes — `docs/www-project-phase-89-registration-runtime-foundation-v1.md`.

**Phase 90:** Registration runtime review / hardening — reviewed Phase 89 `POST /registration` parsing, `display_name`, `birth_year_month`, coarse `residential_region`, verifier-only `Authorization: Bearer` credential proof handling, duplicate/conflict behavior, repository writes, response/error bodies, docs, and tests. No runtime defect requiring schema, migration, login/session, `UserAuthResolver`, `/users/me`, Official Vote, `vote-by-index`, Reference Answer, ranking, analytics, logs, metrics, APM, trace, debug payload, or error payload changes was found; focused tests now explicitly cover already-rejected sensitive profile/session/token/cookie/option fields — `docs/www-project-phase-90-registration-runtime-review-hardening-v1.md`.

**Phase 91 (docs):** Minimal registration UI plan — defines a future production registration form that calls existing `POST /registration` with `display_name`, month-granular `birth_year_month`, coarse `residential_region`, and `Authorization: Bearer <proof>`; explains why eligibility fields are required, maps safe validation/error copy, and requires registration success to proceed to existing `/login` without session or `Set-Cookie`. No registration UI runtime, backend API behavior, login/session, `UserAuthResolver`, `/users/me` shape, gender, exact birthday, precise location, or extra profile-field changes — `docs/www-project-phase-91-minimal-registration-ui-plan-v1.md`.

**Phase 92:** Minimal registration form runtime — adds `GET /registration` and `registration-page.js` to call existing `POST /registration` with `display_name`, month-granular `birth_year_month`, coarse `residential_region`, and credential proof sent only as `Authorization: Bearer <proof>`. Success guides users to `/login` without treating them as logged in, calling `/users/me`, calling `POST /login/session`, or reading `Set-Cookie`. No backend registration behavior, login/session, `UserAuthResolver`, `/users/me` shape, schema, vote, Reference Answer, ranking, analytics, gender, exact birthday, precise location, or extra profile-field changes — `docs/www-project-phase-92-minimal-registration-form-runtime-v1.md`.

**Phase 93:** Registration UI runtime review / hardening — reviewed `GET /registration`, `registration-page.js`, form fields, submit behavior, success/failure copy, credential proof transport, and mobile/accessibility basics. A minimal page-level guard now disables shared login-state reads on `/registration`, preventing `/users/me` calls from registration chrome while preserving normal login-state behavior elsewhere. No backend registration behavior, login/session, `UserAuthResolver`, `/users/me` shape, schema, vote, Reference Answer, ranking, analytics, gender, exact birthday, precise location, or extra profile-field changes — `docs/www-project-phase-93-registration-ui-runtime-review-hardening-v1.md`.

**Phase 94:** Registration/login navigation & copy polish — clarifies that registration creates account data only, does not log users in, and should be followed by `/login`, while login controls signed-in header state. Updates homepage, header auth chips, auth banner, `/login`, and `/registration` links/copy only. No backend auth/session, `POST /registration`, `UserAuthResolver`, `/users/me` shape, registration login-state-read opt-out removal, or schema changes — `docs/www-project-phase-94-registration-login-navigation-copy-polish-v1.md`.

**Phase 95:** Registration/login full flow smoke coverage — adds frontend unit tests, HTTP flow tests, static route assertions, and `smoke:public:local` checks for guest auth navigation, registration login-state-read opt-out, registration-to-login-only success behavior, login `GET /users/me` refresh with `display_name` only, and logout guest/demo chip restoration. No backend auth/session, `POST /registration`, `UserAuthResolver`, `/users/me` shape, registration login-state-read opt-out removal, or schema changes — `docs/www-project-phase-95-registration-login-full-flow-smoke-coverage-v1.md`.

**Phase 96:** Registration runtime/profile boundary review — reviews Phase 89–95 registration/login/profile flow, confirms registration still does not issue a session or call `/users/me`, confirms `/users/me` remains limited to `user_id` and `display_name`, and adds focused docs/source guards. No runtime/API/schema behavior changed — `docs/www-project-phase-96-registration-runtime-profile-boundary-review-v1.md`.

**Phase 97 (docs):** Minimal profile setup UI plan — defines a future post-login profile setup/edit UI that reads and writes existing `GET`/`PUT /users/me/profile` for `birth_year_month` and coarse `residential_region` only, requires sign-in with unauthenticated users guided to `/login`, uses full-replacement PUT with nullable fields, and excludes gender, exact birthday, precise location, auto-vote, vote recalculation, historical eligibility backfill, demographic breakdowns, ranking personalization, and analytics linkage. No runtime, frontend, API, schema, login/session, registration, `UserAuthResolver`, `/users/me` shape, Official Vote, Reference Answer, or vote token/counter behavior changes — `docs/www-project-phase-97-minimal-profile-setup-ui-plan-v1.md`.

**Phase 98:** Minimal profile setup UI runtime — adds post-login `GET /profile` and `profile-page.js` that call existing `GET`/`PUT /users/me/profile` with `credentials: 'same-origin'` for `birth_year_month` and coarse `residential_region` only. Unauthenticated visitors see neutral copy and `/login` guidance without mounting the form or calling the profile API; signed-in users can load, save, or clear both fields through full-replacement PUT. Shared chrome still uses `GET /users/me` for `display_name` only. No API, schema, login/session, registration, `UserAuthResolver`, `/users/me` shape, Official Vote, Reference Answer, or vote token/counter behavior changes — `docs/www-project-phase-98-minimal-profile-setup-ui-runtime-v1.md`.

**Phase 99:** Profile setup UI runtime review / hardening — reviews Phase 98 `/profile` runtime, shared chrome/login-state boundaries, and `GET`/`PUT /users/me/profile` call paths; adds focused source guards and `smoke:public:local` static checks confirming unauthenticated gating, same-origin two-field profile load/save, and exclusion of registration/login/session/vote/reference linkage. No runtime/API/schema behavior changed — `docs/www-project-phase-99-profile-setup-ui-runtime-review-v1.md`.

**Phase 100 (checkpoint):** Registration / login / profile milestone checkpoint — consolidates Phases 89–99 into the stable registration → login → profile setup baseline: `POST /registration` without session/`Set-Cookie`, explicit `POST /login/session`, `GET /users/me` limited to `user_id` + `display_name`, post-login `GET /profile` with `GET`/`PUT /users/me/profile` for two nullable eligibility fields only, and preserved vote/eligibility/Reference Answer/Raw Option Linkage Ban boundaries. Docs/checkpoint only; no runtime/API/schema behavior changed — `docs/www-project-phase-100-registration-login-profile-milestone-checkpoint-v1.md`.

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
# One explicit scheduler batch after build; requires DATABASE_URL:
# DATABASE_URL=postgres://... npm run scheduler:lifecycle -- --limit 100
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

`npm run scheduler:lifecycle -- --limit 100` is a one-shot operator command, not an HTTP hook or always-on worker. It requires a migrated `DATABASE_URL`, accepts limits `1..100`, prints counts and aggregated lifecycle error codes only, and returns nonzero when malformed lifecycle rows fail closed. Cron frequency, overlap policy, deployment supervision, alerting, and retries remain operator responsibilities.

## Layout

- `src/` — application code
- `tests/` — Vitest suites
- `migrations/` — ordered PostgreSQL migrations
- `docs/` — implementation specs and operator docs (e.g. `docs/admin-correction-http.md`)

## Public APIs (Phase 0–5C)

Legacy public poll creator-write routes no longer accept `X-User-Id` creator authority; they return `410 LEGACY_CREATOR_WRITE_RETIRED`. Public vote and Reference Answer routes keep their existing public `X-User-Id` behavior. Live creator frontend flows use `/creator/polls` with the `creator_session` cookie instead.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/polls` | Retired legacy creator-write create route; returns `410 LEGACY_CREATOR_WRITE_RETIRED` |
| `POST` | `/creator/polls` | Live creator create route using `creator_session` cookie |
| `GET` | `/creator/polls` | Counter-free owned poll list using `creator_session` cookie |
| `DELETE` | `/creator/polls/:id` | Creator-owned soft-delete route using `creator_session` cookie |
| `GET` | `/registration` | Minimal production registration form; calls `POST /registration` and then guides to `/login` |
| `POST` | `/registration` | Production registration foundation; verifier-backed account/profile setup only, no session cookie |
| `POST` | `/login/session` | Production login submit foundation; requires configured `trustedCredentialVerifier`, stores only `user_sessions.token_sha256`, and issues `www_session` |
| `DELETE` | `/login/session` | Revoke current valid `www_session` by digest and clear the cookie |
| `GET` | `/users/me` | Read minimal authenticated identity (`user_id`, `display_name`) through `UserAuthResolver` |
| `GET` | `/users/me/profile` | Read current user's profile fields (`birth_year_month`, `residential_region`) |
| `PUT` | `/users/me/profile` | Replace current user's profile fields; accepts only `birth_year_month` and coarse `residential_region` |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking signals) |
| `DELETE` | `/polls/:id` | Retired legacy creator-write delete route; returns `410 LEGACY_CREATOR_WRITE_RETIRED` |
| `POST` | `/polls/:id/cancel` | Retired legacy creator-write lifecycle route; returns `410 LEGACY_CREATOR_WRITE_RETIRED` |
| `POST` | `/polls/:id/close` | Retired legacy creator-write lifecycle route; returns `410 LEGACY_CREATOR_WRITE_RETIRED` |
| `POST` | `/polls/:id/unpublish` | Retired legacy creator-write lifecycle route; returns `410 LEGACY_CREATOR_WRITE_RETIRED` |
| `POST` | `/polls/:id/reference-answer` | Record Reference Answer participation only |
| `POST` | `/polls/:id/vote` | Record Official Vote and increment aggregate shard |
| `POST` | `/polls/:id/vote-by-index` | Record Official Vote from a public option index; internal option ID stays server-side |
| `GET` | `/polls/:id/results` | Display-safe Official Vote results; aggregate only for `revealed` / `locked` / `post_lock`; `collecting` / `cancelled` / `unpublished` / `draft` are counter-free shells |
| `GET` | `/polls/feed` | Public freshness-only discovery feed (5B–5C; see below) |
| `GET` | `/polls/:id/public-notices` | Read visible public correction notices (Phase 8) |
| `GET` | `/results/:id` | Public result page; **`?creator=1`** shows creator lifecycle panel (MVP dev; backend remains authoritative) |
| `GET` | `/` | Public landing page (entry to create poll flow) |
| `GET` | `/explore` | Freshness-only public explore UI (consumes `GET /polls/feed`; collecting polls only; no counters) |
| `GET` | `/faq` | Static FAQ (policy-aligned Traditional Chinese; demo-facing) |
| `GET` | `/trust-levels` | Static trust-level permission matrix (demo-facing) |
| `GET` | `/profile` | Profile UX for `birth_year_month` and coarse `residential_region` (MVP `X-User-Id`) |
| `GET` | `/my-polls` | Creator dashboard; default static mock table; **`?live=1`** for live management (MVP dev) |
| `GET` | `/vote/demo` | Static vote policy shell (`?ui_state=`, `?nav=`) |
| `GET` | `/results/demo` | Static results policy shell (`?ui_state=`, `?nav=`) |
| `GET` | `/polls/new` | Public poll creation UI; default demo (no DB write); **`?live=1`** for real `POST /creator/polls` (MVP dev) |
| `GET` | `/vote/:id` | Minimal public voting UI |
| `GET` | `/health` | Health check |
| `GET` | `/frontend/*` | Static frontend assets (JS, shared `public-mvp.css`) |

`PUT` / `PATCH` on polls return `405` (creator zero-edit after publish).

Minimal public poll creation UI: `GET /polls/new` (demo by default). With **`?live=1`**, it ensures the local/demo creator session when available, submits to `POST /creator/polls`, shows share links, and wires creator lifecycle controls. Neither mode adds production login, ranking, or post-publish edit behavior.

Minimal public voting UI: `GET /vote/:id`. It loads public poll detail, submits the selected public `option_index` to `POST /polls/:id/vote-by-index`, and links to the identity-neutral result page without exposing internal option IDs.

**Minimal public flow (Phase 23–24):**

1. `GET /` — landing page; primary circulation is **share links** (vote/results URLs)
2. `GET /explore` — freshness-only explore list (`GET /polls/feed`); collecting polls only; no vote counts or ranking
3. `GET /polls/new` — demo/static create UI by default (no DB write); local MVP real create uses **`/polls/new?live=1`** (`POST /creator/polls`)
4. After **`?live=1`** create success, shareable full URLs for `GET /vote/:pollId` and `GET /results/:pollId` (copy buttons + visible links; poll id only, no tokens)
5. `GET /vote/:pollId` — vote; success links to results
6. `GET /results/:pollId` — **read-only** display-safe results per `public_lifecycle_state` (collecting counter-free; aggregate when `revealed` / `locked` / `post_lock`); no login, feed UI, ranking, or admin UI (Phase 29–30). Creator lifecycle: **`?creator=1`** (MVP dev; see Phase 60 handoff)

Manual browser checklist (Traditional Chinese): **`docs/www-project-public-mvp-manual-qa-v1.md`**.

Demo/release handoff (Traditional Chinese, showcase + boundaries): **`docs/www-project-public-mvp-demo-release-handoff-v1.md`**.

Cross-browser QA log (Traditional Chinese, PASS/WARN/FAIL tables for real devices): **`docs/www-project-public-mvp-cross-browser-qa-log-v1.md`**.

**Production readiness boundary (Traditional Chinese, demo vs production gates; not a deploy completion proof):** **`docs/www-project-production-readiness-boundary-v1.md`**.

**Local demo startup (Traditional Chinese):** preferred: `npm run demo:public:local` → open `http://127.0.0.1:3000/`. Manual path: session `DATABASE_URL` on `www_test`, seed demo users, migrate, build, `npm start`. Step-by-step: **`docs/www-project-local-demo-startup-v1.md`** (not for production deploy). Public MVP UI is a functional CSS skeleton; full visual redesign is a later UI Phase.

### Demo release readiness (Phase 69)

**Status:** MVP demo is **showcase-ready** for local handoff — creator flow, profile eligibility, public vote/results, and integrated manual QA are documented and guarded. **Phase 70 route adapters** resolve production identity through `UserAuthResolver`; Phase 71–73 covered **formal session lifecycle** and **production login/session UX planning**; **Phase 80–96** add minimal production login submit, digest-backed `www_session` issuance/revoke, `UserAuthResolver` session read integration, `GET /users/me`, login-state read/logout UI hooks, a minimal `/login` credential-proof submit form, production registration foundation, registration UI plan, minimal `/registration` form runtime, registration UI runtime hardening, registration/login navigation polish, registration/login smoke coverage, and registration runtime/profile boundary review. This is still **not** production-deploy-ready: the login/registration flows require an approved backend verifier/origin configuration, local/demo visitors still use **MVP demo-style `X-User-Id`**, and creators use **`creator_session`** (non-production identity). The old **production user-auth wiring later** milestone is now partially implemented through backend session-read, minimal frontend login-state surfaces, and registration runtime foundation. See **`docs/www-project-phase-96-registration-runtime-profile-boundary-review-v1.md`**, **`docs/www-project-phase-95-registration-login-full-flow-smoke-coverage-v1.md`**, **`docs/www-project-phase-94-registration-login-navigation-copy-polish-v1.md`**, **`docs/www-project-phase-93-registration-ui-runtime-review-hardening-v1.md`**, **`docs/www-project-phase-92-minimal-registration-form-runtime-v1.md`**, **`docs/www-project-phase-91-minimal-registration-ui-plan-v1.md`**, **`docs/www-project-phase-90-registration-runtime-review-hardening-v1.md`**, **`docs/www-project-phase-89-registration-runtime-foundation-v1.md`**, **`docs/www-project-phase-87-production-login-runtime-review-hardening-v1.md`**, **`docs/www-project-phase-86-minimal-production-login-form-runtime-v1.md`**, **`docs/www-project-phase-85-production-login-ui-plan-v1.md`**, **`docs/www-project-phase-84-frontend-logout-ui-hook-v1.md`**, **`docs/www-project-phase-83-frontend-login-state-read-v1.md`**, **`docs/www-project-phase-82-authenticated-me-endpoint-foundation-v1.md`**, **`docs/www-project-phase-81-user-auth-resolver-session-read-integration-v1.md`**, **`docs/www-project-phase-80-production-login-submit-runtime-foundation-v1.md`**, **`docs/www-project-phase-78-production-session-schema-foundation-v1.md`**, **`docs/www-project-phase-77-production-login-session-runtime-plan-v1.md`**, **`docs/www-project-phase-73-production-login-session-ux-plan-v1.md`**, **`docs/www-project-phase-72-production-credential-verifier-foundation-v1.md`**, **`docs/www-project-phase-71-production-credential-verifier-plan-v1.md`**, and **`docs/www-project-phase-70-final-production-auth-boundary-checkpoint-v1.md`**.

**Recommended tester entry:** **`docs/www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md`** → startup → operation order → release readiness checklist. Detailed steps: manual QA §3.10 · demo handoff · Phase 60/67/68 docs (cross-linked, not duplicated).

### Public demo test order (Phase 68–69 — for manual QA)

**Automated pre-check:** `npm test` + `npm run smoke:public:local` (HTTP routes, creator create, `vote-by-index`, JSON privacy — **not** a substitute for full browser QA).

| Step | Route / action | Auth |
|------|----------------|------|
| 1 | `npm run demo:public:local` | Seeds demo voters on `www_test` |
| 2 | `/polls/new?live=1` → share `/vote/<pollId>` | **`creator_session`** only (local-test issuer on localhost) |
| 3 | `/my-polls?live=1` | Same creator cookie — **not** user login |
| 4 | `/profile` | **MVP demo `X-User-Id`** — **production auth later**; no `creator_session` |
| 5 | `/vote/<pollId>` | `X-User-Id` + `vote-by-index`; ineligible → fixed copy (no option/index leak) |
| 6 | `/results/<pollId>` | Collecting = counter-free; revealed = display-safe aggregate |
| 7 | `/results/<pollId>?creator=1` | Creator lifecycle panel (UI not authorization) |

**Reference Answer** does **not** use profile eligibility (regression: `reference-answer-hardening` tests). Full checklist: **`docs/www-project-public-mvp-manual-qa-v1.md`** §3.10 · release readiness: **`docs/www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md`** · closure index: **`docs/www-project-phase-68-public-demo-polish-manual-qa-closure-v1.md`**.

### Public MVP current status (Phase 49 — demo handoff)

**Baseline commit (Phase 48):** `630baea` — FAQ, trust-level matrix, mobile readability polish.

The public browser surface remains **share-link first**. Default routes stay **static/demo-facing** for policy UX; **creator lifecycle management** is available only with MVP dev query switches (`?live=1`, `?creator=1`) and the Phase 65A **`creator_session` cookie** (local/demo/test only — **not** production public identity). Backend route adapters for profile, Official Vote, vote-by-index, and creator-owned polls use **`UserAuthResolver`** in production mode; Phase 81 lets that resolver read a valid production `www_session`, Phase 86 adds a minimal `/login` credential-proof form for configured production verifier flows, and Phases 89–96 add, review, plan, implement, harden, polish, smoke-test, and re-review the verifier-backed registration runtime and minimal form/profile boundary. Local/demo browser flows still use **MVP demo-style `X-User-Id`** unless explicitly configured otherwise. Results follow backend `public_lifecycle_state`. There is still **no** notification persistence, trust scoring persistence, feedback persistence, or production ranking/feed personalization. Auth boundary summary: **`docs/www-project-phase-70-final-production-auth-boundary-checkpoint-v1.md`**. Production credential verifier, login/session, and registration planning/foundation/review/runtime: **`docs/www-project-phase-71-production-credential-verifier-plan-v1.md`**, **`docs/www-project-phase-72-production-credential-verifier-foundation-v1.md`**, **`docs/www-project-phase-73-production-login-session-ux-plan-v1.md`**, **`docs/www-project-phase-77-production-login-session-runtime-plan-v1.md`**, **`docs/www-project-phase-78-production-session-schema-foundation-v1.md`**, **`docs/www-project-phase-80-production-login-submit-runtime-foundation-v1.md`**, **`docs/www-project-phase-81-user-auth-resolver-session-read-integration-v1.md`**, **`docs/www-project-phase-86-minimal-production-login-form-runtime-v1.md`**, **`docs/www-project-phase-87-production-login-runtime-review-hardening-v1.md`**, **`docs/www-project-phase-89-registration-runtime-foundation-v1.md`**, **`docs/www-project-phase-90-registration-runtime-review-hardening-v1.md`**, **`docs/www-project-phase-92-minimal-registration-form-runtime-v1.md`**, **`docs/www-project-phase-93-registration-ui-runtime-review-hardening-v1.md`**, **`docs/www-project-phase-94-registration-login-navigation-copy-polish-v1.md`**, **`docs/www-project-phase-95-registration-login-full-flow-smoke-coverage-v1.md`**, and **`docs/www-project-phase-96-registration-runtime-profile-boundary-review-v1.md`**.

| Page | Route | Notes |
|------|-------|--------|
| Landing | `/` | Entry; links to create, explore, FAQ, trust matrix |
| FAQ | `/faq` | Static policy Q&A (Traditional Chinese); aligns with Phase 39–41 drafts |
| Trust levels | `/trust-levels` | Static Lv.0–Lv.4 permission matrix (demo copy) |
| Create poll | `/polls/new` | Default: demo preview (no DB write). **`?live=1`:** real `POST /creator/polls`, share vote link, lifecycle controls |
| My polls | `/my-polls` | Default: static mock table (inert). **`?live=1`:** live creator management from `GET /creator/polls` |
| Vote | `/vote/:pollId` | Submits `option_index` via `vote-by-index` |
| Profile | `/profile` | MVP `X-User-Id` only; `birth_year_month` + coarse `residential_region` for Official Vote eligibility (see Phase 67 QA doc) |
| Vote (demo) | `/vote/demo` | Static policy shell; optional `?ui_state=` for QA |
| Results | `/results/:pollId` | Read-only display-safe results per lifecycle; collecting stays counter-free |
| Results (creator) | `/results/:pollId?creator=1` | Creator lifecycle panel (cancel / close-reveal / unpublish) + post-transition refresh; **UI is not authorization** |
| Results (demo) | `/results/demo` | Static lifecycle shells via `?ui_state=` (see handoff doc) |
| Explore | `/explore` | **Freshness-only** list from `GET /polls/feed` (collecting, recently published); links to `/vote/:pollId`; no vote counts or ranking |

**MVP dev query params (not production UX):**

| Param | Values | Purpose |
|-------|--------|---------|
| `live` | `1` | Real create/manage on `/polls/new`, `/my-polls` using the Phase 65A creator cookie |
| `creator` | `1` | Show creator lifecycle panel on `/results/:pollId` (backend `/creator/polls/:id/cancel|close|unpublish` remains authoritative) |
| `nav` | `guest`, `logged-in-mock` | Toggle header/nav mock on static pages (not real auth) |
| `ui_state` | `collecting`, `revealed`, `locked`, `post_lock`, `cancelled`, `unpublished`, … | Preview lifecycle copy on `/vote/demo`, `/results/demo`, etc. |

**Release readiness entry (Phase 69):** **`docs/www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md`**. Lifecycle manual QA: **`docs/www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`**. Profile eligibility demo QA: **`docs/www-project-phase-67-profile-eligibility-demo-qa-v1.md`**. Integrated manual QA closure (Phase 65–68): **`docs/www-project-phase-68-public-demo-polish-manual-qa-closure-v1.md`** + **`docs/www-project-public-mvp-manual-qa-v1.md`** §3.10. Full demo URL list and product rules: **`docs/www-project-public-mvp-demo-release-handoff-v1.md`**.

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
