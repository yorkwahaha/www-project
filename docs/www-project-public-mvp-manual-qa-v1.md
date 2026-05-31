# WWW Project — 公開 MVP 手動測試交接（v1）

適用範圍：公開流程 `/` → `/polls/new` → `/vote/:pollId` → `/results/:pollId`（Phase 23–27 基線）。

規範依據：`AGENTS.md` v0.2、`docs/www-project-agent-spec-v0.1.md`。

---

## 1. 本機啟動前提

- **Node.js** 20+
- **PostgreSQL**（本機開發建議使用專案 Docker 測試／開發用資料庫；勿將 `DATABASE_URL`、admin token 寫入版本庫）
- 已執行 `npm install`
- 遷移已套用至目標資料庫（見下方驗證命令中的 `migrate`）
- 啟動 API 與靜態公開頁：

```bash
# 設定 DATABASE_URL 後
npm run migrate
npm run build
npm start
```

預設 HTTP 服務會提供首頁、建立問卷、投票、結果等靜態頁與既有 JSON API。

整合／煙霧測試若需隔離資料庫 `www_test`，可沿用 `docker compose -f docker-compose.test.yml`（容器 `wwwproject-postgres-1`）；手動瀏覽器測試則指向你實際 `DATABASE_URL` 對應的實例即可。

---

## 2. 建議先跑的驗證命令

```bash
git diff --check
npm run typecheck
npm run build
npm test
npm run smoke:public:local
npm run smoke:admin:local
npm run test:integration:local
```

全部通過後再進行下方手動流程。`smoke:public:local` 不取代瀏覽器操作，但可確認路由與公開 JSON 未洩漏 `option_id`、vote token、shard 等欄位。

---

## 3. 手動測試流程

### 3.1 打開首頁

1. 瀏覽器開啟 `GET /`。
2. 確認有「建立問卷」入口，且頁面**未**出現登入、問卷列表、熱門排行。

### 3.2 建立問卷

1. 進入 `GET /polls/new`。
2. 填寫標題、至少兩個選項（可用 Tab 在欄位間移動）。
3. 按「建立問卷」；送出期間按鈕應顯示忙碌狀態（例如「建立中…」）且不可重複點擊。
4. 成功後應出現投票頁／結果頁連結，以及複製連結按鈕（若瀏覽器不支援剪貼簿，應有手動複製提示，頁面不應崩潰）。

### 3.3 複製投票連結／結果連結

1. 在成功區塊按「複製投票連結」「複製結果連結」。
2. 於新分頁貼上並開啟，確認網址分別為 `/vote/<pollId>`、`/results/<pollId>`。

### 3.4 投票

1. 以無痕或另一瀏覽器開啟投票連結。
2. 用滑鼠或鍵盤（Tab + 空白／方向鍵）選取一個選項。
3. 送出投票；送出中按鈕應忙碌且不可重複送出。
4. 成功後應看到前往結果頁的連結。

### 3.5 查看結果

1. 開啟結果頁 `/results/<pollId>`。
2. 確認顯示為**區間化／模糊化**的統計文字（非原始票數、非 `option_id`）。
3. 底部導覽可回到首頁、建立問卷、投票頁。

### 3.6 測試錯誤 poll id

1. 開啟 `/vote/not-a-valid-uuid` 或 `/results/00000000-0000-0000-0000-000000000000`（不存在或不可讀的 id）。
2. 應顯示**簡短繁中**錯誤說明與返回首頁／建立問卷連結，**不**應顯示英文後端錯誤堆疊或資料庫細節。

### 3.7 公開 MVP 視覺／手機寬度簡測（Phase 28）

四個公開頁應共用 `GET /frontend/public-mvp.css`（簡潔淺色版面、最大寬度約 42rem）。

1. 開發者工具切換 **320px、375px、430px** 寬度，各走一次 3.2–3.5。
2. 檢查項目：
   - 首頁「建立問卷」CTA 不換行破版、不超出螢幕。
   - 建立頁標題／說明／選項欄位可讀、可點，複製按鈕不造成水平捲軸。
   - 投票選項有足夠點擊區域，長文字自動換行。
   - 結果頁選項標籤與百分比不溢出。
3. 桌機寬度（≥1024px）內容仍置中、不過寬；無需 dark mode 或動畫。

**Phase 28 仍不包含：** feed 列表 UI、ranking／推薦、登入、admin UI、分類選擇、發布後編輯。

### 3.8 輔助工具（選做）

- 使用螢幕閱讀器或瀏覽器無障礙檢查：建立中／錯誤／成功訊息應能被讀出（`aria-live`／`role="status"` 等）。
- 僅鍵盤操作：從「跳到主要內容」連結開始，應能完成建立與投票主流程。

---

## 4. 本文件**不是**本 Phase 範圍

以下項目在公開 MVP 手動測試中**預期不存在或未實作**，若測到相關 UI／行為請視為缺陷或誤開 scope，而非本交接遺漏：

| 項目 | 說明 |
|------|------|
| 登入／註冊／Session／JWT／OAuth | 公開流程無使用者登入 |
| Feed／探索列表 UI | 僅 API 層 freshness feed；首頁不提供列表 |
| Ranking／Wonder Flow／個人化推薦 | 禁止以答案方向訊號排序 |
| Admin UI | 管理流程僅 API + 煙霧，無公開管理介面 |
| 發布後編輯問卷 | 創作者零編輯；需刪除重發或走 Admin Typo Correction |
| 分類選擇 UI | 建立頁固定 general MVP 預設 |
| Rate limit 強化 | 本交接不包含限流／防濫用硬化 |

---

## 5. 隱私與完整性提醒（手動測試時）

- 公開頁與公開 JSON **不得**出現 `option_id`、vote token、`shard_id` 等內部欄位。
- 投票頁選項記憶僅能存在**當前頁面執行期**；不得依賴 `localStorage`／`sessionStorage`／cookie 保存選項。
- 重複投票應由後端拒絕；前端僅顯示友善訊息並引導至結果頁。

---

## 6. 相關文件

- `README.md` — 指令與 API 總覽
- `docs/www-project-phase-15-pg-integration-test-setup-v1.md` — 本機 PostgreSQL 整合測試
- `AGENTS.md` — 代理與隱私紅線
