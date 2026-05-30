# WWW Project — Phase 0–5B Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-0-5b-handoff-v1.md`  
**Status:** Delivery record (non-normative)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`  
**Current HEAD:** `d424444` — `feat: add public freshness feed`

This document summarizes **completed implementation work through Phase 5B**. It does not change product architecture, privacy rules, or API contracts. For normative requirements, use `AGENTS.md` and the agent implementation spec only.

---

## 1. Purpose and source of truth

| Role | Document / artifact |
|------|---------------------|
| Non-negotiable agent rules | `/AGENTS.md` v0.2 |
| Engineering specification (schema, APIs, phases, validation) | `docs/www-project-agent-spec-v0.1.md` |
| **This handoff** | Milestone summary, mapping, audit anchors, residual risks |
| Operational quick start (not updated in this task) | `README.md` |
| Product baseline (read-only; do not edit in agent tasks) | `# WWW Project 企劃書第三版.txt` |

**Instruction priority** for future work remains: MVP principles and Raw Option Linkage Ban → user request → `AGENTS.md` → specs in `docs/` → conventions → general best practices.

---

## 2. Current repo / HEAD / validation status

### Git

| Item | Value |
|------|--------|
| **HEAD** | `d424444` — `feat: add public freshness feed` |
| Recent milestone commits | `f3d2081` frontend privacy closure · `e094a11` privacy-safe result display · `a47d025` poll/vote foundation · `ebd454e` poll core + Reference Answer B · `baa0137` Phase 0 foundation |

### Validation (recorded at handoff authoring)

| Command | Result |
|---------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm test` | **PASS** — 72 passed (16 test files) |
| `npm run migrate:check` | **PASS** — 4 migrations validated |
| `git diff --check` | **PASS** |

### Untracked (not part of this milestone; untouched)

- `# WWW Project 企劃書第三版.txt`
- `BrainStorm/`

---

## 3. Phase 0–5B milestone table

Implementation used **subphases** (e.g. 2.6, 3.5, 4.5, 5A, 5B) for hardening and scoped delivery. These names are **delivery labels**, not separate spec sections.

| Delivery label | Goal (summary) | Representative commit(s) | Audit / delivery status |
|----------------|----------------|----------------------------|-------------------------|
| **Phase 0** | Project foundation, `AGENTS.md`, agent spec in `docs/`, stack, migrations runner, Vitest, logging scrubber + tests | `baa0137` | **PASS** |
| **Phase 1** | Poll core: `users`, `polls`, `poll_options`; create/get/delete; zero-edit after publish | `871a7be`, `da34e61`, `ebd454e` | **PASS** |
| **Phase 2** | Reference Answer Design B (participation token only; no option persistence) | `ebd454e`, `da34e61` | **PASS** |
| **Phase 2.6** | Reference Answer hardening (routes, diagnostics scrubbing, tests) | (within foundation commits) | **PASS** |
| **Phase 3** | Official Vote: vote tokens, sharded aggregate counters, transactional vote path | `a47d025` | **Implemented** |
| **Phase 3.5** | Official Vote audit + minimal fixes (source guards, hardening tests) | `a47d025` + hardening tests | **PASS** |
| **Phase 4** | Display-safe result API and tiers | `e094a11` | **Implemented** |
| **Phase 4.5** | Result display hardening | `e094a11` | **PASS** |
| **Phase 5A** | Minimal frontend privacy closure (runtime memory, BFCache, static result page) | `f3d2081` | **PASS** |
| **Phase 5B** | Public **freshness-only** feed safe slice (`GET /polls/feed`) | `d424444` (HEAD) | **PASS** |

**Spec coverage note:** Agent spec **§32 Phase 5 (Wonder Flow / Ranking)** is **not fully complete**. Phase 5B delivers only the **public freshness-only feed** subset described in §9 below.

---

## 4. Implementation subphase ↔ spec §27–32 mapping

