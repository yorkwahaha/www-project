# WWW Project Phase 105 — Official Vote Pre-vote Eligibility UX Plan v1

**Status:** docs/spec only. Defines the future Official Vote **pre-vote eligibility UX** and copy boundaries for vote pages and related client surfaces. No runtime behavior, frontend JS, API, DB schema, migration, `UserAuthResolver`, vote evaluator, `GET /users/me` response shape, `GET`/`PUT /users/me/profile` behavior, `POST /registration`, `POST`/`DELETE /login/session`, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** Phase 104 profile completion prompt milestone checkpoint. Phases 101–103 delivered homepage-only `profile-completion-prompt.js` with signed-in `GET /users/me/profile` null checks. Phase 105 plans how future **vote page** surfaces may guide users before Official Vote submission without becoming a pre-vote eligibility engine.

**Prior checkpoint:** [Phase 104 profile completion prompt milestone](./www-project-phase-104-profile-completion-prompt-milestone-checkpoint-v1.md).

---

## 1. Purpose

Future Official Vote vote pages need neutral, privacy-preserving guidance **before** a user submits a vote. Pre-vote UX may help users understand login and profile preparation requirements without revealing eligibility outcomes, poll rule details, or option identity.

This phase plans:

1. three audience-specific pre-vote UX states (anonymous, signed-in incomplete profile, signed-in complete profile).
2. neutral vote failure and success messaging boundaries after submission.
3. the relationship between vote-page UX and the existing profile completion prompt (Phase 101–103).
4. an explicit **Raw Option Linkage Ban** for all pre-vote and post-submit client UX.

**Core principle:** Official Vote eligibility authority remains **only** in the existing vote-time evaluator. Pre-vote UX is informational; it must not duplicate, preview, or contradict vote-time decisions.

---

## 2. Authority and Non-Goals

| Layer | Role |
|-------|------|
| **Vote-time evaluator** | Sole authority for Official Vote eligibility (trust guard, profile rules, poll rules, transaction ordering). |
| **Pre-vote UX (this plan)** | Neutral hints about login and coarse profile preparation only. |
| **Profile completion prompt** | Optional nudge toward `/profile` when fields are null; not an eligibility checker. |

Pre-vote UX must **not**:

- evaluate or display pass/fail eligibility for any poll.
- reveal age thresholds, region allowlists, trust/role rules, or which condition would fail.
- resolve `option_index` → `option_id` before vote submission.
- change `vote-by-index` eligibility ordering before option resolve.
- block poll reading, result browsing, or logout.
- auto-redirect to `/login` or `/profile`.
- auto-submit votes.
- create durable linkage between a user's intended option choice and identity, session, device, request, log, trace, metric, or error payload.

---

## 3. Pre-vote Audience States

Future vote page implementation may derive **only** login state (from shared chrome / `GET /users/me`) and profile field nullness (from `GET /users/me/profile` when signed in). No poll-specific eligibility API, vote history, or option selection state may feed pre-vote messaging.

### 3.1 Anonymous (not signed in)

| Rule | Requirement |
|------|-------------|
| Login hint | May show neutral copy that Official Vote requires sign-in. |
| Navigation | May offer user-initiated link to `/login`. |
| Profile API | **Must not** call `GET /users/me/profile`. |
| Profile details | **Must not** show birth year/month, residential region, or profile completeness. |
| Eligibility outcome | **Must not** imply eligible or ineligible. |
| Browse | Must not block reading poll question, options, lifecycle state, or non-vote actions. |

Recommended Traditional Chinese copy (illustrative):

```text
正式投票需要登入帳號。若你尚未登入，可前往登入頁完成登入後再嘗試投票。
```

Recommended call to action:

```text
前往登入 → /login
```

### 3.2 Signed in, profile incomplete

Detect incomplete profile when `birth_year_month === null` **or** `residential_region === null` from `GET /users/me/profile` only.

| Rule | Requirement |
|------|-------------|
| Profile hint | May say **some** formal Official Votes may require birth year/month and coarse residential region at vote time. |
| Navigation | May offer user-initiated link to `/profile`. |
| Eligibility outcome | **Must not** say eligible or ineligible. |
| Field pass/fail | **Must not** show whether age or region would pass for this poll. |
| Browse | Must not block poll reading or other navigation. |
| Auto navigation | **Must not** auto-redirect to `/profile`. |
| Auto vote | **Must not** auto-submit Official Vote. |

Recommended copy (compatible with Phase 101–102 prompt):

```text
部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。
若你尚未填寫，可至個人資料頁補充或更新；這不代表你一定符合或不符合任何投票資格。
```

Recommended call to action:

```text
前往個人資料 → /profile
```

### 3.3 Signed in, profile complete

Both `birth_year_month` and `residential_region` are non-null.

| Rule | Requirement |
|------|-------------|
| Neutral vote hint | May show generic pre-submit guidance (for example: voting is subject to poll rules evaluated at submit time). |
| Guarantee | **Must not** guarantee the user can vote on this poll. |
| Pass display | **Must not** show age or region pass/fail for this poll. |
| Rule detail | **Must not** expose configured age range, region list, or trust/role requirements in pre-vote UI. |
| Authority | Actual eligibility remains vote-time evaluator only. |

