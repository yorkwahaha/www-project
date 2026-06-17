import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadAuthStateCopyModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/auth-state-copy.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 94 registration/login navigation polish', () => {
  it('routes guest header registration CTA to /registration and login CTA to /login', async () => {
    const layout = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const { AUTH_STATE_COPY } = await loadAuthStateCopyModule();

    expect(AUTH_STATE_COPY.guestPrimaryCta).toBe('註冊');
    expect(AUTH_STATE_COPY.guestSecondaryCta).toBe('登入');
    expect(layout).toContain("signup.href = '/registration'");
    expect(layout).toContain("login.href = '/login'");
    expect(layout).toContain("registrationLink.href = '/registration'");
    expect(layout).toContain('AUTH_STATE_COPY.bannerRegistrationLinkLabel');
  });

  it('explains registration vs login flow in shared banner copy', async () => {
    const { AUTH_STATE_COPY } = await loadAuthStateCopyModule();

    expect(AUTH_STATE_COPY.bannerGuestBody).toContain('註冊只建立帳號資料');
    expect(AUTH_STATE_COPY.bannerGuestBody).toContain('不會自動登入');
    expect(AUTH_STATE_COPY.bannerGuestBody).toContain('登入後才會在頁首顯示帳號名稱');
  });

  it('links login and registration pages to each other with clear flow copy', async () => {
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const homeHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    expect(loginHtml).toContain('href="/registration"');
    expect(loginHtml).toContain('註冊不會自動登入');
    expect(registrationHtml).toContain('href="/login"');
    expect(registrationHtml).toMatch(/不會.*自動登入/);
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(homeHtml).toContain('href="/registration"');
    expect(homeHtml).toContain('href="/login"');
    // Phase 301: the homepage keeps the register/login access links but its
    // long-form "不會自動登入" account copy moved to the login/registration pages.
  });

  it('keeps registration chrome from calling GET /users/me', async () => {
    const { shouldReadLoginState } = await loadLayoutModule();

    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );
  });
});
