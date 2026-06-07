import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_98_DOC =
  'docs/www-project-phase-98-minimal-profile-setup-ui-runtime-v1.md';

describe('Phase 98 minimal profile setup UI runtime doc', () => {
  it('documents runtime behavior and preserved auth/privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_98_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 98');
    expect(source).toContain('Minimal Profile Setup UI Runtime');
    expect(source).toContain('GET /profile');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('YYYY-MM');
    expect(source).toContain('full replacement');
    expect(source).toContain('/login');
    expect(source).toContain('unauthenticated');
    expect(source).toContain('does not auto-submit votes');

    expect(source).toContain('GET /users/me` shape remains');
    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('must not call `GET /users/me/profile`');

    expect(source).toContain('gender');
    expect(source).toContain('exact birthday');
    expect(source).toContain('precise location');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('creator_session');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain(
      'No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id`',
    );

    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('UserAuthResolver');

    expect(readme).toContain('Phase 98');
    expect(readme).toContain(PHASE_98_DOC);
    expect(readme).toContain('Minimal profile setup UI runtime');
  });
});