Recommended copy:

```text
送出投票後，系統會依該投票的規則在當下判定是否可計票。此提示不代表你一定符合或不符合資格。
```

English fallback shape (if bilingual UI is added later):

```text
When you submit a vote, the system evaluates eligibility at that moment under this poll's rules. This notice does not guarantee that you are eligible.
```

---

## 4. Pre-vote UI Placement

Recommended vote page zones (future implementation):

| Zone | Content |
|------|---------|
| **Pre-vote info strip** | Audience-specific neutral hints from §3 (login, profile, or generic vote notice). |
| **Option list** | Existing poll options; no per-option eligibility badges tied to user profile. |
| **Submit control** | User-initiated vote action only; disabled state may reflect anonymous session but must not encode eligibility failure reasons. |

Forbidden pre-vote UI:

- eligibility checklist showing age range, region, gender, or trust tier for the current poll.
- “You are eligible” / “You are not eligible” banners.
- per-option “you can/cannot vote for this option” states.
- modals that block reading poll content until profile is complete.
- automatic redirect after login or profile save back to a pre-selected option.

Shared chrome continues to use `GET /users/me` for `display_name` only. Profile completeness for vote page hints uses `GET /users/me/profile` when signed in — not `GET /users/me` body extension.

---

## 5. Vote Submission and Failure UX

After the user initiates vote submission, the existing Official Vote endpoint and vote-time evaluator handle authorization. Client UX for failures must stay generic.

### 5.1 Eligibility failure (and related vote denial)

When vote submission fails for eligibility or any vote-time denial that must not leak option or rule detail:

| Rule | Requirement |
|------|-------------|
| Message tone | Single neutral user-facing message; no condition-specific branches in copy. |
| Condition detail | **Must not** distinguish age vs region vs trust vs role vs duplicate vs invalid index when doing so reveals rule boundaries or option validity. |
| Thresholds | **Must not** expose age cutoffs, region codes/names, or allowlists. |
| Option identity | **Must not** expose `option_id`, `option_index` validity, resolved option text tied to the attempt, or mapping hints. |
| Internals | **Must not** expose token, counter, shard, session id, cookie, `user_id`, request id, or trace id in user-visible copy. |

Recommended failure copy:

```text
目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。
```

Forbidden failure copy examples:

- “年齡未達 12 歲門檻”
- “居住地區不符合”
- “選項 3 無效” / “此選項不存在”
- “token 已使用” with identifiers
- “你不符合 trust level X”

Client error handling may map multiple server error codes to the **same** neutral message when required to avoid rule leakage. This phase does not change server error shapes.

### 5.2 Non-eligibility failures

Network, auth expiry, or generic server errors should use separate neutral copy only when they do not reveal eligibility or option detail. When in doubt, prefer the same generic vote failure message from §5.1.

---

## 6. Vote Success UX

On successful Official Vote submission:

| Rule | Requirement |
|------|-------------|
| Message | Generic success only (for example: vote recorded / thank you). |
| Option identity | **Must not** display `option_id` or internal option key. |
| Vote internals | **Must not** display token, counter, shard, or idempotency values. |
| Personalization | **Must not** show personalized result preview, demographic breakdown, or “people like you voted X”. |
| Ranking | **Must not** add collecting-stage answer-direction or participation signals. |

Recommended success copy:

```text
已收到你的投票。結果將依該投票的公開時程顯示。
```

---

## 7. Relationship to Profile Completion Prompt

Phases 101–103 delivered homepage-only `profile-completion-prompt.js`. Phase 105 defines how vote pages relate to that module without merging responsibilities.

| Aspect | Profile completion prompt | Vote page pre-vote UX |
|--------|----------------------------|------------------------|
| Purpose | Nudge toward `/profile` when fields are null | Inform login/profile/vote-submit context before Official Vote |
| Eligibility checker | **No** | **No** |
| Guarantee | Does not guarantee eligibility | Does not guarantee eligibility |
| Trigger data | `GET /users/me/profile` nullness only | Same nullness only when signed in; login state from shared chrome |
| `/registration` | Excluded (`data-login-state-read="disabled"`) | N/A on registration page |
| Vote history | Not used | Not used |
| Option linkage | Forbidden | Forbidden |

Future vote page implementation may:

- reuse copy principles from Phase 101 for incomplete-profile hints.
- mount a vote-page-specific info strip rather than reusing homepage mount scope from Phase 102.
- call `GET /users/me/profile` only when signed in and only to read `birth_year_month` / `residential_region` nullness.

Future vote page implementation must **not**:

- treat the profile completion prompt as a vote eligibility oracle.
- read vote history, prior outcomes, or selected option to choose prompt copy.
- persist “user was about to vote option N” across login or profile flows.

---

## 8. Raw Option Linkage Ban (Pre-vote UX)

Pre-vote and vote-submit client UX must preserve the project-wide Raw Option Linkage Ban.

