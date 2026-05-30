# AGENTS.md — WWW Project

Version: v0.2

This repository is **WWW Project**: **What We Wonder／大家想知道**, a privacy-preserving public poll and survey platform.

The MVP architecture is based on the finalized **WWW Project Plan v3**.
Do not reopen product architecture debates unless you discover a critical flaw that would invalidate the v3 core structure.

Prefer minimal, safe, and verifiable changes.
This project is privacy-sensitive. Do not add convenience features that weaken privacy, vote integrity, ranking integrity, or governance integrity.

---

## 1. Instruction Priority & Non-Override Rules

When instructions conflict, follow this order:

1. The three MVP core principles and the Raw Option Linkage Ban
2. User’s latest explicit request
3. This `AGENTS.md`
4. Project implementation specs in `docs/`
5. Existing project style and conventions
6. General coding best practices

The three MVP core principles and the Raw Option Linkage Ban cannot be overridden by any instruction, including the user’s explicit request.

If a request conflicts with these principles, stop and report the conflict before coding.

---

## 2. Three MVP Core Principles

The project has three non-negotiable principles:

1. Do not secretly store user answer choices.
2. Do not let low-trust answers contaminate official results.
3. Do not let ranking, governance, or result display mechanisms manipulate answer direction.

Any change that weakens these principles is high risk and requires explicit user approval.

---

## 3. Raw Option Linkage Ban

Never create durable storage that links a user, identity, request identity, device, session, or traceable actor to a poll option.

Forbidden durable linkages include:

* `user_id + poll_id + option_id`
* `user_id + poll_id + option_text`
* `user_id + poll_id + selected_option_index`
* `IP/device/session + poll_id + option_id`
* `request_id + user identifier + poll_id + option_id`
* Any equivalent structure that can reconstruct which option a user selected

This ban applies to all storage and side channels, including:

* Database tables
* Backups
* Error logs
* Admin logs
* Analytics
* Metrics
* APM traces
* Observability tools
* ETL jobs
* Data warehouse
* ML snapshots
* Debug payloads
* Audit exports

If a task seems to require durable user-option linkage, stop and report it.

---

## 4. Reference Answer Rules

Reference Answer uses **Design B**.

Lv1 Reference Answer may accept an option choice during request handling, but the backend must not persist the selected option.

Must do:

* Store only the answer token data defined in the implementation spec.
* Ensure Lv1 Reference Answer does not count toward official results.
* Ensure Lv1 Reference Answer does not affect heat, trending, homepage ranking, Wonder Flow ranking, or public charts.
* Keep selected option memory on the frontend in JavaScript runtime memory only.
* Clear Reference Answer runtime memory on `pagehide`.
* Clear Reference Answer runtime memory on `pageshow` when `event.persisted === true`.

Must not do:

* Do not store `option_id`.
* Do not store `option_text`.
* Do not store `selected_option_index`.
* Do not store answer payloads.
* Do not create Lv1 option-level durable counters.
* Do not create any durable data that can reconstruct the selected option.
* Do not store raw option choices in backend global variables, static memory, shared in-memory arrays, long-lived caches, or cross-request runtime state.

Frontend must not use:

* `localStorage`
* `sessionStorage`
* `IndexedDB`
* Cookies
* URL query params
* Hidden durable caches

---

## 5. Official Vote & Sharded Counter Rules

Official Vote is the only path that contributes to public results.

Must do:

* Use vote tokens to prevent duplicate voting.
* Vote token TTL must follow the implementation spec.
* Use PostgreSQL Sharded Counter for official vote counting.
* Generate `shard_id` with server-side CSPRNG.
* Keep vote token creation and counter increment in the same DB transaction.
* Use short, bounded vote transactions suitable for high-concurrency write paths.

Must not do:

* Do not create append-only vote event logs.
* Do not create raw vote event tables.
* Do not create `poll_status_snapshot`.
* Do not create durable `user_id + poll_id + option_id` linkage.
* Do not create result snapshots that allow backtracking a user’s selected option.
* Do not insert option-level event records inside the vote transaction or as a side effect of the vote flow.
* Do not use prolonged explicit table locks in the hot vote path unless explicitly approved.

