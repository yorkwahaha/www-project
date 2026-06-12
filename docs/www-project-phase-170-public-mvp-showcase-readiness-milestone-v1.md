# WWW Project Phase 170 — Public MVP Showcase Readiness Milestone v1

**Status:** milestone checkpoint, focused guard tests, docs, and README index only. Summarizes what is safe to demo, what is not production-ready, and which privacy/security/product boundaries remain fixed after Phases 135–169. No copy centralization, visual CSS polish, per-page review, or runtime changes unless a small clear bug is found.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 169 public MVP full-flow smoke checkpoint (`4b924a6`).

**Prior checkpoint:** [Phase 169 public MVP full-flow smoke checkpoint](./www-project-phase-169-public-mvp-full-flow-smoke-checkpoint-v1.md).

---

## 1. Milestone Purpose

Phase 170 records the public MVP showcase readiness posture after the Phase 135–169 public UX, visual, onboarding, creator, results, explore, and full-flow smoke checkpoints. It is a documentation milestone for demos and handoffs. This milestone does not claim full production readiness.

This milestone answers:

1. Which public MVP pages are safe to demo with current boundaries.
2. Which flows are demo/local/test only and must not be presented as production identity.
3. Which privacy, security, and product boundaries remain fixed and must not be weakened for showcase convenience.

---

## 2. Consolidated Phase References

| Phase range | Focus | Milestone role |
|-------------|-------|----------------|
| **135–160** | Public UX copy consistency, error/empty/help/form/heading/static-shell alignment | Demo copy is frontend-owned and neutral; no backend payload echo |
| **161–163** | Visual rhythm, desktop/tablet layout, visual regression guard | Showcase layout is stable; not a production launch claim |
| **164** | Onboarding flow clarity | Registration → login → profile → vote path is explicit |
| **165** | Creator poll creation flow | Static demo vs `?live=1` creator path separated |
| **166** | My Polls / creator lifecycle UX | Mock dashboard vs live owned-list separated |
| **167** | Results visibility UX | Lifecycle-tier display only |
| **168** | Explore feed UX | Freshness-only public feed |
| **169** | Public MVP full-flow smoke | Cross-page boundaries verified together |

Key checkpoint docs:

- [Phase 135 public error copy consistency polish](./www-project-phase-135-public-error-copy-consistency-polish-v1.md)
- [Phase 161 public mobile visual rhythm accessibility polish](./www-project-phase-161-public-mobile-visual-rhythm-accessibility-polish-v1.md)
- [Phase 163 public frontend visual regression guard checkpoint](./www-project-phase-163-public-frontend-visual-regression-guard-checkpoint-v1.md)
- [Phase 164 public onboarding flow clarity review checkpoint](./www-project-phase-164-public-onboarding-flow-clarity-review-checkpoint-v1.md)
- [Phase 165 public creator poll creation flow review checkpoint](./www-project-phase-165-public-creator-poll-creation-flow-review-checkpoint-v1.md)
- [Phase 166 public my-polls creator lifecycle UX review checkpoint](./www-project-phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint-v1.md)
- [Phase 167 public results page visibility UX review checkpoint](./www-project-phase-167-public-results-page-visibility-ux-review-checkpoint-v1.md)
- [Phase 168 public explore feed UX review checkpoint](./www-project-phase-168-public-explore-feed-ux-review-checkpoint-v1.md)
- [Phase 169 public MVP full-flow smoke checkpoint](./www-project-phase-169-public-mvp-full-flow-smoke-checkpoint-v1.md)

---

## 3. Public MVP Pages Safe to Demo

The following public MVP pages are safe to demo **within the fixed boundaries below**. They are suitable for local/test showcase, product walkthrough, and privacy-boundary explanation. They are **not** a claim of full production launch readiness.

| Route | Safe to demo | Demo notes |
|-------|--------------|------------|
| `/` | Yes | Homepage static examples (`data-static-examples`) are separate from live `/explore` feed |
| `/registration` | Yes | Registration does not auto-login or create session |
| `/login` | Yes | `POST /login/session` is the formal session boundary |
| `/profile` | Yes | Profile fields remain only `birth_year_month` and `residential_region` |
| `/explore` | Yes | Freshness-only feed; not hot/ranking/personalized |
| `/polls/new` | Yes | Static demo create flow only |
| `/polls/new?live=1` | Yes (local/demo/test) | Uses `creator_session`; not production public identity |
| `/my-polls` | Yes | Mock dashboard only |
| `/my-polls?live=1` | Yes (local/demo/test) | Live owned-list via `creator_session`; not production public identity |
| `/vote/:id` | Yes | Pre-vote UX does not reveal eligibility outcome or voter state |
| `/results/:id` | Yes | Counter-free except `revealed`/`locked`/`post_lock` display-safe aggregate |
| `/faq` | Yes | Static policy copy only |
| `/trust-levels` | Yes | Draft/not-open posture for credit, points, paid features |

