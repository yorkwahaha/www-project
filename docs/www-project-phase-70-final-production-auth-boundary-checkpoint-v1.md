# WWW Project Phase 70 — Final Production Auth Boundary Cutover Checkpoint v1

**狀態：** 檢查點／交接文件（**僅文件**；不含 schema、API、runtime、frontend、migration 或 scheduler **行為變更**）。

**Baseline：** `origin/master` @ **`33b6abf`**（Phase 70 → 70A → 70B → 70C → 70D 已合併；production auth boundary route adapter cutover 封板）。

**規範依據：** `AGENTS.md` v0.2（含 Raw Option Linkage Ban、三項 MVP 核心原則）。

**子階段規格與交付：**

- [Phase 70 production user auth / account boundary plan](./www-project-phase-70-production-user-auth-account-boundary-plan-v1.md)
- [Phase 70C Official Vote UserAuth cutover plan](./www-project-phase-70c-official-vote-user-auth-cutover-plan-v1.md)
- [Phase 70D-P production creator_session strategy plan](./www-project-phase-70d-production-creator-session-strategy-plan-v1.md)
- [Phase 70D-I-A creator route adapter UserAuth cutover plan](./www-project-phase-70d-creator-route-adapter-userauth-cutover-plan-v1.md)
- [Phase 65 final creator auth / ownership checkpoint](./www-project-phase-65-final-creator-auth-ownership-checkpoint-v1.md)
- [Phase 66 final profile eligibility checkpoint](./www-project-phase-66-final-profile-eligibility-checkpoint-v1.md)

---

## 1. Phase 70 子階段完成摘要

| 代號 | 交付 | 狀態 |
|------|------|------|
| **70（plan）** | Production user auth / account boundary plan — 定義正式 user identity 邊界、route cutover 原則、Raw Option Linkage Ban 與 creator / vote / profile / Reference Answer 分離 | **完成（文件）** |
| **70A** | `src/auth/user-auth-resolver.ts` — `UserAuthResolver` / `AuthenticatedUserContext`；production fail-closed；local/demo/test 明確 MVP `X-User-Id` 相容（標記為 non-production） | **完成** |
| **70B** | `GET` / `PUT` `/users/me/profile` route adapter 改走 `UserAuthResolver`；production 不信任 raw `X-User-Id`；`creator_session` 不授權 profile | **完成** |
| **70C-P** | Official Vote / `vote-by-index` UserAuth cutover 規劃（僅文件） | **完成（文件）** |
| **70C-I** | `POST /polls/:id/vote`、`POST /polls/:id/vote-by-index` route adapter 改走 `UserAuthResolver`；transaction order 不變 | **完成** |
| **70D-P** | Production `creator_session` strategy — Option A：local/demo-only cookie；production `/creator/*` 走 formal user auth + ownership | **完成（文件）** |
| **70D-I-A** | Creator route adapter UserAuth cutover 規劃（僅文件） | **完成（文件）** |
| **70D-I-B** | Production `/creator/polls` 與 production `GET /creator/session` 改走 `UserAuthResolver` + ownership checks；`POST /creator/session` production issuance 維持 fail-closed | **完成** |

---

## 2. 現行 Production Auth Identity 邊界

| Surface | Production identity | Route adapter | 備註 |
|---------|---------------------|---------------|------|
| `/users/me/profile` | `UserAuthResolver` → `auth.user_id` | `src/http/user-profile-routes.ts` | `creator_session` **不**授權 |
| Official Vote `POST /polls/:id/vote` | `UserAuthResolver` → `auth.user_id` | `src/http/poll-routes.ts` → `official-vote-routes.ts` | `creator_session` **不**授權 |
| `vote-by-index` `POST /polls/:id/vote-by-index` | `UserAuthResolver` → `auth.user_id` | 同上 | eligibility **在** option resolve 之前 |
| `/creator/polls` 與 lifecycle mutations | `UserAuthResolver` → `auth.user_id` + `polls.creator_id` ownership | `src/http/creator-poll-routes.ts` | Origin gate 不變 |
| `GET /creator/session`（production） | `UserAuthResolver`（忽略 `creator_session` cookie） | `src/http/creator-session-routes.ts` | 已驗證回 `{ authenticated: true }` |
| `POST /creator/session`（production） | **fail-closed** — `CREATOR_SESSION_ISSUER_UNAVAILABLE` | 同上 | 不核發 cookie |
| `DELETE /creator/session`（production） | 清除 local/demo cookie path；**不**作為 formal user logout | 同上 | 不影響 formal user auth |
| Reference Answer `POST /polls/:id/reference-answer` | 既有 public participation identity（`requireUserId` / MVP `X-User-Id`） | `src/http/poll-routes.ts` | **未**切 `UserAuthResolver`；**不**接 profile eligibility |
| Public reads | Anonymous / display-safe | 既有 public routes | 無 viewer-specific vote/profile state |

