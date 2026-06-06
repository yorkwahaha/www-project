import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_95_DOC =
  'docs/www-project-phase-95-registration-login-full-flow-smoke-coverage-v1.md';

describe('Phase 95 registration/login full flow smoke coverage doc', () => {
  it('documents full-flow smoke coverage and preserved auth/privacy invariants', async () => {
    const source = await readFile(join(process.cwd(), PHASE_95_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 95');
    expect(source).toContain('registration does not auto-login');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('display_name');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('phase-95-registration-login-full-flow.test.ts');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('creator_session');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(readme).toContain('Phase 95');
    expect(readme).toContain(PHASE_95_DOC);
    expect(readme).toContain('Registration/login full flow smoke coverage');
  });
});
