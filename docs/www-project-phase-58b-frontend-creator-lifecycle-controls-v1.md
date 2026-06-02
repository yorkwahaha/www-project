# WWW Project Phase 58B — Frontend Creator Lifecycle Controls v1

**狀態：** 已將發起者操作接上 Phase 57 HTTP（`POST /polls/:id/cancel|close|unpublish`）；無 schema、scheduler 或新公開路由。

## 使用方式（本機即時）

1. 以 `?live=1` 建立問卷：`/polls/new?live=1`
2. 成功後複製投票連結分享，並於成功面板操作「取消問卷」或「結束收集並公開結果」（見 Phase 59 操作說明）
3. 或以 `/my-polls?live=1` 管理同一瀏覽器工作階段內最近建立的問卷（`sessionStorage` 僅存 `pollId` 與 `public_lifecycle_state`，不含選項）
4. 結果頁加上 `?creator=1` 或與已管理問卷相同 `pollId` 時顯示發起者操作區；lifecycle 成功後結果區會自動 re-fetch（Phase 58C/D）

詳見 [Phase 59 發起者流程說明](./www-project-phase-59-public-mvp-creator-flow-polish-v1.md)。

## 隱私邊界

- 不讀取或顯示收集中 aggregate；沿用 Phase 55C lifecycle 渲染。
- 確認對話框與錯誤訊息為繁中、不含 `option_id` 或票數。
