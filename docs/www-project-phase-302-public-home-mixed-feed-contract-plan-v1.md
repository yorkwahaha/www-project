# WWW Project Phase 302 — Public Home Mixed Feed Contract Plan v1

**Status:** plan / design / docs + docs-test + README only. Designs the **future** public home mixed feed contract that will let the Phase 301 homepage swipe shell render both collecting cards (question-only) and revealed cards (public-safe result summaries). **No runtime, backend, DB, schema, migration, or frontend implementation in this phase.**

**No runtime, API, DB, schema, migration, auth resolver, creator ownership, lifecycle, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `/polls/feed` contract, logging, metrics, analytics, deploy, or production configuration changed by this phase.** This is a design document only.

**Baseline commit:** `fa46df1` (`origin/master` after Phase 301-R approval).
**Reviewed delivery docs:** `docs/www-project-phase-301-home-swipe-card-visual-shell-v1.md`, `docs/www-project-phase-301r-home-swipe-card-visual-shell-runtime-review-checkpoint-v1.md`.

> **Phase-number note:** "302" is shared with the unrelated release-documentation artifact [Phase 302 cross-model verification handoff packet](./www-project-phase-302-cross-model-verification-handoff-packet-v1.md). This Phase 302 document is the **public home mixed feed contract plan** frontend-feature track only.

> **Prior context:** [Phase 301 home swipe card visual shell](./www-project-phase-301-home-swipe-card-visual-shell-v1.md) (`57f023e`) and [Phase 301-R runtime review checkpoint](./www-project-phase-301r-home-swipe-card-visual-shell-runtime-review-checkpoint-v1.md) (approved at `fa46df1`). FU-301-01 is the driver: revealed-result home cards require a feed contract change. This plan satisfies FU-301-01 at the design level only.

---

## 1. Problem and current state

The Phase 301 home swipe shell consumes the existing collecting-only `GET /polls/feed`, whose item shape is fixed and guarded:

```
{ poll_id, title, category, status: 'active', published_display: '最近發布', result_page_url, quality_badge }
```

`isExploreFeedItemSafe` enforces an **exact key set** and `status === 'active'`, so the feed can only carry collecting polls. The results read model (`GET /polls/:pollId/results` → `PollResultDisplay`) is the only public surface that exposes aggregates, and it does so **display-safe only**:

- visibility gated by `isPublicAggregateResultsReadable(poll)` (revealed / locked / post-lock states only);
- `total_votes_display` is a **bucket** (`'30–99' | '100–499' | '500+'`), never a raw count;
- option `display_percentage` / `display_count` are bucketed/rounded strings or `null`;
- options are addressed by `option_index` + `display_label` only (Raw Option Linkage Ban).

**Design principle:** a revealed home feed item may expose **only what `GET /polls/:pollId/results` would already expose for that poll in its current state**, computed behind the **same** visibility gate. The home feed introduces no new aggregate surface — it re-presents the existing display-safe one in a compact form.

---

## 2. Decision: new `GET /home/feed` endpoint (do **not** extend `/polls/feed`)

**Recommendation: add a new home-specific endpoint `GET /home/feed` in a future phase; leave `/polls/feed` unchanged.**

Rationale:

| Option | Verdict | Why |
|--------|---------|-----|
| Extend `/polls/feed` to mix states | ✗ Rejected | `/polls/feed` is contractually freshness-only / collecting-only, asserted by `isExploreFeedItemSafe` (exact keys, `status==='active'`), the explore page, and many guard tests/docs (Phase 117/118/168/169/198/260/261…). Mixing revealed items would break explore’s safety guarantee and a large guard surface, and would couple explore to result visibility. |
| New `GET /home/feed` | ✓ Recommended | Isolates the mixed feed to the home; keeps `/polls/feed` and explore exactly as-is (zero contract change); lets the home own a discriminated-union item with state-specific validators; no personalization/ranking — still freshness-ordered. |

