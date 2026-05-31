# Phase 14 — Admin Auth v1 部署與驗證交接

**文件路徑：** `docs/www-project-phase-14-admin-auth-deployment-v1.md`  
**性質：** 營運／部署交接（非 normative；規範仍以 `/AGENTS.md`、`docs/www-project-agent-spec-v0.1.md` 為準）  
**適用 baseline：** `origin/master` @ `5d95813` 及之後  
**相關實作說明：** `docs/admin-correction-http.md`、`docs/www-project-milestone-phase-12-handoff-v1.md`

Phase 14 **僅補齊文件**，協助在正式環境安全設定 `ADMIN_AUTH_CREDENTIALS_JSON`，並在進行 Admin UI／JWT／OAuth 之前驗證伺服器端邊界。  
**不包含：** 登入 UI、JWT、OAuth、session 生命週期、token 輪替 UI、schema 變更。

---

## 1. `ADMIN_AUTH_CREDENTIALS_JSON` 是什麼？

正式環境啟動 `createApp()`（`src/app.ts`）時**必須**設定此環境變數。內容為 **JSON 陣列**，描述「不透明 Bearer token 的 SHA-256 摘要 → 管理員 UUID → 權限」的**靜態登錄表**。

- 應用程式**只保存摘要**，不保存明文 token。
- 請求時客戶端送 `Authorization: Bearer <opaque-token>`；伺服器比對摘要後解析 `admin_user_id` 與 `permissions`。
- **不接受**客戶端自行宣告管理員身分（含 legacy `X-Admin-User-Id`、公開 `X-User-Id`）。
- v1 **沒有**登入頁、session cookie、JWT、OAuth 或自動輪替；外洩時需**手動**換 token 並更新環境變數後重啟程序。

實作：`src/http/admin-auth.ts`（`createAdminAuthFromEnv`、`sha256AdminToken`）。

---

## 2. 安全範例形狀（僅占位符）

下列 token 與摘要**僅供格式參考**，不可當成正式憑證。明文範例 token 字串為 `EXAMPLE-OPAQUE-TOKEN-DO-NOT-USE`（請勿使用）。

```json
[
  {
    "token_sha256": "8c72b8acef1c0e03593fbea9c086db46a230217aa39c7598ce99a3538bb0ad75",
    "admin_user_id": "00000000-0000-4000-8000-000000000001",
    "role": "admin",
    "permissions": ["correction:read"]
  },
  {
    "token_sha256": "1111111111111111111111111111111111111111111111111111111111111111",
    "admin_user_id": "00000000-0000-4000-8000-000000000002",
    "role": "admin",
    "permissions": ["correction:read", "correction:write"]
  }
]
```

**必填欄位（每一筆）：**

| 欄位 | 規則 |
|------|------|
| `token_sha256` | 64 字元小寫十六進位 SHA-256（UTF-8 字串輸入） |
| `admin_user_id` | UUID（須與 DB `admin_users.user_id` 一致） |
| `role` | 固定為 `"admin"` |
| `permissions` | 陣列；僅允許 `correction:read`、`correction:write` |

**啟動時會 fail closed（程序無法啟動）若：** 變數缺失／空字串、非合法 JSON、非陣列、陣列為空、欄位格式錯誤、或 **`token_sha256` 重複**。

部署時通常將整段 JSON **壓成單行** 設為環境變數（避免 shell 換行問題）。

---

## 3. 如何產生 SHA-256 摘要

1. 在應用程式**外部**產生高熵不透明 token（例如 `openssl rand -hex 32` 或密碼管理器產生的長隨機字串）。
2. 對 token 做 **UTF-8** SHA-256，輸出 **小寫 hex**（64 字元）。
3. 將摘要寫入 `token_sha256`；**明文 token 只交給營運保管**（密鑰管理／密碼庫），不要寫進 repo 或設定檔版本庫。

**Node 一行指令（僅在受信任的本機終端執行；勿把 token 寫進 shell history 腳本並提交）：**

```bash
node -e "const {createHash}=require('node:crypto'); const t=process.argv[1]; if(!t){console.error('usage: node -e \"...\" <opaque-token>'); process.exit(1);} console.log(createHash('sha256').update(t,'utf8').digest('hex'));" "YOUR_OPAQUE_TOKEN_HERE"
```

與程式碼一致之匯出函式：`sha256AdminToken()`（`src/http/admin-auth.ts`）。

---

## 4. 建議權限組合

| 角色 | `permissions` | 可使用的路由類型 |
|------|----------------|------------------|
| 唯讀管理員 | `["correction:read"]` | `GET` 審查脈絡、稽核紀錄、poll 稽核列表、全域稽核佇列 |
| 校正操作員／完整管理員 | `["correction:read", "correction:write"]` | 上述 + 建立校正請求、送出決策、套用校正（含 suspended 路徑） |

**受保護的讀取路由（需 `correction:read`）：**

- `GET /admin/correction-requests/:id/review-context`
- `GET /admin/correction-requests/:id/audit-record`
- `GET /admin/polls/:pollId/correction-audit`
- `GET /admin/correction-audit`

**受保護的寫入路由（需 `correction:write`）：**

- `POST /admin/correction-requests`
- `POST /admin/suspended-correction-requests`
- `POST /admin/correction-requests/:id/decisions`
- `POST /admin/correction-requests/:id/apply`
- `POST /admin/suspended-correction-requests/:id/apply`

完整契約與 DTO：`docs/admin-correction-http.md`。

---

## 5. 資料庫條件（`admin_users`）

登錄表中的 `admin_user_id` 必須對應 **`admin_users` 一筆且 `status = 'active'`** 的列（migration `007_phase6b_admin_correction_foundation.sql`）。

