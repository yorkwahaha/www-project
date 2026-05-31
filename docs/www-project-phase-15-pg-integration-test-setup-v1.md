# Phase 15 — PostgreSQL 整合測試本機設定交接

**文件路徑：** `docs/www-project-phase-15-pg-integration-test-setup-v1.md`  
**性質：** 開發／驗證交接（非 normative）  
**適用 baseline：** `origin/master` @ `96e7cf2` 及之後  
**相關：** `README.md`、`docker-compose.test.yml`、`vitest.integration.ts`、`tests/helpers/pg-integration.ts`

Phase 10～14 多次在 CI／本機驗證時出現 **`DATABASE_URL` 未設定** 而無法執行 `npm run test:integration`。本文件說明如何在本機或測試環境**穩定、安全**地跑 PG 整合測試，**不變更**產品行為、schema 或 production 程式路徑。

---

## 1. 為什麼需要 `DATABASE_URL`？

| 指令 | 需要 DB？ | 說明 |
|------|-----------|------|
| `npm test` | **否** | 單元／HTTP 契約測試；預設不連 PostgreSQL |
| `npm run migrate:check` | **否** | 僅驗證 `migrations/*.sql` 可讀、數量正確 |
| `npm run migrate` | **是**（若要套用） | 對 `DATABASE_URL` 指向的 DB 執行 migration |
| `npm run test:integration` | **是** | 執行 `tests/integration/**/*.pg.test.ts` |

整合測試會透過 `tests/helpers/pg-integration-global-setup.ts` 在啟動前呼叫 `assertIntegrationDatabaseUrl()`：

- **未設定** `DATABASE_URL` → 印出說明後 **exit 1**（不是「測試失敗」，而是環境未就緒）。
- 設定但資料庫名稱**不是** `www_test` → **拒絕執行**（避免誤連 production 或其它共用 DB）。

實作守門：`tests/helpers/pg-integration.ts`（`REQUIRED_TEST_DATABASE = 'www_test'`）。

---

## 2. 建議環境

- **PostgreSQL 17+**（與 `docker-compose.test.yml` 映像一致）
- **隔離測試庫名稱：** `www_test`（強制；不可改為 production 庫名）
- **Node.js 20+**
- 本機已 `npm install`

---

## 3. 建立測試資料庫

### 方式 A：Docker Compose（建議）

專案已提供僅供測試的 Postgres 服務，啟動時會建立資料庫 `www_test`：

```bash
docker compose -f docker-compose.test.yml up -d
```

等待 healthy 後，預設連線字串（**僅本機測試占位，勿 commit 真實密碼**）：

```text
postgres://postgres:postgres@127.0.0.1:5432/www_test
```

### 方式 B：本機已安裝 PostgreSQL

若尚未有 `www_test`：

```bash
# 依安裝方式擇一（需有建立 DB 權限）
createdb -U postgres www_test
# 或
psql -U postgres -c "CREATE DATABASE www_test;"
```

請確認 `psql` 連線後 `\conninfo` 或 `\l` 顯示的資料庫名為 **`www_test`**，且**不是** production 使用的庫名。

---

## 4. 在「目前這個 shell」暫時設定 `DATABASE_URL`

整合測試與 `npm run migrate` 都讀取**目前 process** 的環境變數，不讀 repo 內 `.env` 檔（專案亦無需 commit 的 `.env.example`）。

**Windows PowerShell（僅當次 session）：**

```powershell
$env:DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5432/www_test"
```

**Linux / macOS bash：**

```bash
export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/www_test"
```

**單次指令前綴（bash，不污染 shell）：**

```bash
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/www_test" npm run migrate
```

關閉終端後變數即消失；**請勿**把含真實密碼的 `DATABASE_URL` 寫進 git。

---

## 5. 執行 migration 檢查與套用

```bash
# 不需 DATABASE_URL：確認 migrations/ 內 SQL 檔可讀
npm run migrate:check

# 需 DATABASE_URL：對 www_test 套用尚未執行的 migration
npm run migrate
```

各 `*.pg.test.ts` 的 `beforeAll` 也會呼叫 `applyMigrations()`（透過 `scripts/migrate.mjs`），因此即使忘記先手動 migrate，多數情況下測試仍會嘗試套用；但**首次設定**建議先手動跑一遍 `npm run migrate` 確認連線與權限正常。

---

## 6. 執行完整整合測試

在已設定 `DATABASE_URL` 且指向 **`www_test`** 的 shell 中：

```bash
npm run test:integration
```

