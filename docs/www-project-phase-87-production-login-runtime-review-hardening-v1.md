# WWW Project Phase 87 - Production Login Runtime Review / Hardening v1

**Status:** review and documentation hardening. Reviewed the completed Phase 78-86 production login runtime flow across `user_sessions`, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver` `www_session` verification, `GET /users/me`, frontend login-state read/logout UI, and the `/login` form. No runtime defect requiring a schema, migration, API, Official Vote, `vote-by-index`, Reference Answer, profile eligibility, ranking, logging, metrics, APM, trace, debug payload, analytics, or error payload change was found.

---

## 1. Review Conclusion

Phase 87 confirms the Phase 78-86 runtime remains within the approved production login/session boundary:

- raw session tokens are generated only for cookie issuance and are not persisted.
- `user_sessions` stores `token_sha256` digest-backed lifecycle data, not raw tokens.
- `POST /login/session` requires an allowed mutation `Origin`, a trusted credential verifier, and an active user before issuing a cookie.
- `DELETE /login/session` requires an allowed mutation `Origin`, hashes the received `www_session`, revokes the matching active session by digest, and clears the cookie.
- `UserAuthResolver` reads `www_session` only in production mode when a session repository is configured; development/test do not treat `www_session` as identity.
- production rejects raw `X-User-Id`; development/test `X-User-Id` compatibility remains explicit.
- `creator_session` remains separate local/demo/test creator flow only and does not authorize public profile, vote, or Reference Answer identity.
- `GET /users/me` returns only `user_id` and `display_name`.
- frontend login-state UI displays only `display_name`; logout and login failures use neutral copy.

No registration UI, profile UI, schema change, migration, vote transaction change, vote token change, counter change, or Reference Answer integration was added.

---

## 2. Runtime Surfaces Reviewed

| Surface | Phase 87 review result |
|---------|------------------------|
| `migrations/011_phase78_production_user_session_foundation.sql` | Minimal digest-backed `user_sessions` lifecycle schema remains unchanged. |
| `src/user-sessions/repository.ts` | Repository inserts and looks up only `token_sha256` digest data; revoke and last-used updates are session-id bounded. |
| `src/http/login-session-routes.ts` | Login/logout mutations retain exact allowed-Origin checks, verifier fail-closed behavior, digest storage, and neutral route errors. |
| `src/auth/session-cookie.ts` | Cookie parser accepts exactly one well-formed `www_session` token and returns `null` otherwise. |
| `src/auth/user-auth-resolver.ts` | Production session reads hash the raw cookie token before lookup and update `last_used_at` only after valid active session verification. |
| `src/http/user-profile-routes.ts` | `GET /users/me` routes through `UserAuthResolver` and delegates to the existing minimal identity service response. |
| `public/frontend/login-state-read.js` | Parses only `display_name` from `GET /users/me` and uses `credentials: 'same-origin'`. |
| `public/frontend/login-state-ui.js` | Displays only `display_name` and the logout control; no `user_id`, profile, token, or option fields are rendered. |
| `public/frontend/login-state-logout.js` | Calls `DELETE /login/session` with `credentials: 'same-origin'` and returns only success/failure. |
| `public/frontend/login-page.js` / `public/login.html` | Submits only the credential proof to `POST /login/session`, refreshes login state with `GET /users/me`, and keeps errors neutral. |

---

## 3. Security and Privacy Boundary Confirmation

Confirmed retained boundaries:

- raw `www_session` token is never returned in a response body.
- raw `www_session` token is not stored in `user_sessions`; only `token_sha256` is stored.
- session cookie attributes remain `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, bounded `Max-Age`, and no `Domain`.
- logout clears the cookie with matching safety attributes and `Max-Age=0`.
- login/logout mutation Origin checks remain enforced before session issuance or revoke.
- production does not accept raw `X-User-Id` as identity.
- development/test `X-User-Id` compatibility remains explicit and non-production.
- non-production does not treat `www_session` as identity.
- `creator_session` remains separate from production user identity.
- `/users/me` does not expose `birth_year_month`, `residential_region`, trust/role, vote history, poll or option data, session IDs, token digests, raw tokens, or cookie values.
- frontend displays only `display_name` and neutral failure messages.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 4. Hardening Result

No runtime hardening patch was required. The only Phase 87 changes are documentation and a docs guard test for this review note and README index entry.

If a future phase changes login/session runtime, it must continue to avoid durable user-option linkage and must not change Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer auth boundary, or profile eligibility behavior without a separate approved high-risk phase.

---

## 5. Validation

Phase 87 validation target:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run test:integration:local
npm run smoke:public:local
```

`design-drafts/` remains excluded from git and delivery scope.
