# WWW Project Phase 162 — Public Desktop / Tablet Layout Consistency Polish v1

**Status:** frontend-only layout consistency polish — shared `public-mvp.css` tablet/desktop tokens, shell width alignment, card grid rhythm, form/panel/result shell spacing, and guard tests. No copy centralization.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 161 public mobile visual rhythm & accessibility polish (`af669f1`).

**Prior checkpoint:** [Phase 161 public mobile visual rhythm & accessibility polish](./www-project-phase-161-public-mobile-visual-rhythm-accessibility-polish-v1.md).

---

## 1. Purpose

Phase 161 improved public MVP **mobile** visual rhythm and accessibility. Phase 162 polishes **tablet and desktop** layout consistency without reopening copy centralization or weakening Phase 161 mobile rules.

Goals:

1. Add shared tablet/desktop layout CSS tokens for gutters and grid gaps.
2. Align narrow content shells (`.mvp-page.mvp-shell`) to readable `--mvp-content-width`.
3. Improve card grid rhythm on `min-width: 641px` and `min-width: 1024px` breakpoints.
4. Keep forms, panels, result shells, and empty states visually consistent across wide and narrow pages.
5. Align site footer max-width with header layout width on larger viewports.
6. Preserve privacy, auth, vote, and registration boundaries.

---

## 2. Scope

### 2.1 In scope

| Area | Change |
|------|--------|
| `public/frontend/public-mvp.css` | `--mvp-content-width`, gutter/grid tokens; `.mvp-page.mvp-shell` width fix; tablet/desktop media queries; footer width alignment |
| Guard tests | Layout token/media-query coverage; Phase 161 mobile rules preserved; no backend linkage; registration/vote boundaries |

### 2.2 Out of scope

- Copy centralization (`PUBLIC_*` constants, mount-time sync helpers).
- Backend, API contract, DB, migration, auth resolver.
- `policy-ui-placeholders.js` / `HELP_COPY` bodies.
- HTML shell markup changes (CSS-only preferred).
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. CSS changes (summary)

- **Tokens:** `--mvp-content-width`, `--mvp-layout-gutter-md`, `--mvp-layout-gutter-lg`, `--mvp-grid-gap`, `--mvp-grid-gap-md`, `--mvp-grid-gap-lg`.
- **Shell width:** `.mvp-page.mvp-shell` uses `--mvp-content-width` so vote/results/create/profile pages stay readable on desktop instead of inheriting full `--mvp-layout-width`.
- **Tablet (`min-width: 641px`):** aligned page/header/footer gutters; card grid `minmax(17.5rem, 1fr)`; empty-state padding; hero spacing; form/panel/result shell width centering within parent.
- **Desktop (`min-width: 1024px`):** wider gutters; card grid `minmax(19.5rem, 1fr)`; homepage value grid 3 columns; login auth-state grid 3 columns; trust matrix page `max-width: min(52rem, 100%)`.
- **Footer:** `.mvp-site-footer-inner` max-width aligned to `--mvp-layout-width`.
- **Mobile preservation:** Phase 161 `max-width: 640px` rules (single-column card grid, safe-area padding, tap targets) unchanged.

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

- `tests/frontend/phase-162-public-desktop-tablet-layout-consistency-polish.test.ts`

---

## 5. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Layout polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preserved.

Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me`. Vote-by-index body remains `{ option_index }` only.
