# WWW Project Phase 88 - Registration / Profile Setup Plan v1

**Status:** docs/spec only. Defines a future production registration and initial profile setup plan building on the Phase 78-87 login/session foundation and the Phase 66 profile fields. No runtime behavior, frontend implementation, backend API behavior, migration, schema, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me`, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer, profile eligibility runtime, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

---

## 1. Goal

Future production registration should create or prepare a formal user identity with the minimum information needed for account display and Official Vote profile eligibility:

- `display_name`
- `birth_year_month`
- `residential_region`

Gender remains excluded. Exact birthday, precise location, address, demographic breakdowns, ranking personalization, analytics linkage, vote history, poll data, option data, session internals, and token material remain out of scope.

---

## 2. Future Flow Shape

The recommended future runtime should be small and explicit:

1. User opens a production registration/account setup page.
2. User submits only:
   - `display_name`
   - `birth_year_month`
   - `residential_region`
   - the approved production credential proof or provider assertion needed by the registration authority.
3. Backend validates the credential proof through an approved production registration authority.
4. Backend creates or prepares the server-side user identity using a server-generated `user_id`.
5. Backend writes only the existing account/profile fields needed for this phase.
6. Backend does not return raw credential proof, session token, token digest, cookie value, or profile eligibility trace data.
7. Successful setup transitions the browser into the existing login/session flow.

Two future implementation options are acceptable:

| Option | Shape | Requirement |
|--------|-------|-------------|
| A | Registration returns a neutral success response, then frontend calls existing `POST /login/session` with the approved credential proof. | Keeps session issuance entirely inside the existing login route. |
| B | Registration endpoint calls a shared internal session-issuance helper that preserves the exact Phase 80 cookie and digest rules. | Requires a separate approved runtime phase and tests proving parity with `POST /login/session`. |

Phase 88 recommends Option A for first implementation because it avoids changing the existing login/session runtime. Option B must not duplicate session logic casually and must not alter the public behavior of `POST /login/session`.

---

## 3. Required Initial Fields

### 3.1 `display_name`

Purpose:

- Account display only.
- Existing `GET /users/me` may continue to expose `user_id` and `display_name` only.
- Must not be used as a ranking signal, eligibility signal, option parsing signal, or governance priority signal.

Future validation:

- Required non-empty string after trimming.
- Bounded length, with the exact bound chosen in the implementation phase.
- Reject control characters and invisible-only values.
- Normalize surrounding whitespace.
- Do not require global uniqueness unless a later account policy explicitly needs it.
- Do not echo invalid submitted values in error payloads.

### 3.2 `birth_year_month`

Purpose:

- Month-granular age eligibility only.
- Stored using the existing Phase 66 profile field semantics.

Future validation:

- Required for production registration/profile setup.
- Accept only normalized `YYYY-MM`.
- Month must be `01` through `12`.
- Year must be bounded by product policy in the implementation phase.
- Reject `YYYY-MM-DD`, timestamps, timezone-bearing dates, exact birthday aliases, raw dates, age in days, or values that can encode a precise birthday.
- Store only month granularity.

### 3.3 `residential_region`

Purpose:

- Coarse region eligibility only.
- Stored using the existing Phase 66 profile field semantics.

Future validation:

- Required for production registration/profile setup.
- Accept only a coarse region code from an approved allowlist, such as jurisdiction-level codes like `TW-TPE` or equivalent product policy codes.
- Reject free-form addresses, street names, postal addresses, precise neighborhoods, latitude/longitude, geohashes, GPS coordinates, geocodes, and other high-precision location data.
- The implementation phase must define the initial allowlist source and update process.

### 3.4 Excluded Fields

Future registration/profile setup must not collect or persist:

- `gender` or gender-equivalent fields.
- exact birthday, date of birth, day-level age data, or exact age traces.
- address, postal address, GPS, latitude/longitude, geocode, street, neighborhood, or precise location.
- poll ID, option ID, option text, option index, selected option index, answer payload, vote token, shard ID, counter data, or result data.
- session ID, `token_sha256`, raw session token, cookie value, request identifier paired with option choice, or trace identifier paired with option choice.

---

## 4. Identity Creation Boundary

Registration must create or prepare identity server-side:

- `user_id` must be generated by the server or trusted identity provider mapping, never chosen by the client.
- Client-supplied `X-User-Id`, query user IDs, body user IDs, forwarded identity headers, and `creator_session` must not create or select production account identity.
- The server may create an inactive/pending user record until the approved credential proof is verified.
- The server may activate the user only after the required initial fields validate and the credential authority approves the account.
- Durable account/profile rows may contain `user_id`, `display_name`, `birth_year_month`, and `residential_region`; they must not include poll option choices or vote details.
- Admin/audit needs for registration must be planned separately and must not create user-option linkage.

Registration responses should be minimal:

- Allowed: neutral registration status and next-step state.
- Allowed only if needed: `user_id`, matching the already-approved `/users/me` identity exposure.
- Forbidden: `birth_year_month`, `residential_region`, trust/role, credential proof, raw token, token digest, cookie value, session ID, vote history, poll data, option data, or eligibility traces.

---

## 5. Relationship to Existing Login and Login State

Future registration must preserve existing Phase 80-87 behavior:

- `POST /login/session` remains the canonical login/session issuance route unless a later phase explicitly approves a shared internal issuance helper.
- `DELETE /login/session` remains the logout/revoke/clear route.
- `UserAuthResolver` remains the identity resolver for protected routes.
- `GET /users/me` remains minimal and must continue to return only `user_id` and `display_name`.
- Frontend login state must continue to display only `display_name`.
- Registration success must not expose or store the raw `www_session` token in JavaScript, logs, analytics, durable browser storage, or response bodies.
- Cookie issuance, if used by a future registration endpoint, must preserve `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, bounded `Max-Age`, and no `Domain`.

