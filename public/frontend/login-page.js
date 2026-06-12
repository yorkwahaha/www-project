/**
 * Phase 86 — minimal production login form runtime; refreshes GET /users/me
 * through the existing login-state hook.
 */

import {
  announceToStatusRegion,
  PUBLIC_CTA_SIGN_IN_LABEL,
  PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
  PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT,
  PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER,
  PUBLIC_LOGIN_FORM_READY_HINT,
  PUBLIC_LOGIN_LOCAL_DEMO_CARD_HEADING,
  PUBLIC_LOGIN_PAGE_TITLE,
  PUBLIC_LOGIN_PRODUCTION_CARD_HEADING,
  PUBLIC_LOGIN_REFERENCE_ANSWER_CARD_HEADING,
  PUBLIC_LOGIN_SHELL_DEMO_HINT,
  PUBLIC_LOGIN_SUCCESS_MESSAGE,
  setBusySubmitButton,
} from './public-mvp-ui.js';
import { mountSiteChrome } from './public-mvp-layout.js';
import { mountLoginStateRead } from './login-state-ui.js';

export const LOGIN_FORM_READY_MESSAGE = PUBLIC_LOGIN_FORM_READY_HINT;

export const LOGIN_SHELL_DEMO_HINT_MESSAGE = PUBLIC_LOGIN_SHELL_DEMO_HINT;

export const LOGIN_CREDENTIAL_LABEL = PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL;
export const LOGIN_CREDENTIAL_PLACEHOLDER = PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER;
export const LOGIN_CREDENTIAL_FIELD_HINT = PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT;
export const LOGIN_PAGE_TITLE = PUBLIC_LOGIN_PAGE_TITLE;
export const LOGIN_PRODUCTION_CARD_HEADING = PUBLIC_LOGIN_PRODUCTION_CARD_HEADING;
export const LOGIN_LOCAL_DEMO_CARD_HEADING = PUBLIC_LOGIN_LOCAL_DEMO_CARD_HEADING;
export const LOGIN_REFERENCE_ANSWER_CARD_HEADING = PUBLIC_LOGIN_REFERENCE_ANSWER_CARD_HEADING;

export const LOGIN_FORM_MISSING_CREDENTIAL_MESSAGE =
  '請輸入登入憑證。';

export const LOGIN_FORM_LOADING_MESSAGE = '登入中，請稍候。';

export const LOGIN_FORM_SUCCESS_MESSAGE = PUBLIC_LOGIN_SUCCESS_MESSAGE;

export const LOGIN_FORM_VERIFY_STATE_FAILURE_MESSAGE =
  '登入已送出，但目前無法確認登入狀態，請重新整理後再試。';

export const LOGIN_FORM_FAILURE_MESSAGE =
  '登入失敗，請確認憑證後再試。';

export const LOGIN_FORM_ORIGIN_FAILURE_MESSAGE =
  '無法從此頁完成登入，請重新整理後再試。';

export const LOGIN_FORM_NETWORK_FAILURE_MESSAGE =
  '網路連線失敗，請稍後再試。';

const LOGIN_SUBMIT_IDLE_LABEL = PUBLIC_CTA_SIGN_IN_LABEL;
export const LOGIN_SUBMIT_CTA_LABEL = PUBLIC_CTA_SIGN_IN_LABEL;
export const LOGIN_SUBMIT_BUSY_LABEL = LOGIN_FORM_LOADING_MESSAGE;

/**
 * @param {unknown} value
 * @returns {value is HTMLInputElement}
 */
function isInputElement(value) {
  return (
    (typeof HTMLInputElement !== 'undefined' && value instanceof HTMLInputElement) ||
    (
      !!value &&
      typeof value === 'object' &&
      /** @type {{ tagName?: unknown }} */ (value).tagName === 'INPUT'
    )
  );
}

/**
 * @param {unknown} value
 * @returns {value is HTMLButtonElement}
 */
function isButtonElement(value) {
  return (
    (typeof HTMLButtonElement !== 'undefined' && value instanceof HTMLButtonElement) ||
    (
      !!value &&
      typeof value === 'object' &&
      /** @type {{ tagName?: unknown }} */ (value).tagName === 'BUTTON'
    )
  );
}

/**
 * @param {{ credential: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'missing' | 'origin' | 'rejected' | 'network' }>}
 */
