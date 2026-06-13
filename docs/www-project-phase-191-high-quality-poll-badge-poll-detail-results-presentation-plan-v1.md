# WWW Project Phase 191 — High-quality Poll Badge Poll Detail / Results Presentation Plan v1

**Status:** plan only. Phase 191 plans the future public frontend presentation direction for extending the existing `/explore` quality feedback badge to poll detail and results surfaces after Phase 190-R approval, without implementing any poll detail / results badge runtime, DOM, copy, class, id, API field, backend runtime, schema change, or migration.

**No runtime, API, DB, frontend, migration, schema, poll detail badge runtime, results badge runtime, public API change, backend runtime change, vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile field, lifecycle, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 191.**

**Baseline:** `origin/master` after Phase 190-R high-quality poll badge minimal frontend rendering runtime review checkpoint (`bcc3faf`).

**Prior checkpoint:** [Phase 190-R High-quality poll badge minimal frontend rendering runtime review checkpoint](./www-project-phase-190r-high-quality-poll-badge-minimal-frontend-rendering-runtime-review-checkpoint-v1.md).

**Prior plans, specs, and runtime:**

- [Phase 189 High-quality poll badge frontend presentation plan](./www-project-phase-189-high-quality-poll-badge-frontend-presentation-plan-v1.md)
- [Phase 190 High-quality poll badge minimal frontend rendering runtime](./www-project-phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-v1.md)
- [Phase 188 High-quality poll badge minimal public read runtime](./www-project-phase-188-high-quality-poll-badge-minimal-public-read-runtime-v1.md)
- `public/frontend/quality-feedback-badge.js` (`renderQualityFeedbackBadge()` — `/explore` only today)

---

## 1. Scope

Phase 191 is **plan only**.

It defines the safe future direction for **poll detail and results badge presentation** when consuming the existing public API field `quality_badge: null | "positive_feedback"`.

Phase 191 evaluates whether and how the Phase 190 `/explore` chip (`回饋良好`) may later appear on:

- Poll detail (`/vote/:pollId`, consuming `GET /polls/:id`)
- Results (`/results/:pollId`, consuming `GET /polls/:id/results`)

This phase only adds:

- This planning document.
- A doc guard test.
- A README index entry.

Phase 191 does **not** add:

- Poll detail badge runtime.
- Results badge runtime.
- `public/frontend/` runtime change.
- Public API change.
- Backend runtime change.
- DB/schema/migration change.
- Tooltip, detail panel, debug reason, or explanation UI.
- Count, tag breakdown, score, rank, percentile, threshold state, bucket state, or creator score display.
- `localStorage` / `sessionStorage` / cookie usage for quality badge state.

Quality feedback remains **poll-level aggregate signal only**.

---

## 2. Non-goals

Phase 191 does not implement or approve implementation of:

- Poll detail frontend badge runtime.
- Results frontend badge runtime.
- Any change to `public/frontend/` runtime files.
- Public API change.
- Backend runtime change.
- DB/schema/migration change.
- Tooltip / detail panel / debug reason / explanation.
- Creator-facing badge explanation or debug UI.
- Dashboard, analytics, ranking, recommendation ordering, hotness, trend, or personalization driven by quality badge.
- Creator score, punishment, demotion, blocking, or abuse decision UI tied to badge.

Phase 191 does not expose or plan to expose on poll detail or results:

- `aggregate_count`
- Tag count / `tag_counts`
- `tag_breakdown`
- Raw feedback total
- Ratio / proportion
- `threshold_state`
- `bucket_state`
- `score`
- `rank`
- `percentile`
- `creator_score`

Phase 191 does not create:

- Per-user feedback event table.
- Option/user/session/device/request/log/trace/metric/error/analytics linkage.
- Feedback-to-option-choice linkage.
- Feedback-to-voter-identity linkage.

Phase 191 does not change:

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

Badge planning does **not** affect vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile fields, or lifecycle.

---

## 3. Allowed display condition

Future approved poll detail / results frontend implementation may display a badge **only when**:

```text
quality_badge === "positive_feedback"
```

Public input ceiling (unchanged from Phase 188):

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

Rules:

