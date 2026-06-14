# WWW Project Phase 248 — Public Copy Feedback Accessibility Polish v1

**Status:** frontend presentation / accessibility polish, shared share-link copy feedback helpers, CSS focus and state styling, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 247 public share link runtime review checkpoint (`de3747d`).

**Prior checkpoint:** [Phase 247 public share link runtime review checkpoint](./www-project-phase-247-public-share-link-runtime-review-checkpoint-v1.md).

**Prior delivery:** [Phase 246 public share link presentation polish](./www-project-phase-246-public-share-link-presentation-polish-v1.md).

---

## 1. Purpose

Phase 248 improves copy-to-clipboard feedback accessibility and consistency across `/vote/:pollId`, `/results/:pollId`, `/my-polls?live=1`, and create-poll success share rows.

Target copy-feedback region:

```text
copy button
  → aria-live feedback (role="status", aria-atomic="true")
  → fallback plain URL (keyboard-focusable, fixed aria-label)
```

Screen reader and keyboard users should hear fixed frontend copy for copy success, manual prompt fallback, and manual selection fallback — never backend/internal errors.

---

## 2. Inventory — Copy Feedback Before Phase 248

| Surface | Prior feedback behavior |
|---------|-------------------------|
| Share link rows | `role="status"` + `aria-live="polite"` only; no `aria-describedby` on copy button |
| Fallback URL | Plain `<code>` without keyboard focus or aria-label |
| Copy failure | Same `aria-live="polite"` as success |
| My-polls live share | Custom success/failure copy diverging from shared defaults |
| Demo my-polls share | `showDemoOnlyFeedback` without `aria-atomic` |

---

## 3. Phase 248 Delivery

### 3.1 Shared copy feedback helpers

`public/frontend/public-share-link-layout.js`:

| Export | Role |
|--------|------|
| `PUBLIC_SHARE_LINK_COPY_FEEDBACK_A11Y_ORDER` | Documents copy-button → aria-live feedback → fallback URL order |
| `PUBLIC_SHARE_LINK_COPIED_MESSAGE` | Fixed success copy |
| `PUBLIC_SHARE_LINK_PROMPT_MESSAGE` | Fixed prompt-fallback copy |
| `PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE` | Fixed manual-selection copy |
| `PUBLIC_SHARE_LINK_FALLBACK_URL_ARIA_LABEL` | Fixed fallback URL aria-label |
| `applyShareLinkCopyFeedback` | Sets `data-copy-state` + `aria-live` polite/assertive |
| `createPublicShareLinkFeedback` | `role="status"`, `aria-live`, `aria-atomic="true"` |
| `renderPublicShareLinkRow` | `aria-describedby` on copy button; focus fallback URL on failure |

### 3.2 Accessibility behavior

| Behavior | Detail |
|----------|--------|
| Copy button | `aria-describedby` links feedback + fallback URL ids |
| Success feedback | `data-copy-state="success"`, `aria-live="polite"` |
| Prompt / failure feedback | `data-copy-state="prompt"` or `"failure"`, `aria-live="assertive"` |
| Fallback URL | `tabindex="0"`, fixed `aria-label`, receives focus after failed copy |
| Messages | Fixed frontend copy only; no `error.message` echo |

### 3.3 Surface alignment

| Surface | Change |
|---------|--------|
| Vote / results / create poll | Shared row feedback helpers |
| My-polls live owned poll | Uses unified share-link messages (no per-surface override) |
| `public-mvp-ui.js` | Re-exports share feedback constants from layout |
| `public-mvp-demo.js` | Demo action feedback adds `aria-atomic="true"` |
| `public-mvp.css` | Success/failure feedback colors + focus outlines |

### 3.4 Explicit non-changes

- no share URL rule change (`/vote/:pollId`, `/results/:pollId`)
- no short link / share token / QR / social SDK
- no localStorage / sessionStorage / analytics / APM
- no new API or DB migration
- clipboard still uses visible poll URLs only

---

## 4. Focused Guard Tests

- `tests/frontend/phase-248-public-copy-feedback-accessibility-polish.test.ts`
- `tests/docs/phase-248-public-copy-feedback-accessibility-polish-doc.test.ts`
- `tests/frontend/public-mvp-a11y.test.ts` (share-link copy feedback assertions)

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

Phase 248 is frontend presentation / accessibility polish only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
