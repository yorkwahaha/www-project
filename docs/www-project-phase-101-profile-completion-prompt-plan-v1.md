# WWW Project Phase 101 — Profile Completion Prompt Plan v1

**Status:** docs/spec only. Defines the future post-login profile completion prompt that may guide signed-in users toward `/profile` when `birth_year_month` or `residential_region` is still null. No runtime behavior, frontend JS, API, DB schema, migration, `UserAuthResolver`, `GET /users/me` response shape, `GET`/`PUT /users/me/profile` behavior, `POST /registration`, `POST`/`DELETE /login/session`, Official Vote transaction order, `vote-by-index`, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 100 registration / login / profile milestone checkpoint. Phase 98–99 delivered post-login `GET /profile` with `GET`/`PUT /users/me/profile` for the two nullable eligibility fields. Phase 101 plans a neutral completion prompt only — not the prompt runtime itself.

---

## 1. Purpose

The future profile completion prompt helps signed-in users understand that some Official Vote flows may require basic profile data before eligibility can be evaluated at vote time.

The prompt must:

1. encourage users to review or complete `birth_year_month` and coarse `residential_region` through the existing `/profile` editor.
2. explain, in neutral language, that some formal votes may need birth year/month and coarse residential region.
3. remain informational — it does not guarantee that completing profile data will make the user eligible for any specific poll.
4. avoid revealing Official Vote eligibility determination details, pass/fail reasons, age boundaries, region allowlists, or poll-specific rule outcomes.

The prompt is not a gate on general browsing, not an auto-redirect, not an auto-vote action, and not a vote-time eligibility evaluator.

---

## 2. Prompt Placement Recommendations

Future implementation may show the prompt only on signed-in surfaces that already understand login state. Recommended locations:

| Surface | Recommendation |
|---------|----------------|
| Homepage signed-in area | Show a compact neutral banner or inline note near existing auth chrome (`display_name` chip / signed-in header region). |
| `/profile` | Show an inline reminder above the profile form when either field is null; primary action links to the same page form section (no separate route required). |
| Future vote page pre-vote neutral zone | Show a generic reminder before vote submission when profile data is incomplete; must not block reading poll content or reveal eligibility outcome. |
| `/registration` | **Do not show.** Registration does not read login state (`data-login-state-read="disabled"`) and must not mount profile-completion logic. |

The prompt must not appear on:

- guest/anonymous chrome as a forced modal or blocking overlay.
- `/registration` or registration success states.
- Reference Answer surfaces.
- result pages, explore feed, or analytics dashboards as a new profile-eligibility diagnostic.

Shared chrome continues to use `GET /users/me` for `display_name` only. Profile completeness must not be folded into `GET /users/me` response shape.

---

## 3. Trigger Data

Future prompt logic may use only data from `GET /users/me/profile`:

| Field | Trigger rule |
|-------|--------------|
| `birth_year_month` | prompt when value is `null` |
| `residential_region` | prompt when value is `null` |

Show the prompt when **either** field is `null` for a signed-in user. Hide or soften the prompt only after both fields are non-null (implementation may still allow dismiss/snooze UX later; this phase does not require it).

Forbidden trigger inputs:

- vote history, prior Official Vote outcomes, or poll participation records.
- selected `option_id`, `option_index`, option text, or vote token data.
- device identifiers, session IDs, request IDs, trace IDs, cookie values, raw tokens, or `user_id` shown in prompt copy.
- any new profile fields beyond `birth_year_month` and `residential_region`.
- `GET /users/me` fields other than using existing login-state detection indirectly through shared chrome (the prompt module itself reads profile completeness from `GET /users/me/profile`, not from `/users/me` body fields).

No new API endpoints, no `/users/me` shape extension, and no server-side prompt-state persistence are introduced by this phase.

---

## 4. Prompt Copy Principles

Copy must be neutral, optional, and non-coercive.

Required principles:

- say that **some** formal Official Votes may require birth year/month and a coarse residential region.
- invite the user to complete or review profile data on `/profile`.
- use soft verbs such as “可以”“建議”“若尚未填寫” rather than “必須立即”“否則無法使用”.
- treat completion as helpful preparation, not a confirmed eligibility guarantee.

Forbidden principles:

- do not say “你符合資格” or “你不符合資格”.
- do not say which poll, rule, age cutoff, or region code caused a denial.
- do not expose `user_id`, session identifiers, token digests, cookie values, or internal eligibility traces.
- do not mention a selected option, vote attempt, or option index.
- do not promise that filling both fields will unlock voting on the current poll.

Recommended Traditional Chinese copy (illustrative only):

```text
部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。
若你尚未填寫，可至個人資料頁補充或更新；這不代表你一定符合或不符合任何投票資格。
```

