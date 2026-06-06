import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_75_FILES = [
  'public/frontend/auth-state-copy.js',
  'public/frontend/public-mvp-layout.js',
  'public/index.html',
  'public/profile.html',
  'public/vote.html',
  'public/my-polls.html',
];

const FORBIDDEN_COPY =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|地址|GPS|geocode|precise location|精準位置|option_id|option_index|option_text|localStorage|sessionStorage|IndexedDB/i;

async function loadAuthStateCopyModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/auth-state-copy.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 75 auth state navigation copy guard', () => {
  for (const relativePath of PHASE_75_FILES) {
    it(`keeps forbidden auth/privacy fields out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }

  it('documents the three-way auth identity split in shared copy', async () => {
    const { AUTH_STATE_COPY } = await loadAuthStateCopyModule();

    expect(AUTH_STATE_COPY.guestChipLabel).toContain('正式登入尚未啟用');
    expect(AUTH_STATE_COPY.demoIdentityChipLabel).toMatch(/MVP/);
    expect(AUTH_STATE_COPY.bannerLocalDemoBody).toContain('X-User-Id');
    expect(AUTH_STATE_COPY.bannerLocalDemoBody).toContain('creator_session');
    expect(AUTH_STATE_COPY.bannerGuestBody).toMatch(/fail closed/i);
  });

  it('routes guest header actions to /login with consistent labels', async () => {
    const layout = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const { AUTH_STATE_COPY } = await loadAuthStateCopyModule();

    expect(layout).toContain("chip.href = '/login'");
    expect(layout).toContain('AUTH_STATE_COPY.guestPrimaryCta');
    expect(AUTH_STATE_COPY.guestPrimaryCta).toBe('了解登入狀態');
    expect(layout).not.toContain('#login-mock');
    expect(layout).not.toContain('註冊 / 開始使用');
  });
});
