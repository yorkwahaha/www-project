# WWW Project Phase 91 — Minimal Registration UI Plan v1

**Status:** docs/spec only. Defines the future minimal production registration form UI that will call existing `POST /registration`. No runtime behavior, frontend implementation, backend API behavior, migration, schema, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me` response shape, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer, profile eligibility runtime, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 89 added verifier-backed `POST /registration`. Phase 90 reviewed and hardened the registration runtime. Phase 86 established the minimal production login form pattern for `Authorization: Bearer <proof>` transport. Phase 91 plans the matching registration UI only.

---

## 1. Purpose

Phase 91 defines the minimum future production registration UI contract. It does not implement the form, route, or client runtime.

The future UI should:

1. offer a clear production account-registration entry, likely from `GET /registration` or a linked surface from `/login`.
2. collect only `display_name`, `birth_year_month`, coarse `residential_region`, and the approved credential proof.
3. call existing `POST /registration` with `credentials: 'same-origin'` and `Authorization: Bearer <proof>`.
4. treat registration success as **not logged in**.
5. direct the user to the existing `/login` flow for session issuance through `POST /login/session`.
6. never imply, display, or store a session cookie from registration success.

---

## 2. Minimal Form UX

The production registration form should be small and explicit:

| Control | Purpose |
|---------|---------|
| `display_name` text field | Public account display name only |
| `birth_year_month` month input | Month-granular eligibility field (`YYYY-MM`) |
| `residential_region` select | Coarse region code from an approved allowlist |
| credential proof field | Approved production credential proof compatible with existing verifier transport |
| primary submit button | Single registration action |
| secondary link | Quiet link to existing `/login` for users who already registered |

The form must not ask for or accept:

- `gender` or gender-equivalent fields.
- exact birthday, date of birth, day-level age data, or age-in-days traces.
- address, postal address, street, neighborhood, GPS, latitude/longitude, geocode, or precise location.
- `user_id`, `X-User-Id`, `creator_session`, session ID, `token_sha256`, raw `www_session`, or cookie values.
- poll ID, option ID, option text, option index, selected answer payload, vote token, shard ID, counter data, or eligibility traces.
- credential proof inside the JSON body (`credential_proof` and equivalents remain forbidden).

Credential proof transport must follow the existing backend boundary:

- JSON body accepts exactly `display_name`, `birth_year_month`, and `residential_region`.
- credential proof is transported through `Authorization: Bearer <proof>`.
- credential proof is not accepted from the JSON body.

---

## 3. Why `birth_year_month` and `residential_region` Are Required

Future UI must explain the requirement in plain language before submit. Copy should be short, non-legalistic, and eligibility-focused only.

### `birth_year_month`

Recommended user-facing copy:

> **出生年月（僅到月份）**  
> 官方投票會依產品規則檢查年齡資格。我們只收集到「年／月」，不會要求生日、日期或年齡天數。

Supporting notes for implementers:

- explain month granularity, not exact birthday collection.
- do not promise vote outcomes or expose eligibility calculations in the form.
- do not show stored profile values from other users or from `GET /users/me`.

### `residential_region`

Recommended user-facing copy:

> **居住地區（粗粒度代碼）**  
> 官方投票會依產品規則檢查地區資格。我們只收集粗粒度地區代碼（例如 `TW-TPE`），不會要求地址、街道或精確位置。

Supporting notes for implementers:

- use a select control with an approved allowlist, not free text.
- initial allowlist may reuse the existing profile-page coarse region options already used in MVP demo flows.
- region labels may be human-readable in the UI, but submitted values must remain the approved code format expected by `POST /registration`.

---

## 4. Client-Side Validation and Safe Error Messages

Future implementation should validate locally before calling the API so users get immediate, neutral guidance without exposing backend codes or submitted sensitive values.

### Client-side validation rules

| Field | Rule | Safe user-facing message |
|-------|------|--------------------------|
| `display_name` | required after trim; max 80 chars; no control characters | `請輸入顯示名稱。` |
| `birth_year_month` | required; normalized `YYYY-MM`; month `01`–`12` | `請以 YYYY-MM 格式輸入出生年月。` |
| `residential_region` | required; must match approved allowlist / backend coarse code pattern | `請選擇居住地區。` |
| credential proof | required non-empty before submit | `請輸入註冊憑證。` |

Client-side validation must not echo invalid values back in a way that could be copied into logs or analytics. Field-level hints are allowed; full submitted payloads are not.

### API failure mapping

The UI must not parse backend `error` codes for user-facing detail. Map HTTP outcomes to neutral copy only:

| Backend outcome | Safe user-facing message |
|-----------------|--------------------------|
| `201` success | `註冊成功。請前往登入頁完成登入；註冊不會自動登入。` |
| `400` / `REGISTRATION_VALIDATION` | `請確認顯示名稱、出生年月與居住地區格式。` |
| `401` / `REGISTRATION_AUTH_REQUIRED` | `註冊憑證無法通過驗證，請確認後再試。` |
| `403` / `REGISTRATION_ORIGIN_REJECTED` | `無法從目前頁面完成註冊，請重新整理後再試。` |
| `409` / `REGISTRATION_CONFLICT` | `此憑證已完成註冊，請直接前往登入。` |
| `404` route unavailable | `目前尚未開放註冊，請稍後再試。` |
| network failure | `網路連線失敗，請稍後再試。` |
| other `5xx` | `目前無法完成註冊，請稍後再試。` |

Error UI must not reveal whether a specific field failed server-side parsing, whether a credential mapped to an inactive user, or whether a session already exists.

---

## 5. Loading, Success, and Failure Behavior

### Loading

- disable all fields and the submit button.
- show neutral progress copy such as `註冊中…`.
- announce progress through an accessible live region.
- do not show credential proof, request IDs, backend codes, or response bodies.

### Success

Registration success does **not** mean logged in.

On `201` with `{ "registered": true, "login_required": true }`:

1. clear the credential proof field immediately.
2. do not call `GET /users/me` as proof of registration success.
3. do not call `POST /login/session`.
4. do not read, expect, or display `Set-Cookie`.
5. show a success panel with:
   - confirmation that registration completed.
   - explicit statement that the user is **not** signed in yet.
   - primary CTA link/button to existing `/login`.
6. optional quiet secondary link back to the public home page.

Recommended success copy:

> **註冊完成**  
> 你的帳號資料已建立。請前往登入頁使用相同憑證完成登入；註冊不會自動建立瀏覽器工作階段。

The success state must not display `user_id`, stored `birth_year_month`, stored `residential_region`, session metadata, or credential proof.

### Failure

- keep the form visible except for conflict cases where a login CTA is clearer.
- retain non-sensitive field values only when safe (`display_name`, selected region code, month input) if product policy allows; always clear credential proof on failure.
- show one neutral error message in the live region and, when helpful, adjacent field-level hints derived only from client-side validation.
- never surface backend `message`, `error`, stack traces, verifier internals, or response JSON in the UI.

---

## 6. Success Flow and Login Separation

The required browser sequence after registration remains:

```text
POST /registration
→ 201 { registered: true, login_required: true }
→ user follows existing /login UI
→ POST /login/session with the same approved credential proof
→ browser receives HttpOnly Secure SameSite=Lax www_session
→ GET /users/me
→ header displays display_name only
```

Phase 91 UI planning rules:

- registration UI must not auto-submit login after registration success.
- registration UI must not show “you are signed in” on registration success.
- registration UI must not refresh Phase 83 login-state chrome as if authenticated.
- registration UI must not wire Phase 84 logout on registration success.
- session issuance stays entirely inside the existing login flow.

---

## 7. Submit Behavior

Future implementation should:

1. prevent double-submit while a request is in flight.
2. call `POST /registration` with `credentials: 'same-origin'`.
3. send JSON body with exactly the three approved profile keys.
4. send credential proof only through `Authorization: Bearer <proof>`.
5. rely on the browser to provide the request `Origin` for the existing allowed-origin gate.
6. never read, display, copy, store, or log `www_session` because registration does not issue it.
7. treat non-`201` responses as failure without exposing verifier details.

The UI must not store credentials, profile drafts, selected options, user identity, or session state in `localStorage`, `sessionStorage`, IndexedDB, URL parameters, readable cookies, hidden caches, service-worker caches, analytics queues, or history state.

---

## 8. CSRF and Origin Expectations

Existing backend behavior requires registration mutations to pass exact `Origin` validation, matching the login session mutation policy.

Future UI must:

- be served from an allowed origin configured for registration mutations.
- use same-origin requests for `POST /registration`.
- use `credentials: 'same-origin'`.
- fail closed when the backend rejects the origin.
- not proxy registration through another origin or embed credential proof in query strings.

---

## 9. Production vs Local/Demo/Test Separation

| Environment | Registration UI behavior | Identity boundary |
|-------------|--------------------------|-------------------|
| Production | Uses approved credential verifier and existing `POST /registration` | Verifier-resolved `user_id` only |
| Local/demo | May continue explicit MVP `X-User-Id` demo flows without presenting them as production registration | Non-production only |
| Test | May inject verifier fixtures or explicit test credentials | Test configuration only |

Production registration UI must not:

- ask users to type `X-User-Id`.
- use `creator_session` as public registration identity.
- present local/demo identity chips as real account registration.
- imply that MVP demo profile editing replaces production registration.

---

## 10. `creator_session` Separation

`creator_session` remains local/demo/test creator flow only.

Future production registration UI must not:

- read or write `creator_session`.
- clear `creator_session` on registration success.
- use `creator_session` to satisfy registration or `GET /users/me`.
- show creator-session details in registration state.

---

## 11. Accessibility and Mobile Requirements

Future implementation should satisfy:

- keyboard-operable fields, select, submit button, success CTA, and error region.
- visible focus states on all interactive controls.
- programmatic labels for every field and the credential proof input.
- `autocomplete` only when appropriate; do not use address-level autocomplete on region select.
- required-field and error announcements through an accessible live region.
- error copy not dependent on color alone.
- single-column layout usable on narrow mobile screens without horizontal scrolling.
- touch targets large enough for mobile use.
- month input and region select usable on mobile browsers without hidden precision-location prompts.

Security and eligibility explanations should stay concise so the form remains usable on small screens.

---

## 12. Privacy Rules for UI, Errors, Logs, Analytics, and Copy Guards

### UI and errors

The registration UI and its messages must not display, log, or send to analytics:

- `user_id`.
- raw or stored `birth_year_month` returned from the server after success.
- raw or stored `residential_region` returned from the server after success.
- trust or role.
- vote history.
- poll ID, option ID, option text, option index, selected answer payload, vote token, or counter shard.
- session ID, `token_sha256`, raw session token, or cookie value.
- credential proof after submit clears the field.
- profile eligibility calculations paired with a selected option.
- request ID, trace ID, device ID, or analytics ID linked to selected options.

`GET /users/me` must not be used to prefill or confirm registration fields because it exposes only `user_id` and `display_name`, and must not expose `birth_year_month` or `residential_region`.

### Logs and observability

No registration UI instrumentation may record submitted profile values, credential proof, session internals, option data, or traceable option-choice linkage.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.

### Future copy guards

A future implementation phase should add focused frontend copy-guard tests consistent with existing login and login-state patterns. Guards should forbid sensitive field names and storage APIs in registration UI source files while allowing neutral user-facing words such as `登入` or `註冊`.

---

## 13. Planned Future Implementation Files

These paths are planning targets only. Phase 91 does not add them.

| Area | Path |
|------|------|
| Registration page markup | `public/registration.html` or extended `/login` surface |
| Registration form runtime | `public/frontend/registration-page.js` |
| Registration form styling | `public/frontend/public-mvp.css` |
| Frontend tests | `tests/frontend/registration-page.test.ts`, `tests/frontend/phase-9x-registration-form-copy-guard.test.ts` |
| Docs guard | `tests/docs/phase-9x-minimal-registration-form-runtime-doc.test.ts` |

---

## 14. Boundaries Preserved

Phase 91 does not change:

- `POST /registration` behavior.
- `POST /login/session` behavior.
- `DELETE /login/session` behavior.
- `UserAuthResolver`.
- `GET /users/me` response shape.
- exposure of `birth_year_month` or `residential_region` through `GET /users/me`.
- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary.
- Reference Answer profile eligibility exclusion.
- profile eligibility runtime behavior.
- `creator_session` local/demo/test creator flow separation.
- Raw Option Linkage Ban.

No demographic breakdown, ranking personalization, analytics linkage, precise location, extra profile field, session issuance after registration, or option choice + user/session/device/request/log/trace/metric/error payload linkage is authorized.

---

## 15. Validation for This Docs Phase

```text
git diff --check
npm run typecheck
npm test
npm run build
```

`design-drafts/` remains excluded from git and delivery scope.
