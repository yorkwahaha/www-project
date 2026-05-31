# WWW Project — 本機公開 MVP Demo 啟動交接（v1）

**用途：** 在本機最快啟動公開 MVP（建立問卷 → 分享連結 → 投票 → 看結果），給自己展示或交給同事試用。

**不適用：** 正式環境部署、production 資料庫、對外上線設定。對外試用前檢查見 [`www-project-production-readiness-boundary-v1.md`](./www-project-production-readiness-boundary-v1.md)。

規範依據：`AGENTS.md` v0.2。展示腳本與邊界見 [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md)。

**Phase 37：** 新增 **`npm run demo:public:local`**（種子本機假使用者 + 啟動伺服器）；修正 CSP 使 `/frontend/public-mvp.css` 可載入。

---

## A. 適用情境

| 適合 | 不適合 |
|------|--------|
| 本機瀏覽器展示公開 MVP | Production 一鍵部署 |
| 本機手動 QA（見 [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md)） | 連線正式營運資料庫 |
| 發 demo 前先跑一輪驗證命令 | 把真實密碼寫進 git |

**下一頁：** 啟動完成後依 [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) 展示，或依 manual QA 逐步檢查。

---

## B. 前提

- **Node.js 20+**、**npm** 可用（專案根目錄已 `npm install`）。
- **Docker** 可用，且能跑專案測試用 Postgres（`docker-compose.test.yml`）。
- 資料庫只用本機隔離庫：**`127.0.0.1:5432` / `www_test`**（與 `scripts/local-test-pg.mjs` 一致）。
- **不要**使用 production DB；**不要**把真實 `DATABASE_URL`、admin token、密碼 commit 進 repo。
- 可選：已 `git pull` 且工作區乾淨，避免 demo 到一半混到未提交變更。

本機占位連線字串（僅供本機 shell 暫用，勿寫入版本庫）：

```text
postgres://postgres:postgres@127.0.0.1:5432/www_test
```

---

## C. 建議啟動流程

### 方式一（推薦）：一鍵本機 demo

在專案根目錄：

```bash
npm run demo:public:local
```

腳本會（僅限 `127.0.0.1:5432/www_test`）：

1. 啟動 Docker Postgres（若尚未運行）
2. `migrate:check` + `migrate`
3. `npm run build`
4. **種子**本機假使用者（見下方「種了什麼」）
5. 監聽 **port 3000**（可用 `PORT` 覆寫）並印出網址

瀏覽器開啟：**`http://127.0.0.1:3000/`**

按 **Ctrl+C** 結束伺服器（Postgres 容器會保持運行，方便下次再開）。

### 方式二：手動 `npm start`

若你要自己控制環境變數：

1. `docker compose -f docker-compose.test.yml up -d --wait`
2. 在目前 shell 設定 `DATABASE_URL`（見上方占位字串）
3. `npm run migrate:check` && `npm run migrate`
4. **必須**先種子 demo 使用者（否則投票會失敗）：

   ```bash
   node --input-type=module -e "
   import pg from 'pg';
   import { LOCAL_TEST_DATABASE_URL } from './scripts/local-test-pg.mjs';
   import { seedLocalPublicDemoData } from './scripts/local-public-demo-fixtures.mjs';
   const c = new pg.Client({ connectionString: LOCAL_TEST_DATABASE_URL });
   await c.connect();
   await seedLocalPublicDemoData(c);
   await c.end();
   console.log('Demo users seeded.');
   "
   ```

5. 設定假 admin 憑證（僅本機，勿 commit）— 見 `scripts/local-public-demo-fixtures.mjs` 的 `localDemoAdminCredentialsJson()`，或先跑過一次 `demo:public:local` 從終端複製邏輯。
6. `npm run build` && `npm start`
7. 開啟 `http://127.0.0.1:3000/`

**注意：** 僅 `npm start` 而不種子使用者時，投票頁會顯示「目前無法送出投票」— 因官方投票需要 DB 內 `trust_level = official` 的使用者，而瀏覽器在 `127.0.0.1` 會使用固定的本機 demo `X-User-Id`（見 §F）。

---

## D. 種了什麼（本機假資料）

| 項目 | 值 | 用途 |
|------|-----|------|
| 投票者 A | `44444444-4444-4444-8444-444444444444` | `127.0.0.1` / `localhost` 投票頁預設 `X-User-Id` |
| 投票者 B | `55555555-5555-5555-8555-555555555555` | 第二瀏覽器：投票網址加 `?demoVoter=b` |
| 管理員列 | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | 僅滿足 `ADMIN_AUTH_CREDENTIALS_JSON` 啟動；**不是**正式 admin |
| Admin Bearer | `FAKE-LOCAL-READ-TOKEN-DO-NOT-USE` | **僅本機腳本環境**；勿 commit、勿用於 production |

