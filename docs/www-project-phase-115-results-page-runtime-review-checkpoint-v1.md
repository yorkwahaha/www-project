# WWW Project Phase 115 — Results Page Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews Phase 114 results-page empty/unavailable-state runtime polish in `result-page.js` and adjacent Phase 114 tests/docs.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, registration/login-session backend, Official Vote backend, vote evaluator, result evaluator, Official Vote transaction order, `GET /polls/:id/results` behavior, collecting/cancelled/unpublished counter-free boundaries, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 114 results page empty/unavailable state runtime polish at `docs/www-project-phase-114-results-page-empty-unavailable-state-runtime-polish-v1.md`.

**Prior runtime:** [Phase 114 results page empty/unavailable state runtime polish](./www-project-phase-114-results-page-empty-unavailable-state-runtime-polish-v1.md).

**Prior plan:** [Phase 113 results page empty/unavailable state UX plan](./www-project-phase-113-results-page-empty-unavailable-state-ux-plan-v1.md).

---

## Reviewed Surfaces

- `public/frontend/result-page.js`
- `public/results.html`
- `tests/frontend/result-page.test.ts`
- `tests/frontend/phase-114-results-page-empty-unavailable-state-runtime-polish.test.ts`
- `tests/docs/phase-114-results-page-empty-unavailable-state-runtime-polish-doc.test.ts`

---

## Review Checkpoint Conclusion

Phase 115 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Phase 114 runtime remains within the approved Phase 113 plan and existing Raw Option Linkage Ban boundaries.

### 1. Aggregate available (`revealed` / `locked` / `post_lock`)

- `renderResultDisplay()` shows only display-safe aggregate fields from the results API.
- Aggregate mode renders `total_votes_display`, `display_percentage`, and `display_count` only when provided as display-safe strings.
- No raw counters, shard rows, vote tokens, or voter identity are shown.

### 2. Collecting

- Collecting shell uses `RESULTS_COLLECTING_TITLE` (`結果尚未公開`) and `RESULTS_COLLECTING_SUMMARY`.
- Collecting mode does not render `total_votes_display`, vote-count status lines, percentages, rankings, or personal vote-state copy.
- Option labels may render without counters when provided as label-only display-safe options.

### 3. Cancelled

- Unavailable shell title uses `RESULTS_CANCELLED_TITLE` (`問卷已取消`).
- Supporting message uses `RESULTS_CANCELLED_MESSAGE`.
- No counters, percentages, rankings, or voter-state copy are shown.

### 4. Unpublished

- Unavailable shell title uses `RESULTS_UNPUBLISHED_TITLE` (`問卷目前無法查看`).
- Supporting message uses `RESULTS_UNPUBLISHED_MESSAGE`.
- No counters, percentages, rankings, or voter-state copy are shown.

### 5. Poll not found / unavailable

- `messageForResultLoadFailure()` maps `404`, `POLL_NOT_FOUND`, `INVALID_POLL_ID`, and `POLL_VALIDATION` to `RESULTS_POLL_UNAVAILABLE_MESSAGE` (`問卷目前無法使用`).
- Draft and other unavailable lifecycle shells also use `問卷目前無法使用`.

### 6. Empty aggregate

- Aggregate mode with no renderable options shows `RESULTS_EMPTY_AGGREGATE_MESSAGE` (`目前沒有可顯示的聚合結果`).

### 7. Load / network / server failure

- Transport failures and generic non-OK result fetch failures use `RESULTS_LOAD_FAILURE_MESSAGE` (`目前無法載入結果，請稍後再試`).

### 8. No backend payload echo

- `resolveUnavailableUserMessage()` ignores backend `user_message` and maps lifecycle to frontend-owned copy only.
- `loadResultDisplay()` uses `messageForResultLoadFailure()` instead of echoing API `error` codes or `message` fields.
- Refresh failure notices remain lifecycle-safe and do not echo raw API payloads.

### 9. No voter personal state

- Results UI does not say whether the current visitor voted, which option they chose, or whether they were eligible.
- Personal vote reassurance copy was removed from collecting mode.

### 10. No internal identifier display

- Reviewed results runtime copy avoids `option_id`, raw counter, shard, vote token, session, and `user_id` exposure in user-visible strings.

### 11. No new observability linkage

- Phase 115 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

### 12. Compatibility preserved

- Vote page, `vote-by-index`, registration, login, profile, and Reference Answer boundaries remain unchanged.
- Results page does not call `GET /users/me`, `GET /users/me/profile`, vote APIs, or Reference Answer paths for display logic.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between an option result and a user, session, device, request, log, trace, metric, error payload, or analytics record.

- Results pages present only allowed public aggregate data or neutral lifecycle-owned unavailable copy.
- Empty, collecting, cancelled, unpublished, and failure states remain option-identity-free with respect to visitor identity.
- Backend `user_message` and API error payloads are not echoed into user-visible copy.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- `GET /polls/:id/results` behavior unchanged.
- Collecting/cancelled/unpublished counter-free boundaries unchanged.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.

---

## Added Guard Coverage

- `tests/frontend/phase-115-results-page-runtime-review-checkpoint.test.ts`
  - confirms aggregate, collecting, cancelled, unpublished, unavailable, empty aggregate, and load-failure copy from Phase 113/114.
  - confirms counter-free collecting/cancelled/unpublished rendering.
  - confirms no backend `user_message` / API error payload echo.
  - confirms reviewed results runtime avoids personal vote-state and internal identifier copy.
  - confirms results runtime stays away from vote/profile/Reference Answer display paths and observability sinks.

- `tests/docs/phase-115-results-page-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved runtime/API/schema/auth/results backend and Raw Option Linkage Ban boundaries.

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
