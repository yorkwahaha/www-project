import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const LOGIN_SHELL_FILES = [
  'public/login.html',
  'public/frontend/login-page.js',
];

const FORBIDDEN_COPY =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|地址|GPS|geocode|precise location|精準位置|option_id|option_index|option_text|localStorage|sessionStorage|IndexedDB/i;

describe('Phase 74 login shell copy guard', () => {
  for (const relativePath of LOGIN_SHELL_FILES) {
    it(`keeps forbidden auth/privacy fields out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }

  it('documents fail-closed production auth and local demo identity split in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(readme).toContain('Phase 74');
    expect(readme).toContain('/login');
    expect(readme).toMatch(/正式登入尚未啟用|login UI shell/i);
    expect(readme).toContain('UserAuthResolver');
    expect(readme).toContain('creator_session');
  });
});
