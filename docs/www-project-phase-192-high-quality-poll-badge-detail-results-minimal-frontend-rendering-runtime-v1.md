# WWW Project Phase 192 — High-quality Poll Badge Poll Detail / Results Minimal Frontend Rendering Runtime v1

**Status:** minimal frontend rendering runtime. Extends Phase 190 `renderQualityFeedbackBadge()` to poll detail and results surfaces after Phase 191-R approval. No API/backend/DB/schema/migration change.

**Baseline:** `origin/master` after Phase 191-R high-quality poll badge poll detail / results presentation plan review checkpoint (`9a87cf3`).

**Prior checkpoint:** [Phase 191-R High-quality poll badge poll detail / results presentation plan review checkpoint](./www-project-phase-191r-high-quality-poll-badge-poll-detail-results-presentation-plan-review-checkpoint-v1.md).

---

## 1. Scope

Phase 192 is **minimal frontend rendering runtime** only.

It adds:

- Poll detail badge rendering via `mountQualityFeedbackBadgeNearTitle()` in `public/frontend/vote-page.js`.
- Results badge rendering via `mountQualityFeedbackBadgeNearTitle()` in `public/frontend/result-page.js`.
- Shared helper `mountQualityFeedbackBadgeNearTitle()` in `public/frontend/quality-feedback-badge.js` (reuses `renderQualityFeedbackBadge()`).
- Row styling via `.mvp-quality-feedback-badge-row` in `public/frontend/public-mvp.css`.
- Focused frontend, source, and static guard tests.
- This document and README index entry.

Phase 192 does **not** add:

- Public API / backend runtime / DB / schema / migration change.
- Second badge copy or second display gate logic.
- Tooltip / detail panel / debug reason / explanation.
- Count / tag breakdown / ratio / threshold / bucket / score / rank / `creator_score` display.
- Ordering / filtering / CTA / vote eligibility / results visibility / result interpretation changes.
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

Frontend consumes only the existing public field from:

- Poll detail: `GET /polls/:id` → `quality_badge`
- Results: `GET /polls/:id/results` → `quality_badge`

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

Shared renderer:

- `shouldRenderQualityFeedbackBadge(poll)`
- `renderQualityFeedbackBadge(documentObject, poll)`
- `mountQualityFeedbackBadgeNearTitle(documentObject, titleElement, poll)`

Forbidden absence / negative copy (must never appear):

- `尚未達標`
- `回饋不足`
- `品質不足`
- `未取得徽章`

Forbidden misleading copy (must never appear on badge):

- `優質題目`
- `高分題目`
- `熱門`
- `排名`
- `品質分數`
- `低品質`

---

## 4. Placement

| Surface | DOM anchor | Placement |
|---------|------------|-----------|
| Poll detail (`/vote/:pollId`) | `#poll-title` | Badge row immediately after title (`mvp-quality-feedback-badge-row`) |
| Results (`/results/:pollId`) | `#page-title` | Badge row immediately after page title |

Badge is passive metadata near **title/status**. It must not wrap, replace, or precede vote CTA or result bars in a way that implies eligibility, ranking, or outcome interpretation.

---

## 5. Behavior boundaries

| Boundary | Status |
|----------|--------|
| Sorting | Unchanged |
| Filtering | Unchanged |
| CTA behavior | Unchanged |
| Vote eligibility | Unchanged |
| Results visibility | Unchanged |
| Vote transaction | Unchanged |
| `vote-by-index` | Unchanged |
| Feed / explore ordering | Unchanged |
| Reference Answer | Unchanged |
| `UserAuthResolver` | Unchanged |
| Profile fields | Unchanged |
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| Vote-by-index eligibility-before-option-resolve | Unchanged |

---

## 6. Demo behavior

- Demo poll payloads without `quality_badge` → completely not display badge on poll detail or results.
- Demo HTML shells do not hard-code `回饋良好` or `positive-feedback-badge`.

---

## 7. Tests and guards

| Test file | Purpose |
|-----------|---------|
| `tests/frontend/phase-192-high-quality-poll-badge-detail-results-minimal-frontend-rendering-runtime.test.ts` | Frontend runtime and static guards |
| `tests/docs/phase-192-high-quality-poll-badge-detail-results-minimal-frontend-rendering-runtime-doc.test.ts` | Doc and README index guards |

---

## Related documents

- [Phase 191-R High-quality poll badge poll detail / results presentation plan review checkpoint](./www-project-phase-191r-high-quality-poll-badge-poll-detail-results-presentation-plan-review-checkpoint-v1.md)
- [Phase 190 High-quality poll badge minimal frontend rendering runtime](./www-project-phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-v1.md)
- [AGENTS.md](../AGENTS.md)

**Out of scope for commit:** `design-drafts/`
