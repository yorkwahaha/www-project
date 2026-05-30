# WWW Project — Phase 5C Milestone / Handoff (v1)

**Document path:** `docs/www-project-milestone-phase-0-5c-handoff-v1.md`  
**Status:** Delivery record (non-normative)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-milestone-phase-0-5b-handoff-v1.md`  
**Current HEAD:** `d5ae2f5` — `feat: add public feed cursor pagination`

This document records the **Phase 5C delta** on top of Phase 0–5B. It does not change product architecture, privacy rules, or normative requirements. For the full Phase 0–5B baseline, see the 5B handoff; for rules, use `AGENTS.md` and the agent implementation spec only.

**Why a separate file (not a long addendum inside the 5B handoff):** The 5B handoff is anchored at `d424444` and describes a feed with no query parameters. Appending 5C there would mix two HEAD snapshots and obsolete large sections (§5, §9, §10). A short 5C handoff keeps the 5B record intact and documents only what changed.

---

## 1. Phase 5C delivery summary

| Item | Value |
|------|--------|
| **Label** | Phase 5C — public feed cursor pagination + PostgreSQL partial index |
| **HEAD** | `d5ae2f5` — `feat: add public feed cursor pagination` |
| **Prior related commits** | `a23612b` live PG feed/reference-answer integration tests · `34bc40e` live PG official vote test |
| **Migration** | `005_phase5c_public_feed_index.sql` |
| **Audit status** | **PASS** (local validation below) |

**Spec §32 (Wonder Flow / Ranking)** remains **partially complete**. Phase 5C extends the **same freshness-only** public feed slice with keyset pagination; it does **not** add ranking, personalization, engagement signals, category filters, feed UI, or answer-direction inputs.

---

## 2. `GET /polls/feed` — API (Phase 5C)

### Query parameters (allowlist only)

| Parameter | Required | Rules |
|-----------|----------|--------|
| `limit` | No | Integer **1..50**; default **50** (`src/polls/feed-config.ts`) |
| `cursor` | No | Opaque versioned string for the next page |
| *(any other)* | — | `400` — `UNSUPPORTED_QUERY_PARAMS` |

Unknown keys still return `400` with a safe, scrubbed error (same pattern as Phase 5B rejection of arbitrary query strings).

### Cursor format

- Shape: `v1.<base64url(JSON)>`
- Logical payload only: `{ "p": "<published_at ISO-8601>", "i": "<poll UUID>" }`
- Encode/decode: `src/polls/feed-cursor.ts`
- Invalid or tampered cursor: `400` — `INVALID_FEED_CURSOR`
- Invalid `limit`: `400` — `INVALID_FEED_LIMIT`

**Cursor must not contain:** `user_id`, `option_id`, vote or reference tokens, shard/counter fields, session/device identifiers, trust level, or ranking/engagement data.

### Response

```json
{
  "polls": [ /* unchanged safe item shape from 5B */ ],
  "next_cursor": "<opaque cursor or null>"
}
```

Feed item fields (unchanged): `poll_id`, `title`, `category`, `status` (`active`), `published_display` (`最近發布`), `result_page_url`.  
**Still not exposed:** precise `published_at`, `closes_at`, options, vote counts, tokens, participation state, or engagement/ranking fields.

### Pagination logic (keyset, not OFFSET)

**Base filter (unchanged):**

- `status = 'active'`
- `published_at IS NOT NULL`

**Order (unchanged):**

- `ORDER BY published_at DESC, id ASC`

**Next page** (when `cursor` is present), rows strictly after the cursor position in that order:

```text
published_at < cursor.p
OR (published_at = cursor.p AND id > cursor.i)
```

**Page sizing:**

- Repository fetches **`limit + 1`** rows.
- Response includes at most **`limit`** polls.
- `next_cursor` is set from the **last returned row** only when an extra row exists; otherwise `next_cursor` is **`null`**.

### SQL and index

- Query remains **polls-table only** — no joins to `poll_options`, `poll_vote_tokens`, `poll_reference_answer_tokens`, `poll_option_vote_counters`, or `users`.
- Partial index (migration 005):

```sql
CREATE INDEX idx_polls_public_feed_freshness
ON polls (published_at DESC, id ASC)
WHERE status = 'active' AND published_at IS NOT NULL;
```

---

## 3. Privacy and feed guarantees (preserved)

Phase 5C **does not** weaken Phase 5B privacy boundaries:

| Guarantee | Status |
|-----------|--------|
| Public, non-personalized feed | **Preserved** — same payload for any caller identity |
| Freshness-only ordering | **Preserved** — `published_at DESC`, `id ASC` only |
| No pre-vote answer-direction ranking | **Preserved** — no option %, growth, MIW, or participation-based sort |
| No vote/reference/option/counter dependency | **Preserved** — polls-only SQL |
| Cursor content | **Only** `published_at` + `poll_id` for keyset continuation |
| Response safety | **Preserved** — no precise `published_at` or participation fields in JSON |

**Explicitly still out of scope:** feed UI, filters, personalization, `total_count`, archive/visibility schema, engagement scoring, and full spec §32 Wonder Flow remainder.

---

## 4. Validation (recorded at 5C handoff authoring)

| Command | Result |
|---------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm test` | **PASS** — 79 passed (16 test files) |
| `npm run migrate:check` | **PASS** — 5 migrations validated |
| `npm run test:integration` | **PASS** — 6 passed (3 integration files; requires isolated `www_test` DB) |
| `git diff --check` | **PASS** |

### Test themes added or extended for 5C

- In-memory: default page size 50, `limit`, multi-page traversal, invalid limit/cursor, polls-only SQL source guard  
- HTTP: `limit` / `cursor`, second-page fetch, unknown params still 400, safe payload checks  
- Live PG: keyset tie-break, `next_cursor`, participation tables do not affect feed, index `idx_polls_public_feed_freshness` exists  

---

## 5. Migrations delta

| File | Scope |
|------|--------|
| `005_phase5c_public_feed_index.sql` | Partial index `idx_polls_public_feed_freshness` on `polls` only |

No new tables or columns. Phases 0–5B migrations `001`–`004` unchanged.

---

## 6. Recommended next steps (unchanged direction)

1. **§33 Phase 6 — Admin Typo Correction** (spec Part J)  
2. **§32 Phase 5 remainder** — only if explicitly requested; must not introduce pre-vote answer-direction signals  
3. **Documentation hygiene** — align `/health` milestone label and `package.json` version string with current phase (optional small task)  

---

**Handoff self-check (this document):** Docs-only update; no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records. No commit or push performed when authored.

*End of Phase 5C handoff v1.*
