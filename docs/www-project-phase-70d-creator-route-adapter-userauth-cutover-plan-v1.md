# WWW Project Phase 70D-I-A — Creator Route Adapter UserAuth Cutover Plan v1

**Status:** docs/spec only. No runtime auth verifier change, route adapter change, API behavior change, migration, schema change, creator-session issuance change, cookie behavior change, Official Vote transaction change, Reference Answer behavior change, profile behavior change, result/feed/notices/scheduler/ranking/personalization change, or frontend change is implemented by this phase.

**Baseline:** `origin/master` @ `8d46216f95d3e58b32ef12cf47493fd56452cd90`.

**Purpose:** define the future implementation boundary for moving production `/creator/*` route adapters from `creator_session`-only authority to `UserAuthResolver` authenticated `user_id` plus creator ownership checks, while preserving local/demo creator compatibility and preventing `creator_session` from authorizing public vote, `vote-by-index`, profile, or Reference Answer.

---

## 1. Current State

- Phase 70A introduced `UserAuthResolver` / `AuthenticatedUserContext`.
- Phase 70B cut production `GET /users/me/profile` and `PUT /users/me/profile` over to `UserAuthResolver`.
- Phase 70C-I cut production Official Vote and `POST /polls/:id/vote-by-index` over to `UserAuthResolver`.
- Phase 70D-P recommends Option A: keep `creator_session` local/demo-only and route production `/creator/*` through formal user auth plus creator ownership checks.
- Current `/creator/session` routes still use the Phase 65A `creator_session` service:
  - `POST /creator/session` issues a local/test session only when local/test issuer config allows it; production issuance fails closed.
  - `GET /creator/session` authenticates the `creator_session` cookie.
  - `DELETE /creator/session` revokes the `creator_session` cookie after the creator mutation Origin gate.
- Current `/creator/polls` routes use `authenticateCreatorRequest(req, creatorSessionService)` to obtain the creator `userId`.
- Current creator mutations keep the exact-match Origin gate.
- Creator-owned list is bounded, deterministic, and counter-free.
- Public Official Vote, `vote-by-index`, profile, public reads, public results, feed, notices, scheduler, and Reference Answer are separate from creator-owned routes.
- Reference Answer is not connected to `UserAuthResolver`, does not use profile eligibility, and must not attach profile eligibility or creator identity to selected Reference Answer choices.
- There is currently no `/creator/polls/:id/results` route in the runtime router; public results remain `GET /polls/:id/results`.

---

## 2. Future Cutover Rule

Production `/creator/*` route adapters must resolve creator identity through `UserAuthResolver`.

Required:

- Production `/creator/*` must call `UserAuthResolver.resolveUserAuth(req)` before creator-owned service calls.
- The resolved `AuthenticatedUserContext.user_id` is the creator principal.
- Creator ownership checks continue to compare the creator principal against existing creator ownership data, such as `polls.creator_id`.
- Route bodies, query strings, forwarded identity headers, raw `X-User-Id`, request IDs, trace IDs, and `creator_session` must not select or override the creator `user_id`.
- Missing production user auth must fail closed before calling creator-owned service methods.
- Local/demo may preserve `creator_session` or local_demo/test resolver compatibility only under explicit non-production configuration.
- Local/demo compatibility must be documented and tested as non-production identity.
- Public Official Vote, `vote-by-index`, `/users/me/profile`, Reference Answer, public reads, results, feed, notices, scheduler, and ranking must not authorize via `creator_session`.

Non-goals for the future cutover implementation:

- No migration.
- No new creator ownership schema.
- No API request/response shape change unless a later approved phase explicitly scopes it.
- No frontend behavior change unless a later frontend phase scopes it.
- No Official Vote transaction change.
- No Reference Answer auth, trust, lifecycle, profile, or storage behavior change.
- No result display threshold, ranking, feed, notice, scheduler, personalization, or governance behavior change.

---

