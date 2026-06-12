# WWW Project Phase 166 — Public My Polls / Creator Lifecycle UX Review & Guard Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews and locks down `/my-polls` and `/my-polls?live=1` creator lifecycle UX boundaries without copy centralization, visual CSS polish, or runtime changes unless a small clear bug is found.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 165 public creator poll creation flow review checkpoint (`7db73a1`).

**Prior checkpoint:** [Phase 165 public creator poll creation flow review checkpoint](./www-project-phase-165-public-creator-poll-creation-flow-review-checkpoint-v1.md).

**Related milestones:** [Phase 121 my-polls runtime review checkpoint](./www-project-phase-121-my-polls-runtime-review-checkpoint-v1.md), [Phase 130 creator lifecycle controls runtime review checkpoint](./www-project-phase-130-creator-lifecycle-controls-runtime-review-checkpoint-v1.md), [Phase 120 my-polls empty/unavailable state runtime polish](./www-project-phase-120-my-polls-empty-unavailable-state-runtime-polish-v1.md).

---

## 1. Review Purpose

Phase 166 re-reviews the public my-polls and creator lifecycle UX to confirm demo/live separation, creator-session boundary, display-safe owned-poll payloads, allowed lifecycle actions only, neutral empty/error states, creator ownership preservation, and policy-panel layer independence.

Review focus:

1. Static/demo my-polls page and live creator list remain clearly separated.
2. `/my-polls?live=1` uses creator session only for local/demo/test creator flow.
3. `creator_session` must not become production public identity.
4. My Polls UI must not show vote counts, result previews, voter state, eligibility state, counter shards, or internal tokens.
5. Lifecycle actions are limited to existing allowed creator actions only: cancel, close, unpublish, and view results when allowed by existing visibility rules.
6. Lifecycle UI must not change Official Vote transaction order, vote-by-index behavior, result visibility, or creator ownership backend rules.
7. Empty/error/unavailable states must not echo backend payload, `error.message`, stack trace, or internal error codes.
8. Creator ownership boundary remains unchanged.
9. No option choice + user/session/device/request/log/trace/metric/error payload linkage is introduced.
10. `policy-ui-placeholders.js` / `HELP_COPY` remain independent policy-panel layer.

No new my-polls or lifecycle runtime polish was applied during this checkpoint review.

**Out of scope (unchanged):** copy centralization expansion; Phase 161–165 visual/onboarding/creator-create polish; `policy-ui-placeholders.js` / `HELP_COPY` bodies; backend, API, DB, migration, auth resolver; new logs, metrics, analytics, tracking, or APM traces; `design-drafts/` commits.

---

## 2. My Polls / Creator Lifecycle Flow Under Review

```text
/my-polls (default)
  → parseLiveApiMode(search) === false
  → wireMyPollsDemoPage(): mock dashboard table (data-mock-dashboard)
  → demo row actions use buildDemoVotePath / buildDemoResultPath
  → demo lifecycle buttons show demo-only feedback (no creator API)

/my-polls?live=1
  → parseLiveApiMode(search) === true
  → mock dashboard hidden (aria-hidden)
  → mountLiveCreatorManagePanel()
      → prepareMyPollsLiveSession() → GET /creator/session (+ localhost bootstrap)
      → GET /creator/polls (credentials: same-origin; creator_session cookie)
      → isCreatorOwnedPollSafe() allowlist on each poll
      → renderCreatorManageLinks + renderCreatorLifecycleActions
  → remote 401 without localhost → sign-in-required neutral copy (not production login)

Lifecycle actions (frontend)
  → collecting: cancel, close via POST /creator/polls/:id/cancel|close
  → post_lock: unpublish via POST /creator/polls/:id/unpublish
  → revealed/locked/cancelled/unpublished: no transition buttons
  → view results: renderCreatorManageLinks → /results/:pollId?creator=1 (existing visibility rules)

Production identity (elsewhere, not on my-polls creator path)
  → UserAuthResolver + POST /login/session for voter flows
  → creator_session remains local/demo/test creator flow only
```

---

## 3. Review Checkpoint Conclusion

Phase 166 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current my-polls and creator lifecycle UX remain within approved boundaries.

### Demo vs live separation

- Default `/my-polls` renders mock dashboard rows with `data-mock-dashboard="true"`.
- `?live=1` hides mock dashboard and mounts `#creator-live-manage` with `data-live-owned-list="true"`.
- Demo row lifecycle buttons route to `showDemoOnlyFeedback`; live path uses creator APIs.

### Creator session boundary

- Live list uses `prepareMyPollsLiveSession()` and `ensureCreatorSessionForLiveMode()` on `/creator/session`.
- `GET /creator/polls` uses `credentials: 'same-origin'`; creator identity from `creator_session` cookie.
- `creator_session` is not presented as production public identity.

### Display-safe owned-poll payloads

- `CREATOR_OWNED_POLL_ALLOWED_KEYS` allowlist rejects vote counts, option ids, tokens, and counter fields.
- `fetchCreatorOwnedPolls()` fails closed to neutral copy when payload is unsafe.
- UI shows lifecycle badges and manage links only; no vote totals, percentages, voter status, or eligibility outcomes.

### Lifecycle actions and results visibility

- `lifecycleActionsForState('collecting')` → cancel/close; `post_lock` → unpublish only.
- `renderCreatorManageLinks` exposes `/results/<pollId>?creator=1` for creator results view under existing rules.
- Lifecycle transition failures map to frontend-owned neutral copy; backend bodies are not echoed.

### Empty / error / unavailable states

- Empty list: `MY_POLLS_EMPTY_MESSAGE` + link to `/polls/new?live=1`.
- Load/session failures: `MY_POLLS_LOAD_FAILURE_MESSAGE` or `CREATOR_SESSION_FAILURE`.
- Remote 401 (non-localhost): `MY_POLLS_SIGN_IN_REQUIRED_MESSAGE` with `/login` CTA (creator-session unavailable messaging, not auto-login).
- `isMyPollsSignInRequiredError()` buckets sign-in-required without reading foreign `error.message`.

### Policy panel layer independence

- `my-polls-page.js` does not import `HELP_COPY` or `policy-ui-placeholders.js` directly.
- Adjacent `creator-flow-copy.js` uses `POLICY_UI_COPY` from `policy-ui-placeholders.js` as a separate policy layer.

---

## 4. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint.test.ts` | Consolidated my-polls / lifecycle UX boundary guards |
| `tests/frontend/phase-121-my-polls-runtime-review-checkpoint.test.ts` | My-polls runtime guards (retained) |
| `tests/frontend/phase-130-creator-lifecycle-controls-runtime-review-checkpoint.test.ts` | Lifecycle controls guards (retained) |
| `tests/docs/phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint-doc.test.ts` | Doc + README index guard |

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

- `tests/frontend/phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint.test.ts`
- `tests/docs/phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint-doc.test.ts`

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

My-polls / creator lifecycle review does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

`creator_session` remains local/demo/test creator flow only, not production identity. Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged.
