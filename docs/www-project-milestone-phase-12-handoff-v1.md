# WWW Project — Phase 12 Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-12-handoff-v1.md`
**Status:** Delivery record (non-normative)
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-milestone-phase-11-handoff-v1.md`
**Starting remote baseline:** `origin/master` @ `1c5acea` — `feat: display public correction notices on results page`

Phase 12 replaces the client-trusted `X-Admin-User-Id` stub with a server-side Admin Auth / RBAC v1 boundary for existing `/admin/*` routes. It does not change database schema, public APIs, public notice behavior, public feed, ranking, results, Official Vote, or Reference Answer.

---

## 1. Admin Auth v1

Admin routes require:

```http
Authorization: Bearer <opaque-token>
```

Production startup requires `ADMIN_AUTH_CREDENTIALS_JSON`. Each registry entry contains:

- `token_sha256`: SHA-256 digest of an externally generated high-entropy opaque token.
- `admin_user_id`: resolved server-side admin UUID.
- `role`: `admin`.
- `permissions`: `correction:read` and/or `correction:write`.

The registry does not store plaintext tokens. Missing, empty, or malformed config and duplicate token digests fail closed at startup.

---

## 2. RBAC boundary

| Permission | Routes |
|------------|--------|
| `correction:read` | `GET` review-context, audit-record, per-poll audit, global audit queue |
| `correction:write` | Correction request create, decision submit, active apply, suspended apply |

Authentication runs once at the `/admin/*` prefix before route dispatch. Route handlers use the same permission helper. Domain services retain the existing active `admin_users` check.

---

## 3. Error contract

| Condition | HTTP | `error` |
|-----------|------|---------|
| Missing credential | 401 | `ADMIN_AUTH_REQUIRED` |
| Malformed or unknown credential | 401 | `ADMIN_AUTH_INVALID` |
| Missing permission or inactive admin row | 403 | `ADMIN_FORBIDDEN` |

Responses do not expose token values, token digests, registry content, admin identity, or session internals.

---

## 4. Testing

Tests use an injected registry with deterministic test-only token strings and their SHA-256 digests. This injection is not a production bypass. PostgreSQL integration fixtures use the same Bearer boundary when `DATABASE_URL` is available.

---

## 5. Phase 14 deployment handoff

Operator-focused production setup and smoke checks for `ADMIN_AUTH_CREDENTIALS_JSON` (no schema or auth code changes): `docs/www-project-phase-14-admin-auth-deployment-v1.md`.

---

## 6. Still not implemented

- Admin login UI.
- Session lifecycle and revocation store.
- JWT or OAuth flow.
- Token rotation UI or automated secret distribution.
- Real Spread Score calculation.
- Spread Score ranking / priority.
- Other frontend admin UI.

---

*End of Phase 12 handoff v1.*
