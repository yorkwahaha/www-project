# WWW Project Phase 265 — Public MVP Launch Readiness Checklist Plan v1

**Status:** plan only. Phase 265 inventories public MVP launch readiness checks across frontend surfaces, copy/a11y polish, auth/account flows, vote/result visibility, creator lifecycle, smoke/integration gates, and manual QA — without implementing any runtime, HTML, CSS, JS, API, DB, schema, migration, auth, vote, result, creator, profile, or privacy behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 265.**

**Baseline:** `origin/master` after Phase 264 public help / FAQ copy milestone checkpoint (`f758805`).

**Prior checkpoint:** [Phase 264 public help / FAQ copy milestone checkpoint](./www-project-phase-264-public-help-faq-copy-milestone-checkpoint-v1.md).

**Related readiness context:**

- [Phase 170 public MVP showcase readiness milestone](./www-project-phase-170-public-mvp-showcase-readiness-milestone-v1.md) — earlier demo-safe page inventory
- [Phase 255 public presentation & accessibility polish milestone checkpoint](./www-project-phase-255-public-presentation-accessibility-polish-milestone-checkpoint-v1.md) — presentation/a11y arc complete
- [Phase 264 public help / FAQ copy milestone checkpoint](./www-project-phase-264-public-help-faq-copy-milestone-checkpoint-v1.md) — copy/static shell/runtime copy arc complete

---

## 1. Plan Purpose

Phase 265 is **plan only**. It defines a **launch readiness checklist** for the public MVP before any operator or stakeholder treats the surface as launch-ready.

This plan answers:

1. Which public pages and flows must be verified before launch.
2. Which automated gates (`npm test`, `npm run build`, `npm run migrate:check`, `npm run smoke:public:local`, optional `npm run test:integration:local`) should pass.
3. Which privacy, vote, result, auth, creator, and `quality_badge` boundaries must remain fixed during launch prep.
4. Which items still require **manual browser QA** even when automated guards pass.
5. What Phase 266 may execute without changing product behavior.

Phase 265 does **not** approve launch. Phase 265 does **not** approve Phase 266 implementation automatically.

---

## 2. Public MVP Surface Inventory

### 2.1 Public page navigation checklist

| Route | Shell | Primary runtime module | Launch readiness focus |
|-------|-------|------------------------|------------------------|
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

| Step | Expected behavior | Launch check |
|------|-------------------|--------------|
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

| Area | Fixed boundary | Launch check |
|------|----------------|--------------|
| Pre-vote hints | `official-vote-pre-vote-hints.js` / vote page hints | anonymous → login guidance; incomplete profile → neutral prompt |
| Vote-time authority | backend eligibility-before-option-resolve | frontend must not disclose pass/fail outcome pre-submit |
| Submit body | `{ option_index }` only | no `option_id` in request |
| Failure copy | neutral frontend messages | no backend/internal code echo |

- [ ] Pre-vote hints do not say「你符合資格」or「你不符合資格」
- [ ] Vote submit still posts `{ option_index }` only
- [ ] Duplicate vote / token errors use safe frontend copy

### 2.5 Vote integrity checklist

| Rule | Launch check |
|------|--------------|
| vote-by-index body `{ option_index }` only | automated guard + smoke |
| eligibility-before-option-resolve in Official Vote transaction | backend source order guard |
| vote token + counter in same DB transaction | unchanged by public MVP phases |
| Raw Option Linkage Ban | no user-option durable linkage in logs/metrics |

### 2.6 Results visibility checklist

| Lifecycle state | Public display rule | Launch check |
|-----------------|---------------------|--------------|
| collecting | no counters, percentages, ranks, hidden aggregate | vote/results UI + API display-safe |
| cancelled | unavailable / no option breakdown | result page mode |
| unpublished | unavailable / no option breakdown | result page mode |
| revealed / locked / post_lock | display-safe aggregate only | tier rules unchanged |

