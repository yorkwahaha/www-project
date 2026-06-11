# WWW Project Phase 111 — Vote UX Error Handling Runtime Polish v1

**Status:** frontend runtime + focused tests + docs. Implements Phase 110 vote-page success, failure, lifecycle-block, transport-error, and missing-selection UX polish in `vote-page.js` and `public-mvp-ui.js`. No DB schema, migration, backend, API behavior, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 110 vote UX error handling polish plan at `8b64e87caa244ed84ac59993939a9e2cbb1c55d7`.

**Prior plan:** [Phase 110 vote UX error handling polish plan](./www-project-phase-110-vote-ux-error-handling-polish-plan-v1.md).

---

## Runtime Behavior

### Vote success

- Success panel and status region use generic copy: `投票已送出，感謝參與。` / `投票已送出。`
- No `option_id`, token, counter, shard, or demographic recap is shown.

### Vote failure

- API submit denials (eligibility, duplicate vote, trust, invalid option, etc.) map to one neutral bucket via `messageForVoteSubmitFailure()`.
- Network/transport failures use `VOTE_SUBMIT_TRANSPORT_FAILURE` (`目前無法送出投票，請稍後再試。`).
- User-visible copy does not branch on backend error codes or echo raw server payloads.

### Pre-submit hints (unchanged scope)

- `official-vote-pre-vote-hints.js` still handles anonymous `/login` guidance without profile reads and signed-in profile null checks only.
- Pre-vote hints are not submit-failure explainers.

### Poll lifecycle block

- `isPollAcceptingVotes()` allows submit only when `public_lifecycle_state === 'collecting'` (legacy `status === 'active'` fallback when lifecycle is absent).
- Non-collecting polls disable submit and show neutral blocked copy from `messageForPollVotingBlocked()`:
  - `cancelled` / `unpublished` / `draft` → `此問卷目前無法使用。`
  - `revealed` / `locked` / `post_lock` → `此問卷已結束。`
  - legacy `status === 'closed'` → `此問卷已截止，無法再投票。`
  - default → `此問卷目前不接受投票。`
- Poll content remains readable; submit is disabled without implying option validity.

### Load and transport errors

- Poll load JSON failures use `VOTE_PAGE_LOAD_FAILURE` (`目前無法載入問卷，請稍後再試。`).
- Lifecycle-specific load messages from `messageForPollLoadFailure()` remain poll-state-only and non-identifying.

### Missing selection

- Client-side only: `請先選擇一個選項。` before any vote API call.

### Page-local option memory

- `createVotePageController()` still clears selected option after submit, `pagehide`, and BFCache restore.
- No durable option choice linkage is introduced.

---

## Files

- `public/frontend/public-mvp-ui.js` — vote load/transport constants, lifecycle helpers, neutral submit failure bucket
- `public/frontend/vote-page.js` — lifecycle availability apply, success constants, submit handler polish
- `public/frontend/public-mvp-demo.js` — demo poll detail includes `public_lifecycle_state: 'collecting'`
- `tests/frontend/phase-111-vote-ux-error-handling-runtime-polish.test.ts`
- `tests/docs/phase-111-vote-ux-error-handling-runtime-polish-doc.test.ts`

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator changes.
- Official Vote transaction order unchanged.
- `vote-by-index` eligibility before option resolve unchanged.
- No client `option_index` → `option_id` resolution.
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
