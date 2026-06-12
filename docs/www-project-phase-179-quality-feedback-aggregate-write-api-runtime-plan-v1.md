# WWW Project Phase 179 — Quality Feedback Aggregate Write API Runtime Plan v1

**Status:** docs/spec and guard tests only. Plans a future aggregate write API/runtime boundary for poll quality feedback. **Not implemented.** No migration, schema change, runtime route, repository, service, frontend, logs, metrics, APM, analytics, dashboard, ranking, personalization, creator punishment score, event table, threshold state, or bucket state is added by this phase.

**Baseline:** `origin/master` after Phase 178-R quality feedback aggregate schema runtime readiness review checkpoint (`c14b7e1`).

**Prior specs:**

- [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md)
- [Phase 172 Quality feedback privacy & abuse boundary spec](./www-project-phase-172-quality-feedback-privacy-abuse-boundary-spec-v1.md)
- [Phase 173 Quality feedback data model planning spec](./www-project-phase-173-quality-feedback-data-model-planning-spec-v1.md)
- [Phase 174 Quality feedback API & runtime boundary planning spec](./www-project-phase-174-quality-feedback-api-runtime-boundary-planning-spec-v1.md)
- [Phase 177 Quality feedback aggregate schema foundation](./www-project-phase-177-quality-feedback-aggregate-schema-foundation-v1.md)
- [Phase 178-R Quality feedback aggregate schema runtime readiness review checkpoint](./www-project-phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint-v1.md)

---

## 1. Purpose

Phase 179 defines the safe planning boundary for a future quality feedback aggregate write API. The future API may only increment `poll_quality_feedback_aggregate` at poll level for one `(poll_id, feedback_tag)` pair.

The future write path must not become a per-user feedback trail, vote-choice side channel, option-quality signal, analytics event stream, ranking input, dashboard feed, or creator punishment mechanism.

---

## 2. Future API Direction

Recommended future route:

```http
POST /polls/:pollId/quality-feedback
Content-Type: application/json

{ "feedback_tag": "表達清楚" }
```

The path `pollId` supplies poll scope. The body must be limited to exactly one field:

```json
{ "feedback_tag": "表達清楚" }
```

Future runtime should reject, ignore, or fail closed on any body field beyond `feedback_tag`. The body must not include:

- `option_id`
- `option_index`
- `user_id`
- `session_id`
- `creator_session`
- `vote_token`
- `request_id`
- device / IP / UA
- trace / metric / error / analytics id
- selected option
- `threshold_state`
- `bucket_state`

No query parameter, header, log payload, metric label, trace attribute, error payload, or analytics record may reintroduce those fields as storage or observability linkage.

---

## 3. Feedback Tag Allowlist

Future runtime must accept only the five MVP tags already enforced by the Phase 177 DB CHECK:

- `表達清楚`
- `選項公平`
- `值得思考`
- `期待結果`
- `題目不優`

No free-text tag, localized alias, synonym, option-specific tag, or negative escalation tag is approved by Phase 179.

---

## 4. Runtime Safety Plan

Future runtime must:

- validate only `pollId` and `feedback_tag`.
- increment only `(poll_id, feedback_tag)` in `poll_quality_feedback_aggregate`.
- use an aggregate-only write such as `INSERT ... ON CONFLICT (poll_id, feedback_tag) DO UPDATE SET aggregate_count = aggregate_count + 1, updated_at = NOW()`.
- not create a per-user feedback event table.
- not create a per-session or per-request feedback event table.
- not do user/session/device/request dedup.
- not read or write option selection.
- not read vote token data.
- not read counter shard data.
- not connect feedback with vote choice in the same database row, log, metric, error payload, APM trace, debug payload, or analytics record.
- not modify Official Vote transaction order.
- not modify `vote-by-index` body `{ option_index }`.
- not modify eligibility-before-option-resolve.
- not modify result visibility, auth, profile behavior, or Reference Answer.

