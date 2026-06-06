# WWW Project Phase 71 — Production Credential Verifier / Formal User Session Planning v1

**Status:** docs/spec only. No src runtime change, public frontend change, migration, DB schema change, API behavior change, vote transaction change, profile eligibility change, Reference Answer behavior change, creator route behavior change, result/feed/notices/scheduler/ranking/personalization change, logs/metrics/APM/analytics change, or production credential verifier implementation is introduced by this phase.

**Baseline:** `origin/master` @ **`5e4bd40`** (`docs: add Phase 70 final auth boundary checkpoint`).

**Spec basis:** `AGENTS.md` v0.2, the Raw Option Linkage Ban, Phase 70 final production auth boundary checkpoint, Phase 66 final profile eligibility checkpoint, and Phase 65 final creator auth / ownership checkpoint.

**Purpose:** define the safe planning boundary for wiring a future production `trustedCredentialVerifier` into `UserAuthResolver`, plus the minimum formal user session and frontend login UX boundary, without changing runtime behavior in Phase 71.

---

## 1. Phase 71 Scope

### 1.1 In scope

- Document the production `trustedCredentialVerifier` responsibility boundary.
- Document formal user session / credential source, lifecycle, expiry, revocation, logout, and failure modes at a planning level.
- Document the minimum frontend production login UX boundary needed before public production deployment.
- Preserve explicit local/demo/test `X-User-Id` compatibility only under non-production configuration.
- Preserve `creator_session` as non-production public identity; it must not become production public user identity.
- Preserve Reference Answer separation; any Reference Answer `UserAuthResolver` cutover is a future independent phase.
- Add a docs guard test for these auth/privacy boundaries.

### 1.2 Out of scope

Phase 71 must not implement or change:

- `src/` runtime code.
- `public/frontend/` behavior or copy.
- migrations, DB schema, vote token schema, counter schema, indexes, or shard count.
- API request/response behavior.
- Official Vote transaction order.
- profile eligibility fields, evaluator behavior, or profile eligibility application scope.
- Reference Answer route behavior, storage, trust level, profile eligibility, or selected-option handling.
- creator route behavior, `creator_session` issuance behavior, or ownership checks.
- ranking, Wonder Flow, feed personalization, result display thresholds, demographic breakdown, precise location, or extra profile fields.
- logs, metrics, APM traces, debug payloads, error payloads, analytics, ETL, or data warehouse payloads.

---

## 2. Current Phase 70 Boundary

Phase 70 completed the route adapter cutover to `UserAuthResolver` for production identity surfaces:

| Surface | Current production authority after Phase 70 |
|---------|---------------------------------------------|
| `GET /users/me/profile` / `PUT /users/me/profile` | `UserAuthResolver` |
| `POST /polls/:id/vote` | `UserAuthResolver` |
| `POST /polls/:id/vote-by-index` | `UserAuthResolver`; eligibility before option resolve |
| `/creator/*` production creator-owned routes | `UserAuthResolver` + ownership checks |
| `creator_session` | local/demo/test compatibility only; not production public identity |
| Reference Answer | not cut over to `UserAuthResolver`; no profile eligibility |

Production remains fail-closed without a configured trusted credential verifier. Raw `X-User-Id` is not production identity.

---

## 3. Production `trustedCredentialVerifier` Responsibility Boundary

The future production `trustedCredentialVerifier` is the only component allowed to convert a formal production credential into an `AuthenticatedUserContext` for `UserAuthResolver`.

### 3.1 Must do

- Verify credential authenticity using a trusted production source, such as a server-side session store, signed session token, OIDC/JWT verifier, or equivalent formally approved credential provider.
- Return a stable canonical `user_id` that matches the account identity used by profile, Official Vote, and creator ownership checks.
- Fail closed for missing, malformed, expired, revoked, unverifiable, ambiguous, or unsupported credentials.
- Enforce issuer, audience, signature, expiry, and revocation semantics where relevant to the credential type.
- Keep credential verification independent of poll option selection. The verifier must not receive `option_id`, `option_index`, `option_text`, selected answer payloads, or vote-by-index resolved option data.
- Return only identity context required by route adapters, such as `user_id` and coarse auth metadata needed for auditing verifier health, without user-option linkage.

### 3.2 Must not do

