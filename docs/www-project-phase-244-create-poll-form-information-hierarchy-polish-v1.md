# WWW Project Phase 244 — Create Poll Form Information Hierarchy Polish v1

**Status:** frontend presentation polish, create-poll form layout helpers, HTML region restructuring, CSS rhythm updates, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 243 creator my polls action hierarchy polish (`56e0621`).

**Prior delivery:** [Phase 243 creator my polls action hierarchy polish](./www-project-phase-243-creator-my-polls-action-hierarchy-polish-v1.md).

---

## 1. Purpose

Phase 244 clarifies `/polls/new?live=1` create-poll information hierarchy so creators see page title, creator guidance, form fields, option inputs, schedule/lifecycle hints, preview/help, submit area, and inline feedback in a consistent order.

Target layout:

```text
page title
  → creator guidance
  → form sections (title / description / category)
  → option inputs
  → schedule / lifecycle hints
  → preview / help
  → submit area
  → inline feedback
```

This is a low-risk frontend presentation phase. It does not add form fields, change submit payload, add storage/autosave, or alter validation or POST `/creator/polls` behavior.

---

## 2. Inventory — Create Poll Page Before Phase 244

| Region | Prior placement |
|--------|-----------------|
| Page title + lead | Flat `h1` + lead before scattered hints |
| Creator guidance | Banner, live hint, nav hint, policy panel, founder callout spread across page top |
| Form sections | Title/description/category mixed with fieldsets |
| Option inputs | First fieldset inside form |
| Schedule / lifecycle hints | Demo fieldsets after options but not grouped |
| Preview / help | Pre-check panel inside form before submit |
| Submit area | Bare submit button |
| Inline feedback | `#form-message` outside form card |

---

## 3. Phase 244 Delivery

### 3.1 Shared presentation helpers

New module `public/frontend/public-create-poll-form-layout.js`:

| Export | Role |
|--------|------|
| `PUBLIC_CREATE_POLL_FORM_LAYOUT_ORDER` | Documents fixed page/form region order |
| Region ID constants | Stable anchors for HTML + guard tests |
| Region class constants | CSS hooks for hierarchy spacing |

### 3.2 HTML restructuring

| Surface | Change |
|---------|--------|
| `create-poll.html` | `#create-poll-page-title` header wraps `h1` + lead |
| `create-poll.html` | `#create-poll-creator-guidance` groups banner, live hint, nav hint, policy, founder callout |
| `create-poll.html` | `#create-poll-form-sections` wraps title/description/category |
| `create-poll.html` | `#create-poll-option-inputs` fieldset for options |
| `create-poll.html` | `#create-poll-schedule-lifecycle-hints` groups demo schedule + eligibility fieldsets |
| `create-poll.html` | `#create-poll-preview-help` for pre-submit checklist |
| `create-poll.html` | `#create-poll-submit-area` wraps submit button |
| `create-poll.html` | `#form-message` gains `mvp-create-poll-inline-feedback` class |

### 3.3 Runtime wiring

| Surface | Change |
|---------|--------|
| `create-poll-page.js` | Imports layout region IDs for copy sync selectors |
| `public-mvp.css` | Phase 244 hierarchy spacing; Phase 208 selectors updated for new wrappers |

Validation, `normalizeCreatePollForm`, `submitCreatePoll`, `submitCreatePollDemo`, `ensureCreatorSessionForLiveMode`, credentials, and error handling unchanged.

### 3.4 Explicit non-changes

- no new form fields or payload keys
- no localStorage / sessionStorage / autosave
- no tooltip/debug explanations, counts, scores, or ranks
- no hidden aggregate display

---

## 4. Focused Guard Tests

- `tests/frontend/phase-244-create-poll-form-information-hierarchy-polish.test.ts`
- `tests/docs/phase-244-create-poll-form-information-hierarchy-polish-doc.test.ts`

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

Phase 244 is frontend presentation polish only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
