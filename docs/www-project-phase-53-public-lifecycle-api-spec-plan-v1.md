# WWW Project Phase 53 — 公開問卷生命週期 API／規格規劃（v1）

**文件路徑：** `docs/www-project-phase-53-public-lifecycle-api-spec-plan-v1.md`  
**狀態：** API／行為規格規劃（**僅文件**；本 Phase **不** 實作 schema、migration、路由程式或前台行為）  
**規範依據：** `AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`  
**規劃基準：** `origin/master` @ **`6d71358`** — `docs: plan real mvp data model`  
**前置文件：**  
- [`www-project-phase-51-real-mvp-implementation-boundary-v1.md`](./www-project-phase-51-real-mvp-implementation-boundary-v1.md)（實作邊界）  
- [`www-project-phase-52-real-mvp-data-model-plan-v1.md`](./www-project-phase-52-real-mvp-data-model-plan-v1.md)（資料模型）  
- Phase 39（生命週期政策）、Phase 40（資格／追蹤）  

**本文件用途：** 定義 Real MVP **公開問卷生命週期** 的 HTTP API **行為規格**（端點意圖、狀態閘、回應形狀、錯誤類別、權限），供 Phase 54+ 實作對照。  
**不是：** 已上線 API、OpenAPI 定稿、或實作完成證明。

**既有 Poll Core（今日）：** `POST /polls`、`GET /polls/:id`、`POST /polls/:id/vote-by-index`、`GET /polls/:id/results`、`GET /polls/feed` 等 — 生命週期與 Phase 39 **未完整對齊**；Real MVP 將 **擴充或收斂** 行為，而非假設現況即合規。

---

## 1. 目前基準

| 項目 | 說明 |
|------|------|
| **Git HEAD** | **`6d71358`** |
| **Public MVP** | 仍為 **靜態／展示導向**；`?ui_state=` 不反映持久化 API |
| **Phase 51** | Real MVP **實作邊界**、風險分級、產品不變量 |
| **Phase 52** | **資料模型**規劃（`public_lifecycle_state`、時間戳、隱私欄位） |
| **Phase 53** | **API／規格行為**規劃（本文件） |
| **持久化** | **尚未實作**；下列端點為 **規劃面** |

---

## 2. 公開生命週期 API 表面（規劃提案）

命名採 REST 風格；實作時可併入既有 `/polls` 樹，但 **行為** 以下表為準。

**身分標記（規劃）：**

| 標記 | 說明 |
|------|------|
| **Auth** | 真實登入 session／token（Real MVP；現階段 demo 用 `X-User-Id` 占位） |
| **Creator** | 問卷 `creator_id` 與請求使用者一致 |
| **Eligible** | 通過 Phase 40 資格判斷 |
| **Guest** | 未登入；可讀部分公開欄位，不可投票／不可關注持久化（至 Auth 就緒） |

### 2.1 端點總表

| 方法 | 路徑（草案） | 用途摘要 | Phase 實作 |
|------|--------------|----------|------------|
| `POST` | `/polls` | 建立並發布公開問卷（或 draft→publish 兩段） | 55 |
| `GET` | `/polls/:pollId` | 公開問卷基本資訊（無 aggregate） | 55 |
| `GET` | `/polls/:pollId/results` | 公開結果／收集中狀態殼（display-safe） | 56–57 |
| `POST` | `/polls/:pollId/cancel` | 收集中取消 | 57 |
| `POST` | `/polls/:pollId/close` | 截止並揭曉（close = reveal） | 57 |
| `POST` | `/polls/:pollId/unpublish` | 鎖定期後下架 | 57 |
| `POST` | `/polls/:pollId/vote-by-index` | 官方投票（既有，行為收斂） | 56 |
| `POST` | `/polls/:pollId/follow-results` | 關注結果（站內通知 MVP） | 58 |
| `DELETE` | `/polls/:pollId/follow-results` | 取消關注 | 58 |
| `GET` | `/me/notifications` | 站內通知列表（規劃占位） | 58 |
| `PATCH` | `/me/notifications/:id/read` | 標記已讀 | 58 |

**刻意不在 Phase 53–57 規劃實作：** 付費點數、信任分寫入、品質回饋 POST、高風險審核完整流程、email/push、skip-vote-view-results。

---

### 2.2 `POST /polls` — 建立公開問卷

