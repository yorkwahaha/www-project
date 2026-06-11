# WWW Project Phase 133 — Public Participation / Results Flow Milestone Review Checkpoint v1

**Status:** milestone review checkpoint, focused guard tests, docs, and README index only. Consolidates public participation and results-flow review conclusions from Phases 113–118 (results and explore empty/unavailable UX, runtime polish, and runtime reviews), Phase 122 (vote page runtime review), and Phase 128 (static public pages copy privacy boundary review) as the stable boundary reference for `/explore`, `/vote/:id`, `/results/:id`, and adjacent public static copy.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `GET /users/me` behavior, `GET /users/me/profile` behavior, `POST /registration` behavior, `POST /login/session` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 132 creator flow milestone review checkpoint.

**Prior checkpoint:** [Phase 132 creator flow milestone review](./www-project-phase-132-creator-flow-milestone-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 133 records the completed public participation and results-flow review arc across explore, vote, results, and static public copy surfaces:

1. Phase 113 planned results-page empty/unavailable-state UX (docs/spec only).
2. Phase 114 implemented results-page empty/unavailable runtime polish.
3. Phase 115 reviewed results-page runtime with no result visibility, vote privacy, eligibility, auth, lifecycle, or linkage gap found.
4. Phase 116 planned explore-page empty/unavailable-state UX (docs/spec only).
5. Phase 117 implemented explore-page empty/unavailable runtime polish.
6. Phase 118 reviewed explore-page runtime with no feed privacy, eligibility, or linkage gap found.
7. Phase 122 reviewed vote-page runtime with no pre-vote eligibility, vote privacy, or linkage gap found.
8. Phase 128 reviewed static public pages copy with no result visibility, eligibility guarantee, or creator per-choice implication gap found.

This checkpoint confirms the public participation / results flow as a whole currently has no result visibility, vote privacy, eligibility, auth, lifecycle, or Raw Option Linkage Ban gap requiring a runtime, API, schema, auth, vote-backend, or result-evaluator patch.

---

## 2. Phase 113–118, 122, and 128 Delivery Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **113 (docs)** | Results page empty/unavailable state UX plan — collecting/cancelled/unpublished counter-free shells; aggregate-only revealed/locked/post_lock; neutral failure copy; no voter personal state | **Complete (docs)** |
| **114** | Results page empty/unavailable state runtime polish — `RESULTS_*` constants, `resolveResultRenderMode()`, fail-closed unavailable shells | **Complete** |
| **115 (checkpoint)** | Results page runtime review — no runtime gap found; no backend payload echo; display-safe aggregate only | **Complete** |
| **116 (docs)** | Explore page empty/unavailable state UX plan — freshness-only collecting feed; counter-free cards; neutral empty/failure copy | **Complete (docs)** |
| **117** | Explore page empty/unavailable state runtime polish — `EXPLORE_*` constants, `isExploreFeedItemSafe()`, static/live separation | **Complete** |
| **118 (checkpoint)** | Explore page runtime review — no runtime gap found; collecting-only safe feed items; no vote counts or eligibility leakage | **Complete** |
| **122 (checkpoint)** | Vote page runtime review — anonymous login-only hint; profile-incomplete `/profile` nudge; no eligibility guarantee; `option_index`-only submit | **Complete** |
| **128 (checkpoint)** | Static public pages copy privacy boundary review — FAQ/trust-levels/homepage/vote/results/explore copy preserves collecting hidden-count, no vote guarantee, no creator per-choice implication | **Complete** |

### 2.1 Phase references

- [Phase 113 results page empty/unavailable state UX plan](./www-project-phase-113-results-page-empty-unavailable-state-ux-plan-v1.md)
- [Phase 114 results page empty/unavailable state runtime polish](./www-project-phase-114-results-page-empty-unavailable-state-runtime-polish-v1.md)
- [Phase 115 results page runtime review checkpoint](./www-project-phase-115-results-page-runtime-review-checkpoint-v1.md)
- [Phase 116 explore page empty/unavailable state UX plan](./www-project-phase-116-explore-page-empty-unavailable-state-ux-plan-v1.md)
- [Phase 117 explore page empty/unavailable state runtime polish](./www-project-phase-117-explore-page-empty-unavailable-state-runtime-polish-v1.md)
- [Phase 118 explore page runtime review checkpoint](./www-project-phase-118-explore-page-runtime-review-checkpoint-v1.md)
- [Phase 122 vote page runtime review checkpoint](./www-project-phase-122-vote-page-runtime-review-checkpoint-v1.md)
- [Phase 128 static public pages copy privacy boundary review checkpoint](./www-project-phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint-v1.md)

---

## 3. Current Stable Public Participation / Results Flow

```text
/explore
  → GET /polls/feed (freshness-only, collecting public polls)
  → isExploreFeedItemSafe requires status === 'active' and display-safe key set
  → cards show title, category, collecting badge, freshness label, vote link only
  → no vote counts, result previews, voter status, eligibility, or internal identifiers

/vote/:pollId
  → mountOfficialVotePreVoteHint
  → anonymous: /login guidance only; no GET /users/me/profile
  → signed-in incomplete profile: GET /users/me/profile null checks only; /profile nudge
  → signed-in complete profile: neutral pre-submit notice; no eligibility guarantee
  → submitVoteByIndex posts { option_index } only
  → vote-time evaluator remains sole eligibility authority at submit

/results/:pollId (public)
  → GET /polls/:pollId/results (credentials: omit)
  → no creator lifecycle panel (parseCreatorManageMode false)
  → collecting / cancelled / unpublished: counter-free unavailable shells
  → revealed / locked / post_lock: display-safe aggregate only

Static public copy (FAQ, trust-levels, homepage, vote/results/explore HTML)
  → collecting hidden-count rules; no mid-collection analytics implication
  → no creator per-vote-choice visibility implication
  → no vote eligibility guarantee; registration no auto-login boundary preserved
```

---

## 4. Milestone Review Checkpoint Conclusion

Phase 133 found **no overall public participation / results-flow gap** requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch across `/explore`, `/vote/:id`, `/results/:id`, and public static copy.

### 4.1 `/explore` lists only recently published collecting public polls

- `GET /polls/feed` provides freshness-only collecting public polls.
- `isExploreFeedItemSafe()` requires `status === 'active'`, `published_display === '最近發布'`, and the display-safe feed item key set only.
- Unsafe or non-collecting-shaped items fail closed into neutral load-failure copy.

### 4.2 `/explore` does not show vote counts, result previews, voter status, eligibility status, or internal identifiers

- `renderExplorePollCard()` shows title, category label, collecting badge, freshness label, and vote link only.
- Feed summary copy states non-hot, non-counter, non-personalized ordering.
- Explore runtime does not call vote APIs, result APIs, or profile APIs for list rendering.

### 4.3 `/vote/:id` unsigned-in — login guidance only

- `mountOfficialVotePreVoteHint()` renders anonymous copy with `/login` link when not authenticated.
- Anonymous path does not call `GET /users/me/profile`.
- Anonymous path does not infer or display eligibility outcomes.

### 4.4 `/vote/:id` signed-in with incomplete profile — `/profile` guidance only

- Authenticated users call `GET /users/me/profile` with `credentials: 'same-origin'`.
- `parsePreVoteProfile()` reads only `birth_year_month` and `residential_region`.
- Incomplete profile renders neutral `/profile` nudge; it does not judge eligibility.

### 4.5 `/vote/:id` signed-in with complete profile — no eligibility guarantee

- Complete profile renders neutral pre-submit notice.
- Copy states the hint does not guarantee the vote will count (`此提示不代表一定可以完成投票`).
- UI does not say the visitor is eligible or ineligible.

### 4.6 Vote page submits `option_index` only; no early `option_index` → `option_id` resolution

- `renderPollOptions()` renders `option_index` and label only.
- `submitVoteByIndex()` posts `{ option_index }` only; it does not resolve or send `option_id`.

### 4.7 `vote-by-index` eligibility before option resolve boundary unchanged

- Official Vote eligibility remains vote-time evaluator authority only.
- Frontend does not branch submit-failure UI on backend eligibility codes.
- `messageForVoteSubmitFailure()` returns one neutral frontend bucket for all API denials.

### 4.8 Official Vote transaction order unchanged

- Public participation surfaces do not participate in vote-token creation, shard assignment, or counter increment from the frontend.

### 4.9 `/results/:id` collecting / cancelled / unpublished — no counters, result previews, voter status, eligibility, or internal identifiers

- `resolveResultRenderMode()` maps collecting and unavailable lifecycles to counter-free shells.
- `renderResultDisplay()` ignores unsafe aggregate fields in unavailable mode.
- `resolveUnavailableUserMessage()` maps lifecycle to frontend-owned copy only; backend `user_message` is not echoed.

### 4.10 `/results/:id` revealed / locked / post_lock — display-safe aggregate only

- Aggregate mode renders `total_votes_display`, `display_percentage`, and `display_count` only as display-safe strings.
- No raw counters, shard rows, vote tokens, or voter identity are shown.

### 4.11 General `/results/:id` does not use creator mode

- `parseCreatorManageMode(search)` returns true only when `creator=1` or `manage=1`.
- Plain `/results/:pollId` does not mount creator lifecycle panel and does not call `/creator/*` result-read endpoints.

### 4.12 Public copy does not imply creators can view individual vote choices

- FAQ states collecting rules apply to creators (`發起者也不例外，無法查看中途統計`).
- FAQ states profile data is not used to publicly expose individual vote records.
- Static copy does not say creators can inspect which option a specific voter chose.

### 4.13 Public copy does not imply collecting-period counts or mid-collection statistics

- FAQ and vote/results static copy state collecting hides counts, percentages, rankings, and trends.
- Homepage and explore lead copy do not promise live counters or partial result previews.

### 4.14 Public copy does not guarantee visitors can vote

- Vote-page static copy says formal voting may require login and is decided at submit time.
- Pre-vote hint and FAQ copy avoid “you are eligible” or “you can vote for sure” guarantees.

### 4.15 Error handling uses frontend neutral fallback without echoing backend payload or raw `error.message`

- Explore: `EXPLORE_LOAD_FAILURE_MESSAGE`, `EXPLORE_LOAD_MORE_FAILURE_MESSAGE`.
- Vote: `VOTE_PAGE_LOAD_FAILURE`, `VOTE_SUBMIT_TRANSPORT_FAILURE`, `GENERIC_VOTE_SUBMIT_FAILURE`.
- Results: `RESULTS_LOAD_FAILURE_MESSAGE`, `RESULTS_POLL_UNAVAILABLE_MESSAGE`, `RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE`.

### 4.16 `GET /users/me` returns only `user_id` and `display_name`

- `login-state-read.js` consumes only `display_name` in shared chrome.
- Public participation surfaces do not extend `GET /users/me` response shape.

### 4.17 `GET /users/me/profile` contains only `birth_year_month` and `residential_region`

- Pre-vote hint reads only those two nullable fields for completeness checks.
- No demographic breakdown, extra profile fields, or eligibility outcome reads in UI.

### 4.18 `creator_session` boundary unchanged — not production identity

- Explore, vote, and public results runtime do not use `creator_session` or creator-session APIs for participation.
- `creator_session` remains local/demo/test creator flow only.

### 4.19 `X-User-Id` remains explicit non-production compatibility only

- Explore, vote, and public results fetches send no `X-User-Id` or `X-Display-Name` headers.
- Non-production `X-User-Id` compatibility remains on other approved MVP/demo paths only.

### 4.20 Reference Answer remains disconnected from UserAuthResolver and profile eligibility

- Explore, vote, and public results runtime do not import Reference Answer modules.
- Reference Answer does not read profile eligibility or `UserAuthResolver` outputs on these surfaces.

### 4.21 Raw Option Linkage Ban preserved

- Vote-page selected option state remains page-local runtime memory only; clears on submit, `pagehide`, and BFCache restore.
- Pre-vote UX does not record which option a user is preparing to choose.
- Explore and results surfaces do not persist or transmit option choices with user/session/device/request identifiers.

### 4.22 No new precise location, extra profile fields, demographic breakdown, ranking personalization, or analytics linkage

- Public participation copy and handlers avoid demographic, analytics, ranking-personalization, and extra profile-field reads.

### 4.23 No new observability linkage

- Phase 133 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## 5. Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between public participation / results-flow runtime and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Explore feed presents display-safe poll summary data only.
- Vote submit posts `option_index` only; failure handling does not echo backend option identity.
- Results pages present allowed public aggregate data or neutral lifecycle-owned unavailable copy.
- Static public copy does not imply per-user option reconstruction.
- Phase 133 review adds docs/tests only; no new option-user linkage paths were introduced.

---

## 6. Coverage Baseline

Representative tests consolidated by Phases 113–118, 122, and 128:

| Area | Representative coverage |
|------|-------------------------|
| Results UX plan (docs) | `tests/docs/phase-113-results-page-empty-unavailable-state-ux-plan-doc.test.ts` |
| Results runtime polish | `tests/frontend/phase-114-results-page-empty-unavailable-state-runtime-polish.test.ts` |
| Results runtime review | `tests/frontend/phase-115-results-page-runtime-review-checkpoint.test.ts`, `tests/docs/phase-115-results-page-runtime-review-checkpoint-doc.test.ts` |
| Explore UX plan (docs) | `tests/docs/phase-116-explore-page-empty-unavailable-state-ux-plan-doc.test.ts` |
| Explore runtime polish | `tests/frontend/phase-117-explore-page-empty-unavailable-state-runtime-polish.test.ts` |
| Explore runtime review | `tests/frontend/phase-118-explore-page-runtime-review-checkpoint.test.ts`, `tests/docs/phase-118-explore-page-runtime-review-checkpoint-doc.test.ts` |
| Vote page runtime review | `tests/frontend/phase-122-vote-page-runtime-review-checkpoint.test.ts`, `tests/docs/phase-122-vote-page-runtime-review-checkpoint-doc.test.ts` |
| Static public copy review | `tests/frontend/phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint.test.ts`, `tests/docs/phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint-doc.test.ts` |
| Milestone guard (this phase) | `tests/frontend/phase-133-public-participation-results-flow-milestone-review-checkpoint.test.ts`, `tests/docs/phase-133-public-participation-results-flow-milestone-review-checkpoint-doc.test.ts` |
| Local smoke | `scripts/smoke-public-local.mjs` |

---

## 7. Explicit Non-Changes

Phase 133 does not change:

- runtime or frontend JS behavior
- DB schema or migrations
- backend API routes or handlers
- auth resolver or creator ownership rules
- lifecycle transition backend logic
- vote evaluator or result evaluator
- Official Vote transaction order
- `vote-by-index` eligibility before option resolve
- vote token schema or counter schema
- `GET /polls/feed` freshness-only contract
- `GET /polls/:id/results` public display tiers
- Reference Answer auth boundary

---

## 8. Validation

Required validation for this phase:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## 9. Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
