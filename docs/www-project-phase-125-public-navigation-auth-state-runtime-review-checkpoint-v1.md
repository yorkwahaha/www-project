# WWW Project Phase 125 — Public Navigation / Header Auth State Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews shared public navigation chrome and header auth-state runtime in `public-mvp-layout.js`, `login-state-read.js`, `login-state-ui.js`, `auth-state-copy.js`, and adjacent HTML shells, building on Phase 75 auth-state navigation UX, Phase 83 login-state read, Phase 84 logout, Phase 94 registration/login navigation copy, and Phase 124 login/registration runtime boundaries.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `GET /users/me` behavior, `GET /users/me/profile` behavior, `POST /registration` behavior, `POST /login/session` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 75 auth-state navigation UX checkpoint and Phase 83/84 header login-state read/logout runtime.

**Prior checkpoint:** [Phase 124 login/registration runtime review](./www-project-phase-124-login-registration-runtime-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## Reviewed Surfaces

- `public/frontend/public-mvp-layout.js`
- `public/frontend/login-state-read.js`
- `public/frontend/login-state-ui.js`
- `public/frontend/auth-state-copy.js`
- `public/frontend/login-state-logout.js`
- `public/registration.html`
- `public/profile.html` (header chrome + unauthenticated profile boundary reference)
- `tests/frontend/public-mvp-layout.test.ts`
- `tests/frontend/login-state-read.test.ts`
- `tests/frontend/phase-83-login-state-copy-guard.test.ts`
- `tests/frontend/phase-84-login-state-logout-copy-guard.test.ts`

---

## Review Checkpoint Conclusion

Phase 125 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current public navigation and header auth-state runtime remain within approved auth, profile-field, session, and Raw Option Linkage Ban boundaries.

### 1. Guest header shows visitor state

- `renderSiteHeader()` in guest/`data-nav="guest"` mode renders `createAuthStateChip()` with `AUTH_STATE_COPY.guestChipLabel` (`未登入`).
- Guest chip links to `/login` and does not show account name, avatar, or profile fields.
- `applyLoginStateIndicator()` keeps `#mvp-login-state` hidden when `readLoginState()` returns anonymous.

### 2. Guest header shows login / registration CTAs only

- Guest actions append only `/login` and `/registration` buttons via `AUTH_STATE_COPY.guestSecondaryCta` and `guestPrimaryCta`.
- Guest mode does not append signed-in shortcuts (`我的問卷`, signed-in profile shortcut row, or authenticated create CTA cluster).
- Guest header does not render `display_name`, `birth_year_month`, `residential_region`, eligibility outcomes, vote status, or result previews.

### 3. Signed-in header shows `display_name` only

- `mountLoginStateRead()` calls `readLoginState()` then `applyLoginStateIndicator()`.
- Authenticated indicator renders a single `.mvp-login-state-name` span with `state.display_name` and a logout button.
- `parseAuthenticatedMeBody()` consumes only `display_name`; `user_id` from `GET /users/me` is not written into header DOM.

### 4. Header does not expose internal identifiers

- Header auth modules do not render `user_id`, session id, `creator_session` token, vote token, shard id, or other internal identifiers.
- Demo nav `logged-in-mock` uses `AUTH_STATE_COPY.demoIdentityChipLabel` (`MVP 測試身份`) as an explicit non-auth presentation label, not a production identity.

### 5. Auth state reader uses `GET /users/me` only

- `readLoginState()` performs a single `GET /users/me` with `credentials: 'same-origin'`.
- Header auth runtime does not call `GET /users/me/profile`, vote APIs, result APIs, or Reference Answer paths during auth-state read.

### 6. `/users/me` response-shape boundary preserved

- Backend `GET /users/me` remains limited to `user_id` and `display_name`.
- UI auth state consumes `display_name` only via `parseAuthenticatedMeBody()`.
- Extra profile fields, eligibility fields, and vote-personal-state fields are not parsed into header state.

### 7. Auth read failure uses neutral fallback

- `readLoginState()` maps `401`, `403`, non-OK responses, malformed bodies, and network errors to `{ status: 'anonymous' }`.
- Header runtime does not echo backend `error`, `message`, or raw JSON payloads into chip text, indicator text, or aria labels.
- Logout failure uses frontend-owned `LOGIN_LOGOUT_FAILURE_MESSAGE` only.

### 8. `/registration` keeps login-state read disabled

- `registration.html` sets `data-login-state-read="disabled"` on `#site-header`.
- `shouldReadLoginState()` returns false for that attribute and skips `mountLoginStateRead()` on registration.
- Registration shell does not auto-login or refresh signed-in header state.

### 9. `/profile` unauthenticated boundary preserved

- `mountProfilePage()` probes auth via `readLoginState()` first.
- Unauthenticated visitors get login guidance only; profile form wiring is not attached.
- Unauthenticated profile path does not call `GET /users/me/profile`.

### 10. `creator_session` and `X-User-Id` boundaries preserved

- Header auth runtime does not use `creator_session` or creator-session APIs.
- `creator_session` remains local/demo/test creator flow only and is not production identity.
- `X-User-Id` remains explicit non-production compatibility documented in static copy (`auth-state-copy.js`, FAQ, profile/vote demo notes); header auth reader does not set `X-User-Id`.

### 11. No eligibility, vote-personal-state, or result preview in header

- Shared navigation chrome does not display eligibility pass/fail, profile completeness badges, vote status, voter status, counters, percentages, rankings, or result previews in the header.
- Homepage profile-completion prompt (Phase 102) is separate from header auth state and is not mounted in the header.

### 12. No new observability linkage

- Phase 125 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between public navigation/header auth-state flows and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Header auth runtime does not read, store, or display `option_id`, vote tokens, counters, shards, or selected option state.
- Auth-state failure and logout failure states remain option-identity-free with respect to visitor identity.
- Backend error payloads are not echoed into header copy.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- `GET /users/me`, `GET /users/me/profile`, `POST /registration`, and `POST /login/session` behavior unchanged.
- Reference Answer remains disconnected from `UserAuthResolver` and header auth state.

---

## Added Guard Coverage

- `tests/frontend/phase-125-public-navigation-auth-state-runtime-review-checkpoint.test.ts`
  - confirms guest header chip + login/registration CTAs without user data.
  - confirms authenticated header indicator renders `display_name` only.
  - confirms `readLoginState()` uses `GET /users/me` only and neutral anonymous fallback on failures.
  - confirms registration opt-out via `data-login-state-read="disabled"`.
  - confirms profile unauthenticated path skips profile form and `/users/me/profile`.
  - confirms navigation auth runtime avoids vote/option paths, eligibility display, and observability sinks.

- `tests/docs/phase-125-public-navigation-auth-state-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved runtime/API/schema/auth navigation boundaries and Raw Option Linkage Ban.

---

## Validation

Required validation for this phase:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
