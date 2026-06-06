import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_85_DOC =
  'docs/www-project-phase-85-production-login-ui-plan-v1.md';

describe('Phase 85 production login UI plan doc', () => {
  it('documents the future login UI plan and preserved auth/privacy invariants', async () => {
    const source = await readFile(join(process.cwd(), PHASE_85_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 85');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('credentials: \'same-origin\'');
    expect(source).toContain('display_name');
    expect(source).toContain('Ignore `user_id` for UI display');
    expect(source).toContain('Origin');
    expect(source).toContain('CSRF');
    expect(source).toContain('Production vs Local/Demo/Test Separation');
    expect(source).toContain('creator_session');
    expect(source).toContain('Accessibility and Mobile Requirements');

    expect(source).toContain('must not display, log, or send to analytics');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('token_sha256');
    expect(source).toContain('raw `www_session` cookie value');
    expect(source).toContain('vote history');
    expect(source).toContain('option ID');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer auth boundary');
    expect(source).toContain('profile eligibility behavior');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(readme).toContain('Phase 85');
    expect(readme).toContain(PHASE_85_DOC);
    expect(readme).toContain('minimal production login form UX');
  });
});