### 2.1 `creator_session` 定位

- **Local/demo/test：** 明確 non-production identity；`APP_ENV=development|test` + `CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED=true` 可本機核發；`/creator/*` 優先 cookie，其次 `UserAuthResolver` MVP header。
- **Production：** **不是** public vote、profile、Reference Answer 或 general user auth identity；僅作為 local/demo cookie 清除路徑殘留處理；production `/creator/*` poll authority 來自 `UserAuthResolver`。

### 2.2 Production fail-closed 規則

當 `APP_ENV=production` 且 **未** 設定 `UserAuthResolver` trusted credential verifier 時：

- `/users/me/profile`、`Official Vote`、`vote-by-index`、production `/creator/polls` → `401 AUTH_REQUIRED`
- `POST /creator/session` → `503 CREATOR_SESSION_ISSUER_UNAVAILABLE`
- Raw `X-User-Id`、body/query user ID、forwarded identity headers、`creator_session` **均不得** 作為 production account proof

Local/demo/test 保留明確 MVP `X-User-Id` 與 `creator_session` 相容路徑，**必須** 在測試與文件中標記為 non-production identity。

---

## 3. 核心 Invariants（封板後必須維持）

### 3.1 Identity invariants

- Raw `X-User-Id` **不可** 作為 production identity（route adapter 必須經 `UserAuthResolver`）。
- `creator_session` **不可** 授權 public Official Vote、`vote-by-index`、`GET`/`PUT` `/users/me/profile`、Reference Answer。
- Production `/creator/*` poll mutations 必須以 `UserAuthResolver` `user_id` 加上既有 ownership checks；client 選擇的 body/header/query/cookie identity **不得** 覆寫 creator principal。

### 3.2 Official Vote durable shapes

- Vote token：`user_id + poll_id`（**不含** selected option）
- Sharded counter：`poll_id + option_id + shard_id`（**不含** user、session、request、profile identity）

### 3.3 `vote-by-index` transaction order

強制順序（`castOfficialVote`）維持不變：

```
1. Participation guard
2. Official Vote trust guard
3. Profile / poll eligibility evaluation
4. Resolve option_index → internal option_id
5. Write vote token / idempotency
6. Increment counter shard
```

Eligibility **必須**在 option resolve、token 寫入、counter 增量 **之前** fail closed。

### 3.4 Reference Answer boundary

- **未**切 `UserAuthResolver`。
- **未**呼叫 `isProfileEligibleForOfficialVote`。
- **不得** 將 profile eligibility 或 production user auth context 附加到 selected Reference Answer choice。
- 未來若要做 Reference Answer user auth cutover，**須另開 phase** 並通過 High review。

### 3.5 Raw Option Linkage Ban

**維持非協商：**

- 禁止 durable `user_id + poll_id + option_id`、`session + poll_id + option_index`、`request_id + user_id + option_text` 等 option-level linkage。
- 禁止 logs / metrics / APM traces / caches / debug payloads / analytics / error payloads 將 profile、session、request、creator identity 與 selected option 連結。
- 禁止新增 `gender`、精確生日、地址、GPS、geocode、精準位置或等價欄位作為 vote-time linkage 載體。

### 3.6 Creator-owned list

- Owned list 維持 bounded（上限 50）、deterministic、polls-table-only、**counter-free**。
- 無 `/creator/polls/:id/results` route（public results 仍為 `GET /polls/:id/results`）。

---

## 4. Runtime 實作對照（封板時）

| 模組 | 路徑 | 職責 |
|------|------|------|
| UserAuthResolver | `src/auth/user-auth-resolver.ts` | production / local_demo / test identity resolution |
| Profile routes | `src/http/user-profile-routes.ts` | `requireAuthenticatedUserId` → `userAuthResolver.resolveUserAuth` |
| Official Vote routes | `src/http/official-vote-routes.ts` | `requirePublicVoteUserAuth` |
| Poll route wiring | `src/http/poll-routes.ts` | vote / vote-by-index → `UserAuthResolver`；Reference Answer → `requireUserId` |
| Creator route auth | `src/http/creator-auth.ts` | `requireCreatorRouteUserId` |
| Creator poll routes | `src/http/creator-poll-routes.ts` | ownership service calls with resolver `user_id` |
| Creator session routes | `src/http/creator-session-routes.ts` | production GET → resolver；POST issuance fail-closed |
| HTTP server wiring | `src/http/server.ts` | 注入共用 `userAuthResolver` |

### 4.1 重點測試 guard

