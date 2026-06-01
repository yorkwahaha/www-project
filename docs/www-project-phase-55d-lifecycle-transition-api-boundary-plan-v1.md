# WWW Project Phase 55D — Lifecycle Transition API Boundary Plan v1

**狀態：** docs-only boundary plan；不實作 API、schema、migration、frontend、auth/session、scheduler、notification、trust、feedback 或 governance。
**依據：** Phase 39、Phase 51–54、Phase 55A–55C。
**後續實作 Phase：** **Phase 57**（沿用 Phase 51／53 既有路線圖；Phase 56 保留 eligibility 與 collecting 隱私護欄）。

## 1. 不可變邊界

- `public_lifecycle_state` 是公開 lifecycle 的唯一權威狀態；不得用 legacy `status='closed'` 推導 reveal。
- `total >= 30` 只影響 reveal 後 display-safe tier；不得驅動 reveal。
- `collecting` 路徑不得讀取、JOIN 或暴露 aggregate counters；Creator 與 public 使用相同 counter-free shell。
- 所有 lifecycle 欄位由伺服器寫入；client 不得提交目標 state 或 timestamp。
- 不新增 lifecycle event log、result snapshot、raw vote event 或任何 user-option linkage。

## 2. Transition Matrix

| Transition | Endpoint / service candidate | Allowed from-state | Forbidden states | Required timestamp writes | Permission assumption | Transaction requirement | Result privacy impact | Error category | Phase 57 tests |
|------------|------------------------------|--------------------|------------------|---------------------------|-----------------------|-------------------------|-----------------------|----------------|----------------|
| `collecting → cancelled` | Public candidate: `POST /polls/:pollId/cancel` | `collecting` only | `draft`, `cancelled`, `revealed`, `locked`, `post_lock`, `unpublished`; governance-hidden polls fail closed | Set server time `cancelled_at`; set `public_lifecycle_state='cancelled'` | Creator only after auth exists; Phase 57 may keep route unavailable until auth boundary is ready | Single bounded transaction; state guard and timestamp update together | Never read counters; cancelled shell remains counter-free and never forms public aggregate results | `not_found`, `unauthorized`, `forbidden`, `already_cancelled`, `lifecycle_conflict` | Creator/non-creator matrix; repeat cancel; governance-hidden 404; assert no aggregate repository call; assert cancelled shell has no totals/counts/percentages |
| `collecting → revealed` | Public candidate: `POST /polls/:pollId/close`; internal candidate: server close worker calling the same transition service | `collecting` only and server time `>= closes_at` | All other lifecycle states; early close attempt | Set server time `revealed_at`; set `public_lock_ends_at = revealed_at + 5 days`; set `public_lifecycle_state='revealed'` | Server worker is authoritative. Optional Creator trigger may call the same service only at/after `closes_at`; no early reveal | Single bounded transaction; lock/read current row, verify state and time, write all three fields atomically | Collecting stays blind until commit. After commit, existing result API may read display-safe aggregate tiers | `not_found`, `unauthorized`, `forbidden`, `validation_error`, `lifecycle_conflict` | Prove `status='closed'` and `total>=30` do not reveal; early close rejected; timestamps atomic; aggregate readable only after explicit lifecycle write |
| `revealed → locked` | Internal candidate: `advancePublicLifecycle(pollId)`; no public route | `revealed` only | All other lifecycle states | No new timestamp; retain `revealed_at` and `public_lock_ends_at`; set `public_lifecycle_state='locked'` | Server worker/service only | Single bounded compare-and-set transaction | Display-safe aggregate remains readable; no raw counter exposure | `not_found`, `lifecycle_conflict` | Transition only from `revealed`; timestamps unchanged; display-safe results remain readable |
| `locked → post_lock` | Internal candidate: `advancePublicLifecycle(pollId)`; no public route | `locked` only and server time `>= public_lock_ends_at` | All other lifecycle states; lock period not yet elapsed | No new timestamp; retain `public_lock_ends_at`; set `public_lifecycle_state='post_lock'` | Server worker/service only | Single bounded compare-and-set transaction | Display-safe aggregate remains readable; state only enables later unpublish | `not_found`, `locked_period_conflict`, `lifecycle_conflict` | Reject before lock end; advance at/after lock end; aggregate remains display-safe |
| `post_lock → unpublished` | Public candidate: `POST /polls/:pollId/unpublish` | `post_lock` only and server time `>= public_lock_ends_at` | `draft`, `collecting`, `cancelled`, `revealed`, `locked`, `unpublished`; governance-hidden polls fail closed | Set server time `unpublished_at`; set `public_lifecycle_state='unpublished'` | Creator only after auth exists; Phase 57 may keep route unavailable until auth boundary is ready | Single bounded transaction; state/time guard and timestamp update together | Never expose prior aggregate after commit; return fixed unpublished shell copy | `not_found`, `unauthorized`, `forbidden`, `already_unpublished`, `locked_period_conflict`, `lifecycle_conflict` | Reject before `post_lock`; repeat unpublish; governance-hidden 404; assert unpublished shell is counter-free and aggregate repository is not called |

## 3. Phase 57 Implementation Boundary

Phase 57 should add one server-side lifecycle transition service and the minimum route adapters that are safe with the available auth boundary. Public route handlers must not accept `public_lifecycle_state`, lifecycle timestamps, counter totals, or shard data from the client.

Scheduler invocation is a later implementation detail: Phase 57 must keep internal transition functions callable and testable without requiring a deployed scheduler. No transition may write logs, metrics, APM payloads, or error payloads containing option choices or user-option linkage.