Recommended local showcase command:

```bash
npm run smoke:public:local
```

---

## 4. What Is Not Production-Ready

Phase 170 explicitly does **not** claim full production readiness. The following remain outside showcase/production claims:

| Area | Current posture |
|------|-----------------|
| **Full production launch** | Not claimed. MVP demo/showcase only. |
| **`creator_session`** | Local/demo/test creator flow only; **not** production public identity |
| **Creator `?live=1` paths** | Demo/local/test bootstrap; not general-user production auth |
| **Trust levels / credit / points** | Draft UI on `/trust-levels`; not officially open |
| **High-sensitivity categories** | Disabled in MVP |
| **Ranking / Wonder Flow** | Not complete beyond freshness-only `GET /polls/feed` |
| **Admin governance UI** | Backend routes exist; full admin product surface not showcased here |
| **Production OAuth / managed credential UX** | Verifier-backed paths exist; full production identity UX not claimed |
| **Reference Answer product surface** | Privacy rules fixed; not part of this public MVP showcase claim |
| **`design-drafts/`** | Untracked design exploration only; not committed delivery scope |

---

## 5. Fixed Showcase Boundaries

These boundaries must remain fixed during any public MVP demo. Do not weaken them for showcase convenience.

### Identity and session

- **Registration does not auto-login or create session.** `POST /registration` does not issue `Set-Cookie` and does not read `GET /users/me`.
- **Login/session is the formal session boundary.** `POST /login/session` establishes `www_session`; header state uses `GET /users/me` `display_name` only.
- **Profile fields remain only `birth_year_month` and `residential_region`.** No extra demographic fields in public profile UI.

### Creator flow

- **`creator_session` is not production public identity.** Demo/local/test creator bootstrap only.
- **Static demo and `?live=1` creator flows remain separated** via `parseLiveApiMode`.
- **My Polls mock dashboard and `?live=1` owned list remain separated.**

### Discovery and participation

- **Explore is freshness-only**, counter-free, and non-personalized. Not hot, ranking, trending, or personalized recommendations.
- **Results are display-safe aggregate only for `revealed` / `locked` / `post_lock`.** Collecting/cancelled/unpublished remain counter-free.
- **Vote pre-vote UX** guides login/profile only; does not reveal eligibility outcome, voter state, or result preview.
- **Vote submit body remains `{ option_index }` only.** Official Vote transaction order unchanged; eligibility before option resolve unchanged.

### Privacy and linkage

- **Raw Option Linkage Ban preserved.** No durable option choice + user/session/device/request/log/trace/metric/error payload linkage.
- **No `user_id`, session id, creator token, vote token, counter shard, trace id, or private backend identifiers in UI.**
- **No backend payload, `error.message`, stack trace, or internal error codes echoed** in user-visible states.
- **No logs, metrics, analytics, tracking, APM traces, or ranking personalization introduced** for showcase.
- **Reference Answer** remains disconnected from `UserAuthResolver` and profile eligibility.
- **`policy-ui-placeholders.js` / `HELP_COPY`** remain independent policy-panel layer.

---

## 6. Backend Change Posture for This Milestone

Phase 170 found **no backend/API/DB/schema/auth/vote transaction/eligibility/result visibility changes needed** for this showcase readiness milestone. The milestone is documentation and guard coverage only.

---

## 7. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-170-public-mvp-showcase-readiness-milestone.test.ts` | Verifies milestone doc references and fixed runtime boundaries still hold |
| `tests/docs/phase-170-public-mvp-showcase-readiness-milestone-doc.test.ts` | Doc + README index guard |

Retained supporting guards from Phases 133–169 remain in place, including `tests/frontend/phase-169-public-mvp-full-flow-smoke-checkpoint.test.ts`.

---

## 8. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-170-public-mvp-showcase-readiness-milestone.test.ts`
- `tests/docs/phase-170-public-mvp-showcase-readiness-milestone-doc.test.ts`

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## 9. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Showcase readiness milestone does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility. Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. `creator_session` remains local/demo/test creator flow only.
