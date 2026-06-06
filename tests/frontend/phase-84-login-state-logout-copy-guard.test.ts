import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_84_FILES = [
  'public/frontend/login-state-ui.js',
  'public/frontend/login-state-logout.js',
];

const FORBIDDEN_COPY =
  /birth_year_month|residential_region|session_id|token_sha256|www_session|creator_session|\buser_id\b|vote history|option_id|option_index|option_text|\btrust\b|localStorage|sessionStorage/i;

describe('Phase 84 login state logout frontend copy guard', () => {
  for (const relativePath of PHASE_84_FILES) {
    it(`keeps sensitive fields out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }

  it('uses credentials same-origin for DELETE /login/session', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/login-state-logout.js'),
      'utf8',
    );
    expect(source).toContain("fetchImpl('/login/session'");
    expect(source).toContain("method: 'DELETE'");
    expect(source).toContain("credentials: 'same-origin'");
  });
});
