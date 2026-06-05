# WWW Project Phase 67 — Profile Eligibility Demo QA & Public UX Hardening v1

**狀態：** Demo／QA／交接文件 + 公開前端文案小幅整理（**不含** schema、Official Vote transaction、evaluator 行為、production auth）。

**Baseline：** `origin/master` @ **`3f97f07`**（Phase 66 final checkpoint 已合併）。

**規範依據：** `AGENTS.md` v0.2（含 Raw Option Linkage Ban）。

**建議閱讀順序：**

1. [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) — `npm run demo:public:local`、demo `X-User-Id`
2. [`www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`](./www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md) — 發起者 `?live=1`／lifecycle
3. **本文件** — profile／eligibility demo 與手動 QA
4. [`www-project-phase-66-final-profile-eligibility-checkpoint-v1.md`](./www-project-phase-66-final-profile-eligibility-checkpoint-v1.md) — Phase 66 封板契約
5. [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) — 訪客主流程 RWD

---

## 1. Demo 流程總覽（發起者 + profile + 投票 + 結果）

| 步驟 | URL／操作 | 誰 | 說明 |
|------|-----------|-----|------|
| 1 | `GET /polls/new?live=1` | 發起者 | `POST /creator/polls` 建立問卷；複製 `/vote/<pollId>` 分享連結（Phase 60） |
| 2 | `GET /my-polls?live=1` | 發起者 | `GET /creator/polls` 管理 owned list；lifecycle 按鈕 |
| 3 | `GET /profile` | 投票者 | 填寫／清除 `birth_year_month`、`residential_region`；`PUT /users/me/profile` + `X-User-Id` |
| 4 | `GET /vote/<pollId>` | 投票者 | `POST /polls/:id/vote-by-index`；不合格顯示**固定**繁中提示 |
| 5 | `GET /results/<pollId>` | 訪客 | 依 `public_lifecycle_state`：collecting 為 counter-free；revealed 後才顯示 aggregate |
| 6 | `GET /results/<pollId>?creator=1` | 發起者 | lifecycle 操作 + refresh（UI 非授權） |

**Policy 展示：** `/vote/demo?ui_state=ineligible` 可預覽「不符合資格」文案與面板（**不寫 DB**）。

**資格規則問卷：** 公開建立 UI **尚未**提供 `poll_eligibility_rules` 編輯。手動驗證帶規則問卷時，可於 `www_test` 對已建立 poll 插入規則列（僅 QA；見 §6），或依賴 `npm test` 內 `vote-by-index`／profile 整合案例。

---

## 2. Profile demo（`/profile`）

| 項目 | 行為 |
|------|------|
| 路由 | `GET /profile` |
| API | `GET` / `PUT` `/users/me/profile` |
| 授權 | MVP **demo-style `X-User-Id`**（`127.0.0.1` 預設投票者 A；`?demoVoter=b` 為投票者 B） |
| 欄位 | 僅出生年月（`type=month`）、粗粒度 `residential_region` |
| 禁止欄位 | gender、精確生日、地址、GPS、geocode、精準位置 |
| Cookie | `credentials: 'omit'` — **不**送 `creator_session` |

**本機第二投票者：** 無痕視窗開 `…/vote/<pollId>?demoVoter=b`（見 local demo startup §F）。

---

## 3. Official Vote eligibility（後端已封板 — 本 Phase 不變）

Transaction 順序（Phase 66C，**禁止**在本 Phase 調整）：

```
participation guard → official-trust guard → profile eligibility → option resolve → token → counter
```

| 項目 | 契約 |
|------|------|
| Evaluator | `isProfileEligibleForOfficialVote`（**行為不變**） |
| 不合格 HTTP | 403 `POLL_FORBIDDEN` + 固定後端訊息 |
| 前端對應 | `messageForVoteSubmitFailure` →「你目前不符合此問卷的投票資格。」 |
| Index 模糊化 | 有效／無效 `option_index` 對外**相同**拒絕形狀（自動化：`vote-by-index.test.ts`） |

前端**不得**依 API 訊息揭露「哪個 index 有效」或「哪條規則未過」。

---

## 4. Reference Answer — scope 不變

- `POST /polls/:id/reference-answer` **不接** profile eligibility evaluator。
- 僅既有 public participation guard。
- Reference Answer profile 門檻須**未來獨立 Phase** 核准。

