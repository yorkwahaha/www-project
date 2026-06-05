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

describe('profile page frontend', () => {
  it('renders only birth year-month and coarse residential region controls', async () => {
    const html = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(html).toContain('name="birth_year_month"');
    expect(html).toContain('type="month"');
    expect(html).toContain('name="residential_region"');
    expect(html).toContain('TW-TPE');
    expect(html).toMatch(/此資料只用於判斷你是否符合部分問卷.*資格/);
    expect(html).toContain('X-User-Id');
    expect(html).toContain('creator_session');
    expect(html).not.toMatch(
      /gender|性別|birthday|生日|address|地址|GPS|geocode|precise location|精準位置|option_id|option_text|option_index/i,
    );
  });

  it('loads the current profile with user auth only and no creator cookie credential', async () => {
    const { loadUserProfile } = await loadProfilePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    }));

    const profile = await loadUserProfile({ userId: 'runtime-user-id', fetchImpl });

    expect(profile).toEqual({
      birth_year_month: '1998-07',
      residential_region: 'TW-TPE',
    });
    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      headers: { 'X-User-Id': 'runtime-user-id' },
      credentials: 'omit',
      cache: 'no-store',
    });
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/creator_session|Cookie/);
  });

  it('saves both profile fields as a full replace payload', async () => {
    const { normalizeProfileFormInput, saveUserProfile } = await loadProfilePageModule();
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

    await saveUserProfile({ userId: 'runtime-user-id', profile, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'runtime-user-id',
      },
      body: JSON.stringify({
        birth_year_month: '1998-07',
        residential_region: 'TW-KHH',
      }),
      credentials: 'omit',
    });
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

  it('uses a fixed invalid profile input message without echoing submitted values', async () => {
    const { normalizeProfileFormInput } = await loadProfilePageModule();

    expect(() =>
      normalizeProfileFormInput({
        birthYearMonth: '1998-07-01',
        residentialRegion: 'Taipei Road 1',
      }),
    ).toThrow('請確認出生年月與居住地區格式。');
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
      /gender|birthday|address|GPS|geocode|precise location/i,
    );
  });
});
