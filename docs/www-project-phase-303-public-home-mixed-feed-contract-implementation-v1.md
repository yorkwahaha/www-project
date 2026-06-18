# WWW Project Phase 303 — Public Home Mixed Feed Contract Implementation v1

**Status:** implementation — backend route + service + repository read + frontend client/validators/rendering + tests + docs. Implements the [Phase 302 contract plan](./www-project-phase-302-public-home-mixed-feed-contract-plan-v1.md) as a new public `GET /home/feed` discriminated-union endpoint, and wires the Phase 301 swipe homepage to render both collecting and revealed cards. The explore feed `/polls/feed` is unchanged and stays collecting-only.

**No DB, schema, or migration change. No change to `/polls/feed`, the Official Vote transaction order, vote-by-index eligibility-before-resolve, the Raw Option Linkage Ban, `quality_badge` derivation, auth resolver, creator ownership, lifecycle transitions, or the result evaluator.** Revealed result summaries are derived from the existing display-safe results model behind the existing visibility gate.

**Baseline commit:** `c1b8de5` (`origin/master` after Phase 302 contract plan).

> **Phase-number note:** "303" was *proposed* by the Phase 302 plan as the implementation phase; it is unrelated to the GPT-5.5 release-documentation tracks that reused 300–302. This is the home mixed-feed implementation.

---

## 1. What shipped

### Backend (`src/`)

- **`GET /home/feed`** (`src/http/server.ts`): new public, no-login route reusing the existing `parsePublicFeedQuery` (only `limit` + `cursor`; unsupported params → 400). `/polls/feed` route untouched.
- **`pollRoutes.handleGetHomeFeed`** (`src/http/poll-routes.ts`): mirrors `handleGetPublicFeed`, delegates to `pollService.getHomeFeed`.
- **`pollService.getHomeFeed`** (`src/polls/service.ts`): pages freshness-ordered home-eligible polls (cursor/limit identical to the public feed), then per poll:
  - if `isPublicAggregateResultsReadable(poll)` → **revealed** item with a display-safe `result_summary` built by `toHomeRevealedResultSummary` (reuses the same `getResultTier` / `formatPercentage` bucketing as the results page). Polls whose tier is not yet presentable (total < 30 → `收集中` tier) are **omitted** (FU-303-01).
  - else if `isPublicFeedEligible(poll, now)` → **collecting** item (question-only).
  - else dropped (fail closed).
- **`repository.listPublicHomeFeedPolls`** (`src/polls/repository.ts` pg + `src/polls/in-memory-repository.ts`): a read-only freshness-ordered keyset page of polls that are collecting-feed-eligible **or** revealed/locked/post_lock, reusing the same column set as `findPollById` and the same cursor encoding. No new table, no JOIN to vote/option/user tables; vote aggregates are fetched per revealed poll via the existing `listVoteAggregatesByPollId`.
- **`isPublicHomeFeedEligible`** (`src/polls/public-visibility.ts`): coarse pre-filter = `isPublicFeedEligible(poll) || isPublicAggregateResultsReadable(poll)`. The service re-checks each gate per poll before emitting an item, so visibility is decided by the existing rules, never by the feed.
- **Types** (`src/polls/types.ts`): `HomeFeedCollectingItem`, `HomeFeedRevealedItem`, `HomeFeedResultSummary`, `HomeFeedItem` (discriminated union), `HomeFeedResult`.

### Frontend (`public/frontend/`)

- **`home-feed.js`** (new): `HOME_FEED_PATH`, `buildHomeFeedRequestUrl`, `fetchHomeFeedPage` (`credentials: 'omit'`, `cache: 'no-store'`, payload validated), and the four exact-key-set, fail-closed validators: `isHomeCollectingFeedItemSafe`, `isHomeRevealedFeedItemSafe`, `isHomeFeedItemSafe` (union dispatcher), `isHomeFeedPayloadSafe`.
- **`public-mvp-home.js`**: now consumes `/home/feed`. `renderHomeSwipeCard` renders a collecting item (question-only); new `renderHomeRevealedCard` renders the display-safe summary (`已公開`/`公開鎖定期`/`鎖定期已結束` pill, leading option label + bucketed percentage + bucketed total, `看完整結果` CTA → `/results/:id`); `renderHomeFeedItem` dispatches on the validated `state` and drops invalid items. Whole-card click keeps the `closest('a, button')` guard (no CTA/keyboard/swipe hijack).
- **`public-mvp.css`**: home-only `home-swipe-card--revealed` / `home-swipe-card-result*` classes; shared explore/result primitives untouched; reduced-motion behavior unchanged.
- **`public-page-copy.js`**: `PUBLIC_HOME_SWIPE_REVEALED_CTA` (`看完整結果`), `PUBLIC_HOME_SWIPE_REVEALED_HINT`.
- **`index.html`**: `data-home-swipe-feed` marker updated `collecting-only` → `mixed`.

## 2. Payload contract (as implemented)