`/home/feed` reuses the **same** cursor/limit pagination and freshness ordering as `/polls/feed` (no popularity/ranking, no personalization). It composes two existing read models (public feed rows + the display-safe results display) — see §8.

---

## 3. Proposed payload shape (future contract)

```
GET /home/feed?limit=<1..N>&cursor=<opaque>
200 application/json
{
  "items": [
    {
      "state": "collecting",
      "poll_id": "11111111-1111-4111-8111-111111111111",
      "title": "週末你更想宅在家，還是出門走走？",
      "category": "life",
      "lifecycle_label": "收集中",
      "published_display": "最近發布",
      "vote_page_url": "/vote/11111111-1111-4111-8111-111111111111"
    },
    {
      "state": "revealed",
      "poll_id": "22222222-2222-4222-8222-222222222222",
      "title": "遠端工作一週幾天最適合？",
      "category": "workplace",
      "lifecycle_label": "已公開",
      "published_display": "最近發布",
      "result_page_url": "/results/22222222-2222-4222-8222-222222222222",
      "result_summary": {
        "display_mode": "bucketed_percentage",
        "total_votes_display": "100–499",
        "leading_option": { "display_label": "三天", "display_percentage": "約 42%" }
      },
      "quality_badge": null
    }
  ],
  "next_cursor": "v1.<opaque>" 
}
```

Notes:

- `state` is the **discriminator** (`'collecting' | 'revealed'`). Unknown/missing → fail closed.
- `result_summary` fields are a strict subset of the existing `PollResultDisplay` display-safe fields. `total_votes_display` reuses the existing bucket vocabulary (`'30–99' | '100–499' | '500+'`). `leading_option.display_percentage` is the existing bucketed/rounded string (e.g. `約 42%`), never a raw ratio; `leading_option` may be `null` when the results page would not surface a single leading label.
- `result_summary` carries **at most** a single leading display-safe option label — not a full per-option breakdown. The full breakdown stays on `/results/:pollId`. (Conservative default; a future phase may decide to include the same bucketed option list the results page shows, but only that, never raw counts.)
- `lifecycle_label` is the existing `PUBLIC_POLL_LIFECYCLE_*` label; for revealed items it must be one of `已公開 / 公開鎖定期 / 鎖定期已結束`.

---

## 4. Validator strategy (state-specific, fail-closed)

Three frontend validators (mirroring the existing `isExploreFeedItemSafe` exact-key-set discipline), to be implemented in the future phase:

### `isHomeCollectingFeedItemSafe(item)`
- `item.state === 'collecting'`.
- **Exact** key set: `{ state, poll_id, title, category, lifecycle_label, published_display, vote_page_url }` — no more, no fewer.
- `lifecycle_label === '收集中'`; `published_display === '最近發布'`; `vote_page_url === '/vote/' + poll_id`.
- Reject if **any** result/aggregate field is present (`result_summary`, `result_page_url`, counts, percentages, etc.). Because the key set is exact, any extra key fails closed.

### `isHomeRevealedFeedItemSafe(item)`
- `item.state === 'revealed'`.
- **Exact** key set: `{ state, poll_id, title, category, lifecycle_label, published_display, result_page_url, result_summary, quality_badge }`.
- `lifecycle_label ∈ { 已公開, 公開鎖定期, 鎖定期已結束 }`; `result_page_url === '/results/' + poll_id`.
- `result_summary` exact key set `{ display_mode, total_votes_display, leading_option }` where:
  - `display_mode ∈ { bucketed_percentage, rounded_with_bucketed_votes, precise }` (existing display modes; never `collecting`/`unavailable`);
  - `total_votes_display ∈ { '30–99', '100–499', '500+' }` (bucketed only; never a raw number, never `收集中`/`結果不可用`);
  - `leading_option` is `null` or exact key set `{ display_label, display_percentage }` with `display_percentage` a bucketed/rounded display string.