- Do not trust raw `X-User-Id`, body user IDs, query user IDs, forwarded identity headers, request IDs, trace IDs, IP addresses, device IDs, analytics IDs, or `creator_session` as production account proof.
- Do not persist durable linkage between a credential, session, request, traceable actor, or user and a selected poll option.
- Do not log or emit `user_id + poll_id + option_id`, `session + poll_id + option_index`, `request_id + user_id + option_text`, or equivalent structures.
- Do not perform profile eligibility, option resolution, vote token writes, counter increments, ranking updates, demographic grouping, or result display decisions.
- Do not create a user profile, mutate profile eligibility fields, or add new profile fields.
- Do not make `creator_session` a production public identity.

### 3.3 Failure contract

In production, missing or unhealthy verifier configuration must fail closed:

- profile, Official Vote, `vote-by-index`, and production `/creator/*` identity resolution return authentication failure.
- no fallback to raw `X-User-Id`, `creator_session`, forwarded headers, anonymous identity, or demo fixtures is allowed.
- failures must not disclose whether a user previously selected any option.
- diagnostic output must avoid credential material and must not include selected option data.

---

## 4. Formal User Session / Credential Planning

Phase 71 does not choose a concrete provider. A future implementation phase must choose exactly one approved credential transport and document why it satisfies this section.

### 4.1 Credential source

Allowed candidate sources:

- Server-side session ID stored in a secure, HTTP-only, same-site cookie, resolved against a production session store.
- Signed first-party session token with server-side revocation support.
- OIDC/JWT credential verified against trusted issuer metadata and constrained audience.
- Equivalent production identity provider approved before implementation.

Disallowed sources:

- Raw `X-User-Id`.
- Frontend-selected user ID in body, query, local storage, session storage, IndexedDB, URL params, or cookies.
- `creator_session`.
- IP, device, request, trace, analytics, or APM identity.
- Demo fixture identity in production.

### 4.2 Lifecycle

A future session implementation must define:

- creation: explicit login or identity-provider callback only.
- active use: route adapters call `UserAuthResolver`; domain services do not parse credentials directly.
- expiry: bounded TTL or provider expiry, enforced server-side.
- refresh: explicit rules if refresh exists; no silent indefinite extension.
- revocation: server-side invalidation path for logout, account compromise, disabled account, or provider revocation.
- logout: destroys or invalidates the formal user credential; it is distinct from local/demo `DELETE /creator/session`.
- account deletion / deactivation: verifier fails closed for disabled identities.

### 4.3 Privacy boundary

Session and credential data must remain answer-direction-neutral:

- No selected option, resolved `option_id`, raw option text, selected option index, profile eligibility denial paired with option selection, or answer payload may be stored in the session record.
- No session-level counters, per-option participation history, demographic breakdown, ranking personalization, precise location, or extra profile fields may be added by the credential phase.
- Vote token schema remains `user_id + poll_id`.
- Counter schema remains `poll_id + option_id + shard_id`.

---

## 5. Frontend Production Login UX Minimum Boundary

A later frontend production login UX phase must be paired with the production verifier implementation. Phase 71 only defines the boundary.

Minimum requirements:

- Provide an explicit login entry point before calling production profile, Official Vote, `vote-by-index`, or creator-owned routes that require user identity.
- Send only the approved formal credential transport; do not send MVP demo-style `X-User-Id` in production.
- Show logged-out / expired-session states without revealing whether a user selected an option.
- Provide logout UI for the formal user session; clarify that local/demo `creator_session` cleanup is not production logout.
- Keep Reference Answer UX separate until a future independent phase explicitly changes it.
- Do not store selected option memory in `localStorage`, `sessionStorage`, IndexedDB, cookies, URL query params, or hidden durable caches.
- Preserve existing Reference Answer runtime-memory clearing requirements on `pagehide` and BFCache `pageshow` with `event.persisted === true`.

The production login UX must not introduce demographic breakdown, ranking personalization, precise location, or extra profile fields.

---

## 6. Non-Production Compatibility

Local/demo/test compatibility is allowed only when explicit non-production configuration is active:

- `APP_ENV=development` or `APP_ENV=test`.
- MVP demo-style `X-User-Id` remains a non-production compatibility path only.
- `creator_session` remains a local/demo/test creator convenience and is not production public identity.
- Tests and docs must continue to label these paths as non-production.

