# WWW Project — 公開 MVP 跨瀏覽器／實機手動 QA 結果記錄（v1）

**文件用途：** 記錄在**真實瀏覽器與裝置**上走公開 MVP 流程的結果。供展示前、發版前或交接時填寫。

**不是：** 自動測試報告、production 上線驗收證明、WCAG 合規證書。

規範依據：`AGENTS.md` v0.2。操作步驟見 [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md)；本機啟動見 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md)。

---

## A. 文件用途（請先讀）

| 項目 | 說明 |
|------|------|
| 適用 | 實機／多瀏覽器**手動**走查：建立問卷、分享連結、投票、結果、探索 placeholder |
| 不適用 | 取代 `npm test`、`smoke:public:local`、`test:integration:local` |
| 填寫原則 | 表格有實際列與 PASS/WARN/FAIL 才算「該環境已測」；空白模板**不代表**已完成測試 |
| 與 smoke 關係 | Smoke 確認路由與公開 JSON 邊界；**不等於**真機 UI、剪貼簿、觸控、Safari 排版 |

**本文件不代表已完成 production QA**，除非下方矩陣與 checklist 有明確填寫結果。

---

## B. 測試環境記錄表（複製列填寫）

每測一種「瀏覽器 × 裝置 × 寬度」組合，新增一列。

| 日期 | 測試者 | 裝置 | OS | 瀏覽器（版本） | 視窗寬度／方向 | 測試入口 URL | 總結果 | 備註 |
|------|--------|------|-----|----------------|----------------|--------------|--------|------|
| YYYY-MM-DD | 姓名或代號 | 例：筆電／iPhone 15 | 例：Win 11 / iOS 18 | 例：Chrome 131 | 例：390×844 直向 | `http://127.0.0.1:3000/` | PASS / WARN / FAIL | |
| | | | | | | | | |

**總結果建議：**

- **PASS** — 必測流程（§C）皆可完成，無阻斷性問題。
- **WARN** — 可完成主流程，但有剪貼簿、排版、次要文案等問題。
- **FAIL** — 無法建立／投票／看結果，或出現隱私／安全疑慮（§D）。

---

## C. 必測流程 checklist（每環境一張或勾選表）

在 §B 每一列對應的環境中，逐項勾選並簡述異常。

| # | 項目 | PASS | WARN | FAIL | 備註 |
|---|------|:----:|:----:|:----:|------|
| 1 | 首頁 `GET /` — 有建立問卷、探索（尚未開放） | ☐ | ☐ | ☐ | |
| 2 | 建立問卷 `GET /polls/new` — 可送出 2–4 選項 | ☐ | ☐ | ☐ | |
| 3 | 成功後**複製投票連結**（或手動選取完整 URL） | ☐ | ☐ | ☐ | 剪貼簿失敗見 §F |
| 4 | 成功後**複製結果連結**（或手動選取完整 URL） | ☐ | ☐ | ☐ | |
| 5 | 投票頁 `GET /vote/:pollId` — 可選項並送出 | ☐ | ☐ | ☐ | 建議無痕／第二瀏覽器 |
| 6 | 投票成功後可前往結果頁 | ☐ | ☐ | ☐ | |
| 7 | 公開結果頁 `GET /results/:pollId` — 唯讀統計、可去投票頁 | ☐ | ☐ | ☐ | |
| 8 | 探索 placeholder `GET /explore` — 說明尚無列表，**不列出問卷** | ☐ | ☐ | ☐ | 不是真 feed |
| 9 | 錯誤 poll id — 簡短繁中錯誤，可回首頁／建立 | ☐ | ☐ | ☐ | 例：`/vote/not-a-uuid` |
| 10 | 手機寬度簡測 **320–430px** — 主要頁不破版、可點 | ☐ | ☐ | ☐ | DevTools 或實機 |
| 11 | 鍵盤 **Tab** 順序簡測 — 可從 skip link 走到送出 | ☐ | ☐ | ☐ | |
| 12 | copy 失敗時可**手動選取**成功區塊內完整 URL，頁不崩潰 | ☐ | ☐ | ☐ | |

---

## D. 隱私／安全觀察項（每環境勾選）

使用開發者工具「網路」分頁時，僅觀察公開 API；勿把 token 貼進 issue。

| 檢查項 | PASS | FAIL | 備註 |
|--------|:----:|:----:|------|
| `GET /polls/:id` 畫面／JSON **無** `option_id` | ☐ | ☐ | |
| `POST .../vote-by-index` 回應 **無** token / shard / `option_id` | ☐ | ☐ | |
| `GET .../results` 僅 display-safe 欄位（區間化文字） | ☐ | ☐ | |
| 分享 URL **無** user / session / device / admin token 參數 | ☐ | ☐ | |
| `/explore` **不**列出 poll、不排序、不推薦 | ☐ | ☐ | |
| Console **不應**出現 `option_id` 或可追溯 user-option 連結 | ☐ | ☐ | |

---

## E. 建議測試矩陣（僅建議，預設未填＝未測）

以下為**建議覆蓋**，不是「已完成」聲明。請在 §B 填寫實際結果。

| 優先 | 環境 | 建議寬度 | 已測（§B 日期） |
|------|------|----------|-----------------|
| P0 | Windows — Chrome | 桌機全寬 + 390px | |
| P0 | Windows — Edge | 桌機全寬 | |
| P1 | macOS — Safari | 桌機全寬 | |
| P1 | iPad — Safari | 橫向／直向 | |
| P1 | iPhone — Safari | 直向 | |
| P2 | Android — Chrome | 直向 | |
| P2 | 桌機任意瀏覽器 | DevTools **360px** | |
| P2 | 桌機任意瀏覽器 | ≥1024px | |

---

## F. 已知限制（填表時請一併知悉）

- **尚未**做完整 WCAG 2.x 稽核。
- **尚未**做完整跨瀏覽器認證，除非 §B 矩陣已填。
- **尚未**做 production deployment／正式網域驗收。
- **Clipboard API** 在部分瀏覽器／iframe／權限下可能失敗 → 應可手動選取完整 URL，頁面不崩潰。
- **`GET /explore`** 為 **placeholder**，不是 `GET /polls/feed` 前台，不查 DB、不列問卷。
- 公開 MVP **無** login、ranking UI、個人化推薦、admin UI。

---

## G. 自動驗證基準（非真機 UI）

以下由 CI／本機指令覆蓋，**不等於** §B 實機填表完成。Phase 33 文件巡檢時，下列項目曾全數通過（以當時 `origin/master` 為準；重跑指令可更新日期）。

| 命令 | 用途 | 最近記錄（手動填） |
|------|------|-------------------|
| `npm test` | 單元／HTTP 契約（含公開頁路由） | 例：267 passed |
| `npm run smoke:public:local` | `/` → create → vote → results + `/explore` + JSON 安全 | 例：PASS |
| `npm run smoke:admin:local` | Admin API 邊界（假 token） | 例：PASS |
| `npm run test:integration:local` | PG 整合（`www_test`） | 例：24 passed |

**有限環境替代（Phase 34）：** 若僅能跑上述 smoke／test、無法實機 Chrome/Safari，請在 §B **不要**填寫未測瀏覽器為 PASS；僅在 §G 註明「自動驗證已過，真機待補」。

---

## 相關文件

| 文件 | 用途 |
|------|------|
| [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) | 逐步手動步驟 |
| [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) | Demo 腳本與邊界 |
| [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) | 本機啟動 |
| `README.md` | 指令總覽 |
