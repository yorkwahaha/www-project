# WWW Project Phase 295 — Vote-page Error UX Evaluation Plan v1

**Status:** plan-only / evaluation-only — docs + guard tests + README index. Evaluates vote-page error UX scope for Phase 291 **BL-282-06** by inventorying current behavior, risks, allowed/forbidden copy boundaries, and future test needs — without implementing runtime, changing copy, adding API/DB/migration, or modifying vote transaction order.

**No runtime, API, DB, frontend behavior, migration, schema, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**This phase does not implement vote-page error UX changes. This phase does not modify `public/` or `src/` runtime. This phase does not deploy.**

**Baseline commit:** `62959e9` (`origin/master` after Phase 294 documentation archive / phase index maintenance).

**Prior context:**

- [Phase 110 vote UX error handling polish plan](./www-project-phase-110-vote-ux-error-handling-polish-plan-v1.md) — original scenario catalog
- [Phase 111 vote UX error handling runtime polish](./www-project-phase-111-vote-ux-error-handling-runtime-polish-v1.md) — current runtime baseline
- [Phase 112 vote UX runtime review checkpoint](./www-project-phase-112-vote-ux-error-handling-runtime-review-checkpoint-v1.md) — **APPROVED**; no runtime gap found
- [Phase 133 public participation / results flow milestone](./www-project-phase-133-public-participation-results-flow-milestone-review-checkpoint-v1.md) — vote/results boundaries
- [Phase 291 backlog reprioritization](./www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md) — **BL-282-06** candidate Phase 295

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts added; no production configuration changed.

---

## 1. Evaluation Purpose

Phase 295 answers:

1. What vote-page error UX surfaces exist today (docs + runtime inventory).
2. Which user-visible scenarios are in scope for **future** polish vs permanently forbidden.
3. What privacy/vote-integrity risks must gate any future implementation phase.
4. What guard tests a future runtime phase should add — without implementing them as behavior changes now.

**Implements BL-282-06 (plan-only gate).** Implementation requires a **separate numbered phase** after explicit privacy/vote-integrity review.

---

## 2. Current State Inventory (Read-Only)

### 2.1 Runtime modules (unchanged by Phase 295)

| Module | Role |
|--------|------|
| `public/frontend/vote-page.js` | Poll load, submit via `POST /polls/:id/vote-by-index`, lifecycle submit disable, success/error panels |
| `public/frontend/official-vote-pre-vote-hints.js` | Anonymous / incomplete-profile / neutral pre-submit hints only |
| `public/frontend/public-mvp-ui.js` | `GENERIC_VOTE_SUBMIT_FAILURE`, `VOTE_SUBMIT_TRANSPORT_FAILURE`, `messageForVoteSubmitFailure()`, lifecycle blocked messages |
| `public/vote.html` | Vote shell; static fallback aligned with Phase 289 neutral vote step copy |

### 2.2 Backend vote-by-index path (unchanged)

| Step | Behavior |
|------|----------|
| Route | `POST /polls/:pollId/vote-by-index` body `{ option_index }` only |
| Order | eligibility checks → poll participation → profile eligibility → **then** option resolve |
| Duplicate | `OFFICIAL_VOTE_DUPLICATE` (409) via vote-token unique constraint |
| Ineligible user/profile | `PollForbiddenError` → 403, shared `OFFICIAL_VOTE_ELIGIBILITY_MESSAGE` |
| Invalid `option_index` | `PollValidationError` → 400, `INVALID_OFFICIAL_VOTE_OPTION_MESSAGE` (after eligibility passes) |

**Evaluation note:** Frontend maps **all** non-OK submit responses to `GENERIC_VOTE_SUBMIT_FAILURE` (Phase 111/112). Backend HTTP status/body may still differ in network tools — future phases must not re-expose this distinction in UI, logs tied to users, or analytics.

### 2.3 Existing docs and guard tests

