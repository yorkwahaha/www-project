# WWW Project Phase 256 — Public Help / FAQ Copy Refinement Plan v1

**Status:** plan only. Phase 256 plans low-risk future public help / FAQ / guide copy refinement across shared public MVP pages, without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, creator session, lifecycle, or Reference Answer behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 256.**

**Baseline:** `origin/master` after Phase 255 public presentation & accessibility polish milestone checkpoint (`ef9e9bb`).

**Prior checkpoint:** [Phase 255 public presentation & accessibility polish milestone checkpoint](./www-project-phase-255-public-presentation-accessibility-polish-milestone-checkpoint-v1.md).

**Related copy context:**

- [Phase 238 public onboarding + FAQ copy final milestone checkpoint](./www-project-phase-238-public-onboarding-faq-copy-final-milestone-checkpoint-v1.md) — completed Phase 222–237 onboarding + FAQ/help copy arc
- [Phase 255 public presentation & accessibility polish milestone checkpoint](./www-project-phase-255-public-presentation-accessibility-polish-milestone-checkpoint-v1.md) — completed Phase 239–254 presentation/a11y arc; copy meaning must remain fixed after layout/share/focus/reduced-motion polish

---

## 1. Plan Purpose

Phase 256 is **plan only**. It inventories current public help / FAQ / guide copy and defines safe future **minimal copy refinement** boundaries after Phase 238 onboarding+FAQ delivery and Phase 255 presentation/a11y milestone.

This plan answers:

1. Which public pages carry help, FAQ, onboarding, policy, or state-explanation copy today.
2. Where wording may be unclear, repetitive, or inconsistent without changing product promises.
3. Which copy refinement categories are safe (plain-language clarity, cross-page consistency, demo/live distinction, eligibility hedging preserved).
4. Which copy refinement categories are forbidden (eligibility disclosure expansion, counter leakage, backend echo, `quality_badge` meaning expansion, ranking/trust/governance signals).
5. What explicit non-goals, page-by-page checklist, and guard tests apply before any runtime phase.

Phase 256 does **not** approve implementation. Future copy refinement runtime requires a separately approved phase (**Phase 257** minimal public help / FAQ copy refinement).

---

## 2. Current Copy Inventory

Static inventory at Phase 256 baseline (`ef9e9bb`). Copy is centralized primarily in `public/frontend/public-mvp-ui.js` allowlists; some static HTML shells still carry inline help text.

### 2.1 `/faq` — main FAQ copy

| Area | Source | Current role | Refinement notes |
|------|--------|--------------|------------------|
| Hero lead | `PUBLIC_FAQ_PAGE_HERO_LEAD` via `faq-page.js` → `#faq-page-hero-lead` | Orient users to account / creator / participant / lifecycle topics | Candidate: shorten opening question list while keeping same scope |
| Summary cards | Static `faq.html` (4 cards: collecting hidden, close reveal, lock period, cancel ≠ unpublish) | Quick policy scan | Candidate: align card titles with lifecycle vocabulary used on my-polls / creator hints; **not synced** to allowlist today |
| Account flow FAQ | `PUBLIC_FAQ_ACCOUNT_FLOW_*` | registration → login → profile | Candidate: reduce repetition of「不會自動登入」if already stated in hero |
| Creator flow FAQ | `PUBLIC_FAQ_CREATOR_FLOW_*` | demo vs `?live=1` vs my-polls | Candidate: clarify「即時模式」is URL-based without implying new feature |
| Participant flow FAQ | `PUBLIC_FAQ_PARTICIPANT_*` | vote → results → collecting hidden | Candidate: tighten demo vs live vote/results distinction |
| Profile / eligibility FAQ | `PUBLIC_FAQ_PROFILE_*`, `PUBLIC_FAQ_ELIGIBILITY_FAILURE_REFERENCE_NOTE` | birth_year_month / residential_region purpose | **High-risk slice** — may only rephrase hedging, not weaken「不表示可保證符合或不符合」 |
| Collecting hidden FAQ | `PUBLIC_FAQ_COLLECTING_HIDDEN_*` | why no numbers during collecting | Candidate: merge with `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` phrasing for consistency |
| Cross-links | Static anchors to `/registration`, `/login`, `/profile`, `/polls/new`, `/my-polls`, `/vote/demo`, `/results/demo`, `/trust-levels` | Navigation only | Candidate: unify link label casing / punctuation only |

