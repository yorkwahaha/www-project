# WWW Project Phase 196 — Public MVP Post-Quality-Badge UX Polish Plan v1

**Status:** plan only. Phase 196 plans small, safe future public MVP UX polish after Phase 177–195 quality feedback and `quality_badge` presentation governance closure, without implementing any runtime, API, DB, schema, migration, auth, vote, result visibility, eligibility, or `quality_badge` behavior change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-option-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 196.**

**Baseline:** `origin/master` after Phase 195 quality feedback / badge governance closure checkpoint (`19ed567`).

**Prior checkpoint:** [Phase 195 Quality feedback / badge governance closure checkpoint](./www-project-phase-195-quality-feedback-badge-governance-closure-checkpoint-v1.md).

**Related milestones:**

- [Phase 193 Quality badge presentation milestone checkpoint](./www-project-phase-193-quality-badge-presentation-milestone-checkpoint-v1.md)
- [Phase 155 Public page intro / lead paragraph consistency polish](./www-project-phase-155-public-page-intro-lead-paragraph-consistency-polish-v1.md)

---

## 1. Plan Purpose

Phase 196 is **plan only**. It identifies low-risk, copy/layout/navigation polish candidates across the public MVP surfaces now that quality badge presentation is complete on `/explore`, `/vote/:pollId`, and `/results/:pollId`.

This plan answers:

1. Which public surfaces may receive future small UX polish without reopening quality-badge governance.
2. Which polish categories are safe (hierarchy, spacing, neutral copy, CTA wording, mobile readability).
3. Which polish categories are forbidden (ranking, trust/score, eligibility disclosure, result counter leakage, `quality_badge` expansion).
4. What explicit non-goals and review gates apply before any runtime phase.

Phase 196 does **not** approve implementation. Future polish runtime requires a separately approved phase and review checkpoint.

---

## 2. Scope

### 2.1 In scope (planning only)

Public MVP surfaces that may receive future **small, safe** polish:

| Surface | Current role | Future polish may touch |
|---------|--------------|-------------------------|
| `/` (homepage) | Entry, navigation, profile-completion prompt hook | Page title/subtitle hierarchy, lead copy consistency, nav clarity |
| `/explore` | Freshness-only feed + `quality_badge` chip when `positive_feedback` | Title hierarchy, badge row spacing near card title, empty/loading/error copy, mobile readability |
| `/vote/:pollId` | Poll detail, vote CTA, post-vote feedback, badge near `#poll-title` | Title/badge placement consistency, CTA wording, loading/error copy, pre-vote hint alignment |
| `/results/:pollId` | Display-safe results, badge near `#page-title` | Title hierarchy, empty/unavailable copy, readonly intro consistency, mobile readability |
| `/login` | Production login shell | Title/subtitle hierarchy, neutral error copy, navigation back to registration/home |
| `/registration` | Registration shell (no auto-login) | Title/subtitle hierarchy, neutral success/failure copy, navigation to login |
| `/profile` | Profile setup (`birth_year_month`, `residential_region` only) | Title hierarchy, field label/placeholder consistency, navigation clarity |
| `/my-polls` | Creator-owned poll list | Page title hierarchy, empty/unavailable copy, CTA wording to create poll |

### 2.2 Out of scope (this plan phase)

- Runtime, API, DB, schema, migration implementation.
- `quality_badge` contract change, new badge values, or copy beyond **回饋良好**.
- Auth/session/login resolver changes.
- Vote transaction, vote-by-index, eligibility evaluator changes.
- Result visibility tier or result interpretation changes.
- Reference Answer integration changes.
- Ranking, recommendation ordering, personalization, hotness, trend.
- Quality score, trust score, creator score, reputation score.
- New privacy or eligibility rule disclosure in public copy.
- Raw vote counter, shard, token, or option-level count leakage in UI copy.
- `design-drafts/` commits.

---

## 3. Safe Future Polish Candidates

Future runtime polish (not in Phase 196) may consider only **small, reversible, frontend-owned** improvements:

### 3.1 Consistent page title / subtitle hierarchy

- Align `#page-title`, `#poll-title`, hero headings, and section headings with existing `PUBLIC_*` copy constants where shells already use centralized sync helpers (Phase 135–155 pattern).
- Keep API-driven poll titles on vote/results pages; polish surrounds titles only — do not rewrite poll semantic content.
- Avoid adding score-like subtitles or trust/eligibility implications.

### 3.2 Badge / copy placement consistency

- On `/explore`, `/vote/:pollId`, `/results/:pollId`: keep using shared `renderQualityFeedbackBadge()` / `mountQualityFeedbackBadgeNearTitle()` only.
- Future polish may adjust spacing, row class alignment, or visual rhythm of `mvp-quality-feedback-badge-row` — **not** badge semantics, gate logic, or label copy.
- **回饋良好** remains the only visible badge label. No second badge copy path.

### 3.3 Empty / loading / error copy consistency