| Implementation subphase | Agent spec section | Spec phase name | Relationship |
|-------------------------|-------------------|-----------------|--------------|
| Phase 0 | §27 | Phase 0 — Project Foundation | **Aligned** — structure, migrations, scrubber, tests |
| Phase 1 | §28 | Phase 1 — Poll Core | **Aligned** |
| Phase 2, 2.6 | §29 | Phase 2 — Reference Answer | **Aligned** — Design B; 2.6 = hardening |
| Phase 3, 3.5 | §30 | Phase 3 — Official Vote | **Aligned** — 3.5 = audit/hardening |
| Phase 4, 4.5 | §31 | Phase 4 — Result Display | **Aligned** — 4.5 = hardening |
| Phase 5A | §29, §31 (partial) | Reference Answer + Result Display (frontend only) | **Supporting** — client-side privacy closure; not a spec section |
| Phase 5B | §32 (partial only) | Phase 5 — Wonder Flow / Ranking | **Partial** — freshness-only `GET /polls/feed` only |
| — | §33–36 | Phases 6–9 | **Not started** — see §11 |

**Critical statement:** **Spec Phase 5 is not fully complete.** Phase 5B implements only a **public freshness-only discovery feed** that does not use answer-direction signals. It does **not** implement full Wonder Flow, ranking complexity, Manipulation Integrity Warning integration in discovery, feed UI, personalization, analytics, or other §32 DoD items beyond that slice.

---

## 5. Delivered APIs

Stub authentication: mutating poll routes require header `X-User-Id` (UUID). Optional `X-Display-Name` on poll create.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |
| `POST` | `/polls` | Create draft or published poll |
| `GET` | `/polls/:id` | Poll detail (no vote/ranking leakage in detail shape) |
| `DELETE` | `/polls/:id` | Creator soft-delete |
| `POST` | `/polls/:id/reference-answer` | Record Reference Answer participation (Design B) |
| `POST` | `/polls/:id/vote` | Official Vote + aggregate shard increment |
| `GET` | `/polls/:id/results` | Display-safe aggregate Official Vote results |
| `GET` | `/polls/feed` | Public freshness-only discovery feed (Phase 5B) |
| `GET` | `/results/:id` | Public identity-neutral result HTML shell |
| `GET` | `/frontend/result-page.js` | Result page script (static) |
| `GET` | `/frontend/submission-privacy.js` | Submission privacy controller (static) |
| `PUT` / `PATCH` | `/polls`, `/polls/*` | `405` — creator zero-edit after publish |

**Phase 5B feed constraints (as implemented):**

- No query parameters (`?…` → `400 UNSUPPORTED_QUERY_PARAMS`).
- Response identity-neutral (same payload regardless of `X-User-Id` if sent).
- No option lists, vote counts, percentages, shards, tokens, or exact `published_at` in feed JSON.

---

## 6. Delivered migrations / tables summary

### Migrations (4 files, validated by `npm run migrate:check`)

| File | Scope |
|------|--------|
| `001_phase0_schema_migrations.sql` | `schema_migrations` bootstrap |
| `002_phase1_poll_core.sql` | `users`, `polls`, `poll_options` |
| `003_phase2_reference_answer_tokens.sql` | `poll_reference_answer_tokens` |
| `004_phase3_official_vote.sql` | `poll_vote_tokens`, `poll_option_vote_counters` |

### Tables

| Table | Role |
|-------|------|
| `schema_migrations` | Migration versioning |
| `users` | Identity stub (`trust_level`, `status`) |
| `polls` | Poll metadata and lifecycle status |
| `poll_options` | Structural options (not per-user choice storage) |
| `poll_reference_answer_tokens` | Participation token only (`user_id` + `poll_id`); **no option columns** |
| `poll_vote_tokens` | Duplicate-vote prevention (`user_id` + `poll_id`); **no option columns** |
| `poll_option_vote_counters` | Aggregate sharded counts (`poll_id`, `option_id`, `shard_id`) — not user-linked |

### Explicitly not created (per spec / AGENTS)

- Append-only vote event log / raw vote event tables  
- `poll_status_snapshot`  
- Durable `user_id + poll_id + option_id` (or equivalent) linkage tables  
- Lv1 option-level durable counters  
- Phase 6+ admin / correction / dual-admin tables  

**Shard count:** `SHARD_COUNT = 8` (`src/polls/vote-config.ts`) — matches migration check `shard_id < 8`.