| Artifact | Coverage |
|----------|----------|
| Phase 110 plan | Full scenario catalog and copy recommendations |
| Phase 111 runtime | Implemented neutral buckets |
| Phase 112 checkpoint | Runtime review **PASS**; guards on success copy, submit bucketing, transport isolation, lifecycle block, missing selection, page-local clearing, pre-vote hints |
| Phase 268 runbook §3.4–3.5 | Manual QA: pre-vote neutrality, `{ option_index }` only |
| Phase 292 follow-up | **PASS** on vote pre-vote neutral hints |

---

## 3. Scenario Evaluation Matrix

Result vocabulary for **future** implementation tracking: **ALLOWED (with constraints)** / **FORBIDDEN (user-visible)** / **ALREADY COVERED**.

| # | Scenario | Phase | User-visible today | Leakage risk | Evaluation |
|---|----------|-------|-------------------|--------------|------------|
| S-1 | Not signed in (pre-submit) | Pre-vote | Anonymous hint + `/login` link | Low | **ALREADY COVERED** — `official-vote-pre-vote-hints.js` |
| S-2 | Profile incomplete (pre-submit) | Pre-vote | Incomplete-profile hint + `/profile` link | Low | **ALREADY COVERED** — null-check only on `birth_year_month` / `residential_region` |
| S-3 | Profile complete, eligibility unknown (pre-submit) | Pre-vote | Neutral submit-time reminder | Low | **ALREADY COVERED** — no pass/fail disclosure |
| S-4 | Profile ineligible at vote time | Submit | Generic submit failure bucket | **High** if branched | **ALREADY COVERED** — must stay in generic bucket; **FORBIDDEN** to say「不符合資格」or rule detail |
| S-5 | Trust/role ineligible | Submit | Generic submit failure bucket | **High** | **ALREADY COVERED** — same bucket as S-4 |
| S-6 | Poll collecting | Load + submit | Vote UI enabled when lifecycle allows | Low | **ALREADY COVERED** |
| S-7 | Poll closed / past deadline | Load | Lifecycle blocked message; submit disabled | Medium | **ALREADY COVERED** — lifecycle-only copy OK |
| S-8 | Poll cancelled / unpublished | Load | Unavailable / not found style messages | Medium | **ALREADY COVERED** — no option breakdown |
| S-9 | Poll locked / revealed / post_lock (no longer votable) | Load | Lifecycle blocked; optional results link | Medium | **ALREADY COVERED** — no hidden aggregate on vote page |
| S-10 | Invalid poll id (route or API) | Load | Route invalid-id / unavailable copy | Low | **ALREADY COVERED** |
| S-11 | Invalid `option_index` (server, after eligibility) | Submit | Generic submit failure bucket | **Critical** | **ALREADY COVERED** on UI — **FORBIDDEN** to distinguish from S-4 in user-visible copy |
| S-12 | Malformed body / negative index (client) | Submit | `請先選擇一個選項。` before API | Low | **ALREADY COVERED** — client-only |
| S-13 | Network / transport failure | Load or submit | Neutral retry copy | Low | **ALREADY COVERED** |
| S-14 | Server 5xx / unexpected API | Load or submit | Neutral failure; no payload echo | Medium | **ALREADY COVERED** via `resolvePublicErrorUserMessage` allowlists (Phase 135) |
| S-15 | Duplicate vote / vote token exists | Submit | Generic submit failure bucket | **High** if specific | **ALREADY COVERED** — **FORBIDDEN**「已投過票」if it enables option inference |
| S-16 | Results page while voting (cross-surface) | Results | Collecting hidden aggregate | **High** | **ALREADY COVERED** — result evaluator unchanged; evaluation only |

---

## 4. Must-Not-Leak Checklist

Any future vote-page error UX work **must not** user-visibly reveal:

| Prohibited disclosure | Applies to |
|-----------------------|------------|
| Whether a specific `option_index` exists on server | S-11 vs S-4 bucketing |
| User passes/fails specific eligibility rules (age, region, trust, role) | S-4, S-5 |
| `option_id`, vote token, shard, raw counter rows | All submit/load paths |
| Hidden aggregate / vote counts during collecting | Vote page + results cross-links |
| Prior vote choice or duplicate tied to option identity | S-15 |
| Durable option choice + user/session/device/request/log/trace/metric/error linkage | All paths (Raw Option Linkage Ban) |

