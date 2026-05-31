# Phase 20 — Correction / Admin Governance 測試與文件總整理

**文件路徑：** `docs/www-project-phase-20-correction-admin-governance-handoff-v1.md`  
**性質：** 現況索引與 handoff（非 normative；規範見 `/AGENTS.md`、`docs/www-project-agent-spec-v0.1.md`）  
**Baseline commit：** `3d087dd` — `test: harden admin review payload privacy`  
**用途：** 進入**前台管理 UI**或**建立問卷 UI**前，快速對齊 Phase 8–19 已完成的安全邊界與驗證命令。

詳細 API／DTO／部署步驟請見下方「文件地圖」，本文件不重複全文。

---

## 1. Phase 8–19 已完成什麼？

| Phase | 交付摘要 |
|-------|-----------|
| **8** | `GET /polls/:pollId/public-notices` — 僅可見、allowlist 的公開更正公告讀取 |
| **9** | `GET /admin/correction-audit` — 安全、跨 poll 的校正稽核佇列（無 Spread Score 排序） |
| **10** | PG 整合測試覆蓋 Phase 8/9 讀取面（`admin-audit-http.pg.test.ts` 等） |
| **11** | `/results/:pollId` 顯示 poll-scoped 公開更正公告（失敗／空清單不擋結果頁） |
| **12** | Admin Auth / RBAC v1：`Authorization: Bearer` + `ADMIN_AUTH_CREDENTIALS_JSON` |
| **13** | Admin auth 測試覆蓋加強（401/403、legacy header 拒絕） |
| **14** | 文件：`ADMIN_AUTH_CREDENTIALS_JSON` 部署與煙霧檢查 → Phase 14 doc |
| **15** | 文件：本機 `www_test` + `DATABASE_URL` 整合測試流程 → Phase 15 doc |
| **16** | 本機 PG 整合測試實跑通過；`admin-audit-http` fixture 修正 |
| **17** | `npm run test:integration:local` — Docker `www_test` + migrate + 整合測試一鍵 |
| **18** | `npm run smoke:admin:local` — 本機 admin Bearer／RBAC 煙霧（假 token，僅本機） |
| **19** | Admin review 回應 payload 隱私測試加強（無 peer decision／admin ID 外洩） |

**仍屬後端治理、非完整產品：** 無 admin 登入 UI、無 JWT/OAuth、無 token 輪替 UI、無真實 Spread Score 計算。

---

## 2. 受保護的 Admin 路由（現況）

皆需 `Authorization: Bearer <opaque-token>`；`X-Admin-User-Id` / `X-User-Id` **不可**代替身分。

| 權限 | 路由 |
|------|------|
| `correction:read` | `GET …/review-context`、`GET …/audit-record`、`GET /admin/polls/:pollId/correction-audit`、`GET /admin/correction-audit` |
| `correction:write` | `POST /admin/correction-requests`、`POST /admin/suspended-correction-requests`、`POST …/decisions`、`POST …/apply`（含 suspended apply） |

路由表與 DTO allowlist：`docs/admin-correction-http.md`  
Production 憑證設定：`docs/www-project-phase-14-admin-auth-deployment-v1.md`

---

## 3. 公開公告（Public notice）現況

| 面向 | 行為 |
|------|------|
| **寫入** | 僅 **suspended 路徑成功 apply** 時建立固定模板 `public_notices` |
| **讀取** | `GET /polls/:pollId/public-notices` — 僅公開可讀 poll、allowlist 欄位 |
| **顯示** | Phase 11：`/results/:pollId` 載入上述 API；空／失敗不阻擋結果顯示 |
| **未做** | 全域公告 feed、通知中心、個人化、未讀狀態 |

---

## 4. 隱私與完整性邊界（進下一階段前必記）

