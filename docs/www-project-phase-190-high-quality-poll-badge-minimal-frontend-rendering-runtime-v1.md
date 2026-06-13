# WWW Project Phase 190 — High-quality Poll Badge Minimal Frontend Rendering Runtime v1

**Status:** minimal frontend rendering runtime. Consumes existing `quality_badge: null | "positive_feedback"` from public API after Phase 189-R approval. No API/backend/DB/schema/migration change.

**Baseline:** `origin/master` after Phase 189-R high-quality poll badge frontend presentation plan review checkpoint (`e698ce3`).

**Prior checkpoint:** [Phase 189-R High-quality poll badge frontend presentation plan review checkpoint](./www-project-phase-189r-high-quality-poll-badge-frontend-presentation-plan-review-checkpoint-v1.md).

---

## 1. Scope

Phase 190 is **minimal frontend rendering runtime** only.

It adds:

- `renderQualityFeedbackBadge()` helper in `public/frontend/quality-feedback-badge.js`.
- Explore feed item rendering via `renderExplorePollCard()` in `public/frontend/explore-page.js`.
- Low-key chip styling via `.positive-feedback-badge` in `public/frontend/public-mvp.css`.
- Focused frontend, source, and static guard tests.
- This document and README index entry.

Phase 190 does **not** add:

- Public API / backend runtime / DB / schema / migration change.
- Tooltip / detail panel / debug reason / explanation.
- Count / tag breakdown / ratio / threshold / bucket / score / rank / `creator_score` display.
- Ordering / filtering / CTA / vote eligibility / results visibility changes.
- `localStorage` / `sessionStorage` / cookie persistence for quality badge.
- Creator-facing explanation or debug UI.

Forbidden public fields remain banned:

- `aggregate_count`
- `tag_breakdown`
- `tag_counts`
- `score`
- `rank`
- `creator_score`
- `threshold_state`
- `bucket_state`

---

## 2. Public input ceiling

Frontend consumes only the existing public field:

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

Rules:

- `quality_badge` is the only badge input.
- Frontend must not request or assume additional badge fields.

---

## 3. Display rule

| Input | Frontend behavior |
|-------|-------------------|
| `quality_badge === "positive_feedback"` | Show low-resolution chip with copy **`回饋良好`** |
| `quality_badge === null` | Completely not display badge |
| Field missing | Completely not display badge |
| Unexpected value | Completely not display badge |

Forbidden absence / negative copy (must never appear):

- `尚未達標`
- `回饋不足`
- `品質不足`
- `未取得徽章`

Forbidden misleading / scoring copy (must never appear on badge):

- `優質題目`
- `高分題目`
- `熱門`
- `排名`
- `品質分數`
- `低品質`

---

## 4. Rendering surfaces

First version targets `/explore` feed item cards only.

Badge placement:

- Inside each explore poll card badge group (`mvp-poll-card-badges`), alongside the existing collecting status chip.
- Non-interactive label only.
- No `title` attribute, tooltip, `data-count`, or `data-score`.

Class naming:

- Approved: `positive-feedback-badge` (no ranking/score implication).
- Helper module: `quality-feedback-badge.js`.

---

## 5. Behavior boundaries

| Boundary | Status |
|----------|--------|
| Feed ordering | Unchanged |
| Explore ordering | Unchanged |
| Filtering | Unchanged |
| CTA behavior | Unchanged |
| Vote eligibility | Unchanged |
| Results visibility | Unchanged |
| Vote transaction | Unchanged |
| `vote-by-index` | Unchanged |
| Reference Answer | Unchanged |
| UserAuthResolver | Unchanged |
| Poll lifecycle | Unchanged |

Badge rendering is display-only. It must not sort, filter, gate, or reorder feed items.

---

## 6. Privacy and integrity

- Raw Option Linkage Ban unchanged.
- No option/user/session/device/request/log/trace/metric/error/analytics linkage added.
- Frontend stores no badge state in `localStorage`, `sessionStorage`, or cookies.
- Badge helper reads `poll.quality_badge` at render time only; no durable client persistence.

---

## 7. Tests

| Test file | Purpose |
|-----------|---------|
| `tests/frontend/phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime.test.ts` | Rendering rules, banned copy, no ordering/storage/API change guards |
| `tests/docs/phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-doc.test.ts` | Doc and README index guards |

---

## 8. Out of scope

- Poll detail (`/polls/:id`) and results (`/results/:id`) badge rendering (may follow in a later phase).
- API expansion, backend runtime, schema/migration, durable badge cache.
- Creator-facing explanation/debug.
- Ranking, recommendation ordering, hotness, trend, personalization.
- `design-drafts/` (not committed).

---

## 9. Related documents

- [Phase 189 High-quality poll badge frontend presentation plan](./www-project-phase-189-high-quality-poll-badge-frontend-presentation-plan-v1.md)
- [Phase 188 High-quality poll badge minimal public read runtime](./www-project-phase-188-high-quality-poll-badge-minimal-public-read-runtime-v1.md)
- [AGENTS.md](../AGENTS.md)
