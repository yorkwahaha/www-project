# WWW Project Phase 158 — Public Microcopy / Inline Note Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 157 public microcopy / inline note / supporting note runtime (`PUBLIC_INLINE_NOTES`, `PUBLIC_MICROCOPY_MESSAGES`, `PUBLIC_SUPPORTING_NOTES`, shared `PUBLIC_*` microcopy constants, mount-time `syncHomePageSupportingNotes` / `syncHomePageMicrocopy` / `syncExplorePageMicrocopy`, my-polls demo inline notes / share feedback / aria labels, creator-flow-copy microcopy, poll-lifecycle-controls confirm copy / panel labels, results `PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL`, and `policy-ui-placeholders.js` / `HELP_COPY` layer separation) across `/`, `/explore`, `/results/:id`, `/my-polls`, creator flow, and lifecycle controls.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 157 public microcopy / inline note consistency polish (`dab90a4`).

**Prior delivery:** [Phase 157 public microcopy / inline note consistency polish](./www-project-phase-157-public-microcopy-inline-note-consistency-polish-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

**Related layer review:** [Phase 150 public help / hint text runtime review checkpoint](./www-project-phase-150-public-help-hint-text-runtime-review-checkpoint-v1.md) (`policy-ui-placeholders.js` / `HELP_COPY` separation).

---

## 1. Review Purpose

Phase 158 reviews the Phase 157 frontend microcopy / inline note runtime to confirm:

1. Microcopy, inline notes, and supporting notes are frontend-owned and fixed; they do not echo backend payloads, foreign `error.message`, stack traces, or internal error codes.
2. `PUBLIC_INLINE_NOTES`, `PUBLIC_MICROCOPY_MESSAGES`, and `PUBLIC_SUPPORTING_NOTES` enumerate only safe user-visible microcopy / inline / supporting copy.
3. `syncHomePageSupportingNotes`, `syncHomePageMicrocopy`, and `syncExplorePageMicrocopy` write shared constants into static HTML shells without reading backend JSON.
4. My-polls demo row inline notes, share feedback messages, and live-manage aria labels use shared `PUBLIC_*` constants only; aria labels do not embed poll ids, user ids, tokens, or API payload fields.
5. Creator-flow-copy microcopy (`PUBLIC_CREATOR_ACTION_GUIDE_*`, `PUBLIC_CREATOR_NEXT_STEPS_*`) uses fixed frontend strings; vote URL hint prefix is static copy plus public vote path only.
6. Poll-lifecycle-controls confirm copy (`PUBLIC_LIFECYCLE_*_CONFIRM_MESSAGE`) and action panel labels do not disclose lifecycle internal state names, creator tokens, vote tokens, or counter shards.
7. Results public notice label (`PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL`) is a fixed frontend string; it is not derived from backend notice payload fields in user-visible label text.
8. `policy-ui-placeholders.js` / `HELP_COPY` tooltip bodies remain a separate policy-panel layer; Phase 157 microcopy allowlists do not absorb or duplicate `HELP_COPY` bodies.
9. Microcopy does not show vote counts, percentages, result preview, voter state, or eligibility state (except neutral product-policy wording such as “收集中不顯示票數”).
10. Microcopy does not reveal option existence or option-level linkage.
11. Official Vote transaction order, vote-by-index eligibility-before-option-resolve, and option index → `option_id` pre-resolve boundaries remain unchanged.
12. Registration boundary remains off session establishment (no auto-login, Set-Cookie, or `GET /users/me`).
13. No API path, request body, credentials policy, auth boundary, vote path, result visibility, or linkage regression was introduced by the microcopy polish.

---

## 2. Phase 157 Delivery Under Review

| Area | Phase 157 runtime change | Review focus |
|------|--------------------------|--------------|
| `public-mvp-ui.js` | `PUBLIC_INLINE_NOTES`, `PUBLIC_MICROCOPY_MESSAGES`, `PUBLIC_SUPPORTING_NOTES`, shared `PUBLIC_*` microcopy constants | allowlist-only microcopy |
| `public-mvp-home.js` | `syncHomePageSupportingNotes`, `syncHomePageMicrocopy` | homepage supporting notes + trust/tooltip sync safety |
| `explore-page.js` | `syncExplorePageMicrocopy`, `EXPLORE_LOAD_MORE_LABEL` re-export | explore load-more label sync |
| `my-polls-page.js` | demo inline notes, share feedback, live-manage aria labels | no internal id in aria / feedback copy |
| `creator-flow-copy.js` | creator action guide / next-steps microcopy labels | fixed aria labels and titles |
| `poll-lifecycle-controls.js` | lifecycle confirm microcopy, action panel labels | confirm copy without token / internal state leak |
| `result-page.js` | `PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL` | fixed public notice label only |
| Static HTML shells | `public/index.html`, `public/explore.html` | supporting notes / microcopy alignment |

---

## 3. Current Stable Public Microcopy / Inline Note Flow

```text
PUBLIC_INLINE_NOTES / PUBLIC_MICROCOPY_MESSAGES / PUBLIC_SUPPORTING_NOTES
  → enumerates frontend-owned microcopy / inline / supporting copy
  → surface constants re-export shared PUBLIC_* values

/
  → public-mvp-home.js syncHomePageSupportingNotes
    → .mvp-value-grid value card bodies ← PUBLIC_HOME_VALUE_*_BODY
  → syncHomePageMicrocopy
    → .mvp-trust-row items + .mvp-help-tip ← PUBLIC_HOME_TRUST_* / PUBLIC_HOME_COLLECTING_CARD_TOOLTIP

/explore
  → syncExplorePageMicrocopy → #explore-load-more ← PUBLIC_EXPLORE_LOAD_MORE_LABEL

/my-polls
  → demo row inline notes ← PUBLIC_MY_POLLS_*_ROW_INLINE_NOTE
  → share feedback ← PUBLIC_MY_POLLS_*_SHARE_* / PUBLIC_MY_POLLS_VOTE_LINK_*
  → live manage host aria-label ← PUBLIC_MY_POLLS_LIVE_MANAGE_*_ARIA_LABEL

creator flow
  → creator-flow-copy.js aria-label / titles ← PUBLIC_CREATOR_ACTION_GUIDE_* / PUBLIC_CREATOR_NEXT_STEPS_*
  → vote URL hint: PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX + public vote path (not in aria-label)

lifecycle controls
  → confirmLifecycleTransition → PUBLIC_LIFECYCLE_*_CONFIRM_MESSAGE
  → action panel aria-label / title ← PUBLIC_LIFECYCLE_ACTION_PANEL_*

/results/:id
  → appendText public notice label ← PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL (fixed)

policy-ui-placeholders.js / HELP_COPY (separate layer)
  → tooltip bodies in policy panels; not listed in PUBLIC_MICROCOPY_MESSAGES allowlists
```

---

## 4. Runtime Review Checkpoint Conclusion

Phase 158 found **no privacy, auth, result visibility, eligibility, vote transaction, API contract, or linkage gap** in the Phase 157 public microcopy / inline note runtime requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

### 4.1 Microcopy / inline / supporting copy is frontend-owned only

- `PUBLIC_INLINE_NOTES`, `PUBLIC_MICROCOPY_MESSAGES`, and `PUBLIC_SUPPORTING_NOTES` enumerate safe user-visible strings.
- Surface-specific constants re-export shared `PUBLIC_*` frontend-owned values.
- Mount-time sync helpers write fixed constants into DOM shells; they do not read backend JSON, API `message`, `errorCode`, stack traces, or foreign `error.message` for user-visible microcopy.

### 4.2 Homepage sync helpers are boundary-safe

- `syncHomePageSupportingNotes` writes `PUBLIC_HOME_VALUE_*_BODY` into value-card paragraphs only.
- `syncHomePageMicrocopy` writes trust-row items and collecting tooltip from shared constants.
- `public-mvp-home.js` performs no fetch, auth reads, vote/result API access, or observability hooks for microcopy sync.

### 4.3 Explore load-more microcopy is safe

- `syncExplorePageMicrocopy` sets `#explore-load-more` text from `PUBLIC_EXPLORE_LOAD_MORE_LABEL`.
- `EXPLORE_LOAD_MORE_LABEL` re-exports the same shared constant.

### 4.4 My-polls demo inline notes and share feedback are safe

- Locked / cancelled / unpublished demo row inline notes use `PUBLIC_MY_POLLS_*_ROW_INLINE_NOTE` constants listed in `PUBLIC_INLINE_NOTES`.
- Share success / failure and vote-link copy feedback use `PUBLIC_MY_POLLS_*` microcopy constants listed in `PUBLIC_MICROCOPY_MESSAGES`.
- Live-manage host and help aria labels use `PUBLIC_MY_POLLS_LIVE_MANAGE_ARIA_LABEL` and `PUBLIC_MY_POLLS_LIVE_MANAGE_HELP_ARIA_LABEL` only; they do not embed poll ids, user ids, or tokens.

### 4.5 Creator flow microcopy aria labels are safe

- `renderCreatorActionGuide` sets `aria-label` from `PUBLIC_CREATOR_ACTION_GUIDE_ARIA_LABEL`.
- `renderCreatorNextSteps` sets `aria-label` from `PUBLIC_CREATOR_NEXT_STEPS_ARIA_LABEL`.
- Vote URL hint uses static prefix plus public vote path; path is user-facing navigation copy, not stored in aria labels.

### 4.6 Lifecycle confirm copy and panel labels avoid internal disclosure

- `LIFECYCLE_TRANSITION_COPY` confirm strings use `PUBLIC_LIFECYCLE_CANCEL_CONFIRM_MESSAGE`, `PUBLIC_LIFECYCLE_CLOSE_CONFIRM_MESSAGE`, and `PUBLIC_LIFECYCLE_UNPUBLISH_CONFIRM_MESSAGE`.
- Confirm copy describes user-visible outcomes only; it does not include lifecycle enum names, creator tokens, vote tokens, or shard identifiers.
- Action panel `aria-label` and title use `PUBLIC_LIFECYCLE_ACTION_PANEL_*` fixed strings.

### 4.7 Results public notice label is fixed copy

- `result-page.js` appends `PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL` (`修正公告`) as a static label element.
- Label text is not interpolated from backend notice JSON in the reviewed microcopy path.

### 4.8 `policy-ui-placeholders.js` / `HELP_COPY` remain a separate layer

- `HELP_COPY` lives in `public-mvp-layout.js`; `policy-ui-placeholders.js` imports it for policy-panel tooltip bodies.
- Phase 157 microcopy allowlists (`PUBLIC_MICROCOPY_MESSAGES`, etc.) do not include `HELP_COPY` bodies.
- `creator-flow-copy.js` imports `POLICY_UI_COPY` for policy panels; microcopy aria labels / titles come from `public-mvp-ui.js` `PUBLIC_CREATOR_*` constants.
- Full migration of policy tooltip bodies remains out of scope per Phase 157.

### 4.9 Registration boundary unchanged

- Phase 157 did not alter registration flow.
- Registration still does not auto-login, does not Set-Cookie, and does not read `/users/me` on success.
- Registration payload remains `display_name`, `birth_year_month`, `residential_region` only.

### 4.10 API path, body, and credentials policy unchanged

- Phase 157 touched microcopy / inline note UX and copy only.
- No fetch path, request body shape, or `credentials` policy changes in reviewed surfaces.

### 4.11 Auth and profile boundaries unchanged

- `/users/me` remains `user_id` + `display_name` only in header auth read.
- `/users/me/profile` remains `birth_year_month` + `residential_region` only; null allowed.
- No new profile fields added.
- `creator_session` remains non-production identity; separate from formal voter session.
- `X-User-Id` remains explicit non-production compatibility only elsewhere; Phase 157 did not broaden its use.

### 4.12 Vote and Reference Answer boundaries unchanged

- Official Vote transaction order unchanged.
- Vote-by-index eligibility-before-option-resolve unchanged.
- Vote-by-index body remains `{ option_index }` only.
- No option index → `option_id` pre-resolve added.
- Reference Answer remains disconnected from UserAuthResolver and profile eligibility.

### 4.13 Raw Option Linkage Ban preserved

- Phase 157 added no durable user-option linkage, logs, metrics, analytics, APM traces, or error payload fields tying option choice to user/session/device/request identity.

### 4.14 No new observability or analytics linkage

- No new logs, metrics, analytics, tracking, APM traces, precise location fields, extra profile fields, demographic breakdown, or ranking personalization introduced by Phase 157 microcopy polish.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-158-public-microcopy-inline-note-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-158-public-microcopy-inline-note-runtime-review-checkpoint-doc.test.ts`

Phase 157 guard tests remain the delivery baseline:

- `tests/frontend/phase-157-public-microcopy-inline-note-consistency-polish.test.ts`
- `tests/docs/phase-157-public-microcopy-inline-note-consistency-polish-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

When Docker Desktop remains unavailable locally, `npm run smoke:public:local` may be skipped with the same rationale recorded in prior phase checkpoints; Phase 158 doc/tests do not depend on a successful local smoke run for checkpoint completeness.

---

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
