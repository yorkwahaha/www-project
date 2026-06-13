# WWW Project Phase 204 — Public MVP Login / Registration Form Accessibility & Touch Target Polish v1

**Status:** frontend/CSS/layout polish — accessibility and mobile touch targets for `/login` and `/registration`; focused guard tests, docs, and README index.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` at `6770de5` after Phase 203-R form accessibility / touch target polish plan review checkpoint.

**Prior checkpoint:** [Phase 203-R public MVP form accessibility / touch target polish plan review checkpoint](./www-project-phase-203r-public-mvp-form-accessibility-touch-target-polish-plan-review-checkpoint-v1.md).

**Planning context:** [Phase 203 public MVP form accessibility / touch target polish plan](./www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md) §4.1–4.2 (login + registration slice).

---

## 1. Purpose

Phase 204 delivers the first approved runtime slice from Phase 203: low-risk CSS/layout accessibility and touch-target polish on `/login` and `/registration` only.

Goals:

1. Improve mobile readability for login and registration form fields, labels, and help text.
2. Reinforce `--mvp-tap-min` touch targets on submit and secondary CTAs.
3. Improve status-region (`#login-shell-message`, `#registration-form-message`) and registration success panel spacing.
4. Add guard tests proving Phase 204 is frontend/CSS/layout only.

---

## 2. Scope

### 2.1 In scope

| Area | Change |
|------|--------|
| `public/frontend/public-mvp.css` | Phase 204 rules scoped to `.login-page` and `.registration-page` |
| `public/login.html` | `login-page` class on `<main>` |
| `public/registration.html` | `registration-page` class on `<main>` |
| Guard tests | CSS/page-class coverage; login/registration boundary regression |
| README | Phase 204 index |

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- `login-page.js`, `registration-page.js` behavior changes.
- `/profile`, `/polls/new`, `/my-polls?live=1` (future phases).
- `design-drafts/` commits.

---

## 3. CSS changes (summary)

### 3.1 `/login`

- Page intro and mock banner mobile line-height.
- `.mvp-login-form-card` padding and field vertical rhythm.
- Label/help spacing; `overflow-wrap` on labels.
- `#login-credential` input `font-size: 1rem` and comfortable padding.
- `.mvp-form-actions` full-width stacked CTAs at `min-height: var(--mvp-tap-min)`.
- `#login-shell-message` readable line-height; subtle bordered host when non-empty.
- Mobile: auth state grid card spacing.

### 3.2 `/registration`

- Same form-card, label, help, and input readability rhythm as login.
- `type="month"` and `<select>` tap height and readable option text on small screens.
- `#registration-submit` and secondary/success CTAs at `--mvp-tap-min`.
- `#registration-form-message` and `#registration-success` panel spacing.
- `aria-invalid` border treatment aligned with login credential field.

---

## 4. Auth boundaries unchanged

| Boundary | Requirement |
|----------|-------------|
| Login | `POST /login/session` only; credential proof handling unchanged |
| Registration | `POST /registration` only; body fields `display_name`, `birth_year_month`, `residential_region` only |
| Registration | **No auto-login**; **no Set-Cookie**; **no GET /users/me** on submit |
| `/users/me` | `user_id` and `display_name` only for login-state display |
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

- `tests/frontend/phase-204-public-mvp-login-registration-form-accessibility-touch-target-polish.test.ts`
- `tests/docs/phase-204-public-mvp-login-registration-form-accessibility-touch-target-polish-doc.test.ts`

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Login/registration form polish does not introduce durable user-option linkage or new API calls. Raw Option Linkage Ban preserved.

Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`. Vote-by-index body remains `{ option_index }` only.
