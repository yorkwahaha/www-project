# WWW Project Phase 110 — Vote UX Error Handling Polish Plan v1

**Status:** docs/spec only. Defines future vote-page frontend UX and copy boundaries for Official Vote success, failure, pre-submit, lifecycle, and transport-error scenarios. No runtime behavior, frontend JS/CSS, backend, API, DB schema, migration, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 109 Official Vote privacy guard checkpoint. Phases 105–108 delivered vote-page pre-vote hints (`official-vote-pre-vote-hints.js`) and unified neutral submit-failure copy. Phase 110 plans a fuller vote-page error/success polish map for a later runtime phase.

**Prior checkpoint:** [Phase 109 Official Vote privacy guard](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## 1. Purpose

Vote pages need consistent, neutral user-facing messages across the full Official Vote journey: before submit, on success, on denial, when the poll is not votable, and when the network or server fails.

Phase 110 plans:

1. recommended copy and display rules for each vote-page scenario listed below.
2. UX boundaries for what may and may not be shown.
3. privacy guard requirements preserving Raw Option Linkage Ban.
4. compatibility constraints with registration, login, profile, vote, `vote-by-index`, and Reference Answer boundaries.
5. future runtime implementation notes for a later phase only.

**Core principle:** Official Vote eligibility authority remains **only** in the existing vote-time evaluator. Vote-page UX copy is informational and must not become a pre-vote or post-failure eligibility explainer.

---

## 2. Non-Goals

Phase 110 does **not**:

- implement runtime, frontend JS/CSS, backend, API, schema, or migration changes.
- change `UserAuthResolver`, vote evaluator logic, or Official Vote transaction order.
- change `vote-by-index` eligibility placement before option resolve.
- add eligibility preview APIs or extend `GET /users/me` response shape.
- distinguish invalid `option_index` from eligibility denial in user-visible submit-failure copy.
- expose age thresholds, region allowlists, trust/role rules, `option_id`, token, counter, shard, session, cookie, or `user_id`.
- add demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields.
- connect Reference Answer to `UserAuthResolver` or profile eligibility.
- create durable option choice + user/session/device/request/log/trace/metric/error payload linkage.

---

## 3. Scenario Catalog

Future runtime may bucket multiple backend outcomes into the same neutral user message when required to avoid rule or option leakage. This phase defines the **user-visible** target shape only; it does not change server error codes or response bodies.

### 3.1 Vote success

| UX rule | Requirement |
|---------|-------------|
| May show | Generic success confirmation; optional link to result page when lifecycle allows public result viewing. |
| Must not show | `option_id`, option label tied to vote internals, token, counter, shard, personalized result preview, demographic breakdown. |

Recommended copy:

```text
投票已送出，感謝參與。
```

Optional follow-up (only when result route is already public per lifecycle policy):

```text
查看結果
```

### 3.2 Vote failure (generic submit denial)

Covers eligibility denial, trust/role denial, invalid option at vote time, and any other submit-time rejection that must not leak which condition failed.

| UX rule | Requirement |
|---------|-------------|
| May show | One neutral failure message; optional user-initiated links to `/login` or `/profile` only when login/profile preparation is plausibly relevant and does not imply pass/fail. |
| Must not show | Age cutoff, region mismatch, trust tier, role rule, duplicate-token internals, option validity, `option_index` existence, `option_id`, token, counter, shard, session, cookie, `user_id`. |
| Must not do | Branch user-visible copy by backend error code when branching would reveal eligibility or option detail. |

Recommended copy:

```text
目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。
```

### 3.3 Not signed in (pre-submit)

Pre-submit guidance only; not a submit failure.

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral note that formal voting may require login; user-initiated `/login` link. |
| Must not show | Profile completeness, eligibility outcome, selected option. |
| Must not call | `GET /users/me/profile` for anonymous visitors. |

Recommended copy:

```text
正式投票可能需要登入。若你尚未登入，可前往登入頁完成登入後再嘗試投票。
```

Call to action:

```text
前往登入 → /login
```

### 3.4 Profile incomplete (pre-submit)

| UX rule | Requirement |
|---------|-------------|
| May show | Neutral note that some formal votes may require birth year/month and coarse residential region at vote time; user-initiated `/profile` link. |
| Must not show | Eligible/ineligible outcome; which profile field would fail for this poll. |
| May read | `GET /users/me/profile` with `credentials: 'same-origin'`; only `birth_year_month` and `residential_region` nullness. |

Recommended copy:

```text
部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。若你尚未填寫，可至個人資料頁補充或更新；此提示不代表一定可以完成投票。
```

Call to action:

```text
前往個人資料 → /profile
```

### 3.5 Possibly ineligible (pre-submit, profile complete)

When both profile fields are non-null, the UI may still not know vote-time eligibility.

| UX rule | Requirement |
|---------|-------------|
| May show | Generic pre-submit reminder that rules are evaluated at submit time. |
| Must not show | “You are eligible”, “You are not eligible”, age/region pass state, poll rule detail. |
| Must not guarantee | That submit will succeed. |

Recommended copy:

```text
送出投票後，系統會依該投票的規則在當下判定是否可計票。此提示不代表一定可以完成投票。
```

### 3.6 Duplicate vote or already voted

Whether detected at submit time or surfaced through existing vote-token semantics, user-visible copy must stay in the **generic submit denial** bucket.

| UX rule | Requirement |
|---------|-------------|
| May show | Same neutral submit-failure copy as §3.2. |
| Must not show | “You already voted for option X”, token digest, prior vote timestamp tied to option identity, or a separate “duplicate only” message if it helps infer option validity or prior choice. |

Recommended copy:

```text
目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。
```

### 3.7 Poll not collecting / closed / cancelled / unpublished / results published

These are primarily **poll load / page state** messages, not submit-failure diagnostics.

| Sub-scenario | May show | Must not show |
|--------------|----------|---------------|
| Not collecting / not accepting responses | Neutral “currently not accepting votes” style message; poll question may remain readable if API already allows read. | Collecting-stage result counts, ranking signals, option-level participation hints. |
| Closed / past deadline | Neutral closed message; optional result link only when lifecycle policy already exposes results. | Vote submit affordance presented as if still open when it is not. |
| Cancelled / unpublished / archived | Neutral unavailable message. | Internal lifecycle codes, creator identifiers, vote internals. |
| Results already public (`revealed` / `locked` / `post_lock`) | Neutral message that voting is no longer available; optional result navigation. | Personalized “you voted for …” recap with option identity. |

Recommended load-state copy examples:

```text
此問卷目前不接受投票。
```

```text
此問卷已截止，無法再投票。
```

```text
此問卷已結束。
```

```text
此問卷目前無法使用。
```

```text
找不到此問卷，可能已刪除、尚未公開，或連結有誤。
```

When lifecycle blocks voting, disable or hide submit controls without implying which option would have been valid.

### 3.8 Network or server error

Transport failures, timeouts, malformed responses, and unexpected 5xx should use neutral copy without echoing raw server payloads.

| UX rule | Requirement |
|---------|-------------|
| Poll load failure | Neutral load failure; may reuse existing safe load messages where already lifecycle-specific and non-identifying. |
| Submit transport failure | Neutral submit failure; same bucket as §3.2 when the failure reason is unknown or unsafe to reveal. |
| Must not show | Stack traces, request ids, trace ids, response bodies, `option_id`, token, counter, shard. |

Recommended copy:

```text
目前無法載入問卷，請稍後再試。
```

```text
目前無法送出投票，請稍後再試。
```

For unknown submit failures where login/profile preparation might help, the longer §3.2 message is acceptable; it must still avoid condition-specific branches.

### 3.9 Missing option selection (client-side only)

Local form validation before submit is allowed when it does not reveal server-side option validity.

| UX rule | Requirement |
|---------|-------------|
| May show | Prompt to select an option before submit. |
| Must not show | Whether a specific `option_index` exists on the server. |

Recommended copy:

```text
請先選擇一個選項。
```

---

## 4. UX Boundaries Summary

| State / message | May display | Must not display |
|-----------------|-------------|------------------|
| Pre-submit anonymous hint | Login guidance, `/login` link | Profile fields, eligibility outcome, option linkage |
| Pre-submit incomplete profile | `/profile` nudge, coarse field purpose | Pass/fail, age/region thresholds |
| Pre-submit complete profile | Generic submit-time reminder | Eligibility guarantee, rule detail |
| Submit success | Generic thank-you | `option_id`, token, counter, shard, demographics |
| Submit failure | One neutral denial bucket | Condition-specific denial, option validity hints |
| Duplicate / already voted | Same neutral denial bucket | Prior option identity, token detail |
| Poll lifecycle block | Lifecycle-appropriate unavailable copy | Counter aggregates during collecting |
| Network / server error | Neutral retry guidance | Raw payload, internal identifiers |
| Missing local selection | Select-an-option prompt | Server option-index validity |

Behavioral boundaries (unchanged from Phase 105–109):

- do not block poll reading except where the poll itself is unavailable from the API.
- do not auto-redirect to `/login` or `/profile`.
- do not auto-submit votes.
- do not resolve `option_index` → `option_id` in client UX logic.
- do not persist selected option across login/profile navigation for replay.

---

## 5. Privacy Guard and Raw Option Linkage Ban

Vote-page error-handling polish must preserve the project-wide Raw Option Linkage Ban.

**Explicit prohibition:** no durable or side-channel linkage that combines:

- selected `option_index`, hovered option, draft selection, submit attempt context, or inferred intended choice
- with `user_id`, session, device, request id, log row, trace span, metric label, error payload, or analytics event

This applies to:

- success toasts and banners (must not include chosen option identity).
- failure messages (must not echo backend option identity or index validity).
- client error reporting, debug overlays, and future toast analytics.
- local storage, session storage, IndexedDB, or post-login “resume vote for option N” flows.

Allowed:

- ephemeral in-page selection memory for the current vote form only, cleared on navigation and after successful submit, consistent with Phase 109 page-local selection boundary.
- mapping multiple backend failure codes to the same neutral user string when required for privacy.

Eligibility and duplicate-vote handling remain option-identity-free in all user-visible copy.

---

## 6. Compatibility

Phase 110 planning must not weaken these existing boundaries:

| Area | Requirement |
|------|-------------|
| Registration | `POST /registration` unchanged; no auto-login; `/registration` keeps `data-login-state-read="disabled"`. |
| Login session | `POST /login/session` and `DELETE /login/session` unchanged. |
| `GET /users/me` | Response shape remains `user_id` and `display_name` only; chrome displays `display_name` only. |
| Profile API | `GET`/`PUT /users/me/profile` behavior unchanged; vote UX reads only two nullable fields when signed in. |
| Official Vote | Transaction order unchanged; vote-time evaluator sole eligibility authority. |
| `vote-by-index` | Eligibility before option resolve unchanged. |
| Token / counter | `user_id + poll_id` and `poll_id + option_id + shard_id` unchanged. |
| Reference Answer | Remains disconnected from `UserAuthResolver` and profile eligibility. |
| `creator_session` | Local/demo/test creator flow only. |
| `X-User-Id` | Explicit non-production compatibility only. |
| Pre-vote hints | `official-vote-pre-vote-hints.js` remains separate; Phase 110 does not turn hints into submit-failure explainers. |
| Profile completion prompt | Homepage prompt remains separate mount scope on `/` only. |

---

## 7. Future Runtime Implementation Notes (Not This Phase)

When a later phase implements this polish plan:

### 7.1 Module boundaries

- keep poll load messaging in shared public UI helpers (for example `messageForPollLoadFailure`).
- keep submit failure mapping in one vote-page helper that defaults to the §3.2 neutral bucket.
- keep pre-submit hints in `official-vote-pre-vote-hints.js`; do not merge hint logic into submit-error branches.
- do not add client-side logging of `{ user, option_index, errorCode }` tuples.

### 7.2 Error bucketing

- lifecycle load errors may remain slightly more specific when messages are already poll-state-only and do not reveal option validity.
- submit-time errors from eligibility, trust, duplicate token, and invalid option should collapse to one neutral string unless a future privacy review approves a safe subset.
- network errors use transport-specific neutral copy without server body echo.

### 7.3 UI affordances

- disable submit when lifecycle state is non-voting; show lifecycle copy in a dedicated page region.
- keep success feedback in the existing status/confirmation region without option recap.
- preserve non-blocking browse for readable poll states.

### 7.4 Tests for a future runtime phase

- copy guards per scenario bucket.
- guards that submit-failure mapping does not branch on sensitive `errorCode` values in user-visible strings.
- guards that success copy excludes `option_id`, token, counter, and shard literals.
- reuse Phase 109 privacy guards for page-local selection clearing.

---

## 8. Relationship to Prior Phases

| Phase | Relevance |
|-------|-----------|
| **105** | Pre-vote audience states and generic submit failure/success principles. |
| **106–107** | Current vote-page runtime and review guards. |
| **108** | Pre-vote UX milestone baseline. |
| **109** | Privacy guard checkpoint and page-local option selection boundary. |
| **110 (this doc)** | Full vote-page error/success polish plan across lifecycle and transport cases. |

---

## 9. Boundaries Preserved

Phase 110 does not change:

- runtime, frontend JS/CSS, or `src` backend behavior.
- DB schema or migrations.
- `UserAuthResolver` or vote evaluator logic.
- `POST /registration`, `POST /login/session`, `DELETE /login/session`.
- `GET /users/me` response shape.
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior.
- Official Vote transaction order.
- `vote-by-index` eligibility before option resolve.
- vote token schema or counter schema.
- Reference Answer auth boundary.

No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records may capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

---

## 10. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
```

`design-drafts/` remains excluded from git and delivery scope.
