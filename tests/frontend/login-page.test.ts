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
  it('documents production fail-closed and local demo test identity on the static page', async () => {
    const html = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(html).toContain('正式登入尚未啟用');
    expect(html).toContain('fail closed');
    expect(html).toContain('AUTH_REQUIRED');
    expect(html).toContain('X-User-Id');
    expect(html).toContain('creator_session');
    expect(html).toContain('/creator/*');
    expect(html).toContain('Reference Answer');
    expect(html).toContain('login-shell-form');
    expect(html).toContain('disabled');
    expect(html).not.toMatch(/localStorage|sessionStorage|IndexedDB/i);
    expect(html).not.toMatch(
      /gender|性別|address|地址|GPS|geocode|precise location|精準位置|option_id|option_text|option_index/i,
    );
  });

  it('blocks login form submit without calling fetch', async () => {
    const { wireLoginShellForm, LOGIN_SHELL_SUBMIT_BLOCKED_MESSAGE } =
      await loadLoginPageModule();
    const form = {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'submit') {
          form._submit = handler;
        }
      }),
      querySelectorAll: () => [],
    };
    const announce = vi.fn();

    wireLoginShellForm(form, announce);
    const event = { preventDefault: vi.fn() };
    form._submit(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith(form, LOGIN_SHELL_SUBMIT_BLOCKED_MESSAGE);
  });

  it('points guest header auth actions to /login', async () => {
    const layout = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );

    expect(layout).toContain("login.href = '/login'");
    expect(layout).toContain("signup.href = '/login'");
    expect(layout).not.toContain('#login-mock');
  });
});