| 項目 | 規格 |
|------|------|
| **目的** | 創建問卷並進入可投票的公開統計期（MVP：可直接 `collecting`） |
| **Actor** | 已登入創作者（Auth）；須滿足發起信任等級（未來；規劃占位 `trust_level_sufficient`） |
| **允許狀態** | N/A（建立後目標 `collecting` 或 `draft`→publish） |
| **禁止** | 高風險類別若 `review_required` 且未核准則不可進入 `collecting`（見 §9 OQ-6） |
| **Auth** | 需要 |
| **資格** | 不適用（創建非投票） |
| **Creator** | 請求者成為 `creator_id` |

**成功回應（高層）：**

```json
{
  "poll_id": "uuid",
  "public_lifecycle_state": "collecting",
  "share_urls": { "vote": "/vote/{id}", "results": "/results/{id}" },
  "closes_at": "ISO8601",
  "statistics_starts_at": "ISO8601"
}
```

**敏感欄位：** 回應 **不得** 含 option 內部 id（維持 `option_index` 對外）、票數、token。

**錯誤類別：** `validation_error`、`unauthorized`、`forbidden`（額度／信任不足）、`review_required`（未來）。

---

### 2.3 `GET /polls/:pollId` — 公開問卷詳情

| 項目 | 規格 |
|------|------|
| **目的** | 標題、說明、選項標籤、生命週期狀態、統計期間、資格摘要；**不含** aggregate |
| **Actor** | Guest／已登入使用者／創作者／不符合資格者 — **同一公開契約**（創作者無額外期中數字） |
| **允許狀態** | `collecting`、`revealed`、`locked`、`post_lock`、`cancelled`、`unpublished`（文案因狀態而異）；`draft` 僅 Creator |
| **禁止狀態** | 營運 `suspended`／`correction_pending` 對外 `not_found` 或治理遮罩（沿用現有公開可見性） |

**成功回應（高層）：**

```json
{
  "poll_id": "uuid",
  "public_lifecycle_state": "collecting",
  "title": "…",
  "description": "…",
  "options": [{ "option_index": 0, "label": "…" }],
  "closes_at": "ISO8601",
  "revealed_at": null,
  "public_lock_ends_at": null,
  "eligibility_summary": "年齡 18–30（自行填寫判斷）",
  "viewer": { "can_vote": true, "can_follow_results": true, "ineligible_reason": null }
}
```

**隱私敏感欄位（禁止出現）：** `option_id`、vote token、shard、任何 count/percent/rank、`poll_option_vote_counters` 衍生值。

**Auth：** 不強制；`viewer.*` 在 Guest 時 `can_vote: false`（須登入且 Eligible）。

**錯誤：** `not_found`、`forbidden`（draft 非創作者）。

---

### 2.4 `GET /polls/:pollId/results` — 公開結果狀態（核心）

| 項目 | 規格 |
|------|------|
| **目的** | 回傳 **display-safe** 結果物件或 **收集中／終局** 狀態殼；為 Real MVP **P0** 端點 |
| **Actor** | 見 §4 分角色表；**創作者無特權聚合** |
| **允許狀態** | 全部公開可見狀態；內容隨狀態變化 |
| **禁止** | 在 `collecting` 回傳可推論票數之欄位；禁止 JOIN counters |

**Auth：** 不強制讀取；投票仍另端點 Auth。

詳細 collecting 規則見 **§4**。

---

### 2.5 `POST /polls/:pollId/cancel` — 取消問卷

| 項目 | 規格 |
|------|------|
| **目的** | 收集中停止；**不** 產生公開 aggregate |
| **Actor** | Creator |
| **允許狀態** | 僅 `collecting` |
| **禁止狀態** | `revealed` 及之後、`cancelled`、`unpublished` |

**成功：** `{ "public_lifecycle_state": "cancelled", "message": "問卷已取消，不會產生公開結果。" }`  
**錯誤：** `lifecycle_conflict`、`already_cancelled`、`unauthorized`、`forbidden`（非創作者）。

---

### 2.6 `POST /polls/:pollId/close` — 截止並揭曉

| 項目 | 規格 |
|------|------|
| **目的** | 結束投票／統計並 **立即** 公開 aggregate（MVP：`closes_at` 到達可由排程或 Creator 手動觸發 — 見 §9） |
| **Actor** | 排程系統 **或** Creator（若產品允許提前 close — Phase 57 定是否僅準時） |
| **允許狀態** | `collecting` → `revealed`（並寫入 `revealed_at`、`public_lock_ends_at`） |
| **禁止** | `cancelled`、`unpublished`、已 `revealed` |

