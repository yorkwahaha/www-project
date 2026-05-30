# WWW Project Agent Implementation Spec v0.1

Project: **WWW Project — What We Wonder／大家想知道**
Document path: `docs/www-project-agent-spec-v0.1.md`
Status: **v0.1 candidate-final**
Review incorporated: ChatGPT + Gemini + Claude
Depends on: `/AGENTS.md`

---

## 0. Document Purpose

This document converts **WWW Project Plan v3** into engineering-level implementation specifications.

This is not a product debate document.
Do not reopen the finalized v3 architecture unless a critical flaw is discovered that would invalidate the MVP structure.

This spec defines:

* Database schema direction
* API contracts
* Privacy boundaries
* Vote transaction rules
* Result display rules
* Logging / metrics / APM scrubber requirements
* Admin correction workflow
* Validation requirements
* Agent implementation phases

All implementation work must obey `/AGENTS.md`.

---

## 1. Core MVP Baseline

The MVP must preserve three non-negotiable principles:

1. Do not secretly store user answer choices.
2. Do not let low-trust answers contaminate official results.
3. Do not let ranking, governance, or result display mechanisms manipulate answer direction.

---

## 2. Design B Is Final for Reference Answer

MVP uses **Reference Answer Design B**.

This means:

* Lv1 Reference Answer backend must not save `option_id`.
* Lv1 Reference Answer backend must not save `option_text`.
* Lv1 Reference Answer backend must not save `selected_option_index`.
* Lv1 Reference Answer backend only saves participation token data.
* Lv1 Reference Answer does not count toward official results.
* Lv1 Reference Answer does not affect heat, trending, homepage ranking, Wonder Flow, or public charts.
* Reference Answer page-level selection memory is JavaScript runtime memory only.
* No cross-session Reference Answer memory in MVP.

Explicitly rejected for MVP:

* Encrypted `option_id`
* Short-TTL option storage
* Lv1 option-level durable counter
* Cross-device Reference Answer history
* Personal preference learning based on Lv1 selected options

Do not implement Design C or any equivalent durable option storage unless the user explicitly changes the finalized architecture.

---

## 3. System Actors

### 3.1 Anonymous / Low-Trust User

May browse public polls.

If allowed by product flow, may submit **Reference Answer** only.

Reference Answer:

* Does not count toward official result.
* Does not affect ranking.
* Does not affect heat / trending / homepage placement.
* Does not affect public charts.
* Does not persist selected option.

---

### 3.2 Official Vote User

May cast Official Vote if eligible.

Official Vote:

* Counts toward official result.
* Uses PostgreSQL Sharded Counter.
* Uses vote token for duplicate prevention.
* Must not create durable user-option linkage.

---

### 3.3 Creator

May create and publish polls.

After publish:

* No edit rights.
* No grace period.
* No option/category/eligibility/close-time edit.
* Mistake paths:

  1. Delete and repost.
  2. Admin Typo Correction.

---

### 3.4 Admin

May process:

* Reports
* Takedown
* Typo correction
* Suspended poll review
* Dual-Admin approval

Admin actions must be logged long-term for Phase 2 audit and collusion detection.

---

## 4. MVP Non-Goals

Do not implement in MVP unless explicitly approved:

* AI semantic pre-review
* Senior Review
* Creator Appeal
* Redis async counter
* Cross-session Reference Answer memory
* High-sensitivity category official launch
* Lv1 option-level durable counter
* Append-only vote event log
* Poll status snapshot
* Durable user-option linkage
* Creator grace-period editing
* Design C Reference Answer option storage

---

# Part A — Database Schema

---

## 5. Required Core Tables

Exact SQL may be adjusted by framework/ORM, but the privacy constraints must not change.

---

## 5.1 `users`

Purpose: user identity and trust status.

Suggested columns:

```text
id
display_name
trust_level
status
created_at
updated_at
```

Notes:

* `trust_level` controls whether user can Reference Answer only or Official Vote.
* Do not store per-poll selected options here.

---

## 5.2 `polls`

Purpose: poll metadata.

Suggested columns:

```text
id
creator_id
title
description
category
status
eligible_rule_id
published_at
closes_at
deleted_at
created_at
updated_at
```

