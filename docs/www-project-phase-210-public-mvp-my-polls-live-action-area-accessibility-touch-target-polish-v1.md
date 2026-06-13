# WWW Project Phase 210 — Public MVP My Polls Live Action Area Accessibility & Touch Target Polish v1

**Status:** frontend/CSS/layout polish — accessibility and mobile touch targets for `/my-polls?live=1` action areas; focused guard tests, docs, and README index.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` at `1b18226` after Phase 209 poll creation form accessibility runtime review checkpoint.

**Prior checkpoint:** [Phase 209 poll creation form accessibility runtime review checkpoint](./www-project-phase-209-poll-creation-form-accessibility-runtime-review-checkpoint-v1.md).

**Planning context:** [Phase 203 public MVP form accessibility / touch target polish plan](./www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md) §4.5 (my-polls live slice).

---

## 1. Purpose

Phase 210 delivers the `/my-polls?live=1` slice from Phase 203: low-risk CSS/layout accessibility and touch-target polish on creator live management action areas only.

Goals:

1. Improve mobile readability for live owned-list cards and demo dashboard table rows.
2. Reinforce `--mvp-tap-min` touch targets on lifecycle, share, and empty/error CTAs.
3. Improve loading, failure, and empty-state message spacing inside `#creator-live-manage`.
4. Keep `prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, and lifecycle API boundaries unchanged.
5. Add guard tests proving Phase 210 is frontend/CSS/layout only.

---

## 2. Scope

### 2.1 In scope

| Area | Change |
|------|--------|
| `public/frontend/public-mvp.css` | Phase 210 rules scoped to `.my-polls-page` |
| `public/my-polls.html` | `my-polls-page` class on `<main>` |
| Guard tests | CSS/page-class coverage; my-polls live API boundary regression |
| README | Phase 210 index |

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- `my-polls-page.js` behavior changes.
- Login, registration, profile, create-poll, vote, results surfaces.
- `design-drafts/` commits.

---

## 3. CSS changes (summary)

### 3.1 `/my-polls` (live action areas)

- Page intro lead and mock-banner line-height; policy panel text rhythm.
- `#creator-live-manage` panel padding; loading/status `.mvp-meta` spacing; error `.panel-message` readability.
- Empty/sign-in/error `.mvp-action-link` tap targets at `min-height: var(--mvp-tap-min)`.
- `.mvp-creator-live-poll` card spacing and safe-area padding on narrow viewports.
- `.mvp-creator-flow-links`, share row, and `.mvp-creator-lifecycle-toolbar` button tap targets.
- Demo `.mvp-dash-table` row/action column spacing and mobile cell padding.

---

## 4. My-polls live boundaries unchanged

| Boundary | Requirement |
|----------|-------------|
| Live session | `prepareMyPollsLiveSession` → `GET /creator/session` (+ local `ensureCreatorSessionForLiveMode` fallback) |
| Owned list | `fetchCreatorOwnedPolls` → `GET /creator/polls` only |
| Owned poll payload | `CREATOR_OWNED_POLL_ALLOWED_KEYS` display-safe fields only |
| Lifecycle APIs | `POST /creator/polls/:id/cancel`, `/close`, `/unpublish` unchanged |
| Demo vs live | `parseLiveApiMode`; mock dashboard `aria-hidden` when `?live=1` |
| Raw Option Linkage Ban | Preserved |

---

## 5. `quality_badge` unchanged

- No changes to `quality-feedback-badge.js` or participation surfaces in this phase.

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-210-public-mvp-my-polls-live-action-area-accessibility-touch-target-polish.test.ts`
- `tests/docs/phase-210-public-mvp-my-polls-live-action-area-accessibility-touch-target-polish-doc.test.ts`

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

My-polls live action polish does not introduce durable user-option linkage or new API calls. Raw Option Linkage Ban preserved.

`prepareMyPollsLiveSession`, `fetchCreatorOwnedPolls`, and lifecycle `POST /creator/polls/:id/*` paths remain unchanged. Vote-by-index body remains `{ option_index }` only.