- `quality_badge ∈ { null, 'positive_feedback' }`.
- Reject if any forbidden field appears (raw counts, `option_index`/`option_id`/`option_text` linkage, per-vote records, non-public aggregates, collecting counters, identity fields).

### `isHomeFeedItemSafe(item)` — shared discriminated-union dispatcher
- Switch on `item.state`: `'collecting'` → collecting validator; `'revealed'` → revealed validator; anything else (including missing) → **`false`** (fail closed).
- Because each branch enforces an exact key set, an item carrying the *other* state’s fields is rejected (see §5).

### `isHomeFeedPayloadSafe(body)`
- `body.items` is an array and **every** item passes `isHomeFeedItemSafe`; `body.next_cursor` is `string | null`. Any failure rejects the whole payload (fail closed).

---

## 5. Preventing collecting items from accepting revealed fields (and vice versa)

- **Exact key-set equality per state** (not a subset check). A collecting item with an extra `result_summary` (or any aggregate) has a key set ≠ the collecting allowlist → rejected. A revealed item missing `result_summary`, or carrying a collecting `lifecycle_label`, fails the revealed allowlist → rejected.
- The dispatcher never "falls through": unknown/missing `state` returns `false`. There is no default that renders.
- Frontend rendering dispatches on the **validated** `state`; an item that fails its validator is **dropped, not rendered** (no partial render, no best-effort).

---

## 6. Preventing revealed results before visibility rules allow

- **Server-side (future impl):** `/home/feed` computes a `revealed` item **only** when `isPublicAggregateResultsReadable(poll)` is true — the **same** gate `GET /polls/:pollId/results` uses. Collecting/cancelled/unpublished/draft polls are emitted as `collecting` items or omitted; they never receive a `result_summary`. The `result_summary` is derived from the same `toPollResultDisplay` display-safe output, so the feed cannot show anything the results page would not.
- **Client-side (defense in depth):** `isHomeRevealedFeedItemSafe` requires a revealed `lifecycle_label` and a display-safe `result_summary`; a revealed item with a collecting label, a non-bucketed total, or `display_mode: collecting/unavailable` is rejected. The frontend never infers visibility from any other signal.
- **Result:** visibility is decided once, server-side, by the existing rule; the client only renders gated, display-safe data and re-validates it.

---

## 7. Frontend consumption (Phase 301 swipe shell, future wiring)

- `mountHomeSwipeFeed` would fetch `/home/feed` (new `fetchHomeFeedPage`, mirroring `fetchExploreFeedPage`: `credentials: 'omit'`, `cache: 'no-store'`, payload validated by `isHomeFeedPayloadSafe`). `/polls/feed` + explore stay untouched.
- Card dispatch by validated `state`:
  - `collecting` → existing `renderHomeSwipeCard` (unchanged): title · `收集中` pill · category/freshness · hidden-until-reveal hint · `回答` CTA → `/vote/:id`.
  - `revealed` → new `renderHomeRevealedCard` (future): title · revealed lifecycle pill · category/freshness · display-safe `result_summary` (e.g. leading label + bucketed `約 42%`) · `看結果` CTA → `/results/:id`. The card itself shows the public-safe answer; whole-card click → results page, with the same `closest('a, button')` guard so the CTA/keyboard/swipe are never hijacked.
- Items failing validation are skipped. Loading/empty/error/skeleton states are unchanged from Phase 301.
- Reduced-motion, snap-stage, and "no focus trap" behaviors are unchanged.

---

## 8. Migration / DB impact

- **No DB/schema/migration change required, and none is proposed in this plan.** Both data sources already exist:
  - collecting rows: existing `listPublicFeedPolls` (freshness-ordered, cursor).
  - revealed display-safe summaries: existing `toPollResultDisplay` output behind `isPublicAggregateResultsReadable`.
