# WWW Project Phase 259 — Public Static HTML Shell Copy Alignment Plan v1

**Status:** plan only. Phase 259 inventories public HTML shell static fallback copy that remains misaligned after Phase 257 `public-page-copy.js` delivery, and defines safe future **minimal static HTML fallback copy alignment** boundaries without implementing any HTML, JS, CSS, runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, creator session, lifecycle, or Reference Answer behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 259.**

**Baseline:** `origin/master` after Phase 258 public help / FAQ copy runtime review checkpoint (`2655540`).

**Prior checkpoint:** [Phase 258 public help / FAQ copy runtime review checkpoint](./www-project-phase-258-public-help-faq-copy-runtime-review-checkpoint-v1.md).

**Prior delivery:** [Phase 257 public help / FAQ copy refinement](./www-project-phase-257-public-help-faq-copy-refinement-v1.md).

**Related copy context:**

- [Phase 256 public help / FAQ copy refinement plan](./www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md) — originally scoped static shell alignment; Phase 257 delivered runtime copy centralization and `faq.html` only
- [Phase 258 public help / FAQ copy runtime review checkpoint](./www-project-phase-258-public-help-faq-copy-runtime-review-checkpoint-v1.md) — confirmed other HTML shell fallbacks remain not fully aligned; runtime sync still overwrites at load

---

## 1. Plan Purpose

Phase 259 is **plan only**. After Phase 257 centralized refined `PUBLIC_*` strings in `public/frontend/public-page-copy.js` and aligned `public/faq.html`, most other `public/*.html` shells still carry pre–Phase 257 fallback text. JavaScript page modules overwrite many mount points at load, but **no-JS, slow-JS, and BFCache-before-sync** views still show stale shell copy.

This plan answers:

1. Which public HTML shells still carry outdated fallback copy.
2. Which shell text is overwritten by runtime sync vs remains static-only.
3. Which fallback strings diverge from Phase 257 `public-page-copy.js` / `PAGE_COPY.*` constants.
4. What explicit allowlist and constraints apply to a future **Phase 260** minimal static HTML shell fallback copy alignment phase.
5. What non-goals and guard tests apply before any HTML delivery.

Phase 259 does **not** approve implementation. Future static shell copy alignment requires a separately approved phase (**Phase 260** minimal static HTML shell fallback copy alignment).

---

## 2. Runtime Sync vs Static Fallback Model

```text
At page load (module top-level or bootstrap*):
  page-specific sync*OnboardingCopy(document) → textContent / replaceChildren on known ids
  entry points include:
    syncHomePageOnboardingCopy
    syncLoginPageOnboardingCopy
    syncVotePageOnboardingCopy
    syncResultsPageOnboardingCopy
    syncCreatePollPageOnboardingCopy
    syncMyPollsPageOnboardingCopy
    syncFaqPageOnboardingCopy (faq.html — Phase 257 aligned)

Static fallback in HTML:
  visible before JS executes; also visible if JS fails
  must match refined PUBLIC_* constants where a sync target exists

Static-only regions (no sync today):
  remain visible even after JS; highest priority for Phase 260 alignment
```

**Phase 257 note:** `public/faq.html` static fallback was aligned in Phase 257 and is **out of Phase 260 scope** unless a new regression is found.

---

## 3. Current Shell Inventory (Post–Phase 257)

Static inventory at Phase 259 baseline (`2655540`). Canonical refined strings live in `public/frontend/public-page-copy.js`, re-exported by `public/frontend/public-mvp-ui.js`.

