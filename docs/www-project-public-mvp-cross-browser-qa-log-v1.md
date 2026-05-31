# WWW Project — 公開 MVP 跨瀏覽器／實機手動 QA 結果記錄（v1）

**文件用途：** 記錄在**真實瀏覽器與裝置**上走公開 MVP 流程的結果。供展示前、發版前或交接時填寫。

**不是：** 自動測試報告、production 上線驗收證明、WCAG 合規證書。

**Phase 36 基準：** `origin/master` @ `ea1c06b`（Production readiness boundary）及之後；本文件於 **2026-05-31** 更新基線與**有限實測**列。

規範依據：`AGENTS.md` v0.2。操作步驟見 [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md)；本機啟動見 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md)；對外試用前檢查見 [`www-project-production-readiness-boundary-v1.md`](./www-project-production-readiness-boundary-v1.md)。

---

## A. 文件用途（請先讀）

| 項目 | 說明 |
|------|------|
| 適用 | 實機／多瀏覽器**手動**走查：建立問卷、分享連結、投票、結果、探索 placeholder |
| 不適用 | 取代 `npm test`、`smoke:public:local`、`test:integration:local` |
| 填寫原則 | 表格有實際列與 PASS/WARN/FAIL 才算「該環境已測」；空白模板**不代表**已完成測試 |
| 與 smoke 關係 | Smoke 確認路由與公開 JSON 邊界；**不等於**真機 UI、剪貼簿、觸控、Safari 排版 |

**Phase 36 狀態摘要：**

- **已實測（有限）：** Cursor IDE 內建瀏覽器自動化（**Chromium 核心**，Windows 11），`http://127.0.0.1:3000/`，本機 `www_test` + `npm start`（假 admin 憑證僅供啟動，未 commit）。
- **未實測：** 使用者本機安裝的 **Chrome**、**Edge**、**Safari**、**iPhone**、**Android** — 標記 **BLOCKED／SKIP**，原因見 §B、§E。
- **自動驗證：** Phase 36 當日重跑 smoke／test 通過（見 §G）；**不能**取代 §B 未測之獨立瀏覽器產品。

**本文件不代表已完成 production QA**，亦**不代表** Gate 1 以上釋出條件已滿足。

---

## B. 測試環境記錄表

| 日期 | 測試者 | 裝置 | OS | 瀏覽器（版本） | 視窗寬度／方向 | 測試入口 URL | 總結果 | 備註 |
|------|--------|------|-----|----------------|----------------|--------------|--------|------|
| 2026-05-31 | Agent（Composer Phase 36） | 筆電（自動化） | Windows 11 | **Chromium（Cursor IDE Browser MCP）** | 預設視窗 + DevTools **390×844**（僅首頁抽測） | `http://127.0.0.1:3000/` | **WARN** | 主流程可走；投票送出見 §C#5–6；**不是**獨立 Chrome/Edge 安裝版 |
| — | — | — | — | **Windows — Chrome（獨立安裝）** | — | — | **BLOCKED** | Agent 環境無法操作使用者本機 Chrome |
| — | — | — | — | **Windows — Edge（獨立安裝）** | — | — | **BLOCKED** | Agent 環境無法操作使用者本機 Edge |
| — | — | — | — | **macOS — Safari** | — | — | **SKIP** | 本環境無 macOS／Safari |
| — | — | — | — | **iPhone — Safari** | — | — | **SKIP** | 本環境無 iPhone 實機 |
| — | — | — | — | **Android — Chrome** | — | — | **SKIP** | 本環境無 Android 實機 |

**總結果建議：**

- **PASS** — 必測流程（§C）皆可完成，無阻斷性問題。
- **WARN** — 可完成主流程，但有剪貼簿、排版、次要文案、本機設定等問題。
- **FAIL** — 無法建立／投票／看結果，或出現隱私／安全疑慮（§D）。

---

## C. 必測流程 checklist（Chromium 自動化列 — 2026-05-31）

