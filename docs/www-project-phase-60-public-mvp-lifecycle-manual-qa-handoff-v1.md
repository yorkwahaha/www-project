# WWW Project Phase 60 — Public MVP Lifecycle Manual QA & Handoff v1

**狀態：** 文件交接（Phases 57–59 已實作）；不含 schema、API、scheduler 部署或 frontend 行為變更。

**Baseline：** `origin/master` @ Phase 59（`0eceef2` 起）— lifecycle 寫入 API（57）、scheduler foundation（58A）、前端發起者控制與結果 refresh（58B–58D）、發起者流程文案（59）。

規範依據：`AGENTS.md` v0.2。

**建議閱讀順序：**

1. [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) — 本機 `www_test` 與 `npm run demo:public:local`
2. **本文件** — 即時發起者流程與 lifecycle 手動 QA
3. [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) — 訪客流程（建立 → 投票 → 結果）與 RWD 簡測
4. Phase 57 / 58 / 59 實作備忘：
   - [`www-project-phase-57-lifecycle-transition-write-apis-v1.md`](./www-project-phase-57-lifecycle-transition-write-apis-v1.md)
   - [`www-project-phase-58a-lifecycle-scheduler-advancement-foundation-v1.md`](./www-project-phase-58a-lifecycle-scheduler-advancement-foundation-v1.md)
   - [`www-project-phase-58b-frontend-creator-lifecycle-controls-v1.md`](./www-project-phase-58b-frontend-creator-lifecycle-controls-v1.md)
   - [`www-project-phase-59-public-mvp-creator-flow-polish-v1.md`](./www-project-phase-59-public-mvp-creator-flow-polish-v1.md)

---

## 1. 即時公開 MVP 流程總覽（發起者 + 訪客）

| 步驟 | URL／操作 | 誰 | 說明 |
|------|-----------|-----|------|
| 1 | `GET /polls/new?live=1` | 發起者 | 真實 `POST /creator/polls`；成功後複製**投票連結**、管理 lifecycle |
| 2 | `GET /vote/<pollId>` | 訪客 | 分享連結投票；`X-User-Id` 為本機 demo 投票者（見 §5） |
| 3 | `GET /my-polls?live=1` | 發起者 | 透過 `GET /creator/polls` 讀取發起者擁有的問卷 |
| 4 | `GET /results/<pollId>?creator=1` | 發起者 | 發起者操作區 + 結果顯示；lifecycle 成功後自動 re-fetch 結果 |
| 5 | `GET /results/<pollId>` | 訪客 | 唯讀結果；依 `public_lifecycle_state` 顯示 collecting／unavailable／aggregate |

**未加 `?live=1` 的 `/polls/new`** 仍為展示用（不寫入 DB）。**未加 `?creator=1` 的結果頁** 不顯示發起者操作區。

---

## 2. Lifecycle 狀態與公開結果顯示（後端權威）

`public_lifecycle_state` 為唯一權威（Phase 55A–55C）。前端顯示**不是**授權；後端 API 與 aggregate guard 仍為最終判定。

| 狀態 | `GET /polls/:id/results` | 結果頁 UI（Phase 55C） |
|------|--------------------------|-------------------------|
| `collecting` | 不讀 aggregate counters | 「目前仍在收集中」；僅選項標籤，無票數／百分比 |
| `cancelled` | counter-free unavailable shell | 「問卷已取消」+ `user_message` |
| `unpublished` | counter-free unavailable shell | 「問卷已下架」+ `user_message` |
| `draft` | counter-free unavailable shell | 無可公開顯示的結果 |
| `revealed` | display-safe 區間化 aggregate | 總票數區間、選項百分比／票數區間 |
| `locked` | 同上 | 同上；發起者 UI 顯示鎖定期說明，無 lifecycle 按鈕 |
| `post_lock` | 同上 | 同上；發起者可 **下架** |

**自動推進（58A）：** 服務內有 `createPublicLifecycleSchedulerService` 與 `advancePublicLifecycle`，可將 `revealed → locked`、`locked → post_lock`（依 DB 時間戳與 `NOW()`）。**尚未部署 cron／worker**；本機手動 QA 須自行按「結束收集」或（進階）呼叫內部 API／調時間戳驗證 post_lock。

---

## 3. 發起者操作（Phase 65B API + 65C-A UI）

均需 Phase 65A `creator_session` cookie；本機 live mode 可透過 local-test issuer 建立 cookie（見 §5）。按鈕文案與確認框為繁中。

| 按鈕 | API | 允許狀態 | 效果摘要 |
|------|-----|----------|----------|
| **取消問卷** | `POST /creator/polls/:id/cancel` | `collecting` | → `cancelled`；不產生公開彙總結果 |
| **結束收集並公開結果** | `POST /creator/polls/:id/close` | `collecting`（且須達 `closes_at`） | → `revealed`；開始顯示 aggregate；進入約 5 天公開鎖定期 |
| **下架問卷** | `POST /creator/polls/:id/unpublish` | `post_lock`（鎖定期須已結束） | → `unpublished`；訪客無法再看公開結果 |

**結果頁 refresh（58C/D）：** 在 `/results/:id?creator=1` 操作成功後，前端會 `GET /polls/:id/results` 重繪主顯示區。若 POST 成功但 GET 失敗，控制區顯示「狀態已更新…請重新整理頁面」，主區 prepend 安全提示，**不**暴露 API 錯誤內文，並保留舊快照。

**發起者管理來源：** `/my-polls?live=1` 使用 `GET /creator/polls` 的 counter-free allowlist，不使用 `sessionStorage` 作 ownership authority。

---

## 4. 三頁發起者 UI（Phase 59 文案）

