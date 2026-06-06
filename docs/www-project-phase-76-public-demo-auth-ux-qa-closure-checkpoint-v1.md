# WWW Project Phase 76 — Public Demo Release Checkpoint / Auth UX QA Closure v1

**狀態：** 檢查點／交接文件（**僅** docs、README、manual QA 索引、docs guard；**無** runtime、frontend UX、DB schema、migration、API behavior、verifier behavior 變更）。

**Baseline：** `origin/master` @ **`e0f68a8`**（Phase 75 auth state navigation UX polish）。

**規範依據：** Phase 70 final auth boundary checkpoint、Phase 71–73 auth/login plans、Phase 74–75 login UI shell + navigation polish、`AGENTS.md` v0.2、Raw Option Linkage Ban。

**測試者建議入口（Phase 76 起）：** 本文件 → §2 demo 可測流程 → §3 身份邊界 → §4 invariants → §6 QA checklist。啟動與逐步操作仍見 Phase 69 / manual QA §3.10。

---

## 1. Phase 70–75 交付摘要（Auth / Login / Demo UX）

| Phase | 交付 | 類型 |
|-------|------|------|
| **70** | Production auth boundary cutover — profile、Official Vote、`vote-by-index`、`/creator/*` route adapter 改走 `UserAuthResolver`；`creator_session` local/demo-only；Reference Answer 未切 | runtime + checkpoint |
| **71** | Production credential verifier / formal session **plan** | docs |
| **72** | `USER_AUTH_CREDENTIALS_JSON` opaque `Authorization: Bearer` verifier foundation | runtime foundation |
| **73** | Production login / session UX **plan** — fail-closed、Bearer boundary、`creator_session` 排除 | docs |
| **74** | `GET /login` disabled UI shell — 正式登入尚未啟用、無 submit、無 browser credential storage | frontend shell |
| **75** | Header auth chips、`renderAuthStateBanner`、demo nav switch 文案 — 三種身分清楚區分 | frontend polish |

**Phase 76 本輪：** 將上述狀態封板為 public demo release checkpoint；**不**新增 implementation。

---

## 2. 目前 Demo 可測流程

**啟動：** `npm run demo:public:local` → `http://127.0.0.1:3000/`（見 [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md)）。

### 2.1 核心路由（建議測試順序）

| # | 路由 | 用途 | Demo 身分／備註 |
|---|------|------|-----------------|
| 1 | `GET /` | 首頁、政策連結、auth 狀態橫幅 | — |
| 2 | `GET /login` | 正式登入 **disabled UI shell**；說明 production fail-closed 與 demo 身分邊界 | **不**送出登入、**不**核發 session |
| 3 | `GET /profile` | 投票資格欄位（出生年月、粗粒度地區） | MVP **`X-User-Id`**（non-production） |
| 4 | `GET /polls/new?live=1` | 真實建立問卷 | **`creator_session`**（local/demo issuer） |
| 5 | `GET /my-polls?live=1` | 發起者即時問卷管理 | **`creator_session`** |
| 6 | `GET /vote/:pollId` | 真實投票（`vote-by-index`） | MVP **`X-User-Id`** |
| 7 | `GET /results/:pollId` | display-safe 公開結果；collecting = counter-free | — |
| 8 | `GET /explore` | freshness-only 列表（`GET /polls/feed`） | — |

**延伸（選做）：** `GET /results/:pollId?creator=1`（發起者 lifecycle UI）、`GET /faq`、`GET /trust-levels`、`GET /vote/demo`（靜態政策殼）。

### 2.2 Auth UX 手動 QA 重點（Phase 74–75）

- [ ] 訪客 header 顯示「正式登入尚未啟用」chip，連至 `/login`
- [ ] `/login` 表單 disabled；送出不呼叫 API、不寫 `localStorage` / `sessionStorage`
- [ ] `?nav=logged-in-mock` 顯示「MVP 測試身份」chip；**不是**真實登入
- [ ] 首頁／profile／vote／my-polls 橫幅清楚區分：production 未啟用、`X-User-Id`、`creator_session`
- [ ] `creator_session` 僅出現在 `/creator/*` 相關流程；profile／vote **不**用此 cookie 授權

**逐步勾選：** [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) §3.10；release 總表見 Phase 69 §6。

---

## 3. 現行身份邊界（封板）

### 3.1 Production route adapters（已走 `UserAuthResolver`）

| Surface | Production identity | 備註 |
|---------|---------------------|------|
| `GET` / `PUT` `/users/me/profile` | `UserAuthResolver` → `auth.user_id` | `creator_session` **不**授權 |
| `POST /polls/:id/vote`（Official Vote） | `UserAuthResolver` → `auth.user_id` | transaction order **不變** |
| `POST /polls/:id/vote-by-index` | `UserAuthResolver` → `auth.user_id` | eligibility **在** option resolve **之前** |
| Production `/creator/polls` 與 lifecycle | `UserAuthResolver` + ownership | Origin gate 不變 |
| Production `GET /creator/session` | `UserAuthResolver`（忽略 `creator_session` cookie） | — |
| `POST /creator/session`（production） | **fail-closed** | 不核發 cookie |

