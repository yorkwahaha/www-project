# WWW Project Phase 136 — Public Error Copy Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 135 public error copy consistency polish runtime (`resolvePublicErrorUserMessage` allowlists, neutral fallback copy, and creator-session vs list-failure distinction) across `/explore`, `/vote/:id`, `/results/:id`, `/my-polls?live=1`, `/login`, `/registration`, `/profile`, logout, homepage profile prompt, and creator lifecycle controls.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 135 public error copy consistency polish (`26d8ecf`).

**Prior delivery:** [Phase 135 public error copy consistency polish](./www-project-phase-135-public-error-copy-consistency-polish-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 136 reviews the Phase 135 frontend runtime polish to confirm:

1. `resolvePublicErrorUserMessage` only surfaces frontend-owned allowlist copy or the caller fallback.
2. Foreign `error.message`, backend raw payloads, internal error codes, and stack traces are not shown to users.
3. Public participation, auth/profile, and creator demo/live error surfaces remain neutral and privacy-safe.
4. No API path, request body, credentials policy, auth boundary, vote path, or linkage regression was introduced by the copy polish.

---

## 2. Phase 135 Delivery Under Review

| Area | Phase 135 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | `resolvePublicErrorUserMessage`, `PUBLIC_POLL_LOAD_USER_MESSAGES`, `PUBLIC_VOTE_SUBMIT_USER_MESSAGES` | allowlist-only user copy |
| `explore-page.js` | neutral load / empty copy punctuation | no backend echo |
| `vote-page.js` | load / submit catch allowlists | blocked / submit neutrality |
| `result-page.js` | load catch allowlist; unavailable punctuation | refresh failure unchanged |
| `my-polls-page.js` | list failure vs `CREATOR_SESSION_FAILURE` | no backend detail leak |
| `registration-page.js`, `profile-page.js` | `REGISTRATION_USER_ERROR_MESSAGES`, `PROFILE_USER_ERROR_MESSAGES` | auth/profile boundaries preserved |
| `poll-lifecycle-controls.js` | `LIFECYCLE_USER_ERROR_MESSAGES`, named creator session error | lifecycle neutrality |
| `create-poll-page.js` | `CREATE_POLL_USER_ERROR_MESSAGES` | creator create neutrality |
| `login-page.js`, `login-state-logout.js`, `profile-completion-prompt.js` | unchanged failure constants; still frontend-owned | auth prompt neutrality |

---

## 3. Current Stable Public Error Copy Flow

```text
resolvePublicErrorUserMessage(error, fallback, allowedMessages)
  → if error.message is in allowedMessages: return that frontend-owned string
  → else: return fallback (never foreign error.message)

/explore
  → fetchExploreFeedPage throws EXPLORE_LOAD_FAILURE_MESSAGE on transport/API/unsafe payload
  → empty state uses EXPLORE_FEED_EMPTY_MESSAGE only

/vote/:id
  → load catch: resolvePublicErrorUserMessage + VOTE_PAGE_LOAD_USER_MESSAGES
  → submit catch: resolvePublicErrorUserMessage + VOTE_PAGE_SUBMIT_USER_MESSAGES
  → blocked: messageForPollVotingBlocked only

/results/:id
  → load catch: resolvePublicErrorUserMessage + RESULT_PAGE_LOAD_USER_MESSAGES
  → unavailable shells: resolveUnavailableUserMessage ignores backend user_message
  → refresh deferred: RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE unchanged

/my-polls?live=1
  → sign-in required: MY_POLLS_SIGN_IN_REQUIRED_MESSAGE
  → creator session failure: CREATOR_SESSION_FAILURE via isCreatorSessionFailureError
  → list/load failure: MY_POLLS_LOAD_FAILURE_MESSAGE

/registration, /profile
  → catch: resolvePublicErrorUserMessage + module allowlists
  → registration still no auto-login / Set-Cookie / GET /users/me

/login, logout, homepage profile prompt
  → messageForLoginFailure / LOGIN_LOGOUT_FAILURE_MESSAGE / PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE
  → frontend-owned only

creator lifecycle controls
  → catch: resolvePublicErrorUserMessage + LIFECYCLE_USER_ERROR_MESSAGES
  → messageForLifecycleTransitionFailure maps API codes to frontend copy only
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 136 found **no privacy, auth, result visibility, eligibility, API contract, or linkage gap** in the Phase 135 public error copy runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

### 4.1 `resolvePublicErrorUserMessage` is allowlist-only

- Returns `error.message` only when it is included in the caller `allowedMessages` array.
- Returns `fallbackMessage` for foreign `error.message`, non-`Error` throws, and backend/runtime strings.
- Does not read backend JSON, `errorCode`, stack traces, or API `message` fields directly.

### 4.2 Foreign `error.message` is not shown to users

- Phase 135 catch handlers on vote, result, profile, registration, create-poll, and lifecycle surfaces use `resolvePublicErrorUserMessage` instead of `error instanceof Error ? error.message`.
- Explore feed failures throw frontend-owned constants only.
- Login and registration submit paths continue to map failures through frontend-owned reason/copy helpers.

### 4.3 Backend raw payload, internal codes, and stack traces are not echoed

- `messageForPollLoadFailure`, `messageForResultLoadFailure`, and `messageForLifecycleTransitionFailure` map known API codes to frontend copy; unknown failures fall back to generic frontend strings.
- `parsePollApiError` is used for structured mapping only; mapped output is never raw backend text.
- No user-visible surface renders API `error`, `message`, or stack fields directly after Phase 135.

### 4.4 `/explore` load / empty state remains neutral

- `EXPLORE_LOAD_FAILURE_MESSAGE`, `EXPLORE_LOAD_MORE_FAILURE_MESSAGE`, and `EXPLORE_FEED_EMPTY_MESSAGE` are frontend-owned.
- Unsafe feed payloads fail closed into neutral load failure copy.

### 4.5 `/vote/:id` load / submit / blocked remains neutral

- Load and submit catches use Phase 135 allowlists.
- `messageForPollVotingBlocked` and `messageForVoteSubmitFailure` remain frontend-owned.
- Vote submit still posts `{ option_index }` only; no option_id pre-resolve introduced.

### 4.6 `/results/:id` load / unavailable / refresh failure remains neutral

- Load catch uses `RESULT_PAGE_LOAD_USER_MESSAGES`.
- Unavailable lifecycle shells ignore backend `user_message`.
- `RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE` unchanged and lifecycle-safe.

### 4.7 `/my-polls?live=1` distinguishes list failure from creator session failure

- `MY_POLLS_LOAD_FAILURE_MESSAGE` for owned-list / transport failures.
- `CREATOR_SESSION_FAILURE` for creator session establishment failures via `isCreatorSessionFailureError`.
- `MY_POLLS_SIGN_IN_REQUIRED_MESSAGE` for production sign-in guidance.
- Neither message echoes backend payload details.

### 4.8 `/login`, `/registration`, `/profile`, logout, homepage profile prompt remain frontend-neutral

- Login uses `messageForLoginFailure` reason buckets only.
- Registration catch uses `REGISTRATION_USER_ERROR_MESSAGES`.
- Profile catch uses `PROFILE_USER_ERROR_MESSAGES`.
- Logout failure uses `LOGIN_LOGOUT_FAILURE_MESSAGE`.
- Homepage prompt load failure uses `PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE`.

### 4.9 Creator lifecycle controls remain frontend-neutral

- Lifecycle action catch uses `resolvePublicErrorUserMessage` + `LIFECYCLE_USER_ERROR_MESSAGES`.
- `messageForLifecycleTransitionFailure` does not echo raw backend `message` to users.

### 4.10 No internal identifiers or outcome leakage in error copy

- Reviewed user-visible constants do not expose `user_id`, session id, creator token, vote token, counter shard, vote counts, result previews, voter status, or eligibility status.
- No new eligibility judgment or display was added by Phase 135.

### 4.11 API path, body, and credentials policy unchanged

- Phase 135 touched copy/catch handling only.
- No fetch path, request body shape, or `credentials` policy changes in reviewed surfaces.

### 4.12 Auth and profile boundaries unchanged

- Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`.
- `/users/me` remains `user_id` + `display_name` only in header auth read.
- `/users/me/profile` remains `birth_year_month` + `residential_region` only.
- `creator_session` remains non-production identity; separate from formal voter session.
- `X-User-Id` remains explicit non-production compatibility only elsewhere; Phase 135 did not broaden its use.

### 4.13 Vote and Reference Answer boundaries unchanged

- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- No option index → `option_id` pre-resolve added.
- Reference Answer remains disconnected from UserAuthResolver and profile eligibility.

### 4.14 Raw Option Linkage Ban preserved

- Phase 135 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

### 4.15 No new observability or analytics linkage

- No new logs, metrics, analytics, tracking, APM traces, precise location fields, extra profile fields, demographic breakdown, or ranking personalization introduced by Phase 135 copy polish.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-136-public-error-copy-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-136-public-error-copy-runtime-review-checkpoint-doc.test.ts`

Phase 135 guard tests remain the delivery baseline:

- `tests/frontend/phase-135-public-error-copy-consistency-polish.test.ts`

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

When Docker Desktop remains unavailable locally, `npm run smoke:public:local` may be skipped with the same rationale recorded in prior phase checkpoints; Phase 136 doc/tests do not depend on a successful local smoke run for checkpoint completeness.

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
