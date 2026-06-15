# WWW Project Phase 252 — Public Page Reduced Motion / Motion Safety Polish Plan v1

**Status:** plan only. Phase 252 plans low-risk future public MVP reduced-motion / motion-safety CSS polish across shared public pages, without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, or Reference Answer behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 252.**

**Baseline:** `origin/master` after Phase 251 public keyboard focus runtime review checkpoint (`e05b114`).

**Prior checkpoint:** [Phase 251 public keyboard focus runtime review checkpoint](./www-project-phase-251-public-keyboard-focus-runtime-review-checkpoint-v1.md).

**Related polish context:**

- [Phase 161 public mobile visual rhythm & accessibility polish](./www-project-phase-161-public-mobile-visual-rhythm-accessibility-polish-v1.md) — first `@media (prefers-reduced-motion: reduce)` block for FAQ chevron and help-tip transitions
- [Phase 250 public page keyboard focus polish](./www-project-phase-250-public-page-keyboard-focus-polish-v1.md) — keyboard focus tokens and `:focus-visible` / `:focus-within` styling (no motion changes)
- [Phase 251 public keyboard focus runtime review checkpoint](./www-project-phase-251-public-keyboard-focus-runtime-review-checkpoint-v1.md) — approved Phase 250 as presentation/a11y only

---

## 1. Plan Purpose

Phase 252 is **plan only**. It inventories current public CSS motion usage and defines safe future reduced-motion polish boundaries after Phase 250–251 keyboard focus delivery.

This plan answers:

1. Which motion-related CSS already exists in `public-mvp.css`.
2. Which surfaces may receive future **CSS-only** reduced-motion polish without reopening auth, vote, result, creator, profile, or privacy boundaries.
3. Which polish categories are safe (disable non-essential transitions/animations under `prefers-reduced-motion: reduce`).
4. Which polish categories are forbidden (layout/visibility behavior changes, JS motion, storage, tracking, keyboard trap/shortcut additions).
5. What explicit non-goals, allowed files, guard tests, and review gates apply before any runtime phase.

Phase 252 does **not** approve implementation. Future polish runtime requires a separately approved phase (**Phase 253** minimal CSS-only reduced motion polish).

---

## 2. Current Motion Inventory (`public/frontend/public-mvp.css`)

Static inventory at Phase 252 baseline (`e05b114`):

| Category | Location / selector | Current behavior | Reduced-motion status |
|----------|---------------------|------------------|------------------------|
| `transition` | `.mvp-help-tip` | `opacity 0.12s ease` on show/hide | **Partially covered** — Phase 161 sets `transition: none` under `prefers-reduced-motion: reduce` |
| `transition` | `.mvp-faq-question::before` | `transform 0.15s ease` on FAQ chevron | **Partially covered** — Phase 161 sets `transition: none` under `prefers-reduced-motion: reduce` |
| `transform` (layout) | `.mvp-help-tip` | `translateX(-50%)` centers tooltip | **Keep** — positioning, not decorative motion; must not break layout under reduced motion |
| `transform` (layout) | `@media (max-width: 640px) .mvp-help-tip` | `transform: none` on small screens | **Keep** — responsive layout adjustment |
| `transform` (state) | `.mvp-faq-item[open] > .mvp-faq-question::before` | `rotate(90deg)` when FAQ open | **Keep final state** — content visibility unchanged; Phase 161 already removes transition |
| `transform` (static decor) | `.mvp-mascot--cancelled .mvp-mascot-prop` | `rotate(8deg)` static mascot pose | **Keep** — not animated; no `@keyframes` |
| `text-transform` | various | `text-transform: none` | **N/A** — typography, not motion |
| `@keyframes` | — | **None** | — |
| `animation` | — | **None** | — |
| `scroll-behavior` | — | **None** | — |
| `prefers-reduced-motion` | Phase 161 block | `.mvp-faq-question::before`, `.mvp-help-tip { transition: none; }` | **Existing baseline** |

### 2.1 Inventory conclusion

Public MVP CSS motion is **minimal and localized**:

