# WWW Project Phase 222-R — Public MVP Onboarding / Navigation Copy Consistency Plan Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 222 public MVP onboarding / navigation copy consistency **plan** (frontend-owned static copy, safe navigation guidance, page-by-page review checklist, copy principles, risk classification, and explicit non-goals) for homepage onboarding, header/navigation auth-state messaging, account-flow guidance, creator-flow guidance, participation guidance, results demo/live/readonly guidance, and FAQ / trust-levels cross-page wording alignment.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 222 public MVP onboarding / navigation copy consistency plan (`69706af`).

**Prior delivery:** [Phase 222 public MVP onboarding / navigation copy consistency plan](./www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md).

**Prior governance context:** [Phase 221 public MVP state copy consistency milestone checkpoint](./www-project-phase-221-public-mvp-state-copy-consistency-milestone-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 222-R reviews the Phase 222 **plan only** to confirm:

1. Phase 222 remains plan-only; no runtime, CSS, HTML, or JS delivery was included in Phase 222.
2. Phase 222 did not modify runtime, CSS, HTML, JS, API, backend, DB, schema, migration, auth, vote, result, creator, profile, or evaluator behavior.
3. Future onboarding/navigation implementation is authorized only as low-risk public frontend **static copy and safe navigation guidance** polish using frontend-owned constants and safe static text.
4. Future copy must **not** imply registration auto-login, `Set-Cookie`, or production behavior that does not exist.
5. Future copy must **not** guarantee vote eligibility or result availability.
6. Future copy must **not** weaken result visibility.
7. Future copy must **not** expose hidden counters, option linkage, request id, trace id, internal code, score, rank, debug details, or internal lifecycle details.
8. Future copy must **not** echo backend/internal error payloads, API `message` fields, stack traces, request ids, option ids, or internal codes.
9. Login/session, registration auto-login, profile field ceiling, creator-session boundaries, vote/eligibility/result visibility, Reference Answer, and `quality_badge` governance remain explicit in the plan.
10. Raw Option Linkage Ban and no-option-linkage observability rules remain explicit in the plan.
11. Suggested future guard tests and validation checklist are sufficient for a Phase 223 copy-only runtime slice.

Phase 222-R does **not** implement onboarding/navigation copy polish. It approves the **plan scope** for a future constrained copy-only runtime phase subject to Phase 223 delivery guards.

---

## 2. Phase 222 Plan Under Review

| Area | Phase 222 plan content | Review focus |
|------|------------------------|--------------|
| Surfaces | `/`, header/navigation, `/registration`, `/login`, `/profile`, `/polls/new`, `/my-polls`, `/vote/:pollId`, `/results/:pollId`, `/faq`, `/trust-levels` | onboarding/navigation copy scope only |
| Allowed future changes | `auth-state-copy.js`, `PUBLIC_CTA_*`, profile-completion constants, shared intro/lead constants | copy-only; no new fetch paths |
| Polish categories | homepage onboarding, auth-state banner/chip, registration-to-login, login-to-profile, profile completion, creator demo/live, vote guidance, results demo/live/readonly, FAQ/trust-levels alignment | no eligibility disclosure |
| Copy principles | neutral, user-facing, non-debug, no backend echo, no eligibility guarantee, no unavailable production promise, no hidden counters | complete |
| Boundaries table | registration, login, profile, `/users/me`, creator session, vote, result visibility, Reference Answer | preserved and explicit |
| Non-goals | DB/API/auth/vote/eligibility/result/CSS-default/linkage | complete |
| Future sequence | 222-R → 223 runtime → 224 review | gated |

**Not modified by Phase 222:** any `public/frontend/*.js` runtime, `public/*.html` shells, `public-mvp.css`, backend `src/`, migrations, auth/session resolvers, vote transaction paths, result evaluator.

---

## 3. Future Implementation Flow Under Review (Authorized Scope Only)

```text
/ (homepage)
  → index.html + profile-completion-prompt.js unchanged by default
  → future copy: hero onboarding, trust-row, account-flow preview, profile-completion prompt only
  → GET /users/me display ceiling unchanged

Header / navigation
  → auth-state-copy.js + public-mvp-layout.js + login-state-ui.js unchanged by default
  → future copy: guest/demo chip, auth banner, nav CTA labels only
  → no session/token display; registration ≠ login

/registration
  → registration.html + registration-page.js unchanged by default
  → future copy: registration-to-login guidance only
  → POST /registration only; no auto-login/Set-Cookie; no GET /users/me after success

/login
  → login.html + login-page.js unchanged by default
  → future copy: login-to-profile guidance only
  → POST /login/session unchanged

/profile
  → profile.html + profile-page.js unchanged by default
  → future copy: profile completion guidance (birth_year_month / residential_region only)
  → GET/PUT /users/me/profile unchanged

/polls/new, /my-polls
  → create-poll-page.js + my-polls-page.js unchanged by default
  → future copy: demo/live onboarding and creator-flow guidance only
  → creator session / ownership / lifecycle APIs unchanged

/vote/:pollId
  → vote.html + vote-page.js + official-vote-pre-vote-hints.js unchanged by default
  → future copy: unauthenticated/profile-incomplete guidance only
  → no eligibility outcome disclosure; submitVoteByIndex body { option_index } only

/results/:pollId
  → results.html + result-page.js unchanged by default
  → future copy: demo/live/readonly onboarding intro only
  → result visibility tiers unchanged; no counter leakage

/faq, /trust-levels
  → static policy shells unchanged by default
  → future copy: cross-page wording alignment only; no new backend reads
```

---

## 4. Plan Review Checkpoint Conclusion

Phase 222-R found **no privacy, auth, profile-field, registration, login-session, creator-session, vote transaction, eligibility, result visibility, `quality_badge` governance, or linkage gap** in the Phase 222 plan requiring plan revision before authorizing a future constrained copy-only runtime slice.

**APPROVED — Phase 222 onboarding/navigation copy consistency plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

### 4.1 Phase 222 is plan-only

- Phase 222 delivery is documentation and doc guard tests only.
- No `public/frontend/*.js`, `public/*.html`, `public-mvp.css`, `src/`, or migration changes were made in Phase 222.

### 4.2 Future implementation scope is copy-only

- Primary future touch surface: frontend-owned constants in `auth-state-copy.js`, `public-mvp-ui.js`, surface page modules, and static HTML onboarding shells.
- Future copy polish may align registration-to-login, login-to-profile, demo/live path guidance, and FAQ/trust-levels cross-page wording only.
- Default forbidden: new `fetch` paths, credentials changes, CSS/HTML layout changes, and backend error echo unless separately approved.

### 4.3 Future copy must not imply registration auto-login or unavailable production behavior

- Plan forbids auto-login and `Set-Cookie` on registration submit.
- Registration success copy must link to `/login` only; registration does not call `GET /users/me` after success.
- Demo/MVP paths (`X-User-Id`, `?live=1`, `creator_session`) must not imply production login/session/creator behavior that does not exist.

### 4.4 Future copy must not guarantee vote eligibility or result availability

- Plan preserves `official-vote-pre-vote-hints.js` neutral states: `anonymous`, `profile-incomplete`, `profile-complete`, `profile-load-failed`.
- Forbidden in future copy: `你符合資格`, `你不符合資格`, `已投過票`, `可以投票`, vote-guarantee language, result-availability guarantees before visibility evaluator allows.

### 4.5 Future copy must not weaken result visibility

- Plan forbids counter/tier leakage in results demo/live/readonly onboarding intro copy.
- Demo intro must remain distinct from live result visibility copy.

### 4.6 Future copy must not expose hidden counters, debug details, or internal lifecycle details

- Onboarding/navigation copy must not add debug details, counts, score, rank, trace, request id, option id, internal codes, or hidden lifecycle mechanics.
- My Polls and poll-creation onboarding must not expose hidden counters or ownership authority changes in copy.

### 4.7 Future copy must not echo backend/internal error payloads

- Plan requires `resolvePublicErrorUserMessage` and existing allowlists where errors appear; never surface foreign `error.message`, API `message`, stack traces, request ids, or internal codes.

### 4.8 Login / session boundary preserved in plan

- Plan requires unchanged `POST /login/session` and credential proof handling.
- `/users/me` remains only `user_id` / `display_name` for login-state display.

### 4.9 Registration boundary preserved in plan

- Plan forbids auto-login and `Set-Cookie` on registration submit.
- Registration JSON remains `display_name`, `birth_year_month`, `residential_region` only; success copy links to `/login` only.

### 4.10 Profile boundary preserved in plan

- Profile API remains `GET`/`PUT /users/me/profile` with **`birth_year_month`** and **`residential_region`** only.
- Plan forbids new profile fields and eligibility/auth/UserAuthResolver drift.

### 4.11 Creator / poll-creation boundaries preserved

- `/polls/new` demo `submitCreatePollDemo` vs `?live=1` `POST /creator/polls` split remains explicit.
- `/my-polls?live=1` `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, and lifecycle `POST /creator/polls/:id/*` remain unchanged.

### 4.12 Vote, eligibility, result, Reference Answer unchanged

- Plan explicitly excludes vote transaction order change, vote-by-index `{ option_index }` only body, eligibility-before-option-resolve change, result visibility change, and Reference Answer changes.
- No ranking, recommendation, personalization, trust, score, creator score, tooltip, debug, explanation, counts, or rank polish is authorized.

### 4.13 `quality_badge` governance unchanged

- `quality_badge` remains presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected does not render.
- Not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank added.

### 4.14 Raw Option Linkage Ban and observability preserved

- Raw Option Linkage Ban unchanged.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.
- Plan forbids durable user-option linkage and new logs/metrics/analytics/APM/debug/error payloads tying option choice to identity.

---

## 5. Authorized Future Runtime Slice (Phase 223 — Not Delivered Here)

Phase 222-R authorizes a **minimal** future copy-only runtime slice with these constraints:

| May change | Must not change |
|------------|-----------------|
| Frontend-owned onboarding/navigation copy in `auth-state-copy.js`, `public-mvp-ui.js`, and surface modules | `src/**`, `migrations/**` |
| Safe static text in homepage hero, auth banner, registration/login/profile guidance hosts | Login/session API paths and payloads |
| Phase 223 guard tests + doc + README | Registration auto-login / Set-Cookie |
| | Registration `GET /users/me` after success |
| | Profile field ceiling (`birth_year_month` / `residential_region`) |
| | Creator session / lifecycle APIs |
| | Vote / eligibility / result visibility / Reference Answer |
| | Backend/internal error payload echo |

Recommended first slice (plan §10): **homepage + header auth-state** onboarding copy only, then account-flow, creator-flow, participation, and FAQ/trust-levels alignment in separate guarded slices if needed.

---

## 6. Focused Guard Tests

- `tests/frontend/phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint.test.ts`
- `tests/docs/phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint-doc.test.ts`

Phase 222 plan guard remains the baseline:

- `tests/docs/phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-doc.test.ts`

---

## 7. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
```

---

## 8. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 222-R is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
