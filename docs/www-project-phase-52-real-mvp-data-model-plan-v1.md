# WWW Project Phase 52 — Real MVP 資料模型規劃（v1）

**文件路徑：** `docs/www-project-phase-52-real-mvp-data-model-plan-v1.md`  
**狀態：** 資料模型規劃（**僅文件**；本 Phase **不** 新增 migration、schema、API、auth 或前台行為）  
**規範依據：** `AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`  
**規劃基準：** `origin/master` @ **`eab9a91`** — `docs: add real mvp implementation boundary plan`  
**前置文件：** Phase 39（生命週期政策）、Phase 40（資格／追蹤）、Phase 41（UI 對照）、[**Phase 51**](./www-project-phase-51-real-mvp-implementation-boundary-v1.md)（實作邊界與 Phase 52–60 路線）  

**本文件用途：** 描述從 **Public MVP Demo（靜態／展示）** 走向 **Real MVP（持久化公開問卷流程）** 時，建議的 **邏輯實體／表方向、生命週期狀態、隱私邊界與 Phase 54 前置注意事項**。  
**不是：** 已實作的 schema、ER 定稿、或 migration SQL。

---

## 1. 目前基準

| 項目 | 說明 |
|------|------|
| **Git HEAD** | **`eab9a91`** |
| **Public MVP** | **靜態／展示導向**；`?ui_state=`、`?nav=` 不反映持久化狀態 |
| **Phase 51** | 定義 Real MVP **實作邊界**、風險分級、產品不變量、Phase 52–60 順序 |
| **Phase 52** | **僅** 資料模型規劃（本文件） |
| **既有 DB（Poll Core）** | `users`、`polls`、`poll_options`、`poll_vote_tokens`、`poll_option_vote_counters`（見 `migrations/002`–`004`）；`polls.archived_at`（`006`）；admin correction 表（`007`）— **尚未** 表達 Phase 39 完整公開生命週期 |

**重要：** 現有 `polls.status`（`draft` / `active` / `closed` / …）與 Real MVP 產品狀態 **不完全等同**；Phase 54 須 **對照映射或擴充**，不可假設 `active` = 收集中且已含鎖定期語意。

---

## 2. 核心 Real MVP 邏輯實體（規劃層）

以下為 **建議邏輯實體**（表名為草案，Phase 54 可調整）。每項標示 **建議納入首輪 schema（Phase 54）** 或 **延後**。

### 2.1 總覽

| 邏輯實體 | 建議持久化表（草案） | Phase 54 | 備註 |
|----------|----------------------|----------|------|
| 公開問卷 | `polls`（擴充欄位） | ✅ 首輪 | 延用現表，新增生命週期／時間戳 |
| 問卷選項 | `poll_options` | ✅ 首輪 | 已存在 |
| 生命週期／狀態 | `polls` 欄位 + 可選 `poll_lifecycle_transitions` | ✅ 首輪（欄位必須）；稽核表可選 | 狀態機為高風險 |
| 公開結果表示 | 執行期聚合 + 可選 `poll_result_snapshots` | ⚠️ 首輪可僅 API 層 | 見 §2.4 |
| 可見性／下架 | `polls` 擴充 + 沿用 `archived_at` 語意釐清 | ✅ 首輪 | 與 `unpublished` 對齊命名 |
| 投票資格規則 | `poll_eligibility_rules` | ✅ 首輪（最小） | JSON／正規化擇一，Phase 53 定 |
| 投票 token／投票紀錄邊界 | `poll_vote_tokens`（既有） | ✅ 已存在 | 禁止對外公開 raw 列 |
| 關注結果訂閱 | `poll_result_follow_subscriptions` | ⏳ Phase 58 | Phase 54 可留 FK 占位或完全不建 |
| 站內通知 | `in_app_notifications` | ⏳ Phase 58 | 依訂閱產生 |
| 題目品質回饋 | `poll_quality_feedback` | ⏳ Phase 59+ | 規劃先寫，schema 延後 |
| 信任／信用事件 | `trust_credit_events` | ⏳ Future | 不自動化評分 |
| 高風險／敏感類別審核 | `poll_sensitive_review_cases` | ⏳ Phase 60+ | 工作流自動化延後 |

