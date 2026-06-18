# WWW Project Phase 303-R — Public Home Mixed Feed Runtime / Privacy Review Checkpoint v1

**Status:** high-risk runtime/privacy review checkpoint — docs + docs-test + README only. Independent review of the [Phase 303 public home mixed feed implementation](./www-project-phase-303-public-home-mixed-feed-contract-implementation-v1.md) delivered in commit `fc3165a`. **No runtime change** — review found no privacy or runtime regression; the implementation is **APPROVED** and safe to build on.

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, Raw Option Linkage Ban, `quality_badge` derivation, `/polls/feed` contract, logging, metrics, deploy, or production configuration changed by Phase 303 or by this review.**

**Reviewed commit:** `fc3165a` (`origin/master`, "Phase 303: Public Home Mixed Feed Contract Implementation").
**Baseline before Phase 303:** `c1b8de5`.
**Reviewed implementation doc:** `docs/www-project-phase-303-public-home-mixed-feed-contract-implementation-v1.md`.

> **Phase-number note:** the "303" feature track (home mixed feed) is unrelated to the GPT-5.5 release-documentation tracks that reused 300–302.

---

## 1. Review session metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-303r-2026-06-18` |
| Reviewer | Agent-assisted runtime/privacy review (static source + automated gates + local smoke) |
| Reviewed commit | `fc3165a` |
| Scope | `GET /home/feed` contract & auth, revealed result safety, collecting no-leak, frontend validators, rendering, test/governance reconciliation, smoke |
| Method | Source review of `server.ts`, `poll-routes.ts`, `service.ts`, `repository.ts`, `in-memory-repository.ts`, `public-visibility.ts`, `types.ts`, `home-feed.js`, `public-mvp-home.js`, `public-mvp.css`; commit file-scope + `/polls/feed` deletion audit; full gates + smoke |

**Launch approval:** NO · **Production approval:** NO · **Release execution:** NO · **Deployment:** NO. This review is not release execution, not deployment, and not formal launch.

---

## 2. Review scope results

### 2.1 Backend / API contract — PASS

- **`GET /home/feed` is public/no-login.** The route sits in the public route block of `src/http/server.ts` (alongside `/polls/feed`, well before the `/admin/*` and auth-gated sections); it calls `parsePublicFeedQuery` (only `limit` + `cursor`; any other param → 400) and `pollRoutes.handleGetHomeFeed`. No `requireUserId`, session, or creator check is applied.
- **`/polls/feed` remains collecting-only and unchanged.** A `git diff c1b8de5..fc3165a` over `service.ts` + `repository.ts` shows **no deletions** touching `getPublicFeed` or `listPublicFeedPolls`; both are byte-for-byte intact (Phase 303 only adds neighbors). The explore feed item shape and `isExploreFeedItemSafe` are unchanged; explore guard tests stay green. Smoke asserts `/polls/feed` carries no `state`/`result_summary`.
- **No DB/schema/migration changes.** No file under `migrations/` is in the commit; the new repository read composes existing columns/tables (same column set as `findPollById`) with no JOIN to vote/option/user tables.
- **No change to Official Vote transaction, vote-by-index, auth, eligibility, creator, or Raw Option Linkage Ban.** None of those modules were edited; the relevant guard tests remain green.

### 2.2 Revealed result safety — PASS

- **Visibility gate parity.** `getHomeFeed` emits a `revealed` item only inside `if (isPublicAggregateResultsReadable(poll))` — the **same** gate `getPollResults` (`GET /polls/:id/results`) uses. Collecting/cancelled/unpublished/draft polls never enter the revealed branch.
- **Display-safe reuse.** `toHomeRevealedResultSummary` reuses the existing `getResultTier` + `formatPercentage` bucketing. It reads `option.vote_count` (to compute) and `option.option_text` (→ public `display_label`) but **emits only** `{ display_mode, total_votes_display, leading_option:{ display_label, display_percentage } | null }` — no `option_id`, `option_index`, `vote_count`, or `option_text` key. `total_votes_display` is always a bucket (`30–99`/`100–499`/`500+`); polls below the presentable tier (total < 30) return `null` and are omitted.
- **No linkage/identity fields in serialized `/home/feed`.** Service test serializes the feed and asserts absence of `option_id|option_index|shard|vote_token|user_id|session|request_id|device|trace|published_at|closes_at`; a separate test proves raw per-option counts (40/20) never appear (only bucket strings). Smoke re-checks the live payload for the same forbidden fields.

### 2.3 Collecting no-leak — PASS

- The collecting branch builds only `{ state, poll_id, title, category, lifecycle_label:'收集中', published_display, vote_page_url }` — no `result_summary` or any aggregate.
- A collecting poll **with votes** is still serialized as a question-only collecting item (service test *emits collecting items with no result_summary or aggregate even when votes exist*; asserts absence of `result_summary|vote_count|percentage|rank|progress|total_votes|leading|winner|百分比|票數`).

### 2.4 Validator review — PASS

