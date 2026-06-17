import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadAuthStateCopyModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/auth-state-copy.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadRegistrationPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/registration-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginStateUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-ui.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createMinimalChromeDocument(options: { loginStateRead?: string } = {}) {
  const header = {
    id: 'site-header',
    className: '',
    dataset: {
      nav: 'guest',
      active: 'home',
      ...(options.loginStateRead ? { loginStateRead: options.loginStateRead } : {}),
    },
    attributes: new Map<string, string>(),
    children: [] as unknown[],
    replaceChildren() {
      this.children = [];
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
    querySelector() {
      return null;
    },
    ownerDocument: null as unknown,
  };

  const main = {
    id: 'main-content',
    className: 'mvp-page',
    children: [] as unknown[],
    replaceChildren() {
      this.children = [];
    },
    append(...nodes: unknown[]) {
      this.children.push(...nodes);
    },
    querySelector(selector: string) {
      if (selector === '.mvp-auth-state-banner') {
        return (
          this.children.find(
            (child: { className?: string }) =>
              child.className === 'mvp-auth-state-banner',
          ) ?? null
        );
      }
      return null;
    },
    classList: {
      contains() {
        return false;
      },
    },
    ownerDocument: null as unknown,
  };

  const footer = {
    id: 'site-footer',
    replaceChildren() {},
    className: '',
  };

  const doc = {
    readyState: 'complete',
    body: {
      append() {},
    },
    defaultView: {
      location: { search: '' },
      fetch: undefined as typeof fetch | undefined,
    },
    createElement(tagName: string) {
      return {
        tagName: tagName.toUpperCase(),
        className: '',
        href: '',
        textContent: '',
        children: [] as unknown[],
        attributes: new Map<string, string>(),
        dataset: {} as Record<string, string>,
        ownerDocument: doc,
        append(...nodes: unknown[]) {
          this.children.push(...nodes);
        },
        replaceChildren() {
          this.children = [];
        },
        prepend() {},
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        removeAttribute() {},
        classList: {
          classes: new Set<string>(),
          add(value: string) {
            this.classes.add(value);
          },
          contains() {
            return false;
          },
        },
        querySelector() {
          return null;
        },
      };
    },
    createTextNode(text: string) {
      return { nodeType: 3, textContent: text };
    },
    getElementById(id: string) {
      if (id === 'site-header') return header;
      if (id === 'main-content') return main;
      if (id === 'site-footer') return footer;
      return null;
    },
    querySelector() {
      return null;
    },
  };

  header.ownerDocument = doc;
  main.ownerDocument = doc;
  return { doc, header, createElement: doc.createElement };
}

describe('Phase 95 registration/login full flow smoke coverage', () => {
  it('routes guest homepage auth navigation to /registration and /login with flow copy', async () => {
    const homeHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const { AUTH_STATE_COPY, createAuthStateChip, renderSiteHeader } =
      await loadLayoutModule();
    const { createElement } = createMinimalChromeDocument();
    const header = createElement('header') as {
      dataset: Record<string, string>;
      children: unknown[];
    };
    header.dataset.nav = 'guest';

    renderSiteHeader(header, { nav: 'guest' });

    const chip = createAuthStateChip(
      (header as { ownerDocument: { createElement: typeof createElement } }).ownerDocument,
      'guest',
    ) as { href: string; textContent: string };
    expect(chip.href).toBe('/login');
    expect(chip.textContent).toBe(AUTH_STATE_COPY.guestChipLabel);

    const inner = header.children[0] as {
      children: { className: string; children: { textContent: string; href: string }[] }[];
    };
    const actions = inner.children.find((child) => child.className === 'mvp-site-actions');
    const actionNodes = actions!.children;
    expect(actionNodes.some((node) => node.href === '/registration')).toBe(true);
    expect(actionNodes.some((node) => node.href === '/login')).toBe(true);
    expect(
      actionNodes.some((node) => node.textContent === AUTH_STATE_COPY.guestPrimaryCta),
    ).toBe(true);
    expect(
      actionNodes.some((node) => node.textContent === AUTH_STATE_COPY.guestSecondaryCta),
    ).toBe(true);

    expect(homeHtml).toContain('href="/registration"');
    expect(homeHtml).toContain('href="/login"');
    // Phase 301: the homepage keeps register/login access links, but its
    // long-form account-flow copy moved to the login/registration pages and the
    // shared header banner constant (asserted below).
    expect(AUTH_STATE_COPY.bannerGuestBody).toContain('註冊只建立帳號資料');
    expect(AUTH_STATE_COPY.bannerGuestBody).toContain('不會自動登入');
    expect(AUTH_STATE_COPY.bannerGuestBody).toContain('登入後才會在頁首顯示帳號名稱');
  });

  it('keeps /registration chrome from mounting login-state read or calling GET /users/me', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const registrationJs = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const layoutJs = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const { shouldReadLoginState } = await loadLayoutModule();

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(false);
    expect(registrationJs).not.toMatch(/mountLoginStateRead|\/users\/me|\/login\/session/);
    expect(layoutJs).toContain('shouldReadLoginState(header)');
    expect(layoutJs).toContain('mountLoginStateRead(documentObject, options)');
  });

  it('guides registration success to /login without session issuance or signed-in header state', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const { submitRegistrationForm, REGISTRATION_SUCCESS_MESSAGE } =
      await loadRegistrationPageModule();
    const status = { textContent: '' };
    const success = { hidden: true };
    const fields = {
      display_name: {
        tagName: 'INPUT',
        value: 'Smoke Registered User',
        disabled: false,
        attributes: new Map<string, string>(),
        setAttribute() {},
        removeAttribute() {},
        focus: vi.fn(),
      },
      birth_year_month: {
        tagName: 'INPUT',
        value: '1998-07',
        disabled: false,
        attributes: new Map<string, string>(),
        setAttribute() {},
        removeAttribute() {},
        focus: vi.fn(),
      },
      residential_region: {
        tagName: 'SELECT',
        value: 'TW-TPE',
        disabled: false,
        attributes: new Map<string, string>(),
        setAttribute() {},
        removeAttribute() {},
        focus: vi.fn(),
      },
      credential: {
        tagName: 'INPUT',
        value: ' smoke-proof ',
        disabled: false,
        attributes: new Map<string, string>(),
        setAttribute() {},
        removeAttribute() {},
        focus: vi.fn(),
      },
    };
    const submit = {
      tagName: 'BUTTON',
      disabled: false,
      textContent: '註冊',
      attributes: new Map<string, string>(),
      setAttribute() {},
    };
    const form = {
      ownerDocument: {
        getElementById: (id: string) => {
          if (id === 'registration-form-message') return status;
          if (id === 'registration-success') return success;
          return null;
        },
      },
      querySelector: (selector: string) => {
        if (selector === '[name="display_name"]') return fields.display_name;
        if (selector === '[name="birth_year_month"]') return fields.birth_year_month;
        if (selector === '[name="residential_region"]') return fields.residential_region;
        if (selector === '[name="credential"]') return fields.credential;
        if (selector === '#registration-submit') return submit;
        return null;
      },
    };
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe('/registration');
      return {
        status: 201,
        headers: { get: vi.fn(() => null) },
      };
    });

    await expect(submitRegistrationForm(form, { fetchImpl })).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fields.credential.value).toBe('');
    expect(success.hidden).toBe(false);
    expect(status.textContent).toBe(REGISTRATION_SUCCESS_MESSAGE);
    expect(registrationHtml).toContain('href="/login"');
    expect(registrationHtml).toContain('前往登入');
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /\/login\/session|\/users\/me|Set-Cookie|www_session|token_sha256/i,
    );
  });

  it('refreshes GET /users/me after login and shows only display_name in header state', async () => {
    const { submitProductionLoginForm, LOGIN_FORM_SUCCESS_MESSAGE } =
      await loadLoginPageModule();
    const { applyLoginStateIndicator } = await loadLoginStateUiModule();
    const status = { textContent: '' };
    const credential = {
      tagName: 'INPUT',
      value: ' login-proof ',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute() {},
      removeAttribute() {},
      focus: vi.fn(),
    };
    const submit = {
      tagName: 'BUTTON',
      disabled: false,
      textContent: '登入',
      attributes: new Map<string, string>(),
      setAttribute() {},
    };
    const form = {
      ownerDocument: {
        getElementById: (id: string) => (id === 'login-shell-message' ? status : null),
      },
      querySelector: (selector: string) => {
        if (selector === '[name="credential"]') return credential;
        if (selector === '#login-shell-submit') return submit;
        return null;
      },
    };
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 201 }));
    const refreshLoginState = vi.fn(async () => ({
      status: 'authenticated',
      display_name: 'Cookie User',
    }));

    await expect(
      submitProductionLoginForm(form, { fetchImpl, refreshLoginState }),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledWith('/login/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Authorization: 'Bearer login-proof',
      },
    });
    expect(refreshLoginState).toHaveBeenCalledWith(form.ownerDocument, { fetchImpl });
    expect(credential.value).toBe('');
    expect(status.textContent).toBe(LOGIN_FORM_SUCCESS_MESSAGE);

    const mount = {
      className: '',
      id: '',
      textContent: '',
      hidden: false,
      ownerDocument: {
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
      },
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
      removeAttribute() {},
      classList: {
        classes: new Set<string>(),
        add(value: string) {
          this.classes.add(value);
        },
      },
    };

    applyLoginStateIndicator(mount, {
      status: 'authenticated',
      display_name: 'Cookie User',
    });

    const nameEl = mount.children.find(
      (child: { className?: string }) => child.className === 'mvp-login-state-name',
    ) as { textContent: string } | undefined;
    expect(nameEl?.textContent).toBe('Cookie User');
    expect(mount.textContent).not.toMatch(
      /user_id|session|token|cookie|birth_year_month|residential_region|option_id|option_text|option_index/i,
    );
    expect(mount.attributes.get('aria-label')).toBe('已登入：Cookie User');
  });

  it('restores guest/demo auth chips after logout with neutral failure copy', async () => {
    const { LOGIN_LOGOUT_FAILURE_MESSAGE } = await import(
      pathToFileURL(join(process.cwd(), 'public/frontend/login-state-logout.js')).href
    );
    const { applyLoginStateIndicator, handleLoginStateLogout } =
      await loadLoginStateUiModule();

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
        if (selector === '.mvp-auth-state-chip--guest') return guestChip;
        if (selector === '.mvp-auth-state-chip--demo') return demoChip;
        return null;
      },
    };
    const mount = {
      hidden: false,
      className: '',
      id: '',
      textContent: '',
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
      querySelector(selector: string) {
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
      ownerDocument: {
        createElement() {
          return { className: '', textContent: '', setAttribute() {} };
        },
      },
    };

    applyLoginStateIndicator(mount, {
      status: 'authenticated',
      display_name: 'Cookie User',
    });

    const fetchImpl = vi.fn(async () => ({ ok: true, status: 204 }));
    const result = await handleLoginStateLogout(mount, actions, { fetchImpl });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith('/login/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(mount.hidden).toBe(true);
    expect(guestChip.hidden).toBe(false);
    expect(demoChip.hidden).toBe(false);
    expect(LOGIN_LOGOUT_FAILURE_MESSAGE).toBe('目前無法登出，請稍後再試。');
    expect(LOGIN_LOGOUT_FAILURE_MESSAGE).not.toMatch(
      /LOGIN_|session_id|token_sha256|www_session|INTERNAL_ERROR/i,
    );
  });
});
