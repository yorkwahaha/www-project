# WWW Project Phase 78 - Production Session Schema Foundation v1

**Status:** DB/auth foundation + repository + tests + docs checkpoint. No login submit, Set-Cookie issuance, production logout API, frontend behavior, protected API behavior, `UserAuthResolver` production behavior, production `trustedCredentialVerifier` behavior, profile API behavior, Official Vote behavior, `vote-by-index` behavior, creator route behavior, Reference Answer behavior, Official Vote transaction order, profile eligibility, vote token schema, counter schema, ranking/personalization, demographic breakdown, analytics linkage, precise location, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior change is introduced by this phase.

**Baseline:** Phase 77 recommended HttpOnly Secure SameSite cookie session as the next production browser runtime, while preserving Bearer as a controlled verifier path. Phase 78 creates only the schema and repository foundation needed for a later implementation phase.

---

## 1. Implemented Scope

Phase 78 adds:

- Migration `011_phase78_production_user_session_foundation.sql`.
- Table `user_sessions`.
- `src/user-sessions/repository.ts`.
- `src/user-sessions/in-memory-repository.ts`.
- Schema guard, repository unit test, source guard, and PostgreSQL integration test.
- README index update and this checkpoint.

Phase 78 does not:

- Implement login submit.
- Issue `Set-Cookie`.
- Add a production logout API.
- Wire `user_sessions` into `UserAuthResolver`.
- Wire `user_sessions` into production `trustedCredentialVerifier`.
- Change any protected route behavior.
- Change `/users/me/profile`, Official Vote, `vote-by-index`, creator routes, or Reference Answer.

---

## 2. Table Summary

`user_sessions` stores only production account session lifecycle data:

| Column | Purpose |
|--------|---------|
| `session_id` | Server-generated opaque session row identifier |
| `token_sha256` | SHA-256 digest of the future opaque session token; raw token is never stored |
| `user_id` | Canonical account identity, FK to `users(id)` |
| `created_at` | Session creation time |
| `expires_at` | Absolute expiry |
| `revoked_at` | Revocation timestamp, nullable |
| `last_used_at` | Bounded operational lifecycle timestamp, nullable |

Constraints:

- `token_sha256` is unique and must be 32 bytes.
- `expires_at > created_at`.
- `revoked_at IS NULL OR revoked_at >= created_at`.
- `last_used_at IS NULL OR (last_used_at >= created_at AND last_used_at <= expires_at)`.
- `user_id` references `users(id)`.

Indexes:

- `idx_user_sessions_user_id`.
- `idx_user_sessions_cleanup`.
- `idx_user_sessions_active_user`.

---

## 3. Repository Foundation

`UserSessionRepository` supports only lifecycle storage primitives:

- `findUserById(userId)`.
- `insertSession(row)`.
- `findSessionByDigest(tokenSha256)`.
- `markSessionUsed(sessionId, lastUsedAt)`.
- `revokeSession(sessionId, revokedAt)`.

The repository accepts hashed token digests only. It does not generate raw session tokens, serialize cookies, parse cookies, parse Bearer tokens, verify production credentials, or resolve HTTP identity.

---

## 4. Auth Runtime Boundary

Phase 78 deliberately leaves production auth behavior unchanged:

- No login submit.
- No `Set-Cookie`.
- No formal logout API.
- No change to `UserAuthResolver`.
- No change to production `trustedCredentialVerifier`.
- No change to Phase 72 `USER_AUTH_CREDENTIALS_JSON`.
- No production fallback to raw `X-User-Id`.
- No production fallback to `creator_session`.

A future implementation phase must explicitly wire cookie session lookup into `trustedCredentialVerifier` and must include source guards proving that domain services still do not parse cookies, Bearer credentials, `X-User-Id`, or `creator_session` directly.

---

## 5. Vote / Profile / Reference Answer Boundary

Phase 78 does not change:

- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Profile eligibility fields or evaluator behavior.
- `/users/me/profile`.
- Official Vote.
- `vote-by-index`.
- Creator routes.
- Reference Answer.

Reference Answer remains separate. It is not cut over to `UserAuthResolver` in Phase 78. Any future Reference Answer `UserAuthResolver` cutover must be a separate approved phase and must re-evaluate Design B, runtime-memory-only selected option handling, BFCache clearing, diagnostics, and the Raw Option Linkage Ban.

---

## 6. Privacy and Integrity Boundary

The `user_sessions` table must not store:

- `poll_id + option_id`.
- `poll_id + selected_option_index`.
- `poll_id + option_text`.
- selected answer payload.
- Reference Answer selected option data.
- vote token row copy.
- counter shard assignment.
- profile eligibility denial paired with selected option.
- request ID, trace ID, device ID, analytics ID, IP address, user agent, or fingerprint linked to selected option.
- demographic breakdown fields.
- precise location.
- extra profile fields.
- ranking or personalization features.

No option choice + user/session/device/request/log/trace/metric/error payload linkage is introduced.

---

## 7. Logs / Metrics / APM / Error Payload Self-Check

Phase 78 adds no logging, metrics, APM, trace, debug payload, analytics, or error payload behavior.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 8. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run test:integration:local
```

If Docker or PostgreSQL is unavailable, report that explicitly.

`design-drafts/` remains excluded from git and delivery scope.
