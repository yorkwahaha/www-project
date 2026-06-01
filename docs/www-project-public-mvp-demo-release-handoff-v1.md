# WWW Project — 公開 MVP Demo／Release 交接（v1）

適用基準：公開 MVP 文件鏈 Phase 23–49（分享連結、政策靜態頁、demo 生命週期預覽、本機啟動交接）。

**目前 `origin/master` 基準（Public MVP Demo）：** commit **`023cf9b`**（`fix: polish public mvp demo consistency`）。Phase 48 UI 為 **`630baea`**；Phase 49 同步 demo 狀態文件；Phase 51 定義 Real MVP 實作邊界見 [`www-project-phase-51-real-mvp-implementation-boundary-v1.md`](./www-project-phase-51-real-mvp-implementation-boundary-v1.md)（**僅規劃，未實作**）。

規範依據：`AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`。

**本文件用途：** 給同事、評審或自己「照著展示」用的交接說明。不是產品規格全文；細部手動步驟見 `docs/www-project-public-mvp-manual-qa-v1.md`。

**實作性質：** Public MVP 前台仍為 **靜態／展示導向**（HTML + 共用 CSS/JS）。真實登入、DB 生命週期、通知持久化、信任分持久化、回饋持久化、正式榜單／個人化 feed **尚未實作**（見 §H）。

---

## A. 目前可展示功能

### A.1 核心流程（需本機 DB + `npm start` 或 `npm run demo:public:local`）

| 路由 | 說明 |
|------|------|
| `GET /` | 首頁：分享連結流通、政策連結、範例卡片 |
| `GET /polls/new` | 建立問卷（2–6 選項），成功後顯示投票／結果完整網址 |
| `GET /vote/:pollId` | 真實投票頁（`POST /polls/:id/vote-by-index`） |
| `GET /results/:pollId` | 真實結果頁（display-safe JSON；依後端狀態顯示） |
| `GET /explore` | Placeholder：範例卡片連到 demo 路由；**不是** `GET /polls/feed` UI |

### A.2 政策說明頁（靜態 HTML，無需真實 poll id）

| 路由 | 說明 |
|------|------|
| `GET /faq` | 常見問題（繁中）：生命週期、資格、鎖定期、取消 vs 下架等 |
| `GET /trust-levels` | 信任等級 Lv.0–Lv.4 權限對照矩陣（草案展示） |
| `GET /my-polls` | 發起者後台 **mock**（按鈕不執行真實操作） |

### A.3 Demo 預覽路由（靜態殼，用 query 切換文案）

| 路由 | 說明 |
|------|------|
| `GET /vote/demo` | 投票頁政策殼；可搭配 `?ui_state=` |
| `GET /results/demo` | 結果頁政策殼；**必須**用 `ui_state` 看各狀態 |

建議一次展示的 `ui_state` 範例（皆可加在同一頁網址）：

- `/results/demo?ui_state=collecting` — 收集中（不顯示票數／排名／趨勢）
- `/results/demo?ui_state=revealed` — 已公開結果
- `/results/demo?ui_state=locked` — 公開鎖定期
- `/results/demo?ui_state=post_lock` — 鎖定期已結束
- `/results/demo?ui_state=cancelled` — 已取消（收集中停止）
- `/results/demo?ui_state=unpublished` — 已下架（含下架文案）

### A.4 導覽展示用 query（非真實登入）

任一支援頁（如 `/`、`/faq`、`/trust-levels`）可切換：

- `?nav=guest` — 訪客導覽
- `?nav=logged-in-mock` — 登入後導覽 mock

後端另有 JSON API（例如 `POST /polls`、`GET /polls/:id/results`），前台不直接暴露內部 `option_id`、vote token、shard 等欄位。

---

## B. Demo 腳本（約 10–15 分鐘）

**事前準備：** 依 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) 啟動（建議 `npm run demo:public:local` → `http://127.0.0.1:3000/`）。政策頁（§A.2–A.3）可不依賴 DB；真實建立／投票需 DB。

### B.1 政策與信任（靜態，約 5 分鐘）

