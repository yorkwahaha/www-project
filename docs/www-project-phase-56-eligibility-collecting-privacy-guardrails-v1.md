# WWW Project Phase 56 — Eligibility and Collecting Privacy Guardrails v1

**狀態：** 已實作最小 backend/service 護欄；不含完整 eligibility rule engine。

## 1. 已實作

- 公開 `GET /polls/:id/results` 在 `collecting` 時維持 identity-neutral counter-free shell。
- Guest、Creator、目前不符合 Official Vote trust 條件者、符合 Official Vote trust 條件者都取得相同 collecting shell。
- `listVoteAggregatesByPollId` 仍只允許在 `public_lifecycle_state` 為 `revealed`、`locked`、`post_lock` 時呼叫。
- Official Vote 與 Reference Answer 共用 participation guard：只允許 `status='active'` 且 `public_lifecycle_state='collecting'`、未 archive、未超過 `closes_at` 的問卷。
- 既有 Official Vote trust 條件維持：不符合條件者不得投 Official Vote。
- `suspended`／`correction_pending` 公開讀取維持 fail-closed `404`。

## 2. 尚未實作

- `poll_eligibility_rules` 仍是 schema foundation。現有 `users` 沒有 age／region profile 欄位，因此本 Phase 不實作 age／region evaluator。
- 不新增 eligibility snapshot、vote-time profile snapshot、user-option linkage、notification、follow、trust scoring 或 frontend eligibility UI。
- 後續若實作完整 eligibility engine，必須在 Official Vote transaction 內於 option resolve 與 counter increment 前完成檢查，且不得把 eligibility 與 option choice 綁定寫入 durable storage、logs、metrics、APM 或 error payload。

## 3. 驗證重點

- collecting shell 對所有 viewer class 相同且不讀 aggregate。
- `status='closed'` 與 `total >= 30` 都不能觸發 reveal。
- 只有明確 lifecycle `revealed`／`locked`／`post_lock` 可讀 display-safe aggregate。
- 非 collecting lifecycle 的 Official Vote 不新增 token 或 counter。
