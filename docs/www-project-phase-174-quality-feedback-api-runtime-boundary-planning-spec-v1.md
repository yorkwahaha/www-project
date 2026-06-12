# WWW Project Phase 174 — Quality Feedback API & Runtime Boundary Planning Spec v1

**Status:** docs/spec only. Plans future **API and runtime boundaries** for poll quality feedback after Phase 171 (product), Phase 172 (privacy & abuse), and Phase 173 (data model). **Not implemented.** No runtime behavior, frontend UI, backend handlers, API routes, DB schema, migration, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, analytics, logging, metrics, APM, trace, debug payload, error payload, dashboard, or creator punishment score runtime is changed by this phase.

**Baseline:** `origin/master` after Phase 173 quality feedback data model planning spec (`9a7b456`).

**Prior specs:**

- [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md)
- [Phase 172 Quality feedback privacy & abuse boundary spec](./www-project-phase-172-quality-feedback-privacy-abuse-boundary-spec-v1.md)
- [Phase 173 Quality feedback data model planning spec](./www-project-phase-173-quality-feedback-data-model-planning-spec-v1.md)

**Related policy draft (separate, not implemented):** [Quality question incentive policy draft](./www-project-quality-question-incentive-policy-draft-v1.md).

---

## 1. Purpose

Phase 174 defines how a future feedback **write path**, **read path**, and **frontend runtime** must behave at API and transaction boundaries—without implementing any of them.

Phase 174 defines:

1. when the feedback prompt may appear (post-vote UX point only).
2. separation of feedback submission from Official Vote transaction.
3. allowed future request/response payload shape (poll-level only).
4. backend validation rules for approved tags and aggregate updates.
5. runtime rules that must not leak vote option, eligibility, or counter internals.
6. safe frontend error/loading/success copy boundaries.
7. creator-facing read API posture (delayed, bucketed, thresholded, aggregate-only).
8. explicit non-goals, compatibility confirmations, and future-open questions.

**Core principle:** Feedback API is a **separate, poll-level write** that increments anonymous aggregates only. It must not share the Official Vote transaction, accept option or identity fields, or reveal vote-path internals in responses or errors.

---

## 2. Non-Goals

Phase 174 does **not**:

- implement runtime, backend routes, frontend UI, schema, migration, auth changes, analytics, logs, or metrics.
- add HTTP handlers, OpenAPI entries, or frontend modules in this phase.
- change vote token schema, counter schema, Official Vote transaction order, `vote-by-index` behavior, eligibility evaluator, result visibility, Reference Answer, `UserAuthResolver`, or profile fields (`birth_year_month`, `residential_region`).
- introduce ranking personalization, analytics tracking, creator score runtime, punishment score, APM traces, or feedback dashboards.
- claim that feedback APIs or UI are live.

Explicit non-goals for this phase:

- **no schema/migration**
- **no runtime**
- **no API implementation**
- **no UI implementation**
- **no analytics**
- **no ranking/personalization**
- **no creator punishment score**
- **no logs/metrics/APM/dashboards** on the feedback hot path

---

## 3. Feedback Tags (Reference)

Future MVP tags (Phase 171):

| Tag | Polarity |
|-----|----------|
| **表達清楚** | Positive |
| **選項公平** | Positive |
| **值得思考** | Positive |
| **期待結果** | Positive |
| **題目不優** | Soft negative |

Backend validation must allow **only** this approved set (or a future enum superseding it with equivalent privacy review). Unknown tags are rejected without echoing internal validation codes that leak vote or identity state.

---

## 4. Post-Vote UX Entry Point

### 4.1 Allowed trigger

The feedback prompt may appear **only** at an **allowed post-vote UX point**:

- after Official Vote submit succeeds and the vote page is in post-success state (Phase 171 / Phase 110 success copy);
- never before submit, during option selection, or as a gate to viewing results.

### 4.2 Separate from Official Vote

