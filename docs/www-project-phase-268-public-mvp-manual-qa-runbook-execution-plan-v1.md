# WWW Project Phase 268 — Public MVP Manual QA Runbook / Execution Plan v1

**Status:** plan only — docs + guard tests + README index. Defines operator-facing manual QA runbook, execution checklist, and QA result recording format for Public MVP without implementing any runtime, HTML, CSS, JS, API, DB, schema, migration, auth, vote, result, creator, profile, or privacy behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This plan supports manual QA / freeze candidate execution. It is not launch approval and not production approval.**

**Baseline:** `origin/master` after Phase 267 public MVP launch readiness runtime review / final checkpoint (`0087eee`).

**Prior checkpoint:** [Phase 267 public MVP launch readiness runtime review / final checkpoint](./www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md).

**Related readiness context:**

- [Phase 266 public MVP launch readiness checklist checkpoint](./www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md) — operator checklist inventory
- [Phase 265 public MVP launch readiness checklist plan](./www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md) — original readiness inventory

---

**Release docs arc navigation (Phase 284):** **manual QA arc** (entry) — ← [Phase 267](./www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md) · **Phase 268** · [Phase 269](./www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md) → · ← [readiness arc exit](./www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md)

**Authoritative current release status (Phase 284):** manual release preparation approved per Phase 273; operator release execution authorized; Actual deployment NOT EXECUTED; no deploy scripts added; no production configuration changed. Historical phase baselines do not imply deployment or production configuration change. See [Phase 280 final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) and [Phase 284 implementation](./www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md).

## 1. Plan Purpose

Phase 268 is **plan only**. It provides a **manual QA runbook and execution plan** so operators can execute browser-based QA against the Public MVP using consistent steps, expected outcomes, and result recording.

This plan answers:

1. Which manual QA flows operators should execute and in what order.
2. What each flow should verify without changing product behavior.
3. How to record QA outcomes using a fixed result vocabulary.
4. Which privacy, vote, result, auth, creator, and `quality_badge` boundaries QA must not regress.
5. What to do when QA finds a runtime bug (separate numbered phase — not silent fixes inside this plan).

**This plan does not approve launch. This plan does not approve production deployment.**

Operators may use this runbook during **manual QA / freeze candidate** work. Passing manual QA using this runbook is necessary preparation for any future launch decision — but is not itself launch or production approval.

---

## 2. Pre-QA Automated Gates

Run these before manual browser QA:

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

Optional when environment allows:

```bash
npm run test:integration:local
npm run demo:public:local
```

| Gate | Purpose |
|------|---------|
| `npm test` | guard coverage for vote/auth/copy/presentation boundaries |
| `npm run smoke:public:local` | HTTP flow sanity without browser |
| `npm run demo:public:local` | local demo server with seeded voters for vote-path QA |

Automated gates do **not** replace manual QA. They reduce the chance of starting browser QA on a broken baseline.

---

## 3. Manual QA Runbook

### 3.1 Home / navigation

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| H-1 | Open `/` on desktop width | Page loads; no JS fatal error | |
| H-2 | Verify header/nav links to explore, FAQ, trust-levels, registration, login | Links present and correct | |
| H-3 | Verify home account-flow note | Demo/profile guidance; no `creator_session` / `X-User-Id` user-visible tokens | |
| H-4 | Open `/` on ~375px mobile width | Layout readable; tap targets usable | |
| H-5 | Repeat H-1–H-4 with JS disabled or throttled (optional) | Static fallback readable on P0 shells | |

**Routes:** `/`

### 3.2 Registration → login → `/users/me` → logout

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| A-1 | Open `/registration`; submit valid registration | `POST /registration` only; success copy says no auto-login | |
| A-2 | Confirm no session cookie issued on registration | No `Set-Cookie` from registration response | |
| A-3 | Confirm registration does not call `GET /users/me` after success | Network tab shows no post-success `/users/me` | |
| A-4 | Open `/login`; log in with new account | `POST /login/session` issues session separately | |
| A-5 | Verify header shows `display_name` after login | Anonymous → logged-in chrome update | |
| A-6 | Call or observe `GET /users/me` after login | Response has `user_id` + `display_name` only | |
| A-7 | Log out | Session cleared; header returns anonymous | |
| A-8 | Verify `GET /users/me` after logout | Anonymous state again | |

