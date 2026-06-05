# WWW Project — 公開 MVP 手動測試交接（v1）

適用範圍：公開流程 `/` → `/polls/new` → `/vote/:pollId` → `/results/:pollId`；探索邊界 `GET /explore`（公開 MVP 文件鏈 Phase 23–37）。**發起者 lifecycle 即時流程（`?live=1`／`?creator=1`）** 見 Phase 60 專文件。

規範依據：`AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`。

**建議閱讀順序：** ① [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) 本機啟動 → ② [`www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`](./www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md) **lifecycle／發起者 QA** → ③ [`www-project-phase-67-profile-eligibility-demo-qa-v1.md`](./www-project-phase-67-profile-eligibility-demo-qa-v1.md) **profile／投票資格 demo QA** → ④ [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) demo 腳本 → ⑤ 本文件訪客逐步 QA → ⑥ 實機結果填寫 [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md)。

**提醒：** `DATABASE_URL` 只在**目前 shell／工作階段**設定，不要寫進 repo 或 commit `.env`。`GET /explore`（Phase 63）消費既有 **`GET /polls/feed`**：僅列出**收集中**且可探索的問卷，依**最近發布**排序，**不**顯示票數、熱門或個人化。

**Phase 64（QA 文案）：** 預設 `/polls/new`、`/my-polls` 等多為**展示／mock**；**即時 DB** 請用 **`?live=1`**、發起者區用 **`?creator=1`**（MVP dev，非 production 登入）。首頁「範例問卷」下方卡片為**靜態範例**；真實探索列表在 **`/explore`**。

**Demo／展示（Phase 31）** 與 **本機啟動（Phase 32）** 細節見上列連結；本文件不重複完整啟動步驟。

---

## 1. 本機啟動前提

- **Node.js** 20+、已 `npm install`
- **建議：** `npm run demo:public:local`（種子本機假 official 投票者 + 啟動伺服器；見 Phase 37 啟動文件）
- 或 Phase 32 手動流程（Postgres `www_test`、migrate、**種子 demo 使用者**、`npm start`；預設 `http://127.0.0.1:3000/`）
- 勿將真實 `DATABASE_URL`、admin token 寫入版本庫
- **樣式：** 應載入 `/frontend/public-mvp.css`（淺色骨架 UI）；若像純 HTML，先確認 Network 中 CSS 為 200（Phase 37 CSP 修正）

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

全部通過後再進行下方手動流程。`smoke:public:local` 不取代瀏覽器操作，但可確認 `GET /`、`/polls/new`、`/explore`、`/vote/:pollId`、`/results/:pollId` 與 creator `POST /creator/polls`、public `vote-by-index`、公開 JSON 未洩漏 `option_id`、vote token、shard 等欄位（以煙霧內建 HTTP 檢查代替長駐 server 時可用）。

---

## 3. 手動測試流程

### 3.1 打開首頁

1. 瀏覽器開啟 `GET /`。
2. 確認有「建立問卷」入口，導覽可進入「探索問卷」(`GET /explore`)。
3. 「範例問卷」區應說明 `/explore` 為**即時** freshness-only 列表，下方卡片為**靜態範例**（可含 `/vote/demo` 等展示路由）；首頁本身**不是**可捲動的真實 feed。
4. 確認**未**出現登入、榜單／熱門排序、或個人化推薦介面。

### 3.1a 探索列表（Phase 63）

1. 開啟 `GET /explore`（需本機伺服器與 `www_test` 才有真實列表）。
2. 頁面應說明列表依**最近發布**、僅顯示**收集中**問卷，且**不**顯示票數／熱門／個人化。
3. 若有可探索問卷，卡片應連到 `/vote/<pollId>`，**不應**出現百分比、票數或 `option_id`。
4. 無問卷時應顯示空狀態；載入失敗應有繁中錯誤提示（無英文 stack）。
5. 導覽可回到 `/` 與 `/polls/new?live=1`。

### 3.2 建立問卷

1. 進入 `GET /polls/new`（**真實寫入 DB** 請用 **`/polls/new?live=1`**；無 `?live=1` 為展示用「不儲存」）。
2. 填寫標題、至少兩個選項（可用 Tab 在欄位間移動）。
3. 按「建立問卷」；送出期間按鈕應顯示忙碌狀態（例如「建立中…」）且不可重複點擊。
4. 成功後應出現投票頁／結果頁連結，以及複製連結按鈕（若瀏覽器不支援剪貼簿，應有手動複製提示，頁面不應崩潰）。`?live=1` 成功後另應有「下一步」、管理連結與發起者 lifecycle 區（Phase 59）。

### 3.3 複製投票連結／結果連結（Phase 29）

1. 建立成功後，成功區塊應顯示**完整網址**（`https://<你的網域>/vote/<pollId>` 與 `/results/<pollId>`），僅含問卷識別碼，**不含** `option_id`、token、登入或 admin 參數。
2. 按「複製投票連結」「複製結果連結」；若瀏覽器不支援剪貼簿，應出現手動複製提示，且可改選上方完整網址文字，**頁面不應崩潰**。
3. 於新分頁貼上並開啟，確認路徑分別為 `/vote/<pollId>`、`/results/<pollId>`。

