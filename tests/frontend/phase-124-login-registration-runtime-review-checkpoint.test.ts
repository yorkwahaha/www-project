import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_AUTH_SHELL_FILES = [
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/login-state-read.js',
  'public/registration.html',
  'public/login.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadRegistrationPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/registration-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginStateModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-read.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createRegistrationForm() {
  const status = { textContent: '' };
  const success = { hidden: true };
  const fields = {
    display_name: {
      tagName: 'INPUT',
      value: 'Checkpoint User',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute() {},
      removeAttribute() {},
      focus: vi.fn(),
    },
    birth_year_month: {
      tagName: 'INPUT',
      value: '1998-07',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute() {},
      removeAttribute() {},
      focus: vi.fn(),
    },
    residential_region: {
      tagName: 'SELECT',
      value: 'TW-TPE',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute() {},
      removeAttribute() {},
      focus: vi.fn(),
    },
    credential: {
      tagName: 'INPUT',
      value: ' registration-proof ',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute() {},
      removeAttribute() {},
      focus: vi.fn(),
    },
  };
  const submit = {
    tagName: 'BUTTON',
    disabled: false,
    textContent: '註冊',
    attributes: new Map<string, string>(),
    setAttribute() {},
  };
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
  return { form, status, success, fields };
}

function createLoginForm() {
  const status = { textContent: '' };
  const credential = {
    tagName: 'INPUT',
    value: ' login-proof ',
    disabled: false,
    attributes: new Map<string, string>(),
    setAttribute() {},
    removeAttribute() {},
    focus: vi.fn(),
  };
  const submit = {
    tagName: 'BUTTON',
    disabled: false,
    textContent: '登入',
    attributes: new Map<string, string>(),
    setAttribute() {},
  };
  const form = {
    ownerDocument: {
      getElementById: (id: string) => (id === 'login-shell-message' ? status : null),
    },
    querySelector: (selector: string) => {
      if (selector === '[name="credential"]') return credential;
      if (selector === '#login-shell-submit') return submit;
      return null;
    },
  };
  return { form, status, credential };
}

