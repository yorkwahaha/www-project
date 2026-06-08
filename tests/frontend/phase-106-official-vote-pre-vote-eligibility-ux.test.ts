import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadPreVoteHintModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createHintDocument() {
  const elements = new Map<string, HTMLElement>();
  function createElement(tagName: string) {
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      hidden: false,
      href: '',
      attributes: new Map<string, string>(),
      children: [] as unknown[],
      ownerDocument: null as unknown,
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      replaceChildren() {
        this.children = [];
        this.textContent = '';
      },
      append(...nodes: unknown[]) {
        this.children.push(...nodes);
      },
      prepend(node: unknown) {
        this.children.unshift(node);
      },
    };
    element.ownerDocument = documentObject;
    return element;
  }

  const documentObject = {
    createElement,
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
    defaultView: {
      fetch: undefined,
    },
  };

  const main = createElement('main') as unknown as HTMLElement;
  main.id = 'main-content';
  const mount = createElement('aside') as unknown as HTMLElement;
  mount.id = 'official-vote-pre-vote-hint';
  elements.set('main-content', main);
  elements.set('official-vote-pre-vote-hint', mount);

  return { documentObject: documentObject as unknown as Document, mount };
}

function collectText(node: unknown): string {
  const record = node as { textContent?: string; children?: unknown[] };
  return [
    record.textContent ?? '',
    ...(record.children ?? []).map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

function collectLinks(node: unknown): string[] {
  const record = node as { href?: string; children?: unknown[] };
  return [
    record.href ?? '',
    ...(record.children ?? []).flatMap((child) => collectLinks(child)),
  ].filter(Boolean);
}

describe('Phase 106 official vote pre-vote eligibility UX runtime', () => {
  it('shows /login hint for anonymous vote page without reading profile API', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } =
      await loadPreVoteHintModule();
    const { documentObject, mount } = createHintDocument();
    const fetchImpl = vi.fn();
    const readLoginStateImpl = vi.fn(async () => ({ status: 'anonymous' }));

    const result = await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl,
      readLoginStateImpl,
    });

    expect(result).toEqual({ status: 'anonymous' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(readLoginStateImpl).toHaveBeenCalledWith({ fetchImpl });
    expect(collectText(mount)).toContain(PRE_VOTE_HINT_COPY.anonymous);
    expect(collectLinks(mount)).toContain('/login');
  });

  it('reads profile with same-origin credentials and shows /profile hint when either field is null', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } =
      await loadPreVoteHintModule();
    const { documentObject, mount } = createHintDocument();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: null,
        residential_region: 'TW-TPE',
      }),
    }));

    const result = await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Vote User' },
    });

    expect(result).toEqual({ status: 'profile-incomplete' });
    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    expect(collectText(mount)).toContain(PRE_VOTE_HINT_COPY.incompleteProfile);
    expect(collectLinks(mount)).toContain('/profile');
  });

  it('shows neutral vote hint for complete profile without guaranteeing vote result', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } =
      await loadPreVoteHintModule();
    const { documentObject, mount } = createHintDocument();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    }));

    const result = await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Vote User' },
    });

    const text = collectText(mount);
    expect(result).toEqual({ status: 'profile-complete' });
    expect(text).toContain(PRE_VOTE_HINT_COPY.completeProfile);
    expect(text).toContain('此提示不代表一定可以完成投票');
    expect(text).not.toMatch(/符合資格|不符合資格|保證/);
    expect(collectLinks(mount)).toEqual([]);
  });

  it('keeps pre-vote UX away from vote API, option resolution, and option-choice memory', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );
    const { loadPreVoteProfile, isPreVoteProfileIncomplete } =
      await loadPreVoteHintModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: null,
      }),
    }));

    await loadPreVoteProfile({ fetchImpl });

    expect(isPreVoteProfileIncomplete({
      birth_year_month: '1998-07',
      residential_region: null,
    })).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('/users/me/profile');
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /vote-by-index|\/polls\/.*\/vote|option_id|option_index|selected|choice/i,
    );
    expect(source).not.toMatch(
      /vote-by-index|\/polls\/.*\/vote|option_id|option_index|selected|choice|localStorage|sessionStorage|indexedDB|console\.|analytics|metric|trace/i,
    );
  });

  it('keeps /registration unaffected by vote-page pre-vote prompt runtime', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const hintSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).not.toContain('official-vote-pre-vote-hints.js');
    expect(registrationHtml).not.toContain('official-vote-pre-vote-hint');
    expect(hintSource).not.toMatch(/\/registration|POST \/registration/i);
  });
});
