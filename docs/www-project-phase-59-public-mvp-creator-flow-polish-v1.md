# WWW Project Phase 59 — Public MVP Creator Flow Polish v1

**狀態：** 已強化即時模式（`?live=1` / `?creator=1`）發起者流程說明；無 schema、API 或 lifecycle 後端變更。

## 涵蓋頁面

| 路徑 | 說明 |
|------|------|
| `/polls/new?live=1` | 建立成功後：下一步、管理連結、操作說明、lifecycle 按鈕 |
| `/my-polls?live=1` | 即時問卷管理區：標題、分享投票連結、管理連結、lifecycle |
| `/results/:id?creator=1` | 發起者操作區：結果公開時機說明、按鈕語意、自動 refresh（Phase 58C/D） |

## 使用者可見重點

- **分享投票：** 建立成功頁與我的問卷皆可複製／開啟投票連結。
- **管理位置：** 建立成功頁、我的問卷、結果頁（`?creator=1`）三處皆可操作 lifecycle。
- **取消／結束收集／下架：** 操作說明區塊以繁中簡述，與 Phase 55C lifecycle 用語一致。
- **結果何時公開：** 須由發起者按下「結束收集並公開結果」；收集中不顯示票數。

## 實作

- 共用模組：`public/frontend/creator-flow-copy.js`
- lifecycle UI：`poll-lifecycle-controls.js`（`flowContext`：`create` | `manage` | `results`）

## 隱私邊界

- `sessionStorage` 仍僅存 `pollId`、`public_lifecycle_state`、可選 `title`。
- 不讀取或顯示 collecting／cancelled／unpublished counters。