### 2.2 公開問卷（`polls` 擴充）

**目的：** 公開問卷主檔；創作者、標題、分類、統計期間、生命週期權威狀態。  

**可能欄位（草案，伺服器權威）：**

| 欄位概念 | 說明 |
|----------|------|
| `id`, `creator_id` | 已存在 |
| `title`, `description`, `category` | 已存在；發布後內容鎖定（政策） |
| `public_lifecycle_state` | 見 §3（與 legacy `status` 對照） |
| `statistics_starts_at` | 統計開始（可 = `published_at`） |
| `closes_at` | 截止；MVP：**= 結果公開時間** |
| `revealed_at` | 實際揭曉時刻（MVP 可 = `closes_at`） |
| `public_lock_ends_at` | 公開鎖定期結束（`revealed_at + 5 天`） |
| `cancelled_at` | 收集中取消 |
| `unpublished_at` | 鎖定期後下架 |
| `published_at`, `deleted_at`, `archived_at` | 已存在；須在文件中重新定義與 `unpublished` 關係 |
| `sensitivity_tier` | `normal` / `political_high_risk`（規劃；審核流程延後） |

**隱私風險：** 低（若不含計數）。  
**生命週期風險：** **高** — 錯誤狀態會導致提前揭曉或鎖定失效。

### 2.3 問卷選項（`poll_options`）

**目的：** 穩定 `option_index` 對外；內部 `id` 不暴露。已存在。  
**Phase 54：** 維持現表；確認 ON DELETE 與生命週期一致。

### 2.4 公開結果快照或聚合表示

**目的：** 在 **revealed 之後** 提供 display-safe 摘要（區間化票數／百分比），**收集中不得** 從此處讀出可推論數字。

**規劃選項（Phase 54 擇一，Phase 53 API 定稿）：**

| 方案 | 說明 | Phase 54 |
|------|------|----------|
| **A. 執行期聚合** | 自 `poll_option_vote_counters` 計算後套用 display-safe 層 | 不新增表；**嚴格** 禁止 collecting 路徑讀 counters |
| **B. 揭曉快照** | `poll_result_snapshots` 在 `revealed_at` 寫入 display-safe 列 | 可選表；利於稽核與鎖定期內凍結展示 |

**隱私風險：** **極高** — 快照若含 raw count 並在 collecting 可讀 = P0。  
**建議：** 首輪 Phase 54 採 **A + 強制服務層護欄**；B 列 Phase 55–57 評估。

### 2.5 可見性／下架狀態

**目的：** 區分「結果已公開但仍在鎖定期」與「鎖定期後已下架」；預設探索列表排除 `unpublished`。

**可能欄位：** `public_lifecycle_state = unpublished`、`unpublished_at`、沿用或取代 `archived_at` 語意（**須單一權威**，避免雙欄矛盾）。  

**隱私風險：** 中（下架後 URL 行為）。  
**生命週期風險：** 高（鎖定期內不得下架）。

### 2.6 投票資格規則

**目的：** 描述年齡區間、地區等 **規則**（非政府驗證）；供投票前判斷。

**可能欄位（`poll_eligibility_rules` 或 `polls` JSONB）：**

| 欄位概念 | 說明 |
|----------|------|
| `poll_id` | FK |
| `min_birth_year_month`, `max_birth_year_month` | 自行填寫衍生 |
| `allowed_regions` | 縣市代碼集合 |
| `gender_vote_restriction` | MVP 預設不限制投票資格（Phase 40） |

**隱私風險：** **高** — 不可在公開 API 回傳可識別個人 profile；僅回傳「是否符合」摘要。  
**Phase 54：** 最小規則儲存；判斷邏輯 Phase 56。

### 2.7 投票 token／投票紀錄邊界（既有）

**目的：** 一人一投（Official Vote）；`poll_vote_tokens` 綁 `user_id` + `poll_id`；`poll_option_vote_counters` 為內部 shard 聚合。

