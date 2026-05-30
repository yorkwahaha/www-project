# WWW Project — Phase 6A / 6A.1 Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-0-6a-handoff-v1.md`  
**Status:** Delivery record (non-normative)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-milestone-phase-0-5c-handoff-v1.md`  
**Previous stable baseline:** `f904353` — `docs: add phase 0-5c handoff`  
**Current local HEAD:** `24a6e21` — `fix: exclude expired polls from public feed`  
**Push status:** **Not pushed** (local commits only at handoff authoring)

This document records **Phase 6A** (visibility / archive / public-state boundary) and **Phase 6A.1** (feed consistency for expired `closes_at`) on top of Phase 0–5C. It does not change product architecture, privacy rules, or normative requirements. For rules, use `AGENTS.md` and `docs/www-project-agent-spec-v0.1.md` only.

**Note on spec phase numbering:** Agent spec Part J §33 labels “Phase 6” as Admin Typo Correction. Repo delivery phases **6A / 6A.1** here are **visibility / public-boundary** work explicitly deferred in the Phase 5C handoff; admin governance remains a separate future phase.

---

## 1. Baseline and commits

| Item | Value |
|------|--------|
| **Prior baseline** | `f904353` — Phase 0–5C handoff (public feed cursor pagination) |
| **Phase 6A** | `d01c079` — `feat: add poll visibility archive boundary` |
| **Phase 6A.1** | `24a6e21` — `fix: exclude expired polls from public feed` |
| **Migrations** | `006_phase6a_poll_visibility_archive.sql` (6A only; 6A.1 has **no** new migration) |
| **Remote** | Not pushed at handoff time |

---

## 2. Phase 6A summary — visibility / archive / public-state

### Schema

- Added `polls.archived_at TIMESTAMPTZ NULL` (discovery archive; **not** a new `status` enum value).
- CHECK constraints:
  - `archived_at` requires `published_at IS NOT NULL`
  - `archived_at` cannot be set while `status = 'draft'`
- Rebuilt partial index `idx_polls_public_feed_freshness` with predicate including `archived_at IS NULL`.

### Application

- Centralized helpers in `src/polls/public-visibility.ts`:
  - Feed eligibility, public read, results read, participation allowed.
- **Feed:** excludes archived polls (`archived_at IS NOT NULL`); still `status = 'active'`, `published_at IS NOT NULL`, freshness-only order.
- **Public read (`GET /polls/:id`, `GET /polls/:id/results`):**
  - **404** `POLL_NOT_FOUND` for draft, suspended, correction_pending, deleted, nonexistent.
  - **200** for active (including archived), and `closed`.
- **Participation (vote / reference answer):**
  - Rejects `closed`, archived (`archived_at` set), and expired `closes_at` on active polls (**400** validation where poll is publicly readable).
  - Hidden states → **404** (not state-revealing validation).

### Explicit non-deliverables (6A)

- No archive write API (`POST` archive path).
- No background job writing `active` → `closed`.
- No change to `PollDetail.published_at` (precise ISO still returned on detail).
- No ranking, personalization, or feed cursor format change.

---

## 3. Phase 6A.1 summary — expired active excluded from feed

**Product rule:** Wonder Flow / public feed = publicly discoverable **and** currently participable.

### Behavior change

- `GET /polls/feed` now excludes **active** polls whose `closes_at` is in the past (still `status = 'active'` in DB).
- Implemented via:
  - `isPublicFeedEligible(poll, now)` — `closes_at > now`
  - PostgreSQL `listPublicFeedPolls`: `closes_at > $1` with bound timestamp (**not** `NOW()` in SQL string; **not** in partial index predicate).

### Unchanged by 6A.1

| Surface | Expired active (`status = active`, `closes_at` past) |
|---------|------------------------------------------------------|
| `GET /polls/:id` | **200** |
| `GET /polls/:id/results` | **200** |
| Vote / reference answer | **400** (already rejected in 6A) |
| DB `status` | Remains `active` (no auto `closed` write) |

### Index (unchanged in 6A.1)

```sql
CREATE INDEX idx_polls_public_feed_freshness
ON polls (published_at DESC, id ASC)
WHERE status = 'active'
  AND published_at IS NOT NULL
  AND archived_at IS NULL;
