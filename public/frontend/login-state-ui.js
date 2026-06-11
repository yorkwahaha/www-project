/**
 * Phase 83 — minimal header login-state display (display_name only).
 * Phase 84 — logout button beside display_name when signed in.
 */

import {
  LOGIN_STATE_ANONYMOUS,
  LOGIN_STATE_AUTHENTICATED,
  readLoginState,
} from './login-state-read.js';
import { setBusySubmitButton } from './public-mvp-ui.js';
import {
  LOGIN_LOGOUT_FAILURE_MESSAGE,
  requestLogoutSession,
} from './login-state-logout.js';

export const LOGIN_LOGOUT_PENDING_MESSAGE = '登出中，請稍候。';

export const LOGIN_STATE_MOUNT_ID = 'mvp-login-state';
export const LOGIN_STATE_LOGOUT_CLASS = 'mvp-login-state-logout';
export const LOGIN_STATE_ERROR_CLASS = 'mvp-login-state-error';

/**
 * @param {HTMLElement} mount
 * @param {{ status: string, display_name?: string }} state
 */
export function applyLoginStateIndicator(mount, state) {
  if (!mount) {
    return;
  }

  mount.replaceChildren();
  mount.className = 'mvp-login-state';
  mount.id = LOGIN_STATE_MOUNT_ID;
  mount.removeAttribute('hidden');
  mount.removeAttribute('aria-hidden');
  mount.removeAttribute('aria-label');
  mount.removeAttribute('role');

  if (state.status !== LOGIN_STATE_AUTHENTICATED || !state.display_name) {
    mount.hidden = true;
    mount.setAttribute('aria-hidden', 'true');
    return;
  }

  const doc = mount.ownerDocument;
  mount.hidden = false;
  mount.classList.add('mvp-login-state--signed-in');
  mount.setAttribute('role', 'group');
  mount.setAttribute('aria-label', `已登入：${state.display_name}`);

  if (doc && typeof doc.createElement === 'function') {
    const nameEl = doc.createElement('span');
    nameEl.className = 'mvp-login-state-name';
    nameEl.setAttribute('role', 'status');
    nameEl.textContent = state.display_name;

    const logoutBtn = doc.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = LOGIN_STATE_LOGOUT_CLASS;
    logoutBtn.textContent = '登出';
    logoutBtn.setAttribute('aria-label', '登出');

    mount.append(nameEl, logoutBtn);
    return;
  }

  mount.textContent = state.display_name;
}

/**
 * @param {HTMLElement | null | undefined} actions
 * @param {boolean} authenticated
 */
export function syncAuthStateChipsForLoginRead(actions, authenticated) {
  if (!actions) {
    return;
  }
  const guestChip = actions.querySelector('.mvp-auth-state-chip--guest');
  const demoChip = actions.querySelector('.mvp-auth-state-chip--demo');
  if (guestChip) {
    guestChip.hidden = authenticated;
    if (authenticated) {
      guestChip.setAttribute('aria-hidden', 'true');
    } else {
      guestChip.removeAttribute('aria-hidden');
    }
  }
  if (demoChip) {
    if (authenticated) {
      demoChip.hidden = true;
      demoChip.setAttribute('aria-hidden', 'true');
    } else {
      demoChip.hidden = false;
      demoChip.removeAttribute('aria-hidden');
    }
  }
}

/**
 * @param {HTMLElement} mount
 * @param {string} message
 */
export function showLoginStateLogoutError(mount, message = LOGIN_LOGOUT_FAILURE_MESSAGE) {
  if (!mount || mount.hidden) {
    return;
  }
  const doc = mount.ownerDocument;
  if (!doc || typeof doc.createElement !== 'function') {
    return;
  }
  let errorEl = mount.querySelector(`.${LOGIN_STATE_ERROR_CLASS}`);
  if (!errorEl) {
    errorEl = doc.createElement('span');
    errorEl.className = LOGIN_STATE_ERROR_CLASS;
    errorEl.setAttribute('role', 'status');
    mount.append(errorEl);
  }
  errorEl.textContent = message;
}

