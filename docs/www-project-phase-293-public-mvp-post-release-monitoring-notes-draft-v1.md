# WWW Project Phase 293 — Public MVP Post-Release Monitoring Notes Draft v1

**Status:** post-release monitoring notes draft only — docs + guard tests + README index. Prepares operator-facing smoke checklist and first-24-hour observation notes for use **after** W-1 operator release — without executing release, deployment, production configuration change, or any runtime/API/DB/auth/vote/result/lifecycle change.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This phase does not execute release. This phase does not deploy. This phase does not add deploy scripts. This phase does not change production configuration.**

**Actual deployment remains NOT EXECUTED. This is not formal launch.**

**Baseline commit:** `74914b4` (`origin/master` after Phase 292 manual QA follow-up execution record).

**Prior context:**

- [Phase 268 manual QA runbook / execution plan](./www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md)
- [Phase 270 manual QA execution record](./www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md) — overall **PASS**
- [Phase 271 manual QA pass review / freeze candidate checkpoint](./www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md) — freeze candidate confirmed
- [Phase 291 backlog reprioritization checkpoint](./www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md) — **BL-282-01** post-release monitoring draft candidate
- [Phase 292 manual QA follow-up execution record](./www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md) — overall **PASS**; **FU-292-01** / **FU-292-02** recorded

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; no deploy scripts added; no production configuration changed.

---

## 1. Draft Purpose

Phase 293 is **docs-only planning / support**. It answers:

1. What operators should observe in the **first 24 hours after W-1** (when separately executed and recorded).
2. Which public routes to include in a **post-release smoke checklist**.
3. Which **privacy, vote, result, auth, and `quality_badge` boundaries** must not regress during post-release observation.
4. How to **escalate or roll back** without inventing deploy scripts in this phase.

This draft **does not** fill in live deployment outcomes. Operators use it **after** a separately executed W-1 release phase.

**Implements Phase 291 candidate BL-282-01 (pre-W-1 draft).**

---

## 2. Explicit Non-Execution Boundaries

| Boundary | Phase 293 status |
|----------|------------------|
| Release execution | **NOT EXECUTED** |
| Deployment | **NOT EXECUTED** |
| Formal launch | **NOT COMPLETED** |
| Deploy scripts added | **NO** |
| Production configuration changed | **NO** |
| Runtime / API / DB / migration change | **NO** |
| Analytics / metrics / APM / debug tracking added | **NO** |

---

## 3. Pre-Smoke Automated Gates (Reference)

Run on the **deployed release candidate SHA** before or alongside post-release smoke (same gate set as Phase 268 / 292):

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

Automated gates reduce false alarms but **do not replace** operator browser smoke after W-1.

---

## 4. First 24 Hours — Suggested Observation Items

Use this as an operator log template after W-1. Record **PASS / FAIL / BLOCKED / NEEDS FOLLOW-UP** per item.

| Window | Observation | Expected | Record |
|--------|-------------|----------|--------|
| T+0–15m | Deployment health | App serves HTTP; no crash loop; migrations applied if required | |
| T+0–15m | Pre-smoke gates | Section 3 commands **PASS** on candidate SHA | |
| T+0–30m | P0 route smoke | Section 5 routes load without JS fatal error | |
| T+0–1h | Auth path | Registration → login → `/users/me` → logout per Section 6 | |
| T+0–1h | Vote path sanity | Demo or safe live poll: `{ option_index }` only; neutral pre-vote copy | |
| T+0–1h | Results collecting | No hidden aggregate on collecting poll | |
| T+0–4h | Error-rate spot-check | No spike in 5xx on public routes (operator infra view only — **no new APM**) | |
| T+0–4h | Privacy spot-check | No new client storage / analytics scripts observed | |
| T+0–24h | Repeat P0 smoke | Section 5 checklist at least once more | |
| T+0–24h | **FU-292-01** optional | Mobile ~375px layout spot-check on `/`, `/login`, `/explore` | |
| T+0–24h | Incident log | Any **FAIL** on privacy/vote/auth/result boundaries → separate numbered phase | |

**Observation notes must not** record durable user-option linkage (no logging selected `option_index` tied to operator identity in shared trackers).

---

## 5. Post-Release Smoke Check — Page List

