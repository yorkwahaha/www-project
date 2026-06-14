import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadLoginPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('login page frontend shell', () => {
  it('documents production access denial and local demo test identity on the login page', async () => {
    const html = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(html).toContain('正式登入表單已開放');
    expect(html).toContain('會拒絕存取');
    expect(html).not.toMatch(/fail closed/i);
    expect(html).not.toMatch(/AUTH_REQUIRED/);
    expect(html).toContain('X-User-Id');
    expect(html).toContain('creator_session');
    expect(html).toContain('/creator/*');
    expect(html).toContain('Reference Answer');
    expect(html).toContain('login-shell-form');
    expect(html).toContain('name="credential"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toMatch(/localStorage|sessionStorage|IndexedDB/i);
    expect(html).not.toMatch(
      /gender|性別|address|地址|GPS|geocode|precise location|精準位置|option_id|option_text|option_index/i,
    );
  });

  it('submits POST /login/session with credentials same-origin and refreshes login state', async () => {
    const { submitProductionLoginForm, LOGIN_FORM_SUCCESS_MESSAGE } =
      await loadLoginPageModule();
    const status = { textContent: '' };
    const credential = {
      tagName: 'INPUT',
      value: ' approved-proof ',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      focus: vi.fn(),
    };
    const submit = {
      tagName: 'BUTTON',
      disabled: false,
      textContent: '登入',
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
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
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 201 }));
    const refreshLoginState = vi.fn(async () => ({
      status: 'authenticated',
      display_name: 'Cookie User',
    }));

    await expect(
      submitProductionLoginForm(form, {
        fetchImpl,
        refreshLoginState,
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledWith('/login/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Authorization: 'Bearer approved-proof',
      },
    });
    expect(refreshLoginState).toHaveBeenCalledWith(form.ownerDocument, { fetchImpl });
    expect(credential.value).toBe('');
    expect(status.textContent).toBe(LOGIN_FORM_SUCCESS_MESSAGE);
    expect(JSON.stringify({ text: status.textContent })).not.toMatch(
      /user_id|birth_year_month|residential_region|token_sha256|session_id|option_id|option_text|option_index/i,
    );
  });

  it('uses neutral failure copy without exposing backend or session details', async () => {
    const {
      submitProductionLoginCredential,
      messageForLoginFailure,
      LOGIN_FORM_FAILURE_MESSAGE,
      LOGIN_FORM_ORIGIN_FAILURE_MESSAGE,
      LOGIN_FORM_NETWORK_FAILURE_MESSAGE,
    } = await loadLoginPageModule();
    const rejectedFetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'LOGIN_AUTH_REQUIRED',
        message: 'Login credential verification failed',
        session_id: 'hidden',
        token_sha256: 'hidden',
      }),
    }));
    const originFetch = vi.fn(async () => ({ ok: false, status: 403 }));
    const networkFetch = vi.fn(async () => {
      throw new Error('network');
    });

    await expect(
      submitProductionLoginCredential({
        credential: 'bad-proof',
        fetchImpl: rejectedFetch,
      }),
    ).resolves.toEqual({ ok: false, reason: 'rejected' });
    await expect(
      submitProductionLoginCredential({
        credential: 'bad-origin',
        fetchImpl: originFetch,
      }),
    ).resolves.toEqual({ ok: false, reason: 'origin' });
    await expect(
      submitProductionLoginCredential({
        credential: 'network',
        fetchImpl: networkFetch,
      }),
    ).resolves.toEqual({ ok: false, reason: 'network' });

    expect(messageForLoginFailure('rejected')).toBe(LOGIN_FORM_FAILURE_MESSAGE);
    expect(messageForLoginFailure('origin')).toBe(LOGIN_FORM_ORIGIN_FAILURE_MESSAGE);
    expect(messageForLoginFailure('network')).toBe(LOGIN_FORM_NETWORK_FAILURE_MESSAGE);
    for (const message of [
      LOGIN_FORM_FAILURE_MESSAGE,
      LOGIN_FORM_ORIGIN_FAILURE_MESSAGE,
      LOGIN_FORM_NETWORK_FAILURE_MESSAGE,
    ]) {
      expect(message).not.toMatch(
        /LOGIN_AUTH_REQUIRED|session_id|token_sha256|www_session|cookie|user_id|option_id|option_text|option_index/i,
      );
    }
  });

  it('does not submit empty credential proof', async () => {
    const { submitProductionLoginCredential } = await loadLoginPageModule();
    const fetchImpl = vi.fn();

    await expect(
      submitProductionLoginCredential({ credential: '   ', fetchImpl }),
    ).resolves.toEqual({ ok: false, reason: 'missing' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('links login page copy to /registration and guest header signup to /registration', async () => {
    const html = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const layout = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const copy = await readFile(
      join(process.cwd(), 'public/frontend/auth-state-copy.js'),
      'utf8',
    );

    expect(html).toContain('href="/registration"');
    expect(html).toContain('註冊不會自動登入');
    expect(layout).toContain("chip.href = '/login'");
    expect(layout).toContain("login.href = '/login'");
    expect(layout).toContain("signup.href = '/registration'");
    expect(layout).toContain('AUTH_STATE_COPY.guestPrimaryCta');
    expect(copy).toContain('guestPrimaryCta: PUBLIC_CTA_REGISTER_LABEL');
    expect(layout).not.toContain('#login-mock');
  });
});
