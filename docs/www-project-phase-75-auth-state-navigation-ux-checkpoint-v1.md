# WWW Project Phase 75 — Auth State Display / Navigation UX Polish v1

**狀態：** 檢查點／前端靜態 UX polish（**無** login API、session DB、verifier runtime 變更、migration、或 protected route 行為變更）。

**Baseline：** `origin/master` @ **`9f37e73`**（Phase 74 production login UI shell）。

**規範依據：** Phase 74 checkpoint、Phase 73 plan、Phase 70 final auth boundary checkpoint、`AGENTS.md` v0.2、Raw Option Linkage Ban。

---

## 1. 交付摘要

| 項目 | 交付 |
|------|------|
| 共用文案 | `public/frontend/auth-state-copy.js` — 正式登入尚未啟用、MVP 測試身份、`creator_session` 邊界 |
| 導覽列 | `public-mvp-layout.js` — header auth state chip、訪客 CTA 與 `/login` 一致 |
| 頁面橫幅 | `renderAuthStateBanner` — 首頁／profile／vote／my-polls 等共用身分說明（login shell 頁除外） |
| 導覽展示切換 | `enhanceDemoNavSwitch` — 「訪客導覽／展示用已登入導覽」文案，避免誤解為真實登入 |
| 頁面文案 | `index.html`、`profile.html`、`vote.html`、`my-polls.html` 身分提示對齊 |
| 樣式 | `public-mvp.css` — `.mvp-auth-state-chip`、`.mvp-auth-state-banner` |
| Tests | layout、a11y、copy guard、checkpoint doc guard |

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
| `creator_session` | 仍為 local/demo/test non-production identity；UI 明確標示僅 `/creator/*` |
| MVP `X-User-Id` | 仍為 local/demo/test profile／vote 示範；header chip 標示非正式登入 |
| Reference Answer | 未切 production login；不接 profile eligibility |
| Navigation polish | 不儲存 credential、不連結 selected option、不送 analytics |
| Vote token schema | 維持 `user_id + poll_id`（不含 selected option） |
| Counter schema | 維持 `poll_id + option_id + shard_id`（不含 user/session identity） |

---

## 4. 建議下一階段

1. **Phase 76+（implementation）** — 依 Phase 73 接上 approved credential transport 與可運作的 login/logout flow。
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

Docs guard：`tests/docs/phase-75-auth-state-navigation-ux-checkpoint-doc.test.ts`

`design-drafts/` **排除**於 git 與交付範圍。
