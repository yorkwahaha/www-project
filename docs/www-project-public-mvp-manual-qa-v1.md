# WWW Project — 公開 MVP 手動測試交接（v1）

適用範圍：公開流程 `/` → `/polls/new` → `/vote/:pollId` → `/results/:pollId`；探索邊界 `GET /explore`（Phase 23–30 基準）。

規範依據：`AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`。

**Demo／展示交接（Phase 31）：** 可展示功能摘要、5–10 分鐘 demo 腳本、發布前驗證命令與隱私邊界清單見 [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md)。

**本機啟動（Phase 32）：** Docker `www_test`、shell 內 `DATABASE_URL`、`migrate`、`npm start`、常見問題見 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md)。本文件專注**逐步手動 QA**，不重複貼完整啟動步驟。

---

## 1. 本機啟動前提

- **Node.js** 20+、已 `npm install`
- 已完成 Phase 32 啟動流程（Postgres `www_test`、migrate、`npm start`；預設 `http://127.0.0.1:3000/`）
- 勿將真實 `DATABASE_URL`、admin token 寫入版本庫

---

## 2. 建議先跑的驗證命令

```bash
git diff --check
npm run typecheck
npm run build
npm test
npm run smoke:public:local
npm run smoke:admin:local
npm run test:integration:local
```

全部通過後再進行下方手動流程。`smoke:public:local` 不取代瀏覽器操作，但可確認路由與公開 JSON 未洩漏 `option_id`、vote token、shard 等欄位。

---

## 3. 手動測試流程

### 3.1 打開首頁

1. 瀏覽器開啟 `GET /`。
2. 確認有「建立問卷」入口，導覽可進入「探索（尚未開放）」(`GET /explore`)。
3. 確認**未**出現登入、可點擊的問卷列表、或已完成的榜單／推薦介面。

### 3.1a 探索 placeholder（Phase 30）

1. 開啟 `GET /explore`。
2. 應說明目前 MVP 以**分享連結**為主（建立 → 複製投票連結 → 分享 → 查看結果）。
3. 應明確標示**沒有**公開列表、榜單排序、個人化推薦；頁面**不應**載入或列出任何問卷。
4. 導覽可回到 `/` 與 `/polls/new`。

### 3.2 建立問卷

1. 進入 `GET /polls/new`。
2. 填寫標題、至少兩個選項（可用 Tab 在欄位間移動）。
3. 按「建立問卷」；送出期間按鈕應顯示忙碌狀態（例如「建立中…」）且不可重複點擊。
4. 成功後應出現投票頁／結果頁連結，以及複製連結按鈕（若瀏覽器不支援剪貼簿，應有手動複製提示，頁面不應崩潰）。

### 3.3 複製投票連結／結果連結（Phase 29）

1. 建立成功後，成功區塊應顯示**完整網址**（`https://<你的網域>/vote/<pollId>` 與 `/results/<pollId>`），僅含問卷識別碼，**不含** `option_id`、token、登入或 admin 參數。
2. 按「複製投票連結」「複製結果連結」；若瀏覽器不支援剪貼簿，應出現手動複製提示，且可改選上方完整網址文字，**頁面不應崩潰**。
3. 於新分頁貼上並開啟，確認路徑分別為 `/vote/<pollId>`、`/results/<pollId>`。

### 3.4 投票

1. 以無痕或另一瀏覽器開啟投票連結。
2. 用滑鼠或鍵盤（Tab + 空白／方向鍵）選取一個選項。
3. 送出投票；送出中按鈕應忙碌且不可重複送出。
4. 成功後應看到前往結果頁的連結。

### 3.5 查看結果（公開唯讀頁，Phase 29）

