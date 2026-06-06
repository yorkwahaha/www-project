import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadLoginStateReadModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-read.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginStateUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-ui.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('login state read hook', () => {
  it('parses only display_name from GET /users/me payloads', async () => {
    const { parseAuthenticatedMeBody } = await loadLoginStateReadModule();

    expect(
      parseAuthenticatedMeBody({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: '  Demo User  ',
      }),
    ).toEqual({ display_name: 'Demo User' });
    expect(parseAuthenticatedMeBody({ display_name: '' })).toBeNull();
    expect(
      parseAuthenticatedMeBody({
        display_name: 'Safe',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
        role: 'admin',
      }),
    ).toEqual({ display_name: 'Safe' });
  });

  it('calls GET /users/me with credentials same-origin', async () => {
    const { readLoginState } = await loadLoginStateReadModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Cookie User',
      }),
    }));

    const state = await readLoginState({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith('/users/me', {
      method: 'GET',
      credentials: 'same-origin',
    });
    expect(state).toEqual({
      status: 'authenticated',
      display_name: 'Cookie User',
    });
  });

  it('stays anonymous on 401 without surfacing auth errors', async () => {
    const { readLoginState } = await loadLoginStateReadModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'AUTH_REQUIRED',
        message: 'User authentication is required',
      }),
    }));

    await expect(readLoginState({ fetchImpl })).resolves.toEqual({
      status: 'anonymous',
    });
  });

  it('renders only display_name in the header indicator', async () => {
    const { applyLoginStateIndicator } = await loadLoginStateUiModule();
    const doc = {
      createElement(tagName: string) {
        return {
          tagName: tagName.toUpperCase(),
          className: '',
          textContent: '',
          attributes: new Map<string, string>(),
          setAttribute(name: string, value: string) {
            this.attributes.set(name, value);
          },
        };
      },
    };
    const mount = {
      className: '',
      id: '',
      textContent: '',
      hidden: false,
      ownerDocument: doc,
      attributes: new Map<string, string>(),
      children: [] as unknown[],
      replaceChildren() {
        this.children = [];
        this.textContent = '';
      },
      append(...nodes: unknown[]) {
        this.children.push(...nodes);
      },
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      classList: {
        classes: new Set<string>(),
        add(value: string) {
          this.classes.add(value);
        },
      },
    };

    applyLoginStateIndicator(mount, {
      status: 'authenticated',
      display_name: 'Header User',
    });

    const nameEl = mount.children.find(
      (child: { className?: string }) => child.className === 'mvp-login-state-name',
    ) as { textContent: string } | undefined;
    expect(nameEl?.textContent).toBe('Header User');
    expect(mount.textContent).not.toContain('11111111');
    expect(mount.attributes.get('aria-label')).toBe('已登入：Header User');
    expect(mount.classList.classes.has('mvp-login-state--signed-in')).toBe(true);

    applyLoginStateIndicator(mount, { status: 'anonymous' });
    expect(mount.hidden).toBe(true);
    expect(mount.children).toHaveLength(0);
  });
});
