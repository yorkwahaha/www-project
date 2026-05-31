# WWW Project — 正式環境就緒邊界／部署規劃交接（v1）

**Phase 35（僅文件）** — 說明公開 MVP **可以 demo**，但**還不能**當成對外正式營運產品。本文件是**規劃邊界與檢查清單**，不是「已完成正式部署」的證明。

規範依據：`AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`。

**相關交接（請搭配閱讀）：**

| 文件 | 用途 |
|------|------|
| [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) | 可展示功能、demo 腳本、發布前驗證命令 |
| [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) | 本機 demo 啟動（**非** production 部署） |
| [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) | 手動 QA 步驟 |
| [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md) | 跨瀏覽器／實機 QA 記錄（須實測填寫） |
| [`www-project-phase-14-admin-auth-deployment-v1.md`](./www-project-phase-14-admin-auth-deployment-v1.md) | Admin Bearer 憑證正式環境設定 |
| [`www-project-phase-15-pg-integration-test-setup-v1.md`](./www-project-phase-15-pg-integration-test-setup-v1.md) | 本機 `www_test` 整合測試（勿指 production DB） |
| [`www-project-phase-39-poll-lifecycle-policy-v1.md`](./www-project-phase-39-poll-lifecycle-policy-v1.md) | 未來政策：問卷生命週期／關閉揭曉／鎖定期／取消下架（**僅文件，未實作**） |
| [`www-project-phase-40-user-profile-eligibility-follow-policy-v1.md`](./www-project-phase-40-user-profile-eligibility-follow-policy-v1.md) | 未來政策：使用者資料／投票資格／追蹤結果通知（**僅文件，未實作**；須與 Phase 39 一併滿足） |
| [`www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md`](./www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md) | 規劃：將 Phase 39／40 對應到 Public MVP UI 頁面與實作順序（**僅文件，非實作**） |

---

## 1. 目前狀態（一句話）

**公開 MVP：可 demo，不可當 production。**

- **Demo-ready（約 85–90% 公開展示面）：** 本機或受控環境下，可用瀏覽器走完「建立 → 分享連結 → 投票 → 看結果」。
- **Production-ready（約 35–45% 完整營運面）：** 尚缺環境分離、HTTPS、備份、密鑰管理、濫用防護、對外試用流程與多數營運硬化。

---

## 2. 現在可以安全 demo 的範圍

下列路由在**本機隔離庫**或**受控展示環境**下可展示；仍以**分享連結**流通，不靠公開列表或排行。

| 路由 | 說明 |
|------|------|
| `GET /` | 首頁：進入建立問卷、探索說明 |
| `GET /polls/new` | 建立問卷（2–6 選項），成功後顯示投票／結果完整網址 |
| `GET /vote/:pollId` | 投票頁（`vote-by-index`，不暴露內部 `option_id`） |
| `GET /results/:pollId` | 公開結果唯讀頁（display-safe 統計） |
| `GET /explore` | **Placeholder**：說明尚無公開列表／榜單／個人化，**不查 DB** |

**建議 demo 前驗證（專案根目錄）：**

```bash
git diff --check
npm run typecheck
npm run build
npm test
npm run smoke:public:local
npm run smoke:admin:local
npm run test:integration:local
```

展示步驟見 [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md)；本機啟動見 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md)。

---

## 3. 刻意**尚未**包含（勿誤以為已上線）

下列項目**不在**目前公開 MVP 交付範圍；若對外試用時期待這些能力，代表 scope 尚未到：

