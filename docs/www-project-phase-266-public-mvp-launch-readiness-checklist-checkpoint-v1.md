# WWW Project Phase 266 — Public MVP Launch Readiness Checklist Checkpoint v1

**Status:** readiness checkpoint — docs + guard tests + README index only. Consolidates the Phase 265 launch readiness plan into an operator-facing checklist checkpoint without implementing any runtime, HTML, CSS, JS, API, DB, schema, migration, auth, vote, result, creator, profile, or privacy behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This checkpoint establishes a launch readiness checklist. It is not launch approval and not production approval.**

**Baseline:** `origin/master` after Phase 265 public MVP launch readiness checklist plan (`2e34887`).

**Prior plan:** [Phase 265 public MVP launch readiness checklist plan](./www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md).

**Related readiness context:**

- [Phase 264 public help / FAQ copy milestone checkpoint](./www-project-phase-264-public-help-faq-copy-milestone-checkpoint-v1.md) — copy/static shell/runtime copy arc complete
- [Phase 255 public presentation & accessibility polish milestone checkpoint](./www-project-phase-255-public-presentation-accessibility-polish-milestone-checkpoint-v1.md) — presentation/a11y arc complete
- [Phase 170 public MVP showcase readiness milestone](./www-project-phase-170-public-mvp-showcase-readiness-milestone-v1.md) — earlier demo-safe page inventory

---

**Release docs arc navigation (Phase 284):** **readiness arc** (middle) — ← [Phase 265](./www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md) · **Phase 266** · [Phase 267](./www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md) →

**Authoritative current release status (Phase 284):** manual release preparation approved per Phase 273; operator release execution authorized; Actual deployment NOT EXECUTED; no deploy scripts added; no production configuration changed. Historical phase baselines do not imply deployment or production configuration change. See [Phase 280 final checkpoint](./www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md) and [Phase 284 implementation](./www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md).

## 1. Checkpoint Purpose

Phase 266 executes **Option A** from Phase 265: a **launch readiness checklist checkpoint** — docs + guard tests only.

This checkpoint answers:

1. Which public pages and flows operators must verify before any launch decision.
2. Which automated gates must pass (`git diff --check`, `npm test`, `npm run typecheck`, `npm run build`, `npm run migrate:check`, `npm run smoke:public:local`).
3. Which privacy, vote, result, auth, creator, and `quality_badge` boundaries remain fixed during launch prep.
4. Which items still require **manual browser QA** even when automated guards pass.
5. That any runtime bug discovered during QA requires a **separate numbered phase** — not a silent fix inside this checkpoint.

**This checkpoint does not approve launch. This checkpoint does not approve production deployment.**

---

## 2. Public MVP Launch Readiness Checklist

### 2.1 Public page navigation checklist

| Route | Shell | Primary runtime module | Readiness check |
|-------|-------|------------------------|-----------------|
| `/` | `index.html` | `public-mvp-home.js` | hero/onboarding copy, account-flow note, sample polls, static examples, nav to explore/faq/trust-levels |
| `/explore` | `explore.html` | `explore-page.js` | freshness-only feed copy; no hot/ranking/personalized claims |
| `/faq` | `faq.html` | `faq-page.js` | policy FAQ aligned; demo/live/profile/eligibility hedging |
| `/trust-levels` | `trust-levels.html` | static / minimal JS | permission/trust policy summary; no live trust score UI |
| `/registration` | `registration.html` | `registration-page.js` | no auto-login; `POST /registration` only |
| `/login` | `login.html` | `login-page.js` | session login separate from registration |
| `/profile` | `profile.html` | `profile-page.js` | `birth_year_month` / `residential_region` only |
| `/vote/:pollId` | `vote.html` | `vote-page.js` | pre-vote hints; vote-by-index `{ option_index }` only |
| `/results/:pollId` | `results.html` | `result-page.js` | lifecycle-tier visibility; no hidden aggregate |
| `/my-polls` | `my-polls.html` | `my-polls-page.js` | demo vs `?live=1` creator ownership |
| `/polls/new` | `create-poll.html` | `create-poll-page.js` | demo vs `?live=1` create flow |

**Navigation readiness checks:**

- [ ] All listed routes render without JS fatal errors
- [ ] Shared chrome (`public-mvp-layout.js`) loads on applicable pages
- [ ] Cross-links among home, faq, trust-levels, registration, login, profile are present and correct
- [ ] No new query-param tracking or storage introduced on navigation

### 2.2 Demo / live mode consistency checklist

