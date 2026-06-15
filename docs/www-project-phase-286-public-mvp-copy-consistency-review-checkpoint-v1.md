# WWW Project Phase 286 — Public MVP Copy Consistency Review Checkpoint v1

**Status:** review checkpoint — docs, guard tests, and README index only. Implements Phase 282 backlog candidate **BL-282-02** (review public MVP copy consistency across home, explore, vote, results shells). Audits `PUBLIC_*` copy constants, static HTML fallbacks, and route-level presentation copy on `/`, `/explore`, `/login`, `/registration`, `/profile`, `/vote/:id`, `/results/:id`, `/my-polls`, and `/faq`.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline HEAD:** `c28a7cf` (`origin/master` after Phase 285 public explore feed empty-state copy polish).

**Backlog linkage:** [Phase 282 product backlog seed plan](./www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md) — **BL-282-02** (product polish candidates → public MVP copy consistency review).

**Prior delivery:** [Phase 285 public explore feed empty-state copy polish](./www-project-phase-285-public-explore-feed-empty-state-copy-polish-v1.md).

---

## 1. Review Purpose

Phase 286 confirms that public MVP presentation copy remains internally consistent across primary visitor routes after Phase 285, without widening scope into API, auth, vote, result, or lifecycle behavior.

Review dimensions:

1. **Registration** — clearly states no auto-login and no browser session creation.
2. **Login / profile prompts** — avoid eligibility guarantees; use neutral “may check at submit” wording.
3. **Vote pre-vote hints** — do not disclose eligibility outcomes before submit.
4. **Results** — collecting state does not render hidden aggregates (totals, percentages, counts).
5. **Explore empty state** — aligned with Phase 285 constants and `explore.html` static fallback.
6. **`quality_badge`** — `positive_feedback` only →「回饋良好」; presentation-only; not used for ranking/recommendation.

---

## 2. Surfaces Reviewed

| Route | Primary copy sources | Static fallback |
|-------|---------------------|-----------------|
| `/` | `public-page-copy.js`, `public-mvp-home.js`, `public-mvp-ui.js` | `index.html` |
| `/explore` | `public-mvp-ui.js`, `explore-page.js` | `explore.html` |
| `/login` | `public-page-copy.js`, `public-mvp-ui.js`, `login-page.js` | `login.html` |
| `/registration` | `public-page-copy.js`, `public-mvp-ui.js`, `registration-page.js` | `registration.html` |
| `/profile` | `public-page-copy.js`, `profile-page.js` | `profile.html` |
| `/vote/:id` | `public-page-copy.js`, `official-vote-pre-vote-hints.js`, `vote-page.js` | `vote.html` |
| `/results/:id` | `public-page-copy.js`, `result-page.js` | `results.html` |
| `/my-polls` | `public-page-copy.js`, `my-polls-page.js` | `my-polls.html` |
| `/faq` | `public-page-copy.js`, `faq-page.js` | `faq.html` |

---

## 3. Review Findings

### 3.1 Registration — no auto-login

| Check | Result |
|-------|--------|
| `PUBLIC_REGISTRATION_SUCCESS_MESSAGE` | States 註冊不會自動登入，也不會自動建立瀏覽器工作階段 |
| `registration.html` banner / lead / success message | Aligned with constants |
| `registration-page.js` | `POST /registration` only; no `GET /users/me`, no `Set-Cookie`, no `localStorage` |

**Pass.**

### 3.2 Login / profile — no eligibility promise

| Check | Result |
|-------|--------|
| `PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT` | 不表示可保證符合任何問卷資格 |
| `PUBLIC_PROFILE_PAGE_LEAD` / `PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE` | 不表示可保證符合或不符合 |
| `PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT` | 不代表你一定符合或不符合任何投票資格 |
| `profile.html` / `login.html` primary leads | Aligned |

**Pass.**

### 3.3 Vote pre-vote hints — no eligibility disclosure

| State | Copy behavior |
|-------|---------------|
| anonymous | 可能需要登入；不代表一定可以完成投票 |
| profile-incomplete | 可能在送出當下檢查欄位；不承諾符合/不符合 |
| profile-complete | 送出後當下判定；不承諾一定可以投票 |
| profile-load-failed | 同上；無內部錯誤 echo |

`official-vote-pre-vote-hints.js` uses `PUBLIC_VOTE_PRE_VOTE_*` from `public-mvp-ui.js` only. No `你符合資格` / `你不符合資格` / `已投過票` in vote runtime copy.

**Pass.**

### 3.4 Results — no hidden aggregate during collecting

`result-page.js` `resolveResultRenderMode()` returns `collecting` for collecting lifecycle; `renderResultDisplay()` calls `renderCollectingStatusBlock()` and option labels only — **does not** render `total_votes_display`, `display_percentage`, or `display_count` in collecting mode.

Static copy on `results.html` and `PUBLIC_RESULTS_COLLECTING_SUMMARY` consistently state 不顯示總票數、選項票數、百分比、排名或趨勢.

**Pass.**

### 3.5 Explore empty state — Phase 285 alignment

| Constant / surface | Value |
|--------------------|-------|
| `PUBLIC_EXPLORE_EMPTY_MESSAGE` | 目前沒有可瀏覽的公開問卷。 |
| `PUBLIC_EXPLORE_EMPTY_SUMMARY` | 請稍後再回來看看，或建立一則新問卷。 |
| `explore.html` `#explore-empty` | Matches runtime constants |
| CTA | `/polls/new?live=1` → 建立問卷 |

**Pass.**

### 3.6 `quality_badge` — positive_feedback only

`quality-feedback-badge.js`:

- `shouldRenderQualityFeedbackBadge()` — `quality_badge === 'positive_feedback'` only
- `QUALITY_FEEDBACK_BADGE_LABEL` — 回饋良好
- `explore-page.js` feed allowlist accepts `null` or `positive_feedback` only

Home and FAQ copy describe badge as feedback evaluation only, not score/rank/recommendation.

**Pass.**

---

## 4. Minor Non-Blocking Observations (Backlog Candidates)

No clear presentation copy **bug** requiring Phase 286 runtime fix.

| ID | Observation | Severity | Suggested next action |
|----|-------------|----------|----------------------|
| BL-286-01 | `login.html` account-flow value card omits「也不會建立瀏覽器工作階段」present in `PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY` | low | Optional presentation-only polish in a future phase |
| BL-286-02 | Dual copy sources (`public-page-copy.js` + `public-mvp-ui.js`) for overlapping leads | low | Docs/guard maintenance only unless consolidation explicitly approved |

---

## 5. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-286-public-mvp-copy-consistency-review-checkpoint-v1.md` | this document |
| `tests/frontend/phase-286-public-mvp-copy-consistency-review-checkpoint.test.ts` | guard tests |
| `tests/docs/phase-286-public-mvp-copy-consistency-review-checkpoint-doc.test.ts` | doc tests |
| `README.md` | Phase 286 index |

**No `public/`, `src/`, or migration changes.**

---

## 6. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` unchanged
- registration / `/users/me` / profile / creator session boundaries unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; not used for ranking/recommendation/personalization/trust/score/governance
- no hidden aggregate in collecting results or explore empty state
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 7. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 8. Conclusion

**APPROVED — Phase 286 public MVP copy consistency review checkpoint complete.**

All six review dimensions pass. No clear presentation copy bug identified; **no runtime changes** in this phase.

**Phase 287 blockers: none identified.**

---

## 9. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
