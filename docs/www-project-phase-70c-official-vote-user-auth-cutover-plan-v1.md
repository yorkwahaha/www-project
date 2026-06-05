# WWW Project Phase 70C-P — Official Vote UserAuth Cutover Plan v1

**Status:** docs/spec only. No runtime auth verifier change, route adapter change, API behavior change, migration, schema change, Official Vote transaction change, Reference Answer behavior change, result/feed/notices/scheduler/ranking/personalization change, frontend change, or creator-session production strategy change is implemented by this phase.

**Baseline:** `origin/master` @ `145691d4bea42e415c1fc7338f53f01e5f499943`.

**Purpose:** define the safe implementation boundary for moving Official Vote and `vote-by-index` identity from MVP demo-style `X-User-Id` to `UserAuthResolver` without weakening vote integrity, profile eligibility ordering, Reference Answer privacy, creator authority separation, or the Raw Option Linkage Ban.

---

## 1. Current State

- Phase 70A introduced `UserAuthResolver` / `AuthenticatedUserContext`.
- Phase 70B cut `GET /users/me/profile` and `PUT /users/me/profile` over to `UserAuthResolver`.
- Official Vote routes still receive identity through the existing route-local MVP `X-User-Id` adapter.
- `POST /polls/:id/vote-by-index` still receives identity through the same MVP route adapter.
- Reference Answer still uses its existing MVP participation identity path and does not use profile eligibility.
- `creator_session` remains scoped to creator-owned routes and must not authorize public vote, `vote-by-index`, profile, Reference Answer, public reads, results, feed, notices, or scheduler.
- No Phase 70C-P runtime behavior exists.

---

## 2. Future Cutover Rule

Phase 70C implementation may replace only the Official Vote route adapter identity source:

- `POST /polls/:id/vote` must resolve the current user through `UserAuthResolver`.
- `POST /polls/:id/vote-by-index` must resolve the current user through `UserAuthResolver`.
- Production must fail closed when no trusted credential verifier is configured.
- Production must not accept raw `X-User-Id` as vote identity.
- Production must not accept body-selected user IDs, query-selected user IDs, forwarded identity headers, request IDs, trace IDs, or `creator_session` as vote identity.
- Local/demo/test may preserve MVP `X-User-Id` compatibility only through an explicitly configured `local_demo` or `test` resolver.
- The resolved `AuthenticatedUserContext` may carry `user_id` and auth source metadata only; it must not carry selected option data, profile eligibility result data, request body data, poll option data, or vote result data.

Phase 70C implementation must not:

- Change Official Vote request/response contracts except replacing the auth source behind the same route boundary.
- Change vote service or repository transaction semantics unless a High review explicitly approves a smaller corrective patch.
- Change `Reference Answer` auth, trust, lifecycle, profile, or storage behavior.
- Change `/creator/*` behavior or make `creator_session` a public vote identity.
- Add migrations or DB schema.
- Add `gender`, exact birthday, address, GPS, geocode, precise location, demographic breakdowns, profile snapshots, vote-time eligibility snapshots, vote replay, vote recalculation, or historical eligibility backfill.

---

## 3. Transaction Order That Must Not Break

The existing Official Vote transaction order is a privacy and integrity boundary. Phase 70C implementation must preserve the service/repository order:

1. Resolve user auth in the route adapter with `UserAuthResolver`.
2. Enter the existing Official Vote service/repository path with the resolved `user_id`.
3. Apply official-trust user guard inside the vote transaction.
4. Apply public participation guard inside the vote transaction.
5. Apply profile eligibility inside the vote transaction.
6. Resolve option identity only after profile eligibility passes.
7. Write vote token only after option resolution passes.
8. Increment sharded counter only after token write succeeds.
9. Commit the transaction.

For `vote-by-index`, profile eligibility must remain before public `option_index` resolution. A profile-ineligible user must not learn whether an index exists.

Phase 70C must keep the existing source-order guard that checks profile eligibility before `resolveOfficialVoteOptionIdWithClient`, `insertVoteToken`, and `incrementVoteCounter`; it should add any necessary route-auth source guards without weakening that transaction-order guard.