| 邊界 | 規則 |
|------|------|
| 對外 API | **不得** 回傳 `poll_vote_tokens` 列、shard、`option_id`（延續現有契約） |
| 收集中 | counters **僅** 後端內部累加；**禁止** 創作者／公開結果 API 讀取 |
| 連結 raw 投票 | 禁止公開「誰投哪一項」 |

**Phase 54：** 不拆表；加 **DB 權限／視圖** 不如 **服務層單一路徑**（Phase 56 測試鎖死）。

### 2.8 關注結果訂閱

**目的：** 不符合資格或暫不投票者，在 **結果公開後** 接收 **站內** 提醒（Phase 40）。

**草案表 `poll_result_follow_subscriptions`：**

| 欄位概念 | 說明 |
|----------|------|
| `id`, `poll_id`, `user_id` | 唯一訂閱 |
| `created_at` | 訂閱時間（可於 collecting） |
| `notify_on_reveal` | 預設 true |
| `cancelled_at` | 使用者取消關注 |

**Phase 54：** **不建表**（Phase 58）。規劃先行避免 Phase 54 poll 表缺少 `user_id` 關聯假設。

### 2.9 站內通知紀錄

**草案表 `in_app_notifications`：**

| 欄位概念 | 說明 |
|----------|------|
| `id`, `user_id`, `type` | 如 `poll_results_revealed` |
| `poll_id`, `payload_summary` | 不含票數細節 |
| `read_at`, `created_at` | 讀取狀態 |

**Phase 54：** 延後至 Phase 58。

### 2.10 題目品質回饋

**草案表 `poll_quality_feedback`：** `vote_token_id` 或 `user_id`+`poll_id`、`tags[]`、`submitted_at`。  
**隱私：** 不回饋者公開身分。  
**Phase 54：** 延後（Phase 59 規劃後實作）。

### 2.11 信任／信用分事件

**草案表 `trust_credit_events`：** `user_id`、`event_type`、`delta`、`source_poll_id`、`created_at`。  
**產品：** 信用點數 **不可購買**；功能點數另表（本規劃 **不納入** 首輪 schema）。  
**Phase 54：** **不建表**。

### 2.12 高風險／敏感類別審核

**草案表 `poll_sensitive_review_cases`：** `poll_id`、`tier`、`review_state`、`reviewer_id`、`decided_at`。  
與既有 **admin correction**（typo／suspend）**分離**。  
**Phase 54：** 可僅在 `polls.sensitivity_tier` 占位；完整工作流 **Phase 60+**。

---

## 3. 問卷生命週期狀態（持久化）

### 3.1 建議 `public_lifecycle_state` 列舉

| 狀態 | 產品用語 | 說明 |
|------|----------|------|
| `draft` | 草稿 | 未公開；可選是否納入 Real MVP 首輪 |
| `collecting` | 收集中 | 可投票；**不** 公開 aggregate |
| `cancelled` | 已取消 | 僅收集中可進入；**無** 公開結果 |
| `revealed` | 已公開（結果已揭曉） | close 完成；aggregate 可 display-safe 展示 |
| `locked` | 公開鎖定期 | revealed 後至 `public_lock_ends_at`；創作者受限 |
| `post_lock` | 鎖定期已結束 | 可維持公開或進入 `unpublished` |
| `unpublished` | 已下架 | 鎖定期後創作者下架；固定文案 |

**與現有 `polls.status` 映射（規劃，Phase 53 定稿）：**

| legacy `status` | 可能對應 |
|-----------------|----------|
| `draft` | `draft` |
| `active` + collecting | `collecting` |
| `closed` | 可能僅表示舊「關閉」— 須拆為 `revealed`/`locked`/`post_lock` |
| `suspended` / `correction_pending` | 營運治理；與公開 lifecycle **正交** |
| `deleted` | 軟刪；與 `unpublished` 不同義 |

### 3.2 狀態轉換（摘要）

```text
draft → collecting（發布）
collecting → cancelled（創作者取消；無公開結果）
collecting → revealed（close：統計結束 + aggregate 公開；MVP: closes_at = revealed_at）
revealed → locked（自動：revealed_at 起算鎖定期）
locked → post_lock（public_lock_ends_at 到達）
post_lock → unpublished（創作者下架，可選）
post_lock → （維持公開，仍為 post_lock 或 revealed_public 子狀態—Phase 53 定 UI 標籤）
```