**Explicit prohibition:** pre-vote UX must **not** introduce any durable or side-channel linkage that combines:

- a user's option choice, selected `option_index`, hovered option, focus state, draft selection, or inferred intent
- with `user_id`, account identity, session, device fingerprint, request id, log row, trace span, metric label, error payload, analytics event, or eligibility state

This includes:

- **Client storage:** no `localStorage` / `sessionStorage` / IndexedDB keys that pair poll id + option index + user or session for UX convenience.
- **Server logging:** no new server endpoints or middleware that record “pre-vote selected option” for analytics or UX.
- **Failure payloads:** eligibility failure responses and client error UI must not carry `option_id` or option-index validity signals.
- **Metrics / traces:** no `vote_pre_check{option_index=...}` or equivalent.
- **Post-login replay:** no restoring a pending option selection from durable storage after `/login` or `/profile` return.

Allowed:

- ephemeral in-memory UI selection on the vote page for the current page session, cleared on navigation, used only to highlight the user's current choice in the form — **without** persisting or transmitting that selection until an explicit vote submit request.

Even ephemeral selection must not be written to logs, metrics, or error reports on eligibility failure before a successful vote transaction.

---

## 9. API and Data Boundaries

### 9.1 Allowed reads (future vote page client)

| Call | When | Fields used |
|------|------|-------------|
| `GET /users/me` | Shared chrome login detection | existing `user_id` / `display_name` only; chrome displays `display_name` only |
| `GET /users/me/profile` | Signed-in vote page only | `birth_year_month`, `residential_region` nullness only |
| Poll public read APIs | Existing vote page load | poll question, options, lifecycle — no new eligibility preview fields |

### 9.2 Forbidden reads and writes

- `GET /users/me/profile` for anonymous visitors on vote page.
- New “eligibility preview” or “can I vote” API endpoints.
- Extending `GET /users/me` with profile or eligibility fields.
- Changing `GET`/`PUT /users/me/profile` behavior or response shape.
- Client calls that infer eligibility from results, counters, or vote history.

Vote submission continues through existing Official Vote / `vote-by-index` endpoints only, with unchanged transaction order and evaluator placement.

---

## 10. Behavioral Boundaries Summary

| Rule | Requirement |
|------|-------------|
| Vote-time authority | Eligibility decided only at vote time by existing evaluator. |
| No pre-vote pass/fail | Pre-vote UX never shows eligible/ineligible outcome. |
| No rule leakage | No age threshold, region condition, or trust/role detail in pre-vote or failure copy. |
| No option resolve early | No client or server pre-vote path that resolves `option_index` → `option_id` for eligibility display. |
| No index-order change | `vote-by-index` eligibility remains before option resolve. |
| Non-blocking | Pre-vote hints do not block browsing. |
| No auto navigation | No auto-redirect to `/login` or `/profile`. |
| No auto vote | No automatic vote submission. |
| Anonymous profile ban | Anonymous users do not call `GET /users/me/profile`. |
| Reference Answer isolation | Reference Answer unchanged; no profile eligibility UX on reference flows. |
| Raw Option Linkage Ban | No option choice + user/session/device/request/log/trace/metric/error linkage. |

---

## 11. Relationship to Prior Phases

| Phase | Relevance |
|-------|-----------|
| **66** | Vote-time evaluator authority, transaction ordering, generic ineligible responses, Raw Option Linkage Ban. |
| **101–103** | Profile completion prompt copy, `GET /users/me/profile` null trigger, homepage runtime boundaries. |
| **104** | Milestone checkpoint before this vote-page UX plan. |
| **105 (this doc)** | Vote page pre-vote states, submit failure/success copy, prompt relationship, linkage ban for UX. |

Phase 40 policy language that suggested showing per-user eligibility blocks on vote pages is **not** adopted for MVP pre-vote UX; Phase 66+ privacy guardrails and this plan take precedence for Official Vote surfaces.

---

## 12. Suggested Future Delivery (Not This Phase)

| Item | Path / note |
|------|-------------|
| Vote page info strip module | future client module (for example `official-vote-pre-vote-hints.js`) |
| Vote page shell hook | future vote page markup + layout integration |
| Failure/success copy guards | future frontend static tests |
| Docs | implementation phase after runtime lands; review/hardening phase after that |

This phase delivers planning documentation and docs guard tests only.

---

## 13. Boundaries Preserved

Phase 105 does not change:

- DB schema or migrations.
- `POST /registration` behavior.
- `POST /login/session` or `DELETE /login/session`.
- `UserAuthResolver` behavior.
- `GET /users/me` response shape (`user_id`, `display_name` only).
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior.
- Official Vote transaction order or `vote-by-index` eligibility before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Vote-time evaluator logic or server error code taxonomy (client mapping guidance only).
- Reference Answer auth boundary and profile eligibility exclusion.
- `creator_session` local/demo/test creator-flow separation.
- explicit non-production `X-User-Id` compatibility scope.
- ranking, demographic breakdowns, analytics linkage, precise location, or extra profile fields.

No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records may capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

---

## 14. Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
```

`design-drafts/` remains excluded from git and delivery scope.
