import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_83_FILES = ['public/frontend/login-state-read.js'];

const FORBIDDEN_COPY =
  /birth_year_month|residential_region|session_id|token_sha256|www_session|creator_session|\buser_id\b|vote history|option_id|option_index|option_text|\btrust\b|localStorage|sessionStorage|\blogout\b/i;

describe('Phase 83 login state frontend copy guard', () => {
  for (const relativePath of PHASE_83_FILES) {
    it(`keeps sensitive fields out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }

  it('uses credentials same-origin for GET /users/me', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/login-state-read.js'),
      'utf8',
    );
    expect(source).toContain("fetchImpl('/users/me'");
    expect(source).toContain("credentials: 'same-origin'");
  });
});
