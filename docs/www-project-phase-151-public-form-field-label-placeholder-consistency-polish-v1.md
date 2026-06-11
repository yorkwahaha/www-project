# WWW Project Phase 151 — Public Form Field Label / Placeholder Consistency Polish v1

**Status:** frontend UX polish — unified public form field labels, placeholders, and field-level hints via centralized copy constants, mount-time sync helpers, focused guard tests, docs, and README index.

**No runtime API behavior, DB, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 150 public help / hint text runtime review checkpoint.

**Prior checkpoint:** [Phase 150 public help / hint text runtime review checkpoint](./www-project-phase-150-public-help-hint-text-runtime-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 151 polishes public form field labels, placeholders, and adjacent field hints across login, registration, profile, create poll / creator flow demo UI, and vote option legend. It continues Phase 135–150 public UX consistency boundaries without reopening backend contracts or privacy rules.

Goals:

1. Unify fixed, frontend-defined form copy via `PUBLIC_FORM_FIELD_LABELS`, `PUBLIC_FORM_PLACEHOLDERS`, and `PUBLIC_FORM_FIELD_HINTS`.
2. Re-export shared `PUBLIC_FORM_*` constants from surface page modules and sync static HTML shells on mount.
3. Keep form copy neutral — no vote counts, eligibility outcomes, internal ids, tokens, or backend payload echo in labels / placeholders / field hints.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — `PUBLIC_FORM_FIELD_LABELS`, `PUBLIC_FORM_PLACEHOLDERS`, `PUBLIC_FORM_FIELD_HINTS`, shared `PUBLIC_FORM_*` constants.
- `public/login.html`, `public/registration.html`, `public/profile.html`, `public/create-poll.html` — static form shells aligned with shared constants.
- `public/frontend/login-page.js` — `syncLoginFormFieldCopy`.
- `public/frontend/registration-page.js` — `syncRegistrationFormFieldCopy`.
- `public/frontend/profile-page.js` — `syncProfileFormFieldCopy`.
- `public/frontend/create-poll-page.js` — `syncCreatePollFormFieldCopy`.
- `public/frontend/vote-page.js` — `syncVoteFormFieldCopy` for vote option legend.
- Focused frontend + doc tests.
- README Phase 151 index.

### 2.2 Out of scope

- Backend, API contract, DB, migration, auth resolver.
- New profile fields or registration payload fields.
- Official Vote transaction order, vote-by-index eligibility-before-resolve.
- New logs, metrics, analytics, tracking, APM traces.
- `design-drafts/` commits.
- Full migration of disabled demo-only create-poll policy fieldsets beyond label / placeholder sync.

---

## 3. Form field copy rules

### 3.1 Must

- Use frontend-owned copy from `PUBLIC_FORM_*` constants or surface re-exports.
- Shared birth year / month and residential region labels match across registration and profile.
- Registration region select uses `PUBLIC_FORM_REGION_SELECT_PROMPT`; profile uses `PUBLIC_FORM_REGION_EMPTY_OPTION`.
- Mount-time sync writes shared constants into static HTML shells without reading backend payloads.

### 3.2 Must not

- Echo raw backend payloads, API `message`, internal error codes, or stack traces in labels / placeholders / field hints.
- Show `user_id`, session id, creator token, vote token, counter shard, or internal identifiers in form copy.
- Add profile fields beyond `birth_year_month` and `residential_region`.
- Create durable user-option linkage in form handlers.

---

## 4. Surface summary

| Surface | Centralized copy | Sync helper |
|---------|------------------|-------------|
| `/login` | credential label / placeholder / field hint | `syncLoginFormFieldCopy` |
| `/registration` | display name, birth, region, credential | `syncRegistrationFormFieldCopy` |
| `/profile` | birth, region labels / placeholders / hints | `syncProfileFormFieldCopy` |
| `/polls/new` | title, description, options, demo eligibility fields | `syncCreatePollFormFieldCopy` |
| `/vote/:id` | vote options fieldset legend | `syncVoteFormFieldCopy` |

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

- `tests/frontend/phase-151-public-form-field-label-placeholder-consistency-polish.test.ts`
- `tests/docs/phase-151-public-form-field-label-placeholder-consistency-polish-doc.test.ts`

---

## 6. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Form field label / placeholder polish does not introduce durable user-option linkage or pre-vote answer-direction signals. Raw Option Linkage Ban preservation.