1. **`/faq`** — 說明收集中不顯示票數、關閉 vs 鎖定期、取消 vs 下架、追蹤揭曉等。
2. **`/trust-levels`** — 展示 Lv.0–Lv.4 矩陣；強調政治／高風險無法靠點數繞過審核。
3. **`/results/demo?ui_state=collecting`** — 確認無票數、百分比、總計、排名、趨勢、進度條。
4. **依序切換** `revealed` → `locked` → `post_lock` → `cancelled` → `unpublished`（下架文案應含：「此問卷已結束公開鎖定期，並由發起者下架。」）。
5. **`?nav=guest` / `?nav=logged-in-mock`** — 在首頁或 FAQ 切換導覽 mock（非真實登入）。

### B.2 真實流程（需 DB，約 5–10 分鐘）

1. **首頁** `GET /` — 建立問卷、探索、FAQ、信任說明連結。
2. **建立問卷** `/polls/new` — 2–4 選項，成功後複製 `/vote/<pollId>`。
3. **投票** — 無痕視窗開啟投票連結並送出。
4. **結果** `/results/<pollId>` — display-safe 區間化統計（非收集中洩漏場景時）。
5. **`/explore`** — 說明無正式 feed／榜單；卡片僅連到 demo。

**展示時可強調：** 問卷靠**分享連結**流通；收集中連發起者都看不到期中結果；關閉代表統計結束並揭曉，不等於鎖定期結束。

---

## C. 驗證命令（發布或交接前建議全跑）

在專案根目錄：

```bash
git diff --check
npm run typecheck
npm run build
npm test
npm run smoke:public:local
npm run smoke:admin:local
npm run test:integration:local
```

- `npm test`：不需資料庫的單元／HTTP 測試。
- `smoke:public:local`：確認公開路由與 JSON 不洩漏敏感欄位（使用隔離 `www_test`）。
- `smoke:admin:local`：管理 API 邊界煙霧（與公開 MVP 展示可分開說明）。
- `test:integration:local`：PostgreSQL 整合測試（需 Docker 測試用 Postgres）。

全部通過後，再進行 **B. Demo 腳本** 的瀏覽器展示。

---

## D. 安全與隱私邊界（目前保持不變）

- 公開問卷詳情（`GET /polls/:id`）**不暴露** `option_id`，選項以 `option_index` + 文字標籤呈現。
- `POST /polls/:id/vote-by-index` 回應**不暴露** vote token、`shard_id`、`option_id`。
- `GET /polls/:id/results` 回傳 **display-safe** JSON（區間化顯示欄位，非原始計數列）。
- `GET /explore` 為靜態說明頁：**不查 DB、不列出 polls、不排序、不推薦**。
- 公開 MVP **沒有** login / session / JWT / OAuth 前台。
- 公開 MVP **沒有** ranking、真實 feed 列表 UI、personalization。
- 公開 MVP **沒有** admin UI（管理僅 API＋營運煙霧，需 Bearer token）。

---

## E. 目前**不是**公開 MVP 範圍

若展示或測試時期待下列能力，代表 **尚未實作** 或僅有靜態/mock，不應視為本輪缺陷：

- **DB 驅動的公開生命週期**（收集中／鎖定／下架等由後端狀態驅動前台，而非 `?ui_state=`）
- **真實登入／註冊／session**（`?nav=logged-in-mock` 僅展示用）
- **通知持久化**（追蹤揭曉 MVP 定義為站內通知；email/push 為未來）
- **信任評分持久化**、**回饋持久化**
- **正式榜單／個人化 feed**（`GET /polls/feed` 僅 API；無瀏覽器列表 UI）
- ranking／Wonder Flow／依答案方向的推薦
- admin UI
- 「略過投票直接看結果」
- 建立問卷完整分類／審核流程 UI
- 發布後編輯問卷（創作者零編輯；鎖定期內亦不可改）
- rate limit／防濫用硬化
- production 一鍵部署與正式環境設定
- admin token 輪替／憑證管理 UI

---

## G. 重要產品規則（展示與驗收對照）

