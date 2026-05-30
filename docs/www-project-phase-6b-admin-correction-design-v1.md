# WWW Project — Phase 6B Admin Typo Correction / Dual-Admin Design (v1)

**Document path:** `docs/www-project-phase-6b-admin-correction-design-v1.md`  
**Status:** Design note (normative for Phase 6B implementation)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-milestone-phase-0-6a-handoff-v1.md`  
**Baseline:** `04c2aa5` (Phase 0–6A delivered; no admin governance code yet)

This document locks product and engineering decisions for **Admin Typo Correction** and **Dual-Admin Approval**. It does not replace the agent spec; where the spec is silent, follow this note for Phase 6B.

---

## 1. Two correction paths

| Path | Poll status during review | Public visibility during review |
|------|---------------------------|--------------------------------|
| **Normal active typo correction** | **`active` unchanged** | Poll remains publicly readable per Phase 6A (`GET /polls/:id`, results, subject to archive/expiry rules). Users see **pre-correction** text until apply. |
| **Suspended correction** | May transition to **`correction_pending`** while correction is in flight | **Public-hidden** until apply completes successfully (see §2). |

**Apply outcome (normal):** Update allowed text fields only; poll stays `active` unless already `closed` / archived (archive does not block admin correction design; participation rules unchanged).

**Apply outcome (suspended):** Single transaction: content update, `correction_pending → active`, correction log, public notice (spec §19). Only when typo caused misleading violation appearance and Dual-Admin passes.

---

## 2. `correction_pending` and Phase 6A public-hidden rules

`correction_pending` is **already** in schema and visibility helpers. Phase 6B **does not relax** these rules.

While `polls.status = 'correction_pending'`:

| Surface | Behavior |
|---------|----------|
| `GET /polls/feed` | **Excluded** (not feed-eligible) |
| `GET /polls/:id` | **404** `POLL_NOT_FOUND` (no state leak) |
| `GET /polls/:id/results` | **404** `POLL_NOT_FOUND` |
| `POST /polls/:id/vote` | **404** `POLL_NOT_FOUND` |
| `POST /polls/:id/reference-answer` | **404** `POLL_NOT_FOUND` |

Implementation reference (unchanged in 6B.0): `src/polls/public-visibility.ts` (`isPublicHiddenPoll`), consumed by `PollService` and vote/reference paths.

**Reserved use:** Primarily **Suspended × Correction** and any flow that intentionally hides the poll until typo fix is applied. **Normal active** corrections must **not** set `correction_pending` during review (§1).

---

## 3. Admin identity separate from official voter trust

| Concept | Rule |
|---------|------|
| **`users.trust_level = 'official'`** | Eligibility for **Official Vote** only (`src/polls/trust.ts`). |
| **Admin permission** | **Not** implied by `official` or `low` trust. |
| **Future model** | Prefer **`admin_users`** (or equivalent) keyed to `users.id`, with explicit admin role/status. Admin APIs use **admin auth** distinct from `X-User-Id` voting headers. |

MVP must not conflate “can vote officially” with “can propose or approve typo correction.”

---

## 4. Typo correction scope

### Allowed targets

- `polls.title`, `polls.description`
- `poll_options.option_text` (identified by `poll_options.id` as `correction_target_id`)

Permitted change types: clear typo, punctuation, non-semantic whitespace, clear spelling mistake—text that does **not** change meaning, answer direction, category, eligibility, options set, or close time.

### Forbidden

- Semantic rewrite or answer-direction change
- Option add, remove, or reorder
- `category`, `closes_at`, `eligible_rule_id` change
- Any change to **vote tokens**, **sharded counters**, **result display tiers**, or **feed ranking** behavior
- Creator `PUT`/`PATCH` (remains 405); admin typo path is the only post-publish content correction

`correction_target_id` on `poll_options.id` is **poll structure metadata**, not user choice data (spec §5.8; Raw Option Linkage Ban unchanged).

---

## 5. Dual-admin invariants (MVP)

Required when spec / Spread Score / risk rules demand Dual-Admin (high Spread Score, high-risk correction, reported poll, suspended correction, high-sensitivity-related content—per spec §17).

| Invariant | Requirement |
|-----------|-------------|
| **Proposer cannot self-approve** | `requester_id` must not submit an approving decision on the same `poll_correction_request`. |
| **Independent decisions** | Two admins submit separately; each decision persisted (e.g. `admin_decision_logs`). |
| **Blind review** | Reviewer must **not** see another admin’s decision, reason, or classification **before** their own submission (API + UI). |
| **Disagreement → reject** | Divergent decisions (e.g. approve vs reject) → request **rejected**; no apply. |
| **No senior override** | No tie-break, sequential review, shared draft state, or auto-approval fallback in MVP. |

Review context API shape: spec §18 (`GET /admin/correction-requests/:id/review-context`).

---

## 6. Privacy and vote invariants (non-negotiable)

Phase 6B implementation must preserve:

1. **No durable user–option linkage** (AGENTS.md §3; spec §5.12).
2. **No** `vote_events`, `user_poll_option_links`, `poll_status_snapshot`, or equivalent tables.
3. **Correction may update display labels** (`title`, `description`, `option_text` → `GET /polls/:id` labels and result `display_label`) but **must not**:
   - insert/update/delete `poll_vote_tokens` or `poll_option_vote_counters` as part of correction apply
   - change result tier thresholds or aggregation logic
   - add answer-direction signals to `GET /polls/feed`
4. **Admin / governance logs** (`admin_decision_logs`, correction logs, diagnostics): must **not** store voter identity tied to `option_id`, raw vote/reference bodies, or reconstructable user+option pairs. `metadata_json` scrubbed per spec §5.10.

Existing logging scrubber patterns (`src/logging/scrubber.ts`) apply to any new admin diagnostic boundaries.

---

## 7. Phase 6B implementation plan

Sub-phases are sequential; each ends with targeted tests before the next expands scope.

| Phase | Scope | Definition of done (summary) |
|-------|--------|----------------------------|
| **6B.1** | Migration + schema guard only | Tables: `poll_correction_requests`, `poll_correction_logs`, `admin_decision_logs`, `public_notices`; `admin_users` (or agreed equivalent). No forbidden tables. `schema-guard` / `migrate:check` pass. |
| **6B.2** | Correction request + typo guard + Spread Score **stub** | Create request API/service; typo-only validation; lock/recompute Spread Score fields per spec; **no** apply, **no** dual-admin expose. |
| **6B.3** | Dual-admin decision flow | `review-context` + independent `decisions`; proposer blocked from approve; blind review; divergence reject; decision log retained. |
| **6B.4** | Apply transaction (**active** path) | Pre-apply guard, `valid_until`, correction log; update text only; poll stays `active`; no vote/feed side effects. |
| **6B.5** | **Suspended** correction + public notice | `suspended → correction_pending → active` in **one** DB transaction with log + notice; rollback on failure. |
| **6B.6** | HTTP integration, docs, handoff | Wire `/admin/*` routes; README/milestone; handoff doc; full governance test matrix. |

**Explicitly out of 6B:** creator edit grace period, senior review, AI semantic pre-review, ranking/personalization changes, archive write API.

---

## 8. Traceability

| Decision | Spec / AGENTS |
|----------|----------------|
| Two paths, `correction_pending` hidden | Spec §5.2, §19; 6A handoff §4; AGENTS.md §12 |
| Admin ≠ official trust | AGENTS.md §3 actors; spec §3 |
| Typo-only scope | Spec §15; AGENTS.md §9 |
| Dual-admin | Spec §17–18; AGENTS.md §11 |
| Privacy | AGENTS.md §3–6, §16; spec §5.12, §14 |

---

*End of Phase 6B design note v1.*
