# WWW Project Phase 68 — Public Demo Polish & Manual QA Closure v1

**狀態：** Demo／QA 封板（**僅**公開文案、README、FAQ、manual QA、demo handoff、copy guard；不含 schema、auth、evaluator、transaction、Reference Answer scope）。

**Baseline：** `origin/master` @ **`8701bbe`**（Phase 65–67 已合併）。

**規範依據：** `AGENTS.md` v0.2。

**主文件（測試者請從此開始）：**

| 順序 | 文件 |
|------|------|
| 1 | [`www-project-local-demo-startup-v1.md`](./www-project-local-demo-startup-v1.md) |
| 2 | [`www-project-public-mvp-manual-qa-v1.md`](./www-project-public-mvp-manual-qa-v1.md) — **§3.10 整合主流程** |
| 3 | [`www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md`](./www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md) |
| 4 | [`www-project-phase-67-profile-eligibility-demo-qa-v1.md`](./www-project-phase-67-profile-eligibility-demo-qa-v1.md) |
| 5 | [`www-project-public-mvp-demo-release-handoff-v1.md`](./www-project-public-mvp-demo-release-handoff-v1.md) |

---

## 1. 公開 demo 建議測試順序（Phase 68）

| # | 步驟 | 路由 | Auth／備註 |
|---|------|------|------------|
| 1 | 啟動 | `npm run demo:public:local` | `www_test` + demo 投票者種子 |
| 2 | 建立問卷 | `/polls/new?live=1` | **`creator_session`**（本機 local-test issuer） |
| 3 | 管理問卷 | `/my-polls?live=1` | 同上；**不是** `X-User-Id` |
| 4 | 設定 profile | `/profile` | **MVP `X-User-Id`**；**不是** creator cookie |
| 5 | 投票（合格） | `/vote/<pollId>` | `X-User-Id` + `vote-by-index` |
| 6 | 投票（不合格，進階） | 同上 + §67 SQL 規則 | 固定資格拒絕文案 |
| 7 | Reference Answer | API／整合測試 | **不接** profile eligibility |
| 8 | 結果（訪客） | `/results/<pollId>` | collecting → counter-free |
| 9 | 結果（發起者） | `/results/<pollId>?creator=1` | lifecycle + refresh |

**`smoke:public:local`** 可替代 §1–2、5、8 的部分 HTTP 檢查；**不能**取代 profile 表單、固定拒絕文案、手機 RWD、creator UI 按鈕操作。

---

## 2. Auth 與 session（測試者必讀）

| 機制 | 服務範圍 | 說明 |
|------|----------|------|
| **`creator_session` cookie** | `/creator/*` 寫入 | 發起者建立／lifecycle；**不是**一般使用者登入 |
| **`X-User-Id` header** | 公開 vote、profile API | **MVP demo-style**；本機 `127.0.0.1` 固定投票者 A；`?demoVoter=b` 為 B |
| **Production auth** | — | **production user-auth wiring later**；OAuth／session／JWT **尚未**實作 |

**禁止誤解：** 不要把 `creator_session` 當成 profile 或投票的「已登入帳號」；不要把 `?nav=logged-in-mock` 當成真實登入。

---

## 3. Profile／eligibility（Phase 66–67 封板，本 Phase 不變）

- 欄位：僅 `birth_year_month`、`residential_region`（粗粒度）。
- **不收：** gender、精確生日、地址、GPS、geocode、精準位置。
- Official Vote：evaluator 已接上；transaction order **不變**。
- Reference Answer：**不接** profile eligibility。
- 不合格 UI：固定「你目前不符合此問卷的投票資格。」— 不揭露 option／index／精確條件。
- **Raw Option Linkage Ban** 維持。
- `design-drafts/` **排除**於 git 與交付；**勿** commit。

---

## 4. 變更記錄

| Phase | 內容 |
|-------|------|
| 68 | README demo 順序、manual QA §3.10、FAQ／handoff、公開頁文案一致、copy guard |