Production must not silently enable non-production identity fallback, even for smoke tests, staging shortcuts, or emergency debugging.

---

## 7. Reference Answer Boundary

Reference Answer is deliberately out of Phase 71 implementation scope.

- Reference Answer is not cut over to `UserAuthResolver` in this phase.
- Reference Answer does not use profile eligibility in this phase.
- Reference Answer must not link a selected option with a production credential, formal session, profile, `creator_session`, request ID, trace ID, device ID, or analytics ID.
- Any future Reference Answer `UserAuthResolver` cutover requires a separate approved phase and must re-evaluate Design B, runtime-memory-only selected option handling, BFCache clearing, diagnostics, and the Raw Option Linkage Ban.

---

## 8. Official Vote Invariants

Phase 71 does not authorize any Official Vote behavior change.

### 8.1 Schemas

- Vote token schema remains `user_id + poll_id`.
- Counter schema remains `poll_id + option_id + shard_id`.
- No append-only vote event log.
- No raw vote event table.
- No `poll_status_snapshot`.
- No durable option-level user linkage.

### 8.2 Transaction order

`vote-by-index` and Official Vote transaction order remains:

```text
1. Participation guard
2. Official Vote trust guard
3. Profile / poll eligibility evaluation
4. Resolve option_index to internal option_id
5. Write vote token / idempotency
6. Increment counter shard
```

Eligibility must remain before option resolve, token write, and counter increment.

---

## 9. Logging, Metrics, APM, Debug, Analytics, and Error Payload Guard

A future verifier implementation may need health or security diagnostics, but diagnostics must be answer-direction-neutral.

Allowed examples:

- verifier configured / missing / unhealthy state without credential material.
- credential verification failure class without selected option data.
- aggregate count of auth failures by route, if it cannot link a user/session/request to a selected option.

Forbidden examples:

- `user_id + poll_id + option_id`
- `session_id + poll_id + option_index`
- `request_id + user_id + option_text`
- `profile_eligibility_denied + selected option`
- `creator_session + selected option`
- credential or verifier diagnostics containing raw option payloads.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 10. Rollback and Failure Modes

### 10.1 Missing verifier

Production missing verifier is not a degraded demo mode. It must fail closed.

Expected behavior for a future implementation:

- Profile, Official Vote, `vote-by-index`, and production `/creator/*` routes reject authentication.
- No fallback to raw `X-User-Id`.
- No fallback to `creator_session`.
- No fallback to demo fixture users.
- No option, profile, vote token, counter, ranking, or Reference Answer behavior changes.

### 10.2 Verifier outage or misconfiguration

The safe rollback is to disable production credential acceptance and fail closed, not to re-enable demo identity in production.

Rollback must preserve:

- vote token schema `user_id + poll_id`.
- counter schema `poll_id + option_id + shard_id`.
- Official Vote transaction order.
- Reference Answer separation.
- creator ownership checks.
- no durable selected-option linkage.

---

## 11. Future Implementation Phase Entry Criteria

A future implementation phase may begin only after this planning boundary is reviewed and the implementation plan names:

1. credential transport and verifier source.
2. session TTL, refresh, revocation, logout, and disabled-account behavior.
3. `UserAuthResolver` injection path.
4. frontend production login UX behavior and production removal of demo `X-User-Id`.
5. diagnostics allowed fields and forbidden payload checks.
6. tests proving fail-closed behavior and absence of raw option linkage.
7. rollback plan that fails closed without demo fallback.

Stop and report if the implementation requires durable selected-option linkage, profile eligibility plus selected option linkage, Reference Answer profile eligibility, creator_session production public identity, vote transaction order changes, vote token/counter schema changes, demographic breakdown, ranking personalization, precise location, or extra profile fields.

---

## 12. Validation for Phase 71 Docs

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Docs guard: `tests/docs/phase-71-production-credential-verifier-plan-doc.test.ts`

---

## 13. Change Log

| Phase | Content |
|-------|---------|
| 70 final | Production auth route adapter checkpoint; remaining work identified |
| 71 | Production credential verifier / formal user session planning; docs/spec only |

`design-drafts/` remains excluded from git and delivery scope.