---

## 7. Privacy and integrity guarantees

Delivered behavior is intended to satisfy **AGENTS.md** v0.2 and agent spec v0.1 baseline (this section **describes** delivery; it does not add new rules).

### Three MVP principles (preserved in design)

1. No secret durable storage of user answer choices (Reference Answer: token only; Official Vote: aggregate shards + vote token without option on token row).  
2. Low-trust Reference Answer does not affect official results, heat, trending, homepage/ranking, or public charts.  
3. Pre-vote discovery feed uses **freshness-only** ordering (`published_at DESC`, `id ASC`); no answer-direction signals in `GET /polls/feed`.

### Raw Option Linkage Ban

- No table stores `user_id + poll_id + option_id` (or equivalent) durably.  
- Vote path increments aggregates inside a transaction with vote token creation; no append-only per-vote event log.  
- `shard_id` from server-side CSPRNG (`randomInt(0, SHARD_COUNT)`), not client-supplied.

### Reference Answer (Design B)

- Request may include `option_id` for validation during handling; backend persists **token only** (`poll_reference_answer_tokens`).  
- Diagnostics scrub request bodies before emission (`src/logging/scrubber.ts`, `safe-diagnostic.ts`).

### Result display

- Four display modes by aggregate total: collecting / bucketed_percentage / rounded_with_bucketed_votes / precise (thresholds in `src/polls/service.ts` — unchanged in this handoff).  
- Result API exposes `option_index` and display labels, not internal `option_id` or raw shard rows.

### Logging scrubber (Phase 0+)

- Functional scrubber with tests (`tests/logging/scrubber.test.ts`, `safe-diagnostic.test.ts`).  
- Forbidden keys include `option_id`, `option_text`, `selected_option_index`, raw bodies, snapshots, etc.

**Handoff self-check (delivery record):** At authoring time, no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records were introduced by this **docs-only** change. Existing code paths are designed to scrub option linkage before diagnostic emission; full production observability is not wired.

---

## 8. Frontend privacy closure summary (Phase 5A)

**Scope:** Minimal static assets under `public/` — not a full product UI.

| Asset | Role |
|-------|------|
| `public/frontend/submission-privacy.js` | Page-local runtime memory for selected option; clears on `pagehide` and BFCache `pageshow` (`event.persisted === true`); clears request payload after submit |
| `public/frontend/result-page.js` | Loads display-safe `/polls/:id/results`; renders tiers only |
| `public/results.html` | Result page shell |

**Constraints honored:**

- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, URL query persistence, or cross-session Reference Answer memory.  
- No feed page, auto-refresh, polling, WebSocket, or EventSource in this milestone.

---

## 9. Public feed safe-slice summary (Phase 5B)

**Endpoint:** `GET /polls/feed`

**Behavior:**

- Lists up to **50** polls: `status = 'active'`, `published_at IS NOT NULL`.  
- Order: `published_at DESC`, `id ASC` (deterministic freshness tie-break).  
- SQL is **polls-table only** — no joins to options, counters, tokens, or users.  
- Response fields: `poll_id`, `title`, `category`, `status`, `published_display` (`最近發布`), `result_page_url`.  
- Unaffected by Reference Answer, Official Vote, or counter distribution (covered by tests).

**Explicitly out of scope for 5B:**

- Frontend feed page  
- Query parameters, filters, personalization  
- Ranking by engagement, option percentages, vote growth, or Manipulation Integrity Warning  
- New migrations for feed  

---

## 10. Tests and validation summary

### Test inventory (72 tests, 16 files)

| Area | Files |
|------|--------|
| Logging / scrubber | `tests/logging/scrubber.test.ts`, `tests/logging/safe-diagnostic.test.ts` |
| Poll domain | `tests/polls/schema-guard.test.ts`, `poll-service.test.ts`, `official-vote.test.ts`, `official-vote-source-guard.test.ts`, `result-display.test.ts`, `public-feed.test.ts` |
| HTTP | `tests/http/poll-routes.test.ts`, `reference-answer-hardening.test.ts`, `official-vote-hardening.test.ts`, `result-routes.test.ts`, `frontend-page.test.ts`, `feed-routes.test.ts` |
| Frontend | `tests/frontend/submission-privacy.test.ts`, `tests/frontend/result-page.test.ts` |