**Pre-submit rule unchanged:** hints may mention login/profile preparation; they **must not** disclose eligibility outcome (Phase 268 V-1–V-4, Phase 292 **PASS**).

---

## 5. vote-by-index Boundary Confirmation

| Rule | Phase 295 evaluation |
|------|----------------------|
| `eligibility-before-option-resolve` | **Unchanged** — confirmed in `repository.ts` / `in-memory-repository.ts` `castOfficialVoteByIndex` |
| Request body `{ option_index }` only | **Unchanged** — `vote-page.js` `submitVoteByIndex` |
| Ineligible vs nonexistent index user-visible response | **Must remain indistinguishable** — frontend uses single `GENERIC_VOTE_SUBMIT_FAILURE`; future UI must not branch on 400 vs 403 vs 409 |
| No `option_id` in client submit or success UI | **Confirmed** Phase 112 guards |
| No option-level durable linkage | **Confirmed** page-local selection cleared on submit / `pagehide` / BFCache |

**Backend evaluation risk (document only):** Server may return different HTTP status codes (`400` invalid option vs `403` eligibility vs `409` duplicate). Phase 295 does **not** change this. Any future backend unification requires a **separate high-risk phase** with privacy review — not in scope for UX copy polish alone.

---

## 6. Safe Copy Classification (Future Implementation Guide)

When a future phase implements UX polish, user-visible copy should map to these **buckets only**:

| Bucket | Allowed use | Example direction (not changed in Phase 295) |
|--------|-------------|-----------------------------------------------|
| **public-safe generic failure** | Submit denial when reason must not leak | `目前無法完成這次投票。…` (existing `GENERIC_VOTE_SUBMIT_FAILURE`) |
| **login required** | Pre-submit anonymous hint only | Existing `PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT` |
| **profile required / profile incomplete** | Pre-submit incomplete-profile hint only | Existing incomplete-profile hint; no eligibility promise |
| **poll unavailable** | Load failure: not found, cancelled, unpublished | Lifecycle/load messages from `messageForPollLoadFailure` family |
| **vote unavailable** | Lifecycle block: closed, locked, revealed, not collecting | `messageForPollVotingBlocked()` — poll-state only |
| **retry later** | Transport / 5xx / unknown | `目前無法載入問卷，請稍後再試。` / `目前無法送出投票，請稍後再試。` |

**Forbidden copy classes (never user-visible):**

-「你符合資格」/「你不符合資格」/ age or region pass-fail
-「此選項不存在」/「無效的選項編號」as submit-failure distinguishers
-「你已投過票」when tied to option identity or enabling replay inference
- Backend `error` code echo (`PROFILE_INELIGIBLE`, `OFFICIAL_VOTE_DUPLICATE`, etc.)
- `option_id`, token, shard, counter internals

---

## 7. Risk Classification Summary

| Tier | Scenarios | Future action |
|------|-----------|---------------|
| **Critical — no user-visible distinction** | S-11 vs S-4/S-5 (invalid index vs ineligible); S-15 duplicate-specific copy | Any future phase: guard tests mandatory; no error-code branching in UI |
| **High — pre-submit vs submit confusion** | S-1–S-3 must not become submit-failure explainers | Keep hints in `official-vote-pre-vote-hints.js` separate from submit errors |
| **Medium — lifecycle specificity OK** | S-7–S-9 poll state messages | May refine lifecycle copy if poll-state-only and no option leakage |
| **Low — client / transport** | S-12 missing selection; S-13–S-14 transport | Minor copy polish allowed in future phase within existing allowlists |

---

## 8. Future Tests / Guards (Recommended — Not Implemented in Phase 295)

A future runtime implementation phase should add or extend:

| Guard | Intent |
|-------|--------|
| Submit failure never branches on `response.status` or parsed `error` in user-visible strings | Prevents 400/403/409 leakage via copy |
| Forbidden outcome regex (你符合資格 / 你不符合資格 / 已投過票 / option_id / shard_id) | Extends Phase 112 patterns |
| Pre-vote hints module has no import from submit-failure helpers | Separation of concerns |
| Success copy excludes option labels from selected radio value in DOM text export | Post-submit neutrality |
| No `localStorage` / `sessionStorage` for vote error state or last attempted `option_index` | Storage ban |
| No new `console.log` / analytics hooks with `{ option_index, userId, errorCode }` tuples | Observability ban |
| Manual QA runbook spot-check (Phase 268 §3.4–3.5) after any copy change | Operator regression |