| 類別 | 說明 |
|------|------|
| Production 部署 | 無一鍵正式上線腳本、無完整 production runbook |
| 登入／Session | 無 JWT、OAuth、前台 session、使用者帳號體系 |
| Admin UI | 管理僅 API + Bearer；無瀏覽器後台介面 |
| 真實 Feed／Ranking | `GET /polls/feed` 僅 API 層 freshness-only；無列表 UI、無 Wonder Flow、無依答案方向的排序 |
| Personalization | 無個人化推薦 |
| 完整 Moderation | 無對外公開的完整審核／檢舉前台流程 |
| 憑證生命週期 | 無 admin token 自動輪替 UI；正式 token 須營運自行產生與保管 |
| 公開濫用硬化 | 無 production 級 rate limit／防刷票／防濫建問卷實作（可僅在文件中列為未來需求） |
| Spread Score 營運 | 無真實 Spread Score 計算、無以 Spread Score 排序稽核佇列 |

---

## 4. 邀請**外部**使用者試用前，建議先具備

以下為**規劃檢查項**（本 Phase 不實作）。全部打勾前，不建議對不特定大眾開放。

### 4.1 環境與基礎設施

- [ ] **環境分離**：development / staging / production 分開；本機 smoke 與整合測試**不得**連 production DB。
- [ ] **HTTPS 與網域**：對外僅 HTTPS；正式網域與憑證更新流程已定。
- [ ] **Production DB 計畫**：專用 Postgres、連線池、容量與擴展策略；migration 套用與凍結視窗。
- [ ] **備份與還原**：定期備份、還原演練至少一次、RPO/RTO 有書面共識。
- [ ] **Secrets 管理**：`DATABASE_URL`、`ADMIN_AUTH_CREDENTIALS_JSON` 等僅存在密鑰庫／部署平台，**不進 git**。
- [ ] **Rollback 計畫**：上一版映像／migration 回退策略（含「只回滾 app、不回滾破壞性 migration」的界線）。

### 4.2 營運與管理

- [ ] **Admin 憑證輪替計畫**：見 Phase 14；假 placeholder **不是**正式憑證；明文 token 僅營運保管，registry 只存 SHA-256。
- [ ] **Logging 政策**：日誌／指標／APM **不得**記錄可還原「誰選了哪個選項」的 durable linkage（見 `AGENTS.md` Raw Option Linkage Ban）。
- [ ] **Abuse／Rate limit 計畫**：建立問卷、投票、管理 API 的限流與封鎖策略（可先文件設計，再分 Phase 實作）。

### 4.3 產品與品質

- [ ] **隱私檢視**：確認公開 API／頁面仍不暴露 `option_id`、vote token、shard；無新增 ranking／personalization 訊號。
- [ ] **手動跨瀏覽器 QA 完成**：使用 [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md) 填寫實機結果；`smoke:public:local` **不能**取代瀏覽器矩陣測試。（Phase 36 已更新基線與有限 Chromium 列；**Windows Chrome／Edge、Safari、手機仍待測**。）
- [ ] **對外試用範圍說明**：參與者知道這是試用、資料可能重置、無登入與無完整 moderation。

---

## 5. 環境安全邊界（必守）

| 規則 | 說明 |
|------|------|
| 本機 smoke／整合測試 | 僅 `127.0.0.1:5432` / 資料庫名 **`www_test`**（見 `scripts/local-test-pg.mjs`、Phase 15） |
| 勿用 production DB 跑本機煙霧 | `smoke:public:local`、`smoke:admin:local`、`test:integration:local` 內建拒絕非 `www_test` |
| `DATABASE_URL` | 只在**目前 shell 工作階段**設定；勿 commit `.env`、勿寫入 repo |
| 勿 commit 真實密鑰 | 含 admin Bearer 明文、正式 DB 密碼、第三方 API key |
| 勿倒入真實使用者資料 | Demo／試用應使用合成或脫敏資料 |
| Docker 測試容器 | 本機 helper 預設**不停止**容器，以利重跑；與 production 無關 |

占位連線（僅本機 shell 暫用範例，**勿寫入版本庫**）：

```text
postgres://postgres:postgres@127.0.0.1:5432/www_test
```

---

## 6. Admin Auth 就緒提醒