| Surface | Demo expectation | Live (`?live=1`) expectation | Consistency check |
|---------|------------------|------------------------------|-------------------|
| Home account-flow note | explains demo create/profile paths | does not imply production auth | Phase 262/263 aligned; no `creator_session` / `X-User-Id` user-visible tokens |
| `/polls/new` | static/demo create path | creator session + `POST /creator/polls` | banner/hint copy consistent with FAQ |
| `/my-polls` | mock dashboard copy | owned polls + lifecycle actions | ownership boundary clear |
| `/vote` / `/results` | demo poll examples available | live poll path uses same visibility rules | collecting hidden meaning unchanged |
| FAQ / trust-levels | explains demo vs live | no new product promise | aligned with `public-page-copy.js` |

- [ ] Demo/live wording consistent across home, FAQ, create-poll, my-polls
- [ ] Demo paths do not silently upgrade to production login/session
- [ ] Live creator flow still requires `creator_session`; not confused with user login

### 2.3 Registration → login → `/users/me` → profile prompt flow

| Step | Expected behavior | Readiness check |
|------|-------------------|-----------------|
| `POST /registration` | creates account only | no `Set-Cookie`; no auto-login |
| post-registration UI | guides to `/login` | does not call `GET /users/me` after success |
| `POST /login/session` | issues `www_session` | separate from registration |
| `GET /users/me` | `user_id` + `display_name` only | no profile fields in `/users/me` |
| `GET /users/me/profile` | `birth_year_month` / `residential_region` | profile page load/save only |
| homepage profile prompt | `profile-completion-prompt.js` on homepage only | neutral hedging; non-blocking |

- [ ] Registration success copy still says no auto-login
- [ ] Login refresh shows display name in header when session valid
- [ ] Logout returns anonymous header state
- [ ] Profile completion prompt does not promise eligibility outcome

### 2.4 Official Vote pre-vote UX and vote-time eligibility boundary

| Area | Fixed boundary | Readiness check |
|------|----------------|--------------|
| Pre-vote hints | `official-vote-pre-vote-hints.js` / vote page hints | anonymous → login guidance; incomplete profile → neutral prompt |
| Vote-time authority | backend eligibility-before-option-resolve | frontend must not disclose pass/fail outcome pre-submit |
| Submit body | `{ option_index }` only | no `option_id` in request |
| Failure copy | neutral frontend messages | no backend/internal code echo |

- [ ] Pre-vote hints do not say「你符合資格」or「你不符合資格」
- [ ] Vote submit still posts `{ option_index }` only
- [ ] Duplicate vote / token errors use safe frontend copy

### 2.5 Vote integrity checklist

| Rule | Readiness check |
|------|-----------------|
| vote-by-index body `{ option_index }` only | automated guard + smoke |
| eligibility-before-option-resolve in Official Vote transaction | backend source order guard |
| vote token + counter in same DB transaction | unchanged by public MVP phases |
| Raw Option Linkage Ban | no user-option durable linkage in logs/metrics |

### 2.6 Results visibility checklist

| Lifecycle state | Public display rule | Readiness check |
|-----------------|---------------------|-----------------|
| collecting | no counters, percentages, ranks, hidden aggregate | vote/results UI + API display-safe |
| cancelled | unavailable / no option breakdown | result page mode |
| unpublished | unavailable / no option breakdown | result page mode |
| revealed / locked / post_lock | display-safe aggregate only | tier rules unchanged |

- [ ] collecting mode hides `result-percentage` and raw counters
- [ ] public results JSON does not expose shard internals or vote tokens
- [ ] results intro copy does not promise real-time precision beyond tier rules

### 2.7 Creator my-polls / create-poll / lifecycle ownership checklist

| Area | Readiness check |
|------|--------------|
| `POST /creator/session` | local/demo/test creator cookie only |
| `GET /creator/polls` | owned list; counter-free |
| `POST /creator/polls` | create payload unchanged |
| lifecycle actions | confirm + `postPollLifecycleTransition`; cancel/close/unpublish semantics fixed |
| ownership | creator cannot edit published poll content post-publish |

- [ ] my-polls live mode shows lifecycle actions with destructive separation
- [ ] create-poll submit payload unchanged (`title`, `description`, `options`, `category`, `eligible_rule_id`, `closes_at`, `publish`)
- [ ] creator copy does not expose ownership internals or vote counters

### 2.8 Share link, copy feedback, keyboard focus, reduced motion, static fallback copy