Allowed statuses:

```text
draft
active
closed
deleted
suspended
correction_pending
```

Rules:

* Once published, creator cannot edit poll content.
* Admin Typo Correction is the only allowed post-publish content correction path.
* Do not store result snapshot fields on this table.

Forbidden columns:

```text
current_result_snapshot
current_vote_ratio_snapshot
status_snapshot
last_vote_option_id
```

---

## 5.3 `poll_options`

Purpose: poll options.

Suggested columns:

```text
id
poll_id
option_order
option_text
created_at
updated_at
```

Rules:

* Options cannot be edited by creator after publish.
* Admin Typo Correction must not add/remove/change option semantics.
* `option_id` in this table is poll structure metadata, not user choice data.
* `option_id` must never be linked to a user vote or Reference Answer token.

---

## 5.4 `poll_reference_answer_tokens`

Purpose: record that a low-trust user already submitted Reference Answer.

Suggested columns:

```text
id
user_id
poll_id
answered_at
expires_at
created_at
```

Constraints:

```text
unique(user_id, poll_id)
```

Must not include:

```text
option_id
encrypted_option_id
option_text
selected_option_index
answer_payload
answer_snapshot
```

Rules:

* This table proves participation only.
* It must not reveal selected option.
* It must not feed official result, heat, trending, homepage ranking, Wonder Flow, or public chart.
* `answered_at` should be truncated to minute precision or coarser.

---

## 5.5 `poll_vote_tokens`

Purpose: prevent duplicate Official Vote.

Suggested columns:

```text
id
user_id
poll_id
voted_at_minute
expires_at
created_at
```

Constraints:

```text
unique(user_id, poll_id)
```

TTL:

```text
expires_at = poll.closes_at + 180 days
```

Time precision:

```text
voted_at_minute must be truncated to minute precision or coarser.
Do not store second-level or millisecond-level vote timestamps.
```

Must not include:

```text
option_id
encrypted_option_id
option_text
selected_option_index
vote_snapshot
result_snapshot
eligibility_snapshot
```

Rules:

* This table confirms the user voted.
* It must not reveal which option the user selected.
* Changing TTL requires explicit approval.

---

## 5.6 `poll_option_vote_counters`

Purpose: official sharded counter.

Suggested columns:

```text
poll_id
option_id
shard_id
vote_count
updated_at_minute
```

Primary key:

```text
primary key (poll_id, option_id, shard_id)
```

Rules:

* Counter rows are option-level aggregate data only.
* They must not contain user identity.
* `shard_id` must be generated by server-side CSPRNG.
* Client must not submit or influence `shard_id`.
* `updated_at_minute` must be truncated to minute precision or coarser.
* If `updated_at_minute` is not needed for MVP business logic, omit it.

MVP default shard count:

```text
SHARD_COUNT = 8
```

Changing shard count requires explicit approval.

---

## 5.7 `poll_reports`

Purpose: user/admin reports.

Suggested columns:

```text
id
poll_id
reporter_id
reason_code
reason_text
status
created_at
resolved_at
```

Rules:

* `reason_text` is untrusted free text.
* Do not parse or extract user vote choice from `reason_text`.
* Do not log `reason_text` content in structured logs.
* If a report references a user-selected option, sanitize before storing or displaying.
* Report content must not create durable user-option linkage.

---

## 5.8 `poll_correction_requests`

Purpose: request Admin Typo Correction.

Suggested columns:

```text
id
poll_id
requester_id
correction_target_field
correction_target_id
original_text
proposed_text
reason
status
spread_score_at_submit
spread_score_locked_until
valid_until
submitted_at
created_at
updated_at
```

Target field values:

```text
title
description
option_text
```

Target ID rules:

* `correction_target_id` is nullable.
* If `correction_target_field = option_text`, `correction_target_id` is the `poll_options.id` being corrected.
* This is not user choice data and does not violate the Raw Option Linkage Ban.
* It must never be linked to a user vote token or Reference Answer token.

Validity window:

```text
valid_until = submitted_at + 7 days
```

Rules:

* Correction request must be typo-only.
* Spread Score is locked when request is submitted.
* If older than 24 hours before apply, Spread Score must be recomputed.
* If past `valid_until`, request must be rejected.
* High-risk correction requires Dual-Admin Approval.

---

## 5.9 `poll_correction_logs`

Purpose: immutable record of applied typo correction.

Suggested columns:

```text
id
poll_id
correction_request_id
correction_target_field
correction_target_id
before_text
after_text
applied_by_admin_id
applied_at
public_notice_id
created_at
```

Rules:

* Must not log voter identity or voter option linkage.
* `correction_target_id` may point to a poll option being corrected, but must never be linked to any user vote.
* For Suspended × Correction, this must be written in the same transaction as content update, status update, and public notice.

---

## 5.10 `admin_decision_logs`

Purpose: long-term admin audit log.

Suggested columns:

```text
id
admin_id
target_type
target_id
decision
reason_code
reason_text
submitted_at
metadata_json
created_at
```

Rules:

* Must be retained long-term for Phase 2 admin audit and collusion detection.
* For Dual-Admin flows, each admin decision must be submitted independently.
* Admin B must not see Admin A’s decision before submitting.
* `metadata_json` must not include user vote option linkage.

---

## 5.11 `public_notices`

Purpose: public-facing notices for corrected or suspended polls.

Suggested columns:

```text
id
poll_id
notice_type
notice_text
created_at
```

For Suspended × Correction, notice must state:

* Poll was previously suspended.
* Admin typo correction was applied.
* Correction did not change semantic direction.
* Apply time.

Do not expose:

* Voter information
* Admin private information
* Internal risk score details

---

## 5.12 Forbidden Tables

Do not create:

```text
vote_events
raw_vote_events
poll_status_snapshot
reference_answer_option_counters
reference_answer_events
user_poll_option_links
poll_vote_snapshots
vote_audit_events_with_option_id
```

Any equivalent table that recreates durable user-option linkage is also forbidden.

---

# Part B — API Specification

---

## 6. Poll APIs

---

## 6.1 `POST /polls`

Purpose: create draft or publishable poll.

Request fields:

```text
title
description
category
options[]
eligible_rule_id
closes_at
```

Rules:

* Validate at least required number of options.
* Validate category.
* Run high-sensitivity category detection.
* If high-sensitivity category is detected during MVP, block or route to safe review path.
* Do not create result snapshot.

Response:

```text
poll_id
status
created_at
```

---

## 6.2 `GET /polls/:id`

Purpose: fetch poll detail.

Rules:

* Pre-vote response must not include answer-direction signals.
* Do not include raw counters before user votes.
* Do not include Manipulation Integrity Warning in a way that directs pre-vote answer choice.

Response may include:

```text
poll_id
title
description
category
options[]
status
closes_at
user_participation_state
```

Pre-vote response must not include:

```text
option_vote_count
option_vote_ratio
option_growth
manipulation_direction_signal
```

---

## 6.3 `DELETE /polls/:id`

Purpose: creator delete/repost path.

Rules:

* Creator may delete own poll if policy allows.
* Delete must not mutate poll into a new semantic version.
* Deleted poll must not be silently rewritten.

Response:

```text
poll_id
status = deleted
deleted_at
```

---

## 6.4 `GET /polls/feed`

Purpose: Wonder Flow / homepage / discovery feed.

Rules:

* Before vote, ranking must not use answer-direction signals.
* Do not rank by option ratio, option growth, option-level engagement, or Manipulation Integrity Warning.
* Use only approved non-directional signals.

Allowed ranking inputs:

```text
published_at
poll age / freshness
category match with user preference, if not answer-based
creator reputation score, if not answer-based
safe participation bucket
non-directional engagement
report/takedown state
basic quality signals
```

Forbidden ranking inputs:

```text
option percentage
option vote growth
user answer direction
Manipulation Integrity Warning
option-level engagement
answer-direction similarity
Reference Answer selected option
Official Vote selected option
```

---

# Part C — Reference Answer

---

## 7. Reference Answer API

### `POST /polls/:id/reference-answer`

Purpose: allow low-trust participation without official result contamination.

Request:

```text
option_id
```

Important:

* `option_id` may exist only in request handling memory.
* It must not be persisted.
* It must not be logged with user/session/request identity.
* It must not update option-level counters.

Transaction:

1. Validate user.
2. Validate poll is active.
3. Validate option belongs to poll.
4. Insert `poll_reference_answer_tokens`.
5. Return success.

Database writes:

```text
poll_reference_answer_tokens only
```

Must not write:

```text
poll_option_vote_counters
reference_answer_option_counters
vote_events
logs containing option_id + user/request identity
```

Response:

```text
status = "recorded"
reference_answered = true
```

Do not return official result based on Reference Answer.

---

## 8. Reference Answer Frontend Memory

Frontend may temporarily remember selected option only in JS runtime memory for current page session.

Allowed:

```text
component state
in-memory store cleared on navigation
page-local JavaScript variable
```

Forbidden:

```text
localStorage
sessionStorage
IndexedDB
cookie
URL query param
server session
persistent cache
```

BFCache handling required:

```javascript
window.addEventListener('pagehide', () => {
  clearReferenceAnswerRuntimeMemory();
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted === true) {
    clearReferenceAnswerRuntimeMemory();
    resetReferenceAnswerUI();
  }
});
```

Acceptance tests:

* Answer Reference Answer.
* Navigate away.
* Browser back via BFCache.
* Previous selected option must not remain selected.
* UI must reset.
* No selected option must be recoverable from storage.

---

# Part D — Official Vote

---

## 9. Official Vote API

### `POST /polls/:id/vote`

Purpose: cast official vote.

Request:

```text
option_id
```

Important:

* `option_id` may exist only during request handling and counter update.
* No durable user-option linkage may be created.
* Logs, metrics, APM traces, debug payloads, and error payloads must not capture `option_id` with user/session/request identity.

Transaction flow:

1. Validate authenticated user.
2. Validate user is eligible for Official Vote.
3. Validate poll is active.
4. Validate option belongs to poll.
5. Check or insert `poll_vote_tokens` under unique constraint.
6. Generate `shard_id` using backend runtime CSPRNG after the vote request is validated and before counter update.
7. Increment `poll_option_vote_counters`.
8. Commit transaction.

Rollback rules:

* If token insert fails, counter increment must rollback.
* If counter increment fails, token insert must rollback.
* If duplicate token exists, no counter increment occurs.

Forbidden inside or around the vote transaction:

* Insert vote event log.
* Insert poll status snapshot.
* Insert user-option audit row.
* Emit analytics event with option_id + user/session/request identity.
* Emit APM trace with raw request body containing option_id.
* Insert option-level event record as a side effect.

Suggested counter SQL pattern:

```sql
INSERT INTO poll_option_vote_counters (
  poll_id,
  option_id,
  shard_id,
  vote_count,
  updated_at_minute
)
VALUES (
  :poll_id,
  :option_id,
  :shard_id,
  1,
  date_trunc('minute', NOW())
)
ON CONFLICT (poll_id, option_id, shard_id)
DO UPDATE SET
  vote_count = poll_option_vote_counters.vote_count + 1,
  updated_at_minute = date_trunc('minute', NOW());
```

Response:

```text
status = "voted"
voted = true
```

Optional:

* Response may include display-safe result only after vote.
* Do not return raw counter rows.
* Do not return internal `option_id` in result response.

---

## 10. `option_id` Lifecycle

For Reference Answer and Official Vote endpoints, `option_id` is request-scope sensitive data.

Allowed lifecycle:

```text
request body
input validation
option belongs-to-poll validation
in-memory counter update preparation
DB aggregate counter update for Official Vote only
```

After transaction commit, `option_id` must not appear in:

```text
response body
success log
metrics tag
APM trace
post-commit event
webhook payload
async job payload
debug payload
analytics event
error payload linked to user/session/request identity
```

Implementation notes:

* Do not pass raw request body into generic logger.
* Do not pass raw request body into exception reporter.
* Do not attach `option_id` to request context after validation.
* Do not include `option_id` in post-commit hooks.

---

## 11. CSPRNG Shard Selection

Server-side only.

Node.js example:

```javascript
import crypto from 'node:crypto';

const shardId = crypto.randomInt(0, SHARD_COUNT);
```