- **無 durable user-option linkage** — 禁止持久化 `user/session/device/request + poll + option` 關聯（含日誌／metrics）。
- **Official Vote** — 僅 aggregate sharded counter + vote token；不向公開 API 暴露 raw counter／shard／token。
- **Reference Answer** — Design B：後端不持久化選項；前端僅 runtime memory。
- **Admin 讀取** — `review-context` / audit 不回傳 admin ID、peer decisions、Spread Score、vote 資料。
- **Ranking** — 公開 feed 僅 freshness；**未**用選項百分比、投票成長、答案方向或 Spread Score 做排序。
- **Spread Score** — stub（恆 `requires_dual_admin`）；**無** Spread Score 排名／優先佇列。

違反以上需明確 Phase 與規範核准，不可順手「方便」擴充。

---

## 5. 本機驗證命令（建議順序）

| 命令 | 需要 DB？ | 驗證什麼 |
|------|-----------|----------|
| `npm run typecheck` | 否 | TypeScript 型別 |
| `npm run build` | 否 | 編譯產物 |
| `npm test` | 否 | 單元／HTTP 契約（含 admin auth、review payload 隱私）；約 **229** 測試級 |
| `npm run test:integration:local` | 是（Docker `www_test`） | 啟動/沿用本機 Postgres → migrate → **10** 個 `*.pg.test.ts`；強制庫名 `www_test` |
| `npm run smoke:admin:local` | 是 | 本機 admin Bearer、read/write 權限、基本 admin 路由煙霧（**假 token**，勿用於 production） |

手動等同流程（見 Phase 15）：設定 `DATABASE_URL` → `npm run migrate` → `npm run test:integration`。

`npm run migrate:check` — 僅驗證 migration 檔案，不需 DB。

---

## 6. 文件地圖（勿在此重複全文）

| 主題 | 文件 |
|------|------|
| Admin HTTP / DTO / stubs | `docs/admin-correction-http.md` |
| Admin Auth 部署 | `docs/www-project-phase-14-admin-auth-deployment-v1.md` |
| PG 整合測試設定 | `docs/www-project-phase-15-pg-integration-test-setup-v1.md` |
| Admin Auth 里程碑 | `docs/www-project-milestone-phase-12-handoff-v1.md` |
| 專案命令總覽 | `README.md` |
| 問卷生命週期政策（Phase 39，僅文件） | `docs/www-project-phase-39-poll-lifecycle-policy-v1.md` |
| 使用者資格／追蹤結果政策（Phase 40，僅文件） | `docs/www-project-phase-40-user-profile-eligibility-follow-policy-v1.md` |

---

## 7. 尚未實作（TODO）

- 真實 **admin 登入 UI** / session / **JWT** / **OAuth**
- **Token 輪替**與營運憑證管理 UI
- **Production** 環境完整設定（`DATABASE_URL`、`ADMIN_AUTH_CREDENTIALS_JSON` 等）
- 真實 **Spread Score** 計算與 24h pre-apply guard（ranking／priority **仍禁止**）
- **前台 admin UI**（校正流程操作介面）
- **建立／編輯問卷 UI**（creator 發佈後仍 zero-edit）
- **Moderation / rate-limit** 硬化
- **Deployment** 管線與營運 runbook（超出本 repo 文件範圍部分）

---

## 8. 警告（下一產品 Phase 前）

1. **不要**隨意加入 ranking／答案方向訊號（含 feed、pre-vote 排序）。
2. **不要**在未開 Phase 下改 vote／result／feed 隱私契約或公開公告行為。
3. **不要**引入 durable user-option linkage（含 observability）。
4. **不要**將整合測試或 smoke 指向 **production DB**（僅 `www_test`；見 `tests/helpers/pg-integration.ts`）。
5. **不要**把真實 `DATABASE_URL`、admin token、密碼 commit 進 repo。

---

## 9. Phase 20 本身

- **僅新增本 handoff 與 README 連結** — 無 `src/`、無 migration、無 API 行為變更。
- 下一階段建議起點：先讀本文件 §4–§8，再選 **admin UI** 或 **poll create UI**，並為該 Phase 另開 handoff。

---

*Phase 20 correction / admin governance handoff v1.*
