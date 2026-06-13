# WWW Project Phase 189 — High-quality Poll Badge Frontend Presentation Plan v1

**Status:** plan only. Phase 189 plans the future public frontend presentation direction for `quality_badge: null | "positive_feedback"` after Phase 188-R approval, without implementing any frontend badge runtime, DOM, copy, class, id, API field, backend runtime, or schema change.

**No runtime, API, DB, frontend, migration, schema, frontend badge runtime, frontend badge DOM, copy, class, id, backend runtime, public API change, vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile field, lifecycle, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 189.**

**Baseline:** `origin/master` after Phase 188-R high-quality poll badge minimal public read runtime review checkpoint (`57581b9`).

**Prior checkpoint:** [Phase 188-R High-quality poll badge minimal public read runtime review checkpoint](./www-project-phase-188r-high-quality-poll-badge-minimal-public-read-runtime-review-checkpoint-v1.md).

**Prior plans, specs, and runtime:**

- [Phase 182 Quality feedback milestone & governance boundary](./www-project-phase-182-quality-feedback-milestone-governance-boundary-v1.md)
- [Phase 183 High-quality poll presentation governance spec](./www-project-phase-183-high-quality-poll-presentation-governance-spec-v1.md)
- [Phase 186 High-quality poll badge read-model / presentation plan](./www-project-phase-186-high-quality-poll-badge-read-model-presentation-plan-v1.md)
- [Phase 187 High-quality poll badge runtime implementation plan](./www-project-phase-187-high-quality-poll-badge-runtime-implementation-plan-v1.md)
- [Phase 188 High-quality poll badge minimal public read runtime](./www-project-phase-188-high-quality-poll-badge-minimal-public-read-runtime-v1.md)

---

## 1. Scope

Phase 189 is **plan only**.

It defines the safe future direction for **public frontend badge presentation** when consuming the existing public API field `quality_badge: null | "positive_feedback"`.

This phase only adds:

- This planning document.
- A doc guard test.
- A README index entry.

Phase 189 does **not** add:

- Runtime.
- API.
- DB behavior.
- Frontend badge runtime.
- Frontend badge DOM, copy, class, or id.
- Migration.
- Schema.
- Backend runtime change.
- Public API change.
- Tooltip, detail panel, debug reason, or explanation UI.
- Count, tag breakdown, ratio, threshold, bucket, score, rank, or creator score display.

Quality feedback remains **poll-level aggregate signal only**.

---

## 2. Non-goals

Phase 189 does not implement or approve implementation of:

- Frontend badge runtime.
- Frontend badge DOM, copy, class, or id.
- Public API change.
- Backend runtime change.
- DB/schema/migration change.
- Badge rendering in `public/frontend/` or `public/`.
- Tooltip / detail panel / debug reason / explanation.
- Creator-facing badge UI.
- Dashboard.
- Analytics.
- Ranking.
- Recommendation ordering.
- Hotness.
- Trend.
- Personalization.
- Creator score.
- `creator_score`.
- Punishment.
- Demotion / 降權.
- Blocking.
- Abuse decision.

Phase 189 does not expose or plan to expose on the frontend:

- `aggregate_count`.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- `tag_counts`.
- Ratio / proportion.
- Threshold state.
- Bucket state.
- Score.
- Rank.
- Percentile.
- Creator score.
- `creator_score`.

Phase 189 does not create:

- Per-user feedback event table.
- Option/user/session/device/request/log/trace/metric/error/analytics linkage.
- Feedback-to-option-choice linkage.
- Feedback-to-voter-identity linkage.
- `localStorage` / `sessionStorage` / cookie usage for quality badge state.

Phase 189 does not change:

- Raw Option Linkage Ban.
- Official Vote transaction order.
- Vote-by-index eligibility-before-option-resolve.
- Vote-by-index body `{ option_index }`.
- Result visibility.
- Eligibility.
- Auth.
- Reference Answer.
- UserAuthResolver.
- Profile fields.
- Poll lifecycle.

Feedback does **not** affect vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile fields, or lifecycle.

---

## 3. Public API input ceiling (unchanged)

Phase 189 consumes only the existing Phase 188 public API field:

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

Rules:

- `quality_badge` is the only approved public badge input for frontend presentation planning.
- Phase 189 does **not** modify public API, backend runtime, DB, schema, or migration.
- Frontend must not request or assume additional badge fields.

