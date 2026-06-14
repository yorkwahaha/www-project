# WWW Project Phase 215 — Explore / Vote / Results State Copy Minimal Runtime Patch v1

**Status:** frontend copy-only runtime patch — aligned Explore, Vote, and Results participation state messaging after Phase 214 plan and Phase 214-R review checkpoint.

**No API behavior, DB schema, migration, backend, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline:** `origin/master` after Phase 214-R public MVP state copy consistency plan review checkpoint (`37a7bb3`).

**Prior delivery:** [Phase 214-R public MVP state copy consistency plan review checkpoint](./www-project-phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint-v1.md).

---

## 1. Purpose

Phase 215 implements the **minimal approved slice** from Phase 214-R: Explore, Vote, and Results state copy only. Changes are limited to frontend-owned constants and safe static text wiring.

Goals:

1. Align Explore load-more failure copy with the `目前無法載入…，請稍後再試。` pattern.
2. Align Vote pre-vote hints (anonymous, profile-incomplete, profile-load-failed) with neutral, non-eligibility-disclosing wording consistent with profile completion prompt copy.
3. Split Results demo vs live intro helper copy so live result pages do not show demo-only「展示用，不儲存」wording.
4. Preserve result visibility tiers, vote transaction order, auth/profile boundaries, and `quality_badge` presentation.

---

## 2. Scope

### 2.1 In scope

- `public/frontend/public-mvp-ui.js` — participation state copy constants and allowlists.
- `public/frontend/official-vote-pre-vote-hints.js` — profile-load-failed hint wiring.
- `public/frontend/result-page.js` — demo vs live intro copy wiring in `syncResultsPageLeadParagraphs`.
- Focused frontend + doc tests.
- README Phase 215 index.

### 2.2 Out of scope

- Login, registration, profile, poll-creation, my-polls, homepage profile-completion prompt (deferred to later slices).
- Backend, API contract, DB, migration, auth resolver.
- Vote transaction, eligibility evaluation, result visibility tiers.
- `quality-feedback-badge.js` behavior changes.
- `design-drafts/` commits.

---

## 3. Copy changes

| Constant | Change |
|----------|--------|
| `PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE` | `目前無法載入更多問卷，請稍後再試。` |
| `PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT` | Neutral login guidance; no eligibility guarantee |
| `PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT` | Aligned with profile completion prompt; no pass/fail disclosure |
| `PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT` | New dedicated neutral copy for profile-load-failed state |
| `PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD` | New live-only intro; no demo「展示用，不儲存」wording |
| `syncResultsPageLeadParagraphs` | Selects demo vs live intro by `demoOnly` |

Unchanged: loading titles, primary load-failure messages, collecting/unavailable/readonly result shells, `resolvePublicErrorUserMessage` behavior, vote-by-index body, result visibility evaluator.

---

## 4. Boundaries preserved

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| Vote-by-index `{ option_index }` only | Unchanged |
| Result visibility tiers | Unchanged |
| Eligibility outcome disclosure in pre-vote hints | Forbidden — not added |
| Registration auto-login / Set-Cookie | Unchanged |
| Profile fields `birth_year_month` / `residential_region` only | Unchanged |
| `/users/me` `user_id` / `display_name` only | Unchanged |
| `quality_badge` presentation-only | Unchanged (`positive_feedback` → `回饋良好`) |

---

## 5. Guard tests

- `tests/frontend/phase-215-explore-vote-results-state-copy-runtime.test.ts`
- `tests/docs/phase-215-explore-vote-results-state-copy-runtime-doc.test.ts`

---

## 6. Validation

```bash
git diff --check
npm test -- --runInBand
npm run typecheck
npm run build
npm run migrate:check
```

---

## 7. Agent self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 215 is copy-only frontend delivery. No migration, schema DDL, runtime API, DB, or backend behavior changes. Raw Option Linkage Ban preserved.
