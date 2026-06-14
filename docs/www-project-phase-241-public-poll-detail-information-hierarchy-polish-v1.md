# WWW Project Phase 241 — Public Poll Detail Information Hierarchy Polish v1

**Status:** frontend presentation polish, vote detail layout helpers, CSS rhythm updates, static shell alignment, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation rules, result visibility tiers, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 240 public poll unavailable state presentation polish (`360646c`).

**Prior delivery:** [Phase 240 public poll unavailable state presentation polish](./www-project-phase-240-public-poll-unavailable-state-presentation-polish-v1.md).

---

## 1. Purpose

Phase 241 clarifies `/vote/:pollId` information hierarchy so users see poll title, status/meta, pre-vote hints, options, and action area in a consistent order before submitting an Official Vote.

Target layout:

```text
title
  → status / meta
  → pre-vote hints
  → options
  → action area
  → unavailable / load-failure panel
```

This is a low-risk frontend presentation phase. It does not add API fields, backend error codes, lifecycle states, eligibility claims, counters, or option breakdown.

---

## 2. Inventory — Vote Detail Before Phase 241

| Region | Prior placement |
|--------|-----------------|
| Title | `#poll-title` after page brand |
| Description | Immediately after title |
| Reminder / policy | Mixed before collecting notice and pre-vote hint |
| Collecting notice | Between policy panel and pre-vote hint |
| Pre-vote hint | Before form, after collecting notice |
| Options + submit | `#vote-form` |
| Status message | `#form-message` |
| Load failure | `#error-panel` before success panel |

Status badge and category/close-time meta were not grouped; lifecycle context was only implied by collecting notice copy.

---

## 3. Phase 241 Delivery

### 3.1 Shared presentation helpers

New module `public/frontend/public-vote-detail-layout.js`:

| Export | Role |
|--------|------|
| `PUBLIC_VOTE_DETAIL_LAYOUT_ORDER` | Documents fixed region order |
| `syncVoteDetailStatusMeta` | Renders lifecycle status badge + category/close-time meta from existing poll detail fields |
| `buildVoteDetailMetaLine` | Category · close-time meta line (existing `category`, `closes_at`) |
| `formatVoteDetailCategoryLabel` | Frontend-owned category labels |
| `lifecycleBadgeClassForVoteDetail` | Presentation-only lifecycle badge classes |

### 3.2 Static shell (`vote.html`)

| Region | Element |
|--------|---------|
| Title | `.mvp-vote-detail-header` → `#poll-title` |
| Status / meta | `#vote-detail-status-meta` → status row, meta line, description, collecting notice, results nav hint |
| Pre-vote hints | `#vote-detail-pre-vote-hints` → reminder lead, policy panel, `#official-vote-pre-vote-hint`, mock policy panels |
| Options + action | `#vote-detail-action-area` → `#vote-form`, `#form-message`, `#success-panel` |
| Unavailable | `#error-panel.mvp-vote-detail-unavailable` (last in main column) |

`quality_badge` remains presentation-only via `mountQualityFeedbackBadgeNearTitle` after title.

### 3.3 Runtime wiring

| Surface | Change |
|---------|--------|
| `vote-page.js` | Calls `syncVoteDetailStatusMeta` after poll detail load and clears on route/load failure |
| `official-vote-pre-vote-hints.js` | Mounts into `#vote-detail-pre-vote-hints` when present |
| `public-mvp.css` | Vote detail region spacing and mobile rhythm |

### 3.4 Copy and eligibility rules (unchanged)

- Pre-vote hints still read `/users/me` and `/users/me/profile` only
- No eligibility outcome claims (`符合資格`, `不符合資格`, `可以投票`, etc.)
- `resolvePublicErrorUserMessage` still blocks foreign/backend error echo
- collecting / cancelled / unpublished still hide counters and option breakdown
- vote-by-index body remains `{ option_index }` only

---

## 4. Fixed Vote Detail Layout Contract

```text
title (#poll-title + optional quality badge row)
  → status / meta (lifecycle badge, category · close time, description, collecting notice)
  → pre-vote hints (reminder, policy list, official pre-vote hint)
  → options (#poll-options radiogroup)
  → action area (submit, form status, success panel)
  → unavailable panel (#error-panel)
```

---

## 5. Explicit Non-Changes

Phase 241 does **not** change:

- DB schema or migrations
- backend APIs, error codes, or response shapes
- lifecycle state machine or result visibility evaluator
- `UserAuthResolver`, registration/login/session behavior
- creator session / ownership / lifecycle API behavior
- Official Vote transaction order
- vote-by-index `{ option_index }` body or eligibility-before-option-resolve
- Raw Option Linkage Ban
- `quality_badge` backend derivation or allowed values

No new tooltips, debug explanations, counts, scores, ranks, or eligibility outcome display.

---

## 6. Focused Guard Tests

- `tests/frontend/phase-241-public-poll-detail-information-hierarchy-polish.test.ts`
- `tests/docs/phase-241-public-poll-detail-information-hierarchy-polish-doc.test.ts`

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

Phase 241 is frontend presentation polish only. No migration, schema DDL, API, DB, auth, vote-backend, or result-evaluator behavior changes.
