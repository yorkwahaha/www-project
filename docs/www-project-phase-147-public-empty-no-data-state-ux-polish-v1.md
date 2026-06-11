# WWW Project Phase 147 — Public Empty / No Data State UX Polish v1

**Status:** frontend UX polish — unified public empty / no-data / no-content copy, safe frontend-owned constants, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 146 public status badge / state label runtime review checkpoint.

**Prior checkpoint:** [Phase 146 public status badge / state label runtime review checkpoint](./www-project-phase-146-public-status-badge-state-label-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 147 polishes public-page empty / no-data / no-content UX so visitors see consistent, safe, frontend-owned guidance when a surface has nothing to show yet. It continues Phase 135–146 error / pending / success / unavailable / CTA / status boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined empty-state copy via `PUBLIC_EMPTY_STATE_MESSAGES`, `PUBLIC_EMPTY_STATE_LABELS`, and shared `PUBLIC_*_EMPTY_*` constants.
2. Guide users to safe next steps without revealing internal ids, tokens, vote sensitivity, eligibility outcomes, counters, or backend payloads.
3. Keep empty-state copy neutral — no vote counts, percentages, ranking, eligibility outcomes, or option confirmation.
4. Separate empty / no-data messages from disabled / unavailable allowlists where prior phases mixed them.
5. Must not echo raw backend payloads, foreign `error.message`, stack traces, or internal error codes in empty-state copy.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_EMPTY_STATE_MESSAGES`, `PUBLIC_EMPTY_STATE_LABELS`, shared empty constants; remove empty aggregate / explore messages from `PUBLIC_UNAVAILABLE_USER_MESSAGES`.
- `public/explore.html` — static empty-state shell aligned with shared constants.
- `public/frontend/explore-page.js` — `syncExploreEmptyStatePanel`, shared empty summary / CTA re-exports.
- `public/frontend/result-page.js` — results empty aggregate re-export (unchanged behavior).
- `public/frontend/my-polls-page.js` — creator poll list empty message / summary re-exports.
- `public/frontend/creator-flow-copy.js` — my-polls empty headline re-export.
- `public/frontend/poll-lifecycle-controls.js` — lifecycle action-area empty note re-export.
- Focused frontend + doc tests.
- README Phase 147 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Official Vote transaction order, vote-by-index eligibility-before-resolve, option index → `option_id` early resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.
- Profile completion prompt (no empty-state surface; incomplete vs complete vs load-failure only).

---

## 3. Empty / no-data state rules

### 3.1 Must

- Use frontend-owned copy from `PUBLIC_EMPTY_STATE_MESSAGES` or surface constants that re-export shared values.
- Explore empty feed uses `PUBLIC_EXPLORE_EMPTY_MESSAGE`, `PUBLIC_EXPLORE_EMPTY_SUMMARY`, and `PUBLIC_EXPLORE_EMPTY_CTA_LABEL`.
- My-polls creator list empty uses `PUBLIC_MY_POLLS_EMPTY_MESSAGE` / `PUBLIC_MY_POLLS_EMPTY_SUMMARY` with create CTA from `PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL`.
- Results empty aggregate uses `PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE` only in display-safe aggregate render path.
- Lifecycle action-area empty uses `PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE` when no creator action applies.

### 3.2 Must not

- Echo raw backend payloads, API `message` fields, internal error codes, or stack traces in empty-state copy.
- Show vote counts, percentages, rankings, trends, eligibility outcomes, or option confirmation in empty states.
- Imply visitor-specific absence or voter/profile state on public empty lists.
- Create durable user-option linkage in empty-state handlers.

---

## 4. Surface summary

| Surface | Empty / no-data copy | Notes |
|---------|---------------------|-------|
| `/explore` | `PUBLIC_EXPLORE_EMPTY_*` | feed success with zero items; HTML synced on mount |
| `/results/:id` | `PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE` | aggregate mode only; no counter preview |
| `/my-polls?live=1` | `PUBLIC_MY_POLLS_EMPTY_*` | creator owned poll list empty |
| creator flow copy | `PUBLIC_MY_POLLS_EMPTY_HEADLINE` | short headline without trailing period |
| lifecycle action area | `PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE` | no actions for current state |

---

## 5. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local   # when local environment allows
```

Focused tests:

- `tests/frontend/phase-147-public-empty-no-data-state-ux-polish.test.ts`
- `tests/docs/phase-147-public-empty-no-data-state-ux-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Empty / no-data state polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
