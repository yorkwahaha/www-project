# WWW Project Phase 161 — Public Mobile Visual Rhythm & Accessibility Polish v1

**Status:** frontend-only visual rhythm and accessibility polish — shared `public-mvp.css` tokens, tap-target sizing, mobile spacing, focus-visible behavior, and guard tests. No copy centralization.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 160 public static HTML shell copy alignment runtime review checkpoint (`154daa5`).

**Prior checkpoint:** [Phase 160 public static HTML shell copy alignment runtime review checkpoint](./www-project-phase-160-public-static-html-shell-copy-alignment-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phases 135–160 finished public UX **copy** consistency. Phase 161 improves public MVP **mobile visual rhythm and accessibility** without reopening copy centralization.

Goals:

1. Add shared rhythm / tap-target CSS tokens for public surfaces.
2. Improve mobile spacing and readability for cards, panels, and forms.
3. Keep interactive controls at practical minimum tap-target height (~44px / `2.75rem`).
4. Strengthen keyboard `focus-visible` rings and `prefers-reduced-motion` handling.
5. Preserve privacy, auth, vote, and registration boundaries.

---

## 2. Scope

### 2.1 In scope

| Area | Change |
|------|--------|
| `public/frontend/public-mvp.css` | `--mvp-tap-min`, spacing tokens, focus-visible, touch-action, mobile safe-area padding, card/panel/form rhythm, FAQ/help tap targets |
| Guard tests | CSS rhythm/tap-target/focus coverage; no backend linkage; registration/vote boundaries |

### 2.2 Out of scope

- Copy centralization (`PUBLIC_*` constants, mount-time sync helpers).
- Backend, API contract, DB, migration, auth resolver.
- `policy-ui-placeholders.js` / `HELP_COPY` bodies.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. CSS changes (summary)

- **Tokens:** `--mvp-tap-min`, `--mvp-focus-width`, `--mvp-focus-offset`, `--mvp-space-section`, `--mvp-space-card`, `--mvp-space-form-field`.
- **Focus:** `:focus:not(:focus-visible)` suppression; explicit `focus-visible` rings on links, buttons, inputs, `summary`, and `[role="button"]`.
- **Tap targets:** `.mvp-btn`, form controls, `.copy-link-button`, `.mvp-help`, `.mvp-faq-question`, site nav links; mobile bottom-nav / footer action links.
- **Rhythm:** policy-panel list line-height; poll-card gap; form-card / fieldset padding via spacing tokens; mobile policy-panel / side-panel / vote-option padding.
- **Motion:** `prefers-reduced-motion: reduce` disables FAQ/help transitions.
- **Safe area:** mobile page/shell/header horizontal inset padding.

---

## 4. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local
```

Focused tests:

- `tests/frontend/phase-161-public-mobile-visual-rhythm-accessibility-polish.test.ts`

---

## 5. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Visual polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`. Vote-by-index body remains `{ option_index }` only.
