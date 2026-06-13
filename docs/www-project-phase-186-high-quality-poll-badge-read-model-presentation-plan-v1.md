# WWW Project Phase 186 — High-quality Poll Badge Read-model / Presentation Plan v1

**Status:** plan only. Phase 186 plans the future public-facing read-model and presentation direction for a low-resolution **優質題目 / high-quality poll badge** after Phase 185-R approval, without implementing any badge, query, API field, or frontend DOM.

**No runtime, API, DB, frontend, migration, schema, badge runtime, read model runtime, public API response field, frontend badge DOM, copy, class, id, threshold runtime, bucket runtime, ranking, recommendation ordering, hotness, trend, personalization, creator score, punishment, demotion, blocking, abuse decision, vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile field, lifecycle, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 186.**

**Baseline:** `origin/master` after Phase 185-R high-quality poll badge eligibility plan review checkpoint (`86fddde`).

**Prior checkpoint:** [Phase 185-R High-quality poll badge eligibility plan review checkpoint](./www-project-phase-185r-high-quality-poll-badge-eligibility-plan-review-checkpoint-v1.md).

**Prior plans and specs:**

- [Phase 182 Quality feedback milestone & governance boundary](./www-project-phase-182-quality-feedback-milestone-governance-boundary-v1.md)
- [Phase 183 High-quality poll presentation governance spec](./www-project-phase-183-high-quality-poll-presentation-governance-spec-v1.md)
- [Phase 184 High-quality poll badge eligibility plan](./www-project-phase-184-high-quality-poll-badge-eligibility-plan-v1.md)

---

## 1. Scope

Phase 186 is **plan only**.

It defines the safe future direction for a public-facing **high-quality poll badge read-model and presentation layer** if a later phase implements badge display.

This phase only adds:

- This planning document.
- A doc guard test.
- A README index entry.

Phase 186 does **not** add:

- Runtime.
- API.
- DB behavior.
- Frontend.
- Migration.
- Schema.
- Badge runtime.
- Read model runtime.
- Public API response field.
- Frontend badge DOM, copy, class, or id.
- Threshold runtime.
- Bucket runtime.
- Query.

Quality feedback remains a **poll-level aggregate signal** only.

---

## 2. Non-goals

Phase 186 does not implement or approve implementation of:

- Badge runtime.
- Read model runtime.
- Public API response field for badge display.
- Frontend badge DOM, copy, class, or id.
- Aggregate read query.
- Threshold runtime.
- Bucket runtime.
- Ranking.
- Recommendation ordering.
- Hotness.
- Trend.
- Personalization.
- Creator score.
- Punishment.
- Demotion / 降權.
- Blocking.
- Abuse decision.
- Abuse-prevention enforcement.
- Dashboard.
- Analytics.
- Public-facing badge UI.
- Creator-facing badge UI.

Phase 186 does not expose:

- `aggregate_count`.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- `tag_counts`.
- Score.
- Rank.
- Percentile.
- Threshold state.
- Bucket state.
- Creator score.

Phase 186 does not create:

- Per-user feedback event table.
- Option/user/session/device/request/log/trace/metric/error/analytics linkage.
- Feedback-to-option-choice linkage.
- Feedback-to-voter-identity linkage.

Phase 186 does not change:

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

## 3. Public read-model shape

If a future approved phase adds a public read model for badge presentation, the public-facing output must remain **low-resolution and boolean-like**.

Allowed future public read-model field direction:

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

Rules:

- `quality_badge` is the only planned public badge field name for this read-model direction.
- `null` means no badge should be shown.
- `"positive_feedback"` means a low-resolution positive badge may be shown.
- No other enum values, reason codes, confidence levels, or nested objects are planned in Phase 186.

Phase 186 does **not** define the API route, response envelope, caching, computation job, SQL query, or frontend mount point. It only defines the safe public field shape ceiling.

---

## 4. Forbidden output fields

Future public read models must **not** return:

| Forbidden field | Reason |
|-----------------|--------|
| `score` | Implies ranking or numeric judgment |
| `rank` | Ranking-direction signal |
| `percentile` | Numeric inference |
| `aggregate_count` | Exposes feedback volume |
| `tag_counts` | Enables tag-level reconstruction |
| `tag_breakdown` | Enables tag-level reconstruction |
| `raw_feedback_total` | Exposes feedback volume |
| `threshold_state` | Reveals non-qualification mechanics |
| `bucket_state` | Reveals non-qualification mechanics |
| `creator_score` | Creator punishment/reputation signal |
| `reason_code` | Distinguishes why badge is absent |
| `eligibility_status` | Distinguishes why badge is absent |
| `minimum_volume_met` | Low-volume reverse inference |
| `negative_feedback_count` | Public shame or punishment signal |

Future public read models must not echo option info, vote counters, eligibility outcomes, auth state, profile fields, or lifecycle internals through the badge field.

---

## 5. Null behavior and low-volume privacy

When a poll is **not qualified**, **low volume**, **not yet computed**, or **blocked by conservative gating**, the public read-model output must be unified:

```json
{ "quality_badge": null }
```

Rules:

- All non-display cases collapse to the same `null` value.
- Public output must **not distinguish reasons** for `null`.
- No `reason_code`, `status`, `pending`, `insufficient_feedback`, `below_threshold`, or equivalent field may accompany `null`.
- Low-volume reverse inference is forbidden.
- Creators and public viewers must not infer exact feedback volume from public output.

Explicitly banned public states when badge is absent:

- `尚未達標`
- `回饋不足`
- `品質不足`
- "Not enough feedback."
- "Below threshold."
- "Quality insufficient."

Public frontend receiving `quality_badge: null` must **completely not display badge**. It must not show negative, scarcity, failure, punishment, or abuse-review states.

---

## 6. Public presentation copy boundary

If a future phase displays a badge when `quality_badge: "positive_feedback"`, copy must be:

- Positive.
- Low-resolution.
- Non-ranking.
- Non-scoring.
- Non-punitive.

Allowed copy direction examples:

- `回饋良好`

Forbidden copy examples:

- `優質第幾名`
- `高分題目`
- `低品質`
- Any score, rank, percentile, vote count, feedback count, or tag breakdown wording.

Phase 186 does **not** add frontend badge DOM, copy, class, or id. Copy examples here are planning guidance only.

Badge presentation must not affect vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile fields, or lifecycle.

---

## 7. Creator-facing separation

Creator-facing read model and presentation must **open a separate phase**.

Phase 186 public read-model planning must **not** mix creator debug, explanation, threshold miss detail, exact counts, or governance notes into public responses.

Forbidden in public read model:

- Creator-only explanation fields.
- Creator debug fields.
- Creator eligibility diagnostics.
- Creator-facing low-volume status.
- Creator-facing exact positive/negative counts.

Creator-facing UI must avoid low-volume reverse inference and exact numbers, as required by Phase 183 and Phase 184. That work is out of scope for Phase 186.

---

## 8. Ordering / ranking boundary

Future read model and badge presentation must **not** change:

- Feed ordering.
- Explore ordering.
- Results visibility.
- Lifecycle state.

Badge eligibility and presentation must not become ranking input, recommendation ordering input, hotness input, trend input, or personalization input.

`GET /polls/feed` remains freshness-only unless explicitly replanned under separate Wonder Flow governance. Badge read model must not alter existing public ordering behavior.

---

## 9. Privacy and linkage boundary

Quality feedback remains poll-level aggregate signal only.

Phase 186 must not plan or approve:

- Per-user feedback event table.
- `option_id` / `option_index` / selected option linkage.
- `user_id` / `session_id` / `creator_session` / `vote_token` linkage.
- `request_id` / device / IP / UA linkage.
- Log / trace / metric / error / analytics linkage.

Feedback must not be linked with option choice or voter identity.

Raw Option Linkage Ban remains in force. Phase 186 does not weaken it.

---

## 10. Future implementation prerequisites

Any future implementation of badge read model, badge query, public API response field, frontend badge DOM, creator-facing read model, threshold runtime, or bucket runtime must:

1. Open a **separate phase** after this plan.
2. Pass a **separate review checkpoint** before runtime work begins.
3. Define minimum volume, privacy, abuse, copy, display location, and rollback/removal rules per Phase 183 and Phase 184.
4. Keep public output limited to `quality_badge: null` or `quality_badge: "positive_feedback"` only.
5. Keep all non-display cases unified as `null` without reason distinction.
6. Keep creator-facing read model in a separate phase.

Phase 186 does **not** approve runtime implementation. It only records the read-model and presentation ceiling.

---

## 11. Phase 186 conclusion

Phase 186 is plan only.

It does not add runtime, API, DB, frontend, migration, schema, badge runtime, read model runtime, public API response field, frontend badge DOM, copy, class, id, threshold runtime, bucket runtime, ranking, recommendation ordering, hotness, trend, personalization, creator score, punishment, demotion, blocking, or abuse decision.

Quality feedback remains poll-level aggregate signal only. No per-user feedback event table. No option/user/session/device/request/log/trace/metric/error/analytics linkage. Feedback must not be linked with option choice or voter identity.

Future public read model may return at most:

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

It must not return `score`, `rank`, `percentile`, `aggregate_count`, `tag_counts`, `threshold_state`, `bucket_state`, or `creator_score`.

When not qualified, low volume, not computed, or conservatively gated, public output must unify to `null` without distinguishing reasons. Public frontend receiving `null` must completely not display badge and must not show `尚未達標`, `回饋不足`, `品質不足`, or equivalent negative or scarcity states.

Creator-facing read model must open a separate phase. Future implementation must pass a separate review checkpoint before runtime.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Raw Option Linkage Ban, result visibility, eligibility, auth, Reference Answer, UserAuthResolver, profile fields, and lifecycle remain unchanged.

`design-drafts/` must remain uncommitted.

---

## 12. Validation Plan

Phase 186 validation should include:

- `npm test`
- `npm run typecheck`
- `npm run build`

Focused doc guard:

- `tests/docs/phase-186-high-quality-poll-badge-read-model-presentation-plan-doc.test.ts`

`design-drafts/` must remain uncommitted.
