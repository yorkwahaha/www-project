# WWW Project — 本機公開 MVP Demo 啟動交接（v1）

**用途：** 在本機最快啟動公開 MVP（建立問卷 → 分享連結 → 投票 → 看結果），給自己展示或交給同事試用。

**不適用：** 正式環境部署、production 資料庫、對外上線設定。

規範依據：`AGENTS.md` v0.2。展示腳本與邊界見 [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md)。

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

## C. 建議啟動流程（最短可展示路徑）

### 1. 確認 git 狀態（選做）

```bash
git status --short
```

有未提交變更時，先確認是否仍要以此狀態展示。

### 2. 啟動或確認 PostgreSQL 測試容器

```bash
docker compose -f docker-compose.test.yml up -d --wait
```

容器名通常為 `wwwproject-postgres-1`。煙霧／整合腳本也會自動 `up -d`，但手動 demo 建議先確認容器 healthy。

### 3. 在目前 shell 設定 `DATABASE_URL`（僅本次工作階段）

**PowerShell：**

```powershell
$env:DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5432/www_test"
```

**bash / zsh：**

```bash
export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/www_test"
```

不要使用 production 主機名或非 `www_test` 的庫名。

### 4. 套用資料庫結構

```bash
npm run migrate:check
npm run migrate
```

### 5. 建置與快速驗證（發 demo 前建議全跑）

```bash
npm run typecheck
npm run build
npm test
npm run smoke:public:local
npm run smoke:admin:local
npm run test:integration:local
```

`npm test` 不需資料庫；後三項會使用 Docker `www_test`（與步驟 2 相同隔離庫）。

### 6. 啟動 HTTP 服務

```bash
npm start
```

預設監聽 **port 3000**（可用 `PORT` 環境變數覆寫，僅本機）。終端應出現類似 `listening on port 3000`。

### 7. 瀏覽器打開首頁

開啟：`http://127.0.0.1:3000/`（若改了 `PORT` 請改用對應埠號）。

### 8. 走 demo 流程

依 [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) **§B**：

`/` → `/polls/new` → 複製投票連結 → 投票 → `/results/:pollId` → 可選 `/explore` 說明尚無列表。

逐步檢查項見 [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md)。

---

## D. 常用驗證命令（摘要）

| 命令 | 需要 DB？ | 說明 |
|------|-----------|------|
| `npm run typecheck` | 否 | TypeScript 檢查 |
| `npm run build` | 否 | 編譯到 `dist/` |
| `npm test` | 否 | 單元／HTTP 測試 |
| `npm run smoke:public:local` | 是（`www_test`） | 公開路由與 JSON 安全煙霧 |
| `npm run smoke:admin:local` | 是（`www_test`） | 管理 API 邊界煙霧（假 token） |
| `npm run test:integration:local` | 是（`www_test`） | PG 整合測試 |

更完整的 PG 測試說明：`docs/www-project-phase-15-pg-integration-test-setup-v1.md`。

---

## E. 常見問題（簡短排查）

| 狀況 | 可能原因 | 建議處理 |
|------|----------|----------|
| `DATABASE_URL` / 連線錯誤 | 未在**同一個** shell 設定，或指到錯誤 DB | 重設為 `127.0.0.1:5432/www_test` 後重跑 migrate |
| `ECONNREFUSED` 5432 | Postgres 容器未跑 | `docker compose -f docker-compose.test.yml up -d --wait` |
| `npm start` 立刻退出或無法連線 | port 被占用 | 換 `$env:PORT=3001`（PowerShell）或 `PORT=3001 npm start` |
| migrate 失敗 | 結構未套用或連到錯庫 | 確認 `DATABASE_URL` 庫名為 `www_test`，再跑 `migrate:check` + `migrate` |
| `smoke:public:local` 失敗 | 路由／建置／DB 狀態 | 先看終端第一個 `FAIL`；常見為未 `npm run build` 或 DB 未就緒 |
| 複製連結沒反應 | 瀏覽器限制剪貼簿 | 手動選取成功區塊內的完整網址；頁面不應崩潰 |
| 整合測試拒絕執行 | DB 名稱不是 `www_test` | 勿改為 production 庫名；見 Phase 15 文件 |

**public smoke 失敗時先看：** 終端錯誤訊息 → 是否已 `npm run build` → Docker Postgres 是否 healthy → 是否誤用 production `DATABASE_URL`。

---

## F. 安全提醒

- **No production DB** — 僅 `www_test` @ `127.0.0.1`。
- **No real secrets in git** — 勿 commit `.env`、真實 token、正式 `DATABASE_URL`。
- **No real user data** — demo 用合成問卷即可；勿倒入正式使用者資料。
- **Admin smoke 為占位憑證** — `smoke:admin:local` 使用本機假 Bearer 設定，**不可**當正式 admin token。
- **公開 MVP 邊界不變** — 無登入、無真實 feed 列表 UI、無 ranking UI；`/explore` 不查 DB。

---

## 相關文件

| 文件 | 用途 |
|------|------|
| [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) | Demo 腳本與展示邊界 |
| [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) | 逐步手動 QA |
| [`www-project-phase-15-pg-integration-test-setup-v1.md`](./www-project-phase-15-pg-integration-test-setup-v1.md) | PG 整合測試細節 |
| `README.md` | 指令與 API 總覽 |
