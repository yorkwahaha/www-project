# WWW Project Phase 180 — Quality Feedback Aggregate Write API Runtime Foundation v1

**Status:** minimal runtime API foundation. Adds `POST /polls/:pollId/quality-feedback` for poll-level aggregate feedback increments only. No schema or migration changes, no frontend UX, no per-user event table, no duplicate prevention, no option/vote/user/session/request/device/log/trace linkage, and no analytics, metrics, APM, ranking, dashboard, personalization, threshold, bucket, or creator punishment behavior is added.

This phase has no per-user feedback event table and no duplicate prevention.

**Baseline:** `origin/master` after Phase 179 quality feedback aggregate write API runtime plan (`93fe8ee`).

---

## 1. Scope

Phase 180 implements only the aggregate write API:

```http
POST /polls/:pollId/quality-feedback
Content-Type: application/json

{ "feedback_tag": "表達清楚" }
```

Successful response is only:

```json
{ "ok": true }
```

The write path validates `pollId` existence and one `feedback_tag`, then increments only `poll_quality_feedback_aggregate` for `(poll_id, feedback_tag)`.

---

## 2. Runtime Behavior

Accepted tags:

- `表達清楚`
- `選項公平`
- `值得思考`
- `期待結果`
- `題目不優`

Rejected request bodies:

- missing `feedback_tag`.
- non-string `feedback_tag`.
- empty `feedback_tag`.
- tag outside the five MVP tags.
- any extra field.

The response does not include `aggregate_count`, `threshold_state`, `bucket_state`, ranking signal, creator score, poll result, or option info.

---

## 3. Database Behavior

No migration or schema change is added in Phase 180.

The repository writes only:

```text
poll_quality_feedback_aggregate
  key: (poll_id, feedback_tag)
  insert: aggregate_count = 1
  update: aggregate_count = aggregate_count + 1, updated_at = NOW()
```

It does not write feedback event rows, user rows, session rows, vote tokens, vote counters, option rows, logs, metrics, traces, errors, analytics, ranking data, dashboard data, thresholds, buckets, or creator scores.

---

## 4. Explicit Non-Goals

Phase 180 does not add:

- schema/migration.
- per-user feedback event table.
- duplicate prevention.
- option/vote/user/session/request/device/log/trace linkage.
- vote token reads or writes.
- counter shard reads or writes.
- result visibility logic.
- eligibility logic.
- auth requirement.
- frontend feedback UX.
- logs/metrics/APM/analytics.
- dashboard/ranking/personalization/creator punishment.
- threshold or bucket state.

Phase 181 may handle frontend post-vote feedback UX. Phase 180 intentionally leaves frontend unchanged.

---

## 5. Preserved Boundaries

Unchanged by Phase 180:

- Raw Option Linkage Ban.
- Official Vote transaction order.
- `vote-by-index` eligibility-before-option-resolve.
- `vote-by-index` body `{ option_index }`.
- Vote token schema: `user_id + poll_id`.
- Counter schema: `poll_id + option_id + shard_id`.
- Result visibility.
- Eligibility.
- Auth.
- Reference Answer.
- `UserAuthResolver`.
- profile fields.
- `/users/me`.
- `/users/me/profile`.
- `creator_session` production identity boundary (creator_session production identity boundary).

The feedback API is unauthenticated and does not read or persist user/session identity.

---

## 6. Validation

```bash
npm run migrate:check
npm test
npm run typecheck
npm run test:integration:local -- quality-feedback
```

Focused coverage:

- valid first write creates count 1.
- repeated valid write increments to count 2.
- different tags increment separately.
- invalid tags and extra fields are rejected.
- forbidden body fields are rejected.
- success response is only `{ "ok": true }`.
- no login is required.
- vote token and counter shard tables are not touched.
- source guards isolate feedback runtime from option, vote, identity, request, device, observability, ranking, threshold, bucket, and creator-score linkage.

---

## 7. Privacy and Integrity Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 180 writes anonymous poll-level aggregate counts only.