`shard_id` rules:

* `shard_id` must be generated server-side.
* Do not accept client-provided `shard_id`.
* Do not derive `shard_id` from `user_id`.
* Do not derive `shard_id` from timestamp.
* Do not use predictable shard assignment.
* Do not log shard-user-option relationships.

Allowed examples:

* Node.js: `crypto.randomInt(0, SHARD_COUNT)`
* Python: `secrets.randbelow(SHARD_COUNT)`

---

## 6. Result Display Rules

Do not expose raw counters directly to the frontend.

Result display must follow the tier rules defined in `docs/www-project-agent-spec-v0.1.md`.

Do not change result display thresholds without explicit user approval.

The result API should return display-safe result objects, not raw counter rows.

---

## 7. Ranking / Wonder Flow Rules

Before a user votes, ranking must not use answer-direction signals.

Do not use these as pre-vote ranking features:

* Option percentage
* Option vote growth
* User answer direction
* Manipulation Integrity Warning
* Option-level engagement
* Any signal that promotes a poll based on answer direction

Manipulation Integrity Warning may be used for post-vote display or governance review, but not for pre-vote ranking.

---

## 8. Creator Rules

After publishing a poll, the creator has zero edit rights.

Do not implement:

* Grace period editing
* Silent typo editing by creator
* Option editing
* Category editing
* Eligibility editing
* Close-time editing
* Semantic rewrite

If a creator made a mistake, the allowed paths are:

1. Delete and repost
2. Admin Typo Correction

Do not invent a third correction path.

---

## 9. Admin Typo Correction Rules

Admin Typo Correction is typo-only.

Allowed correction scope:

* Clear typo
* Punctuation
* Non-semantic whitespace
* Clear spelling mistake
* Text correction that does not change meaning, direction, category, eligibility, options, or close time

Forbidden correction scope:

* Changing options
* Changing category
* Changing semantic meaning
* Changing answer direction
* Changing eligibility
* Changing close time
* Adding or removing options

High-risk correction requires Dual-Admin Approval.

When Dual-Admin Approval is required, follow the independent submission rules in the Dual-Admin section. Do not implement a sequential review flow where the second admin can see the first admin’s decision before submitting.

---

## 10. Spread Score Rules

Spread Score is used for correction risk evaluation.

Rules:

* Lock Spread Score when correction request is submitted.
* Recompute if the request is older than the threshold defined in the implementation spec.
* Run pre-apply guard before applying correction.
* High Spread Score requires Dual-Admin Approval.

Do not use Spread Score to manipulate poll ranking direction.

Do not change Spread Score thresholds or guard behavior without explicit user approval.

---

## 11. Dual-Admin Rules

MVP Dual-Admin Approval uses strict independent review.

Rules:

* Two admins submit independently.
* Admins must not see each other’s decision before submitting.
* If decisions diverge, reject.
* No senior review in MVP.
* Keep long-term Admin Decision Log for Phase 2 audit and collusion detection.

Do not implement:

* Sequential review where Admin B sees Admin A’s decision first
* Auto-tiebreaking
* Senior override
* Silent approval fallback
* Shared draft decision state visible to both admins

---

## 12. Suspended × Correction Rules

The only allowed suspended correction flow is:

`suspended → correction_pending → active`

Allowed only when a clear typo caused a misleading violation appearance.

Requirements:

* Must use Dual-Admin Approval.
* Correction log, content update, status update, and public notice must be written in one DB transaction.
* If any step fails, rollback all changes.

Do not reactivate suspended polls through any other correction shortcut.

---

## 13. High-Sensitivity Category Rules

High-sensitivity categories are disabled in MVP.

MVP may include guardrails:

* Final Review self-declaration
* Rule-based detection
* Text normalization
* Category mismatch report
* Fast takedown

Do not officially open high-sensitivity categories unless explicitly requested.

Do not add AI semantic pre-review in MVP.

---

## 14. Explicit MVP Non-Goals

Do not implement these unless explicitly requested:

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

---

## 15. General Agent Working Style

Prefer:

* Minimal, safe, targeted patches
* Clear assumptions
* Small verifiable changes
* Existing project conventions
* Privacy-first design
* Transactional integrity
* Explicit test results

