# WWW Project Phase 159 — Public Static HTML Shell Copy Alignment Polish v1

**Status:** frontend UX polish — aligns public static HTML shell copy with centralized `PUBLIC_*` constants and existing mount-time sync helpers; focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 158 public microcopy / inline note runtime review checkpoint.

**Prior checkpoint:** [Phase 158 public microcopy / inline note runtime review checkpoint](./www-project-phase-158-public-microcopy-inline-note-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 159 closes remaining drift between public static HTML shells and centralized frontend copy (`PUBLIC_*` constants). Where Phase 135–157 centralized runtime copy and mount-time sync helpers, some HTML shells still carried older wording, punctuation, or partial policy text. This phase aligns those shells with minimal HTML updates and small sync-helper extensions—without new large architecture.

Goals:

1. Align static HTML shell copy with existing `PUBLIC_*` constants where drift was found.
2. Extend mount-time sync helpers only where HTML shells need runtime overwrite on load.
3. Keep `policy-ui-placeholders.js` / `HELP_COPY` as a separate policy-panel layer (out of scope for full migration).

---

## 2. Scope

### 2.1 In scope

| Surface | Alignment |
|---------|-----------|
| `public/login.html` | `#login-form-ready-hint` ← `PUBLIC_LOGIN_FORM_READY_HINT` via `syncLoginFormFieldCopy` |
| `public/registration.html` | `#registration-success-message` ← `PUBLIC_REGISTRATION_SUCCESS_MESSAGE` via `syncRegistrationSuccessCopy` |
| `public/profile.html` | `#profile-unauth-message` ← `PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE` via `syncProfilePageLeadParagraphs` |
| `public/my-polls.html` | demo locked-row inline note; `#my-polls-creator-side-note` ← `PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY` |
| `public/create-poll.html` | policy list「期中結果」wording aligned with `PUBLIC_CREATE_POLL_PAGE_LEAD` |
| `public/vote.html` | collecting notice body + policy list aligned with `PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY` |
| `public/results.html` | demo path brand / h1 via path-aware `syncResultsPageSectionHeadings` + `syncResultsPageBrand` (`PUBLIC_RESULTS_DEMO_READONLY_TITLE`) |
| `public/faq.html` | summary card heading aligned with `PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING` |
| `public/trust-levels.html` | forbidden-features list aligned with `PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY` wording |

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- Full migration of `policy-ui-placeholders.js` / `HELP_COPY` tooltip bodies.
- Homepage sample-section / footer notes with embedded links (wording already matched constants; links preserved in HTML).
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.

---

## 3. Copy rules (unchanged)

- Static shell and sync copy remain frontend-owned; no backend payload echo.
- No vote counts, eligibility outcomes, internal ids, tokens, or option-level linkage in aligned copy.
- Registration boundary unchanged (no auto-login, Set-Cookie, or `GET /users/me`).

---

## 4. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused tests:

- `tests/frontend/phase-159-public-static-html-shell-copy-alignment-polish.test.ts`

---

## 5. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Shell alignment does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