- The future implementation phase would add **service/route composition only**: a `/home/feed` route, a service method that pages freshness-ordered public polls and attaches a display-safe `result_summary` for those whose state passes the results visibility gate, and a possible **read-only** batch repository helper to fetch display-safe aggregates for multiple revealed poll ids (code, not schema). Any such helper must reuse the existing bucketing logic — it must not read or expose raw counts beyond what the results display already computes.
- **If** a future implementer believes a schema/index change is warranted (e.g. a covering index for revealed-poll freshness ordering), it must be split into its **own** migration-bearing phase with explicit review — **not** folded into the feed contract phase.

---

## 9. Auth boundary (unchanged)

- Browsing `/home/feed` is **public / no-login**, exactly like `/polls/feed`.
- Create / manage own polls / profile remain **login-gated** (unchanged).
- **Voting eligibility stays vote-time only** and must never be inferred from or surfaced by the home feed. `/home/feed` items carry no eligibility, no per-user state, no `can_vote`/`age_passed`/`region_passed`, no session/token/device/request identity.

---

## 10. Privacy invariants (must hold in the future implementation)

1. A `collecting` item never carries any aggregate / count / percentage / rank / trend / progress / total / person-count / option-level result / winner / hidden counter.
2. A `revealed` item exposes **only** display-safe fields already exposed by `GET /polls/:pollId/results` for that poll’s state, computed behind `isPublicAggregateResultsReadable`.
3. No item ever links a user / session / vote token / device / request identity to an option, nor exposes raw vote records or `option_id`/`option_text` linkage (Raw Option Linkage Ban; options are `option_index` + display label only).
4. `total_votes_display` is always a bucket string; never a raw integer.
5. Unknown/missing `state` or any unexpected key fails closed (item dropped; payload rejected).
6. Freshness ordering only — no popularity, ranking, or personalization signal in request or response.

### Allowed vs forbidden payload examples

**Allowed — collecting:**
```
{ "state":"collecting","poll_id":"…","title":"…","category":"life",
  "lifecycle_label":"收集中","published_display":"最近發布","vote_page_url":"/vote/…" }
```
**Forbidden — collecting leaking aggregate (must be rejected):**
```
{ "state":"collecting", …, "vote_count": 128 }                      // extra key → reject
{ "state":"collecting", …, "result_summary": { … } }               // revealed field on collecting → reject
{ "state":"collecting", …, "total_votes_display": "100–499" }      // aggregate on collecting → reject
```
**Allowed — revealed (display-safe):**
```
{ "state":"revealed","poll_id":"…","title":"…","category":"workplace",
  "lifecycle_label":"已公開","published_display":"最近發布","result_page_url":"/results/…",
  "result_summary":{ "display_mode":"bucketed_percentage","total_votes_display":"100–499",
                     "leading_option":{ "display_label":"三天","display_percentage":"約 42%" } },
  "quality_badge": null }
```
**Forbidden — revealed leaking raw/linkage/identity (must be rejected):**
```
"result_summary": { "total_votes": 327 }                            // raw count → reject
"result_summary": { …, "leading_option": { "option_id":"abc", … } } // option linkage → reject
{ "state":"revealed", …, "voter_id":"…" }                           // identity → reject
{ "state":"revealed", …, "lifecycle_label":"收集中" }               // revealed before allowed → reject
"result_summary": { "display_mode":"collecting", … }                // collecting summary on revealed → reject
```

---

## 11. Test plan (to be authored in the future implementation phase)

