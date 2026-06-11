# WWW Project Phase 113 — Results Page Empty / Unavailable State UX Plan v1

**Status:** docs/spec only. Defines future results-page frontend UX and copy boundaries for lifecycle-blocked, empty aggregate, load failure, and transport-error scenarios on `/results/:pollId`. No runtime behavior, frontend JS/CSS, backend, API, DB schema, migration, `UserAuthResolver`, vote evaluator, result evaluator, Official Vote transaction order, `GET /polls/:id/results` behavior, collecting/cancelled/unpublished counter-free boundaries, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 112 vote UX error handling runtime review checkpoint. Phase 111 delivered vote-page neutral success/failure/lifecycle UX. The existing results runtime in `result-page.js` already distinguishes collecting, unavailable, and aggregate modes; Phase 113 plans a fuller empty/unavailable-state copy and UX boundary map for a later runtime phase.

**Prior checkpoint:** [Phase 112 vote UX error handling runtime review](./www-project-phase-112-vote-ux-error-handling-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Results pages need consistent, neutral user-facing messages when aggregate statistics are not yet public, the poll is unavailable, the API returns an empty display-safe aggregate, or the client cannot load results.

Phase 113 plans:

1. recommended copy and display rules for each results-page scenario listed below.
2. UX boundaries for what may and may not be shown on `/results/:pollId`.
3. privacy guard requirements preserving Raw Option Linkage Ban on the results surface.
4. compatibility constraints with vote, `vote-by-index`, registration, login, profile, and Reference Answer boundaries.
5. future runtime implementation notes for a later phase only.

**Core principle:** Results pages may show only **display-safe aggregate** data returned by the existing results API and evaluator. Results UX must not become a voter-state explainer, eligibility checker, or option-linkage surface.

---

## 2. Non-Goals

Phase 113 does **not**:

- implement runtime, frontend JS/CSS, backend, API, schema, or migration changes.
- add or change `GET /polls/:id/results` behavior, result evaluator logic, or result display tier thresholds.
- change collecting / cancelled / unpublished counter-free boundaries.
- change `UserAuthResolver`, vote evaluator logic, or Official Vote transaction order.
- expose whether the current visitor voted, which option they chose, or whether they were eligible.
- expose `option_id`, raw counters, shard internals, vote token internals, session, cookie, or `user_id` on the results page.
- add demographic breakdown, ranking personalization, analytics linkage, precise location, exact birthday, gender, or extra profile fields.
- connect Reference Answer to `UserAuthResolver` or profile eligibility.
- create durable option choice + user/session/device/request/log/trace/metric/error payload linkage.
- echo raw backend error payloads, internal denial reasons, or server stack details in user-visible copy.

---

## 3. Scenario Catalog

Future runtime may bucket multiple backend outcomes into the same neutral user message when required to avoid rule, voter-state, or option-linkage leakage. This phase defines the **user-visible** target shape only; it does not change server error codes or response bodies.

### 3.1 Aggregate available (`revealed` / `locked` / `post_lock`)

| UX rule | Requirement |
|---------|-------------|
| May show | Display-safe aggregate summary from the results API: bucketed totals, option labels, display-safe counts/percentages per existing result display tiers. |
| Must not show | Raw counters, shard rows, vote tokens, voter identity, whether the current visitor voted, demographic breakdown, or pre-vote ranking signals. |
| Must not do | Infer or display personalized vote outcome for the current visitor. |

No dedicated empty-state title is required when aggregate data is present. Option labels and display-safe statistics may render per existing tier rules.

### 3.2 Collecting (`public_lifecycle_state === 'collecting'`)

Results are not yet public. Counters must not appear.

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral collecting notice; poll title/description if already loaded; option labels without vote counts when the API provides label-only display-safe options. |
| Must not show | Total votes, option vote counts, percentages, rankings, trends, growth signals, or any progress that could imply answer direction before public reveal policy allows it. |
| Must not show | Whether the current visitor voted or which option they selected. |

Recommended copy:

```text
結果尚未公開。
```

Optional supporting copy (non-identifying only):

```text
本問卷仍在收集中。此頁不顯示總票數、選項票數、百分比、排名或趨勢。
```

### 3.3 Cancelled (`public_lifecycle_state === 'cancelled'`)

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral cancelled notice; poll metadata when already public and safe to show. |
| Must not show | Counters, percentages, rankings, voter state, or option-level vote linkage. |

Recommended copy:

```text
問卷已取消。
```

Optional supporting copy:

```text
此問卷已取消，不會產生可公開顯示的聚合結果。
```

### 3.4 Unpublished (`public_lifecycle_state === 'unpublished'`)

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral unavailable notice. |
| Must not show | Counters, percentages, archived vote linkage, or voter state. |

Recommended copy:

```text
問卷目前無法查看。
```

Optional supporting copy:

```text
此問卷目前無法查看，頁面不顯示聚合結果。
```

### 3.5 Poll not found / unavailable

Covers `404`, invalid poll id, archived poll, draft poll, or any route/API outcome where the results page cannot present a readable poll context.

| UX rule | Requirement |
|---------|-------------|
| May show | One neutral unavailable message; optional navigation back to homepage or explore. |
| Must not show | Internal error codes, backend `message` fields, token/counter/shard internals, or voter/profile state. |
| Must not do | Branch user-visible copy in ways that reveal whether the visitor previously voted. |

Recommended copy:

```text
問卷目前無法使用。
```

### 3.6 Empty aggregate

Applies when lifecycle allows aggregate display (`revealed` / `locked` / `post_lock`) but the display-safe payload has no renderable aggregate rows or totals.

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral empty-state notice; poll title/description if already loaded. |
| Must not show | Raw zero counters, shard emptiness, sub-threshold internals, or “no one voted yet” phrasing that could be read as voter surveillance. |
| Must not do | Imply which users did or did not participate. |

Recommended copy:

```text
目前沒有可顯示的聚合結果。
```

### 3.7 Load / network / server failure

Covers JSON parse failure, transport failure, and generic non-OK results fetch where lifecycle-specific copy is not yet known or must not be inferred from raw payload.

| UX rule | Requirement |
|---------|-------------|
| May show | One neutral retry-oriented message. |
| Must not show | HTTP status text, backend `error` codes, raw `message` fields, stack traces, or option/vote internals. |
| Must not do | Echo raw backend payload into the DOM or status region. |

Recommended copy:

```text
目前無法載入結果，請稍後再試。
```

---

## 4. UX Boundaries Summary

### 4.1 Counter-free lifecycle states

- `collecting`, `cancelled`, and `unpublished` must not display counters, percentages, rankings, trends, or growth signals.
- `revealed`, `locked`, and `post_lock` may display only display-safe aggregate fields already allowed by the result evaluator and tier rules.

### 4.2 No voter personal state

Results pages must not display:

- whether the current visitor voted;
- whether the current visitor is eligible or ineligible;
- which option the current visitor chose;
- duplicate-vote state, trust outcome, age outcome, or region outcome for the current visitor.

### 4.3 No option-level linkage or internal identifiers

Results pages must not display or infer:

- `option_id`;
- raw counter rows or shard identifiers;
- vote token or token hash;
- session, cookie, or `user_id`;
- backend denial reason text tied to a visitor or request.

### 4.4 Read-only public surface

- Results pages remain read-only public surfaces.
- They must not submit votes, resolve `option_index` → `option_id` for visitor state, or call profile eligibility APIs for display logic.

---

## 5. Privacy Guard and Raw Option Linkage Ban

Results UX must preserve the project Raw Option Linkage Ban:

1. Results pages may present only **allowed public aggregate** data from the existing display-safe results API.
2. Results UX must not link an option result to a user, session, device, request, log, trace, metric, error payload, or analytics record.
3. Empty, unavailable, collecting, and failure states must remain option-identity-free with respect to visitor identity.
4. Error and unavailable copy must not echo raw backend payloads that could expose option-level or voter-level internals.
5. Future runtime tests and fixtures for this area must not encode durable `user + poll + option` records or raw denial reasons in copy guards.

---

## 6. Compatibility

Phase 113 must remain compatible with existing boundaries:

| Area | Constraint |
|------|------------|
| Vote page | Vote success/failure copy and page-local option clearing remain unchanged by this plan phase. |
| `vote-by-index` | Eligibility before option resolve remains vote-time authority only. |
| Registration | `POST /registration` remains credential/profile creation only; no auto-login or results linkage. |
| Login session | `POST /login/session` remains the formal session boundary. |
| Profile | `GET /users/me/profile` remains for profile setup and pre-vote hints only; results page must not use it for eligibility or voter-state display. |
| Reference Answer | Remains disconnected from `UserAuthResolver` and profile eligibility. |
| Result API | `GET /polls/:id/results` response shape and tier behavior remain authoritative; this plan does not add new results endpoints. |
| Collecting / cancelled / unpublished | Existing counter-free lifecycle boundaries remain unchanged. |

---

## 7. Future Runtime Implementation Notes

**Not this phase.** A later runtime phase may:

- align `result-page.js` empty/unavailable/collecting copy with Section 3 recommended messages where current copy differs;
- add focused frontend guard tests for lifecycle mode rendering, counter suppression, and neutral failure copy;
- add docs/review checkpoint coverage after runtime polish lands.

A later runtime phase must **not**:

- add results APIs, change result evaluator thresholds, or expose raw counters;
- add voter-personalized result panels;
- call `GET /users/me`, `GET /users/me/profile`, or vote APIs from the results page for display logic;
- store selected options or vote history in `localStorage`, `sessionStorage`, IndexedDB, cookies, URL state, or durable client caches;
- add logs, metrics, analytics, APM traces, or error payloads that link option results to a traceable visitor identity.

Candidate runtime files for a future phase (reference only):

- `public/frontend/result-page.js`
- `public/frontend/public-mvp-ui.js`
- `public/results.html`

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
