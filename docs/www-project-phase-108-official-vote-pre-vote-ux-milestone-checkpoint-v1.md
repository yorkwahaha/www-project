# WWW Project Phase 108 — Official Vote Pre-vote UX Milestone Checkpoint v1

**Status:** milestone checkpoint and documentation only. Consolidates the stable Official Vote pre-vote UX baseline delivered in Phases 105–107 as the reference point before subsequent vote UX or Official Vote hardening work. **No runtime, frontend JS, API, DB schema, migration, `UserAuthResolver`, Official Vote backend, vote evaluator, `vote-by-index`, Reference Answer, ranking, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.**

**Baseline:** `origin/master` after Phase 107 Official Vote pre-vote UX runtime review / hardening.

**Prior checkpoint:** [Phase 104 profile completion prompt milestone](./www-project-phase-104-profile-completion-prompt-milestone-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 108 records the completed Official Vote pre-vote UX arc on top of the Phase 104 profile completion prompt baseline:

1. Phase 105 planned vote-page neutral pre-vote hints, failure/success copy boundaries, and Raw Option Linkage Ban (docs/spec only).
2. Phase 106 implemented `official-vote-pre-vote-hints.js` on vote pages with anonymous login guidance, signed-in profile null checks, and unified neutral vote-failure copy.
3. Phase 107 reviewed and hardened the runtime with focused guards and docs guards; confirmed no eligibility checker or option choice linkage was introduced.

This checkpoint is the stable boundary reference before further vote UX or Official Vote hardening. It does not introduce new runtime behavior.

---

## 2. Phase 105–107 Delivery Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **105 (docs)** | Official Vote pre-vote eligibility UX plan — docs/spec only; pre-vote UX provides neutral hints only; Official Vote eligibility authority remains vote-time evaluator; anonymous users get `/login` guidance without `GET /users/me/profile`; signed-in incomplete profile gets `/profile` nudge without pass/fail; complete profile gets generic pre-submit notice without vote guarantee; vote failure copy is neutral without rule or internal identifier leakage; Raw Option Linkage Ban preserved | **Complete (docs)** |
| **106** | Official Vote pre-vote eligibility UX runtime — adds `official-vote-pre-vote-hints.js` mounted from `vote-page.js`; anonymous visitors do not call `GET /users/me/profile`; signed-in visitors read `GET /users/me/profile` with `credentials: 'same-origin'` and check only `birth_year_month` / `residential_region` nullness; incomplete profile shows `/profile` neutral prompt; complete profile shows general pre-submit reminder; non-blocking, no auto-redirect, no auto-vote, no `option_id` resolution, no option choice recording; frontend vote failure copy unified to one neutral message | **Complete** |
| **107** | Official Vote pre-vote UX runtime review / hardening — no runtime/API/schema/auth/vote backend behavior change; added focused guard and docs guard tests; confirmed pre-vote UX is not an eligibility checker; confirmed no option choice linkage; confirmed `/registration`, Reference Answer, `UserAuthResolver`, and vote transaction boundaries preserved; `smoke:public:local` not completed during Phase 107 because Docker Desktop Linux engine pipe was unavailable (environment blocker, not test-content failure) | **Complete** |

### 2.1 Phase references

- [Phase 105 Official Vote pre-vote eligibility UX plan](./www-project-phase-105-official-vote-pre-vote-eligibility-ux-plan-v1.md)
- [Phase 106 Official Vote pre-vote eligibility UX runtime](./www-project-phase-106-official-vote-pre-vote-eligibility-ux-runtime-v1.md)
- [Phase 107 Official Vote pre-vote UX runtime review / hardening](./www-project-phase-107-official-vote-pre-vote-ux-runtime-review-v1.md)

---

## 3. Current Stable Vote-Page Pre-vote Flow

```text
Vote page visitor (/vote/:pollId)
  → vote-page.js loads poll detail
  → mountOfficialVotePreVoteHint runs
  → readLoginState (shared chrome path)
  → if anonymous:
        show neutral /login guidance
        no GET /users/me/profile
  → if signed in:
        GET /users/me/profile (credentials: same-origin)
        parse only birth_year_month + residential_region
        if birth_year_month === null OR residential_region === null:
            show neutral /profile prompt
        else:
            show generic pre-submit reminder
  → user may browse poll options and submit vote through existing explicit submit path only
  → vote-time evaluator remains sole eligibility authority at submit
```

`/registration` remains outside this flow:

- keeps `data-login-state-read="disabled"`
- does not mount vote-page pre-vote hints
- does not read login state for pre-vote hint logic
- does not call `GET /users/me/profile` from registration UI

Homepage profile completion prompt (`profile-completion-prompt.js`, Phase 102) remains a separate mount scope on `/` only.

---

## 4. Fixed Boundaries After Phase 108

### 4.1 Eligibility authority

- Official Vote eligibility is evaluated **only** at vote time by the existing vote-time evaluator.
- Pre-vote UX is **not** an eligibility checker.
- Pre-vote UX does **not** show eligible/ineligible outcomes.
- Pre-vote UX does **not** expose age thresholds, region conditions, or trust/role rules.
- Pre-vote UX does **not** expose `option_id`, token, counter, shard, session, cookie, or `user_id` in user-visible copy.

### 4.2 Identity and profile API

- `GET /users/me` returns only `user_id` and `display_name`.
- Shared chrome still displays only `display_name` from `GET /users/me`.
- Anonymous vote-page visitors do **not** call `GET /users/me/profile`.
- Signed-in vote-page visitors use `GET /users/me/profile` only for `birth_year_month` and `residential_region` nullness.
- `GET /users/me/profile` and `PUT /users/me/profile` backend behavior is unchanged.
- Pre-vote UX does not extend `GET /users/me` response shape.

### 4.3 Pre-vote UX behavior

- Pre-vote hints do not block general browsing.
- Pre-vote hints do not auto-redirect to `/login` or `/profile`.
- Pre-vote hints do not auto-submit Official Vote.
- Pre-vote hints do not resolve `option_index` → `option_id`.
- Pre-vote hints do not record which option a user is preparing to choose.
- Complete profile does not guarantee the user can vote on the current poll.
- Frontend vote failure copy is one neutral message without condition-specific branches.
- Vote success copy remains generic without option or vote-internal identifiers.

### 4.4 Registration, Reference Answer, and auth

- `/registration` keeps `data-login-state-read="disabled"`.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.
- `UserAuthResolver` is unchanged.
- `creator_session` remains local/demo/test creator flow only and is not production user identity.
- explicit non-production `X-User-Id` compatibility remains limited to approved MVP/demo surfaces.

### 4.5 Vote transaction and durable shapes

- Official Vote transaction order is unchanged.
- `vote-by-index` eligibility remains before option resolve.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- No new option choice + user/session/device/request/log/trace/metric/error payload linkage was added.

### 4.6 Analytics and profile scope exclusion

- No demographic breakdown, ranking personalization, analytics linkage, precise location, or extra profile fields were added.
- Pre-vote runtime does not call vote APIs, `POST /registration`, `POST /login/session`, `DELETE /login/session`, or Reference Answer APIs from hint logic.

---

## 5. Coverage Baseline

Representative tests and smoke checks consolidated by Phases 105–107:

| Area | Representative coverage |
|------|-------------------------|
| Pre-vote UX plan (docs) | `tests/docs/phase-105-official-vote-pre-vote-eligibility-ux-plan-doc.test.ts` |
| Pre-vote UX runtime | `tests/frontend/phase-106-official-vote-pre-vote-eligibility-ux.test.ts`, `tests/frontend/phase-106-official-vote-pre-vote-eligibility-copy-guard.test.ts`, `tests/docs/phase-106-official-vote-pre-vote-eligibility-ux-runtime-doc.test.ts` |
| Pre-vote UX review / hardening | `tests/frontend/phase-107-official-vote-pre-vote-ux-runtime-guard.test.ts`, `tests/docs/phase-107-official-vote-pre-vote-ux-runtime-review-doc.test.ts` |
| Vote page / static asset route | `tests/frontend/vote-page.test.ts`, `tests/http/frontend-page.test.ts` |
| Local smoke | `scripts/smoke-public-local.mjs` (vote-page hint static guards when Docker is available) |
| Prior profile / prompt baseline | Phase 104 coverage for homepage `profile-completion-prompt.js`, `/profile`, registration/login boundaries |

---

## 6. Smoke Validation Note

Phase 107 recorded that `npm run smoke:public:local` could not be completed because the Docker Desktop Linux engine pipe was unavailable. That was an **environment blocker**, not a test-content failure.

When Docker Desktop is available again, rerun:

```text
npm run smoke:public:local
```

Phase 108 checkpoint validation uses `npm test` and `npm run build` as the primary gate; smoke is optional follow-up when the local Docker engine is restored.

---

## 7. Explicit Non-Changes

Phase 108 does not change:

- runtime or frontend JS behavior
- DB schema or migrations
- `src` backend behavior
- vote evaluator logic
- `POST /registration`
- `POST /login/session` or `DELETE /login/session`
- `UserAuthResolver`
- `GET /users/me` response shape
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior
- Official Vote transaction order
- `vote-by-index` eligibility before option resolve
- vote token schema or counter schema
- Reference Answer auth boundary

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id` or link an option choice with a user, session, device, request, or traceable identifier.

---

## 8. Validation

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

`design-drafts/` remains excluded from git and delivery scope.
