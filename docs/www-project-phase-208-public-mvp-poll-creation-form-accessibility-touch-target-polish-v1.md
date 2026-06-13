# WWW Project Phase 208 — Public MVP Poll Creation Form Accessibility & Touch Target Polish v1

**Status:** frontend/CSS/layout polish — accessibility and mobile touch targets for `/polls/new`; focused guard tests, docs, and README index.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` at `92395af` after Phase 207 profile form accessibility runtime review checkpoint.

**Prior checkpoint:** [Phase 207 profile form accessibility runtime review checkpoint](./www-project-phase-207-profile-form-accessibility-runtime-review-checkpoint-v1.md).

**Planning context:** [Phase 203 public MVP form accessibility / touch target polish plan](./www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md) §4.4 (create-poll slice).

---

## 1. Purpose

Phase 208 delivers the `/polls/new` slice from Phase 203: low-risk CSS/layout accessibility and touch-target polish on the poll creation form only.

Goals:

1. Improve mobile readability for title, description, option rows, and policy panels.
2. Reinforce `--mvp-tap-min` touch targets on submit and post-success share/CTA controls.
3. Improve fieldset, label, help, error/success, and loading (`#form-message`) spacing.
4. Keep demo vs `?live=1` behavior and poll payload boundaries unchanged.
5. Add guard tests proving Phase 208 is frontend/CSS/layout only.

---

## 2. Scope

### 2.1 In scope

| Area | Change |
|------|--------|
| `public/frontend/public-mvp.css` | Phase 208 rules scoped to `.create-poll-page` |
| `public/create-poll.html` | `create-poll-page` class on `<main>` |
| Guard tests | CSS/page-class coverage; create-poll API boundary regression |
| README | Phase 208 index |

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- `create-poll-page.js` behavior changes.
- Login, registration, profile, vote, results, my-polls surfaces.
- `design-drafts/` commits.

---

## 3. CSS changes (summary)

### 3.1 `/polls/new`

- Page lead and mock-banner line-height; mobile font rhythm.
- `.mvp-form-card` padding and safe-area gutters on narrow viewports.
- `#create-poll-form` label/help spacing; `overflow-wrap` on labels.
- Option fieldset legend readability; `.option-label` row spacing.
- `input` / `select` / `textarea` at `font-size: 1rem` with comfortable padding; taller textarea on mobile.
- `.mvp-form-demo-fields` dashed border to keep demo-only sections visually distinct.
- `#create-poll-submit` at `min-height: var(--mvp-tap-min)`.
- `#form-message` readable line-height; subtle bordered host when non-empty.
- `#success-panel` share/copy links and `.copy-link-button` tap targets post-success.

---

## 4. Create-poll boundaries unchanged

| Boundary | Requirement |
|----------|-------------|
| Demo submit | `submitCreatePollDemo` — no creator API; demo poll id |
| Live submit | `?live=1` → `POST /creator/polls` with poll-definition body only |
| Creator session | `ensureCreatorSessionForLiveMode` unchanged |
| Form validation | `normalizeCreatePollForm` title/options rules unchanged |
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

- `tests/frontend/phase-208-public-mvp-poll-creation-form-accessibility-touch-target-polish.test.ts`
- `tests/docs/phase-208-public-mvp-poll-creation-form-accessibility-touch-target-polish-doc.test.ts`

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Poll creation form polish does not introduce durable user-option linkage or new API calls. Raw Option Linkage Ban preserved.

Demo vs `?live=1` submit boundaries and `POST /creator/polls` payload shape remain unchanged. Vote-by-index body remains `{ option_index }` only.