### 2.2 Home onboarding / help copy

| Area | Source | Current role | Refinement notes |
|------|--------|--------------|------------------|
| Hero lead | `PUBLIC_HOME_HERO_LEAD` via `public-mvp-home.js` | collecting hidden + lock period summary | Candidate: align with FAQ summary card wording |
| Collecting help tip | Static `index.html` `.mvp-help-tip` |「不顯示票數、百分比、總計、排名、趨勢或進度。」 | **Not in allowlist** — candidate for sync to `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` or dedicated home help constant |
| Value cards / CTAs | Static `index.html` | product overview | Candidate: static text polish only; no new promises |
| Auth banner | `PUBLIC_AUTH_BANNER_*`, `PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES` | guest vs demo identity | Candidate: clarify demo nav is not login |

### 2.3 `/login`, `/registration`, `/profile` — user guidance copy

| Area | Source | Current role | Refinement notes |
|------|--------|--------------|------------------|
| Registration leads | `PUBLIC_REGISTRATION_PAGE_LEAD_*`, banner | no auto-login; field scope | Candidate: simplify「production credential proof」user-facing wording without changing auth behavior |
| Login leads | `PUBLIC_LOGIN_PAGE_LEAD_*`, banner | session vs registration separation | Candidate: reduce technical terms (`X-User-Id`, `creator_session`) visibility if any remain in user-visible copy |
| Profile lead | `PUBLIC_PROFILE_PAGE_LEAD`, `PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE` | two fields only; eligibility hedging | **High-risk** — hedging must remain |
| Cross-links | `PUBLIC_LOGIN_FORM_REGISTRATION_CROSSLINK_*`, `PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT` | registration ↔ login ↔ profile flow | Candidate: consistency with FAQ account flow answers |
| Allowlist | `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` | safe account onboarding copy set | Phase 257 edits must stay inside or extend allowlist with review |

### 2.4 `/vote`, `/results` — public help / state copy

| Area | Source | Current role | Refinement notes |
|------|--------|--------------|------------------|
| Vote page reminder | `PUBLIC_VOTE_PAGE_REMINDER_LEAD` | page intro | Candidate: separate demo vs live sentence order for scanability |
| Vote policy panel | `PUBLIC_VOTE_POLICY_*` in `vote.html` + allowlist | login, collecting hidden, follow results, quality feedback | Candidate: unify bullet punctuation; keep FAQ / trust-levels links |
| Pre-vote hints | `PUBLIC_VOTE_PRE_VOTE_*` | anonymous / incomplete profile / neutral submit | **High-risk** — must not promise vote outcome |
| Collecting notice | `PUBLIC_VOTE_COLLECTING_NOTICE_BODY` | status-region copy | Candidate: dedupe with policy panel if redundant |
| Results demo/live intro | `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD`, `PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD` | readonly scope + collecting hidden | Candidate: clarify demo intro「優質題目」is policy language, not `quality_badge` score |
| Results intro hints | `PUBLIC_RESULTS_INTRO_*` | scope + vote nav | Candidate: align「區間化摘要」wording with FAQ |
| Unavailable states | `PUBLIC_RESULTS_COLLECTING_*`, cancelled, unpublished messages | result visibility tiers | **Forbidden to change meaning** — wording polish only |
| Nav hints | `PUBLIC_VOTE_VIEW_RESULTS_NAV_HINT_*`, `PUBLIC_RESULTS_VOTE_NAV_HINT_*` | cross-page navigation | Candidate: shorten without removing readonly/collecting constraints |
| Allowlist | `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES` | safe vote/results onboarding copy | Phase 257 edits must stay inside or extend allowlist with review |

