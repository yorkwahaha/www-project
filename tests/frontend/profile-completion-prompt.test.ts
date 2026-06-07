import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadProfileCompletionPromptModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createPromptDocument(pathname = '/') {
  const mounts = new Map<string, HTMLElement>();
  const mainChildren: HTMLElement[] = [];

  const makeEl = (tag: string, id?: string) => {
    const el = {
      tagName: tag.toUpperCase(),
      id: id ?? '',
      className: '',
      hidden: false,
      textContent: '',
      href: '',
      attributes: new Map<string, string>(),
      children: [] as unknown[],
      ownerDocument: null as Document | null,
      replaceChildren() {
        this.children = [];
        this.textContent = '';
      },
      append(...nodes: unknown[]) {
        this.children.push(...nodes);
      },
      after(node: unknown) {
        const parent = mainChildren;
        const index = parent.indexOf(el as unknown as HTMLElement);
        if (index >= 0) {
          parent.splice(index + 1, 0, node as HTMLElement);
        } else {
          parent.push(node as HTMLElement);
        }
      },
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      getAttribute(name: string) {
        return this.attributes.get(name) ?? null;
      },
      querySelector(selector: string) {
        if (selector === `#profile-completion-prompt-mount`) {
          for (const child of mainChildren) {
            if (
              (child as { id?: string }).id ===
              'profile-completion-prompt-mount'
            ) {
              return child;
            }
          }
          return mounts.get('profile-completion-prompt-mount') ?? null;
        }
        if (selector === '.mvp-auth-state-banner') {
          return null;
        }
        return null;
      },
      insertBefore(node: unknown, ref: unknown) {
        const index = mainChildren.indexOf(ref as HTMLElement);
        if (index >= 0) {
          mainChildren.splice(index, 0, node as HTMLElement);
        } else {
          mainChildren.unshift(node as HTMLElement);
        }
      },
      prepend(node: unknown) {
        mainChildren.unshift(node as HTMLElement);
      },
    };
    if (id) {
      mounts.set(id, el as unknown as HTMLElement);
    }
    return el;
  };

  const main = makeEl('main', 'main-content');
  const documentObject = {
    getElementById(id: string) {
      if (id === 'main-content') {
        return main;
      }
      const fromMap = mounts.get(id);
      if (fromMap) {
        return fromMap;
      }
      for (const child of mainChildren) {
        if ((child as { id?: string }).id === id) {
          return child;
        }
      }
      return null;
    },
    createElement(tag: string) {
      return makeEl(tag);
    },
    defaultView: {
      location: { pathname },
      fetch: undefined,
    },
  };

  main.ownerDocument = documentObject as unknown as Document;
  for (const el of mounts.values()) {
    el.ownerDocument = documentObject as unknown as Document;
  }

  return {
    documentObject: documentObject as unknown as Document,
    main: main as unknown as HTMLElement,
    mounts,
    mainChildren,
  };
}

describe('profile completion prompt runtime', () => {
  it('does not call GET /users/me/profile when unauthenticated', async () => {
    const { mountProfileCompletionPrompt } =
      await loadProfileCompletionPromptModule();
    const { documentObject } = createPromptDocument('/');
    const fetchImpl = vi.fn();

    const result = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'anonymous' },
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'anonymous' });
  });

  it('calls GET /users/me/profile with credentials same-origin when signed in', async () => {
    const { mountProfileCompletionPrompt } =
      await loadProfileCompletionPromptModule();
    const { documentObject } = createPromptDocument('/');
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === '/users/me/profile') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            birth_year_month: null,
            residential_region: 'TW-TPE',
          }),
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const result = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Prompt User' },
    });

    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    expect(result).toEqual({ status: 'incomplete' });
  });

  it('shows prompt and /profile link when either field is null', async () => {
    const {
      mountProfileCompletionPrompt,
      PROFILE_COMPLETION_PROMPT_CTA_HREF,
      PROFILE_COMPLETION_PROMPT_MESSAGE,
    } = await loadProfileCompletionPromptModule();
    const { documentObject } = createPromptDocument('/');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: null,
      }),
    }));

    await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Prompt User' },
    });

    const mount = documentObject.getElementById('profile-completion-prompt-mount');
    expect(mount?.hidden).toBe(false);
    const prompt = mount?.children[0] as {
      children: Array<{ textContent: string; href?: string }>;
    };
    expect(prompt?.children[0]?.textContent).toBe(PROFILE_COMPLETION_PROMPT_MESSAGE);
    const link = prompt?.children[1]?.children?.[0] as { href?: string } | undefined;
    expect(link?.href).toBe(PROFILE_COMPLETION_PROMPT_CTA_HREF);
  });

  it('hides prompt when both profile fields are present', async () => {
    const { mountProfileCompletionPrompt, isProfileIncomplete } =
      await loadProfileCompletionPromptModule();
    const { documentObject } = createPromptDocument('/');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    }));

    expect(
      isProfileIncomplete({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    ).toBe(false);

    const result = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Prompt User' },
    });

    expect(result).toEqual({ status: 'complete' });
    const mount = documentObject.getElementById('profile-completion-prompt-mount');
    expect(mount).toBeNull();
  });

  it('shows neutral load failure copy without technical details', async () => {
    const {
      mountProfileCompletionPrompt,
      PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE,
    } = await loadProfileCompletionPromptModule();
    const { documentObject } = createPromptDocument('/');
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'profile read failed',
      }),
    }));

    const result = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Prompt User' },
    });

    expect(result).toEqual({ status: 'load-failed' });
    const mount = documentObject.getElementById('profile-completion-prompt-mount');
    const prompt = mount?.children[0] as {
      children: Array<{ textContent: string }>;
    };
    expect(prompt?.children[0]?.textContent).toBe(
      PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE,
    );
    expect(prompt?.children[0]?.textContent).not.toContain('INTERNAL');
    expect(prompt?.children[0]?.textContent).not.toContain('500');
  });

  it('does not call vote, registration, login/session, or reference answer APIs', async () => {
    const { loadProfileForPrompt } = await loadProfileCompletionPromptModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: null,
        residential_region: null,
      }),
    }));

    await loadProfileForPrompt({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('/users/me/profile');
    for (const call of fetchImpl.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toMatch(
        /\/vote|\/registration|\/login\/session|reference-answer/i,
      );
    }
  });
});
