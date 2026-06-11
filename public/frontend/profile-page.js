/**
 * Phase 98 — minimal production profile setup/edit runtime.
 */

import {
  announceToStatusRegion,
  markRegionBusy,
  PUBLIC_LOADING_PENDING_MESSAGE,
  PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE,
  resolvePublicErrorUserMessage,
  setBusySubmitButton,
} from './public-mvp-ui.js';
import { mountSiteChrome } from './public-mvp-layout.js';
import {
  LOGIN_STATE_AUTHENTICATED,
  readLoginState,
} from './login-state-read.js';

export const PROFILE_REGION_OPTIONS = [
  'TW-TPE',
  'TW-NWT',
  'TW-TAO',
  'TW-TXG',
  'TW-TNN',
  'TW-KHH',
  'TW-HSZ',
  'TW-CYI',
  'TW-ILA',
  'TW-HUA',
  'TW-TTT',
  'TW-PEN',
];

export const PROFILE_UNAUTHENTICATED_MESSAGE =
  '編輯個人資料前請先登入。';
export const PROFILE_LOADING_MESSAGE = PUBLIC_LOADING_PENDING_MESSAGE;
export const PROFILE_SAVING_MESSAGE = '儲存中，請稍候。';
export const PROFILE_SAVED_MESSAGE = PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE;
export const PROFILE_VALIDATION_MESSAGE = '請確認出生年月與居住地區格式。';
export const PROFILE_UNAUTHENTICATED_EDIT_MESSAGE =
  '請先登入後再編輯個人資料。';
export const PROFILE_LOAD_FAILURE_MESSAGE =
  '目前無法載入個人資料，請稍後再試。';
export const PROFILE_SAVE_FAILURE_MESSAGE =
  '目前無法儲存個人資料，請稍後再試。';

export const PROFILE_USER_ERROR_MESSAGES = [
  PROFILE_VALIDATION_MESSAGE,
  PROFILE_UNAUTHENTICATED_EDIT_MESSAGE,
  PROFILE_LOAD_FAILURE_MESSAGE,
  PROFILE_SAVE_FAILURE_MESSAGE,
];

const SUBMIT_IDLE_LABEL = '儲存';
const SUBMIT_BUSY_LABEL = PROFILE_SAVING_MESSAGE;

/**
 * @param {unknown} value
 * @returns {value is HTMLFormElement}
 */
function isFormElement(value) {
  return (
    (typeof HTMLFormElement !== 'undefined' && value instanceof HTMLFormElement) ||
    (
      !!value &&
      typeof value === 'object' &&
      /** @type {{ tagName?: unknown }} */ (value).tagName === 'FORM'
    )
  );
}

/**
 * @param {{
 *   birthYearMonth: string,
 *   residentialRegion: string,
 * }} input
 */
export function normalizeProfileFormInput({
  birthYearMonth,
  residentialRegion,
}) {
  const birth = birthYearMonth.trim();
  const region = residentialRegion.trim();
  if (birth !== '' && !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(birth)) {
    throw new Error(PROFILE_VALIDATION_MESSAGE);
  }
  if (region !== '' && !PROFILE_REGION_OPTIONS.includes(region)) {
    throw new Error(PROFILE_VALIDATION_MESSAGE);
  }
  return {
    birth_year_month: birth === '' ? null : birth,
    residential_region: region === '' ? null : region,
  };
}

/**
 * @param {Response} response
 * @returns {'validation' | 'unauthenticated' | 'server'}
 */
export function reasonForProfileResponse(response) {
  if (response.status === 400) return 'validation';
  if (response.status === 401) return 'unauthenticated';
  return 'server';
}

/**
 * @param {'validation' | 'unauthenticated' | 'network' | 'server'} reason
 * @param {'load' | 'save'} context
 */
export function messageForProfileFailure(reason, context = 'save') {
  if (reason === 'validation') return PROFILE_VALIDATION_MESSAGE;
  if (reason === 'unauthenticated') return PROFILE_UNAUTHENTICATED_EDIT_MESSAGE;
  if (reason === 'network') {
    return context === 'load'
      ? PROFILE_LOAD_FAILURE_MESSAGE
      : PROFILE_SAVE_FAILURE_MESSAGE;
  }
  return context === 'load'
    ? PROFILE_LOAD_FAILURE_MESSAGE
    : PROFILE_SAVE_FAILURE_MESSAGE;
}

async function readSafeProfileJson(response, fallbackMessage) {
  try {
    return await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }
}

/**
 * @param {{ fetchImpl?: typeof fetch }} [options]
 */
export async function loadUserProfile({
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error(PROFILE_LOAD_FAILURE_MESSAGE);
  }
  let response;
  try {
    response = await fetchImpl('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new Error(PROFILE_LOAD_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(
      messageForProfileFailure(reasonForProfileResponse(response), 'load'),
    );
  }
  const body = await readSafeProfileJson(
    response,
    PROFILE_LOAD_FAILURE_MESSAGE,
  );
  return {
    birth_year_month:
      typeof body.birth_year_month === 'string' ? body.birth_year_month : null,
    residential_region:
      typeof body.residential_region === 'string'
        ? body.residential_region
        : null,
  };
}

/**
 * @param {{
 *   profile: { birth_year_month: string | null, residential_region: string | null },
 *   fetchImpl?: typeof fetch,
 * }} options
 */
