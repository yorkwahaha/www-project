# WWW Project Phase 58B — Frontend Creator Lifecycle Controls v1

**狀態：** 已將發起者操作接上 Phase 57 HTTP（`POST /polls/:id/cancel|close|unpublish`）；無 schema、scheduler 或新公開路由。

## 使用方式（本機即時）

1. 以 `?live=1` 建立問卷：`/polls/new?live=1`
2. 成功後於成功面板操作「取消問卷」或「結束收集並公開結果」
3. 或以 `/my-polls?live=1` 管理同一瀏覽器工作階段內最近建立的問卷（`sessionStorage` 僅存 `pollId` 與 `public_lifecycle_state`，不含選項）
4. 結果頁加上 `?creator=1` 或與已管理問卷相同 `pollId` 時顯示發起者操作區

## 隱私邊界

- 不讀取或顯示收集中 aggregate；沿用 Phase 55C lifecycle 渲染。
- 確認對話框與錯誤訊息為繁中、不含 `option_id` 或票數。
