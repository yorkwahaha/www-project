# WWW Project Phase 127 — Homepage Profile Prompt Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews homepage profile completion prompt runtime in `profile-completion-prompt.js`, homepage hook in `public-mvp-layout.js`, and adjacent login-state readers, building on Phase 102 profile completion prompt runtime, Phase 103 profile completion prompt runtime review, Phase 104 milestone checkpoint, and Phase 126 logout/session-clear boundaries.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `GET /users/me` behavior, `GET /users/me/profile` behavior, `PUT /users/me/profile` behavior, `POST /registration` behavior, `POST /login/session` behavior, `DELETE /login/session` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 102 profile completion prompt runtime and Phase 103/104 profile completion prompt review coverage.

**Prior checkpoint:** [Phase 126 logout/session clear runtime review](./www-project-phase-126-logout-session-clear-runtime-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## Reviewed Surfaces

- `public/frontend/profile-completion-prompt.js`
- `public/frontend/public-mvp-layout.js`
- `public/frontend/login-state-read.js`
- `public/frontend/login-state-ui.js`
- `public/registration.html`
- `tests/frontend/profile-completion-prompt.test.ts`
- `tests/frontend/phase-103-profile-completion-prompt-runtime-guard.test.ts`
- `tests/frontend/phase-102-profile-completion-prompt-copy-guard.test.ts`

---

## Review Checkpoint Conclusion

Phase 127 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current homepage profile completion prompt runtime remains within approved profile-field, auth, completeness, and Raw Option Linkage Ban boundaries.

### 1. Homepage-only mount

- `public-mvp-layout.js` calls `mountProfileCompletionPrompt()` only when `shouldReadLoginState(header)` is true and `pathname === '/' || pathname === ''`.
- Other routes load shared chrome but skip the homepage prompt hook.
- Prompt DOM mounts under `#main-content` on the homepage only.

### 2. Anonymous visitors — no profile API reads

- `mountProfileCompletionPrompt()` returns `{ status: 'anonymous' }` when `loginState.status !== LOGIN_STATE_AUTHENTICATED`.
- Anonymous path clears any existing prompt mount and does not call `GET /users/me/profile`.
- Anonymous visitors do not see profile completeness or eligibility status from the prompt.

### 3. Signed-in homepage flow — approved auth/profile reads only

- Shared chrome calls `mountLoginStateRead()` → `GET /users/me` for header `display_name`.
- Homepage prompt then calls `loadProfileForPrompt()` → `GET /users/me/profile` with `credentials: 'same-origin'` and `cache: 'no-store'`.
- Prompt runtime does not call vote APIs, result APIs, Reference Answer APIs, registration APIs, or login-session mutation APIs.

### 4. `GET /users/me` boundary preserved

- Backend `GET /users/me` remains limited to `user_id` and `display_name`.
- Header/login-state UI consumes `display_name` only via `parseAuthenticatedMeBody()`.
- Profile prompt module does not call `GET /users/me` directly.

### 5. `GET /users/me/profile` boundary preserved

- `parseProfileForPrompt()` consumes only `birth_year_month` and `residential_region`.
- Extra profile fields, eligibility fields, and vote-personal-state fields are ignored for prompt logic.

### 6. Completeness is null-check only

- `isProfileIncomplete()` returns true only when `birth_year_month === null` or `residential_region === null`.
- Completeness does not evaluate `can_vote`, `age_passed`, `region_passed`, `trust_passed`, or any eligibility outcome.
- Complete profiles clear the prompt mount without showing eligibility pass/fail.

### 7. Prompt copy does not guarantee voting

- `PROFILE_COMPLETION_PROMPT_MESSAGE` explains that some formal votes may check birth year/month and coarse residential region at vote time.
- Copy explicitly states `不代表你一定符合或不符合任何投票資格` and does not mean the visitor is eligible or ineligible.
- Prompt does not say the visitor can vote, has voted, or will pass eligibility.

### 8. Prompt routes only to `/profile`

- CTA uses `PROFILE_COMPLETION_PROMPT_CTA_HREF = '/profile'`.
- Prompt does not auto-redirect, auto-submit, or open alternate profile collection flows.
- Prompt does not call `PUT /users/me/profile`.

### 9. Load failures use frontend-owned neutral fallback

- `loadProfileForPrompt()` throws `PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE` for transport, HTTP, JSON, and parse failures.
- `mountProfileCompletionPrompt()` renders neutral load-failure copy via `showLoadFailure: true`.
- Prompt runtime does not echo backend `error`, `message`, or raw payload text.

### 10. Registration and login-session boundaries preserved

- `/registration` keeps `data-login-state-read="disabled"`; shared chrome does not mount login-state read or homepage prompt on registration.
- `POST /login/session` remains the formal session-establishment boundary; prompt does not create sessions.
- Registration does not auto-login.

### 11. `creator_session` boundary preserved

- Profile prompt runtime does not use `creator_session` or creator-session APIs.
- `creator_session` remains local/demo/test creator flow only and is not production identity.

### 12. No option choice read/store/display

- Prompt runtime does not read, store, or display `option_id`, `option_index`, selected option text, vote tokens, counters, or shards.
- Prompt does not link profile completeness to any poll option or vote intent.

### 13. No new observability linkage

- Phase 127 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between homepage profile prompt flows and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Profile prompt runtime does not reconstruct which option a user selected.
- Failure and completeness states remain option-identity-free with respect to visitor identity.
- Backend error payloads are not echoed into prompt copy.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- `GET /users/me`, `GET /users/me/profile`, `POST /registration`, `POST /login/session`, and `DELETE /login/session` behavior unchanged.
- Reference Answer remains disconnected from profile prompt runtime.

---

## Added Guard Coverage

- `tests/frontend/phase-127-homepage-profile-prompt-runtime-review-checkpoint.test.ts`
  - confirms homepage-only mount behind `shouldReadLoginState` and `/` pathname guard.
  - confirms anonymous path skips `GET /users/me/profile` and completeness display.
  - confirms signed-in prompt reads `GET /users/me/profile` with null-only completeness checks.
  - confirms neutral load-failure copy without backend payload echo.
  - confirms CTA routes only to `/profile` and prompt avoids vote/option/eligibility/analytics paths.

- `tests/docs/phase-127-homepage-profile-prompt-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved runtime/API/schema/auth profile-prompt boundaries and Raw Option Linkage Ban.

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