Python example:

```python
import secrets

shard_id = secrets.randbelow(SHARD_COUNT)
```

Rules:

* Generate `shard_id` in backend runtime.
* Generate it after request validation and before counter update.
* Do not use SQL random functions for `shard_id`.
* Do not allow client-provided `shard_id`.

Forbidden:

```text
client-provided shard_id
SQL random()
user_id hash
poll_id hash
timestamp modulo
random seeded by user/session
predictable sequence
```

---

# Part E — Result Display

---

## 12. Result Display Tiers

Total official votes = `N`.

### N < 30

Display:

```text
收集中
```

Do not display:

```text
percentage
vote count
ranking hint
```

---

### 30 <= N <= 99

Display:

```text
bucketed percentage
```

Do not display:

```text
exact vote count
precise percentage
```

Example display style:

```text
約 40–50%
約 20–30%
```

---

### 100 <= N <= 499

Display:

```text
rounded percentage
bucketed vote count
```

Example display style:

```text
約 43%
約 100–150 票
```

---

### N >= 500

Display:

```text
more precise percentage
more precise vote count
```

Example display style:

```text
43.2%
約 1,240 票
```

Exact formatting may be refined later, but the privacy tier boundaries must not be changed without approval.

---

## 13. Result API

### `GET /polls/:id/results`

Purpose: return display-safe result.

Backend aggregation:

1. Sum `poll_option_vote_counters` by `poll_id` and `option_id`.
2. Calculate total official votes.
3. Convert raw counts to display-safe buckets.
4. Return display-safe response.

Display-safe response shape:

```json
{
  "poll_id": "poll_public_id_or_slug",
  "display_mode": "collecting | bucketed_percentage | rounded_with_bucketed_votes | precise",
  "total_votes_display": "收集中 | 30–99 | 100–499 | 500+",
  "collecting": false,
  "options": [
    {
      "option_index": 0,
      "display_label": "選項 A",
      "display_percentage": "約 40–50%",
      "display_count": null
    }
  ],
  "updated_display": "最近更新"
}
```

Rules:

* Do not return raw counter shard rows.
* Do not return raw counter table output.
* Do not expose exact counts when tier does not allow it.
* Do not include Reference Answer data.
* Do not include internal `option_id` in the response body.
* Use `option_index` or frontend display order only.
* `display_count` must be `null` or bucketed string unless tier allows more precise count.
* Do not expose values that allow the frontend to reconstruct forbidden precision.

---

# Part F — Logging / Metrics / Analytics

---

## 14. Logging Scrubber

All request logging, error logging, metrics, APM, debug payloads, and analytics must avoid raw option linkage.

For vote and reference-answer endpoints, scrub:

```text
option_id
option_text
selected_option_index
raw request body
raw payload
```

Safe logs may include:

```text
request_id
poll_id
success/failure
reason_code
timestamp minute bucket
latency
```

Unsafe logs:

```text
user_id + option_id
session_id + option_id
device_id + option_id
request_id + option_id + user identifier
raw vote body
raw reference answer body
```

Phase 0 must include a functional scrubber test:

```text
Input fake log payload containing option_id.
Output must not contain option_id.
Output must not contain user-option linkage.
```

Agent reporting must confirm:

