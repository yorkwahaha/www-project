/**
 * Phase 106 — neutral Official Vote pre-vote hints.
 */

import {
  LOGIN_STATE_AUTHENTICATED,
  readLoginState,
} from './login-state-read.js';
import {
  PUBLIC_CTA_GO_TO_LOGIN_LABEL,
  PUBLIC_CTA_GO_TO_PROFILE_LABEL,
  PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
  PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
  PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
  PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT,
} from './public-mvp-ui.js';

export const PRE_VOTE_HINT_MOUNT_ID = 'official-vote-pre-vote-hint';
export const PRE_VOTE_HINT_CLASS = 'mvp-official-vote-pre-vote-hint';

export const PRE_VOTE_HINT_COPY = {
  anonymous: PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
  incompleteProfile: PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
  completeProfile: PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
  profileLoadFailed: PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT,
};

export const PRE_VOTE_HINT_LINKS = {
  login: { href: '/login', label: PUBLIC_CTA_GO_TO_LOGIN_LABEL },
  profile: { href: '/profile', label: PUBLIC_CTA_GO_TO_PROFILE_LABEL },
};

/**
 * @param {{ birth_year_month: string | null, residential_region: string | null }} profile
 */
export function isPreVoteProfileIncomplete(profile) {
  return (
    profile.birth_year_month === null || profile.residential_region === null
  );
}

/**
 * @param {unknown} body
 * @returns {{ birth_year_month: string | null, residential_region: string | null } | null}
 */
export function parsePreVoteProfile(body) {
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
export async function loadPreVoteProfile({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('PRE_VOTE_PROFILE_LOAD_FAILED');
  }

  let response;
  try {
    response = await fetchImpl('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new Error('PRE_VOTE_PROFILE_LOAD_FAILED');
  }

  if (!response.ok) {
    throw new Error('PRE_VOTE_PROFILE_LOAD_FAILED');
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('PRE_VOTE_PROFILE_LOAD_FAILED');
  }

  const profile = parsePreVoteProfile(body);
  if (!profile) {
    throw new Error('PRE_VOTE_PROFILE_LOAD_FAILED');
  }
  return profile;
}

function ensurePreVoteHintMount(documentObject) {
  let mount = documentObject.getElementById(PRE_VOTE_HINT_MOUNT_ID);
  if (mount) {
    return mount;
  }
  if (typeof documentObject.createElement !== 'function') {
    return null;
  }

  mount = documentObject.createElement('aside');
  mount.id = PRE_VOTE_HINT_MOUNT_ID;

  const preVoteRegion = documentObject.getElementById('vote-detail-pre-vote-hints');
  if (preVoteRegion && typeof preVoteRegion.append === 'function') {
    preVoteRegion.append(mount);
    return mount;
  }

  const form = documentObject.getElementById('vote-form');
  if (form?.parentElement && typeof form.parentElement.insertBefore === 'function') {
    form.parentElement.insertBefore(mount, form);
    return mount;
  }

  const main = documentObject.getElementById('main-content');
  if (main && typeof main.prepend === 'function') {
    main.prepend(mount);
    return mount;
  }
  return mount;
}

/**
 * @param {Document} documentObject
 * @param {'anonymous'|'profile-incomplete'|'profile-complete'|'profile-load-failed'} state
 * @returns {HTMLElement | null}
 */
export function renderOfficialVotePreVoteHint(documentObject, state) {
  const mount = ensurePreVoteHintMount(documentObject);
  if (!mount) {
    return null;
  }

  const copyByState = {
    anonymous: PRE_VOTE_HINT_COPY.anonymous,
    'profile-incomplete': PRE_VOTE_HINT_COPY.incompleteProfile,
    'profile-complete': PRE_VOTE_HINT_COPY.completeProfile,
    'profile-load-failed': PRE_VOTE_HINT_COPY.profileLoadFailed,
  };
  const linkByState = {
    anonymous: PRE_VOTE_HINT_LINKS.login,
    'profile-incomplete': PRE_VOTE_HINT_LINKS.profile,
    'profile-complete': null,
    'profile-load-failed': null,
  };

  mount.hidden = false;
  mount.className = `${PRE_VOTE_HINT_CLASS} ${PRE_VOTE_HINT_CLASS}--${state}`;
  mount.setAttribute('role', 'note');
  mount.setAttribute('aria-label', '正式投票提醒');
  mount.replaceChildren();

  const message = documentObject.createElement('p');
  message.className = `${PRE_VOTE_HINT_CLASS}-message`;
  message.textContent = copyByState[state];
  mount.append(message);

  const linkConfig = linkByState[state];
  if (linkConfig) {
    const actions = documentObject.createElement('p');
    actions.className = `${PRE_VOTE_HINT_CLASS}-actions`;
    const link = documentObject.createElement('a');
    link.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
    link.href = linkConfig.href;
    link.textContent = linkConfig.label;
    actions.append(link);
    mount.append(actions);
  }

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
export async function mountOfficialVotePreVoteHint(
  documentObject,
  options = {},
) {
  const fetchImpl = options.fetchImpl ?? documentObject.defaultView?.fetch;
  const readLoginStateImpl = options.readLoginStateImpl ?? readLoginState;
  const loginState =
    options.loginState ??
    (typeof readLoginStateImpl === 'function'
      ? await readLoginStateImpl({ fetchImpl })
      : { status: 'anonymous' });

  if (loginState.status !== LOGIN_STATE_AUTHENTICATED) {
    renderOfficialVotePreVoteHint(documentObject, 'anonymous');
    return { status: 'anonymous' };
  }

  try {
    const profile = await loadPreVoteProfile({ fetchImpl });
    if (isPreVoteProfileIncomplete(profile)) {
      renderOfficialVotePreVoteHint(documentObject, 'profile-incomplete');
      return { status: 'profile-incomplete' };
    }
    renderOfficialVotePreVoteHint(documentObject, 'profile-complete');
    return { status: 'profile-complete' };
  } catch {
    renderOfficialVotePreVoteHint(documentObject, 'profile-load-failed');
    return { status: 'profile-load-failed' };
  }
}