Recommended call to action:

```text
前往個人資料
```

Link target: `/profile` (user-initiated navigation only; no automatic redirect).

English fallback shape (if bilingual UI is added later):

```text
Some formal votes may require birth year/month and a coarse residential region at vote time.
You can review or update these fields on your profile page. Completing them does not guarantee eligibility.
```

---

## 5. Behavioral Boundaries

The future prompt must preserve these product and privacy boundaries:

| Rule | Requirement |
|------|-------------|
| Non-blocking browse | Prompt must not block homepage, poll reading, results, or logout. |
| No auto navigation | Prompt must not auto-redirect to `/profile` or any other route. |
| No auto vote | Prompt must not submit Official Vote requests. |
| No vote recalculation | Prompt must not recalculate or invalidate existing votes. |
| No historical backfill | Prompt must not backfill historical eligibility for past votes. |
| Vote-time authority | Official Vote eligibility remains evaluated only by the existing vote-time evaluator. |
| Reference Answer isolation | Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility. |
| Raw Option Linkage Ban | No new durable linkage between profile prompt state and `option_id`, option choice, session, device, request, log, trace, metric, or error payload. |

The prompt is a UX nudge toward account data maintenance, not a new eligibility engine.

---

## 6. Future Implementation Notes

When a later phase implements the prompt runtime:

### 6.1 Module boundary

- shared chrome (`public-mvp-layout.js` / login-state reader) continues to call `GET /users/me` for `display_name` only.
- profile completeness should live in a **small independent client module** (for example `profile-completion-prompt.js`) that:
  - runs only on allowed signed-in surfaces.
  - calls `GET /users/me/profile` with `credentials: 'same-origin'`.
  - derives `isIncomplete = birth_year_month === null || residential_region === null`.
  - renders neutral copy and a `/profile` link.
- do not extend `GET /users/me` with `birth_year_month`, `residential_region`, or `profile_complete`.

### 6.2 Page-specific rules

| Page | Rule |
|------|------|
| `/registration` | keep `data-login-state-read="disabled"`; no prompt module mount. |
| `/profile` | prompt may appear inline; editing remains the canonical `GET`/`PUT /users/me/profile` flow from Phase 98–99. |
| Homepage | prompt may appear near signed-in chrome after login-state is known; must not replace or overload `display_name` chip behavior. |
| Future vote page | prompt may appear in a pre-vote neutral info area; vote submission still flows through existing Official Vote endpoints and vote-time evaluator only. |

### 6.3 API usage

Allowed:

- `GET /users/me/profile` → read `birth_year_month`, `residential_region` only.

Not allowed for prompt implementation:

- changing `GET /users/me` response shape.
- changing `GET`/`PUT /users/me/profile` backend behavior.
- adding prompt-specific server endpoints or prompt-dismiss persistence tables.

---

## 7. Relationship to Prior Phases

| Phase | Relevance |
|-------|-----------|
| **97** | Defined minimal profile setup/edit UI plan for `/profile`. |
| **98** | Implemented post-login `/profile` runtime with two-field `GET`/`PUT /users/me/profile`. |
| **99** | Hardened profile runtime; confirmed shared chrome stays `display_name`-only. |
| **100** | Checkpoint for registration → login → profile baseline. |
| **101 (this doc)** | Plans neutral completion prompt surfaces and trigger/copy boundaries only. |

Phase 66F-P incomplete-profile prompt principles remain compatible: Phase 101 generalizes a **proactive** signed-in nudge across allowed surfaces, while vote-time ineligible messaging stays generic and non-directional.

---

## 8. Suggested Future Delivery (Not This Phase)

| Item | Path / note |
|------|-------------|
| Client module | future `public/frontend/profile-completion-prompt.js` |
| Homepage hook | mount after signed-in detection on `public/index.html` shell |
| Profile inline note | extend `public/frontend/profile-page.js` or shared partial |
| Vote page zone | future vote page pre-submit info region |
| Tests | future frontend unit tests + static route guards |
| Docs | implementation/review phase after runtime lands |

This phase delivers planning documentation and docs guard tests only.

---

## 9. Boundaries Preserved

Phase 101 does not change:

- DB schema or migrations.
- `POST /registration` behavior.
- `POST /login/session` or `DELETE /login/session`.
- `UserAuthResolver` behavior.
- `GET /users/me` response shape (`user_id`, `display_name` only).
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior.
- Official Vote transaction order or `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Reference Answer auth boundary and profile eligibility exclusion.
- `creator_session` local/demo/test creator-flow separation.
- explicit non-production `X-User-Id` compatibility scope.
- ranking, demographic breakdowns, analytics linkage, precise location, exact birthday, gender, address, or extra profile fields.
- Raw Option Linkage Ban.

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
