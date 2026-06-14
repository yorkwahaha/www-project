# WWW Project Phase 234 — Public Onboarding Copy Milestone Checkpoint v1

**Status:** milestone checkpoint, focused doc guards, frontend/static guards, and README index only. Consolidates Phase 222–233 public MVP onboarding / navigation copy work — account onboarding (home/header/auth-state/registration/login/profile), creator-flow onboarding (poll creation/my-polls), and participant-flow onboarding (vote/results) — into the stable boundary reference before any future onboarding-copy work that might touch auth, profile, vote, eligibility, result visibility, creator session, or participation behavior.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 233 vote / results onboarding navigation copy runtime review checkpoint (`6167e5d`).

**Prior checkpoint:** [Phase 233 vote / results onboarding navigation copy runtime review checkpoint](./www-project-phase-233-vote-results-onboarding-navigation-copy-runtime-review-checkpoint-v1.md).

**Prior account milestone:** [Phase 227 account onboarding copy milestone checkpoint](./www-project-phase-227-account-onboarding-copy-milestone-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 234 records the completed **public onboarding copy** arc across Phase 222–233. It is the stable boundary reference for what those phases **delivered** across account, creator, and participant onboarding guidance, and what they **must not have changed** without a separately approved phase.

This milestone answers:

1. What Phase 222–233 delivered and what remains fixed.
2. Which copy categories were allowed (frontend-owned onboarding/navigation guidance, shared allowlists, safe static shell alignment, user-facing non-technical wording).
3. Which auth, profile, creator, vote, eligibility, result, `quality_badge`, and privacy boundaries the onboarding-copy arc preserved.
4. Which future work from the broader Phase 222 plan still requires a new phase with explicit governance review.

**Phase 222–233 public onboarding copy work is complete for this milestone.**

---

## 2. Phase 222–233 Milestone Summary

| Phase | Delivery | Slice | Status |
|-------|----------|-------|--------|
| **222** | Public MVP onboarding / navigation copy consistency plan — docs/plan only | account + deferred creator/participation | **Complete (plan)** |
| **222-R** | Plan review checkpoint — **APPROVED — Phase 222 onboarding/navigation copy consistency plan is safe for constrained copy-only implementation** | account | **Complete** |
| **223** | Home + header/auth-state onboarding copy minimal runtime patch — `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` | account | **Complete** |
| **224** | Home + header/auth-state onboarding copy runtime review — **APPROVED — Phase 223 copy-only; no drift identified** | account | **Complete** |
| **225** | Registration / Login / Profile onboarding navigation copy minimal runtime patch — `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` | account | **Complete** |
| **226** | Registration / Login / Profile onboarding navigation copy runtime review — **APPROVED — Phase 225 copy-only; no drift identified** | account | **Complete** |
| **228** | Poll creation / my-polls onboarding navigation copy plan — docs/plan only | creator | **Complete (plan)** |
| **228-R** | Plan review checkpoint — **APPROVED — Phase 228 plan is safe for constrained copy-only implementation** | creator | **Complete** |
| **229** | Poll creation / my-polls onboarding navigation copy minimal runtime patch — `PUBLIC_CREATOR_ONBOARDING_MESSAGES` | creator | **Complete** |
| **230** | Poll creation / my-polls onboarding navigation copy runtime review — **APPROVED — Phase 229 copy-only; no drift identified** | creator | **Complete** |
| **231** | Vote / results onboarding navigation copy plan — docs/plan only | participant | **Complete (plan)** |
| **231-R** | Plan review checkpoint — **APPROVED — Phase 231 plan is safe for constrained copy-only implementation** | participant | **Complete** |
| **232** | Vote / results onboarding navigation copy minimal runtime patch — `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` | participant | **Complete** |
| **233** | Vote / results onboarding navigation copy runtime review — **APPROVED — Phase 232 copy-only; no drift identified** | participant | **Complete** |

### 2.1 Phase references

**Account onboarding (222–226):**

- [Phase 222 public MVP onboarding navigation copy consistency plan](./www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md)
- [Phase 222-R public MVP onboarding navigation copy consistency plan review checkpoint](./www-project-phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint-v1.md)
- [Phase 223 Home + header/auth-state onboarding copy minimal runtime patch](./www-project-phase-223-home-header-auth-state-onboarding-copy-runtime-v1.md)
- [Phase 224 Home + header/auth-state onboarding copy runtime review checkpoint](./www-project-phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint-v1.md)
- [Phase 225 Registration / Login / Profile onboarding navigation copy minimal runtime patch](./www-project-phase-225-registration-login-profile-onboarding-navigation-copy-runtime-v1.md)
- [Phase 226 Registration / Login / Profile onboarding navigation copy runtime review checkpoint](./www-project-phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint-v1.md)

**Creator-flow onboarding (228–230):**

- [Phase 228 poll creation / my-polls onboarding navigation copy plan](./www-project-phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-v1.md)
- [Phase 228-R poll creation / my-polls onboarding navigation copy plan review](./www-project-phase-228r-poll-creation-my-polls-onboarding-navigation-copy-plan-review-v1.md)
- [Phase 229 poll creation / my-polls onboarding navigation copy minimal runtime patch](./www-project-phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime-v1.md)
- [Phase 230 poll creation / my-polls onboarding navigation copy runtime review checkpoint](./www-project-phase-230-poll-creation-my-polls-onboarding-navigation-copy-runtime-review-checkpoint-v1.md)

**Participant-flow onboarding (231–233):**

- [Phase 231 vote / results onboarding navigation copy plan](./www-project-phase-231-vote-results-onboarding-navigation-copy-plan-v1.md)
- [Phase 231-R vote / results onboarding navigation copy plan review](./www-project-phase-231r-vote-results-onboarding-navigation-copy-plan-review-v1.md)
- [Phase 232 vote / results onboarding navigation copy minimal runtime patch](./www-project-phase-232-vote-results-onboarding-navigation-copy-runtime-v1.md)
- [Phase 233 vote / results onboarding navigation copy runtime review checkpoint](./www-project-phase-233-vote-results-onboarding-navigation-copy-runtime-review-checkpoint-v1.md)

### 2.2 Consolidated delivery facts

Phase 222–233 together delivered:

1. **Plan and plan reviews (222, 222-R, 228, 228-R, 231, 231-R)** — onboarding/navigation copy-only scope definition, page-by-page checklists, risk classification, and governance boundaries before each runtime slice.
2. **Account onboarding copy (223–226)** — `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` and `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`; home/header/auth-state, registration → login → profile guidance; engineer-facing `fail closed` / `AUTH_REQUIRED` replaced with user-facing「會拒絕存取」; static HTML fallback aligned with JS mount points.
3. **Creator-flow onboarding copy (229–230)** — `PUBLIC_CREATOR_ONBOARDING_MESSAGES`; `/polls/new` demo vs `?live=1` guidance; `/my-polls` owned-poll management guidance; create ↔ my-polls navigation hints; engineer-facing `creator_session` / `X-User-Id` banner wording replaced with user-facing copy; `syncCreatePollPageOnboardingCopy` and `syncMyPollsPageOnboardingCopy`.
4. **Participant-flow onboarding copy (232–233)** — `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`; `/vote/:pollId` participant guidance, policy panel, follow-results side panel, vote → results navigation hints; `/results/:pollId` demo/live intro, readonly scope copy, results → vote navigation hints; `syncVotePageOnboardingCopy` and `syncResultsPageOnboardingCopy`.
5. **Runtime review checkpoints (224, 226, 230, 233)** — each confirmed copy-only delivery with no blocker before the next slice.

Runtime patches were limited to **frontend-owned onboarding/navigation copy constants, allowlists, re-exports, sync functions, and safe static shell copy** only.

**Deferred from Phase 222 plan (not delivered in 222–233):** FAQ onboarding / help copy remains a future approved phase.

---

## 3. Current Public Onboarding Copy Contract (Fixed)

### 3.1 Allowed copy categories (delivered)

| Category | Phase 222–233 behavior |
|----------|------------------------|
| Account onboarding | Home, header/auth-state, registration → login → profile flow guidance |
| Creator-flow onboarding | Poll creation demo/live guidance, my-polls management guidance, create ↔ my-polls navigation hints |
| Participant-flow onboarding | Vote participant guidance, results demo/live/readonly guidance, vote ↔ results navigation hints |
| Static HTML + JS mount alignment | `public/index.html`, `registration.html`, `login.html`, `profile.html`, `create-poll.html`, `my-polls.html`, `vote.html`, `results.html` fallback matches `PUBLIC_*` constants |
| Shared allowlists | `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, `PUBLIC_CREATOR_ONBOARDING_MESSAGES`, `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` |
| User-facing non-technical copy | Engineer-facing denial/session wording replaced with user-facing guidance |
| Navigation hints | href/text only; no new behavior behind copy |
| Error resolution | `resolvePublicErrorUserMessage`; never echo foreign `error.message` |

### 3.2 Shared allowlists in `public-mvp-ui.js`

| Allowlist | Surfaces |
|-----------|----------|
| `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` | Home, header/auth-state, profile-completion prompt alignment |
| `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` | Registration, login, profile onboarding navigation |
| `PUBLIC_CREATOR_ONBOARDING_MESSAGES` | Poll creation, my-polls, creator flow navigation hints |
| `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` | Vote policy/side panel, results intro, vote ↔ results navigation hints |

All four allowlists are merged into `PUBLIC_HINT_TEXT_MESSAGES` without changing API behavior.

### 3.3 Runtime modules touched by onboarding copy runtime

| Slice | Runtime module | API boundary unchanged |
|-------|----------------|------------------------|
| Home | `public-mvp-home.js` | no `fetch`; navigation href only |
| Header / auth-state | `auth-state-copy.js` | `GET /users/me` for `display_name` only |
| Registration | `registration-page.js` | `POST /registration` only |
| Login | `login-page.js` | `POST /login/session` |
| Profile | `profile-page.js` | `GET`/`PUT /users/me/profile` |
| Poll creation | `create-poll-page.js` | `POST /creator/polls` (live mode only) |
| My polls | `my-polls-page.js` | `GET /creator/session`, `GET /creator/polls` |
| Vote | `vote-page.js` | vote submit `{ option_index }` only |
| Results | `result-page.js` | `GET /polls/:id/results` display-safe ceiling |

Sync functions write shared constants into existing mount points only; they do not add fetch paths, storage, auth branching, or eligibility evaluation.

---

## 4. Static HTML and JS Mount Alignment (Fixed)

**Account surfaces:**

- `public/index.html` — home account-flow and sample-polls notes
- `public/registration.html` — banner, success message; `data-login-state-read="disabled"` preserved
- `public/login.html` — banner, lead, profile next-step hint
- `public/profile.html` — lead, signed-in guidance

**Creator surfaces:**

- `public/create-poll.html` — banner, live-mode hint, my-polls nav hint
- `public/my-polls.html` — banner, quota panel body, create-poll nav hint

**Participant surfaces:**

- `public/vote.html` — reminder lead, policy hint list, follow-results body, view-results nav hint
- `public/results.html` — demo intro, vote nav hint

---

## 5. Account Boundaries (Unchanged)

- `POST /login/session` unchanged.
- `POST /registration` unchanged.
- Registration does not auto-login and does not Set-Cookie.
- Registration does not call `GET /users/me` after success.
- Login behavior remains `POST /login/session` then `GET /users/me`.
- `/users/me` remains only `user_id` / `display_name`.
- Profile API remains only `birth_year_month` / `residential_region`.
- Profile completion copy does not imply guaranteed eligibility.
- No eligibility checks, vote-time evaluator reads, or qualification disclosure added.

---

## 6. Creator Boundaries (Unchanged)

- `GET /creator/session`, `GET /creator/polls`, `POST /creator/polls`, `POST /creator/polls/:id/cancel|close|unpublish` unchanged.
- Creator session, ownership, and lifecycle transition logic unchanged.
- Poll creation/delete/close/cancel/unpublish behavior unchanged.
- `parseLiveApiMode` demo vs `?live=1` selection unchanged; onboarding copy references `?live=1` for user guidance only.
- My-polls copy explains managing polls through the existing creator flow only.

---

## 7. Participation Boundaries (Unchanged)

- Official Vote transaction order unchanged (`isProfileEligibleForOfficialVote` → `resolveOfficialVoteOptionIdWithClient` → `insertVoteToken` → `incrementVoteCounter`).
- Vote-by-index remains `{ option_index }` only; eligibility-before-option-resolve unchanged.
- Result visibility tiers and lifecycle meaning unchanged.
- `syncResultsPageLeadParagraphs({ demoOnly })` demo vs live intro selection unchanged.
- Demo/preview/read-only runtime behavior unchanged.
- Vote → Results and Results → Vote navigation hints are href/text only.

---

## 8. Error Copy and Observability (Unchanged)

- Backend/internal/foreign error messages are not directly rendered to users.
- No technical/internal/debug wording shown to users on onboarding surfaces.
- No debug details, request id, trace id, internal code, option id, score, rank, counts, tooltip, or explanation were added.
- No new `console.*`, analytics, APM, or debug payloads in onboarding copy handlers.

---

## 9. Vote, Result, and Privacy Boundaries (Unchanged)

### 9.1 Raw Option Linkage Ban

- Raw Option Linkage Ban unchanged.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.

### 9.2 `quality_badge` presentation-only

`quality_badge` remains presentation-only:

- only `positive_feedback` renders **回饋良好**
- null/missing/unexpected `quality_badge` does not render
- not used for ranking/recommendation/personalization/trust/score/creator score/governance
- no tooltip/debug/explanation/counts/score/rank added

---

## 10. Milestone Checkpoint Conclusion

Phase 234 found **no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift** across the Phase 222–233 public onboarding copy arc requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Public onboarding copy milestone complete (Phase 222–233); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

---

## 11. Explicit Non-Changes

Phase 234 does **not** change:

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

Explicit non-goals for Phase 234 delivery:

- **no runtime change**
- **no API change**
- **no frontend change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS copy changes**
- commit `design-drafts/`

**Remaining not-yet-delivered slice:** FAQ onboarding / help copy — future approved phase only.

---

## 12. Focused Guard Tests

- `tests/frontend/phase-234-public-onboarding-copy-milestone-checkpoint.test.ts`
- `tests/docs/phase-234-public-onboarding-copy-milestone-checkpoint-doc.test.ts`

Phase 222–233 delivery guards remain the baseline (representative):

- `tests/frontend/phase-223-home-header-auth-state-onboarding-copy-runtime.test.ts`
- `tests/frontend/phase-225-registration-login-profile-onboarding-navigation-copy-runtime.test.ts`
- `tests/frontend/phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime.test.ts`
- `tests/frontend/phase-232-vote-results-onboarding-navigation-copy-runtime.test.ts`
- `tests/frontend/phase-233-vote-results-onboarding-navigation-copy-runtime-review-checkpoint.test.ts`

---

## 13. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 14. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 234 is milestone documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