**成功：** `{ "public_lifecycle_state": "revealed", "revealed_at": "…", "public_lock_ends_at": "…" }`  
**錯誤：** `lifecycle_conflict`、`validation_error`（時序）、`forbidden`。

**語意：** **close ≠ 鎖定期結束**；回應可提示 `public_lock_ends_at` 但 **不** 表示已可下架。

---

### 2.7 `GET /polls/:pollId/results`（`revealed` 後）— 讀取揭曉後結果

與 §2.4 同一路由；當 `public_lifecycle_state` ∈ `{ revealed, locked, post_lock }`：

**成功（高層）：**

```json
{
  "poll_id": "uuid",
  "public_lifecycle_state": "locked",
  "display_mode": "rounded_with_bucketed_votes",
  "collecting": false,
  "total_votes_display": "100–499",
  "options": [
    {
      "option_index": 0,
      "display_label": "選項 A",
      "display_count": "約 40–60 票",
      "display_percentage": "約 40%"
    }
  ],
  "updated_display": "最近更新"
}
```

**禁止：** raw counter、精確整數總票、可反推個人投票的欄位。

**狀態 `unpublished`：** 見 §2.8 終局形狀。

---

### 2.8 `POST /polls/:pollId/unpublish` — 鎖定期後下架

| 項目 | 規格 |
|------|------|
| **目的** | 創作者於鎖定期結束後移除一般公開展示 |
| **Actor** | Creator |
| **允許狀態** | 僅 `post_lock`（或等價：`now >= public_lock_ends_at` 且未 unpublished） |
| **禁止** | `collecting`、`locked`、`cancelled` |

**成功：** `{ "public_lifecycle_state": "unpublished", "user_message": "此問卷已結束公開鎖定期，並由發起者下架。" }`  
**錯誤：** `locked_period_conflict`、`lifecycle_conflict`、`already_unpublished`、`forbidden`。

---

### 2.9 `POST /polls/:pollId/follow-results` — 關注結果

| 項目 | 規格 |
|------|------|
| **目的** | 記錄站內通知訂閱；結果公開時提醒（Phase 58 持久化） |
| **Actor** | Auth 使用者（含不符合投票資格者） |
| **允許狀態** | 主要 `collecting`（亦可允許 revealed 後補訂 — 產品可僅通知未來變化） |
| **禁止** | `cancelled`（無結果可跟）、`unpublished` 可 `not_found` |

**成功：** `{ "followed": true, "notify_channel": "in_app_only" }`  
**Auth：** 需要（Guest 回 `unauthorized` 並引導登入）。  
**錯誤：** `not_found`、`lifecycle_conflict`。

**Phase 53–57：** 可回 **501／占位** 或文件化 mock；**不得** 宣稱已持久化。

---

### 2.10 `GET /me/notifications` — 站內通知（規劃占位）

| 項目 | 規格 |
|------|------|
| **目的** | 列出 `poll_results_revealed` 等摘要；**不含** 票數 |
| **Actor** | Auth 使用者 |
| **允許狀態** | N/A |
| **成功（高層）：** `{ "notifications": [{ "id", "type", "poll_id", "title", "read_at", "created_at" }] }` |
| **Phase 58** 實作；Phase 53 僅定契約。 |

---

### 2.11 既有端點收斂（規劃備註）

| 既有 | Real MVP 收斂 |
|------|----------------|
| `POST /polls/:id/vote-by-index` | 僅 `collecting` + Eligible + 未投票；回應 display-safe，無 token |
| `DELETE /polls/:id` | 與 **unpublish** 分離；刪除非 Real MVP 首輪公開路徑或僅營運 |
| `GET /polls/feed` | 維持 freshness-only；排除 `unpublished`／`cancelled`；**禁止** 依票數排序 |

---

## 3. 生命週期狀態行為（API 視角）

採 Phase 52 之 `public_lifecycle_state`：

