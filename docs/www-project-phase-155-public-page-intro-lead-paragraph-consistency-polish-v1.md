# WWW Project Phase 155 — Public Page Intro / Lead Paragraph Consistency Polish v1

**Status:** frontend UX polish — unified public page intro copy, lead paragraphs, and section leads via centralized copy constants, mount-time sync helpers, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 154 public section title / panel heading runtime review checkpoint.

**Prior checkpoint:** [Phase 154 public section title / panel heading runtime review checkpoint](./www-project-phase-154-public-section-title-panel-heading-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 155 polishes public page intro copy, lead paragraphs, and section leads across homepage, explore, results, my-polls, create poll, vote, login, registration, profile, creator flow, lifecycle controls, and demo/static preview surfaces. It continues Phase 135–154 public UX consistency boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined intro / lead copy via `PUBLIC_PAGE_LEAD_PARAGRAPHS`, `PUBLIC_PAGE_LEADS`, and `PUBLIC_PAGE_INTRO_TEXTS`.
2. Re-export shared `PUBLIC_*` lead constants from surface page modules and sync static HTML shells on mount.
3. Keep intro / lead copy neutral — no vote counts, eligibility outcomes, internal ids, tokens, or backend payload echo.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_PAGE_LEAD_PARAGRAPHS`, `PUBLIC_PAGE_LEADS`, `PUBLIC_PAGE_INTRO_TEXTS`, shared `PUBLIC_*` page lead constants.
- `public/index.html`, `public/explore.html`, `public/results.html`, `public/my-polls.html`, `public/create-poll.html`, `public/vote.html`, `public/login.html`, `public/registration.html`, `public/profile.html` — static shells aligned with shared constants.
- `public/frontend/public-mvp-home.js` — `syncHomePageLeadParagraphs`.
- `public/frontend/explore-page.js` — `syncExplorePageLeadParagraphs`.
- `public/frontend/login-page.js` — `syncLoginPageLeadParagraphs`.
- `public/frontend/registration-page.js` — `syncRegistrationPageLeadParagraphs`.
- `public/frontend/profile-page.js` — `syncProfilePageLeadParagraphs`.
- `public/frontend/create-poll-page.js` — `syncCreatePollPageLeadParagraphs`.
- `public/frontend/vote-page.js` — `syncVotePageLeadParagraphs`.
- `public/frontend/my-polls-page.js` — `syncMyPollsPageLeadParagraphs`.
- `public/frontend/result-page.js` — `syncResultsPageLeadParagraphs`; `renderResultsReadOnlyIntro` continues using `PUBLIC_RESULTS_INTRO_*` hints.
- Creator flow / lifecycle leads remain on existing `PUBLIC_CREATOR_*_LEAD_HINT` constants (included in `PUBLIC_PAGE_INTRO_TEXTS`).
- Focused frontend + doc tests.
- README Phase 155 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- New profile fields or registration payload fields.
- Official Vote transaction order, vote-by-index eligibility-before-resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.
- Full migration of `policy-ui-placeholders.js` / `HELP_COPY` tooltip bodies.
- Dynamic poll titles or descriptions from API payloads on vote page (`#poll-title`, `#poll-description` remain API-driven).

---

## 3. Intro / lead copy rules

### 3.1 Must

- Use frontend-owned copy from `PUBLIC_PAGE_LEAD_PARAGRAPHS`, `PUBLIC_PAGE_LEADS`, `PUBLIC_PAGE_INTRO_TEXTS`, or surface re-exports.
- Mount-time sync writes shared constants into static HTML shells without reading backend payloads.
- Results readonly intro (`renderResultsReadOnlyIntro`) uses `PUBLIC_RESULTS_INTRO_*` constants only.

### 3.2 Must not

- Echo raw backend payloads, API `message`, internal error codes, or stack traces in intro / lead copy.
- Show `user_id`, session id, creator token, vote token, counter shard, or internal identifiers in intro / lead copy.
- Add profile fields beyond `birth_year_month` and `residential_region`.
- Create durable user-option linkage in intro handlers.

---

## 4. Surface summary

| Surface | Centralized copy | Sync helper |
|---------|------------------|-------------|
| `/` | hero lead | `syncHomePageLeadParagraphs` |
| `/explore` | explore page lead | `syncExplorePageLeadParagraphs` |
| `/results/:id` | demo intro lead; runtime intro via `PUBLIC_RESULTS_INTRO_*` | `syncResultsPageLeadParagraphs` |
| `/my-polls` | page lead | `syncMyPollsPageLeadParagraphs` |
| `/polls/new` | page lead | `syncCreatePollPageLeadParagraphs` |
| `/vote/:id` | reminder lead; poll title/description API-driven | `syncVotePageLeadParagraphs` |
| `/login` | primary / secondary leads | `syncLoginPageLeadParagraphs` |
| `/registration` | primary / secondary leads | `syncRegistrationPageLeadParagraphs` |
| `/profile` | page lead | `syncProfilePageLeadParagraphs` |

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

- `tests/frontend/phase-155-public-page-intro-lead-paragraph-consistency-polish.test.ts`
- `tests/docs/phase-155-public-page-intro-lead-paragraph-consistency-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Page intro / lead paragraph polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
