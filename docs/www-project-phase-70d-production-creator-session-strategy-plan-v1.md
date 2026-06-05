# WWW Project Phase 70D-P — Production Creator Session Strategy Plan v1

**Status:** docs/spec only. No runtime auth verifier change, route adapter change, API behavior change, migration, schema change, creator-session issuance change, Official Vote transaction change, Reference Answer behavior change, profile behavior change, result/feed/notices/scheduler/ranking/personalization change, or frontend change is implemented by this phase.

**Baseline:** `origin/master` @ `3d5051835434c51b1bf07e8c714882b353fc0e29`.

**Purpose:** choose the production strategy for creator-owned flow identity so future `/creator/*` implementation can integrate with formal `UserAuthResolver` / production user auth without allowing `creator_session` to become public vote identity, `vote-by-index` identity, profile identity, or Reference Answer identity.

---

## 1. Current State

- Phase 70A introduced `UserAuthResolver` / `AuthenticatedUserContext`.
- Phase 70B cut `GET /users/me/profile` and `PUT /users/me/profile` over to `UserAuthResolver`.
- Phase 70C-I cut Official Vote and `POST /polls/:id/vote-by-index` over to `UserAuthResolver`.
- Reference Answer is not cut over to `UserAuthResolver`, does not use profile eligibility, and must not attach profile eligibility to selected Reference Answer choices.
- `creator_session` currently authorizes only `/creator/*` creator-owned routes.
- The existing production `creator_session` boundary is fail-closed: local/test issuance is available only for explicit demo/local conditions, and production has no trusted creator credential verifier in this repository.
- Public reads remain anonymous/display-safe and must not use creator authority.
- Durable Official Vote shapes remain:
  - Vote token: `user_id + poll_id`, without selected option data.
  - Sharded counter: `poll_id + option_id + shard_id`, without user, session, request, or profile identity.
- The Raw Option Linkage Ban remains non-negotiable across DB rows, backups, logs, metrics, APM traces, analytics, debug payloads, caches, exports, and ETL.

---

## 2. Production `creator_session` Strategy Options

### Option A — Keep `creator_session` local/demo-only; production uses formal user auth plus creator ownership

Shape:

- Keep the existing `creator_session` cookie and local/test issuer only for local demo creator flows.
- In production, `/creator/*` resolves the authenticated user through formal user auth / `UserAuthResolver`.
- Creator-owned service calls receive the resolved production `user_id` as creator authority.
- Existing poll ownership checks continue to compare the authenticated creator principal to `polls.creator_id`.

Benefits:

- Preserves the current demo surface without expanding the cookie into a production identity.
- Gives production `/creator/*` the same account identity source as profile and Official Vote.
- Minimizes the chance that public vote, profile, or Reference Answer accidentally accept a creator cookie.
- Keeps route authority separation easy to test: `/creator/*` uses creator ownership, public vote/profile use formal user auth, Reference Answer remains separate.

Risks:

- Requires a future creator route adapter cutover from `authenticateCreatorRequest` to a production `UserAuthResolver` path.
- Local/demo behavior and production behavior intentionally differ, so tests must cover both modes.
- If production account IDs and existing `polls.creator_id` values diverge, an explicit account-to-creator identity migration plan is required before enabling production.

Migration cost:

- Low to medium. No new schema is required if `polls.creator_id` can remain the formal `user_id`.
- A focused route adapter phase can preserve service/repository behavior.

### Option B — Integrate `creator_session` as a formal creator-authority sub-session

Shape:

- A formally authenticated user can mint a bounded `creator_session`.
- The cookie remains scoped to `/creator`.
- `/creator/*` accepts the sub-session as creator authority.
- Public vote, `vote-by-index`, profile, and Reference Answer still use their own approved identity boundaries and never authorize via the creator cookie.

Benefits:

- Can support a creator-specific session lifetime, CSRF/origin policy, and logout behavior independent from the account session.
- Preserves the current `/creator/*` cookie-based route adapter shape.
- Keeps creator authority path-scoped if implemented carefully.

Risks:

- Higher risk of future misuse because the cookie becomes a production credential-like object.
- Requires strong minting rules, CSRF/origin controls, revocation semantics, and tests proving it cannot authorize public vote/profile/Reference Answer.
- Creates another production auth surface to operate and monitor.
- Failure modes could collapse creator authority and user auth if route guards become loose.

Migration cost:

- Medium to high. It requires production minting, revocation/session lifecycle design, security tests, and explicit operational policy.

### Option C — Replace `creator_session` with formal user/account session

Shape:

- Retire `creator_session` from production and local/demo creator flows.
- All `/creator/*` requests use the same formal user/account session as profile and Official Vote.
- Local demos must provide a formal local/demo user auth adapter instead of the Phase 65A creator cookie issuer.

Benefits:

- Removes the separate creator cookie concept over time.
- Gives all authenticated user-owned flows one production identity surface.
- Avoids maintaining creator-session issuance, digest storage, and cookie lifecycle.

Risks:

- Larger churn than Option A because current demo creator flow and creator route tests are built around `creator_session`.
- Could obscure the needed authority distinction between "authenticated user" and "creator allowed to mutate this poll" unless route tests are explicit.
- Requires replacing the local/demo creator UX bootstrap before implementation can land safely.

Migration cost:

- High for the current codebase because it changes both production direction and local/demo creator flow mechanics.

---

## 3. Recommended Strategy

Recommend **Option A: keep `creator_session` local/demo-only and route production `/creator/*` through formal user auth plus creator ownership checks**.

This is the smallest production-safe path because it does not promote the Phase 65A local/demo cookie into a production user identity. Production creator-owned writes should resolve `AuthenticatedUserContext` through `UserAuthResolver`, use `auth.user_id` as the creator principal, and pass that `user_id` into the existing creator-owned service/repository flow. Ownership remains a creator-domain authorization check, not a public participation identity.

Why `creator_session` must not become public vote identity:

- Public vote and `vote-by-index` already have a production auth boundary through `UserAuthResolver`.
- Official Vote identity participates in trust guard, profile eligibility, duplicate token, and sharded counter transaction ordering. A creator cookie would bypass the approved route identity source.
- `creator_session` was introduced for creator-owned writes and local demo bootstrapping, not public participation.
- Accepting it on public vote routes would create a confusing second vote identity and increase the chance of side-channel linkage between creator/session state and selected options.
- Its cookie path and scope are implementation details; the security rule is that vote/profile/Reference Answer routes must ignore it even if a malformed or manually supplied cookie is present.

Future creator-owned `user_id` source:

- Production `/creator/*` route adapters should call `UserAuthResolver`.
- The resolved `AuthenticatedUserContext.user_id` becomes the creator principal for create/list/delete/lifecycle service calls.
- Route bodies, query strings, forwarded headers, request IDs, trace IDs, and `creator_session` must not select the creator `user_id`.
- Existing `polls.creator_id` ownership checks may remain if they compare against the resolved formal `user_id`.
- If production account identity uses a different stable ID than existing demo `creator_id`, a separate High-reviewed adapter or migration plan must define that mapping before production enablement.

Identity boundary by surface:

| Surface | Future production identity | Boundary |
|---------|----------------------------|----------|
| `/creator/*` | `UserAuthResolver` authenticated `user_id` plus creator ownership checks | Creator-owned writes and owned reads only |
| Public Official Vote | `UserAuthResolver` authenticated `user_id` | Trust, profile eligibility, duplicate token, sharded counter transaction |
| `vote-by-index` | `UserAuthResolver` authenticated `user_id` | Same as Official Vote; profile eligibility before option-index resolution |
| `/users/me/profile` | `UserAuthResolver` authenticated `user_id` | Profile read/update only; no `creator_session` authority |
| Reference Answer | Existing Reference Answer participation identity path | No profile eligibility, no production `UserAuthResolver` cutover in this phase, no creator-cookie authority |
| Public reads | Anonymous/display-safe | No viewer-specific selected option, raw counter, profile eligibility, or creator-owned data |

---

## 4. Explicit Prohibitions

Phase 70D-P and later creator implementation phases must not:

- Allow `creator_session` to authorize public Official Vote.
- Allow `creator_session` to authorize `POST /polls/:id/vote-by-index`.
- Allow `creator_session` to authorize `GET /users/me/profile` or `PUT /users/me/profile`.
- Allow `creator_session` to authorize Reference Answer.
- Let Reference Answer use profile eligibility.
- Let Reference Answer attach profile fields, production user auth context, request identity, session identity, or creator identity to a selected option.
- Add durable option-level linkage such as `user_id + poll_id + option_id`, `session + poll_id + option_index`, or `request_id + user_id + option_text`.
- Add profile eligibility plus selected option linkage in durable rows, logs, metrics, APM traces, caches, debug payloads, analytics records, error payloads, ETL, backups, or exports.
- Log or emit `profile_eligibility_denied + option_index`, `birth_year_month + option_id`, `residential_region + option_text`, `creator_session + selected option`, or equivalent structures.
- Add `gender`, exact birthday, date of birth, address, GPS, geocode, postal address, street address, neighborhood, precise location, or equivalent fields.
- Add profile snapshots, vote-time eligibility snapshots, historical eligibility backfill, vote replay, vote recalculation, raw vote event tables, append-only vote event logs, result snapshots, or `poll_status_snapshot`.
- Change Official Vote transaction ordering.
- Change vote token TTL, shard count, sharded counter semantics, result display thresholds, ranking behavior, feed behavior, notices, scheduler behavior, or public result API shape as a side effect of creator auth wiring.
- Change or weaken the Raw Option Linkage Ban.

