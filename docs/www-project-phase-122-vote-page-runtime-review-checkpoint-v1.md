# WWW Project Phase 122 — Vote Page Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews `/vote/:id` empty, unavailable, error, and pre-vote hint runtime in `vote-page.js`, `public-mvp-ui.js`, `official-vote-pre-vote-hints.js`, `login-state-read.js`, and `vote.html`, building on Phase 111/112 vote UX polish and Phase 109 privacy guard coverage.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, `GET /users/me` behavior, `GET /users/me/profile` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 112 vote UX error handling runtime review checkpoint at `docs/www-project-phase-112-vote-ux-error-handling-runtime-review-checkpoint-v1.md`.

**Prior checkpoint:** [Phase 112 vote UX error handling runtime review](./www-project-phase-112-vote-ux-error-handling-runtime-review-checkpoint-v1.md).

**Prior privacy guard:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## Reviewed Surfaces

- `public/frontend/vote-page.js`
- `public/frontend/public-mvp-ui.js`
- `public/frontend/official-vote-pre-vote-hints.js`
- `public/frontend/login-state-read.js`
- `public/frontend/public-mvp-demo.js`
- `public/vote.html`
- `tests/frontend/phase-112-vote-ux-error-handling-runtime-review-checkpoint.test.ts`
- `tests/frontend/phase-106-official-vote-pre-vote-eligibility-ux.test.ts`
- `tests/frontend/phase-109-official-vote-privacy-guard.test.ts`

---

## Review Checkpoint Conclusion

Phase 122 found no runtime gap requiring a frontend, API, schema, auth, creator ownership, lifecycle evaluator, vote-backend, or result-evaluator patch. Current vote-page runtime remains within approved pre-vote UX, error-handling, and Raw Option Linkage Ban boundaries.

### 1. Not signed in — login guidance only

- `mountOfficialVotePreVoteHint()` renders anonymous copy with `/login` link when `readLoginState()` is not authenticated.
- Anonymous path does not call `GET /users/me/profile`.
- Anonymous path does not infer or display eligibility, age outcome, region outcome, trust outcome, or duplicate-vote state.

### 2. Signed in but profile incomplete — `/profile` guidance only

- Authenticated users call `GET /users/me/profile` with `credentials: 'same-origin'`.
- `parsePreVoteProfile()` reads only `birth_year_month` and `residential_region`.
- `isPreVoteProfileIncomplete()` checks only whether either field is `null`.
- Incomplete profile renders neutral copy with `/profile` link; it does not judge or display eligibility outcomes.

### 3. Signed in with complete profile — no eligibility guarantee

- Complete profile renders neutral copy stating vote-time rules apply at submit.
- Copy explicitly says the hint does not guarantee the vote will count (`此提示不代表一定可以完成投票`).
- UI does not say the visitor is eligible or ineligible.

### 4. No early `option_index` → `option_id` resolution

- `renderPollOptions()` renders `option_index` and label only.
- `submitVoteByIndex()` posts `{ option_index }` only; it does not resolve or send `option_id`.
- Vote-page runtime does not call poll-detail option identity APIs for pre-submit resolution.

### 5. `vote-by-index` eligibility before option resolve unchanged

- Official Vote eligibility remains vote-time evaluator authority only.
- Frontend does not branch submit-failure UI on backend eligibility codes.
- `messageForVoteSubmitFailure()` returns one neutral frontend bucket for all API denials.

### 6. Vote page counter-free and voter-state-free surface

- Vote page and success panel do not display vote counts, result previews, percentages, rankings, trends, or voter identity.
- Collecting notice and policy copy state counters are not shown during collection; they are not rendered as live totals.

### 7. Empty / unavailable / load failure states

- Missing poll id and invalid poll id route errors use frontend-owned copy via `showRouteError()`.
- Poll load failures map through `messageForPollLoadFailure()` to frontend-owned neutral messages.
- JSON parse failures use `VOTE_PAGE_LOAD_FAILURE` (`目前無法載入問卷，請稍後再試。`).
- Submit transport failures use `VOTE_SUBMIT_TRANSPORT_FAILURE` (`目前無法送出投票，請稍後再試。`).
- Non-collecting lifecycle states disable submit via `applyVotePageVotingAvailability()` with neutral blocked copy from `messageForPollVotingBlocked()`.

### 8. No backend payload echo

- `submitVoteByIndex()` parses API errors internally and throws frontend-owned `GENERIC_VOTE_SUBMIT_FAILURE` only.
- `parsePollApiError()` is not surfaced directly to user-visible copy on submit failure.
- Poll-load mapping uses bounded frontend messages; it does not echo raw server `message` fields for generic failures.

### 9. Page-local option memory only

- `createVotePageController()` keeps selected option in page-local runtime memory.
- Memory clears after submit (`finally`), on `pagehide`, and on BFCache restore (`pageshow` when `event.persisted === true`).

### 10. Auth and profile API boundaries preserved

- `GET /users/me` remains limited to `user_id` and `display_name`; `login-state-read.js` consumes only `display_name` in UI.
- `GET /users/me/profile` remains limited to `birth_year_month` and `residential_region`.
- Vote page does not add demographic breakdown, analytics linkage, ranking personalization, precise location, or extra profile fields.

### 11. `creator_session` boundary unchanged

- Vote page runtime does not use `creator_session` or creator-session APIs.
- `creator_session` remains local/demo/test creator flow only and is not production identity.

### 12. Reference Answer boundary unchanged

- Vote page does not call Reference Answer paths.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.

### 13. No new observability linkage

- Phase 122 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between an option choice and a user, session, device, request, log, trace, metric, error payload, or analytics record.

- Vote-page selected option state remains page-local runtime memory only.
- Pre-vote UX does not read, store, or log which option a user is preparing to choose.
- Submit failure handling does not echo backend option identity.
- Empty, unavailable, and failure states remain option-identity-free with respect to visitor identity.

---

## Boundaries Preserved

- No backend/API/schema/auth/creator ownership/lifecycle evaluator changes.
- Official Vote transaction order unchanged.
- `vote-by-index` eligibility before option resolve unchanged.
- No client `option_index` → `option_id` resolution.
- Vote token schema remains `user_id + poll_id`.
- Counter schema remains `poll_id + option_id + shard_id`.
- Reference Answer, registration, login-session, explore, results, and profile API boundaries unchanged.

---

## Added Guard Coverage

- `tests/frontend/phase-122-vote-page-runtime-review-checkpoint.test.ts`
  - confirms anonymous pre-vote hint uses `/login` only and does not call profile API.
  - confirms incomplete profile hint links to `/profile` without eligibility outcome copy.
  - confirms complete profile hint does not guarantee eligibility.
  - confirms `submitVoteByIndex()` sends `option_index` only and vote-page avoids early `option_id` resolution.
  - confirms load/unavailable/lifecycle-block and neutral submit-failure copy from reviewed runtime.
  - confirms page-local option clearing and counter-free vote surface.
  - confirms reviewed vote-page sources avoid forbidden internal identifiers, voter-state copy, and observability sinks.

- `tests/docs/phase-122-vote-page-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved runtime/API/schema/auth/vote backend, profile/me boundaries, and Raw Option Linkage Ban.

---

## Validation

Required validation for this phase:

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Optional when Docker Desktop Linux engine is available:

```text
npm run smoke:public:local
```

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
