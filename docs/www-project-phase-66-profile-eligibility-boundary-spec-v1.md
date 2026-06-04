# WWW Project Phase 66 — Profile / Eligibility / Demographic Qualification Boundary Spec v1

**狀態：** **66A** 為 docs/spec only（**66P-R 已核准**）。**66B** 已交付 schema foundation only（`migrations/010_phase66b_user_profile_foundation.sql`）；不含 runtime、API、vote-by-index、Reference Answer、frontend、evaluator 行為變更。

**Baseline：** `origin/master` @ **`c52fc0e`**（Phase 65 最終檢查點已合併）。

**規範依據：** `AGENTS.md` v0.2（含 Raw Option Linkage Ban、三項 MVP 核心原則）。

**相關既有交付：**

- [Phase 56 eligibility / collecting privacy](./www-project-phase-56-eligibility-collecting-privacy-guardrails-v1.md)
- [Phase 54 `poll_eligibility_rules` foundation](./www-project-phase-54-public-lifecycle-schema-foundation-v1.md)
- [Phase 65 final checkpoint](./www-project-phase-65-final-creator-auth-ownership-checkpoint-v1.md)

---

## 1. Phase 切分

| 代號 | 範圍 | 本文件 |
|------|------|--------|
| **66P-R** | Plan review：邊界、隱私、授權分離、ordering 契約 | **已核准**（本 spec） |
| **66A** | 發布本 spec + README 索引 + docs guard | **已交付** |
| **66B** | 首輪 **schema foundation only**（見 §2） | **已實作：`migrations/010_phase66b_user_profile_foundation.sql`** |
| **66C+** | Profile API、evaluator、frontend、Reference Answer profile 門檻 | **須**另案核准 |

---

## 2. 首輪 schema foundation（66B 邊界）

### 2.1 允許欄位（66B 僅此三類 demographic / profile 基礎）

| 欄位 | 說明 | 備註 |
|------|------|------|
| `display_name` / `nickname` | 顯示用名稱 | 不得用於 option 解析或排序訊號 |
| `birth_year_month` | 出生年月（建議 `YYYY-MM` 或等價正規化） | 供年齡區間 evaluator；不得存精確生日若無獨立核准 |
| `residential_region` | 居住地區（政策定義之枚舉或正規化代碼） | 供地區資格；不得細到可識別個人地址 |

**66B 實作決議：** 既有 `users.display_name` 已作為顯示名稱欄位；66B 僅新增 nullable `users.birth_year_month` 與 `users.residential_region`。未新增 `nickname` 欄位，避免重複 identity surface。

### 2.2 **明確排除：gender**

- **Phase 66 首輪 schema foundation 不得包含 `gender` 或任何性別欄位。**
- Gender 僅能在 **未來獨立設計** 且 **明確使用者／治理核准** 後另開 Phase；66P-R **未**核准 gender 儲存。

### 2.3 66B 非目標（即使僅 migration）

- 不新增 vote-time profile snapshot 表。
- 不新增 user–option linkage 表或欄位。
- 不修改 `poll_eligibility_rules` 語意實作（evaluator 屬 66C+）。
- 不修改 Reference Answer token 表結構以綁定 profile 欄位。

---

## 3. Official Vote（`POST /polls/:id/vote-by-index`）eligibility ordering

下列順序為 **強制契約**；後續實作須在 **同一 transaction** 內遵守（與 Phase 56 一致 spirit，並補齊 index 路徑）：

```
1. Participation guard（既有）
   → poll active, collecting, 未 archive, 未過 closes_at
2. Official Vote trust guard（既有）
3. Profile / poll eligibility evaluation   ← 新增 evaluator 時插入於此
4. Resolve option_index → internal option_id
5. Write vote token / idempotency record
6. Increment counter shard（若適用）
```

**規則：**

- Eligibility **必須**在 **index → option_id 解析之前** 完成（或同時以不洩漏 mapping 的方式失敗）。
- Eligibility **必須**在 **token 寫入之前** 失敗 closed。
- Eligibility **必須**在 **counter 寫入之前** 失敗 closed。
- 不符合資格者 **不得** 留下可重建「選了哪一個 option」的 durable 紀錄（見 §5）。

---

## 4. 不合格回應：不可區分 valid vs invalid `option_index`

當使用者 profile／poll rules 判定 **不符合投票資格** 時：

