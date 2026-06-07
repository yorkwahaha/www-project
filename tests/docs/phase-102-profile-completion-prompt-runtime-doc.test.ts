import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_102_DOC =
  'docs/www-project-phase-102-profile-completion-prompt-runtime-v1.md';

describe('Phase 102 profile completion prompt runtime doc', () => {
  it('documents runtime behavior and preserved auth/privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_102_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 102');
    expect(source).toContain('Profile Completion Prompt Runtime');
    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('public-mvp-layout.js');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('/registration');
    expect(source).toContain('homepage (`/`) only');

    expect(source).toContain('GET /users/me` for `display_name` only');
    expect(source).toContain('does not block browsing');
    expect(source).toContain('auto-redirect');
    expect(source).toContain('auto-vote');

    expect(source).toContain('部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區');
    expect(source).toContain('不代表你一定符合或不符合任何投票資格');
    expect(source).toContain('你符合資格');
    expect(source).toContain('你不符合資格');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('UserAuthResolver');

    expect(readme).toContain('Phase 102');
    expect(readme).toContain(PHASE_102_DOC);
    expect(readme).toContain('Profile completion prompt runtime');
  });
});
