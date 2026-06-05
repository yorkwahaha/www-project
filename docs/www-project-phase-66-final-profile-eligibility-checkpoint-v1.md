# WWW Project Phase 66 — Final Profile Eligibility Checkpoint v1

**狀態：** 檢查點／交接文件（**僅文件**；不含 schema、API、runtime、frontend、migration 或 scheduler **行為變更**）。

**Baseline：** `origin/master` @ **`8c9140a`**（Phase 66A → 66F 已合併；profile eligibility / profile API / profile UX 封板）。

**規範依據：** `AGENTS.md` v0.2（含 Raw Option Linkage Ban、三項 MVP 核心原則）。

**子階段規格與交付：**

- [66A Profile / eligibility boundary spec](./www-project-phase-66-profile-eligibility-boundary-spec-v1.md)
- [66B Schema](../migrations/010_phase66b_user_profile_foundation.sql)
- [66C Evaluator](./www-project-phase-66-profile-eligibility-boundary-spec-v1.md)（§3、§4；`src/polls/profile-eligibility.ts`）
- [66E-P Profile API plan](./www-project-phase-66e-profile-update-api-plan-v1.md) → **66E-A** 實作
- [66F-P Profile UX plan](./www-project-phase-66f-profile-ux-onboarding-plan-v1.md) → **66F** 前端 `/profile`

---

## 1. Phase 66A～66F 完成摘要

| 代號 | 交付 | 狀態 |
|------|------|------|
| **66A** | 66P-R 核准之 profile / eligibility / demographic 邊界 spec；README 索引 + docs guard | **完成** |
| **66B** | `migrations/010_phase66b_user_profile_foundation.sql` — nullable `users.birth_year_month`、`users.residential_region`；沿用 `display_name` | **完成** |
| **66C** | Official Vote profile eligibility evaluator；`vote-by-index` transaction 內於 option resolve / token / counter **之前** fail closed | **完成** |
| **66D** | Eligibility **route boundary** 測試強化（`vote-by-index`、Official Vote、Reference Answer 邊界；Reference Answer **不**套用 profile evaluator） | **完成** |
| **66E-P** | Profile update API 規劃（僅文件） | **完成** |
| **66E-A** | `GET` / `PUT` `/users/me/profile` — 僅兩欄可讀寫 | **完成** |
| **66F-P** | Profile UX / onboarding 規劃（僅文件） | **完成** |
| **66F** | 前端 `GET /profile` — 出生年月 + 粗粒度地區；`credentials: omit` + `X-User-Id` | **完成** |

---

## 2. Schema：`birth_year_month`、`residential_region`

| 允許（66B 起） | 說明 |
|----------------|------|
| `users.birth_year_month` | 出生年月（`YYYY-MM` / month 正規化）；供年齡區間 evaluator |
| `users.residential_region` | 粗粒度居住地區代碼（政策枚舉）；供地區資格 |
| `users.display_name` | 既有顯示名稱；**非** 66B 新增 |

**明確排除（首輪與 Phase 66 封板範圍）：**

- `gender` 或任何性別欄位
- 精確生日、完整出生日、timestamp 化年齡
- 地址、GPS、geocode、郵遞區域、可識別個人之精準位置
- vote-time profile snapshot、user–option linkage 表

---

## 3. Official Vote profile eligibility evaluator

- 實作：`src/polls/profile-eligibility.ts` — `isProfileEligibleForOfficialVote(user, poll_eligibility_rules)`。
- 套用路徑：Official Vote 與 `POST /polls/:id/vote-by-index`（經 `castOfficialVote`）。
- 規則類型：`unrestricted`、`age`、`region`、`age_region`（對應 Phase 54 `poll_eligibility_rules`）。
- 不合格：固定 `PollForbiddenError` + `OFFICIAL_VOTE_ELIGIBILITY_MESSAGE`（不洩漏 option 是否存在）。

---

## 4. `vote-by-index` eligibility ordering

**強制 transaction 順序**（`src/polls/repository.ts` `castOfficialVote`）：

```
1. Participation guard（poll 存在、collecting、未 archive）
2. Official Vote trust guard（official-trust user）
3. Profile / poll eligibility evaluation   ← 66C
4. Resolve option_index → internal option_id
5. Write vote token / idempotency
6. Increment counter shard
```

Eligibility **必須**在 option resolve、token 寫入、counter 增量 **之前** 失敗 closed。

不合格時，**不得**對外區分「index 無效」與「profile 不符合」（見 boundary spec §4）。

---

## 5. Reference Answer 不接 profile eligibility

- `POST /polls/:id/reference-answer` 僅保留既有 **public participation guard**。
- **未**呼叫 `isProfileEligibleForOfficialVote`。
- Reference Answer profile 門檻須 **未來獨立核准**；66P-R **未**授權預設與 Official Vote 共用 evaluator。

