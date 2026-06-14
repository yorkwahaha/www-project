import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

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
      className: '',
      attributes: new Map<string, string>(),
      listeners: new Map<string, Array<() => void>>(),
      elements: {
        birth_year_month: { value: '', disabled: false },
        residential_region: { value: '', disabled: false },
        namedItem(name: string) {
          return /** @type {Record<string, unknown>} */ (this)[name] ?? null;
        },
      },
      ownerDocument: null as Document | null,
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      getAttribute(name: string) {
        return this.attributes.get(name) ?? null;
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
      elements.set(id, el as unknown as HTMLElement);
    }
    return el;
  };

  const form = makeEl('form', 'profile-form');
  const message = makeEl('p', 'profile-form-message');
  const submit = makeEl('button', 'profile-submit');
  submit.textContent = '儲存';
  const clear = makeEl('button', 'profile-clear');
  const unauth = makeEl('section', 'profile-unauthenticated');
  const signedIn = makeEl('div', 'profile-signed-in-panel');
  signedIn.hidden = true;

  const documentObject = {
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
  };

  for (const el of [form, message, submit, clear, unauth, signedIn]) {
    el.ownerDocument = documentObject as unknown as Document;
  }

  return {
    documentObject: documentObject as unknown as Document,
    form: form as unknown as HTMLFormElement,
    fetchCalls: [] as Array<{ url: string; init?: RequestInit }>,
  };
}

describe('profile page frontend', () => {
  it('renders only birth year-month and coarse residential region controls', async () => {
    const html = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(html).toContain('name="birth_year_month"');
    expect(html).toContain('type="month"');
    expect(html).toContain('name="residential_region"');
    expect(html).toContain('TW-TPE');
    expect(html).toContain('出生年月（僅到月份）');
    expect(html).toContain('居住地區（粗粒度代碼）');
    expect(html).toContain('href="/login"');
    expect(html).toContain('id="profile-unauthenticated"');
    expect(html).toContain('id="profile-signed-in-panel"');
    expect(html).toMatch(/id="profile-signed-in-panel"[^>]*\bhidden\b/);
    expect(html).toMatch(/此資料只用於判斷你是否符合部分問卷.*資格/);
    expect(html).not.toMatch(
      /gender|性別|birthday|生日|address|地址|GPS|geocode|precise location|精準位置|option_id|option_text|option_index|X-User-Id|creator_session/i,
    );
  });

  it('does not call profile API when unauthenticated and guides to login', async () => {
    const { mountProfilePage } = await loadProfilePageModule();
    const { documentObject, fetchCalls } = createProfileDocument();
    const readLoginStateImpl = vi.fn(async () => ({ status: 'anonymous' }));

    const result = await mountProfilePage(documentObject, {
      readLoginStateImpl,
      fetchImpl: vi.fn(async (url, init) => {
        fetchCalls.push({ url: String(url), init });
        return { ok: true, json: async () => ({}) };
      }),
    });

    expect(result).toEqual({ status: 'unauthenticated' });
    expect(readLoginStateImpl).toHaveBeenCalledTimes(1);
    expect(fetchCalls).toHaveLength(0);
    expect(
      documentObject.getElementById('profile-unauthenticated')?.hidden,
    ).toBe(false);
    expect(
      documentObject.getElementById('profile-signed-in-panel')?.hidden,
    ).toBe(true);
    expect(documentObject.getElementById('profile-form-message')?.textContent).toBe(
      '編輯出生年月與居住地區前請先登入。',
    );
  });

  it('loads the current profile with session credentials only when authenticated', async () => {
    const { loadUserProfile, mountProfilePage } = await loadProfilePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    }));

    const profile = await loadUserProfile({ fetchImpl });

    expect(profile).toEqual({
      birth_year_month: '1998-07',
      residential_region: 'TW-TPE',
    });
    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /X-User-Id|creator_session|Cookie|Authorization/i,
    );

    const { documentObject, form, fetchCalls } = createProfileDocument();
    await mountProfilePage(documentObject, {
      readLoginStateImpl: vi.fn(async () => ({
        status: 'authenticated',
        display_name: 'Tester',
      })),
      fetchImpl,
    });

    expect(fetchCalls).toHaveLength(0);
    expect(form.elements.birth_year_month.value).toBe('1998-07');
    expect(form.elements.residential_region.value).toBe('TW-TPE');
    expect(
      documentObject.getElementById('profile-signed-in-panel')?.hidden,
    ).toBe(false);
  });

  it('saves both profile fields as a full replace payload with same-origin credentials', async () => {
    const { normalizeProfileFormInput, saveUserProfile } =
      await loadProfilePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-KHH',
      }),
    }));
    const profile = normalizeProfileFormInput({
      birthYearMonth: '1998-07',
      residentialRegion: 'TW-KHH',
    });

    await saveUserProfile({ profile, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        birth_year_month: '1998-07',
        residential_region: 'TW-KHH',
      }),
    });
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /X-User-Id|creator_session|login\/session|\/registration|vote|reference/i,
    );
  });

  it('can clear nullable profile fields', async () => {
    const { normalizeProfileFormInput } = await loadProfilePageModule();

    expect(
      normalizeProfileFormInput({
        birthYearMonth: '',
        residentialRegion: '',
      }),
    ).toEqual({
      birth_year_month: null,
      residential_region: null,
    });
  });

  it('uses fixed invalid profile input messages without echoing submitted values', async () => {
    const { normalizeProfileFormInput, messageForProfileFailure } =
      await loadProfilePageModule();

    expect(() =>
      normalizeProfileFormInput({
        birthYearMonth: '1998-07-01',
        residentialRegion: 'Taipei Road 1',
      }),
    ).toThrow('請確認出生年月與居住地區格式。');

    expect(messageForProfileFailure('validation', 'save')).toBe(
      '請確認出生年月與居住地區格式。',
    );
    expect(messageForProfileFailure('unauthenticated', 'save')).toBe(
      '請先登入後再編輯出生年月與居住地區。',
    );
    expect(messageForProfileFailure('server', 'load')).toBe(
      '目前無法載入個人資料，請稍後再試。',
    );
  });

  it('does not introduce durable storage, analytics, option linkage, or forbidden profile fields', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|analytics|console\.|option_id|option_text|option_index|selected_option_index/i,
    );
    expect(source).not.toMatch(
      /gender|birthday|address|GPS|geocode|precise location|X-User-Id|\/login\/session|\/registration|reference-answer/i,
    );
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('readLoginState');
    expect(source).not.toContain('resolvePublicMvpUserId');
  });
});
