import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_101_DOC =
  'docs/www-project-phase-101-profile-completion-prompt-plan-v1.md';

describe('Phase 101 profile completion prompt plan doc', () => {
  it('documents the future profile completion prompt plan and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_101_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 101');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('profile completion prompt');

    expect(source).toContain('Official Vote eligibility');
    expect(source).toContain('does not guarantee');
    expect(source).toContain('avoid revealing Official Vote eligibility determination details');

    expect(source).toContain('Homepage signed-in area');
    expect(source).toContain('/profile');
    expect(source).toContain('Future vote page pre-vote neutral zone');
    expect(source).toContain('/registration');
    expect(source).toContain('Do not show');
    expect(source).toContain('data-login-state-read="disabled"');

    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('prompt when value is `null`');
    expect(source).toContain('vote history');
    expect(source).toContain('option_id');

    expect(source).toContain('neutral, optional, and non-coercive');
    expect(source).toContain('出生年月與粗粒度居住地區');
    expect(source).toContain('不代表你一定符合或不符合');
    expect(source).toContain('你符合資格');
    expect(source).toContain('你不符合資格');

    expect(source).toContain('must not block homepage');
    expect(source).toContain('must not auto-redirect');
    expect(source).toContain('must not submit Official Vote');
    expect(source).toContain('must not recalculate or invalidate existing votes');
    expect(source).toContain('must not backfill historical eligibility');
    expect(source).toContain('vote-time evaluator');

    expect(source).toContain('GET /users/me` for `display_name` only');
    expect(source).toContain('small independent client module');
    expect(source).toContain('do not extend `GET /users/me`');

    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(readme).toContain('Phase 101');
    expect(readme).toContain(PHASE_101_DOC);
    expect(readme).toContain('Profile completion prompt plan');
  });
});
