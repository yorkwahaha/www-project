# WWW Project Phase 167 — Public Results Page Visibility UX Review & Guard Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews and locks down `/results/:id` public results page visibility UX boundaries, including creator result links (`?creator=1`), without copy centralization, visual CSS polish, or runtime changes unless a small clear bug is found.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 166 public my-polls / creator lifecycle UX review checkpoint (`22eabe1`).

**Prior checkpoint:** [Phase 166 public my-polls / creator lifecycle UX review checkpoint](./www-project-phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint-v1.md).

**Related milestones:** [Phase 115 results page runtime review checkpoint](./www-project-phase-115-results-page-runtime-review-checkpoint-v1.md), [Phase 131 creator results panel runtime review checkpoint](./www-project-phase-131-creator-results-panel-runtime-review-checkpoint-v1.md), [Phase 133 public participation / results flow milestone review checkpoint](./www-project-phase-133-public-participation-results-flow-milestone-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 167 re-reviews the public results page visibility UX to confirm lifecycle-gated display modes, creator manage links that do not bypass public visibility rules, neutral empty/loading/error states, identifier safety, Raw Option Linkage Ban preservation, Reference Answer separation, and policy-panel layer independence.

Review focus:

1. `collecting` / `cancelled` / `unpublished` states must not show counters, result previews, vote totals, voter state, or eligibility state.
2. `revealed` / `locked` / `post_lock` are the only states allowed to show display-safe aggregate results.
3. Creator result links such as `/results/:id?creator=1` must not bypass public result visibility rules.
4. Results empty/loading/pending/unavailable/error states must not echo backend payload, `error.message`, stack trace, or internal error codes.
5. Results UI must not expose `user_id`, session id, creator token, vote token, counter shard, internal trace IDs, or private backend identifiers.
6. Result shell must not introduce option choice + user/session/device/request/log/trace/metric/error payload linkage.
7. Reference Answer must remain outside `UserAuthResolver` and profile eligibility.
8. Vote-by-index and Official Vote transaction order must remain unchanged.
9. No logs, metrics, analytics, tracking, or APM traces are introduced.
10. `policy-ui-placeholders.js` / `HELP_COPY` remain independent policy-panel layer.

No new results page visibility runtime polish was applied during this checkpoint review.

**Out of scope (unchanged):** copy centralization expansion; Phase 161–166 visual/onboarding/creator-flow polish; `policy-ui-placeholders.js` / `HELP_COPY` bodies; backend, API, DB, migration, auth resolver, result visibility evaluator; new logs, metrics, analytics, tracking, or APM traces; `design-drafts/` commits.

---

## 2. Results Page Visibility Flow Under Review

```text
/results/:pollId
  → bootstrapResultPage()
  → GET /polls/:pollId/results (credentials: omit; cache: no-store)
  → resolveResultRenderMode(result)
      → collecting → renderCollectingStatusBlock (no counters)
      → cancelled/unpublished/draft → renderUnavailableStatusBlock (lifecycle-owned copy)
      → revealed/locked/post_lock → display-safe aggregate (display_count / display_percentage buckets only)
  → optional GET /polls/:pollId/public-notices (suspended typo correction only)

/results/:pollId?creator=1
  → same GET /polls/:pollId/results payload and renderResultDisplay path
  → parseCreatorManageMode(search) enables creator lifecycle panel only
  → lifecycle POST refresh re-fetches public results API (no creator results bypass route)
  → collecting/cancelled/unpublished remain counter-free after creator refresh

/results/demo
  → demo collecting payload only (no live API)
```

---

## 3. Review Checkpoint Conclusion

Phase 167 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current results page visibility UX remains within approved boundaries.

### Lifecycle-gated display modes

- `resolveResultRenderMode()` maps `collecting` → `collecting`; `cancelled` / `unpublished` / `draft` → `unavailable`; `revealed` / `locked` / `post_lock` → `aggregate`.
- Collecting renders status copy and option labels only; ignores `total_votes_display` counter signals.
- Cancelled/unpublished use frontend-owned `resolveUnavailableUserMessage()`; backend `user_message` is not echoed.
- Aggregate mode renders only `display_count`, `display_percentage`, and `total_votes_display` bucket strings from the public results API.

### Creator result links do not bypass visibility

- `?creator=1` / `?manage=1` gates `mountCreatorLifecyclePanel` only; results still load via `GET /polls/:pollId/results`.
- `refreshResultPageDisplay()` repaints through the same `paintResultPageFromPayload` / `renderResultDisplay` path.
- No `/creator/polls/:id/results` or alternate counter-exposing route in results runtime.

### Empty / loading / error states

- Loading: `RESULT_PAGE_LOADING_MESSAGE` with `aria-busy` on title region.
- Load failures: `messageForResultLoadFailure()` → `RESULTS_POLL_UNAVAILABLE_MESSAGE` or `RESULTS_LOAD_FAILURE_MESSAGE`.
- Post-lifecycle refresh failure: `RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE` without backend echo.
- `resolvePublicErrorUserMessage()` whitelists frontend-owned messages only.

### Identifier and linkage safety

- Results runtime avoids `user_id`, vote tokens, shard ids, `option_id`, and raw counter fields in UI.
- `loadResultDisplay` uses `credentials: 'omit'`; no profile or Reference Answer paths.
- No durable option-choice + identity linkage in results shell.

### Policy panel layer independence

- `result-page.js` imports `POLICY_UI_COPY` and mock helpers from `policy-ui-placeholders.js`.
- `HELP_COPY` remains in `policy-ui-placeholders.js`; results runtime does not import `HELP_COPY` directly.

---

## 4. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-167-public-results-page-visibility-ux-review-checkpoint.test.ts` | Consolidated results visibility UX boundary guards |
| `tests/frontend/phase-115-results-page-runtime-review-checkpoint.test.ts` | Results page runtime guards (retained) |
| `tests/frontend/phase-131-creator-results-panel-runtime-review-checkpoint.test.ts` | Creator results panel guards (retained) |
| `tests/docs/phase-167-public-results-page-visibility-ux-review-checkpoint-doc.test.ts` | Doc + README index guard |

---

## 5. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-167-public-results-page-visibility-ux-review-checkpoint.test.ts`
- `tests/docs/phase-167-public-results-page-visibility-ux-review-checkpoint-doc.test.ts`

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Results page visibility review does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Reference Answer remains disconnected from results runtime. Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged.
