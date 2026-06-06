# WWW Project Phase 73 — Production Login / Session UX Planning v1

**Status:** docs/spec only. No runtime change, public frontend change, migration, DB schema change, API behavior change, verifier behavior change, login/session implementation, vote transaction change, profile eligibility change, Reference Answer cutover, creator route behavior change, ranking/personalization change, analytics linkage, metrics linkage, traces linkage, debug payload linkage, or error payload shape change.

**Baseline:** `origin/master` @ **`3a6e2b8`** (Phase 72 production credential verifier foundation).

**Spec basis:** Phase 72 foundation, Phase 71 plan, Phase 70 final production auth boundary checkpoint, `AGENTS.md` v0.2, and the Raw Option Linkage Ban.

---

## 1. Purpose

Phase 73 defines the production login/session UX boundary that a future implementation phase must satisfy before the public frontend can stop using MVP demo-style `X-User-Id`.

Phase 73 does **not** implement login, logout, session issuance, credential refresh, browser storage, frontend UI, new routes, migrations, or credential provider integration.

---

## 2. Production Login UX Minimum Flow

A future production login UX must provide the smallest explicit account flow needed for profile, Official Vote, `vote-by-index`, and production creator-owned routes:

1. User opens a production route that requires public user identity.
2. Frontend detects that no approved production credential is present or the route returns `401 AUTH_REQUIRED`.
3. User is sent to an explicit login entry point.
4. Login completes through the approved production credential provider.
5. Frontend receives or can use only the approved production credential transport.
6. Authenticated calls include the approved credential, such as `Authorization: Bearer <opaque-token>` from the Phase 72 verifier foundation or a later approved transport.
7. Route adapters continue to resolve identity only through `UserAuthResolver`.
8. Logout and expired/revoked credential states return the user to logged-out UI without exposing answer direction.

The UX must never ask the user to type a user ID, paste `X-User-Id`, choose a creator identity, or select a profile identity.

---

## 3. Required User-Facing States and Copy Boundaries

Exact copy is future frontend scope. The required meaning is:

| State | Required UX meaning | Privacy boundary |
|-------|----------------------|------------------|
| Logged out | Sign in is required before profile, Official Vote, `vote-by-index`, or creator-owned production actions | Do not reveal whether the user previously selected an option |
| Session expired | Session expired; sign in again | Do not preserve selected option in durable browser storage |
| Credential revoked | Session can no longer be used; sign in again | Do not distinguish account moderation from token revocation in a way that links to a poll option |
| Verifier unavailable / missing | Service cannot verify login right now | Fail closed; do not fall back to demo identity |
| Logout complete | User is signed out | Clear credential transport according to provider rules; do not clear or expose vote history |

Error copy must not include raw credential values, token digests, user IDs, option IDs, option text, option index, request IDs tied to selected options, trace IDs tied to selected options, or profile eligibility details paired with a selected option.

---

## 4. Frontend Credential Storage Boundary

Phase 73 does not choose the final storage transport. A future implementation must choose and document one approved transport.

Allowed candidate approaches:

- HTTP-only secure same-site cookie managed by the server or identity provider.
- Short-lived in-memory Bearer credential for same-tab use.
- Identity-provider managed session mechanism with server-side verification.

Risky or disallowed for selected option and identity linkage:

- Do not store selected option state in `localStorage`, `sessionStorage`, IndexedDB, cookies, URL query params, history state, hidden durable caches, analytics queues, or service-worker caches.
- Do not store raw credentials in `localStorage`, `sessionStorage`, IndexedDB, URL query params, or readable cookies.
- Do not combine credential/session identifiers with `poll_id + option_id`, `poll_id + option_index`, `poll_id + option_text`, selected answer payloads, profile eligibility denial, or Reference Answer selected option data.
- Do not add frontend analytics that links login/session identity to answer choice.

Reference Answer selected option memory remains JavaScript runtime memory only and must still be cleared on `pagehide` and BFCache `pageshow` when `event.persisted === true`.

---

## 5. Production vs Local/Demo/Test Flow Split