1. Only two animated properties today: help-tip opacity fade and FAQ chevron rotation transition.
2. Phase 161 already disables both transitions under `prefers-reduced-motion: reduce`.
3. No page-level `scroll-behavior: smooth`, no `@keyframes`, no JS-driven animation libraries in public frontend scope.
4. Phase 250 focus polish added outline/shadow styling only — no new transitions or animations.

Future Phase 253 scope should remain **small CSS-only hardening**, not a broad motion refactor.

---

## 3. Scope

### 3.1 In scope (planning only)

Future **CSS-only** reduced-motion polish candidates on public MVP pages:

| Surface | Motion touchpoints today | Future Phase 253 may review |
|---------|--------------------------|----------------------------|
| `/faq`, `/trust-levels` | FAQ chevron transition | Confirm instant open/close under reduced motion; no content hiding |
| All pages with `.mvp-help` | Help-tip opacity transition | Confirm instant show under reduced motion; preserve focus/hover visibility |
| Shared chrome / cards | None animated today | Audit new CSS additions for accidental transitions before merge |
| `/vote/:pollId`, `/results/:pollId`, `/explore`, `/my-polls`, `/polls/new`, `/login`, `/registration`, `/profile` | No dedicated motion today | Prevent future decorative motion without reduced-motion guard |

Allowed future polish mechanism:

```css
@media (prefers-reduced-motion: reduce) {
  /* disable non-essential transition/animation only */
}
```

Reduced motion must **lower or remove non-essential motion only**. It must **not** change:

- layout structure
- element visibility or content availability
- auth / login / logout / registration / profile flow
- vote / vote-by-index / result visibility / lifecycle / creator ownership behavior

### 3.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- Any edit to `public/frontend/*.js` or `public/frontend/public-mvp.css` in Phase 252.
- JavaScript motion libraries, `requestAnimationFrame` animation loops, or scroll hijacking.
- Keyboard shortcuts, focus traps, roving tabindex, or automatic focus behavior.
- `localStorage`, `sessionStorage`, cookies, analytics, metrics, APM, debug tracking.
- Ranking, recommendation, personalization, trust/score UI, governance signals.
- `design-drafts/` commits.

---

## 4. Allowed Files for Future Implementation Phase (Phase 253)

A future approved runtime phase (**Phase 253**, not Phase 252) may modify **only**:

| Category | Allowed paths | Constraint |
|----------|---------------|------------|
| Shared CSS | `public/frontend/public-mvp.css` | `@media (prefers-reduced-motion: reduce)` blocks only; no new animated properties without matching reduced-motion override |
| Guard tests | `tests/frontend/phase-253-*.test.ts`, `tests/docs/phase-253-*.test.ts` | Prove CSS-only / motion-only boundary |
| Docs / README | Future phase doc + README index | Delivery reporting |

**Default forbidden in Phase 253 unless explicitly approved in a separate governance phase:**

- `src/**`, `migrations/**`
- All `public/frontend/*.js` runtime modules
- Static HTML behavior/copy/API contract changes
- `quality-feedback-badge.js`, vote/results/explore participation runtime modules
- New `@keyframes`, `scroll-behavior: smooth`, or decorative motion without reduced-motion guard

---

## 5. Future Runtime Checklist (Phase 253)

Use this checklist in Phase 253. Each item is **CSS motion polish only**.

### 5.1 Shared reduced-motion rules

- [ ] Extend or consolidate Phase 161 `prefers-reduced-motion: reduce` block if new transitions are added elsewhere
- [ ] Any new `transition` / `animation` in `public-mvp.css` must include a reduced-motion override in the same phase
- [ ] Do **not** remove layout `transform` used for positioning (e.g. help-tip centering) unless layout remains equivalent
- [ ] Do **not** hide content or change `[open]` / `:focus-within` visibility semantics under reduced motion

### 5.2 FAQ / help surfaces

- [ ] FAQ chevron reaches open/closed state instantly when transition disabled
- [ ] Help tip appears instantly on focus/hover/active without opacity fade
- [ ] FAQ answer content remains available via native `<details>` behavior

### 5.3 Public participation / auth / creator pages

