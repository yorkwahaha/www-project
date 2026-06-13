# WWW Project Phase 203 — Public MVP Form Accessibility / Touch Target Polish Plan v1

**Status:** plan only. Phase 203 plans low-risk future public MVP form accessibility and touch-target polish across auth/profile/creator form surfaces, without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, or Reference Answer behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 203.**

**Baseline:** `origin/master` after Phase 202 public MVP mobile readability runtime review checkpoint (`96a0c26`).

**Prior checkpoint:** [Phase 202 public MVP mobile readability runtime review checkpoint](./www-project-phase-202-public-mvp-mobile-readability-runtime-review-checkpoint-v1.md).

**Related polish context:**

- [Phase 161 public mobile visual rhythm & accessibility polish](./www-project-phase-161-public-mobile-visual-rhythm-accessibility-polish-v1.md) — shared `--mvp-tap-min`, focus-visible, form control min-height
- [Phase 151 public form field label / placeholder consistency polish](./www-project-phase-151-public-form-field-label-placeholder-consistency-polish-v1.md) — label/placeholder alignment
- [Phase 199 public MVP empty / error / loading state polish](./www-project-phase-199-public-mvp-empty-error-loading-state-polish-v1.md) — pending/failure copy constants
- [Phase 201 public MVP mobile readability polish](./www-project-phase-201-public-mvp-mobile-readability-polish-v1.md) — participation-page mobile rhythm pattern

---

## 1. Plan Purpose

Phase 203 is **plan only**. It identifies low-risk, accessibility-oriented form and touch-target polish candidates on public MVP auth, profile, and creator form surfaces after Phase 201–202 participation-page mobile readability delivery.

This plan answers:

1. Which form surfaces may receive future CSS/layout accessibility polish without reopening auth, profile, vote, or creator-session boundaries.
2. Which polish categories are safe (input readability, label/help/error spacing, tap targets, section rhythm, status-region readability, keyboard/mobile layout).
3. Which polish categories are forbidden (API payload changes, new profile fields, auto-login, eligibility disclosure, option linkage).
4. What explicit non-goals, allowed files, guard tests, and review gates apply before any runtime phase.

Phase 203 does **not** approve implementation. Future polish runtime requires a separately approved phase (e.g. Phase 203-R review checkpoint + Phase 204 runtime slice).

---

## 2. Scope

### 2.1 In scope (planning only)

Public MVP form and action surfaces that may receive future **small, safe** accessibility / touch-target polish:

| Surface | Current shell / runtime | Future polish may touch |
|---------|-------------------------|-------------------------|
| `/login` | `login.html`, `login-page.js`, `.mvp-login-shell`, `.mvp-production-login-form` | Input/label spacing, credential field readability, submit/CTA tap targets, `#login-shell-message` status rhythm, `aria-*` host alignment (no new semantics) |
| `/registration` | `registration.html`, `registration-page.js`, `.mvp-registration-shell` | Field label/help spacing, month/select readability, submit/CTA tap targets, `#registration-form-message` and `#registration-success` panel rhythm |
| `/profile` | `profile.html`, `profile-page.js`, `.mvp-profile-shell` | Unauthenticated CTA block, signed-in form spacing, hint line-height, save/clear button tap targets, `#profile-form-message` status rhythm |
| `/polls/new` | `create-poll.html`, `create-poll-page.js`, `#create-poll-form` | Title/option fieldset spacing, textarea min-height, demo-field visual separation, submit/share CTA tap targets, `#form-message` readability |
| `/my-polls?live=1` | `my-polls.html`, `my-polls-page.js` | Live dashboard CTA/action row tap targets, empty/error panel spacing, lifecycle action button rhythm in table cells — **not** lifecycle API behavior |

Shared assets likely touched in a future runtime slice:

- `public/frontend/public-mvp.css` — form-shell scoped mobile rules, tap-target reinforcement, focus-visible rhythm
- Minimal static HTML class wrappers on `<main>` (e.g. `login-page`, `registration-page`, `profile-page`, `create-poll-page`, `my-polls-page`) only if needed for CSS scoping