| 狀態 | 可投票 | `GET .../results` 有 aggregate | 創作者可 cancel | 創作者可 unpublish | 創作者可 edit |
|------|--------|-------------------------------|-----------------|-------------------|---------------|
| `draft` | 否 | 否 | — | 否 | 是（若產品允許） |
| `collecting` | 是（Eligible） | **否**（§4） | 是 | 否 | 否 |
| `cancelled` | 否 | 否（終局文案） | 否 | 否 | 否 |
| `revealed` | 否 | 是（display-safe） | 否 | 否 | 否 |
| `locked` | 否 | 是 | 否 | 否 | 否 |
| `post_lock` | 否 | 是 | 否 | 是 | 否 |
| `unpublished` | 否 | 否（固定下架文案） | 否 | 否 | 否 |

**語意（API 必須一致）：**

- **close**（`POST .../close` 或排程）⇒ `revealed` + aggregate 可讀。  
- **close ≠** `post_lock`；鎖定期由 `revealed_at` 起算 5 天。  
- **cancel** 僅 `collecting`；回應與 `GET .../results` 皆 **無** aggregate。  
- **unpublish** 僅 `post_lock`（或 `now >= public_lock_ends_at`）。

**自動轉換（伺服器）：** `revealed` → `locked`（立即或次秒）；`locked` → `post_lock`（時間到）；**不** 由客戶端指定目標狀態繞過檢查。

---

## 4. 收集中隱私回應規則（P0）

### 4.1 全域禁止（所有角色、所有公開結果路徑）

在 `public_lifecycle_state === collecting` 時，**不得** 出現：

- 票數、百分比、總票數、排名、趨勢、進度條資料  
- 可排序選項（依得票）  
- `poll_option_vote_counters` 或 JOIN 其衍生欄位  
- vote token、shard、`option_id`  
- 隱藏欄位讓前端推算（例如 `rank`、`delta`、`bucket_upper` 單獨暴露）  

**Phase 52 P0：** 新公開 API **禁止** 在 collecting 路徑 JOIN `poll_option_vote_counters`。

### 4.2 建議統一 collecting 回應（所有角色相同形狀）

**決策（Phase 53 建議，供 Phase 56 實作）：**  
`GET /polls/:pollId/results` 在 collecting 時 **不返回 aggregate 結果載荷**；改返回 **狀態殼**（創作者與訪客 **同一 JSON 形狀**）。

| 角色 | 行為 |
|------|------|
| **一般已登入且 Eligible** | `collecting: true`，`display_mode: "collecting"`，`options[].display_count/percentage: null`，`total_votes_display: "收集中"`；可投票則 `GET /polls/:id` 顯示 `can_vote: true` |
| **創作者（Creator）** | **與上一致** — **不得** 附加 `creator_preview_counts` 或管理端點洩漏 |
| **不符合資格（Ineligible）** | 同上 collecting 殼；`can_vote: false`；`can_follow_results: true`（若已 Auth）；**仍不得** 看 aggregate |
| **訪客（Guest）** | 同上 collecting 殼；`can_vote: false`；可讀基本資訊於 `GET /polls/:id` |

**HTTP 狀態：** 建議 **200** + collecting 殼（非 404），避免前端誤以為無結果頁；終局 `cancelled`／`unpublished` 可用 200 + 終局文案或 410 — Phase 57 擇一並文件化。

**若未來需差異化文案：** 僅允許 `viewer_role` 與 **說明文字**，**不允許** 額外數字欄位。

### 4.3 與現有 Poll Core 的差異

現行 `GET /polls/:id/results` 在 collecting 已傾向 display-safe 殼；Real MVP 須 **明文化** 創作者無特權，並 **審計** 所有新路由（含「我的問卷」列表 API）不得 JOIN counters。

---

## 5. 錯誤與權限模型

### 5.1 錯誤類別（機器碼 + 使用者文案方向）

| 代碼 | 適用情境 | 使用者文案方向（繁中） |
|------|----------|------------------------|
| `not_found` | 問卷不存在或對外不可見 | 找不到這份問卷，或已不再公開。 |
| `unauthorized` | 未登入卻需 Auth | 請先登入後再試。 |
| `forbidden` | 已登入但無權限（非創作者卻 cancel 等） | 你沒有權限執行這項操作。 |
| `ineligible` | 已登入但不符合投票資格 | 你目前不符合這份問卷的投票條件。 |
| `lifecycle_conflict` | 狀態不允許此操作 | 問卷目前狀態無法進行這項操作。 |
| `validation_error` | 欄位／時間不合法 | 請檢查輸入內容後再試。 |
| `locked_period_conflict` | 鎖定期內試圖下架／修改 | 公開鎖定期間無法下架、修改或隱藏結果。 |
| `already_cancelled` | 重複取消 | 這份問卷已經取消。 |
| `already_unpublished` | 重複下架 | 這份問卷已經下架。 |
| `review_required` | 高風險題未審核（Future） | 此類問卷需先完成審核才能公開。 |

