# WWW Project Phase 112 — Vote UX Error Handling Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews Phase 111 vote UX error handling runtime polish in `vote-page.js`, `public-mvp-ui.js`, `official-vote-pre-vote-hints.js`, and adjacent Phase 111 tests/docs.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, registration/login-session backend, Official Vote backend, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 111 vote UX error handling runtime polish at `docs/www-project-phase-111-vote-ux-error-handling-runtime-polish-v1.md`.

**Prior runtime:** [Phase 111 vote UX error handling runtime polish](./www-project-phase-111-vote-ux-error-handling-runtime-polish-v1.md).

---

## Reviewed Surfaces

- `public/frontend/vote-page.js`
- `public/frontend/public-mvp-ui.js`
- `public/frontend/official-vote-pre-vote-hints.js`
- `public/frontend/public-mvp-demo.js`
- `public/vote.html`
- `tests/frontend/phase-111-vote-ux-error-handling-runtime-polish.test.ts`
- `tests/docs/phase-111-vote-ux-error-handling-runtime-polish-doc.test.ts`

---

## Review Checkpoint Conclusion

Phase 112 found no runtime gap requiring a frontend, API, schema, auth, or vote-backend patch. Phase 111 runtime remains within the approved Phase 110 plan and Phase 109 privacy guard boundaries.

### 1. Vote success copy

- Success panel and status region use generic copy only: `投票已送出，感謝參與。` / `投票已送出。`
- Success UI does not display `option_id`, option label tied to vote internals, vote token, counter, shard, session, cookie, or user identifiers.

### 2. API submit failure — single neutral denial bucket

- `messageForVoteSubmitFailure()` always returns `GENERIC_VOTE_SUBMIT_FAILURE`.
- Duplicate vote, eligibility failure, trust failure, age failure, region failure, and invalid option responses all map to the same neutral bucket.
- `submitVoteByIndex()` parses the API error for internal handling only and does not surface backend `error` codes or `message` fields to the user.

### 3. No submit-failure branching in UI

- User-visible submit failure copy does not branch on backend error codes.
- UI copy does not say the visitor is eligible or ineligible.
- UI copy does not expose age thresholds, region conditions, trust rules, role rules, duplicate-vote specifics, or option validity outcomes.

### 4. Transport / server error isolation

- Network/transport failures use `VOTE_SUBMIT_TRANSPORT_FAILURE` (`目前無法送出投票，請稍後再試。`).
- Poll load JSON failures use `VOTE_PAGE_LOAD_FAILURE` (`目前無法載入問卷，請稍後再試。`).
- Raw server payloads are not echoed into user-visible copy.

### 5. Poll lifecycle block

- `isPollAcceptingVotes()` allows submit only when `public_lifecycle_state === 'collecting'` (legacy `status === 'active'` fallback when lifecycle is absent).
- Non-collecting polls disable submit via `applyVotePageVotingAvailability()` and show neutral blocked copy from `messageForPollVotingBlocked()`.
- Poll content remains readable; lifecycle block does not imply option validity.

### 6. Missing selection — client-side only

- `MISSING_SELECTION_MESSAGE` (`請先選擇一個選項。`) is thrown before any vote API call when `optionIndex` is absent or invalid.
- No `POST /polls/:id/vote-by-index` request is sent for missing selection.

### 7. Page-local selected option state clearing

- `createVotePageController()` keeps selected option in page-local runtime memory only.
- `clearRuntimeMemory()` runs after submit (`finally`), on `pagehide`, and on BFCache restore (`pageshow` when `event.persisted === true`).
- No durable option choice linkage is introduced.

### 8. Pre-vote hints boundary (unchanged)

- `official-vote-pre-vote-hints.js` still handles anonymous `/login` guidance without profile reads.
- Signed-in users call `GET /users/me/profile` with `credentials: 'same-origin'` and check only whether `birth_year_month` or `residential_region` is `null`.
- Pre-vote hints are not submit-failure explainers and do not act as eligibility checkers.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.

### 9. Test fixture / copy guard boundaries

- Phase 111 and Phase 112 guard tests avoid fixtures encoding `option_id`, vote token, counter, shard, raw denial reason, or profile eligibility detail.
- Forbidden outcome and internal-identifier copy patterns are checked in reviewed frontend sources.
- Eligibility failure copy remains option-identity-free.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between an option choice and a user, session, device, request, log, trace, metric, error payload, or analytics record.

- Vote-page selected option state remains page-local runtime memory only.
- Submit failure handling does not echo backend option identity.
- Pre-vote UX does not read, store, or log which option a user is preparing to choose.
- No new logs, metrics, analytics, debug payloads, or error payloads were added in this checkpoint phase.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator changes.
- Official Vote transaction order unchanged.
- `vote-by-index` eligibility before option resolve unchanged.
- No client `option_index` → `option_id` resolution.
- Vote token schema remains `user_id + poll_id`.
- Counter schema remains `poll_id + option_id + shard_id`.
- Reference Answer, registration, login-session, and profile API boundaries unchanged.

---

## Added Guard Coverage

- `tests/frontend/phase-112-vote-ux-error-handling-runtime-review-checkpoint.test.ts`
  - confirms generic success copy and absence of vote/option internals in success paths.
  - confirms single neutral submit-denial bucket across representative API failure scenarios.
  - confirms transport failures use transport-neutral copy without echoing server payloads.
  - confirms lifecycle block disables submit with neutral blocked messages only.
  - confirms missing-selection validation is client-side only.
  - confirms page-local option clearing after submit, `pagehide`, and BFCache restore.
  - confirms pre-vote hints remain login/profile-completion guidance only.
  - confirms reviewed copy and test fixtures avoid forbidden internal identifiers and eligibility outcome leakage.

- `tests/docs/phase-112-vote-ux-error-handling-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved runtime/API/schema/auth/vote backend and Raw Option Linkage Ban boundaries.

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