### 3.1 `public/index.html` (`/`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Hero lead | `#home-hero-lead` | `syncHomePageLeadParagraphs` | `PUBLIC_HOME_HERO_LEAD` | **Yes** — fallback「統計結束後」vs refined「截止後」 |
| Trust row items | `.mvp-trust-row li` | `syncHomePageMicrocopy` | `PUBLIC_HOME_TRUST_*` | Likely aligned |
| Account flow note | `#home-account-flow-note` | `syncHomePageAccountFlowNote` | `PUBLIC_HOME_ACCOUNT_FLOW_*`, demo notes | **Partial** — fallback inline text differs; runtime rebuilds DOM (still injects `creator_session` / `X-User-Id` codes at runtime — **JS out of Phase 260 scope**) |
| Value card bodies | `.mvp-value-grid .mvp-value-card p` | `syncHomePageSupportingNotes` | `PUBLIC_HOME_VALUE_*` | **Yes** — quality card fallback still「優質題目看多種訊號…」vs `PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY`（「回饋良好」policy wording） |
| Collecting help tip | `.mvp-help-tip` | `syncHomePageMicrocopy` | `PUBLIC_HOME_COLLECTING_CARD_TOOLTIP` | Minor risk — fallback shorter; sync overwrites |
| Sample polls note | `#home-sample-polls-section-note` | `syncHomePageSamplePollsSectionNote` | `PUBLIC_HOME_SAMPLE_POLLS_SECTION_NOTE` | Likely aligned |
| Static example poll cards | `.mvp-card-grid[data-static-examples]` | **None** | N/A (demo labels) | **Static-only** — example poll titles/meta; not policy copy |
| Footer examples note | `#home-static-examples-footer-note` | `syncHomePageStaticExamplesFooterNote` | `PUBLIC_HOME_STATIC_EXAMPLES_FOOTER_NOTE` | Rebuilt at runtime |
| Demo nav switch | `.mvp-demo-nav-switch` | **None** | N/A | Static-only chrome |

### 3.2 `public/login.html` (`/login`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Banner | `#login-page-banner` | `syncLoginPageBanner` | `PUBLIC_LOGIN_PAGE_BANNER_BODY` | Likely aligned |
| Primary lead | `#login-lead-primary` | `syncLoginPageLeadParagraphs` | `PUBLIC_LOGIN_PAGE_LEAD_PRIMARY` | Likely aligned |
| Secondary lead | `#login-lead-secondary` | `syncLoginPageLeadParagraphs` | `PUBLIC_LOGIN_PAGE_LEAD_SECONDARY` | **Yes** — fallback still mentions `X-User-Id` / `creator_session`; refined constant does not |
| Auth state grid | `.mvp-auth-state-grid` cards | **None** | N/A | **Static-only** — engineer-facing「Production credential verifier」「Reference Answer Phase 70」; **high-risk**; Phase 260 may only rephrase to user-facing demo boundary if explicitly listed |
| Form ready hint | `#login-form-ready-hint` | `syncLoginFormFieldCopy` | `PUBLIC_LOGIN_FORM_READY_HINT` | **Yes** — fallback「production credential proof」vs refined「已核准的登入憑證」 |
| Crosslink / profile hints | `#login-registration-crosslink-hint`, `#login-profile-next-step-hint` | `syncLoginOnboardingNavigationHints` | `PUBLIC_LOGIN_FORM_REGISTRATION_CROSSLINK_*`, `PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT` | Likely aligned |
| Credential label / placeholder | `label[for=login-credential]`, `#login-credential` | `syncLoginFormFieldCopy` | `PUBLIC_FORM_*` | Fallback label still「Production credential proof」 |
| Shell field hint | `#login-shell-hint` | `syncLoginFormFieldCopy` | `PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT` | May differ from fallback |
| Phase doc footnote | `.mvp-preview-links`「Phase 73…」 | **None** | N/A | Static-only doc reference |

### 3.3 `public/registration.html` (`/registration`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Banner | `#registration-page-banner` | `syncRegistrationPageBanner` | `PUBLIC_REGISTRATION_PAGE_BANNER_BODY` | Likely aligned |
| Leads | `#registration-lead-primary`, `#registration-lead-secondary` | `syncRegistrationPageLeadParagraphs` | `PUBLIC_REGISTRATION_PAGE_LEAD_*` | Likely aligned |
| Form field labels / hints | registration form | `syncRegistrationFormFieldCopy` | `PUBLIC_FORM_*`, `PUBLIC_REGISTRATION_READY_HINT` | Verify placeholders only |

**Phase 260 priority:** low — fallback largely matches Phase 257 constants.

### 3.4 `public/profile.html` (`/profile`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Page lead | `#profile-page-lead` | `syncProfilePageLeadParagraphs` | `PUBLIC_PROFILE_PAGE_LEAD` | Likely aligned |
| Signed-in guidance | `#profile-signed-in-guidance` | `syncProfileSignedInGuidance` | `PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE` | Likely aligned |
| Unauth copy / CTAs | `#profile-unauth-*`, CTAs | `syncProfilePageCtas`, headings sync | `PUBLIC_PROFILE_*` | Verify only |