- [ ] No new motion introduced on vote, results, explore, my-polls, create-poll, login, registration, profile pages
- [ ] If accidental transitions exist after audit, disable under reduced motion only — do not alter submit handlers

### 5.4 Verification gates before Phase 253 merge

- [ ] `git diff --check`
- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run migrate:check`
- [ ] Optional: `npm run smoke:public:local` when environment allows

---

## 6. Explicit Non-Goals

Phase 252 and any future Phase 253 reduced-motion polish must **not**:

| Non-goal | Reason |
|----------|--------|
| DB / schema / migration | Motion polish is frontend CSS only |
| API contract / payload changes | No backend involvement |
| Auth / session / `UserAuthResolver` changes | Unrelated to motion |
| Registration auto-login or cookie issuance | Auth boundary |
| New profile fields beyond `birth_year_month` / `residential_region` | Profile boundary |
| Vote transaction / eligibility evaluator changes | Vote integrity |
| vote-by-index eligibility-before-option-resolve changes | Vote integrity |
| Result visibility / result evaluator changes | Result integrity |
| Lifecycle transition / creator ownership API changes | Creator boundary |
| Reference Answer integration changes | Privacy boundary |
| Ranking / recommendation / personalization | Pre-vote ranking rules |
| Trust / score / governance UI | MVP non-goals |
| `quality_badge` expansion beyond presentation-only `positive_feedback` → `回饋良好` | Governance boundary |
| Option/user/session/device/request/log/trace/metric/error linkage | Raw Option Linkage Ban |
| Keyboard shortcuts / focus trap / roving tabindex / auto focus | Phase 250–251 boundary |
| `localStorage` / `sessionStorage` / analytics / APM / debug tracking | Privacy / observability ban |
| `design-drafts/` commits | Out of repo delivery scope |

---

## 7. `quality_badge` and Raw Option Linkage Ban (Fixed)

### 7.1 `quality_badge` boundary

- Remains presentation-only via `quality-feedback-badge.js`.
- Only `positive_feedback` → `回饋良好`; `null`, missing, or unexpected values do not render.
- Must not be used for ranking, recommendation, personalization, trust, score, or governance.
- Reduced-motion polish must not add motion tied to badge state or poll outcome signals.

### 7.2 Raw Option Linkage Ban

- Reduced-motion CSS must not introduce durable or observability linkage of option choice to user, session, device, request, or traceable identifier.
- Motion preferences must not be persisted in storage or sent to backend/analytics.

---

## 8. Suggested Guard Tests for Future Implementation Phase (Phase 253)

Future Phase 253 should add:

- `tests/frontend/phase-253-public-page-reduced-motion-safety-polish.test.ts`
- `tests/docs/phase-253-public-page-reduced-motion-safety-polish-doc.test.ts`

Suggested assertions:

1. Every `transition` / `animation` in `public-mvp.css` has a matching `@media (prefers-reduced-motion: reduce)` override or documented exception.
2. No new markers in `public/frontend/*.js`.
3. vote-by-index body remains `{ option_index }` only.
4. `quality_badge` presentation gate unchanged.
5. Protected backend paths unchanged.

Phase 252 guard tests (this phase):

- `tests/docs/phase-252-public-page-reduced-motion-safety-polish-plan-doc.test.ts`
- `tests/frontend/phase-252-public-page-reduced-motion-safety-polish-plan.test.ts`

---

## 9. Phase Conclusion

**Phase 252 is plan-only.** No runtime, CSS, API, DB, auth, vote, result, creator, profile, or privacy behavior changes are delivered in this phase.

**Phase 253**, if executed, may deliver **minimal CSS-only** reduced-motion polish per Sections 4–5, followed by a runtime review checkpoint if governance requires it.

Phase 252 does **not** approve Phase 253 implementation automatically.

---

## 10. Validation Checklist (Phase 252)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
```

Phase 252 intentionally does **not** require `npm run smoke:public:local` because no runtime behavior changed.

---

## 11. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 252 is plan documentation and guard tests only. No migration, schema DDL, runtime, API, DB, CSS, or frontend behavior changes.
