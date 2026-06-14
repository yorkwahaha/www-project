# WWW Project Phase 237 — FAQ Onboarding / Help Copy Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 236 FAQ / help onboarding copy minimal runtime patch (frontend-owned FAQ copy constants, `syncFaqPageOnboardingCopy`, and safe static shell copy/mount points) for privacy, auth, registration/login/profile, creator session, vote transaction, eligibility, result visibility, lifecycle, demo/preview/read-only wording, engineer-term removal, and `quality_badge` boundary preservation.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 236 FAQ onboarding / help copy minimal runtime patch (`5f9c6cb`).

**Prior delivery:** [Phase 236 FAQ onboarding / help copy minimal runtime patch](./www-project-phase-236-faq-onboarding-help-copy-runtime-v1.md).

**Prior governance context:** [Phase 235-R FAQ onboarding / help copy plan review](./www-project-phase-235r-faq-onboarding-help-copy-plan-review-v1.md).

---

## 1. Review Purpose

Phase 237 reviews the Phase 236 frontend FAQ / help onboarding-copy runtime to confirm:

1. Phase 236 changed only frontend-owned FAQ / help onboarding copy constants, sync functions, and safe static shell copy/mount points.
2. `faq-page.js` sync functions did not change API calls, auth checks, storage, redirects, or event behavior.
3. `faq.html` changes remain static fallback + JS mount points only.
4. Static HTML fallback copy and JS-mounted runtime copy remain aligned.
5. Account-flow FAQ (registration → login → profile), creator-flow FAQ (create poll → my-polls), and participant-flow FAQ (vote → results) align with completed onboarding slices.
6. `PUBLIC_FAQ_ONBOARDING_MESSAGES` is frontend-owned copy only.
7. `syncFaqPageOnboardingCopy` only syncs copy to existing mount points.
8. `bootstrapFaqPage` does not add API/auth/storage behavior.
9. Engineer-facing terms are not user-facing in FAQ (`X-User-Id`, `creator_session`, `production user-auth wiring later`).
10. Internal terms are user-facing in FAQ (`Official Vote` →「正式投票」; `Reference Answer` →「試填作答」).
11. FAQ does not imply registration auto-login.
12. FAQ does not imply profile completion guarantees voting eligibility.
13. FAQ does not imply my-polls manages polls outside the existing site creation flow.
14. FAQ does not change collecting / result visibility meaning.
15. No new `fetch` paths, storage, API payload fields, auth checks, or API branching were added.
16. Registration / login / profile / auth behavior remains unchanged.
17. Creator session / poll creation / my-polls / lifecycle behavior remains unchanged.
18. Vote / eligibility / Official Vote transaction / result visibility boundaries remain unchanged.
19. Foreign, backend, and internal error messages are still not directly rendered to users in FAQ copy.
20. No debug details, request id, trace id, internal code, option id, score, rank, counts, tooltip, or explanation were added.
21. `quality_badge` presentation, Raw Option Linkage Ban, and observability boundaries remain unchanged.

Phase 237 does **not** implement further FAQ copy polish. It approves the Phase 236 runtime delivery subject to ongoing governance boundaries.

---

## 2. Phase 236 Delivery Under Review

| Area | Phase 236 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | `PUBLIC_FAQ_ONBOARDING_MESSAGES`, `PUBLIC_FAQ_*` constants, allowlist updates | frontend-owned copy only |
| `faq-page.js` | `syncFaqPageOnboardingCopy`, `bootstrapFaqPage` | DOM text sync only; no fetch/storage |
| `faq.html` | account/creator/participant FAQ items, mount points, engineer-term removal | static shell + href links only |

**Not modified by Phase 236:** backend `src/`, migrations, auth/session resolvers, vote transaction paths, result evaluator, registration/login/profile/vote/results/creator session modules beyond unchanged cross-links, `quality-feedback-badge.js` behavior.

---

## 3. FAQ Copy Flow Under Review

