# WWW Project Phase 117 — Explore Page Empty / Unavailable State Runtime Polish v1

**Status:** frontend runtime + focused tests + docs. Implements Phase 116 explore-page empty/unavailable-state UX in `explore-page.js` and `explore.html`. No DB schema, migration, backend, API behavior, `UserAuthResolver`, vote evaluator, result evaluator, Official Vote transaction order, `GET /polls/feed` behavior, vote token schema, counter schema, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 116 explore page empty/unavailable state UX plan.

**Prior plan:** [Phase 116 explore page empty/unavailable state UX plan](./www-project-phase-116-explore-page-empty-unavailable-state-ux-plan-v1.md).

---

## Runtime Behavior

### Live feed has collecting polls

- `renderExplorePollCard()` continues to show only display-safe poll summary fields allowed by the feed contract.
- Status region uses `EXPLORE_FEED_LIST_MESSAGE` (`顯示公開問卷列表`) with `EXPLORE_FEED_LIST_SUMMARY`.
- Cards show title, category, collecting badge, freshness label, and vote link only.
- No counters, result previews, rankings, hot badges, or personalized ordering.

### Live feed empty

- Empty panel and status region use `EXPLORE_FEED_EMPTY_MESSAGE` (`目前沒有正在收集中的公開問卷`).
- Supporting copy uses `EXPLORE_FEED_EMPTY_SUMMARY`.
- No placeholder mock polls or static homepage examples in the live feed DOM.

### Load / network / server failure

- Initial load failures use `EXPLORE_LOAD_FAILURE_MESSAGE` (`目前無法載入探索列表，請稍後再試`).
- Pagination failures use `EXPLORE_LOAD_MORE_FAILURE_MESSAGE` (`無法載入更多問卷，請稍後再試。`).
- `fetchExploreFeedPage()` maps non-OK, JSON parse failure, and unsafe payload to frontend-owned neutral copy only; raw backend payloads are not echoed.

### Static examples versus live feed

- Homepage example cards remain in `index.html` under `data-static-examples="true"`.
- `/explore` live feed list (`#explore-feed-list`) is populated only from `GET /polls/feed`.
- Static demo routes such as `/vote/demo` do not appear in explore runtime code or live feed rendering.

### Non-collecting poll exclusion

- `isExploreFeedItemSafe()` requires `status === 'active'` and the display-safe feed item key set only.
- Unsafe or non-collecting-shaped items fail payload validation; the page shows neutral load failure copy instead of rendering them.

### Privacy boundaries preserved

- No voter-personal-state, eligibility, or profile-completion copy on the explore page.
- No `option_id`, raw counter, shard, vote token, session, or `user_id` display.
- Explore cards remain counter-free and result-preview-free.

---

## Files

- `public/frontend/explore-page.js` — Phase 116 copy constants, empty/list/failure polish, neutral failure bucketing
- `public/explore.html` — empty-state copy aligned with Phase 116
- `public/index.html` — `data-static-examples` marker for homepage static example separation
- `tests/frontend/explore-page.test.ts` — updated expectations where needed
- `tests/frontend/phase-117-explore-page-empty-unavailable-state-runtime-polish.test.ts`
- `tests/docs/phase-117-explore-page-empty-unavailable-state-runtime-polish-doc.test.ts`

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- `GET /polls/feed` behavior unchanged.
- Freshness-only non-personalized feed contract unchanged.
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
