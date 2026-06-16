# WWW Project Phase 299 — Static HTML Fallback vs Runtime Copy Drift Review v1

**Status:** drift review / QA record only — docs + guard tests + README index. Audits static HTML shell fallback copy against `public-page-copy.js` `PUBLIC_*` constants, `public-mvp-ui.js` runtime/sync surfaces, and page `sync*` helpers — addressing Phase 296 **M-296-03** and Phase 292 **FU-292-02** / **BL-286-02** — without merging constants, modifying runtime, copy, CSS, layout, deploy scripts, or production configuration.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This review is not release execution, not deployment, and not formal launch.**

**Baseline commit:** `d236362` (`origin/master` after Phase 298 share/keyboard/reduced-motion regression review).

**Prior context:**

- [Phase 290 post-copy polish checkpoint](./www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md) — Phase 285–289 alignment guards
- [Phase 292 manual QA follow-up execution record](./www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md) — **FU-292-02** dual copy-source noted
- [Phase 291 backlog reprioritization checkpoint](./www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md) — **BL-286-02** no ad hoc constant merge
- [Phase 296 backlog planning checkpoint](./www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md) — **M-296-03** candidate
- [Phase 298 share/keyboard/reduced-motion regression review](./www-project-phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-v1.md) — **M-296-02 closed PASS**

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

---

## 1. Review Session Metadata

| Field | Value |
|-------|-------|
| Review ID | `phase-299-2026-06-16` |
| Date | 2026-06-16 |
| Operator | Agent-assisted drift audit (static HTML + `PUBLIC_*` constant comparison + existing Phase 290 guards + automated gates) |
| Baseline commit | `d236362` |
| Environment | Local `www_test` baseline via `npm run smoke:public:local` |
| Scope | Static HTML fallback vs runtime copy drift on primary public surfaces |
| Method | Mount-point ID audit; literal/substring alignment for Phase 285–289 focus strings; semantic parity for structured vote policy list; **no constant merge** |

**Launch approval:** NO  
**Production approval:** NO  
**Release execution:** NO  
**Deployment:** NO

---

## 2. Pre-Review Automated Gates

| Gate | Result | Notes |
|------|--------|-------|
| `git diff --check` | **PASS** | Clean before Phase 299 doc commit |
| `npm test` | **PASS** | Full vitest suite including Phase 290 / 298 guards |
| `npm run typecheck` | **PASS** | |
| `npm run build` | **PASS** | |
| `npm run migrate:check` | **PASS** | |
| `npm run smoke:public:local` | **PASS** | Full public HTTP flow on `www_test` |

---

## 3. Dual Copy Source Architecture (BL-286-02 — Unchanged)

Phase 299 **does not merge** `public-page-copy.js` and `public-mvp-ui.js`. The intentional dual-source layout remains:

| Source | Role | Examples |
|--------|------|----------|
| `public-page-copy.js` | Central `PUBLIC_*` page/onboarding/help/FAQ leads and policy prose | `PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY`, `PUBLIC_FAQ_PAGE_BANNER_BODY`, `PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY` |
| `public-mvp-ui.js` | Re-exports `PAGE_COPY` + owns state/empty/error/pre-vote messages | `PUBLIC_EXPLORE_EMPTY_*`, `PUBLIC_MY_POLLS_EMPTY_*`, `PUBLIC_REGISTRATION_SUCCESS_MESSAGE`, `PUBLIC_VOTE_PRE_VOTE_*` |
| `public/*.html` | No-JS static fallback at known mount IDs | `#explore-empty`, `#login-account-flow-card-body`, `#faq-page-banner`, etc. |
| Page `sync*` helpers | Bootstrap-time copy sync from constants → mount points | `syncExploreEmptyStatePanel`, `syncLoginAccountFlowCardCopy`, `syncFaqPageOnboardingCopy`, `syncVotePagePolicyPanelCopy` |

**BL-286-02 policy:** maintain dual sources with docs/guards; **do not** ad hoc merge constants into a single module. **Reaffirmed — no merge performed in Phase 299.**

---

## 4. Drift Review Focus Checks (Phase 285–289 + Boundaries)

Result vocabulary: **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

### 4.1 Phase 285 — `/explore` empty state

| Check | Static HTML | Runtime constant | Sync | Result |
|-------|-------------|------------------|------|--------|
| Empty message | `explore.html` `#explore-empty` p[0] | `PUBLIC_EXPLORE_EMPTY_MESSAGE` | `syncExploreEmptyStatePanel` | **PASS** |
| Empty summary | `explore.html` `#explore-empty` p[1] | `PUBLIC_EXPLORE_EMPTY_SUMMARY` | `syncExploreEmptyStatePanel` | **PASS** |
| CTA label/href | `建立問卷` → `/polls/new?live=1` | `PUBLIC_EXPLORE_EMPTY_CTA_LABEL` | `syncExploreEmptyStatePanel` | **PASS** |
| Page lead | `#explore-page-lead` | `PUBLIC_EXPLORE_PAGE_LEAD` (`public-page-copy.js`) | `syncExplorePageLeadParagraphs` | **PASS** |

