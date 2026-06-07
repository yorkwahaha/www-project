# WWW Project Phase 99 — Profile Setup UI Runtime Review / Hardening v1

**Status:** review, focused guard tests, local smoke coverage, and documentation only. Reviewed `GET /profile`, `public/profile.html`, `public/frontend/profile-page.js`, shared chrome (`public-mvp-layout.js`), login-state read/logout frontend, `GET`/`PUT /users/me/profile` call boundaries, Phase 98 profile UI tests/docs, and `smoke:public:local` static checks. **No runtime, API, or schema behavior changed.**

**Baseline:** Phase 98 minimal profile setup UI runtime. Phase 97 profile setup UI plan. Phase 66E `GET`/`PUT /users/me/profile`.

---

## 1. Review Conclusion

No runtime, API, or schema defect requiring a behavior change was found.

Confirmed boundaries:

### 1.1 Unauthenticated `/profile`

- Shared chrome may call `GET /users/me` through `mountLoginStateRead` for `display_name` only.
- `profile-page.js` calls `readLoginState` (`GET /users/me`, `credentials: 'same-origin'`) before any profile API access.
- When anonymous, the page returns early with `{ status: 'unauthenticated' }`.
- `GET /users/me/profile` is **not** called while unauthenticated.
- `wireProfileForm` is **not** mounted while unauthenticated.
- `#profile-signed-in-panel` stays hidden; `#profile-unauthenticated` shows neutral copy and `/login` guidance.

### 1.2 Signed-in `/profile`

- `GET /users/me/profile` uses `credentials: 'same-origin'`.
- `PUT /users/me/profile` uses `credentials: 'same-origin'`.
- PUT JSON body includes exactly `birth_year_month` and `residential_region`.
- `birth_year_month` normalizes to `YYYY-MM` or `null`.
- `residential_region` must be an approved coarse code or `null`.
- Save success shows neutral copy only; no vote submission, eligibility recalculation, or historical backfill.

### 1.3 Forbidden UI / copy / code paths

Profile setup UI does not collect, display, or imply:

- gender, exact birthday, address, precise location, extra profile fields.
- trust/role, session/token/cookie values, vote/option data, eligibility detail traces.

Profile setup UI does not call:

- `POST /registration`
- `POST /login/session`
- `DELETE /login/session`
- vote APIs
- Reference Answer APIs

### 1.4 Shared chrome boundary

- Header login-state readers use `GET /users/me` for `display_name` only.
- `GET /users/me` shape remains `user_id` and `display_name` only.
- Shared chrome does not call `GET /users/me/profile`.
- Profile field values are not surfaced through header chips, auth banners, or login-state UI.

---

## 2. Hardening Applied

Phase 99 adds focused source guards and `smoke:public:local` static checks for:

- unauthenticated profile-page auth gating before profile API calls.
- same-origin `GET`/`PUT /users/me/profile` with two-field PUT bodies only.
- separation between profile runtime and registration/login/session/vote/reference paths.
- login-state read/logout sources remaining free of profile-field leakage.
- forbidden copy / option-linkage exclusions on profile HTML and JS.

No frontend runtime logic was changed in this phase.

---

## 3. Privacy and Integrity Boundaries

Unchanged:

- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- `creator_session` remains separate local/demo/test creator flow only.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.
- Raw Option Linkage Ban remains preserved.
- No demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields were added.

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

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