**回應形狀（高層）：**

```json
{
  "error": "lifecycle_conflict",
  "message": "問卷目前狀態無法進行這項操作。",
  "public_lifecycle_state": "locked"
}
```

避免僅回技術堆疊；`message` 給終端使用者，`error` 給程式分支。

### 5.2 權限矩陣（摘要）

| 操作 | Guest | Eligible 使用者 | Ineligible | Creator |
|------|-------|-----------------|------------|---------|
| `GET` 基本資訊 | 可 | 可 | 可 | 可（無額外數字） |
| `GET` collecting 結果 | 殼 | 殼 | 殼 | **殼（同左）** |
| 投票 | 否 | 是 | 否 | 若符合資格且未投 |
| 關注結果 | 否 | 是 | 是 | 是 |
| cancel | 否 | 否 | 否 | 是（collecting） |
| close | 否 | 否 | 否 | 規劃：排程為主；Creator 手動待 OQ |
| unpublish | 否 | 否 | 否 | 是（post_lock） |

---

## 6. 創作者與使用者動作

### 6.1 創作者

| 階段 | 可做 | 不可做 |
|------|------|--------|
| **collecting** | 分享連結、查看基本資訊、**cancel**、查看 collecting 結果殼（無數字） | 看期中票數、edit 內容、unpublish、close 若尚未到 `closes_at`（若產品禁止提前） |
| **cancelled 後** | 查看取消說明 | 投票、結果、unpublish |
| **revealed / locked** | 查看 display-safe 結果、分享 | unpublish、edit、刪除、重開投票、隱藏結果 |
| **post_lock** | 維持公開或 **unpublish** | 在未 post_lock 前 unpublish |
| **unpublished 後** | 查看下架文案 | 公開列表曝光、投票 |

### 6.2 投票者／訪客／不符合資格者

| 能力 | 說明 |
|------|------|
| 看基本資訊 | 標題、選項文字、期間、狀態標籤 |
| 投票 | 僅 Eligible + collecting + Auth |
| 關注結果 | Auth；collecting 可訂閱；**不等於** 可看收集中 aggregate |
| 不看收集中結果 | **無** 票數／百分比／排名／趨勢／進度 |
| 揭曉後讀結果 | `revealed`／`locked`／`post_lock` 之 `GET .../results` display-safe |
| 訪客 | 不投票；可讀公開欄位；關注需登入 |

---

## 7. API 不變量

與 Phase 51／52 一致（實作與測試必須覆蓋）：

1. 收集中不顯示票數、百分比、總票數、排名、趨勢、進度。  
2. 發起者收集中也不能看到中途結果（**同一 collecting 殼**）。  
3. close = 投票／統計期間結束 + aggregate 結果公開。  
4. close ≠ 鎖定期結束。  
5. 結果公開後進入公開鎖定期，MVP 暫定 5 天。  
6. 鎖定期內不能下架、刪除、修改、重新開放、隱藏結果。  
7. 鎖定期結束後，發起者可選擇下架。  
8. 收集中停止叫「取消」，不叫下架；取消不形成公開結果。  
9. 下架文案固定：「此問卷已結束公開鎖定期，並由發起者下架。」

**API 契約測試建議（Phase 56+）：** 矩陣測試 × 角色 × 狀態；快照測試 collecting JSON **無** 數字欄位；靜態分析禁止 results handler import counter repository。

---

## 8. Phase 54 前置備註（schema／migration）

下列為 API 規格 **依賴** Phase 54 必須提供的持久化能力：

