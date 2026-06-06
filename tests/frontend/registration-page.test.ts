import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadRegistrationPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/registration-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createField(tagName: 'INPUT' | 'SELECT', value = '') {
  return {
    tagName,
    value,
    disabled: false,
    attributes: new Map<string, string>(),
    setAttribute(name: string, nextValue: string) {
      this.attributes.set(name, nextValue);
    },
    removeAttribute(name: string) {
      this.attributes.delete(name);
    },
    focus: vi.fn(),
  };
}

function createButton(label = '註冊') {
  return {
    tagName: 'BUTTON',
    disabled: false,
    textContent: label,
    attributes: new Map<string, string>(),
    setAttribute(name: string, nextValue: string) {
      this.attributes.set(name, nextValue);
    },
  };
}

describe('registration page frontend', () => {
  it('renders the minimal registration form without forbidden profile or session fields', async () => {
    const html = await readFile(join(process.cwd(), 'public/registration.html'), 'utf8');

    expect(html).toContain('registration-form');
    expect(html).toContain('name="display_name"');
    expect(html).toContain('name="birth_year_month"');
    expect(html).toContain('type="month"');
    expect(html).toContain('name="residential_region"');
    expect(html).toContain('name="credential"');
    expect(html).toContain('TW-TPE');
    expect(html).toContain('data-login-state-read="disabled"');
    expect(html).toContain('/frontend/registration-page.js');
    expect(html).toContain('href="/login"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toMatch(/localStorage|sessionStorage|IndexedDB/i);
    expect(html).not.toMatch(
      /name="gender"|name="address"|name="precise_location"|name="option_id"|name="selected_option_index"|name="credential_proof"|name="token"|name="cookie"|name="www_session"/i,
    );
  });

  it('submits POST /registration with Authorization header and only approved JSON keys', async () => {
    const { submitRegistrationRequest } = await loadRegistrationPageModule();
    const response = {
      status: 201,
      json: vi.fn(() => {
        throw new Error('response body must not be read');
      }),
      headers: {
        get: vi.fn(() => {
          throw new Error('Set-Cookie must not be read');
        }),
      },
    };
    const fetchImpl = vi.fn(async () => response);

    await expect(
      submitRegistrationRequest({
        profile: {
          display_name: 'Registered User',
          birth_year_month: '1998-07',
          residential_region: 'TW-TPE',
        },
        credential: 'approved-proof',
        fetchImpl,
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith('/registration', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer approved-proof',
      },
      body: JSON.stringify({
        display_name: 'Registered User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    });
    const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
    expect(Object.keys(sent).sort()).toEqual([
      'birth_year_month',
      'display_name',
      'residential_region',
    ]);
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /credential_proof|session_id|token_sha256|www_session|cookie|option_id|selected_option_index/i,
    );
    expect(response.json).not.toHaveBeenCalled();
    expect(response.headers.get).not.toHaveBeenCalled();
  });

  it('shows success without login, users/me, or cookie reads and clears credential proof', async () => {
    const { submitRegistrationForm, REGISTRATION_SUCCESS_MESSAGE } =
      await loadRegistrationPageModule();
    const status = { textContent: '' };
    const success = { hidden: true };
    const fields = {
      display_name: createField('INPUT', '  Registered   User  '),
      birth_year_month: createField('INPUT', '1998-07'),
      residential_region: createField('SELECT', 'TW-TPE'),
      credential: createField('INPUT', ' approved-proof '),
    };
    const submit = createButton();
    const form = {
      ownerDocument: {
        getElementById: (id: string) => {
          if (id === 'registration-form-message') return status;
          if (id === 'registration-success') return success;
          return null;
        },
      },
      querySelector: (selector: string) => {
        if (selector === '[name="display_name"]') return fields.display_name;
        if (selector === '[name="birth_year_month"]') return fields.birth_year_month;
        if (selector === '[name="residential_region"]') return fields.residential_region;
        if (selector === '[name="credential"]') return fields.credential;
        if (selector === '#registration-submit') return submit;
        return null;
      },
    };
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe('/registration');
      return {
        status: 201,
        headers: { get: vi.fn() },
      };
    });

    await expect(
      submitRegistrationForm(form, { fetchImpl }),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fields.credential.value).toBe('');
    expect(success.hidden).toBe(false);
    expect(status.textContent).toBe(REGISTRATION_SUCCESS_MESSAGE);
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /\/login\/session|\/users\/me|Set-Cookie|credential_proof|token_sha256|www_session/i,
    );
  });

  it('uses neutral failure copy without exposing backend, credential, profile, or session details', async () => {
    const {
      submitRegistrationRequest,
      messageForRegistrationFailure,
      REGISTRATION_AUTH_FAILURE_MESSAGE,
      REGISTRATION_CONFLICT_MESSAGE,
      REGISTRATION_NETWORK_FAILURE_MESSAGE,
    } = await loadRegistrationPageModule();
    const authFetch = vi.fn(async () => ({
      status: 401,
      json: async () => ({
        error: 'REGISTRATION_AUTH_REQUIRED',
        credential_proof: 'hidden',
        token_sha256: 'hidden',
        birth_year_month: '1998-07',
      }),
    }));
    const conflictFetch = vi.fn(async () => ({ status: 409 }));
    const networkFetch = vi.fn(async () => {
      throw new Error('network');
    });
    const profile = {
      display_name: 'Registered User',
      birth_year_month: '1998-07',
      residential_region: 'TW-TPE',
    };

    await expect(
      submitRegistrationRequest({
        profile,
        credential: 'bad-proof',
        fetchImpl: authFetch,
      }),
    ).resolves.toEqual({ ok: false, reason: 'auth' });
    await expect(
      submitRegistrationRequest({
        profile,
        credential: 'used-proof',
        fetchImpl: conflictFetch,
      }),
    ).resolves.toEqual({ ok: false, reason: 'conflict' });
    await expect(
      submitRegistrationRequest({
        profile,
        credential: 'network',
        fetchImpl: networkFetch,
      }),
    ).resolves.toEqual({ ok: false, reason: 'network' });

    expect(messageForRegistrationFailure('auth')).toBe(REGISTRATION_AUTH_FAILURE_MESSAGE);
    expect(messageForRegistrationFailure('conflict')).toBe(REGISTRATION_CONFLICT_MESSAGE);
    expect(messageForRegistrationFailure('network')).toBe(
      REGISTRATION_NETWORK_FAILURE_MESSAGE,
    );
    for (const message of [
      REGISTRATION_AUTH_FAILURE_MESSAGE,
      REGISTRATION_CONFLICT_MESSAGE,
      REGISTRATION_NETWORK_FAILURE_MESSAGE,
    ]) {
      expect(message).not.toMatch(
        /REGISTRATION_|credential|proof|birth_year_month|residential_region|token_sha256|session_id|www_session|cookie|option_id|selected_option_index/i,
      );
    }
  });

  it('validates locally before submit and keeps credential proof out of JSON body', async () => {
    const { normalizeRegistrationFormInput } = await loadRegistrationPageModule();

    expect(() =>
      normalizeRegistrationFormInput({
        displayName: '',
        birthYearMonth: '1998-07',
        residentialRegion: 'TW-TPE',
        credential: 'proof',
      }),
    ).toThrow('請輸入顯示名稱。');
    expect(() =>
      normalizeRegistrationFormInput({
        displayName: 'User',
        birthYearMonth: '1998-07-01',
        residentialRegion: 'TW-TPE',
        credential: 'proof',
      }),
    ).toThrow('請以 YYYY-MM 格式輸入出生年月。');
    expect(() =>
      normalizeRegistrationFormInput({
        displayName: 'User',
        birthYearMonth: '1998-07',
        residentialRegion: 'Taipei Road 1',
        credential: 'proof',
      }),
    ).toThrow('請選擇居住地區。');

    const normalized = normalizeRegistrationFormInput({
      displayName: '  Registered   User  ',
      birthYearMonth: '1998-07',
      residentialRegion: 'TW-TPE',
      credential: ' approved-proof ',
    });

    expect(normalized).toEqual({
      profile: {
        display_name: 'Registered User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'approved-proof',
    });
    expect(normalized.profile).not.toHaveProperty('credential');
    expect(normalized.profile).not.toHaveProperty('credential_proof');
  });

  it('does not use durable storage, analytics, login submit, users/me, or forbidden linkage fields', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|analytics|console\.|\/login\/session|\/users\/me|credential_proof|option_id|option_text|option_index|selected_option_index/i,
    );
    expect(source).not.toMatch(
      /gender|exact_birthday|date_of_birth|address|GPS|geocode|precise_location|latitude|longitude/i,
    );
  });
});
