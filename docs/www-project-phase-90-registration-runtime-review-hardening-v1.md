# WWW Project Phase 90 - Registration Runtime Review / Hardening v1

**Status:** review, documentation hardening, and focused route-test hardening. Reviewed the Phase 89 registration runtime foundation across `POST /registration`, request parsing and validation, verifier-only credential proof handling, duplicate/conflict behavior, repository writes, response bodies, error bodies, schema boundaries, docs, and tests. No runtime defect requiring a schema, migration, API contract, login/session, `UserAuthResolver`, `GET /users/me`, Official Vote, `vote-by-index`, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload change was found.

---

## 1. Review Conclusion

Phase 90 confirms that Phase 89 remains within the approved registration boundary:

- `POST /registration` is available only when explicitly configured with a trusted credential verifier and allowed mutation `Origin`.
- credential proof is transported through `Authorization: Bearer <proof>` and is not accepted from the JSON body.
- request parsing accepts exactly `display_name`, `birth_year_month`, and `residential_region`.
- `display_name` is trimmed, whitespace-normalized, bounded to 80 characters, and rejects control characters.
- `birth_year_month` accepts only normalized `YYYY-MM` and persists month-granular storage.
- `residential_region` uses the same coarse region-code pattern as the existing profile route and rejects free-form or precise location values.
- sensitive profile, session, credential, poll, option, vote, and eligibility fields are rejected by exact-key validation.
- duplicate verifier-resolved users receive a neutral `409 REGISTRATION_CONFLICT` and the existing user row is not updated.
- successful registration returns only `{ registered: true, login_required: true }`.
- `POST /registration` does not issue `www_session` and does not set `Set-Cookie`.
- `/users/me` remains limited to `user_id` and `display_name`.

No registration frontend UI, automatic login session issuance, no schema drift, migration, demographic breakdown, ranking personalization, analytics linkage, precise location, exact birthday, gender, address, extra profile field, vote transaction change, vote token change, counter change, or Reference Answer integration was added.

---

## 2. Runtime Surfaces Reviewed

| Surface | Phase 90 review result |
|---------|------------------------|
| `src/http/registration-routes.ts` | Exact-key JSON parsing, neutral validation/auth/conflict errors, allowed-Origin gate, verifier-only user identity, no cookie issuance. |
| `src/http/server.ts` | `/registration` is wired only when registration options are provided and supports only `POST`. |
| `src/app.ts` | Production registration wiring remains conditional on the existing trusted credential verifier configuration. |
| `src/polls/repository.ts` | `createRegisteredUser` inserts only existing `users` fields: `id`, `display_name`, `birth_year_month`, and `residential_region`; duplicate rows return `null`. |
| `src/polls/in-memory-repository.ts` | Unit-test repository mirrors the same user fields and duplicate behavior. |
| `tests/http/registration-routes.test.ts` | Route coverage now explicitly includes forbidden exact birthday, precise location, session, token, cookie, option, and credential body fields. |
| `tests/integration/registration-api.pg.test.ts` | PostgreSQL coverage confirms one user row, trimmed profile values, duplicate conflict behavior, and no session cookie. |
| `docs/www-project-phase-89-registration-runtime-foundation-v1.md` | Phase 89 runtime foundation remains aligned with the reviewed implementation. |
| `README.md` | Phase index now records this review/hardening checkpoint. |

---

## 3. Security and Privacy Boundary Confirmation

Confirmed retained boundaries:

- `POST /registration` does not create a login session and does not set `Set-Cookie`.
- credential proof remains verifier-handled through the request header boundary and is not stored, returned, logged, or accepted as JSON body data.
- rejected body fields include `gender`, exact birthday aliases, address and precise location aliases, `option_id`, `option_text`, `selected_option_index`, session IDs, token fields, cookie fields, and credential proof fields.
- registration responses do not expose `user_id`, `birth_year_month`, `residential_region`, credential proof, session IDs, token data, cookie values, trust/role, poll data, option data, vote data, or eligibility traces.
- registration error bodies remain neutral and do not echo submitted profile values, credential proof, session values, poll values, option values, or traceable choice data.
- repository writes use only existing `users` schema fields and do not touch `user_sessions`, vote tokens, counters, Reference Answer tokens, ranking, feed, analytics, metrics, logs, or diagnostics.
- Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema `user_id + poll_id`, and counter schema `poll_id + option_id + shard_id` are unchanged.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.
- `creator_session` remains separate local/demo/test creator flow only.
- Raw Option Linkage Ban remains preserved.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 4. Hardening Result

No runtime hardening patch was required. Phase 90 adds focused test cases for already-rejected sensitive fields plus this review note and README index update.

If a future phase changes registration runtime, it must continue to avoid durable user-option linkage and must not change login/session issuance, `UserAuthResolver`, `/users/me`, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer auth/profile boundaries, ranking, analytics, or observability payload behavior without a separate approved high-risk phase.

---

## 5. Validation

Phase 90 validation target:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run test:integration:local
```

`design-drafts/` remains excluded from git and delivery scope.