| Environment | Login/session UX | Identity source |
|-------------|------------------|-----------------|
| Production | Formal login/session UX required before protected public user actions | Approved production credential through `UserAuthResolver` |
| Local/demo | Demo UX may continue MVP fixture identity | Explicit MVP `X-User-Id` compatibility only under non-production config |
| Test | Tests may inject MVP identity or verifier fixtures | Explicit test config only |

Production must not silently enable local/demo/test identity fallback, even for staging shortcuts, smoke tests, emergency debugging, or frontend convenience.

---

## 6. `Authorization: Bearer` and `UserAuthResolver` Boundary

Phase 72 introduced the minimal opaque Bearer verifier foundation:

- `USER_AUTH_CREDENTIALS_JSON`
- `Authorization: Bearer <opaque-token>`
- SHA-256 token digest config
- canonical `user_id`
- `expires_at`
- optional `revoked_at`

Phase 73 keeps this runtime unchanged.

Future login/session UX may use the Phase 72 opaque Bearer foundation only as the credential transport into `UserAuthResolver`. It must not let frontend code decide `user_id`, override `user_id`, pass raw `X-User-Id`, or send body/query identity values.

Domain services must not parse credentials directly. Route adapters must keep using `UserAuthResolver`.

---

## 7. `creator_session` Boundary

`creator_session` remains local/demo/test only.

- It must not become production public identity.
- It must not authorize profile.
- It must not authorize Official Vote.
- It must not authorize `vote-by-index`.
- It must not authorize Reference Answer.
- It must not be treated as production logout or production account session.

Production creator-owned routes continue to require `UserAuthResolver` plus ownership checks.

---

## 8. Reference Answer Boundary

Reference Answer remains outside Phase 73 implementation scope.

- Reference Answer is not cut over to `UserAuthResolver`.
- Reference Answer does not use profile eligibility.
- Reference Answer does not use production login/session state to persist or reconstruct selected options.
- Any future Reference Answer `UserAuthResolver` cutover must be a separate approved phase.

---

## 9. Vote, Profile, Ranking, and Data Invariants

Phase 73 does not change:

- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- profile eligibility fields or evaluator behavior.
- result display thresholds.
- ranking / Wonder Flow.
- demographic breakdown.
- analytics linkage.
- precise location.
- extra profile fields.

No login/session UX may create durable or diagnostic option choice linkage with a user, session, device, request, log, trace, metric, error payload, debug payload, APM payload, analytics record, ETL job, or data warehouse record.

---

## 10. Failure Mode and Rollback

Production verifier or login/session missing:

- fail closed for profile, Official Vote, `vote-by-index`, and production `/creator/*`.
- do not fall back to raw `X-User-Id`.
- do not fall back to `creator_session`.
- do not fall back to demo fixture identity.
- do not reveal whether the user selected an option.

Rollback for a future login/session implementation must restore production fail-closed behavior by disabling credential issuance or omitting verifier config. Rollback must not introduce a production demo-auth bypass.

---

## 11. Future Implementation Entry Criteria

A future implementation phase must specify:

1. production login provider and credential transport.
2. whether frontend sends `Authorization: Bearer <opaque-token>` or uses a later approved transport.
3. credential storage and clearing behavior.
4. logout behavior.
5. expired and revoked credential UX.
6. fail-closed behavior when verifier/login is missing.
7. tests proving no production `X-User-Id` fallback.
8. tests proving `creator_session` is not production public identity.
9. tests proving Reference Answer remains separate.
10. tests or source guards proving no option choice linkage in logs, traces, metrics, debug payloads, analytics, or error payloads.

Stop and report if implementation requires durable selected-option linkage, profile eligibility plus selected option linkage, Reference Answer profile eligibility, creator_session production public identity, vote transaction order changes, vote token/counter schema changes, demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields.

---

## 12. Validation for Phase 73 Docs

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Docs guard: `tests/docs/phase-73-production-login-session-ux-plan-doc.test.ts`

---

## 13. Logs / Metrics / APM / Error Payload Self-Check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

`design-drafts/` remains excluded from git and delivery scope.