- 設定檔：`vitest.integration.ts`
- 包含：`tests/integration/**/*.pg.test.ts`（目前約 10 個檔案）
- **序列執行**（`fileParallelism: false`、`singleFork: true`），避免共用 DB 互相干擾
- 每個測試檔案會 `TRUNCATE` 業務表（**破壞性**；僅限 `www_test`）

### 只跑單一整合測試檔

```bash
npm run test:integration -- tests/integration/official-vote.pg.test.ts
```

將路徑換成其它 `tests/integration/*.pg.test.ts` 即可。

---

## 7. 如何確認「不是 production」

整合測試內建硬性檢查（**無法**用環境變數覆寫庫名）：

1. 解析 `DATABASE_URL` 的路徑段，資料庫名**必須恰好為** `www_test`。
2. 否則拋錯：`Refusing integration tests on database "…". Use isolated database "www_test" only.`

**營運自查（建議每次跑前）：**

- [ ] 連線 host 為本機 `127.0.0.1` 或專用測試容器，而非 production 主機名。
- [ ] URL 中的資料庫名為 `www_test`。
- [ ] 未使用 production 備份還原庫、共用 staging 含真實使用者資料的庫。
- [ ] 了解測試會 **TRUNCATE** 多張業務表（見 `pg-integration.ts` 的 `BUSINESS_TABLES`）。

`npm test`（無 DB）**永遠**可跑；缺少 `DATABASE_URL` 時 **不要** 把 `test:integration` 的 exit 1 當成 Phase 程式碼 regression，應先補齊本文件流程。

---

## 8. 當 `DATABASE_URL` 未設定時

預期行為：

```text
Integration tests require DATABASE_URL (opt-in, local/manual only).
…
```

**應做：** 依 §3～§6 啟動 `www_test`、設定 `DATABASE_URL`、migrate、再跑 `npm run test:integration`。

**不應做：**

- 為了「讓 CI 綠燈」而把 production `DATABASE_URL` 指到整合測試。
- 在 repo 內新增含真實密碼的 `.env` 並 commit。
- 修改 `REQUIRED_TEST_DATABASE` 或關閉庫名檢查（會提高誤刪 production 資料的風險）。

---

## 9. 禁止事項（安全）

| 禁止 | 原因 |
|------|------|
| 對 production DB 執行 `npm run test:integration` | 測試會 TRUNCATE 業務表；庫名守門亦要求 `www_test` |
| 使用含真實使用者資料的共用庫 | 測試建立合成 UUID 使用者；不應污染真實資料 |
| 將真實 `DATABASE_URL` commit 進 git | 憑證外洩風險 |
| 在 repo 存放 production 連線字串 | 同左；僅在本機 shell 或 CI secret 設定 |

整合測試**不**驗證 `ADMIN_AUTH_CREDENTIALS_JSON`（production `createApp()` 才需要）；admin HTTP 的 PG 測試使用注入的 test registry。

---

## 10. 整合測試檔案一覽（參考）

| 檔案 | 主題（摘要） |
|------|----------------|
| `official-vote.pg.test.ts` | 正式投票 token／分片計數 |
| `reference-answer.pg.test.ts` | Reference Answer |
| `public-feed.pg.test.ts` | 公開 feed |
| `poll-visibility.pg.test.ts` | 投票可見性 |
| `correction-request.pg.test.ts` | 校正請求建立 |
| `correction-decision.pg.test.ts` | Dual-admin 決策 |
| `correction-apply.pg.test.ts` | 校正套用 |
| `suspended-correction.pg.test.ts` | Suspended 路徑 |
| `admin-correction-http.pg.test.ts` | Admin HTTP + Bearer |
| `admin-audit-http.pg.test.ts` | 稽核讀取、公開公告、全域佇列 |

---

## 11. 常見問題

**Q: `npm test` 通過，但 `npm run test:integration` 立刻結束且 exit 1？**  
A: 幾乎一定是未設定 `DATABASE_URL` 或庫名不是 `www_test`。見 §8。

**Q: `migrate` 顯示 skip 或 applied，測試仍連線失敗？**  
A: 確認 Docker 容器在跑、port `5432` 無衝突、`DATABASE_URL` 與實際帳密一致。

**Q: Phase 10 handoff 寫 integration pending？**  
A: 表示**當時環境**未跑 PG 套件；有 `www_test` 後應依本文件實跑並在 milestone 記錄中更新狀態（文件同步，非產品變更）。

---

## 12. 與產品邊界

本 Phase **僅文件**（除非另案核准）：

- 不變更 vote／result／feed／ranking／公開公告行為
- 不變更 migration schema
- 不變更 production auth
- 不引入 durable user-option linkage

---

*Phase 15 PG integration test setup v1 — documentation handoff.*