1. 開啟結果頁 `/results/<pollId>`。
2. 頁面應標示為**公開結果（唯讀）**：可查看目前統計，但無法在此投票；說明區應提及**無登入、無個人化推薦、無排行榜**。
3. 應有明顯「前往投票頁」連結（頁首說明區與底部導覽皆可）。
4. 確認顯示為**區間化／模糊化**的統計文字（非原始票數、非 `option_id`）。
5. 若修正公告 API 失敗，主要統計仍應顯示，僅公告區留白或隱藏。
6. 底部導覽可回到首頁、建立問卷。

### 3.6 測試錯誤 poll id

1. 開啟 `/vote/not-a-valid-uuid` 或 `/results/00000000-0000-0000-0000-000000000000`（不存在或不可讀的 id）。
2. 應顯示**簡短繁中**錯誤說明與返回首頁／建立問卷連結，**不**應顯示英文後端錯誤堆疊或資料庫細節。

### 3.7 公開 MVP 視覺／手機寬度簡測（Phase 28）

四個公開頁應共用 `GET /frontend/public-mvp.css`（簡潔淺色版面、最大寬度約 42rem）。

1. 開發者工具切換 **320px、375px、430px** 寬度，各走一次 3.2–3.5。
2. 檢查項目：
   - 首頁「建立問卷」CTA 不換行破版、不超出螢幕。
   - 建立頁標題／說明／選項欄位可讀、可點，複製按鈕不造成水平捲軸。
   - 投票選項有足夠點擊區域，長文字自動換行。
   - 結果頁選項標籤與百分比不溢出。
3. 桌機寬度（≥1024px）內容仍置中、不過寬；無需 dark mode 或動畫。

**Phase 28–30 仍不包含：** 真實 feed 列表 UI、ranking／推薦演算法、登入、admin UI、分類選擇、發布後編輯。`/explore` 僅為邊界說明頁，不是 `GET /polls/feed` 的前台實作。

### 3.8 輔助工具（選做）

- 使用螢幕閱讀器或瀏覽器無障礙檢查：建立中／錯誤／成功訊息應能被讀出（`aria-live`／`role="status"` 等）。
- 僅鍵盤操作：從「跳到主要內容」連結開始，應能完成建立與投票主流程。

---

## 4. 本文件**不是**本 Phase 範圍

以下項目在公開 MVP 手動測試中**預期不存在或未實作**，若測到相關 UI／行為請視為缺陷或誤開 scope，而非本交接遺漏：

| 項目 | 說明 |
|------|------|
| 登入／註冊／Session／JWT／OAuth | 公開流程無使用者登入 |
| Feed／探索列表 UI | `GET /explore` 為 placeholder；`GET /polls/feed` 僅 API，前台不列出問卷 |
| Ranking／Wonder Flow／個人化推薦 | 禁止以答案方向訊號排序 |
| Admin UI | 管理流程僅 API + 煙霧，無公開管理介面 |
| 發布後編輯問卷 | 創作者零編輯；需刪除重發或走 Admin Typo Correction |
| 分類選擇 UI | 建立頁固定 general MVP 預設 |
| Rate limit 強化 | 本交接不包含限流／防濫用硬化 |

---

## 5. 隱私與完整性提醒（手動測試時）

- 公開頁與公開 JSON **不得**出現 `option_id`、vote token、`shard_id` 等內部欄位。
- 投票頁選項記憶僅能存在**當前頁面執行期**；不得依賴 `localStorage`／`sessionStorage`／cookie 保存選項。
- 重複投票應由後端拒絕；前端僅顯示友善訊息並引導至結果頁。

---

## 6. 相關文件

- `README.md` — 指令與 API 總覽
- `docs/www-project-local-demo-startup-v1.md` — 本機 demo 啟動（Phase 32）
- `docs/www-project-public-mvp-demo-release-handoff-v1.md` — Demo／release 展示與邊界交接（Phase 31）
- `docs/www-project-phase-15-pg-integration-test-setup-v1.md` — 本機 PostgreSQL 整合測試
- `AGENTS.md` — 代理與隱私紅線