| Priority | Route | Smoke intent |
|----------|-------|--------------|
| P0 | `/` | Home loads; nav links; account-flow note; no engineer tokens |
| P0 | `/registration` | Form loads; success copy; no auto-login |
| P0 | `/login` | Form loads; Phase 287 account-flow card |
| P0 | `/profile` | Profile form; neutral eligibility hedging |
| P0 | `/explore` | Feed shell; Phase 285 empty state if no polls |
| P0 | `/faq` | Phase 289 banner; vote-step neutral copy |
| P0 | `/vote/demo` | Pre-vote neutral hints; index labels |
| P0 | `/results/demo` | Collecting mode; no counters |
| P1 | `/my-polls` | Demo dashboard copy |
| P1 | `/my-polls?live=1` | Creator empty state (Phase 288) when no owned polls |
| P1 | `/polls/new` | Demo vs `?live=1` guidance |
| P1 | `/trust-levels` | Policy shell; no live trust score UI |
| P2 | `/vote/:pollId` | Live vote path when safe test poll exists |
| P2 | `/results/:pollId` | Lifecycle tiers; display-safe only when revealed |

**Result vocabulary:** **PASS** / **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP** only.

---

## 6. Login / Registration / Profile — Basic Checks

Aligned with Phase 268 §3.2–3.3 and Phase 292 **PASS** results.

| ID | Route | Check | Expected |
|----|-------|-------|----------|
| A-1 | `/registration` | Submit valid registration | `POST /registration` only; success says no auto-login |
| A-2 | `/registration` | Network: no `Set-Cookie` | No session cookie on registration response |
| A-3 | `/registration` | Network: no post-success `/users/me` | Registration does not call `GET /users/me` after success |
| A-4 | `/login` | Log in with new account | `POST /login/session` issues session separately |
| A-5 | `/` | Header after login | Shows `display_name` |
| A-6 | `/users/me` | Identity fields | `user_id` + `display_name` only |
| A-7 | `/` | Logout | Session cleared; anonymous chrome |
| P-1 | `/profile` | Form fields | `birth_year_month` / `residential_region` only |
| P-2 | `/users/me` | No profile fields | Still `user_id` + `display_name` only |
| P-3 | `/profile`, `/login` | Copy | No eligibility guarantee (不表示可保證符合或不符合) |
| P-4 | `/login` | Account-flow card | 不會自動登入；也不會建立瀏覽器工作階段；頁首才會顯示帳號名稱 |

---

## 7. Explore / My-Polls / Vote Demo / Results Demo / FAQ — Basic Checks

Aligned with Phase 268 §3.4–3.8 and Phase 292 post-copy-polish **PASS**.

| ID | Route | Check | Expected |
|----|-------|-------|----------|
| E-1 | `/explore` | Feed copy | Freshness-only; Phase 285 empty: 目前沒有可瀏覽的公開問卷。 |
| C-1 | `/my-polls` | Demo mode | Mock dashboard copy |
| C-2 | `/my-polls?live=1` | Empty state | 目前還沒有你建立的問卷。; CTA 前往建立問卷（即時模式） |
| C-3 | `/polls/new` | Demo vs live | Distinct demo/`?live=1` guidance |
| V-1 | `/vote/demo` | Pre-submit UI | Neutral hints; 不代表一定可以完成投票; no eligibility pass/fail |
| V-2 | `/vote/:pollId` | Submit body | `{ option_index }` only |
| R-1 | `/results/demo` | Collecting | No vote counts / percentages / hidden aggregate |
| S-1 | `/faq` | Banner | 本產品尚未正式對外上線 |
| S-2 | `/faq` | Vote step | 不代表一定可以完成投票 |
| S-3 | `/faq`, `/explore` | `quality_badge` | `positive_feedback` → 回饋良好 only; null silent |

---

## 8. Result Hidden Aggregate Boundary

**Unchanged — observation only.**

| Lifecycle state | UI / API expectation | Smoke fail if |
|-----------------|----------------------|---------------|
| collecting | No counters, percentages, ranks, hidden aggregate | Any option breakdown visible |
| cancelled | Unavailable / no option breakdown | Counters or breakdown shown |
| unpublished | Unavailable / no option breakdown | Counters or breakdown shown |
| revealed / locked / post_lock | Display-safe aggregate per tier rules only | Raw shard internals, vote tokens, raw counter rows |

Operators inspect `/results/demo` and safe live `/results/:pollId` only. Do not change result evaluator or visibility tiers during smoke.

---

## 9. `quality_badge` Presentation-Only Boundary

**Unchanged — observation only.**

| Rule | Expected |
|------|----------|
| `positive_feedback` | Renders「回饋良好」only |
| `null` / missing / unexpected | Silent — no render |
| Not used for | Ranking, recommendation, personalization, trust score, creator score, governance |
| Must not add | Tooltip, debug, explanation, counts, score, rank, hidden aggregate |