- [ ] collecting mode hides `result-percentage` and raw counters
- [ ] public results JSON does not expose shard internals or vote tokens
- [ ] results intro copy does not promise real-time precision beyond tier rules

### 2.7 Creator my-polls / create-poll / lifecycle ownership checklist

| Area | Launch check |
|------|--------------|
| `POST /creator/session` | local/demo/test creator cookie only |
| `GET /creator/polls` | owned list; counter-free |
| `POST /creator/polls` | create payload unchanged |
| lifecycle actions | confirm + `postPollLifecycleTransition`; cancel/close/unpublish semantics fixed |
| ownership | creator cannot edit published poll content post-publish |

- [ ] my-polls live mode shows lifecycle actions with destructive separation
- [ ] create-poll submit payload unchanged (`title`, `description`, `options`, `category`, `eligible_rule_id`, `closes_at`, `publish`)
- [ ] creator copy does not expose ownership internals or vote counters

### 2.8 Presentation / a11y / copy polish checklist (Phase 239–264)

| Category | Delivered by | Launch check |
|----------|--------------|--------------|
| Layout hierarchy helpers | Phase 239–245 | regions render; no fetch in layout helpers |
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

| Rule | Launch check |
|------|--------------|
| `positive_feedback` →「回饋良好」only | badge module guard |
| null/missing/unexpected silent | no render |
| not used for ranking/recommendation/personalization/trust/score/governance | source guards |
| no tooltip/debug/explanation/counts/score/rank | UI inspection |
| no hidden aggregate display | results/vote pages |

---

## 3. Automated Readiness Gates

