import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_FRONTEND_FILES = [
  'public/vote.html',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/vote-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/policy-ui-placeholders.js',
  'public/frontend/public-mvp-layout.js',
];

async function loadPreVoteHintModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createHintDocument() {
  const elements = new Map<string, HTMLElement>();
  let documentObject: Document;

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

  documentObject = {
    createElement,
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
    defaultView: {
      fetch: undefined,
    },
  } as unknown as Document;

  const main = createElement('main') as unknown as HTMLElement;
  main.id = 'main-content';
  const mount = createElement('aside') as unknown as HTMLElement;
  mount.id = 'official-vote-pre-vote-hint';
  elements.set('main-content', main);
  elements.set('official-vote-pre-vote-hint', mount);

  return { documentObject, mount };
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

describe('Phase 107 official vote pre-vote UX runtime guard', () => {
  it('keeps anonymous vote-page hint on /login guidance without profile reads', async () => {
    const { mountOfficialVotePreVoteHint } = await loadPreVoteHintModule();
    const { documentObject, mount } = createHintDocument();
    const fetchImpl = vi.fn(async () => {
      throw new Error('anonymous pre-vote hint must not fetch profile');
    });
    const readLoginStateImpl = vi.fn(async () => ({ status: 'anonymous' }));

    const result = await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl,
      readLoginStateImpl,
    });

    const text = collectText(mount);
    expect(result).toEqual({ status: 'anonymous' });
    expect(readLoginStateImpl).toHaveBeenCalledWith({ fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(collectLinks(mount)).toContain('/login');
    expect(text).not.toMatch(/birth_year_month|residential_region|出生年月|居住地區/);
    expect(text).not.toMatch(/符合資格|不符合資格|年齡門檻|地區條件/);
  });

  it('keeps signed-in profile parsing limited to two nullable completion fields', async () => {
    const {
      isPreVoteProfileIncomplete,
      loadPreVoteProfile,
      parsePreVoteProfile,
    } = await loadPreVoteHintModule();
    const body = {
      birth_year_month: '1999-03',
      residential_region: 'TW-TPE',
      age_passed: false,
      region_passed: false,
      trust_passed: false,
      role_passed: false,
      can_vote: false,
    };
    const parsed = parsePreVoteProfile(body);
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => body,
    }));

    expect(Object.keys(parsed).sort()).toEqual([
      'birth_year_month',
      'residential_region',
    ]);
    expect(parsed).toEqual({
      birth_year_month: '1999-03',
      residential_region: 'TW-TPE',
    });
    expect(isPreVoteProfileIncomplete(parsed)).toBe(false);

    await expect(loadPreVoteProfile({ fetchImpl })).resolves.toEqual(parsed);
    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
  });

  it('keeps pre-vote hint runtime separate from vote APIs and option identity', async () => {
    const hintSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(hintSource).toContain('/users/me/profile');
    expect(hintSource).toContain("credentials: 'same-origin'");
    expect(hintSource).not.toMatch(
      /vote-by-index|\/polls\/[^'"]*\/vote|option_id|option_index|selectedOption|selected option|localStorage|sessionStorage|indexedDB|document\.cookie|console\.|analytics|metric|trace/i,
    );
    expect(hintSource).not.toMatch(
      /age_passed|region_passed|trust_passed|role_passed|can_vote|eligible|ineligible/i,
    );

    expect(voteSource).toContain('mountOfficialVotePreVoteHint');
    expect(voteSource).not.toContain('/users/me/profile');
    expect(voteSource).not.toMatch(/option_id|vote_token|token_sha256|shard_id/);
  });

  it('keeps reviewed frontend copy free of eligibility outcomes and internal identifiers', async () => {
    const forbiddenOutcomeCopy =
      /你符合資格|你不符合資格|符合資格者|不符合資格|符合此問卷|不符合此問卷|年齡門檻|地區條件|trust rule|role rule/i;
    const forbiddenInternalCopy =
      /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b/i;

    for (const relativePath of REVIEWED_FRONTEND_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(forbiddenOutcomeCopy);
      expect(source, relativePath).not.toMatch(forbiddenInternalCopy);
    }
  });

  it('preserves registration opt-out and Reference Answer separation from profile eligibility', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const hintSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).not.toContain('official-vote-pre-vote-hints.js');
    expect(hintSource).not.toMatch(/reference-answer|Reference Answer/i);
    expect(voteSource).not.toMatch(/reference-answer|Reference Answer/i);
  });
});
