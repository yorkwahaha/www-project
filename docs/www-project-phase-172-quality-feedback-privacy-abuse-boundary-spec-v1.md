# WWW Project Phase 172 — Quality Feedback Privacy & Abuse Boundary Spec v1

**Status:** docs/spec only. Defines privacy and abuse-prevention boundaries for the future poll quality feedback mechanism introduced in Phase 171. **Not implemented.** No runtime behavior, frontend JS/CSS, backend, API, DB schema, migration, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, analytics, logging, metrics, APM, trace, debug payload, error payload, dashboard, or creator score runtime is changed by this phase.

**Baseline:** `origin/master` after Phase 171 poll quality feedback mechanism product spec (`ac09839`).

**Prior spec:** [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md).

**Related policy draft (separate, not implemented):** [Quality question incentive policy draft](./www-project-quality-question-incentive-policy-draft-v1.md).

---

## 1. Purpose

Phase 171 defined post-vote quality feedback tags and product intent. Phase 172 narrows the **privacy boundary** and **abuse-prevention boundary** that any future implementation must satisfy before schema, API, storage, or UI work begins.

Phase 172 defines:

1. the privacy boundary for future feedback collection and retention.
2. forbidden durable linkages between options, feedback tags, and identifiable actors.
3. poll-level (not option-level) treatment of feedback as a quality signal.
4. creator-facing disclosure rules when aggregate feedback is ever shown.
5. soft-negative handling for **「題目不優」** without public shame or automatic punishment.
6. **「優質題目」** qualification constraints using aggregate thresholds only.
7. abuse-prevention alternatives that avoid identity-choice linkage.
8. explicit non-goals, compatibility confirmations, and future-open questions.

**Core principle:** Poll quality feedback is a **poll-level anonymous quality signal**. It must never become a durable bridge from a voter's selected option to a feedback tag, nor from a feedback tag to a traceable person, session, device, request, log, trace, metric, or error payload.

---

## 2. Non-Goals

Phase 172 does **not**:

- implement runtime, frontend UI, backend, API, schema, migration, auth, analytics, logs, or metrics.
- change Official Vote transaction order, `vote-by-index` behavior, vote token schema, counter schema, result visibility, Reference Answer, `UserAuthResolver`, or profile fields (`birth_year_month`, `residential_region`).
- introduce ranking personalization, analytics tracking, creator score runtime, punishment score, APM traces, or feedback dashboards.
- store per-voter feedback rows, per-option feedback breakdowns, or real-time creator notification streams.
- auto-suspend, auto-delist, or auto-penalize creators based on **「題目不優」** counts.
- claim that poll quality feedback collection, storage, or display is live.

---

## 3. Privacy Boundary for Future Feedback Collection

### 3.1 Allowed signal shape (directional only)

Future implementation may treat feedback as **poll-level quality signal** at the coarsest safe granularity:

```text
poll_id + feedback_tag → aggregate_count
```

Optional future extensions (each requires separate privacy review):

- time-bucketed aggregates after collection ends (`poll_id + tag + ended_collection_window → count`);
- platform-wide anomaly counters with no voter attribution;
- delayed, thresholded rollups for creator-facing summaries.

This phase does **not** approve any storage shape that includes `user_id`, `session_id`, `device_id`, `request_id`, `option_id`, `option_index`, vote token, or traceable identifier alongside `feedback_tag`.

### 3.2 Forbidden durable linkages

Future feedback collection must **not** create durable linkage between:

| Forbidden join | Why |
|----------------|-----|
| **selected option ↔ user** | Raw Option Linkage Ban; vote path already forbidden |
| **selected option ↔ feedback tag** | Would leak answer-direction quality bias per option |
| **feedback tag ↔ user** | Enables voter profiling and retaliation |
| **feedback tag ↔ session/device/request** | Reconstructable voter attribution |
| **feedback tag ↔ log/trace/metric/error payload** | Observability side channel for voter-tag linkage |

Concrete forbidden examples:

- `user_id + poll_id + feedback_tag`
- `session_id + poll_id + feedback_tag` when reconstructable to a person
- `request_id + user identifier + poll_id + feedback_tag`
- `poll_id + option_id + feedback_tag` derived from per-user vote knowledge
- `poll_id + option_index + feedback_tag` at per-voter granularity
- any table, cache, backup, ETL row, or audit export that joins a user's **selected option** with their **feedback tags**

### 3.3 Poll-level only, not option-level

Feedback tags (`表達清楚`, `選項公平`, `值得思考`, `期待結果`, `題目不優`) describe **the poll as a whole**, not individual options.

Future runtime must **not**:

- ask "which option was unclear or unfair?";
- store or display per-option feedback counts;
- infer option-level quality from vote outcome distributions combined with feedback timing;
- use feedback to rank or highlight specific options pre-vote or during collection.

If product copy ever references "options," it refers to the **collective option set** (Phase 171 **「表達清楚」** / **「選項公平」** scope), not to attributing tags to `option_id` or `option_index`.

### 3.4 Observability and analytics ban

Future feedback paths must **not** introduce:

- analytics events with `feedback_tag` plus user, session, device, or request identifier;
- APM spans or structured logs recording who submitted which tag;
- metrics labeled by `option_id` or `option_index` on the feedback hot path;
- error payloads that echo feedback body together with auth/session context;
- dashboards listing recent voters and their tags.

Debugging may use generic success/failure counters **without** tag or identity dimensions on the write path.

---

## 4. Creator-Facing Feedback Boundary

If creators ever see feedback-derived signals, all of the following are required:

| Rule | Requirement |
|------|-------------|
| **Delayed** | Not real-time; not during active collection if that could interact with answer-direction curiosity |
| **Bucketed** | Shown in coarse windows or lifecycle stages, not per-minute streams |
| **Thresholded** | Minimum sample size before any tag proportion is shown |
| **Aggregate-only** | Counts or percentages per tag at `poll_id` level only |
| **No voter exposure** | No list of who tagged what; no implied voter identity |
| **No option breakdown** | No per-option feedback attribution |

Creator-facing copy must frame aggregates as **community quality perspective**, not as a scoreboard for shame or automatic enforcement.

**「題目不優」** must not appear as a red badge on the poll card, creator profile, or public explore item.

---

## 5. Soft Negative Tag: **「題目不優」**

**「題目不優」** is a **soft negative quality signal**, not:

- a public shame label visible to other participants before or after they vote;
- an automatic punishment trigger (suspension, delist, creator tier downgrade, quota reduction);
- a real-time alert to the creator naming voters or implying coordinated attack;
- a synonym for governance findings (suspension, typo correction, report upheld).

Negative aggregate density may inform **future** governance review queues only through separate, approved processes that do not expose voter identity or option-linked feedback. This spec does not authorize automatic punishment score runtime.

---

## 6. **「優質題目」** Qualification Boundary

Future **「優質題目」** qualification (see quality incentive policy draft) must use **aggregate thresholds only**, for example:

- minimum total feedback volume after collection ends;
- minimum share of positive tags (`表達清楚`, `選項公平`, `值得思考`, `期待結果`) among counted tags;
- maximum share of **「題目不優」** before disqualification from qualification—not before ordinary public display.

Qualification must **not** use:

- per-user feedback history or identity-linked reputation of who clicked which tag;
- option-level signals or answer-direction features;
- in-collection vote counts, percentages, or growth;
- pre-vote ranking personalization.

Whether **「不太想答」** (Phase 171 soft-negative companion) affects qualification remains a future-open question; this phase does not define its storage.

---

## 7. Abuse Prevention Without Identity-Choice Linkage

Brigading, coordinated negative tagging, and feedback spam must be mitigated **without** storing `user_id + poll_id + tag` or tying feedback to selected option.

Documented open alternatives for a future implementation phase:

| Approach | Privacy posture | Notes |
|----------|-----------------|-------|
| **Rate limits** | Coarse per-IP or per-session **write** throttles on feedback endpoint only | Must not log tag + identity together; throttle counters should be ephemeral or identity-free aggregates |
| **Coarse eligibility** | Only voters who completed Official Vote in the same session window may submit once | Dedup by ephemeral in-memory or short-TTL token **without** persisting `user_id + poll_id + tag` |
| **Delayed aggregation** | No live counts; roll up after delay or after collection ends | Reduces brigading visibility and retaliation timing |
| **Minimum thresholds** | Suppress display until N feedback events | N is aggregate count only; no per-voter listing |
| **Anomaly review** | Internal ops review for spikes without voter exposure | Review poll-level time series only; no export of voter-tag rows |

Forbidden abuse-prevention shortcuts:

- requiring feedback to attach `option_index` or `option_id`;
- blocking feedback based on which option was voted;
- showing creators "who disliked your poll";
- using feedback analytics funnels with user IDs for product experimentation.

---

## 8. Compatibility Confirmation (Unchanged)

Phase 172 confirms the following remain fixed and are **not** modified by this docs-only phase:

| Area | Constraint |
|------|------------|
| Official Vote body | `{ option_index }` only |
| Official Vote transaction order | Vote token creation and counter increment in same DB transaction |
| `vote-by-index` | Eligibility before option resolve unchanged |
| Vote token schema | Unchanged |
| Counter schema | Unchanged |
| Result visibility | Lifecycle-tier display-safe aggregate rules unchanged |
| Reference Answer | Design B; no durable option storage |
| `UserAuthResolver` | Unchanged |
| Profile fields | `birth_year_month` and `residential_region` only in public profile scope |
| Explore / ranking | Freshness-only; no feedback-driven personalization |
| Registration / login | `POST /registration` no auto-login; `POST /login/session` session boundary |

---

## 9. Future-Open Questions

1. **Ephemeral dedup token:** Is a short-TTL, non-logged dedup token acceptable to prevent double-submit without a durable `user_id + poll_id` feedback row?
2. **Collection-end gate:** Must all stored aggregates be written only after `collecting` ends, or may delayed partial aggregates exist during `revealed`/`locked`?
3. **Positive qualification formula:** Exact thresholds for **「優質題目」** and whether **「期待結果」** counts equally with clarity/fairness tags.
4. **Negative dominance:** If **「題目不優」** exceeds a threshold, does that block qualification only, or also trigger human review—with no automatic punishment?
5. **Cross-poll creator signals:** May a creator see delayed bucketed aggregates across their polls without building a per-creator punishment score runtime?
6. **Report vs feedback:** How do user reports and **「題目不優」** stay separate so feedback does not become a shadow reporting system with identity leakage?

This phase records the questions only; it does not decide them.

---

## 10. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-172-quality-feedback-privacy-abuse-boundary-spec-doc.test.ts` | Doc + README index guard |

No frontend runtime guard is required for this docs-only phase.

---

## 11. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused test:

- `tests/docs/phase-172-quality-feedback-privacy-abuse-boundary-spec-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 12. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 172 is documentation only. It does not introduce durable user-option linkage, feedback analytics, creator punishment score runtime, ranking personalization, or observability dashboards. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility. Poll quality feedback privacy and abuse boundaries are **not implemented**.