The write path must stay separate from Official Vote. A successful vote may be followed by a feedback prompt in frontend flow, but the feedback API itself must not know which option was selected.

---

## 5. UX Planning Boundary

Future feedback UX may appear after an Official Vote success message as a follow-up prompt. This is a frontend flow boundary only.

The feedback write API must not receive, infer, log, or persist:

- selected option id.
- selected option index.
- selected option text.
- whether the submitted vote was official, duplicate, ineligible, or denied.
- vote token state.
- option counter state.

The UX can say thanks after submission. It must not expose counts, buckets, thresholds, creator score, ranking effects, or whether the feedback changed a public or creator-facing state.

---

## 6. Duplicate Handling Plan

MVP planning recommends no per-user duplicate prevention for quality feedback.

Accepting repeated feedback is a lower-risk MVP tradeoff than creating durable identity linkage. Future runtime must not prevent duplicate feedback by storing or joining:

- `user_id + poll_id + feedback_tag`
- `session_id + poll_id + feedback_tag`
- device / IP / UA + `poll_id + feedback_tag`
- `request_id + poll_id + feedback_tag`
- vote token + `feedback_tag`
- selected option + `feedback_tag`

If future abuse prevention becomes necessary, it must be a separate governance/privacy phase. That phase must not secretly add user/session/device/request linkage, selected-option linkage, or feedback event tables.

Short-lived non-durable edge rate limits may be discussed later, but Phase 179 does not approve implementation and does not approve durable dedup storage.

---

## 7. Response Plan

Recommended future response:

```json
{ "ok": true }
```

Future response must not include:

- `aggregate_count`
- `threshold_state`
- `bucket_state`
- ranking signal
- creator score
- creator punishment score
- option status or option validity
- vote token status
- eligibility outcome
- duplicate/dedup status tied to a user, session, device, or request

Failures should use neutral error bodies that do not echo backend internals, option state, eligibility state, vote token state, aggregate counts, thresholds, buckets, ranking signals, creator score, stack traces, or internal error codes.

---

## 8. Explicit Non-Goals

Phase 179 does not add:

- no migration.
- no schema.
- no runtime route.
- no repository/service.
- no frontend.
- no logs/metrics/APM/analytics.
- no dashboard/ranking/personalization/creator punishment.
- no event table.
- no threshold/bucket state.

Phase 179 also does not change:

- Raw Option Linkage Ban.
- Official Vote transaction order.
- `vote-by-index` body `{ option_index }`.
- eligibility-before-option-resolve.
- vote token schema `user_id + poll_id`.
- counter schema `poll_id + option_id + shard_id`.
- result visibility.
- auth.
- profile fields.
- `/users/me`.
- `/users/me/profile`.
- Reference Answer.
- `UserAuthResolver`.

---

## 9. Future Implementation Checklist

Before any future implementation phase writes runtime code, it must verify:

- body parser allows only `feedback_tag`.
- `feedback_tag` allowlist matches Phase 177 DB CHECK.
- `pollId` is the only route/path identity used for aggregate scope.
- the write touches only `poll_quality_feedback_aggregate`.
- no per-user, per-session, per-device, per-request, vote-token, counter-shard, option, log, metric, trace, error, analytics, ranking, dashboard, or creator-score linkage is introduced.
- response remains `{ "ok": true }` or an equally generic acknowledgment.
- validation includes source guards for route, repository, service, logging, and observability boundaries.

---

## 10. Validation Plan

```bash
npm test
npm run typecheck
npm run migrate:check
```

Focused guards:

- `tests/docs/phase-179-quality-feedback-aggregate-write-api-runtime-plan-doc.test.ts`
- `tests/polls/phase-179-quality-feedback-aggregate-write-api-runtime-plan.test.ts`

---

## 11. Privacy and Integrity Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 179 is planning only. It does not implement API/runtime behavior and does not change DB schema. The future API direction is poll-level aggregate increment only.