**Routes:** `/registration`, `/login`, `/`

**Fixed boundaries under test:** registration no auto-login; no `Set-Cookie` on registration; no post-success `GET /users/me`; `/users/me` fields limited.

### 3.3 Profile setup / edit

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| P-1 | Log in; open `/profile` | Profile form loads | |
| P-2 | Save `birth_year_month` and `residential_region` | Only these profile fields editable/saved | |
| P-3 | Confirm `/users/me` still excludes profile fields | `/users/me` remains `user_id` + `display_name` only | |
| P-4 | Return to `/`; observe profile completion prompt if shown | Neutral hedging; non-blocking; no eligibility guarantee | |

**Routes:** `/profile`, `/`

**Fixed boundaries under test:** profile fields `birth_year_month` / `residential_region` only.

### 3.4 Explore / poll detail / vote demo

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| E-1 | Open `/explore` | Freshness-only feed copy; no hot/ranking/personalized claims | |
| E-2 | Open a poll detail or demo vote path | Options shown by index labels; no misleading ranking copy | |
| E-3 | On `/vote/:pollId` demo poll, inspect pre-submit UI | Pre-vote hints present; no eligibility pass/fail disclosure | |
| E-4 | Submit vote when eligible (demo or live with session) | Request body `{ option_index }` only in network tab | |
| E-5 | Attempt duplicate vote if applicable | Safe frontend error copy; no internal code echo | |

**Routes:** `/explore`, `/vote/:pollId`

**Fixed boundaries under test:** vote-by-index `{ option_index }` only; no pre-submit eligibility outcome disclosure.

### 3.5 Official Vote pre-vote UX (no eligibility disclosure)

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| V-1 | Open vote page while logged out | Anonymous → login guidance only | |
| V-2 | Open vote page logged in but profile incomplete | Neutral profile prompt; not「你符合資格」or「你不符合資格」 | |
| V-3 | Inspect vote page copy before submit | No guaranteed vote eligibility promise | |
| V-4 | Submit vote; inspect failure paths | Neutral messages; no backend evaluator code exposed | |

**Routes:** `/vote/:pollId`

**Fixed boundaries under test:** eligibility-before-option-resolve is backend authority; frontend must not disclose pass/fail pre-submit.

### 3.6 My-polls demo / live shell

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| C-1 | Open `/my-polls` without `?live=1` | Demo/mock dashboard copy | |
| C-2 | Open `/my-polls?live=1` with creator session | Owned polls list; lifecycle actions visible | |
| C-3 | Open `/polls/new` demo vs `?live=1` | Demo vs live create guidance consistent with FAQ | |
| C-4 | Exercise lifecycle confirm for cancel/close/unpublish (if safe test poll) | Destructive confirm separation; wording clear | |

**Routes:** `/my-polls`, `/polls/new`

**Fixed boundaries under test:** creator ownership/lifecycle API unchanged; demo/live mode boundaries clear.

### 3.7 Results visibility

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| R-1 | Open `/results/:pollId` for collecting poll | No counters, percentages, ranks, hidden aggregate | |
| R-2 | Open results for cancelled poll | Unavailable / no option breakdown | |
| R-3 | Open results for unpublished poll | Unavailable / no option breakdown | |
| R-4 | Open results for revealed/locked/post_lock poll | Display-safe aggregate only per tier rules | |
| R-5 | Inspect results API JSON in network tab | No shard internals, vote tokens, or raw counter exposure | |

**Routes:** `/results/:pollId`

**Fixed boundaries under test:** collecting/cancelled/unpublished hidden aggregate; result evaluator tiers unchanged.

### 3.8 FAQ / help / trust / static pages

| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| S-1 | Open `/faq` | Policy FAQ aligned; demo/live/profile hedging | |
| S-2 | Open `/trust-levels` | Trust policy summary; no live trust score UI | |
| S-3 | Spot-check static fallback on P0 shells before JS | No `優質題目`, `X-User-Id`, `creator_session`, misleading engineer copy | |
| S-4 | Verify `quality_badge` if visible on sample poll | `positive_feedback` →「回饋良好」only; null/missing silent | |