### 4.2 Phase 287 — `/login` account-flow card

| Check | Static HTML | Runtime constant | Sync | Result |
|-------|-------------|------------------|------|--------|
| Card body | `#login-account-flow-card-body` | `PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY` | `syncLoginAccountFlowCardCopy` | **PASS** |
| No auto-login wording | contains `不會自動登入` | same | — | **PASS** |
| No browser session on registration | contains `也不會建立瀏覽器工作階段` | same | — | **PASS** |
| Header name after login | contains `頁首才會顯示帳號名稱` | same | — | **PASS** |

### 4.3 Phase 288 — `/my-polls` empty state

| Check | Static HTML | Runtime constant | Sync | Result | Notes |
|-------|-------------|------------------|------|--------|-------|
| Empty message | **no static shell** | `PUBLIC_MY_POLLS_EMPTY_MESSAGE` | runtime `renderPublicEmptyStatePanel` on live empty list | **PASS** | By design — live-only empty panel |
| Empty summary | **no static shell** | `PUBLIC_MY_POLLS_EMPTY_SUMMARY` | runtime only | **PASS** | Demo dashboard shell does not preload empty copy |
| CTA | runtime | `PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL` | live empty renderer | **PASS** | Unchanged from Phase 288 |

**Not a semantic drift defect** — my-polls empty is intentionally runtime-rendered for `?live=1` creator list only.

### 4.4 Phase 289 — `/faq` banner / vote step

| Check | Static HTML | Runtime constant | Sync | Result |
|-------|-------------|------------------|------|--------|
| Page banner | `#faq-page-banner` | `PUBLIC_FAQ_PAGE_BANNER_BODY` | `syncFaqPageOnboardingCopy` | **PASS** |
| Not-launched snippet | contains `本產品尚未正式對外上線` | same | — | **PASS** |
| Participant vote step | `#faq-participant-vote-step` | `PUBLIC_FAQ_PARTICIPANT_VOTE_STEP` | `syncFaqPageOnboardingCopy` | **PASS** |
| Neutral vote wording | contains `不代表一定可以完成投票` | same | — | **PASS** |
| Account-flow intro | `#faq-account-flow-intro` | `PUBLIC_FAQ_ACCOUNT_FLOW_INTRO` | `syncFaqPageOnboardingCopy` | **PASS** |
| Profile eligibility FAQ | `#faq-account-flow-profile-step` | `PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP` | `syncFaqPageOnboardingCopy` | **PASS** |

### 4.5 Registration — no auto-login / no browser session

| Check | Static HTML | Runtime constant | Sync | Result |
|-------|-------------|------------------|------|--------|
| Banner | `#registration-page-banner` | `PUBLIC_REGISTRATION_PAGE_BANNER_BODY` | `syncRegistrationPageBanner` | **PASS** |
| Lead primary | `#registration-lead-primary` | `PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY` | `syncRegistrationPageLeadParagraphs` | **PASS** |
| Success message | `#registration-success-message` | `PUBLIC_REGISTRATION_SUCCESS_MESSAGE` | `syncRegistrationSuccessCopy` | **PASS** |
| No auto-login copy | `不會自動登入` / `不會自動建立瀏覽器工作階段` | present in constants + HTML | — | **PASS** |
| No post-success `/users/me` | N/A (behavior) | `registration-page.js` posts `/registration` only | guard tests | **PASS** |

### 4.6 Profile — no eligibility promise

| Check | Static HTML | Runtime constant | Sync | Result |
|-------|-------------|------------------|------|--------|
| Page lead | `#profile-page-lead` | `PUBLIC_PROFILE_PAGE_LEAD` | `syncProfilePageLeadParagraphs` | **PASS** |
| Signed-in guidance | `#profile-signed-in-guidance` | `PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE` | `syncProfileSignedInGuidance` | **PASS** |
| No guarantee wording | `不表示可保證符合或不符合` | same in constants | — | **PASS** |

### 4.7 Vote — pre-vote hints neutral

| Check | Static HTML / runtime | Constant / module | Result | Notes |
|-------|----------------------|-------------------|--------|-------|
| Reminder lead | `#vote-page-reminder-lead` | `PUBLIC_VOTE_PAGE_REMINDER_LEAD` | **PASS** | Literal match |
| Collecting notice body | `#vote-collecting-notice-body` | `PUBLIC_VOTE_COLLECTING_NOTICE_BODY` | `syncVotePageSectionHeadings` | **PASS** | Static omits leading `收集中` (see OBS-299-04); runtime sync applies full constant |
| Policy hint list (static) | `#vote-policy-hint-list` li items | rebuilt by `syncVotePagePolicyPanelCopy` | **PASS** | Semantic parity — static includes inline `<a>` links; runtime rebuilds list with same prose + links |
| Official pre-vote hint mount | `#official-vote-pre-vote-hint` | `official-vote-pre-vote-hints.js` `PRE_VOTE_HINT_COPY` | **PASS** | Neutral hints; no eligibility pass/fail disclosure |
| Pre-vote constants | N/A | `PUBLIC_VOTE_PRE_VOTE_*` contain `不代表一定可以完成投票` / no pass-fail | **PASS** | |

