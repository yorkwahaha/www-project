# WWW Project Phase 64 — Lifecycle Scheduler Runner v1

**狀態：** 已新增 explicit one-shot scheduler runner；不含 production cron 安裝、always-on worker、schema、migration、HTTP、frontend、auth/session、notification、trust、feedback 或 governance 變更。

## 1. Operator Command

先完成 build，並在目前 shell 設定已套用 migrations 的 `DATABASE_URL`：

```bash
npm run build
npm run scheduler:lifecycle -- --limit 100
```

- `--limit` 可省略，預設 `100`。
- 允許範圍為整數 `1..100`；超出範圍時拒絕執行。
- 每次命令只跑一個 bounded batch，完成後關閉 PostgreSQL pool 並結束。
- 此命令可由 operator 手動執行，也可由外部 cron／scheduler 定期呼叫。
- Repo **不會**在 `npm start`、HTTP request、公開頁面或 API request 中自動執行 scheduler。

## 2. Lifecycle Boundary

Runner 僅呼叫既有 Phase 58A `runDuePublicLifecycleAdvancementBatch()`：

- due `revealed -> locked`
- due `locked -> post_lock`
- malformed timestamp row fail closed，保留原 state，命令回傳 nonzero

Runner **不**處理：

- `collecting -> revealed`
- `collecting -> cancelled`
- `post_lock -> unpublished`

因此 `status='closed'` 或 `total >= 30` 不會透過 runner 自動揭曉結果。Creator DELETE 仍拒絕 `revealed`／`locked`／`post_lock`；結果下架仍只能走 guarded creator `POST /polls/:id/unpublish`。

## 3. Operational Output

Runner 只輸出 safe operational summary：

```text
lifecycle-scheduler: {"candidate_count":2,"advanced_count":2,"locked_count":1,"post_lock_count":1,"failed_count":0,"failed_by_code":{}}
```

輸出不得包含 poll id、timestamps、raw counters、vote details、`option_id`、user/session/device/request/trace linkage 或 raw error payload。Unexpected failure 僅輸出 generic message。

Exit code：

| Code | Meaning |
|------|---------|
| `0` | Batch completed，無 fail-closed rows |
| `1` | Invalid CLI arguments 或 unexpected runner failure |
| `2` | Batch 完成，但至少一列 fail closed |

## 4. Deployment Caveats

Production cron 部署仍由 operator 負責，包括：

- 執行頻率
- 避免過度重疊執行
- process supervision
- nonzero exit alerting
- retry policy
- `DATABASE_URL` secret injection

目前 repository 的 row-lock transition 會在 concurrent runners 下重新檢查 lifecycle state，避免不安全重複 advancement。部署層仍應避免不必要的 cron overlap。

## 5. Privacy And Integrity Self-Check

- 無 schema 或 migration。
- 無 auth/session、feed ranking、personalization 或結果顯示門檻變更。
- Candidate discovery 仍不 JOIN counters。
- 無 durable user-option linkage。
- 無新 logs、metrics、APM、debug payload 或 analytics 捕捉 option choice。
