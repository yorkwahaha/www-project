import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const FORBIDDEN_PROMPT_COPY =
  /你符合資格|你不符合資格|\buser_id\b|session_id|token_sha256|www_session|\bcookie\b|option_id|option_index|option_text|eligibility detail|vote_token|shard_id|X-User-Id|creator_session|gender|性別|precise location|精準位置|demographic|analytics linkage/i;

async function loadProfileCompletionPromptModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
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
  };
}

describe('Phase 103 profile completion prompt runtime guard', () => {
  it('keeps anonymous homepage prompt on login-state only without profile API calls', async () => {
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );
    const { mountProfileCompletionPrompt } =
      await loadProfileCompletionPromptModule();
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
    expect(promptSource).toMatch(
      /loginState\.status !== LOGIN_STATE_AUTHENTICATED[\s\S]*return \{ status: 'anonymous' \}/,
    );
    expect(promptSource).toMatch(
      /await loadProfileForPrompt\(\{ fetchImpl \}\)[\s\S]*return \{ status: 'incomplete' \}/,
    );
  });

  it('keeps homepage-only mount behind shouldReadLoginState in shared layout', async () => {
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );

    expect(layoutSource).toContain('shouldReadLoginState');
    expect(layoutSource).toContain('mountProfileCompletionPrompt');
    expect(layoutSource).toMatch(
      /pathname === '\/' \|\| pathname === ''/,
    );
    expect(layoutSource).toMatch(
      /if \(shouldReadLoginState\(header\)\) \{[\s\S]*mountProfileCompletionPrompt/,
    );
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).not.toContain('profile-completion-prompt.js');
  });

  it('keeps signed-in prompt profile read on same-origin GET /users/me/profile with null checks only', async () => {
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );
    const { loadProfileForPrompt, isProfileIncomplete } =
      await loadProfileCompletionPromptModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: null,
        residential_region: 'TW-TPE',
      }),
    }));

    await loadProfileForPrompt({ fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    expect(
      isProfileIncomplete({
        birth_year_month: '1998-07',
        residential_region: null,
      }),
    ).toBe(true);
    expect(
      isProfileIncomplete({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    ).toBe(false);

    expect(promptSource).toMatch(
      /birth_year_month === null \|\| profile\.residential_region === null/,
    );
    expect(promptSource).not.toMatch(/user_id|vote history|option_id|option_index/);
  });

  it('keeps prompt UI out of registration/login/session/vote/reference paths', async () => {
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );
    const serverSource = await readFile(
      join(process.cwd(), 'src/http/server.ts'),
      'utf8',
    );

    expect(promptSource).toContain('/users/me/profile');
    expect(promptSource).not.toMatch(
      /\/registration|\/login\/session|\/vote|reference-answer|PUT \/users\/me\/profile|display_name|window\.location|location\.assign|location\.replace/i,
    );
    expect(serverSource).toContain('/frontend/profile-completion-prompt.js');
    expect(serverSource).not.toMatch(
      /profile-completion-prompt[\s\S]*POST \/registration|profile-completion-prompt[\s\S]*vote-by-index/i,
    );
  });

  it('keeps shared chrome and login-state readers limited to GET /users/me display_name', async () => {
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const loginStateSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-read.js'),
      'utf8',
    );
    const loginStateUiSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-ui.js'),
      'utf8',
    );
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );

    expect(layoutSource).toContain('mountLoginStateRead');
    expect(layoutSource).not.toMatch(/users\/me\/profile|birth_year_month|residential_region/);

    expect(loginStateSource).toContain('/users/me');
    expect(loginStateSource).toContain('display_name');
    expect(loginStateSource).not.toMatch(/birth_year_month|residential_region|users\/me\/profile/);

    expect(loginStateUiSource).toContain('display_name');
    expect(loginStateUiSource).not.toMatch(/birth_year_month|residential_region|users\/me\/profile/);

    expect(promptSource).toContain('PUBLIC_PROFILE_COMPLETION_PROMPT_HINT');
    expect(promptSource).toContain('PROFILE_COMPLETION_PROMPT_MESSAGE');
    expect(promptSource).not.toMatch(/\/users\/me[^/]/);
  });

  it('keeps prompt copy/runtime free of forbidden fields and option linkage', async () => {
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );
    const cssSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp.css'),
      'utf8',
    );

    expect(promptSource, 'public/frontend/profile-completion-prompt.js').not.toMatch(
      FORBIDDEN_PROMPT_COPY,
    );
    expect(cssSource).toContain('.mvp-profile-completion-prompt');
    expect(promptSource).not.toMatch(/console\.|localStorage|sessionStorage|indexedDB/);
    expect(promptSource).toContain("setAttribute('role', 'note')");
    expect(promptSource).toContain("href = PROFILE_COMPLETION_PROMPT_CTA_HREF");
    expect(promptSource).not.toMatch(/auto.?vote|recalculat|backfill/i);
  });
});
