import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const AUTH_PROFILE_SURFACES = [
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/login-state-read.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/login-state-logout.js',
  'public/frontend/profile-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/public-mvp-layout.js',
  'public/registration.html',
  'public/login.html',
  'public/profile.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 134 auth profile flow milestone review checkpoint', () => {
  it('keeps /registration off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const { normalizeRegistrationFormInput, submitRegistrationRequest } =
      await loadModule('public/frontend/registration-page.js');
    const { shouldReadLoginState } = await loadModule('public/frontend/public-mvp-layout.js');

    const normalized = normalizeRegistrationFormInput({
      displayName: ' Milestone User ',
      birthYearMonth: '1998-07',
      residentialRegion: 'TW-TPE',
      credential: 'proof',
    });
    expect(Object.keys(normalized.profile).sort()).toEqual(
      ['birth_year_month', 'display_name', 'residential_region'].sort(),
    );

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/registration');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({
        display_name: 'Milestone User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      });
      return { status: 201 };
    });
    await submitRegistrationRequest({
      profile: normalized.profile,
      credential: normalized.credential,
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).toContain('href="/login"');
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );
  });

  it('keeps /login on POST /login/session then GET /users/me display_name only', async () => {
    const { submitProductionLoginCredential, submitProductionLoginForm } =
      await loadModule('public/frontend/login-page.js');
    const { parseAuthenticatedMeBody } = await loadModule(
      'public/frontend/login-state-read.js',
    );
    const loginFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/login/session');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer login-proof',
      });
      return { status: 201 };
    });
    await expect(
      submitProductionLoginCredential({
        credential: 'login-proof',
        fetchImpl: loginFetch,
      }),
    ).resolves.toEqual({ ok: true });

    const status = { textContent: '' };
    const credential = {
      tagName: 'INPUT',
      value: 'login-proof',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute() {},
      removeAttribute() {},
      focus: vi.fn(),
    };
    const form = {
      tagName: 'FORM',
      ownerDocument: { getElementById: () => status },
      querySelector: () => credential,
      elements: { credential: { disabled: false } },
    };
    const refreshLoginState = vi.fn(async () => ({
      status: 'authenticated',
      display_name: 'Milestone User',
    }));
    await expect(
      submitProductionLoginForm(form, {
        fetchImpl: vi.fn(async () => ({ status: 201 })),
        refreshLoginState,
      }),
    ).resolves.toEqual({ ok: true });
    expect(refreshLoginState).toHaveBeenCalledTimes(1);
    expect(
      parseAuthenticatedMeBody({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Milestone User',
      }),
    ).toEqual({ display_name: 'Milestone User' });
  });

  it('keeps header auth read on GET /users/me with anonymous fallback', async () => {
    const { readLoginState } = await loadModule('public/frontend/login-state-read.js');
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe('/users/me');
      return {
        ok: true,
        status: 200,
        json: async () => ({ user_id: 'secret', display_name: 'Header User' }),
      };
    });

    const state = await readLoginState({ fetchImpl });
    expect(state).toEqual({
      status: 'authenticated',
      display_name: 'Header User',
    });
    expect(JSON.stringify(state)).not.toMatch(/secret|user_id/i);
  });

  it('keeps logout on DELETE /login/session without creator_session', async () => {
    const { requestLogoutSession } = await loadModule(
      'public/frontend/login-state-logout.js',
    );
    const logoutSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/login-state-logout.js'), 'utf8'),
    );

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/login/session');
      expect(init?.method).toBe('DELETE');
      return { ok: true, status: 204 };
    });
    await expect(requestLogoutSession({ fetchImpl })).resolves.toEqual({ ok: true });
    expect(logoutSource).not.toMatch(/creator_session|\/creator\/session/i);
  });

  it('keeps /profile unauthenticated without profile API and authenticated with profile field allowlist', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const loginState = await loadModule('public/frontend/login-state-read.js');

    const message = { textContent: '' };
    const unauth = { hidden: true };
    const signedIn = { hidden: false };
    const form = {
      tagName: 'FORM',
      hidden: false,
      disabled: false,
      listeners: new Map<string, Array<() => void>>(),
      elements: {
        birth_year_month: { value: '', disabled: false },
        residential_region: { value: '', disabled: false },
        namedItem() {
          return null;
        },
      },
      addEventListener() {},
      querySelector: () => null,
      ownerDocument: null as unknown,
    };
    const unauthDoc = {
      getElementById: (id: string) => {
        if (id === 'profile-form') return form;
        if (id === 'profile-form-message') return message;
        if (id === 'profile-unauthenticated') return unauth;
        if (id === 'profile-signed-in-panel') return signedIn;
        return null;
      },
    };
    const fetchCalls: string[] = [];
    const unauthResult = await profile.mountProfilePage(unauthDoc as unknown as Document, {
      readLoginStateImpl: vi.fn(async () => ({ status: 'anonymous' })),
      fetchImpl: vi.fn(async (url) => {
        fetchCalls.push(String(url));
        return { ok: true, json: async () => ({}) };
      }),
    });
    expect(unauthResult).toEqual({ status: 'unauthenticated' });
    expect(fetchCalls).toHaveLength(0);

    const saveFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/users/me/profile');
      expect(init?.method).toBe('PUT');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({
        birth_year_month: null,
        residential_region: 'TW-TPE',
      });
      return { ok: true, json: async () => body };
    });
    await profile.saveUserProfile({
      profile: {
        birth_year_month: null,
        residential_region: 'TW-TPE',
      },
      fetchImpl: saveFetch,
    });

    expect(
      loginState.parseAuthenticatedMeBody({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Profile User',
      }),
    ).toEqual({ display_name: 'Profile User' });
  });

  it('keeps homepage profile prompt on null-check completeness without eligibility reads', async () => {
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const layout = await loadModule('public/frontend/public-mvp-layout.js');

    expect(prompt.isProfileIncomplete({ birth_year_month: null, residential_region: 'TW-TPE' })).toBe(
      true,
    );
    expect(
      prompt.isProfileIncomplete({ birth_year_month: '1998-07', residential_region: 'TW-TPE' }),
    ).toBe(false);
    expect(
      Object.keys(
        prompt.parseProfileForPrompt({
          birth_year_month: '1998-07',
          residential_region: null,
          can_vote: true,
          age_passed: true,
        }),
      ).sort(),
    ).toEqual(['birth_year_month', 'residential_region']);

    const anonymousResult = await prompt.mountProfileCompletionPrompt(
      { getElementById: () => null } as unknown as Document,
      {
        loginState: { status: 'anonymous' },
        fetchImpl: vi.fn(),
      },
    );
    expect(anonymousResult).toEqual({ status: 'anonymous' });

    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    expect(layoutSource).toMatch(/pathname === '\/' \|\| pathname === ''/);
    expect(layout.shouldReadLoginState({ dataset: {} })).toBe(true);
    expect(prompt.PROFILE_COMPLETION_PROMPT_MESSAGE).toContain(
      '不代表你一定符合或不符合任何投票資格',
    );
  });

  it('keeps auth/profile runtime away from creator_session, Reference Answer, and vote paths', async () => {
    for (const relativePath of [
      'public/frontend/registration-page.js',
      'public/frontend/profile-page.js',
      'public/frontend/profile-completion-prompt.js',
      'public/frontend/login-state-logout.js',
    ]) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(
        /creator_session|\/creator\/session|reference-answer|vote-by-index|localStorage|sessionStorage|indexedDB/i,
      );
      expect(source, relativePath).not.toMatch(
        /navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
      );
    }
  });

  for (const relativePath of AUTH_PROFILE_SURFACES) {
    it(`keeps reviewed auth/profile copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      if (
        relativePath !== 'public/frontend/login-state-read.js' &&
        relativePath !== 'public/login.html'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
    });
  }

  it('keeps milestone user-visible auth/profile messages free of forbidden internals', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const login = await loadModule('public/frontend/login-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const logout = await loadModule('public/frontend/login-state-logout.js');
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');

    const userVisibleMessages = [
      registration.REGISTRATION_SUCCESS_MESSAGE,
      registration.REGISTRATION_FAILURE_MESSAGE,
      login.LOGIN_FORM_SUCCESS_MESSAGE,
      login.LOGIN_FORM_FAILURE_MESSAGE,
      profile.PROFILE_UNAUTHENTICATED_MESSAGE,
      profile.PROFILE_LOAD_FAILURE_MESSAGE,
      profile.PROFILE_SAVE_FAILURE_MESSAGE,
      logout.LOGIN_LOGOUT_FAILURE_MESSAGE,
      prompt.PROFILE_COMPLETION_PROMPT_MESSAGE,
      prompt.PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
