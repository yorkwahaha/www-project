import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_102_FILES = [
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/public-mvp-layout.js',
];

const FORBIDDEN_COPY =
  /你符合資格|你不符合資格|\buser_id\b|session_id|token_sha256|www_session|\bcookie\b|option_id|option_index|option_text|eligibility detail|vote_token|shard_id|X-User-Id|creator_session/i;

describe('Phase 102 profile completion prompt copy guard', () => {
  for (const relativePath of PHASE_102_FILES) {
    it(`keeps forbidden eligibility/session/option copy out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }

  it('keeps prompt runtime on login-state then profile API only', async () => {
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );

    expect(promptSource).toContain('/users/me/profile');
    expect(promptSource).toContain("credentials: 'same-origin'");
    expect(promptSource).toContain('birth_year_month');
    expect(promptSource).toContain('residential_region');
    expect(promptSource).toContain('部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區');
    expect(promptSource).toContain('不代表你一定符合或不符合任何投票資格');
    expect(promptSource).toContain('/profile');
    expect(promptSource).not.toMatch(
      /\/login\/session|\/registration|\/vote|reference-answer|display_name/i,
    );

    expect(layoutSource).toContain('mountProfileCompletionPrompt');
    expect(layoutSource).toContain('shouldReadLoginState');
    expect(layoutSource).toContain('./profile-completion-prompt.js');

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).not.toContain('profile-completion-prompt.js');
  });
});
