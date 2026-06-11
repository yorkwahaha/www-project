/**
 * Phase 75 — shared auth state navigation copy (static UX only; no auth runtime).
 * Phase 94 — registration/login navigation and flow copy polish.
 */

import {
  PUBLIC_AUTH_DEMO_IDENTITY_CHIP_STATUS_LABEL,
  PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL,
  PUBLIC_AUTH_GUEST_SIGN_IN_CTA_ARIA_LABEL,
  PUBLIC_CTA_GO_TO_LOGIN_ARIA_LABEL,
  PUBLIC_CTA_GO_TO_REGISTER_ARIA_LABEL,
  PUBLIC_CTA_REGISTER_LABEL,
  PUBLIC_CTA_SIGN_IN_LABEL,
} from './public-mvp-ui.js';

export const AUTH_STATE_COPY = {
  guestChipLabel: PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL,
  guestChipAriaLabel: PUBLIC_AUTH_GUEST_SIGN_IN_CTA_ARIA_LABEL,
  guestChipTitle:
    '登入後頁首才會顯示帳號名稱。註冊只建立帳號資料，不會自動登入。',
  demoIdentityChipLabel: PUBLIC_AUTH_DEMO_IDENTITY_CHIP_STATUS_LABEL,
  demoIdentityChipAriaLabel:
    '目前為 MVP 測試身份展示，非正式登入或 creator_session',
  demoIdentityChipTitle:
    '本機以 X-User-Id 示範個人資料與投票；發起者流程請用 creator_session（?live=1）',
  guestPrimaryCta: PUBLIC_CTA_REGISTER_LABEL,
  guestPrimaryCtaAriaLabel: PUBLIC_CTA_GO_TO_REGISTER_ARIA_LABEL,
  guestSecondaryCta: PUBLIC_CTA_SIGN_IN_LABEL,
  guestSecondaryCtaAriaLabel: PUBLIC_CTA_GO_TO_LOGIN_ARIA_LABEL,
  bannerAriaLabel: '身分與登入狀態說明',
  bannerGuestLead: '正式帳號流程',
  bannerGuestBody:
    '註冊只建立帳號資料，不會自動登入；完成註冊後請到登入頁。登入後才會在頁首顯示帳號名稱。缺少已核准憑證時，受保護功能 fail closed，不會退回 MVP X-User-Id 或 creator_session。',
  bannerLoginLinkLabel: PUBLIC_CTA_SIGN_IN_LABEL,
  bannerRegistrationLinkLabel: PUBLIC_CTA_REGISTER_LABEL,
  bannerLocalDemoTitle: '本機 demo 測試身份',
  bannerLocalDemoBody:
    '個人資料與投票使用 MVP X-User-Id；發起問卷請用 ?live=1 的 creator_session（僅 /creator/*，非一般 user auth）。',
  bannerNavDemoNote:
    '上方「展示用已登入導覽」僅切換導覽列外觀，並非真實登入或帳號狀態。',
  demoNavSwitchLabel: '切換導覽展示（非登入）',
  demoNavGuestLink: '訪客導覽',
  demoNavLoggedInLink: '展示用已登入導覽',
};
