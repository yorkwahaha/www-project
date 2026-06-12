# WWW Project Phase 153 — Public Section Title / Panel Heading Consistency Polish v1

**Status:** frontend UX polish — unified public section titles, panel headings, card headings, and form section headings via centralized copy constants, mount-time sync helpers, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 152 public form field label / placeholder runtime review checkpoint.

**Prior checkpoint:** [Phase 152 public form field label / placeholder runtime review checkpoint](./www-project-phase-152-public-form-field-label-placeholder-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 153 polishes public section titles, panel headings, card headings, and form section headings across homepage, explore, results, my-polls, create poll, vote, login, registration, profile, creator flow, lifecycle controls, and demo/static preview surfaces. It continues Phase 135–152 public UX consistency boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined heading copy via `PUBLIC_SECTION_TITLES`, `PUBLIC_PANEL_HEADINGS`, `PUBLIC_CARD_HEADINGS`, and `PUBLIC_FORM_HEADINGS`.
2. Re-export shared `PUBLIC_*` heading constants from surface page modules and sync static HTML shells on mount.
3. Keep heading copy neutral — no vote counts, eligibility outcomes, internal ids, tokens, or backend payload echo in titles / headings.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_SECTION_TITLES`, `PUBLIC_PANEL_HEADINGS`, `PUBLIC_CARD_HEADINGS`, `PUBLIC_FORM_HEADINGS`, shared `PUBLIC_*` heading constants.
- `public/index.html`, `public/explore.html`, `public/results.html`, `public/my-polls.html`, `public/create-poll.html`, `public/vote.html`, `public/login.html`, `public/registration.html`, `public/profile.html` — static shells aligned with shared constants.
- `public/frontend/public-mvp-home.js` — `syncHomePageSectionHeadings`.
- `public/frontend/explore-page.js` — `syncExplorePageSectionHeadings`.
- `public/frontend/login-page.js` — `syncLoginPageSectionHeadings`.
- `public/frontend/registration-page.js` — `syncRegistrationPageSectionHeadings`.
- `public/frontend/profile-page.js` — `syncProfilePageSectionHeadings`.
- `public/frontend/create-poll-page.js` — `syncCreatePollPageSectionHeadings`.
- `public/frontend/vote-page.js` — `syncVotePageSectionHeadings`.
- `public/frontend/my-polls-page.js` — `syncMyPollsPageSectionHeadings`, live management panel heading.
- `public/frontend/result-page.js` — `syncResultsPageSectionHeadings`, results option list headings.
- Focused frontend + doc tests.
- README Phase 153 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- New profile fields or registration payload fields.
- Official Vote transaction order, vote-by-index eligibility-before-resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.
- Full migration of `policy-ui-placeholders.js` / `HELP_COPY` tooltip bodies (policy panels remain separate; key runtime headings centralized in `PUBLIC_*_HEADINGS` allowlists).
- Dynamic poll titles from API payloads (vote / results page h1 remains poll content, not static heading copy).

---

## 3. Heading copy rules

### 3.1 Must

- Use frontend-owned copy from `PUBLIC_SECTION_TITLES`, `PUBLIC_PANEL_HEADINGS`, `PUBLIC_CARD_HEADINGS`, `PUBLIC_FORM_HEADINGS`, or surface re-exports.
- Mount-time sync writes shared constants into static HTML shells without reading backend payloads.
- Results option list headings use `PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING` / `PUBLIC_RESULTS_POLL_OPTIONS_HEADING` (no vote counts in heading text).

### 3.2 Must not

- Echo raw backend payloads, API `message`, internal error codes, or stack traces in titles / headings.
- Show `user_id`, session id, creator token, vote token, counter shard, or internal identifiers in heading copy.
- Add profile fields beyond `birth_year_month` and `residential_region`.
- Create durable user-option linkage in heading handlers.

---

## 4. Surface summary

| Surface | Centralized copy | Sync helper |
|---------|------------------|-------------|
| `/` | home page title, sample section, value cards | `syncHomePageSectionHeadings` |
| `/explore` | explore page title | `syncExplorePageSectionHeadings` |
| `/results/:id` | readonly title, option list headings | `syncResultsPageSectionHeadings` |
| `/my-polls` | page title, quota panel, side card, live management | `syncMyPollsPageSectionHeadings` |
| `/polls/new` | page title, policy / precheck panels | `syncCreatePollPageSectionHeadings` |
| `/vote/:id` | vote policy / collecting / follow panels | `syncVotePageSectionHeadings` |
| `/login` | page title, auth state cards | `syncLoginPageSectionHeadings` |
| `/registration` | page title, success form heading | `syncRegistrationPageSectionHeadings` |
| `/profile` | page title, unauth form heading | `syncProfilePageSectionHeadings` |

---

## 5. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
npm run smoke:public:local   # when local environment allows
```

Focused tests:

- `tests/frontend/phase-153-public-section-title-panel-heading-consistency-polish.test.ts`
- `tests/docs/phase-153-public-section-title-panel-heading-consistency-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Section title / panel heading polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