---

## 4. Indistinguishability Requirements

The `vote-by-index` route must preserve ineligible indistinguishability:

- A profile-ineligible request with a valid `option_index` and a profile-ineligible request with a nonexistent `option_index` must return the same status and body.
- The auth cutover must not introduce a response difference that reveals option existence.
- The auth cutover must not log, metric, trace, cache, debug, analytics, or error-payload a profile eligibility denial together with `option_index`, `option_id`, option text, or selected option data.
- The ineligible path must not write vote tokens.
- The ineligible path must not increment counters.
- The ineligible path must not resolve internal option IDs before eligibility completes.

Auth failures may return auth-required responses before request body parsing, but those responses must not echo credential values, option fields, option indexes, option IDs, option text, or profile fields.

---

## 5. Reference Answer Boundary

Reference Answer remains outside Phase 70C implementation scope.

Must remain true:

- Reference Answer does not use profile eligibility.
- Reference Answer does not require `birth_year_month` or `residential_region`.
- Reference Answer does not require production `UserAuthResolver`.
- Reference Answer does not create option-level durable counters.
- Reference Answer stores participation token data only according to Design B.
- Reference Answer must not link profile data, session data, request identity, or authenticated user context to a selected option.

If Reference Answer is ever moved to formal user auth, it must be specified in a separate approved phase. Phase 70C does not authorize that change.

---

## 6. Raw Option Linkage Ban

Phase 70C implementation must not create durable or semi-durable linkages from a user, session, request, traceable actor, profile eligibility state, or resolver context to a selected option.

Forbidden new side effects include:

- Durable rows such as `user_id + poll_id + option_id`, `user_id + poll_id + option_index`, or `request_id + user_id + option_text`.
- Logs, metrics, APM traces, debug payloads, analytics records, ETL exports, caches, backups, or error payloads combining profile eligibility or auth context with selected option data.
- `AuthenticatedUserContext` fields containing `option_id`, `option_index`, `option_text`, selected option labels, request body, profile eligibility result, token, shard, or counter data.
- Auth errors that echo raw credentials, user-selected identifiers, selected option data, or profile values.

Allowed durable Official Vote shapes remain:

- Vote token: `user_id + poll_id + voted_at_minute + expires_at`, without selected option data.
- Sharded counter: `poll_id + option_id + shard_id + vote_count`, without user or request identity.

---

## 7. Required Tests For Phase 70C Implementation

### 7.1 Route Auth Source Tests

- Production Official Vote rejects raw `X-User-Id`.
- Production `vote-by-index` rejects raw `X-User-Id`.
- Production Official Vote accepts identity only from a trusted `UserAuthResolver` verifier.
- Production `vote-by-index` accepts identity only from a trusted `UserAuthResolver` verifier.
- Local/demo/test Official Vote may use MVP `X-User-Id` only when the resolver is explicitly configured for `local_demo` or `test`.
- Local/demo/test `vote-by-index` may use MVP `X-User-Id` only when the resolver is explicitly configured for `local_demo` or `test`.
- `creator_session` does not authorize public vote.
- `creator_session` does not authorize `vote-by-index`.
- Forwarded identity headers, body user IDs, query user IDs, request IDs, trace IDs, and creator cookies are ignored as vote identity.

### 7.2 Existing Vote Integrity Tests

Keep and rerun:

- Official Vote token remains option-free.
- Official Vote counter remains sharded and aggregate-only.
- Duplicate vote still rejects without a second increment.
- Counter failure still rolls back the token.
- Client-provided `shard_id` remains ignored.
- Official Vote safe errors still do not expose submitted option UUIDs or the `option_id` field name.

### 7.3 `vote-by-index` Ordering And Indistinguishability Tests

Keep and rerun:

- Valid `option_index` maps server-side after eligibility passes.
- Profile-ineligible valid `option_index` and nonexistent `option_index` return identical status/body.
- Profile-ineligible paths write no token and no counter.
- Safe validation errors for invalid indexes do not expose internal option IDs, tokens, shards, user IDs, or selected option fields.
- Public poll detail still exposes public option indexes and labels only, never internal option IDs.

