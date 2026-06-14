# WWW Project Phase 239 — Public Poll Card Metadata Layout Polish v1

**Status:** frontend presentation polish, shared poll-card layout helpers, CSS rhythm updates, static shell alignment, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation rules, `quality_badge` display gate logic, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 238 public onboarding + FAQ copy final milestone checkpoint (`61d8314`).

**Prior checkpoint:** [Phase 238 public onboarding + FAQ copy final milestone checkpoint](./www-project-phase-238-public-onboarding-faq-copy-final-milestone-checkpoint-v1.md).

---

## 1. Purpose

Phase 239 clarifies public poll card metadata hierarchy on home static examples, explore feed cards, and my-polls surfaces so users can scan:

1. **Title** first
2. **Status label** and optional **quality badge** (`positive_feedback` →「回饋良好」only)
3. **Category / time metadata**
4. **Policy hint or body** (when present)
5. **Primary CTA** last

This is a low-risk frontend presentation phase. It does not add API fields, schema, migrations, or behavior changes hidden behind copy/layout.

---

## 2. Inventory — Public Poll Card Rendering Before Phase 239

| Surface | Module / shell | Prior layout |
|---------|----------------|--------------|
| Explore feed | `explore-page.js` → `renderExplorePollCard` | Title and badges competed in `mvp-poll-card-top` flex row; meta/hint/footer followed |
| Home static examples | `public/index.html` | Same top-row pattern with inline status badge |
| My polls mock dashboard | `public/my-polls.html` | Table columns for status/time/actions without shared status-row wrapper |
| My polls live owned list | `my-polls-page.js` → `renderCreatorOwnedPoll` | Status badge and category inline in one meta paragraph |

Shared CSS lived in `public-mvp.css` (`.mvp-poll-card`, `.mvp-poll-card-top`, `.mvp-poll-card-meta`, `.mvp-poll-card-hint`, `.mvp-poll-card-footer`, `.mvp-poll-card-badges`).

`quality_badge` rendering remained centralized in `quality-feedback-badge.js`.

---

## 3. Phase 239 Delivery

### 3.1 Shared layout helpers

New module `public/frontend/public-poll-card.js`:

| Export | Role |
|--------|------|
| `PUBLIC_POLL_CARD_METADATA_LAYOUT_ORDER` | Documents fixed child order |
| `formatPublicPollCardMetaLine` | `category · time` meta line |
| `formatPublicPollCardCloseTimeLabel` | Existing `closes_at` ISO fallback for creator-owned cards |
| `buildPublicPollCardTitle` | Card `h3` |
| `appendPublicPollCardStatusRow` | Status badge row; optional `quality_badge` via `pollRecord` + `renderQualityFeedbackBadge` |
| `buildPublicPollCardMeta` | Meta paragraph |
| `buildPublicPollCardHint` | Policy hint paragraph |
| `buildPublicPollCardFooter` | CTA footer |

### 3.2 Runtime wiring

| Surface | Change |
|---------|--------|
| `explore-page.js` | `renderExplorePollCard` uses shared helpers; child order title → status row → meta → hint → footer |
| `my-polls-page.js` | `renderCreatorOwnedPoll` uses status row + meta line (`category · closes_at` fallback) |
| `public/index.html` | Static sample cards aligned to shared layout |
| `public/my-polls.html` | Mock dashboard status/time cells use `mvp-poll-card-status-row` and `mvp-poll-card-time-cell` |
| `public-mvp.css` | Status-row rhythm, table time-cell styling, my-polls live meta spacing |

### 3.3 `quality_badge` presentation-only (unchanged rules)

- only `positive_feedback` renders **回饋良好**
- null/missing/unexpected does not render
- no tooltip/debug/explanation/counts/score/rank added
- not used for ranking/recommendation/personalization/trust/creator score/governance

---

## 4. Fixed Metadata Layout Contract

```text
title (h3)
  → status-row (lifecycle/status badge, then optional quality badge)
  → meta (category · time using existing fields / fallbacks only)
  → hint-or-body (policy hint, result preview, or lifecycle panel)
  → footer-cta (vote / results / manage actions)
```

Explore feed still uses only existing feed item keys (`poll_id`, `title`, `category`, `status`, `published_display`, `result_page_url`, `quality_badge`).

My-polls live cards use existing creator-owned poll keys including `closes_at`; no new API fields.

---

## 5. Explicit Non-Changes

Phase 239 does **not** change:

- DB schema or migrations
- backend APIs or response shapes
- `GET /polls/feed`, `GET /creator/polls`, vote, result, registration, login, profile endpoints
- `UserAuthResolver`, registration/login/session behavior
- creator session / ownership / lifecycle API behavior
- Official Vote transaction order
- vote-by-index `{ option_index }` body or eligibility-before-option-resolve
- result visibility tiers or lifecycle meaning
- Raw Option Linkage Ban
- `quality_badge` backend derivation or allowed values

No new logs, metrics, analytics, APM, or debug payloads.

---

## 6. Focused Guard Tests

- `tests/frontend/phase-239-public-poll-card-metadata-layout-polish.test.ts`
- `tests/docs/phase-239-public-poll-card-metadata-layout-polish-doc.test.ts`

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

Phase 239 is frontend presentation polish only. No migration, schema DDL, API, DB, auth, vote-backend, or result-evaluator behavior changes.