```text
/faq
  → syncFaqPageOnboardingCopy writes PUBLIC_FAQ_* into mount points
  → bootstrapFaqPage → syncFaqPageOnboardingCopy only
  → faq.html static fallback aligned with PUBLIC_FAQ_* constants
  → href links to /registration, /login, /profile, /polls/new, /polls/new?live=1, /my-polls?live=1, /vote/demo, /results/demo
  → no fetch, storage, auth checks, or eligibility evaluation added

PUBLIC_FAQ_ONBOARDING_MESSAGES
  → allowlist of safe user-visible FAQ onboarding / help messages
  → included in PUBLIC_HINT_TEXT_MESSAGES
  → PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP aliases PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 237 found **no privacy, auth, registration, login-session, profile-field, creator-session, ownership, lifecycle, vote transaction, eligibility, result visibility, `quality_badge` governance, or linkage gap** in the Phase 236 FAQ / help onboarding-copy runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Phase 236 FAQ onboarding / help copy runtime patch is copy-only; no runtime/API/DB/backend/auth/vote/result/creator/privacy drift identified.**

### 4.1 Phase 236 is copy-only on FAQ / help surfaces

- Phase 236 delivery is frontend-owned string constants, sync functions, and safe static text wiring only.
- No new `fetch` paths, credentials changes, storage usage, or API payload fields were introduced on FAQ surfaces.
- `faq-page.js` only syncs copy into existing DOM mount points.

### 4.2 Static HTML fallback and JS-mounted runtime copy remain aligned

- `faq.html` static fallback text matches `PUBLIC_FAQ_*` constants used by `syncFaqPageOnboardingCopy`.
- Mount point element ids (`faq-page-hero-lead`, `faq-account-flow-intro`, `faq-creator-flow-demo-step`, `faq-participant-vote-step`, `faq-profile-demo-boundary-note`, etc.) are consistent between HTML and JS.

### 4.3 `PUBLIC_FAQ_ONBOARDING_MESSAGES` is frontend-owned copy only

- Allowlist aggregates account, creator, participant, profile, collecting, and eligibility FAQ constants.
- Included in `PUBLIC_HINT_TEXT_MESSAGES`; does not alter API contracts or backend behavior.

### 4.4 `syncFaqPageOnboardingCopy` only writes to existing mount points

- Sync uses `getElementById` + `textContent` assignment only.
- No listeners, storage, fetch calls, auth branching, or DOM structure changes beyond text updates.

### 4.5 `bootstrapFaqPage` does not add API/auth/storage behavior

- `bootstrapFaqPage` delegates solely to `syncFaqPageOnboardingCopy`.
- No `fetch`, `localStorage`, `sessionStorage`, cookie usage, or credential handling.

### 4.6 Engineer-facing terms removed from user-facing FAQ copy

- `faq.html` no longer surfaces `X-User-Id`, `creator_session`, or `production user-auth wiring later`.
- `PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE` uses user-facing demo/production boundary wording.

### 4.7 Internal terms replaced with user-facing FAQ wording

- FAQ uses「正式投票」instead of `Official Vote`.
- FAQ uses「試填作答」instead of `Reference Answer`.

### 4.8 Account / registration / login / profile FAQ boundaries preserved

- `PUBLIC_FAQ_ACCOUNT_FLOW_INTRO` states 註冊不會自動登入.
- `PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP` and `PUBLIC_FAQ_PROFILE_ELIGIBILITY_HINT` do not guarantee eligibility.
- No changes to `registration-page.js`, `login-page.js`, `profile-page.js`, or auth resolvers.
- `POST /registration` and `POST /login/session` behavior unchanged; registration does not auto-login.

### 4.9 Creator / my-polls FAQ boundaries preserved

- `PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP` scopes management to polls created through the existing site creation flow.
- Demo vs `?live=1` wording is copy-only; no creator API selection logic changed.

### 4.10 Participant / collecting / result visibility FAQ boundaries preserved

- `PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP` matches `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT`.
- FAQ does not leak counters, tiers, or lifecycle meaning beyond existing MVP policy wording.
- Vote / result visibility evaluator tiers unchanged.

### 4.11 Vote / eligibility / Official Vote transaction unchanged

- Official Vote transaction order unchanged in backend (`isProfileEligibleForOfficialVote` → `resolveOfficialVoteOptionIdWithClient` → `insertVoteToken` → `incrementVoteCounter`).
- Vote-by-index body remains `{ option_index }` only; eligibility-before-option-resolve unchanged.
- No eligibility checks, vote-time evaluator reads, or qualification disclosure added by Phase 236.

### 4.12 `quality_badge` governance unchanged

- `quality_badge` remains presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected does not render.
- Not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank added.

### 4.13 Raw Option Linkage Ban and observability preserved

- No Raw Option Linkage Ban drift.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.
- FAQ handlers do not add `console.*`, analytics, APM, or debug payloads.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-237-faq-onboarding-help-copy-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-237-faq-onboarding-help-copy-runtime-review-checkpoint-doc.test.ts`

Phase 236 delivery guards remain the baseline:

- `tests/frontend/phase-236-faq-onboarding-help-copy-runtime.test.ts`
- `tests/docs/phase-236-faq-onboarding-help-copy-runtime-doc.test.ts`
- `docs/www-project-phase-236-faq-onboarding-help-copy-runtime-v1.md`

---

## 6. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 237 is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
