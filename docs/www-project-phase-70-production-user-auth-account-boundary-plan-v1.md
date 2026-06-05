# WWW Project Phase 70 — Production User Auth / Account Boundary Plan v1

**Status:** production auth/account boundary plan plus Phase 70A resolver foundation. No runtime auth verifier, route adapter cutover, frontend behavior, migration, API contract change, scheduler, ranking, feed, result, notice, personalization, demographic breakdown, Official Vote transaction change, or Reference Answer behavior is implemented by Phase 70A.

**Baseline:** `origin/master` @ **`873f0d9`**.

**Purpose:** define the production user auth and account identity boundary that will replace the current MVP demo-style `X-User-Id` identity surface without weakening creator authority separation, profile eligibility, Official Vote integrity, Reference Answer privacy, or the Raw Option Linkage Ban.

**Normative dependencies:**

- `AGENTS.md` v0.2, especially the three MVP core principles and Raw Option Linkage Ban
- [Phase 65A creator session foundation](./www-project-phase-65a-creator-session-foundation-v1.md)
- [Phase 65 final creator auth / ownership checkpoint](./www-project-phase-65-final-creator-auth-ownership-checkpoint-v1.md)
- [Phase 66 profile eligibility boundary spec](./www-project-phase-66-profile-eligibility-boundary-spec-v1.md)
- [Phase 66E profile update API plan](./www-project-phase-66e-profile-update-api-plan-v1.md)
- [Phase 66F profile UX plan](./www-project-phase-66f-profile-ux-onboarding-plan-v1.md)
- [Phase 69 MVP demo release readiness handoff](./www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md)

---

## 1. Current State Inventory

### 1.1 Identity surfaces

| Surface | Current authority | Current scope | Production status |
|---------|-------------------|---------------|-------------------|
| `creator_session` cookie | Phase 65A local/test issuer or future trusted credential verifier | `/creator/*` only | Not a public vote identity |
| MVP `X-User-Id` | Client-provided header in MVP/demo surfaces | `/profile`, Official Vote, `vote-by-index`, test helpers | Must be replaced before production |
| Public reads | No login required | `/`, `/explore`, `/polls/:id`, `/results/:id`, public notices | May remain anonymous |
| Admin auth | Opaque bearer token / RBAC v1 | `/admin/*` | Separate from user auth |

### 1.2 Implemented participation boundaries

- `creator_session` currently serves creator-owned flows only: `/creator/session` and `/creator/*` poll ownership routes. It must not affect public reads, public vote, `vote-by-index`, Reference Answer, profile API, results, feed, notices, or scheduler.
- `/profile` and profile API currently use MVP demo-style `X-User-Id`. This is acceptable only for MVP/local/demo and tests. It is not production identity.
- Official Vote already runs profile eligibility for `birth_year_month` and `residential_region`.
- Official Vote / `vote-by-index` profile eligibility must stay inside the vote transaction and before option resolution, vote token write, and sharded counter increment.
- Reference Answer does not use profile eligibility and must remain outside profile eligibility until a separately approved design changes that boundary.
- Durable Official Vote shapes remain:
  - Vote tokens: `user_id + poll_id`
  - Counters: `poll_id + option_id + shard_id`
- The Raw Option Linkage Ban remains non-negotiable across DB rows, logs, metrics, APM traces, analytics, debug payloads, caches, exports, backups, and ETL.

### 1.3 Current known limitation

MVP demo uses client-selected `X-User-Id` to simulate a current user for profile and public voting. This is the next production-readiness blocker. Phase 70 does not remove it; it defines the boundary for later implementation phases.

---

## 2. Production Auth Principles

### 2.1 Public read policy

Public read surfaces should not require login unless a later, explicit product policy changes them:

- `GET /`
- `GET /explore`
- `GET /polls/:id`
- `GET /results/:id`
- `GET /polls/:id/public-notices`
- static policy pages such as `/faq` and `/trust-levels`

Rules:

- Public reads must stay display-safe.
- Public reads must not reveal viewer-specific profile eligibility, vote state, selected options, raw counters, internal option IDs, or creator-only data.
- Public feed ordering must remain freshness-only unless a separately approved ranking phase changes it without answer-direction signals.

### 2.2 Profile API identity

Production `/users/me/profile` read/update must use formal user auth for the current user.

Required:

- Resolve a server-side authenticated user principal before calling profile service methods.
- Ignore client-supplied `X-User-Id` in production.
- Do not accept body-selected user IDs, query-selected user IDs, forwarded identity headers, or `creator_session` as profile authority.
- Keep the profile API response/request to `birth_year_month` and `residential_region` only.
- PUT remains full replace: both fields must be present and each field may be a normalized string or `null`.

### 2.3 Official Vote identity

Production Official Vote identity must come from formal user auth.

Required:

- `POST /polls/:id/vote` and `POST /polls/:id/vote-by-index` must resolve the authenticated user server-side.
- Raw `X-User-Id` must not be accepted as production identity.
- Eligibility, trust level, duplicate token check, and counter write must all use the same resolved user principal.
- The existing transaction ordering remains:

```text
1. User / trust guard
2. Public participation guard
3. Profile eligibility
4. Option resolve
5. Vote token
6. Sharded counter
```

The order must not be changed merely to make auth wiring easier.

### 2.4 Creator-owned poll identity

Creator-owned poll flow should bind to the same formal user account identity, but not by letting public vote identity and creator authority collapse into one unchecked cookie behavior.

Allowed future shapes:

1. **Formal session owns both user and creator authority.**
   - A formal session authenticates the user.
   - `/creator/*` derives creator authority from the authenticated user and creator eligibility/ownership checks.
   - Cookie scope and CSRF/origin rules remain explicit.

2. **`creator_session` becomes a creator-authority sub-session minted from formal user auth.**
   - A formal authenticated user can mint a bounded creator session.
   - The creator session remains scoped to `/creator`.
   - Public vote/profile routes still use formal user auth, not the creator cookie.

3. **`creator_session` remains local/demo-only and production uses formal session directly.**
   - Production deploy disables local/test creator issuance.
   - `/creator/*` authenticates via the formal session adapter.

Phase 70 recommends option 2 or option 3 for the next production path. Option 1 is acceptable only if CSRF, path scope, and route authority separation are explicit and tested.

### 2.5 `creator_session` production decision

`creator_session` must not silently become public vote identity.

Production implementation must make one explicit decision:

- **Demote:** keep `creator_session` as local/demo-only and production-fail-closed.
- **Integrate:** mint it only from formal user auth as a creator-authority sub-session, still scoped to `/creator`.
- **Replace:** retire it in production creator flows and use formal session auth directly.

Whichever option is chosen, public vote, `vote-by-index`, profile API, and Reference Answer must not authorize via `creator_session`.

---

## 3. Explicit Prohibitions

Production auth implementation must not:

- Treat raw `X-User-Id` as production identity.
- Trust forwarded identity headers, body user IDs, query user IDs, or client-chosen account IDs as production identity.
- Let `creator_session` directly become public vote identity unless a later design provides clear isolation, security rationale, CSRF/origin controls, and tests. Phase 70 does not approve that shortcut.
- Add durable option-level linkage such as `user_id + poll_id + option_id`.
- Add profile eligibility plus selected option linkage in durable rows, logs, metrics, APM traces, caches, debug payloads, analytics records, error payloads, ETL, backups, or exports.
- Log or emit `profile_eligibility_denied + option_index`, `birth_year_month + option_id`, `residential_region + option_text`, or equivalent structures.
- Apply profile eligibility to Reference Answer.
- Create Reference Answer option-level counters.
- Store selected Reference Answer option data.
- Add `gender`, exact birthday, date of birth, address, GPS, geocode, postal address, street address, neighborhood, precise location, or equivalent fields.
- Add profile snapshots, vote-time eligibility snapshots, historical eligibility backfill, vote replay, or vote recalculation as part of auth wiring.
- Change result/feed/notices/scheduler/ranking/personalization behavior as a side effect of auth wiring.

---

## 4. Recommended Implementation Split

Keep the implementation in a few complete phases rather than many tiny slices.

### Phase 70A — Production User Auth Resolver Foundation

**Recommended owner:** GPT-5.5 High.

**Implementation status:** foundation implemented as an internal resolver contract only. `/users/me/profile`, Official Vote, `vote-by-index`, creator-owned routes, and Reference Answer remain on their pre-70A runtime paths until later approved cutover phases.

**Goal:** introduce a server-side current-user resolver abstraction and production-fail-closed adapter without changing public behavior yet.