- `quality_badge` is the only approved public badge input.
- Poll detail reads `quality_badge` from `GET /polls/:id` only.
- Results reads `quality_badge` from `GET /polls/:id/results` only.
- Phase 191 does **not** modify public API, backend runtime, DB, schema, or migration.
- Frontend must not request or assume additional badge fields.

Planned presentation shape (same as Phase 190):

- One **low-resolution positive chip** (non-interactive label).
- Sole approved copy: **`回饋良好`**
- No score, rank, count, threshold, bucket, or diagnostic detail.
- No tooltip, detail panel, debug reason, or explanation.

---

## 4. Null / missing / unexpected behavior

When:

```text
quality_badge === null
```

or when the API omits `quality_badge`, or when the value is unexpected (anything other than `null` or `"positive_feedback"`):

- Poll detail and results must **completely not display badge**.
- Silent absence only.
- Must **not distinguish reasons** for absence across not-qualified, low-volume, not-computed, gated, missing-field, or unexpected-value cases.

Banned absence / negative states (must never appear):

- `尚未達標`
- `回饋不足`
- `品質不足`
- `未取得徽章`

Banned positive / misleading states (must never appear on badge):

- `優質題目`
- `高分題目`
- `熱門`
- `排名`
- `品質分數`
- `低品質`

Phase 191 does **not** add poll detail or results badge DOM, copy, class, or id. Behavior guidance here is planning only.

---

## 5. Shared renderer direction

To avoid duplicate copy, branching logic, or divergent chip styling, future poll detail / results implementation should **reuse the existing Phase 190 helper**:

- Module: `public/frontend/quality-feedback-badge.js`
- Functions: `shouldRenderQualityFeedbackBadge(poll)`, `renderQualityFeedbackBadge(documentObject, poll)`
- Label constant: `QUALITY_FEEDBACK_BADGE_LABEL` (`回饋良好`)
- Class constant: `QUALITY_FEEDBACK_BADGE_CLASS` (`positive-feedback-badge`)

Rules:

- Do **not** introduce a second badge renderer, alternate positive copy, or surface-specific score/rank variant.
- Do **not** fork display logic per surface; gate remains `poll?.quality_badge === 'positive_feedback'` only.
- Shared CSS: `.positive-feedback-badge` in `public/frontend/public-mvp.css` (already used by `/explore`).
- Import and call `renderQualityFeedbackBadge()` from poll detail / results page modules only in a **future** runtime phase after Phase 191-R approval.

Phase 191 does **not** modify `quality-feedback-badge.js`, `vote-page.js`, or `result-page.js`.

---

## 6. Poll detail placement plan

Target surface: vote / poll detail page (`/vote/:pollId`), after poll payload load from `GET /polls/:id`.

Recommended placement (plan only):

- Near poll **title / status badge row** (e.g. header top area alongside existing collecting / lifecycle status chip).
- Badge appears as a passive chip; it is **not** part of the vote CTA row.
- Badge must not wrap, replace, or precede the primary vote action in a way that implies eligibility or ranking.

Placement must **not**:

- Change vote button label, order, or visibility.
- Gate option list rendering on `quality_badge`.
- Add pre-vote ranking, hotness, or recommendation copy.
- Imply that voting is required or discouraged based on badge presence.

---

## 7. Results placement plan

Target surface: results page (`/results/:pollId`), after results payload load from `GET /polls/:id/results`.

Recommended placement (plan only):

- Near poll **title / status badge row** (e.g. results header top area alongside existing status chip).
- Badge appears as a passive chip beside title/status metadata.
- Badge must not sit inside result bars, percentages, tiers, or option-level display blocks.

Placement must **not**:

- Change result tier thresholds, bar rendering, or aggregate display rules.
- Alter when results are visible vs hidden (`result visibility` logic unchanged).
- Add interpretation text tying badge to outcome direction, winner, or option performance.
- Imply result quality score, rank, or comparative standing.

---

## 8. Forbidden UI behavior

Future poll detail / results badge presentation must **not** include:

| Forbidden | Status |
|-----------|--------|
| Tooltip | Banned |
| Detail panel | Banned |
| Debug reason | Banned |
| Explanation line | Banned |
| `aggregate_count` display | Banned |
| Tag count / `tag_counts` | Banned |
| `tag_breakdown` | Banned |
| Ratio / proportion | Banned |
| `threshold_state` | Banned |
| `bucket_state` | Banned |
| `score` | Banned |
| `rank` | Banned |
| `percentile` | Banned |
| `creator_score` | Banned |
| `title` attribute with diagnostic text | Banned |
| `data-count` / `data-score` / `data-rank` attributes | Banned |
| `localStorage` / `sessionStorage` / cookie persistence | Banned |

