# WWW Project Phase 231-R — Vote / Results Onboarding Navigation Copy Plan Review v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 231 vote / results onboarding / navigation copy consistency **plan** (frontend-owned static copy, safe participant-flow navigation guidance, page-by-page review checklist, copy principles, risk classification, and explicit non-goals) for `/vote/:pollId`, `/results/:pollId`, and vote ↔ results next-step guidance.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 231 vote / results onboarding navigation copy plan (`8de0c01`).

**Prior delivery:** [Phase 231 vote / results onboarding navigation copy plan](./www-project-phase-231-vote-results-onboarding-navigation-copy-plan-v1.md).

**Prior governance context:** [Phase 230 poll creation / my-polls onboarding navigation copy runtime review checkpoint](./www-project-phase-230-poll-creation-my-polls-onboarding-navigation-copy-runtime-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 231-R reviews the Phase 231 **plan only** to confirm:

1. Phase 231 remains plan-only; no runtime, CSS, HTML, or JS delivery was included in Phase 231.
2. Phase 231 did not modify runtime, CSS, HTML, JS, API, backend, DB, schema, migration, auth, vote, result, creator, profile, or evaluator behavior.
3. `/vote/:pollId` and `/results/:pollId` are correctly grouped as **participant-flow onboarding copy** distinct from account onboarding (Phase 222–227), creator onboarding (Phase 228–230), and state copy (Phase 215).
4. Future implementation is authorized only as low-risk public frontend **static copy and safe navigation guidance** polish using frontend-owned constants and safe static text.
5. Demo / preview / read-only wording remains clear in the plan and does not authorize demo vs live runtime behavior changes.
6. Future copy must **not** imply new vote, auth, or eligibility-preview behavior.
7. Future copy must **not** imply profile completion guarantees voting eligibility.
8. Future copy must **not** add eligibility checks, vote-time evaluator reads, or qualification disclosure beyond existing behavior.
9. Future copy must **not** change Official Vote transaction order, vote-by-index body, or eligibility-before-option-resolve.
10. Future copy must **not** change result visibility tiers or lifecycle meaning.
11. Future copy must **not** change registration, login, profile, or auth behavior.
12. Future copy must **not** change creator session, ownership, lifecycle, poll creation, or my-polls behavior.
13. Future copy must **not** expose hidden counters, option linkage, request id, trace id, internal code, score, rank, debug details, or internal lifecycle details.
14. Future copy must **not** echo backend/internal error payloads, API `message` fields, stack traces, request ids, option ids, or internal codes.
15. `quality_badge` governance and Raw Option Linkage Ban remain explicit in the plan.
16. Suggested future guard tests and validation checklist are sufficient for a Phase 232 copy-only runtime slice.

Phase 231-R does **not** implement vote / results onboarding copy polish. It approves the **plan scope** for a future constrained copy-only runtime phase subject to Phase 232 delivery guards.

---

## 2. Phase 231 Plan Under Review

| Area | Phase 231 plan content | Review focus |
|------|------------------------|--------------|
| Surfaces | `/vote/:pollId`, `/results/:pollId`, vote ↔ results navigation | participant-flow onboarding copy scope only |
| Allowed future changes | `PUBLIC_VOTE_PAGE_REMINDER_LEAD`, `PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT`, `PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT`, `PUBLIC_VOTE_SUCCESS_RESULT_HINT`, `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD`, `PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD`, `PUBLIC_RESULTS_INTRO_LEAD_HINT`, `PUBLIC_CTA_*`, sync functions, static HTML mount points | copy-only; no new fetch paths |
| Polish categories | vote participant guidance, pre-vote login/profile guidance, demo / preview / read-only vote wording, results visibility guidance, vote ↔ results navigation, signed-in/signed-out guidance where already supported | no new vote authority or eligibility disclosure |
| Copy principles | simple, user-facing, non-debug, no backend echo, no new vote/auth implication, no eligibility disclosure, no result visibility drift, demo vs live clarity, read-only results clarity | complete |
| Boundaries table | Official Vote, vote-by-index, eligibility-before-option-resolve, result visibility, registration/login/profile, creator session/lifecycle, `quality_badge` | preserved and explicit |
| Non-goals | DB/API/auth/vote/eligibility/result/lifecycle/creator/CSS-default/linkage | complete |
| Future sequence | 231-R → 232 runtime → 232 review | gated |

**Not modified by Phase 231:** any `public/frontend/*.js` runtime, `public/vote.html`, `public/results.html` shells, backend `src/`, migrations, auth/session resolvers, vote transaction paths, result evaluator.

---

## 3. Future Implementation Flow Under Review (Authorized Scope Only)

```text
/vote/:pollId
  → vote.html + vote-page.js unchanged by default
  → future copy: reminder lead, policy bullets, collecting notice, pre-vote hints, demo banner, success → results hints
  → submitVoteByIndex body { option_index } only unchanged
  → mountOfficialVotePreVoteHint → GET /users/me/profile only when signed in unchanged

/results/:pollId
  → results.html + result-page.js unchanged by default
  → future copy: demo vs live intro, readonly intro (`renderResultsReadOnlyIntro`), collecting/unavailable summaries, vote cross-link hints
  → syncResultsPageLeadParagraphs demoOnly selection unchanged
  → GET /polls/:id/results display-safe result object ceiling unchanged

Vote ↔ Results navigation
  → PUBLIC_CTA_* + vote success panel + results intro vote hint unchanged by default
  → future copy: cross-links and next-step hints only (href navigation)
  → no new API calls

PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES (proposed)
  → future allowlist for safe user-visible vote/results onboarding navigation messages
  → resolvePublicErrorUserMessage unchanged for foreign error.message
```

---

## 4. Plan Review Conclusion

Phase 231-R found **no privacy, auth, profile-field, registration, login-session, creator-session, vote transaction, eligibility, result visibility, `quality_badge` governance, or linkage gap** in the Phase 231 plan requiring plan revision before authorizing a future constrained copy-only runtime slice.

**APPROVED — Phase 231 vote / results onboarding navigation copy plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

### 4.1 Phase 231 is plan-only

- Phase 231 delivery is documentation and doc guard tests only.
- No `public/frontend/*.js`, `public/vote.html`, `public/results.html`, `src/`, or migration changes were made in Phase 231.

### 4.2 Future implementation scope is copy-only

- Primary future touch surface: frontend-owned constants in `public-mvp-ui.js`, `official-vote-pre-vote-hints.js`, `vote-page.js`, `result-page.js`, and static HTML onboarding shells.
- Future copy polish may align vote participant guidance, pre-vote login/profile hints, results visibility onboarding, and vote ↔ results next-step wording only.
- Default forbidden: new `fetch` paths, credentials changes, API payload changes, eligibility checks for copy, and backend error echo unless separately approved.

### 4.3 Participant-flow surfaces are correctly scoped

- `/vote/:pollId` and `/results/:pollId` are grouped as participant-flow onboarding copy, separate from account onboarding (Phase 222–227) and creator onboarding (Phase 228–230).
- Plan correctly defers to Phase 215 for loading/error/collecting **state copy** and limits Phase 232 to onboarding/navigation guidance.

### 4.4 Demo / preview / read-only wording remains clear without behavior change

- Plan requires demo/showcase paths (`/vote/demo`, `/results/demo`) vs live poll paths to remain distinct in copy only.
- Plan explicitly forbids changing `syncResultsPageLeadParagraphs` demoOnly selection, demo vote submit behavior, or result visibility evaluator tiers.

### 4.5 Plan does not imply new vote/auth/eligibility behavior

- Plan forbids implying new login types, auto session creation, eligibility preview APIs, or vote guarantees beyond existing behavior.
- Plan forbids profile completion guaranteeing voting eligibility.
- Signed-in / signed-out guidance limited to paths already supported by runtime.

### 4.6 Official Vote, vote-by-index, and eligibility-before-option-resolve preserved

- Plan requires unchanged `submitVoteByIndex` body `{ option_index }` only.
- Plan forbids changing Official Vote transaction order or eligibility-before-option-resolve.
- Plan forbids new eligibility checks, vote-time evaluator reads for copy, or qualification disclosure.

### 4.7 Result visibility tiers and lifecycle meaning unchanged

- Plan forbids counter/tier leakage and lifecycle meaning drift in onboarding copy.
- `GET /polls/:id/results` display-safe result object ceiling and result visibility evaluator tiers remain unchanged.

### 4.8 Registration / login / profile / auth boundaries preserved in plan

- Plan forbids registration auto-login, `Set-Cookie`, and registration does not call `GET /users/me` after success.
- Plan requires unchanged `POST /login/session`, `POST /registration`, and profile fields `birth_year_month` / `residential_region` only; `/users/me` remains `user_id` / `display_name` only; `GET`/`PUT /users/me/profile` unchanged.
- Pre-vote profile read remains `GET /users/me/profile` only when signed in; anonymous must not call profile API.
- `UserAuthResolver` drift is out of scope.

### 4.9 Creator session / my-polls boundaries preserved in plan

- Plan forbids creator session, ownership, lifecycle, poll creation, and my-polls behavior changes.
- Creator results panel copy remains out of scope unless navigation host overlaps.

### 4.10 Future copy must not echo backend/internal error payloads

- Plan requires `resolvePublicErrorUserMessage` and existing allowlists where errors appear; never surface foreign `error.message`, API `message`, stack traces, request ids, or internal codes.

### 4.11 `quality_badge` governance unchanged

- `quality_badge` remains presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected does not render.
- Not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank added.

### 4.12 Raw Option Linkage Ban and observability preserved

- Raw Option Linkage Ban unchanged.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.
- Plan forbids durable user-option linkage and new logs/metrics/analytics/APM/debug/error payloads tying option choice to identity.

---

## 5. Authorized Future Runtime Slice (Phase 232 — Not Delivered Here)

Phase 231-R authorizes a **minimal** future copy-only runtime slice with these constraints:

| May change | Must not change |
|------------|-----------------|
| Frontend-owned vote/results onboarding copy in `public-mvp-ui.js`, `official-vote-pre-vote-hints.js`, `vote-page.js`, `result-page.js` | `src/**`, `migrations/**` |
| Safe static text in `vote.html`, `results.html` onboarding mount points | `submitVoteByIndex` body `{ option_index }` only |
| Possible `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` allowlist | Official Vote transaction order |
| Phase 232 guard tests + doc + README | eligibility-before-option-resolve |
| | `GET /polls/:id/results` behavior and result visibility tiers |
| | Registration/login/profile/auth behavior |
| | Creator session/lifecycle/poll creation/my-polls behavior |
| | Backend/internal error payload echo |

Recommended slice: **vote + results onboarding navigation copy** only, following the Phase 223–229 onboarding pattern (centralize constants, sync functions, static HTML alignment, review checkpoint).

---

## 6. Focused Guard Tests

- `tests/frontend/phase-231r-vote-results-onboarding-navigation-copy-plan-review.test.ts`
- `tests/docs/phase-231r-vote-results-onboarding-navigation-copy-plan-review-doc.test.ts`

Phase 231 plan guard remains the baseline:

- `tests/docs/phase-231-vote-results-onboarding-navigation-copy-plan-doc.test.ts`
- `docs/www-project-phase-231-vote-results-onboarding-navigation-copy-plan-v1.md`

---

## 7. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 8. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 231-R is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