對應 §B 第一列（Cursor Chromium @ `127.0.0.1:3000`）。測試問卷 poll id：`d41c84fd-57bc-4aa1-97d7-5911e6e0a9a9`（建立標題「Phase 36 跨瀏覽器 QA 測試」）。

| # | 項目 | PASS | WARN | FAIL | 備註 |
|---|------|:----:|:----:|:----:|------|
| 1 | 首頁 `GET /` — 有建立問卷、探索（尚未開放） | ☑ | ☐ | ☐ | |
| 2 | 建立問卷 `GET /polls/new` — 可送出 2–4 選項 | ☑ | ☐ | ☐ | 2 選項 |
| 3 | 成功後**複製投票連結**（或手動選取完整 URL） | ☐ | ☑ | ☐ | 未點擊剪貼簿按鈕；成功區塊有「開啟投票頁」與複製按鈕 |
| 4 | 成功後**複製結果連結**（或手動選取完整 URL） | ☐ | ☑ | ☐ | 同上 |
| 5 | 投票頁 `GET /vote/:pollId` — 可選項並送出 | ☐ | ☑ | ☐ | UI 可選項；送出顯示「目前無法送出投票」— 隨機 `X-User-Id` 未在 DB 設 `trust_level=official`（本機 `npm start` 未種子使用者）。**API 層**以 smoke 種子 voter 驗證可 201（§G） |
| 6 | 投票成功後可前往結果頁 | ☐ | ☑ | ☐ | 未在瀏覽器內完成投票；改以 `GET /results/:pollId` 驗證唯讀結果頁 |
| 7 | 公開結果頁 `GET /results/:pollId` — 唯讀統計、可去投票頁 | ☑ | ☐ | ☐ | 標題「公開結果（唯讀）」、有「前往投票頁」 |
| 8 | 探索 placeholder `GET /explore` — 說明尚無列表，**不列出問卷** | ☑ | ☐ | ☐ | |
| 9 | 錯誤 poll id — 簡短繁中錯誤，可回首頁／建立 | ☐ | ☑ | ☐ | **有效 UUID、不存在：** 繁中「找不到此問卷…」☑。**非 UUID**（`/vote/not-a-uuid`）：伺服器直接回 JSON `INVALID_POLL_ID`，瀏覽器無 HTML 友善頁（與路由層行為一致，非本 Phase 修改範圍） |
| 10 | 手機寬度簡測 **320–430px** — 主要頁不破版、可點 | ☐ | ☑ | ☐ | DevTools 390×844 僅抽測首頁載入；未逐頁完整走查 |
| 11 | 鍵盤 **Tab** 順序簡測 — 可從 skip link 走到送出 | ☐ | ☐ | ☐ | **待測**（本 Phase 未做完整 Tab 走查） |
| 12 | copy 失敗時可**手動選取**成功區塊內完整 URL，頁不崩潰 | ☐ | ☑ | ☐ | 未模擬剪貼簿拒絕；建立成功區塊有可見連結文字 |

**本機 demo 投票 UI 提示（Phase 37 更新）：** 請用 **`npm run demo:public:local`**（或手動執行 `seedLocalPublicDemoData`）再在 `127.0.0.1` 投票。`127.0.0.1` 投票頁使用固定本機 demo `X-User-Id`（見啟動文件 §D）；第二人可加 `?demoVoter=b`。若頁面像沒 CSS，確認 `public-mvp.css` 為 200（CSP 已允許 `style-src 'self'`）。

---

## D. 隱私／安全觀察項（2026-05-31 — API 抽樣 + 瀏覽器頁面）

抽樣 poll：`d41c84fd-57bc-4aa1-97d7-5911e6e0a9a9`；官方投票以種子 voter `44444444-4444-4444-8444-444444444444`（`official` trust）呼叫 API 驗證。