### 2.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- `login-page.js`, `registration-page.js`, `profile-page.js`, `create-poll-page.js`, `my-polls-page.js` behavior changes unless a real blocker is found in a future review (default: CSS/layout only).
- Auth/session/login resolver, `UserAuthResolver`, Reference Answer changes.
- Vote transaction, vote-by-index, eligibility evaluator, result visibility changes.
- New profile fields beyond `birth_year_month` and `residential_region`.
- Registration auto-login, `Set-Cookie`, or `GET /users/me` reads on registration submit.
- Creator ownership / `creator_session` authority changes.
- Ranking, recommendation, personalization, `quality_badge` expansion, trust/score UI.
- `design-drafts/` commits.

---

## 3. Allowed Files for Future Implementation Phase

A future approved runtime phase (not Phase 203) may modify **only**:

| Category | Allowed paths | Constraint |
|----------|---------------|------------|
| Shared CSS | `public/frontend/public-mvp.css` | Accessibility/layout/tap-target/spacing/typography only; prefer page-class scoping |
| Static HTML shells | `public/login.html`, `public/registration.html`, `public/profile.html`, `public/create-poll.html`, `public/my-polls.html` | Minimal class/wrapper/`aria-*` host alignment only; no copy/API contract changes unless already centralized in `public-mvp-ui.js` |
| Guard tests | `tests/frontend/phase-204-*.test.ts` (or similarly named future slice), `tests/docs/phase-204-*.test.ts` | Prove CSS/layout-only boundary |
| Docs / README | Future phase doc + README index | Delivery reporting |

**Default forbidden in future runtime unless explicitly approved in a separate governance phase:**

- `src/**`, `migrations/**`
- `public/frontend/login-page.js` fetch/submit paths
- `public/frontend/registration-page.js` — must keep `POST /registration` only; no auto-login
- `public/frontend/profile-page.js` — must keep `GET`/`PUT /users/me/profile` with `birth_year_month` + `residential_region` only
- `public/frontend/create-poll-page.js` — must keep demo vs `?live=1` creator boundary
- `public/frontend/my-polls-page.js` — must keep `creator_session` / owned-list fetch boundaries
- `quality-feedback-badge.js`, vote/results/explore participation runtime modules

---

## 4. Page-by-Page Polish Checklist (Future Runtime)

Use this checklist in a future implementation phase. Each item is **CSS/layout/readability only** unless noted.

### 4.1 `/login`

- [ ] Mobile: `.mvp-login-form-card` padding and field vertical rhythm (`--mvp-space-form-field`)
- [ ] `#login-credential` input font-size/line-height; preserve `type="password"` and `autocomplete="current-password"`
- [ ] Label → input → `#login-shell-hint` spacing; avoid collapsing help text against controls
- [ ] `.mvp-form-actions` buttons/links at `min-height: var(--mvp-tap-min)`; full-width stack on narrow viewports
- [ ] `#login-shell-message.mvp-login-shell-status` min-height/line-height for loading/success/failure readability
- [ ] Preserve `aria-describedby` wiring on form; do not add eligibility or vote copy
- [ ] **Must not change:** `POST /login/session`, credential proof handling, fail-closed behavior

### 4.2 `/registration`

- [ ] Mobile: consistent label/help spacing for `display_name`, `birth_year_month`, `residential_region`, `credential`
- [ ] `type="month"` and `<select>` tap height and readable option text on small screens
- [ ] `#registration-submit` and secondary CTAs tap targets; success panel `#registration-success` CTA spacing
- [ ] `#registration-form-message.mvp-registration-status` readable pending/failure area
- [ ] Preserve `data-login-state-read="disabled"` on site header
- [ ] **Must not change:** registration body fields (`display_name`, `birth_year_month`, `residential_region` only in JSON); `POST /registration` only; no `Set-Cookie`; no `GET /users/me`

### 4.3 `/profile`

- [ ] `#profile-unauthenticated` CTA block tap targets and vertical rhythm
- [ ] Signed-in `#profile-form` label/hint spacing for the two allowed fields only
- [ ] `#profile-submit` / `#profile-clear` action row mobile layout
- [ ] `#profile-form-message.mvp-profile-status` loading/save failure readability
- [ ] **Must not change:** `GET`/`PUT /users/me/profile` paths; field ceiling (`birth_year_month`, `residential_region`); no `/users/me` vote-state reads