### 4.8 Results — hidden aggregate

| Check | Static HTML | Runtime constant | Result |
|-------|-------------|------------------|--------|
| Demo intro lead | `#results-page-demo-intro` | `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` | **PASS** |
| Collecting hidden aggregate prose | contains `不顯示票數、百分比` | `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` family | **PASS** |
| Runtime collecting render | N/A | `result-page.js` `renderResultDisplay` — no numeric leak | **PASS** | Phase 290 guard |

**Focus section overall:** **PASS**

---

## 5. Structured HTML vs Literal-String Notes (Not Drift Defects)

| ID | Surface | Observation | Severity | Action |
|----|---------|-------------|----------|--------|
| OBS-299-01 | `/my-polls` empty | No static HTML empty-state fallback; runtime-only for live creator list | low | By design — documented |
| OBS-299-02 | `/vote` policy hint list | Static HTML embeds `<a href="/trust-levels">` / `<a href="/faq">`; runtime `syncVotePagePolicyPanelCopy` rebuilds equivalent DOM | low | Semantic parity confirmed — not literal-string drift |
| OBS-299-03 | Dual source split | Explore/my-polls empty constants live in `public-mvp-ui.js`; page leads in `public-page-copy.js` | low | **BL-286-02** intentional — no merge |
| OBS-299-04 | `/vote` collecting notice body | Static `#vote-collecting-notice-body` omits leading `收集中` (panel title provides context); runtime `syncVotePageSectionHeadings` applies full `PUBLIC_VOTE_COLLECTING_NOTICE_BODY` | low | Semantic parity — not a boundary defect |

**No FAIL or BLOCKED drift defects identified.**

---

## 6. `quality_badge` Boundary (Unchanged)

| Check | Result |
|-------|--------|
| `positive_feedback` →「回饋良好」only | **PASS** |
| null / missing / unexpected silent | **PASS** |
| Not used for ranking / recommendation / personalization | **PASS** |
| FAQ static mentions `回饋良好` presentation-only | **PASS** |

---

## 7. FU-292-02 / M-296-03 Resolution

| Field | Value |
|-------|-------|
| **FU-292-02** original item | Dual copy-source (`public-page-copy.js` + `public-mvp-ui.js` + static HTML) drift maintenance |
| **M-296-03** original item | Static HTML fallback vs runtime copy drift audit |
| Phase 299 action | Independent drift audit on Phase 285–289 focus surfaces + registration/profile/vote/results boundaries |
| Constant merge performed | **NO** |
| **BL-286-02** status | **MAINTAINED — dual source; no ad hoc merge** |
| **FU-292-02** status | **CLOSED — drift audit PASS; dual-source policy reaffirmed** |
| **M-296-03** status | **CLOSED — drift review PASS** |
| Defects requiring copy-alignment fix phase | **None identified** |

Ongoing maintenance: future copy changes must update **both** the owning constant module **and** the static HTML mount point (when applicable), plus page `sync*` tests — without merging modules.

---

## 8. Session Summary

| Metric | Value |
|--------|-------|
| Focus surfaces checked | 8 / 8 |
| Semantic drift defects | 0 |
| **FAIL** | 0 |
| **BLOCKED** | 0 |
| **NEEDS FOLLOW-UP** | 0 (defects); 3 observational notes only |
| Constant merge performed | **NO** |
| **Overall drift review result** | **PASS** |

---

## 9. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-299-static-html-fallback-vs-runtime-copy-drift-review-v1.md` | this document |
| `tests/docs/phase-299-static-html-fallback-vs-runtime-copy-drift-review-doc.test.ts` | doc tests |
| `tests/frontend/phase-299-static-html-fallback-vs-runtime-copy-drift-review.test.ts` | drift review guards |
| `README.md` | Phase 299 index |

Phase 299 is **drift review / docs-tests-README only**:

- **no runtime change**
- **no copy change**
- **no constant merge**
- **no CSS / layout change**
- **no migration**

**No `public/`, `src/`, or migration changes.**

`design-drafts/` excluded from commit.

---

## 10. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- `quality_badge`: presentation-only; not expanded
- **BL-286-02**: dual copy source maintained; **no merge**
- actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 11. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 12. Conclusion

**Static HTML fallback vs runtime copy drift review — overall PASS.**

Phase 299 closes **FU-292-02** and **M-296-03** with no semantic drift requiring a copy-alignment fix phase. **BL-286-02** dual-source maintenance policy is reaffirmed; **no constant merge** was performed or recommended.

**This phase does not execute release, deploy, or formal launch.**

**Phase 300 blockers: none identified.**

---

## 13. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 299 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