export async function submitProductionLoginCredential({
  credential,
  fetchImpl = globalThis.fetch,
}) {
  const proof = typeof credential === 'string' ? credential.trim() : '';
  if (!proof) {
    return { ok: false, reason: 'missing' };
  }
  if (typeof fetchImpl !== 'function') {
    return { ok: false, reason: 'network' };
  }

  try {
    const response = await fetchImpl('/login/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Authorization: `Bearer ${proof}`,
      },
    });
    if (response.status === 201) {
      return { ok: true };
    }
    if (response.status === 403) {
      return { ok: false, reason: 'origin' };
    }
    return { ok: false, reason: 'rejected' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/**
 * @param {'missing' | 'origin' | 'rejected' | 'network'} reason
 */
export function messageForLoginFailure(reason) {
  if (reason === 'missing') {
    return LOGIN_FORM_MISSING_CREDENTIAL_MESSAGE;
  }
  if (reason === 'origin') {
    return LOGIN_FORM_ORIGIN_FAILURE_MESSAGE;
  }
  if (reason === 'network') {
    return LOGIN_FORM_NETWORK_FAILURE_MESSAGE;
  }
  return LOGIN_FORM_FAILURE_MESSAGE;
}

/**
 * @param {HTMLFormElement} form
 * @param {boolean} busy
 */
function setLoginFormBusy(form, busy) {
  const submitButton = form.querySelector('#login-shell-submit');
  if (isButtonElement(submitButton)) {
    setBusySubmitButton(submitButton, {
      busy,
      idleLabel: LOGIN_SUBMIT_IDLE_LABEL,
      busyLabel: LOGIN_SUBMIT_BUSY_LABEL,
    });
  }
  const credentialInput = form.querySelector('[name="credential"]');
  if (isInputElement(credentialInput)) {
    credentialInput.disabled = busy;
    credentialInput.setAttribute('aria-busy', busy ? 'true' : 'false');
  }
}

/**
 * @param {HTMLFormElement} form
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   documentObject?: Document,
 *   refreshLoginState?: typeof mountLoginStateRead,
 *   announce?: typeof announceToStatusRegion
 * }} [options]
 * @returns {Promise<{ ok: true } | { ok: false }>}
 */
export async function submitProductionLoginForm(form, options = {}) {
  const credentialInput = form.querySelector('[name="credential"]');
  const status = form.ownerDocument?.getElementById('login-shell-message');
  const announce = options.announce ?? announceToStatusRegion;
  if (!isInputElement(credentialInput)) {
    return { ok: false };
  }

  const credential = credentialInput.value;
  if (!credential.trim()) {
    credentialInput.setAttribute('aria-invalid', 'true');
    announce(status, LOGIN_FORM_MISSING_CREDENTIAL_MESSAGE);
    credentialInput.focus?.();
    return { ok: false };
  }

  credentialInput.removeAttribute('aria-invalid');
  setLoginFormBusy(form, true);
  announce(status, LOGIN_FORM_LOADING_MESSAGE);
  const result = await submitProductionLoginCredential({
    credential,
    fetchImpl: options.fetchImpl,
  });

  if (!result.ok) {
    setLoginFormBusy(form, false);
    credentialInput.setAttribute('aria-invalid', 'true');
    announce(status, messageForLoginFailure(result.reason));
    return { ok: false };
  }

  credentialInput.value = '';
  credentialInput.removeAttribute('aria-invalid');
  const documentObject = options.documentObject ?? form.ownerDocument;
  const refreshLoginState = options.refreshLoginState ?? mountLoginStateRead;
  const state = await refreshLoginState(documentObject, {
    fetchImpl: options.fetchImpl,
  });
  setLoginFormBusy(form, false);
  if (state?.status === 'authenticated') {
    announce(status, LOGIN_FORM_SUCCESS_MESSAGE);
    return { ok: true };
  }
  announce(status, LOGIN_FORM_VERIFY_STATE_FAILURE_MESSAGE);
  return { ok: false };
}

/**
 * @param {HTMLFormElement | null} form
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   documentObject?: Document,
 *   refreshLoginState?: typeof mountLoginStateRead,
 *   announce?: typeof announceToStatusRegion
 * }} [options]
 */
export function wireLoginShellForm(form, options = {}) {
  if (!form) {
    return;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitProductionLoginForm(form, options);
  });
}

/**
 * @param {Document} documentObject
 */
export function syncLoginPageSectionHeadings(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const pageHeading = documentObject.getElementById('login-heading');
  if (pageHeading) {
    pageHeading.textContent = PUBLIC_LOGIN_PAGE_TITLE;
  }
  const authCards = documentObject.querySelectorAll('.mvp-auth-state-grid .mvp-value-card h2');
  if (authCards[0]) {
    authCards[0].textContent = PUBLIC_LOGIN_PRODUCTION_CARD_HEADING;
  }
  if (authCards[1]) {
    authCards[1].textContent = PUBLIC_LOGIN_LOCAL_DEMO_CARD_HEADING;
  }
  if (authCards[2]) {
    authCards[2].textContent = PUBLIC_LOGIN_REFERENCE_ANSWER_CARD_HEADING;
  }
}

export function syncLoginFormFieldCopy(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const credentialLabel = documentObject.querySelector('label[for="login-credential"]');
  if (credentialLabel) {
    credentialLabel.textContent = PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL;
  }
  const credentialInput = documentObject.getElementById('login-credential');
  if (credentialInput) {
    credentialInput.placeholder = PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER;
  }
  const credentialHint = documentObject.getElementById('login-shell-hint');
  if (credentialHint) {
    credentialHint.textContent = PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT;
  }
}

/**
 * @param {Document} [documentObject]
 */
export function mountLoginShellPage(documentObject = document) {
  mountSiteChrome(documentObject);
  syncLoginPageSectionHeadings(documentObject);
  syncLoginFormFieldCopy(documentObject);
  const form = documentObject.getElementById('login-shell-form');
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  wireLoginShellForm(form, { documentObject });
  const status = documentObject.getElementById('login-shell-message');
  if (status) {
    announceToStatusRegion(status, LOGIN_FORM_READY_MESSAGE);
  }
}

if (typeof document !== 'undefined') {
  mountLoginShellPage(document);
}