---

## 6. Profile API：`GET` / `PUT` `/users/me/profile`

| Method | Path | 行為 |
|--------|------|------|
| `GET` | `/users/me/profile` | 回傳 `{ birth_year_month, residential_region }`（可 null） |
| `PUT` | `/users/me/profile` | 僅接受上述兩欄；拒絕 gender、精確生日、地址、option/vote 欄位 |

- 授權：**user auth**（目前 MVP：`X-User-Id`）；**不得**以 `creator_session` 作為 profile 權限來源。
- 不寫入 vote token、counter、eligibility snapshot 或 option linkage。

---

## 7. Frontend profile UX：`/profile`

| 項目 | 行為 |
|------|------|
| 路由 | `GET /profile` → `public/profile.html` + `public/frontend/profile-page.js` |
| 欄位 | `<input type="month" name="birth_year_month">`、`<select name="residential_region">`（粗粒度 TW 代碼） |
| API | `GET` / `PUT` `/users/me/profile`，headers：`X-User-Id`；`credentials: 'omit'`（不送 creator cookie） |
| 操作 | 儲存、清除欄位（nullable PUT） |
| 導覽 | `public-mvp-layout.js` 含「個人資料」連結 |

投票頁不合格提示使用固定文案（`POLICY_UI_COPY.eligibilityIneligible`），不揭露 `option_index` / `option_id`。

---

## 8. `creator_session` 不影響 public / profile / vote / Reference Answer

| 機制 | 範圍 | 不得影響 |
|------|------|----------|
| `creator_session` cookie | `/creator/*`（Phase 65） | `/users/me/profile`、`/profile`、public vote、`vote-by-index`、Reference Answer、public read/results/feed |

Profile 與 eligibility **邏輯分離**於 creator 身分；共用 `users` 表但不以 creator cookie 授權訪客投票或 profile 寫入。

---

## 9. Raw Option Linkage Ban（維持）

任何 **durable** 儲存或 side channel **不得** 同時包含可識別使用者／profile eligibility 狀態與所選 `option_id`、`option_index` 或 option 文字。

Phase 66 實作須遵守：

- 不合格 vote **不** 寫 token / counter
- rejection log / metric **不** 含 `option_index` 或 resolved `option_id`
- profile API / UX **不** 持久化 option 選擇

詳見 [66A boundary spec §6](./www-project-phase-66-profile-eligibility-boundary-spec-v1.md)。

---

## 10. Manual QA checklist（profile 封板）

**前置：** `npm run migrate`（或 demo DB）、`npm start`；本機 demo 使用者已種子（見 `docs/www-project-local-demo-startup-v1.md`）。

| # | 步驟 | 預期 |
|---|------|------|
| 1 | `GET /profile` | 僅見出生年月、居住地區；無性別／地址／精準定位欄位 |
| 2 | 填寫 `1998-07` + `TW-TPE` → **儲存** | 成功訊息；重新整理後欄位保留 |
| 3 | **清除欄位** → 儲存 | API 接受 null；頁面顯示未填寫 |
| 4 | 對有 age/region 規則且 profile 不符的 poll → `POST .../vote-by-index` | 固定資格拒絕文案；**不**暗示哪個 index 有效 |
| 5 | 同一 poll → Reference Answer | **不因** profile 欄位額外阻擋（僅 participation guard） |
| 6 | 手機寬度（≤390px） | 表單可讀、按鈕可點、無橫向溢出 |
| 7 | Network：`/users/me/profile` | 僅 `X-User-Id`；無 `creator_session` Cookie |

---

## 11. 已知限制

| 項目 | 狀態 |
|------|------|
| Frontend / public API user auth | **仍為 MVP demo-style `X-User-Id`**（本機固定或 runtime header）；**非** production credential verifier |
| Production user-auth wiring | **Later** — production user-auth wiring later；OAuth / session / JWT 等須另 Phase 核准 |
| Reference Answer profile eligibility | **未**實作 |
| Ranking / personalization / demographic breakdown | **未**變更 |
| `design-drafts/` | **排除**於 git 與交付；**勿** commit |

---

## 12. 變更記錄

| Phase | 內容 |
|-------|------|
| 66A | Profile eligibility boundary spec |
| 66B | User profile schema foundation |
| 66C | Official Vote profile eligibility evaluator |
| 66D | Eligibility route boundary test hardening |
| 66E-P / 66E-A | Profile API plan + `GET`/`PUT` `/users/me/profile` |
| 66F-P / 66F | Profile UX plan + `/profile` frontend |
| 66（本文件） | Phase 66 最終檢查點 — profile eligibility / API / UX 封板 |
