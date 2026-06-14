# WWW Project Phase 227 — Account Onboarding Copy Milestone Checkpoint v1

**Status:** milestone checkpoint, focused doc guards, frontend/static guards, and README index only. Consolidates Phase 222–226 public MVP account onboarding / navigation copy consistency plan, plan review, home + header/auth-state runtime delivery, registration / login / profile runtime delivery, and runtime review checkpoints into the stable boundary reference before any future onboarding-copy work that might touch auth, profile, vote, eligibility, result visibility, or participation behavior.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 226 Registration / Login / Profile onboarding navigation copy runtime review checkpoint (`332425e`).

**Prior checkpoint:** [Phase 226 Registration / Login / Profile onboarding navigation copy runtime review checkpoint](./www-project-phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 227 records the completed **account onboarding copy** arc across Phase 222–226. It is the stable boundary reference for what those phases **delivered** for home + header/auth-state and registration → login → profile onboarding guidance, and what they **must not have changed** without a separately approved phase.

This milestone answers:

1. What Phase 222–226 delivered and what remains fixed.
2. Which copy categories were allowed (frontend-owned onboarding/navigation guidance, shared allowlists, safe static shell alignment, user-facing denial wording).
3. Which auth, profile, vote, eligibility, result, `quality_badge`, and privacy boundaries the onboarding-copy arc preserved.
4. Which future work from the broader Phase 222 plan still requires a new phase with explicit governance review.

**Phase 222–226 account onboarding copy work is complete for this milestone.**

---

## 2. Phase 222–226 Milestone Summary

| Phase | Delivery | Status |
|-------|----------|--------|
| **222** | Public MVP onboarding / navigation copy consistency plan — docs/plan only; page-by-page checklist for homepage, header/auth-state, registration → login → profile, and deferred creator/participation slices | **Complete (plan)** |
| **222-R** | Plan review checkpoint — approves constrained copy-only runtime slices; **APPROVED — Phase 222 onboarding/navigation copy consistency plan is safe for constrained copy-only implementation** | **Complete** |
| **223** | Home + header/auth-state onboarding copy minimal runtime patch — `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, `auth-state-copy.js`, `public-mvp-home.js`, `public/index.html` | **Complete** |
| **224** | Home + header/auth-state onboarding copy runtime review checkpoint — **APPROVED — Phase 223 copy-only; no drift identified** | **Complete** |
| **225** | Registration / Login / Profile onboarding navigation copy minimal runtime patch — `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, page sync functions, static HTML alignment | **Complete** |
| **226** | Registration / Login / Profile onboarding navigation copy runtime review checkpoint — **APPROVED — Phase 225 copy-only; no drift identified** | **Complete** |

### 2.1 Phase references

- [Phase 222 public MVP onboarding navigation copy consistency plan](./www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md)
- [Phase 222-R public MVP onboarding navigation copy consistency plan review checkpoint](./www-project-phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint-v1.md)
- [Phase 223 Home + header/auth-state onboarding copy minimal runtime patch](./www-project-phase-223-home-header-auth-state-onboarding-copy-runtime-v1.md)
- [Phase 224 Home + header/auth-state onboarding copy runtime review checkpoint](./www-project-phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint-v1.md)
- [Phase 225 Registration / Login / Profile onboarding navigation copy minimal runtime patch](./www-project-phase-225-registration-login-profile-onboarding-navigation-copy-runtime-v1.md)
- [Phase 226 Registration / Login / Profile onboarding navigation copy runtime review checkpoint](./www-project-phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint-v1.md)

### 2.2 Consolidated delivery facts

Phase 222–226 together delivered:

1. **Plan and plan review (222, 222-R)** — onboarding/navigation copy-only scope definition, page-by-page checklist, risk classification, and governance boundaries before runtime.
2. **Home + header/auth-state onboarding copy (223, 224)** — centralized `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`; guest/banner/demo chip copy; homepage account-flow, sample-polls, and static-examples notes; `fail closed` → user-facing「會拒絕存取」; aligned profile-completion prompt hint.
3. **Registration → login → profile onboarding copy (225, 226)** — centralized `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`; registration success → login guidance; login post-registration and login → profile next-step hints; profile lead and signed-in guidance without eligibility guarantee; static HTML fallback aligned with JS mount points.
4. **Runtime review checkpoints (224, 226)** — each confirmed copy-only delivery with no blocker before the next slice.

Runtime patches were limited to **frontend-owned onboarding/navigation copy constants, allowlists, re-exports, sync functions, and safe static shell copy** only.

**Deferred from Phase 222 plan (not delivered in 222–226):** poll creation, my-polls, vote, results, FAQ/trust-levels onboarding slices remain future approved phases.

---

## 3. Current Account Onboarding Copy Contract (Fixed)

### 3.1 Allowed copy categories (delivered)

| Category | Phase 222–226 behavior |
|----------|------------------------|
| Public onboarding/navigation consistency | Neutral registration → login → profile flow guidance across home, header, and account pages |
| Home + header/auth-state onboarding | Guest chip, auth banner, demo chip, homepage account-flow notes |
| Registration → login guidance | Success copy states 註冊不會自動登入; directs to `/login` with same credential |
| Login → profile guidance | `PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT`; post-registration crosslink |
| Profile completion guidance | 出生年月 / 居住地區 only; no eligibility guarantee |
| Static HTML + JS mount alignment | `registration.html`, `login.html`, `profile.html`, `public/index.html` fallback matches `PUBLIC_*` constants |
| Shared allowlists | `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES`, `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` |
| User-facing denial wording | Engineer-facing `fail closed` / `AUTH_REQUIRED` replaced with「會拒絕存取」 |
| Error resolution | `resolvePublicErrorUserMessage`; never echo foreign `error.message` |

### 3.2 Shared allowlists in `public-mvp-ui.js`

| Allowlist | Surfaces |
|-----------|----------|
| `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` | Home, header/auth-state, profile-completion prompt alignment |
| `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` | Registration, login, profile onboarding navigation |

Both allowlists are merged into the broader public copy governance surface in `public-mvp-ui.js` without changing API behavior.

### 3.3 Runtime modules touched by onboarding copy runtime (223, 225)

| Surface | Runtime module | API boundary unchanged |
|---------|----------------|------------------------|
| Home | `public-mvp-home.js` | no `fetch`; navigation href only |
| Header / auth-state | `auth-state-copy.js`, `public-mvp-layout.js` (via re-export) | `GET /users/me` for `display_name` only |
| Registration | `registration-page.js` | `POST /registration` only |
| Login | `login-page.js` | `POST /login/session` |
| Profile | `profile-page.js` | `GET`/`PUT /users/me/profile` |

---

## 4. Static HTML and JS Mount Alignment (Fixed)

- `public/index.html` — `home-account-flow-note`, `home-sample-polls-section-note`, `home-static-examples-footer-note`
- `public/registration.html` — `registration-page-banner`, success message; `data-login-state-read="disabled"` preserved
- `public/login.html` — banner, lead, `login-profile-next-step-hint`, registration crosslink mount points
- `public/profile.html` — `profile-page-lead`, `profile-signed-in-guidance`, unauth message mount points

Sync functions (`syncHomePageOnboardingCopy`, `syncRegistrationPageOnboardingCopy`, `syncLoginPageOnboardingCopy`, `syncProfilePageOnboardingCopy`) write shared constants into these mount points only.

---

## 5. Account Boundaries (Unchanged)

Login / Registration / Profile / Home / Header onboarding copy changes did not alter auth flow, registration success behavior, profile payloads, or `/users/me` shape.

- `POST /login/session` unchanged.
- `POST /registration` unchanged.
- Registration does not auto-login and does not Set-Cookie.
- Registration does not call `GET /users/me` after success.
- Login behavior remains `POST /login/session` then `GET /users/me`.
- `/users/me` remains only `user_id` / `display_name`.
- Profile API remains only `birth_year_month` / `residential_region`.
- Profile completion copy does not imply guaranteed eligibility.
- No eligibility checks, vote-time evaluator reads, or qualification disclosure added.
- `GET`/`PUT /users/me/profile` payloads unchanged.
- Eligibility / auth / `UserAuthResolver` / profile field boundaries unchanged.

---

## 6. Participation and Creator Boundaries (Unchanged)

Onboarding copy work in Phase 222–226 did not alter vote, result, creator session, ownership, lifecycle APIs, or participation behavior.

- Explore, vote, and results participation surfaces unchanged by Phase 222–226 account onboarding delivery.
- Creator session, ownership, and lifecycle `POST /creator/polls/:id/*` APIs unchanged.
- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- Vote-by-index remains `{ option_index }` only.
- Result visibility unchanged.

---

## 7. Error Copy and Observability (Unchanged)

- Backend/internal/foreign error messages are not directly rendered to users.
- No technical/internal/debug wording shown to users on onboarding surfaces.
- No debug details, request id, trace id, internal code, option id, score, rank, counts, tooltip, or explanation were added.
- No new `console.*`, analytics, APM, or debug payloads in onboarding copy handlers.

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

Phase 227 found **no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift** across the Phase 222–226 account onboarding copy arc requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Account onboarding copy milestone complete; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

---

## 10. Explicit Non-Changes

Phase 227 does **not** change:

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

Explicit non-goals for Phase 227 delivery:

- **no runtime change**
- **no API change**
- **no frontend change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS copy changes**
- commit `design-drafts/`

---

## 11. Focused Guard Tests

- `tests/frontend/phase-227-account-onboarding-copy-milestone-checkpoint.test.ts`
- `tests/docs/phase-227-account-onboarding-copy-milestone-checkpoint-doc.test.ts`

Phase 222–226 delivery guards remain the baseline:

- `tests/frontend/phase-223-home-header-auth-state-onboarding-copy-runtime.test.ts`
- `tests/docs/phase-223-home-header-auth-state-onboarding-copy-runtime-doc.test.ts`
- `tests/frontend/phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint-doc.test.ts`
- `tests/frontend/phase-225-registration-login-profile-onboarding-navigation-copy-runtime.test.ts`
- `tests/docs/phase-225-registration-login-profile-onboarding-navigation-copy-runtime-doc.test.ts`
- `tests/frontend/phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint-doc.test.ts`

---

## 12. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 13. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 227 is milestone documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
