# WWW Project Phase 184 — High-quality Poll Badge Eligibility Plan v1

**Status:** plan only. Phase 184 plans the future eligibility direction for a low-resolution **優質題目 / high-quality poll badge** after Phase 183 governance, without implementing any badge or presentation.

**No runtime, API, DB, frontend, migration, schema, badge runtime, query, threshold runtime, bucket runtime, ranking, recommendation ordering, hotness, trend, personalization, creator score, punishment, demotion, blocking, abuse decision, vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile field, lifecycle, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 184.**

**Baseline:** `origin/master` after Phase 183 high-quality poll presentation governance spec (`d23f74f`).

**Prior spec:** [Phase 183 High-quality poll presentation governance spec](./www-project-phase-183-high-quality-poll-presentation-governance-spec-v1.md).

---

## 1. Scope

Phase 184 is plan only.

It defines how future **high-quality poll badge eligibility** should be designed if a later phase wants to display a low-resolution badge based on quality feedback.

This phase only adds:

- This planning document.
- A doc guard test.
- A README index entry.

Phase 184 does **not** add:

- Runtime.
- API.
- DB behavior.
- Frontend.
- Migration.
- Schema.
- Badge runtime.
- Query.
- Threshold runtime.
- Bucket runtime.

Quality feedback remains a **poll-level aggregate signal** only.

---

## 2. Non-goals

Phase 184 does not implement or approve implementation of:

- High-quality poll badge runtime.
- Badge eligibility runtime.
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
- Demotion.
- Ranking downweight.
- Blocking.
- Abuse decision.
- Abuse-prevention enforcement.
- Dashboard.
- Analytics.
- Public-facing badge UI.
- Creator-facing badge UI.

Phase 184 does not expose:

- `aggregate_count`.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- Percentile.
- Score.
- Rank.
- Threshold state.
- Bucket state.
- Ranking signal.
- Creator score.

Phase 184 does not change:

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

---

## 3. Inputs Allowed

Future eligibility may only consider poll-level aggregate quality feedback signals.

Allowed future input direction:

- Poll identity.
- Poll-level aggregate feedback rows keyed only by `(poll_id, feedback_tag)`.
- The five MVP feedback tags:
  - `表達清楚`
  - `選項公平`
  - `值得思考`
  - `期待結果`
  - `題目不優`

Future qualification should bias toward positive signals:

- `表達清楚`
- `選項公平`
- `值得思考`
- `期待結果`

`題目不優` may only be a future conservative gating or manual governance reference direction. It must not directly create public shaming, punishment, demotion, ranking downweight, blocking, abuse decision, or creator score.

Phase 184 does not define a runtime constant, exact threshold, exact minimum count, exact ratio, SQL query, API response, or frontend display rule.

---

## 4. Inputs Forbidden

Future badge eligibility must not use, create, require, read, write, display, log, export, or infer:

- Per-user feedback event table.
- Option-level feedback records.
- `option_id` linkage.
- `option_index` linkage.
- Selected option linkage.
- `user_id` linkage.
- `session_id` linkage.
- `creator_session` linkage.
- `device` linkage.
- IP linkage.
- User-Agent linkage.
- `request_id` linkage.
- Log linkage.
- Trace linkage.
- Metric linkage.
- Error payload linkage.
- Analytics linkage.
- Vote token linkage.
- Counter shard linkage.
- Creator-level score aggregation.

Feedback must never be linked with option choice or voter identity.

Badge eligibility must not aggregate into creator-level score, creator rank, creator quality tier, punishment record, demotion record, abuse decision, ranking input, recommendation ordering input, hotness input, trend input, or personalization input.

---

## 5. Future Eligibility Direction

Future badge eligibility should be a low-resolution boolean-like presentation.

Possible public presentation direction:

- "回饋良好"
- "大家覺得題目清楚"
- "參與者回饋正向"

The badge, if implemented in a future phase, must not show:

- Score.
- Ranking.
- Percentile.
- Exact vote count.
- Exact feedback count.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- Positive-to-negative ratio.
- Threshold value.
- Bucket name that implies count or score.
- Creator score.

Eligibility should be conservative:

- Prefer positive aggregate signals.
- Require minimum volume before any badge can appear.
- Avoid exposing lack of qualification.
- Avoid giving creators or public viewers low-volume inference signals.
- Avoid negative labels or quality-failure states.

This plan does not choose final thresholds or formulas. A later implementation phase must define them under the Phase 183 governance prerequisites.

---

## 6. Minimum Volume Principle

Minimum volume must exist before any future badge presentation is allowed.

The minimum volume rule exists to prevent:

- Low-volume reverse inference.
- Creator inference about who gave feedback.
- Public inference about exact feedback volume.
- Tag-level reconstruction.
- Displaying a badge because of one or very few feedback actions.

Phase 184 does not write minimum volume as a runtime constant. It does not define a numeric threshold, a SQL predicate, a bucket table, or a threshold runtime.

Low-volume polls must not display any status that reveals non-qualification or feedback scarcity.

Explicitly banned low-volume public states:

- `尚未達標`
- `回饋不足`
- `品質不足`
- "Not enough feedback."
- "Below threshold."
- "Quality insufficient."

If a poll is low volume or does not qualify, public UI should completely not display badge instead of showing a negative or scarcity state.

---

## 7. Negative Feedback Handling Boundary

`題目不優` is sensitive because it can become public shaming or creator punishment.

