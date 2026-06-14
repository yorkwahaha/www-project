import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_217_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_SESSION_LEAKAGE =
  /LOGIN_AUTH_REQUIRED|REGISTRATION_|session_id|token_sha256|www_session|cookie|user_id/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|address|地址|GPS|geocode|precise location|精準位置|display_name/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 217 login registration profile state copy runtime', () => {
  it('documents Phase 217 in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 217');
    expect(readme).toContain(
      'docs/www-project-phase-217-login-registration-profile-state-copy-runtime-v1.md',
    );
  });

  it('centralizes login state copy in public-mvp-ui and re-exports from login-page', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');

    expect(publicUi.PUBLIC_LOGIN_FORM_LOADING_MESSAGE).toBe('登入中，請稍候。');
    expect(login.LOGIN_FORM_LOADING_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_FORM_LOADING_MESSAGE);
    expect(login.LOGIN_FORM_FAILURE_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_FORM_FAILURE_MESSAGE);
    expect(login.LOGIN_FORM_ORIGIN_FAILURE_MESSAGE).toBe(
      '無法從目前頁面完成登入，請重新整理後再試。',
    );
    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(
      publicUi.PUBLIC_LOGIN_FORM_LOADING_MESSAGE,
    );
    expect(publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_LOGIN_FORM_VERIFY_STATE_FAILURE_MESSAGE,
    );
  });

  it('keeps login loading and failure copy frontend-owned without backend echo', async () => {
    const login = await loadModule('public/frontend/login-page.js');
    const {
      submitProductionLoginCredential,
      messageForLoginFailure,
      LOGIN_FORM_FAILURE_MESSAGE,
      LOGIN_FORM_ORIGIN_FAILURE_MESSAGE,
      LOGIN_FORM_NETWORK_FAILURE_MESSAGE,
    } = login;
    const rejectedFetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'LOGIN_AUTH_REQUIRED',
        message: 'Login credential verification failed',
        session_id: 'hidden',
      }),
    }));

    await expect(
      submitProductionLoginCredential({
        credential: 'bad-proof',
        fetchImpl: rejectedFetch,
      }),
    ).resolves.toEqual({ ok: false, reason: 'rejected' });

    expect(messageForLoginFailure('rejected')).toBe(LOGIN_FORM_FAILURE_MESSAGE);
    expect(messageForLoginFailure('origin')).toBe(LOGIN_FORM_ORIGIN_FAILURE_MESSAGE);
    expect(messageForLoginFailure('network')).toBe(LOGIN_FORM_NETWORK_FAILURE_MESSAGE);
    for (const message of [
      LOGIN_FORM_FAILURE_MESSAGE,
      LOGIN_FORM_ORIGIN_FAILURE_MESSAGE,
      LOGIN_FORM_NETWORK_FAILURE_MESSAGE,
    ]) {
      expect(message).not.toMatch(FORBIDDEN_SESSION_LEAKAGE);
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });

  it('centralizes registration state copy and keeps success-to-login boundary', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');

    expect(registration.REGISTRATION_LOADING_MESSAGE).toBe(
      publicUi.PUBLIC_REGISTRATION_FORM_LOADING_MESSAGE,
    );
    expect(registration.REGISTRATION_SUCCESS_MESSAGE).toBe(
      publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
    );
    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('請前往登入');
    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('不會自動登入');
    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(
      publicUi.PUBLIC_REGISTRATION_FORM_LOADING_MESSAGE,
    );
    expect(registration.REGISTRATION_CONFLICT_MESSAGE).toBe(
      publicUi.PUBLIC_REGISTRATION_CONFLICT_MESSAGE,
    );
    expect(registration.REGISTRATION_USER_ERROR_MESSAGES).toEqual(
      expect.arrayContaining([
        publicUi.PUBLIC_REGISTRATION_AUTH_FAILURE_MESSAGE,
        publicUi.PUBLIC_REGISTRATION_CONFLICT_MESSAGE,
      ]),
    );
  });

  it('keeps registration failure copy neutral without backend or session echo', async () => {
    const {
      messageForRegistrationFailure,
      REGISTRATION_AUTH_FAILURE_MESSAGE,
      REGISTRATION_CONFLICT_MESSAGE,
      REGISTRATION_NETWORK_FAILURE_MESSAGE,
    } = await loadModule('public/frontend/registration-page.js');

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
        /REGISTRATION_|credential|proof|token_sha256|session_id|www_session|cookie|option_id/i,
      );
    }
  });

  it('centralizes profile state copy with birth_year_month and residential_region only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profile = await loadModule('public/frontend/profile-page.js');

    expect(profile.PROFILE_LOADING_MESSAGE).toBe(publicUi.PUBLIC_PROFILE_PAGE_LOADING_MESSAGE);
    expect(profile.PROFILE_SAVING_MESSAGE).toBe(publicUi.PUBLIC_PROFILE_FORM_SAVING_MESSAGE);
    expect(profile.PROFILE_VALIDATION_MESSAGE).toBe(publicUi.PUBLIC_PROFILE_VALIDATION_MESSAGE);
    expect(profile.PROFILE_LOAD_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_LOAD_FAILURE_MESSAGE,
    );
    expect(profile.PROFILE_SAVE_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_SAVE_FAILURE_MESSAGE,
    );
    expect(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE).toContain('出生年月');
    expect(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE).toContain('居住地區');
    expect(publicUi.PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE).toContain('出生年月');
    expect(publicUi.PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE).toContain('居住地區');
    expect(publicUi.PUBLIC_PROFILE_VALIDATION_MESSAGE).toContain('出生年月');
    expect(publicUi.PUBLIC_PROFILE_VALIDATION_MESSAGE).toContain('居住地區');

    for (const message of [
      publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE,
      publicUi.PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE,
      publicUi.PUBLIC_PROFILE_VALIDATION_MESSAGE,
    ]) {
      expect(message).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
    }
  });

  it('keeps auth API calls and profile payload shape unchanged', async () => {
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const loginFetch = vi.fn(async () => ({ ok: true, status: 201 }));
    const registrationFetch = vi.fn(async () => ({ status: 201 }));
    const profileFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    }));

    await login.submitProductionLoginCredential({
      credential: 'approved-proof',
      fetchImpl: loginFetch,
    });
    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Registered User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'approved-proof',
      fetchImpl: registrationFetch,
    });
    await profile.saveUserProfile({
      profile: {
        birth_year_month: '1998-07',
        residential_region: 'TW-KHH',
      },
      fetchImpl: profileFetch,
    });

    expect(loginFetch).toHaveBeenCalledWith('/login/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Authorization: 'Bearer approved-proof' },
    });
    expect(registrationFetch).toHaveBeenCalledWith('/registration', {
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
    expect(profileFetch).toHaveBeenCalledWith('/users/me/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_year_month: '1998-07',
        residential_region: 'TW-KHH',
      }),
    });
  });

  it('keeps quality_badge presentation-only and auth modules free of backend echo', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);

    for (const relativePath of PHASE_217_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });
});
