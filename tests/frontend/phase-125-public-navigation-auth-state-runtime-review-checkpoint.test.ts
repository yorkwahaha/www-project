import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_NAV_AUTH_FILES = [
  'public/frontend/public-mvp-layout.js',
  'public/frontend/login-state-read.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/login-state-logout.js',
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

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

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

async function loadProfilePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/profile-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createMinimalDocument() {
  const elements = new Map<string, HTMLElement>();
  function createElement(tagName: string) {
    const node = {
      tagName: tagName.toUpperCase(),
      className: '',
      href: '',
      textContent: '',
      children: [] as unknown[],
      attributes: new Map<string, string>(),
      dataset: {} as Record<string, string>,
      ownerDocument: null as unknown,
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      getAttribute(name: string) {
        return this.attributes.get(name) ?? null;
      },
      append(...nodes: unknown[]) {
        this.children.push(...nodes);
      },
      replaceChildren() {
        this.children = [];
      },
      prepend(node: unknown) {
        this.children.unshift(node);
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
    };
    node.ownerDocument = doc;
    return node;
  }

  const doc = {
    createElement,
    createTextNode(text: string) {
      return { nodeType: 3, textContent: text };
    },
    querySelector() {
      return null;
    },
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
  };

  return { doc, elements, createElement };
}

describe('Phase 125 public navigation auth state runtime review checkpoint', () => {
  it('renders guest visitor chip and login/registration CTAs without user data', async () => {
    const { AUTH_STATE_COPY, renderSiteHeader } = await loadLayoutModule();
    const { createElement } = createMinimalDocument();
    const header = createElement('header');
    header.id = 'site-header';
    header.dataset.nav = 'guest';

    renderSiteHeader(header, { nav: 'guest' });

    const inner = header.children[0] as {
      children: {
        className: string;
        children: { textContent: string; href?: string; className?: string }[];
      }[];
    };
    const actions = inner.children.find((child) => child.className === 'mvp-site-actions');
    expect(actions).toBeTruthy();

    const chip = actions!.children.find((node) =>
      node.className?.includes('mvp-auth-state-chip--guest'),
    );
    expect(chip?.textContent).toBe(AUTH_STATE_COPY.guestChipLabel);
    expect(chip?.href).toBe('/login');

    const labels = actions!.children.map((node) => node.textContent);
    expect(labels).toContain(AUTH_STATE_COPY.guestSecondaryCta);
    expect(labels).toContain(AUTH_STATE_COPY.guestPrimaryCta);
    expect(labels).not.toContain('我的問卷');
    expect(actions!.children.some((node) => node.href === '/registration')).toBe(true);
    expect(actions!.children.some((node) => node.href === '/login')).toBe(true);
    expect(
      actions!.children.some((node) => node.className === 'mvp-login-state-name'),
    ).toBe(false);
  });

  it('renders authenticated header indicator with display_name only', async () => {
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
      display_name: 'Nav User',
    });

    const nameEl = mount.children.find(
      (child: { className?: string }) => child.className === 'mvp-login-state-name',
    ) as { textContent: string } | undefined;
    expect(nameEl?.textContent).toBe('Nav User');
    expect(mount.textContent).not.toMatch(/11111111|user_id|session|creator_session/i);
    expect(mount.attributes.get('aria-label')).toBe('已登入：Nav User');
  });

  it('reads GET /users/me only and falls back to anonymous without echoing payloads', async () => {
    const { readLoginState } = await loadLoginStateReadModule();

    const successFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Cookie User',
        birth_year_month: '1998-07',
      }),
    }));
    const successState = await readLoginState({ fetchImpl: successFetch });
    expect(successFetch).toHaveBeenCalledWith('/users/me', {
      method: 'GET',
      credentials: 'same-origin',
    });
    expect(successState).toEqual({
      status: 'authenticated',
      display_name: 'Cookie User',
    });
    expect(JSON.stringify(successState)).not.toContain('11111111');

    const failingFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));
    await expect(readLoginState({ fetchImpl: failingFetch })).resolves.toEqual({
      status: 'anonymous',
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
    expect(signedIn.hidden).toBe(true);
    expect(unauth.hidden).toBe(false);
    expect(form.listeners.get('submit') ?? []).toHaveLength(0);
  });

  it('hides guest chip after authenticated login-state read sync', async () => {
    const { syncAuthStateChipsForLoginRead } = await loadLoginStateUiModule();
    const guestChip = {
      hidden: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
    };
    const demoChip = {
      hidden: false,
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

    syncAuthStateChipsForLoginRead(actions, true);
    expect(guestChip.hidden).toBe(true);
    expect(guestChip.attributes.get('aria-hidden')).toBe('true');
    expect(demoChip.hidden).toBe(true);
  });

  it('keeps navigation auth runtime away from vote paths and observability sinks', async () => {
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const loginStateUiSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-ui.js'),
      'utf8',
    );
    const loginStateReadSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-read.js'),
      'utf8',
    );

    for (const source of [layoutSource, loginStateUiSource, loginStateReadSource]) {
      expect(source).not.toMatch(
        /\/vote|vote-by-index|reference-answer|users\/me\/profile|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
      );
      expect(source).not.toMatch(/\boption_id\b|option_index|selected_option/);
      expect(source).not.toMatch(/['"]X-User-Id['"]/);
      expect(source).not.toMatch(/\/creator\/session/);
    }
  });

  for (const relativePath of REVIEWED_NAV_AUTH_FILES) {
    it(`keeps reviewed navigation auth copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js')
        ? stripJsComments(raw)
        : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      if (
        relativePath !== 'public/frontend/auth-state-copy.js' &&
        relativePath !== 'public/frontend/public-mvp-layout.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
    });
  }

  it('keeps Phase 125 user-visible auth messages free of forbidden internals', async () => {
    const layout = await loadLayoutModule();
    const logout = await import(
      pathToFileURL(
        join(process.cwd(), 'public/frontend/login-state-logout.js'),
      ).href
    );

    const userVisibleMessages = [
      layout.AUTH_STATE_COPY.guestChipLabel,
      layout.AUTH_STATE_COPY.guestChipAriaLabel,
      layout.AUTH_STATE_COPY.guestPrimaryCta,
      layout.AUTH_STATE_COPY.guestSecondaryCta,
      layout.AUTH_STATE_COPY.demoIdentityChipLabel,
      layout.AUTH_STATE_COPY.bannerGuestBody,
      layout.AUTH_STATE_COPY.bannerNavDemoNote,
      logout.LOGIN_LOGOUT_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
