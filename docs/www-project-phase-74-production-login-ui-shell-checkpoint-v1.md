# WWW Project Phase 74 — Production Login UI Shell / Auth State UX Foundation v1

**狀態：** 檢查點／前端靜態 UX shell（**無** login API、session DB、verifier runtime 變更、migration、或 protected route 行為變更）。

**Baseline：** `origin/master` @ **`6fd5d03`**（Phase 73 production login/session UX plan）。

**規範依據：** Phase 73 plan、Phase 70 final auth boundary checkpoint、`AGENTS.md` v0.2、Raw Option Linkage Ban。

---

## 1. 交付摘要

| 項目 | 交付 |
|------|------|
| 靜態登入 shell | `GET /login` → `public/login.html` + `public/frontend/login-page.js` |
| 導覽 | 訪客 header「登入」「註冊 / 開始使用」連至 `/login` |
| 文案 | 正式登入尚未啟用、production fail-closed、local demo 測試身份說明 |
| 表單 | 預留欄位與停用送出；**不**呼叫登入 API、**不**寫入 browser storage |
| Server route | `src/http/server.ts` 靜態檔路由 |
| Tests | `tests/frontend/login-page.test.ts`、`tests/frontend/phase-74-login-shell-copy-guard.test.ts`、`tests/http/frontend-page.test.ts` |

---

## 2. 明確 non-goals（本 phase 未做）

- 不實作 login submit、logout、session issuance、cookie 核發。
- 不新增 migration / session DB。
- 不改 `UserAuthResolver`、production verifier、`USER_AUTH_CREDENTIALS_JSON` 行為。
- 不改 `/users/me/profile`、Official Vote、`vote-by-index`、creator routes、Reference Answer API 或 transaction order。
- 不改 profile eligibility evaluator、vote token / counter schema。
- 不新增 option choice + user/session/device/request/log/trace/metric/error payload linkage。
- 不新增 demographic breakdown、ranking personalization、analytics linkage、精準位置或額外 profile 欄位。

---

## 3. Auth / privacy 邊界（維持）

| 邊界 | 狀態 |
|------|------|
| Production protected routes | 仍僅 `UserAuthResolver`；缺少 verifier 時 fail-closed |
| `creator_session` | 仍為 local/demo/test non-production identity；shell 文案明確排除為 production public auth |
| Reference Answer | 未切 production login；不接 profile eligibility |
| Login shell | 不儲存 credential、不連結 selected option、不送 analytics |
| Vote token schema | 維持 `user_id + poll_id`（不含 selected option） |
| Counter schema | 維持 `poll_id + option_id + shard_id`（不含 user/session identity） |

---

## 4. 建議下一階段

1. **Phase 75+（implementation）** — 依 Phase 73 接上 approved credential transport 與可運作的 login/logout flow。
2. **Frontend cutover** — profile / vote / creator live pages 改送 formal credential，移除 production 對 MVP `X-User-Id` 的依賴。

---

## 5. 驗證

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

Docs guard：`tests/docs/phase-74-production-login-ui-shell-checkpoint-doc.test.ts`

`design-drafts/` **排除**於 git 與交付範圍。
