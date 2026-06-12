# WWW Project Phase 168 — Public Explore Feed UX Review & Guard Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews and locks down `/explore` public feed UX boundaries without copy centralization, visual CSS polish, or runtime changes unless a small clear bug is found.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 167 public results page visibility UX review checkpoint (`09da164`).

**Prior checkpoint:** [Phase 167 public results page visibility UX review checkpoint](./www-project-phase-167-public-results-page-visibility-ux-review-checkpoint-v1.md).

**Related milestones:** [Phase 116 explore page empty/unavailable state UX plan](./www-project-phase-116-explore-page-empty-unavailable-state-ux-plan-v1.md), [Phase 118 explore page runtime review checkpoint](./www-project-phase-118-explore-page-runtime-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 168 re-reviews the public explore feed UX to confirm display-safe feed items only, counter-free cards, freshness-only non-personalized ordering, static/live separation, neutral empty/loading/error states, identifier safety, Raw Option Linkage Ban preservation, and policy-panel layer independence.

Review focus:

1. `/explore` only presents display-safe public poll feed items from `GET /polls/feed`.
2. Feed must not show vote counts, result previews, voter state, eligibility state, ranking score, popularity score, or personalized recommendations.
3. Ordering must remain safe and non-personalized, such as recent published/collecting order per the existing feed contract.
4. Static sample cards and live/public feed must remain clearly separated.
5. Empty/loading/pending/unavailable/error states must not echo backend payload, `error.message`, stack trace, or internal error codes.
6. UI must not expose `user_id`, session id, creator token, vote token, counter shard, trace id, or private backend identifiers.
7. No option choice + user/session/device/request/log/trace/metric/error payload linkage is introduced.
8. No logs, metrics, analytics, tracking, APM traces, or ranking personalization are introduced.
9. Result visibility, vote transaction, vote-by-index, eligibility, and creator ownership boundaries remain unchanged.
10. `policy-ui-placeholders.js` / `HELP_COPY` remain independent policy-panel layer.

No new explore feed runtime polish was applied during this checkpoint review.

**Out of scope (unchanged):** copy centralization expansion; Phase 161–167 visual/onboarding/results/creator-flow polish; `policy-ui-placeholders.js` / `HELP_COPY` bodies; backend, API, DB, migration, auth resolver, feed evaluator, result visibility evaluator; new logs, metrics, analytics, tracking, or APM traces; `design-drafts/` commits.

---

## 2. Explore Feed Flow Under Review

```text
/explore
  → mountExplorePage()
  → GET /polls/feed?limit=20[&cursor=…] (credentials: omit; cache: no-store)
  → isExploreFeedPayloadSafe(body)
      → rejects extra keys, non-active status, counters, result previews
  → renderExplorePollCard() per safe item
      → title, category label, collecting badge, published_display, vote CTA only
  → freshness-only pagination via next_cursor

/explore (static shell)
  → data-explore-feed="freshness-only"
  → #explore-feed-list populated only by live feed runtime
  → no /vote/demo, no data-static-examples

/ (homepage)
  → data-static-examples="true" static cards only
  → separate from live /explore feed
```

---

## 3. Review Checkpoint Conclusion

Phase 168 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, feed-backend, or result-evaluator patch. Current explore feed UX remains within approved boundaries.

### Display-safe feed items only

- `EXPLORE_FEED_ALLOWED_ITEM_KEYS` whitelists `poll_id`, `title`, `category`, `status`, `published_display`, `result_page_url` only.
- `isExploreFeedItemSafe()` requires `status === 'active'`, `published_display === '最近發布'`, and canonical `result_page_url`.
- Extra fields such as `vote_count`, `option_id`, percentages, or ranking scores fail validation.

### Counter-free, non-personalized feed surface

- `renderExplorePollCard()` shows collecting badge and `EXPLORE_COLLECTING_STATUS_HINT` (`收集中 · 不顯示票數`); no result preview markup.
- Feed request URL uses `/polls/feed` with `limit` and optional `cursor` only; no rank/hot/trend/user query params.
- Status copy states freshness-only ordering via `EXPLORE_FEED_LIST_SUMMARY`.

### Static examples versus live feed

- Homepage static cards remain under `data-static-examples="true"` in `index.html`.
- `explore.html` uses `data-explore-feed="freshness-only"` and does not include `/vote/demo` or static example cards.
- Live list `#explore-feed-list` is populated only from validated feed payloads.

### Empty / loading / error states

- Loading: `EXPLORE_FEED_LOADING_MESSAGE` with `aria-busy` on feed list.
- Load more pending: `EXPLORE_LOAD_MORE_PENDING_MESSAGE` on button.
- Initial failures: `EXPLORE_LOAD_FAILURE_MESSAGE`.
- Pagination failures: `EXPLORE_LOAD_MORE_FAILURE_MESSAGE`.
- `fetchExploreFeedPage()` maps non-OK, JSON parse failure, and unsafe payload to frontend-owned neutral copy only; no `error.message` echo.

### Identifier and linkage safety

- Explore runtime avoids `user_id`, vote tokens, shard ids, `option_id`, and raw counter fields in UI.
- `fetchExploreFeedPage` uses `credentials: 'omit'`; no profile, `UserAuthResolver`, or Reference Answer paths.
- No durable option-choice + identity linkage in explore shell.

### Policy panel layer independence

- `explore-page.js` does not import `policy-ui-placeholders.js` or `HELP_COPY`.
- Explore feed UX uses `public-mvp-ui.js` copy constants only; policy panel remains a separate layer.

---

## 4. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-168-public-explore-feed-ux-review-checkpoint.test.ts` | Consolidated explore feed UX boundary guards |
| `tests/frontend/phase-118-explore-page-runtime-review-checkpoint.test.ts` | Explore page runtime guards (retained) |
| `tests/frontend/explore-page.test.ts` | Explore feed helper guards (retained) |
| `tests/docs/phase-168-public-explore-feed-ux-review-checkpoint-doc.test.ts` | Doc + README index guard |

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

- `tests/frontend/phase-168-public-explore-feed-ux-review-checkpoint.test.ts`
- `tests/docs/phase-168-public-explore-feed-ux-review-checkpoint-doc.test.ts`

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Explore feed review does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Reference Answer remains disconnected from explore runtime and `UserAuthResolver` / profile eligibility. Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged.