describe('Phase 124 login registration runtime review checkpoint', () => {
  it('keeps registration off auto-login, Set-Cookie, and GET /users/me refresh', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const { shouldReadLoginState } = await loadLayoutModule();
    const {
      submitRegistrationForm,
      submitRegistrationRequest,
      REGISTRATION_SUCCESS_MESSAGE,
    } = await loadRegistrationPageModule();
    const { form, status, success } = createRegistrationForm();

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/registration');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({
        display_name: 'Checkpoint User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      });
      expect(body).not.toHaveProperty('credential');
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer registration-proof',
      });
      return { status: 201 };
    });

    await expect(submitRegistrationForm(form, { fetchImpl })).resolves.toEqual({
      ok: true,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(success.hidden).toBe(false);
    expect(status.textContent).toBe(REGISTRATION_SUCCESS_MESSAGE);
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).toContain('href="/login"');
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );
    expect(registrationSource).not.toMatch(
      /mountLoginStateRead|readLoginState|\/users\/me|\/login\/session/,
    );

    const requestResult = await submitRegistrationRequest({
      profile: {
        display_name: 'Checkpoint User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: vi.fn(async () => ({ status: 201 })),
    });
    expect(requestResult).toEqual({ ok: true });
  });

  it('posts login session then refreshes GET /users/me display_name only', async () => {
    const {
      submitProductionLoginForm,
      submitProductionLoginCredential,
      LOGIN_FORM_SUCCESS_MESSAGE,
    } = await loadLoginPageModule();
    const loginState = await loadLoginStateModule();
    const { form, status, credential } = createLoginForm();

    const fetchImpl = vi.fn(async (url: string) => {
      if (url === '/login/session') {
        return { status: 201 };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user_id: '11111111-1111-4111-8111-111111111111',
          display_name: 'Cookie User',
          birth_year_month: '1998-07',
        }),
      };
    });
    const refreshLoginState = vi.fn(async () => ({
      status: 'authenticated',
      display_name: 'Cookie User',
    }));

    await expect(
      submitProductionLoginForm(form, { fetchImpl, refreshLoginState }),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledWith('/login/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Authorization: 'Bearer login-proof',
      },
    });
    expect(refreshLoginState).toHaveBeenCalledWith(form.ownerDocument, { fetchImpl });
    expect(credential.value).toBe('');
    expect(status.textContent).toBe(LOGIN_FORM_SUCCESS_MESSAGE);

    const meFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Cookie User',
      }),
    }));
    const state = await loginState.readLoginState({ fetchImpl: meFetch });
    expect(state).toEqual({
      status: 'authenticated',
      display_name: 'Cookie User',
    });
    expect(meFetch).toHaveBeenCalledWith('/users/me', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const credentialOnly = await submitProductionLoginCredential({
      credential: 'proof',
      fetchImpl: vi.fn(async () => ({ status: 201 })),
    });
    expect(credentialOnly).toEqual({ ok: true });
  });

  it('maps registration and login failures to frontend-owned copy without echoing payloads', async () => {
    const registration = await loadRegistrationPageModule();
    const login = await loadLoginPageModule();

    expect(registration.messageForRegistrationFailure('network')).toBe(
      registration.REGISTRATION_NETWORK_FAILURE_MESSAGE,
    );
    expect(registration.messageForRegistrationFailure('server')).toBe(
      registration.REGISTRATION_FAILURE_MESSAGE,
    );
    expect(login.messageForLoginFailure('network')).toBe(
      login.LOGIN_FORM_NETWORK_FAILURE_MESSAGE,
    );
    expect(login.messageForLoginFailure('rejected')).toBe(
      login.LOGIN_FORM_FAILURE_MESSAGE,
    );

    const failingFetch = vi.fn(async () => ({
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));
    const registrationResult = await registration.submitRegistrationRequest({
      profile: {
        display_name: 'User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: failingFetch,
    });
    expect(registrationResult).toEqual({ ok: false, reason: 'server' });
    expect(JSON.stringify(registrationResult)).not.toMatch(/option_id|vote_token/i);

    const loginResult = await login.submitProductionLoginCredential({
      credential: 'proof',
      fetchImpl: failingFetch,
    });
    expect(loginResult).toEqual({ ok: false, reason: 'rejected' });
  });

  it('keeps auth shell runtime away from vote paths and observability sinks', async () => {
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );

    for (const source of [registrationSource, loginSource]) {
      expect(source).not.toMatch(
        /\/vote|vote-by-index|reference-answer|users\/me\/profile|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
      );
      expect(source).not.toMatch(/\boption_id\b|option_index|selected_option/);
      expect(source).not.toMatch(/['"]X-User-Id['"]/);
      expect(source).not.toMatch(/\/creator\/session/);
    }
  });

  for (const relativePath of REVIEWED_AUTH_SHELL_FILES) {
    it(`keeps reviewed auth-shell copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js')
        ? stripJsComments(raw)
        : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      if (
        relativePath.includes('registration') ||
        relativePath === 'public/frontend/login-state-read.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      }
    });
  }

  it('keeps Phase 124 user-visible messages free of forbidden internals', async () => {
    const registration = await loadRegistrationPageModule();
    const login = await loadLoginPageModule();

    const userVisibleMessages = [
      registration.REGISTRATION_READY_MESSAGE,
      registration.REGISTRATION_SUCCESS_MESSAGE,
      registration.REGISTRATION_VALIDATION_FAILURE_MESSAGE,
      registration.REGISTRATION_AUTH_FAILURE_MESSAGE,
      registration.REGISTRATION_FAILURE_MESSAGE,
      registration.REGISTRATION_NETWORK_FAILURE_MESSAGE,
      login.LOGIN_FORM_READY_MESSAGE,
      login.LOGIN_FORM_SUCCESS_MESSAGE,
      login.LOGIN_FORM_FAILURE_MESSAGE,
      login.LOGIN_FORM_NETWORK_FAILURE_MESSAGE,
      login.LOGIN_FORM_VERIFY_STATE_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
    }
  });
});