Future use of `題目不優` must follow these boundaries:

- It may only be considered as a future manual governance reference direction or conservative gating direction.
- It must not directly produce public shame.
- It must not directly produce punishment.
- It must not directly produce demotion.
- It must not directly produce ranking downweight.
- It must not directly produce blocking.
- It must not directly produce abuse decision.
- It must not directly produce creator score.
- It must not be exposed as tag count, tag breakdown, raw feedback total, score, ratio, threshold state, or bucket state.

Any future negative-feedback use for governance or abuse handling must open a separate governance/privacy phase before implementation.

---

## 8. Public UI Boundary

Future public UI may only show a badge when a poll qualifies under a separately approved future phase.

If a poll does not qualify, public UI should completely not display badge.

Public UI must not display:

- `尚未達標`
- `回饋不足`
- `品質不足`
- "Not enough feedback."
- "Below threshold."
- "Quality insufficient."
- Score.
- Rank.
- Percentile.
- Exact vote count.
- Exact feedback count.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- Threshold state.
- Bucket state.
- Creator score.
- Punishment state.
- Abuse decision.

The absence of a badge must be silent. It must not imply the poll is bad, low quality, untrusted, punished, demoted, blocked, or under abuse review.

The badge must not affect vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile fields, or lifecycle.

---

## 9. Creator UI Boundary

Phase 184 does not add creator-facing UI.

If a future phase proposes creator-facing badge eligibility presentation, it must avoid low-volume reverse inference and exact numbers.

Creator-facing UI must not display:

- `aggregate_count`.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- Exact positive count.
- Exact negative count.
- Per-tag deltas.
- Low-volume status.
- Threshold miss status.
- "尚未達標".
- "回饋不足".
- "品質不足".
- Signals tied to a voter, option choice, session, request, device, log, trace, metric, error payload, analytics record, or vote window.

Creator-facing copy must not imply creator score, creator rank, creator quality tier, creator punishment, demotion, blocking, abuse decision, or future ranking treatment.

---

## 10. Abuse / Manipulation Boundary

Badge eligibility is not an abuse-prevention system.

Phase 184 does not add:

- Abuse decision.
- Manipulation decision.
- Creator punishment.
- Creator score.
- Creator demotion.
- Poll demotion.
- Poll blocking.
- Ranking downweight.
- Automated moderation.
- Enforcement dashboard.

Future badge eligibility must not become a hidden ranking, recommendation ordering, hotness, trend, personalization, or creator scoring input.

If future work wants quality feedback to influence governance, moderation, abuse handling, or manipulation review, it must open a separate governance/privacy phase before implementation.

---

## 11. Future Implementation Prerequisites

Any future implementation of high-quality poll badge eligibility, badge display, public UI, creator UI, query, threshold, bucket, or presentation runtime must open a separate phase.

Before implementation, that phase must define at least:

1. **Minimum volume rule** — numeric or formal rule that prevents low-volume disclosure, without exposing non-qualification states.
2. **Privacy rule** — preserves poll-level aggregate only and bans option/user/session/device/request/log/trace/metric/error/analytics linkage.
3. **Abuse boundary** — confirms the badge is not punishment, demotion, blocking, abuse decision, creator score, ranking input, or enforcement.
4. **Copy rule** — keeps public and creator-facing copy low-resolution, non-score, non-ranking, non-punitive, and non-precise.
5. **Display location rule** — defines where the badge may appear and confirms absence of the badge is silent.
6. **Rollback/removal rule** — defines how to disable or remove the badge without changing feedback aggregates, vote behavior, result visibility, eligibility, auth, Reference Answer, UserAuthResolver, profile fields, lifecycle, or creator identity boundaries.

Without those prerequisites, no badge runtime, threshold runtime, bucket runtime, query, public display, creator display, ranking input, recommendation ordering, hotness input, trend input, personalization input, creator score, punishment, demotion, blocking, or abuse decision may be implemented.

---

## 12. Phase 184 Conclusion

Phase 184 is plan only.

It does not add runtime, API, DB, frontend, migration, schema, badge runtime, query, threshold runtime, bucket runtime, ranking, recommendation ordering, hotness, trend, personalization, creator score, punishment, demotion, blocking, abuse decision, dashboard, analytics, or UI.

Quality feedback remains poll-level aggregate signal only. It must not expose `aggregate_count`, tag count, tag breakdown, or raw feedback total. It must not create a per-user feedback event table. It must not add option/user/session/device/request/log/trace/metric/error/analytics linkage. It must not link feedback with option choice or voter identity.

Future badge eligibility should be a low-resolution boolean-like presentation only. Low-volume polls must not display `尚未達標`, `回饋不足`, `品質不足`, or any equivalent feedback-scarcity or quality-failure state. If a poll does not qualify, public UI should completely not display badge.

Future implementation must open a separate phase and define minimum volume, privacy, abuse, copy, display location, and rollback/removal rules before coding.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Raw Option Linkage Ban, result visibility, eligibility, auth, Reference Answer, UserAuthResolver, profile fields, and lifecycle remain unchanged.

---

## 13. Validation Plan

Phase 184 validation should include:

- `npm test`
- `npm run typecheck`
- `npm run build`

Focused doc guard:

- `tests/docs/phase-184-high-quality-poll-badge-eligibility-plan-doc.test.ts`

`design-drafts/` must remain uncommitted.
