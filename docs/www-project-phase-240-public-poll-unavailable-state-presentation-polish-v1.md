# WWW Project Phase 240 — Public Poll Unavailable State Presentation Polish v1

**Status:** frontend presentation polish, shared unavailable-state layout helpers, CSS rhythm updates, static shell alignment, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation rules, result visibility tiers, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 239 public poll card metadata layout polish (`3860ad7`).

**Prior delivery:** [Phase 239 public poll card metadata layout polish](./www-project-phase-239-public-poll-card-metadata-layout-polish-v1.md).

---

## 1. Purpose

Phase 240 unifies public poll **empty**, **load failure**, and **unavailable** presentation across `/vote/:pollId`, `/results/:pollId`, `/explore`, and `/my-polls` so users see consistent, frontend-owned copy and layout hierarchy without backend error echo or debug leakage.

Target situations:

1. Poll not found / invalid route / archived / closed / not accepting votes
2. Results not yet public / cancelled / unpublished
3. Explore feed empty or load failure
4. My-polls live list empty, sign-in required, or load failure
5. Collecting results still hide counters and option breakdown

This is a low-risk frontend presentation phase. It does not add API fields, backend error codes, lifecycle states, or behavior changes hidden behind copy/layout.

---

## 2. Inventory — Unavailable / Empty / Load Failure Before Phase 240

| Surface | Module / shell | Prior patterns |
|---------|----------------|----------------|
| Vote load / route errors | `vote-page.js`, `vote.html` `#error-panel` | `renderPublicErrorPanel` with title + message |
| Results unavailable / load errors | `result-page.js`, `results.html` `#error-panel` | `renderUnavailableStatusBlock`, `renderPublicErrorPanel` |
| Explore empty / errors | `explore-page.js`, `explore.html` | `mvp-empty-state`, mixed inline `textContent` vs `renderPublicInlineErrorNote` for errors |
| My-polls empty / errors | `my-polls-page.js` | ad-hoc paragraph assembly, `renderPublicInlineErrorNote` for failures |

Shared copy already lived in `public-mvp-ui.js` (`PUBLIC_*_EMPTY_*`, `PUBLIC_*_LOAD_FAILURE_*`, `PUBLIC_UNAVAILABLE_USER_MESSAGES`, `resolvePublicErrorUserMessage`).

---

## 3. Phase 240 Delivery

### 3.1 Shared presentation helpers

New module `public/frontend/public-unavailable-state.js`:

| Export | Role |
|--------|------|
| `PUBLIC_UNAVAILABLE_STATE_LAYOUT_ORDER` | Documents fixed child order: title → message → summary → CTA |
| `renderPublicEmptyStatePanel` | Primary message, optional summary, optional CTA |
| `renderPublicLoadFailurePanel` | Optional title, message, optional CTA (`role=alert` default) |
| `renderPublicInlineFailureNote` | Compact inline failure note |
| `renderPublicUnavailableStatusBlock` | Results-style cancelled / unpublished / unavailable block |

`public-mvp-ui.js` `renderPublicErrorPanel` delegates to the shared helpers; `renderPublicInlineErrorNote` keeps the compact inline note shape.

### 3.2 Runtime wiring

| Surface | Change |
|---------|--------|
| `explore-page.js` | `syncExploreEmptyStatePanel` uses `renderPublicEmptyStatePanel`; load failures use `renderPublicLoadFailurePanel` with `PUBLIC_EXPLORE_LOAD_ERROR_TITLE` when returning home |
| `my-polls-page.js` | empty + load-failure states use shared helpers |
| `result-page.js` | `renderUnavailableStatusBlock` delegates to `renderPublicUnavailableStatusBlock` |
| `vote-page.js` / `result-page.js` | continue using `renderPublicErrorPanel` (now shared-backed) for page load failures |
| `explore.html` | empty panel adds `mvp-public-empty-state` |
| `public-mvp.css` | shared unavailable title/message/summary rhythm; `mvp-public-load-failure` panel class |

### 3.3 Copy and error-safety rules (unchanged)

- `resolvePublicErrorUserMessage` still allowlists frontend-owned messages only
- foreign `error.message`, backend internal codes, stack traces, and debug details are not rendered
- collecting / cancelled / unpublished still do not expose counters, option breakdown, or hidden aggregates
- `quality_badge` presentation-only rules unchanged

---

## 4. Fixed Unavailable State Layout Contract

```text
title (optional)
  → message (required user-facing copy)
  → summary (optional policy / next-step context)
  → cta (optional safe href link)
```

Empty states: message → summary → CTA.

Load failures on explore initial fetch: title (`無法載入探索列表`) → message → home CTA.

Results unavailable: title (cancelled / unpublished / generic) → message → aggregate-hidden summary.

---

## 5. Explicit Non-Changes

Phase 240 does **not** change:

- DB schema or migrations
- backend APIs, error codes, or response shapes
- lifecycle state machine or result visibility evaluator
- `UserAuthResolver`, registration/login/session behavior
- creator session / ownership / lifecycle API behavior
- Official Vote transaction order
- vote-by-index `{ option_index }` body or eligibility-before-option-resolve
- Raw Option Linkage Ban
- `quality_badge` backend derivation or allowed values

No new tooltips, debug explanations, counts, scores, or ranks.

---

## 6. Focused Guard Tests

- `tests/frontend/phase-240-public-poll-unavailable-state-presentation-polish.test.ts`
- `tests/docs/phase-240-public-poll-unavailable-state-presentation-polish-doc.test.ts`

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

Phase 240 is frontend presentation polish only. No migration, schema DDL, API, DB, auth, vote-backend, or result-evaluator behavior changes.