### 2.5 `/my-polls`, `/polls/new` — creator help / state copy

| Area | Source | Current role | Refinement notes |
|------|--------|--------------|------------------|
| Page leads | `PUBLIC_MY_POLLS_PAGE_LEAD`, `PUBLIC_CREATE_POLL_PAGE_LEAD` | ownership + collecting hidden + lock period | Candidate: align lifecycle verbs with FAQ (取消 / 結束收集 / 下架) |
| Demo/live banners | `PUBLIC_*_PAGE_BANNER_BODY`, `PUBLIC_CREATE_POLL_LIVE_MODE_HINT` | `?live=1` explanation | Candidate: consistent「即時模式」label across FAQ / create-poll / my-polls |
| Lock period help tip | Static `create-poll.html` `.mvp-help-tip` | lock-period restrictions | **Not in allowlist** — candidate for shared constant |
| Creator lifecycle hints | `PUBLIC_CREATOR_*_HINT`, `creator-flow-copy.js` | cancel / close / unpublish guidance | Candidate: cross-link to FAQ lifecycle section |
| Quota panel | `PUBLIC_MY_POLLS_QUOTA_PANEL_*` | trust-level planning note | **Forbidden** — must not introduce live score / quota numbers |
| Share success copy | `PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD` (share-link layout) | post-create guidance | Candidate: align with Phase 246–248 share-link row copy |
| Allowlist | `PUBLIC_CREATOR_ONBOARDING_MESSAGES` | safe creator onboarding copy | Phase 257 edits must stay inside or extend allowlist with review |

### 2.6 `/explore` and `/trust-levels`

| Area | Source | Current role | Refinement notes |
|------|--------|--------------|------------------|
| Explore lead | `PUBLIC_EXPLORE_PAGE_LEAD`, feed hints | non-personalized feed explanation | Candidate: clarify「不提供熱門、票數…」without implying future features |
| Trust levels | Static `trust-levels.html` | permission / trust policy summary | Candidate: align collecting / readonly wording with FAQ; no live trust score UI |

### 2.7 `quality_badge` display copy boundary

| Rule | Current state | Phase 257 constraint |
|------|---------------|----------------------|
| Badge label | `QUALITY_FEEDBACK_BADGE_LABEL` =「回饋良好」only | **Must not change label meaning** |
| Render gate | `positive_feedback` only; null/missing/unexpected silent | **Fixed** |
| Related help copy | `PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT` mentions「優質題目非單純按讚」 | May clarify that badge is **not** a score/rank; must **not** add tooltip, debug, explanation panel, counts, or rank |
| Results demo intro | `PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD` mentions「優質題目依多種訊號判定」 | Refinement may disambiguate from poll-card badge; must **not** expose aggregate signals or hidden counts |
| Poll card mount | `quality-feedback-badge.js` near title only | No expansion to recommendation, trust, or governance copy |

**Inventory conclusion:** Help / FAQ / guide copy is broad but already governed by Phase 238 allowlists. Phase 257 refinement should be **small, text-only, and allowlist-scoped** — not a rewrite of product policy.

---

## 3. Scope

### 3.1 In scope (planning only)

Future **minimal public copy refinement** candidates:

| Goal | Examples | Constraint |
|------|----------|------------|
| Clarity | Shorter sentences, plainer demo/live explanation, consistent lifecycle verbs | Same product promise |
| Consistency | Align collecting-hidden phrasing across home tip, vote panel, FAQ, results intro | No counter leakage |
| Misleading-risk reduction | Disambiguate `quality_badge`「回饋良好」from policy「優質題目」language | No score/rank/tooltip |
| Static ↔ allowlist alignment | Move inline `index.html` / `create-poll.html` help tips into existing allowlists | Text replacement or sync only |
| Cross-link labels | Unified「常見問題」「權限與信任等級說明」casing | No new routes or query tracking |