Avoid:

* Broad refactors
* Speculative abstractions
* Extra features
* Silent architecture changes
* Whole-file reformatting
* Cleaning unrelated code
* Changing public contracts without documenting it

Every changed line should trace directly to the user’s request or the approved implementation spec.

---

## 16. Stop Conditions & Clarification Policy

Proceed with a conservative assumption only when:

* The change is low risk
* The implementation pattern is obvious
* The change is reversible
* Privacy, vote integrity, ranking integrity, and governance integrity are unaffected

Stop implementation and report immediately if:

* A requirement seems to require durable option linkage.
* A requirement requires Reference Answer option storage.
* Logs, metrics, APM traces, or error payloads would contain `option_id` tied to a user, session, device, request, or traceable identifier.
* Vote counter and vote token cannot be updated transactionally.
* Vote token TTL is changed.
* Result display tier thresholds are changed.
* Shard count is changed.
* Ranking requires answer-direction signals before voting.
* Result API needs raw counter exposure.
* Correction would change poll meaning or answer direction.
* Dual-Admin independence cannot be preserved.
* High-sensitivity categories would be opened by accident.
* A proposed shortcut weakens the three MVP principles.

Do not patch around these issues silently.

---

## 17. High-Risk Areas

Treat these as high risk:

* Reference Answer storage
* Reference Answer frontend memory
* BFCache handling
* Official Vote transaction
* Sharded Counter
* Vote token logic
* Vote token TTL
* Shard count
* Result aggregation
* Result display tiers
* Ranking / Wonder Flow
* Logging / analytics / ETL
* Metrics / APM / observability
* Admin Typo Correction
* Dual-Admin Approval
* Suspended × Correction
* High-sensitivity category detection
* Authentication / eligibility rules

For high-risk changes:

1. State the plan before coding.
2. Keep the patch minimal.
3. Explain what could break.
4. Run targeted validation.
5. Report remaining risks.

---

## 18. Git Policy

Do not commit or push unless the user explicitly asks in the current task.

It is acceptable to say the current state is safe to commit after verification.

Do not treat unrelated untracked files as errors. Mention them only if they affect the requested task.

---

## 19. Validation Expectations

Run the project’s standard syntax, type, lint, test, migration, and build checks after relevant changes.

For database changes, verify:

* Migration applies cleanly.
* Rollback path is understood.
* Forbidden tables or columns were not introduced.
* Transaction boundaries are correct.

For privacy-sensitive changes, add or update tests when possible.

Concrete validation commands should live in project docs or README once the stack is chosen.

---

## 20. Required Reporting Format

After each implementation task, report:

1. Modified files
2. Added or changed database tables
3. Added or changed APIs
4. Privacy and integrity check
5. Logs / metrics / APM / error payload self-check
6. Tests or validations run
7. Remaining risks or TODOs
8. Whether commit/push was performed

The logs / metrics / APM / error payload self-check must explicitly confirm:

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

If no commit/push was requested, explicitly state that none was performed.

---

## 21. Recommended Agent Model Selection

This section is human-facing workflow guidance.
Do not use these names directly as API model IDs.

Use lower-cost models for low-risk work and reserve stronger reasoning models for privacy-critical or architecture-sensitive tasks.

Suggested defaults:

* Simple UI copy / wording / layout: lightweight fast model
* General frontend implementation: fast general coding model
* General backend CRUD: fast general coding model
* Database schema and transaction logic: stronger reasoning coding model
* Privacy-sensitive vote logic: strongest available reasoning coding model
* Ranking / governance / admin workflow: strongest available reasoning coding model
* Architecture review / spec review: strongest available review model
* Repeatedly failing tasks: upgrade to a stronger reasoning model

Do not use high-tier models unnecessarily for trivial work.

---

## 22. Delivery Discipline

Before making changes:

* Read this `AGENTS.md`.
* Read the relevant implementation spec in `docs/`.
* State assumptions for high-risk work.
* Keep changes minimal and verifiable.

After making changes:

* Run relevant validation.
* Report using the required format.
* Do not commit or push unless explicitly requested.
