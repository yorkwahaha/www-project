# WWW Project Phase 150 — Public Help / Hint Text Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 149 public help / hint / helper text runtime (`PUBLIC_HINT_TEXT_MESSAGES`, shared `PUBLIC_*_HINT` constants, surface re-exports, pre-vote hints, results intro hints, creator flow / lifecycle hints, and `policy-ui-placeholders.js` / `HELP_COPY` separation) across `/login`, `/registration`, profile completion prompt, `/vote/:id` pre-vote hints, `/polls/new` demo/share panels, `/explore`, `/results/:id` intro, creator flow / lifecycle controls, and demo UI preview.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 149 public help / hint text consistency polish (`5bf28c6`).

**Prior delivery:** [Phase 149 public help / hint text consistency polish](./www-project-phase-149-public-help-hint-text-consistency-polish-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 150 reviews the Phase 149 frontend runtime polish to confirm:

1. Help / hint / helper text is frontend-owned and fixed; it does not echo backend payloads, foreign `error.message`, stack traces, or internal error codes.
2. `PUBLIC_HINT_TEXT_MESSAGES` enumerates only safe user-visible help / hint / helper copy.
3. Surface-specific `PUBLIC_*_HINT` constants re-export shared frontend-owned values across login, registration, profile prompt, pre-vote hints, explore, results intro, and creator flow.
4. Pre-vote hints (`PRE_VOTE_HINT_COPY` via `official-vote-pre-vote-hints.js`) guide login/profile completion only; they do not reveal eligibility outcomes, voter state, or option confirmation.
5. Results intro hints (`RESULTS_INTRO_*`) are fixed read-only scope copy; they do not show collecting-stage vote counts, percentages, ranking, or result preview.
6. Creator flow / lifecycle hints use shared `PUBLIC_CREATOR_*_HINT` constants without `user_id`, session id, creator token, vote token, counter shard, or internal identifiers.
7. `policy-ui-placeholders.js` / `HELP_COPY` tooltip bodies remain a separate policy-panel layer; key runtime hints are centralized in `PUBLIC_HINT_TEXT_MESSAGES` without full migration.
8. Official Vote transaction order, vote-by-index eligibility-before-resolve, and option index → `option_id` pre-resolve boundaries remain unchanged.
9. Registration boundary remains off session establishment (no auto-login, Set-Cookie, or `GET /users/me`).
10. No API path, request body, credentials policy, auth boundary, vote path, result visibility, or linkage regression was introduced by the help / hint text polish.

---

## 2. Phase 149 Delivery Under Review

| Area | Phase 149 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | `PUBLIC_HINT_TEXT_MESSAGES`, shared `PUBLIC_*_HINT` | allowlist-only hint copy |
| `login-page.js` | `LOGIN_FORM_READY_MESSAGE`, `LOGIN_SHELL_DEMO_HINT_MESSAGE` | re-export `PUBLIC_LOGIN_*_HINT` |
| `registration-page.js` | `REGISTRATION_READY_MESSAGE` | re-export `PUBLIC_REGISTRATION_READY_HINT` |
| `profile-completion-prompt.js` | `PROFILE_COMPLETION_PROMPT_MESSAGE` | neutral eligibility wording |
| `official-vote-pre-vote-hints.js` | `PRE_VOTE_HINT_COPY` re-exports | no eligibility outcome echo |
| `explore-page.js` | `EXPLORE_FEED_LIST_*`, collecting status hint | feed summary hints only |
| `result-page.js` | `RESULTS_INTRO_*` re-exports, `renderResultsReadOnlyIntro` | fixed intro; no counter preview |
| `creator-flow-copy.js` | `CREATOR_FLOW_COPY` lead / action hints | no token / session / internal id |
| `create-poll-page.js` / `public-mvp-demo.js` | demo/share panel leads | existing shared constants |

---

## 3. Current Stable Public Help / Hint Text Flow

```text
PUBLIC_HINT_TEXT_MESSAGES
  → enumerates frontend-owned help / hint / helper strings
  → surface constants re-export shared PUBLIC_*_HINT values

/login
  → LOGIN_FORM_READY_MESSAGE → PUBLIC_LOGIN_FORM_READY_HINT
  → LOGIN_SHELL_DEMO_HINT_MESSAGE → PUBLIC_LOGIN_SHELL_DEMO_HINT

/registration
  → REGISTRATION_READY_MESSAGE → PUBLIC_REGISTRATION_READY_HINT
  → still no auto-login, Set-Cookie, or GET /users/me on success

profile completion prompt
  → PROFILE_COMPLETION_PROMPT_MESSAGE → PUBLIC_PROFILE_COMPLETION_PROMPT_HINT
  → neutral wording; no eligibility outcome

/vote/:id pre-vote
  → mountOfficialVotePreVoteHint → PRE_VOTE_HINT_COPY states
  → anonymous / incomplete-profile / neutral-submit only
  → login/profile CTAs; no can_vote / age_passed / region_passed echo

/explore
  → EXPLORE_FEED_LIST_SUMMARY, EXPLORE_COLLECTING_STATUS_HINT
  → feed summary hints; no vote counts or percentages

/results/:id intro (renderResultsReadOnlyIntro)
  → RESULTS_INTRO_LEAD_HINT / SCOPE_HINT / VOTE_HINT
  → fixed read-only scope copy; hidden for cancelled/unpublished
  → separate from renderResultDisplay collecting / aggregate blocks

/results/:id display (renderResultDisplay)
  → collecting → renderCollectingStatusBlock (RESULTS_COLLECTING_SUMMARY)
  → aggregate only in revealed / locked / post_lock display-safe mode

creator flow / lifecycle
  → CREATOR_FLOW_COPY.* → PUBLIC_CREATOR_*_HINT
  → vote URL prefix only; no creator token or session id in hint text

policy-ui-placeholders.js / HELP_COPY (separate layer)
  → HELP_COPY in public-mvp-layout.js for tooltip / policy panel bodies
  → not migrated into PUBLIC_HINT_TEXT_MESSAGES (Phase 149 out-of-scope)

/vote/:id submit (when allowed)
  → POST vote-by-index body still { option_index } only
  → no option index → option_id pre-resolve
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 150 found **no privacy, auth, result visibility, eligibility, vote transaction, API contract, or linkage gap** in the Phase 149 public help / hint text runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

### 4.1 Help / hint copy is frontend-owned only

- `PUBLIC_HINT_TEXT_MESSAGES` enumerates safe user-visible help / hint / helper strings.
- Surface-specific constants re-export shared `PUBLIC_*_HINT` frontend-owned values.
- Hint handlers do not read backend JSON, API `message`, `errorCode`, stack traces, or foreign `error.message` for user-visible hint copy.

### 4.2 Login / registration / profile hints remain boundary-safe

- Login ready and demo shell hints use `PUBLIC_LOGIN_*_HINT` only.
- Registration ready hint uses `PUBLIC_REGISTRATION_READY_HINT` and reminds users to sign in after registration.
- Profile completion prompt hint uses neutral eligibility wording without outcome disclosure.

### 4.3 Pre-vote hints do not reveal eligibility outcomes

- `mountOfficialVotePreVoteHint` selects among anonymous, profile-incomplete, profile-complete, and profile-load-failed states.
- `PRE_VOTE_HINT_COPY` maps each state to fixed `PUBLIC_VOTE_PRE_VOTE_*` constants.
- Hints guide login or profile completion; they do not echo `can_vote`, `age_passed`, `region_passed`, or option confirmation.

### 4.4 Results intro hints remain scope-only without counter preview

- `renderResultsReadOnlyIntro` writes fixed `RESULTS_INTRO_*` constants only.
- Intro hints describe read-only scope and vote-page navigation; they do not interpolate result payload vote counts or percentages.
- Collecting display uses `renderCollectingStatusBlock` with `RESULTS_COLLECTING_SUMMARY` in the result display region, not intro counter preview.
- Display-safe aggregate remains gated to `revealed` / `locked` / `post_lock` via `renderResultDisplay`.

### 4.5 Explore and creator flow hints remain identifier-free

- Explore feed list summary and collecting status hints use fixed copy without vote counts or backend payload text.
- `CREATOR_FLOW_COPY` lead and action hints re-export `PUBLIC_CREATOR_*_HINT` without creator token, session id, or internal identifiers.
- `PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX` labels vote URLs only; URL value comes from poll id path builder, not token echo in hint text.

### 4.6 policy-ui-placeholders.js / HELP_COPY remain a separate policy layer

- `HELP_COPY` lives in `public-mvp-layout.js` for tooltip / policy panel bodies.
- `policy-ui-placeholders.js` imports `HELP_COPY` for collecting, lock period, eligibility, follow, and cancel/unpublish tooltips.
- Phase 149 centralized key runtime hints in `PUBLIC_HINT_TEXT_MESSAGES` without migrating full `HELP_COPY` tooltip bodies.
- This separation is intentional and documented; policy panels and runtime hints serve different UX layers.

### 4.7 Registration boundary unchanged

- Phase 149 did not alter registration flow.
- Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me` on success.

### 4.8 API path, body, and credentials policy unchanged

- Phase 149 touched help / hint UX and copy only.
- No fetch path, request body shape, or `credentials` policy changes in reviewed surfaces.

### 4.9 Auth and profile boundaries unchanged

- `/users/me` remains `user_id` + `display_name` only in header auth read.
- `/users/me/profile` remains `birth_year_month` + `residential_region` only.
- `creator_session` remains non-production identity; separate from formal voter session.
- `X-User-Id` remains explicit non-production compatibility only elsewhere; Phase 149 did not broaden its use.

### 4.10 Vote and Reference Answer boundaries unchanged

- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- No option index → `option_id` pre-resolve added.
- Reference Answer remains disconnected from UserAuthResolver and profile eligibility.

### 4.11 Raw Option Linkage Ban preserved

- Phase 149 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

### 4.12 No new observability or analytics linkage

- No new logs, metrics, analytics, tracking, APM traces, precise location fields, extra profile fields, demographic breakdown, or ranking personalization introduced by Phase 149 help / hint polish.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-150-public-help-hint-text-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-150-public-help-hint-text-runtime-review-checkpoint-doc.test.ts`

Phase 149 guard tests remain the delivery baseline:

- `tests/frontend/phase-149-public-help-hint-text-consistency-polish.test.ts`

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

When Docker Desktop remains unavailable locally, `npm run smoke:public:local` may be skipped with the same rationale recorded in prior phase checkpoints; Phase 150 doc/tests do not depend on a successful local smoke run for checkpoint completeness.

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
