import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_PROMPT_FILES = [
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/public-mvp-layout.js',
  'public/frontend/login-state-read.js',
  'public/registration.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|option_index|option_text|vote_token|token_sha256|shard_id|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadPromptModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createPromptDocument() {
  const mainChildren: unknown[] = [];
  const main = {
    querySelector(selector: string) {
      if (selector === '#profile-completion-prompt-mount') {
        return null;
      }
      if (selector === '.mvp-auth-state-banner') {
        return null;
      }
      return null;
    },
    prepend(node: unknown) {
      mainChildren.unshift(node);
    },
    insertBefore() {},
  };

  const documentObject = {
    getElementById(id: string) {
      if (id === 'main-content') {
        return main;
      }
      return null;
    },
    createElement(tag: string) {
      return {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        hidden: false,
        textContent: '',
        href: '',
        attributes: new Map<string, string>(),
        children: [] as unknown[],
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        removeAttribute(name: string) {
          this.attributes.delete(name);
        },
        replaceChildren() {
          this.children = [];
        },
        append(...nodes: unknown[]) {
          this.children.push(...nodes);
        },
      };
    },
    defaultView: {
      location: { pathname: '/' },
      fetch: undefined,
    },
  };

  return {
    documentObject: documentObject as unknown as Document,
    fetchCalls: [] as Array<{ url: string; init?: RequestInit }>,
    mainChildren,
  };
}

describe('Phase 127 homepage profile prompt runtime review checkpoint', () => {
  it('mounts profile prompt only on homepage behind shouldReadLoginState', async () => {
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const { shouldReadLoginState } = await loadLayoutModule();

    expect(layoutSource).toContain('mountProfileCompletionPrompt');
    expect(layoutSource).toMatch(/pathname === '\/' \|\| pathname === ''/);
    expect(layoutSource).toMatch(
      /if \(shouldReadLoginState\(header\)\) \{[\s\S]*mountProfileCompletionPrompt/,
    );
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );
  });

  it('keeps anonymous homepage visitors off GET /users/me/profile and completeness UI', async () => {
    const { mountProfileCompletionPrompt } = await loadPromptModule();
    const { documentObject, fetchCalls } = createPromptDocument();
    const fetchImpl = vi.fn(async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      return { ok: true, json: async () => ({}) };
    });

    const result = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'anonymous' },
    });

    expect(result).toEqual({ status: 'anonymous' });
    expect(fetchCalls).toHaveLength(0);
  });

  it('reads GET /users/me/profile only after sign-in with null-only completeness checks', async () => {
    const {
      loadProfileForPrompt,
      isProfileIncomplete,
      parseProfileForPrompt,
      mountProfileCompletionPrompt,
      PROFILE_COMPLETION_PROMPT_CTA_HREF,
    } = await loadPromptModule();
    const { documentObject, fetchCalls } = createPromptDocument();

    const profileFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: null,
        residential_region: 'TW-TPE',
        can_vote: true,
        age_passed: true,
      }),
    }));

    await loadProfileForPrompt({ fetchImpl: profileFetch });
    expect(profileFetch).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    expect(
      parseProfileForPrompt({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
        can_vote: false,
      }),
    ).toEqual({
      birth_year_month: '1998-07',
      residential_region: 'TW-TPE',
    });

    expect(
      isProfileIncomplete({
        birth_year_month: null,
        residential_region: 'TW-TPE',
      }),
    ).toBe(true);
    expect(
      isProfileIncomplete({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    ).toBe(false);

    const mountFetch = vi.fn(async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          birth_year_month: null,
          residential_region: 'TW-TPE',
        }),
      };
    });
    const incompleteResult = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl: mountFetch,
      loginState: { status: 'authenticated', display_name: 'Home User' },
    });
    expect(incompleteResult).toEqual({ status: 'incomplete' });
    expect(fetchCalls).toHaveLength(1);
    expect(PROFILE_COMPLETION_PROMPT_CTA_HREF).toBe('/profile');
  });

  it('clears prompt for complete profiles without showing eligibility outcomes', async () => {
    const { mountProfileCompletionPrompt } = await loadPromptModule();
    const { documentObject, fetchCalls } = createPromptDocument();
    const fetchImpl = vi.fn(async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      return {
        ok: true,
        json: async () => ({
          birth_year_month: '1998-07',
          residential_region: 'TW-TPE',
          age_passed: false,
          region_passed: false,
        }),
      };
    });

    const result = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Home User' },
    });

    expect(result).toEqual({ status: 'complete' });
    expect(fetchCalls).toHaveLength(1);
  });

  it('maps profile prompt load failures to frontend-owned copy without echoing payloads', async () => {
    const {
      mountProfileCompletionPrompt,
      PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE,
      renderProfileCompletionPrompt,
    } = await loadPromptModule();
    const { documentObject } = createPromptDocument();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));

    const result = await mountProfileCompletionPrompt(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Home User' },
    });

    expect(result).toEqual({ status: 'load-failed' });
    const mount = renderProfileCompletionPrompt(documentObject, {
      showLoadFailure: true,
    }) as {
      children: { children: { textContent: string }[] }[];
    } | null;
    const prompt = mount?.children[0];
    const message = prompt?.children.find(
      (child) => child.textContent === PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE,
    );
    expect(message?.textContent).toBe(PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE);
    expect(message?.textContent).not.toMatch(/option_id|vote_token|INTERNAL/i);
  });

  it('keeps registration off login-state read and homepage profile prompt', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).not.toContain('profile-completion-prompt.js');
  });

  it('keeps profile prompt runtime away from vote paths and observability sinks', async () => {
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );

    expect(promptSource).not.toMatch(
      /\/vote|vote-by-index|reference-answer|\/login\/session|\/registration|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
    expect(promptSource).not.toMatch(/\boption_id\b|selected_option/);
    expect(promptSource).not.toMatch(/\/creator\/session/);
    expect(promptSource).not.toMatch(/PUT.*users\/me\/profile/);
  });

  for (const relativePath of REVIEWED_PROMPT_FILES) {
    it(`keeps reviewed homepage prompt copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js')
        ? stripJsComments(raw)
        : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      if (relativePath === 'public/frontend/profile-completion-prompt.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
        expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      }
    });
  }

  it('keeps Phase 127 user-visible prompt messages free of forbidden internals', async () => {
    const prompt = await loadPromptModule();

    const userVisibleMessages = [
      prompt.PROFILE_COMPLETION_PROMPT_MESSAGE,
      prompt.PROFILE_COMPLETION_PROMPT_CTA_LABEL,
      prompt.PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
    }

    expect(prompt.PROFILE_COMPLETION_PROMPT_MESSAGE).toContain(
      '不代表你一定符合或不符合任何投票資格',
    );
    expect(prompt.PROFILE_COMPLETION_PROMPT_MESSAGE).not.toMatch(/可以投票|一定能投票/i);
  });
});