**語意澄清（與 Phase 39／51 一致）：**

| 規則 | 說明 |
|------|------|
| **close** | 投票／統計期結束 **且** aggregate **公開**；**≠** 鎖定期結束 |
| **鎖定期起點** | **結果公開之後**（`revealed_at`） |
| **MVP 鎖定期長度** | 暫定 **5 天** → `public_lock_ends_at` |
| **unpublish** | **僅允許** `post_lock`（或等價：鎖定期已結束） |
| **cancel** | **僅** `collecting`；**不** 稱下架；**不** 形成公開結果 |

**禁止轉換（須 DB CHECK + 服務層雙重防護）：**

- `collecting` → `unpublished`（應先 cancel 或 close）
- `locked` → `unpublished`
- `cancelled` → `revealed`
- 任何狀態 → 在 collecting 暴露 counter 的「假 revealed」

---

## 4. 隱私敏感欄位與邊界

### 4.1 收集中 **禁止** 對任何公開／創作者讀取路徑暴露

| 類別 | 範例 | 備註 |
|------|------|------|
| 票數 | per-option count、shard sum | 含 `poll_option_vote_counters` |
| 百分比 | `display_percentage` | API 須為 `null` |
| 總票數 | `total_votes`、區間上限推論 | `total_votes_display` = 「收集中」 |
| 排名 | option 排序依票數 | 禁止 |
| 趨勢／進度 | 時間序列、成長率、進度條 | 禁止 |
| 創作者期中結果 | founder dashboard 聚合 | **與公眾同標準** |
| Raw 投票連結 | token → option_id 對外公開 | 禁止 |
| 可識別 eligibility | 完整生日、精確地址 | 僅規則摘要 + 你是否符合 |

### 4.2 儲存但 **不可** 經錯誤 API 在 collecting 讀出的資料

| 儲存位置 | 風險 |
|----------|------|
| `poll_option_vote_counters` | 內部累加必要；**最大洩漏源** |
| `poll_vote_tokens` | 洩漏可推論參與 |
| 未來 `poll_result_snapshots` | 若提前寫入則違規 |

### 4.3 display-safe 層（revealed 後）

允許 **區間化** `display_count`／`display_percentage`（見 agent spec），仍 **禁止** raw counter 列與個人投票紀錄。

---

## 5. 主要概念邊界表

| 概念 | 目的 | 可能欄位（摘要） | 隱私風險 | 生命週期風險 | Phase 54 |
|------|------|------------------|----------|--------------|----------|
| 公開問卷 | 主檔與狀態 | §2.2 | 低 | 高 | ✅ |
| 選項 | 對外 index | `option_order`, `option_text` | 低 | 低 | ✅ 已有 |
| 生命週期 | 狀態機 | `public_lifecycle_state`, 時間戳 | 低 | **極高** | ✅ |
| 結果表示 | 揭曉後摘要 | display-safe 欄位或快照 | **極高** | 高 | ⚠️ 欄位/服務層 |
| 下架／可見性 | 探索列表 | `unpublished_at`, list flags | 中 | 高 | ✅ |
| 資格規則 | 誰可投 | 年齡／地區規則 | 高 | 中 | ✅ 最小 |
| 投票 token | 防重複投 | `user_id`, `poll_id`, `option_id` | **極高** | 中 | ✅ 已有 |
| 關注訂閱 | 揭曉通知 | `user_id`, `poll_id` | 中 | 低 | ⏳ 58 |
| 站內通知 | 送達紀錄 | `user_id`, `type`, `read_at` | 中 | 低 | ⏳ 58 |
| 品質回饋 | 題目品質訊號 | tags, 關聯 vote | 中 | 低 | ⏳ 59+ |
| 信任事件 | 信用累積 | event_type, delta | 中 | 中 | ⏳ Future |
| 敏感審核 | 高風險題 | review_state | 低 | 高 | ⏳ 60+ |

---

## 6. 首輪 Real MVP schema **不納入**（Future）

