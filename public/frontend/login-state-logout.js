/**
 * Phase 84 — minimal logout via DELETE /login/session (credentials + browser Origin).
 */

export const LOGIN_LOGOUT_FAILURE_MESSAGE = '目前無法登出，請稍後再試。';

/**
 * @param {{ fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<{ ok: true } | { ok: false }>}
 */
export async function requestLogoutSession({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    return { ok: false };
  }

  try {
    const response = await fetchImpl('/login/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    if (response.status === 204 || response.ok) {
      return { ok: true };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
