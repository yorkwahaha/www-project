# WWW Project Phase 235-R — FAQ Onboarding / Help Copy Plan Review v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 235 FAQ / help onboarding copy consistency **plan** (frontend-owned static copy, safe FAQ/help guidance, cross-page alignment with completed onboarding slices, page-by-page review checklist, copy principles, risk classification, and explicit non-goals) for `/faq`, `/trust-levels`, and FAQ links from account, creator, and participant onboarding surfaces.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 235 FAQ onboarding / help copy plan (`a7f3e09`).

**Prior delivery:** [Phase 235 FAQ onboarding / help copy plan](./www-project-phase-235-faq-onboarding-help-copy-plan-v1.md).

**Prior governance context:** [Phase 234 public onboarding copy milestone checkpoint](./www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 235-R reviews the Phase 235 **plan only** to confirm:

1. Phase 235 remains plan-only; no runtime, CSS, HTML, or JS delivery was included in Phase 235.
2. Phase 235 did not modify runtime, CSS, HTML, JS, API, backend, DB, schema, migration, auth, vote, result, creator, profile, or evaluator behavior.
3. `/faq` and `/trust-levels` are correctly grouped as **FAQ/help onboarding copy** distinct from account onboarding (Phase 223–227), creator onboarding (Phase 229–230), and participant onboarding (Phase 232–233).
4. Future implementation is authorized only as low-risk public frontend **static copy and safe navigation guidance** polish using frontend-owned constants and safe static text.
5. FAQ/help copy alignment with completed onboarding slices (`PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, `PUBLIC_CREATOR_ONBOARDING_MESSAGES`, `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`) is correctly scoped.
6. Demo / preview / read-only wording remains clear in the plan and does not authorize demo vs live runtime behavior changes.
7. Plan correctly identifies engineer-facing residue in `faq.html` (`X-User-Id`, `creator_session`, `production user-auth wiring later`) as future copy cleanup targets without implying new auth/session behavior.
8. Future copy must **not** imply new login types, auto session creation, eligibility preview APIs, or vote guarantees beyond existing behavior.
9. Future copy must **not** imply profile completion guarantees voting eligibility.
10. Future copy must **not** add eligibility checks, vote-time evaluator reads, or qualification disclosure beyond existing behavior.
11. Future copy must **not** change Official Vote transaction order, vote-by-index body, or eligibility-before-option-resolve.
12. Future copy must **not** change result visibility tiers or lifecycle meaning.
13. Future copy must **not** change registration, login, profile, or auth behavior.
14. Future copy must **not** change creator session, ownership, lifecycle, poll creation, delete, close, cancel, or unpublish behavior.
15. Future copy must **not** expose hidden counters, option linkage, request id, trace id, internal code, score, rank, debug details, or internal lifecycle details.
16. Future copy must **not** echo backend/internal error payloads, API `message` fields, stack traces, request ids, option ids, or internal codes.
17. `quality_badge` governance and Raw Option Linkage Ban remain explicit in the plan.
18. Suggested future guard tests and validation checklist are sufficient for a Phase 236+ copy-only runtime slice.

Phase 235-R does **not** implement FAQ / help copy polish. It approves the **plan scope** for a future constrained copy-only runtime phase subject to Phase 236+ delivery guards.

---

## 2. Phase 235 Plan Under Review

| Area | Phase 235 plan content | Review focus |
|------|------------------------|--------------|
| Surfaces | `/faq`, `/trust-levels`, cross-page FAQ links from onboarding surfaces | FAQ/help onboarding copy scope only |
| Allowed future changes | `faq.html`, `trust-levels.html`, possible `PUBLIC_FAQ_ONBOARDING_MESSAGES`, `PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL`, `PUBLIC_PROFILE_COMPLETION_PROMPT_HINT`, `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT`, sync functions, static HTML mount points | copy-only; no new fetch paths |
| Polish categories | account flow FAQ (registration → login → profile), creator flow FAQ (create poll → my-polls), participant flow FAQ (vote → results), lifecycle/visibility FAQ, demo / preview / read-only FAQ, engineer residue removal, trust-levels cross-page alignment | no new auth/vote/eligibility behavior |
| Copy principles | simple, user-facing, non-debug, no backend echo, no new behavior implication, no eligibility disclosure expansion, no profile completion guarantee, no result visibility drift, onboarding slice alignment | complete |
| Boundaries table | Official Vote, vote-by-index, eligibility-before-option-resolve, result visibility, registration/login/profile, creator session/lifecycle, `quality_badge` | preserved and explicit |
| Engineer residue targets | `X-User-Id`, `creator_session`, `production user-auth wiring later` in `faq.html` | user-facing replacement only; no new auth behavior |
| Non-goals | DB/API/auth/vote/eligibility/result/lifecycle/creator/CSS-default/linkage | complete |
| Future sequence | 235-R → 236+ runtime → review checkpoint | gated |

**Not modified by Phase 235:** any `public/frontend/*.js` runtime, `public/faq.html`, `public/trust-levels.html` shells, backend `src/`, migrations, auth/session resolvers, vote transaction paths, result evaluator.

---

## 3. Future Implementation Flow Under Review (Authorized Scope Only)

```text
/faq
  → faq.html static policy info page unchanged by default
  → future copy: hero lead, summary cards, account/creator/participant Q&A gaps, engineer residue removal
  → cross-links to /registration, /login, /profile, /polls/new, /my-polls, /vote/demo, /results/demo (href only)
  → no fetch, storage, auth checks, or eligibility evaluation added

/trust-levels
  → trust-levels.html static policy info page unchanged by default
  → future copy: hero intro, matrix intro notes, cross-link to /faq
  → static draft matrix structure unchanged; wording only

Cross-page FAQ links
  → PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL and existing「常見問題」anchors on home, vote, my-polls, create-poll, login, results
  → link label/anchor text consistency only; href targets /faq or /trust-levels

PUBLIC_FAQ_ONBOARDING_MESSAGES (proposed)
  → future allowlist for safe user-visible FAQ onboarding messages
  → align with PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES, PUBLIC_CREATOR_ONBOARDING_MESSAGES, PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES
  → resolvePublicErrorUserMessage unchanged for foreign error.message
```

---

## 4. Plan Review Conclusion

Phase 235-R found **no privacy, auth, profile-field, registration, login-session, creator-session, vote transaction, eligibility, result visibility, `quality_badge` governance, or linkage gap** in the Phase 235 plan requiring plan revision before authorizing a future constrained copy-only runtime slice.

**APPROVED — Phase 235 FAQ onboarding / help copy plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

### 4.1 Phase 235 is plan-only

- Phase 235 delivery is documentation and doc guard tests only.
- No `public/frontend/*.js`, `public/faq.html`, `public/trust-levels.html`, `src/`, or migration changes were made in Phase 235.

### 4.2 Future implementation scope is copy-only

- Primary future touch surface: static `faq.html`, `trust-levels.html`, possible `PUBLIC_FAQ_ONBOARDING_MESSAGES` in `public-mvp-ui.js`, and existing FAQ link labels.
- Future copy polish may align FAQ answers with completed onboarding slice phrases only.
- Default forbidden: new `fetch` paths, credentials changes, API payload changes, eligibility checks for copy, and backend error echo unless separately approved.

### 4.3 FAQ/help surfaces are correctly scoped

- `/faq` and `/trust-levels` are grouped as FAQ/help onboarding copy, separate from account onboarding (Phase 223–227), creator onboarding (Phase 229–230), and participant onboarding (Phase 232–233).
- Plan correctly defers to Phase 215, 219–220 for loading/error/collecting **state copy** and limits Phase 236+ to FAQ/help guidance and cross-page phrase alignment.

### 4.4 Onboarding slice alignment is correctly planned

- Plan requires FAQ phrases for registration → login → profile, create poll → my-polls, and vote → results to match completed `PUBLIC_*_ONBOARDING_MESSAGES` constants (`PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, `PUBLIC_CREATOR_ONBOARDING_MESSAGES`, `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`).
- Profile/eligibility FAQ must align with `PUBLIC_PROFILE_COMPLETION_PROMPT_HINT` and Phase 225–227 profile guidance; 出生年月/居住地區 only.
- Collecting hidden-count FAQ must align with `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` and Phase 232–233 participant copy.
- Plan identifies account, creator, and participant FAQ gaps without reopening delivered onboarding surface rewrites.

### 4.5 Engineer-facing residue correctly identified

- Plan targets `faq.html` notes mentioning `X-User-Id`, `creator_session`, and `production user-auth wiring later` for user-facing replacement aligned with account/creator onboarding delivery.
- Engineer residue removal is copy-only; plan does not authorize new auth/session behavior or production user-auth wiring implementation.

### 4.6 Demo / preview / read-only wording remains clear without behavior change

- Plan requires demo/showcase paths (`/vote/demo`, `/results/demo`, `?live=1` notes) vs live production paths to remain distinct in copy only.
- Plan explicitly forbids changing demo vote submit behavior, creator API selection, or result visibility evaluator tiers.

### 4.7 Plan does not imply new vote/auth/eligibility behavior

- Plan forbids implying new login types, auto session creation, eligibility preview APIs, or vote guarantees beyond existing behavior.
- Plan forbids profile completion guaranteeing voting eligibility.
- Eligibility-failure FAQ must stay neutral; no expanded rule disclosure.

### 4.8 Official Vote, vote-by-index, and eligibility-before-option-resolve preserved

- Plan requires unchanged `submitVoteByIndex` body `{ option_index }` only.
- Plan forbids changing Official Vote transaction order or eligibility-before-option-resolve.
- Plan forbids new eligibility checks, vote-time evaluator reads for copy, or qualification disclosure.

### 4.9 Result visibility tiers and lifecycle meaning unchanged

- Plan forbids counter/tier leakage and lifecycle meaning drift in FAQ copy.
- Collecting hidden-count, close/lock period, cancel vs unpublish meaning must match Phase 232–233 and Phase 39 lifecycle policy.

### 4.10 Registration / login / profile / auth boundaries preserved in plan

- Plan forbids registration auto-login, `Set-Cookie`, and registration does not call `GET /users/me` after success.
- Plan requires unchanged `POST /login/session`, `POST /registration`, and profile fields `birth_year_month` / `residential_region` only; `/users/me` remains `user_id` / `display_name` only.
- `UserAuthResolver` drift is out of scope.

### 4.11 Creator session / lifecycle boundaries preserved in plan

- Plan forbids creator session, ownership, lifecycle, poll creation, delete, close, cancel, and unpublish behavior changes.
- Creator flow FAQ explains existing demo vs `?live=1` and my-polls management only.

### 4.12 Future copy must not echo backend/internal error payloads

- Plan requires existing allowlists where errors appear; never surface foreign `error.message`, API `message`, stack traces, request ids, or internal codes in FAQ answers.

### 4.13 `quality_badge` governance unchanged

- `quality_badge` remains presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected does not render.
- Not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank added.

### 4.14 Raw Option Linkage Ban and observability preserved

- Raw Option Linkage Ban unchanged.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.
- Plan forbids durable user-option linkage and new logs/metrics/analytics/APM/debug/error payloads tying option choice to identity.

---

## 5. Authorized Future Runtime Slice (Phase 236+ — Not Delivered Here)

Phase 235-R authorizes a **minimal** future copy-only runtime slice with these constraints:

| May change | Must not change |
|------------|-----------------|
| Frontend-owned FAQ/help copy in `faq.html`, `trust-levels.html` | `src/**`, `migrations/**` |
| Possible `PUBLIC_FAQ_ONBOARDING_MESSAGES` in `public-mvp-ui.js` | `submitVoteByIndex` body `{ option_index }` only |
| Engineer residue replacement with user-facing demo/production boundary copy | Official Vote transaction order |
| Cross-page FAQ link labels on existing anchors | eligibility-before-option-resolve |
| Phase 236+ guard tests + doc + README | `GET /polls/:id/results` behavior and result visibility tiers |
| | Registration/login/profile/auth behavior |
| | Creator session/lifecycle/poll creation/delete/close/cancel/unpublish behavior |
| | Backend/internal error payload echo |

Recommended slice: **FAQ + trust-levels help copy** only, following the Phase 223–233 onboarding pattern (centralize constants where needed, static HTML alignment, review checkpoint).

---

## 6. Focused Guard Tests

- `tests/frontend/phase-235r-faq-onboarding-help-copy-plan-review.test.ts`
- `tests/docs/phase-235r-faq-onboarding-help-copy-plan-review-doc.test.ts`

Phase 235 plan guard remains the baseline:

- `tests/docs/phase-235-faq-onboarding-help-copy-plan-doc.test.ts`
- `docs/www-project-phase-235-faq-onboarding-help-copy-plan-v1.md`

Phase 234 milestone guards remain the onboarding alignment baseline:

- `tests/frontend/phase-234-public-onboarding-copy-milestone-checkpoint.test.ts`
- `docs/www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md`

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

Phase 235-R is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