| Category | Delivered by | Readiness check |
|----------|--------------|-----------------|
| Share link presentation | Phase 246–249 | `/vote/:pollId`, `/results/:pollId` URLs only |
| Copy feedback a11y | Phase 248–249 | aria-live success/failure; focusable fallback URL |
| Keyboard focus | Phase 250–251 | `:focus-visible` tokens; no focus trap |
| Reduced motion | Phase 253–254 | `prefers-reduced-motion` CSS only |
| Centralized copy | Phase 257–264 | `public-page-copy.js` constants-only |
| Static HTML fallback | Phase 260 | P0/P1 shells free of engineer tokens |
| Homepage runtime copy | Phase 262–263 | no `creator_session` / `X-User-Id` after JS load |

- [ ] Share copy button gives polite/assertive feedback without storage
- [ ] Static fallback readable before JS (no-JS / slow-JS)
- [ ] P0/P1 shells contain no `優質題目`, `X-User-Id`, `creator_session`, `多種訊號`

### 2.9 `quality_badge` presentation-only checklist

| Rule | Readiness check |
|------|-----------------|
| `positive_feedback` →「回饋良好」only | badge module guard |
| null/missing/unexpected silent | no render |
| not used for ranking/recommendation/personalization/trust/score/governance | source guards |
| no tooltip/debug/explanation/counts/score/rank | UI inspection |
| no hidden aggregate display | results/vote pages |

---

## 3. Automated Readiness Gates Checklist

### 3.1 Required gates

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

| Gate | What it proves | Limitation |
|------|----------------|------------|
| `git diff --check` | no whitespace/conflict marker issues | not functional QA |
| `npm test` | unit/guard coverage across vote, auth, copy, presentation boundaries | DB-free; not full browser UX |
| `npm run typecheck` | TypeScript types valid | not deployment config |
| `npm run build` | TypeScript compile succeeds | not deployment config |
| `npm run migrate:check` | migration files valid | does not prove production DB state |
| `npm run smoke:public:local` | HTTP flow `/` → registration/login → creator create → vote → results | requires Docker `www_test`; not visual QA |

### 3.2 Strongly recommended when environment allows

```bash
npm run test:integration:local
```

| Gate | What it proves | Limitation |
|------|----------------|------------|
| `npm run test:integration:local` | PostgreSQL integration paths on isolated `www_test` | manual/local operator setup |

Automated gates do **not** replace manual QA. Passing all gates is necessary but not sufficient for launch approval.

---

## 4. Manual QA Checklist

Launch operators should manually verify the following even when all automated gates pass:

| Manual QA area | Steps | Why automation is insufficient |
|----------------|-------|--------------------------------|
| **Public route basic load** | Open `/`, `/explore`, `/faq`, `/trust-levels`, `/registration`, `/login`, `/profile`, `/vote/:pollId`, `/results/:pollId`, `/my-polls`, `/polls/new` | visual layout, font rhythm, image/icon rendering |
| **Anonymous state** | browse home, explore, faq, vote demo poll without login | header anonymous; no session leakage |
| **Logged-in state** | register → login → verify header display name → profile save | real cookie/session across tabs |
| **Demo / live guidance** | compare home, FAQ, create-poll, my-polls in demo vs `?live=1` | copy consistency and mode boundaries |
| **Mobile narrow viewport** | repeat key flows at ~375px width | tap targets, overflow, sticky chrome |
| **Keyboard focus** | tab through forms, share rows, lifecycle confirms | focus order and `:focus-visible` visibility |
| **Reduced motion** | enable `prefers-reduced-motion: reduce` in browser | animations/transitions respect preference |
| **Screen reader spot-check** | aria-live copy feedback, status regions, form labels | automation does not cover SR UX |
| **BFCache / back-forward** | navigate vote flow with back button | Reference Answer runtime memory rules |
| **Creator lifecycle destructive confirms** | cancel/close/unpublish wording | accidental-click safety |
| **Error state readability** | load failures, network errors, unavailable polls | neutral safe copy |
| **Production environment config** | `DATABASE_URL`, secrets, TLS, reverse proxy | out of repo scope |

**If manual QA discovers a runtime bug or privacy drift, open a separate numbered phase. Do not fix runtime behavior inside this readiness checkpoint.**

---

## 5. Phase 266 Delivery (This Phase)

Phase 266 itself is **docs + guard tests only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes**
- **no backend / auth / vote / result / creator / profile changes**

Added:

1. `docs/www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md` (this document)
2. `tests/frontend/phase-266-public-mvp-launch-readiness-checklist-checkpoint.test.ts`
3. `tests/docs/phase-266-public-mvp-launch-readiness-checklist-checkpoint-doc.test.ts`
4. README Phase 266 index

`design-drafts/` excluded from commit.

---

## 6. Fixed Boundaries (Unchanged)

### 6.1 Raw Option Linkage Ban

Launch readiness work must not introduce durable or observability linkage of option choice to user, session, device, request, or traceable identifier.

### 6.2 vote-by-index

- Request body remains `{ option_index }` only.
- Official Vote transaction order: eligibility check → option resolve → vote token write → counter increment.
- eligibility-before-option-resolve unchanged.

### 6.3 Registration / `/users/me`

- Registration submits to `/registration` only; no auto-login; no `Set-Cookie`; registration does not call `GET /users/me` after success.
- `/users/me` returns only `user_id` and `display_name`.
- Profile fields remain `birth_year_month` / `residential_region` only.
- `UserAuthResolver` semantics unchanged.

### 6.4 Result visibility / lifecycle / result evaluator

- collecting / cancelled / unpublished do not display hidden aggregate.
- result visibility tiers and result display evaluator unchanged.
- creator session / ownership / lifecycle API unchanged.

### 6.5 `quality_badge`

- `QUALITY_FEEDBACK_BADGE_LABEL` remains「回饋良好」.
- Only `positive_feedback` renders; `null`, missing, or unexpected values do not render.
- Not used for ranking, recommendation, personalization, trust, score, creator score, or governance.
- No tooltip, debug, explanation, counts, score, rank, or hidden aggregate.

### 6.6 Storage and observability ban

- No `localStorage` / `sessionStorage`.
- No analytics / metrics / APM / debug tracking.
- No option choice + user/session/device/request/log/trace/metric/error linkage.

---

## 7. Explicit Non-Goals

Phase 266 must **not**:

| Non-goal | Reason |
|----------|--------|
| API / DB / backend / migration changes | Readiness checkpoint only |
| Auth / session / `UserAuthResolver` changes | Auth boundary |
| Vote transaction / eligibility evaluator changes | Vote integrity |
| vote-by-index eligibility-before-option-resolve changes | Vote integrity |
| Result visibility / result evaluator / lifecycle state machine changes | Result integrity |
| Creator ownership / lifecycle API changes | Creator boundary |
| Profile field expansion beyond `birth_year_month` / `residential_region` | Profile boundary |
| Registration auto-login, `Set-Cookie`, post-success `GET /users/me` | Auth boundary |
| Ranking / recommendation / personalization | MVP ranking rules |
| Trust / score / governance UI or copy expansion | MVP non-goals |
| `quality_badge` expansion beyond presentation-only `positive_feedback` → `回饋良好` | Governance boundary |
| `localStorage` / `sessionStorage` / analytics / APM / debug tracking | Privacy / observability ban |
| Option choice + user/session/device/request/log/trace/metric/error linkage | Raw Option Linkage Ban |
| Launch approval or production approval language | Checkpoint scope |
| `design-drafts/` commits | Out of repo delivery scope |
| Runtime/HTML/CSS/JS edits in Phase 266 | Docs/guards-only phase |

---

## 8. Focused Guard Tests

- `tests/frontend/phase-266-public-mvp-launch-readiness-checklist-checkpoint.test.ts`
- `tests/docs/phase-266-public-mvp-launch-readiness-checklist-checkpoint-doc.test.ts`

---

## 9. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 10. Conclusion

**APPROVED — readiness checklist established.**

Phase 266 consolidates the Phase 265 launch readiness plan into an operator-facing checklist covering public routes, demo/live consistency, registration→login→`/users/me`→profile prompt flow, Official Vote pre-vote UX, vote-by-index `{ option_index }` / eligibility-before-option-resolve, results visibility (collecting/cancelled/unpublished hidden aggregate), creator ownership/lifecycle, share-link/copy-feedback/keyboard-focus/reduced-motion/static-fallback copy, `quality_badge` presentation-only boundary, automated gates, and manual QA items.

**This is not launch approval. This is not production approval.** Passing this checkpoint means the readiness checklist and guard boundaries are documented and verified — not that the product is cleared for production launch.

If manual QA or smoke tests discover a runtime bug, privacy drift, or behavior regression, operators must open a **separate numbered phase** for the fix. Do not hide runtime fixes inside readiness checkpoint delivery.

**Phase 267 blockers: none identified.**

---

## 11. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 266 is a docs/guards-only readiness checkpoint. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