### Privacy-relevant test themes

- Schema guards forbid forbidden tables/columns patterns  
- Reference Answer: no option persistence; BFCache / runtime clearing  
- Official Vote: transaction behavior, duplicate prevention, no user-option linkage in storage model  
- Results: tier thresholds, no raw counter / internal `option_id` exposure  
- Feed: freshness ordering, safe metadata only, identity-neutral HTTP, no query params, polls-only SQL guard  

---

## 11. Explicitly not implemented

Do **not** assume the following exist based on Phase 0–5B:

| Spec phase | Feature (not delivered) |
|------------|-------------------------|
| **§32 Phase 5 (remainder)** | Full Wonder Flow / ranking system, non-freshness signals, feed UI, ranking complexity tests beyond 5B slice |
| **§33 Phase 6** | Admin Typo Correction |
| **§34 Phase 7** | Dual-Admin Approval |
| **§35 Phase 8** | Suspended × Correction recovery |
| **§36 Phase 9** | High-sensitivity category guardrails (official launch) |
| **MVP non-goals** | Redis async counter, creator grace-period edit, append-only vote log, poll status snapshot, AI semantic pre-review, senior review, creator appeal, etc. (see AGENTS.md §14) |

Also not in repo at this milestone:

- Production-grade auth (stub `X-User-Id` only)  
- Admin APIs and governance tables  
- Frontend discovery/feed page  
- Real APM / metrics pipeline (in-process diagnostic sink only)  

---

## 12. Known residual risks / technical debt

| Item | Risk | Notes |
|------|------|--------|
| **README / package version drift** | Medium | `README.md` title/scope still centered on Phase 4; `package.json` version `0.1.0-phase3` — not updated in handoff task |
| **`GET /health` reports `phase: 4`** | Low | Misleading for operators; runtime unchanged in docs-only task |
| **Stub auth** | High for production | `X-User-Id` header trust model is development-only |
| **Spec Phase 5 incomplete** | High for planning | Next agent must not claim full §32 DoD from 5B alone |
| **Subphase naming** | Medium | 2.6 / 3.5 / 4.5 / 5A / 5B are not in spec Part J — always map via §4 table |
| **Diagnostic sink** | Medium | In-process array, not production log shipping; scrubber must remain on any new emit paths |
| **Untracked planning dirs** | Low | `BrainStorm/` and 企劃書 must not be treated as implementation truth |

---

## 13. Recommended next-stage candidates

Priority follows agent spec Part J after partial Phase 5:

1. **§33 Phase 6 — Admin Typo Correction** — correction request/log tables, typo-only guard, Spread Score lock, pre-apply guard (no semantic edits).  
2. **Documentation hygiene (non-normative)** — Update `README.md` and `package.json` version string to reflect Phase 5B; align `/health` phase label (separate small task).  
3. **§32 Phase 5 remainder (if explicitly requested)** — Only with user approval; must not introduce pre-vote answer-direction ranking signals.  
4. **§34–§36** — Dual-Admin, Suspended×Correction, high-sensitivity guardrails — sequential, high-risk per AGENTS.md §17.

---

## 14. Agent workflow reminders

Before implementation tasks:

1. Read `/AGENTS.md` v0.2 and `docs/www-project-agent-spec-v0.1.md`.  
2. Use spec **§39** default prompt template; scope **one phase/task** only.  
3. For ranking/feed/vote/reference-answer work, treat as **high-risk** (plan → minimal patch → targeted tests → report).

After each implementation task, report per spec **§37 / AGENTS.md §20**:

1. Modified files  
2. Added or changed database tables  
3. Added or changed APIs  
4. Privacy and integrity check  
5. Logs / metrics / APM / error payload self-check (required sentence)  
6. Tests or validations run  
7. Remaining risks or TODOs  
8. Whether commit/push was performed  

**This handoff document:** docs-only; no commit or push performed when authored.

---

*End of Phase 0–5B handoff v1.*