## 3. Route-By-Route Plan

### 3.1 `POST /creator/session`

Future production rule:

- Keep production issuance fail-closed unless a later High-reviewed production credential verifier or formal session UX explicitly changes this route.
- Recommended production behavior for the next implementation phase: keep the current `CREATOR_SESSION_ISSUER_UNAVAILABLE` style fail-closed behavior and do not mint `creator_session`.
- Local/demo/test may continue to issue `creator_session` only when explicit local/demo/test config enables it.
- Do not trust `X-User-Id`, `X-Display-Name`, body `user_id`, query user ID, forwarded identity headers, request IDs, trace IDs, or `creator_session` as production account proof.

Implementation test plan:

- Production `POST /creator/session` does not issue a cookie even when `X-User-Id` or body `user_id` is present.
- Local/demo/test issuance still requires explicit local/demo/test config.
- Responses and diagnostics do not include raw token material or user-selected spoofed identity fields.

### 3.2 `GET /creator/session`

Future production rule:

- Production should not authenticate via `creator_session`.
- Two safe shapes are allowed:
  - Fail closed with an auth-required response unless formal user auth is available.
  - Return formal user session status derived from `UserAuthResolver`, without using or refreshing `creator_session`.
- The next implementation phase should choose one shape explicitly before coding. The safer minimal path is to resolve `UserAuthResolver` and return the same authenticated/unauthenticated status shape without minting or validating creator cookies.

Implementation test plan:

- Production `GET /creator/session` ignores a valid-looking or malformed `creator_session` cookie.
- Production `GET /creator/session` derives authenticated state only from trusted `UserAuthResolver`.
- Local/demo/test `GET /creator/session` may keep current cookie status behavior only when explicitly configured as non-production.

### 3.3 `DELETE /creator/session`

Future production rule:

- Production must not treat `creator_session` as user logout authority.
- If the route remains, it may clear the local/demo creator cookie path and return unauthenticated status without affecting formal user auth.
- Formal user logout/session revocation belongs to the production user-auth system and is out of scope for this creator route adapter cutover.
- The exact-match Origin gate should remain for any state-changing cookie clear/revoke behavior.

Implementation test plan:

- Production `DELETE /creator/session` does not revoke or alter formal user auth.
- Production `DELETE /creator/session` does not require or authenticate a creator cookie as account identity.
- Local/demo/test cookie revocation remains available only under explicit non-production config.

### 3.4 `POST /creator/polls`

Future production rule:

- Resolve `AuthenticatedUserContext` with `UserAuthResolver`.
- Use `auth.user_id` as `creatorId` passed into `pollService.createCreatorPoll`.
- Keep the exact-match Origin gate before mutation.
- Ignore body `creator_id`, body `user_id`, raw `X-User-Id`, `X-Display-Name`, query user ID, forwarded identity headers, request IDs, trace IDs, and `creator_session`.

Implementation test plan:

- Production create rejects missing trusted user auth.
- Production create accepts trusted `UserAuthResolver` identity and persists `polls.creator_id` from `auth.user_id`.
- Spoofed body/header/query identity does not affect `creatorId`.
- No option-level user linkage is added by create.

### 3.5 `GET /creator/polls`

Future production rule:

- Resolve `AuthenticatedUserContext` with `UserAuthResolver`.
- Use `auth.user_id` as the owner filter for `pollService.getCreatorOwnedPolls`.
- Preserve bounded deterministic owned list behavior.
- Preserve polls-table-only, counter-free behavior where the owned list is required to be counter-free.
- Do not expose `creator_id`, voter identity, selected options, vote tokens, option counters, Reference Answer tokens, ranking signals, or raw result rows.

Implementation test plan:

- Production list rejects missing trusted user auth.
- Production list filters by trusted resolver `user_id`, not body/header/query/cookie identity.
- Owned list remains bounded and deterministic.
- Source guard still proves no option/counter/token joins in the owned list query.

