import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_98_FILES = [
  'public/profile.html',
  'public/frontend/profile-page.js',
];

const FORBIDDEN_COPY =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|option_id|option_index|option_text|user_id|token_sha256|www_session|session_id|localStorage|sessionStorage|IndexedDB|X-User-Id|creator_session/i;

describe('Phase 98 profile setup copy guard', () => {
  for (const relativePath of PHASE_98_FILES) {
    it(`keeps forbidden profile/session/option fields out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }

  it('keeps profile runtime on session auth and profile API only', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const loginStateSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-read.js'),
      'utf8',
    );

    expect(source).toContain('/users/me/profile');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('readLoginState');
    expect(source).toContain('PROFILE_SAVED_MESSAGE');
    expect(source).not.toMatch(
      /\/login\/session|\/registration|\/vote|reference-answer|mountLoginStateRead|display_name/i,
    );

    expect(loginStateSource).toContain('/users/me');
    expect(loginStateSource).toContain('display_name');
    expect(loginStateSource).not.toMatch(/birth_year_month|residential_region/);
  });
});
