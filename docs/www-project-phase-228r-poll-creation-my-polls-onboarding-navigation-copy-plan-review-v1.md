# WWW Project Phase 228-R — Poll Creation / My Polls Onboarding Navigation Copy Plan Review v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 228 poll creation / my-polls onboarding / navigation copy consistency **plan** (frontend-owned static copy, safe creator-flow navigation guidance, page-by-page review checklist, copy principles, risk classification, and explicit non-goals) for `/polls/new`, `/my-polls`, and create ↔ my-polls next-step guidance.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 228 poll creation / my-polls onboarding navigation copy plan (`8118f0e`).

**Prior delivery:** [Phase 228 poll creation / my-polls onboarding navigation copy plan](./www-project-phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-v1.md).

**Prior governance context:** [Phase 227 account onboarding copy milestone checkpoint](./www-project-phase-227-account-onboarding-copy-milestone-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 228-R reviews the Phase 228 **plan only** to confirm:

1. Phase 228 remains plan-only; no runtime, CSS, HTML, or JS delivery was included in Phase 228.
2. Phase 228 did not modify runtime, CSS, HTML, JS, API, backend, DB, schema, migration, auth, vote, result, creator, profile, or evaluator behavior.
3. `/polls/new` and `/my-polls` are correctly grouped as **creator-flow onboarding copy** distinct from account onboarding (Phase 222–227) and state copy (Phase 219–220).
4. Future implementation is authorized only as low-risk public frontend **static copy and safe navigation guidance** polish using frontend-owned constants and safe static text.
5. Demo vs `?live=1` wording remains clear in the plan and does not authorize API selection or behavior changes.
6. Future copy must **not** imply new creator, auth, or session behavior.
7. Future copy must **not** change creator session, ownership, lifecycle, poll creation, delete, close, cancel, or unpublish behavior.
8. Future copy must **not** change registration, login, profile, or auth behavior.
9. Future copy must **not** weaken vote/result visibility or lifecycle meaning.
10. Future copy must **not** expose hidden counters, option linkage, request id, trace id, internal code, score, rank, debug details, or internal lifecycle details.
11. Future copy must **not** echo backend/internal error payloads, API `message` fields, stack traces, request ids, option ids, or internal codes.
12. `quality_badge` governance and Raw Option Linkage Ban remain explicit in the plan.
13. Suggested future guard tests and validation checklist are sufficient for a Phase 229 copy-only runtime slice.

Phase 228-R does **not** implement poll creation / my-polls onboarding copy polish. It approves the **plan scope** for a future constrained copy-only runtime phase subject to Phase 229 delivery guards.

---

## 2. Phase 228 Plan Under Review

| Area | Phase 228 plan content | Review focus |
|------|------------------------|--------------|
| Surfaces | `/polls/new`, `/my-polls`, create ↔ my-polls navigation | creator-flow onboarding copy scope only |
| Allowed future changes | `PUBLIC_CREATE_POLL_PAGE_LEAD`, `PUBLIC_CREATOR_*`, `creator-flow-copy.js`, sync functions, static HTML mount points | copy-only; no new fetch paths |
| Polish categories | poll creation guidance, demo vs live creation wording, my-polls owned-list management guidance (`PUBLIC_CREATOR_MY_POLLS_LEAD_HINT`), post-create/manage next-step navigation, signed-in/signed-out guidance where already supported | no new creator authority |
| Copy principles | simple, user-facing, non-debug, no backend echo, no new creator/auth implication, no vote/result visibility drift, demo vs live clarity | complete |
| Boundaries table | creator session, poll creation, lifecycle, registration/login/profile, vote, result visibility, `quality_badge` | preserved and explicit |
| Non-goals | DB/API/auth/vote/eligibility/result/creator lifecycle/CSS-default/linkage | complete |
| Future sequence | 228-R → 229 runtime → 229 review | gated |

**Not modified by Phase 228:** any `public/frontend/*.js` runtime, `public/*.html` shells, backend `src/`, migrations, auth/session resolvers, vote transaction paths, result evaluator.

---

## 3. Future Implementation Flow Under Review (Authorized Scope Only)

```text
/polls/new
  → create-poll.html + create-poll-page.js unchanged by default
  → future copy: page lead, demo banner, demo vs ?live=1 onboarding, post-create success hints
  → submitCreatePollDemo vs submitCreatePoll API selection unchanged
  → POST /creator/polls payload unchanged

/my-polls
  → my-polls.html + my-polls-page.js unchanged by default
  → future copy: page lead, demo dashboard vs ?live=1 owned-list explanation, sign-in/creator-session guidance
  → prepareMyPollsLiveSession → GET /creator/session unchanged
  → fetchCreatorOwnedPolls → GET /creator/polls unchanged
  → lifecycle POST /creator/polls/:id/* unchanged

Create ↔ My Polls navigation
  → creator-flow-copy.js + PUBLIC_CTA_* unchanged by default
  → future copy: cross-links and next-step hints only (href navigation)
  → no new API calls

PUBLIC_CREATOR_ONBOARDING_MESSAGES (proposed)
  → future allowlist for safe user-visible creator onboarding navigation messages
  → resolvePublicErrorUserMessage unchanged for foreign error.message
```

---

## 4. Plan Review Conclusion

Phase 228-R found **no privacy, auth, profile-field, registration, login-session, creator-session, vote transaction, eligibility, result visibility, `quality_badge` governance, or linkage gap** in the Phase 228 plan requiring plan revision before authorizing a future constrained copy-only runtime slice.

**APPROVED — Phase 228 poll creation / my-polls onboarding navigation copy plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

### 4.1 Phase 228 is plan-only

- Phase 228 delivery is documentation and doc guard tests only.
- No `public/frontend/*.js`, `public/create-poll.html`, `public/my-polls.html`, `src/`, or migration changes were made in Phase 228.

### 4.2 Future implementation scope is copy-only

- Primary future touch surface: frontend-owned constants in `public-mvp-ui.js`, `creator-flow-copy.js`, `create-poll-page.js`, `my-polls-page.js`, and static HTML onboarding shells.
- Future copy polish may align poll creation guidance, demo/live path clarity, my-polls management guidance, and create ↔ my-polls next-step wording only.
- Default forbidden: new `fetch` paths, credentials changes, API payload changes, and backend error echo unless separately approved.

### 4.3 Creator-flow surfaces are correctly scoped

- `/polls/new` and `/my-polls` are grouped as creator-flow onboarding copy, separate from account onboarding (Phase 222–227).
- Plan correctly defers to Phase 219–220 for loading/error/empty **state copy** and limits Phase 229 to onboarding/navigation guidance.

### 4.4 Demo vs live wording remains clear without behavior change

- Plan requires showcase/demo submit vs `?live=1` `POST /creator/polls` to remain distinct in copy only.
- Plan explicitly forbids changing `submitCreatePoll` / `submitCreatePollDemo` API selection logic or demo vs live API selection.

### 4.5 Plan does not imply new creator/auth/session behavior

- Plan forbids implying new login types, auto session creation, ownership authority, or lifecycle powers beyond existing APIs.
- Signed-in / signed-out guidance limited to paths already supported by runtime.

### 4.6 Creator session, ownership, lifecycle, and poll creation boundaries preserved

- Plan requires unchanged `GET /creator/session`, `GET /creator/polls`, `POST /creator/polls`, `POST /creator/polls/:id/cancel|close|unpublish`.
- Plan forbids poll creation payload changes and delete/close/cancel/unpublish behavior changes.
- `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, and `CREATOR_OWNED_POLL_ALLOWED_KEYS` remain fixed.

### 4.7 Registration / login / profile / auth boundaries preserved in plan

- Plan forbids registration auto-login, `Set-Cookie`, and registration does not call `GET /users/me` after success.
- Plan requires unchanged `POST /login/session`, `POST /registration`, and profile fields `birth_year_month` / `residential_region` only; `/users/me` remains `user_id` / `display_name` only; `GET`/`PUT /users/me/profile` unchanged.
- `UserAuthResolver` drift is out of scope.

### 4.8 Vote / result visibility and lifecycle meaning unchanged

- Plan forbids counter/tier leakage and lifecycle meaning drift in onboarding copy.
- Official Vote transaction order, vote-by-index `{ option_index }` only, eligibility-before-option-resolve, and result visibility tiers remain unchanged.

### 4.9 Future copy must not echo backend/internal error payloads

- Plan requires `resolvePublicErrorUserMessage` and existing allowlists where errors appear; never surface foreign `error.message`, API `message`, stack traces, request ids, or internal codes.

### 4.10 `quality_badge` governance unchanged

- `quality_badge` remains presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected does not render.
- Not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank added.

### 4.11 Raw Option Linkage Ban and observability preserved

- Raw Option Linkage Ban unchanged.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.
- Plan forbids durable user-option linkage and new logs/metrics/analytics/APM/debug/error payloads tying option choice to identity.

---

## 5. Authorized Future Runtime Slice (Phase 229 — Not Delivered Here)

Phase 228-R authorizes a **minimal** future copy-only runtime slice with these constraints:

| May change | Must not change |
|------------|-----------------|
| Frontend-owned creator onboarding copy in `public-mvp-ui.js`, `creator-flow-copy.js`, `create-poll-page.js`, `my-polls-page.js` | `src/**`, `migrations/**` |
| Safe static text in `create-poll.html`, `my-polls.html` onboarding mount points | `POST /creator/polls` payload and path |
| Possible `PUBLIC_CREATOR_ONBOARDING_MESSAGES` allowlist | `GET /creator/session`, `GET /creator/polls` |
| Phase 229 guard tests + doc + README | Lifecycle `POST /creator/polls/:id/*` |
| | Registration/login/profile/auth behavior |
| | Vote / eligibility / result visibility |
| | Backend/internal error payload echo |

Recommended slice: **poll creation + my-polls onboarding navigation copy** only, following the Phase 223–226 account onboarding pattern (centralize constants, sync functions, static HTML alignment, review checkpoint).

---

## 6. Focused Guard Tests

- `tests/frontend/phase-228r-poll-creation-my-polls-onboarding-navigation-copy-plan-review.test.ts`
- `tests/docs/phase-228r-poll-creation-my-polls-onboarding-navigation-copy-plan-review-doc.test.ts`

Phase 228 plan guard remains the baseline:

- `tests/docs/phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-doc.test.ts`
- `docs/www-project-phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-v1.md`

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

Phase 228-R is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