**Routes:** `/faq`, `/trust-levels`, static shells

**Fixed boundaries under test:** `quality_badge` presentation-only; no ranking/trust/governance misuse.

### 3.9 Accessibility smoke checks

Keyboard focus, Reduced motion, and copy/share feedback spot checks.
| Step | Action | Expected outcome | Result |
|------|--------|------------------|--------|
| X-1 | Keyboard-only tab through registration/login forms | Focus order logical; `:focus-visible` visible | |
| X-2 | Keyboard-only through share/copy row on vote or results page | Focusable fallback URL; no focus trap | |
| X-3 | Enable `prefers-reduced-motion: reduce` | Animations/transitions respect preference | |
| X-4 | Trigger share/copy success and failure | aria-live feedback; polite/assertive as designed | |
| X-5 | Screen-reader spot-check on one form + one status region | Labels and live regions sensible | |

**Areas:** keyboard focus, reduced motion, copy/share feedback

### 3.10 Privacy / integrity regression checklist

| Check | Expected | Result |
|-------|----------|--------|
| No `localStorage` / `sessionStorage` used for vote/reference memory | Pass | |
| No new analytics / metrics / APM / debug tracking in public pages | Pass | |
| No durable user-option linkage observable in UI/network/logs during QA | Pass | |
| Registration does not auto-login | Pass | |
| Vote submit uses `{ option_index }` only | Pass | |
| Results do not expose hidden aggregate in collecting/cancelled/unpublished | Pass | |
| `quality_badge` not used for ranking/recommendation/personalization/trust/score/governance | Pass | |
| No tooltip/debug/explanation/counts/score/rank added to `quality_badge` | Pass | |

**Fixed boundaries under test:** Raw Option Linkage Ban; Official Vote transaction order; `UserAuthResolver`; creator session/ownership/lifecycle API.

---

## 4. QA Result Recording Format

Use this vocabulary for every runbook step and checklist row:

| Result | Meaning | Follow-up |
|--------|---------|-----------|
| **PASS** | Observed behavior matches expected outcome | None |
| **FAIL** | Observed behavior diverges from expected outcome | Open separate numbered fix phase |
| **BLOCKED** | Step cannot be executed (environment, data, access) | Record blocker; retry when unblocked |
| **NEEDS FOLLOW-UP** | Ambiguous, cosmetic, or deferred judgment | Record notes; triage before launch decision |

### 4.1 QA session record template

```text
QA Session ID:
Date:
Operator:
Baseline commit:
Environment: (local demo / staging / other)
Browser(s):
Viewport(s):

Automated gates (pre-QA):
- git diff --check: PASS / FAIL
- npm test: PASS / FAIL
- npm run typecheck: PASS / FAIL
- npm run build: PASS / FAIL
- npm run migrate:check: PASS / FAIL
- npm run smoke:public:local: PASS / FAIL / SKIPPED

Section summary:
- 3.1 Home / navigation: PASS / FAIL / BLOCKED / NEEDS FOLLOW-UP
- 3.2 Registration → login → logout: ...
- 3.3 Profile setup / edit: ...
- 3.4 Explore / poll detail / vote demo: ...
- 3.5 Official Vote pre-vote UX: ...
- 3.6 My-polls demo / live: ...
- 3.7 Results visibility: ...
- 3.8 FAQ / help / trust / static: ...
- 3.9 Accessibility smoke: ...
- 3.10 Privacy / integrity: ...

FAIL items (require separate phase):
- [step id] summary → proposed fix phase:

BLOCKED items:
- [step id] summary → blocker:

NEEDS FOLLOW-UP items:
- [step id] summary → notes:

Overall session result: PASS / FAIL / BLOCKED / NEEDS FOLLOW-UP
Launch/production approval: NO (this runbook does not grant approval)
```

### 4.2 Result recording rules

- Record **PASS / FAIL / BLOCKED / NEEDS FOLLOW-UP** per step; do not invent new status labels.
- **FAIL** on privacy, vote, auth, or result-visibility boundaries is **stop-and-fix** — open a separate numbered phase.
- **NEEDS FOLLOW-UP** does not authorize launch; it defers judgment to a later triage.
- QA notes must not include durable user-option linkage (no logging selected `option_index` tied to operator identity in shared trackers).