/**
 * @param {HTMLElement} mount
 */
export function clearLoginStateLogoutError(mount) {
  mount?.querySelector?.(`.${LOGIN_STATE_ERROR_CLASS}`)?.remove?.();
}

/**
 * @param {HTMLElement} mount
 * @param {HTMLElement | null | undefined} actions
 * @param {{ fetchImpl?: typeof fetch }} [options]
 */
export async function handleLoginStateLogout(mount, actions, options = {}) {
  const fetchImpl = options.fetchImpl ?? mount?.ownerDocument?.defaultView?.fetch;
  const logoutBtn = mount?.querySelector?.(`.${LOGIN_STATE_LOGOUT_CLASS}`);
  const idleLabel = '登出';
  if (logoutBtn) {
    setBusySubmitButton(logoutBtn, {
      busy: true,
      idleLabel,
      busyLabel: LOGIN_LOGOUT_PENDING_MESSAGE,
    });
  }
  try {
    const result = await requestLogoutSession({ fetchImpl });
    if (result.ok) {
      clearLoginStateLogoutError(mount);
      applyLoginStateIndicator(mount, { status: LOGIN_STATE_ANONYMOUS });
      syncAuthStateChipsForLoginRead(actions, false);
      return { ok: true };
    }
    showLoginStateLogoutError(mount);
    return { ok: false };
  } finally {
    const currentLogoutBtn = mount?.querySelector?.(
      `.${LOGIN_STATE_LOGOUT_CLASS}`,
    );
    if (currentLogoutBtn) {
      setBusySubmitButton(currentLogoutBtn, {
        busy: false,
        idleLabel,
        busyLabel: LOGIN_LOGOUT_PENDING_MESSAGE,
      });
    }
  }
}

/**
 * @param {HTMLElement} mount
 * @param {HTMLElement | null | undefined} actions
 * @param {{ fetchImpl?: typeof fetch }} [options]
 */
export function wireLoginStateLogout(mount, actions, options = {}) {
  const logoutBtn = mount?.querySelector?.(`.${LOGIN_STATE_LOGOUT_CLASS}`);
  if (!logoutBtn || logoutBtn.dataset.logoutWired === 'true') {
    return;
  }
  logoutBtn.dataset.logoutWired = 'true';
  logoutBtn.addEventListener('click', () => {
    void handleLoginStateLogout(mount, actions, options);
  });
}

/**
 * @param {Document} documentObject
 * @param {{ fetchImpl?: typeof fetch }} [options]
 */
export async function mountLoginStateRead(documentObject, options = {}) {
  const header = documentObject.getElementById('site-header');
  const actions = header?.querySelector?.('.mvp-site-actions');
  if (!actions) {
    return null;
  }

  let mount = actions.querySelector(`#${LOGIN_STATE_MOUNT_ID}`);
  if (!mount) {
    mount = documentObject.createElement('span');
    mount.id = LOGIN_STATE_MOUNT_ID;
    mount.className = 'mvp-login-state';
    const chip = actions.querySelector('.mvp-auth-state-chip');
    if (chip?.nextSibling) {
      actions.insertBefore(mount, chip.nextSibling);
    } else if (chip) {
      chip.after(mount);
    } else {
      actions.prepend(mount);
    }
  }

  const fetchImpl = options.fetchImpl ?? documentObject.defaultView?.fetch;
  const state =
    typeof fetchImpl === 'function'
      ? await readLoginState({ fetchImpl })
      : { status: LOGIN_STATE_ANONYMOUS };
  applyLoginStateIndicator(mount, state);
  syncAuthStateChipsForLoginRead(
    actions,
    state.status === LOGIN_STATE_AUTHENTICATED,
  );
  if (state.status === LOGIN_STATE_AUTHENTICATED) {
    wireLoginStateLogout(mount, actions, options);
  }
  return state;
}
