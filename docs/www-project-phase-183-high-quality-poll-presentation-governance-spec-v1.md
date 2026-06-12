# WWW Project Phase 183 — High-quality Poll Presentation Governance Spec v1

**Status:** governance spec only. Phase 183 defines the future boundary for any **優質題目 / high-quality poll presentation** that might use quality feedback for public-facing or creator-facing presentation.

**No runtime, API, DB, frontend, migration, schema, badge runtime, ranking, recommendation ordering, hotness, trend, personalization, threshold runtime, bucket runtime, creator score, punishment, demotion, blocking, abuse decision, vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile field, lifecycle, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior is added or changed by Phase 183.**

**Baseline:** `origin/master` after Phase 182 quality feedback milestone and governance boundary (`51320c6`).

**Prior milestone:** [Phase 182 Quality feedback milestone & governance boundary](./www-project-phase-182-quality-feedback-milestone-governance-boundary-v1.md).

---

## 1. Scope

Phase 183 is a governance spec only.

It defines the boundaries that must exist before any future phase may present quality feedback as a public-facing or creator-facing **優質題目 / high-quality poll presentation** signal.

This phase only adds:

- This governance document.
- A doc guard test.
- A README index entry.

Phase 183 does **not** add:

- Runtime.
- API.
- DB behavior.
- Frontend.
- Migration.
- Schema.
- High-quality poll badge runtime.
- Public-facing display.
- Creator-facing display.

Quality feedback remains a **poll-level aggregate signal** only. It must not become a user-level, option-level, session-level, device-level, request-level, log-level, trace-level, metric-level, error-level, or analytics-level signal.

---

## 2. Non-goals

Phase 183 does not implement or approve implementation of:

- **優質題目 / high-quality poll** badge runtime.
- Ranking.
- Recommendation ordering.
- Hotness.
- Trend.
- Personalization.
- Threshold runtime.
- Bucket runtime.
- Creator score.
- Punishment.
- Demotion.
- Ranking downweight.
- Blocking.
- Abuse decision.
- Abuse-prevention enforcement.
- Dashboard.
- Analytics.
- Any public or creator-facing quality feedback UI.

Phase 183 does not expose:

- `aggregate_count`.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- Threshold state.
- Bucket state.
- Ranking signal.
- Creator score.
- Creator punishment signal.

Phase 183 does not change:

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

## 3. Allowed Future Direction

Future high-quality poll presentation may be discussed only as **low-resolution presentation**.

Allowed future direction is limited to non-ranking, non-scoring, non-precise presentation such as a badge or label that does not reveal exact feedback volume or tag composition.

Any future badge or label must:

- Avoid exact numbers.
- Avoid precision that lets viewers infer low-volume feedback.
- Avoid public rank, creator rank, quality score, creator score, or punishment meaning.
- Avoid recommendation ordering, hotness, trend, personalization, or ranking use.
- Avoid implying that one poll is officially better than another in a sortable or score-like way.
- Avoid changing vote collection, vote counting, eligibility, result display, auth, Reference Answer, UserAuthResolver, profile fields, or lifecycle behavior.

Future public-facing copy must avoid suggesting precise score, ranking, creator grade, creator quality tier, punishment, demotion, or abuse decision.

Future creator-facing copy must avoid showing low-volume feedback signals that could be reverse-engineered into tag counts, raw totals, or individual feedback behavior.

Any badge or presentation implementation must open a separate phase before coding.

---

## 4. Explicit Bans

The following are explicitly banned in Phase 183 and remain banned for future high-quality poll presentation unless a later governance phase explicitly approves a safe alternative:

| Banned item | Boundary |
|-------------|----------|
| High-quality poll badge runtime | Requires a future phase |
| Ranking | Must not use quality feedback for ranking direction |
| Recommendation ordering | Must not order polls by quality feedback |
| Hotness | Must not use quality feedback as hotness input |
| Trend | Must not use quality feedback as trend input |
| Personalization | Must not personalize by quality feedback |
| Threshold runtime | No runtime threshold state in this phase |
| Bucket runtime | No runtime bucket state in this phase |
| Creator score | No score derived from feedback |
| Punishment / demotion / downweight / blocking | No penalty or enforcement from feedback |
| Abuse decision | No abuse or quality enforcement decision from feedback |
| Public aggregate counts | Do not expose `aggregate_count` |
| Public tag counts | Do not expose tag count |
| Public tag breakdown | Do not expose tag breakdown |
| Public raw totals | Do not expose raw feedback total |
| Event table | Do not create a per-user feedback event table |
| Option linkage | Do not link feedback to option choice |
| Voter identity linkage | Do not link feedback to voter identity |
| Logs / metrics / analytics / APM | Do not create observability or analytics linkage |

Future presentation must not expose `aggregate_count`, tag count, tag breakdown, raw feedback total, threshold state, bucket state, ranking signal, or creator score.