- 正式環境必須設定 `ADMIN_AUTH_CREDENTIALS_JSON`（SHA-256 摘要 registry），細節見 [`www-project-phase-14-admin-auth-deployment-v1.md`](./www-project-phase-14-admin-auth-deployment-v1.md)。
- `npm run smoke:admin:local` 使用**本機假憑證**，僅驗證 HTTP 邊界，**不可**複製到 production。
- 外洩或人員異動時：產生新 token → 更新 registry → 重啟程序；v1 **無**自動輪替 UI。
- Legacy `X-Admin-User-Id` **不能**作為管理員身分。

---

## 7. 隱私與完整性邊界（對外試用時仍須保持）

以下為 `AGENTS.md` 與 agent spec 的**非協商**紅線；任何 production 工作不得削弱：

1. **不得**建立 durable「使用者 ↔ 選項」連結（含日誌、指標、APM、備份、分析）。
2. **不得**在公開問卷詳情暴露 `option_id`；公開投票路徑使用 `option_index` + server-side 映射。
3. **不得**在未另做隱私設計的情況下，加入依答案方向、選項占比、票數成長的 **pre-vote ranking** 或 **personalization**。
4. **不得**讓 Lv1 Reference Answer 計入官方結果、熱度或排行榜。
5. Official Vote 仍須維持 token + sharded counter 的**同一交易**語意（變更須另開高風險 Phase）。

本文件**不**證明上述項目已在 production 環境審計通過；只聲明**產品設計邊界**在 MVP 程式碼中仍應保持。

---

## 8. 建議釋出關卡（簡化、非技術）

用於和利害關係人對齊「現在可以開到哪裡」，不是 CI gate 名稱。

| 關卡 | 名稱 | 誰可以進來 | 最低期望 |
|------|------|------------|----------|
| **Gate 0** | 僅 demo | 自己、內部同事、評審 | 本機或受控環境 + demo 腳本 + 驗證命令全過 |
| **Gate 1** | 私人可信試用 | 少數受邀、可聯絡到的人 | Gate 0 + HTTPS（若遠端）+ 試用說明 + 基本 logging 政策草案 |
| **Gate 2** | 有限公開 beta | 小規模外部，可接受重置 | Gate 1 + production DB／備份／secrets／admin 真憑證 + 跨瀏覽器 QA 有填表 + abuse 計畫草案 |
| **Gate 3** | 較廣公開 | 不特定大眾 | Gate 2 全項落地 + rate limit 等硬化實作 + rollback 演練 + 隱私／營運書面簽核 |

**目前建議位置：Gate 0（demo-only）。** 未到 Gate 2 前，請勿宣傳為「正式上線產品」。

---

## 9. Phase 35 之後建議的下一階段（僅方向）

本 Phase **不實作**下列項目；供排程參考：

1. **跨瀏覽器 QA 實測填表** — 完成 [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md) 中的 Chrome／Edge／Safari／手機矩陣。
2. **Production 環境檢查清單實作化** — 將 §4 拆成可勾選的 runbook（仍可不寫自動化部署）。
3. **Rate limit／濫用防護設計** — 投票、建 poll、admin API；先文件後程式。
4. **私人試用者 demo 計畫** — 邀請名單、回饋管道、資料重置政策、已知限制說明稿。

高風險項目（schema、auth 行為變更、vote／result 隱私、ranking）應**另開 Phase**，勿與本文件混在同一 patch。

---

## 10. 免責與文件性質

- 本文件是 **Production Readiness Boundary（規劃邊界）**，不是部署完成報告。
- 通過本機 `npm test` / smoke **不代表**已可對公網開放。
- 未列出的營運需求（監控告警、SLA、法遵等）仍須在 Gate 2–3 前由團隊補齊。

---

## 相關文件（快速索引）

| 文件 | 用途 |
|------|------|
| `README.md` | 指令、API、Public MVP 現況 |
| `AGENTS.md` | 隱私與治理紅線 |
| `docs/www-project-agent-spec-v0.1.md` | 實作規格 |
| `docs/www-project-phase-20-correction-admin-governance-handoff-v1.md` | 管理／更正治理索引 |