### 3.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation in Phase 256.
- Any edit to `public/*.html`, `public/frontend/*.js`, or `public/frontend/public-mvp.css` in Phase 256.
- New features, new API calls, new HTML regions, or new interactive help widgets.
- Eligibility outcome promises, vote success guarantees, or result tier threshold changes.
- `localStorage`, `sessionStorage`, cookies, analytics, metrics, APM, debug tracking.
- Ranking, recommendation, personalization, trust score UI, governance signals.
- `design-drafts/` commits.

---

## 4. Allowed Files for Future Implementation Phase (Phase 257)

A future approved runtime phase (**Phase 257**, not Phase 256) may modify **only**:

| Category | Allowed paths | Constraint |
|----------|---------------|------------|
| Copy constants | `public/frontend/public-mvp-ui.js` | Existing or extended allowlists only; no fetch / storage / tracking |
| FAQ sync | `public/frontend/faq-page.js` | `syncFaqPageOnboardingCopy` text targets only |
| Home sync | `public/frontend/public-mvp-home.js` | hero / help-tip text sync only |
| Page sync modules | `public/frontend/login-page.js`, `registration-page.js`, `profile-page.js`, `vote-page.js`, `result-page.js`, `create-poll-page.js`, `my-polls-page.js`, `explore-page.js` | copy sync / textContent only; no handler changes |
| Re-export shims | `public/frontend/auth-state-copy.js`, `public/frontend/creator-flow-copy.js` | re-export alignment only if constants move |
| Static shells | `public/faq.html`, `public/index.html`, `public/login.html`, `public/registration.html`, `public/profile.html`, `public/vote.html`, `public/results.html`, `public/create-poll.html`, `public/my-polls.html`, `public/explore.html`, `public/trust-levels.html` | **static text replacement only**; no new mount regions unless unavoidable |
| Guard tests | `tests/frontend/phase-257-*.test.ts`, `tests/docs/phase-257-*.test.ts` | prove copy-only boundary |
| Docs / README | Future phase doc + README index | delivery reporting |

**Default forbidden in Phase 257 unless explicitly approved in a separate governance phase:**

- `src/**`, `migrations/**`
- `quality-feedback-badge.js` logic changes (label/gate only; no tooltip/debug)
- Vote submit handlers, result evaluator wiring, auth/session handlers
- New `localStorage` / `sessionStorage` / analytics / APM
- HTML structure refactors beyond necessary static text replacement

---

## 5. Future Runtime Checklist (Phase 257)

Use this checklist in Phase 257. Each item is **copy refinement only**.

### 5.1 FAQ / help surfaces

- [ ] `/faq` hero, summary cards, and FAQ answers remain policy-accurate
- [ ] Demo / live / readonly distinctions stay technically correct
- [ ] FAQ answers do not echo backend/internal errors or eligibility outcomes
- [ ] FAQ does not expose raw counters, percentages, ranks, or hidden aggregates

### 5.2 Account pages (`/login`, `/registration`, `/profile`)

- [ ] Registration still states: no auto-login, no `Set-Cookie`, does not call `GET /users/me` after success
- [ ] Profile copy still limits fields to `birth_year_month` / `residential_region`
- [ ] Eligibility hedging preserved:「不表示可保證符合或不符合任何問卷資格」

### 5.3 Participation pages (`/vote`, `/results`)

- [ ] Collecting / cancelled / unpublished meaning unchanged
- [ ] vote-by-index remains `{ option_index }` only
- [ ] Pre-vote hints do not promise vote success
- [ ] Results copy still describes display-safe / tiered summaries only

### 5.4 Creator pages (`/my-polls`, `/polls/new`)

- [ ] Lifecycle action meanings unchanged (cancel / close / unpublish)
- [ ] Creator ownership / session semantics unchanged
- [ ] No live quota / quality score numbers introduced

### 5.5 `quality_badge` copy boundary

- [ ] Badge still renders only `positive_feedback` →「回饋良好」
- [ ] No tooltip, debug, explanation, counts, score, rank, or hidden aggregate copy added
- [ ] Help copy does not imply badge drives ranking / recommendation / trust / governance

### 5.6 Verification gates before Phase 257 merge