| 檢查項 | PASS | FAIL | 備註 |
|--------|:----:|:----:|------|
| `GET /polls/:id` 畫面／JSON **無** `option_id` | ☑ | ☐ | JSON 選項僅 `option_index` + `label` |
| `POST .../vote-by-index` 回應 **無** token / shard / `option_id` | ☑ | ☐ | HTTP 201，body 無 denylist 欄位 |
| `GET .../results` 僅 display-safe 欄位（區間化文字） | ☑ | ☐ | |
| 分享 URL **無** user / session / device / admin token 參數 | ☑ | ☐ | `/vote/<uuid>`、`/results/<uuid>` |
| `/explore` **不**列出 poll、不排序、不推薦 | ☑ | ☐ | 靜態說明頁 |
| Console **不應**出現 `option_id` 或可追溯 user-option 連結 | ☐ | ☐ | **待測**（本 Phase 未開 DevTools Console 逐項記錄） |

---

## E. 建議測試矩陣（覆蓋狀態）

| 優先 | 環境 | 建議寬度 | Phase 36 狀態 |
|------|------|----------|----------------|
| P0 | Windows — Chrome | 桌機全寬 + 390px | **BLOCKED** — 待人工 |
| P0 | Windows — Edge | 桌機全寬 | **BLOCKED** — 待人工 |
| P1 | macOS — Safari | 桌機全寬 | **SKIP** — 無環境 |
| P1 | iPad — Safari | 橫向／直向 | **SKIP** — 無環境 |
| P1 | iPhone — Safari | 直向 | **SKIP** — 無環境 |
| P2 | Android — Chrome | 直向 | **SKIP** — 無環境 |
| P2 | 桌機任意瀏覽器 | DevTools **360px** | **待測** |
| P2 | 桌機任意瀏覽器 | ≥1024px | **待測** |
| — | **Chromium（Cursor 自動化）** | 預設 + 390 抽測 | **WARN** — 見 §B/C（2026-05-31） |

---

## F. 已知限制（填表時請一併知悉）

- **尚未**做完整 WCAG 2.x 稽核。
- **尚未**完成 Windows Chrome／Edge、Safari、iPhone、Android 之**獨立產品**實機認證（Phase 36 僅完成有限 Chromium 自動化列）。
- **尚未**做 production deployment／正式網域驗收。
- **Clipboard API** 在部分瀏覽器／iframe／權限下可能失敗 → 應可手動選取完整 URL，頁面不崩潰。
- **`GET /explore`** 為 **placeholder**，不是 `GET /polls/feed` 前台，不查 DB、不列問卷。
- 公開 MVP **無** login、ranking UI、個人化推薦、admin UI。
- 本機 `npm start` **未**自動種子 `official` 投票使用者時，瀏覽器投票可能失敗（見 §C#5）。

---

## G. 自動驗證基準（非真機 UI）

以下由 CI／本機指令覆蓋，**不等於** §B 獨立 Chrome/Edge/Safari/iPhone 填表完成。

| 命令 | 用途 | Phase 36 記錄（2026-05-31） |
|------|------|---------------------------|
| `npm test` | 單元／HTTP 契約（含公開頁路由） | **267 passed** |
| `npm run smoke:public:local` | `/` → create → vote → results + `/explore` + JSON 安全 | **PASS** |
| `npm run smoke:admin:local` | Admin API 邊界（假 token） | **PASS** |
| `npm run test:integration:local` | PG 整合（`www_test`） | **24 passed** |

**說明：** Smoke 在隔離 DB 種子 `official` voter，故可完成 `vote-by-index`；與 §C 瀏覽器內「未種子使用者」之 WARN **不矛盾**。

---

## 相關文件

| 文件 | 用途 |
|------|------|
| [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) | 逐步手動步驟 |
| [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) | Demo 腳本與邊界 |
| [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) | 本機啟動 |
| [`www-project-production-readiness-boundary-v1.md`](./www-project-production-readiness-boundary-v1.md) | Demo vs production、Gate 0–3 |
| `README.md` | 指令總覽 |
