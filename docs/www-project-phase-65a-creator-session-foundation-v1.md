# WWW Project Phase 65A - Creator Session Foundation v1

**Status:** minimal backend creator-session foundation only.

## Boundary

- Adds `POST`, `GET`, and `DELETE /creator/session`.
- Does not add `/creator/polls`, frontend session UX, creator ownership rewiring, or changes to existing `/polls` behavior.
- Production issuance remains unavailable until a trusted credential verifier exists.
- Local/test issuance requires `APP_ENV=development|test` and `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED=true`.
- `X-User-Id` and `X-Display-Name` never authorize creator sessions.

## Cookie And TTL

- Session tokens use 256-bit server-side CSPRNG output.
- PostgreSQL stores only the SHA-256 digest.
- Fixed absolute TTL: 12 hours. Validation never refreshes `expires_at`.
- Cookie attributes: `HttpOnly; SameSite=Strict; Path=/creator`; host-only because `Domain` is omitted.
- Production cookies are always `Secure`.
- Local insecure cookies additionally require `CREATOR_SESSION_ALLOW_INSECURE_COOKIE=true`.

## Origin Gate

`CREATOR_SESSION_ALLOWED_ORIGINS_JSON` is an exact-match JSON array of absolute HTTP(S)
origins. Production entries must use HTTPS. `POST` and `DELETE /creator/session`
reject missing, malformed, or non-allowlisted origins. Forwarding headers are not trusted.

## Cleanup Boundary

Expired or revoked rows may be deleted later by a separate operator maintenance command
in bounded batches of at most 500 rows. Phase 65A intentionally adds no request-time
cleanup and no HTTP cleanup route.

## Deferred

- Trusted production credential verification
- `/creator/polls` ownership wiring
- Frontend account/session UX
- Eligibility profile and evaluator
- Session cleanup operator command
