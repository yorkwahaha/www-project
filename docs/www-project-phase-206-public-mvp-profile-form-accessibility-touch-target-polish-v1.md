# WWW Project Phase 206 — Public MVP Profile Form Accessibility & Touch Target Polish v1

**Status:** frontend/CSS/layout polish — accessibility and mobile touch targets for `/profile`; focused guard tests, docs, and README index.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` at `e854b96` after Phase 205 login / registration form accessibility runtime review checkpoint.

**Prior checkpoint:** [Phase 205 login / registration form accessibility runtime review checkpoint](./www-project-phase-205-login-registration-form-accessibility-runtime-review-checkpoint-v1.md).

**Planning context:** [Phase 203 public MVP form accessibility / touch target polish plan](./www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md) §4.3 (profile slice).

---

## 1. Purpose

Phase 206 delivers the profile slice from Phase 203: low-risk CSS/layout accessibility and touch-target polish on `/profile` only.

Goals:

1. Improve mobile readability for signed-in profile form fields, labels, and help text.
2. Reinforce `--mvp-tap-min` touch targets on save/clear buttons and unauthenticated CTAs.
3. Improve status-region (`#profile-form-message`) spacing and unauthenticated CTA block rhythm.
4. Add guard tests proving Phase 206 is frontend/CSS/layout only.

---

## 2. Scope

### 2.1 In scope

| Area | Change |
|------|--------|
| `public/frontend/public-mvp.css` | Phase 206 rules scoped to `.profile-page` |
| `public/profile.html` | `profile-page` class on `<main>` |
| Guard tests | CSS/page-class coverage; profile API boundary regression |
| README | Phase 206 index |

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- `profile-page.js` behavior changes.
- Login, registration, create-poll, my-polls surfaces.
- New profile fields beyond `birth_year_month` and `residential_region`.
- `design-drafts/` commits.

---

## 3. CSS changes (summary)

### 3.1 `/profile`

- Page intro lead line-height and mobile font rhythm.
- `#profile-unauthenticated` CTA block padding, heading/message spacing, and full-width tap targets.
- `#profile-signed-in-panel` form card padding.
- `#profile-form` label/help spacing; `overflow-wrap` on labels; fields remain optional (null/present semantics unchanged).
- `type="month"` and `<select>` `font-size: 1rem` and comfortable padding.
- `#profile-submit` / `#profile-clear` at `min-height: var(--mvp-tap-min)`.
- `#profile-form-message` readable line-height; subtle bordered host when non-empty.
- Mobile: safe-area form-card padding; select option readability.

---

## 4. Profile boundaries unchanged

| Boundary | Requirement |
|----------|-------------|
| Profile load | `GET /users/me/profile` only |
| Profile save | `PUT /users/me/profile` only |
| Profile fields | **`birth_year_month`** and **`residential_region`** only; null/clear semantics preserved |
| Field ceiling | No gender, exact birthday, address, precise location, or new demographic fields |
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

- `tests/frontend/phase-206-public-mvp-profile-form-accessibility-touch-target-polish.test.ts`
- `tests/docs/phase-206-public-mvp-profile-form-accessibility-touch-target-polish-doc.test.ts`

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Profile form polish does not introduce durable user-option linkage or new API calls. Raw Option Linkage Ban preserved.

Profile fields remain `birth_year_month` and `residential_region` only with existing null/clear semantics. Vote-by-index body remains `{ option_index }` only.