Post-release smoke **FAIL** if badge copy expands or links to engagement/ranking signals.

---

## 10. Privacy / Integrity Observation Checklist

Cross-cutting checks during post-release smoke (Phase 268 §3.10).

| Check | Expected | Result |
|-------|----------|--------|
| No `localStorage` / `sessionStorage` for vote/reference memory | Pass | |
| No new analytics / metrics / APM / debug tracking on public pages | Pass | |
| No durable user-option linkage in UI/network during smoke | Pass | |
| Registration does not auto-login | Pass | |
| Vote submit uses `{ option_index }` only | Pass | |
| Results do not expose hidden aggregate when collecting/cancelled/unpublished | Pass | |
| `quality_badge` not used for ranking/recommendation/personalization/trust/score/governance | Pass | |
| Raw Option Linkage Ban preserved | Pass | |
| `UserAuthResolver` unchanged | Pass | |
| Official Vote transaction order unchanged | Pass | |
| eligibility-before-option-resolve unchanged | Pass | |

**FAIL** on any privacy, vote, auth, or result-visibility row → **stop-and-escalate**; open separate numbered fix phase — do not patch inside monitoring notes.

---

## 11. Rollback / Escalation Notes (Text Only)

**No deploy scripts added in Phase 293.** Operators follow environment-specific rollback procedures documented in [Phase 274 handoff](./www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md) and [Phase 275 templates](./www-project-phase-275-public-mvp-release-execution-record-template-final-operator-readiness-checkpoint-v1.md).

### 11.1 Escalation triggers (immediate)

| Trigger | Action |
|---------|--------|
| **FAIL** on registration no-auto-login / no Set-Cookie / no post-success `/users/me` | Record incident; consider rollback; separate fix phase |
| **FAIL** on vote `{ option_index }` only or pre-vote eligibility disclosure | Record incident; consider rollback; separate fix phase |
| **FAIL** on collecting hidden aggregate or raw counter exposure | Record incident; consider rollback; separate fix phase |
| **FAIL** on Raw Option Linkage Ban observation | Record incident; halt promotion; governance review |
| Sustained 5xx on P0 routes | Operator infra escalation per environment runbook |

### 11.2 Rollback decision record (template)

```text
Rollback decision ID:
Operator:
Date/time:
Release candidate SHA rolled back from:
Rollback target SHA:
Trigger (Section 11.1 row):
Smoke re-run result after rollback:
Operator sign-off:
```

### 11.3 Follow-up phase routing

| Outcome | Next step |
|---------|-----------|
| Cosmetic / **NEEDS FOLLOW-UP** only | Triage; optional presentation-only phase |
| Runtime bug **FAIL** | Separate numbered fix phase |
| Privacy / vote / result boundary **FAIL** | Separate numbered phase; no silent hotfix |
| **FU-292-01** mobile layout issue found | Optional operator spot-check; presentation-only phase if confirmed |
| **FU-292-02** dual copy drift | Docs/guards maintenance only — **no ad hoc constant merge** |

---

## 12. Phase 292 Follow-Up Carry-Forward

| ID | Item | Phase 293 treatment |
|----|------|---------------------|
| **FU-292-01** | H-4 mobile ~375px layout not independently measured in Phase 292 | Listed as **operator optional spot-check** in Section 4 (T+0–24h) and Section 11.3 |
| **FU-292-02** | **BL-286-02** dual copy sources (`public-page-copy.js` + `public-mvp-ui.js`) | **Maintain without merging constants** — docs/guards only; no ad hoc merge in post-release smoke |

---

## 13. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md` | this document |
| `tests/docs/phase-293-public-mvp-post-release-monitoring-notes-draft-doc.test.ts` | doc tests |
| `tests/frontend/phase-293-public-mvp-post-release-monitoring-notes-draft.test.ts` | guard tests |
| `README.md` | Phase 293 index |

**No `public/`, `src/`, or migration changes.**

Phase 293 itself is **draft only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**
- **no schema change**
- **no CSS/HTML/JS presentation changes**
- **no backend / auth / vote / result / creator / profile changes**

`design-drafts/` excluded from commit.

---

## 14. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- profile: `birth_year_month` / `residential_region` only
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only
- actual deployment **NOT EXECUTED**; no deploy scripts; no production configuration change
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 15. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 16. Conclusion

**Post-release monitoring notes draft recorded — for operator use after W-1 only.**

This phase does **not** execute release, deployment, or formal launch. Actual deployment remains **NOT EXECUTED**.

**Phase 294 blockers: none identified.**

---

## 17. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 293 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