1. **Collecting rejects aggregates:** `isHomeCollectingFeedItemSafe` returns `false` for items adding `vote_count` / `percentage` / `rank` / `trend` / `progress` / `total` / person-count / `result_summary` / `result_page_url`.
2. **Revealed accepts only display-safe summary:** `isHomeRevealedFeedItemSafe` accepts the bucketed `result_summary`; rejects raw counts, non-bucketed totals, `display_mode: collecting/unavailable`, and full raw option breakdowns.
3. **Separate validators:** collecting and revealed validators are independent; neither accepts the other’s exact key set.
4. **Discriminated union fails closed:** `isHomeFeedItemSafe` returns `false` for unknown/missing `state`; `isHomeFeedPayloadSafe` rejects the whole payload if any item is unsafe.
5. **Malformed mixed item fails closed:** an item carrying both collecting and revealed fields is rejected.
6. **No option linkage fields:** any `option_id` / `option_text` / raw option array beyond `display_label` is rejected.
7. **No identity fields:** any `user_id` / `session` / `token` / `request_id` / `device` field is rejected.
8. **Visibility gate parity:** revealed items only appear when the results visibility gate would allow the results page to show aggregates (server-side test against `isPublicAggregateResultsReadable`).
9. **Endpoint isolation:** `/polls/feed` payload and `isExploreFeedItemSafe` remain unchanged (explore guard tests still green).
10. **Auth/freshness:** `/home/feed` requires no login; request/response carry no eligibility/personalization/ranking signal; ordering remains freshness-only.

---

## 12. Approval / rejection checklist for the future implementation phase

A future "Phase N — Public Home Mixed Feed Contract Implementation" may proceed **only if all** of the following hold; otherwise **reject**:

- [ ] Adds `GET /home/feed`; **does not modify** `/polls/feed` or `isExploreFeedItemSafe`.
- [ ] Revealed `result_summary` is derived from the existing `toPollResultDisplay` display-safe output behind `isPublicAggregateResultsReadable` — no new aggregate computation, no raw counts.
- [ ] Ships `isHomeCollectingFeedItemSafe`, `isHomeRevealedFeedItemSafe`, `isHomeFeedItemSafe` (union), `isHomeFeedPayloadSafe` with exact key-set discipline and fail-closed defaults.
- [ ] All §11 tests present and green; explore guard tests unchanged and green.
- [ ] No schema/migration change (or, if truly required, split into a separate migration-bearing phase with review).
- [ ] No search box, no category filter, no popularity/ranking, no personalization, no eligibility surfacing.
- [ ] `/home/feed` is public/no-login; create/manage/profile stay login-gated; voting eligibility stays vote-time only.
- [ ] Frontend dispatches on validated `state`, drops invalid items, and keeps Phase 301 accessibility/reduced-motion/whole-card-click guards.
- [ ] `design-drafts/` not committed; `stash@{0}` not popped/reused.

**If any box cannot be checked, the implementation phase is rejected and returns to design.**

---

## 13. Recommendation, risks, and next phase

- **Recommendation:** adopt the **new `GET /home/feed` discriminated-union** contract (§2–§4) for the future implementation; keep `/polls/feed` frozen.
- **Risks:**
  - *Aggregate leakage* — mitigated by reusing the gated display-safe results model + exact-key-set validators + fail-closed union.
  - *Visibility drift* — mitigated by computing revealed items behind the **same** `isPublicAggregateResultsReadable` gate as the results page (single source of truth).
  - *Explore coupling* — avoided entirely by not touching `/polls/feed`.
  - *Scope creep* (ranking/search/personalization) — explicitly out of scope and gated by the §12 checklist.
- **Proposed next implementation phase:** **Phase 303 (proposed) — Public Home Mixed Feed Contract Implementation**: add `GET /home/feed`, the four validators, `fetchHomeFeedPage`, and `renderHomeRevealedCard`; wire `mountHomeSwipeFeed` to dispatch on `state`; author the §11 tests. Backend route + frontend wiring only; no DB/schema/migration.

**Phase 302 plan status: design complete, ready for review.** No code changed.

---

## 14. Validation

| Gate | Result |
|------|--------|
| `git diff --check` | clean (only benign LF/CRLF warnings) |
| `npm test` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run smoke:public:local` | not required (docs/tests only; no runtime change) |
