/**
 * Phase 74 — production login UI shell (static UX only; no auth API, no persistence).
 */

import { announceToStatusRegion } from './public-mvp-ui.js';
import { mountSiteChrome } from './public-mvp-layout.js';

export const LOGIN_SHELL_NOT_ENABLED_MESSAGE =
  '正式登入尚未啟用。Production 環境在缺少已核准憑證時會 fail closed，不會使用測試用 X-User-Id 或 creator_session。';

export const LOGIN_SHELL_DEMO_HINT_MESSAGE =
  '本機展示請使用 /profile 與投票頁的 MVP 測試身份，或 localhost 的 creator_session 發起流程（?live=1）。';

export const LOGIN_SHELL_SUBMIT_BLOCKED_MESSAGE =
  '此頁不會送出登入請求。請等待未來 production credential verifier 與正式登入流程上線。';

/**
 * @param {HTMLFormElement | null} form
 * @param {(message: string) => void} [announce]
 */
export function wireLoginShellForm(form, announce = announceToStatusRegion) {
  if (!form) {
    return;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    announce(form, LOGIN_SHELL_SUBMIT_BLOCKED_MESSAGE);
  });
  for (const control of form.querySelectorAll('input, button')) {
    if (control instanceof HTMLInputElement || control instanceof HTMLButtonElement) {
      control.disabled = true;
      control.setAttribute('aria-disabled', 'true');
    }
  }
}

/**
 * @param {Document} [documentObject]
 */
export function mountLoginShellPage(documentObject = document) {
  mountSiteChrome(documentObject);
  const form = documentObject.getElementById('login-shell-form');
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  wireLoginShellForm(form);
  const status = documentObject.getElementById('login-shell-message');
  if (status) {
    announceToStatusRegion(status, LOGIN_SHELL_NOT_ENABLED_MESSAGE);
  }
}

if (typeof document !== 'undefined') {
  mountLoginShellPage(document);
}
