# WWW Project Phase 119 — My Polls Empty / Unavailable State UX Plan v1

**Status:** docs/spec only. Defines future my-polls frontend UX and copy boundaries for unsigned-in access, local/demo `creator_session` unavailability, owned-list empty, load failure, transport/network/server errors, and lifecycle-state display on `GET /my-polls` and `GET /my-polls?live=1`. No runtime behavior, frontend JS/CSS, backend, API, DB schema, migration, `UserAuthResolver`, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `GET /creator/polls` behavior, `creator_session` boundary, vote token schema, counter schema, Reference Answer, ranking, personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 118 explore page runtime review checkpoint. Phase 65c delivered `GET /my-polls?live=1` consuming `GET /creator/polls` through local/demo `creator_session`. The existing my-polls runtime in `my-polls-page.js` already distinguishes mock dashboard rows, live owned-list loading, empty state, and load failure; Phase 119 plans a fuller empty/unavailable-state copy and UX boundary map for a later runtime phase.

**Prior checkpoint:** [Phase 118 explore page runtime review](./www-project-phase-118-explore-page-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

The my-polls surface (`GET /my-polls`, `GET /my-polls?live=1`) helps creators review polls they own. Users need consistent, neutral messages when they are not signed in for the intended flow, when local/demo `creator_session` is unavailable, when the owned list is empty, when the client cannot load owned polls, and when lifecycle states are shown without vote counters or voter linkage.

Phase 119 plans:

1. recommended copy and display rules for each my-polls scenario listed below.
2. UX boundaries for what may and may not be shown on `/my-polls` and `/my-polls?live=1`.
3. privacy guard requirements preserving Raw Option Linkage Ban on the creator-owned list surface.
4. compatibility constraints with vote, `vote-by-index`, results, explore, registration, login, profile, and Reference Answer boundaries.
5. future runtime implementation notes for a later phase only.

**Core principle:** My Polls pages may show only **creator-safe poll summary** fields already allowed by the existing creator-owned list API and mock dashboard contract. My Polls UX must not become a voter-state explainer, eligibility checker, counter preview, or option-linkage surface.

**Creator session boundary:** `creator_session` remains local/demo/test creator flow only. It is not production identity and must not be reframed as production user login in this plan phase.

---

## 2. Non-Goals

Phase 119 does **not**:

- implement runtime, frontend JS/CSS, backend, API, schema, or migration changes.
- add or change `GET /creator/polls` behavior, creator ownership rules, lifecycle transition APIs, or `creator_session` issuance semantics.
- change `UserAuthResolver`, vote evaluator logic, result evaluator logic, or Official Vote transaction order.
- reclassify `creator_session` as production identity or merge it with `POST /login/session`.
- expose whether visitors voted, which option they chose, whether they are eligible, or whether profile setup is complete.
- expose vote counters, result previews, vote totals, percentages, rankings, trends, voter identity, or answer-direction signals on my-polls cards or rows.
- expose `option_id`, raw counters, shard internals, vote token internals, voter session, or durable voter `user_id` on the my-polls surface.
- connect Reference Answer to `UserAuthResolver` or profile eligibility.
- create durable option choice + user/session/device/request/log/trace/metric/error payload linkage.
- echo raw backend error payloads, internal denial reasons, or server stack details in user-visible copy.
- add observability linkage between poll-owner view and option choice, vote intent, or voter identity.

---

## 3. Scenario Catalog

Future runtime may bucket multiple backend outcomes into the same neutral user message when required to avoid rule, voter-state, or option-linkage leakage. This phase defines the **user-visible** target shape only; it does not change server error codes or response bodies.

### 3.1 Not signed in

Applies when the visitor cannot access an owned poll list because the required creator or account boundary for the selected mode is not established.

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral sign-in guidance; link to the appropriate login or live creator entry path. |
| Must not show | Owned poll rows, vote counters, result previews, voter/profile state, or backend denial internals. |
| Must not do | Imply which polls exist before access is granted. |

Recommended copy:

```text
請先登入後查看你建立的問卷
```

Optional supporting copy for live/demo creator mode (non-production identity only):

```text
即時管理請使用 ?live=1 與 creator_session；此為本機／展示用發起者流程，非 production 登入。
```

### 3.2 Local/demo creator session unavailable

Applies when `GET /my-polls?live=1` cannot establish or use local/demo `creator_session`, including missing session cookie, failed `POST /creator/session`, or creator-auth rejection before owned-list fetch.

| UX rule | Requirement |
|---------|-------------|
| May show | One neutral retry-oriented message. |
| Must not show | HTTP status text, backend `error` codes, raw `message` fields, `creator_id`, session internals, or voter/profile state. |
| Must not do | Echo raw backend payload into the DOM or status region. |

Recommended copy:

```text
目前無法載入你建立的問卷，請稍後再試
```

### 3.3 Owned list empty

Applies when `GET /creator/polls` succeeds and returns zero owned polls for the current creator session.

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral empty-state notice; optional link to `GET /polls/new?live=1`. |
| Must not show | Mock dashboard rows mixed into the live owned-list region, counters, voter state, or placeholder polls pretending to be owned. |
| Must not do | Imply voter participation or absence. |

Recommended copy:

```text
你目前還沒有建立問卷
```

Optional supporting copy:

```text
你可以先建立一則問卷並分享投票連結。
```

### 3.4 Load / network / server failure

Covers JSON parse failure, transport failure, non-OK owned-list fetch, and generic failures where lifecycle-specific copy must not be inferred from raw payload.

| UX rule | Requirement |
|---------|-------------|
| May show | One neutral retry-oriented message. |
| Must not show | HTTP status text, backend `error` codes, raw `message` fields, stack traces, or option/vote internals. |
| Must not do | Echo raw backend payload into the DOM or status region. |

Recommended copy:

```text
目前無法載入你建立的問卷，請稍後再試
```

### 3.5 Lifecycle states on owned poll summary

Applies when owned polls are listed on `/my-polls?live=1` or shown in the mock dashboard on `/my-polls`.

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral lifecycle badges/labels, poll title, category or time hints already safe for creator view, management links, and lifecycle actions allowed by existing creator controls. |
| Must not show | Vote counts, result previews, percentages, rankings, trends, voter identity, or whether any visitor voted. |
| Must not do | Reveal answer-direction signals or option-level engagement on the list surface. |

Recommended neutral lifecycle labels:

| `public_lifecycle_state` | Recommended label |
|--------------------------|-------------------|
| `draft` | 草稿 |
| `collecting` | 收集中 |
| `revealed` | 已公開 |
| `locked` | 公開鎖定期 |
| `cancelled` | 已取消 |
| `unpublished` | 已下架 |

`post_lock` may continue to use a neutral label such as `鎖定期已結束` where the existing mock dashboard already distinguishes it from `locked`. All lifecycle labels remain counter-free.

### 3.6 Mock dashboard without `?live=1`

`GET /my-polls` without `?live=1` remains a static/mock creator dashboard for demonstration. It must stay visually and structurally separate from the live owned-list region injected on `?live=1`.

| UX rule | Requirement |
|---------|-------------|
| May show | Clearly labeled mock rows and demo-only action feedback. |
| Must not show | Live owned polls mixed into mock rows without mode labeling. |
| Must not do | Present mock rows as if they came from `GET /creator/polls`. |

---

## 4. UX Boundaries Summary

### 4.1 Creator-safe owned list only

- `/my-polls?live=1` may show only creator-safe poll summary fields from `GET /creator/polls`.
- Mock `/my-polls` may show demonstration rows only; they must not be mistaken for live owned-list results.

### 4.2 Counter-free and voter-free surface

- My Polls must not display vote counts, result previews, percentages, rankings, trends, or voter identity.
- Collecting lifecycle rows must not show in-progress totals or answer-direction hints.

### 4.3 No voter personal state or eligibility display

My Polls pages must not display:

- whether the current visitor voted;
- whether the current visitor is eligible or ineligible;
- whether profile setup is complete;
- duplicate-vote state, trust outcome, age outcome, or region outcome for any visitor.

My Polls must not call `GET /users/me`, `GET /users/me/profile`, vote APIs, result APIs, or Reference Answer paths for list rendering logic.

### 4.4 No option-level linkage or internal identifiers

My Polls pages must not display or infer:

- `option_id` or option text tied to a voter;
- raw counter rows or shard identifiers;
- vote token or token hash;
- backend denial reason text tied to a visitor or request;
- durable linkage between poll-owner view and a visitor's option choice.

### 4.5 No backend payload echo

- Empty, unavailable, and failure states must use frontend-owned neutral copy.
- Error and unavailable messaging must not echo raw API `error`, `message`, or stack details.

### 4.6 Creator session boundary preserved

- `creator_session` remains local/demo/test creator flow only.
- This plan does not promote `creator_session` to production identity or merge it with production login session semantics.

---

## 5. Privacy Guard and Raw Option Linkage Ban

My Polls UX must preserve the project Raw Option Linkage Ban:

1. Owned-list items may present only **creator-safe poll summary** data from the existing creator-owned list API or approved mock dashboard fields.
2. My Polls UX must not link poll-owner list views, management clicks, or lifecycle actions to a visitor's option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.
3. Empty, unavailable, and failure states must remain option-identity-free with respect to voter identity.
4. Error and unavailable copy must not echo raw backend payloads that could expose option-level or voter-level internals.
5. Future runtime tests and fixtures for this area must not encode durable `user + poll + option` records or raw denial reasons in copy guards.

---

## 6. Compatibility

Phase 119 must remain compatible with existing boundaries:

| Area | Constraint |
|------|------------|
| Vote page | Vote success/failure copy and page-local option clearing remain unchanged by this plan phase. |
| `vote-by-index` | Eligibility before option resolve remains vote-time authority only. |
| Results page | `GET /polls/:id/results` aggregate display rules remain unchanged; my-polls must not preview voter-linked results. |
| Explore page | `GET /explore` freshness-only public feed boundaries remain unchanged. |
| Registration | `POST /registration` remains credential/profile creation only; no auto-login or owned-list linkage. |
| Login session | `POST /login/session` remains the formal production session boundary; my-polls live mode does not replace it with `creator_session`. |
| Profile | `GET /users/me/profile` remains for profile setup and pre-vote hints only; my-polls must not use it for eligibility or voter-state display. |
| Reference Answer | Remains disconnected from `UserAuthResolver` and profile eligibility. |
| Creator API | `GET /creator/polls` response shape and ownership filter remain authoritative; this plan does not add new creator list endpoints. |

---

## 7. Future Runtime Implementation Notes

**Not this phase.** A later runtime phase may:

- align `my-polls-page.js` and `my-polls.html` empty/unavailable/sign-in copy with Section 3 recommended messages where current copy differs;
- add focused frontend guard tests for mock/live separation, lifecycle label rendering, counter suppression, and neutral failure copy;
- add docs/review checkpoint coverage after runtime polish lands.

A later runtime phase must **not**:

- add creator list APIs, change creator ownership rules, or expose vote counters on owned-list cards;
- reclassify `creator_session` as production identity;
- call `GET /users/me`, `GET /users/me/profile`, vote APIs, or result APIs from my-polls for voter-state display logic;
- store selected options, vote history, or voter personalization in `localStorage`, `sessionStorage`, IndexedDB, cookies, URL state, or durable client caches beyond existing approved creator-flow bookkeeping;
- add logs, metrics, analytics, APM traces, or error payloads that link owned-list impressions or management actions to a visitor's option choice or vote intent.

Candidate runtime files for a future phase (reference only):

- `public/frontend/my-polls-page.js`
- `public/my-polls.html`
- `public/frontend/creator-flow-copy.js`
- `public/frontend/poll-lifecycle-controls.js`

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