### 3.6 `DELETE /creator/polls/:id`

Future production rule:

- Resolve `AuthenticatedUserContext` with `UserAuthResolver`.
- Keep the exact-match Origin gate before mutation.
- Pass `auth.user_id` into `pollService.deletePoll`.
- Service/repository ownership checks must continue denying cross-owner deletion.

Implementation test plan:

- Production delete rejects missing trusted user auth.
- Production delete denies cross-owner action even when body/header/query/cookie identity is spoofed.
- Owner delete behavior and lifecycle/status semantics remain unchanged.

### 3.7 `POST /creator/polls/:id/cancel`

Future production rule:

- Resolve `AuthenticatedUserContext` with `UserAuthResolver`.
- Keep the exact-match Origin gate before mutation.
- Pass `auth.user_id` into `pollService.cancelPoll`.
- Existing lifecycle transaction semantics and ownership checks remain unchanged.

Implementation test plan:

- Production cancel rejects missing trusted user auth.
- Production cancel denies cross-owner action.
- Owner cancel still uses the existing bounded lifecycle transition path.

### 3.8 `POST /creator/polls/:id/close`

Future production rule:

- Resolve `AuthenticatedUserContext` with `UserAuthResolver`.
- Keep the exact-match Origin gate before mutation.
- Pass `auth.user_id` into `pollService.closePoll`.
- Existing lifecycle transaction semantics and ownership checks remain unchanged.

Implementation test plan:

- Production close rejects missing trusted user auth.
- Production close denies cross-owner action.
- Owner close still uses the existing reveal transition path.

### 3.9 `POST /creator/polls/:id/unpublish`

Future production rule:

- Resolve `AuthenticatedUserContext` with `UserAuthResolver`.
- Keep the exact-match Origin gate before mutation.
- Pass `auth.user_id` into `pollService.unpublishPoll`.
- Existing lifecycle transaction semantics and ownership checks remain unchanged.

Implementation test plan:

- Production unpublish rejects missing trusted user auth.
- Production unpublish denies cross-owner action.
- Owner unpublish still uses the existing post-lock unpublish path.

### 3.10 `GET /creator/polls/:id/results`

Current runtime status:

- This route is not currently implemented.
- Public results are read through `GET /polls/:id/results`.

Future production rule if the route is added:

- Treat it as a separate later implementation scope; do not add it as a side effect of auth cutover.
- Resolve `AuthenticatedUserContext` with `UserAuthResolver`.
- Require owner authorization before returning any creator-scoped result view.
- Return only display-safe result objects approved by the result display tier rules.
- Do not expose raw counter rows, internal option IDs beyond already approved display-safe surfaces, voter identity, vote token data, shard-user-option relationships, Reference Answer choices, profile eligibility state, or selected-option linkage.
- Do not let creator identity infer individual voter choices.

Implementation test plan for a later route-add phase:

- Non-owner gets the same safe denial for existing and inaccessible polls where needed.
- Owner receives only display-safe result data.
- No raw counter exposure.
- No voter/profile/session/request identity is joined with selected option data.

---

## 4. Ownership And Privacy Invariants

Must remain true before and after implementation:

- A creator can create only under the authenticated creator principal selected by the production auth resolver.
- A creator can list only their own eligible creator-owned polls.
- A creator can delete, cancel, close, or unpublish only their own polls.
- Cross-owner actions are denied by service/repository ownership checks, not by trusting client-selected identity.
- Owned list remains bounded, deterministic, and counter-free when required.
- Creator identity must not expose voter identity.
- Creator identity must not expose individual vote choices.
- Creator identity must not join with selected option data.
- Public reads remain display-safe and do not reveal viewer-specific eligibility, selected options, raw counters, creator-only data, or internal vote state.
- Official Vote durable storage remains limited to approved vote token and aggregate sharded counter shapes.
- Reference Answer storage remains Design B participation token data only.
- No new durable row, log, metric, APM trace, cache, debug payload, analytics record, error payload, backup, export, or ETL job may link user/session/request/profile/creator identity to a selected option.

