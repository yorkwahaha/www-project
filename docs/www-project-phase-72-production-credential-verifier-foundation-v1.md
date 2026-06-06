# WWW Project Phase 72 — Production Credential Verifier Foundation v1

**Status:** runtime foundation + tests + docs checkpoint. No login UX, public frontend change, migration, DB schema change, API behavior change, vote transaction change, profile eligibility change, Reference Answer cutover, creator route behavior change, ranking/personalization change, analytics linkage, metrics linkage, traces linkage, debug payload linkage, or error payload shape change.

**Baseline:** `origin/master` @ **`94c8f7f`** (Phase 71 production credential verifier / formal session planning).

**Spec basis:** Phase 71 plan, Phase 70 final production auth boundary checkpoint, `AGENTS.md` v0.2, and the Raw Option Linkage Ban.

---

## 1. Delivered Foundation

Phase 72 adds the smallest production credential verifier foundation needed by `UserAuthResolver`:

- `src/auth/production-credential-verifier.ts`
- `USER_AUTH_CREDENTIALS_JSON`
- `createProductionCredentialVerifier`
- `createProductionCredentialVerifierFromEnv`
- `sha256UserCredentialToken`
- `createUserAuthResolverFromEnv` production wiring

The verifier accepts only an explicitly configured opaque `Authorization: Bearer <token>` credential. Runtime config stores only SHA-256 token digests, canonical `user_id`, `expires_at`, and optional `revoked_at`.

There is still no production login page, no session issuance route, no session database, no OAuth/OIDC integration, and no frontend production login UX.

---

## 2. Production Config Shape

Environment variable:

```text
USER_AUTH_CREDENTIALS_JSON
```

Shape:

```json
[
  {
    "token_sha256": "<64 lowercase hex SHA-256 digest>",
    "user_id": "11111111-1111-4111-8111-111111111111",
    "expires_at": "2099-01-01T00:00:00.000Z",
    "revoked_at": null
  }
]
```

Rules:

- Missing `USER_AUTH_CREDENTIALS_JSON` in production means no verifier is configured; production identity resolution fails closed.
- Invalid JSON, non-array config, empty config, duplicate `token_sha256`, invalid digest, invalid `user_id`, or invalid dates fail at startup/config creation.
- Expired credentials fail closed.
- Credentials with `revoked_at` fail closed.
- Raw token values must not be stored in config.

---

## 3. Auth Boundaries

### 3.1 Accepted production credential

Only a valid configured `Authorization: Bearer <opaque-token>` credential can resolve production identity through the Phase 72 foundation.

### 3.2 Rejected production identity sources

Production still rejects:

- raw `X-User-Id`
- body user IDs
- query user IDs
- forwarded identity headers
- request IDs
- trace IDs
- IP / device / analytics identity
- `creator_session`
- demo fixture identity

### 3.3 Local/demo/test compatibility

Local/demo/test retain explicit MVP `X-User-Id` compatibility through `APP_ENV=development|test`. This compatibility remains non-production only.

---

## 4. Privacy and Integrity Invariants

Phase 72 does not change:

- Vote token schema: `user_id + poll_id`
- Counter schema: `poll_id + option_id + shard_id`
- Official Vote transaction order
- `vote-by-index` eligibility before option resolve
- profile eligibility fields or evaluator behavior
- Reference Answer behavior or auth source
- creator route behavior or ownership checks
- result display thresholds
- ranking / Wonder Flow
- demographic breakdown
- precise location
- extra profile fields

The production verifier does not read or receive `option_id`, `option_index`, `option_text`, selected answer payloads, profile eligibility fields, poll IDs, or creator session cookies.

---

## 5. Failure and Rollback

Production verifier missing, expired, revoked, malformed, duplicate, or unknown credentials fail closed.

Safe rollback is to remove or omit `USER_AUTH_CREDENTIALS_JSON`, which returns production profile, Official Vote, `vote-by-index`, and production `/creator/*` identity resolution to fail-closed behavior. Rollback must not re-enable raw `X-User-Id` or `creator_session` in production.

---

## 6. Tests

Added / updated guards:

- `tests/auth/production-credential-verifier.test.ts`
- `tests/auth/production-credential-verifier-source-guard.test.ts`
- `tests/auth/user-auth-resolver.test.ts`
- `tests/http/user-profile-routes.test.ts`
- `tests/docs/phase-72-production-credential-verifier-foundation-doc.test.ts`

Validation:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
```

---

## 7. Logs / Metrics / APM / Error Payload Self-Check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

`design-drafts/` remains excluded from git and delivery scope.
