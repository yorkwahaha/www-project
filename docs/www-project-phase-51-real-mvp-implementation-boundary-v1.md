# WWW Project Phase 51 — Real MVP 實作邊界規劃（v1）

**文件路徑：** `docs/www-project-phase-51-real-mvp-implementation-boundary-v1.md`  
**狀態：** 規劃／邊界文件（**僅文件**；本 Phase 不實作 DB、auth、通知、評分、治理或前台行為變更）  
**規範依據：** `AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`  
**Public MVP Demo 基準：** `origin/master` @ **`023cf9b`** — `fix: polish public mvp demo consistency`  
**前置政策（須併讀）：** Phase 39 生命週期、Phase 40 資格／追蹤、Phase 41 UI 對照規劃  

**本文件用途：** 定義從目前 **Public MVP 靜態／展示版** 走向 **Real MVP（持久化資料與真實使用者流程）** 的實作邊界、風險分級、不可變產品規則，以及建議 Phase 52–60 順序。  
**不是：** 已交付 Real MVP 的完成證明、schema 定稿、或 API 規格全文（後續 Phase 52–53 再拆）。

---

## 1. 目前基準（Public MVP Demo）

| 項目 | 說明 |
|------|------|
| **Git 基準** | **`023cf9b`** `fix: polish public mvp demo consistency` |
| **實作性質** | Public MVP 為 **靜態／展示導向**（HTML + `public/frontend/*.js` + 共用 CSS）；`?ui_state=`、`?nav=` 僅切換文案與 mock，**不代表**後端生命週期或帳號狀態 |
| **既有後端（Poll Core）** | 本機可跑「建立 → 投票 → display-safe 結果」之 **簡化生命週期**（`POST /polls`、`vote-by-index`、`GET .../results`）；**尚未**對齊 Phase 39 完整公開生命週期（鎖定期、取消、下架、資格持久化等） |
| **展示交接** | [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) |

### 1.1 目前 Demo 路由（政策／狀態預覽）

| 路由／參數 | 用途 |
|------------|------|
| `GET /` | 首頁、範例卡片、政策連結 |
| `GET /faq` | 常見問題（繁中政策摘要） |
| `GET /trust-levels` | 信任等級 Lv.0–Lv.4 權限矩陣（草案展示） |
| `GET /vote/demo` | 投票殼；可搭配 `?ui_state=` |
| `GET /results/demo?ui_state=collecting` | 收集中（不顯示票數等） |
| `GET /results/demo?ui_state=revealed` | 已公開結果 |
| `GET /results/demo?ui_state=locked` | 公開鎖定期 |
| `GET /results/demo?ui_state=post_lock` | 鎖定期已結束 |
| `GET /results/demo?ui_state=cancelled` | 已取消 |
| `GET /results/demo?ui_state=unpublished` | 已下架 |
| `?nav=guest` | 訪客導覽 mock（非真實登入） |
| `?nav=logged-in-mock` | 登入後導覽 mock（非真實登入） |

另見真實 poll id 流程：`/polls/new`、`/vote/:pollId`、`/results/:pollId`（需本機 `www_test` + `npm start` 或 `npm run demo:public:local`）。

---

## 2. 已完成 Public MVP 範圍（Phase 23–50 摘要）

下列為 **展示面已交付**（不等於 Real MVP 後端已對齊政策）：

| 類別 | 內容 |
|------|------|
| **Demo 流程** | 分享連結優先；建立／投票／結果頁；本機 smoke／demo 腳本 |
| **政策頁** | `/faq`、`/trust-levels` |
| **行動版** | `public-mvp.css` 可讀性與觸控目標調整（Phase 48–50） |
| **生命週期展示** | `ui_state` 預覽：收集中、已公開、公開鎖定期、鎖定期已結束、已取消、已下架 |
| **文案一致性** | 「收集中」「已公開」「公開鎖定期」「取消」「下架」「展示用，不儲存」「目前為公開展示版」「正式上線後開放」等與 Phase 39–41 對齊 |
| **導覽 mock** | `?nav=guest`／`?nav=logged-in-mock` |
| **文件鏈** | 本機啟動、demo 交接、手動 QA、production 邊界、Phase 39–41 政策／UI 規劃 |

**Phase 50**（`023cf9b`）：demo 最終 QA 與上述用語一致性收尾。

---

## 3. 尚未實作（Real MVP 前禁止宣稱已上線）

| 能力 | 說明 |
|------|------|
| **DB 驅動的公開問卷生命週期** | 收集中／截止揭曉／公開鎖定期／取消／下架由持久化狀態驅動，而非僅 `?ui_state=` |
| **真實 auth** | 註冊、登入、session、身分與所有權 |
| **資格持久化** | 年齡／地區等 eligibility 判斷與儲存 |
| **通知持久化** | 關注結果、站內通知佇列與送達狀態 |
| **信任評分持久化** | 信用點數、等級計算與稽核 |
| **回饋持久化** | 投票後題目品質回饋儲存與聚合 |
| **正式 feed／榜單／個人化** | 含 `GET /polls/feed` 的產品化探索與排序（現有 API 僅 freshness-only、非個人化） |
| **政治／高風險審核流程** | 發布前審核、繞過防護 |
| **Public MVP 與 admin 治理整合** | 公開面與 correction／suspend 等營運流程的完整產品銜接（後台 API 部分已存在，公開產品路徑未完整） |
| **關注結果真實送達** | 站內通知 MVP 定義下的實際提醒（目前為 mock） |
| **Email／推播** | 列為 Future |
| **「放棄投票，只看結果」** | 列為 Future |

