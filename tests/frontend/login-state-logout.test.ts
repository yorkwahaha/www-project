import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadLoginStateLogoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-logout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginStateUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-ui.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createElement(tagName: string, doc: ReturnType<typeof createMinimalDocument>) {
  const node = {
    tagName: tagName.toUpperCase(),
    className: '',
    textContent: '',
    hidden: false,
    children: [] as unknown[],
    attributes: new Map<string, string>(),
    dataset: {} as Record<string, string>,
    ownerDocument: doc,
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
    removeAttribute(name: string) {
      this.attributes.delete(name);
    },
    append(...nodes: unknown[]) {
      this.children.push(...nodes);
      for (const child of nodes) {
        if (child && typeof child === 'object' && 'parent' in child) {
          (child as { parent: unknown }).parent = this;
        }
      }
    },
    replaceChildren() {
      this.children = [];
      this.textContent = '';
    },
    querySelector(selector: string) {
      if (selector === '.mvp-login-state-logout') {
        return (
          this.children.find(
            (child: { className?: string }) =>
              child.className === 'mvp-login-state-logout',
          ) ?? null
        );
      }
      if (selector === '.mvp-login-state-error') {
        return (
          this.children.find(
            (child: { className?: string }) =>
              child.className === 'mvp-login-state-error',
          ) ?? null
        );
      }
      return null;
    },
    classList: {
      classes: new Set<string>(),
      add(value: string) {
        this.classes.add(value);
      },
    },
  };
  return node;
}

function createMinimalDocument() {
  const doc = {
    createElement(tagName: string) {
      return createElement(tagName, doc);
    },
    defaultView: { fetch: undefined as typeof fetch | undefined },
  };
  return doc;
}

describe('login state logout hook', () => {
  it('calls DELETE /login/session with credentials same-origin', async () => {
    const { requestLogoutSession } = await loadLoginStateLogoutModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 204,
    }));

    const result = await requestLogoutSession({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith('/login/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(result).toEqual({ ok: true });
  });

  it('treats non-204 failures as logout failure without surfacing API bodies', async () => {
    const { requestLogoutSession, LOGIN_LOGOUT_FAILURE_MESSAGE } =
      await loadLoginStateLogoutModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'LOGIN_SESSION_ORIGIN_REJECTED',
        message: 'Login session mutation origin is not allowed',
      }),
    }));

    await expect(requestLogoutSession({ fetchImpl })).resolves.toEqual({
      ok: false,
    });
    expect(LOGIN_LOGOUT_FAILURE_MESSAGE).toBe('目前無法登出，請稍後再試。');
    expect(LOGIN_LOGOUT_FAILURE_MESSAGE).not.toContain('LOGIN_SESSION');
  });

  it('renders display_name with a logout button when signed in', async () => {
    const { applyLoginStateIndicator, LOGIN_STATE_LOGOUT_CLASS } =
      await loadLoginStateUiModule();
    const doc = createMinimalDocument();
    const mount = createElement('span', doc);

    applyLoginStateIndicator(mount, {
      status: 'authenticated',
      display_name: 'Header User',
    });

    const nameEl = mount.children.find(
      (child: { className?: string }) => child.className === 'mvp-login-state-name',
    ) as { textContent: string } | undefined;
    const logoutBtn = mount.children.find(
      (child: { className?: string }) => child.className === LOGIN_STATE_LOGOUT_CLASS,
    ) as { textContent: string } | undefined;

    expect(nameEl?.textContent).toBe('Header User');
    expect(logoutBtn?.textContent).toBe('登出');
    expect(mount.textContent).not.toContain('11111111');
  });

  it('restores guest/demo chips and hides signed-in display after successful logout', async () => {
    const {
      applyLoginStateIndicator,
      handleLoginStateLogout,
      LOGIN_STATE_MOUNT_ID,
    } = await loadLoginStateUiModule();
    const doc = createMinimalDocument();
    const mount = createElement('span', doc);
    mount.id = LOGIN_STATE_MOUNT_ID;

    const guestChip = {
      className: 'mvp-auth-state-chip mvp-auth-state-chip--guest',
      hidden: true,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
    };
    const demoChip = {
      className: 'mvp-auth-state-chip mvp-auth-state-chip--demo',
      hidden: true,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
    };
    const actions = {
      querySelector(selector: string) {
        if (selector === '.mvp-auth-state-chip--guest') {
          return guestChip;
        }
        if (selector === '.mvp-auth-state-chip--demo') {
          return demoChip;
        }
        return null;
      },
    };

    applyLoginStateIndicator(mount, {
      status: 'authenticated',
      display_name: 'Cookie User',
    });
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 204,
    }));

    const result = await handleLoginStateLogout(mount, actions, { fetchImpl });

    expect(result).toEqual({ ok: true });
    expect(mount.hidden).toBe(true);
    expect(guestChip.hidden).toBe(false);
    expect(demoChip.hidden).toBe(false);
  });

  it('shows a neutral logout failure message without technical details', async () => {
    const { LOGIN_LOGOUT_FAILURE_MESSAGE } = await loadLoginStateLogoutModule();
    const { applyLoginStateIndicator, handleLoginStateLogout } =
      await loadLoginStateUiModule();
    const doc = createMinimalDocument();
    const mount = createElement('span', doc);

    applyLoginStateIndicator(mount, {
      status: 'authenticated',
      display_name: 'Cookie User',
    });
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'INTERNAL_ERROR' }),
    }));

    const result = await handleLoginStateLogout(mount, actionsStub(), {
      fetchImpl,
    });

    expect(result).toEqual({ ok: false });
    const errorEl = mount.querySelector('.mvp-login-state-error') as {
      textContent: string;
    } | null;
    expect(errorEl?.textContent).toBe(LOGIN_LOGOUT_FAILURE_MESSAGE);
    expect(errorEl?.textContent).not.toContain('INTERNAL_ERROR');
  });
});

function actionsStub() {
  return {
    querySelector() {
      return null;
    },
  };
}
