# WWW Project Phase 89 - Registration Runtime Foundation v1

**Status:** minimal runtime foundation. Adds verifier-backed `POST /registration` to prepare a production user account with the existing `users` fields `display_name`, `birth_year_month`, and `residential_region`. No migration, `user_sessions` schema change, `users` schema change, frontend registration UI, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me`, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer behavior, ranking, personalization, analytics linkage, precise location, exact birthday, address, gender, extra profile field, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

---

## 1. Endpoint

```text
POST /registration
```

Availability:

- Route is available only when explicitly wired with the existing trusted credential verifier boundary.
- If registration is not configured, the route returns `404 NOT_FOUND`.
- Mutation requires an exact allowed `Origin` configured through the same allowed-origin policy used for login session mutations.

Credential proof:

- The JSON body does not accept credential fields.
- The request uses the existing verifier-compatible credential transport, currently `Authorization: Bearer <proof>`.
- Raw credential proof is not stored, returned, logged, or copied into account/profile rows.

Request body accepts exactly:

```json
{
  "display_name": "Registered User",
  "birth_year_month": "1998-07",
  "residential_region": "TW-TPE"
}
```

No other JSON keys are accepted.

Successful response:

```json
{
  "registered": true,
  "login_required": true
}
```

The response intentionally does not include `user_id`, `birth_year_month`, `residential_region`, credential proof, session ID, `token_sha256`, raw token, cookie value, trust/role, vote history, poll data, option data, or eligibility traces.

---

## 2. Validation

`display_name`:

- required string.
- trimmed and whitespace-normalized.
- must be non-empty.
- must be at most 80 characters.
- control characters are rejected.

`birth_year_month`:

- required string.
- accepts only normalized `YYYY-MM`.
- month must be `01` through `12`.
- exact dates such as `YYYY-MM-DD`, timestamps, numeric values, and exact birthday aliases are rejected.
- persisted as a month-granular date matching Phase 66 profile storage.

`residential_region`:

- required string.
- trimmed before storage.
- accepts only coarse region-code style values matching the existing Phase 66 profile route pattern.
- free-form addresses, street names, precise coordinate-like values, lowercase codes, spaces, and overlong values are rejected.

Explicitly rejected:

- `gender`.
- exact birthday, date of birth, or precise age traces.
- address, postal address, street, neighborhood, GPS, latitude/longitude, geocode, or precise location.
- poll ID, option ID, option text, option index, selected option index, answer payload, vote token, shard ID, result counter, or eligibility trace.
- `credential_proof` or equivalent body-carried credential fields.

Validation errors are neutral:

```json
{
  "error": "REGISTRATION_VALIDATION",
  "message": "Invalid registration payload"
}
```

---

## 3. Identity and Conflict Behavior

The route uses only the verifier-resolved `user_id`.

Ignored as identity:

- raw `X-User-Id`.
- body-selected user IDs.
- query-selected user IDs.
- forwarded identity headers.
- `creator_session`.

If a user with the verifier-resolved `user_id` already exists, registration fails with:

```json
{
  "error": "REGISTRATION_CONFLICT",
  "message": "Registration cannot be completed for this credential"
}
```

The existing account row is not updated by duplicate registration attempts.

---

## 4. Session Behavior

Phase 89 does not create a login session automatically.

Reason:

- Phase 88 recommended keeping initial registration separate from session issuance.
- Reusing the existing `POST /login/session` path avoids duplicating cookie/session logic and preserves Phase 80 behavior.

After successful registration, the expected browser sequence remains:

```text
POST /registration
→ 201 { registered: true, login_required: true }
→ POST /login/session with the same approved credential proof
→ browser receives HttpOnly Secure SameSite=Lax www_session
→ GET /users/me
→ header displays display_name only
```

`POST /registration` does not set `Set-Cookie`.

---

## 5. Boundaries Preserved

Phase 89 does not change:

- `user_sessions` schema.
- `users` schema or migrations.
- `POST /login/session`.
- `DELETE /login/session`.
- `UserAuthResolver`.
- `GET /users/me`.
- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary.
- Reference Answer profile eligibility exclusion.
- `creator_session` local/demo/test creator-flow separation.

`GET /users/me` continues to expose only `user_id` and `display_name`; it does not expose `birth_year_month` or `residential_region`.

---

## 6. Privacy and Observability

Phase 89 adds no logs, metrics, analytics events, APM traces, debug payloads, or error payloads containing submitted profile values, credential proof, session internals, or option data.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 7. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run test:integration:local
```

`design-drafts/` remains excluded from git and delivery scope.
