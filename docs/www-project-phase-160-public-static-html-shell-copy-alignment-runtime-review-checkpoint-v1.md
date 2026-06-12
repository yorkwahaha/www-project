# WWW Project Phase 160 — Public Static HTML Shell Copy Alignment Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 159 public static HTML shell copy alignment (`login.html`, `registration.html`, `profile.html`, `my-polls.html`, `create-poll.html`, `vote.html`, `faq.html`, `trust-levels.html`, mount-time sync extensions in `login-page.js`, `registration-page.js`, `profile-page.js`, `my-polls-page.js`, `vote-page.js`, `result-page.js`, `/results/demo` brand/h1 via `PUBLIC_RESULTS_DEMO_READONLY_TITLE`, homepage sample-section / footer embedded-link non-sync policy, and `policy-ui-placeholders.js` / `HELP_COPY` layer separation).

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 159 public static HTML shell copy alignment polish (`320b426`).

**Prior delivery:** [Phase 159 public static HTML shell copy alignment polish](./www-project-phase-159-public-static-html-shell-copy-alignment-polish-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

**Related layer review:** [Phase 158 public microcopy / inline note runtime review checkpoint](./www-project-phase-158-public-microcopy-inline-note-runtime-review-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 160 reviews the Phase 159 frontend static HTML shell copy alignment to confirm:

1. Static HTML shell copy and mount-time sync copy remain frontend-owned; they do not echo backend payloads, foreign `error.message`, stack traces, or internal error codes.
2. Aligned shells (`login.html`, `registration.html`, `profile.html`, `my-polls.html`, `create-poll.html`, `vote.html`, `faq.html`, `trust-levels.html`) match centralized `PUBLIC_*` constants where Phase 159 intended alignment.
3. Sync extensions (`syncLoginFormFieldCopy`, `syncRegistrationSuccessCopy`, `syncProfilePageLeadParagraphs`, `syncMyPollsPageSectionHeadings`, `syncVotePageSectionHeadings`, `syncResultsPageSectionHeadings` / `syncResultsPageBrand`) write shared constants only; they do not read backend JSON or overwrite embedded-link paragraphs.
4. `/results/demo` brand and `#page-title` use `PUBLIC_RESULTS_DEMO_READONLY_TITLE` via path-aware `resolveResultsReadonlyTitle`; non-demo results paths keep `PUBLIC_RESULTS_PUBLIC_READONLY_TITLE`.
5. Homepage sample-section intro and footer embedded-link blocks remain intentionally outside `textContent` sync; wording already matches shared constants and links stay in static HTML without inconsistency risk.
6. `policy-ui-placeholders.js` / `HELP_COPY` remain a separate policy-panel layer; Phase 159 shell alignment does not absorb `HELP_COPY` into general public copy allowlists.
7. Shell copy does not show vote counts, percentages, result preview, voter state, or eligibility outcomes (except neutral product-policy wording such as “收集中不顯示票數”).
8. Shell copy does not reveal option existence or option-level linkage.
9. Shell copy does not show `user_id`, session id, creator token, vote token, counter shard, or internal identifiers.
10. Official Vote transaction order, vote-by-index eligibility-before-option-resolve, and option index → `option_id` pre-resolve boundaries remain unchanged.
11. Registration boundary remains off session establishment (no auto-login, Set-Cookie, or `GET /users/me`).
12. No API path, request body, credentials policy, auth boundary, vote path, result visibility, or linkage regression was introduced by the shell alignment polish.

---

## 2. Phase 159 Delivery Under Review

| Surface | Phase 159 alignment | Review focus |
|---------|---------------------|--------------|
| `public/login.html` | `#login-form-ready-hint` ← `PUBLIC_LOGIN_FORM_READY_HINT` | `syncLoginFormFieldCopy` constant-only |
| `public/registration.html` | `#registration-success-message` ← `PUBLIC_REGISTRATION_SUCCESS_MESSAGE` | `syncRegistrationSuccessCopy`; no session on success |
| `public/profile.html` | `#profile-unauth-message` ← `PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE` | `syncProfilePageLeadParagraphs`; embedded auth CTAs preserved |
| `public/my-polls.html` | demo locked-row inline note; `#my-polls-creator-side-note` | `syncMyPollsPageSectionHeadings`; side note only |
| `public/create-poll.html` | policy list「期中結果」wording | static shell only; policy `<ul>` with links not synced |
| `public/vote.html` | `#vote-collecting-notice-body` + policy headings | `syncVotePageSectionHeadings`; policy `<ul>` with links not synced |
| `public/results.html` | demo path brand / h1 | `resolveResultsReadonlyTitle` + `syncResultsPageBrand` |
| `public/faq.html` | summary card heading | static shell; `PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING` |
| `public/trust-levels.html` | forbidden-features list wording | static shell; `PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY` phrasing |
| `public/index.html` | (prior phases) value grid / trust row synced | sample-section / footer links intentionally not synced |

---

## 3. Current Stable Shell Copy / Sync Flow

```text
PUBLIC_* constants (public-mvp-ui.js)
  → static HTML shells carry matching initial copy
  → mount-time sync helpers overwrite targeted nodes from constants only

/login
  → syncLoginFormFieldCopy → #login-form-ready-hint ← PUBLIC_LOGIN_FORM_READY_HINT

/registration
  → syncRegistrationSuccessCopy → #registration-success-message ← PUBLIC_REGISTRATION_SUCCESS_MESSAGE

/profile
  → syncProfilePageLeadParagraphs → #profile-unauth-message ← PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE

/my-polls
  → syncMyPollsPageSectionHeadings → #my-polls-creator-side-note ← PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY

/vote/:id
  → syncVotePageSectionHeadings → policy/collecting headings + #vote-collecting-notice-body
  → policy <ul> with /trust-levels and /faq links stays in static HTML (not textContent-synced)

/polls/new
  → syncCreatePollPageLeadParagraphs → #create-poll-page-lead only
  → policy <ul> with embedded links stays in static HTML

/results/demo
  → syncResultsPageSectionHeadings → resolveResultsReadonlyTitle('/results/demo')
    → PUBLIC_RESULTS_DEMO_READONLY_TITLE on #page-title and #main-content > p.mvp-brand

/faq, /trust-levels
  → static shells only; no Phase 159 mount sync module

/
  → syncHomePageSectionHeadings / syncHomePageLeadParagraphs / syncHomePageSupportingNotes / syncHomePageMicrocopy
  → sample-section meta paragraph (.mvp-section-title + following .mvp-meta) and footer .note with <a> links NOT synced

policy-ui-placeholders.js / HELP_COPY (separate layer)
  → tooltip bodies in policy panels; not in PUBLIC_* shell alignment allowlists
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 160 found **no privacy, auth, result visibility, eligibility, vote transaction, API contract, or linkage gap** in the Phase 159 public static HTML shell copy alignment requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

### 4.1 Shell / sync copy is frontend-owned only

- Aligned HTML shells and sync helpers use fixed `PUBLIC_*` strings.
- Mount-time sync helpers write constants into targeted element ids / headings; they do not read backend JSON, API `message`, `errorCode`, stack traces, or foreign `error.message` for user-visible shell copy.

### 4.2 Per-surface shell alignment is safe

- **Login:** `#login-form-ready-hint` matches `PUBLIC_LOGIN_FORM_READY_HINT` in shell and `syncLoginFormFieldCopy`.
- **Registration:** `#registration-success-message` matches `PUBLIC_REGISTRATION_SUCCESS_MESSAGE`; success path still guides to login without session.
- **Profile:** `#profile-unauth-message` matches `PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE`; adjacent `/login` and `/registration` anchor elements are not overwritten by sync.
- **My-polls:** demo locked-row inline note and `#my-polls-creator-side-note` match shared constants; sync targets side note id only.
- **Create-poll:** page lead and static policy list「期中結果」wording aligned; embedded `/trust-levels` and `/faq` links remain in HTML.
- **Vote:** `#vote-collecting-notice-body` matches `PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY`; policy list items with embedded links are outside sync selectors.
- **FAQ / trust-levels:** summary headings and forbidden-features wording aligned in static HTML only.

### 4.3 `/results/demo` brand / h1 uses `PUBLIC_RESULTS_DEMO_READONLY_TITLE` safely

- `resolveResultsReadonlyTitle` returns `PUBLIC_RESULTS_DEMO_READONLY_TITLE` only when `isDemoPollRouteId` matches `/results/demo`.
- `syncResultsPageSectionHeadings` sets `#page-title` and `syncResultsPageBrand` sets `#main-content > p.mvp-brand` from the resolved readonly title constant.
- Non-demo results paths continue to use `PUBLIC_RESULTS_PUBLIC_READONLY_TITLE`.
- Demo title is fixed frontend copy; it does not echo backend poll payload or aggregate preview.

### 4.4 Homepage sample section / footer embedded links are intentionally not synced

- `public-mvp-home.js` sync helpers target `#home-heading`, `.mvp-section-title` (heading text only), value-card `h3`/`p`, `.mvp-trust-row li`, and `.mvp-help-tip`.
- They do **not** call `textContent` on:
  - `.mvp-preview-links` paragraphs (faq / trust-levels / profile links),
  - the sample-section meta paragraph with `<a href="/explore">` (follows `.mvp-section-title` but is a separate element),
  - the footer `.note` paragraph with `/results/demo` and `/faq` links.
- Static HTML wording for those blocks already matches centralized constants semantically; preserving `<a href>` markup avoids link loss and does not introduce copy drift because sync does not touch those nodes.

### 4.5 Embedded-link blocks are not overwritten by textContent sync

- Reviewed sync modules (`public-mvp-home.js`, `vote-page.js`, `create-poll-page.js`, `profile-page.js`) do not select parent paragraphs or list items that contain embedded anchors for wholesale `textContent` replacement.
- Phase 159 extensions added id-scoped or heading-scoped sync only.

### 4.6 `policy-ui-placeholders.js` / `HELP_COPY` remain a separate layer

- `HELP_COPY` lives in `public-mvp-layout.js`; `policy-ui-placeholders.js` imports it for policy-panel tooltip bodies.
- `public-mvp-ui.js` has no `HELP_COPY` import; `PUBLIC_PAGE_LEAD_PARAGRAPHS` and related public copy allowlists do not include `HELP_COPY` bodies.
- Shell alignment in Phase 159 did not merge policy tooltip bodies into general public copy allowlists.

### 4.7 Registration boundary unchanged

- Phase 159 did not alter registration flow.
- Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me` on success.
- Registration payload remains `display_name`, `birth_year_month`, `residential_region` only.

### 4.8 API path, body, and credentials policy unchanged

- Phase 159 touched static shell copy and mount-time sync only.
- No fetch path, request body shape, or `credentials` policy changes in reviewed surfaces.

### 4.9 Auth and profile boundaries unchanged

- `/users/me` remains `user_id` + `display_name` only in header auth read.
- `/users/me/profile` remains `birth_year_month` + `residential_region` only; null allowed.
- No new profile fields added.
- `creator_session` remains non-production identity; separate from formal voter session.
- `X-User-Id` remains explicit non-production compatibility only elsewhere; Phase 159 did not broaden its use.

### 4.10 Vote and Reference Answer boundaries unchanged

- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- Vote-by-index body remains `{ option_index }` only.
- No option index → `option_id` pre-resolve added.
- Reference Answer remains disconnected from UserAuthResolver and profile eligibility.

### 4.11 Raw Option Linkage Ban preserved

- Phase 159 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

### 4.12 No new observability or analytics linkage

- No new logs, metrics, analytics, tracking, APM traces, precise location fields, extra profile fields, demographic breakdown, or ranking personalization introduced by Phase 159 shell alignment.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-160-public-static-html-shell-copy-alignment-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-160-public-static-html-shell-copy-alignment-runtime-review-checkpoint-doc.test.ts`

Phase 159 guard tests remain the delivery baseline:

- `tests/frontend/phase-159-public-static-html-shell-copy-alignment-polish.test.ts`
- `tests/docs/phase-159-public-static-html-shell-copy-alignment-polish-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

When Docker Desktop remains unavailable locally, `npm run smoke:public:local` may be skipped with the same rationale recorded in prior phase checkpoints; Phase 160 doc/tests do not depend on a successful local smoke run for checkpoint completeness.

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
