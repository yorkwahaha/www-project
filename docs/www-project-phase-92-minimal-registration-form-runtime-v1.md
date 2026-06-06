# WWW Project Phase 92 - Minimal Registration Form Runtime v1

**Status:** minimal frontend runtime. Adds a small `GET /registration` page and `registration-page.js` form runtime that call the existing `POST /registration` endpoint. No `POST /registration` backend behavior, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me` shape, schema, migration, Official Vote, `vote-by-index`, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed.

---

## 1. Runtime Behavior

The registration page collects only:

- `display_name`
- `birth_year_month`
- `residential_region`
- credential proof input

Submit behavior:

- calls `POST /registration`.
- uses `credentials: 'same-origin'`.
- sends credential proof only as `Authorization: Bearer <proof>`.
- sends a JSON body with exactly `display_name`, `birth_year_month`, and `residential_region`.
- does not put `credential_proof`, token, session, cookie, poll, option, vote, or eligibility fields in the JSON body.
- relies on normal browser same-origin `Origin` behavior for the backend origin gate.

---

## 2. Success and Failure Behavior

On `201`, the UI:

- shows neutral success copy.
- clears the credential proof field.
- displays a link to existing `/login`.
- does not treat the user as logged in.
- does not call `GET /users/me`.
- does not call `POST /login/session`.
- does not read or expect `Set-Cookie`.
- does not display `user_id`, `birth_year_month`, `residential_region`, credential proof, session data, token data, trust/role, poll data, option data, vote data, or eligibility traces.

On failure, the UI:

- clears credential proof.
- keeps copy neutral and non-technical.
- does not expose backend `error`, backend `message`, credential details, profile details, session/cookie details, response JSON, stack traces, request IDs, trace IDs, or verifier internals.

---

## 3. Boundaries Preserved

Phase 92 does not add:

- registration backend behavior changes.
- login session issuance after registration.
- frontend auto-login.
- `GET /users/me` calls after registration success.
- exposure of `birth_year_month` or `residential_region` through `/users/me`.
- gender, exact birthday, address, precise location, or extra profile fields.
- schema or migration changes.
- demographic breakdown, ranking personalization, analytics linkage, or precise location.
- Reference Answer connection to `UserAuthResolver` or profile eligibility.
- option choice + user/session/device/request/log/trace/metric/error payload linkage.

Unchanged:

- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- `creator_session` remains separate local/demo/test creator flow only.
- Raw Option Linkage Ban remains preserved.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

---

## 4. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` remains excluded from git and delivery scope.