export async function saveUserProfile({
  profile,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error(PROFILE_SAVE_FAILURE_MESSAGE);
  }
  let response;
  try {
    response = await fetchImpl('/users/me/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        birth_year_month: profile.birth_year_month,
        residential_region: profile.residential_region,
      }),
    });
  } catch {
    throw new Error(PROFILE_SAVE_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(
      messageForProfileFailure(reasonForProfileResponse(response), 'save'),
    );
  }
  return readSafeProfileJson(response, PROFILE_SAVE_FAILURE_MESSAGE);
}

/**
 * @param {HTMLFormElement} form
 * @param {{ birth_year_month: string | null, residential_region: string | null }} profile
 */
export function applyProfileToForm(form, profile) {
  form.elements.birth_year_month.value = profile.birth_year_month ?? '';
  form.elements.residential_region.value = profile.residential_region ?? '';
}

/**
 * @param {Document} documentObject
 * @param {boolean} authenticated
 */
export function setProfilePageAuthVisibility(documentObject, authenticated) {
  const unauthenticated = documentObject.getElementById('profile-unauthenticated');
  const signedInPanel = documentObject.getElementById('profile-signed-in-panel');
  if (unauthenticated) {
    unauthenticated.hidden = authenticated;
  }
  if (signedInPanel) {
    signedInPanel.hidden = !authenticated;
  }
}

/**
 * @param {HTMLFormElement} form
 * @param {boolean} busy
 */
function setProfileFormBusy(form, busy) {
  markRegionBusy(form, busy);
  const submitButton = form.ownerDocument?.getElementById('profile-submit');
  if (submitButton) {
    setBusySubmitButton(submitButton, {
      busy,
      idleLabel: SUBMIT_IDLE_LABEL,
      busyLabel: SUBMIT_BUSY_LABEL,
    });
  }
  for (const name of ['birth_year_month', 'residential_region']) {
    const field = form.elements.namedItem(name);
    if (
      field &&
      typeof field === 'object' &&
      'disabled' in field &&
      typeof field.disabled === 'boolean'
    ) {
      field.disabled = busy;
    }
  }
}

/**
 * @param {HTMLFormElement} form
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   announce?: typeof announceToStatusRegion,
 * }} [options]
 */
export function wireProfileForm(form, options = {}) {
  const message = form.ownerDocument?.getElementById('profile-form-message');
  const clearButton = form.ownerDocument?.getElementById('profile-clear');
  const announce = options.announce ?? announceToStatusRegion;
  const fetchImpl = options.fetchImpl;

  clearButton?.addEventListener('click', () => {
    applyProfileToForm(form, {
      birth_year_month: null,
      residential_region: null,
    });
    announce(message, '');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void (async () => {
      setProfileFormBusy(form, true);
      announce(message, PROFILE_SAVING_MESSAGE);
      try {
        const profile = normalizeProfileFormInput({
          birthYearMonth: form.elements.birth_year_month.value,
          residentialRegion: form.elements.residential_region.value,
        });
        applyProfileToForm(
          form,
          await saveUserProfile({ profile, fetchImpl }),
        );
        announce(message, PROFILE_SAVED_MESSAGE);
      } catch (error) {
        announce(
          message,
          resolvePublicErrorUserMessage(
            error,
            PROFILE_SAVE_FAILURE_MESSAGE,
            PROFILE_USER_ERROR_MESSAGES,
          ),
        );
      } finally {
        setProfileFormBusy(form, false);
      }
    })();
  });
}

/**
 * @param {Document} documentObject
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   readLoginStateImpl?: typeof readLoginState,
 *   announce?: typeof announceToStatusRegion,
 * }} [options]
 */
export async function mountProfilePage(documentObject = document, options = {}) {
  mountSiteChrome(documentObject, options);

  const form = documentObject.getElementById('profile-form');
  const message = documentObject.getElementById('profile-form-message');
  const announce = options.announce ?? announceToStatusRegion;
  const readLoginStateImpl = options.readLoginStateImpl ?? readLoginState;
  const fetchImpl = options.fetchImpl;

  if (!isFormElement(form) || !message) {
    return { status: 'missing-shell' };
  }

  const loginState = await readLoginStateImpl({ fetchImpl });
  if (loginState.status !== LOGIN_STATE_AUTHENTICATED) {
    setProfilePageAuthVisibility(documentObject, false);
    announce(message, PROFILE_UNAUTHENTICATED_MESSAGE);
    return { status: 'unauthenticated' };
  }

  setProfilePageAuthVisibility(documentObject, true);
  setProfileFormBusy(form, true);
  announce(message, PROFILE_LOADING_MESSAGE);
  try {
    applyProfileToForm(form, await loadUserProfile({ fetchImpl }));
    announce(message, '');
  } catch (error) {
    announce(
      message,
      resolvePublicErrorUserMessage(
        error,
        PROFILE_LOAD_FAILURE_MESSAGE,
        PROFILE_USER_ERROR_MESSAGES,
      ),
    );
  } finally {
    setProfileFormBusy(form, false);
  }

  wireProfileForm(form, { fetchImpl, announce });
  return { status: 'authenticated' };
}

if (typeof document !== 'undefined') {
  void mountProfilePage(document);
}