現有 Poll Core（建立、投票、display-safe 結果）**不等於** Real MVP 完整公開產品路徑。

---

## 4. Real MVP 邊界分類

### 4.1 低風險／中風險（一般 Agent 可於明確任務下進行）

適用：**不改變**「誰能投票、誰能看結果、何時揭曉、收集中是否洩漏」之產品行為。

| 類型 | 範例 |
|------|------|
| 文件與交接 | README、handoff、本文件與 Phase 52–53 規劃稿 |
| 靜態文案與可及性 | FAQ、信任矩陣、demo 頁繁中用語、行動版排版 |
| 前端 demo 清理 | `?ui_state=` 殼、inert 按鈕、mock 橫幅（**不**假裝已持久化） |
| 非持久化 UI 占位 | 停用 chip、展示用表單欄位、`mvp-btn-mock` |
| 唯讀版面 | 政策頁、探索 placeholder 版面（無新資料來源） |
| 測試 | 靜態 HTML／policy JS 斷言、既有 smoke 延伸（不新增洩漏路徑） |

### 4.2 高風險（須嚴格審查／人工把關）

任一變更若可能影響 **投票資格、結果可見性、揭曉時機、收集中洩漏**，一律視為高風險：

| 類型 | 風險說明 |
|------|----------|
| DB schema／migrations | 生命週期欄位、鎖定期、取消／下架狀態 |
| 交易邊界 | 投票與計數、狀態轉換原子性 |
| 持久化投票／結果隱私 | display-safe 層與 API 回應契約 |
| **收集中結果洩漏防護** | 創作者 API、管理端、日誌、快取、聚合查詢 |
| auth／session／identity | 誰是發起者、誰能操作下架 |
| 資格規則與持久化 | 不符合資格仍不得看收集中結果 |
| 通知持久化 | 關注結果、送達與退訂 |
| 信任／信用點數／回饋持久化 | 不可被購買信任、不可繞過審核 |
| feed／ranking／personalization | 答案方向、參與度排序等紅線 |
| admin／治理／高風險審核 | 政治敏感類別、雙重把關 |
| 任何改動 close／lock／cancel／unpublish 語意 | 與 Phase 39 不一致即產品缺陷 |

**Agent 標記建議：** 高風險 Phase（§6 表中的 🔴）應要求：先讀 Phase 39–40–51、先寫測試或契約、PR 描述含隱私影響、禁止順手改 ranking／personalization。

---

## 5. Real MVP 產品不變量（實作時不可協商）

下列為 Real MVP 實作的 **硬性規則**（與 [`www-project-phase-39-poll-lifecycle-policy-v1.md`](./www-project-phase-39-poll-lifecycle-policy-v1.md) 一致；實作不得削弱）：

| # | 規則 |
|---|------|
| 1 | **收集中**不顯示票數、百分比、總票數、排名、趨勢、進度。 |
| 2 | **發起者**在收集中亦不能看到中途結果。 |
| 3 | **close** = 投票／統計期間結束 **且** aggregate 結果公開。 |
| 4 | **close ≠ 鎖定期結束**。 |
| 5 | MVP 可先令 **close time = result reveal time**。 |
| 6 | 結果公開後進入 **公開鎖定期**；MVP 暫定 **5 天**。 |
| 7 | 鎖定期內：不可下架、刪除、修改、重新開放投票、隱藏結果。 |
| 8 | 鎖定期結束後：發起者可 **下架／unpublish**。 |
| 9 | 收集中停止稱 **「取消」**，不叫下架；取消 **不形成** 公開結果。 |
| 10 | 下架文案固定：「**此問卷已結束公開鎖定期，並由發起者下架。**」 |
| 11 | 無投票資格者：可看基本資訊、不能作答、**不能看收集中結果**，可 **關注結果**。 |
| 12 | 關注結果 MVP = **站內通知**；Email／推播 = Future。 |
| 13 | 「**放棄投票，只看結果**」= Future。 |
| 14 | 信任等級 **不能** bypass 政治／高風險審核。 |
| 15 | **功能點數**：未來可付費換功能／曝光，**不能購買信任**。 |
| 16 | **信用點數**：靠題目品質與正向貢獻，**不可購買**。 |
| 17 | 高風險題 **不能** 靠點數或付費繞過審核。 |

**驗收原則：** 任一 API、查詢、日誌、管理工具、前端欄位若讓未授權對象在收集中看到可推論票數的訊號，視為 **P0 缺陷**。

---

