import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_86_DOC =
  'docs/www-project-phase-86-minimal-production-login-form-runtime-v1.md';

describe('Phase 86 minimal production login form runtime doc', () => {
  it('documents the login form runtime and preserved privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_86_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 86');
    expect(source).toContain('minimal frontend runtime');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('display_name');
    expect(source).toContain('credential-proof field');
    expect(source).toContain('accessible live region');

    expect(source).toContain('must not ask for, display, log, store, or send to analytics');
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

    expect(readme).toContain('Phase 86');
    expect(readme).toContain(PHASE_86_DOC);
    expect(readme).toContain('Minimal production login form runtime');
  });
});
