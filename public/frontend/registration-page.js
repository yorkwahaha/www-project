/**
 * Phase 92 — minimal production registration form runtime.
 */

import {
  announceToStatusRegion,
  PUBLIC_CTA_REGISTER_LABEL,
  PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL,
  PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER,
  PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
  PUBLIC_FORM_DISPLAY_NAME_LABEL,
  PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER,
  PUBLIC_FORM_REGION_SELECT_PROMPT,
  PUBLIC_FORM_REGISTRATION_BIRTH_YEAR_MONTH_HINT,
  PUBLIC_FORM_REGISTRATION_CREDENTIAL_FIELD_HINT,
  PUBLIC_FORM_REGISTRATION_CREDENTIAL_PLACEHOLDER,
  PUBLIC_FORM_REGISTRATION_DISPLAY_NAME_HINT,
  PUBLIC_FORM_REGISTRATION_RESIDENTIAL_REGION_HINT,
  PUBLIC_FORM_RESIDENTIAL_REGION_LABEL,
  PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY,
  PUBLIC_REGISTRATION_PAGE_LEAD_SECONDARY,
  PUBLIC_REGISTRATION_PAGE_TITLE,
  PUBLIC_REGISTRATION_READY_HINT,
  PUBLIC_REGISTRATION_SUCCESS_FORM_HEADING,
  PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
  resolvePublicErrorUserMessage,
  setBusySubmitButton,
} from './public-mvp-ui.js';
import { mountSiteChrome } from './public-mvp-layout.js';

export const REGISTRATION_PAGE_LEAD_PRIMARY = PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY;
export const REGISTRATION_PAGE_LEAD_SECONDARY = PUBLIC_REGISTRATION_PAGE_LEAD_SECONDARY;