**Phase 260 priority:** low.

### 3.5 `public/explore.html` (`/explore`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Page lead | `#explore-page-lead` | `syncExplorePageLeadParagraphs` | `PUBLIC_EXPLORE_PAGE_LEAD` | Likely aligned |
| Feed status / empty | `#explore-status`, `#explore-empty` | `syncExplorePageStatusCopy`, empty panel sync | `PUBLIC_EXPLORE_*` | Runtime overwrites loading/empty copy |

**Phase 260 priority:** low.

### 3.6 `public/vote.html` (`/vote/:pollId`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Reminder lead | `#vote-page-reminder-lead` | `syncVotePageLeadParagraphs` | `PUBLIC_VOTE_PAGE_REMINDER_LEAD` | **Yes** — fallback merges demo+live in one order; refined constant separates demo sentence |
| Policy hint list | `#vote-policy-hint-list` | `syncVotePagePolicyPanelCopy` | `PUBLIC_VOTE_POLICY_*` | **Yes** — fallback quality bullet still「優質題目…」vs `PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT` |
| Collecting notice | `#vote-collecting-notice-body` | `syncVotePagePolicyPanelCopy` | `PUBLIC_VOTE_COLLECTING_NOTICE_BODY` | Likely aligned |
| Follow-results side panel | `#vote-follow-results-body`, `#vote-follow-results-mock-note` | `syncVotePageSidePanelCopy` | `PUBLIC_VOTE_FOLLOW_RESULTS_*` | Likely aligned |
| View-results nav hint | `#vote-view-results-nav-hint` | `syncVoteOnboardingNavigationHints` | `PUBLIC_VOTE_VIEW_RESULTS_NAV_HINT_*` | Runtime-built |
| Pre-vote dynamic hints | `#official-vote-pre-vote-hint` | runtime only | `PUBLIC_VOTE_PRE_VOTE_*` | N/A in shell |
| Demo nav / preview links | static chrome | **None** | N/A | Static-only |

### 3.7 `public/results.html` (`/results/:pollId`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Demo intro | `#results-page-demo-intro` | `syncResultsPageLeadParagraphs` | `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` | **Yes** — fallback still「優質題目依多種訊號判定」; refined constant removed「優質題目」 |
| Live intro | built into `#results-intro` | `syncResultsPageLeadParagraphs` | `PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD` | Runtime-built for live path |
| Vote nav hint | `#results-vote-nav-hint` | `syncResultsOnboardingNavigationHints` | `PUBLIC_RESULTS_VOTE_NAV_HINT_*` | Runtime-built |
| Results intro block | `#results-intro` | `syncResultsPageOnboardingCopy` | `PUBLIC_RESULTS_INTRO_*` | Runtime-built |

### 3.8 `public/my-polls.html` (`/my-polls`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Banner | `#my-polls-page-banner` | `syncMyPollsPageBanner` | `PUBLIC_MY_POLLS_PAGE_BANNER_BODY` | **Minor** — fallback「使用即時模式（網址加上 ?live=1）」vs refined「在網址加上 ?live=1（即時模式）」 |
| Page lead | `#my-polls-page-lead` | `syncMyPollsPageLeadParagraphs` | `PUBLIC_MY_POLLS_PAGE_LEAD` | **Yes** — fallback「編輯」vs refined「修改或刪除」 |
| Create-poll nav hint | `#my-polls-create-poll-nav-hint` | `syncMyPollsOnboardingNavigationHints` | `PUBLIC_MY_POLLS_CREATE_POLL_NAV_HINT_*` | Verify link label duplication「前往…前往」 |
| Quota panel body | `#my-polls-quota-panel-body` | `syncMyPollsQuotaPanelCopy` | `PUBLIC_MY_POLLS_QUOTA_PANEL_*` | Likely aligned |
| Creator side note | `#my-polls-creator-side-note` | `syncMyPollsPageSectionHeadings` | `PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY` | Runtime sync |
| Mock table rows | static examples | **None** | N/A | Demo data only |

