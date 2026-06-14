# WWW Project Phase 243 — Creator My Polls Action Hierarchy Polish v1

**Status:** frontend presentation polish, creator owned-poll action layout helpers, CSS rhythm updates, grouped lifecycle action presentation, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle state machine, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 242 public results detail information hierarchy polish (`8ef32f9`).

**Prior delivery:** [Phase 242 public results detail information hierarchy polish](./www-project-phase-242-public-results-detail-information-hierarchy-polish-v1.md).

---

## 1. Purpose

Phase 243 clarifies `/my-polls?live=1` owned poll action hierarchy so creators see title/status/meta, lifecycle hints, primary/secondary/destructive actions, navigation links, and inline feedback in a consistent order.

Target layout per owned poll card:

```text
title / status / meta
  → lifecycle hint
  → primary action
  → secondary actions
  → destructive actions
  → result / vote links
  → inline feedback
```

This is a low-risk frontend presentation phase. It does not add API fields, lifecycle transitions, bulk actions, counters, or hidden aggregate display.

---

## 2. Inventory — My Polls Live Owned Poll Before Phase 243

| Region | Prior placement |
|--------|-----------------|
| Title / status / meta | Title, badge row, meta scattered |
| Manage links | Before lifecycle panel and share |
| Share copy vote link | Between links and lifecycle panel |
| Lifecycle hint + actions | Single flat toolbar (cancel before close) |
| Results link | Inside lifecycle toolbar |
| Inline feedback | End of lifecycle panel |

---

## 3. Phase 243 Delivery

### 3.1 Shared presentation helpers

New module `public/frontend/public-creator-owned-poll-layout.js`:

| Export | Role |
|--------|------|
| `PUBLIC_CREATOR_OWNED_POLL_ACTION_LAYOUT_ORDER` | Documents fixed action region order |
| `createCreatorOwnedPollActionArea` | Builds hint / primary / secondary / destructive / nav / feedback slots |
| `buildCreatorOwnedPollHeader` | Title + status badge + meta line |
| `lifecycleActionGroupForTransition` | Maps close → primary; cancel/unpublish → destructive |

### 3.2 Runtime wiring

| Surface | Change |
|---------|--------|
| `my-polls-page.js` | `renderCreatorOwnedPoll` uses grouped action area; share in secondary; nav links last |
| `poll-lifecycle-controls.js` | Optional `actionLayoutHosts` + `showPanelTitle: false` for grouped presentation; confirm + POST flow unchanged |
| `public-mvp.css` | Action area spacing; `mvp-creator-owned-poll-destructive-toolbar` visual separation |

### 3.3 Action grouping rules (presentation only)

| Action | Group |
|--------|-------|
| `close` (結束收集並公開結果) | primary |
| copy vote link | secondary |
| `cancel`, `unpublish` | destructive (visually separated) |
| vote / my-polls / results links | nav-links |

Lifecycle confirm dialogs, `postPollLifecycleTransition`, and `onStateChange` behavior unchanged.

### 3.4 Explicit non-changes

- collecting / cancelled / unpublished still hide counters, option breakdown, hidden aggregate
- no bulk actions
- no new tooltips, debug explanations, scores, or ranks

---

## 4. Focused Guard Tests

- `tests/frontend/phase-243-creator-my-polls-action-hierarchy-polish.test.ts`
- `tests/docs/phase-243-creator-my-polls-action-hierarchy-polish-doc.test.ts`

---

## 5. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 6. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 243 is frontend presentation polish only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
