/**
 * Phase 102 — neutral profile completion prompt (homepage only).
 */

import {
  LOGIN_STATE_AUTHENTICATED,
  readLoginState,
} from './login-state-read.js';
import {
  PUBLIC_CTA_GO_TO_PROFILE_LABEL,
  PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
  PUBLIC_PROFILE_COMPLETION_PROMPT_LOADING_STATUS_ARIA_LABEL,
  PUBLIC_PROFILE_COMPLETION_PROMPT_STATUS_ARIA_LABEL,
  PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL,
} from './public-mvp-ui.js';

export const PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL =
  PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL;

export const PROFILE_COMPLETION_PROMPT_MOUNT_ID =
  'profile-completion-prompt-mount';
export const PROFILE_COMPLETION_PROMPT_CLASS =
  'mvp-profile-completion-prompt';

export const PROFILE_COMPLETION_PROMPT_MESSAGE = PUBLIC_PROFILE_COMPLETION_PROMPT_HINT;
export const PROFILE_COMPLETION_PROMPT_CTA_LABEL = PUBLIC_CTA_GO_TO_PROFILE_LABEL;
export const PROFILE_COMPLETION_PROMPT_CTA_HREF = '/profile';
export const PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE =
  '目前無法載入個人資料提示，請稍後再試。';
export const PROFILE_COMPLETION_PROMPT_LOADING_MESSAGE =
  '載入個人資料提示中，請稍候。';

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
  mount.removeAttribute('aria-busy');
}

/**
 * @param {Document} documentObject
 * @param {{ showLoadFailure?: boolean }} [options]
 * @returns {HTMLElement | null}
 */
export function renderProfileCompletionPrompt(
  documentObject,
  { showLoadFailure = false, loading = false } = {},
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
  if (loading) {
    mount.setAttribute('aria-busy', 'true');
    mount.setAttribute('role', 'status');
    mount.setAttribute(
      'aria-label',
      PUBLIC_PROFILE_COMPLETION_PROMPT_LOADING_STATUS_ARIA_LABEL,
    );
  } else {
    mount.removeAttribute('aria-busy');
    mount.setAttribute('role', 'note');
    mount.setAttribute(
      'aria-label',
      PUBLIC_PROFILE_COMPLETION_PROMPT_STATUS_ARIA_LABEL,
    );
  }
  mount.replaceChildren();

  if (loading) {
    const loadingMessage = documentObject.createElement('p');
    loadingMessage.className = `${PROFILE_COMPLETION_PROMPT_CLASS}-loading`;
    loadingMessage.textContent = PROFILE_COMPLETION_PROMPT_LOADING_MESSAGE;
    mount.append(loadingMessage);
    return mount;
  }

  const prompt = documentObject.createElement('div');
  prompt.className = PROFILE_COMPLETION_PROMPT_CLASS;

  if (!showLoadFailure) {
    const status = documentObject.createElement('p');
    status.className = `${PROFILE_COMPLETION_PROMPT_CLASS}-status`;
    status.textContent = PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL;
    prompt.append(status);
  }

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

  if (loginState.status !== LOGIN_STATE_AUTHENTICATED) {
    clearProfileCompletionPrompt(
      main?.querySelector?.(`#${PROFILE_COMPLETION_PROMPT_MOUNT_ID}`),
    );
    return { status: 'anonymous' };
  }

  renderProfileCompletionPrompt(documentObject, { loading: true });

  try {
    const profile = await loadProfileForPrompt({ fetchImpl });
    const mount = main?.querySelector?.(`#${PROFILE_COMPLETION_PROMPT_MOUNT_ID}`);
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