Phase 295 adds **plan-level** doc/frontend guards only (this phase's test files) — not runtime behavior guards beyond documenting requirements.

---

## 9. Future Implementable vs Not Implementable

### 9.1 Potentially implementable (separate numbered phase, after review)

- Wording polish **within** existing safe buckets (generic failure, transport retry, lifecycle unavailable).
- Additional **guard tests** mirroring §8 without changing user-visible behavior.
- Manual QA checklist rows for vote error regression.
- Documentation cross-links from Phase 110 → future implementation record.

### 9.2 Not implementable without explicit high-risk approval

- User-visible copy branching on backend `error` codes or HTTP status.
- Distinct messages for duplicate vote vs eligibility vs invalid option.
- Pre-vote hints that disclose eligibility pass/fail.
- Exposing `option_id` or server option validity in any user-visible surface.
- Backend error-body unification (API change) bundled with casual copy polish.
- Analytics / APM / debug events on vote failures with `option_index` + user/session linkage.
- `localStorage` / `sessionStorage` for error retry or vote resume.
- Changes to Official Vote transaction order, eligibility evaluator, or `vote-by-index` resolve order.
- Changes to result visibility / hidden aggregate rules.
- Changes to `UserAuthResolver`, registration/login/session, or profile schema.

---

## 10. Explicit Non-Goals (Phase 295)

Phase 295 must **not**:

| Non-goal | Reason |
|----------|--------|
| Implement runtime or copy changes | Plan-only phase |
| Change vote transaction order | Vote integrity |
| Change `vote-by-index` or eligibility-before-option-resolve | Vote integrity |
| Change result visibility / result evaluator / lifecycle state machine | Result integrity |
| Change eligibility evaluator | Governance / privacy |
| Add API / DB / migration | Out of scope |
| Add analytics / metrics / APM / debug tracking | Raw Option Linkage Ban |
| Add `localStorage` / `sessionStorage` | Privacy ban |
| Add deploy scripts or change production configuration | Release boundary |
| Claim deployment executed or formal launch completed | Status accuracy |
| Modify `quality_badge` | Presentation boundary unchanged |

---

## 11. Files Touched

| File | Change |
|------|--------|
| `docs/www-project-phase-295-vote-page-error-ux-evaluation-plan-v1.md` | this document |
| `tests/docs/phase-295-vote-page-error-ux-evaluation-plan-doc.test.ts` | doc tests |
| `tests/frontend/phase-295-vote-page-error-ux-evaluation-plan.test.ts` | plan-only guards |
| `README.md` | Phase 295 index |

Phase 295 itself is **plan-only**:

- **no runtime change**
- **no API change**
- **no frontend behavior change**
- **no migration**

**No `public/`, `src/`, or migration changes.**

`design-drafts/` excluded from commit.

---

## 12. Fixed Boundaries (Unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- collecting / cancelled / unpublished hidden aggregate unchanged
- `UserAuthResolver` unchanged
- registration: no auto-login; no `Set-Cookie`; does not call `GET /users/me` after success
- `/users/me`: `user_id` / `display_name` only
- profile: `birth_year_month` / `residential_region` only
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; presentation-only
- actual deployment **NOT EXECUTED**; formal launch **NOT COMPLETED**; no deploy scripts; no production configuration change
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 13. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 14. Conclusion

**Vote-page error UX evaluation plan recorded — BL-282-06 plan-only gate complete.**

Current runtime (Phase 111/112) already implements neutral submit bucketing and pre-vote hint separation. Future UX polish is **deferred** to a separate numbered implementation phase after privacy/vote-integrity review. Phase 295 does **not** change copy or runtime.

**Phase 296 blockers: none identified.**

---

## 15. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 295 is docs/guards/README only. No migration, schema DDL, API, DB, auth, vote-backend, lifecycle-backend, or result-evaluator behavior changes.