### 3.4 投票

1. 以無痕或另一瀏覽器開啟投票連結（模擬第二人時，在本機可加 `?demoVoter=b`，見啟動文件 §F）。
2. 用滑鼠或鍵盤（Tab + 空白／方向鍵）選取一個選項。
3. 送出投票；送出中按鈕應忙碌且不可重複送出。
4. 成功後應看到前往結果頁的連結。

### 3.5 查看結果（公開唯讀頁，Phase 29）

1. 開啟結果頁 `/results/<pollId>`。
2. 頁面應標示為**公開結果（唯讀）**：可查看目前統計，但無法在此投票；說明區應提及**無登入、無個人化推薦、無排行榜**。
3. **收集中狀態（常見於剛投票後）：** 應看到「目前仍在收集中」說明，並註明暫不顯示票數／百分比（**不是**投票失敗）；下方仍可列出「目前公開的選項」文字標籤，**不應**出現假造的 `0 票` 或 `0%`。
4. 應有明顯「前往投票頁」連結（頁首說明區與底部導覽皆可）。
5. 若已過收集中門檻，確認顯示為**區間化／模糊化**的統計文字（非原始票數、非 `option_id`）。
6. 若修正公告 API 失敗，主要統計仍應顯示，僅公告區留白或隱藏。
7. 底部導覽可回到首頁、建立問卷。

### 3.6 測試錯誤 poll id

1. 開啟 `/vote/not-a-valid-uuid` 或 `/results/00000000-0000-0000-0000-000000000000`（不存在或不可讀的 id）。
2. 應顯示**簡短繁中**錯誤說明與返回首頁／建立問卷連結，**不**應顯示英文後端錯誤堆疊或資料庫細節。

### 3.7 公開 MVP 視覺／手機寬度簡測（Phase 28）

五個公開頁（`/`、`/polls/new`、`/vote/:pollId`、`/results/:pollId`、`/explore`）應共用 `GET /frontend/public-mvp.css`（簡潔淺色版面、最大寬度約 42rem）。

1. 開發者工具切換 **320px、375px、430px** 寬度，各走一次 3.1a、3.2–3.5（含 `/explore` 導覽不破版）。
2. 檢查項目：
   - 首頁「建立問卷」CTA 不換行破版、不超出螢幕。
   - 建立頁標題／說明／選項欄位可讀、可點，複製按鈕不造成水平捲軸。
   - 投票選項有足夠點擊區域，長文字自動換行。
   - 結果頁選項標籤與百分比不溢出。
3. 桌機寬度（≥1024px）內容仍置中、不過寬；無需 dark mode 或動畫。
4. **此為開發者工具簡測**，不等於 Safari／Firefox／實機行動裝置的完整跨瀏覽器認證；實機結果請記錄於 [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md)。

**Phase 28–32 仍不包含：** ranking／推薦演算法、登入、admin UI、分類選擇、發布後編輯、production 一鍵部署。Phase 63 已提供 **freshness-only** 探索列表（`GET /explore` → `GET /polls/feed`），仍**不是**熱門／票數／個人化 feed。

### 3.8 發起者 lifecycle 即時流程（Phase 57–59）

完整步驟、狀態表、下架前置條件與已知限制見 **[`www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`](./www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md)**。

快速 smoke（瀏覽器）：

1. `/polls/new?live=1` 建立 → 複製投票連結。
2. `/my-polls?live=1` 確認即時問卷區與相同 lifecycle 按鈕。
3. `/results/<pollId>?creator=1`：收集中無票數；「結束收集並公開結果」後主區顯示區間化統計。
4. 「取消問卷」後主區為已取消 unavailable shell（非整體失敗訊息）。

### 3.9 輔助工具（選做）

- 使用螢幕閱讀器或瀏覽器無障礙檢查：建立中／錯誤／成功訊息應能被讀出（`aria-live`／`role="status"` 等）。
- 僅鍵盤操作：從「跳到主要內容」連結開始，應能完成建立與投票主流程。

---

## 4. 本文件**不是**本 Phase 範圍

以下項目在公開 MVP 手動測試中**預期不存在或未實作**，若測到相關 UI／行為請視為缺陷或誤開 scope，而非本交接遺漏：

| 項目 | 說明 |
|------|------|
| 登入／註冊／Session／JWT／OAuth | 公開流程無使用者登入 |
| Feed／探索列表 UI | Phase 63：`GET /explore` 消費 `GET /polls/feed`（freshness-only、收集中）；無熱門／個人化／票數排序 |
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
- `docs/www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md` — **Lifecycle 手動 QA 與即時發起者交接（Phase 60）**
- `docs/www-project-local-demo-startup-v1.md` — 本機 demo 啟動（Phase 32）
- `docs/www-project-public-mvp-cross-browser-qa-log-v1.md` — 跨瀏覽器／實機 QA 結果記錄表（Phase 34）
- `docs/www-project-public-mvp-demo-release-handoff-v1.md` — Demo／release 展示與邊界交接（Phase 31）
- `docs/www-project-phase-15-pg-integration-test-setup-v1.md` — 本機 PostgreSQL 整合測試
- `AGENTS.md` — 代理與隱私紅線