The preferred browser sequence after successful registration is:

```text
registration/account setup success
→ POST /login/session with approved credential proof
→ browser receives HttpOnly www_session
→ GET /users/me with credentials: 'same-origin'
→ header displays display_name only
```

---

## 6. Official Vote Eligibility

Production registration/profile setup should make the account vote-ready by requiring non-null `birth_year_month` and `residential_region`.

Rules:

- Official Vote and `vote-by-index` transaction order must not change.
- Eligibility must remain before option resolve for `vote-by-index`.
- Vote token schema remains `user_id + poll_id`.
- Counter schema remains `poll_id + option_id + shard_id`.
- Missing or invalid profile fields must not reveal whether an option index exists.
- Profile eligibility denials must not log or emit option ID, option text, option index, selected answer payload, or profile field plus option linkage.
- No vote-time profile snapshots, demographic breakdowns, historical recalculation, vote replay, or eligibility backfill are approved by this plan.

Reference Answer remains separate:

- Registration/profile setup must not connect Reference Answer to `UserAuthResolver`.
- Registration/profile setup must not connect Reference Answer to profile eligibility.
- Reference Answer must not store selected option data or option-level durable counters.

---

## 7. Production vs Local/Demo/Test

Production:

- Uses formal registration authority and production login/session foundation.
- Rejects raw `X-User-Id` as account identity.
- Does not use `creator_session` as public user identity.
- Requires exact allowed-Origin or equivalent CSRF protection for registration mutations.

Local/demo/test:

- May keep explicit MVP `X-User-Id` compatibility for demo and tests.
- May keep `creator_session` as separate local/demo/test creator flow only.
- Must label demo identity behavior clearly in UI and tests.
- Must not treat local/demo/test shortcuts as production registration or production login.

---

## 8. Future UI Requirements

The future registration/profile setup UI should be accessible and mobile-friendly:

- Use a single-column form that fits narrow mobile screens without horizontal scrolling.
- Use explicit labels for every input.
- Use `autocomplete` values appropriate to account display and coarse profile fields when available.
- Use field-level validation messages tied with `aria-describedby`.
- Use one neutral live region for submit status.
- Keep submit buttons disabled or busy only while a request is in flight.
- Preserve keyboard navigation and visible focus.
- Do not display `user_id`, token values, cookie values, credential internals, profile eligibility traces, poll data, option data, or selected answer data.
- Use neutral error copy; do not reveal whether a credential maps to an existing user unless the account policy explicitly approves that disclosure.

No registration UI or profile setup UI is implemented in Phase 88.

---

## 9. Privacy, Logs, Errors, and Analytics

Future runtime must not log, metric, trace, analyze, or return:

- raw credential proof.
- raw `www_session` token.
- `token_sha256`.
- cookie values.
- `birth_year_month` or `residential_region` paired with poll ID, option ID, option text, option index, selected option index, request identity, session identity, device identity, trace identity, analytics identity, or user action that reveals answer direction.
- registration payloads containing precise location, exact birthday, gender, or option data.

Allowed diagnostics must be aggregate and non-directional:

- validation failure counts by field name only.
- registration success/failure counts without raw values.
- coarse error codes without submitted values.

Error responses:

- Must be neutral.
- Must not echo submitted profile values.
- Must not include credential/verifier internals.
- Must not include session IDs, token digests, raw tokens, cookie values, poll IDs, option IDs, option text, option index, or eligibility traces.

I verified that this docs-only plan adds no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records that capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 10. Explicit Non-Goals

Phase 88 does not implement or approve:

- registration runtime.
- profile setup UI.
- login/backend/runtime changes.
- `user_sessions` schema changes.
- `users` schema or migration changes.
- `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, or `GET /users/me` behavior changes.
- Official Vote transaction order changes.
- `vote-by-index` eligibility order changes.
- vote token or counter schema changes.
- Reference Answer auth/profile integration.
- demographic breakdowns.
- ranking personalization.
- analytics linkage.
- precise location.
- exact birthday.
- address.
- `gender` or any extra profile field.
- exposing `birth_year_month` or `residential_region` through `/users/me`.
- production use of `creator_session` as public user identity.

---

## 11. Validation

Phase 88 validation target:

```text
git diff --check
npm run typecheck
npm test
npm run build
```

`design-drafts/` remains excluded from git and delivery scope.
