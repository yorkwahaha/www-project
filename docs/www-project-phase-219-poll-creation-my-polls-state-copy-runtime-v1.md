# WWW Project Phase 219 — Poll Creation / My Polls State Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned Poll Creation and My Polls state messaging after Phase 214 plan, Phase 214-R review checkpoint, Phase 215 runtime, Phase 216 review checkpoint, Phase 217 runtime, and Phase 218 review checkpoint.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 218 Login / Registration / Profile state copy runtime review checkpoint (`fda9a92`).

**Prior delivery:** [Phase 218 Login / Registration / Profile state copy runtime review checkpoint](./www-project-phase-218-login-registration-profile-state-copy-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 219 implements the **minimal approved slice** from Phase 214-R for Poll Creation and My Polls state copy only. Changes are limited to frontend-owned constants and safe static text wiring.

Goals:

1. Centralize poll-creation loading, failure, validation, submit-pending, and demo/live success copy in `public-mvp-ui.js`.
2. Wire `create-poll-page.js` and `my-polls-page.js` to re-export shared constants.
3. Add `PUBLIC_CREATOR_STATE_USER_MESSAGES` allowlist for poll-creation / my-polls state copy guards.
4. Centralize creator-session unavailable copy as `PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE`.
5. Preserve creator session, ownership, lifecycle APIs, and poll-definition payloads.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — poll-creation / my-polls state copy constants and `PUBLIC_CREATOR_STATE_USER_MESSAGES`.
- `public/frontend/create-poll-page.js` — create-poll form state copy re-exports.
- `public/frontend/my-polls-page.js` — my-polls load/error/empty/action state copy re-exports.
- `public/frontend/poll-lifecycle-controls.js` — `CREATOR_SESSION_FAILURE` re-export from shared constant.
- Focused frontend + doc tests.
- README Phase 219 index.

### 2.2 Out of scope

- Explore, vote, results, login, registration, profile, homepage profile-completion prompt.
- Backend, API contract, DB, migration, auth resolver.
- Vote transaction, eligibility evaluation, result visibility tiers.
- `quality-feedback-badge.js` behavior changes.
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant | Change |
|----------|--------|
| `PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE` | New shared create-poll submit pending constant |
| `PUBLIC_CREATE_POLL_FAILURE_MESSAGE` | New shared create-poll failure constant |
| `PUBLIC_CREATE_POLL_TITLE_REQUIRED_MESSAGE` | New shared validation constant |
| `PUBLIC_CREATE_POLL_MIN_OPTIONS_MESSAGE` | New shared validation constant |
| `PUBLIC_CREATE_POLL_MAX_OPTIONS_MESSAGE` | New shared validation constant |
| `PUBLIC_CREATE_POLL_USER_ERROR_MESSAGES` | New allowlist for create-poll form errors |
| `PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE` | Centralized creator-session unavailable copy |
| `PUBLIC_CREATOR_STATE_USER_MESSAGES` | New allowlist for poll-creation / my-polls state copy |
| `PUBLIC_PENDING_USER_MESSAGES` | Uses shared `PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE` |

Unchanged: `POST /creator/polls` payload, `GET /creator/session`, `GET /creator/polls`, lifecycle `POST /creator/polls/:id/*`, demo vs `?live=1` API selection, `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`.

---

## 4. Boundaries preserved

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| Vote-by-index `{ option_index }` only | Unchanged |
| Result visibility tiers | Unchanged |
| Registration auto-login / Set-Cookie | Unchanged |
| Profile fields `birth_year_month` / `residential_region` only | Unchanged |
| `/users/me` `user_id` / `display_name` only | Unchanged |
| Creator session / ownership / lifecycle APIs | Unchanged |
| `quality_badge` presentation-only | Unchanged (`positive_feedback` → `回饋良好`) |

---

## 5. Guard tests

- `tests/frontend/phase-219-poll-creation-my-polls-state-copy-runtime.test.ts`
- `tests/docs/phase-219-poll-creation-my-polls-state-copy-runtime-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm test -- --runInBand
npm run typecheck
npm run build
npm run migrate:check
```

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 219 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