### 7.4 Source Guards

Add or update source guards proving:

- `src/http/poll-routes.ts` no longer directly reads `req.headers['x-user-id']` for Official Vote or `vote-by-index`.
- Official Vote and `vote-by-index` route adapters call `UserAuthResolver`.
- Reference Answer route adapter is not cut over in Phase 70C.
- The repository transaction still checks profile eligibility before option resolution, token write, and counter increment.
- Resolver tests do not mention `option_id`, `option_index`, or `option_text`.
- `AuthenticatedUserContext` type does not include option data fields.

### 7.5 Reference Answer Non-Regression Tests

Keep and rerun:

- Reference Answer does not apply profile eligibility.
- Reference Answer still permits the existing low-trust participation path according to Design B and lifecycle guards.
- Reference Answer safe diagnostics do not retain option IDs.
- Creator cookies and production user auth changes do not authorize or block Reference Answer.

---

## 8. Implementation Split Recommendation

Recommended next implementation phase: **Phase 70C-I — Official Vote Route Adapter UserAuth Cutover**.

Smallest safe implementation:

1. Pass `UserAuthResolver` into the poll route handler factory.
2. Replace the Official Vote and `vote-by-index` route adapter `requireUserId` with an async resolver-backed helper.
3. Leave `handlePostReferenceAnswer` on the existing path unless a separate approved phase changes it.
4. Leave `PollService`, repository transaction code, migrations, frontend, result/feed/notices/scheduler/ranking/personalization, and creator routes unchanged.
5. Add only focused auth-source and boundary tests.

Composer may implement Phase 70C-I if the implementation is limited to route adapter wiring plus tests and does not push. GPT-5.5 High focused review must review before push because the change touches vote identity, ineligible indistinguishability, and Raw Option Linkage Ban boundaries.

High review is required for:

- Any service or repository transaction change.
- Any change to `vote-by-index` request parsing or option resolution.
- Any logging, diagnostic, metric, trace, analytics, or error-payload change on vote routes.
- Any Reference Answer behavior change.
- Any creator session production strategy change.
- Any migration or schema proposal.

---

## 9. Validation For Phase 70C-I

Minimum validation:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run test:integration:local
npm run smoke:public:local
```

Required review checks:

- No migration added.
- No DB schema changed.
- No API response shape changed except auth-required copy if explicitly approved.
- No result/feed/notices/scheduler/ranking/personalization changes.
- No Reference Answer profile eligibility.
- No durable user-option linkage.
- No logs, metrics, traces, debug payloads, analytics records, caches, or error payloads link auth/profile/session/request identity to selected option data.

---

## 10. Prompt Draft For Phase 70C-I

Execute WWW Project Phase 70C-I — Official Vote Route Adapter UserAuth Cutover.

Scope: implementation only for Official Vote and `vote-by-index` route auth source.

Allowed:

- Pass `UserAuthResolver` into the poll route handler factory.
- Replace Official Vote and `vote-by-index` direct MVP `X-User-Id` route identity with `UserAuthResolver`.
- Keep local/demo/test MVP `X-User-Id` compatibility only through explicitly configured `local_demo` or `test` resolver.
- Add focused route auth tests and source guards.

Forbidden:

- Do not add migrations or DB schema.
- Do not change `PollService` or repository transaction order.
- Do not resolve `option_index` before profile eligibility.
- Do not change Reference Answer behavior or apply profile eligibility to Reference Answer.
- Do not make `creator_session` a public vote identity.
- Do not change result/feed/notices/scheduler/ranking/personalization.
- Do not add gender, exact birthday, address, GPS, geocode, precise location, profile snapshots, vote-time eligibility snapshots, vote replay, recalculation, or backfill.
- Do not add any durable or side-channel linkage between user/session/request/profile eligibility and selected option data.

Run all Phase 70C-I validation and stop for High review before push.