| 依賴 | Phase 54 須支援 |
|------|-----------------|
| 狀態閘 | `public_lifecycle_state` 欄位 + CHECK／轉換表 |
| 權威時間 | `closes_at`、`revealed_at`、`public_lock_ends_at`、`cancelled_at`、`unpublished_at` **僅伺服器寫入** |
| close 排程 | `closes_at` 索引；可選 job 鎖 |
| unpublish 防早 | `unpublished_at` 僅當 `now() >= public_lock_ends_at` |
| feed 過濾 | 排除 `unpublished`、`cancelled`；更新 partial index |
| legacy 對照 | `polls.status` 與 `public_lifecycle_state` 同步規則（見 §9 OQ-1） |
| 交易 | collecting→revealed、post_lock→unpublished 單交易 |
| **不** 在 54 要求 | follow、notification、feedback、trust 表（58+） |

**API 假設若 54 未交付則須失敗封閉：** 不可在無 `public_lifecycle_state` 時用 `status=closed` 猜測已揭曉并返回 aggregate。

---

## 9. 開放問題

| ID | 問題 | Phase 53 立場 | 審查 |
|----|------|---------------|------|
| OQ-1 | `polls.status` vs `public_lifecycle_state` | API **只對外暴露** `public_lifecycle_state`；legacy 僅內部同步 | **54 前必決** |
| OQ-2 | `archived_at` vs `unpublished_at` | 對外下架以 `unpublished` + 固定文案為準；`archived_at` 併入或廢止 | **54 前必決** |
| OQ-3 | `revealed` 與 `locked` 分離 vs `revealed`+`lock_until` | API 建議 **分離 state**（與 demo `ui_state` 一致）；實作簡化可內部合併但回應須標正確 `public_lifecycle_state` | 54 設計評審 |
| OQ-4 | close 排程：僅 `closes_at` 自動 vs Creator 可提前 | MVP 傾向 **伺服器準時自動** + 可選 Creator 觸發（需防早揭曉） | 57 實作 |
| OQ-5 | Creator `GET results` collecting | **本文件已決：與公眾相同殼** | 56 測試鎖死 |
| OQ-6 | 高風險審核是否阻擋 publish | `POST /polls` 保留 `review_required`；54 可僅 enum | 60 前嚴格審查 |

**無法在文件安全定案者：** OQ-1、OQ-2 必須在 **Phase 54 migration PR** 經人工審查通過。

---

## 10. 相關文件

| 文件 | 用途 |
|------|------|
| [`www-project-phase-51-real-mvp-implementation-boundary-v1.md`](./www-project-phase-51-real-mvp-implementation-boundary-v1.md) | 邊界與路線 |
| [`www-project-phase-52-real-mvp-data-model-plan-v1.md`](./www-project-phase-52-real-mvp-data-model-plan-v1.md) | 實體與狀態 |
| [`www-project-phase-39-poll-lifecycle-policy-v1.md`](./www-project-phase-39-poll-lifecycle-policy-v1.md) | 政策 |
| [`www-project-phase-40-user-profile-eligibility-follow-policy-v1.md`](./www-project-phase-40-user-profile-eligibility-follow-policy-v1.md) | 資格／追蹤 |
| `docs/admin-correction-http.md` | 營運治理 API（與公開 lifecycle 正交） |

---

## 11. Phase 53 自我稽核

| 檢查項 | 結果 |
|--------|------|
| 僅文件 + README／交接連結 | ✅ |
| 未 stage `design-drafts/` | ✅ |
| 未改 schema／migration／API 程式 | ✅ |
| 未宣稱 Real MVP API／持久化已存在 | ✅ |
| 繁體中文、與 Phase 51–52 一致 | ✅ |

---

*Phase 53 — API／規格規劃 v1。下一建議步驟：Phase 54 schema／migration 實作（高風險，嚴格審查）。*

**Phase 54 實作註記：** schema foundation 已由 [`www-project-phase-54-public-lifecycle-schema-foundation-v1.md`](./www-project-phase-54-public-lifecycle-schema-foundation-v1.md) 交付。Phase 54 未實作本文件任何 public lifecycle 路由；後續 API 必須只對外暴露 `public_lifecycle_state`，且 collecting 路徑不得 JOIN 或讀取 `poll_option_vote_counters`。

**Phase 55D 文件註記：** lifecycle write／transition 邊界已拆至 [`www-project-phase-55d-lifecycle-transition-api-boundary-plan-v1.md`](./www-project-phase-55d-lifecycle-transition-api-boundary-plan-v1.md)。沿用既有路線圖，Phase 56 保留 eligibility／collecting 隱私護欄，Phase 57 再實作 lifecycle transition service 與最小安全 route adapters。