- [ ] `git diff --check`
- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run migrate:check`
- [ ] Optional: `npm run smoke:public:local` when environment allows

---

## 6. Explicit Non-Goals

Phase 256 and any future Phase 257 copy refinement must **not**:

| Non-goal | Reason |
|----------|--------|
| API / DB / backend / migration changes | Copy refinement is frontend text only |
| Auth / session / `UserAuthResolver` changes | Unrelated to copy |
| Registration auto-login or cookie issuance | Auth boundary |
| New profile fields beyond `birth_year_month` / `residential_region` | Profile boundary |
| Vote transaction / eligibility evaluator changes | Vote integrity |
| vote-by-index eligibility-before-option-resolve changes | Vote integrity |
| Result visibility / result evaluator / lifecycle state machine changes | Result integrity |
| Creator ownership / lifecycle API changes | Creator boundary |
| Reference Answer integration changes | Privacy boundary |
| Ranking / recommendation / personalization | Pre-vote ranking rules |
| Trust / score / governance UI or copy expansion | MVP non-goals |
| `quality_badge` expansion beyond presentation-only `positive_feedback` → `回饋良好` | Governance boundary |
| Option/user/session/device/request/log/trace/metric/error linkage | Raw Option Linkage Ban |
| `localStorage` / `sessionStorage` / analytics / APM / debug tracking | Privacy / observability ban |
| New features, new API calls, or structural HTML refactors | Phase 257 is minimal copy only |
| `design-drafts/` commits | Out of repo delivery scope |

---

## 7. `quality_badge` and Raw Option Linkage Ban (Fixed)

### 7.1 `quality_badge` boundary

- Remains presentation-only via `quality-feedback-badge.js`.
- Only `positive_feedback` → `回饋良好`; `null`, missing, or unexpected values do not render.
- Must not be used for ranking, recommendation, personalization, trust, score, creator score, or governance.
- Copy refinement must not add tooltip, debug, explanation, counts, score, rank, or hidden aggregate display tied to badge state.

### 7.2 Raw Option Linkage Ban

- Help / FAQ copy must not introduce durable or observability linkage of option choice to user, session, device, request, or traceable identifier.
- Copy polish must not add analytics, debug payloads, or tracking hooks.

---

## 8. Suggested Guard Tests for Future Implementation Phase (Phase 257)

Future Phase 257 should add:

- `tests/frontend/phase-257-public-help-faq-copy-refinement.test.ts`
- `tests/docs/phase-257-public-help-faq-copy-refinement-doc.test.ts`

Suggested assertions:

1. Updated strings remain inside relevant allowlists (`PUBLIC_FAQ_ONBOARDING_MESSAGES`, `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES`, `PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES`, `PUBLIC_CREATOR_ONBOARDING_MESSAGES`, etc.).
2. `QUALITY_FEEDBACK_BADGE_LABEL` remains「回饋良好」; gate unchanged.
3. vote-by-index body remains `{ option_index }` only.
4. Registration still does not call `GET /users/me` after success.
5. Protected backend paths unchanged.

Phase 256 guard tests (this phase):

- `tests/docs/phase-256-public-help-faq-copy-refinement-plan-doc.test.ts`
- `tests/frontend/phase-256-public-help-faq-copy-refinement-plan.test.ts`

---

## 9. Phase Conclusion

**Phase 256 is plan-only.** No runtime, HTML, JS, CSS, API, DB, auth, vote, result, creator, profile, or privacy behavior changes are delivered in this phase.

**Phase 257**, if executed, may deliver **minimal public help / FAQ copy refinement** per Sections 4–5, followed by a runtime review checkpoint if governance requires it.

Phase 256 does **not** approve Phase 257 implementation automatically.

---

## 10. Validation Checklist (Phase 256)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
```

Phase 256 intentionally does **not** require `npm run smoke:public:local` because no runtime behavior changed.

---

## 11. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 256 is plan documentation and guard tests only. No migration, schema DDL, runtime, API, DB, HTML, CSS, or frontend behavior changes.
