# WWW Project Phase 98 — Minimal Profile Setup UI Runtime v1

**Status:** minimal frontend runtime. Adds a post-login profile setup/edit UI on `GET /profile` and `profile-page.js` that reads and writes existing `GET`/`PUT /users/me/profile` for `birth_year_month` and coarse `residential_region` only. No DB schema, migration, `POST /registration`, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me` response shape, `GET`/`PUT /users/me/profile` backend behavior, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed.

**Baseline:** Phase 97 minimal profile setup UI plan. Phase 66E implemented `GET`/`PUT /users/me/profile`. Phase 86–95 established production login/session and registration flows.

---

## 1. Runtime Behavior

### 1.1 Unauthenticated visitors

On load, the page uses existing `readLoginState` (`GET /users/me` through shared chrome) only to determine whether the visitor is signed in.

If unauthenticated:

- shows neutral copy and a primary link to `/login`.
- does **not** mount the editable profile form.
- does **not** call `GET /users/me/profile`.
- does **not** offer save/clear actions.

### 1.2 Signed-in users

If authenticated:

- calls `GET /users/me/profile` with `credentials: 'same-origin'`.
- displays only `birth_year_month` (`type="month"`, `YYYY-MM`) and coarse `residential_region` select.
- saves through `PUT /users/me/profile` with `credentials: 'same-origin'`.
- sends a JSON body with exactly `birth_year_month` and `residential_region` on every save/clear.
- each value may be `null` for full replacement clear.

Success shows neutral copy only (`個人資料已儲存。`). The UI does not auto-submit votes, recalculate eligibility, or call vote APIs.

---

## 2. Fields and Copy

Collected/displayed:

| Field | UI control | Notes |
|-------|------------|-------|
| `birth_year_month` | month input | `YYYY-MM`; nullable / clearable |
| `residential_region` | select allowlist | coarse region code; nullable / clearable |

Not collected, displayed, or sent:

- `gender`, exact birthday, address, precise location, extra profile fields.
- `display_name` editing on this page.
- trust/role, session/token/cookie values, vote/option data.
- `user_id` in user-visible diagnostics.

Safe failure mapping:

| Outcome | User-facing copy |
|---------|------------------|
| load/save success | `個人資料已儲存。` / neutral loaded state |
| `400` validation | `請確認出生年月與居住地區格式。` |
| `401` unauthenticated | `請先登入後再編輯個人資料。` |
| network / other failure | neutral retry copy only |

Error UI does not echo backend `error` codes, profile values, session identifiers, token digests, cookie values, or vote/option identifiers.

---

## 3. Shared Chrome Boundary

- Header chrome continues to use `GET /users/me` for `display_name` only.
- `GET /users/me` shape remains `user_id` and `display_name` only.
- Profile setup UI must not expect or display profile fields from `GET /users/me`.
- Shared chrome must not call `GET /users/me/profile`.

---

## 4. Boundaries Preserved

Phase 98 does not change:

- DB schema or migrations.
- `POST /registration` behavior.
- `POST /login/session` or `DELETE /login/session`.
- `UserAuthResolver` behavior.
- `GET /users/me` response shape.
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior.
- Official Vote transaction order or `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary and profile eligibility exclusion.
- `creator_session` local/demo/test creator-flow separation.
- explicit non-production `X-User-Id` compatibility scope for other MVP demo surfaces (vote page).
- ranking, demographic breakdowns, analytics linkage, precise location, exact birthday, gender, address, or extra profile fields.

No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

Raw Option Linkage Ban remains preserved.

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
