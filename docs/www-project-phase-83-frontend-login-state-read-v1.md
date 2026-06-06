# WWW Project Phase 83 — Frontend Login State Read / Minimal UI Hook v1

**Status:** minimal frontend read hook and header display. Calls existing `GET /users/me` with `credentials: 'same-origin'` and shows `display_name` when authenticated. No backend auth/session behavior change, login form UI, registration UI, logout button, or profile update UI change.

**Baseline:** `origin/master` @ Phase 82 `GET /users/me` foundation.

---

## 1. Delivery

| Item | Path |
|------|------|
| Read hook | `public/frontend/login-state-read.js` |
| Header mount | `public/frontend/login-state-ui.js` |
| Chrome wiring | `public/frontend/public-mvp-layout.js` → `mountLoginStateRead` |
| Styles | `public/frontend/public-mvp.css` → `.mvp-login-state--signed-in` |
| Tests | `tests/frontend/login-state-read.test.ts`, `tests/frontend/phase-83-login-state-copy-guard.test.ts` |

---

## 2. Frontend behavior

- On site chrome mount, frontend calls `GET /users/me` with `credentials: 'same-origin'`.
- **Authenticated:** header shows `display_name` only; guest/demo auth chips hide when a real session is present.
- **Anonymous / error:** indicator stays hidden (quiet); existing guest/demo chips remain.
- No login form, registration UI, or logout control added.

---

## 3. Sensitive field exclusion (UI)

The login-state display must not show:

- `user_id`, session IDs, token digests, cookie values, or `www_session`.
- `birth_year_month`, `residential_region`, profile eligibility, trust, or role fields.
- vote history, poll/option data, counters, shards, or analytics identifiers.

---

## 4. Boundaries preserved

Phase 83 does not change:

- `POST /login/session` or `DELETE /login/session` behavior.
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