| 頁面 | 重點 |
|------|------|
| `/polls/new?live=1` 成功後 | 「下一步」、複製投票連結、`renderPollSharePanel`、管理連結（投票頁／我的問卷／結果頁發起者）、操作說明、lifecycle 按鈕 |
| `/my-polls?live=1` | 即時問卷區；複製投票連結；無問卷時導向 `?live=1` 建立頁 |
| `/results/:id?creator=1` | 說明須先「結束收集並公開結果」才顯示區間化統計；lifecycle + 自動 refresh |

展示用 **`/my-polls`（無 `?live=1`）** 仍為靜態表格列；lifecycle 真實操作請用上方即時區塊。

---

## 5. 本機測試前提

```bash
npm install
npm run demo:public:local
# 或 Phase 32 手動：Docker www_test、migrate、npm start → http://127.0.0.1:3000/
```

| 項目 | 本機 MVP 行為 |
|------|----------------|
| Creator session | `127.0.0.1` / `localhost` live mode 可用 local-test issuer，使用 seeded creator `11111111-1111-4111-8111-111111111111` 建立 `creator_session` |
| 投票者 | `demo:public:local` 種子 official 使用者；第二人可加 `?demoVoter=b`（見啟動文件） |
| DB | 僅 **`www_test`**；勿對 production 跑 smoke |

建議先跑：

```bash
git diff --check
npm run typecheck
npm run build
npm test
npm run smoke:public:local
```

---

## 6. 手動 QA 檢查清單（lifecycle + 即時發起者）

勾選前請確認伺服器已啟動且為 `www_test`。

### A. 建立與分享

- [ ] 開啟 `/polls/new?live=1`，建立問卷（≥2 選項）
- [ ] 成功區有「複製投票連結」與完整 `/vote/<pollId>` URL（僅 poll id，無 `option_id`）
- [ ] 「下一步」與「操作說明」為繁中，提及收集中不顯示票數
- [ ] 管理連結可開啟 `/my-polls?live=1` 與 `/results/<pollId>?creator=1`

### B. 收集中結果（訪客 + 發起者）

- [ ] 無痕開啟 `/vote/<pollId>`，完成投票
- [ ] `/results/<pollId>` 顯示「目前仍在收集中」，**無**假 `0%`／原始票數
- [ ] `/results/<pollId>?creator=1` 有「取消問卷」「結束收集並公開結果」

### C. 取消

- [ ] 發起者按「取消問卷」並確認
- [ ] 控制區更新；結果主區改為「問卷已取消」unavailable shell（58C refresh）
- [ ] 再投票應被後端拒絕（lifecycle 非 collecting）

### D. 結束收集並公開結果

- [ ] 新問卷或等待 `closes_at` 後按「結束收集並公開結果」
- [ ] 結果頁主區顯示**區間化**統計（非精確原始票數）
- [ ] 發起者區進入鎖定期說明，無取消／下架按鈕

### E. 下架（需 `post_lock`）

- [ ] **本機若無 scheduler：** 須手動將 DB `public_lifecycle_state` 調為 `post_lock` 且鎖定期已過，或透過整合測試／內部 helper 驗證；正式部署前以文件 58A 為準
- [ ] 發起者按「下架問卷」後，結果頁為 unavailable shell，訪客看不到 aggregate

### F. Refresh 失敗邊界（選做）

- [ ] 模擬 `GET /results` 失敗時（例如暫停 server），POST 成功後仍見「狀態已更新…重新整理」；DOM **無**英文 stack／`option_id`／counter JSON

### G. 隱私快檢

- [ ] 公開頁與 Network 中 `GET /polls/:id/results` 在 collecting／cancelled／unpublished **無** aggregate 欄位外洩
- [ ] `/my-polls?live=1` 的 `GET /creator/polls` 回應無 option、count、percent、token、ranking、creator_id

---

## 7. 已知限制（MVP／本機）

| 限制 | 說明 |
|------|------|
| `?live=1` | 開發用即時 API 開關；非 production 授權模型 |
| `?creator=1` | 顯示發起者操作區的 MVP 開關；後端仍以 `creator_session` 驗證 |
| 本機 creator session | 本機 hostname 下 live mode 可簽發 local-test `creator_session`；production issuer 仍 fail closed |
| 前端 ≠ 授權 | 隱藏按鈕或 UI 狀態可被繞過；以 `/creator/polls/:id/cancel|close|unpublish` 與 aggregate guard 為準 |
| Scheduler | 58A foundation 存在；**無** cron／部署 wiring；`revealed→locked→post_lock` 本機可能需手動或 DB 調整 |
| `design-drafts/` | 設計稿目錄**不**納入 git；勿 commit |
| 無登入／feed UI | 見 [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) §4 |

---

## 8. 相關 API（Phase 57，無變更）

| Method | Path | 說明 |
|--------|------|------|
| `POST` | `/creator/polls/:id/cancel` | Creator；`collecting → cancelled` |
| `POST` | `/creator/polls/:id/close` | Creator；`collecting → revealed`（server 寫入 reveal／lock 時間） |
| `POST` | `/creator/polls/:id/unpublish` | Creator；`post_lock → unpublished` |

公開讀取仍用既有 `GET /polls/:id`、`GET /polls/:id/results`（含 `public_lifecycle_state`）。

---

## 9. 變更記錄

| Phase | 內容 |
|-------|------|
| 57 | Lifecycle transition write APIs |
| 58A | Scheduler advancement foundation（未部署） |
| 58B–58D | 前端發起者控制、結果 refresh、refresh 失敗 UX |
| 59 | 發起者流程繁中文案與三頁導覽 |
| 60 | 本交接與手動 QA 清單更新 |
