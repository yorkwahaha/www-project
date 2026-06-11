# WWW Project Phase 114 — Results Page Empty / Unavailable State Runtime Polish v1

**Status:** frontend runtime + focused tests + docs. Implements Phase 113 results-page empty/unavailable-state UX in `result-page.js`. No DB schema, migration, backend, API behavior, `UserAuthResolver`, vote evaluator, result evaluator, Official Vote transaction order, `GET /polls/:id/results` behavior, collecting/cancelled/unpublished counter-free boundaries, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 113 results page empty/unavailable state UX plan.

**Prior plan:** [Phase 113 results page empty/unavailable state UX plan](./www-project-phase-113-results-page-empty-unavailable-state-ux-plan-v1.md).

---

## Runtime Behavior

### Aggregate available (`revealed` / `locked` / `post_lock`)

- `renderResultDisplay()` continues to show only display-safe aggregate fields from the results API.
- Empty aggregate rows render `RESULTS_EMPTY_AGGREGATE_MESSAGE` (`目前沒有可顯示的聚合結果`).

### Collecting

- Collecting shell title uses `RESULTS_COLLECTING_TITLE` (`結果尚未公開`).
- Supporting copy uses `RESULTS_COLLECTING_SUMMARY`.
- Collecting mode no longer shows `total_votes_display`, vote-count status lines, or personal vote-state copy.
- Option labels may still render without counters.

### Cancelled / unpublished / draft unavailable

- `resolveUnavailableUserMessage()` maps lifecycle to frontend-owned neutral copy only; backend `user_message` is not echoed.
- Cancelled title/message: `問卷已取消` / `此問卷已取消，不會產生可公開顯示的聚合結果。`
- Unpublished title/message: `問卷目前無法查看` / `此問卷目前無法查看，頁面不顯示聚合結果。`
- Draft and other unavailable shells use `問卷目前無法使用`.

### Poll not found / unavailable load failures

- `messageForResultLoadFailure()` maps `404`, `POLL_NOT_FOUND`, `INVALID_POLL_ID`, and `POLL_VALIDATION` to `RESULTS_POLL_UNAVAILABLE_MESSAGE` (`問卷目前無法使用`).
- Generic non-OK and transport failures use `RESULTS_LOAD_FAILURE_MESSAGE` (`目前無法載入結果，請稍後再試`).

### Privacy boundaries preserved

- No voter-personal-state copy on the results page.
- No `option_id`, raw counter, shard, vote token, session, or `user_id` display.
- Collecting / cancelled / unpublished remain counter-free.

---

## Files

- `public/frontend/result-page.js` — lifecycle copy constants, result load failure mapping, collecting/unavailable/empty aggregate polish
- `tests/frontend/result-page.test.ts` — updated expectations for polished copy
- `tests/frontend/phase-114-results-page-empty-unavailable-state-runtime-polish.test.ts`
- `tests/docs/phase-114-results-page-empty-unavailable-state-runtime-polish-doc.test.ts`

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- `GET /polls/:id/results` behavior unchanged.
- Collecting/cancelled/unpublished counter-free boundaries unchanged.
- Raw Option Linkage Ban preserved.
- Reference Answer, registration, login-session, and profile API boundaries unchanged.

---

## Validation

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

`design-drafts/` remains outside the committed delivery scope.

---

## Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
