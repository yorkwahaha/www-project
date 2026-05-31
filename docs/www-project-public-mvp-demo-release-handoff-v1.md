# WWW Project — 公開 MVP Demo／Release 交接（v1）

適用基準：公開 MVP 文件鏈 Phase 23–32（分享連結、結果唯讀頁、`/explore` placeholder、本機啟動交接）；以目前 `origin/master` 為準，勿綁定特定 commit hash。

規範依據：`AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`。

**本文件用途：** 給同事、評審或自己「照著展示」用的交接說明。不是產品規格全文；細部手動步驟見 `docs/www-project-public-mvp-manual-qa-v1.md`。

---

## A. 目前可展示功能

| 路由 | 說明 |
|------|------|
| `GET /` | 首頁：說明以分享連結流通，可進入建立問卷與探索說明 |
| `GET /polls/new` | 建立問卷（2–6 個選項），成功後顯示投票／結果完整網址與複製按鈕 |
| `GET /vote/:pollId` | 投票頁：載入問卷、選一項、送出官方投票 |
| `GET /results/:pollId` | 公開結果頁（唯讀）：顯示安全的區間化統計，可前往投票頁 |
| `GET /explore` | **Placeholder**：說明探索／公開列表尚未開放，**不是**真實 feed，也不查資料庫 |

後端另有 JSON API（例如 `POST /polls`、`GET /polls/:id/results`），前台不直接暴露內部 `option_id`、vote token、shard 等欄位。

---

## B. Demo 腳本（約 5–10 分鐘）

**事前準備：** 依 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) 完成本機啟動（Docker `www_test`、shell 內 `DATABASE_URL`、`migrate`、`npm run build`、`npm start`）。建議用一般瀏覽器＋一個無痕視窗模擬「另一位投票者」。

1. **打開首頁** — 瀏覽 `http://127.0.0.1:3000/`（或你設定的 `PORT`），確認有「建立問卷」與「探索（尚未開放）」連結。
2. **前往建立問卷** — 點「建立問卷」或開啟 `/polls/new`。
3. **建立一個 2–4 選項問卷** — 填標題與至少兩個選項，按「建立問卷」，等待成功區塊出現。
4. **複製投票連結** — 在成功區塊按「複製投票連結」，或手動選取顯示的完整網址（應為 `/vote/<pollId>`，僅含問卷 id）。
5. **用投票連結投票** — 在無痕視窗貼上並開啟，選一個選項後送出；應顯示投票成功與前往結果的連結。
6. **查看公開結果** — 開啟 `/results/<pollId>`（或從投票成功頁進入），確認為唯讀統計文字（區間／約略），不是精確票數列表。
7. **打開 /explore** — 說明目前 MVP **沒有**可瀏覽的問卷列表、榜單或個人化推薦；真實 feed／排序屬未來設計，本頁不會列出任何問卷。

**展示時可強調的一句話：** 問卷主要靠**分享連結**傳給朋友，不是靠首頁列表或熱門排行。

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

若展示或測試時出現下列功能，代表 scope 外或尚未交付，不應視為本 MVP 缺陷：

- 登入／註冊
- 前台 feed 列表（`GET /polls/feed` 僅 API 層，無瀏覽器列表 UI）
- ranking／Wonder Flow／依答案方向的推薦
- personalization（個人化推薦）
- admin UI
- 建立問卷時的分類選擇 UI
- 發布後編輯問卷（創作者零編輯）
- rate limit／防濫用硬化
- production deployment 一鍵腳本與正式環境設定
- admin token 輪替／憑證管理 UI

---

## F. 建議下一階段候選（僅列方向，本 Phase 不實作）

1. **Production／本機環境交接** — 正式 `DATABASE_URL`、反向代理、靜態資源快取策略。
2. **公開 feed 隱私設計** — 若未來要做探索列表，需先定 freshness-only 與禁止答案方向訊號。
3. **Rate limit／濫用防護設計** — 投票與建立問卷的限流策略。
4. **Admin 憑證輪替交接** — 見 Phase 14 admin auth 部署文件。
5. **跨瀏覽器手動 QA** — Safari／Firefox／行動裝置實機走查。

---

## 相關文件

| 文件 | 用途 |
|------|------|
| `docs/www-project-local-demo-startup-v1.md` | 本機啟動 demo（Docker、`DATABASE_URL`、`npm start`） |
| `docs/www-project-public-mvp-manual-qa-v1.md` | 逐步手動 QA 檢查（繁中） |
| `README.md` | 指令、API 表、Public MVP 現況摘要 |
| `AGENTS.md` | 隱私與治理紅線 |
| `docs/www-project-phase-15-pg-integration-test-setup-v1.md` | 本機 PG 整合測試 |
