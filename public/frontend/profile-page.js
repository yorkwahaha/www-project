import {
  announceToStatusRegion,
  markRegionBusy,
  resolvePublicMvpUserId,
  setBusySubmitButton,
} from './public-mvp-ui.js';
import { mountSiteChrome } from './public-mvp-layout.js';

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

const SAFE_PROFILE_LOAD_FAILURE_MESSAGE = '目前無法載入個人資料，請稍後再試。';
const SAFE_PROFILE_SAVE_FAILURE_MESSAGE = '目前無法儲存個人資料，請稍後再試。';
const PROFILE_VALIDATION_MESSAGE = '請確認出生年月與居住地區格式。';
const PROFILE_SAVED_MESSAGE = '個人資料已儲存。';
const SUBMIT_IDLE_LABEL = '儲存';
const SUBMIT_BUSY_LABEL = '儲存中…';

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

async function readSafeProfileJson(response, fallbackMessage) {
  try {
    return await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }
}

export async function loadUserProfile({
  userId,
  fetchImpl = globalThis.fetch,
}) {
  let response;
  try {
    response = await fetchImpl('/users/me/profile', {
      method: 'GET',
      headers: { 'X-User-Id': userId },
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    throw new Error(SAFE_PROFILE_LOAD_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(SAFE_PROFILE_LOAD_FAILURE_MESSAGE);
  }
  const body = await readSafeProfileJson(response, SAFE_PROFILE_LOAD_FAILURE_MESSAGE);
  return {
    birth_year_month:
      typeof body.birth_year_month === 'string' ? body.birth_year_month : null,
    residential_region:
      typeof body.residential_region === 'string' ? body.residential_region : null,
  };
}

export async function saveUserProfile({
  userId,
  profile,
  fetchImpl = globalThis.fetch,
}) {
  let response;
  try {
    response = await fetchImpl('/users/me/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(profile),
      credentials: 'omit',
    });
  } catch {
    throw new Error(SAFE_PROFILE_SAVE_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(SAFE_PROFILE_SAVE_FAILURE_MESSAGE);
  }
  return readSafeProfileJson(response, SAFE_PROFILE_SAVE_FAILURE_MESSAGE);
}

export function applyProfileToForm(form, profile) {
  form.elements.birth_year_month.value = profile.birth_year_month ?? '';
  form.elements.residential_region.value = profile.residential_region ?? '';
}

export async function bootstrapProfilePage({
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
  uuidFactory = () => globalThis.crypto.randomUUID(),
} = {}) {
  const form = documentObject.getElementById('profile-form');
  const message = documentObject.getElementById('profile-form-message');
  const submitButton = documentObject.getElementById('profile-submit');
  const clearButton = documentObject.getElementById('profile-clear');
  if (!form || !message || !submitButton || !clearButton) {
    return;
  }

  mountSiteChrome(documentObject);

  const userId = resolvePublicMvpUserId(uuidFactory);
  markRegionBusy(form, true);
  announceToStatusRegion(message, '載入中…');
  try {
    applyProfileToForm(form, await loadUserProfile({ userId, fetchImpl }));
    announceToStatusRegion(message, '');
  } catch (error) {
    announceToStatusRegion(
      message,
      error instanceof Error ? error.message : SAFE_PROFILE_LOAD_FAILURE_MESSAGE,
    );
  } finally {
    markRegionBusy(form, false);
  }

  clearButton.addEventListener('click', () => {
    applyProfileToForm(form, {
      birth_year_month: null,
      residential_region: null,
    });
    announceToStatusRegion(message, '');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setBusySubmitButton(submitButton, {
      busy: true,
      idleLabel: SUBMIT_IDLE_LABEL,
      busyLabel: SUBMIT_BUSY_LABEL,
    });
    announceToStatusRegion(message, '儲存中…');
    try {
      const profile = normalizeProfileFormInput({
        birthYearMonth: form.elements.birth_year_month.value,
        residentialRegion: form.elements.residential_region.value,
      });
      applyProfileToForm(
        form,
        await saveUserProfile({ userId, profile, fetchImpl }),
      );
      announceToStatusRegion(message, PROFILE_SAVED_MESSAGE);
    } catch (error) {
      announceToStatusRegion(
        message,
        error instanceof Error ? error.message : SAFE_PROFILE_SAVE_FAILURE_MESSAGE,
      );
    } finally {
      setBusySubmitButton(submitButton, {
        busy: false,
        idleLabel: SUBMIT_IDLE_LABEL,
        busyLabel: SUBMIT_BUSY_LABEL,
      });
    }
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapProfilePage();
}
