import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_84_DOC =
  'docs/www-project-phase-84-frontend-logout-ui-hook-v1.md';

describe('Phase 84 frontend logout UI hook doc', () => {
  it('documents the logout hook, UI boundaries, and preserved auth invariants', async () => {
    const source = await readFile(join(process.cwd(), PHASE_84_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 84');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('credentials: \'same-origin\'');
    expect(source).toContain('display_name');
    expect(source).toContain('login-state-logout.js');
    expect(source).toContain('No login form');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('creator_session');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(readme).toContain('Phase 84');
    expect(readme).toContain(PHASE_84_DOC);
    expect(readme).toContain('DELETE /login/session');
  });
});