Pre-existing static policy/educational copy on informational pages (e.g. FAQ) is **not** badge runtime and is out of scope.

---

## 9. Visibility / CTA / eligibility boundary

Future badge on poll detail or results must **not** affect:

| Boundary | Status |
|----------|--------|
| Sorting | Unchanged |
| Filtering | Unchanged |
| CTA behavior | Unchanged |
| Vote eligibility | Unchanged |
| Vote transaction | Unchanged |
| `vote-by-index` | Unchanged |
| Results visibility | Unchanged |
| Feed / explore ordering | Unchanged |
| Lifecycle | Unchanged |
| Auth | Unchanged |
| Reference Answer | Unchanged |
| UserAuthResolver | Unchanged |
| Profile fields | Unchanged |
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| Vote-by-index eligibility-before-option-resolve | Unchanged |

Badge is display-only metadata. It must not sort, filter, gate, reorder, or reinterpret vote or result flows.

---

## 10. Demo behavior

Demo poll flows and static preview payloads:

- If API has no `quality_badge` field → **completely not display badge** on poll detail or results.
- If `quality_badge === null` → **completely not display badge**.
- If `quality_badge === "positive_feedback"` in a live API response → future runtime may show `回饋良好` only after Phase 191-R approval and a separate implementation phase.
- Demo HTML shells must not hard-code `回饋良好` or `positive-feedback-badge` for poll detail / results until an approved runtime phase lands.

Phase 191 does not change demo poll behavior or static HTML.

---

## 11. Future implementation prerequisites

Poll detail / results frontend badge **runtime** must **not** begin until all of the following are satisfied:

1. **Phase 191-R review checkpoint** approves this plan against Phase 182–190-R governance with no blockers.
2. A separate **implementation phase** is explicitly opened (not Phase 191).
3. Implementation reuses `renderQualityFeedbackBadge()` without API/backend/DB/schema/migration change unless replanned and re-approved.
4. Implementation adds focused frontend tests and static guards mirroring Phase 190 boundaries.
5. `design-drafts/` remains out of commit scope unless explicitly requested.

Approved implementation ceiling (future, not Phase 191):

- Surfaces: poll detail and/or results only (may split across phases).
- Input: existing `quality_badge` only.
- Output: `回饋良好` chip only when `quality_badge === "positive_feedback"`.
- Silence: `null`, missing, unexpected → no badge.

---

## 12. Phase 191 conclusion

Phase 191 is **plan-only**. It records a safe future direction for extending the Phase 190 `/explore` quality feedback badge to poll detail and results using the same low-resolution `回饋良好` chip and shared `renderQualityFeedbackBadge()` helper.

Phase 191 confirms:

- No poll detail / results badge runtime is added in this phase.
- No `public/frontend/` runtime, public API, backend, DB, schema, or migration change.
- Future display is gated on `quality_badge === "positive_feedback"` only.
- `null`, missing field, and unexpected values require completely silent no-badge behavior.
- Banned negative, scoring, ranking, tooltip, count, and creator-score boundaries from Phase 182–190-R remain in force.
- Badge must not affect sorting, filtering, CTA, vote eligibility, or results visibility.
- Raw Option Linkage Ban and vote/auth/result/Reference Answer/UserAuthResolver/profile/lifecycle boundaries remain unchanged.

**Frontend badge rendering on poll detail / results must not begin until Phase 191-R review checkpoint approval.**

---

## Related documents

- [Phase 190-R High-quality poll badge minimal frontend rendering runtime review checkpoint](./www-project-phase-190r-high-quality-poll-badge-minimal-frontend-rendering-runtime-review-checkpoint-v1.md)
- [Phase 190 High-quality poll badge minimal frontend rendering runtime](./www-project-phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-v1.md)
- [AGENTS.md](../AGENTS.md)

**Tests:** `tests/docs/phase-191-high-quality-poll-badge-poll-detail-results-presentation-plan-doc.test.ts`

**Out of scope for commit:** `design-drafts/`
