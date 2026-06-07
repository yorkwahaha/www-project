/**
 * Phase 102 — neutral profile completion prompt (homepage only).
 */

import {
  LOGIN_STATE_AUTHENTICATED,
  readLoginState,
} from './login-state-read.js';

export const PROFILE_COMPLETION_PROMPT_MOUNT_ID =
  'profile-completion-prompt-mount';
export const PROFILE_COMPLETION_PROMPT_CLASS =
  'mvp-profile-completion-prompt';

export const PROFILE_COMPLETION_PROMPT_MESSAGE =
  '部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。若你尚未填寫，可至個人資料頁補充或更新；這不代表你一定符合或不符合任何投票資格。';
export const PROFILE_COMPLETION_PROMPT_CTA_LABEL = '前往個人資料';
export const PROFILE_COMPLETION_PROMPT_CTA_HREF = '/profile';
export const PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE =
  '目前無法載入個人資料提示，請稍後再試。';

/**
 * @param {{ birth_year_month: string | null, residential_region: string | null }} profile
 */
export function isProfileIncomplete(profile) {
  return (
    profile.birth_year_month === null || profile.residential_region === null
  );
}

/**
 * @param {unknown} body
 * @returns {{ birth_year_month: string | null, residential_region: string | null } | null}
 */
export function parseProfileForPrompt(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const record = /** @type {Record<string, unknown>} */ (body);
  const birth = record.birth_year_month;
  const region = record.residential_region;
  return {
    birth_year_month: typeof birth === 'string' ? birth : null,
    residential_region: typeof region === 'string' ? region : null,
  };
}

/**
 * @param {{ fetchImpl?: typeof fetch }} [options]
 */
export async function loadProfileForPrompt({
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error(PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE);
  }

  let response;
  try {
    response = await fetchImpl('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new Error(PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE);
  }

  const profile = parseProfileForPrompt(body);
  if (!profile) {
    throw new Error(PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE);
  }
  return profile;
}

/**
 * @param {HTMLElement} mount
 */
export function clearProfileCompletionPrompt(mount) {
  if (!mount) {
    return;
  }
  mount.hidden = true;
  mount.replaceChildren();
  mount.removeAttribute('role');
  mount.removeAttribute('aria-label');
}

/**
 * @param {Document} documentObject
 * @param {{ showLoadFailure?: boolean }} [options]
 * @returns {HTMLElement | null}
 */
export function renderProfileCompletionPrompt(
  documentObject,
  { showLoadFailure = false } = {},
) {
  const main = documentObject.getElementById('main-content');
  if (!main || typeof documentObject.createElement !== 'function') {
    return null;
  }

  let mount = main.querySelector(`#${PROFILE_COMPLETION_PROMPT_MOUNT_ID}`);
  if (!mount) {
    mount = documentObject.createElement('aside');
    mount.id = PROFILE_COMPLETION_PROMPT_MOUNT_ID;
    mount.className = `${PROFILE_COMPLETION_PROMPT_CLASS}-mount`;
    const banner = main.querySelector('.mvp-auth-state-banner');
    if (banner?.nextSibling) {
      main.insertBefore(mount, banner.nextSibling);
    } else if (banner) {
      banner.after(mount);
    } else {
      main.prepend(mount);
    }
  }

  mount.hidden = false;
  mount.className = `${PROFILE_COMPLETION_PROMPT_CLASS}-mount`;
  mount.setAttribute('role', 'note');
  mount.setAttribute('aria-label', '個人資料提示');
  mount.replaceChildren();

  const prompt = documentObject.createElement('div');
  prompt.className = PROFILE_COMPLETION_PROMPT_CLASS;

  const message = documentObject.createElement('p');
  message.className = `${PROFILE_COMPLETION_PROMPT_CLASS}-message`;
  message.textContent = showLoadFailure
    ? PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE
    : PROFILE_COMPLETION_PROMPT_MESSAGE;

  prompt.append(message);

  if (!showLoadFailure) {
    const actions = documentObject.createElement('p');
    actions.className = `${PROFILE_COMPLETION_PROMPT_CLASS}-actions`;
    const link = documentObject.createElement('a');
    link.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
    link.href = PROFILE_COMPLETION_PROMPT_CTA_HREF;
    link.textContent = PROFILE_COMPLETION_PROMPT_CTA_LABEL;
    actions.append(link);
    prompt.append(actions);
  }

  mount.append(prompt);
  return mount;
}

/**
 * @param {Document} documentObject
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   readLoginStateImpl?: typeof readLoginState,
 *   loginState?: Awaited<ReturnType<typeof readLoginState>>,
 * }} [options]
 */
export async function mountProfileCompletionPrompt(
  documentObject,
  options = {},
) {
  const readLoginStateImpl = options.readLoginStateImpl ?? readLoginState;
  const fetchImpl = options.fetchImpl ?? documentObject.defaultView?.fetch;
  const loginState =
    options.loginState ??
    (typeof readLoginStateImpl === 'function'
      ? await readLoginStateImpl({ fetchImpl })
      : { status: 'anonymous' });

  const main = documentObject.getElementById('main-content');
  const mount = main?.querySelector?.(`#${PROFILE_COMPLETION_PROMPT_MOUNT_ID}`);

  if (loginState.status !== LOGIN_STATE_AUTHENTICATED) {
    clearProfileCompletionPrompt(mount);
    return { status: 'anonymous' };
  }

  try {
    const profile = await loadProfileForPrompt({ fetchImpl });
    if (!isProfileIncomplete(profile)) {
      clearProfileCompletionPrompt(mount);
      return { status: 'complete' };
    }
    renderProfileCompletionPrompt(documentObject);
    return { status: 'incomplete' };
  } catch {
    renderProfileCompletionPrompt(documentObject, { showLoadFailure: true });
    return { status: 'load-failed' };
  }
}