種子腳本 **不會**清空既有問卷（只 upsert 使用者列）。`smoke:public:local` 仍會 TRUNCATE 業務表做煙霧隔離。

---

## E. 頁面樣式（CSS）

- 五個公開 HTML 頁皆連結 **`GET /frontend/public-mvp.css`**。
- 伺服器有專用路由；Phase 37 修正 **CSP**（`style-src 'self'`），否則瀏覽器會擋掉外部樣式表，看起來像「沒套 CSS 的陽春 HTML」。
- 目前 CSS 是 **功能骨架**（淺色、系統字體、約 42rem 寬），**不是**完整視覺設計；完整 UI 改版應另開專用 UI Phase。

**快速確認 CSS 有載入：** 瀏覽器開發者工具 → Network → `public-mvp.css` 應為 **200**；畫面應有淺灰綠背景與綠色 CTA，而非純白預設 Times 全寬。

---

## F. 投票與第二人

| 情境 | 作法 |
|------|------|
| 本機第一次投票 | 使用 `npm run demo:public:local` 或手動種子後 `npm start`，在 `127.0.0.1` 開投票連結 |
| 同一人重複投同一題 | 會失敗（已有 vote token）— 預期行為 |
| 模擬第二人 | 無痕視窗開啟 `…/vote/<pollId>?demoVoter=b`（需已種子投票者 B） |

---

## G. 常用驗證命令（摘要）

| 命令 | 需要 DB？ | 說明 |
|------|-----------|------|
| `npm run typecheck` | 否 | TypeScript 檢查 |
| `npm run build` | 否 | 編譯到 `dist/` |
| `npm test` | 否 | 單元／HTTP 測試 |
| `npm run smoke:public:local` | 是（`www_test`） | 公開路由與 JSON 安全煙霧 |
| `npm run smoke:admin:local` | 是（`www_test`） | 管理 API 邊界煙霧（假 token） |
| `npm run test:integration:local` | 是（`www_test`） | PG 整合測試 |
| `npm run demo:public:local` | 是（`www_test`） | **長駐** demo 伺服器；Ctrl+C 結束 |

更完整的 PG 測試說明：`docs/www-project-phase-15-pg-integration-test-setup-v1.md`。

---

## H. 常見問題（簡短排查）

| 狀況 | 可能原因 | 建議處理 |
|------|----------|----------|
| 頁面像沒 CSS | 舊版 CSP 擋樣式表；或未 pull Phase 37 | 確認 `public-mvp.css` 為 200；更新後 `npm run build` 再啟動 |
| 投票「目前無法送出投票」 | 未種子 `official` 使用者 | 改跑 `npm run demo:public:local` 或 §C 方式二種子 |
| `ADMIN_AUTH_CREDENTIALS_JSON is required` | 手動 `npm start` 未設 admin 環境變數 | 用 `demo:public:local` 或依 fixtures 設定 |
| `DATABASE_URL` / 連線錯誤 | 未在**同一個** shell 設定，或指到錯誤 DB | 重設為 `127.0.0.1:5432/www_test` 後重跑 migrate |
| `ECONNREFUSED` 5432 | Postgres 容器未跑 | `docker compose -f docker-compose.test.yml up -d --wait` |
| `npm start` port 被占用 | 3000 已有程序 | `PORT=3001` 或關閉舊程序 |
| 複製連結沒反應 | 瀏覽器限制剪貼簿 | 手動選取成功區塊內完整網址 |

---

## I. 安全提醒

- **No production DB** — 僅 `www_test` @ `127.0.0.1`。
- **No real secrets in git** — 勿 commit `.env`、真實 token、正式 `DATABASE_URL`。
- **No real user data** — demo 用合成問卷即可。
- **假 admin / 假 voter UUID** — 僅本機 demo；不可當 production 身分。
- **公開 MVP 邊界不變** — 無登入、無真實 feed 列表 UI、無 ranking UI。

---

## 相關文件

| 文件 | 用途 |
|------|------|
| [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) | Demo 腳本與展示邊界 |
| [`www-project-production-readiness-boundary-v1.md`](./www-project-production-readiness-boundary-v1.md) | Demo vs production |
| [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) | 逐步手動 QA |
| [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md) | 跨瀏覽器 QA 記錄 |
| [`www-project-phase-15-pg-integration-test-setup-v1.md`](./www-project-phase-15-pg-integration-test-setup-v1.md) | PG 整合測試 |
| `README.md` | 指令與 API 總覽 |