---

## 5. Explicit Prohibitions

Phase 70D-I-A and later creator route implementation phases must not:

- Let `creator_session` become public Official Vote identity.
- Let `creator_session` authorize `POST /polls/:id/vote-by-index`.
- Let `creator_session` authorize `GET /users/me/profile` or `PUT /users/me/profile`.
- Let `creator_session` authorize Reference Answer.
- Connect Reference Answer to profile eligibility.
- Store selected Reference Answer option data.
- Create Reference Answer option-level durable counters.
- Add durable option-level linkage such as `user_id + poll_id + option_id`, `session + poll_id + option_index`, or `request_id + user_id + option_text`.
- Add durable/log/metric/APM trace/cache/debug payload/analytics/error payload linkage between selected option data and user, session, device, request, profile eligibility, or creator identity.
- Emit diagnostics combining `profile_eligibility_denied + option_index`, `birth_year_month + option_id`, `residential_region + option_text`, `creator_id + selected option`, or `creator_session + selected option`.
- Add `gender`, exact birthday, date of birth, address, GPS, geocode, postal address, street address, neighborhood, precise location, or equivalent fields.
- Add profile snapshots, vote-time eligibility snapshots, historical eligibility backfill, vote replay, vote recalculation, append-only vote event logs, raw vote event tables, result snapshots, or `poll_status_snapshot`.
- Change Official Vote transaction ordering.
- Change vote token TTL, shard count, sharded counter semantics, result display thresholds, ranking behavior, feed behavior, notices, scheduler behavior, public result API shape, or governance behavior as a side effect of creator route auth cutover.
- Change or weaken the Raw Option Linkage Ban.

---

## 6. Implementation Split Recommendation

Recommended next implementation phase: **Phase 70D-I-B — Creator Route Adapter UserAuth Cutover**.

Smallest safe implementation:

1. Add a creator route identity helper that resolves creator identity through `UserAuthResolver` in production.
2. Preserve local/demo/test `creator_session` compatibility only under explicit non-production config, or explicitly use the existing local_demo/test resolver path if that produces less adapter complexity.
3. Pass `auth.user_id` into existing creator-owned service calls.
4. Keep service/repository ownership checks unchanged.
5. Keep the creator mutation Origin gate.
6. Keep `/creator/session` production issuance fail-closed.
7. Do not add `/creator/polls/:id/results` in the cutover implementation phase.
8. Add focused route-auth and source-guard tests.

Composer may implement Phase 70D-I-B only if:

- The patch is limited to route adapter identity wiring and focused tests.
- No migration, schema change, API behavior change, service/repository behavior change, frontend change, Official Vote change, profile change, Reference Answer change, result/feed/ranking/notices/scheduler change, logging/metrics/tracing/analytics change, or debug/error payload expansion is included.
- Composer does not push.
- GPT-5.5 High performs focused review before push because the phase touches creator authority, production auth, and public participation separation.

GPT-5.5 High review is required before implementation or push for:

- Any ambiguity around production `/creator/session` status behavior.
- Any production credential verifier, formal logout, or account session behavior.
- Any change to `creator_session` TTL, digest storage, cookie path, SameSite policy, Secure policy, revocation behavior, Origin/CSRF rules, or local/demo issuer behavior.
- Any schema or identity mapping where production account IDs differ from stored `polls.creator_id`.
- Any route or service change involving Official Vote, `vote-by-index`, Reference Answer, profile eligibility, result display, ranking, governance, logs, metrics, traces, caches, debug payloads, analytics, or error payloads.

Rollback / failure mode:

- If implementation causes production `/creator/*` to reject all users, rollback the route adapter wiring to the last pushed commit and keep creator production fail-closed.
- If local/demo creator flow breaks, rollback local/demo compatibility wiring without changing production public vote/profile/Reference Answer routes.
- If any test shows `creator_session` authorizes public vote, `vote-by-index`, profile, or Reference Answer, stop and revert the implementation patch before push.
- If any selected-option linkage appears in durable storage, logs, metrics, traces, caches, debug payloads, analytics, or error payloads, stop and revert before push.
- If ownership checks cannot be preserved with `auth.user_id`, stop and create a separate High-reviewed identity mapping plan.

---

## 7. Required Validation For Implementation

Docs-only Phase 70D-I-A validation:

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Future Phase 70D-I-B implementation must run at minimum:

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Focused tests required for Phase 70D-I-B:

- Production `/creator/polls` create/list reject raw `X-User-Id`, body user IDs, query user IDs, forwarded identity headers, request IDs, trace IDs, and `creator_session`.
- Production creator mutations reject raw `X-User-Id`, body user IDs, query user IDs, forwarded identity headers, request IDs, trace IDs, and `creator_session`.
- Production creator routes accept only trusted `UserAuthResolver` identity.
- Local/demo/test creator routes preserve explicitly configured non-production compatibility.
- Cross-owner delete/cancel/close/unpublish remains denied.
- Owner delete/cancel/close/unpublish remains allowed under existing lifecycle rules.
- Owned list remains bounded, deterministic, and counter-free.
- Public Official Vote ignores `creator_session`.
- `vote-by-index` ignores `creator_session`.
- `/users/me/profile` ignores `creator_session`.
- Reference Answer ignores `creator_session` and remains outside profile eligibility.
- Source guards prove creator route adapters call `UserAuthResolver` in production and do not read raw `X-User-Id` for production creator identity.
- Source guards prove no option/counter/token joins are introduced into owned list.
- Error responses do not echo raw credentials, raw cookie tokens, selected option data, profile values, internal option IDs, vote tokens, shard IDs, or creator-selected spoofed IDs.

Optional manual/local checks when PostgreSQL is available:

```text
npm run migrate:check
npm run test:integration:local
npm run smoke:public:local
```

---

## 8. Phase 70D-I-B Draft Instruction

Execute **WWW Project Phase 70D-I-B — Creator Route Adapter UserAuth Cutover**.

Mode: implementation, minimal route adapter wiring only. Do not add migration. Do not change API request/response behavior. Do not change frontend behavior. Do not push; stop for GPT-5.5 High focused review after validation.

Goal: make production `/creator/*` creator-owned route adapters resolve creator identity with `UserAuthResolver`, while preserving local/demo/test creator compatibility and keeping `creator_session` out of public vote, `vote-by-index`, `/users/me/profile`, and Reference Answer.

Required:

- Read Phase 70D-I-A, Phase 70D-P, Phase 70 production auth boundary, Phase 65 final creator checkpoint, `src/auth/user-auth-resolver.ts`, `src/http/creator-session-routes.ts`, `src/http/creator-poll-routes.ts`, `src/http/creator-auth.ts`, and creator-owned route tests.
- Keep `/creator/session` production issuance fail-closed.
- Choose and implement the approved production `GET /creator/session` behavior from Phase 70D-I-A before coding.
- Keep exact-match Origin gate for creator mutations.
- Pass trusted resolver `user_id` into existing creator-owned service methods.
- Preserve service/repository ownership checks.
- Preserve owned list counter-free behavior.
- Do not add `/creator/polls/:id/results` in this implementation phase.
- Add focused tests listed in Phase 70D-I-A section 7.
- Run `git diff --check`, `npm run typecheck`, `npm test`, and `npm run build`.

Stop and report if implementation requires durable selected-option linkage, profile eligibility plus selected option linkage, Reference Answer profile eligibility, Official Vote transaction changes, vote token TTL changes, shard count changes, new precise demographic/location fields, new result snapshots, or any production route accepting `creator_session` as public vote/profile/Reference Answer identity.