---

## 5. Auth 分離

| 機制 | 用途 | **不是** |
|------|------|----------|
| `X-User-Id` | 公開 vote、Reference Answer、`/users/me/profile`（MVP demo） | production 登入 |
| `creator_session` | `/creator/*` 發起者寫入 | user auth、profile API 授權 |

**`creator_session` 不得**描述或實作為一般使用者登入／profile 授權來源。

---

## 6. Raw Option Linkage Ban（維持）

禁止任何 **durable** 或前端持久化狀態，把 user／session／request／profile eligibility 與 `option_id`、`option_text`、`option_index` 綁在一起。

涵蓋：DB、log、metric、trace、cache、analytics、error payload、vote rejection 除錯輸出。

前端 vote／profile 腳本**不得**使用 `localStorage`／`sessionStorage`／`option_id` 於資格錯誤文案。

---

## 7. 已知限制（demo 交接必讀）

| 項目 | 狀態 |
|------|------|
| Frontend auth | **MVP demo-style `X-User-Id`**；**production user-auth wiring later** |
| Creator 建立 UI | 無 eligibility 規則編輯器 |
| Reference Answer profile 門檻 | **未**實作 |
| Ranking／personalization | **未**變更 |
| `design-drafts/` | **勿** commit |

---

## 8. 建議驗證命令

```bash
git diff --check
npm run typecheck
npm run build
npm test
npm run smoke:public:local   # 需 Docker + www_test；見 §9
```

---

## 9. Smoke 與進階 eligibility QA

`npm run smoke:public:local` 驗證公開路由、creator 建立、`vote-by-index`、JSON 不洩漏 `option_id` 等；**不一定**涵蓋帶 `poll_eligibility_rules` 的端到端瀏覽器路徑。

**進階（僅 `www_test`）：** 建立 collecting poll 後插入規則（範例）：

```sql
INSERT INTO poll_eligibility_rules (poll_id, rule_type, allowed_regions)
VALUES ('<poll-uuid>', 'region', ARRAY['TW-KHH']);
```

將投票者 A 的 `residential_region` 設為 `TW-TPE`（`/profile` 或 `PUT /users/me/profile`），於 `/vote/<pollId>` 投票應得固定資格拒絕；**不得**在 UI 或 network 回應中區分 index 是否存在。

---

## 10. Manual QA checklist（Phase 67）

**前置：** `npm run demo:public:local` 或 Phase 32 手動啟動；確認 `public-mvp.css` 為 200。

### A. Profile

- [ ] `GET /profile` 僅有出生年月、居住地區；無性別／地址／GPS
- [ ] 儲存 `1998-07` + `TW-TPE` 後重新整理仍保留
- [ ] **清除欄位**後儲存成功（null）
- [ ] DevTools：`/users/me/profile` 僅 `X-User-Id`，無 `creator_session` Cookie

### B. 發起者 + 分享

- [ ] `/polls/new?live=1` 建立問卷並複製 `/vote/<pollId>`
- [ ] `/my-polls?live=1` 可見該問卷
- [ ] 投票頁政策區說明可連到 `/profile`（非「資格尚未開放」）

### C. 投票與資格文案

- [ ] 收集中投票成功後結果頁仍 counter-free
- [ ] 資格不符時（§9 或 `?ui_state=ineligible` demo）顯示：**你目前不符合此問卷的投票資格。**
- [ ] 錯誤文案**不含** `option_index`、`option_id`、具體年齡區間或「此選項不存在」
- [ ] `?ui_state=ineligible` 僅影響展示頁，不寫 DB

### D. Reference Answer

- [ ] 文件與產品認知：Reference Answer **不因** profile 欄位額外阻擋（回歸以 `npm test` `reference-answer-hardening` 為準）

### E. 結果頁邊界

- [ ] collecting：`/results/<pollId>` 無票數／百分比
- [ ] `?creator=1` 可 lifecycle；訪客結果頁無發起者按鈕

### F. 手機可讀性（≤390px）

- [ ] `/profile` 表單與按鈕可點、無橫向溢出
- [ ] `/vote/<pollId>` 選項與送出可讀

---

## 11. 變更記錄

| Phase | 內容 |
|-------|------|
| 67 | Profile eligibility demo QA 文件、README 索引、公開文案與 copy guard 測試 |
