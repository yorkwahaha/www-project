# WWW Project Phase 65 — Final Creator Auth & Ownership Checkpoint v1

**狀態：** 檢查點／交接文件（**僅文件**；不含 schema、API、runtime、frontend 或 scheduler 行為變更）。

**Baseline：** `origin/master` @ **`427f0cd`**（Phase 65A → 65B → 65C-A → 65C-B 已合併）。

**規範依據：** `AGENTS.md` v0.2。

**子階段規格：**

- [65A Creator session](./www-project-phase-65a-creator-session-foundation-v1.md)
- [65B Creator-owned poll APIs](./www-project-phase-65b-creator-owned-poll-apis-v1.md)
- [65C-A Frontend cutover](./www-project-phase-65c-a-frontend-creator-api-cutover-v1.md)
- [65C-B Legacy creator-write retirement](./www-project-phase-65c-b-legacy-creator-write-retirement-v1.md)

---

## 1. Phase 65A — Creator session foundation

| 項目 | 交付 |
|------|------|
| **Schema** | `creator_sessions`（僅存 token digest；固定 12h TTL；不滑動續期） |
| **Routes** | `POST` / `GET` / `DELETE` `/creator/session` |
| **Cookie** | `creator_session`；`HttpOnly; SameSite=Strict; Path=/creator` |
| **Authority** | `X-User-Id` / `X-Display-Name` **不得** 核發或驗證 creator session |
| **Production** | 核發 **fail-closed**（無可信 credential verifier 前不可用） |
| **Local/test** | 僅 `APP_ENV=development\|test` + `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED=true` 可本機測試核發 |

---

## 2. Phase 65B — Creator-owned backend APIs

| Method | Route | 用途 |
|--------|-------|------|
| `POST` | `/creator/polls` | 建立 draft / published poll |
| `GET` | `/creator/polls` | 擁有者列表（上限 50；deterministic） |
| `DELETE` | `/creator/polls/:id` | 發起者刪除 |
| `POST` | `/creator/polls/:id/cancel` | `collecting → cancelled` |
| `POST` | `/creator/polls/:id/close` | `collecting → revealed` |
| `POST` | `/creator/polls/:id/unpublish` | `post_lock → unpublished` |

- **授權：** 僅 Phase 65A `creator_session` cookie；不信任 client 選擇的 `X-User-Id`、body identity 或轉發標頭。
- **Owned list：** `polls` 表單表查詢；**counter-free**（無 options、counters、tokens、ranking、user–option linkage）。
- **公開路由：** vote、Reference Answer、results、feed、notices 等 **未改**。

---

## 3. Phase 65C-A — Live creator frontend cutover

| 頁面 | 行為 |
|------|------|
| `/polls/new?live=1` | `POST /creator/polls` 建立 |
| `/my-polls?live=1` | `GET /creator/polls` 讀取 owned list（**不再**以 `sessionStorage` 為 ownership 來源） |
| Lifecycle 控制 | `POST /creator/polls/:id/cancel\|close\|unpublish` |

- 前端 creator 呼叫使用 `credentials: 'same-origin'`。
- 本機 live：`127.0.0.1` / `localhost` 可在無 session 時呼叫 Phase 65A local-test issuer；**production 仍 fail-closed**。

---

## 4. Phase 65C-B — Legacy creator-write retirement

下列 **legacy** `/polls` creator-write 路由一律 **410**：

- `POST /polls`
- `DELETE /polls/:id`
- `POST /polls/:id/cancel` | `close` | `unpublish`

回應錯誤碼：`LEGACY_CREATOR_WRITE_RETIRED`（訊息導向 `/creator/polls`）。**無** dev / staging / production bypass。

**保留的公開／讀取路由（範例）：** `GET /polls/:id`、`GET /polls/:id/results`、`GET /polls/feed`、`POST` vote / vote-by-index / reference-answer、public notices、scheduler 語意。

---

## 5. 現況剩餘 non-goals

| 項目 | 狀態 |
|------|------|
| Production credential verifier | **未**實作 |
| 完整帳號／profile UX | **未**實作 |
| Eligibility evaluator（年齡／地區等） | **未**實作 |
| Ranking / personalization / feed 契約 | **未**變更 |
| `design-drafts/` | **排除**於 git 與交付範圍 |

**隱私不變：** collecting / cancelled / unpublished / draft 結果路徑仍 counter-free；無 durable user–option linkage。

---

## 6. 建議下一階段

| 建議 | 內容 |
|------|------|
| **Phase 66（plan-only 起點）** | Profile、eligibility、demographic qualification **邊界**規劃 — 哪些欄位可存、如何與 collecting counter-free 及結果顯示分離；**尚非**實作承諾 |

實作 Phase 66 前須讀 Phase 56 eligibility guardrails、`AGENTS.md` Raw Option Linkage Ban，並在 schema／API 變更前 Stop & report。

---

## 7. Live creator 快速對照（本機 `?live=1`）

```
GET  /polls/new?live=1     → POST /creator/polls
GET  /my-polls?live=1      → GET  /creator/polls
Lifecycle buttons          → POST /creator/polls/:id/{cancel|close|unpublish}
Session                    → /creator/session (+ local-test issuer on localhost only)
```

公開投票／結果／探索：**仍**走既有 public `/polls` 路由，**不**使用 creator cookie 授權 Official Vote。

---

## 8. 變更記錄

| Phase | 內容 |
|-------|------|
| 65A | Creator session foundation |
| 65B | `/creator/polls` backend ownership |
| 65C-A | Frontend transport cutover |
| 65C-B | Legacy `/polls` creator-write 410 retirement |
| 65（本文件） | Phase 65 最終檢查點與 Phase 66 規劃入口 |
