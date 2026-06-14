# WWW Project Phase 221 — Public MVP State Copy Consistency Milestone Checkpoint v1

**Status:** milestone checkpoint, focused doc guards, frontend/static guards, and README index only. Consolidates Phase 214–220 public MVP empty / loading / error / helper / demo-live / action-state copy consistency plan, runtime delivery, and runtime review checkpoints into the stable boundary reference before any future state-copy work that might touch auth, profile, creator session, vote, eligibility, result visibility, or participation behavior.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 220 Poll Creation / My Polls state copy runtime review checkpoint (`d31143f`).

**Prior checkpoint:** [Phase 220 Poll Creation / My Polls state copy runtime review checkpoint](./www-project-phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 221 records the completed public MVP state copy consistency arc across explore, vote, results, login, registration, profile, poll creation, and my-polls surfaces. It is the stable boundary reference for what Phase 214–220 **delivered** and what those phases **must not have changed** without a separately approved phase.

This milestone answers:

1. What Phase 214–220 delivered and what remains fixed.
2. Which copy categories were allowed (frontend-owned loading / error / empty / helper / demo-live / action-state copy; allowlists; safe re-exports; static shell alignment).
3. Which auth, profile, creator session, vote, eligibility, result, `quality_badge`, and privacy boundaries the state-copy arc preserved.
4. Which future work requires a new phase with explicit governance review.

**Phase 214–220 state copy work is complete for this milestone.**

---

## 2. Phase 214–220 Milestone Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **214** | Public MVP empty / loading / error state copy consistency plan — docs/plan only; page-by-page checklist for homepage, explore, vote, results, login, registration, profile, poll creation, my-polls | **Complete (plan)** |
| **214-R** | Plan review checkpoint — approves constrained copy-only runtime slices; **APPROVED — Phase 214 plan is safe for a constrained copy-only implementation** | **Complete** |
| **215** | Explore / Vote / Results state copy minimal runtime patch — load-more failure, pre-vote hints, results demo vs live intro | **Complete** |
| **216** | Explore / Vote / Results state copy runtime review checkpoint — **APPROVED — Phase 215 copy-only; no drift identified** | **Complete** |
| **217** | Login / Registration / Profile state copy minimal runtime patch — `PUBLIC_AUTH_STATE_USER_MESSAGES`, shared login/registration/profile constants | **Complete** |
| **218** | Login / Registration / Profile state copy runtime review checkpoint — **APPROVED — Phase 217 copy-only; no drift identified** | **Complete** |
| **219** | Poll Creation / My Polls state copy minimal runtime patch — `PUBLIC_CREATOR_STATE_USER_MESSAGES`, shared create-poll / my-polls constants | **Complete** |
| **220** | Poll Creation / My Polls state copy runtime review checkpoint — **APPROVED — Phase 219 copy-only; no drift identified** | **Complete** |

### 2.1 Phase references

- [Phase 214 public MVP state copy consistency plan](./www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md)
- [Phase 214-R public MVP state copy consistency plan review checkpoint](./www-project-phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint-v1.md)
- [Phase 215 Explore / Vote / Results state copy minimal runtime patch](./www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md)
- [Phase 216 Explore / Vote / Results state copy runtime review checkpoint](./www-project-phase-216-explore-vote-results-state-copy-runtime-review-checkpoint-v1.md)
- [Phase 217 Login / Registration / Profile state copy minimal runtime patch](./www-project-phase-217-login-registration-profile-state-copy-runtime-v1.md)
- [Phase 218 Login / Registration / Profile state copy runtime review checkpoint](./www-project-phase-218-login-registration-profile-state-copy-runtime-review-checkpoint-v1.md)
- [Phase 219 Poll Creation / My Polls state copy minimal runtime patch](./www-project-phase-219-poll-creation-my-polls-state-copy-runtime-v1.md)
- [Phase 220 Poll Creation / My Polls state copy runtime review checkpoint](./www-project-phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint-v1.md)

### 2.2 Consolidated delivery facts

Phase 214–220 together delivered:

1. **Plan and plan review (214, 214-R)** — copy-only scope definition, page-by-page checklist, risk classification, and governance boundaries before runtime.
2. **Participation state copy (215, 216)** — explore load-more failure alignment; vote pre-vote hints without eligibility disclosure; results demo vs live intro separation via `syncResultsPageLeadParagraphs`.
3. **Account state copy (217, 218)** — login / registration / profile loading, error, success-adjacent, and unauthenticated copy centralized in `public-mvp-ui.js` with `PUBLIC_AUTH_STATE_USER_MESSAGES`.
4. **Creator state copy (219, 220)** — poll creation and my-polls loading, error, empty, demo-live, and action-state copy centralized with `PUBLIC_CREATOR_STATE_USER_MESSAGES`.
5. **Runtime review checkpoints (216, 218, 220)** — each confirmed copy-only delivery with no blocker before the next slice.

Runtime patches were limited to **frontend-owned state copy constants, allowlists, re-exports, and safe static shell copy** only.

---

## 3. Current State Copy Contract (Fixed)

### 3.1 Allowed copy categories (delivered)

| Category | Phase 214–220 behavior |
|----------|------------------------|
| Loading / pending copy | `PUBLIC_PENDING_USER_MESSAGES` and surface-specific `…中，請稍候。` constants |
| Load / save failure copy | `PUBLIC_LOAD_FAILURE_USER_MESSAGES` and `目前無法載入…，請稍後再試。` patterns |
| Empty states | Neutral empty-feed / empty-owned-list copy with safe CTAs |
| Unauthenticated prompts | Neutral login guidance; no session/token echo |
| Profile-incomplete / pre-vote hints | Neutral hints only; no eligibility outcome disclosure |
| Demo / live labels | Distinct demo vs `?live=1` helper copy; no unavailable production implication |
| Account state copy | `PUBLIC_AUTH_STATE_USER_MESSAGES` for login / registration / profile |
| Creator state copy | `PUBLIC_CREATOR_STATE_USER_MESSAGES` for poll creation / my-polls |
| Error resolution | `resolvePublicErrorUserMessage`; never echo foreign `error.message` |

### 3.2 Shared allowlists in `public-mvp-ui.js`

| Allowlist | Surfaces |
|-----------|----------|
| `PUBLIC_PENDING_USER_MESSAGES` | Cross-surface loading / submit pending |
| `PUBLIC_LOAD_FAILURE_USER_MESSAGES` | Cross-surface load / save failure |
| `PUBLIC_AUTH_STATE_USER_MESSAGES` | Login, registration, profile |
| `PUBLIC_CREATOR_STATE_USER_MESSAGES` | Poll creation, my-polls |

Participation surfaces (explore, vote, results) use shared `PUBLIC_*` constants and `resolvePublicErrorUserMessage`; vote pre-vote hints remain in `official-vote-pre-vote-hints.js` wired to shared neutral copy.

### 3.3 Runtime modules touched by copy runtime (215, 217, 219)

| Surface | Runtime module | API boundary unchanged |
|---------|----------------|------------------------|
| Explore | `explore-page.js` | `GET /polls/feed` |
| Vote | `vote-page.js`, `official-vote-pre-vote-hints.js` | vote-by-index `{ option_index }` only |
| Results | `result-page.js` | result visibility evaluator |
| Login | `login-page.js` | `POST /login/session` |
| Registration | `registration-page.js` | `POST /registration` only |
| Profile | `profile-page.js`, `profile.html` | `GET`/`PUT /users/me/profile` |
| Poll creation | `create-poll-page.js` | `POST /creator/polls` |
| My Polls | `my-polls-page.js` | `GET /creator/session`, `GET /creator/polls` |
| Creator lifecycle | `poll-lifecycle-controls.js` | `POST /creator/polls/:id/*` |

---

## 4. Participation Boundaries (Unchanged)

Explore / Vote / Results copy changes did not alter API calls, eligibility checks, result visibility, vote transaction order, or error handling boundaries.

- `GET /polls/feed` boundary unchanged.
- Vote pre-vote hints do not reveal eligibility results (`你符合資格` / `你不符合資格` / `已投過票` forbidden).
- Results demo vs live intro copy separated; result visibility tiers and display-safe result object ceiling unchanged.
- `resolvePublicErrorUserMessage` still gates foreign backend errors on participation surfaces.
- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- Vote-by-index remains `{ option_index }` only.
- Result visibility unchanged.

---

## 5. Account Boundaries (Unchanged)

Login / Registration / Profile copy changes did not alter auth flow, registration success behavior, profile payloads, or `/users/me` shape.

- `POST /login/session` unchanged.
- `POST /registration` unchanged.
- Registration does not auto-login and does not Set-Cookie.
- Registration does not call `GET /users/me` after success.
- `/users/me` remains only `user_id` / `display_name`.
- Profile fields remain only `birth_year_month` / `residential_region`.
- `GET`/`PUT /users/me/profile` payloads unchanged.
- Eligibility / auth / `UserAuthResolver` / profile field boundaries unchanged.

---

## 6. Creator Boundaries (Unchanged)

Poll Creation / My Polls copy changes did not alter creator session, ownership, lifecycle APIs, request payloads, or owned-list behavior.

- Poll creation request payloads unchanged.
- `POST /creator/polls` path and `credentials: 'same-origin'` unchanged.
- `prepareMyPollsLiveSession` → `GET /creator/session` unchanged.
- `fetchCreatorOwnedPolls` → `GET /creator/polls` with `CREATOR_OWNED_POLL_ALLOWED_KEYS` unchanged.
- Creator session / ownership / lifecycle APIs unchanged: `POST /creator/polls/:id/cancel`, `/close`, `/unpublish`.
- My Polls owned-list behavior unchanged.
- Demo/live copy does not imply unavailable production behavior.
- My Polls action copy does not expose hidden counters, option linkage, or internal lifecycle details.

---

## 7. Error Copy and Observability (Unchanged)

- Backend/internal/foreign error messages are not directly rendered to users.
- No debug details, request id, trace id, internal code, option id, score, rank, counts, tooltip, or explanation were added.
- No new `console.*`, analytics, APM, or debug payloads in state handlers.

---

## 8. Vote, Result, and Privacy Boundaries (Unchanged)

### 8.1 Raw Option Linkage Ban

- Raw Option Linkage Ban unchanged.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.

### 8.2 Official Vote and vote-by-index

- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- Vote-by-index remains `{ option_index }` only.
- Result visibility unchanged.

### 8.3 `quality_badge` presentation-only

`quality_badge` remains presentation-only:

- only `positive_feedback` renders **回饋良好**
- null/missing/unexpected `quality_badge` does not render
- not used for ranking/recommendation/personalization/trust/score/creator score/governance
- no tooltip/debug/explanation/counts/score/rank added

---

## 9. Milestone Checkpoint Conclusion

Phase 221 found **no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift** across the Phase 214–220 state copy consistency arc requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Public MVP state copy consistency milestone complete; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

---

## 10. Explicit Non-Changes

Phase 221 does **not** change:

- runtime or frontend JS behavior
- DB schema or migrations
- `POST /registration`, `POST /login/session`, or `DELETE /login/session`
- `UserAuthResolver`
- `GET /users/me` response shape
- `GET /users/me/profile` or `PUT /users/me/profile` backend behavior
- creator session, ownership, or lifecycle transition logic
- Official Vote transaction order
- vote-by-index eligibility before option resolve (eligibility-before-option-resolve)
- result visibility rules
- `quality_badge` derivation or public API contract
- Reference Answer auth boundary

Explicit non-goals for Phase 221 delivery:

- **no runtime change**
- **no API change**
- **no frontend change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS copy changes**
- commit `design-drafts/`

---

## 11. Focused Guard Tests

- `tests/frontend/phase-221-public-mvp-state-copy-consistency-milestone-checkpoint.test.ts`
- `tests/docs/phase-221-public-mvp-state-copy-consistency-milestone-checkpoint-doc.test.ts`

Phase 214–220 delivery guards remain the baseline:

- `tests/frontend/phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint.test.ts`
- `tests/frontend/phase-215-explore-vote-results-state-copy-runtime.test.ts`
- `tests/frontend/phase-216-explore-vote-results-state-copy-runtime-review-checkpoint.test.ts`
- `tests/frontend/phase-217-login-registration-profile-state-copy-runtime.test.ts`
- `tests/frontend/phase-218-login-registration-profile-state-copy-runtime-review-checkpoint.test.ts`
- `tests/frontend/phase-219-poll-creation-my-polls-state-copy-runtime.test.ts`
- `tests/frontend/phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint.test.ts`

---

## 12. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
```

Optional manual smoke after milestone:

```bash
npm run smoke:public:local
```

`design-drafts/` remains outside the committed delivery scope.

---

## 13. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 221 is milestone documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
