import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const FORBIDDEN_PROFILE_COPY =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|option_id|option_index|option_text|user_id|token_sha256|www_session|session_id|localStorage|sessionStorage|IndexedDB|X-User-Id|creator_session/i;

async function loadProfilePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/profile-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createProfileDocument() {
  const elements = new Map<string, HTMLElement>();
  const makeEl = (tag: string, id?: string) => {
    const el = {
      tagName: tag.toUpperCase(),
      id: id ?? '',
      hidden: false,
      textContent: '',
      listeners: new Map<string, Array<() => void>>(),
      elements: {
        birth_year_month: { value: '', disabled: false },
        residential_region: { value: '', disabled: false },
        namedItem(name: string) {
          return /** @type {Record<string, unknown>} */ (this)[name] ?? null;
        },
      },
      ownerDocument: null as Document | null,
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
      elements.set(id, el as unknown as HTMLElement);
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

  return {
    documentObject: documentObject as unknown as Document,
    form: form as unknown as HTMLFormElement,
    fetchCalls: [] as Array<{ url: string; init?: RequestInit }>,
  };
}

describe('Phase 99 profile setup UI runtime guard', () => {
  it('keeps unauthenticated /profile on login-state read only without profile API or form wiring', async () => {
    const profileHtml = await readFile(
      join(process.cwd(), 'public/profile.html'),
      'utf8',
    );
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const { mountProfilePage } = await loadProfilePageModule();
    const { documentObject, form, fetchCalls } = createProfileDocument();
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
    expect(profileHtml).toContain('id="profile-unauthenticated"');
    expect(profileHtml).toContain('href="/login"');
    expect(profileHtml).toMatch(/id="profile-signed-in-panel"[^>]*\bhidden\b/);
    expect(profileSource).toContain('readLoginState');
    expect(profileSource).toMatch(
      /loginState\.status !== LOGIN_STATE_AUTHENTICATED[\s\S]*return \{ status: 'unauthenticated' \}/,
    );
    expect(profileSource).toMatch(
      /wireProfileForm\(form[\s\S]*return \{ status: 'authenticated' \}/,
    );
  });

  it('keeps authenticated profile load/save on same-origin GET/PUT with two-field bodies only', async () => {
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const {
      loadUserProfile,
      saveUserProfile,
      normalizeProfileFormInput,
      PROFILE_REGION_OPTIONS,
    } = await loadProfilePageModule();

    expect(profileSource).toContain("credentials: 'same-origin'");
    expect(profileSource).toMatch(
      /JSON\.stringify\(\{\s*birth_year_month:\s*profile\.birth_year_month,\s*residential_region:\s*profile\.residential_region,\s*\}\)/,
    );

    const getFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    }));
    await loadUserProfile({ fetchImpl: getFetch });
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
        birthYearMonth: '1998-07',
        residentialRegion: 'TW-TPE',
      }),
    ).toEqual({
      birth_year_month: '1998-07',
      residential_region: 'TW-TPE',
    });
    expect(PROFILE_REGION_OPTIONS).toContain('TW-TPE');
    expect(() =>
      normalizeProfileFormInput({
        birthYearMonth: '1998-13',
        residentialRegion: 'INVALID',
      }),
    ).toThrow('請確認出生年月與居住地區格式。');
  });

  it('keeps profile UI out of registration/login/session/vote/reference paths', async () => {
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(profileSource).toContain('/users/me/profile');
    expect(profileSource).not.toMatch(
      /\/registration|\/login\/session|\/vote|reference-answer|mountLoginStateRead|requestLogoutSession|option_id|option_text|selected_option_index|poll_id|shard_id|eligibility|demographic|analytics|document\.cookie/i,
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
    const logoutSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-logout.js'),
      'utf8',
    );

    expect(layoutSource).toContain('shouldReadLoginState');
    expect(layoutSource).toContain('mountLoginStateRead');
    expect(layoutSource).not.toMatch(/users\/me\/profile|birth_year_month|residential_region/);

    expect(loginStateSource).toContain('/users/me');
    expect(loginStateSource).toContain('display_name');
    expect(loginStateSource).not.toMatch(/birth_year_month|residential_region|users\/me\/profile/);

    expect(loginStateUiSource).toContain('display_name');
    expect(loginStateUiSource).not.toMatch(/birth_year_month|residential_region|users\/me\/profile/);

    expect(logoutSource).toContain('/login/session');
    expect(logoutSource).toContain("method: 'DELETE'");
    expect(logoutSource).not.toMatch(/birth_year_month|residential_region|users\/me\/profile/);
  });

  it('keeps profile copy/runtime free of forbidden fields and option linkage', async () => {
    const profileHtml = await readFile(
      join(process.cwd(), 'public/profile.html'),
      'utf8',
    );
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(profileHtml, 'public/profile.html').not.toMatch(FORBIDDEN_PROFILE_COPY);
    expect(profileSource, 'public/frontend/profile-page.js').not.toMatch(
      FORBIDDEN_PROFILE_COPY,
    );
    expect(profileSource).not.toMatch(/console\.|localStorage|sessionStorage|indexedDB/);
    expect(profileSource).toContain('PROFILE_SAVED_MESSAGE');
    expect(profileSource).not.toMatch(/auto.?vote|recalculat|backfill/i);
  });
});