Allowed:

- Add an internal `CurrentUserAuth` / `UserAuthResolver` interface.
- Add a test/local adapter that preserves existing MVP demo behavior only under explicit test/development configuration.
- Add a production adapter that fails closed until credential verification is configured.
- Wire no public routes yet, or wire behind a no-op compatibility layer if strictly necessary.

Not allowed:

- No migration.
- No vote transaction ordering change.
- No Reference Answer profile eligibility.
- No `creator_session` public vote authority.
- No frontend behavior change.

Validation:

- `git diff --check`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Targeted source guards proving raw `X-User-Id` remains local/test-only and production fails closed.

### Phase 70B — Profile API Production Auth Cutover

**Recommended owner:** Composer for straightforward route adapter work after Phase 70A is approved; GPT-5.5 High review required before merge.

**Goal:** make `/users/me/profile` use the formal current-user resolver.

Allowed:

- Replace direct `X-User-Id` read in profile route with `UserAuthResolver`.
- Preserve full replace request shape and two-field response shape.
- Keep local/demo behavior explicit for tests and local demos.

Not allowed:

- No new profile fields.
- No profile snapshots.
- No creator session authority.
- No vote behavior changes.

Validation:

- Profile API auth tests.
- Creator-session separation tests.
- Existing user-profile route tests.
- `npm test`, `npm run build`, `npm run migrate:check`.

### Phase 70C — Official Vote / Reference Answer Auth Cutover

**Recommended owner:** GPT-5.5 High.

**Goal:** make Official Vote and `vote-by-index` identity come from formal user auth while preserving transaction ordering and ineligible indistinguishability.

Allowed:

- Replace direct `X-User-Id` read in Official Vote route adapters with `UserAuthResolver`.
- Keep service/repository transaction order unchanged.
- Keep Reference Answer outside profile eligibility.
- Keep local/demo identity only under explicit local/test configuration.

Not allowed:

- No option resolution before profile eligibility.
- No token/counter write before profile eligibility.
- No raw option linkage.
- No Reference Answer profile gate.
- No result/feed/ranking/personalization change.

Validation:

- Official Vote identity tests.
- `vote-by-index` ineligible indistinguishability tests for valid and nonexistent indexes.
- Official Vote source guard verifying eligibility before option resolution/token/counter.
- Reference Answer unchanged tests.
- Raw Option Linkage Ban guard tests.
- `npm test`, `npm run build`, `npm run migrate:check`, and PostgreSQL integration when available.

### Phase 70D — Creator Flow Production Auth Decision

**Recommended owner:** GPT-5.5 High for design and review; Composer may implement the selected route wiring if the decision is demote/integrate/replace and tests are explicit.

**Goal:** choose and implement one `creator_session` production strategy.

Allowed decisions:

- Demote `creator_session` to local/demo-only.
- Integrate `creator_session` as a `/creator` scoped sub-session minted from formal user auth.
- Replace `creator_session` in production `/creator/*` with formal session auth.

Validation:

- Creator-owned poll identity tests.
- `creator_session` separation tests.
- CSRF/origin/path-scope tests if cookies remain.
- Public vote/profile/Reference Answer tests proving creator cookies do not authorize them.

---

## 5. First Implementation Phase Instruction Draft

Recommended next implementation prompt:

```text
Execute WWW Project Phase 70A — Production User Auth Resolver Foundation.

Repo: E:\Desktop\WWW project
Branch: master

Mode: GPT-5.5 High.
Scope: backend auth resolver foundation only.
Do not add migrations.
Do not change public API contracts.
Do not change frontend behavior.
Do not change Official Vote transaction ordering.
Do not apply profile eligibility to Reference Answer.

Implement a small CurrentUserAuth/UserAuthResolver interface that can resolve the current user for future profile and vote routes. Production must fail closed until a trusted credential verifier is configured. Local/test may keep the current MVP X-User-Id behavior only behind explicit development/test configuration. Add source and route tests proving raw X-User-Id is not production identity and creator_session does not authorize profile, public vote, vote-by-index, or Reference Answer.

Run:
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
```

Composer can implement Phase 70B after Phase 70A if the resolver contract is clear and tests are already present. GPT-5.5 High should handle or review Phase 70C and Phase 70D because they touch vote integrity, Reference Answer boundaries, and creator authority.

---

## 6. Test Plan

