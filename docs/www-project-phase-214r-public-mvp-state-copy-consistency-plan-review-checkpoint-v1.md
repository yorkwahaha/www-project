# WWW Project Phase 214-R — Public MVP State Copy Consistency Plan Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 214 public MVP empty / loading / error state copy consistency **plan** (frontend-owned state copy, safe static text, page-by-page review checklist, risk classification, and explicit non-goals) for homepage profile-completion prompt, explore/vote/results participation states, auth/profile/creator form state messaging, and demo/live copy consistency.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 214 public MVP state copy consistency plan (`1eba2bb`).

**Prior delivery:** [Phase 214 public MVP state copy consistency plan](./www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md).

**Prior governance context:** [Phase 213 public MVP mobile and form accessibility polish final review checkpoint](./www-project-phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 214-R reviews the Phase 214 **plan only** to confirm:

1. Phase 214 remains plan-only; no runtime, CSS, HTML, or JS delivery was included in Phase 214.
2. Phase 214 did not modify runtime, CSS, HTML, JS, API, backend, DB, schema, migration, auth, vote, result, or evaluator behavior.
3. Future copy-only implementation is authorized only as low-risk public frontend **state-message** polish using frontend-owned constants and safe static text.
4. Future implementation must **not** echo backend/internal error payloads, API `message` fields, stack traces, request ids, option ids, or internal codes in empty/loading/error copy.
5. Vote pre-vote hints must **not** reveal eligibility result; results copy must **not** weaken result visibility; demo/live copy must **not** imply unavailable production behavior.
6. Empty/loading/error copy must **not** add debug details, counts, score, rank, trace, request id, option id, or internal codes.
7. Login/session, registration auto-login, profile field ceiling, creator-session boundaries, vote/eligibility/result visibility, Reference Answer, and `quality_badge` governance remain explicit in the plan.
8. Raw Option Linkage Ban and no-option-linkage observability rules remain explicit in the plan.
9. Suggested future guard tests and validation checklist are sufficient for a Phase 215 copy-only runtime slice.

Phase 214-R does **not** implement copy polish. It approves the **plan scope** for a future constrained copy-only runtime phase subject to Phase 215 delivery guards.

---

## 2. Phase 214 Plan Under Review

| Area | Phase 214 plan content | Review focus |
|------|------------------------|--------------|
| Surfaces | `/`, `/explore`, `/vote/:pollId`, `/results/:pollId`, `/login`, `/registration`, `/profile`, `/polls/new`, `/my-polls` | state copy scope only |
| Allowed future changes | `PUBLIC_PENDING_USER_MESSAGES`, `PUBLIC_LOAD_FAILURE_USER_MESSAGES`, `resolvePublicErrorUserMessage`, `renderPublicInlineErrorNote`, surface module constants | copy-only; no new fetch paths |
| Polish categories | loading/pending, load/save failure, empty states, unauthenticated prompts, profile-incomplete prompts, pre-vote hints, demo/live labels | no eligibility disclosure |
| Boundaries table | registration, login, profile, `/users/me`, creator session, vote, result visibility, Reference Answer | preserved and explicit |
| Non-goals | DB/API/auth/vote/eligibility/result/CSS-default/linkage | complete |
| Future sequence | 214-R → 215 runtime → 216 review | gated |

**Not modified by Phase 214:** any `public/frontend/*.js` runtime, `public/*.html` shells, `public-mvp.css`, backend `src/`, migrations, auth/session resolvers, vote transaction paths, result evaluator.

---

## 3. Future Implementation Flow Under Review (Authorized Scope Only)

```text
/ (homepage)
  → profile-completion-prompt.js unchanged by default
  → future copy: neutral profile-completion prompt only; /profile CTA only
  → GET /users/me display ceiling unchanged

/explore
  → explore-page.js unchanged by default
  → future copy: PUBLIC_EXPLORE_* loading/failure/empty constants only
  → GET /polls/feed boundary unchanged

/vote/:pollId
  → vote-page.js + official-vote-pre-vote-hints.js unchanged by default
  → future copy: loading/failure + pre-vote hint constants only
  → no eligibility outcome disclosure
  → submitVoteByIndex body { option_index } only

/results/:pollId
  → result-page.js unchanged by default
  → future copy: loading/failure/collecting/unavailable/readonly/demo intro only
  → result visibility tiers unchanged; no counter leakage

/login, /registration, /profile, /polls/new, /my-polls
  → respective page modules unchanged by default
  → future copy: frontend-owned status-region strings only
  → POST /login/session, POST /registration (no auto-login/Set-Cookie),
    GET/PUT /users/me/profile (two fields only), creator session/lifecycle unchanged
```

---

## 4. Plan Review Checkpoint Conclusion

Phase 214-R found **no privacy, auth, profile-field, registration, login-session, creator-session, vote transaction, eligibility, result visibility, `quality_badge` governance, or linkage gap** in the Phase 214 plan requiring plan revision before authorizing a future constrained copy-only runtime slice.

**APPROVED — Phase 214 plan is safe for a constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/privacy drift identified.**

### 4.1 Phase 214 is plan-only

- Phase 214 delivery is documentation and doc guard tests only.
- No `public/frontend/*.js`, `public/*.html`, `public-mvp.css`, `src/`, or migration changes were made in Phase 214.

### 4.2 Future implementation scope is copy-only

- Primary future touch surface: frontend-owned constants in `public-mvp-ui.js` and surface page modules.
- Future copy polish may align `…中，請稍候。` / `目前無法載入…` patterns and safe next-step CTAs only.
- Default forbidden: new `fetch` paths, credentials changes, CSS/HTML layout changes, and backend error echo unless separately approved.

### 4.3 Future implementation must not echo backend/internal error payloads

- Plan requires `resolvePublicErrorUserMessage` and existing allowlists; never surface foreign `error.message`, API `message`, stack traces, request ids, or internal codes.
- Empty/loading/error copy must not add debug details, counts, score, rank, trace, request id, option id, or internal codes.

### 4.4 Vote pre-vote hints must not reveal eligibility result

- Plan preserves `official-vote-pre-vote-hints.js` neutral states: `anonymous`, `profile-incomplete`, `profile-complete`, `profile-load-failed`.
- Forbidden in future copy: `你符合資格`, `你不符合資格`, `已投過票`, `可以投票`, vote-guarantee language.

### 4.5 Results copy must not weaken result visibility

- Plan forbids counter/tier leakage in loading/error/unavailable/readonly states.
- `results-page-demo-intro` demo label must remain distinct from live result visibility copy.

### 4.6 Demo/live copy must not imply unavailable production behavior

- Plan requires demo vs `?live=1` helper copy to stay visually and semantically distinct without changing API authority.
- Demo paths must not imply production login/session/creator behavior that does not exist.

### 4.7 Login / session boundary preserved in plan

- Plan requires unchanged `POST /login/session` and credential proof handling.
- `/users/me` remains only `user_id` / `display_name` for login-state display.

### 4.8 Registration boundary preserved in plan

- Plan forbids auto-login and `Set-Cookie` on registration submit.
- Registration JSON remains `display_name`, `birth_year_month`, `residential_region` only; success copy links to `/login` only.

### 4.9 Profile boundary preserved in plan

- Profile API remains `GET`/`PUT /users/me/profile` with **`birth_year_month`** and **`residential_region`** only.
- Plan forbids new profile fields and eligibility/auth/UserAuthResolver drift.

### 4.10 Creator / poll-creation boundaries preserved

- `/polls/new` demo `submitCreatePollDemo` vs `?live=1` `POST /creator/polls` split remains explicit.
- `/my-polls?live=1` `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, and lifecycle `POST /creator/polls/:id/*` remain unchanged.

### 4.11 Vote, eligibility, result, Reference Answer unchanged

- Plan explicitly excludes vote transaction order change, vote-by-index `{ option_index }` only body, eligibility-before-option-resolve change, result visibility change, and Reference Answer changes.
- No ranking, recommendation, personalization, trust, score, creator score, tooltip, debug, explanation, counts, or rank polish is authorized.

### 4.12 `quality_badge` governance unchanged

- `quality_badge` remains presentation-only: only `positive_feedback` renders **回饋良好**; null/missing/unexpected does not render.
- Not used for ranking/recommendation/personalization/trust/score/creator score/governance; no tooltip/debug/explanation/counts/score/rank added.

### 4.13 Raw Option Linkage Ban and observability preserved

- No Raw Option Linkage Ban drift.
- No option choice + user/session/device/request/log/trace/metric/error linkage added.
- Plan forbids durable user-option linkage and new logs/metrics/analytics/APM/debug/error payloads tying option choice to identity.

---

## 5. Authorized Future Runtime Slice (Phase 215 — Not Delivered Here)

Phase 214-R authorizes a **minimal** future copy-only runtime slice with these constraints:

| May change | Must not change |
|------------|-----------------|
| Frontend-owned state copy constants in `public-mvp-ui.js` and surface modules | `src/**`, `migrations/**` |
| Safe static text in status regions / empty / loading / error hosts | Login/session API paths and payloads |
| Phase 215 guard tests + doc + README | Registration auto-login / Set-Cookie |
| | Profile field ceiling (`birth_year_month` / `residential_region`) |
| | Creator session / lifecycle APIs |
| | Vote / eligibility / result visibility / Reference Answer |
| | Backend/internal error payload echo |

Recommended first slice (plan §9): **explore + vote + results** state copy only, then auth/profile/creator form states in separate guarded slices if needed.

---

## 6. Focused Guard Tests

- `tests/frontend/phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint.test.ts`
- `tests/docs/phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint-doc.test.ts`

Phase 214 plan guard remains the baseline:

- `tests/docs/phase-214-public-mvp-state-copy-consistency-plan-doc.test.ts`

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

Phase 214-R is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