```text
No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

---

# Part G — Admin Governance

---

## 15. Admin Typo Correction

Admin Typo Correction is typo-only.

Allowed:

```text
clear typo
punctuation
non-semantic whitespace
clear spelling mistake
text correction that does not change meaning or direction
```

Forbidden:

```text
option change
category change
semantic change
answer direction change
eligibility change
close-time change
adding/removing options
```

Implementation flow:

1. Create correction request.
2. Set `correction_target_field`.
3. Set `correction_target_id` when target is `option_text`.
4. Calculate and lock Spread Score.
5. Determine risk level.
6. If high risk, require Dual-Admin Approval.
7. Before apply, run pre-apply guard.
8. If request older than 24 hours, recompute Spread Score.
9. Reject if request is past `valid_until`.
10. Apply only if typo-only and allowed by governance state.

---

## 16. Spread Score

Purpose: determine correction risk.

MVP inputs may include:

```text
official vote bucket
poll age
report status
suspended status
category risk
creator trust status
participation spread bucket
correction_target_field
```

Rules:

* Lock score at request submission.
* Recompute if request is older than 24 hours.
* Run pre-apply guard immediately before correction.
* High Spread Score requires Dual-Admin Approval.
* Correction on `option_text` should be treated as higher risk than correction on non-core explanatory text.
* Do not use Spread Score as pre-vote ranking input.

---

## 17. Dual-Admin Approval

Required for:

```text
high-risk correction
high Spread Score correction
reported poll correction
suspended poll correction
high-sensitivity related content
```

Rules:

* Two admins submit independently.
* Admins must not see each other’s decision before submitting.
* Divergence = reject.
* No Senior Review in MVP.
* Long-term admin decision log required.

Implementation requirements:

* API must not expose existing admin decision before current admin submits.
* UI must not show other admin’s decision before submission.
* Shared draft decision state is forbidden.
* Sequential review is forbidden.

---

## 18. Admin Review Context API

### `GET /admin/correction-requests/:id/review-context`

Purpose: provide admin review information without leaking another admin’s decision.

May return:

```text
poll content
original text
proposed text
correction_target_field
correction_target_id
risk flags
publicly visible poll status
```

Must not return before current admin submits:

```text
other admin decision
other admin reason
other admin correction classification
other admin notes
```

Only after both admins have submitted may the system expose final combined decision state according to admin UI rules.

---

## 19. Suspended × Correction

Allowed flow:

```text
suspended → correction_pending → active
```

Only allowed when:

* A clear typo caused misleading violation appearance.
* Correction is typo-only.
* Dual-Admin Approval passes.

Single transaction must include:

1. Correction log creation.
2. Poll content update.
3. Poll status update.
4. Public notice creation.

Rollback if any step fails.

Public notice must state:

```text
Poll was previously suspended.
Admin typo correction was applied.
Correction did not change semantic direction.
Correction apply time.
```

Do not expose:

```text
voter information
admin private information
internal risk score details
```

---

# Part H — High-Sensitivity Category MVP Guardrails

---

## 20. High-Sensitivity Category Policy

MVP default:

```text
high-sensitivity categories disabled
```

MVP may reserve structure for:

```text
Final Review self-declaration
rule-based detection
text normalization
category mismatch report
fast takedown
```

Do not implement:

```text
AI semantic pre-review
official high-sensitivity launch
political category full release
```

Detailed text normalization tables and homophone/color-code rule tables belong to a later Phase 9 spec, not Phase 0–3 implementation.

---

## 21. Text Normalization Placeholder

Purpose:

* Detect category mismatch.
* Detect high-risk content.
* Detect indirect political or sensitive bait.

MVP v0.1 only requires a placeholder or simple normalization utility if needed by category detection.

Do not build large homophone, euphemism, or color-code dictionaries in Phase 0–3.

Do not use normalization to infer or store user vote choices.

---

# Part I — Test Requirements

---

## 22. Privacy Tests

Required tests:

### Reference Answer

* Submitting Reference Answer creates token.
* Token has no `option_id`.
* Token has no `encrypted_option_id`.
* No Reference Answer option-level counter is created.
* Logs do not contain `option_id` with user/session/request identity.
* BFCache restore clears selected option and UI state.

### Official Vote

* Official Vote increments aggregate counter.
* Vote token has no `option_id`.
* Duplicate vote does not increment counter.
* Failed token insert rolls back counter increment.
* Failed counter increment rolls back token insert.
* Logs/APM/error payloads do not contain option linkage.
* `option_id` does not appear in response, metrics tag, post-commit event, webhook payload, or async job payload.

### Result

* Result API does not return raw counter rows.
* Result API does not return internal `option_id`.
* N < 30 returns collecting state only.
* 30–99 returns bucketed percentage only.
* 100–499 returns rounded percentage + bucketed votes.
* 500+ returns precise display mode.
* Reference Answer does not affect result.

---

## 23. Counter Tests

Required tests:

* `shard_id` generated server-side.
* Client-provided `shard_id` ignored or rejected.
* `shard_id` not derived from user_id.
* SQL random function is not used for `shard_id`.
* Concurrent votes do not cause lost update.
* Sharded counter sum is correct.
* Shard count cannot be changed silently.
* Counter timestamp, if present, is minute precision or coarser.

---

## 24. Ranking Tests

Required tests:

* Pre-vote feed does not use option percentage.
* Pre-vote feed does not use option growth.
* Pre-vote feed does not use user answer direction.
* Manipulation Integrity Warning is not used as pre-vote ranking feature.
* Reference Answer does not affect heat/trending/homepage/Wonder Flow.
* Feed implementation uses only allowed non-directional signals.

---

## 25. Governance Tests

Required tests:

* Creator cannot edit poll after publish.
* Creator cannot use grace period edit.
* Admin Typo Correction rejects semantic change.
* Correction request records `correction_target_field`.
* Option text correction records `correction_target_id`.
* High-risk correction requires Dual-Admin.
* Admin B cannot see Admin A’s decision before submitting.
* Admin review context API does not return other admin’s decision before submission.
* Divergent Dual-Admin decisions reject request.
* Suspended × Correction writes correction log, content update, status update, and public notice in one transaction.
* Failed Suspended × Correction transaction rolls back all writes.

---

## 26. Logging Scrubber Tests

Required tests:

* Fake log payload containing `option_id` is scrubbed.
* Fake error payload containing raw vote body is scrubbed.
* Fake APM payload containing `selected_option_index` is scrubbed.
* Safe fields such as `poll_id`, reason code, and latency remain usable.
* Scrubber does not create new user-option linkage while processing logs.

---

# Part J — Implementation Phases

---

## 27. Phase 0 — Project Foundation

Goal: create project foundation and guardrails.

Tasks:

* Create project structure.
* Add `/AGENTS.md`.
* Add this spec under `docs/`.
* Choose stack.
* Set up database migration system.
* Set up test framework.
* Set up functional logging scrubber.
* Add scrubber tests.
* Add privacy test placeholders.

Definition of Done:

* Agent can read `/AGENTS.md`.
* Spec exists in `docs/`.
* Basic app boots.
* Migration system works.
* Test command works.
* Logging scrubber is functional and tested.
* No privacy-sensitive feature implemented yet.

---

## 28. Phase 1 — Poll Core

Goal: implement basic poll creation and immutable publish behavior.

Tasks:

* Create `users`.
* Create `polls`.
* Create `poll_options`.
* Implement `POST /polls`.
* Implement `GET /polls/:id`.
* Implement creator delete path.
* Enforce no creator edit after publish.

Definition of Done:

* Creator can create poll.
* Creator cannot edit after publish.
* Delete/repost path exists.
* No result snapshot exists.
* No vote tables yet.

---

## 29. Phase 2 — Reference Answer

Goal: implement Reference Answer Design B.

Tasks:

* Create `poll_reference_answer_tokens`.
* Implement `POST /polls/:id/reference-answer`.
* Ensure no option persistence.
* Add frontend runtime memory.
* Add BFCache clearing.
* Add privacy tests.

Definition of Done:

* Reference Answer token created.
* DB has no selected option.
* DB has no encrypted selected option.
* Logs have no selected option linkage.
* BFCache test passes.
* Reference Answer does not affect official result or ranking.

---

## 30. Phase 3 — Official Vote

Goal: implement privacy-preserving Official Vote.

Tasks:

* Create `poll_vote_tokens`.
* Create `poll_option_vote_counters`.
* Implement CSPRNG shard selection.
* Implement vote transaction.
* Define `option_id` lifecycle.
* Add duplicate vote prevention.
* Add concurrency tests.
* Add logging scrubber tests.

Definition of Done:

* Official Vote increments aggregate counter.
* Vote token prevents duplicate vote.
* No durable user-option linkage.
* No append-only vote event log.
* Transaction rollback works.
* Logs/APM/error payloads scrub option linkage.
* Commit/post-commit lifecycle does not leak `option_id`.

---

## 31. Phase 4 — Result Display

Goal: implement display-safe result API.

Tasks:

* Aggregate sharded counters.
* Implement display tiers.
* Implement `GET /polls/:id/results`.
* Ensure raw counters are never exposed to frontend.
* Ensure internal `option_id` is not exposed in result response.
* Add result tier tests.

Definition of Done:

* Result API returns display-safe output.
* All four display tiers work.
* Raw counters are not exposed.
* Internal option IDs are not exposed in result API.
* Reference Answer does not affect result.

---

## 32. Phase 5 — Wonder Flow / Ranking

Goal: implement non-directional discovery feed.

Tasks:

* Implement feed API.
* Use only allowed non-directional ranking signals.
* Ensure Reference Answer does not affect ranking.
* Ensure Manipulation Integrity Warning is not pre-vote ranking input.
* Add ranking tests.

Definition of Done:

* Feed works.
* Pre-vote ranking has no answer-direction signals.
* Tests verify forbidden signals are not used.

---

## 33. Phase 6 — Admin Typo Correction

Goal: implement safe typo-only correction.

Tasks:

* Create correction request table.
* Create correction log table.
* Add `correction_target_field`.
* Add `correction_target_id`.
* Implement correction request API.
* Implement typo-only guard.
* Implement Spread Score lock.
* Implement pre-apply guard.
* Add correction tests.

Definition of Done:

* Typo-only correction path works.
* Semantic change rejected.
* Correction target is recorded.
* Spread Score lock works.
* Pre-apply guard works.
* Expired correction request is rejected.

---

## 34. Phase 7 — Dual-Admin Approval

Goal: implement independent Dual-Admin review.

Tasks:

* Create admin decision log table.
* Implement admin review context API.
* Implement admin decision API.
* Hide other admin decision before submission.
* Implement divergence reject.
* Add Dual-Admin tests.

Definition of Done:

* Two admins submit independently.
* Admin decisions are hidden until submission.
* Review context API does not leak other admin decision.
* Divergence rejects request.
* Decision log is retained.

---

## 35. Phase 8 — Suspended × Correction

Goal: implement suspended correction recovery path.

Tasks:

* Implement `suspended → correction_pending → active`.
* Require Dual-Admin.
* Implement single transaction update.
* Create public notice.
* Add rollback tests.

Definition of Done:

* Suspended correction works only for typo-caused violation appearance.
* All writes happen in one transaction.
* Public notice created.
* Rollback works.

---

## 36. Phase 9 — High-Sensitivity MVP Guardrails

Goal: keep high-sensitivity category disabled while preparing safety structure.

Tasks:

* Add category risk config.
* Add Final Review self-declaration.
* Add minimal rule-based detection.
* Add minimal text normalization.
* Add category mismatch report.
* Add fast takedown path.

Definition of Done:

* High-sensitivity category remains disabled.
* Detection can flag risky content.
* Category mismatch report exists.
* No AI semantic pre-review added.
* No large homophone/euphemism/color-code table is built unless separately approved.

---

# Part K — Agent Delivery Format

---

## 37. Required Agent Report

After each implementation task, Agent must report:

```text
1. Modified files
2. Added or changed database tables
3. Added or changed APIs
4. Privacy and integrity check
5. Logs / metrics / APM / error payload self-check
6. Tests or validations run
7. Remaining risks or TODOs
8. Whether commit/push was performed
```

Required self-check sentence:

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

If no commit/push was requested:

```text
No commit or push was performed.
```

---

## 38. Spec Change Policy

Changing the following requires explicit user approval:

```text
Reference Answer Design B
Official Vote token TTL
Result display tier thresholds
Shard count
Raw Option Linkage Ban
Creator zero-edit rule
Dual-Admin divergence reject rule
High-sensitivity category MVP disabled status
MVP non-goals
```

Agents must not silently change these rules.

---

## 39. Default Implementation Prompt

Use this template for implementation tasks:

```text
Read AGENTS.md and docs/www-project-agent-spec-v0.1.md.

Implement [PHASE/TASK] only.

Follow the v3 privacy architecture:
- no durable user-option linkage
- no Reference Answer option persistence
- no encrypted Reference Answer option storage
- no append-only vote event log
- no poll_status_snapshot
- no pre-vote answer-direction ranking signals

Minimal verified patch.
Run relevant checks.
Report using the required format.
No commit/push.
```

---

End of spec.