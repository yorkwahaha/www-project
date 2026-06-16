# WWW Project Phase 298 — Public MVP Share / Keyboard / Reduced-Motion Regression Review v1

**Status:** regression review / QA record only — docs + guard tests + README index. Re-audits public MVP share-link presentation, keyboard focus polish, and reduced-motion CSS guards on primary routes after Phase 297 mobile spot-check — addressing Phase 296 **M-296-02** — without modifying runtime, CSS, layout, copy, deploy scripts, or production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This review is not release execution, not deployment, and not formal launch.**

**Baseline commit:** `ae66765` (`origin/master` after Phase 297 mobile 375px spot-check record).

**Prior context:**

- [Phase 250 public page keyboard focus polish](./www-project-phase-250-public-page-keyboard-focus-polish-v1.md) — focus tokens + `:focus-visible` / `:focus-within` CSS
- [Phase 251 public keyboard focus runtime review checkpoint](./www-project-phase-251-public-keyboard-focus-runtime-review-checkpoint-v1.md) — **APPROVED**
- [Phase 253 public page reduced motion CSS-only polish](./www-project-phase-253-public-page-reduced-motion-css-only-polish-v1.md) + [Phase 254 reduced motion runtime review checkpoint](./www-project-phase-254-public-reduced-motion-runtime-review-checkpoint-v1.md) — **APPROVED**
- [Phase 248 public copy feedback accessibility polish](./www-project-phase-248-public-copy-feedback-accessibility-polish-v1.md) + [Phase 249 share link accessibility runtime review checkpoint](./www-project-phase-249-public-share-link-accessibility-runtime-review-checkpoint-v1.md) — **APPROVED**
- [Phase 268 manual QA runbook](./www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md) — sections X-1–X-4 (keyboard / share / reduced motion)
- [Phase 292 manual QA follow-up execution record](./www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md) — overall **PASS**
- [Phase 296 backlog planning checkpoint](./www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md) — **M-296-02** candidate
- [Phase 297 mobile 375px spot-check record](./www-project-phase-297-public-mvp-mobile-375px-spot-check-record-v1.md) — overall **PASS**; **FU-292-01 closed**

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

---

## 1. Review Session Metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-298-2026-06-16` |
| Date | 2026-06-16 |
| Operator | Agent-assisted regression review (static source audit + automated gates + `npm run demo:public:local` baseline) |
| Baseline commit | `ae66765` |
| Environment | Local `www_test` via `npm run demo:public:local`; `http://127.0.0.1:3000` |
| Scope | Share-link / keyboard focus / reduced-motion regression on 10 primary public routes |
| Method | Phase 268 runbook sections X-1–X-4 + Phase 249/251/254 checkpoint criteria; static HTML/JS/CSS audit; existing guard test suite |

**Launch approval:** NO  
**Production approval:** NO  
**Release execution:** NO  
**Deployment:** NO

---

## 2. Pre-Review Automated Gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 298 doc commit |
| `npm test` | **PASS** | Full vitest suite including Phase 248–254 / 297 guards |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run migrate:check` | **PASS** | |
| `npm run smoke:public:local` | **PASS** | Full public HTTP flow on `www_test` |

---

## 3. Review Focus Areas

| Area | Check |
|------|-------|
| Share link / copy | URLs `/vote/:pollId` and `/results/:pollId` only; fixed frontend copy; no hidden aggregate in share UI; no new clipboard fallback; no storage / analytics / tracking |
| Keyboard focus | skip-link → nav → CTA → form controls focusable; `:focus:not(:focus-visible)` + `:focus-visible` guards intact; no focus trap / roving tabindex / keydown shortcuts |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` Phase 161 + 253 blocks present; no new base animations |
| `quality_badge` | `positive_feedback` →「回饋良好」only; null/missing/unexpected silent; not used for ranking/recommendation/personalization/trust/score/governance |

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

---

## 4. Share-Link Regression Results

### 4.1 Share runtime inventory (`public-share-link-layout.js`)

| Check | Result | Notes |
|-------|--------|-------|
| Share URLs poll-id paths only | **PASS** | `buildPublicVotePath` / `buildPublicResultPath` → `/vote/:pollId`, `/results/:pollId` |
| No share token / short link / QR / social SDK | **PASS** | No alternate share mechanisms in module |
| Fixed frontend copy only | **PASS** | `PUBLIC_SHARE_LINK_*` constants; `applyShareLinkCopyFeedback` sets fixed `textContent` |
| Copy feedback does not expose hidden aggregate | **PASS** | Success/prompt/failure messages are link-copy only; create-poll success lead states collecting hidden aggregate policy in prose — not numeric leak |
| Clipboard API → `execCommand` → `prompt` chain unchanged | **PASS** | Phase 248 baseline; **no new fallback tier added** |
| Failure focuses fallback URL only | **PASS** | `code.focus()` on failed copy only; no storage / tracking |
| No `localStorage` / `sessionStorage` / analytics | **PASS** | Absent from `public/frontend/*.js` |
| Share hosts on vote / results / my-polls | **PASS** | `#vote-detail-share-links`, `#results-detail-share-links`, `.mvp-creator-owned-poll-share-links` in HTML shells |

