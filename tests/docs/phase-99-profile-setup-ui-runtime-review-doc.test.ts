import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_99_DOC =
  'docs/www-project-phase-99-profile-setup-ui-runtime-review-v1.md';

describe('Phase 99 profile setup UI runtime review doc', () => {
  it('documents the profile UI review, hardening, and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_99_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 99');
    expect(source).toContain('Profile Setup UI Runtime Review');
    expect(source).toContain('No runtime, API, or schema behavior changed');
    expect(source).toContain('GET /profile');
    expect(source).toContain('public/frontend/profile-page.js');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('YYYY-MM');
    expect(source).toContain('unauthenticated');
    expect(source).toContain('wireProfileForm');
    expect(source).toContain('does not call');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');

    expect(source).toContain('GET /users/me` shape remains');
    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('does not call `GET /users/me/profile`');

    expect(source).toContain('gender');
    expect(source).toContain('exact birthday');
    expect(source).toContain('precise location');
    expect(source).toContain('eligibility recalculation');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('creator_session');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id`',
    );

    expect(readme).toContain('Phase 99');
    expect(readme).toContain(PHASE_99_DOC);
    expect(readme).toContain('Profile setup UI runtime review');
  });
});