---

## 5. Recommended Implementation Split

Recommended next phase: **Phase 70D-I-A — Creator Route Adapter UserAuth Cutover Plan**.

Before runtime implementation, create a route adapter cutover plan that defines:

1. How `/creator/*` will resolve `AuthenticatedUserContext` through `UserAuthResolver` in production.
2. How local/demo-only `creator_session` behavior remains available without being accepted in production.
3. Which tests prove `creator_session` does not authorize public vote, `vote-by-index`, profile, or Reference Answer.
4. Whether `polls.creator_id` can directly store the formal `user_id` or needs a separate High-reviewed identity mapping plan.
5. How CSRF/origin policy remains explicit for creator-owned writes after route adapter cutover.

Composer may implement:

- Docs/test additions for the route adapter cutover plan.
- Narrow route adapter wiring after the plan is approved, if it only replaces creator route identity source and preserves service/repository behavior.
- Focused tests proving production `/creator/*` uses `UserAuthResolver` and local/demo `creator_session` remains local/demo-only.

GPT-5.5 High review is required for:

- Any production credential verifier design.
- Any change to creator session issuance, TTL, digest storage, cookie path, SameSite policy, CSRF/origin policy, or revocation semantics.
- Any schema or migration touching creator identity, users, profiles, vote tokens, counters, sessions, logs, metrics, analytics, traces, debug payloads, or caches.
- Any service/repository change to Official Vote, `vote-by-index`, Reference Answer, profile eligibility, result display, ranking, or governance behavior.
- Any identity mapping where formal account IDs differ from stored creator IDs.

---

## 6. Validation Requirements

Docs-only Phase 70D-P validation:

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Future implementation validation must also include focused tests for:

- Production `/creator/*` rejects raw `X-User-Id`, body user IDs, query user IDs, forwarded identity headers, request IDs, trace IDs, and `creator_session` as creator identity.
- Production `/creator/*` accepts only the trusted `UserAuthResolver` principal.
- Local/demo `creator_session` remains available only under explicit local/demo/test configuration.
- Public Official Vote ignores `creator_session`.
- `vote-by-index` ignores `creator_session`.
- `/users/me/profile` ignores `creator_session`.
- Reference Answer ignores `creator_session` and remains outside profile eligibility.
- No new logs, metrics, traces, debug payloads, analytics records, caches, or error payloads link profile/session/request/creator identity to selected option data.
- No migration introduces forbidden option-level linkage, raw vote event logs, profile snapshots, vote-time eligibility snapshots, or precise demographic/location fields.

---

## 7. Phase 70D-I-A Draft Instruction

Execute **WWW Project Phase 70D-I-A — Creator Route Adapter UserAuth Cutover Plan**.

Mode: docs/spec only. Do not implement runtime. Do not add migration. Do not change API behavior.

Goal: produce the implementation plan for changing production `/creator/*` identity from production-fail-closed `creator_session` behavior to `UserAuthResolver` authenticated `user_id` plus creator ownership checks, while keeping `creator_session` local/demo-only and proving it cannot authorize public vote, `vote-by-index`, profile, or Reference Answer.

Required:

- Read Phase 70D-P, Phase 70 production auth boundary, Phase 70C Official Vote cutover, Phase 65 final creator checkpoint, `src/auth/user-auth-resolver.ts`, and creator-owned route tests.
- Keep `creator_session` out of public vote, `vote-by-index`, `/users/me/profile`, and Reference Answer.
- Preserve Reference Answer exclusion from profile eligibility.
- Preserve the Raw Option Linkage Ban.
- Define exact tests for creator route production resolver behavior and local/demo creator-session behavior.
- Run `git diff --check`, `npm run typecheck`, `npm test`, and `npm run build`.

Stop and report if the plan requires durable selected-option linkage, profile eligibility plus selected option linkage, Reference Answer profile eligibility, a vote transaction order change, a vote token TTL change, a shard count change, or a new precise demographic/location field.
