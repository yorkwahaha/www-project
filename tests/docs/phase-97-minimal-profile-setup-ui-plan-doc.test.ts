import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_97_DOC =
  'docs/www-project-phase-97-minimal-profile-setup-ui-plan-v1.md';

describe('Phase 97 minimal profile setup UI plan doc', () => {
  it('documents the future profile setup UI plan and preserved auth/privacy invariants', async () => {
    const source = await readFile(join(process.cwd(), PHASE_97_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 97');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain('credentials: \'same-origin\'');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('YYYY-MM');
    expect(source).toContain('full replacement');
    expect(source).toContain('keys on every save/clear');
    expect(source).toContain('/login');
    expect(source).toContain('unauthenticated');

    expect(source).toContain('GET /users/me` shape remains unchanged');
    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('must not use `GET /users/me/profile`');

    expect(source).toContain('does not auto-submit a vote');
    expect(source).toContain('does not recalculate or invalidate existing votes');
    expect(source).toContain('does not backfill historical eligibility');
    expect(source).toContain('vote-time evaluator');

    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('creator_session` must not authorize');

    expect(source).toContain('must not display, log, or send to analytics');
    expect(source).toContain('`gender`');
    expect(source).toContain('exact birthday');
    expect(source).toContain('precise location');
    expect(source).toContain('demographic breakdowns');
    expect(source).toContain('ranking');
    expect(source).toContain('analytics linkage');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'No new logs, metrics, error payloads, APM traces, debug payloads, or analytics records may capture `option_id`',
    );

    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('UserAuthResolver');

    expect(readme).toContain('Phase 97');
    expect(readme).toContain(PHASE_97_DOC);
    expect(readme).toContain('Minimal profile setup UI plan');
  });
});