---

## 4. Future display rule

Future approved frontend implementation may display a badge **only when**:

```text
quality_badge === "positive_feedback"
```

Planned presentation shape:

- A **low-resolution positive chip** (non-interactive label).
- No score, rank, count, threshold, bucket, or diagnostic detail.
- No tooltip, detail panel, debug reason, or explanation.

When:

```text
quality_badge === null
```

or when the API omits `quality_badge` (e.g. demo poll payloads):

- Frontend must **completely not display badge**.
- Silent absence only.
- Must **not distinguish reasons** for absence.

---

## 5. Copy boundary

### 5.1 Recommended copy

The recommended sole positive chip copy for future implementation is:

**`回饋良好`**

Rules:

- One low-resolution positive label only.
- Non-ranking.
- Non-scoring.
- Non-punitive.
- No secondary explanation line.

### 5.2 Banned absence / negative states

When `quality_badge === null` or absent, frontend must **not** show:

- `尚未達標`
- `回饋不足`
- `品質不足`
- `未取得徽章`
- "Not enough feedback."
- "Below threshold."
- "Quality insufficient."

### 5.3 Banned positive / misleading states

Even when `quality_badge === "positive_feedback"`, frontend copy must **not** use:

- `優質題目`
- `高分題目`
- `熱門`
- `排名`
- `品質分數`
- `低品質`
- `優質第幾名`
- Any score, rank, percentile, vote count, feedback count, tag breakdown, or creator score wording.

Pre-existing static policy/educational copy on informational pages (e.g. FAQ explaining quality feedback policy) is **not** badge runtime and is out of scope for this plan.

Phase 189 does **not** add frontend badge DOM, copy, class, or id. Copy guidance here is planning only.

---

## 6. Interaction and behavior boundary

Future badge presentation must **not** affect:

| Boundary | Status |
|----------|--------|
| Feed ordering | Unchanged |
| Explore ordering | Unchanged |
| Filtering | Unchanged |
| CTA behavior | Unchanged |
| Vote eligibility | Unchanged |
| Vote transaction | Unchanged |
| `vote-by-index` | Unchanged |
| Results visibility | Unchanged |
| Lifecycle | Unchanged |
| Auth | Unchanged |
| Reference Answer | Unchanged |
| UserAuthResolver | Unchanged |
| Profile fields | Unchanged |

Badge chip must be **presentational only**. It must not:

- Sort or filter polls.
- Change CTA labels or availability.
- Gate voting or results access.
- Open tooltip / detail panel / debug reason / explanation.
- Store state in `localStorage`, `sessionStorage`, or cookies.

---

## 7. Planned future surfaces (implementation may split)

First-version future frontend implementation **may** plan badge display on:

| Surface | Route / context | Notes |
|---------|-----------------|-------|
| Explore feed item | `/explore` feed list | Chip beside title/meta only; no ordering change |
| Poll detail | `/polls/:id` public detail | Chip in header/meta only |
| Results page | `/results/:id` | Chip in header/meta only |

Rules:

- Implementation may ship in separate phases per surface.
- Each surface must obey the same `null` silence and `"positive_feedback"` chip rules.
- Demo poll flows: if API has no `quality_badge` or value is `null`, frontend **completely not display badge**.

Phase 189 does **not** implement any of these surfaces.

---

## 8. Phase 189-R gate

**Frontend badge rendering runtime must not begin until Phase 189-R review checkpoint approves this plan.**

Phase 189-R must confirm:

- Plan-only posture preserved.
- No runtime/API/DB/frontend/migration/schema change in Phase 189.
- Future display only on `quality_badge === "positive_feedback"`.
- `quality_badge === null` → completely not display badge.
- Copy ceiling `回饋良好` only; banned negative/score/rank/tooltip/debug copy preserved.
- No ordering/filtering/CTA/vote eligibility/results visibility impact.
- Raw Option Linkage Ban and vote/auth/result boundaries unchanged.

---

## 9. Validation Plan

```bash
npm test
npm run typecheck
npm run build
```

Focused test:

- `tests/docs/phase-189-high-quality-poll-badge-frontend-presentation-plan-doc.test.ts`

`design-drafts/` must remain uncommitted.

---

## 10. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 189 is plan only. No migration, schema DDL, runtime, API, DB, or frontend changes. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Frontend badge rendering requires **Phase 189-R** approval before implementation.