| 主題 | 規則 |
|------|------|
| 收集中 | **不得**顯示票數、百分比、總計、排名、趨勢、進度；**發起者亦同** |
| 關閉 | 投票／統計期結束並**揭曉彙總結果**；**不等於**公開鎖定期結束 |
| 公開鎖定期 | MVP 草案約 **5 天**；期間不可下架、刪除、編輯、重開投票、隱藏結果 |
| 鎖定期後 | 發起者可 **下架**；下架文案：「此問卷已結束公開鎖定期，並由發起者下架。」 |
| 取消 | 收集中停止稱 **取消**，不是下架 |
| 不符合資格 | 可看基本資訊、不可投票、不可看收集中結果；可 **追蹤揭曉**（站內通知 mock） |
| 略過投票看結果 | **未來**功能 |

---

## H. 信任等級方向（靜態矩陣對照）

| 等級 | 名稱 |
|------|------|
| Lv.0 | 訪客 |
| Lv.1 | 註冊用戶 |
| Lv.2 | 可信註冊用戶 |
| Lv.3 | 高信任分用戶 |
| Lv.4 | 高信任（尚未開放） |

- 信任等級**不能**繞過政治／高風險審核。
- **功能點數**：未來可能付費換功能／曝光，**不能購買信任**。
- **信用點數**：來自品質與正向貢獻，**不能購買**。
- 高風險題目**不能**用點數或付費繞過審核。

草案全文：`docs/www-project-trust-level-policy-draft-v1.md`、`docs/www-project-public-faq-draft-v1.md`。

---

## F. 建議下一階段候選（僅列方向，本 Phase 不實作）

0. **Production readiness 邊界** — 見 [`www-project-production-readiness-boundary-v1.md`](./www-project-production-readiness-boundary-v1.md)（demo-ready vs production-ready、對外試用前檢查、Gate 0–3）。
1. **Production／本機環境交接** — 正式 `DATABASE_URL`、反向代理、靜態資源快取策略。
2. **公開 feed 隱私設計** — 若未來要做探索列表，需先定 freshness-only 與禁止答案方向訊號。
3. **Rate limit／濫用防護設計** — 投票與建立問卷的限流策略。
4. **Admin 憑證輪替交接** — 見 Phase 14 admin auth 部署文件。
5. **跨瀏覽器手動 QA** — 使用 [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md) 記錄 Chrome／Edge／Safari／手機結果（勿與 smoke 混淆）。

---

## 相關文件

| 文件 | 用途 |
|------|------|
| `docs/www-project-local-demo-startup-v1.md` | 本機啟動 demo（Docker、`DATABASE_URL`、`npm start`） |
| `docs/www-project-public-mvp-cross-browser-qa-log-v1.md` | 跨瀏覽器／實機 QA 結果記錄（模板） |
| `docs/www-project-public-mvp-manual-qa-v1.md` | 逐步手動 QA 檢查（繁中） |
| `README.md` | 指令、API 表、Public MVP 現況摘要 |
| `AGENTS.md` | 隱私與治理紅線 |
| `docs/www-project-phase-15-pg-integration-test-setup-v1.md` | 本機 PG 整合測試 |
| `docs/www-project-production-readiness-boundary-v1.md` | 正式環境就緒邊界（非已完成部署） |
| `docs/www-project-phase-39-poll-lifecycle-policy-v1.md` | 未來政策：問卷生命週期／收集中不顯示結果／關閉揭曉／鎖定期（僅文件） |
| `docs/www-project-phase-40-user-profile-eligibility-follow-policy-v1.md` | 未來政策：資格／不符合資格 UX／追蹤揭曉通知（僅文件；與 Phase 39 併讀） |
| `docs/www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md` | 規劃：Public MVP UI 如何落實 Phase 39／40（僅文件；UI-only vs API 分類） |
| `docs/www-project-public-faq-draft-v1.md` | FAQ 草案全文（與 `/faq` 靜態頁對齊） |
| `docs/www-project-trust-level-policy-draft-v1.md` | 信任等級草案（與 `/trust-levels` 對齊） |
| `docs/www-project-phase-51-real-mvp-implementation-boundary-v1.md` | Real MVP 實作邊界與 Phase 52–60 路線圖（僅規劃） |
| `docs/www-project-phase-52-real-mvp-data-model-plan-v1.md` | Real MVP 資料模型規劃（僅規劃；Phase 54 前置） |
| `docs/www-project-phase-53-public-lifecycle-api-spec-plan-v1.md` | Real MVP 公開生命週期 API／規格（僅規劃） |
