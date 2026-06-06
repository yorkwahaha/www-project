/**
 * Phase 83 — read authenticated identity via GET /users/me (display_name only in UI).
 */

export const LOGIN_STATE_AUTHENTICATED = 'authenticated';
export const LOGIN_STATE_ANONYMOUS = 'anonymous';

/**
 * @param {unknown} body
 * @returns {{ display_name: string } | null}
 */
export function parseAuthenticatedMeBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const record = /** @type {Record<string, unknown>} */ (body);
  const displayName = record.display_name;
  if (typeof displayName !== 'string') {
    return null;
  }
  const trimmed = displayName.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return { display_name: trimmed };
}

/**
 * @param {{ fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<{ status: typeof LOGIN_STATE_AUTHENTICATED, display_name: string } | { status: typeof LOGIN_STATE_ANONYMOUS }>}
 */
export async function readLoginState({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    return { status: LOGIN_STATE_ANONYMOUS };
  }

  try {
    const response = await fetchImpl('/users/me', {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (response.status === 401 || response.status === 403) {
      return { status: LOGIN_STATE_ANONYMOUS };
    }
    if (!response.ok) {
      return { status: LOGIN_STATE_ANONYMOUS };
    }

    const body = await response.json();
    const identity = parseAuthenticatedMeBody(body);
    if (!identity) {
      return { status: LOGIN_STATE_ANONYMOUS };
    }

    return {
      status: LOGIN_STATE_AUTHENTICATED,
      display_name: identity.display_name,
    };
  } catch {
    return { status: LOGIN_STATE_ANONYMOUS };
  }
}
