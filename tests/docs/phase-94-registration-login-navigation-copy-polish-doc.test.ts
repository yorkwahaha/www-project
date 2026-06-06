import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_94_DOC =
  'docs/www-project-phase-94-registration-login-navigation-copy-polish-v1.md';

describe('Phase 94 registration/login navigation copy polish doc', () => {
  it('documents navigation polish and preserved auth/privacy invariants', async () => {
    const source = await readFile(join(process.cwd(), PHASE_94_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 94');
    expect(source).toContain('registration does not log the user in');
    expect(source).toContain('/registration');
    expect(source).toContain('/login');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('does not call `GET /users/me`');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('creator_session');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(readme).toContain('Phase 94');
    expect(readme).toContain(PHASE_94_DOC);
    expect(readme).toContain('Registration/login navigation');
  });
});
