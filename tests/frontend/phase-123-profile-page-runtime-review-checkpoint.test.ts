import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_PROFILE_FILES = [
  'public/frontend/profile-page.js',
  'public/frontend/login-state-read.js',
  'public/profile.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadProfilePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/profile-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginStateModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-read.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createProfileDocument() {
  const elements = new Map<string, {
    id: string;
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
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
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
  makeEl('button', 'profile-submit');
  makeEl('button', 'profile-clear');

  const documentObject = {
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
  };

  for (const el of [form, message, unauth, signedIn]) {
    el.ownerDocument = documentObject as unknown as Document;
  }

  return {
    documentObject: documentObject as unknown as Document,
    form,
    unauth,
    signedIn,
    message,
    fetchCalls: [] as Array<{ url: string; init?: RequestInit }>,
  };
}

describe('Phase 123 profile page runtime review checkpoint', () => {
  it('keeps unauthenticated /profile off profile API and form wiring', async () => {
    const {
      mountProfilePage,
      PROFILE_UNAUTHENTICATED_MESSAGE,
    } = await loadProfilePageModule();
    const { documentObject, form, unauth, signedIn, message, fetchCalls } =
      createProfileDocument();
    const readLoginStateImpl = vi.fn(async () => ({ status: 'anonymous' }));
    const fetchImpl = vi.fn(async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      return { ok: true, json: async () => ({}) };
    });

    const result = await mountProfilePage(documentObject, {
      readLoginStateImpl,
      fetchImpl,
    });

    expect(result).toEqual({ status: 'unauthenticated' });
    expect(readLoginStateImpl).toHaveBeenCalledTimes(1);
    expect(fetchCalls).toHaveLength(0);
    expect(form.listeners.get('submit') ?? []).toHaveLength(0);
    expect(unauth.hidden).toBe(false);
    expect(signedIn.hidden).toBe(true);
    expect(message.textContent).toBe(PROFILE_UNAUTHENTICATED_MESSAGE);
    expect(message.textContent).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('loads and saves only birth_year_month and residential_region with nullable values', async () => {
    const {
      loadUserProfile,
      saveUserProfile,
      normalizeProfileFormInput,
      mountProfilePage,
    } = await loadProfilePageModule();
    const { documentObject, form, fetchCalls } = createProfileDocument();

    const getFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
        age_passed: false,
        can_vote: false,
      }),
    }));
    const profile = await loadUserProfile({ fetchImpl: getFetch });
    expect(profile).toEqual({
      birth_year_month: '1998-07',
      residential_region: 'TW-TPE',
    });
    expect(getFetch).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    const putFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        birth_year_month: null,
        residential_region: null,
      }),
    }));
    await saveUserProfile({
      profile: { birth_year_month: null, residential_region: null },
      fetchImpl: putFetch,
    });
    expect(putFetch).toHaveBeenCalledWith('/users/me/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_year_month: null,
        residential_region: null,
      }),
    });

    expect(
      normalizeProfileFormInput({
        birthYearMonth: '',
        residentialRegion: '',
      }),
    ).toEqual({
      birth_year_month: null,
      residential_region: null,
    });

    const readLoginStateImpl = vi.fn(async () => ({
      status: 'authenticated',
      display_name: 'Profile User',
    }));
    const fetchImpl = vi.fn(async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      if (init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            birth_year_month: null,
            residential_region: null,
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const result = await mountProfilePage(documentObject, {
      readLoginStateImpl,
      fetchImpl,
    });
    expect(result).toEqual({ status: 'authenticated' });
    expect(fetchCalls.some((call) => call.url === '/users/me/profile')).toBe(
      true,
    );
    expect(form.listeners.get('submit')?.length).toBeGreaterThan(0);
  });

  it('consumes only display_name from GET /users/me in login-state read', async () => {
    const loginState = await loadLoginStateModule();

    expect(
      loginState.parseAuthenticatedMeBody({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Profile User',
        birth_year_month: '1998-07',
      }),
    ).toEqual({ display_name: 'Profile User' });

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Profile User',
      }),
    }));
    const state = await loginState.readLoginState({ fetchImpl });
    expect(state).toEqual({
      status: 'authenticated',
      display_name: 'Profile User',
    });
    expect(fetchImpl).toHaveBeenCalledWith('/users/me', {
      method: 'GET',
      credentials: 'same-origin',
    });
  });

  it('maps profile load and save failures to frontend-owned copy without echoing payloads', async () => {
    const {
      loadUserProfile,
      saveUserProfile,
      messageForProfileFailure,
      PROFILE_LOAD_FAILURE_MESSAGE,
      PROFILE_SAVE_FAILURE_MESSAGE,
      PROFILE_VALIDATION_MESSAGE,
      PROFILE_UNAUTHENTICATED_EDIT_MESSAGE,
    } = await loadProfilePageModule();

    expect(messageForProfileFailure('network', 'load')).toBe(
      PROFILE_LOAD_FAILURE_MESSAGE,
    );
    expect(messageForProfileFailure('server', 'save')).toBe(
      PROFILE_SAVE_FAILURE_MESSAGE,
    );
    expect(messageForProfileFailure('validation')).toBe(
      PROFILE_VALIDATION_MESSAGE,
    );
    expect(messageForProfileFailure('unauthenticated')).toBe(
      PROFILE_UNAUTHENTICATED_EDIT_MESSAGE,
    );

    const failingFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));

    await expect(loadUserProfile({ fetchImpl: failingFetch })).rejects.toThrow(
      PROFILE_LOAD_FAILURE_MESSAGE,
    );
    await expect(loadUserProfile({ fetchImpl: failingFetch })).rejects.not.toThrow(
      /option_id|vote_token/i,
    );

    await expect(
      saveUserProfile({
        profile: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
        fetchImpl: failingFetch,
      }),
    ).rejects.toThrow(PROFILE_SAVE_FAILURE_MESSAGE);
  });

  it('keeps profile runtime away from vote, creator_session, and observability sinks', async () => {
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(profileSource).toContain('/users/me/profile');
    expect(profileSource).toContain('readLoginState');
    expect(profileSource).not.toMatch(
      /\/vote|vote-by-index|reference-answer|creator_session|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
    expect(profileSource).not.toMatch(/\boption_id\b|option_index|selected_option/);
  });

  it('keeps registration shell out of profile session bootstrap', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(profileSource).not.toMatch(/POST \/registration|\/registration/);
    expect(profileSource).not.toMatch(/POST \/login\/session/);
  });

  for (const relativePath of REVIEWED_PROFILE_FILES) {
    it(`keeps reviewed profile copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js')
        ? stripJsComments(raw)
        : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
    });
  }

  it('keeps Phase 123 user-visible messages free of forbidden internals', async () => {
    const profilePage = await loadProfilePageModule();

    const userVisibleMessages = [
      profilePage.PROFILE_UNAUTHENTICATED_MESSAGE,
      profilePage.PROFILE_LOADING_MESSAGE,
      profilePage.PROFILE_SAVING_MESSAGE,
      profilePage.PROFILE_SAVED_MESSAGE,
      profilePage.PROFILE_VALIDATION_MESSAGE,
      profilePage.PROFILE_UNAUTHENTICATED_EDIT_MESSAGE,
      profilePage.PROFILE_LOAD_FAILURE_MESSAGE,
      profilePage.PROFILE_SAVE_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
    }
  });
});