### 3.9 `public/create-poll.html` (`/polls/new`)

| Region | Mount / selector | Runtime sync | Phase 257 constant | Fallback misaligned? |
|--------|------------------|--------------|-------------------|----------------------|
| Page lead | `#create-poll-page-lead` | `syncCreatePollPageLeadParagraphs` | `PUBLIC_CREATE_POLL_PAGE_LEAD` | **Yes** — fallback「期中結果」vs refined「期中票數或百分比」 |
| Banner | `#create-poll-page-banner` | `syncCreatePollPageBanner` | `PUBLIC_CREATE_POLL_PAGE_BANNER_BODY` | **Yes** — fallback「公開展示版／展示流程」vs refined「展示模式／僅做欄位檢查」 |
| Live mode hint | `#create-poll-live-mode-hint` | sync | `PUBLIC_CREATE_POLL_LIVE_MODE_HINT` | **Yes** — fallback「變更公開狀態」vs refined lifecycle verbs |
| My-polls nav hint | `#create-poll-my-polls-nav-hint` | sync | `PUBLIC_CREATE_POLL_MY_POLLS_NAV_HINT_*` | Verify |
| **發起須知** aside | `.mvp-policy-panel` list inside `#create-poll-creator-guidance` | **None** | N/A | **Static-only** —「優質題目」「期中結果」; **high priority** |
| Founder callout + lock help tip | `.mvp-founder-callout`, `.mvp-help-tip` | **None** | N/A | **Static-only** — lifecycle wording; align with FAQ cancel/close/unpublish vocabulary |
| Schedule / lifecycle fieldset | `#create-poll-schedule-lifecycle-hints` | **None** | N/A | Static-only demo-disabled copy |

### 3.10 `public/trust-levels.html` (`/trust-levels`)

| Region | Runtime sync | Notes |
|--------|--------------|-------|
| Entire policy matrix page | **None** (layout script only) | Static-only policy draft; no `public-page-copy.js` wiring |
| Hero / mock banner | **None** | May align collecting/result readonly phrasing with FAQ |
| Permission matrix cells | **None** | **Forbidden** — must not introduce live trust scores, quota numbers, or governance signals |

**Phase 260 priority:** selective static policy wording only; no matrix structure or numeric score exposure.

### 3.11 `public/faq.html` (`/faq`) — Phase 257 complete

| Status | Notes |
|--------|-------|
| **Aligned in Phase 257** | Static fallback matches `PUBLIC_FAQ_*` mount points |
| **Phase 260** | **Out of scope** unless regression found |

---

## 4. Cross-Cutting Mismatch Themes (Fallback vs `public-page-copy.js`)

| Theme | Stale fallback pattern | Refined constant direction | Phase 260 action |
|-------|------------------------|---------------------------|------------------|
| Quality feedback |「優質題目」| `PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY`, `PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT`, `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` | Replace static fallback text only; no badge/tooltip expansion |
| Engineer auth copy | `X-User-Id`, `creator_session`, `production credential proof` | `PUBLIC_LOGIN_FORM_READY_HINT`, `PUBLIC_LOGIN_PAGE_LEAD_SECONDARY` | Align **HTML fallback** for synced mounts; runtime JS engineer tokens are **out of Phase 260 scope** |
| Lifecycle vocabulary |「編輯」「期中結果」「變更公開狀態」| creator/my-polls/create-poll constants | Text replacement in static lists/callouts only |
| Demo vs live |「公開展示版」「網址加上 ?live=1」ordering | `PUBLIC_*_BANNER_BODY`, `PUBLIC_*_LIVE_MODE_HINT` | Wording alignment only |
| Collecting hidden | shorter tip text | `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` | Align `.mvp-help-tip` fallback where unsynced |

---

## 5. Phase 260 Executable Direction (Future — Not Phase 259)

If approved, **Phase 260** may deliver **minimal static HTML shell fallback copy alignment** only:

| Rule | Constraint |
|------|------------|
| Scope | static text node / list item text replacement in allowlisted HTML files |
| DOM structure | **No change** unless unavoidable for text-only replacement |
| Contracts | **No change** to `id`, `class`, `data-*`, form fields, button types, link `href`, or mount-point ids used by sync modules |
| Scripts | **No new** `<script>`, inline handlers, `onclick`, storage, or tracking |
| Data flow | **No new** API calls, fetch, or analytics |
| Product promises | **No new** eligibility guarantees; preserve「不表示可保證符合或不符合」hedging |
| `quality_badge` | **No expansion** to score, rank, recommendation, trust, or governance language |
| Runtime | **No** `public/frontend/*.js` or `public-mvp.css` changes in Phase 260 unless a separate phase approves |
| Canonical source | Replacement text must come from existing `public-page-copy.js` / `PAGE_COPY.*` constants (copy verbatim; do not invent new policy) |

---

## 6. Allowed Files for Future Implementation Phase (Phase 260)

A future approved runtime phase (**Phase 260**, not Phase 259) may modify **only**:

| Priority | Allowed paths | Constraint |
|----------|---------------|------------|
| P0 | `public/index.html` | synced mount fallbacks + static-only value-card / help-tip text |
| P0 | `public/login.html` | synced mount fallbacks; static auth-grid rephrase only if explicitly listed in Phase 260 checklist |
| P0 | `public/vote.html` | `#vote-page-reminder-lead`, `#vote-policy-hint-list` fallback bullets |
| P0 | `public/results.html` | `#results-page-demo-intro` fallback |
| P0 | `public/create-poll.html` | synced mount fallbacks + static「發起須知」/ founder callout text |
| P1 | `public/my-polls.html` | `#my-polls-page-lead`, `#my-polls-page-banner`, nav hint fallback |
| P2 | `public/registration.html`, `public/profile.html`, `public/explore.html` | fallback verification / minor wording only if drift found |
| P2 | `public/trust-levels.html` | selective static policy sentences only; **not** matrix structure |
| — | `public/faq.html` | **Out of scope** (Phase 257 aligned) |
| Guards | `tests/frontend/phase-260-*.test.ts`, `tests/docs/phase-260-*.test.ts` | prove HTML copy-only boundary |
| Docs | Future Phase 260 doc + README index | delivery reporting |

**Default forbidden in Phase 260 unless explicitly approved in a separate governance phase:**

- `public/frontend/*.js`, `public/frontend/public-mvp.css`
- `src/**`, `migrations/**`
- `quality-feedback-badge.js` logic changes
- Vote submit handlers, result evaluator wiring, auth/session handlers
- New `localStorage` / `sessionStorage` / analytics / APM
- HTML structure refactors, new regions, new scripts
- `design-drafts/` commits

---

## 7. Future Runtime Checklist (Phase 260)

Use this checklist in Phase 260. Each item is **static HTML fallback copy alignment only**.

### 7.1 Shell fallback alignment

- [ ] Each allowlisted HTML sync mount fallback matches its `PUBLIC_*` constant verbatim (or acceptable punctuation-only delta documented)
- [ ] Static-only regions with policy copy (`create-poll.html`發起須知, `login.html` auth grid if in scope) contain no「優質題目」where Phase 257 removed it
- [ ] No new `<script>`, handler, storage, or tracking in HTML
- [ ] `id` / `class` / `data-*` / form / link contracts unchanged

### 7.2 Account pages (`/login`, `/registration`, `/profile`)

- [ ] Registration fallback still states: no auto-login, no `Set-Cookie`, does not call `GET /users/me` after success
- [ ] Profile fallback still limits fields to `birth_year_month` / `residential_region`
- [ ] Eligibility hedging preserved in static fallback

### 7.3 Participation pages (`/vote`, `/results`)

- [ ] Collecting / cancelled / unpublished meaning unchanged in static fallback
- [ ] vote-by-index remains `{ option_index }` only (no HTML change to vote form)
- [ ] Static fallback does not promise vote success

### 7.4 Creator pages (`/my-polls`, `/polls/new`)

- [ ] Lifecycle action meanings unchanged in static fallback (cancel / close / unpublish)
- [ ] No live quota / quality score numbers introduced in static HTML

### 7.5 `quality_badge` copy boundary

- [ ] Static fallback does not expand badge into score, rank, recommendation, trust, or governance
- [ ] No tooltip, debug, explanation, counts, or hidden aggregate copy added to HTML

### 7.6 Verification gates before Phase 260 merge

