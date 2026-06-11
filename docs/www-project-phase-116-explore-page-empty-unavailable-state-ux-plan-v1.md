# WWW Project Phase 116 — Explore Page Empty / Unavailable State UX Plan v1

**Status:** docs/spec only. Defines future explore-page frontend UX and copy boundaries for live feed success, empty feed, load failure, transport/network/server errors, static homepage examples versus live `/explore` feed separation, and non-collecting poll exclusion on `GET /explore`. No runtime behavior, frontend JS/CSS, backend, API, DB schema, migration, `UserAuthResolver`, vote evaluator, result evaluator, Official Vote transaction order, `GET /polls/feed` behavior, vote token schema, counter schema, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 115 results page runtime review checkpoint. Phase 63 delivered `GET /explore` consuming `GET /polls/feed` as a freshness-only, collecting-only public list. The existing explore runtime in `explore-page.js` already distinguishes loading, empty, error, and populated feed states; Phase 116 plans a fuller empty/unavailable-state copy and UX boundary map for a later runtime phase.

**Prior checkpoint:** [Phase 115 results page runtime review](./www-project-phase-115-results-page-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

The public explore page (`GET /explore`) lists collecting polls from the existing freshness-only feed API. Users need consistent, neutral messages when the live feed has items, when it is empty, when the client cannot load the list, and when static homepage examples must remain clearly separate from live discovery.

Phase 116 plans:

1. recommended copy and display rules for each explore-page scenario listed below.
2. UX boundaries for what may and may not be shown on `/explore`.
3. privacy guard requirements preserving Raw Option Linkage Ban on the explore surface.
4. compatibility constraints with vote, `vote-by-index`, results, registration, login, profile, and Reference Answer boundaries.
5. future runtime implementation notes for a later phase only.

**Core principle:** Explore pages may show only **display-safe poll summary** fields already allowed by the existing feed API contract. Explore UX must not become a voter-state explainer, eligibility checker, counter preview, ranking surface, or option-linkage surface.

---

## 2. Non-Goals

Phase 116 does **not**:

- implement runtime, frontend JS/CSS, backend, API, schema, or migration changes.
- add or change `GET /polls/feed` behavior, feed evaluator logic, freshness-only ordering rules, or collecting-only filter semantics.
- add ranking personalization, demographic breakdown, analytics linkage, hot/trending boards, or answer-direction ranking signals.
- change `UserAuthResolver`, vote evaluator logic, result evaluator logic, or Official Vote transaction order.
- expose whether the current visitor voted, which option they chose, whether they are eligible, or whether profile setup is complete.
- expose counters, result previews, vote totals, percentages, rankings, trends, or growth signals on explore cards.
- expose `option_id`, raw counters, shard internals, vote token internals, session, cookie, or `user_id` on the explore page.
- connect Reference Answer to `UserAuthResolver` or profile eligibility.
- create durable option choice + user/session/device/request/log/trace/metric/error payload linkage.
- echo raw backend error payloads, internal denial reasons, or server stack details in user-visible copy.
- merge homepage static example cards into the live `/explore` feed.

---

## 3. Scenario Catalog

Future runtime may bucket multiple backend outcomes into the same neutral user message when required to avoid rule, voter-state, or option-linkage leakage. This phase defines the **user-visible** target shape only; it does not change server error codes or response bodies.

### 3.1 Live feed has collecting polls

Applies when `GET /polls/feed` returns one or more display-safe collecting poll summaries.

| UX rule | Requirement |
|---------|-------------|
| May show | Public poll list cards from the live feed: title, category label, collecting badge, freshness-only published label, link to `/vote/:pollId`. |
| Must not show | Vote counts, result previews, percentages, rankings, trends, hot badges, personalized ordering, eligibility badges, or “you already voted” state. |
| Must not do | Re-sort client-side by answer direction, popularity, or visitor profile. |

Recommended status copy when items are visible:

```text
顯示公開問卷列表
```

Optional supporting copy (non-identifying only):

```text
依最近發布排序；非熱門、票數、個人化或榜單。
```

### 3.2 Live feed empty

Applies when the feed API succeeds and returns zero collecting polls eligible for public explore.

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral empty-state notice; optional link to create a poll or return home. |
| Must not show | Placeholder mock polls, static homepage examples, counters, or voter/profile state. |
| Must not do | Imply that the visitor caused the empty list or that specific users are absent. |

Recommended copy:

```text
目前沒有正在收集中的公開問卷
```

Optional supporting copy:

```text
你可以先發起一則問卷並分享投票連結。
```

### 3.3 Load / network / server failure

Covers JSON parse failure, transport failure, non-OK feed fetch, and unsafe or unexpected feed payload where lifecycle-specific copy must not be inferred from raw backend data.

| UX rule | Requirement |
|---------|-------------|
| May show | One neutral retry-oriented message. |
| Must not show | HTTP status text, backend `error` codes, raw `message` fields, stack traces, feed cursor internals, or option/vote internals. |
| Must not do | Echo raw backend payload into the DOM or status region. |

Recommended copy:

```text
目前無法載入探索列表，請稍後再試
```

Optional pagination-specific copy when a later page fails but earlier cards remain visible:

```text
無法載入更多問卷，請稍後再試。
```

### 3.4 Static examples (homepage and other mock surfaces)

Homepage “範例問卷” cards and other static demo cards are **not** part of the live explore feed.

| UX rule | Requirement |
|---------|-------------|
| May show | Clearly labeled static examples on `/` or other mock/demo pages only. |
| Must not show | Static examples inside `/explore` live feed list, or mixed ordering with live feed cards. |
| Must not do | Present static examples as if they were freshness-ranked collecting polls from `GET /polls/feed`. |

Recommended labeling copy:

```text
下方卡片為靜態範例，僅供預覽各狀態文案。
```

Supporting boundary copy:

```text
即時探索列表請前往 /explore；首頁範例卡不混入 live feed。
```

### 3.5 Non-collecting polls

Cancelled, unpublished, revealed, locked, post-lock, suspended, draft, or otherwise non-collecting polls must not appear in the live explore feed.

| UX rule | Requirement |
|---------|-------------|
| May show | Nothing for those polls on `/explore`; users discover them only through direct share links or other allowed routes. |
| Must not show | Non-collecting lifecycle badges, archived counters, or result previews inside explore cards. |
| Must not do | Client-side reinsertion of non-collecting polls from cached payloads, homepage examples, or admin/debug data. |

Boundary statement:

```text
非收集中問卷不在 live explore feed 顯示。
```

---

## 4. UX Boundaries Summary

### 4.1 Counter-free and result-free explore surface

- `/explore` must not display vote counts, result previews, percentages, rankings, trends, hot badges, or growth signals.
- Feed ordering remains freshness-only per existing `GET /polls/feed` contract; explore UX must not add personalized or answer-direction sorting.

### 4.2 No voter personal state or eligibility display

Explore pages must not display:

- whether the current visitor voted;
- whether the current visitor is eligible or ineligible;
- whether profile setup is complete;
- duplicate-vote state, trust outcome, age outcome, or region outcome for the current visitor.

Explore must not call `GET /users/me`, `GET /users/me/profile`, vote APIs, or result APIs for card rendering logic.

### 4.3 No option-level linkage or internal identifiers

Explore pages must not display or infer:

- `option_id` or option text tied to a visitor;
- raw counter rows or shard identifiers;
- vote token or token hash;
- session, cookie, or `user_id`;
- backend denial reason text tied to a visitor or request;
- exposure, click, or vote-intent analytics tied to a traceable identifier.

### 4.4 Live feed versus static examples

- `/explore` is the only public route for the live freshness-only collecting feed.
- Homepage and other mock/demo pages may keep static example cards, but those cards must remain explicitly labeled and physically separate from the live feed DOM.

### 4.5 Read-only discovery surface

- Explore remains a read-only public discovery surface.
- It must not submit votes, resolve `option_index` → `option_id` for visitor state, or use profile eligibility APIs for ranking or card visibility.

---

## 5. Privacy Guard and Raw Option Linkage Ban

Explore UX must preserve the project Raw Option Linkage Ban:

1. Explore feed items may present only **display-safe poll summary** fields already allowed by the existing feed API contract.
2. Explore UX must not link poll exposure, card clicks, option curiosity, or vote intent to a user, session, device, request, log, trace, metric, error payload, or analytics record.
3. Empty, unavailable, and failure states must remain option-identity-free with respect to visitor identity.
4. Error and unavailable copy must not echo raw backend payloads that could expose option-level or voter-level internals.
5. Future runtime tests and fixtures for this area must not encode durable `user + poll + option` records or raw denial reasons in copy guards.

---

## 6. Compatibility

Phase 116 must remain compatible with existing boundaries:

| Area | Constraint |
|------|------------|
| Vote page | Vote success/failure copy and page-local option clearing remain unchanged by this plan phase. |
| `vote-by-index` | Eligibility before option resolve remains vote-time authority only. |
| Results page | `GET /polls/:id/results` aggregate display rules remain unchanged; explore must not preview results. |
| Registration | `POST /registration` remains credential/profile creation only; no auto-login or explore linkage. |
| Login session | `POST /login/session` remains the formal session boundary. |
| Profile | `GET /users/me/profile` remains for profile setup and pre-vote hints only; explore must not use it for eligibility or voter-state display. |
| Reference Answer | Remains disconnected from `UserAuthResolver` and profile eligibility. |
| Feed API | `GET /polls/feed` response shape and freshness-only collecting filter remain authoritative; this plan does not add new feed endpoints. |

---

## 7. Future Runtime Implementation Notes

**Not this phase.** A later runtime phase may:

- align `explore-page.js` and `explore.html` empty/unavailable/load-failure copy with Section 3 recommended messages where current copy differs;
- tighten empty-state wording from legacy “可探索” phrasing to “正在收集中的公開問卷” where product copy should match this plan;
- add focused frontend guard tests for live/static separation, counter suppression, neutral failure copy, and collecting-only card rendering;
- add docs/review checkpoint coverage after runtime polish lands.

A later runtime phase must **not**:

- add feed APIs, change feed ordering rules, or expose counters or result previews on explore cards;
- add personalized ranking, hot boards, demographic breakdown, or eligibility badges;
- call `GET /users/me`, `GET /users/me/profile`, vote APIs, or result APIs from the explore page for display logic;
- merge homepage static example cards into `/explore`;
- store selected options, vote history, or feed personalization in `localStorage`, `sessionStorage`, IndexedDB, cookies, URL state, or durable client caches;
- add logs, metrics, analytics, APM traces, or error payloads that link explore impressions or clicks to a traceable visitor identity.

Candidate runtime files for a future phase (reference only):

- `public/frontend/explore-page.js`
- `public/explore.html`
- `public/index.html` (static example labeling only; not live feed mixing)
- `public/frontend/public-mvp-ui.js`

---

## Validation

Required validation for this phase:

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