### 4.2 Per-route share surface (static + demo)

| Route | Share UI present | Aggregate leak risk | Result | Notes |
|-------|------------------|---------------------|--------|-------|
| `/` | Demo CTAs only (no copy row) | Policy copy only | **PASS** | No share copy row on home |
| `/explore` | No share row | N/A | **PASS** | Feed cards link to vote; no share clipboard |
| `/faq` | No share row | N/A | **PASS** | |
| `/login` | No share row | N/A | **PASS** | |
| `/registration` | No share row | N/A | **PASS** | |
| `/profile` | No share row | N/A | **PASS** | |
| `/polls/new` | Post-create share section (live flow) | Success copy states collecting policy; URLs poll-id only | **PASS** | Demo shell shows static notice; live share via `mountPublicShareLinkSection` |
| `/my-polls` | Creator-owned poll share rows (live) | No vote counts in share UI | **PASS** | Demo table shell; share module unchanged |
| `/vote/demo` | Share host `#vote-detail-share-links` (hydrates on live poll) | Demo shell; no numeric aggregate in share region | **PASS** | Static demo shell readable |
| `/results/demo` | Share host `#results-detail-share-links` | Collecting demo copy; no result bars in share region | **PASS** | |

**Share section overall:** **PASS**

---

## 5. Keyboard Focus Regression Results

### 5.1 Global focus guards (`public-mvp.css`)

| Check | Result | Notes |
|-------|--------|-------|
| `:focus:not(:focus-visible)` outline suppression | **PASS** | Phase 161 baseline preserved |
| `:focus-visible` accent outline on interactive controls | **PASS** | links, buttons, inputs, `[role="button"]`, `summary` |
| Phase 250 focus tokens (`--mvp-focus-shadow`, on-accent, danger) | **PASS** | CTA / form / destructive / share / error selectors present |
| `.skip-link:focus-visible` reveals skip target | **PASS** | All 10 primary HTML shells include skip-link + `#main-content` |
| No keyboard trap CSS (`inert`, `aria-modal` trap) | **PASS** | Not introduced |

### 5.2 Keyboard helper (`public-keyboard-focus-a11y.js`)

| Check | Result | Notes |
|-------|--------|-------|
| Constants / selector map only | **PASS** | No functions, listeners, `focus()` calls |
| Documented groups match Phase 250 CSS | **PASS** | `PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER` + `SELECTOR_MAP` |
| Re-export from `public-mvp-ui.js` discoverability only | **PASS** | No handler changes |

### 5.3 Forbidden keyboard behavior scan (`public/frontend/*.js`)

| Forbidden behavior | Result | Notes |
|--------------------|--------|-------|
| `addEventListener('keydown')` shortcuts | **PASS** | Not found in public frontend runtime |
| Focus trap / roving tabindex | **PASS** | Not found |
| Automatic `focus()` except share failure fallback | **PASS** | Only `public-share-link-layout.js` failure `code.focus()` (Phase 248) |

### 5.4 Per-route keyboard surface (Phase 268 X-1 style)

| Route | skip-link | Primary CTA / nav focusable | Form / interactive controls | Result | Notes |
|-------|-----------|----------------------------|------------------------------|--------|-------|
| `/` | Yes | Nav links + demo CTAs (`<a>`, `.mvp-btn`) | Help `tabindex="0"` tooltip trigger | **PASS** | |
| `/explore` | Yes | Nav + load-more button (runtime) | N/A | **PASS** | |
| `/faq` | Yes | Nav + `<summary>` accordion | 9 FAQ controls | **PASS** | |
| `/login` | Yes | Nav + submit button | 1 text input + submit | **PASS** | |
| `/registration` | Yes | Nav + submit | 4 inputs + combobox + submit | **PASS** | |
| `/profile` | Yes | Nav + sign-in CTA (guest) | Guest gate — form hidden until signed in | **PASS** | Expected |
| `/polls/new` | Yes | Nav + create submit | Multi-field form + help trigger | **PASS** | |
| `/my-polls` | Yes | Nav + demo CTAs | Demo table action links | **PASS** | |
| `/vote/demo` | Yes | Nav + vote submit (when form visible) | Radio options when hydrated | **PASS** | Demo shell; pre-vote region readable |
| `/results/demo` | Yes | Nav + preview links host | N/A on collecting demo | **PASS** | |

**Keyboard section overall:** **PASS**

---

## 6. Reduced-Motion Regression Results

### 6.1 CSS guards (`public-mvp.css`)