| 測試 | 驗證 |
|------|------|
| `tests/auth/user-auth-resolver.test.ts` | resolver production fail-closed、local/test MVP header |
| `tests/http/profile-api-auth-source-guard.test.ts` | profile 不直接讀 `X-User-Id` |
| `tests/http/user-profile-routes.test.ts` | `creator_session` 不授權 profile |
| `tests/http/official-vote-route-auth-source-guard.test.ts` | vote 走 resolver；Reference Answer 分離 |
| `tests/http/official-vote-route-auth.test.ts` | production raw header 拒絕、trusted verifier 接受 |
| `tests/http/creator-route-auth-source-guard.test.ts` | creator polls 走 resolver |
| `tests/http/creator-route-user-auth-cutover.test.ts` | production/local creator cutover |
| `tests/http/creator-session-public-read-boundary.test.ts` | `creator_session` 不影響 public read |
| `tests/http/reference-answer-hardening.test.ts` | Reference Answer 不接 profile eligibility / creator cookie |

---

## 5. Local / Demo 與 Production 差異（刻意保留）

| 能力 | Local/demo/test | Production |
|------|-----------------|------------|
| MVP `X-User-Id` header | 明確相容（non-production） | **拒絕**（無 trusted verifier 時 fail-closed） |
| `creator_session` issuance | localhost + issuer config | **fail-closed** |
| `/creator/polls` auth | cookie 優先，其次 resolver header | **僅** `UserAuthResolver` |
| Frontend profile / vote UX | 仍送 MVP `X-User-Id`（demo） | **尚未** production login UX |

`npm run smoke:public:local` 與 `npm run demo:public:local` 驗證的是 **local demo** 路徑，**不是** production credential verifier 就緒證明。

---

## 6. 已知剩餘工作（Phase 70 封板後）

| 項目 | 狀態 | 說明 |
|------|------|------|
| Production credential verifier | **未實作** | 須注入 `UserAuthResolver` `trustedCredentialVerifier`（session/JWT/OAuth 等） |
| Formal user session integration | **未實作** | 登入、登出、session TTL、cookie policy 屬後續 High-reviewed phase |
| Frontend production login UX | **未實作** | 瀏覽器仍使用 MVP demo `X-User-Id`；須與 verifier 同步 cutover |
| Reference Answer UserAuth cutover | **未規劃實作** | 若要做須另開 phase；維持與 profile eligibility 分離 |
| `/creator/polls/:id/results` | **不存在** | 未來獨立 scope |
| Account ID ↔ `polls.creator_id` mapping | **假設一致** | 若 production account ID 與既有 demo creator ID 分歧，須 High-reviewed migration / adapter plan |
| Ranking / feed personalization / governance | **未變** | 不在 Phase 70 scope |

---

## 7. 建議下一階段入口

1. **Production credential verifier design（High review）** — 選定 session/JWT 形狀、注入 `createUserAuthResolverFromEnv` trusted verifier、staging 驗證。
2. **Frontend auth cutover** — profile / vote / creator live pages 改為 formal session transport；移除 production 對 MVP `X-User-Id` 的依賴。
3. **Reference Answer auth（optional, separate phase）** — 僅在產品明確要求時規劃；不得預設接入 profile eligibility。

實作上述任一項前須重讀本 checkpoint、Phase 70 plan、Phase 65/66 checkpoints，以及 Raw Option Linkage Ban。任何 durable selected-option linkage 或 vote transaction order 變更須 **Stop & report**。

---

## 8. Live 快速對照（封板後）

```
Production identity (APP_ENV=production, trusted verifier required):
  GET/PUT /users/me/profile     → UserAuthResolver
  POST /polls/:id/vote          → UserAuthResolver
  POST /polls/:id/vote-by-index → UserAuthResolver
  /creator/polls*               → UserAuthResolver + ownership
  POST /creator/session         → fail-closed (503)
  POST /polls/:id/reference-answer → legacy requireUserId (not UserAuthResolver)

Local/demo (APP_ENV=development|test):
  /creator/*                    → creator_session cookie and/or MVP X-User-Id
  /profile, vote                → MVP X-User-Id via UserAuthResolver local path
```

---

## 9. 驗證要求（本 checkpoint 文件）

```text
git diff --check
npm run typecheck
npm test
npm run build
```

Docs guard：`tests/docs/phase-70-final-production-auth-boundary-checkpoint-doc.test.ts`

---

## 10. 變更記錄

| Phase | 內容 |
|-------|------|
| 70（plan） | Production user auth / account boundary plan |
| 70A | UserAuthResolver foundation |
| 70B | Profile API route adapter cutover |
| 70C-P | Official Vote cutover plan |
| 70C-I | Official Vote / vote-by-index route adapter cutover |
| 70D-P | creator_session strategy plan |
| 70D-I-A | Creator route cutover plan |
| 70D-I-B | Creator route adapter cutover implementation |
| 70（本文件） | Phase 70 final production auth boundary checkpoint |

`design-drafts/` **排除**於 git 與交付範圍。
