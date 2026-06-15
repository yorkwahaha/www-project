# WWW Project Phase 250 — Public Page Keyboard Focus Polish v1

**Status:** frontend presentation / accessibility polish, shared keyboard focus CSS tokens, presentation-only a11y helper, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 249 public share link accessibility runtime review checkpoint.

**Prior checkpoint:** [Phase 249 public share link accessibility runtime review checkpoint](./www-project-phase-249-public-share-link-accessibility-runtime-review-checkpoint-v1.md).

**Prior delivery:** [Phase 248 public copy feedback accessibility polish](./www-project-phase-248-public-copy-feedback-accessibility-polish-v1.md).

---

## 1. Purpose

Phase 250 improves keyboard focus visibility and basic focus-order clarity across public MVP pages (`/vote/:pollId`, `/results/:pollId`, `/explore`, `/my-polls`, `/polls/new`, `/login`, `/registration`, `/profile`) without changing DOM business logic, submit/click handlers, tabindex roving, focus traps, or keyboard shortcuts.

Target interactive groups:

```text
skip-link
  → primary / secondary CTA
  → form submit
  → share copy button
  → share fallback plain URL
  → destructive action
  → feedback / error panel links
```

---

## 2. Inventory — Focus Styling Before Phase 250

| Surface | Prior focus behavior |
|---------|----------------------|
| Global controls | Phase 161 `:focus:not(:focus-visible)` + accent outline on links/buttons/inputs |
| Primary CTA on accent fill | Teal outline on teal background — low contrast |
| Destructive lifecycle buttons | Border/color only; no dedicated danger focus ring |
| Share copy / fallback URL | Phase 248 hardcoded `2px` outlines separate from shared tokens |
| Form submit rows | Inherited global button outline only |
| Error / feedback panels | Message readable; child link focus and `:focus-within` panel cue weak |

---

## 3. Phase 250 Delivery

### 3.1 Shared keyboard focus helper

`public/frontend/public-keyboard-focus-a11y.js`:

| Export | Role |
|--------|------|
| `PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER` | Documents interactive focus styling groups |
| `PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP` | Maps groups to Phase 250 CSS selectors |
| `PUBLIC_KEYBOARD_FOCUS_FEEDBACK_REGION_CLASS` | Optional feedback-region readability hook |
| `PUBLIC_KEYBOARD_FOCUS_ERROR_PANEL_CLASS` | Optional error-panel `:focus-within` hook |

Re-exported from `public-mvp-ui.js` for discoverability only. No runtime DOM mutation.

### 3.2 CSS focus polish (`public-mvp.css` Phase 250 block)

| Group | Change |
|-------|--------|
| Tokens | `--mvp-focus-shadow`, `--mvp-focus-on-accent-shadow`, `--mvp-focus-danger-shadow` |
| Primary CTA | `#vote-submit`, `#create-poll-submit`, `.mvp-btn-primary`, `.mvp-cta` — accent outline + high-contrast on-fill shadow |
| Secondary CTA | `.mvp-btn-secondary`, ghost, accent-outline — accent outline + soft shadow |
| Form submit | `.mvp-form-actions` primary/secondary focus-visible reinforcement |
| Destructive | my-polls destructive toolbar — danger-colored outline + shadow |
| Share copy | `.copy-link-button:focus-visible` uses shared tokens |
| Fallback URL | `.share-url:focus` and `:focus-visible` for keyboard + programmatic focus |
| Error / feedback links | `#error-panel`, `.mvp-error-panel`, `.mvp-action-link`, load-failure CTAs |
| Panel readability | `:focus-within` on error panels and inline form status regions |
| Inline feedback | Share copy, demo action, creator owned-poll, create-poll feedback spacing/border when non-empty |

### 3.3 Explicit non-changes

- no keyboard shortcuts
- no roving tabindex
- no focus trap / modal behavior
- no DOM handler or submit flow changes
- no new API or DB migration
- no localStorage / sessionStorage / analytics / APM

---

## 4. Focused Guard Tests

- `tests/frontend/phase-250-public-page-keyboard-focus-polish.test.ts`
- `tests/docs/phase-250-public-page-keyboard-focus-polish-doc.test.ts`
- `tests/frontend/public-mvp-a11y.test.ts` (keyboard focus token + selector assertions)

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

Phase 250 is frontend presentation / accessibility polish only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