- `user_id` 為 PK，且 **REFERENCES `users(id)`** — 需先有對應的 `users` 列。
- `role` 必須為 `'admin'`。
- `status` 為 `'active'` 或 `'revoked'`；revoked 時 `revoked_at` 不可為 NULL。

**占位 SQL 範例（請替換為真實 UUID；勿提交含真實營運 ID 的腳本）：**

```sql
-- 假設 users 列已存在
INSERT INTO admin_users (user_id, role, status)
VALUES ('00000000-0000-4000-8000-000000000001', 'admin', 'active')
ON CONFLICT (user_id) DO UPDATE SET status = 'active', revoked_at = NULL;
```

Bearer 驗證通過後，domain 層仍會查 DB；**revoked 或不存在**的 admin 列會被拒絕。

---

## 6. 預期失敗行為

| 情況 | HTTP | `error` | 典型 `message` |
|------|------|---------|----------------|
| 缺少 `Authorization` 或為空 | 401 | `ADMIN_AUTH_REQUIRED` | `Admin credentials are required` |
| Bearer 格式錯誤或 token 不在登錄表 | 401 | `ADMIN_AUTH_INVALID` | `Invalid admin credentials` |
| token 有效但缺少路由所需 permission | 403 | `ADMIN_FORBIDDEN` | `Admin permission is required` |
| token 有效且 permission 足夠，但 `admin_users` 非 active／不存在 | 403 | `ADMIN_FORBIDDEN` | `Active admin permission is required` |

回應**不得**洩漏明文 token、摘要、登錄表內容或 session 細節。  
僅送 `X-Admin-User-Id` 或 `X-User-Id`、不送 Bearer → **`401 ADMIN_AUTH_REQUIRED`**（與缺少 Bearer 相同）。

---

## 7. 部署前檢查清單

- [ ] `DATABASE_URL` 已設定且 migration 已套用（含 `admin_users`）。
- [ ] 每位營運管理員：已在 `users` + `admin_users`（`active`）建立列。
- [ ] 已為每位管理員產生**獨立**高熵 token；僅將 **SHA-256 摘要** 寫入 `ADMIN_AUTH_CREDENTIALS_JSON`。
- [ ] JSON 合法、陣列非空、無重複 `token_sha256`、UUID 與 DB 一致。
- [ ] 權限符合職責（唯讀 vs 寫入）。
- [ ] 明文 token 存放於密鑰管理；**未** commit 至 git、未寫入公開 issue／日誌。
- [ ] 確認未依賴 `X-Admin-User-Id` 作為身分（監控／腳本已改為 Bearer）。
- [ ] 計畫外洩時的手動輪替：新 token → 新摘要 → 更新 env → 重啟 → 作廢舊 token。

**同時需要：** `DATABASE_URL`（`src/db/client.ts`）、`ADMIN_AUTH_CREDENTIALS_JSON`（`createAdminAuthFromEnv`）。可選 `PORT`（預設 3000）。

---

## 8. 部署後煙霧測試（curl 風格）

將 `BASE`、`TOKEN`、`READ_TOKEN`、`ADMIN_UUID` 換成環境值。下列使用**占位**路徑；404 在已驗證 auth 下可能表示路由或資源不存在，屬預期。

```bash
# 公開健康檢查（無需 admin）
curl -sS "$BASE/health"

# 缺少 Bearer → 401 ADMIN_AUTH_REQUIRED
curl -sS -i "$BASE/admin/correction-audit"

# 錯誤 token → 401 ADMIN_AUTH_INVALID（回應內容不得含 token 字串）
curl -sS -i -H "Authorization: Bearer wrong-token" "$BASE/admin/correction-audit"

# legacy header 不可代替 Bearer
curl -sS -i -H "X-Admin-User-Id: $ADMIN_UUID" "$BASE/admin/correction-audit"

# 唯讀 token 呼叫寫入路由 → 403 ADMIN_FORBIDDEN（Admin permission is required）
curl -sS -i -X POST -H "Authorization: Bearer $READ_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"poll_id":"00000000-0000-4000-8000-000000000099","correction_target_field":"title","proposed_text":"x","reason":"smoke"}' \
  "$BASE/admin/correction-requests"

# 具 correction:read 的 token 呼叫讀取路由 → 應為 200（可能為空列表）或 4xx 業務錯誤，但非 401/403 auth
curl -sS -i -H "Authorization: Bearer $TOKEN" "$BASE/admin/correction-audit?limit=1"
```

若 revocable 測試帳號存在，可將該 `admin_users.status` 設為 `revoked` 後再以對應 Bearer 呼叫寫入路由，預期 **`403 ADMIN_FORBIDDEN`**，`message` 為 `Active admin permission is required`。

---

## 9. 安全提醒

- **切勿**將真實 opaque token 或完整 `ADMIN_AUTH_CREDENTIALS_JSON` commit 進 repo。
- **切勿**在日誌、APM、錯誤回報、analytics 中記錄 Bearer token、摘要與使用者選項的關聯。
- Token 外洩：立即作廢、產生新 token、更新 env 摘要、重啟；v1 無自動撤銷 UI。
- **`X-Admin-User-Id` 不是身分**；僅 `Authorization: Bearer` 有效。
- 本文件與 Phase 14 **不變更**投票、結果、feed、ranking、公開公告行為，亦不引入 durable user-option linkage。

---

## 10. 與後續 Phase 的邊界

仍屬 Phase 12 範圍外、後續才實作：

- Admin 登入 UI、session 生命週期、JWT／OAuth、token 輪替 UI
- 自動密鑰發放與撤銷儲存

Phase 14 目標：讓現有 **Admin Auth v1** 在 production 可安全設定與驗證，再進行 UI／session 工作。

---

*Phase 14 Admin Auth deployment handoff v1 — documentation only.*