Feedback submission must be a **separate HTTP request** (or separate internal call) from `POST` Official Vote:

| Path | Concern |
|------|---------|
| Official Vote | `{ option_index }` → token + counter increment in **one** DB transaction |
| Feedback submit | `poll_id` + `feedback_tags` → poll-level aggregate increment **only** |

Must **not**:

- wrap feedback into the vote request body;
- extend vote success response with per-tag acknowledgment tied to option choice;
- roll back a successful vote if feedback fails, or roll back feedback if vote already succeeded (independent outcomes).

---

## 5. Future API Payload Shape (Directional Only)

### 5.1 Write request (participant)

Directional example—not a committed route or contract:

```http
POST /polls/:poll_id/quality-feedback
Content-Type: application/json

{
  "feedback_tags": ["表達清楚", "值得思考"]
}
```

**May include (poll-level only):**

- `poll_id` (path or body; single poll scope)
- `feedback_tags` (array of one or more approved tags; MVP may limit to single-select)

**Must not include in request body, query, or headers used for storage:**

- `option_id`, `option_index`, selected option text
- `user_id`, `session_id`, `creator_session`, `vote_token`
- `request_id`, device id, IP address, user agent
- trace id, metric id, error id, analytics id
- eligibility flags, denial reason codes, counter shard ids

Auth cookies may exist for transport security, but the **feedback write path must not persist** auth identifiers joined with `feedback_tags` (Phase 172–173).

### 5.2 Write response (participant)

**May return:**

- generic success acknowledgment (e.g. `感謝你的回饋。`);
- neutral failure when submit cannot complete.

**Must not return:**

- updated aggregate counts (avoids brigading/real-time negative visibility);
- which tags were duplicate-rejected in a way that fingerprints the user;
- vote eligibility outcome, option validity, or token state.

### 5.3 Read response (creator or public—if ever added)

Creator-facing or public aggregate read APIs (not planned for MVP implementation) must return **delayed, bucketed, thresholded, aggregate-only** data per Phase 172:

```json
{
  "poll_id": "...",
  "tags": [
    { "tag": "表達清楚", "aggregate_count": 42 },
    { "tag": "題目不優", "aggregate_count": 3 }
  ],
  "threshold_met": true
}
```

Must **not** return per-voter rows, timestamps per voter, or option-level breakdowns.

---

## 6. Backend Validation and Aggregate Updates

### 6.1 Tag validation

Future backend must:

- reject tags outside the approved set;
- reject empty tag arrays if business rules require at least one tag;
- cap array length (MVP likely single-tag or small multi-select);
- normalize tag strings to a fixed enum—no free-text tags.

Validation failures use **neutral** HTTP status and body; do not branch error copy by eligibility or option state.

### 6.2 Aggregate update only

On accepted submit, backend updates **only** poll-level aggregate feedback counts (Phase 173 `poll_id + feedback_tag → aggregate_count`).

Must **not**:

- increment or read official vote counters or counter shards;
- join feedback service to vote token tables for storage;
- write feedback inside Official Vote transaction.

### 6.3 Optional dedup and rate limits

Phase 173 open choices apply at API boundary:

- short-lived non-durable anti-duplicate guard may return generic success or neutral denial without explaining dedup reason;
- rate limits return generic "try again later" without identity + tag logging.

---

## 7. Runtime Boundaries (Vote UX vs Feedback UX)

Future runtime must **not** expose beyond existing allowed vote UX:

| Forbidden exposure | Notes |
|--------------------|-------|
| Whether user's `option_index` exists | Vote path already generic on denial; feedback must not add option validity hints |
| Whether user is eligible | Eligibility remains vote-time evaluator only |
| Whether vote was counted beyond success copy | No counter, shard, or token details in feedback flow |
| Selected option label in feedback UI | Tags describe poll-level quality only |

Feedback UI is **additive** after vote success; it does not replace Phase 110 success message.

