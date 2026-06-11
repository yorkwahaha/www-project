# WWW Project Phase 144 — Public CTA / Link Label Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 143 public CTA / link label consistency polish runtime (`PUBLIC_CTA_LINK_LABELS`, shared `PUBLIC_CTA_*` constants, and surface-specific CTA / link labels) across header auth, `/login`, `/registration`, profile prompt/page, `/vote/:id` pre-vote/success, `/results/:id`, `/explore`, `/my-polls?live=1`, `/polls/new` share/next-step, and creator lifecycle controls.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 143 public CTA / link label consistency polish (`d811bf8`).

**Prior delivery:** [Phase 143 public CTA / link label consistency polish](./www-project-phase-143-public-cta-link-label-consistency-polish-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 144 reviews the Phase 143 frontend runtime polish to confirm:

1. CTA / link labels are frontend-owned and fixed; they do not echo backend payloads, foreign `error.message`, stack traces, or internal error codes.
2. Auth / nav CTAs use `PUBLIC_CTA_*` constants only and do not expose `user_id`, session id, token, or raw auth payload in link text.
3. Login / registration CTAs do not alter registration boundary — no auto-login, Set-Cookie, or `GET /users/me` on success.
4. Profile CTAs use fixed copy (`前往個人資料`, `前往登入`) without raw `birth_year_month` / `residential_region` echo.
5. Vote CTAs remain neutral — no option id, option text confirmation, eligibility outcome, result preview, vote token, or counter shard in link text.
6. Results CTAs do not show vote counts, percentages, ranking, or result preview in link text; display-safe aggregate remains gated to `revealed` / `locked` / `post_lock` only.
7. Explore, my-polls, create-poll, and lifecycle CTAs do not expose creator token, session id, internal ids, or backend raw JSON.
8. Official Vote transaction order, vote-by-index eligibility-before-resolve, and option index → `option_id` pre-resolve boundaries remain unchanged.
9. No API path, request body, credentials policy, auth boundary, vote path, result visibility, or linkage regression was introduced by the CTA / link label polish.

---

## 2. Phase 143 Delivery Under Review

| Area | Phase 143 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | `PUBLIC_CTA_LINK_LABELS`, shared `PUBLIC_CTA_*` constants, `renderPublicNav`, `renderPollSharePanel` | allowlist-only CTA / link labels |
| `auth-state-copy.js` | header auth CTA labels (`guestPrimaryCta`, `guestSecondaryCta`, aria labels) | no `user_id` / session / token |
| `login-page.js` | `LOGIN_SUBMIT_CTA_LABEL` | fixed submit CTA |
| `registration-page.js` | `REGISTRATION_SUBMIT_CTA_LABEL` | no auto-login boundary change |
| `profile-page.js` / `profile-completion-prompt.js` | profile CTA labels | no raw profile payload echo |
| `official-vote-pre-vote-hints.js` | pre-vote login / profile CTA links | no eligibility outcome echo |
| `vote-page.js` | vote success result-page CTA | no option/eligibility/result/token/shard |
| `result-page.js` | vote / my-polls CTA links | no aggregate in CTA text |
| `explore-page.js` | feed card vote CTA | fixed copy only |
| `my-polls-page.js` | sign-in, create, vote, results CTAs | no `user_id` / session / token |
| `create-poll-page.js` | demo success next-step CTAs | no creator token / internal id |
| `creator-flow-copy.js` | creator manage link CTAs | no backend raw payload echo |
| `poll-lifecycle-controls.js` | creator results CTA | no creator token / session / internal id |

---

## 3. Current Stable Public CTA / Link Label Flow

```text
PUBLIC_CTA_LINK_LABELS
  → enumerates frontend-owned CTA / link label strings
  → surface constants re-export shared PUBLIC_CTA_* values

header auth / nav
  → AUTH_STATE_COPY guest CTAs → PUBLIC_CTA_REGISTER_LABEL / PUBLIC_CTA_SIGN_IN_LABEL
  → renderPublicNav uses PUBLIC_CTA_* nav labels only

/login
  → LOGIN_SUBMIT_CTA_LABEL (fixed submit button)

/registration
  → REGISTRATION_SUBMIT_CTA_LABEL (fixed submit button)
  → still no auto-login, Set-Cookie, or GET /users/me on success

/profile prompt / page
  → PUBLIC_CTA_GO_TO_PROFILE_LABEL / PUBLIC_CTA_GO_TO_LOGIN_LABEL
  → no birth_year_month / residential_region interpolation in CTA text

/vote/:id pre-vote
  → PRE_VOTE_HINT_LINKS login / profile CTA labels
  → neutral guidance; no eligibility outcome

/vote/:id success
  → VOTE_RESULT_CTA_LABEL → neutral result-page link

/vote/:id submit (when allowed)
  → POST vote-by-index body still { option_index } only
  → no option index → option_id pre-resolve

/results/:id
  → RESULTS_VOTE_CTA_LABEL / RESULTS_MY_POLLS_CTA_LABEL (no aggregate in CTA text)
  → revealed / locked / post_lock → display-safe aggregate mode only

/explore
  → EXPLORE_VOTE_CTA_LABEL (fixed feed card CTA)

/my-polls?live=1
  → MY_POLLS_*_CTA_LABEL (fixed; no user_id / session / token)

/polls/new demo success
  → CREATE_POLL_DEMO_*_CTA_LABEL (next-step links; no creator token / internal id)

create share panel
  → PUBLIC_CTA_OPEN_VOTE_PAGE_LABEL, copy / share labels

creator flow / lifecycle
  → CREATOR_FLOW_*_CTA_LABEL, LIFECYCLE_CREATOR_RESULTS_CTA_LABEL
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 144 found **no privacy, auth, result visibility, eligibility, vote transaction, API contract, or linkage gap** in the Phase 143 public CTA / link label runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

### 4.1 CTA / link labels are frontend-owned only

- `PUBLIC_CTA_LINK_LABELS` enumerates safe user-visible CTA / link label strings.
- Surface-specific constants (`LOGIN_SUBMIT_CTA_LABEL`, `VOTE_RESULT_CTA_LABEL`, `RESULTS_VOTE_CTA_LABEL`, `MY_POLLS_LOGIN_CTA_LABEL`, etc.) re-export shared `PUBLIC_CTA_*` frontend-owned values.
- CTA handlers do not read backend JSON, API `message`, `errorCode`, stack traces, or foreign `error.message` for user-visible link text.

### 4.2 Auth / nav CTA remains identifier-free

- `AUTH_STATE_COPY.guestPrimaryCta` and `guestSecondaryCta` map to `PUBLIC_CTA_REGISTER_LABEL` and `PUBLIC_CTA_SIGN_IN_LABEL`.
- Aria labels guide to sign-in / register without `user_id`, session id, token, or raw auth payload.

### 4.3 Login / registration CTA boundary unchanged

- `LOGIN_SUBMIT_CTA_LABEL` and `REGISTRATION_SUBMIT_CTA_LABEL` are fixed frontend strings.
- Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me` on success.

### 4.4 Profile CTA does not echo raw payload

- `PROFILE_GO_TO_PROFILE_CTA_LABEL` and `PROFILE_COMPLETION_PROMPT_CTA_LABEL` are fixed frontend strings.
- CTA text does not interpolate `birth_year_month`, `residential_region`, or response JSON.

### 4.5 Vote CTA remains neutral

- `VOTE_RESULT_CTA_LABEL` uses neutral navigation copy (`查看公開結果頁`) without option, eligibility, result, token, or shard references.
- `PRE_VOTE_HINT_LINKS` login / profile labels remain neutral without eligibility outcome echo.
- `submitVoteByIndex` still posts `{ option_index }` to `/vote-by-index` only.
- No option index → `option_id` pre-resolve was added.
- Official Vote transaction order unchanged.

### 4.6 Results CTA remains free of aggregate preview in link text

- `RESULTS_VOTE_CTA_LABEL` and `RESULTS_MY_POLLS_CTA_LABEL` do not expose vote counts, percentages, ranking, or trends in CTA text.
- `resolveResultRenderMode` still gates display-safe aggregate to `revealed` / `locked` / `post_lock` only.

### 4.7 Explore, my-polls, create-poll, and lifecycle CTAs remain identifier-free

- `EXPLORE_VOTE_CTA_LABEL`, `MY_POLLS_*_CTA_LABEL`, `CREATE_POLL_DEMO_*_CTA_LABEL`, `CREATOR_FLOW_*_CTA_LABEL`, and `LIFECYCLE_CREATOR_RESULTS_CTA_LABEL` are fixed copy.
- CTA text does not expose creator token, session id, internal identifiers, or backend raw JSON.

### 4.8 API path, body, and credentials policy unchanged

- Phase 143 touched CTA / link label UX and copy only.
- No fetch path, request body shape, or `credentials` policy changes in reviewed surfaces.

### 4.9 Auth and profile boundaries unchanged

- `/users/me` remains `user_id` + `display_name` only in header auth read.
- `/users/me/profile` remains `birth_year_month` + `residential_region` only.
- `creator_session` remains non-production identity; separate from formal voter session.
- `X-User-Id` remains explicit non-production compatibility only elsewhere; Phase 143 did not broaden its use.

### 4.10 Vote and Reference Answer boundaries unchanged

- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- No option index → `option_id` pre-resolve added.
- Reference Answer remains disconnected from UserAuthResolver and profile eligibility.

### 4.11 Raw Option Linkage Ban preserved

- Phase 143 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

### 4.12 No new observability or analytics linkage

- No new logs, metrics, analytics, tracking, APM traces, precise location fields, extra profile fields, demographic breakdown, or ranking personalization introduced by Phase 143 CTA polish.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-144-public-cta-link-label-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-144-public-cta-link-label-runtime-review-checkpoint-doc.test.ts`

Phase 143 guard tests remain the delivery baseline:

- `tests/frontend/phase-143-public-cta-link-label-consistency-polish.test.ts`

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

When Docker Desktop remains unavailable locally, `npm run smoke:public:local` may be skipped with the same rationale recorded in prior phase checkpoints; Phase 144 doc/tests do not depend on a successful local smoke run for checkpoint completeness.

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
