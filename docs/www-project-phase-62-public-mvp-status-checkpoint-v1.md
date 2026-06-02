# WWW Project Phase 62 — Public MVP Status Checkpoint & Next-Phase Planning v1

**狀態：** 檢查點／規劃文件（**僅文件**；不含 schema、API、scheduler 部署或 frontend 行為變更）。

**Baseline：** `origin/master` @ **`4b488fa`**（Phases 57–61：lifecycle 寫入 API、前端發起者控制、scheduler foundation、文件／README 交接）。

**規範依據：** `AGENTS.md` v0.2。

**操作與 QA 入口：**

- Lifecycle 手動 QA：[`www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`](./www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md)
- 本機啟動：[`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md)
- README 現況摘要：專案根目錄 `README.md`（Public APIs、Phase 49 現況表、Minimal public flow）

---

## 1. 目前已交付（Public MVP lifecycle 切片）

| 區塊 | 狀態 |
|------|------|
| **Lifecycle 寫入 API（57）** | `POST /polls/:id/cancel`、`close`、`unpublish`；server 寫入時間戳；`public_lifecycle_state` 為權威 |
| **Scheduler foundation（58A）** | `createPublicLifecycleSchedulerService` / `advancePublicLifecycle`（`revealed→locked`、`locked→post_lock`）**已存在**；**無** cron／worker／production 部署 wiring |
| **前端發起者控制（58B–58D）** | `?live=1` / `?creator=1` 頁面；transition 後 re-fetch 結果；refresh 失敗安全文案 |
| **發起者文案（59）** | 繁中分享／管理／lifecycle 說明 |
| **文件（60–61）** | 手動 QA 交接；README 區分 demo vs live、results API lifecycle 門檻 |

---

## 2. 即時 MVP 路由（本機 `www_test` + `npm run demo:public:local`）

| 用途 | 路由 | 說明 |
|------|------|------|
| 真實建立 | `GET /polls/new?live=1` | `POST /polls`；分享 `/vote/<id>` |
| 發起者管理 | `GET /my-polls?live=1` | `sessionStorage` 最近問卷 + lifecycle 按鈕 |
| 發起者結果 | `GET /results/<id>?creator=1` | lifecycle 面板 + 成功後 re-fetch |
| 訪客投票 | `GET /vote/<id>` | `vote-by-index` |
| 訪客結果 | `GET /results/<id>` | 依 lifecycle 顯示；無 `?creator=1` 仍可能因 `sessionStorage` 顯示發起者區（58B） |
| 展示用 | `GET /polls/new`、`GET /my-polls`（無 `?live=1`） | 不寫 DB／靜態 mock 表 |

**MVP dev 開關：** `?live=1`、`?creator=1` — **非** production 登入或授權；前端顯示**不是**授權，後端 API 與 aggregate guard 為準。

---

## 3. Lifecycle 行為摘要（後端權威）

| `public_lifecycle_state` | `GET /polls/:id/results` | 公開 UI 要點 |
|--------------------------|--------------------------|--------------|
| `collecting` | counter-free shell | 無票數／百分比（含發起者） |
| `cancelled` / `unpublished` / `draft` | counter-free unavailable | 無 aggregate |
| `revealed` / `locked` / `post_lock` | display-safe aggregate | 區間化統計 |

**發起者操作（需 creator `X-User-Id`）：**

- `collecting` → **取消**（`cancel`）或 **結束收集並公開**（`close`，須達 `closes_at`）
- `post_lock`（鎖定期已過）→ **下架**（`unpublish`）

**自動推進：** 58A 服務可批次 advance；**尚未**部署定時執行 — 本機 QA 常需手動 close 或調 DB／整合測試驗證 `post_lock`。

---

## 4. 隱私保證（現況，不可在後續 Phase 弱化）

- 收集中、取消、下架、draft：**不**讀取 aggregate counters；API 回傳 counter-free shell。
- 僅 `revealed` / `locked` / `post_lock` 讀取並回傳 display-safe aggregate。
- 無 durable user–option linkage；`sessionStorage` 僅 `pollId`、lifecycle、可選 `title`（**無** `option_id`）。
- Legacy `status='closed'` 或票數門檻**不得**單獨揭曉結果。

---

## 5. 已知限制

| 限制 | 說明 |
|------|------|
| 固定本機 creator UUID | `127.0.0.1` / `localhost` → `LOCAL_DEMO_CREATOR_USER_ID` |
| 無 production auth／session | 無註冊登入、token session、真實發起者身分 |
| 資格 | `poll_eligibility_rules` schema 占位；完整年齡／地區 evaluator 與 profile **未**實作 |
| Explore／feed UI | Phase 63：`GET /explore` 為 freshness-only 列表（`GET /polls/feed`）；仍無熱門／個人化／票數排序 |
| Scheduler | Foundation only；無 cron／worker |
| `design-drafts/` | 設計稿目錄**不**納入 git |
| 跨瀏覽器／production | 見 production readiness 與 cross-browser QA log；demo-ready ≠ production-ready |

---

## 6. 建議下一階段候選（3–5 項）

依 **風險由低到高** 排列；實作前須讀 `AGENTS.md` 與 Phase 39–41／56 政策。編號為**建議代號**，非已承諾排程。

| 建議 Phase | 內容 | 風險 | 理由 |
|------------|------|------|------|
| **62+ QA / polish** | 跨瀏覽器實機 QA 填表、demo 腳本與文案收尾、production readiness checklist 勾選 | **低** | 不改契約；補交付證據 |
| **63 — Explore／feed UI（freshness-only）** | 只讀 UI 消費既有 `GET /polls/feed`；**禁止**榜單、個人化、答題方向訊號 | **中** | 觸及 ranking 敘事與產品期望；須鎖定 freshness-only 契約 |
| **64 — Scheduler deployment wiring** | 將 58A `advancePublicLifecycle` 接到 cron/worker／部署；可觀測、冪等、失敗重試 | **高** | 影響公開 lifecycle 時間語意；需與 DB 時鐘、部署邊界同審 |
| **65 — Creator auth／session** | 真實發起者身分綁定 lifecycle POST；取代固定 demo UUID 與 `?creator=1` 展示開關 | **高** | auth、session、授權與 audit；不得讓前端 query 成為唯一 gate |
| **66 — Eligibility profile + evaluator** | 使用者 profile 欄位、年齡／地區規則 UI、收集中 counter-free 對不合格者一致 | **高** | schema／migration、eligibility 規則、collecting 隱私；易與結果顯示混淆 |

**不建議與上列並行搶做的典型高風險組合：** 同時改 auth + eligibility + scheduler 部署 + 結果顯示門檻。

---

## 7. 高風險區域（須加強審查／測試）

下列變更在實作計畫階段應 **Stop & report** 或走獨立 review，並附隱私自檢：

| 區域 | 主要風險 |
|------|----------|
| **auth／session** | 發起者／投票者身分混淆；`?live=1` 誤當授權；token 外洩 |
| **DB／schema／migration** | 新增 user–option 可重建欄位；lifecycle 欄位由 client 寫入 |
| **vote／result privacy** | 收集中或 unavailable 狀態讀取 counter；raw counter 暴露給前端 |
| **eligibility rules** | 不合格者看到收集中票數；資格成為投票前排序訊號 |
| **scheduler deployment** | 重複 advance、時區／`NOW()` 漂移、未部署卻文件宣稱已自動化 |

---

## 8. 建議閱讀順序（新進／交接）

1. 本文件（檢查點）
2. [Phase 60 lifecycle QA handoff](./www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md)
3. [Phase 57 APIs](./www-project-phase-57-lifecycle-transition-write-apis-v1.md) · [58A scheduler](./www-project-phase-58a-lifecycle-scheduler-advancement-foundation-v1.md)
4. [Phase 56 eligibility guardrails](./www-project-phase-56-eligibility-collecting-privacy-guardrails-v1.md)
5. [Production readiness boundary](./www-project-production-readiness-boundary-v1.md)

---

## 9. 變更記錄

| Phase | 內容 |
|-------|------|
| 62 | 本檢查點與下一階段規劃（Phases 57–61 後） |
