# WWW Project Phase 238 — Public Onboarding + FAQ Copy Final Milestone Checkpoint v1

**Status:** final milestone checkpoint, focused doc guards, frontend/static guards, and README index only. Consolidates Phase 222–237 public MVP onboarding / navigation / FAQ / help copy work — account onboarding (home/header/auth-state/registration/login/profile), creator-flow onboarding (poll creation/my-polls), participant-flow onboarding (vote/results), and FAQ/help onboarding — into the stable boundary reference before any future public copy work that might touch auth, profile, vote, eligibility, result visibility, creator session, or participation behavior.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 237 FAQ onboarding / help copy runtime review checkpoint (`68f2ad3`).

**Prior checkpoint:** [Phase 237 FAQ onboarding / help copy runtime review checkpoint](./www-project-phase-237-faq-onboarding-help-copy-runtime-review-checkpoint-v1.md).

**Prior milestone:** [Phase 234 public onboarding copy milestone checkpoint](./www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 238 records the completed **public onboarding + FAQ / help copy** arc across Phase 222–237. It is the final stable boundary reference for what those phases **delivered** across account, creator, participant, and FAQ/help onboarding guidance, and what they **must not have changed** without a separately approved phase.

This milestone answers:

1. What Phase 222–237 delivered and what remains fixed.
2. Which copy categories were allowed (frontend-owned onboarding/navigation/FAQ guidance, shared allowlists, safe static shell alignment, user-facing non-technical wording).
3. Which auth, profile, creator, vote, eligibility, result, `quality_badge`, and privacy boundaries the onboarding-copy arc preserved.
4. That FAQ no longer exposes engineer-facing terms (`X-User-Id`, `creator_session`, `production user-auth wiring later`) to users on `/faq`.
5. Which future work still requires a new phase with explicit governance review.

**Phase 222–237 public onboarding + FAQ / help copy work is complete for this final milestone.**

---

## 2. Phase 222–237 Milestone Summary

| Phase | Delivery | Slice | Status |
|-------|----------|-------|--------|
| **222** | Public MVP onboarding / navigation copy consistency plan — docs/plan only | account + deferred creator/participation | **Complete (plan)** |
| **222-R** | Plan review checkpoint — **APPROVED** | account | **Complete** |
| **223** | Home + header/auth-state onboarding copy minimal runtime patch — `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` | account | **Complete** |
| **224** | Home + header/auth-state onboarding copy runtime review — **APPROVED** | account | **Complete** |
| **225** | Registration / Login / Profile onboarding navigation copy minimal runtime patch — `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` | account | **Complete** |
| **226** | Registration / Login / Profile onboarding navigation copy runtime review — **APPROVED** | account | **Complete** |
| **228** | Poll creation / my-polls onboarding navigation copy plan — docs/plan only | creator | **Complete (plan)** |
| **228-R** | Plan review checkpoint — **APPROVED** | creator | **Complete** |
| **229** | Poll creation / my-polls onboarding navigation copy minimal runtime patch — `PUBLIC_CREATOR_ONBOARDING_MESSAGES` | creator | **Complete** |
| **230** | Poll creation / my-polls onboarding navigation copy runtime review — **APPROVED** | creator | **Complete** |
| **231** | Vote / results onboarding navigation copy plan — docs/plan only | participant | **Complete (plan)** |
| **231-R** | Plan review checkpoint — **APPROVED** | participant | **Complete** |
| **232** | Vote / results onboarding navigation copy minimal runtime patch — `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` | participant | **Complete** |
| **233** | Vote / results onboarding navigation copy runtime review — **APPROVED** | participant | **Complete** |
| **234** | Public onboarding copy milestone checkpoint (222–233) — docs/guards only | account + creator + participant | **Complete** |
| **235** | FAQ onboarding / help copy plan — docs/plan only | FAQ/help | **Complete (plan)** |
| **235-R** | Plan review checkpoint — **APPROVED** | FAQ/help | **Complete** |
| **236** | FAQ onboarding / help copy minimal runtime patch — `PUBLIC_FAQ_ONBOARDING_MESSAGES` | FAQ/help | **Complete** |
| **237** | FAQ onboarding / help copy runtime review — **APPROVED** | FAQ/help | **Complete** |

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

**Interim milestone (234):**

- [Phase 234 public onboarding copy milestone checkpoint](./www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md)

**FAQ / help onboarding (235–237):**

- [Phase 235 FAQ onboarding / help copy plan](./www-project-phase-235-faq-onboarding-help-copy-plan-v1.md)
- [Phase 235-R FAQ onboarding / help copy plan review](./www-project-phase-235r-faq-onboarding-help-copy-plan-review-v1.md)
- [Phase 236 FAQ onboarding / help copy minimal runtime patch](./www-project-phase-236-faq-onboarding-help-copy-runtime-v1.md)
- [Phase 237 FAQ onboarding / help copy runtime review checkpoint](./www-project-phase-237-faq-onboarding-help-copy-runtime-review-checkpoint-v1.md)

### 2.2 Consolidated delivery facts

Phase 222–237 together delivered:

1. **Plan and plan reviews (222, 222-R, 228, 228-R, 231, 231-R, 235, 235-R)** — onboarding/navigation/FAQ copy-only scope definition, page-by-page checklists, risk classification, and governance boundaries before each runtime slice.
2. **Account onboarding copy (223–226)** — `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` and `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`; home/header/auth-state, registration → login → profile guidance; engineer-facing `fail closed` / `AUTH_REQUIRED` replaced with user-facing「會拒絕存取」; static HTML fallback aligned with JS mount points.
3. **Creator-flow onboarding copy (229–230)** — `PUBLIC_CREATOR_ONBOARDING_MESSAGES`; `/polls/new` demo vs `?live=1` guidance; `/my-polls` owned-poll management guidance; create ↔ my-polls navigation hints; engineer-facing banner wording replaced with user-facing copy; `syncCreatePollPageOnboardingCopy` and `syncMyPollsPageOnboardingCopy`.
4. **Participant-flow onboarding copy (232–233)** — `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`; `/vote/:pollId` participant guidance, policy panel, follow-results side panel, vote → results navigation hints; `/results/:pollId` demo/live intro, readonly scope copy, results → vote navigation hints; `syncVotePageOnboardingCopy` and `syncResultsPageOnboardingCopy`.
5. **FAQ / help onboarding copy (236–237)** — `PUBLIC_FAQ_ONBOARDING_MESSAGES`; account (registration → login → profile), creator (create poll → my-polls), and participant (vote → results) FAQ items aligned with completed onboarding slices; engineer-facing `faq.html` residue (`X-User-Id`, `creator_session`, `production user-auth wiring later`) removed from user-facing FAQ; internal terms (`Official Vote`, `Reference Answer`) replaced with user-facing「正式投票」/「試填作答」; `syncFaqPageOnboardingCopy` and `bootstrapFaqPage`; `faq.html` static fallback aligned with JS mount points.
6. **Runtime review checkpoints (224, 226, 230, 233, 237)** — each confirmed copy-only delivery with no blocker before the next slice.
7. **Interim milestone (234)** — consolidated account + creator + participant onboarding copy boundaries before FAQ slice.

Runtime patches were limited to **frontend-owned onboarding/navigation/FAQ copy constants, allowlists, re-exports, sync functions, and safe static shell copy** only.

**No behavior change hidden behind copy changes.**

---

## 3. Current Public Onboarding + FAQ Copy Contract (Fixed)

### 3.1 Allowed copy categories (delivered)

| Category | Phase 222–237 behavior |
|----------|------------------------|
| Account onboarding | Home, header/auth-state, registration → login → profile flow guidance |
| Creator-flow onboarding | Poll creation demo/live guidance, my-polls management guidance, create ↔ my-polls navigation hints |
| Participant-flow onboarding | Vote participant guidance, results demo/live/readonly guidance, vote ↔ results navigation hints |
| FAQ / help onboarding | `/faq` account/creator/participant flow guidance, profile/collecting/eligibility FAQ, demo boundary notes |
| Static HTML + JS mount alignment | Account, creator, participant, and FAQ surfaces: static fallback matches `PUBLIC_*` constants |
| Shared allowlists | `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, `PUBLIC_CREATOR_ONBOARDING_MESSAGES`, `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`, `PUBLIC_FAQ_ONBOARDING_MESSAGES` |
| User-facing non-technical copy | Engineer-facing denial/session wording replaced with user-facing guidance on onboarding and FAQ surfaces |
| Navigation hints | href/text only; no new behavior behind copy |
| Error resolution | `resolvePublicErrorUserMessage`; never echo foreign `error.message` |

### 3.2 Shared allowlists in `public-mvp-ui.js`

| Allowlist | Surfaces |
|-----------|----------|
| `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` | Home, header/auth-state, profile-completion prompt alignment |
| `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` | Registration, login, profile onboarding navigation |
| `PUBLIC_CREATOR_ONBOARDING_MESSAGES` | Poll creation, my-polls, creator flow navigation hints |
| `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` | Vote policy/side panel, results intro, vote ↔ results navigation hints |
| `PUBLIC_FAQ_ONBOARDING_MESSAGES` | FAQ page hero, account/creator/participant flow items, profile/collecting/eligibility FAQ |

All five allowlists are merged into `PUBLIC_HINT_TEXT_MESSAGES` without changing API behavior.

### 3.3 Runtime modules touched by onboarding / FAQ copy runtime

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
| FAQ | `faq-page.js` | no `fetch`; `syncFaqPageOnboardingCopy` only |

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

**FAQ surfaces:**

- `public/faq.html` — hero lead, account/creator/participant flow items, profile/collecting/eligibility FAQ mount points; no engineer-facing `X-User-Id`, `creator_session`, or `production user-auth wiring later` in user-facing copy

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
- FAQ does not imply registration auto-login or profile completion guaranteeing voting eligibility.
- No eligibility checks, vote-time evaluator reads, or qualification disclosure added.

---

## 6. Creator Boundaries (Unchanged)

- `GET /creator/session`, `GET /creator/polls`, `POST /creator/polls`, `POST /creator/polls/:id/cancel|close|unpublish` unchanged.
- Creator session, ownership, and lifecycle transition logic unchanged.
- Poll creation/delete/close/cancel/unpublish behavior unchanged.
- `parseLiveApiMode` demo vs `?live=1` selection unchanged; onboarding and FAQ copy references `?live=1` for user guidance only.
- My-polls copy explains managing polls through the existing creator flow only.

---

## 7. Participation Boundaries (Unchanged)

- Official Vote transaction order unchanged (`isProfileEligibleForOfficialVote` → `resolveOfficialVoteOptionIdWithClient` → `insertVoteToken` → `incrementVoteCounter`).
- Vote-by-index remains `{ option_index }` only; eligibility-before-option-resolve unchanged.
- Result visibility tiers and lifecycle meaning unchanged.
- `syncResultsPageLeadParagraphs({ demoOnly })` demo vs live intro selection unchanged.
- Demo/preview/read-only runtime behavior unchanged.
- Vote → Results and Results → Vote navigation hints are href/text only.
- FAQ collecting copy matches `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` without leaking counters or tiers.

---

## 8. FAQ / Help Boundaries (Fixed by Phase 236–237)

- `PUBLIC_FAQ_ONBOARDING_MESSAGES` is frontend-owned copy only.
- `syncFaqPageOnboardingCopy` only syncs copy to existing mount points.
- `bootstrapFaqPage` does not add API/auth/storage behavior.
- Engineer-facing terms are not user-facing in FAQ: `X-User-Id`, `creator_session`, `production user-auth wiring later`.
- Internal terms user-facing as「正式投票」/「試填作答」instead of `Official Vote` / `Reference Answer`.
- FAQ aligns with completed onboarding slices for registration → login → profile, create poll → my-polls, and vote → results.

---

## 9. Error Copy and Observability (Unchanged)

- Backend/internal/foreign error messages are not directly rendered to users.
- No technical/internal/debug wording shown to users on onboarding or FAQ surfaces.
- No debug details, request id, trace id, internal code, option id, score, rank, counts, tooltip, or explanation were added.
- No new `console.*`, analytics, APM, or debug payloads in onboarding or FAQ copy handlers.

---

## 10. Vote, Result, and Privacy Boundaries (Unchanged)

### 10.1 Raw Option Linkage Ban

- Raw Option Linkage Ban unchanged.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.

### 10.2 `quality_badge` presentation-only

`quality_badge` remains presentation-only:

- only `positive_feedback` renders **回饋良好**
- null/missing/unexpected `quality_badge` does not render
- not used for ranking/recommendation/personalization/trust/score/creator score/governance
- no tooltip/debug/explanation/counts/score/rank added

---

## 11. Final Milestone Checkpoint Conclusion

Phase 238 found **no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift** across the Phase 222–237 public onboarding + FAQ / help copy arc requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Public onboarding + FAQ copy final milestone complete (Phase 222–237); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

---

## 12. Explicit Non-Changes

Phase 238 does **not** change:

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

Explicit non-goals for Phase 238 delivery:

- **no runtime change**
- **no API change**
- **no frontend change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS copy changes**
- do not commit `design-drafts/`

---

## 13. Focused Guard Tests

- `tests/frontend/phase-238-public-onboarding-faq-copy-final-milestone-checkpoint.test.ts`
- `tests/docs/phase-238-public-onboarding-faq-copy-final-milestone-checkpoint-doc.test.ts`

Phase 222–237 delivery guards remain the baseline (representative):

- `tests/frontend/phase-234-public-onboarding-copy-milestone-checkpoint.test.ts`
- `tests/frontend/phase-237-faq-onboarding-help-copy-runtime-review-checkpoint.test.ts`
- `tests/frontend/phase-223-home-header-auth-state-onboarding-copy-runtime.test.ts`
- `tests/frontend/phase-225-registration-login-profile-onboarding-navigation-copy-runtime.test.ts`
- `tests/frontend/phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime.test.ts`
- `tests/frontend/phase-232-vote-results-onboarding-navigation-copy-runtime.test.ts`
- `tests/frontend/phase-236-faq-onboarding-help-copy-runtime.test.ts`

---

## 14. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 15. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 238 is final milestone documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
