# WWW Project Phase 86 - Minimal Production Login Form Runtime v1

**Status:** minimal frontend runtime. Converts `/login` from the Phase 74 disabled shell into a small production credential-proof form that calls existing `POST /login/session`, then refreshes existing Phase 83 `GET /users/me` login state and preserves Phase 84 logout behavior. No backend auth/session behavior, `UserAuthResolver`, `GET /users/me` response shape, migration, schema, Official Vote transaction, `vote-by-index`, vote token, counter, Reference Answer, profile eligibility, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

---

## 1. Runtime Behavior

`GET /login` now includes a minimal production login form:

- one credential-proof field.
- one submit button.
- same local/demo/test identity boundary copy.
- status text in an accessible live region.

Submit behavior:

1. empty credential proof stays client-side and does not call the API.
2. non-empty credential proof calls `POST /login/session`.
3. request uses `credentials: 'same-origin'`.
4. request sends the proof to the existing backend verifier boundary as `Authorization: Bearer <proof>`.
5. frontend does not read, display, store, or log `www_session`.
6. frontend does not parse backend error payloads for user-facing detail.

Successful login:

1. `POST /login/session` returns `201`.
2. browser receives `www_session` through the existing server `Set-Cookie`.
3. frontend immediately calls existing Phase 83 login-state refresh: `GET /users/me` with `credentials: 'same-origin'`.
4. existing header UI displays only `display_name`.
5. existing Phase 84 logout button remains wired through `DELETE /login/session`.

Failure:

- rejected credentials show neutral copy.
- rejected origin shows neutral reload copy.
- network failure shows neutral retry copy.
- backend error codes, session internals, verifier details, and credential details are not shown.

---

## 2. Files

| Area | Path |
|------|------|
| Login page markup | `public/login.html` |
| Login form runtime | `public/frontend/login-page.js` |
| Login form styling | `public/frontend/public-mvp.css` |
| Frontend tests | `tests/frontend/login-page.test.ts`, `tests/frontend/phase-86-login-form-copy-guard.test.ts` |
| Docs guard | `tests/docs/phase-86-minimal-production-login-form-runtime-doc.test.ts` |

---

## 3. Privacy and Sensitive Field Exclusion

The login form must not ask for, display, log, store, or send to analytics:

- `user_id`.
- `birth_year_month`.
- `residential_region`.
- trust or role.
- vote history.
- poll ID, option ID, option text, option index, selected answer payload, vote token, or counter shard.
- session ID.
- `token_sha256`.
- raw `www_session` cookie value.
- cookie value.
- profile eligibility details paired with a selected option.

The credential proof exists only in the input value and the immediate `POST /login/session` request. On success, the form clears the input. No browser durable storage is introduced.

---

## 4. Boundaries Preserved

Phase 86 does not change:

- `POST /login/session` backend behavior.
- `DELETE /login/session` backend behavior.
- `UserAuthResolver`.
- `GET /users/me` response shape.
- database schema or migrations.
- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary.
- profile eligibility behavior.
- `creator_session` local/demo/test creator flow separation.
- Raw Option Linkage Ban.

No demographic breakdown, ranking personalization, analytics linkage, precise location, extra profile field, or option choice + user/session/device/request/log/trace/metric/error payload linkage is added.

---

## 5. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` remains excluded from git and delivery scope.
