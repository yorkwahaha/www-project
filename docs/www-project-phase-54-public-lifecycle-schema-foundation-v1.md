# WWW Project Phase 54 — Public Lifecycle Schema Foundation v1

**狀態：** 已實作 migration foundation；尚未實作公開 lifecycle API、前台行為、auth/session 或資格判斷。
**Migration：** `migrations/008_phase54_public_lifecycle_foundation.sql`

## 1. 範圍

Phase 54 只建立 Real MVP 公開問卷生命週期的 DB 基礎：

- 擴充 `polls` 的 server-controlled lifecycle 欄位。
- 新增最小 `poll_eligibility_rules` 規則儲存。
- 新增 DB CHECK 與排程查詢索引。
- 保留既有 API、前端、auth/session 與 feed 行為。

本 Phase **不** 新增公開 API，不讀取或 JOIN `poll_option_vote_counters`，不新增結果快照、通知、follow、feedback、trust、review 或 lifecycle event 表。

## 2. Schema 變更

### 2.1 `polls`

新增：

| 欄位 | 用途 |
|------|------|
| `public_lifecycle_state` | 未來公開 API 的權威 lifecycle state |
| `revealed_at` | 實際揭曉時間 |
| `public_lock_ends_at` | 公開鎖定期結束時間；若存在，必須等於 `revealed_at + 5 days` |
| `cancelled_at` | 收集中取消時間；僅 `cancelled` state 可寫 |
| `unpublished_at` | founder 下架時間；僅 `unpublished` 且不得早於 lock 結束 |

允許狀態：

```text
draft, collecting, cancelled, revealed, locked, post_lock, unpublished
```

`closes_at` 已存在，繼續作為 MVP 的 server-owned 排程截止時間，不新增 `scheduled_close_at`。

### 2.2 `poll_eligibility_rules`

新增一對一最小規則表：

```text
poll_id, rule_type, min_birth_year_month, max_birth_year_month,
allowed_regions, created_at, updated_at
```

`rule_type` 僅允許 `unrestricted`, `age`, `region`, `age_region`。本 Phase 不做 eligibility evaluation，也不儲存使用者 profile snapshot 或 vote-time eligibility snapshot。

## 3. Open Questions 決議

| ID | Phase 54 決議 |
|----|---------------|
| OQ-1 | 保留 legacy `polls.status` 供既有程式相容；新增 `public_lifecycle_state` 作未來公開 API 唯一對外狀態。migration 只做安全 backfill；legacy `closed` 不自動視為 revealed。 |
| OQ-2 | `archived_at` 保留既有 moderation/discovery archive 語意；`unpublished_at` 專供 founder 在 post-lock 後下架。兩者不互相自動同步。 |
| OQ-3 | `revealed`, `locked`, `post_lock` 採分離 state，並用 `public_lock_ends_at` 驗證 5 天鎖定期。 |
| OQ-4 | 沿用 `closes_at`；Phase 57 再實作 server-side close worker／交易，不新增 client-owned 排程欄位。 |
| OQ-6 | 高風險審核阻擋 publish 仍是 Phase 60+；本 Phase 不新增 review table、flag 或 workflow。 |

## 4. Legacy 相容與 Fail-Closed

- 既有 `status='active'` rows backfill 為 `collecting`。
- 已發布且治理狀態為 `suspended`／`correction_pending` 的 rows backfill 為 `collecting`；治理狀態仍與 lifecycle 正交。
- 其餘既有 rows，包括語意不明確的 legacy `closed`，backfill 為 `draft`，避免未來 API 誤判已揭曉而洩漏 aggregate。
- insert-only trigger 暫時讓未更新的 legacy `POST /polls` 寫入在 `status='active'` 時初始化為 `collecting`；其他 omitted lifecycle state 預設為 `draft`。
- 後續 lifecycle service 應明確寫入 `public_lifecycle_state`，不得使用 legacy `status='closed'` 猜測結果已揭曉。

## 5. Rollback 說明

Migration 為 forward-only。若部署後需回退應用程式，新增欄位、索引、trigger 與規則表可保留，不影響既有讀寫路徑。
若人工 schema rollback 確實不可避免，須先停止 lifecycle writer，再依相反順序移除 `poll_eligibility_rules`、索引、trigger/function、CHECK 與新增欄位。不得在有 Real MVP lifecycle 資料後直接 drop 欄位。

## 6. Future

- Phase 55A：已新增 public result lifecycle guard；只有 `revealed`／`locked`／`post_lock` 可讀 aggregate。collecting 與 unavailable 狀態回 counter-free shell；legacy `status='closed'` 與票數門檻不會自行揭曉結果。
- Phase 55B–57：公開 lifecycle create/read 擴充、close/reveal/post-lock/unpublish 交易。
- Phase 56：eligibility evaluation 與 collecting 隱私測試。
- Phase 58+：follow-result subscription 與 in-app notification。
- Phase 59+：feedback。
- Phase 60+：high-risk review workflow。
- Future：是否淘汰 legacy `polls.status`、是否調整既有 feed predicate。