---

## 8. Failed / Ineligible Vote Feedback (Open Question)

Phase 173 default bias: feedback prompt **only** after successful Official Vote.

| Option | Safe posture | Risk |
|--------|--------------|------|
| **A. Success only (recommended default)** | No feedback API call unless vote succeeded | Lowest linkage and confusion risk |
| **B. Allow after denial with separate neutral path** | No feedback storage; prompt never shown | Consistent with A at API level |
| **C. Allow submit after denial (not recommended without review)** | Must not store denial reason + tag; must not require option fields | Risk of correlating dissatisfaction with eligibility outcome |

If a future phase explores C, it requires privacy review and must not store `ineligible` + `feedback_tag` + reconstructable identity. Phase 174 does not approve C.

---

## 9. Frontend Error, Loading, and Success States

Future frontend feedback module must follow public MVP copy boundaries (Phases 135–160):

**May show:**

- lightweight loading on submit;
- generic success (`感謝你的回饋。` or skip acknowledgment);
- generic failure (`目前無法送出回饋，請稍後再試。`).

**Must not echo:**

- backend response payload fields beyond generic ack;
- `error.message`, stack trace, or internal error code;
- HTTP status-specific branches that reveal eligibility, option, or token state.

**Must not use:**

- `localStorage` / `sessionStorage` / IndexedDB / cookies / URL params for feedback tag memory (Phase 171 Reference Answer–class ban for durable client tag storage tied to polls).

---

## 10. Observability and Product Analytics Ban

Feedback API and runtime must **not** introduce on the hot path:

- structured logs with `feedback_tags` + user/session/request identifier;
- metrics or APM spans labeled by tag and identity;
- analytics events funneling feedback to user profiles;
- dashboards listing recent feedback submits;
- creator punishment score computation from API traffic.

Generic route-level success/failure counters without tag or identity dimensions may be considered in a later ops phase with separate approval.

---

## 11. Compatibility Confirmation (Unchanged)

| Area | Constraint |
|------|------------|
| Official Vote body | `{ option_index }` only |
| Official Vote transaction order | Vote token + counter increment same transaction; unchanged |
| `vote-by-index` | Eligibility before option resolve; unchanged |
| Vote token schema | Unchanged |
| Counter schema | Unchanged |
| Eligibility | Vote-time evaluator only; feedback does not drive eligibility |
| Result visibility | Lifecycle-tier rules unchanged |
| Reference Answer | Design B; disconnected from feedback path |
| `UserAuthResolver` | Unchanged |
| Profile fields | `birth_year_month`, `residential_region` only |
| Explore / ranking | Freshness-only; no feedback-driven personalization |

---

## 12. Future-Open Questions

1. **Route naming:** Is `POST /polls/:poll_id/quality-feedback` the stable public path, or a versioned internal name?
2. **Auth requirement:** Must feedback submit require login session, or accept anonymous post-vote submit with only ephemeral dedup?
3. **Multi-tag vs single-tag:** Does MVP API accept one tag or a bounded array?
4. **Idempotency:** How does the API ack duplicate submit without storing `user_id + poll_id + tag`?
5. **Read API timing:** When, if ever, is `GET` aggregate feedback exposed to creators vs admins vs public?
6. **CSRF / abuse:** Which rate-limit response shape stays neutral while blocking brigading?

This phase records questions only; it does not decide them.

---

## 13. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-174-quality-feedback-api-runtime-boundary-planning-spec-doc.test.ts` | Doc + README index guard |

No frontend runtime guard is required for this docs-only phase.

---

## 14. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused test:

- `tests/docs/phase-174-quality-feedback-api-runtime-boundary-planning-spec-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 15. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 174 is documentation only. It plans API and runtime boundaries without implementation. Feedback submission remains separate from Official Vote. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Poll quality feedback API and runtime boundaries are **not implemented**.