export const REGISTRATION_REGION_OPTIONS = [
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

export const REGISTRATION_READY_MESSAGE = PUBLIC_REGISTRATION_READY_HINT;
export const REGISTRATION_PAGE_TITLE = PUBLIC_REGISTRATION_PAGE_TITLE;
export const REGISTRATION_SUCCESS_FORM_HEADING = PUBLIC_REGISTRATION_SUCCESS_FORM_HEADING;

export const REGISTRATION_DISPLAY_NAME_LABEL = PUBLIC_FORM_DISPLAY_NAME_LABEL;
export const REGISTRATION_DISPLAY_NAME_PLACEHOLDER = PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER;
export const REGISTRATION_DISPLAY_NAME_FIELD_HINT = PUBLIC_FORM_REGISTRATION_DISPLAY_NAME_HINT;
export const REGISTRATION_BIRTH_YEAR_MONTH_LABEL = PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL;
export const REGISTRATION_BIRTH_YEAR_MONTH_PLACEHOLDER = PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER;
export const REGISTRATION_BIRTH_YEAR_MONTH_FIELD_HINT =
  PUBLIC_FORM_REGISTRATION_BIRTH_YEAR_MONTH_HINT;
export const REGISTRATION_RESIDENTIAL_REGION_LABEL = PUBLIC_FORM_RESIDENTIAL_REGION_LABEL;
export const REGISTRATION_RESIDENTIAL_REGION_FIELD_HINT =
  PUBLIC_FORM_REGISTRATION_RESIDENTIAL_REGION_HINT;
export const REGISTRATION_CREDENTIAL_LABEL = PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL;
export const REGISTRATION_CREDENTIAL_PLACEHOLDER = PUBLIC_FORM_REGISTRATION_CREDENTIAL_PLACEHOLDER;
export const REGISTRATION_CREDENTIAL_FIELD_HINT = PUBLIC_FORM_REGISTRATION_CREDENTIAL_FIELD_HINT;
export const REGISTRATION_DISPLAY_NAME_MESSAGE = '請輸入顯示名稱。';
export const REGISTRATION_BIRTH_YEAR_MONTH_MESSAGE =
  '請以 YYYY-MM 格式輸入出生年月。';
export const REGISTRATION_REGION_MESSAGE = '請選擇居住地區。';
export const REGISTRATION_CREDENTIAL_MESSAGE = '請輸入註冊憑證。';
export const REGISTRATION_LOADING_MESSAGE = '註冊中，請稍候。';
export const REGISTRATION_SUCCESS_MESSAGE = PUBLIC_REGISTRATION_SUCCESS_MESSAGE;
export const REGISTRATION_VALIDATION_FAILURE_MESSAGE =
  '請確認顯示名稱、出生年月與居住地區格式。';
export const REGISTRATION_AUTH_FAILURE_MESSAGE =
  '註冊憑證無法通過驗證，請確認後再試。';
export const REGISTRATION_ORIGIN_FAILURE_MESSAGE =
  '無法從目前頁面完成註冊，請重新整理後再試。';
export const REGISTRATION_CONFLICT_MESSAGE =
  '此憑證已完成註冊，請直接前往登入。';
export const REGISTRATION_UNAVAILABLE_MESSAGE =
  '目前尚未開放註冊，請稍後再試。';
export const REGISTRATION_NETWORK_FAILURE_MESSAGE =
  '網路連線失敗，請稍後再試。';
export const REGISTRATION_FAILURE_MESSAGE =
  '目前無法完成註冊，請稍後再試。';

export const REGISTRATION_USER_ERROR_MESSAGES = [
  REGISTRATION_DISPLAY_NAME_MESSAGE,
  REGISTRATION_BIRTH_YEAR_MONTH_MESSAGE,
  REGISTRATION_REGION_MESSAGE,
  REGISTRATION_CREDENTIAL_MESSAGE,
  REGISTRATION_VALIDATION_FAILURE_MESSAGE,
  REGISTRATION_AUTH_FAILURE_MESSAGE,
  REGISTRATION_ORIGIN_FAILURE_MESSAGE,
  REGISTRATION_CONFLICT_MESSAGE,
  REGISTRATION_UNAVAILABLE_MESSAGE,
  REGISTRATION_NETWORK_FAILURE_MESSAGE,
  REGISTRATION_FAILURE_MESSAGE,
];

const DISPLAY_NAME_MAX_LENGTH = 80;
const SUBMIT_IDLE_LABEL = PUBLIC_CTA_REGISTER_LABEL;
export const REGISTRATION_SUBMIT_CTA_LABEL = PUBLIC_CTA_REGISTER_LABEL;
const SUBMIT_BUSY_LABEL = REGISTRATION_LOADING_MESSAGE;

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
 * @returns {value is HTMLSelectElement}
 */
function isSelectElement(value) {
  return (
    (typeof HTMLSelectElement !== 'undefined' && value instanceof HTMLSelectElement) ||
    (
      !!value &&
      typeof value === 'object' &&
      /** @type {{ tagName?: unknown }} */ (value).tagName === 'SELECT'
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
 * @param {string} value
 */
function normalizeDisplayName(value) {
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(REGISTRATION_DISPLAY_NAME_MESSAGE);
  }
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    throw new Error(REGISTRATION_DISPLAY_NAME_MESSAGE);
  }
  return trimmed;
}

/**
 * @param {string} value
 */
function normalizeBirthYearMonth(value) {
  const trimmed = value.trim();
  if (!/^([0-9]{4})-(0[1-9]|1[0-2])$/.test(trimmed)) {
    throw new Error(REGISTRATION_BIRTH_YEAR_MONTH_MESSAGE);
  }
  return trimmed;
}

/**
 * @param {string} value
 */
function normalizeResidentialRegion(value) {
  const trimmed = value.trim();
  if (!REGISTRATION_REGION_OPTIONS.includes(trimmed)) {
    throw new Error(REGISTRATION_REGION_MESSAGE);
  }
  return trimmed;
}

/**
 * @param {{
 *   displayName: string,
 *   birthYearMonth: string,
 *   residentialRegion: string,
 *   credential: string,
 * }} input
 */
export function normalizeRegistrationFormInput(input) {
  const proof = input.credential.trim();
  if (!proof) {
    throw new Error(REGISTRATION_CREDENTIAL_MESSAGE);
  }
  return {
    profile: {
      display_name: normalizeDisplayName(input.displayName),
      birth_year_month: normalizeBirthYearMonth(input.birthYearMonth),
      residential_region: normalizeResidentialRegion(input.residentialRegion),
    },
    credential: proof,
  };
}

/**
 * @param {{ status: number }} response
 * @returns {'validation' | 'auth' | 'origin' | 'conflict' | 'unavailable' | 'server'}
 */
function reasonForRegistrationResponse(response) {
  if (response.status === 400) return 'validation';
  if (response.status === 401) return 'auth';
  if (response.status === 403) return 'origin';
  if (response.status === 404) return 'unavailable';
  if (response.status === 409) return 'conflict';
  return 'server';
}

/**
 * @param {'validation' | 'auth' | 'origin' | 'conflict' | 'unavailable' | 'network' | 'server'} reason
 */
export function messageForRegistrationFailure(reason) {
  if (reason === 'validation') return REGISTRATION_VALIDATION_FAILURE_MESSAGE;
  if (reason === 'auth') return REGISTRATION_AUTH_FAILURE_MESSAGE;
  if (reason === 'origin') return REGISTRATION_ORIGIN_FAILURE_MESSAGE;
  if (reason === 'conflict') return REGISTRATION_CONFLICT_MESSAGE;
  if (reason === 'unavailable') return REGISTRATION_UNAVAILABLE_MESSAGE;
  if (reason === 'network') return REGISTRATION_NETWORK_FAILURE_MESSAGE;
  return REGISTRATION_FAILURE_MESSAGE;
}

/**
 * @param {{
 *   profile: { display_name: string, birth_year_month: string, residential_region: string },
 *   credential: string,
 *   fetchImpl?: typeof fetch,
 * }} options
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'validation' | 'auth' | 'origin' | 'conflict' | 'unavailable' | 'network' | 'server' }>}
 */
export async function submitRegistrationRequest({
  profile,
  credential,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof fetchImpl !== 'function') {
    return { ok: false, reason: 'network' };
  }
  try {
    const response = await fetchImpl('/registration', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credential}`,
      },
      body: JSON.stringify(profile),
    });
    if (response.status === 201) {
      return { ok: true };
    }
    return { ok: false, reason: reasonForRegistrationResponse(response) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/**
 * @param {HTMLFormElement} form
 * @param {boolean} busy
 */
function setRegistrationFormBusy(form, busy) {
  const submitButton = form.querySelector('#registration-submit');
  if (isButtonElement(submitButton)) {
    setBusySubmitButton(submitButton, {
      busy,
      idleLabel: SUBMIT_IDLE_LABEL,
      busyLabel: SUBMIT_BUSY_LABEL,
    });
  }
  for (const name of [
    'display_name',
    'birth_year_month',
    'residential_region',
    'credential',
  ]) {
    const field = form.querySelector(`[name="${name}"]`);
    if (isInputElement(field) || isSelectElement(field)) {
      field.disabled = busy;
      field.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
  }
}

/**
 * @param {HTMLFormElement} form
 */
function readRegistrationFormInput(form) {
  const displayName = form.querySelector('[name="display_name"]');
  const birthYearMonth = form.querySelector('[name="birth_year_month"]');
  const residentialRegion = form.querySelector('[name="residential_region"]');
  const credential = form.querySelector('[name="credential"]');
  if (
    !isInputElement(displayName) ||
    !isInputElement(birthYearMonth) ||
    !isSelectElement(residentialRegion) ||
    !isInputElement(credential)
  ) {
    throw new Error(REGISTRATION_FAILURE_MESSAGE);
  }
  return {
    displayName: displayName.value,
    birthYearMonth: birthYearMonth.value,
    residentialRegion: residentialRegion.value,
    credential: credential.value,
  };
}

/**
 * @param {HTMLFormElement} form
 */
function clearRegistrationFieldInvalidState(form) {
  for (const name of [
    'display_name',
    'birth_year_month',
    'residential_region',
    'credential',
  ]) {
    const field = form.querySelector(`[name="${name}"]`);
    field?.removeAttribute?.('aria-invalid');
  }
}

/**
 * @param {HTMLFormElement} form
 */
function clearRegistrationCredential(form) {
  const credential = form.querySelector('[name="credential"]');
  if (isInputElement(credential)) {
    credential.value = '';
  }
}

/**
 * @param {HTMLFormElement} form
 * @param {string} message
 */
function markRegistrationValidationError(form, message) {
  const fieldByMessage = new Map([
    [REGISTRATION_DISPLAY_NAME_MESSAGE, 'display_name'],
    [REGISTRATION_BIRTH_YEAR_MONTH_MESSAGE, 'birth_year_month'],
    [REGISTRATION_REGION_MESSAGE, 'residential_region'],
    [REGISTRATION_CREDENTIAL_MESSAGE, 'credential'],
  ]);
  const name = fieldByMessage.get(message);
  if (!name) return;
  const field = form.querySelector(`[name="${name}"]`);
  field?.setAttribute?.('aria-invalid', 'true');
  field?.focus?.();
}

/**
 * @param {Document} documentObject
 */
function showRegistrationSuccess(documentObject) {
  const success = documentObject.getElementById('registration-success');
  if (!success) return;
  success.hidden = false;
}

/**
 * @param {HTMLFormElement} form
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   announce?: typeof announceToStatusRegion,
 * }} [options]
 * @returns {Promise<{ ok: true } | { ok: false }>}
 */
export async function submitRegistrationForm(form, options = {}) {
  const status = form.ownerDocument?.getElementById('registration-form-message');
  const announce = options.announce ?? announceToStatusRegion;
  clearRegistrationFieldInvalidState(form);

  let input;
  try {
    input = normalizeRegistrationFormInput(readRegistrationFormInput(form));
  } catch (error) {
    const message = resolvePublicErrorUserMessage(
      error,
      REGISTRATION_FAILURE_MESSAGE,
      REGISTRATION_USER_ERROR_MESSAGES,
    );
    markRegistrationValidationError(form, message);
    announce(status, message);
    return { ok: false };
  }

  setRegistrationFormBusy(form, true);
  announce(status, REGISTRATION_LOADING_MESSAGE);
  const result = await submitRegistrationRequest({
    profile: input.profile,
    credential: input.credential,
    fetchImpl: options.fetchImpl,
  });
  clearRegistrationCredential(form);

  if (!result.ok) {
    setRegistrationFormBusy(form, false);
    announce(status, messageForRegistrationFailure(result.reason));
    return { ok: false };
  }

  setRegistrationFormBusy(form, false);
  showRegistrationSuccess(form.ownerDocument);
  announce(status, REGISTRATION_SUCCESS_MESSAGE);
  return { ok: true };
}

/**
 * @param {HTMLFormElement | null} form
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   announce?: typeof announceToStatusRegion,
 * }} [options]
 */
export function wireRegistrationForm(form, options = {}) {
  if (!form) {
    return;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitRegistrationForm(form, options);
  });
}

function setFormHintAfterControl(control, text) {
  const hint = control?.nextElementSibling;
  if (hint?.classList?.contains('mvp-form-hint')) {
    hint.textContent = text;
  }
}

/**
 * @param {Document} documentObject
 */
export function syncRegistrationPageSectionHeadings(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const pageHeading = documentObject.getElementById('registration-heading');
  if (pageHeading) {
    pageHeading.textContent = PUBLIC_REGISTRATION_PAGE_TITLE;
  }
  const successHeading = documentObject.getElementById('registration-success-heading');
  if (successHeading) {
    successHeading.textContent = PUBLIC_REGISTRATION_SUCCESS_FORM_HEADING;
  }
}

export function syncRegistrationPageLeadParagraphs(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const primaryLead = documentObject.getElementById('registration-lead-primary');
  if (primaryLead) {
    primaryLead.textContent = PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY;
  }
  const secondaryLead = documentObject.getElementById('registration-lead-secondary');
  if (secondaryLead) {
    secondaryLead.textContent = PUBLIC_REGISTRATION_PAGE_LEAD_SECONDARY;
  }
}

export function syncRegistrationFormFieldCopy(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const displayNameLabel = documentObject.querySelector(
    'label[for="registration-display-name"]',
  );
  if (displayNameLabel) {
    displayNameLabel.textContent = PUBLIC_FORM_DISPLAY_NAME_LABEL;
  }
  const displayNameInput = documentObject.getElementById('registration-display-name');
  if (displayNameInput) {
    displayNameInput.placeholder = PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER;
    setFormHintAfterControl(displayNameInput, PUBLIC_FORM_REGISTRATION_DISPLAY_NAME_HINT);
  }

  const birthLabel = documentObject.querySelector('label[for="registration-birth-year-month"]');
  if (birthLabel) {
    birthLabel.textContent = PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL;
  }
  const birthInput = documentObject.getElementById('registration-birth-year-month');
  if (birthInput) {
    birthInput.placeholder = PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER;
    setFormHintAfterControl(birthInput, PUBLIC_FORM_REGISTRATION_BIRTH_YEAR_MONTH_HINT);
  }

  const regionLabel = documentObject.querySelector(
    'label[for="registration-residential-region"]',
  );
  if (regionLabel) {
    regionLabel.textContent = PUBLIC_FORM_RESIDENTIAL_REGION_LABEL;
  }
  const regionSelect = documentObject.getElementById('registration-residential-region');
  if (regionSelect) {
    const promptOption = regionSelect.querySelector('option[value=""]');
    if (promptOption) {
      promptOption.textContent = PUBLIC_FORM_REGION_SELECT_PROMPT;
    }
    setFormHintAfterControl(regionSelect, PUBLIC_FORM_REGISTRATION_RESIDENTIAL_REGION_HINT);
  }

  const credentialLabel = documentObject.querySelector('label[for="registration-credential"]');
  if (credentialLabel) {
    credentialLabel.textContent = PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL;
  }
  const credentialInput = documentObject.getElementById('registration-credential');
  if (credentialInput) {
    credentialInput.placeholder = PUBLIC_FORM_REGISTRATION_CREDENTIAL_PLACEHOLDER;
    setFormHintAfterControl(credentialInput, PUBLIC_FORM_REGISTRATION_CREDENTIAL_FIELD_HINT);
  }
}

/**
 * @param {Document} [documentObject]
 */
export function mountRegistrationPage(documentObject = document) {
  mountSiteChrome(documentObject);
  syncRegistrationPageSectionHeadings(documentObject);
  syncRegistrationPageLeadParagraphs(documentObject);
  syncRegistrationFormFieldCopy(documentObject);
  const form = documentObject.getElementById('registration-form');
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  wireRegistrationForm(form);
  const status = documentObject.getElementById('registration-form-message');
  announceToStatusRegion(status, REGISTRATION_READY_MESSAGE);
}

if (typeof document !== 'undefined') {
  mountRegistrationPage(document);
}
