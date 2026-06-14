# WWW Project Phase 246 — Public Share Link Presentation Polish v1

**Status:** frontend presentation polish, shared share-link layout helpers, clipboard feedback ordering, CSS rhythm updates, static shell hosts, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 245 public presentation hierarchy milestone checkpoint (`37f400d`).

**Prior checkpoint:** [Phase 245 public presentation hierarchy milestone checkpoint](./www-project-phase-245-public-presentation-hierarchy-milestone-checkpoint-v1.md).

---

## 1. Purpose

Phase 246 clarifies share-link presentation on `/vote/:pollId`, `/results/:pollId`, `/my-polls?live=1`, and create-poll success so users see which link to share, copy feedback, and fallback plain URLs in a consistent order.

Target row layout:

```text
share section title
  → link label
  → copy button
  → inline feedback
  → fallback plain URL
```

This is a low-risk frontend presentation phase. It does not add short links, share tokens, QR codes, social SDKs, storage, analytics, or API changes.

---

## 2. Inventory — Share Link Presentation Before Phase 246

| Surface | Prior placement |
|---------|-----------------|
| Create poll success | Shared `copy-status` at top; label + URL together before copy buttons |
| Vote page | No dedicated share section |
| Results page | No dedicated share section |
| My-polls live owned poll | Single copy button without label / fallback URL / per-row feedback |

`copyTextToClipboard` and `renderPollSharePanel` lived inline in `public-mvp-ui.js`.

---

## 3. Phase 246 Delivery

### 3.1 Shared presentation helpers

New module `public/frontend/public-share-link-layout.js`:

| Export | Role |
|--------|------|
| `PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER` | Documents fixed row child order |
| `PUBLIC_SHARE_LINK_SECTION_LAYOUT_ORDER` | Documents section title + rows order |
| `copyTextToClipboard` | Clipboard API with execCommand / prompt fallback only |
| `renderPublicShareLinkRow` | label → copy → feedback → plain URL |
| `mountPublicShareLinkSection` | Section title + rows |
| `renderPollSharePanel` | Create-poll success share block |
| `syncVotePageShareLinks` | Mount vote share section on `/vote/:pollId` |
| `syncResultsPageShareLinks` | Mount vote + result share rows on `/results/:pollId` |
| `mountCreatorOwnedPollShareLinks` | My-polls live owned poll share row |

### 3.2 Runtime wiring

| Surface | Change |
|---------|--------|
| `vote.html` | `#vote-detail-share-links` host in side panel |
| `results.html` | `#results-detail-share-links` host in visibility hints |
| `vote-page.js` | `syncVotePageShareLinks` after poll detail load |
| `result-page.js` | `syncResultsPageShareLinks` after result paint |
| `my-polls-page.js` | `mountCreatorOwnedPollShareLinks` replaces bare copy button |
| `public-mvp-ui.js` | Re-exports share helpers; section title constants; feedback copy uses「下方完整網址」 |

URL rules unchanged: `/vote/:pollId` and `/results/:pollId` only; no query tracking parameters.

### 3.3 Explicit non-changes

- no short link / share token / QR / social SDK
- no localStorage / sessionStorage / analytics / APM
- no new API or DB migration
- clipboard uses visible page URL or existing poll URL only

---

## 4. Focused Guard Tests

- `tests/frontend/phase-246-public-share-link-presentation-polish.test.ts`
- `tests/docs/phase-246-public-share-link-presentation-polish-doc.test.ts`

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

Phase 246 is frontend presentation polish only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