### 4.4 `/polls/new`

- [ ] `#create-poll-form` title/description/option fieldset spacing and legend readability
- [ ] Option row labels (`.option-label`) line-height; textarea `min-height` on mobile
- [ ] `#create-poll-submit` and share/copy controls tap targets post-success
- [ ] `#form-message` and success/error panel spacing
- [ ] Demo-only fields (`.mvp-form-demo-fields`) remain visually distinct and non-authoritative
- [ ] **Must not change:** demo submit vs `?live=1` `POST /creator/polls` boundary; poll-definition-only live body

### 4.5 `/my-polls?live=1` (CTA / action areas only)

- [ ] Live empty/error panel CTA spacing (reuse `.mvp-empty-state`, `.mvp-error-panel` rhythm)
- [ ] Owned-list row action buttons (share / lifecycle) tap height in `.mvp-dash-table td:last-child`
- [ ] Sign-in required / creator-session-unavailable CTA blocks readable on mobile
- [ ] **Must not change:** `fetchCreatorOwnedPolls`, `prepareMyPollsLiveSession`, lifecycle `POST /creator/polls/:id/*` paths; no frontend ownership authority

---

## 5. Safe Future Polish Categories

### 5.1 Mobile input readability

- Font size ≥ `1rem` on inputs where safe; `line-height` and `overflow-wrap` on labels/help
- `touch-action: manipulation` preserved on interactive controls (Phase 161 pattern)
- Safe-area horizontal padding on form cards (reuse Phase 161/201 mobile gutter pattern)

### 5.2 Label / help / error text spacing

- Consistent `margin-top` on `.mvp-form label`, `.mvp-form-hint`, status regions
- Error/success hosts (`#login-shell-message`, `#registration-form-message`, `#profile-form-message`, `#form-message`) get readable `min-height` and line-height — **copy remains frontend-owned constants**; no backend echo

### 5.3 Button / touch target size

- Reinforce `--mvp-tap-min` (`2.75rem`) on `.mvp-form-actions .mvp-btn`, table action buttons, and form submits
- Mobile: full-width primary actions where Phase 161/201 already stack CTAs

### 5.4 Form section spacing

- `.mvp-form-card`, `fieldset`, `.mvp-form-actions` vertical rhythm via `--mvp-space-section` / `--mvp-space-card`
- Page intro (`.mvp-info-hero`, `.mvp-page-intro`) separation from first form card

### 5.5 Loading / success / failure state readability

- Status regions use existing `role="status"` / `aria-live="polite"` hosts; polish spacing/typography only
- Registration success panel (`#registration-success`) visual hierarchy without changing success copy semantics
- Reuse `PUBLIC_*_LOADING_MESSAGE` / `PUBLIC_*_LOAD_FAILURE_MESSAGE` where pages already import shared constants — **no new API error echo paths**

### 5.6 Keyboard / mobile-friendly layout

- Preserve `:focus-visible` rings (Phase 161); no `:focus` outline removal without replacement
- `.mvp-form-actions` flex-wrap for narrow viewports; avoid horizontal scroll on form cards
- `prefers-reduced-motion: reduce` respected for any new transitions

---

## 6. Privacy, Auth, API, and Schema Boundaries

Future polish must **not** add or weaken:

| Boundary | Requirement |
|----------|-------------|
| Registration | `POST /registration` only; **no auto-login**; **no Set-Cookie**; **no GET /users/me** on submit |
| Login | `POST /login/session` boundary unchanged; credential proof only |
| Profile API | `GET`/`PUT /users/me/profile` only; body fields **`birth_year_month`** and **`residential_region`** only |
| `/users/me` read | **`user_id`** and **`display_name`** only for login-state display |
| Creator session | `creator_session` local/demo boundary unchanged; no frontend sessionStorage ownership |
| Official Vote | vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged |
| Result visibility | Display-safe tiers unchanged on results surfaces |
| Reference Answer | No durable option storage; no cross-session memory |
| Raw Option Linkage Ban | No durable user-option linkage in forms, logs, metrics, analytics, APM, or error payloads |
| Eligibility copy | No pass/fail outcomes, age thresholds as guarantees, or vote-guarantee language in form polish |
| Observability | No new `console.*`, analytics, APM, or debug payloads on form submit handlers |