## 6. 建議 Phase 52–60 路線圖

順序依 **先規劃 → 再 schema → 再核心生命週期 → 再身分／通知 → 再信任／治理規劃** 排列。  
與 Phase 41 對齊：先讓 **生命週期與隱私** 在後端可測，再掛 auth 與通知，避免 mock UI 與真實狀態長期分叉。

| Phase | 主題 | 類型 | Agent 建議 | 說明 |
|-------|------|------|------------|------|
| **52** | Real MVP **資料模型**規劃 | 📄 僅文件 | 🟢 一般 | [`www-project-phase-52-real-mvp-data-model-plan-v1.md`](./www-project-phase-52-real-mvp-data-model-plan-v1.md) — 實體、狀態機、隱私欄位、Phase 54 前置；**不** commit migration |
| **53** | 公開問卷生命週期 **API／規格**規劃 | 📄 僅文件 | 🟢 一般 | close／lock／cancel／unpublish 端點契約、錯誤碼、與 display-safe 結果 API 關係 |
| **54** | DB schema／migration（公開生命週期） | 💻 程式 | 🔴 嚴格審查 | 持久化狀態與時間欄位；須附 migration 測試與 rollback 說明 |
| **55** | 公開問卷建立／讀取 **基本後端** | 💻 程式 | 🔴 嚴格審查 | 對齊 Phase 53；創作者讀取須受 collecting 盲測約束 |
| **56** | 投票資格與 **收集中隱私護欄** | 💻 程式 | 🔴 嚴格審查 | eligibility 判斷、結果 API 在 collecting 的回應、創作者／公眾對稱 |
| **57** | 結果揭曉與 **鎖定期**後端規則 | 💻 程式 | 🔴 嚴格審查 | close=reveal、5 天 lock、cancel／unpublish 轉換 |
| **58** | **關注結果**通知持久化（站內） | 💻 程式 | 🔴 嚴格審查 | 僅站內 MVP；不含 email／push |
| **59** | 信任／信用／回饋 **規劃** | 📄 僅文件 | 🟡 中等 | 對齊 trust-level、quality incentive 草案；**不** 實作購買信任 |
| **60** | 政治／高風險審核 **規劃** | 📄 僅文件 | 🟡 中等 | 與 admin 治理邊界銜接；實作留待後續 Phase |

### 6.1 與既有後台能力的關係

Phase **6B–12** 已交付 **admin correction** 與 Bearer RBAC；Real MVP 公開路徑 **不應** 在未定義下重用 correction 狀態當作公開 lifecycle。Phase 60 應明確區分：

- 公開問卷 lifecycle（Phase 39）
- 營運 typo／suspend correction（既有 admin）

### 6.2 前台銜接（Phase 55+ 之後另列）

將 `?ui_state=` demo 逐步改為 **讀真實狀態** 屬高風險 UI／API 聯動，建議在 **57 驗證通過後** 再開專 Phase（本路線圖不佔用 52–60 編號），且每頁須保留「展示用」與真實模式切換的過渡說明直至全面切換。

---

## 7. 相關文件

| 文件 | 用途 |
|------|------|
| [`www-project-phase-39-poll-lifecycle-policy-v1.md`](./www-project-phase-39-poll-lifecycle-policy-v1.md) | 生命週期政策（規範） |
| [`www-project-phase-40-user-profile-eligibility-follow-policy-v1.md`](./www-project-phase-40-user-profile-eligibility-follow-policy-v1.md) | 資格／追蹤政策（規範） |
| [`www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md`](./www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md) | 頁面對照與 UI/API 分類 |
| [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) | 目前 demo 路由與展示腳本 |
| [`www-project-production-readiness-boundary-v1.md`](./www-project-production-readiness-boundary-v1.md) | demo-ready vs production-ready |
| [`www-project-trust-level-policy-draft-v1.md`](./www-project-trust-level-policy-draft-v1.md) | 信任等級草案 |
| [`www-project-quality-question-incentive-policy-draft-v1.md`](./www-project-quality-question-incentive-policy-draft-v1.md) | 優質題目／激勵草案 |
| [`www-project-phase-20-correction-admin-governance-handoff-v1.md`](./www-project-phase-20-correction-admin-governance-handoff-v1.md) | 既有 admin 治理索引 |

---

## 8. Phase 51 自我稽核（本 commit）

| 檢查項 | 結果 |
|--------|------|
| 僅文件（+ README／交接連結） | ✅ |
| 未 stage `design-drafts/` | ✅ |
| 未改 schema／migration／API／auth／業務邏輯 | ✅ |
| 未宣稱 Real MVP 功能已實作 | ✅ |
| 繁體中文、與 Public MVP 用語一致 | ✅ |

---

*Phase 51 — 規劃文件 v1。Phase 52 資料模型規劃見 [`www-project-phase-52-real-mvp-data-model-plan-v1.md`](./www-project-phase-52-real-mvp-data-model-plan-v1.md)。下一建議步驟：Phase 53 公開生命週期 API／規格規劃（docs-only）。*