---

## 5. Privacy Boundary

Quality feedback must remain poll-level aggregate signal only.

It must not create, require, read, write, display, log, export, or infer:

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

Feedback must never be linked to option choice or voter identity in durable storage, API payloads, frontend state intended to persist, logs, metrics, traces, errors, analytics, dashboards, exports, or review tooling.

Creator-facing presentation must be especially conservative because creators may know timing, audience, or expected respondents. Low-volume signals must not be shown in a way that allows a creator to reverse-engineer who gave feedback or which tag was selected.

---

## 6. Abuse / Manipulation Boundary

Quality feedback may not become an abuse-prevention enforcement system in this phase.

Phase 183 does not add:

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

If future work wants to use quality feedback for abuse prevention, manipulation handling, governance review, or enforcement, it must open a separate governance/privacy phase before design or implementation.

That future phase must prove that the design does not require user/session/device/request linkage, option choice linkage, low-volume disclosure, or hidden ranking manipulation.

---

## 7. Public-facing Copy Boundary

Public-facing copy for future high-quality poll presentation must be low-resolution.

Allowed copy direction may describe a broad presentation such as:

- "High-quality discussion signal."
- "Positive participant feedback."
- "Clear and constructive poll."

Public-facing copy must not say or imply:

- Exact score.
- Exact rank.
- Exact feedback count.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- Creator grade.
- Creator level.
- Creator punishment.
- Abuse finding.
- Trend boost.
- Recommendation boost.
- Ranking position.

The badge or label, if ever implemented, must not be used as a sortable public score or as a hidden answer-direction ranking signal.

---

## 8. Creator-facing Copy Boundary

Creator-facing copy must avoid low-volume reverse inference.

Future creator-facing presentation must not display:

- `aggregate_count`.
- Tag count.
- Tag breakdown.
- Raw feedback total.
- Per-tag deltas.
- Low-volume positive or negative tag signals.
- Signals tied to a particular vote window, user, session, request, device, log, trace, metric, error, analytics record, or option choice.

Creator-facing copy may only be considered after a future phase defines minimum volume and privacy rules that prevent reverse inference.

It must not imply creator score, creator rank, creator quality tier, punishment, demotion, blocking, abuse decision, or future ranking treatment.

---

## 9. Future Implementation Prerequisites

Any future implementation of high-quality poll presentation, badge, label, public surface, creator-facing surface, or display rule must open a separate phase.

Before implementation, that phase must define at least:

1. **Minimum volume rule** — prevents low-volume feedback disclosure and creator reverse inference.
2. **Privacy rule** — preserves poll-level aggregate only and bans option/user/session/device/request/log/trace/metric/error/analytics linkage.
3. **Abuse boundary** — states that presentation is not punishment, demotion, blocking, abuse decision, or enforcement unless separately governed.
4. **Copy rule** — keeps public and creator-facing copy non-precise, non-ranking, non-score, and non-punitive.
5. **Display location rule** — defines where the badge or label may appear and confirms it cannot affect vote transaction, vote-by-index, eligibility, result visibility, auth, Reference Answer, UserAuthResolver, profile fields, or lifecycle.
6. **Rollback/removal rule** — defines how to remove or disable presentation without changing feedback aggregates, vote behavior, result visibility, eligibility, auth, or creator identity boundaries.

Without those prerequisites, no badge runtime, presentation UI, threshold runtime, bucket runtime, public display, creator display, ranking input, recommendation ordering, hotness input, trend input, personalization input, creator score, punishment, demotion, blocking, or abuse decision may be implemented.

---

## 10. Phase 183 Conclusion

Phase 183 is governance spec only.

It does not add runtime, API, DB, frontend, migration, schema, badge runtime, ranking, recommendation ordering, hotness, trend, personalization, threshold runtime, bucket runtime, creator score, punishment, demotion, blocking, abuse decision, dashboard, analytics, or presentation UI.

Quality feedback remains poll-level aggregate signal only. It must not expose `aggregate_count`, tag count, tag breakdown, or raw feedback total. It must not create a per-user feedback event table. It must not add option/user/session/device/request/log/trace/metric/error/analytics linkage. It must not link feedback with option choice or voter identity.

Future **優質題目 / high-quality poll presentation** must open a separate phase and define minimum volume rule, privacy rule, abuse boundary, copy rule, display location rule, and rollback/removal rule before implementation.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Raw Option Linkage Ban, result visibility, eligibility, auth, Reference Answer, UserAuthResolver, profile fields, and lifecycle remain unchanged.

---

## 11. Validation Plan

Phase 183 validation should include:

- `npm test`
- `npm run typecheck`
- `npm run build`

Focused doc guard:

- `tests/docs/phase-183-high-quality-poll-presentation-governance-spec-doc.test.ts`

`design-drafts/` must remain uncommitted.