| 項目 | 原因 |
|------|------|
| 付費 **功能點數** 帳本 | 產品未定價；且不可購買信任 |
| 完整 **信任評分自動化** | Phase 59 先規劃 |
| **進階 feed 個人化／榜單** | 與 AGENTS 紅線衝突風險高 |
| **Email／推播** 通知通道 | Phase 40 Future |
| **放棄投票，只看結果** | 產品 Future |
| **政治／高風險審核全自動工作流** | Phase 60 規劃後實作 |
| 進階 moderation／Spread Score 排序 | 超出 Real MVP |
| `poll_result_follow_subscriptions` / `in_app_notifications` | Phase 58 |
| `poll_quality_feedback` / `trust_credit_events` | Phase 59+ |

---

## 7. 產品不變量（須保留）

完整條文與 Agent 標記見 [**Phase 51 §5**](./www-project-phase-51-real-mvp-implementation-boundary-v1.md)。摘要：

1. 收集中不顯示票數、百分比、總票數、排名、趨勢、進度。  
2. 發起者收集中也不能看到中途結果。  
3. close = 投票／統計期間結束 + aggregate 結果公開。  
4. close ≠ 鎖定期結束。  
5. 結果公開後進入公開鎖定期，MVP 暫定 5 天。  
6. 鎖定期內不能下架、刪除、修改、重新開放、隱藏結果。  
7. 鎖定期結束後，發起者可選擇下架。  
8. 收集中停止叫「取消」，不叫下架；取消不形成公開結果。  
9. 下架文案固定：「此問卷已結束公開鎖定期，並由發起者下架。」

**資料模型含意：** 任何可在 collecting 查詢到 counter／snapshot 的 view、materialized view、報表欄位 **均違反** 不變量。

---

## 8. Phase 54 前置備註（供 migration 實作）

### 8.1 建議首輪建立的表／變更

| 優先序 | 物件 | 說明 |
|--------|------|------|
| P0 | `polls` 擴充 | `public_lifecycle_state`、`revealed_at`、`public_lock_ends_at`、`cancelled_at`、`unpublished_at`（及與 legacy `status` 對照） |
| P0 | CHECK / 觸發器草案 | 禁止非法狀態轉換（文件層先列，SQL 在 54） |
| P1 | `poll_eligibility_rules` | 最小資格儲存 |
| P2 | 可選 `poll_lifecycle_transitions` | 稽核：from_state、to_state、actor_id、at |
| 延後 | follow / notification / feedback / trust / review 表 | 見 §6 |

### 8.2 須嚴格審查的約束

- `unpublished_at IS NOT NULL` ⇒ `public_lifecycle_state = unpublished` 且 `now() >= public_lock_ends_at`（或 `post_lock` 已達）  
- `cancelled_at IS NOT NULL` ⇒ 從未進入 `revealed`  
- `revealed_at` 不得早於統計開始  
- `public_lock_ends_at = revealed_at + interval '5 days'`（MVP 常數可配置但 **伺服器** 計算）  
- `archived_at` 與 `unpublished_at` **擇一權威**（避免雙語意）

### 8.3 可能索引

| 索引 | 用途 |
|------|------|
| `(public_lifecycle_state, published_at DESC)` | 公開列表（仍 freshness-only，無票數排序） |
| `(creator_id, public_lifecycle_state)` | 我的問卷 |
| `(public_lock_ends_at)` WHERE state = locked | 排程轉 post_lock |
| `(closes_at)` WHERE state = collecting | 排程 close→revealed |
| 既有 `idx_polls_public_feed_freshness` | **須更新 predicate** 排除 unpublished／cancelled |

### 8.4 必須伺服器控制的欄位

- 所有生命週期時間戳（不可信任客戶端 `revealed_at`）  
- `public_lifecycle_state` 轉換  
- display-safe 輸出內容  
- 資格判斷結果  

### 8.5 權威時間戳

| 時間戳 | 權威來源 |
|--------|----------|
| `closes_at` | 創建／發布時設定；close 作業以伺服器 `now()` 比對 |
| `revealed_at` | close 作業寫入（MVP = 達到 `closes_at` 的 job 或同步觸發） |
| `public_lock_ends_at` | `revealed_at + 5d` 伺服器計算 |
| `cancelled_at` / `unpublished_at` | 對應作業寫入 |

