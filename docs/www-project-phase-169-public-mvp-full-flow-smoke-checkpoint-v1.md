# WWW Project Phase 169 — Public MVP Full-Flow Smoke Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews the main public MVP pages and confirms major UX/privacy/security boundaries still hold together across the full flow, without copy centralization, visual CSS polish, or runtime changes unless a small clear bug is found.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 168 public explore feed UX review checkpoint (`0a93afe`).

**Prior checkpoint:** [Phase 168 public explore feed UX review checkpoint](./www-project-phase-168-public-explore-feed-ux-review-checkpoint-v1.md).

**Related milestones:** [Phase 95 registration/login full-flow smoke coverage](./www-project-phase-95-registration-login-full-flow-smoke-coverage-v1.md), [Phase 133 public participation/results flow milestone review](./www-project-phase-133-public-participation-results-flow-milestone-review-checkpoint-v1.md), [Phase 134 auth/profile flow milestone review](./www-project-phase-134-auth-profile-flow-milestone-review-checkpoint-v1.md), [Phase 164 public onboarding flow clarity review](./www-project-phase-164-public-onboarding-flow-clarity-review-checkpoint-v1.md), [Phase 165 creator poll creation flow review](./www-project-phase-165-public-creator-poll-creation-flow-review-checkpoint-v1.md), [Phase 166 my-polls creator lifecycle UX review](./www-project-phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint-v1.md), [Phase 167 results page visibility UX review](./www-project-phase-167-public-results-page-visibility-ux-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 169 re-reviews the public MVP end-to-end surface to confirm onboarding, participation, creator, and static policy pages still align on privacy, session, eligibility, counter, and linkage boundaries.

**Public pages and flows under review:**

| Route | Shell / runtime |
|-------|-----------------|
| `/` | `index.html` |
| `/registration` | `registration.html` + `registration-page.js` |
| `/login` | `login.html` + `login-page.js` |
| `/profile` | `profile.html` + `profile-page.js` |
| `/explore` | `explore.html` + `explore-page.js` |
| `/polls/new` | `create-poll.html` + `create-poll-page.js` |
| `/polls/new?live=1` | same + `parseLiveApiMode` creator path |
| `/my-polls` | `my-polls.html` + `my-polls-page.js` |
| `/my-polls?live=1` | same + live owned-list path |
| `/vote/:id` | `vote.html` + `vote-page.js` |
| `/results/:id` | `results.html` + `result-page.js` |
| `/faq` | `faq.html` (static) |
| `/trust-levels` | `trust-levels.html` (static) |

Review focus:

1. Registration → login → profile → vote onboarding remains clear and separated.
2. Registration still does not create session, `Set-Cookie`, auto-login, or read `/users/me`.
3. Login session remains the formal session creation boundary.
4. Profile remains limited to `birth_year_month` and `residential_region`.
5. Explore feed remains freshness-only, counter-free, non-personalized.
6. Create poll flow remains separated between static demo and `?live=1` creator flow.
7. My Polls creator list/lifecycle remains `creator_session` local/demo/test only.
8. Results page visibility remains counter-free except `revealed`/`locked`/`post_lock` display-safe aggregate.
9. Vote pre-vote UX does not reveal eligibility, option existence, result preview, or voter state.
10. Empty/loading/error/unavailable states must not echo backend payload, `error.message`, stack trace, or internal codes.
11. No `user_id`, session id, creator token, vote token, counter shard, trace id, or private backend identifiers are displayed.
12. No option choice + user/session/device/request/log/trace/metric/error payload linkage is introduced.
13. No logs, metrics, analytics, tracking, APM traces, or ranking personalization are introduced.
14. `policy-ui-placeholders.js` / `HELP_COPY` remain independent policy-panel layer.
15. `design-drafts/` remains untracked and uncommitted.

No new public MVP runtime polish was applied during this checkpoint review.

**Out of scope (unchanged):** copy centralization expansion; Phase 161–168 visual/onboarding/results/creator/explore polish; `policy-ui-placeholders.js` / `HELP_COPY` bodies; backend, API, DB, migration, auth resolver, feed/vote/result evaluators; new logs, metrics, analytics, tracking, or APM traces; `design-drafts/` commits.

---

## 2. Full-Flow Map Under Review

```text
Guest onboarding
  / → registration.html (data-login-state-read="disabled")
  → POST /registration (no Set-Cookie, no GET /users/me)
  → /login → POST /login/session → GET /users/me (display_name only)
  → /profile → GET/PATCH /users/me/profile (birth_year_month, residential_region only)

Discovery
  / → data-static-examples="true" (homepage mock cards)
  /explore → GET /polls/feed (freshness-only, credentials: omit)

Creator (local/demo/test)
  /polls/new → submitCreatePollDemo (static)
  /polls/new?live=1 → creator_session → POST /creator/polls
  /my-polls → data-mock-dashboard mock list
  /my-polls?live=1 → GET /creator/polls (creator_session only)

Participation
  /vote/:id → pre-vote hints (login/profile guidance only)
  → POST vote-by-index { option_index } (eligibility before option resolve on server)
  /results/:id → GET /polls/:id/results (lifecycle-tier display)
  /results/:id?creator=1 → same public results API + lifecycle panel only

Static policy
  /faq, /trust-levels → static copy; no runtime API calls
```

---

## 3. Review Checkpoint Conclusion

Phase 169 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, feed-backend, or result-evaluator patch. Public MVP full-flow boundaries remain within approved limits.

### Onboarding and session boundaries

- Registration shell opts out of login-state reads; success routes to `/login` only.
- `submitRegistrationRequest` posts profile fields only; no `POST /login/session` or `GET /users/me`.
- Login uses `POST /login/session` then `GET /users/me` for `display_name` header state.
- Profile load/save uses `birth_year_month` and `residential_region` only.

### Discovery and creator flows

- Homepage static examples (`data-static-examples`) remain separate from live `/explore` feed (`data-explore-feed="freshness-only"`).
- Explore feed validates display-safe items via `isExploreFeedItemSafe`; no counters or personalization params.
- Create poll uses `parseLiveApiMode`: demo path is local-only; `?live=1` uses `creator_session` and `POST /creator/polls`.
- My Polls mock dashboard vs `?live=1` owned list remain separated; `creator_session` is local/demo/test only, not production identity.

### Participation and results

- Vote pre-vote hints guide login/profile completion without eligibility guarantees or voter-state disclosure.
- Vote submit body remains `{ option_index }` only.
- Results use `resolveResultRenderMode`: collecting/cancelled/unpublished counter-free; revealed/locked/post_lock display-safe aggregate only.
- Creator result links (`?creator=1`) use public `GET /polls/:id/results` without visibility bypass.

### Static policy pages

- `/faq` states collecting-period counter hiding, no per-voter disclosure, and aggregate-only post-close display.
- `/trust-levels` remains draft/not-open posture for credit, points, and paid features.

### Error and identifier safety

- Cross-flow failure copy uses frontend-owned constants; no `error.message` echo in reviewed runtimes.
- No `user_id`, vote tokens, shard ids, or `option_id` in user-visible strings across reviewed surfaces.

### Policy panel layer independence

- `HELP_COPY` is defined in `public-mvp-layout.js` and consumed by `policy-ui-placeholders.js` only.
- Page runtimes import `POLICY_UI_COPY` where needed; they do not import `HELP_COPY` directly.

---

## 4. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-169-public-mvp-full-flow-smoke-checkpoint.test.ts` | Consolidated public MVP full-flow boundary guards |
| `tests/frontend/phase-134-auth-profile-flow-milestone-review-checkpoint.test.ts` | Auth/profile flow guards (retained) |
| `tests/frontend/phase-133-public-participation-results-flow-milestone-review-checkpoint.test.ts` | Participation/results guards (retained) |
| `tests/frontend/phase-164-public-onboarding-flow-clarity-review-checkpoint.test.ts` | Onboarding clarity guards (retained) |
| `tests/frontend/phase-165-public-creator-poll-creation-flow-review-checkpoint.test.ts` | Creator creation guards (retained) |
| `tests/frontend/phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint.test.ts` | My Polls lifecycle guards (retained) |
| `tests/frontend/phase-167-public-results-page-visibility-ux-review-checkpoint.test.ts` | Results visibility guards (retained) |
| `tests/frontend/phase-168-public-explore-feed-ux-review-checkpoint.test.ts` | Explore feed guards (retained) |
| `tests/docs/phase-169-public-mvp-full-flow-smoke-checkpoint-doc.test.ts` | Doc + README index guard |

**Smoke script:** `npm run smoke:public:local` (`scripts/smoke-public-local.mjs`) exercises registration → login → create → vote → results HTTP path against local PostgreSQL.

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

- `tests/frontend/phase-169-public-mvp-full-flow-smoke-checkpoint.test.ts`
- `tests/docs/phase-169-public-mvp-full-flow-smoke-checkpoint-doc.test.ts`

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Full-flow review does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility. Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. `creator_session` remains local/demo/test creator flow only.
