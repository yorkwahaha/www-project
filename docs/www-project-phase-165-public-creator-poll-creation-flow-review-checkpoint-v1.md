# WWW Project Phase 165 — Public Creator Poll Creation Flow Review & Guard Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews and locks down public creator poll creation flow boundaries for `/polls/new` and `/polls/new?live=1` without copy centralization, visual CSS polish, or runtime changes unless a small clear bug is found.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 164 public onboarding flow clarity review checkpoint (`be440b0`).

**Prior checkpoint:** [Phase 164 public onboarding flow clarity review checkpoint](./www-project-phase-164-public-onboarding-flow-clarity-review-checkpoint-v1.md).

**Related milestones:** [Phase 129 creator poll creation runtime review checkpoint](./www-project-phase-129-creator-poll-creation-runtime-review-checkpoint-v1.md), [Phase 134 auth profile flow milestone review checkpoint](./www-project-phase-134-auth-profile-flow-milestone-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 165 re-reviews the public creator poll creation flow to confirm demo/live separation, creator-session boundary, production identity separation, form payload limits, Raw Option Linkage Ban preservation, success/redirect safety, lifecycle ownership, and policy-panel layer independence.

Review focus:

1. Static/demo create page and live creator flow remain clearly separated.
2. `/polls/new?live=1` uses creator session only for local/demo/test creator flow.
3. `creator_session` must not become production public identity.
4. Production identity remains `UserAuthResolver` / login session boundary where applicable.
5. Create form must not add profile/demographic fields beyond existing public poll creation fields.
6. Option input must not create option choice + user/session/device/request/log/trace/metric/error payload linkage.
7. Create success/redirect flow must not expose internal poll/user/session/token IDs.
8. Creator ownership/lifecycle boundaries remain unchanged.
9. No result/counter/eligibility/voter-state leakage is introduced.
10. `policy-ui-placeholders.js` / `HELP_COPY` remain independent policy-panel layer.

No new creator poll creation runtime polish was applied during this checkpoint review.

**Out of scope (unchanged):** copy centralization expansion; Phase 161–164 visual/onboarding polish; `policy-ui-placeholders.js` / `HELP_COPY` bodies; backend, API, DB, migration, auth resolver; new logs, metrics, analytics, tracking, or APM traces; `design-drafts/` commits.

---

## 2. Creator Poll Creation Flow Under Review

```text
/polls/new (default)
  → parseLiveApiMode(search) === false
  → submitCreatePollDemo() only (no fetch)
  → poll_id: 'demo', status: 'demo_static'
  → demo vote/result/my-polls links (DEMO_POLL_SLUG)
  → static banner: 公開展示版 / 資料不會儲存

/polls/new?live=1
  → parseLiveApiMode(search) === true
  → ensureCreatorSessionForLiveMode()
      → GET /creator/session
      → localhost-only 401 → POST /creator/session (LOCAL_DEMO_CREATOR_USER_ID)
  → POST /creator/polls (credentials: same-origin; creator_session cookie)
  → success: renderPollSharePanel + creator manage/lifecycle controls
  → no POST /login/session, GET /users/me, GET /users/me/profile

Production identity (elsewhere, not on create page)
  → UserAuthResolver + POST /login/session + GET /users/me (display_name only in UI)
  → creator_session remains local/demo/test creator flow only
```

---

## 3. Review Checkpoint Conclusion

Phase 165 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current creator poll creation runtime remains within approved boundaries.

### Demo vs live separation

- `parseLiveApiMode` returns true only when `live=1`.
- Default submit label is demo (`建立問卷（展示用，不儲存）`); live uses `建立問卷`.
- Static path never calls `/creator/session` or `/creator/polls`.
- `create-poll.html` banner states `公開展示版` and `資料不會儲存`.

### Creator session boundary

- Live path bootstraps `creator_session` via `ensureCreatorSessionForLiveMode` before `POST /creator/polls`.
- Session bootstrap is limited to `/creator/session` with localhost-only auto-seed on 401.
- `creator_session` is not presented as production public identity or general user login.

### Production identity separation

- Create runtime does not call `POST /login/session`, `GET /users/me`, or `GET /users/me/profile`.
- Create runtime does not send `X-User-Id` or `X-Display-Name` headers.
- Voter production identity (`UserAuthResolver` / login session) remains separate from creator demo flow.

### Form payload and profile boundaries

- Live `POST /creator/polls` body limited to: `title`, `description`, `options`, `category`, `eligible_rule_id`, `closes_at`, `publish`.
- Disabled HTML fields (category, close time, eligibility) are not wired to create payload.
- No gender, address, GPS, demographic breakdown, analytics, or tracking keys on create.

### Option input and Raw Option Linkage Ban

- Options are normalized text labels in poll definition only.
- No `option_id`, per-option counters, or durable option-choice + identity linkage on create.
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or URL params store option choices.

### Success / redirect safety

- Static success uses demo slug paths only (`/vote/demo`, `/results/demo?ui_state=collecting`).
- Live success shares public poll routes (`/vote/<pollId>`, `/results/<pollId>`) without vote_token, shard_id, session_id, www_session, or raw user_id in UI.
- API failures map to neutral copy (`目前無法建立問卷，請稍後再試。`); backend payloads are not echoed.
- Creator session bootstrap failures map to `目前無法確認發起者身分，請稍後再試。`

### Lifecycle and result boundaries

- Post-create lifecycle uses `lifecycleActionsForState('collecting')` → cancel/close only.
- Create page does not fetch vote counts, result previews, voter status, or eligibility outcomes.
- `?ui_state=` mock preview remains presentation-only via `policy-ui-placeholders.js`.

### Policy panel layer independence

- `create-poll-page.js` imports `policy-ui-placeholders.js` for UI mock chrome only.
- `HELP_COPY` and policy-panel bodies remain a separate layer; create form copy uses `PUBLIC_*` constants from `public-mvp-ui.js`.

---

## 4. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-165-public-creator-poll-creation-flow-review-checkpoint.test.ts` | Consolidated creator poll creation flow boundary guards |
| `tests/frontend/phase-129-creator-poll-creation-runtime-review-checkpoint.test.ts` | Creator creation runtime guards (retained) |
| `tests/frontend/create-poll-page.test.ts` | Create page unit tests (retained) |
| `tests/docs/phase-165-public-creator-poll-creation-flow-review-checkpoint-doc.test.ts` | Doc + README index guard |

---

## 5. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-165-public-creator-poll-creation-flow-review-checkpoint.test.ts`
- `tests/docs/phase-165-public-creator-poll-creation-flow-review-checkpoint-doc.test.ts`

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Creator poll creation review does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

`creator_session` remains local/demo/test creator flow only, not production identity. Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`. Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged.
