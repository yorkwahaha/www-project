# WWW Project Phase 69 — MVP Demo Release Readiness & Handoff Closure v1

**狀態：** Release readiness／交接封板（**僅**文件、README、manual QA、demo handoff、copy guard；不含 schema、auth、evaluator、transaction、Reference Answer scope）。

**Baseline：** `origin/master` @ **`c5a2b07`**（Phase 65–68 已合併）。

**規範依據：** `AGENTS.md` v0.2。

**測試者建議入口：** Phase 76 auth UX closure → [`www-project-phase-76-public-demo-auth-ux-qa-closure-checkpoint-v1.md`](./www-project-phase-76-public-demo-auth-ux-qa-closure-checkpoint-v1.md)；本文件 → 依 §2 啟動 → 依 §3 操作順序 → 依 §6 checklist 勾選。細部步驟不重複於此，改指向既有專文件。

---

## 1. 目前 MVP demo 可展示範圍

### 1.1 真實本機流程（需 `www_test` + `npm run demo:public:local` 或等價啟動）

| 路由 | 說明 | Auth |
|------|------|------|
| `GET /` | 首頁；分享連結流通、政策連結、auth 狀態橫幅 | — |
| `GET /login` | 正式登入 **disabled UI shell**（說明 only；無 submit） | — |
| `GET /polls/new?live=1` | 真實建立問卷（`POST /creator/polls`） | **`creator_session`** |
| `GET /my-polls?live=1` | 發起者即時問卷管理 | **`creator_session`** |
| `GET /profile` | 投票資格欄位（出生年月、粗粒度地區） | **MVP `X-User-Id`** |
| `GET /vote/:pollId` | 真實投票（`vote-by-index`） | **MVP `X-User-Id`** |
| `GET /results/:pollId` | display-safe 結果；collecting = counter-free | — |
| `GET /results/:pollId?creator=1` | 發起者 lifecycle 面板 + refresh | UI 展示；後端 `/creator/*` 授權 |
| `GET /explore` | freshness-only 列表（`GET /polls/feed`） | — |

### 1.2 靜態／政策展示（可不依賴 DB）

| 路由 | 說明 |
|------|------|
| `GET /faq` | 繁中 FAQ（生命週期、資格、鎖定期等） |
| `GET /trust-levels` | Lv.0–Lv.4 信任等級矩陣（草案展示） |
| `GET /vote/demo`、`GET /results/demo` | 政策殼；`?ui_state=` 切換 lifecycle 文案 |
| `GET /polls/new`（無 `?live=1`） | 展示用建立頁（不寫 DB） |
| `GET /my-polls`（無 `?live=1`） | mock 發起者表（按鈕不執行真實操作） |

### 1.3 Phase 65–68 已交付、本 Phase **不變**的核心能力

- **Creator flow（65A–65C-B）：** `creator_session` cookie 授權 `/creator/*`；legacy `/polls` creator-write 已 410。
- **Profile eligibility（66A–66F）：** Official Vote evaluator 已接上；`/profile` 僅 `birth_year_month`、`residential_region`。
- **Public demo QA（67–68）：** 整合 manual QA §3.10、固定資格拒絕文案、copy guard。

---

## 2. Demo 啟動方式

**建議（唯一）：** 專案根目錄執行：

```bash
npm run demo:public:local
```

瀏覽器開啟 `http://127.0.0.1:3000/`。

此指令會：啟動 Docker `www_test`（若需要）、migrate、種子本機假 official 投票者、設定本程序專用 fake admin 憑證、監聽 port 3000。

**手動等價路徑：** 見 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md)（Phase 32）。

**注意：** `npm start` **不含** lifecycle scheduler；`revealed → locked → post_lock` 需另行執行 `npm run scheduler:lifecycle -- --limit 100`（見 §4 已知限制）。

---

## 3. 測試者操作順序

| # | 步驟 | 路由／動作 | Auth／備註 |
|---|------|------------|------------|
| 1 | 啟動 | `npm run demo:public:local` | `www_test` + demo 投票者種子 |
| 2 | 建立問卷 | `/polls/new?live=1` | **`creator_session`**（本機 local-test issuer） |
| 3 | 管理問卷 | `/my-polls?live=1` | 同上；**不是** `X-User-Id` |
| 4 | 設定 profile | `/profile` | **MVP `X-User-Id`**；**不是** creator cookie |
| 5 | 投票（合格） | `/vote/<pollId>` | `X-User-Id` + `vote-by-index` |
| 6 | 投票（不合格，進階） | 同上 + Phase 67 §9 SQL 規則 | 固定資格拒絕文案 |
| 7 | Reference Answer | API／整合測試 | **不接** profile eligibility |
| 8 | 結果（訪客） | `/results/<pollId>` | collecting → counter-free |
| 9 | 結果（發起者） | `/results/<pollId>?creator=1` | lifecycle + refresh |
| 10 | 探索 | `/explore` | freshness-only；無票數／熱門 |

**勾選表：** [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) **§3.10**。

**細部 lifecycle：** [`www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`](./www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md)。

**Profile／資格進階：** [`www-project-phase-67-profile-eligibility-demo-qa-v1.md`](./www-project-phase-67-profile-eligibility-demo-qa-v1.md)。

---

## 4. 已知限制（勿誤解為缺陷）