```
GET /home/feed?limit&cursor  →  { items: HomeFeedItem[], next_cursor: string | null }

collecting item:
  { state:'collecting', poll_id, title, category, lifecycle_label:'收集中',
    published_display:'最近發布', vote_page_url:'/vote/:id' }

revealed item:
  { state:'revealed', poll_id, title, category,
    lifecycle_label:'已公開'|'公開鎖定期'|'鎖定期已結束',
    published_display:'最近發布', result_page_url:'/results/:id',
    result_summary:{ display_mode:'bucketed_percentage'|'rounded_with_bucketed_votes'|'precise',
                     total_votes_display:'30–99'|'100–499'|'500+',
                     leading_option:{ display_label, display_percentage } | null },
    quality_badge: null | 'positive_feedback' }
```

## 3. Privacy boundary proof

- **Collecting no-leak:** collecting items read only `poll_id`/`title`/`category`; the validator’s exact key set has no aggregate field, and a collecting poll with votes is still emitted as a collecting item with no `result_summary` (test: *emits collecting items with no result_summary or aggregate even when votes exist*).
- **Revealed visibility gate:** a revealed item is emitted only when `isPublicAggregateResultsReadable(poll)` (the same rule `GET /polls/:id/results` uses). A collecting poll with many votes stays collecting; a revealed poll with too few votes is omitted (test: *emits revealed items only when public aggregate visibility allows it*).
- **Display-safe only:** `result_summary` reuses `getResultTier`/`formatPercentage`; `total_votes_display` is always a bucket; raw per-option counts never appear (test: *uses display-safe bucketed result output, never raw counts* asserts raw counts 40/20 absent).
- **No option linkage / identity:** no `option_id`/`option_index`/`shard`/`vote_token`/`user_id`/`session`/`request_id`/`device`/`trace` in either state (test: *never exposes option linkage or identity fields in either state*).
- **Frontend defense in depth:** exact-key-set fail-closed validators reject extra keys, raw counts inside the summary, option linkage, identity fields, collecting/unavailable display modes on revealed, non-bucket totals, and unknown/missing `state`; invalid items are dropped, never rendered.

## 4. Auth boundary (unchanged)

`/home/feed` is public/no-login like `/polls/feed`. Create / manage / profile remain login-gated. Voting eligibility stays vote-time only and is never surfaced or inferred on the home feed.

## 5. Self-audit

- **Backend/API files touched:** `src/http/server.ts` (route), `src/http/poll-routes.ts` (handler), `src/polls/service.ts` (`getHomeFeed` + `toHomeRevealedResultSummary` + `revealedLifecycleLabel`), `src/polls/repository.ts` (`listPublicHomeFeedPolls` pg), `src/polls/in-memory-repository.ts` (`listPublicHomeFeedPolls`), `src/polls/public-visibility.ts` (`isPublicHomeFeedEligible`), `src/polls/types.ts` (home feed types).
- **`/polls/feed` unchanged:** `getPublicFeed` and `listPublicFeedPolls` are byte-for-byte the same; explore guard tests unchanged and green.
- **No migrations:** no file under `migrations/`; no schema/DDL; the new repository read composes existing columns/tables only.
- **Collecting no-leak:** verified by service + frontend tests above.
- **Revealed result visibility gate:** `getHomeFeed` calls `isPublicAggregateResultsReadable` per poll; summary derives from `toPollResultDisplay`-equivalent bucketing.
- **No raw option linkage / identity fields:** verified by serialized-output assertions.

## 6. Test coverage

- `tests/polls/phase-303-home-mixed-feed.test.ts` — service: `/polls/feed` unchanged; discriminated union; collecting no-leak; revealed visibility gate (collecting-with-votes stays collecting, low-vote revealed omitted); display-safe bucketed output (no raw counts); no option linkage/identity; new route/query isolation; docs/README.
- `tests/frontend/phase-303-public-home-mixed-feed.test.ts` — validators separate + exact-key-set + fail-closed; collecting rejects aggregate fields; revealed rejects raw counts/linkage/identity/early-visibility; union dispatcher + payload validator; `fetchHomeFeedPage` targets `/home/feed`; no search/category params; revealed card rendering; dispatch drops invalid items.
- `tests/frontend/phase-301-home-swipe-card-visual-shell.test.ts` — updated to the mixed feed (`data-home-swipe-feed="mixed"`, collecting item shape, `/home/feed` consumption).

## 7. Non-goals honored

No search box; no category filter; no popularity/ranking/personalization; no auth gating for browsing; no vote-eligibility inference on home; no raw counts beyond the existing display-safe behavior; no Raw Option Linkage Ban change; no Official Vote transaction order change; `design-drafts/` not committed; `stash@{0}` not popped.

## 8. Follow-ups

- **FU-303-01** — revealed polls whose display tier is not yet presentable (total < 30 → `收集中` tier) are **omitted** from the home feed; they remain reachable on their results page. Revisit if low-vote revealed polls should appear with a "尚無足夠結果" affordance.
- **FU-303-02** — `getHomeFeed` fetches vote aggregates per revealed poll in the page (N small reads); a batch `listVoteAggregatesByPollIds` could reduce round-trips if a page carries many revealed items.
- **FU-303-03** — pagination uses the last *fetched* row for the cursor, so a page may contain fewer than `limit` rendered items when low-vote revealed polls are omitted; acceptable for a freshness feed, revisit if dense pages are needed.

## 9. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean (only benign LF/CRLF warnings) |
| `npm test` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | pass (Docker available) — `/`, `/home/feed`, and the full registration/login/create/vote/results flow |
