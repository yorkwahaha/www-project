# WWW Project Phase 58A — Lifecycle Scheduler Advancement Foundation v1

**狀態：** 已實作 scheduler-facing lifecycle advancement foundation；不含 cron、部署、frontend、notification、schema 或 migration 變更。

## 1. 已實作

- 新增 `createPublicLifecycleSchedulerService(repository)`。
- Scheduler caller 可定期呼叫 `runDuePublicLifecycleAdvancementBatch(limit?)`。
- 預設與最大 batch size 皆為 `100`，避免單次作業無界限掃描或寫入。
- PostgreSQL candidate discovery 使用資料庫 `NOW()`：
  - `revealed` 僅在 `revealed_at <= NOW()` 時列入，然後透過既有 row-lock transition 前進至 `locked`。
  - `locked` 僅在 `public_lock_ends_at <= NOW()` 時列入，然後透過既有 row-lock transition 前進至 `post_lock`。
  - required timestamp 缺失的 malformed row 會列入並 fail closed，保留原 state。
- 每個 candidate 仍透過 Phase 57／57F 的 `advancePublicLifecycle(pollId)` 完成單列、短交易與 row lock 驗證。

## 2. Privacy And Integrity Boundary

- `public_lifecycle_state` 仍是 lifecycle 唯一權威狀態。
- Scheduler 不處理 `collecting -> revealed`；`status='closed'` 或 `total >= 30` 不會自行揭曉結果。
- Candidate discovery 不讀取或 JOIN `poll_option_vote_counters`。
- Scheduler 不新增 lifecycle event log、result snapshot、raw vote event、analytics、metrics 或 durable user-option linkage。
- Creator DELETE 仍拒絕 `revealed`／`locked`／`post_lock`；公開鎖定結束後隱藏結果仍只能走 guarded `unpublish`。

## 3. Phase 64 Runner Wiring

Phase 64 已新增 explicit one-shot runner。完成 build 且在 shell 設定已 migration 的 `DATABASE_URL` 後，可手動執行：

```bash
npm run build
npm run scheduler:lifecycle -- --limit 100
```

Runner 適合後續由 cron 呼叫，但 repo 不會安裝或自動啟動 production cron。詳細操作與安全邊界見 [`www-project-phase-64-lifecycle-scheduler-runner-v1.md`](./www-project-phase-64-lifecycle-scheduler-runner-v1.md)。