| 情境 | 對外 HTTP / body 形狀 |
|------|------------------------|
| `option_index` 存在且 poll 收集中 | **與** |
| `option_index` 不存在 | **相同** 之 generic 拒絕（建議單一 4xx + 固定錯誤碼，**無** `option_index` 是否存在之暗示） |

**禁止：**

- 僅因 index 無效而回傳不同 status／錯誤碼，卻因 eligibility 回傳另一種（或反之）。
- 在 response、log、metric label、trace attribute 中附帶「此 index 是否存在」或「差一點就投成功」之訊號。

**允許：** 對 **同一請求類別** 使用固定 machine-readable 錯誤（例如 `VOTE_NOT_ALLOWED`），文案保持 identity-neutral。

---

## 5. Reference Answer（Phase 66 範圍）

- Reference Answer **維持** 現有 **public participation guard**（與 Official Vote 相同之 poll 可參與狀態；見 Phase 56）。
- **Profile / demographic eligibility for Reference Answer** — **延後**；須 **獨立核准設計**（66P-R **未**授權在 66B/66C 預設套用 vote 相同 evaluator）。
- 在獨立設計核准前，**不得** 以 profile 欄位阻擋或允許 Reference Answer 而留下 option 選擇 linkage。

---

## 6. Raw Option Linkage Ban（強制）

任何 **durable** 儲存或 side channel **不得** 同時包含「可識別使用者／session／request／profile eligibility 狀態」與「所選 `option_id`、option 文字、或 `option_index`」。

涵蓋（非窮舉）：

- DB 列、備份、migration 種子
- 應用 log、error payload、debug dump
- metrics、APM trace、analytics event
- cache key/value、ETL、warehouse export

**特別禁止（eligibility 實作常見陷阱）：**

- `ineligible + option_index=3` 之 audit row
- vote rejection log 含 resolved `option_id`
- metric `vote_denied{reason=underage,option_index=2}`

Eligibility 決策若需除錯，僅能使用 **poll-scoped、無 option 維度** 之聚合或內部非生產工具，且須通過隱私 review。

---

## 7. Lifecycle / result privacy（不變）

| `public_lifecycle_state` | `GET /polls/:id/results` | 備註 |
|--------------------------|--------------------------|------|
| `collecting` | counter-free shell | 所有 viewer class 相同 |
| `cancelled` / `unpublished` / `draft` | counter-free unavailable | 不讀 aggregate |
| `revealed` / `locked` / `post_lock` | display-safe aggregate | 唯一允許讀 counter 之公開狀態 |

- Legacy `status='closed'` 或票數門檻 **不得** 單獨揭曉結果。
- Eligibility UI **不得** 在 collecting 對不合格者顯示他人票數或排名訊號（Phase 56）。

---

## 8. Auth 分離（creator vs public）

| 機制 | 範圍 | 不得影響 |
|------|------|----------|
| `creator_session` cookie | `/creator/*`（Phase 65A–65C） | public vote、`vote-by-index`、Reference Answer、public read/result/feed/notices、scheduler |

- Profile 欄位與 eligibility evaluator **不得** 透過 `creator_session` 授權或拒絕 **訪客 Official Vote**。
- Creator 身分與投票者 profile **邏輯分離**；共用 `users` 表時須以 role/用途欄位區分，且不得合併寫入 option linkage。

---

## 9. 實作前檢查清單（66B 起）

- [ ] Migration 僅含 §2.1 三類欄位；**無** gender
- [ ] `vote-by-index` transaction ordering 符合 §3
- [ ] 不合格回應通過 §4 模糊化測試
- [ ] Reference Answer 未套用未核准之 profile eligibility（§5）
- [ ] 日誌／metrics 通過 §6 自檢
- [ ] Results API 仍符合 §7
- [ ] `creator_session` 未進入 public vote 路徑（§8）

若需求衝突 `AGENTS.md` 三原則或 Raw Option Linkage Ban → **Stop & report**，不得 silent 實作。

---

## 10. 明確 non-goals（66A / 66P-R）

- Production credential verifier、完整帳號 UX
- Ranking、personalization、feed 契約變更
- Eligibility evaluator **實作**（僅定邊界）
- Reference Answer profile 門檻
- `design-drafts/` 納入 git

---

## 11. 變更記錄

| 版本 | 內容 |
|------|------|
| v1 / 66A | 66P-R 核准之 profile / eligibility / demographic 邊界 spec |
| v1.1 / 66B | 新增 users profile schema foundation：`birth_year_month`、`residential_region`；沿用 `display_name`；無 gender／evaluator／API 行為變更 |