- [ ] `git diff --check`
- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run migrate:check`
- [ ] Optional: `npm run smoke:public:local` when environment allows

---

## 8. Explicit Non-Goals

Phase 259 and any future Phase 260 static shell copy alignment must **not**:

| Non-goal | Reason |
|----------|--------|
| API / DB / backend / migration changes | Shell fallback copy is HTML text only |
| Auth / session / `UserAuthResolver` changes | Unrelated to static fallback copy |
| Registration auto-login or cookie issuance | Auth boundary |
| Post-success `GET /users/me` | Registration boundary — registration does not call `GET /users/me` after success |
| New profile fields beyond `birth_year_month` / `residential_region` | Profile boundary |
| Vote transaction / eligibility evaluator changes | Vote integrity |
| vote-by-index eligibility-before-option-resolve changes | Vote integrity |
| Result visibility / result evaluator / lifecycle state machine changes | Result integrity |
| Creator ownership / lifecycle API changes | Creator boundary |
| Reference Answer integration changes | Privacy boundary |
| Ranking / recommendation / personalization | Pre-vote ranking rules |
| Trust / score / governance UI or copy expansion | MVP non-goals |
| `quality_badge` expansion beyond presentation-only `positive_feedback` → `回饋良好` | Governance boundary |
| Option choice + user/session/device/request/log/trace/metric/error linkage | Raw Option Linkage Ban |
| `localStorage` / `sessionStorage` / analytics / APM / debug tracking | Privacy / observability ban |
| `public/frontend/*.js` or `public-mvp.css` changes in Phase 260 unless separately approved | Phase 260 is static HTML fallback only |
| New features, new API calls, new scripts, or structural HTML refactors | Phase 260 is minimal copy only |
| `design-drafts/` commits | Out of repo delivery scope |
| Re-open `faq.html` alignment unless regression found | Phase 257 already aligned |

Additional summary:

- Change API, DB, migrations, auth resolver, vote evaluator, result evaluator, or creator lifecycle APIs
- Change vote-by-index payload shape or eligibility-before-option-resolve order
- Add registration auto-login, `Set-Cookie`, or post-success `GET /users/me`
- Expand profile fields beyond `birth_year_month` / `residential_region`
- Add `localStorage`, `sessionStorage`, analytics, APM, or debug tracking
- Modify runtime handlers or CSS layout in Phase 259; Phase 260 must not change JS/CSS by default
- Change ranking, recommendation, personalization, trust score UI, or governance signals
- Create option choice + user/session/device/request/log/trace/metric/error linkage

---

## 9. Suggested Guard Tests

Phase 259 guard tests (this phase):

- `tests/docs/phase-259-public-static-html-shell-copy-alignment-plan-doc.test.ts`
- `tests/frontend/phase-259-public-static-html-shell-copy-alignment-plan.test.ts`

Future Phase 260 should add:

- `tests/frontend/phase-260-public-static-html-shell-copy-alignment.test.ts`
- `tests/docs/phase-260-public-static-html-shell-copy-alignment-doc.test.ts`

Suggested Phase 260 assertions:

1. Allowlisted HTML files contain no stale「優質題目」in policy fallback regions targeted by plan.
2. Sync mount fallback text matches exported `PUBLIC_*` constants for each `id` listed in plan inventory.
3. No new `<script>` or inline handlers in modified HTML.
4. vote-by-index body remains `{ option_index }` only.
5. Protected backend paths unchanged.

---

## 10. Phase Conclusion

**Phase 259 is plan-only.** No runtime, HTML, JS, CSS, API, DB, auth, vote, result, creator, profile, or privacy behavior changes are delivered in this phase.

**Phase 260**, if executed, may deliver **minimal static HTML shell fallback copy alignment** per Sections 5–7, using the allowlist in Section 6, followed by a runtime review checkpoint if governance requires it.

Phase 259 does **not** approve Phase 260 implementation automatically.

---

## 11. Validation Checklist (Phase 259)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
```

Phase 259 intentionally does **not** require `npm run smoke:public:local` because no runtime behavior changed.

---

## 12. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 259 is plan documentation and guard tests only. No migration, schema DDL, runtime, API, DB, HTML, CSS, or frontend behavior changes.