### 3.2 Credential verifier foundation（Phase 72）

- Production 可設定 `USER_AUTH_CREDENTIALS_JSON`：opaque `Authorization: Bearer` token digest → canonical `user_id`。
- 缺少 verifier 時 production protected routes **fail-closed**（`401 AUTH_REQUIRED`）。
- Verifier **不**連結 selected option、demographic breakdown、analytics、或 vote counter identity。

### 3.3 正式登入與 UI shell（Phase 73–75）

| 項目 | 狀態 |
|------|------|
| 正式 login submit | **尚未啟用** |
| `GET /login` | **disabled UI shell** — 說明 only |
| Session / OAuth 核發 | **未**實作 |
| Frontend credential storage | login shell **不**寫入 browser storage |

### 3.4 Local / demo / test 相容身分（explicit non-production）

| 機制 | 範圍 | 定位 |
|------|------|------|
| MVP **`X-User-Id`** header | `/profile`、`/vote/:id`、公開 vote API（local/demo/test） | **Explicit non-production compatibility**；**不是** production identity |
| **`creator_session`** cookie | `/creator/*` 發起者流程（`?live=1`） | **Local/demo/test creator flow only**；**不是** production user identity |
| `?nav=logged-in-mock` | 導覽列外觀 | **展示用**；**不是**帳號狀態 |

### 3.5 Reference Answer（scope 不變）

- **尚未**切 `UserAuthResolver`。
- **不接** profile eligibility evaluator。
- 維持既有 public participation identity 邊界（見 Phase 70 checkpoint）。

---

## 4. 不變 Invariants（Phase 76 封板）

### 4.1 Vote / counter durable shapes

- **Vote token schema：** `user_id + poll_id`（**不含** selected option）
- **Counter schema：** `poll_id + option_id + shard_id`（**不含** user、session、request、profile identity）

### 4.2 Transaction order

- **Official Vote transaction order** 不變。
- **`vote-by-index`：** profile eligibility evaluator **在** option index 解析／token 寫入／counter 增量 **之前**。

### 4.3 Raw Option Linkage Ban

- 公開 UI、錯誤文案、display-safe JSON **不得**揭露 `option_id`、`option_index`、vote token、shard、或 choice + user/session/device/request/log/trace/metric/error payload linkage。

### 4.4 Profile / analytics / personalization 邊界

- Profile 欄位維持：`birth_year_month`、`residential_region`（粗粒度）。
- **不新增：** demographic breakdown、ranking personalization、analytics linkage、精準位置、額外 profile 欄位。

### 4.5 Feed / collecting privacy

- `GET /polls/feed`：freshness-only；無票數、熱門、個人化。
- Collecting：counter-free；發起者亦同。

---

## 5. 明確 non-goals（Phase 76 未做）

- 不實作 login submit、logout、session issuance、cookie 核發。
- 不新增 migration / session DB。
- 不改 `UserAuthResolver`、production verifier、`USER_AUTH_CREDENTIALS_JSON` 行為。
- 不改 `/users/me/profile`、Official Vote、`vote-by-index`、creator routes、Reference Answer API 或 transaction order。
- 不改 profile eligibility evaluator、vote token / counter schema。
- 不改 frontend runtime / UX（Phase 74–75 維持原狀）。
- 不 commit `design-drafts/`。

---

## 6. Release / QA 驗證

### 6.1 自動驗證

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

可選：`npm run smoke:admin:local`、`npm run test:integration:local`。

### 6.2 Docs guard

`tests/docs/phase-76-public-demo-auth-ux-qa-closure-checkpoint-doc.test.ts`

### 6.3 人工 QA 入口

| 文件 | 用途 |
|------|------|
| **本文件** | Phase 76 auth UX demo closure checkpoint |
| [`www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md`](./www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md) | Demo 啟動、操作順序、release checklist |
| [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) | 逐步手動 QA（§3.10） |
| [`www-project-phase-70-final-production-auth-boundary-checkpoint-v1.md`](./www-project-phase-70-final-production-auth-boundary-checkpoint-v1.md) | Production auth boundary 細節 |
| [`www-project-phase-74-production-login-ui-shell-checkpoint-v1.md`](./www-project-phase-74-production-login-ui-shell-checkpoint-v1.md) | Login shell 交付 |
| [`www-project-phase-75-auth-state-navigation-ux-checkpoint-v1.md`](./www-project-phase-75-auth-state-navigation-ux-checkpoint-v1.md) | Navigation auth state polish |

---

## 7. 建議下一階段

1. **Phase 77+（implementation）** — 依 Phase 73 接上可運作的 production login submit、logout、與 frontend credential transport。
2. **Frontend cutover** — profile / vote / creator live pages 改送 formal `Authorization: Bearer`；production 移除對 MVP `X-User-Id` 的依賴。
3. **Reference Answer** — 獨立決策是否／何時切 `UserAuthResolver`（目前 defer）。

---

## 8. 變更記錄

| Phase | 內容 |
|-------|------|
| 76 | Public demo auth UX QA closure checkpoint；Phase 70–75 狀態封板；manual QA / Phase 69 索引更新 |

`design-drafts/` **排除**於 git 與交付範圍。