- Unify neutral empty-state, loading, and error strings across explore, vote, results, my-polls, login, registration, profile using existing frontend-owned constants.
- No backend `message`, internal error code, stack trace, or payload echo.
- No eligibility pass/fail wording, age thresholds, or vote-guarantee language in polish copy.

### 3.4 CTA wording consistency

- Align primary/secondary button labels and link text (e.g. explore → vote, vote → results, registration → login) without changing CTA **behavior**, routes, or gating.
- Badge presence must **not** enable, disable, or reprioritize CTAs.

### 3.5 Mobile readability

- Spacing, line length, tap targets, and heading wrap on small viewports via `public-mvp.css` or surface modules.
- No new interactive panels, tooltips, or disclosure modals for quality feedback.

### 3.6 Profile / login / registration navigation clarity

- Clarify registration ≠ login, post-registration login path, and profile completion nudge copy without auto-redirect or auto-vote.
- Preserve `data-login-state-read` opt-outs on registration shell where applicable.
- No new profile fields or eligibility checks in polish handlers.

### 3.7 Homepage relevance

- Homepage polish limited to hero lead, section intros, and auth navigation labels already covered by Phase 125–155 patterns.
- Homepage must not surface `quality_badge`, feedback counts, or poll quality ranking.

---

## 4. Quality Badge & Governance Boundaries (Fixed — Do Not Polish Away)

Phase 196 reaffirms Phase 195 governance. Future polish must **not** weaken:

| Rule | Requirement |
|------|-------------|
| `quality_badge` role | Presentation-only chip — not ranking, recommendation, personalization, trust, score, governance, eligibility, visibility, or interpretation logic |
| Public API ceiling | `quality_badge: null \| "positive_feedback"` only |
| Visible label | **回饋良好** only |
| Null / missing / unexpected | completely not display badge |
| Forbidden UI | tooltip, debug, explanation, counts, score, rank, tag breakdown |
| Durable source | `poll_quality_feedback_aggregate` only; no durable badge table |
| Client storage | No `localStorage`, `sessionStorage`, or cookie for badge state |
| Feed ordering | Freshness-only; badge must not affect sort/filter |
| Raw Option Linkage Ban | Preserved |

No `quality_badge` expansion beyond **回饋良好** is planned or approved in Phase 196.

---

## 5. Privacy, Eligibility, and Result Display Rules

Future polish must **not** add:

- New privacy disclosures beyond existing neutral copy.
- Eligibility outcomes, age thresholds, or pass/fail hints beyond approved pre-vote neutral hints (Phase 106–107).
- Result counter leakage, raw percentages beyond display-safe API tiers, shard internals, vote tokens, or `option_id` in UI copy.
- Option/user/session/device/request/log/trace/metric/error/analytics linkage in polish handlers.

Official Vote transaction order, vote-by-index eligibility-before-option-resolve, Reference Answer, UserAuthResolver, result visibility tiers, and profile field ceiling remain unchanged.

---

## 6. Explicit Non-Goals

Phase 196 does **not** implement or approve:

| Non-goal | Status |
|----------|--------|
| DB / schema / migration | **Out of scope** |
| API changes | **Out of scope** |
| Auth / session changes | **Out of scope** |
| Vote transaction changes | **Out of scope** |
| Eligibility changes | **Out of scope** |
| Result visibility changes | **Out of scope** |
| Reference Answer changes | **Out of scope** |
| Ranking / recommendation / personalization | **Out of scope** |
| Quality score / trust score / creator score | **Out of scope** |
| Option/user/session/device/request/log/trace/metric/error linkage | **Forbidden** |
| `quality_badge` behavior changes | **Out of scope** |
| `design-drafts/` commits | **Excluded** |

**Plan/docs only.** No `src/`, `migrations/`, or `public/frontend/` runtime change in Phase 196.

---

## 7. Suggested Future Phase Sequence (Not Approved Here)

If polish runtime is desired later, recommended sequence:

1. **Phase 196-R (review checkpoint)** — review this plan against Phase 195 governance; approve a minimal runtime slice (e.g. one surface or one polish category).
2. **Phase 197+ (runtime)** — implement only the approved slice with focused guard tests; no scope creep into badge semantics, auth, vote, or results.

Each runtime slice must remain copy/layout/navigation only unless a separate governance phase explicitly approves more.

---

## 8. Guard Tests Added (Phase 196)

| Test file | Role |
|-----------|------|
| `tests/docs/phase-196-public-mvp-post-quality-badge-ux-polish-plan-doc.test.ts` | Doc + README index guard |

---

## 9. Validation

```bash
npm test
npm run typecheck
npm run build
```

Focused test:

- `tests/docs/phase-196-public-mvp-post-quality-badge-ux-polish-plan-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 10. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 196 is planning documentation and doc guards only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes. `quality_badge` remains presentation-only per Phase 195. Raw Option Linkage Ban preserved.