---

## 5. Phase 268 Delivery (This Phase)

Phase 268 itself is **plan only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes**
- **no backend / auth / vote / result / creator / profile changes**

Added:

1. `docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md` (this document)
2. `tests/docs/phase-268-public-mvp-manual-qa-runbook-execution-plan-doc.test.ts`
3. `tests/frontend/phase-268-public-mvp-manual-qa-runbook-execution-plan.test.ts`
4. README Phase 268 index

`design-drafts/` excluded from commit.

---

## 6. Fixed Boundaries (Unchanged)

### 6.1 Raw Option Linkage Ban

Manual QA planning must not introduce durable or observability linkage of option choice to user, session, device, request, or traceable identifier.

### 6.2 vote-by-index

- Request body remains `{ option_index }` only.
- Official Vote transaction order: eligibility check → option resolve → vote token write → counter increment.
- eligibility-before-option-resolve unchanged.

### 6.3 Registration / `/users/me`

- Registration submits to `/registration` only; no auto-login; no `Set-Cookie`; registration does not call `GET /users/me` after success.
- `/users/me` returns only `user_id` and `display_name`.
- Profile fields remain `birth_year_month` / `residential_region` only.
- `UserAuthResolver` semantics unchanged.

### 6.4 Result visibility / lifecycle / result evaluator

- collecting / cancelled / unpublished do not display hidden aggregate.
- result visibility tiers and result display evaluator unchanged.
- creator session / ownership / lifecycle API unchanged.

### 6.5 `quality_badge`

- `positive_feedback` →「回饋良好」only.
- `null` / missing / unexpected → silent (no render).
- Not used for ranking, recommendation, personalization, trust, score, creator score, or governance.
- No tooltip, debug, explanation, counts, score, rank, or hidden aggregate.

### 6.6 Storage and observability ban

- No `localStorage` / `sessionStorage`.
- No analytics / metrics / APM / debug tracking.
- No option choice + user/session/device/request/log/trace/metric/error linkage.

---

## 7. Explicit Non-Goals

Phase 268 must **not**:

| Non-goal | Reason |
|----------|--------|
| Launch approval or production approval | Plan-only QA runbook |
| Runtime fixes for QA failures | Separate numbered phase required |
| API / DB / backend / migration changes | Plan-only phase |
| Auth / session / `UserAuthResolver` changes | Auth boundary |
| Vote transaction / eligibility evaluator changes | Vote integrity |
| Result visibility / result evaluator changes | Result integrity |
| Creator ownership / lifecycle API changes | Creator boundary |
| `localStorage` / `sessionStorage` / analytics / APM / debug tracking | Privacy ban |
| Option choice + user/session/device/request/log/trace/metric/error linkage | Raw Option Linkage Ban |
| `design-drafts/` commits | Out of repo delivery scope |

---

## 8. Focused Guard Tests

- `tests/frontend/phase-268-public-mvp-manual-qa-runbook-execution-plan.test.ts`
- `tests/docs/phase-268-public-mvp-manual-qa-runbook-execution-plan-doc.test.ts`

---

## 9. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

Phase 268 intentionally requires `npm run smoke:public:local` when environment supports it as a pre-QA baseline gate reference — no runtime behavior changed by this phase.

---

## 10. Conclusion

**Phase 268 is plan-only.** Manual QA runbook, execution checklist, and QA result recording format (`PASS` / `FAIL` / `BLOCKED` / `NEEDS FOLLOW-UP`) are established for Public MVP operator execution.

**Ready for manual QA / freeze candidate.** Operators may execute Section 3 using Section 4 recording rules after Section 2 automated gates pass.

**This is not launch approval. This is not production approval.**

**Runtime bugs require a separate numbered phase.** If manual QA records **FAIL** on behavior, privacy, vote, auth, or result-visibility boundaries, open an explicit fix phase — do not hide runtime changes inside QA documentation.

**Phase 269 blockers: none identified.**

---

## 11. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 268 is a docs/guards-only manual QA execution plan. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