---

## 7. Explicit Non-Goals

Phase 203 does **not** implement or approve:

| Non-goal | Status |
|----------|--------|
| DB / schema / migration | **Out of scope** |
| API contract / payload changes | **Out of scope** |
| Auth / session / `UserAuthResolver` changes | **Out of scope** |
| Registration auto-login or cookie issuance | **Forbidden** |
| New profile fields beyond `birth_year_month` / `residential_region` | **Forbidden** |
| Vote transaction / eligibility evaluator changes | **Out of scope** |
| Result visibility / result evaluator changes | **Out of scope** |
| Reference Answer integration changes | **Out of scope** |
| Creator ownership / lifecycle API behavior changes | **Out of scope** |
| Ranking / recommendation / personalization | **Out of scope** |
| `quality_badge` behavior or label expansion | **Out of scope** |
| Option/user/session/device/request/log/trace/metric/error linkage | **Forbidden** |
| `design-drafts/` commits | **Excluded** |

**Plan/docs only.** No `src/`, `migrations/`, or `public/frontend/*.js` runtime change in Phase 203.

---

## 8. Suggested Guard Tests for Future Implementation Phase

When a future runtime phase is approved, add focused tests similar to Phase 201/202 patterns:

| Test focus | Example assertions |
|------------|-------------------|
| CSS scope | Phase block in `public-mvp.css` scoped to `.login-page`, `.registration-page`, etc.; contains `--mvp-tap-min` / form spacing rules |
| HTML churn | Form shells gain page-class only; no script/import changes |
| Runtime untouched | `login-page.js`, `registration-page.js`, `profile-page.js`, `create-poll-page.js`, `my-polls-page.js` contain no phase marker and no new `fetch` paths |
| Registration boundary | `submitRegistrationRequest` still calls only `/registration` |
| Profile boundary | `loadUserProfile` / `saveUserProfile` still target `/users/me/profile` with two fields only |
| Login boundary | No `GET /users/me` added to login submit path |
| Vote boundary | `submitVoteByIndex` body remains `{ option_index }` only (regression guard) |
| Linkage / observability | Phase CSS and HTML contain no forbidden tokens; no `localStorage`/`sessionStorage`/cookie |
| Backend untouched | `src/`, migrations lack phase marker |

Suggested filenames (future, not Phase 203):

- `tests/frontend/phase-204-public-mvp-form-accessibility-touch-target-polish.test.ts`
- `tests/docs/phase-204-public-mvp-form-accessibility-touch-target-polish-doc.test.ts`
- `tests/frontend/phase-205-public-mvp-form-accessibility-touch-target-runtime-review-checkpoint.test.ts` (review checkpoint after runtime)

---

## 9. Suggested Future Phase Sequence (Not Approved Here)

1. **Phase 203-R (review checkpoint)** — review this plan against Phase 195–202 governance; approve a minimal runtime slice (e.g. login + registration forms first).
2. **Phase 204 (runtime)** — implement only the approved slice with focused guard tests; CSS-first, minimal HTML class wrappers.
3. **Phase 205 (review checkpoint)** — confirm no auth/profile/creator/vote boundary drift.

Each runtime slice must remain accessibility/CSS/layout only unless a separate governance phase explicitly approves more.

---

## 10. Guard Tests Added (Phase 203)

| Test file | Role |
|-----------|------|
| `tests/docs/phase-203-public-mvp-form-accessibility-touch-target-polish-plan-doc.test.ts` | Doc + README index guard |

---

## 11. Validation Checklist

Phase 203 (plan delivery):

```bash
git diff --check
npm run typecheck
npm test
npm run build
```

Focused test:

- `tests/docs/phase-203-public-mvp-form-accessibility-touch-target-polish-plan-doc.test.ts`

Future runtime phase (when approved) should additionally run:

```bash
npm run smoke:public:local
```

`design-drafts/` remains outside the committed delivery scope.

---

## 12. Privacy and Integrity Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 203 is planning documentation and doc guards only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes. Raw Option Linkage Ban preserved.
