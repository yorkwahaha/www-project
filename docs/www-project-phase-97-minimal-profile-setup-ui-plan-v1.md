# WWW Project Phase 97 — Minimal Profile Setup UI Plan v1

**Status:** docs/spec only. Defines the future minimal production profile setup / profile edit UI that will read and write the existing `GET /users/me/profile` and `PUT /users/me/profile` endpoints after formal login. No runtime behavior, frontend implementation, backend API behavior, migration, schema, `POST /registration`, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me` response shape, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer, profile eligibility evaluator, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 96 registration runtime/profile boundary review. Phase 66E implemented `GET`/`PUT /users/me/profile`. Phase 66F delivered MVP demo profile UX with explicit non-production `X-User-Id`. Phase 86–95 established production login/session and registration flows. Phase 97 plans the matching **post-login** profile setup/edit UI only.

---

## 1. Purpose

Phase 97 defines the minimum future production profile UI contract. It does not implement the page, route, or client runtime.

The future UI should:

1. be reachable only after formal user authentication (production `www_session` cookie through existing login flow).
2. redirect or guide unauthenticated visitors to `/login` without implying they are signed in.
3. read existing profile values through `GET /users/me/profile` with `credentials: 'same-origin'`.
4. save profile values through `PUT /users/me/profile` with `credentials: 'same-origin'` as a **full replacement** of the two editable fields.
5. collect and display only `birth_year_month` and coarse `residential_region`.
6. never call `GET /users/me/profile` from shared chrome, header login-state readers, registration pages, or vote/result surfaces.
7. never trigger voting, vote recalculation, historical eligibility backfill, or profile-at-vote snapshots.

Registration may already seed `birth_year_month` and `residential_region` through `POST /registration`. The future profile UI is still required so signed-in users can review, update, or clear eligibility fields without re-registering.

---

## 2. Minimal Form UX

The production profile setup / edit form should be small and explicit:

| Control | Purpose |
|---------|---------|
| `birth_year_month` month input | Month-granular eligibility field (`YYYY-MM`); nullable / clearable |
| `residential_region` select | Coarse region code from an approved allowlist; nullable / clearable |
| primary save button | Single `PUT /users/me/profile` action |
| secondary clear action | Sends both fields as `null` through full replacement |
| unauthenticated state | Neutral copy + link to `/login`; no editable fields |

The form must not ask for or accept:

- `gender` or gender-equivalent fields.
- exact birthday, date of birth, day-level age data, or age-in-days traces.
- address, postal address, street, neighborhood, GPS, latitude/longitude, geocode, or precise location.
- `display_name` editing on this page (display name remains registration/account scope, not profile-route scope).
- `user_id`, `X-User-Id`, `creator_session`, session ID, `token_sha256`, raw `www_session`, or cookie values in form fields or user-visible diagnostics.
- poll ID, option ID, option text, option index, selected answer payload, vote token, shard ID, counter data, or eligibility traces.

Recommended page entry:

- keep or evolve the existing `GET /profile` public page shell, but production runtime must authenticate through session cookie — not MVP `X-User-Id`.
- header chrome may continue to use `GET /users/me` for `display_name` only; it must not use `GET /users/me/profile`.

---

## 3. Authentication and Navigation Boundary

### 3.1 Signed-in access

Future implementation must treat profile setup/edit as a signed-in-only surface:

- on load, rely on existing login-state behavior (`GET /users/me` through shared chrome) only to determine whether the visitor is authenticated.
- if unauthenticated, show a short explanation and a primary link/button to `/login`.
- do not mount the profile form, do not call `GET /users/me/profile`, and do not offer save/clear actions while anonymous.

### 3.2 Production vs local/demo compatibility

| Environment | Profile API auth | Notes |
|-------------|------------------|-------|
| production (`APP_ENV=production`) | `www_session` cookie via `UserAuthResolver` | fail closed without approved verifier/session |
| local/demo/test | explicit non-production `X-User-Id` may remain for existing MVP demo page only | production UI plan must not depend on `X-User-Id` |

`creator_session` must not authorize `GET /users/me/profile` or `PUT /users/me/profile`. Creator identity remains limited to `/creator/*` demo/test flows.

---

## 4. API Contract for Future UI

### 4.1 `GET /users/me/profile`

Use only inside the profile setup/edit UI lifecycle:

- method: `GET`
- path: `/users/me/profile`
- credentials: `same-origin`
- response body contains only:
  - `birth_year_month`: `string | null`
  - `residential_region`: `string | null`

The UI must not surface this response through header chips, auth banners, registration pages, vote pages, result pages, explore feed, or analytics.

`GET /users/me` shape remains unchanged and limited to `user_id` and `display_name`. Profile setup UI must not expect or display profile fields from `GET /users/me`.

### 4.2 `PUT /users/me/profile`

Full replacement semantics:

- method: `PUT`
- path: `/users/me/profile`
- credentials: `same-origin`
- JSON body must include **both** keys on every save/clear:
  - `birth_year_month`
  - `residential_region`
- each value may be `null` to clear the field.

Example save:

```json
{
  "birth_year_month": "1998-07",
  "residential_region": "TW-TPE"
}
```

Example clear:

```json
{
  "birth_year_month": null,
  "residential_region": null
}
```

Forbidden request keys include `gender`, address, GPS, precise location, `display_name`, vote fields, option fields, session fields, token fields, and any unexpected profile extension.

Saving profile data must not:

- call Official Vote endpoints.
- re-evaluate or mutate already-cast votes.
- backfill historical eligibility for past votes.
- create vote-time snapshots or profile-at-vote audit rows.

Eligibility effects apply only on future Official Vote attempts through the existing vote-time evaluator.

---

## 5. Field Copy and Validation

### `birth_year_month`

Recommended user-facing copy:

> **出生年月（僅到月份）**  
> 官方投票會在投票當下依產品規則檢查年齡資格。我們只收集到「年／月」，不會要求生日、日期或年齡天數。可留空或清除。

Validation:

- normalize to `YYYY-MM`
- month `01`–`12`
- empty input maps to `null` in the PUT body

### `residential_region`

Recommended user-facing copy:

> **居住地區（粗粒度代碼）**  
> 官方投票會在投票當下依產品規則檢查地區資格。我們只收集粗粒度地區代碼（例如 `TW-TPE`），不會要求地址、街道或精確位置。可留空或清除。

Validation:

- select from approved allowlist (may reuse existing `PROFILE_REGION_OPTIONS` / registration allowlist)
- empty selection maps to `null` in the PUT body

### Safe error mapping

| Backend outcome | Safe user-facing message |
|-----------------|--------------------------|
| `200` load/save success | `個人資料已儲存。` / neutral loaded state |
| `400` validation | `請確認出生年月與居住地區格式。` |
| `401` unauthenticated | `請先登入後再編輯個人資料。` + link to `/login` |
| network failure | `目前無法載入個人資料，請稍後再試。` / `目前無法儲存個人資料，請稍後再試。` |
| other `5xx` | neutral retry copy only |

Error UI must not echo backend `error` codes, profile values, session identifiers, token digests, cookie values, or vote/option identifiers.

---

## 6. Eligibility and Vote Boundary

Profile setup/edit is account data maintenance only.

Required behavior:

- Official Vote eligibility is evaluated only at vote time by the existing evaluator.
- updating profile fields does not auto-submit a vote.
- updating profile fields does not recalculate or invalidate existing votes.
- updating profile fields does not backfill historical eligibility state.
- vote pages may continue to show generic ineligible copy; they must not reveal which profile field failed or link profile edits to a selected option.

Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility. No Reference Answer surface may call `GET /users/me/profile`.

---

## 7. Privacy, Analytics, and Observability Exclusion

Future profile UI must not display, log, or send to analytics:

- `user_id` in user-visible success/error copy (session-authenticated UI already knows signed-in state through header `display_name` only).
- `birth_year_month` or `residential_region` through `GET /users/me`.
- trust/role, vote history, poll/option data, session IDs, token digests, raw tokens, or cookie values.
- profile eligibility calculations paired with option choice.
- request/trace/device identifiers linked to option choice.

No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records may capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

Raw Option Linkage Ban remains preserved.

---

## 8. Accessibility and Mobile Requirements

Future implementation should follow the registration/login form baseline:

- labeled inputs with `for` / `id` association
- `type="month"` or equivalent accessible month entry for `birth_year_month`
- select-based region picker for mobile readability
- `aria-live="polite"` status region for save/load/clear outcomes
- disabled/busy state on submit while `PUT` is in flight
- keyboard-reachable save and clear actions

---

## 9. Suggested Future Delivery (Not This Phase)

| Item | Path / note |
|------|-------------|
| Page shell | evolve `public/profile.html` or successor route |
| Client runtime | evolve `public/frontend/profile-page.js` to session-auth production mode |
| Tests | future `tests/frontend/profile-page-production.test.ts`, HTTP route guards |
| Docs | implementation phase doc after runtime lands |

This phase delivers planning documentation and docs guard tests only.

---

## 10. Boundaries Preserved

Phase 97 does not change:

- DB schema or migrations.
- `POST /registration` behavior.
- `POST /login/session` or `DELETE /login/session`.
- `UserAuthResolver` behavior.
- `GET /users/me` response shape (`user_id`, `display_name` only).
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior.
- Official Vote transaction order or `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary and profile eligibility exclusion.
- `creator_session` local/demo/test creator-flow separation.
- explicit non-production `X-User-Id` compatibility scope.
- ranking, demographic breakdowns, analytics linkage, precise location, exact birthday, gender, address, or extra profile fields.

---

## 11. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
```

`design-drafts/` remains excluded from git and delivery scope.