| 限制 | 說明 |
|------|------|
| **MVP `X-User-Id`** | 公開 vote 與 profile API 使用 demo-style header；本機 `127.0.0.1` 固定投票者 A；`?demoVoter=b` 為 B。**不是** production 登入。 |
| **Production auth later** | OAuth／session／JWT **尚未**實作；`GET /login` 為 disabled shell；`?nav=logged-in-mock` 僅導覽展示。 |
| **Scheduler 不在 `npm start`** | `npm run scheduler:lifecycle -- --limit 100` 需另行執行；無常駐 cron。 |
| **`creator_session` ≠ user auth** | 僅授權 `/creator/*` 發起者寫入；**不得**當成 profile 或投票的「已登入帳號」。 |
| **Cross-browser QA** | 需人工填寫 [`www-project-public-mvp-cross-browser-qa-log-v1.md`](./www-project-public-mvp-cross-browser-qa-log-v1.md)；smoke 不能取代。 |
| **`design-drafts/`** | 排除於 git 與交付；**勿** commit。 |

---

## 5. 不變邊界（Phase 69 封板）

| 邊界 | 狀態 |
|------|------|
| **`creator_session` 只限 `/creator/*`** | Cookie `Path=/creator`；發起者建立／lifecycle；**不是**一般使用者登入 |
| **Reference Answer 不接 profile eligibility** | Official Vote 有 evaluator；Reference Answer scope **不變** |
| **Raw Option Linkage Ban** | 公開 UI／錯誤文案不得揭露 `option_id`、`option_index`、vote token、shard |
| **Profile 欄位** | 僅 `birth_year_month`、`residential_region`（粗粒度）；**不收** gender、精確生日、地址、GPS、geocode、精準位置 |
| **Official Vote transaction order** | evaluator 在 option 解析／token 寫入／counter 增量之前；**不變** |
| **Collecting privacy** | 收集中 counter-free；發起者亦同 |
| **Feed／ranking** | `GET /polls/feed` freshness-only；無票數、熱門、個人化 |
| **Legacy creator-write** | `POST /polls` 等 legacy 路由 **410** `LEGACY_CREATOR_WRITE_RETIRED` |

---

## 6. Release readiness checklist

### 6.1 自動驗證（發布／交接前）

```bash
git diff --check
npm run typecheck
npm run build
npm test
npm run smoke:public:local
```

可選（完整 CI 等價）：

```bash
npm run smoke:admin:local
npm run test:integration:local
```

| 命令 | 覆蓋 | **不能**取代 |
|------|------|-------------|
| `npm test` | 單元／HTTP／copy guard／docs guard | 瀏覽器 RWD、lifecycle 按鈕操作 |
| `npm run smoke:public:local` | 路由 200、creator create、`vote-by-index`、JSON 隱私 | profile 表單、固定拒絕文案、creator UI |
| `npm run test:integration:local` | PG 整合（含 Reference Answer hardening） | 跨瀏覽器手動 QA |

### 6.2 人工 QA（瀏覽器）

- [ ] §3 操作順序 1–10 完成
- [ ] [`manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) §3.10 A–G 勾選
- [ ] Auth 分離：`creator_session` vs `X-User-Id` 無混淆
- [ ] 資格不符固定文案：**你目前不符合此問卷的投票資格。**
- [ ] 收集中結果頁 counter-free
- [ ] 手機可讀性（≤390px）於 `/profile`、`/vote/:id`、`/results/:id`

### 6.3 尚未測項（非本輪缺陷）

| 項目 | 說明 |
|------|------|
| Production 登入／OAuth | 規劃中；MVP 用 `X-User-Id` |
| 跨瀏覽器實機 | 見 cross-browser QA log |
| Notification 持久化 | 追蹤揭曉為站內 mock |
| Trust scoring 持久化 | 靜態矩陣展示 |
| Ranking／個人化 feed | 未實作 |
| Admin UI | 僅 API + Bearer token |
| Production 一鍵部署 | 見 production readiness boundary |

---

## 7. Auth 對照（測試者必讀）

| 機制 | 服務範圍 | 說明 |
|------|----------|------|
| **`creator_session` cookie** | `/creator/*` 寫入 | 發起者建立／lifecycle；**不是** user auth |
| **`X-User-Id` header** | 公開 vote、profile API | **MVP demo-style**；**explicit non-production**；**production user-auth wiring later** |
| **`GET /login`** | 登入說明 shell | **正式登入尚未啟用**；表單 disabled |
| **`Authorization: Bearer`** | production protected routes | Phase 72 verifier foundation；缺 verifier 時 fail-closed |
| **`?nav=logged-in-mock`** | 導覽展示 | **不是**真實登入 |

---

## 8. 相關文件索引

| 文件 | 用途 |
|------|------|
| [`www-project-phase-76-public-demo-auth-ux-qa-closure-checkpoint-v1.md`](./www-project-phase-76-public-demo-auth-ux-qa-closure-checkpoint-v1.md) | **Phase 76 auth UX demo closure（建議入口）** |
| **本文件** | Phase 69 release readiness（啟動、順序、checklist） |
| [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) | 本機啟動細節 |
| [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) | 逐步手動 QA（§3.10 整合主流程） |
| [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) | Demo 腳本、產品規則、out-of-scope |
| [`www-project-phase-68-public-demo-polish-manual-qa-closure-v1.md`](./www-project-phase-68-public-demo-polish-manual-qa-closure-v1.md) | Phase 68 封板索引 |
| [`www-project-phase-65-final-creator-auth-ownership-checkpoint-v1.md`](./www-project-phase-65-final-creator-auth-ownership-checkpoint-v1.md) | Creator auth 檢查點 |
| [`www-project-phase-66-final-profile-eligibility-checkpoint-v1.md`](./www-project-phase-66-final-profile-eligibility-checkpoint-v1.md) | Profile eligibility 檢查點 |
| [`www-project-production-readiness-boundary-v1.md`](./www-project-production-readiness-boundary-v1.md) | Demo-ready vs production-ready |

---

## 9. 變更記錄

| Phase | 內容 |
|-------|------|
| 69 | Release readiness 封板、README 索引、manual QA／handoff 指向、docs／copy guard |
