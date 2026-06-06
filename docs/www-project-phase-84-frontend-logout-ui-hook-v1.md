# WWW Project Phase 84 — Frontend Logout UI Hook v1

**Status:** minimal frontend logout hook. When Phase 83 login-state read shows an authenticated `display_name`, a small logout control calls existing `DELETE /login/session` with `credentials: 'same-origin'` (browser `Origin` for CSRF-compatible mutation checks). No backend auth/session behavior change, login form UI, or registration UI.

**Baseline:** `origin/master` @ Phase 83 frontend login state read.

---

## 1. Delivery

| Item | Path |
|------|------|
| Logout hook | `public/frontend/login-state-logout.js` |
| Header mount | `public/frontend/login-state-ui.js` (logout button + chip restore) |
| Chrome wiring | `public/frontend/public-mvp-layout.js` → `mountLoginStateRead` (unchanged entry) |
| Styles | `public/frontend/public-mvp.css` → `.mvp-login-state-logout` |
| Tests | `tests/frontend/login-state-logout.test.ts`, `tests/frontend/phase-84-login-state-logout-copy-guard.test.ts` |

---

## 2. Frontend behavior

- When signed in (Phase 83 read), header shows `display_name` with a small **登出** button beside it.
- Click calls `DELETE /login/session` with `credentials: 'same-origin'`; the browser sends the page `Origin` expected by the backend mutation guard.
- **Success (204):** hide signed-in display; restore guest/demo auth chips per demo nav mode.
- **Failure:** show a neutral message (`目前無法登出，請稍後再試。`); no technical error codes or session details.
- No login form or registration UI added.

---

## 3. Sensitive field exclusion (UI)

Same as Phase 83 — must not show or log:

- `user_id`, session IDs, token digests, cookie values, or `www_session`.
- `birth_year_month`, `residential_region`, profile eligibility, trust, or role fields.
- vote history, poll/option data, counters, shards, or analytics identifiers.

---

## 4. Boundaries preserved

Phase 84 does not change:

- `POST /login/session` or `DELETE /login/session` backend behavior.
- `UserAuthResolver` or `GET /users/me` response shape.
- Official Vote transaction order or `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary or profile eligibility behavior.
- `creator_session` local/demo/test creator flow separation.
- Raw Option Linkage Ban.

---

## 5. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` excluded from git and delivery scope.