```

Runtime query additionally filters `closes_at > :feedOpenAt` (heap filter / planner filter; no migration 007).

### Feed eligibility after 6A.1 (all required)

```text
status = 'active'
published_at IS NOT NULL
archived_at IS NULL
closes_at > current bound timestamp (query time)
```

Order remains: `published_at DESC`, `id ASC` (keyset cursor unchanged).

---

## 4. Public behavior matrix (after 6A + 6A.1)

HTTP status for anonymous/public routes. Hidden errors use generic `POLL_NOT_FOUND` without moderation labels.

| State | `GET /polls/feed` | `GET /polls/:id` | `GET /polls/:id/results` | Vote / reference answer |
|-------|-------------------|------------------|--------------------------|-------------------------|
| **nonexistent** | — | 404 | 404 | 404 |
| **draft** | exclude | 404 | 404 | 404 |
| **active open** (published, not archived, `closes_at` future) | include | 200 | 200 | allow (if trust/eligibility rules pass) |
| **active expired** (`closes_at` past, still `active`) | exclude | 200 | 200 | 400 |
| **active archived** (`archived_at` set) | exclude | 200 | 200 | 400 |
| **closed** | exclude | 200 | 200 | 400 |
| **suspended** | exclude | 404 | 404 | 404 |
| **correction_pending** | exclude | 404 | 404 | 404 |
| **deleted** | exclude | 404 | 404 | 404 |

Feed response items still expose only: `poll_id`, `title`, `category`, `status` (`active`), `published_display`, `result_page_url`, plus `next_cursor` — no precise `published_at`, options, vote counts, or participation fields.

---

## 5. Privacy and public-boundary notes

| Topic | Status |
|-------|--------|
| Hidden states | **404** `POLL_NOT_FOUND`; errors must not leak draft/suspended/correction_pending/moderation/admin detail |
| Feed ranking | **Freshness-only** — `published_at DESC`, `id ASC`; no answer-direction or engagement signals |
| Personalization | **None** — feed identical for all callers |
| SQL scope | Feed uses **`polls` table only** — no joins to vote/reference/option/counter/`users` |
| User-option linkage | **No new** durable user+option storage; vote/ref paths unchanged for linkage ban |
| Feed cursor | **Unchanged** `v1.<base64url>` with `{ p: published_at, i: poll_id }` only |
| `PollDetail.published_at` | Still exposed (pre-existing contract); **deferred** to a future public DTO hardening phase |
| Archive API | Not implemented — `archived_at` set only via DB/tests until a future API phase |

---

## 6. Tests and validation (recorded at handoff authoring)

| Command | Result |
|---------|--------|
| `npm run typecheck` | **PASS** |
| `npm run migrate:check` | **PASS** — 6 migrations |
| `npm test` | **PASS** — 90 tests |
| `npm run test:integration` | **PASS** — 8 tests (isolated `www_test` DB; optional) |
| `npm run build` | **PASS** |
| `git diff --check` | **PASS** |

### Test themes (6A / 6A.1)

- Schema guard: `archived_at`, CHECK names, feed index predicate in `006`
- `public-visibility.test.ts`: hidden, archived, expired feed eligibility
- `poll-visibility.test.ts`: service read/participation boundaries
- `public-feed.test.ts` + `public-feed.pg.test.ts`: archived and expired exclusion; polls-only SQL guard
- `poll-visibility.pg.test.ts`: draft 404; archived read / no participate
- HTTP: draft `GET /polls/:id` 404; suspended/correction_pending `GET .../results` 404 without state strings
- Regression: feed ordering/cursor; no vote leakage in feed JSON

---

## 7. Files changed (Phase 6A + 6A.1)

### Migration

| File | Phase |
|------|--------|
| `migrations/006_phase6a_poll_visibility_archive.sql` | 6A |

### Core (visibility / repository / service / types)

| File | Phase |
|------|--------|
| `src/polls/public-visibility.ts` | 6A (created); 6A.1 (feed `closes_at`) |
| `src/polls/types.ts` | 6A |
| `src/polls/repository.ts` | 6A; 6A.1 (`closes_at > $1` on feed) |
| `src/polls/in-memory-repository.ts` | 6A |
| `src/polls/service.ts` | 6A |

### Tests

| File | Phase |
|------|--------|
| `tests/polls/public-visibility.test.ts` | 6A; 6A.1 |
| `tests/polls/poll-visibility.test.ts` | 6A |
| `tests/polls/schema-guard.test.ts` | 6A |
| `tests/polls/public-feed.test.ts` | 6A; 6A.1 |
| `tests/integration/public-feed.pg.test.ts` | 6A; 6A.1 |
| `tests/integration/poll-visibility.pg.test.ts` | 6A |
| `tests/http/poll-routes.test.ts` | 6A |
| `tests/http/result-routes.test.ts` | 6A.1 |

### Docs

| File | Phase |
|------|--------|
| `docs/www-project-milestone-phase-0-6a-handoff-v1.md` | Handoff (this file) |

---

## 8. Remaining follow-ups / non-goals

### Not implemented (do not assume)

| Item | Notes |
|------|--------|
| Archive write API | Creators/admins cannot set `archived_at` via HTTP yet |
| `active` → `closed` background job | Expired polls stay `active` in DB; only feed/participation treat them as closed |
| `PollDetail.published_at` removal / bucketization | Future public DTO contract phase |
| Spec §33 Admin Typo Correction | Correction tables, Spread Score, typo-only guard |
| Dual-Admin / Suspended × Correction | Per spec Part J later phases |
| High-sensitivity category launch | MVP remains disabled |
| Full Wonder Flow / ranking beyond freshness feed | Spec §32 remainder |

### Guardrails for future work

- Do not add pre-vote answer-direction signals to feed or ranking.
- Do not add personalization or engagement-based feed ordering.
- Do not add durable user-option linkage in visibility or feed paths.
- Do not put time-varying predicates (`NOW()`) into partial index definitions for feed eligibility.

---

## 9. Recommended next steps

1. **Push** `d01c079` + `24a6e21` (+ this handoff doc commit) when ready.
2. **Optional hygiene:** align `README.md` / `/health` milestone label with Phase 6A scope.
3. **Future Phase 6B (naming TBD):** archive API; or proceed to spec admin phases per product priority.
4. **Future DTO phase:** `PollDetail` / public metadata hardening (`published_at`).

---

**Handoff self-check (this document):** Docs-only update; no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records. No push performed when authored.

*End of Phase 6A / 6A.1 handoff v1.*
