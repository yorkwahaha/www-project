# WWW Project Phase 187 — High-quality Poll Badge Runtime Implementation Plan v1

**Status:** plan only. Phase 187 plans the future minimal, safe, low-resolution **優質題目 / high-quality poll badge** runtime implementation route after Phase 186-R approval, without implementing any badge runtime, query, API field, frontend DOM, schema, or migration.

**No runtime, API, DB, frontend, migration, schema, badge runtime, public API response field, frontend badge DOM, copy, class, id, threshold runtime, bucket runtime, ranking, recommendation ordering, hotness, trend, personalization, creator score, punishment, demotion, blocking, abuse decision, vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile field, lifecycle, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 187.**

**Baseline:** `origin/master` after Phase 186-R high-quality poll badge read-model presentation plan review checkpoint (`cd0788a`).

**Prior checkpoint:** [Phase 186-R High-quality poll badge read-model presentation plan review checkpoint](./www-project-phase-186r-high-quality-poll-badge-read-model-presentation-plan-review-checkpoint-v1.md).

**Prior plans and specs:**

- [Phase 182 Quality feedback milestone & governance boundary](./www-project-phase-182-quality-feedback-milestone-governance-boundary-v1.md)
- [Phase 183 High-quality poll presentation governance spec](./www-project-phase-183-high-quality-poll-presentation-governance-spec-v1.md)
- [Phase 184 High-quality poll badge eligibility plan](./www-project-phase-184-high-quality-poll-badge-eligibility-plan-v1.md)
- [Phase 186 High-quality poll badge read-model / presentation plan](./www-project-phase-186-high-quality-poll-badge-read-model-presentation-plan-v1.md)

---

## 1. Scope

Phase 187 is **plan only**.

It defines the safe future direction for a **minimal public-facing quality badge runtime** if a later approved phase implements badge display after passing Phase 187-R review checkpoint.

This phase only adds:

- This planning document.
- A doc guard test.
- A README index entry.

Phase 187 does **not** add:

- Runtime.
- API.
- DB behavior.
- Frontend.
- Migration.
- Schema.
- Badge runtime.
- Public API response field.
- Frontend badge DOM, copy, class, or id.
- Threshold runtime.
- Bucket runtime.
- Query.
- Durable badge table.

Quality feedback remains a **poll-level aggregate signal** only.

---

## 2. Non-goals

Phase 187 does not implement or approve implementation of:

- Badge runtime.
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
- Durable badge table.
- Badge cache or materialized state table.

Phase 187 does not expose:

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

Phase 187 does not create:

- Per-user feedback event table.
- Option/user/session/device/request/log/trace/metric/error/analytics linkage.
- Feedback-to-option-choice linkage.
- Feedback-to-voter-identity linkage.

Phase 187 does not change:

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

## 3. Future runtime surfaces

If a future approved phase implements badge runtime after Phase 187-R, it should consider **public poll read surfaces only**, for example:

- Poll detail read.
- Poll results read.
- Explore item read.

Rules:

- Badge output is **display-only** on existing read surfaces.
- Badge must **not** change feed ordering, explore ordering, results visibility, or lifecycle state.
- Badge must not become a ranking input, recommendation ordering input, hotness input, trend input, or personalization input.
- Badge must not alter vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, or profile fields.

Phase 187 does **not** name exact route handlers, response envelopes, caching layers, or frontend mount points. It only records which surface classes are in scope for future runtime consideration.

---

## 4. Future public API shape

If a future approved phase adds a public API field for badge display, the public-facing output must remain **low-resolution and boolean-like**.

Allowed future public API field ceiling:

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

Rules:

- `quality_badge` is the only planned public badge field name for this runtime direction.
- `null` means no badge should be shown.
- `"positive_feedback"` means a low-resolution positive badge may be shown.
- No other enum values, reason codes, confidence levels, or nested objects are planned in Phase 187.

Forbidden future public API fields include:

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

Phase 187 does **not** define the API route, response envelope, caching, computation job, SQL query, or frontend mount point. It only defines the safe public field shape ceiling for future runtime.

---

## 5. Future read helper direction

If a future approved phase implements badge runtime, the first version should:

1. Read only from existing `poll_quality_feedback_aggregate` rows.
2. Derive a **boolean-like** badge outcome internally.
3. Output only `quality_badge: null` or `quality_badge: "positive_feedback"` on public read surfaces.
4. **Not** output any derivation details, intermediate counts, tag breakdown, threshold state, bucket state, or eligibility diagnostics in the public response.

Suggested internal direction (planning only — not implemented in Phase 187):

- A server-side read helper may evaluate poll-level aggregate positive-tag signals against eligibility rules defined in Phase 184.
- The helper must collapse all non-display outcomes to `null`.
- The helper must not echo `aggregate_count`, tag count, tag breakdown, or raw feedback total to public callers.
- The helper must not create durable user-option linkage or per-user feedback event records.

If future runtime needs a dedicated cache or materialized badge state, that requires a **separate schema/migration phase**. Phase 187 does not approve durable badge tables.

---

## 6. Null behavior and low-volume privacy

When a poll is **not qualified**, **low volume**, **not yet computed**, or **blocked by conservative gating**, the future public API output must be unified:

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
- `低品質`
- "Not enough feedback."
- "Below threshold."
- "Quality insufficient."

Public frontend receiving `quality_badge: null` must **completely not display badge**. It must not show negative, scarcity, failure, punishment, or abuse-review states.

---

## 7. Future frontend presentation behavior

If a future approved phase adds public frontend badge presentation:

| `quality_badge` value | Required public frontend behavior |
|-----------------------|-----------------------------------|
| `null` | Completely not display badge. Silent absence only. |
| `"positive_feedback"` | Display positive, low-resolution, non-ranking, non-scoring copy only. |

Allowed copy direction examples:

- `回饋良好`

Forbidden copy examples:

- `尚未達標`
- `回饋不足`
- `品質不足`
- `低品質`
- `優質第幾名`
- `高分題目`
- Any score, rank, percentile, vote count, feedback count, or tag breakdown wording.

Phase 187 does **not** add frontend badge DOM, copy, class, or id. Copy examples here are planning guidance only.

Badge presentation must not affect vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile fields, or lifecycle.

---

## 8. Database/schema boundary

Phase 187 does **not** add:

- Migration.
- SQL DDL.
- Durable badge table.
- Badge cache table.
- Materialized badge state table.
- Per-user feedback event table.
- Any new schema for badge eligibility storage.

Existing `poll_quality_feedback_aggregate` remains the only approved aggregate input for first-version badge runtime planning.

If future runtime needs durable badge cache or materialized state for performance, that work must **open a separate schema/migration phase** with its own governance review. Phase 187 does not approve such tables.

---

## 9. Ordering/ranking boundary

Future badge runtime and presentation must **not** change:

- Feed ordering.
- Explore ordering.
- Results visibility.
- Lifecycle state.

Badge eligibility and presentation must not become ranking input, recommendation ordering input, hotness input, trend input, or personalization input.

`GET /polls/feed` remains freshness-only unless explicitly replanned under separate Wonder Flow governance. Badge runtime must not alter existing public ordering behavior.

---

## 10. Creator-facing boundary

Creator-facing explanation, debug, threshold miss detail, exact counts, and governance notes must **open a separate phase**.

Phase 187 public runtime planning must **not** mix creator debug or explanation fields into public responses.

Forbidden in public API and public frontend:

- Creator-only explanation fields.
- Creator debug fields.
- Creator eligibility diagnostics.
- Creator-facing low-volume status.
- Creator-facing exact positive/negative counts.

Creator-facing UI must avoid low-volume reverse inference and exact numbers, as required by Phase 183 and Phase 184. That work is out of scope for Phase 187.

---

## 11. Privacy/linkage boundary

Quality feedback remains poll-level aggregate signal only.

Phase 187 must not plan or approve:

- Per-user feedback event table.
- `option_id` / `option_index` / selected option linkage.
- `user_id` / `session_id` / `creator_session` / `vote_token` linkage.
- `request_id` / device / IP / UA linkage.
- Log / trace / metric / error / analytics linkage.

Feedback must not be linked with option choice or voter identity.

Raw Option Linkage Ban remains in force. Phase 187 does not weaken it.

---

## 12. Future implementation prerequisites

Any future implementation of badge runtime, badge query, public API response field, frontend badge DOM, creator-facing presentation, threshold runtime, bucket runtime, or durable badge cache must:

1. Pass **Phase 187-R review checkpoint** before runtime work begins.
2. Open implementation only as a **separate phase** after Phase 187-R approval.
3. Define minimum volume, privacy, abuse, copy, display location, and rollback/removal rules per Phase 183 and Phase 184.
4. Keep public output limited to `quality_badge: null` or `quality_badge: "positive_feedback"` only.
5. Keep all non-display cases unified as `null` without reason distinction.
6. Keep creator-facing explanation/debug fields in a separate phase.
7. Prefer first-version derivation from `poll_quality_feedback_aggregate` only, outputting boolean-like badge with no derivation details.
8. Open a separate schema/migration phase before adding durable badge cache or materialized state.

Phase 187 does **not** approve runtime implementation. It only records the minimal safe runtime implementation route.

---

## 13. Phase 187 conclusion

Phase 187 is plan only.

It does not add runtime, API, DB, frontend, migration, schema, badge runtime, public API response field, frontend badge DOM, copy, class, id, threshold runtime, bucket runtime, ranking, recommendation ordering, hotness, trend, personalization, creator score, punishment, demotion, blocking, or abuse decision.

Quality feedback remains poll-level aggregate signal only. No per-user feedback event table. No option/user/session/device/request/log/trace/metric/error/analytics linkage. Feedback must not be linked with option choice or voter identity.

Future public API may return at most:

```json
{ "quality_badge": null }
```

or

```json
{ "quality_badge": "positive_feedback" }
```

It must not return `score`, `rank`, `percentile`, `aggregate_count`, `tag_counts`, `threshold_state`, `bucket_state`, or `creator_score`.

When not qualified, low volume, not computed, or conservatively gated, public output must unify to `null` without distinguishing reasons. Public frontend receiving `null` must completely not display badge and must not show `尚未達標`, `回饋不足`, `品質不足`, `低品質`, or equivalent negative or scarcity states.

No durable badge table. If cache or materialized state is needed, open a separate schema/migration phase. First-version runtime should derive from `poll_quality_feedback_aggregate` only and output boolean-like badge without derivation details.

Creator-facing explanation/debug fields must open a separate phase. Future implementation must pass **Phase 187-R review checkpoint** before runtime.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Raw Option Linkage Ban, result visibility, eligibility, auth, Reference Answer, UserAuthResolver, profile fields, and lifecycle remain unchanged.

`design-drafts/` must remain uncommitted.

---

## 14. Validation Plan

Phase 187 validation should include:

- `npm test`
- `npm run typecheck`
- `npm run build`

Focused doc guard:

- `tests/docs/phase-187-high-quality-poll-badge-runtime-implementation-plan-doc.test.ts`

`design-drafts/` must remain uncommitted.
