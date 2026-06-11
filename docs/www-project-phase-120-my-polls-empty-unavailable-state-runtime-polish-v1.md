# WWW Project Phase 120 — My Polls Empty / Unavailable State Runtime Polish v1

**Status:** frontend runtime + focused tests + docs. Implements Phase 119 my-polls empty/unavailable-state UX in `my-polls-page.js`, `my-polls.html`, and `creator-flow-copy.js`. No DB schema, migration, backend, API behavior, `UserAuthResolver`, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `GET /creator/polls` behavior, `creator_session` boundary, vote token schema, counter schema, Reference Answer, ranking, personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 119 my polls empty/unavailable state UX plan.

**Prior plan:** [Phase 119 my polls empty/unavailable state UX plan](./www-project-phase-119-my-polls-empty-unavailable-state-ux-plan-v1.md).

---

## Runtime Behavior

### Not signed in

- `prepareMyPollsLiveSession()` maps non-demo-host `GET /creator/session` `401` to `MY_POLLS_SIGN_IN_REQUIRED_MESSAGE` (`請先登入後查看你建立的問卷`).
- Unavailable shell may link to `/login` without echoing backend payloads.

### Creator session unavailable / load failure

- Session bootstrap failures and owned-list fetch failures use `MY_POLLS_LOAD_FAILURE_MESSAGE` (`目前無法載入你建立的問卷，請稍後再試`).
- `fetchCreatorOwnedPolls()` and `mountLiveCreatorManagePanel()` catch paths use frontend-owned constants only; backend payloads and foreign error text are not echoed.
- `isMyPollsSignInRequiredError()` buckets sign-in-required failures without reading foreign `error.message` values.

### Owned list empty

- Empty shell uses `MY_POLLS_EMPTY_MESSAGE` (`你目前還沒有建立問卷`).
- Supporting copy uses `MY_POLLS_EMPTY_SUMMARY`.

### Lifecycle labels

- `formatMyPollsLifecycleLabel()` maps owned poll lifecycle to neutral labels: `草稿`, `收集中`, `已公開`, `公開鎖定期`, `鎖定期已結束`, `已取消`, `已下架`.
- Live owned polls render lifecycle badges without vote counters or result previews.

### Creator-safe owned poll summary

- `isCreatorOwnedPollSafe()` validates the allowed `GET /creator/polls` item key set only.
- Unsafe payloads fail closed into neutral load-failure copy.

### Mock / live separation

- Mock dashboard rows remain under `data-mock-dashboard="true"` in `my-polls.html`.
- `?live=1` hides the mock dashboard from accessibility tree and mounts `#creator-live-manage` with `data-live-owned-list="true"`.

### Privacy boundaries preserved

- No voter-personal-state, eligibility, or profile-completion copy on my-polls.
- No `option_id`, raw counter, shard, vote token, or voter `user_id` display.
- Owned-list cards remain counter-free and result-preview-free.

---

## Files

- `public/frontend/my-polls-page.js` — Phase 119 copy constants, session/sign-in bucketing, empty/unavailable polish, lifecycle labels, creator-safe payload guards
- `public/my-polls.html` — mock dashboard marker
- `public/frontend/creator-flow-copy.js` — aligned empty copy constant
- `tests/frontend/my-polls-page.test.ts` — updated expectations where needed
- `tests/frontend/phase-120-my-polls-empty-unavailable-state-runtime-polish.test.ts`
- `tests/docs/phase-120-my-polls-empty-unavailable-state-runtime-polish-doc.test.ts`

---

## Boundaries Preserved

- No backend/API/schema/auth/creator ownership/lifecycle evaluator changes.
- Official Vote transaction order unchanged.
- `GET /creator/polls` behavior unchanged.
- `creator_session` remains local/demo/test creator flow only.
- Raw Option Linkage Ban preserved.
- Reference Answer, registration, login-session, profile, explore, and vote boundaries unchanged.

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
