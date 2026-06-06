import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
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

describe('public mvp layout demo nav', () => {
  it('parses only known nav query values', async () => {
    const { parseDemoNavMode, VALID_DEMO_NAV_MODES, resolveDemoNavMode } =
      await loadLayoutModule();

    expect(VALID_DEMO_NAV_MODES).toContain('logged-in-mock');
    expect(parseDemoNavMode('?nav=guest')).toBe('guest');
    expect(parseDemoNavMode('?nav=logged-in-mock')).toBe('logged-in-mock');
    expect(parseDemoNavMode('?nav=real-auth')).toBeNull();
    expect(parseDemoNavMode('')).toBeNull();
  });

  it('prefers URL nav over header data-nav', async () => {
    const { resolveDemoNavMode } = await loadLayoutModule();
    const header = { dataset: { nav: 'logged-in-mock' } };

    expect(resolveDemoNavMode(header, '?nav=guest')).toBe('guest');
    expect(resolveDemoNavMode(header, '')).toBe('logged-in-mock');
    expect(resolveDemoNavMode(null, '')).toBe('guest');
  });

  it('allows pages to opt out of shared login-state reads', async () => {
    const { shouldReadLoginState } = await loadLayoutModule();

    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'enabled' } })).toBe(
      true,
    );
    expect(shouldReadLoginState(null)).toBe(true);
  });

  it('renders guest auth chip and /login CTAs in the site header', async () => {
    const {
      AUTH_STATE_COPY,
      createAuthStateChip,
      renderSiteHeader,
    } = await loadLayoutModule();
    const { doc, createElement } = createMinimalDocument();
    const header = createElement('header');
    header.id = 'site-header';
    header.dataset.nav = 'guest';

    renderSiteHeader(header, { nav: 'guest' });

    const chip = createAuthStateChip(doc, 'guest');
    expect(chip.href).toBe('/login');
    expect(chip.textContent).toBe(AUTH_STATE_COPY.guestChipLabel);
    expect(header.children.length).toBeGreaterThan(0);

    const inner = header.children[0] as {
      children: { className: string; children: { textContent: string; href: string }[] }[];
    };
    const actions = inner.children.find((child) => child.className === 'mvp-site-actions');
    expect(actions).toBeTruthy();
    const actionNodes = actions!.children;
    const labels = actionNodes.map((node) => node.textContent);
    expect(labels).toContain(AUTH_STATE_COPY.guestSecondaryCta);
    expect(labels).toContain(AUTH_STATE_COPY.guestPrimaryCta);
    expect(actionNodes.some((node) => node.href === '/registration')).toBe(true);
    expect(actionNodes.some((node) => node.href === '/login')).toBe(true);
  });

  it('renders demo identity chip instead of avatar for logged-in-mock nav', async () => {
    const { AUTH_STATE_COPY, renderSiteHeader } = await loadLayoutModule();
    const { createElement } = createMinimalDocument();
    const header = createElement('header');

    renderSiteHeader(header, { nav: 'logged-in-mock' });

    const inner = header.children[0] as {
      children: { className: string; children: { textContent: string; className: string }[] }[];
    };
    const actions = inner.children.find((child) => child.className === 'mvp-site-actions');
    const chip = actions!.children.find(
      (node) => node.className === 'mvp-auth-state-chip mvp-auth-state-chip--demo',
    );
    expect(chip?.textContent).toBe(AUTH_STATE_COPY.demoIdentityChipLabel);
    expect(
      actions!.children.some((node) => node.className === 'mvp-avatar'),
    ).toBe(false);
  });

  it('injects auth state banner for guest and logged-in-mock modes', async () => {
    const { AUTH_STATE_COPY, renderAuthStateBanner } = await loadLayoutModule();
    const { createElement } = createMinimalDocument();
    const main = createElement('main');
    main.id = 'main-content';

    renderAuthStateBanner(main, 'guest');
    expect(main.children[0]).toMatchObject({
      className: 'mvp-auth-state-banner',
    });
    const guestBanner = main.children[0] as {
      attributes: Map<string, string>;
      children: { className: string; children: { textContent: string }[] }[];
    };
    expect(guestBanner.attributes.get('aria-label')).toBe(
      AUTH_STATE_COPY.bannerAriaLabel,
    );
    const lead = guestBanner.children.find(
      (child) => child.className === 'mvp-auth-state-banner-lead',
    );
    expect(lead?.children[0]?.textContent).toBe(AUTH_STATE_COPY.bannerGuestLead);

    main.children = [];
    renderAuthStateBanner(main, 'logged-in-mock');
    const mockBanner = main.children[0] as { children: { textContent: string }[] };
    expect(
      mockBanner.children.some((child) =>
        child.textContent.includes(AUTH_STATE_COPY.bannerNavDemoNote),
      ),
    ).toBe(true);
  });
});
