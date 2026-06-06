import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_86_FILES = [
  'public/login.html',
  'public/frontend/login-page.js',
];

const FORBIDDEN_COPY =
  /birth_year_month|residential_region|session_id|token_sha256|\buser_id\b|vote history|option_id|option_index|option_text|trust_level|user_role|account_role|localStorage|sessionStorage|IndexedDB/i;

describe('Phase 86 login form frontend copy guard', () => {
  for (const relativePath of PHASE_86_FILES) {
    it(`keeps sensitive fields and durable browser storage out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }

  it('uses existing login/session endpoints with same-origin credentials', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );

    expect(source).toContain("fetchImpl('/login/session'");
    expect(source).toContain("method: 'POST'");
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('mountLoginStateRead');
    expect(source).toContain('GET /users/me');
    expect(source).not.toContain('DELETE /login/session');
  });
});
