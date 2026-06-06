/**
 * Phase 83 — minimal header login-state display (display_name only).
 */

import {
  LOGIN_STATE_ANONYMOUS,
  LOGIN_STATE_AUTHENTICATED,
  readLoginState,
} from './login-state-read.js';

export const LOGIN_STATE_MOUNT_ID = 'mvp-login-state';

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
    mount.textContent = '';
    return;
  }

  mount.hidden = false;
  mount.classList.add('mvp-login-state--signed-in');
  mount.setAttribute('role', 'status');
  mount.textContent = state.display_name;
  mount.setAttribute('aria-label', `已登入：${state.display_name}`);
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
  if (demoChip && authenticated) {
    demoChip.hidden = true;
    demoChip.setAttribute('aria-hidden', 'true');
  }
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
  return state;
}