### 3.1 Required before launch sign-off

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
```

### 3.2 Strongly recommended when environment allows

```bash
npm run smoke:public:local
npm run test:integration:local
```

| Gate | What it proves | Limitation |
|------|----------------|------------|
| `npm test` | unit/guard coverage across vote, auth, copy, presentation boundaries | DB-free; not full browser UX |
| `npm run build` | TypeScript compile succeeds | not deployment config |
| `npm run migrate:check` | migration files valid | does not prove production DB state |
| `npm run smoke:public:local` | HTTP flow `/` → registration/login → creator create → vote → results | requires Docker `www_test`; not visual QA |
| `npm run test:integration:local` | PostgreSQL integration paths on isolated `www_test` | manual/local operator setup |

Phase 265 itself intentionally does **not** require `npm run smoke:public:local` because no runtime behavior changed.

---

## 4. Manual QA Still Required Before Launch

Automated guards do **not** replace human verification. Launch operators should still manually check:

| Manual QA area | Why automation is insufficient |
|----------------|--------------------------------|
| Mobile viewport layout | CSS rhythm and tap targets across pages |
| Keyboard-only navigation | tab order through forms, share rows, lifecycle confirms |
| Screen reader spot-check | aria-live copy feedback, status regions, form labels |
| BFCache / back-forward | Reference Answer runtime memory rules on vote flow (if exercised) |
| Real browser cookie/session | login persistence and logout clearing across tabs |
| Copy scan for product promises | eligibility hedging, demo/live boundaries, collecting hidden |
| Creator lifecycle destructive confirms | cancel/close/unpublish wording and accidental-click safety |
| Error state readability | load failures, network errors, unavailable polls |
| Production environment config | `DATABASE_URL`, secrets, TLS, reverse proxy — out of repo scope |
| Operator runbook | scheduler lifecycle batch, admin correction routes — separate from public MVP |

**Manual QA artifact recommendation for Phase 266 (optional):** a single markdown operator checklist or canvas artifact referencing Section 2 items — still **no runtime change**.

---

## 5. Phase 266 Execution Directions

Phase 266, if approved, should choose **one** of these plan-only-safe execution modes:

### Option A — Launch readiness checklist checkpoint (recommended default)

- **docs + guard tests only**
- consolidate Section 2 checklist into an APPROVED milestone/checkpoint doc
- add guard tests proving protected boundaries remain fixed
- **no** HTML/CSS/JS/API/DB changes unless a clear regression is found and spun out

### Option B — Minimal public QA checklist artifact

- **docs + optional static QA artifact only** (e.g. operator markdown checklist)
- may reference routes, expected copy, and manual steps
- **no** runtime, handler, API, or schema changes

### Option C — Runtime fix (explicitly out of Phase 266 default scope)

- if launch prep discovers a **behavior bug** or **privacy drift**, open a **separate numbered phase**
- do **not** hide runtime fixes inside readiness checklist delivery
- examples requiring separate phases: vote payload change, registration auto-login, result tier change, new tracking/storage

Phase 265 does **not** approve Option A or B automatically.

---

## 6. Explicit Non-Goals

Phase 265 and any future Phase 266 readiness checkpoint must **not**:

| Non-goal | Reason |
|----------|--------|
| API / DB / backend / migration changes | Readiness planning only |
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
| New product promises or guaranteed vote eligibility copy | Launch honesty boundary |
| `design-drafts/` commits | Out of repo delivery scope |
| Runtime/HTML/CSS/JS edits in Phase 265 | Plan-only phase |

---

## 7. Fixed Boundaries (Unchanged)

### 7.1 vote-by-index

- Request body remains `{ option_index }` only.
- Official Vote transaction order: eligibility check → option resolve → vote token write → counter increment.

### 7.2 Registration / `/users/me`

- Registration submits to `/registration` only; no auto-login; no `GET /users/me` after success (registration does not call `GET /users/me` after success).
- `/users/me` returns only `user_id` and `display_name`.

### 7.3 `quality_badge`

- `QUALITY_FEEDBACK_BADGE_LABEL` remains「回饋良好」.
- Only `positive_feedback` renders; `null`, missing, or unexpected values do not render.
- Not used for ranking, recommendation, personalization, trust, score, creator score, or governance.
- No tooltip, debug, explanation, counts, score, rank, or hidden aggregate.

### 7.4 Raw Option Linkage Ban

- Launch readiness work must not introduce durable or observability linkage of option choice to user, session, device, request, or traceable identifier.

---

## 8. Suggested Guard Tests for Future Phase 266

Future Phase 266 should add:

- `tests/frontend/phase-266-public-mvp-launch-readiness-checklist-checkpoint.test.ts` (if Option A)
- `tests/docs/phase-266-public-mvp-launch-readiness-checklist-checkpoint-doc.test.ts`

Suggested assertions:

1. Section 2 checklist items documented with APPROVED or explicit open items.
2. `public-page-copy.js` remains constants-only / side-effect-free.
3. Homepage runtime copy free of `creator_session` / `X-User-Id`.
4. P0/P1 static shells free of stale engineer/misleading copy.
5. vote-by-index body `{ option_index }` only.
6. registration does not call `GET /users/me` after success.
7. protected backend/migrations free of Phase 266 markers unless a separate runtime phase occurred.

Phase 265 guard tests (this phase):

- `tests/docs/phase-265-public-mvp-launch-readiness-checklist-plan-doc.test.ts`
- `tests/frontend/phase-265-public-mvp-launch-readiness-checklist-plan.test.ts`

---

## 9. Phase Conclusion

**Phase 265 is plan-only.** No runtime, HTML, CSS, JS, API, DB, auth, vote, result, creator, profile, or privacy behavior changes are delivered in this phase.

**Phase 266**, if executed, may deliver a **launch readiness checklist checkpoint** (Option A) or a **minimal public QA checklist artifact** (Option B) per Section 5 — still without mixing in undeclared runtime fixes.

Phase 265 does **not** approve launch. Phase 265 does **not** approve Phase 266 implementation automatically.

---

## 10. Validation Checklist (Phase 265)

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
```

Phase 265 intentionally does **not** require `npm run smoke:public:local` because no runtime behavior changed.

---

## 11. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 265 is plan documentation and guard tests only. No migration, schema DDL, runtime, API, DB, HTML, CSS, or frontend behavior changes.
