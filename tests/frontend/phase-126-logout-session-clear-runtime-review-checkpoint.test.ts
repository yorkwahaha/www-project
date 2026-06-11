import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_LOGOUT_FILES = [
  'public/frontend/login-state-logout.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/login-state-read.js',
  'public/registration.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|can_vote|age_passed|region_passed|trust_passed|role_passed|profile completeness|資料完整度/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|raw_count|poll_option_vote_counters/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadLogoutModule() {
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

async function loadLoginStateReadModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-read.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadProfilePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/profile-page.js'),
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
      if (selector === '.mvp-login-state-name') {
        return (
          this.children.find(
            (child: { className?: string }) =>
              child.className === 'mvp-login-state-name',
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

function createAuthChipActions() {
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
  return {
    guestChip,
    demoChip,
    actions: {
      querySelector(selector: string) {
        if (selector === '.mvp-auth-state-chip--guest') return guestChip;
        if (selector === '.mvp-auth-state-chip--demo') return demoChip;
        return null;
      },
    },
  };
}

describe('Phase 126 logout session clear runtime review checkpoint', () => {
  it('calls DELETE /login/session only through the formal login session boundary', async () => {
    const { requestLogoutSession } = await loadLogoutModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 204,
    }));

    const result = await requestLogoutSession({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith('/login/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(result).toEqual({ ok: true });
  });

  it('resets header to anonymous guest state after successful logout', async () => {
    const {
      applyLoginStateIndicator,
      handleLoginStateLogout,
      LOGIN_STATE_LOGOUT_CLASS,
    } = await loadLoginStateUiModule();
    const doc = createMinimalDocument();
    const mount = createElement('span', doc);
    const { guestChip, demoChip, actions } = createAuthChipActions();

    applyLoginStateIndicator(mount, {
      status: 'authenticated',
      display_name: 'Cookie User',
    });
    expect(
      mount.children.some(
        (child: { className?: string }) => child.className === LOGIN_STATE_LOGOUT_CLASS,
      ),
    ).toBe(true);

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 204,
    }));
    const result = await handleLoginStateLogout(mount, actions, { fetchImpl });

    expect(result).toEqual({ ok: true });
    expect(mount.hidden).toBe(true);
    expect(mount.querySelector('.mvp-login-state-name')).toBeNull();
    expect(mount.querySelector('.mvp-login-state-logout')).toBeNull();
    expect(mount.textContent).not.toMatch(/Cookie User|user_id|session|creator_session/i);
    expect(guestChip.hidden).toBe(false);
    expect(demoChip.hidden).toBe(false);
  });

  it('maps logout failures to frontend-owned copy without echoing backend payloads', async () => {
    const { requestLogoutSession, LOGIN_LOGOUT_FAILURE_MESSAGE } =
      await loadLogoutModule();
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
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));

    const requestResult = await requestLogoutSession({ fetchImpl });
    expect(requestResult).toEqual({ ok: false });
    expect(JSON.stringify(requestResult)).not.toMatch(/option_id|vote_token/i);

    const handleResult = await handleLoginStateLogout(mount, actionsStub(), {
      fetchImpl,
    });
    expect(handleResult).toEqual({ ok: false });
    const errorEl = mount.querySelector('.mvp-login-state-error') as {
      textContent: string;
    } | null;
    expect(errorEl?.textContent).toBe(LOGIN_LOGOUT_FAILURE_MESSAGE);
    expect(errorEl?.textContent).not.toMatch(/INTERNAL|option_id|vote_token/i);
  });

  it('keeps auth reread anonymous after session clear without echoing backend payloads', async () => {
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
    expect(fetchImpl).toHaveBeenCalledWith('/users/me', {
      method: 'GET',
      credentials: 'same-origin',
    });
  });

  it('keeps registration off shared login-state reads', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const { shouldReadLoginState } = await loadLayoutModule();

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );
  });

  it('keeps unauthenticated profile path off profile form and /users/me/profile', async () => {
    const { mountProfilePage } = await loadProfilePageModule();
    const readLoginStateImpl = vi.fn(async () => ({ status: 'anonymous' }));
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      return { ok: true, json: async () => ({}) };
    });

    const elements = new Map<string, {
      tagName: string;
      hidden: boolean;
      textContent: string;
      listeners: Map<string, Array<() => void>>;
      elements: Record<string, { value: string; disabled: boolean }>;
    }>();
    const makeEl = (tag: string, id?: string) => {
      const el = {
        tagName: tag.toUpperCase(),
        id: id ?? '',
        hidden: false,
        textContent: '',
        disabled: false,
        attributes: new Map<string, string>(),
        listeners: new Map<string, Array<() => void>>(),
        elements: {
          birth_year_month: { value: '', disabled: false },
          residential_region: { value: '', disabled: false },
          namedItem(name: string) {
            return this[name as keyof typeof this] ?? null;
          },
        },
        ownerDocument: null as Document | null,
        setAttribute() {},
        removeAttribute() {},
        addEventListener(type: string, listener: () => void) {
          const list = this.listeners.get(type) ?? [];
          list.push(listener);
          this.listeners.set(type, list);
        },
        querySelector() {
          return null;
        },
      };
      if (id) {
        elements.set(id, el);
      }
      return el;
    };

    const form = makeEl('form', 'profile-form');
    const message = makeEl('p', 'profile-form-message');
    const unauth = makeEl('section', 'profile-unauthenticated');
    const signedIn = makeEl('div', 'profile-signed-in-panel');

    const documentObject = {
      getElementById(id: string) {
        return elements.get(id) ?? null;
      },
    };

    for (const el of [form, message, unauth, signedIn]) {
      el.ownerDocument = documentObject as unknown as Document;
    }

    const result = await mountProfilePage(documentObject, {
      fetchImpl,
      readLoginStateImpl,
    });

    expect(result).toEqual({ status: 'unauthenticated' });
    expect(readLoginStateImpl).toHaveBeenCalledTimes(1);
    expect(fetchCalls).toHaveLength(0);
    expect(form.listeners.get('submit') ?? []).toHaveLength(0);
  });

  it('keeps logout runtime away from creator_session, vote paths, and observability sinks', async () => {
    const logoutSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-logout.js'),
      'utf8',
    );
    const uiSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-ui.js'),
      'utf8',
    );

    for (const source of [logoutSource, uiSource]) {
      expect(source).not.toMatch(
        /\/vote|vote-by-index|reference-answer|users\/me\/profile|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
      );
      expect(source).not.toMatch(/\boption_id\b|option_index|selected_option/);
      expect(source).not.toMatch(/['"]X-User-Id['"]/);
      expect(source).not.toMatch(/\/creator\/session/);
    }
  });

  for (const relativePath of REVIEWED_LOGOUT_FILES) {
    it(`keeps reviewed logout copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js')
        ? stripJsComments(raw)
        : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    });
  }

  it('keeps Phase 126 user-visible logout messages free of forbidden internals', async () => {
    const logout = await loadLogoutModule();

    expect(logout.LOGIN_LOGOUT_FAILURE_MESSAGE).toBe('目前無法登出，請稍後再試。');
    expect(logout.LOGIN_LOGOUT_FAILURE_MESSAGE).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(logout.LOGIN_LOGOUT_FAILURE_MESSAGE).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });
});

function actionsStub() {
  return {
    querySelector() {
      return null;
    },
  };
}
