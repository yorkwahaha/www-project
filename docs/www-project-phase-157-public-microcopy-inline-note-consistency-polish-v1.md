# WWW Project Phase 157 — Public Microcopy / Inline Note Consistency Polish v1

**Status:** frontend UX polish — unified public microcopy, inline notes, and supporting short copy via centralized copy constants, mount-time sync helpers, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 156 public page intro / lead paragraph runtime review checkpoint.

**Prior checkpoint:** [Phase 156 public page intro / lead paragraph runtime review checkpoint](./www-project-phase-156-public-page-intro-lead-paragraph-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 157 polishes remaining scattered inline notes, microcopy, supporting short sentences, and small reminders across homepage, explore, results, my-polls, creator flow, lifecycle controls, and related public frontend surfaces. It continues Phase 135–156 public UX consistency boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined microcopy via `PUBLIC_INLINE_NOTES`, `PUBLIC_MICROCOPY_MESSAGES`, and `PUBLIC_SUPPORTING_NOTES`.
2. Re-export shared `PUBLIC_*` microcopy constants from surface page modules and sync static HTML shells on mount where applicable.
3. Keep microcopy neutral — no vote counts, eligibility outcomes, internal ids, tokens, or backend payload echo.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_INLINE_NOTES`, `PUBLIC_MICROCOPY_MESSAGES`, `PUBLIC_SUPPORTING_NOTES`, shared `PUBLIC_*` microcopy constants.
- `public/frontend/public-mvp-home.js` — `syncHomePageSupportingNotes`, `syncHomePageMicrocopy`.
- `public/frontend/explore-page.js` — `syncExplorePageMicrocopy`, `EXPLORE_LOAD_MORE_LABEL` re-export.
- `public/frontend/my-polls-page.js` — demo table inline notes and share feedback microcopy.
- `public/frontend/creator-flow-copy.js` — creator action guide / next-steps microcopy labels.
- `public/frontend/poll-lifecycle-controls.js` — lifecycle confirm microcopy and action panel labels.
- `public/frontend/result-page.js` — public notice label microcopy.
- Focused frontend guard tests.
- README Phase 157 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Full migration of `policy-ui-placeholders.js` / `HELP_COPY` tooltip bodies.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. Microcopy rules

### 3.1 Must

- Use frontend-owned copy from `PUBLIC_INLINE_NOTES`, `PUBLIC_MICROCOPY_MESSAGES`, `PUBLIC_SUPPORTING_NOTES`, or surface re-exports.
- Mount-time sync writes shared constants into static HTML shells without reading backend payloads.

### 3.2 Must not

- Echo raw backend payloads, API `message`, internal error codes, or stack traces in microcopy.
- Show `user_id`, session id, creator token, vote token, counter shard, or internal identifiers in microcopy.
- Create durable user-option linkage in microcopy handlers.

---

## 4. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused tests:

- `tests/frontend/phase-157-public-microcopy-inline-note-consistency-polish.test.ts`

---

## 5. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Microcopy polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