### 6.1 Auth boundary tests

- Production mode rejects raw `X-User-Id`.
- Production mode rejects missing credentials for authenticated routes.
- Local/test mode accepts MVP `X-User-Id` only when explicitly enabled.
- Forwarded identity headers, body user IDs, and query user IDs are ignored.
- Error payloads do not echo credential values or selected option data.

### 6.2 Profile API auth tests

- `GET /users/me/profile` requires formal user auth in production.
- `PUT /users/me/profile` requires formal user auth in production.
- `creator_session` does not authorize or deny profile API.
- PUT still requires both `birth_year_month` and `residential_region`.
- PUT still allows `string` or `null`.
- Invalid profile payload errors remain fixed and do not echo submitted values.

### 6.3 Creator session separation tests

- `creator_session` authorizes only `/creator/*` under the selected production strategy.
- `creator_session` does not authorize public vote.
- `creator_session` does not authorize `vote-by-index`.
- `creator_session` does not authorize Reference Answer.
- `creator_session` does not authorize profile read/update.
- Public read, results, feed, notices, and scheduler are unaffected by creator cookies.

### 6.4 Official Vote identity tests

- Official Vote user identity comes from formal user auth.
- Raw `X-User-Id` cannot spoof a different voter in production.
- Vote token remains `user_id + poll_id`.
- Counter remains `poll_id + option_id + shard_id`.
- Duplicate vote prevention uses the resolved authenticated user.
- Trust guard and profile eligibility use the same resolved authenticated user.

### 6.5 `vote-by-index` ineligible indistinguishability tests

- Profile-ineligible valid `option_index` and nonexistent `option_index` return identical status/body.
- Ineligible path writes no vote token and no counter.
- Ineligible path does not log or emit selected option data.
- Frontend copy remains fixed and does not expose backend messages, option indexes, option IDs, option text, or precise eligibility conditions.

### 6.6 Reference Answer unchanged tests

- Reference Answer still allows low-trust participation according to existing trust and lifecycle rules.
- Reference Answer does not require profile fields.
- Reference Answer does not apply age/region eligibility.
- Reference Answer still stores participation token only.
- Reference Answer does not create option-level counters.
- Creator cookies and production user auth changes do not link Reference Answer request data to profile values.

### 6.7 Raw Option Linkage Ban guard tests

- Schema/source guard rejects durable `user_id + poll_id + option_id` vote event storage.
- Source guard rejects metrics/logs/traces/debug payloads that combine profile eligibility and selected option data.
- Error payload guard rejects option IDs, option text, option indexes, shard IDs, vote tokens, and profile values in vote denial responses.
- Repository/integration tests verify Official Vote writes only token and sharded counter shapes.
- Tests confirm no profile snapshot, vote-time eligibility snapshot, historical backfill, vote replay, or recalculation table is introduced by auth phases.

---

## 7. Validation Matrix By Phase

| Phase | Required validation |
|-------|---------------------|
| 70A | `git diff --check`; `npm run typecheck`; `npm test`; `npm run build`; auth resolver source guards |
| 70B | 70A checks plus profile API auth tests and `npm run migrate:check` |
| 70C | 70B checks plus Official Vote identity tests, `vote-by-index` indistinguishability tests, Reference Answer unchanged tests, source ordering guard, PostgreSQL integration when available |
| 70D | 70C checks plus creator session separation tests, CSRF/origin/path-scope tests, public route non-regression tests |

Optional but recommended when local PostgreSQL and Docker are available:

- `npm run smoke:public:local`
- `npm run test:integration:local`

---

## 8. Stop Conditions

Stop implementation and report if any proposed auth design requires:

- Raw `X-User-Id` as production identity.
- `creator_session` as public vote identity without an approved isolation design.
- Durable selected-option linkage to a user, session, request, profile, or eligibility decision.
- Profile eligibility checks after option resolution in `vote-by-index`.
- Reference Answer profile eligibility.
- New demographic fields beyond `birth_year_month` and `residential_region`.
- Result/feed/ranking/personalization changes as an auth side effect.
- A migration that creates profile snapshots, vote-time eligibility snapshots, vote event logs, or raw vote records.

---

## 9. Change Log

| Version | Content |
|---------|---------|
| v1 / Phase 70 | Production user auth and account identity boundary plan; docs/spec only; implementation split and validation plan |
