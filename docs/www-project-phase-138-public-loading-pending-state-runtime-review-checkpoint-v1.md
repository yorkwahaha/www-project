# WWW Project Phase 138 — Public Loading / Pending State Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 137 public loading / pending state UX polish runtime (`PUBLIC_PENDING_USER_MESSAGES`, `setBusySubmitButton`, `markRegionBusy`, and surface-specific pending copy) across `/login`, `/registration`, `/profile`, `/polls/new`, `/vote/:id`, `/explore`, `/results/:id`, `/my-polls?live=1`, header logout, homepage profile prompt, and creator lifecycle controls.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 137 public loading / pending state UX polish (`fe93d80`).

**Prior delivery:** [Phase 137 public loading / pending state polish](./www-project-phase-137-public-loading-pending-state-polish-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 138 reviews the Phase 137 frontend runtime polish to confirm:

1. Loading / pending / submitting copy is frontend-owned and fixed; it does not echo backend payloads, foreign `error.message`, stack traces, or internal error codes.
2. Action buttons are disabled while pending and reset after success or failure.
3. Vote submit pending does not reveal option linkage, eligibility outcomes, result previews, vote tokens, or counter shards.
4. Official Vote transaction order, vote-by-index eligibility-before-resolve, and option index → `option_id` pre-resolve boundaries remain unchanged.
5. No API path, request body, credentials policy, auth boundary, vote path, result visibility, or linkage regression was introduced by the pending UX polish.

---

## 2. Phase 137 Delivery Under Review

| Area | Phase 137 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | `PUBLIC_PENDING_USER_MESSAGES`, `setBusySubmitButton`, `markRegionBusy` | allowlist-only pending copy; busy helper |
| `login-page.js`, `registration-page.js`, `profile-page.js` | aligned pending copy; busy reset on failure | auth/profile neutrality |
| `create-poll-page.js` | `CREATE_POLL_SUBMIT_PENDING_MESSAGE`; `finally` busy reset | creator create neutrality |
| `vote-page.js` | load/submit pending; initial form `aria-busy` | no option/eligibility/result leakage |
| `explore-page.js`, `result-page.js`, `my-polls-page.js` | load pending copy | no counter/aggregate preview during load |
| `poll-lifecycle-controls.js` | `setBusySubmitButton` + `LIFECYCLE_ACTION_PENDING_MESSAGE` | no creator token / internal id in pending copy |
| `login-state-ui.js` | logout pending | no session/token echo |
| `profile-completion-prompt.js` | fetch loading shell | neutral homepage prompt loading |
| `vote.html`, `results.html`, `explore.html` | initial loading copy alignment | SSR shell matches runtime constants |

---

## 3. Current Stable Public Pending / Loading Flow

```text
setBusySubmitButton(button, { busy, idleLabel, busyLabel })
  → button.disabled = busy
  → aria-busy toggled
  → textContent = busy ? busyLabel : idleLabel

markRegionBusy(element, busy)
  → aria-busy on form/region during load

/login, /registration
  → submit pending: setBusySubmitButton + frontend-owned status copy
  → failure: setBusySubmitButton(busy: false) before neutral failure message

/profile
  → load pending: PROFILE_LOADING_MESSAGE + markRegionBusy
  → save pending: PROFILE_SAVING_MESSAGE + setBusySubmitButton
  → finally: setProfileFormBusy(false)

/polls/new
  → submit pending: CREATE_POLL_SUBMIT_PENDING_MESSAGE
  → finally: reset busy when form still visible

/vote/:id
  → load pending: VOTE_PAGE_LOADING_MESSAGE + markRegionBusy(form, true)
  → submit pending: VOTE_SUBMIT_PENDING_MESSAGE + setBusySubmitButton
  → submit body still { option_index } only via vote-by-index
  → failure: setBusySubmitButton(busy: false)

/explore
  → initial/load-more pending: EXPLORE_FEED_LOADING_MESSAGE / EXPLORE_LOAD_MORE_PENDING_MESSAGE
  → feed cards remain counter-free during load

/results/:id
  → load pending: RESULT_PAGE_LOADING_MESSAGE only
  → aggregate display still gated by lifecycle evaluator after load

/my-polls?live=1
  → load pending: MY_POLLS_LOADING_MESSAGE
  → lifecycle action pending: LIFECYCLE_ACTION_PENDING_MESSAGE via setBusySubmitButton

header logout
  → LOGIN_LOGOUT_PENDING_MESSAGE via setBusySubmitButton
  → finally: restore logout button when still mounted

homepage profile prompt
  → PROFILE_COMPLETION_PROMPT_LOADING_MESSAGE during fetch only
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 138 found **no privacy, auth, result visibility, eligibility, vote transaction, API contract, or linkage gap** in the Phase 137 public loading / pending runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

### 4.1 Pending / loading copy is frontend-owned only

- `PUBLIC_PENDING_USER_MESSAGES` enumerates safe user-visible pending / loading strings ending with `請稍候。`.
- Surface-specific constants (`VOTE_SUBMIT_PENDING_MESSAGE`, `RESULT_PAGE_LOADING_MESSAGE`, etc.) follow the same pattern.
- Pending handlers do not read backend JSON, API `message`, `errorCode`, stack traces, or foreign `error.message` for user-visible loading copy.

### 4.2 Action buttons disable while pending and reset afterward

- Submit / action surfaces use `setBusySubmitButton` or equivalent `disabled` + `aria-busy`.
- Login, registration, profile save, vote submit, create poll, lifecycle transition, and logout restore busy state on failure via explicit handlers or `finally`.
- Duplicate submit is blocked while `button.disabled` is true.

### 4.3 Error paths restore busy / pending state

- Login and registration failure paths call busy reset before showing frontend-owned failure copy.
- Profile save uses `finally { setProfileFormBusy(form, false) }`.
- Vote submit catch restores submit button busy state.
- Create poll uses `finally` to reset submit button when the form remains visible.
- Logout uses `finally` to restore the logout button when still mounted.

### 4.4 `/vote/:id` submit pending remains neutral

- `VOTE_SUBMIT_PENDING_MESSAGE` and `VOTE_PAGE_LOADING_MESSAGE` contain no option id, eligibility outcome, result preview, vote token, or shard references.
- `submitVoteByIndex` still posts `{ option_index }` to `/vote-by-index` only.
- No option index → `option_id` pre-resolve was added.
- Official Vote transaction order unchanged.

### 4.5 Creator lifecycle pending remains neutral

- `LIFECYCLE_ACTION_PENDING_MESSAGE` equals generic `PUBLIC_ACTION_PENDING_MESSAGE`.
- Lifecycle transitions use `setBusySubmitButton`; failure path restores the action button.
- Pending copy does not expose creator token, session id, or internal identifiers.

### 4.6 Auth / profile / create / logout pending remains neutral

- Login, registration, profile, create-poll, and logout pending messages are frontend-owned constants.
- Pending copy does not expose `user_id`, session id, tokens, or backend payload details.
- Registration still does not auto-login, Set-Cookie, or read `/users/me` during submit pending.

### 4.7 `/explore`, `/results/:id`, `/my-polls?live=1` loading remains counter-free

- Explore feed loading copy does not show vote counts, percentages, or result previews.
- Result page loading shell uses `RESULT_PAGE_LOADING_MESSAGE` only; aggregate display still follows lifecycle evaluator after load.
- My-polls live loading copy is neutral and does not preview owned-poll counters.

### 4.8 No internal identifiers or outcome leakage in pending copy

- Reviewed pending / loading constants do not expose vote counts, result previews, voter status, or eligibility status.
- No new eligibility judgment or display was added by Phase 137 pending polish.

### 4.9 API path, body, and credentials policy unchanged

- Phase 137 touched pending UX and copy only.
- No fetch path, request body shape, or `credentials` policy changes in reviewed surfaces.

### 4.10 Auth and profile boundaries unchanged

- Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`.
- `/users/me` remains `user_id` + `display_name` only in header auth read.
- `/users/me/profile` remains `birth_year_month` + `residential_region` only.
- `creator_session` remains non-production identity; separate from formal voter session.
- `X-User-Id` remains explicit non-production compatibility only elsewhere; Phase 137 did not broaden its use.

### 4.11 Vote and Reference Answer boundaries unchanged

- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- No option index → `option_id` pre-resolve added.
- Reference Answer remains disconnected from UserAuthResolver and profile eligibility.

### 4.12 Raw Option Linkage Ban preserved

- Phase 137 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

### 4.13 No new observability or analytics linkage

- No new logs, metrics, analytics, tracking, APM traces, precise location fields, extra profile fields, demographic breakdown, or ranking personalization introduced by Phase 137 pending polish.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-138-public-loading-pending-state-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-138-public-loading-pending-state-runtime-review-checkpoint-doc.test.ts`

Phase 137 guard tests remain the delivery baseline:

- `tests/frontend/phase-137-public-loading-pending-state-polish.test.ts`

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

When Docker Desktop remains unavailable locally, `npm run smoke:public:local` may be skipped with the same rationale recorded in prior phase checkpoints; Phase 138 doc/tests do not depend on a successful local smoke run for checkpoint completeness.

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