### 8.6 建議交易保護的轉換

| 轉換 | 交易內動作 |
|------|------------|
| collecting → revealed | 更新 state + `revealed_at` + `public_lock_ends_at`；**不** 寫入可讀 snapshot 到公開路徑前的中間 commit |
| collecting → cancelled | state + `cancelled_at`；確認無結果列 |
| post_lock → unpublished | state + `unpublished_at`；更新 feed predicate |
| 投票 | token 插入 + counter 遞增；**不** 回傳 counter |

---

## 9. 開放問題與風險

| # | 問題 | 建議處理 Phase |
|---|------|----------------|
| OQ-1 | legacy `polls.status` 與 `public_lifecycle_state` 雙軌要維持多久？ | 53 API 規格；54 migration 附對照表 |
| OQ-2 | `archived_at` 是否等同 `unpublished_at`？ | 54 前定義單一欄位或明確分工 |
| OQ-3 | `revealed` 與 `locked` 分兩 state 或 `revealed`+flag？ | 53 定 UI；54 選一種 CHECK |
| OQ-4 | 排程 close 用 DB job 還是應用 worker？ | 54/57 實作；規劃假設伺服器觸發 |
| OQ-5 | collecting 創作者 API 是否完全禁止 `GET .../results`？ | 56 測試矩陣 |
| OQ-6 | 高風險題未審核是否阻擋 `draft→collecting`？ | 60 規劃；54 可僅 enum 占位 |

| 風險 | 等級 | 緩解 |
|------|------|------|
| counter 表被新 API 直接 JOIN | P0 | 單一 ResultReadService；collecting 短路 |
| 雙狀態欄位不同步 | P1 | 54 起棄用或自動同步 legacy status |
| 提前 unpublish CHECK 遺漏 | P1 | integration test + DB CHECK |

---

## 10. 相關文件

| 文件 | 用途 |
|------|------|
| [`www-project-phase-51-real-mvp-implementation-boundary-v1.md`](./www-project-phase-51-real-mvp-implementation-boundary-v1.md) | 實作邊界、Phase 52–60 |
| [`www-project-phase-39-poll-lifecycle-policy-v1.md`](./www-project-phase-39-poll-lifecycle-policy-v1.md) | 生命週期政策 |
| [`www-project-phase-40-user-profile-eligibility-follow-policy-v1.md`](./www-project-phase-40-user-profile-eligibility-follow-policy-v1.md) | 資格／追蹤 |
| [`www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md`](./www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md) | UI 對照 |
| `migrations/002_phase1_poll_core.sql` 等 | **現況** schema（非 Real MVP 定稿） |

---

## 11. Phase 52 自我稽核

| 檢查項 | 結果 |
|--------|------|
| 僅文件 + README／交接連結 | ✅ |
| 未 stage `design-drafts/` | ✅ |
| 未改 schema／migration／API／auth／業務邏輯 | ✅ |
| 未宣稱 Real MVP 持久化已實作 | ✅ |
| 繁體中文、與 Public MVP／Phase 51 用語一致 | ✅ |

---

*Phase 52 — 資料模型規劃 v1。Phase 53 API／規格見 [`www-project-phase-53-public-lifecycle-api-spec-plan-v1.md`](./www-project-phase-53-public-lifecycle-api-spec-plan-v1.md)。下一建議步驟：Phase 54 schema／migration（高風險）。*

**Phase 54 實作註記：** 首輪 schema 已由 [`www-project-phase-54-public-lifecycle-schema-foundation-v1.md`](./www-project-phase-54-public-lifecycle-schema-foundation-v1.md) 交付。實作保留 legacy `polls.status`，新增權威 `public_lifecycle_state`；`archived_at` 與 founder `unpublished_at` 分工；沿用 `closes_at`；採分離 `revealed`／`locked`／`post_lock` state；新增最小 `poll_eligibility_rules`。未新增 snapshot、follow、notification、feedback、trust 或 review 表。