| Block | Rules | Result | Notes |
|-------|-------|--------|-------|
| Phase 161 (~L2868) | `.mvp-faq-question::before`, `.mvp-help-tip { transition: none; }` | **PASS** | Baseline preserved |
| Phase 253 (~L3886) | `html { scroll-behavior: auto; }`; FAQ chevron + help-tip `transition: none; animation: none;` | **PASS** | Extends Phase 161 |
| Base-level new `@keyframes` / `scroll-behavior: smooth` | N/A | **PASS** | Not introduced since Phase 254 review |
| Layout / visibility semantics under reduced motion | Unchanged | **PASS** | FAQ `<details>` content still available; help-tip via `:focus-visible` / `:focus-within` |

### 6.2 JS runtime drift

| Check | Result | Notes |
|-------|--------|-------|
| No `prefers-reduced-motion` listeners in `public/frontend/*.js` | **PASS** | CSS-only policy unchanged |
| No new animation JS | **PASS** | |

**Reduced-motion section overall:** **PASS**

---

## 7. `quality_badge` Boundary Confirmation

| Check | Result | Notes |
|-------|--------|-------|
| `shouldRenderQualityFeedbackBadge` gate | **PASS** | `poll?.quality_badge === 'positive_feedback'` only |
| Label | **PASS** | `QUALITY_FEEDBACK_BADGE_LABEL` =「回饋良好」 |
| null / missing / unexpected | **PASS** | Returns false; row hidden |
| Not used for ranking / recommendation / personalization | **PASS** | `explore-page.js` feed sort is freshness-only; badge render is presentation-only |
| No `quality_badge` in share-link module | **PASS** | |

---

## 8. Cross-Cutting Privacy / Integrity Checks

| Check | Result | Notes |
|-------|--------|-------|
| Share URLs contain poll id only — no option data | **PASS** | |
| Copy feedback does not log option choice | **PASS** | |
| No new durable user-option linkage | **PASS** | Review observational only |
| Collecting hidden aggregate on `/results/demo` | **PASS** | Consistent with Phase 297 |
| Vote pre-vote neutrality on `/vote/demo` | **PASS** | |
| Raw Option Linkage Ban | **PASS** | |

---

## 9. M-296-02 Resolution

| Field | Value |
|-------|-------|
| **M-296-02** original item | Share-link / keyboard-focus / reduced-motion regression review |
| Phase 298 action | Static audit + automated gates + Phase 268 X-1–X-4 criteria against baseline `ae66765` |
| **M-296-02 status** | **CLOSED — regression review PASS** |
| Defects requiring presentation fix phase | **None identified** |

---

## 10. Follow-Up Backlog (Recorded Only — No Fixes in Phase 298)

| ID | Item | Severity | Status | Notes |
|----|------|----------|--------|-------|
| FU-292-02 | Dual copy-source maintenance (BL-286-02) | low | **OPEN** | Static HTML vs runtime constants drift audit — out of Phase 298 scope |
| OBS-297-01 | Demo shells brief loading placeholder during hydration | low | observational | Not share/keyboard/reduced-motion defect |
| OBS-298-01 | Live share/copy row keyboard tab order on vote/results/my-polls requires authenticated creator or live poll session for full manual re-check | low | observational | Static audit + Phase 248–251 guards sufficient for MVP; operator may re-check post-W-1 |

**No new FAIL or BLOCKED items from this regression review.**

---

## 11. Session Summary

| Metric | Value |
|--------|-------|
| Routes reviewed | 10 / 10 |
| Share regression | **PASS** |
| Keyboard regression | **PASS** |
| Reduced-motion regression | **PASS** |
| `quality_badge` boundary | **PASS** |
| **FAIL** | 0 |
| **BLOCKED** | 0 |
| **NEEDS FOLLOW-UP** | 0 (defects); 2 prior/open observational items only |
| **Overall regression review result** | **PASS** |

---

## 12. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-v1.md` | this document |
| `tests/docs/phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-doc.test.ts` | doc tests |
| `tests/frontend/phase-298-public-mvp-share-keyboard-reduced-motion-regression-review.test.ts` | regression review guards |
| `README.md` | Phase 298 index |

Phase 298 itself is **regression review / docs-tests-README only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no CSS / layout change**
- **no copy change**
- **no migration**

**No `public/`, `src/`, or migration changes.**

`design-drafts/` excluded from commit.

---

## 13. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- ineligible vs nonexistent `option_index` user-visible response must remain indistinguishable
- result visibility / lifecycle state machine / result evaluator unchanged
- collecting / cancelled / unpublished hidden aggregate unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- profile: `birth_year_month` / `residential_region` only
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; presentation-only; not expanded
- share clipboard fallback: Phase 248 chain only — **no new fallback behavior**
- actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts; no production configuration change
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 14. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 15. Conclusion

**Share / keyboard / reduced-motion regression review — overall PASS.**

Phase 298 closes **M-296-02** with independent re-audit of Phase 248–254 delivery on baseline `ae66765`. No runtime, CSS, layout, or copy changes were made. Any future share/a11y defect requires a separate numbered presentation-only fix phase.

**This phase does not execute release, deploy, or formal launch.**

**Phase 299 blockers: none identified.**

---

## 16. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 298 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
