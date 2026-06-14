# WWW Project Phase 242 — Public Results Detail Information Hierarchy Polish v1

**Status:** frontend presentation polish, results detail layout helpers, CSS rhythm updates, static shell alignment, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation rules, result visibility tiers, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 241 public poll detail information hierarchy polish (`78c4317`).

**Prior delivery:** [Phase 241 public poll detail information hierarchy polish](./www-project-phase-241-public-poll-detail-information-hierarchy-polish-v1.md).

---

## 1. Purpose

Phase 242 clarifies `/results/:pollId` information hierarchy so users see result page title, status/meta, result visibility hints, result content, unavailable states, and navigation CTAs in a consistent order.

Target layout:

```text
title
  → status / meta
  → result visibility hints
  → aggregate / result content
  → unavailable / load-failure panel
  → navigation CTA
```

This is a low-risk frontend presentation phase. It does not add API fields, backend error codes, lifecycle states, result evaluator behavior, demographic breakdown, or hidden aggregate exposure.

---

## 2. Inventory — Results Detail Before Phase 242

| Region | Prior placement |
|--------|-----------------|
| Title | `#page-title` after page brand |
| Demo intro / FAQ | Immediately after title |
| Vote nav hint | Before preview links |
| Visibility intro | `#results-intro` before creator lifecycle panel |
| Result content | `#result-display` |
| Load failure | `#error-panel` before public notices |
| Navigation | `#bottom-nav` footer |

Lifecycle status badge and update-time meta were not grouped; visibility hints were scattered between title and result content.

---

## 3. Phase 242 Delivery

### 3.1 Shared presentation helpers

New module `public/frontend/public-results-detail-layout.js`:

| Export | Role |
|--------|------|
| `PUBLIC_RESULTS_DETAIL_LAYOUT_ORDER` | Documents fixed region order |
| `syncResultsDetailStatusMeta` | Renders lifecycle status badge + `updated_display` meta from existing result fields |
| `buildResultsDetailMetaLine` | Hides update meta for collecting / cancelled / unpublished / draft states |

### 3.2 Static shell (`results.html`)

| Region | Element |
|--------|---------|
| Title | `.mvp-results-detail-header` → `#page-title` |
| Status / meta | `#results-detail-status-meta` → status row + meta line |
| Visibility hints | `#results-detail-visibility-hints` → demo intro, FAQ, vote nav hint, preview links, `#results-intro`, creator lifecycle host |
| Result content | `#results-detail-content` → `#result-display` |
| Unavailable | `#error-panel.mvp-results-detail-unavailable` |
| Navigation CTA | `#bottom-nav.mvp-results-detail-nav` |

`quality_badge` remains presentation-only via `mountQualityFeedbackBadgeNearTitle` after title.

### 3.3 Runtime wiring

| Surface | Change |
|---------|--------|
| `result-page.js` | Calls `syncResultsDetailStatusMeta` after result load and clears on route/load failure |
| `public-mvp.css` | Results detail region spacing and mobile rhythm |

### 3.4 Result visibility rules (unchanged)

- collecting / cancelled / unpublished / unavailable still hide counters, option breakdown, and hidden aggregate in status/meta
- aggregate display still uses existing `total_votes_display`, `display_percentage`, `display_count` only inside `renderResultDisplay` for revealed lifecycle states
- `normalizeDisplaySafeResult` and `resolveResultRenderMode` unchanged
- foreign/backend/internal errors not echoed

---

## 4. Fixed Results Detail Layout Contract

```text
title (#page-title + optional quality badge row)
  → status / meta (lifecycle badge; updated_display only when aggregate-visible)
  → visibility hints (demo intro, FAQ, vote nav, results intro, creator lifecycle mock)
  → result content (#result-display)
  → unavailable panel (#error-panel)
  → navigation CTA (#bottom-nav, public notices before nav)
```

---

## 5. Explicit Non-Changes

Phase 242 does **not** change:

- DB schema or migrations
- backend APIs, error codes, or response shapes
- lifecycle state machine or **result visibility evaluator**
- `UserAuthResolver`, registration/login/session behavior
- creator session / ownership / lifecycle API behavior
- Official Vote transaction order
- vote-by-index `{ option_index }` body or eligibility-before-option-resolve
- Raw Option Linkage Ban
- `quality_badge` backend derivation or allowed values

No new tooltips, debug explanations, scores, ranks, demographic/profile breakdown, or hidden aggregate display.

---

## 6. Focused Guard Tests

- `tests/frontend/phase-242-public-results-detail-information-hierarchy-polish.test.ts`
- `tests/docs/phase-242-public-results-detail-information-hierarchy-polish-doc.test.ts`

---

## 7. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 8. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 242 is frontend presentation polish only. No migration, schema DDL, API, DB, auth, vote-backend, or result-evaluator behavior changes.