- `home-feed.js` validators use `hasExactKeys` (length + every-key membership) → **exact key-set**, and every entry point returns `false` for non-objects / unknown discriminator → **fail closed**.
- `isHomeCollectingFeedItemSafe` rejects any extra/aggregate key (`result_summary`, `vote_count`, `percentage`, `rank`, `progress`, `total`, `person_count`, `leading_option`, `winner`).
- `isHomeRevealedFeedItemSafe` rejects raw counts inside the summary (extra key), `option_id` inside `leading_option`, identity fields (extra key), revealed-with-`收集中` label, `display_mode:'collecting'/'unavailable'`, and non-bucket `total_votes_display`.
- `isHomeFeedItemSafe` dispatches on `state`; unknown/missing `state` and malformed mixed items (both states' fields) fail closed. `isHomeFeedPayloadSafe` rejects the whole payload if any item is unsafe or `next_cursor` is not `string|null`.
- **Invalid items are dropped, never rendered:** `renderHomeFeedItem` returns `null` for any item failing `isHomeFeedItemSafe`, and `renderHomeRevealedCard`/`renderHomeSwipeCard` throw on unsafe input so a leak cannot reach the DOM. All asserted in the Phase 303 frontend test (9 tests).

### 2.5 Frontend rendering — PASS

- **Collecting card:** question-only — `收集中` pill, category/freshness meta, hidden-until-reveal hint, `回答` CTA → `/vote/:id`; no aggregate.
- **Revealed card:** `已公開`/`公開鎖定期`/`鎖定期已結束` pill, display-safe leading label + bucketed percentage + bucketed total, `看完整結果` CTA → `/results/:id`; serialized card asserts no `option_id|option_index|vote_count|user_id|shard|token`.
- **Whole-card click** keeps the shared `attachWholeCardNavigation` guard: clicks whose target `.closest('a, button')` is set are ignored (CTA/keyboard activation own their behavior), and only a genuine tap navigates — a scroll/swipe never fires it. Cards are not focusable, so the snap stage does not trap focus.
- **Reduced motion** is unchanged from Phase 301: the only motion is the skeleton shimmer, disabled under `@media (prefers-reduced-motion: reduce)`, which also forces `scroll-behavior:auto`. The new revealed-card CSS adds no animation. (Phase 252/253/254 guards remain green.)

### 2.6 Test / governance reconciliation — PASS

- **Quality-badge governance allowlists (5 files):** each diff adds **only** `'public/frontend/home-feed.js'` to `FEED_PARSING_TOLERANCE_FILES` (which already contained `explore-page.js`). This is the minimal, correct change: `home-feed.js` references the field names `quality_badge`/`positive_feedback` for validation only (no badge rendering — it contains none of the `BADGE_RENDERING_JS_PATTERNS` or `回饋良好` copy). No allowlist was broadened beyond this one file, and the badge-rendering-pattern and educational-copy checks are unchanged.
- **Retired Phase 194 `server.ts` phantom-dirty pin:** the one skipped assertion compared the working-tree `server.ts` blob to its HEAD blob — a one-time Phase 194 line-ending snapshot. Phase 303 legitimately edits `server.ts` (adds the `/home/feed` route), so a perpetual working-tree-equals-HEAD pin cannot hold (it would also break during any future in-progress `server.ts` edit). It guarded git-state phantom-dirtiness, **not** backend behavior; server behavior remains covered by functional/route tests (including the new Phase 303 service test asserting the `/home/feed` route + `/polls/feed` query are present and correct). No meaningful backend/API drift guard was permanently disabled without replacement.
- **Skip count:** `it.skip` total is **14** = the 13 Phase 301 historical home-structure skips (phase-160/223/224/227/261/262×4/263×4) + the 1 Phase 194 pin. Justified and documented here and in the Phase 303 doc.

### 2.7 Smoke — PASS

- The smoke `GET /home/feed` check is **meaningful, not just HTTP 200**: it asserts `items` is an array, every item `state` is `collecting`|`revealed`, collecting items have no `result_summary`, and the serialized payload contains no `option_id|option_index|vote_count|published_at|closes_at|shard|vote_token|user_id|session|request_id|device|trace`. It also adds a `/polls/feed` guard that the explore payload stays free of `state`/`result_summary`.
- The full public flow (`/` swipe shell → registration → login → `/polls/new` → `/creator/polls` → vote-by-index → results) still passes end-to-end.

---

## 3. Findings

| # | Severity | Finding |
|---|----------|---------|
| F-1 | none (observation) | `getHomeFeed` reads vote aggregates per revealed poll in the page (N small reads). Tracked as **FU-303-02**; a batch read could reduce round-trips. No correctness/privacy impact. |
| F-2 | none (observation) | The cursor advances by the last *fetched* row, so a page may render fewer than `limit` items when low-vote revealed polls are omitted (**FU-303-01/03**). Acceptable for a freshness feed. |
| F-3 | none (observation) | Retiring the Phase 194 `server.ts` phantom-dirty pin reduces a git-state snapshot guard; backend behavior remains covered by functional tests. No action required. |

No correctness, privacy, visibility, accessibility, or boundary regression was found. **No runtime change is made by this checkpoint.**

---

## 4. Conclusion

**APPROVED.** Phase 303 (`fc3165a`) implements the public home mixed feed within all stated privacy and result-visibility boundaries: `/home/feed` is public/no-login, `/polls/feed` is unchanged, revealed items are gated by the existing `isPublicAggregateResultsReadable` rule and expose only the existing display-safe bucketed summary, collecting items never leak aggregates, frontend validators are exact-key-set and fail closed, and no option-linkage or identity fields can appear in the serialized feed. **Phase 303 is safe to build on. Phase 303-R blockers: none identified.**

Open follow-ups (carried from Phase 303, not blockers): **FU-303-01** (low-vote revealed polls omitted), **FU-303-02** (batch revealed aggregate reads), **FU-303-03** (cursor page density).

---

## 5. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean (only benign LF/CRLF warnings) |
| `npm test` | pass (554 files, 2852 passed, 14 skipped) |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | pass (Docker available) — `/`, `/polls/feed`, `/home/feed`, and the full registration/login/create/vote/results flow |
