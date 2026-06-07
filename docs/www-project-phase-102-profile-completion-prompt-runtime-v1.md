# WWW Project Phase 102 — Profile Completion Prompt Runtime v1

**Status:** minimal frontend runtime. Adds `profile-completion-prompt.js` and homepage mounting through `public-mvp-layout.js` so signed-in users with incomplete `birth_year_month` or `residential_region` see a neutral prompt linking to `/profile`. No DB schema, migration, `POST /registration`, `POST /login/session`, `DELETE /login/session`, `UserAuthResolver`, `GET /users/me` response shape, `GET`/`PUT /users/me/profile` backend behavior, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed.

**Baseline:** Phase 101 profile completion prompt plan. Phase 98–99 delivered post-login `/profile` editing through `GET`/`PUT /users/me/profile`.

---

## 1. Runtime Behavior

### 1.1 Mount scope

The prompt mounts on the homepage (`/`) only, after shared chrome login-state read succeeds.

It does **not** mount when:

- the visitor is anonymous.
- `data-login-state-read="disabled"` is set (for example `/registration`).
- the pathname is not `/`.

### 1.2 Authenticated flow

1. shared chrome calls `GET /users/me` for `display_name` only (unchanged).
2. on homepage only, `mountProfileCompletionPrompt` runs after login-state read.
3. if signed in, the module calls `GET /users/me/profile` with `credentials: 'same-origin'`.
4. if `birth_year_month === null` **or** `residential_region === null`, render a neutral note plus a user-initiated `/profile` link.
5. if both fields are non-null, hide/clear the prompt.
6. on profile load failure, show neutral non-technical copy only; no error codes, eligibility traces, session/token/cookie values.

The prompt does not block browsing, auto-redirect, auto-vote, recalculate votes, or backfill historical eligibility.

---

## 2. Copy

User-facing message (Traditional Chinese):

```text
部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。若你尚未填寫，可至個人資料頁補充或更新；這不代表你一定符合或不符合任何投票資格。
```

Call to action:

```text
前往個人資料 → /profile
```

Load failure:

```text
目前無法載入個人資料提示，請稍後再試。
```

Forbidden copy:

- “你符合資格” / “你不符合資格”
- `user_id`, session, token, cookie, vote/option identifiers, eligibility detail

---

## 3. Files

| File | Role |
|------|------|
| `public/frontend/profile-completion-prompt.js` | independent prompt module |
| `public/frontend/public-mvp-layout.js` | homepage hook after `mountLoginStateRead` |
| `public/frontend/public-mvp.css` | neutral prompt styling |

---

## 4. Tests

| Test | Coverage |
|------|----------|
| `tests/frontend/profile-completion-prompt.test.ts` | anonymous skip, signed-in profile fetch, incomplete/complete rendering, neutral failure |
| `tests/frontend/phase-102-profile-completion-prompt-copy-guard.test.ts` | forbidden copy/API guard, registration opt-out |
| `tests/http/frontend-page.test.ts` | serves prompt script asset |
| `tests/docs/phase-102-profile-completion-prompt-runtime-doc.test.ts` | docs/README guard |

---

## 5. Boundaries Preserved

Phase 102 does not change:

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
- Raw Option Linkage Ban.

No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

---

## 6. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` remains excluded from git and delivery scope.
