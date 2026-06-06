/**
 * Phase 75 — shared auth state navigation copy (static UX only; no auth runtime).
 */

export const AUTH_STATE_COPY = {
  guestChipLabel: '正式登入尚未啟用',
  guestChipAriaLabel: '正式登入尚未啟用，前往登入說明頁',
  guestChipTitle:
    'Production 受保護功能須已核准憑證；缺少時 fail closed。此連結僅開啟登入說明 shell。',
  demoIdentityChipLabel: 'MVP 測試身份',
  demoIdentityChipAriaLabel:
    '目前為 MVP 測試身份展示，非正式登入或 creator_session',
  demoIdentityChipTitle:
    '本機以 X-User-Id 示範個人資料與投票；發起者流程請用 creator_session（?live=1）',
  guestPrimaryCta: '了解登入狀態',
  guestSecondaryCta: '登入',
  bannerAriaLabel: '身分與登入狀態說明',
  bannerGuestLead: '正式登入尚未啟用',
  bannerGuestBody:
    'Production 受保護路由須已核准憑證，缺少時 fail closed，不會退回 MVP X-User-Id 或 creator_session。',
  bannerLocalDemoTitle: '本機 demo 測試身份',
  bannerLocalDemoBody:
    '個人資料與投票使用 MVP X-User-Id；發起問卷請用 ?live=1 的 creator_session（僅 /creator/*，非一般 user auth）。',
  bannerNavDemoNote:
    '上方「展示用已登入導覽」僅切換導覽列外觀，並非真實登入或帳號狀態。',
  demoNavSwitchLabel: '切換導覽展示（非登入）',
  demoNavGuestLink: '訪客導覽',
  demoNavLoggedInLink: '展示用已登入導覽',
};
