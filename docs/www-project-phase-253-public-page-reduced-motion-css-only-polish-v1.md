# WWW Project Phase 253 — Public Page Reduced Motion CSS-only Polish v1

**Status:** frontend presentation / accessibility polish, shared `public-mvp.css` reduced-motion hardening, focused guard tests, and README index only.

**No API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 252 public page reduced motion / motion safety polish plan (`1a0a653`).

**Prior plan:** [Phase 252 public page reduced motion / motion safety polish plan](./www-project-phase-252-public-page-reduced-motion-safety-polish-plan-v1.md).

**Related delivery:** [Phase 161 public mobile visual rhythm & accessibility polish](./www-project-phase-161-public-mobile-visual-rhythm-accessibility-polish-v1.md) — first reduced-motion block for FAQ chevron and help-tip transitions.

---

## 1. Purpose

Phase 253 delivers minimal **CSS-only** reduced-motion polish per Phase 252 plan. When the user prefers reduced motion, public MVP pages disable non-essential transitions and defensive animation/scroll motion without changing layout, visibility, auth, vote, result, creator, or profile behavior.

Target surfaces:

| Surface | Motion touchpoint | Phase 253 change |
|---------|-------------------|------------------|
| `/faq`, `/trust-levels` | FAQ chevron `transition: transform` | Instant open/close under reduced motion |
| All pages with `.mvp-help` | Help-tip `transition: opacity` | Instant show/hide under reduced motion |
| All public pages | Future smooth-scroll risk | `html { scroll-behavior: auto; }` under reduced motion only |

---

## 2. Phase 253 Delivery

### 2.1 CSS (`public-mvp.css` Phase 253 block)

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .mvp-faq-question::before,
  .mvp-help-tip {
    transition: none;
    animation: none;
  }
}
```

| Rule | Intent |
|------|--------|
| `transition: none` | Removes help-tip opacity fade and FAQ chevron rotation transition |
| `animation: none` | Defensive guard if animation is added later |
| `scroll-behavior: auto` | Defensive guard; no smooth-scroll motion under reduced motion |
| Layout/state `transform` unchanged | FAQ open chevron and help-tip positioning remain available |

Phase 161 reduced-motion baseline remains in place; Phase 253 consolidates and extends at file end in `public/frontend/public-mvp.css`.

### 2.2 Explicit non-changes

- no `public/frontend/*.js` runtime changes
- no keyboard shortcuts, focus trap, roving tabindex, or automatic focus
- no new `@keyframes`, decorative `animation`, or base-level `scroll-behavior: smooth`
- no `localStorage` / `sessionStorage` / analytics / APM
- no API or DB migration
- vote-by-index body remains `{ option_index }` only; eligibility-before-option-resolve unchanged
- Raw Option Linkage Ban preserved; no option choice + user/session/device/request linkage
- `quality_badge` presentation-only boundary unchanged (`positive_feedback` → `回饋良好`; null/missing/unexpected not rendered)

---

## 3. Focused Guard Tests

- `tests/frontend/phase-253-public-page-reduced-motion-css-only-polish.test.ts`
- `tests/docs/phase-253-public-page-reduced-motion-css-only-polish-doc.test.ts`

---

## 4. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 5. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 253 is CSS-only presentation / accessibility polish. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
